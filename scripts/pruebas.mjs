// Pruebas automáticas del sistema de reuniones (sin red ni Netlify): node scripts/pruebas.mjs
// Usa un almacén en memoria y simula Microsoft Graph. No contiene credenciales reales.
import crypto from 'node:crypto';
import assert from 'node:assert/strict';

const mem = new Map();
globalThis.__ODLC_TEST_STORE = {
  async get(k, o) { const v = mem.get(k); return v === undefined ? null : o && o.type === 'json' ? JSON.parse(v) : v; },
  async setJSON(k, v) { mem.set(k, JSON.stringify(v)); return { modified: true }; },
  async delete(k) { mem.delete(k); },
  async list({ prefix }) { return { blobs: [...mem.keys()].filter((k) => k.startsWith(prefix)).map((key) => ({ key })) }; },
};

const { hashPassword } = await import('../netlify/lib/auth.mjs');
const TEST_PASS = 'prueba-' + crypto.randomBytes(6).toString('hex');
Object.assign(process.env, {
  ODLC_ADMIN_PASSWORD_HASH: hashPassword(TEST_PASS),
  ODLC_SESSION_SECRET: crypto.randomBytes(40).toString('hex'),
});

const api = (await import('../netlify/functions/api.mjs')).default;
const panel = (await import('../netlify/functions/panel.mjs')).default;
const inv = (await import('../netlify/functions/invitacion.mjs')).default;
const M = await import('../netlify/lib/meeting.mjs');

