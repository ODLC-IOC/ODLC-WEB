// Integración con Microsoft 365 (Outlook + Teams) mediante Microsoft Graph.
// Flujo OAuth 2.0 «authorization code» con PKCE para aplicación web confidencial.
// Permisos delegados mínimos: openid, offline_access, User.Read, Calendars.ReadWrite.
// El token de actualización se guarda cifrado (AES-256-GCM) en Netlify Blobs; nunca llega al navegador.
import crypto from 'node:crypto';
import { env, ADMIN_EMAIL, SITE_URL, ODLC } from './config.mjs';
import { getJSON, setJSON, del } from './store.mjs';

const SCOPES = 'openid offline_access User.Read Calendars.ReadWrite';
const GRAPH = 'https://graph.microsoft.com/v1.0';
const TOKEN_KEY = 'ms/token';

export function msConfigured() {
  const missing = ['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET', 'ODLC_TOKEN_KEY'].filter((k) => !env(k));
  if (env('ODLC_TOKEN_KEY') && Buffer.from(env('ODLC_TOKEN_KEY'), 'base64').length !== 32) missing.push('ODLC_TOKEN_KEY (32 bytes en base64)');
  return missing;
}

const authority = () => `https://login.microsoftonline.com/${encodeURIComponent(env('MS_TENANT_ID'))}/oauth2/v2.0`;
const redirectUri = () => env('MS_REDIRECT_URI', `${SITE_URL()}/api/ms/callback`);

