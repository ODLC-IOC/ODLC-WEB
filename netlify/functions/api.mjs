// /api/* — operaciones privadas del panel. Todas, salvo el acceso y la vuelta de Microsoft, exigen sesión.
import { json, html, esc, redirect, clientIp, sameOrigin } from '../lib/http.mjs';
import { ADMIN_EMAIL } from '../lib/config.mjs';
import { configured, isAuthenticated, login, sessionCookie, clearCookie } from '../lib/auth.mjs';
import { getJSON, setJSON, listMeetings } from '../lib/store.mjs';
import { ID_RE, newId, validateInput, adminView, fechaLarga, horaCorta, inviteUrl } from '../lib/meeting.mjs';
import * as ms from '../lib/graph.mjs';

const notAuth = () => json({ error: 'No autorizado' }, 401);

export default async (req, context) => {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api/, '').replace(/\/$/, '') || '/';
  const method = req.method;

  try {
    // ----- Acceso -----
    if (path === '/login' && method === 'POST') {
      if (configured().length) return json({ error: 'El acceso no está configurado en el servidor.' }, 503);
      if (!sameOrigin(req)) return json({ error: 'Origen no permitido' }, 403);
      const body = await req.json().catch(() => ({}));
      const r = await login(body.email, body.password, clientIp(req, context));
      if (r.ok) return json({ ok: true }, 200, { 'Set-Cookie': sessionCookie() });
      return json({ error: r.locked ? 'Demasiados intentos. Espera 15 minutos.' : 'Correo o contraseña incorrectos.' }, r.locked ? 429 : 401);
    }
    if (path === '/logout' && method === 'POST') return json({ ok: true }, 200, { 'Set-Cookie': clearCookie() });

    // Vuelta desde Microsoft: la sesión (cookie SameSite=Strict) no viaja en esta redirección entre sitios,
    // así que la protección es el «state» de un solo uso generado tras iniciar sesión + PKCE + cuenta permitida.
    if (path === '/ms/callback' && method === 'GET') {
      // Se responde con una página que navega de nuevo dentro de odlc.es, para que el navegador
      // vuelva a enviar la cookie de sesión (no la envía tras una redirección desde otro sitio).
      let target = '/reuniones?ms=ok';
      try {
        await ms.handleCallback(url);
      } catch (e) {
        target = '/reuniones?ms=error&detalle=' + encodeURIComponent(e.message.slice(0, 250));
      }
      return html(`<!doctype html><meta charset="utf-8"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0;url=${esc(target)}"><title>OdlC</title><p style="font-family:sans-serif">Volviendo al panel… <a href="${esc(target)}">Continuar</a></p>`);
    }

    if (!isAuthenticated(req)) return notAuth();
    if (method !== 'GET' && !sameOrigin(req)) return json({ error: 'Origen no permitido' }, 403);

    if (path === '/session') return json({ ok: true, user: ADMIN_EMAIL() });

    // ----- Microsoft 365 -----
    if (path === '/ms/estado' && method === 'GET') return json({ ...(await ms.status()), adminEmail: ADMIN_EMAIL() });
    if (path === '/ms/conectar' && method === 'GET') {
      if (ms.msConfigured().length) return redirect('/reuniones?ms=error&detalle=' + encodeURIComponent('Faltan las claves de Microsoft Entra ID en Netlify.'));
      return redirect(await ms.authorizeUrl());
    }
    if (path === '/ms/desconectar' && method === 'POST') { await ms.disconnect(); return json({ ok: true }); }

    // ----- Reuniones -----
    if (path === '/reuniones' && method === 'GET') {
      const items = (await listMeetings()).sort((a, b) => a.startUtc - b.startUtc).map(adminView);
      return json({ meetings: items });
    }

    if (path === '/reuniones' && method === 'POST') {
      const body = await req.json().catch(() => ({}));
      const mode = body.mode === 'auto' ? 'auto' : 'manual';
      const v = validateInput(body, { requireTeams: mode === 'manual' });
      if (v.errors) return json({ error: 'Revisa los campos marcados.', fields: v.errors }, 422);
      if (mode === 'auto' && body.sendInvite && !v.data.guestEmail) return json({ error: 'Falta el correo del invitado.', fields: { guestEmail: 'Escribe el correo para enviar la convocatoria.' } }, 422);
      const now = Date.now();
      const id = newId();
      const m = {
        ...v.data, id, uid: `${id}@odlc.es`, mode, tz: 'Europe/Madrid', status: 'programada', sequence: 0,
        createdAt: now, updatedAt: now, sendInvite: mode === 'auto' && !!body.sendInvite,
      };
      if (mode === 'auto') {
        const ev = await ms.createTeamsEvent(m, m.sendInvite);
        m.teamsUrl = ev.joinUrl; m.graphEventId = ev.eventId; m.outlookLink = ev.webLink;
      }
      await setJSON(`m/${id}`, m);
      return json({ meeting: adminView(m) }, 201);
    }

    const mm = path.match(/^\/reuniones\/([A-Za-z0-9_-]+)(\/cancelar)?$/);
    if (mm && ID_RE.test(mm[1])) {
      const key = `m/${mm[1]}`;
      const m = await getJSON(key);
      if (!m) return json({ error: 'Reunión no encontrada' }, 404);

      if (!mm[2] && method === 'PUT') {
        if (m.status === 'cancelada') return json({ error: 'La reunión está cancelada.' }, 409);
        const body = await req.json().catch(() => ({}));
        const v = validateInput({ ...body, teamsUrl: m.mode === 'auto' ? m.teamsUrl : body.teamsUrl }, { requireTeams: true, allowPast: true });
        if (v.errors) return json({ error: 'Revisa los campos marcados.', fields: v.errors }, 422);
        const changedTime = v.data.startUtc !== m.startUtc || v.data.endUtc !== m.endUtc;
        const next = { ...m, ...v.data, updatedAt: Date.now(), sequence: (m.sequence || 0) + 1 };
        if (m.mode === 'auto') {
          next.sendInvite = !!body.sendInvite || m.sendInvite;
          await ms.updateTeamsEvent(next, next.sendInvite);
        }
        await setJSON(key, next);
        return json({ meeting: adminView(next), changedTime });
      }

      if (mm[2] && method === 'POST') {
        if (m.status === 'cancelada') return json({ meeting: adminView(m) });
        if (m.mode === 'auto' && m.graphEventId) await ms.cancelTeamsEvent(m);
        const next = { ...m, status: 'cancelada', updatedAt: Date.now(), cancelledAt: Date.now(), sequence: (m.sequence || 0) + 1 };
        await setJSON(key, next);
        const saludo = next.guestName ? `Hola, ${next.guestName}:` : 'Hola:';
        const cancelText = [saludo, '', `Te escribo para avisarte de que la reunión con OdlC prevista para el ${fechaLarga(next.startUtc).toLowerCase()} a las ${horaCorta(next.startUtc)} h (Madrid) queda cancelada.`, '',
          'Si la habías añadido a tu calendario, puedes actualizarla aquí:', inviteUrl(next), '', 'Un saludo,', '', 'Isabel Olivares de la Cerda', 'OdlC'].join('\n');
        return json({ meeting: adminView(next), cancelText });
      }
    }

    return json({ error: 'No encontrado' }, 404);
  } catch (e) {
    if (e instanceof ms.GraphError) return json({ error: e.message }, 502);
    console.error(e);
    return json({ error: 'Error del servidor. Inténtalo de nuevo.' }, 500);
  }
};

export const config = { path: '/api/*' };