const BASE = 'https://odlc.es';
let ok = 0;
const t = async (name, fn) => { try { await fn(); ok++; console.log('✔', name); } catch (e) { console.error('✘', name, '\n  ', e.message); process.exitCode = 1; } };
const req = (path, { method = 'GET', body, cookie, origin = BASE } = {}) => new Request(BASE + path, {
  method, body: body ? JSON.stringify(body) : undefined,
  headers: { ...(body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...(method !== 'GET' && origin ? { origin } : {}) },
});
const ctx = (params = {}) => ({ ip: '203.0.113.7', params });

// ---------- Zona horaria ----------
await t('Invierno: 10/11/2026 11:00 Madrid = 10:00 UTC', () => assert.equal(new Date(M.madridToUtc('2026-11-10', '11:00')).toISOString(), '2026-11-10T10:00:00.000Z'));
await t('Verano: 15/07/2027 11:00 Madrid = 09:00 UTC', () => assert.equal(new Date(M.madridToUtc('2027-07-15', '11:00')).toISOString(), '2027-07-15T09:00:00.000Z'));
await t('Cambio de marzo: 28/03/2027 02:30 no existe', () => assert.equal(M.madridToUtc('2027-03-28', '02:30'), null));
await t('Día del cambio de marzo: 03:00 = 01:00 UTC', () => assert.equal(new Date(M.madridToUtc('2027-03-28', '03:00')).toISOString(), '2027-03-28T01:00:00.000Z'));
await t('Cambio de octubre: 31/10/2027 12:00 = 11:00 UTC', () => assert.equal(new Date(M.madridToUtc('2027-10-31', '12:00')).toISOString(), '2027-10-31T11:00:00.000Z'));
await t('Fecha en español', () => assert.equal(M.fechaLarga(M.madridToUtc('2026-11-10', '11:00')), 'Martes, 10 de noviembre de 2026'));
await t('Enlaces de Teams', () => {
  assert.ok(M.isTeamsUrl('https://teams.microsoft.com/l/meetup-join/19%3ameeting_abc%40thread.v2/0?context=%7b%7d'));
  assert.ok(M.isTeamsUrl('https://teams.microsoft.com/meet/2345678901234?p=abcdef'));
  assert.ok(!M.isTeamsUrl('http://teams.microsoft.com/l/x'));
  assert.ok(!M.isTeamsUrl('https://teams.microsoft.com.evil.example/l/x'));
  assert.ok(!M.isTeamsUrl('javascript:alert(1)'));
});

// ---------- Acceso ----------
await t('Panel sin sesión muestra solo el acceso', async () => {
  const r = await panel(req('/reuniones'));
  const h = await r.text();
  assert.ok(h.includes('id="login"') && !h.includes('id="meeting"'));
});
await t('API sin sesión: 401', async () => assert.equal((await api(req('/api/reuniones'), ctx())).status, 401));
await t('Contraseña incorrecta: 401', async () => assert.equal((await api(req('/api/login', { method: 'POST', body: { email: 'isabel@odlc.es', password: 'mal' } }), ctx())).status, 401));
await t('Acceso desde otro origen: 403', async () => assert.equal((await api(req('/api/login', { method: 'POST', body: { email: 'isabel@odlc.es', password: TEST_PASS }, origin: 'https://evil.example' }), ctx())).status, 403));
let cookie;
await t('Acceso correcto: cookie HttpOnly, Secure, SameSite=Strict', async () => {
  const r = await api(req('/api/login', { method: 'POST', body: { email: 'Isabel@ODLC.es ', password: TEST_PASS } }), ctx());
  assert.equal(r.status, 200);
  const sc = r.headers.get('set-cookie');
  assert.match(sc, /HttpOnly/); assert.match(sc, /Secure/); assert.match(sc, /SameSite=Strict/);
  cookie = sc.split(';')[0];
});
await t('Cookie manipulada: rechazada', async () => {
  const bad = cookie.replace(/.$/, (c) => (c === 'A' ? 'B' : 'A'));
  assert.equal((await api(req('/api/reuniones', { cookie: bad }), ctx())).status, 401);
});
await t('Panel con sesión muestra el formulario', async () => assert.ok((await (await panel(req('/reuniones', { cookie }))).text()).includes('id="meeting"')));
await t('Bloqueo tras 5 intentos fallidos', async () => {
  const c = { ip: '198.51.100.9', params: {} };
  let last;
  for (let i = 0; i < 6; i++) last = await api(req('/api/login', { method: 'POST', body: { email: 'isabel@odlc.es', password: 'x' + i } }), c);
  assert.equal(last.status, 429);
  const good = await api(req('/api/login', { method: 'POST', body: { email: 'isabel@odlc.es', password: TEST_PASS } }), c);
  assert.equal(good.status, 429);
});

// ---------- Reuniones (modo manual) ----------
const TEAMS = 'https://teams.microsoft.com/l/meetup-join/19%3ameeting_TEST%40thread.v2/0?context=%7b%22Tid%22%3a%22x%22%7d';
await t('Validación: sin enlace de Teams en modo manual', async () => {
  const r = await api(req('/api/reuniones', { method: 'POST', cookie, body: { mode: 'manual', subject: 'X', date: '2026-11-10', time: '11:00', duration: 60 } }), ctx());
  assert.equal(r.status, 422); assert.ok((await r.json()).fields.teamsUrl);
});
await t('Validación: duración no permitida', async () => {
  const r = await api(req('/api/reuniones', { method: 'POST', cookie, body: { mode: 'manual', subject: 'X', date: '2026-11-10', time: '11:00', duration: 20, teamsUrl: TEAMS } }), ctx());
  assert.equal(r.status, 422);
});
let meeting;
await t('Crear reunión manual', async () => {
  const r = await api(req('/api/reuniones', { method: 'POST', cookie, body: { mode: 'manual', guestName: 'María', guestEmail: 'maria@example.com', guestPhone: '600 11 22 33', subject: 'Primera reunión', date: '2026-11-10', time: '11:00', duration: 60, teamsUrl: TEAMS, description: 'Revisión de la estructura societaria.', notes: 'Nota privada' } }), ctx());
  assert.equal(r.status, 201);
  meeting = (await r.json()).meeting;
  assert.match(meeting.id, M.ID_RE);
  assert.equal(meeting.url, 'https://odlc.es/r/' + meeting.id);
});
await t('Mensaje de WhatsApp con los datos reales', () => {
  assert.equal(meeting.whatsappText, `Hola, María:\n\nTe envío la invitación para nuestra reunión con ODLC.\n\n📅 Martes, 10 de noviembre de 2026\n🕚 11:00 h (Madrid)\n💻 Microsoft Teams\n\nPuedes consultar la invitación, unirte a la reunión y añadirla a tu calendario aquí:\n\nhttps://odlc.es/r/${meeting.id}\n\nUn saludo,\n\nIsabel Olivares de la Cerda\nODLC`);
  assert.ok(meeting.whatsappLink.startsWith('https://wa.me/34600112233?text=Hola%2C%20Mar%C3%ADa%3A'));
});
await t('Los datos persisten y se listan', async () => {
  const d = await (await api(req('/api/reuniones', { cookie }), ctx())).json();
  assert.equal(d.meetings.length, 1); assert.equal(d.meetings[0].estado, 'proxima');
});

// ---------- Invitación pública ----------
let page;
await t('Invitación: datos, botón de Teams y metadatos Open Graph sin datos privados', async () => {
  const r = await inv(req('/r/' + meeting.id), ctx({ id: meeting.id }));
  page = await r.text();
  assert.equal(r.status, 200);
  for (const s of ['Invitación a reunión', 'Reunión con ODLC', 'Isabel Olivares de la Cerda', 'María', 'Martes, 10 de noviembre de 2026', '11:00 – 12:00 h', 'Madrid (UTC+1)', '60 minutos', 'Microsoft Teams · Reunión online', 'Unirse a la reunión', 'Añadir a mi calendario', 'logo-odlc-claro.svg', 'og:image']) assert.ok(page.includes(s), 'falta: ' + s);
  assert.ok(page.includes(TEAMS.replace(/&/g, '&amp;')));
  const og = page.match(/<meta property="og:[^>]+>/g).join(' ');
  assert.ok(!og.includes('María') && !og.includes('Primera reunión'), 'la vista previa no debe incluir datos de la reunión');
  assert.ok(!page.includes('maria@example.com') && !page.includes('600 11 22 33') && !page.includes('Nota privada'), 'datos privados visibles');
  assert.ok(!/cargo|jobTitle|Fundadora/i.test(page));
});
await t('Invitación: no permite modificar (POST → 405)', async () => assert.equal((await inv(req('/r/' + meeting.id, { method: 'POST', body: {} }), ctx({ id: meeting.id }))).status, 405));
await t('Invitación inexistente: 404', async () => assert.equal((await inv(req('/r/AAAAAAAAAAAAAAAAAAAAAA'), ctx({ id: 'AAAAAAAAAAAAAAAAAAAAAA' }))).status, 404));
await t('Invitación no da acceso al panel', () => assert.ok(!page.includes('/api/') && !page.includes('reuniones.js')));
await t('.ics válido con hora de Madrid y enlace de Teams', async () => {
  const r = await inv(req(`/r/${meeting.id}/calendario.ics`), ctx({ id: meeting.id }));
  const ics = await r.text();
  assert.match(r.headers.get('content-type'), /text\/calendar/);
  const unfolded = ics.replace(/\r\n /g, '');
  for (const s of ['BEGIN:VCALENDAR', 'BEGIN:VTIMEZONE', 'TZID:Europe/Madrid', `UID:${meeting.id}@odlc.es`, 'DTSTART;TZID=Europe/Madrid:20261110T110000', 'DTEND;TZID=Europe/Madrid:20261110T120000', 'SEQUENCE:0', 'STATUS:CONFIRMED', 'SUMMARY:Primera reunión', 'ORGANIZER;CN=Isabel Olivares de la Cerda:mailto:isabel@odlc.es', 'URL:' + TEAMS]) assert.ok(unfolded.includes(s), 'falta: ' + s);
  for (const line of ics.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75, 'línea larga: ' + line);
});
await t('Google Calendar recibe la hora UTC correcta', () => {
  const g = new URL(M.calendarLinks({ ...meeting }).google);
  assert.equal(g.searchParams.get('dates'), '20261110T100000Z/20261110T110000Z');
});

// ---------- Editar y cancelar ----------
await t('Editar: cambia la hora (verano → invierno) e incrementa SEQUENCE', async () => {
  const r = await api(req('/api/reuniones/' + meeting.id, { method: 'PUT', cookie, body: { ...meeting, time: '12:30', duration: 45 } }), ctx());
  assert.equal(r.status, 200);
  const ics = await (await inv(req(`/r/${meeting.id}/calendario.ics`), ctx({ id: meeting.id }))).text();
  assert.ok(ics.includes('DTSTART;TZID=Europe/Madrid:20261110T123000') && ics.includes('DTEND;TZID=Europe/Madrid:20261110T131500') && ics.includes('SEQUENCE:1'));
});
await t('Cancelar: estado cancelado, sin botón de unirse, .ics CANCELLED', async () => {
  const r = await api(req(`/api/reuniones/${meeting.id}/cancelar`, { method: 'POST', cookie, body: {} }), ctx());
  const d = await r.json();
  assert.equal(d.meeting.estado, 'cancelada'); assert.ok(d.cancelText.includes('queda cancelada'));
  const p = await (await inv(req('/r/' + meeting.id), ctx({ id: meeting.id }))).text();
  assert.ok(p.includes('Reunión cancelada') && !p.includes('Unirse a la reunión'));
  const ics = await (await inv(req(`/r/${meeting.id}/calendario.ics`), ctx({ id: meeting.id }))).text();
  assert.ok(ics.includes('STATUS:CANCELLED') && ics.includes('SEQUENCE:2'));
});

// ---------- Modo automático (Microsoft Graph simulado) ----------
await t('Sin claves de Microsoft: modo automático no disponible', async () => {
  const s = await (await api(req('/api/ms/estado', { cookie }), ctx())).json();
  assert.equal(s.configured, false);
  const r = await api(req('/api/reuniones', { method: 'POST', cookie, body: { mode: 'auto', subject: 'Auto', date: '2026-12-01', time: '10:00', duration: 30 } }), ctx());
  assert.equal(r.status, 502);
});
await t('Con Microsoft 365 conectado: crea evento con el enlace real que devuelve Graph', async () => {
  Object.assign(process.env, { MS_TENANT_ID: 'tenant', MS_CLIENT_ID: 'client', MS_CLIENT_SECRET: 'secret', ODLC_TOKEN_KEY: crypto.randomBytes(32).toString('base64') });
  const G = await import('../netlify/lib/graph.mjs');
  const calls = [];
  const realFetch = globalThis.fetch;
  globalThis.fetch = async (url, init = {}) => {
    calls.push([init.method || 'GET', String(url), init.body]);
    const u = String(url);
    const ok = (d) => new Response(JSON.stringify(d), { status: 200, headers: { 'content-type': 'application/json' } });
    if (u.endsWith('/token')) return ok({ access_token: 'AT', refresh_token: 'RT2' });
    if (u.includes('/me?')) return ok({ mail: 'isabel@odlc.es' });
    if (u.includes('/me/calendar?')) return ok({ allowedOnlineMeetingProviders: ['teamsForBusiness'] });
    if (u.endsWith('/me/events') && init.method === 'POST') return ok({ id: 'EV1', onlineMeeting: { joinUrl: 'https://teams.microsoft.com/l/meetup-join/REAL' } });
    if (u.includes('/me/events/EV1')) return new Response(null, { status: init.method === 'PATCH' ? 200 : 202 });
    return new Response('{}', { status: 404 });
  };
  try {
    const start = new URL(await G.authorizeUrl());
    assert.equal(start.searchParams.get('scope'), 'openid offline_access User.Read Calendars.ReadWrite');
    assert.equal(start.searchParams.get('code_challenge_method'), 'S256');
    const cb = await api(req(`/api/ms/callback?code=C&state=${start.searchParams.get('state')}`), ctx());
    assert.match(await cb.text(), /ms=ok/);
    assert.ok(!mem.get('ms/token').includes('RT2'), 'el token debe guardarse cifrado');
    const r = await api(req('/api/reuniones', { method: 'POST', cookie, body: { mode: 'auto', guestName: 'Juan', subject: 'Auto', date: '2026-12-01', time: '10:00', duration: 30 } }), ctx());
    const d = await r.json();
    assert.equal(r.status, 201, JSON.stringify(d));
    assert.equal(d.meeting.teamsUrl, 'https://teams.microsoft.com/l/meetup-join/REAL');
    const post = JSON.parse(calls.find((c) => c[1].endsWith('/me/events'))[2]);
    assert.equal(post.isOnlineMeeting, true); assert.equal(post.onlineMeetingProvider, 'teamsForBusiness');
    assert.deepEqual(post.start, { dateTime: '2026-12-01T10:00:00', timeZone: 'Europe/Madrid' });
    assert.equal(post.attendees, undefined);
    const c = await api(req(`/api/reuniones/${d.meeting.id}/cancelar`, { method: 'POST', cookie, body: {} }), ctx());
    assert.equal(c.status, 200);
    assert.ok(calls.some((x) => x[0] === 'POST' && x[1].endsWith('/me/events/EV1/cancel')));
    // Un «state» ya usado no sirve otra vez
    const again = await api(req(`/api/ms/callback?code=C&state=${start.searchParams.get('state')}`), ctx());
    assert.match(await again.text(), /ms=error/);
  } finally { globalThis.fetch = realFetch; }
});

console.log(`\n${ok} pruebas superadas${process.exitCode ? ', con fallos' : ''}.`);