// ---------- Cifrado del token ----------
function key() { return Buffer.from(env('ODLC_TOKEN_KEY'), 'base64'); }
function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
  const enc = Buffer.concat([c.update(text, 'utf8'), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}
function decrypt(blob) {
  const [iv, tag, enc] = blob.split('.').map((s) => Buffer.from(s, 'base64'));
  const d = crypto.createDecipheriv('aes-256-gcm', key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString('utf8');
}

// ---------- Autorización ----------
export async function authorizeUrl() {
  const state = crypto.randomBytes(24).toString('base64url');
  const verifier = crypto.randomBytes(48).toString('base64url');
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url');
  await setJSON(`ms/state/${state}`, { verifier, exp: Date.now() + 10 * 60e3 });
  const q = new URLSearchParams({
    client_id: env('MS_CLIENT_ID'), response_type: 'code', redirect_uri: redirectUri(), response_mode: 'query',
    scope: SCOPES, state, code_challenge: challenge, code_challenge_method: 'S256', login_hint: ADMIN_EMAIL(), prompt: 'select_account',
  });
  return `${authority()}/authorize?${q}`;
}

async function tokenRequest(params) {
  const res = await fetch(`${authority()}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: env('MS_CLIENT_ID'), client_secret: env('MS_CLIENT_SECRET'), scope: SCOPES, ...params }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new GraphError(data.error_description || data.error || `Error ${res.status} al obtener el token`, res.status);
  return data;
}

export class GraphError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}

export async function handleCallback(url) {
  const state = url.searchParams.get('state');
  const code = url.searchParams.get('code');
  if (url.searchParams.get('error')) throw new GraphError(url.searchParams.get('error_description') || url.searchParams.get('error'));
  if (!state || !code) throw new GraphError('Respuesta de Microsoft incompleta.');
  const pending = await getJSON(`ms/state/${state}`);
  await del(`ms/state/${state}`);
  if (!pending || pending.exp < Date.now()) throw new GraphError('La autorización ha caducado. Vuelve a intentarlo.');
  const tok = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: redirectUri(), code_verifier: pending.verifier });
  const me = await graph('/me?$select=displayName,mail,userPrincipalName', {}, tok.access_token);
  const account = String(me.mail || me.userPrincipalName || '').toLowerCase();
  if (account !== ADMIN_EMAIL()) throw new GraphError(`La cuenta ${account} no está autorizada. Entra con ${ADMIN_EMAIL()}.`);
  // Comprobación previa: el calendario admite reuniones de Teams
  const cal = await graph('/me/calendar?$select=allowedOnlineMeetingProviders,defaultOnlineMeetingProvider', {}, tok.access_token);
  const providers = cal.allowedOnlineMeetingProviders || [];
  await setJSON(TOKEN_KEY, {
    refresh: encrypt(tok.refresh_token), account, name: me.displayName || '', providers,
    teams: providers.includes('teamsForBusiness'), connectedAt: Date.now(),
  });
  return { account, teams: providers.includes('teamsForBusiness'), providers };
}

export async function status() {
  const missing = msConfigured();
  if (missing.length) return { configured: false, missing };
  const t = await getJSON(TOKEN_KEY);
  if (!t) return { configured: true, connected: false };
  return { configured: true, connected: true, account: t.account, teams: t.teams, providers: t.providers, connectedAt: t.connectedAt };
}

export async function disconnect() { await del(TOKEN_KEY); }

async function accessToken() {
  if (msConfigured().length) throw new GraphError('La integración con Microsoft 365 no está configurada.');
  const t = await getJSON(TOKEN_KEY);
  if (!t) throw new GraphError('Microsoft 365 no está conectado. Conéctalo desde el panel.');
  let tok;
  try {
    tok = await tokenRequest({ grant_type: 'refresh_token', refresh_token: decrypt(t.refresh) });
  } catch (e) {
    if (e.status === 400) await del(TOKEN_KEY); // token revocado o caducado: hay que volver a conectar
    throw new GraphError('La conexión con Microsoft 365 ha caducado. Vuelve a conectarla desde el panel.');
  }
  if (tok.refresh_token) await setJSON(TOKEN_KEY, { ...t, refresh: encrypt(tok.refresh_token) });
  return tok.access_token;
}

async function graph(path, init = {}, token) {
  const res = await fetch(GRAPH + path, {
    ...init,
    headers: { Authorization: `Bearer ${token || (await accessToken())}`, 'Content-Type': 'application/json', Prefer: `outlook.timezone="${ODLC.tz}"`, ...(init.headers || {}) },
  });
  if (res.status === 204 || res.status === 202) return {};
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new GraphError((data.error && data.error.message) || `Microsoft Graph respondió ${res.status}`, res.status);
  return data;
}

// ---------- Eventos ----------
function eventBody(m, sendInvite) {
  const local = (ms) => {
    const p = new Intl.DateTimeFormat('en-CA', { timeZone: ODLC.tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(ms)).reduce((o, x) => ((o[x.type] = x.value), o), {});
    return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
  };
  const e = {
    subject: m.subject,
    body: { contentType: 'text', content: [m.description, m.team && m.team.length ? `Por OdlC: ${m.team.join(', ')}` : '', m.guestName ? `Invitado: ${m.guestName}` : '', `Invitación: ${SITE_URL()}/r/${m.id}`].filter(Boolean).join('\n\n') },
    start: { dateTime: local(m.startUtc), timeZone: ODLC.tz },
    end: { dateTime: local(m.endUtc), timeZone: ODLC.tz },
    transactionId: m.id,
  };
  if (sendInvite && m.guestEmail) e.attendees = [{ emailAddress: { address: m.guestEmail, name: m.guestName || m.guestEmail }, type: 'required' }];
  return e;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function createTeamsEvent(m, sendInvite) {
  const ev = await graph('/me/events', { method: 'POST', body: JSON.stringify({ ...eventBody(m, sendInvite), isOnlineMeeting: true, onlineMeetingProvider: 'teamsForBusiness' }) });
  let joinUrl = ev.onlineMeeting && ev.onlineMeeting.joinUrl;
  for (let i = 0; !joinUrl && i < 4; i++) {
    await sleep(1200);
    const again = await graph(`/me/events/${encodeURIComponent(ev.id)}?$select=onlineMeeting`);
    joinUrl = again.onlineMeeting && again.onlineMeeting.joinUrl;
  }
  if (!joinUrl) {
    throw new GraphError('Outlook ha creado el evento, pero Microsoft no ha devuelto el enlace de Teams. Revisa en Outlook que tu cuenta permite reuniones de Teams y crea la invitación en modo manual.');
  }
  return { eventId: ev.id, joinUrl, webLink: ev.webLink || '' };
}

export async function updateTeamsEvent(m, sendInvite) {
  const b = eventBody(m, sendInvite);
  delete b.transactionId;
  await graph(`/me/events/${encodeURIComponent(m.graphEventId)}`, { method: 'PATCH', body: JSON.stringify(b) });
}

export async function cancelTeamsEvent(m) {
  try {
    await graph(`/me/events/${encodeURIComponent(m.graphEventId)}/cancel`, { method: 'POST', body: JSON.stringify({ comment: 'Reunión cancelada.' }) });
  } catch (e) {
    // Si el evento no tiene asistentes, Outlook no admite «cancel»: se elimina del calendario.
    if (e.status === 400) await graph(`/me/events/${encodeURIComponent(m.graphEventId)}`, { method: 'DELETE' });
    else if (e.status !== 404) throw e;
  }
}
