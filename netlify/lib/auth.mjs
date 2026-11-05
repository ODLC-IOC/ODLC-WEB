// Autenticación del panel privado.
// - La contraseña nunca se guarda: en Netlify solo hay un hash scrypt (ODLC_ADMIN_PASSWORD_HASH).
// - La sesión es una cookie HttpOnly, Secure, SameSite=Strict, firmada con HMAC (ODLC_SESSION_SECRET).
// - Tras 5 intentos fallidos desde la misma IP, el acceso se bloquea 15 minutos.
import crypto from 'node:crypto';
import { env, ADMIN_EMAIL } from './config.mjs';
import { getJSON, setJSON, del } from './store.mjs';

const COOKIE = '__Host-odlc_s';
const SESSION_HOURS = 8;
const MAX_FAILS = 5;
const LOCK_MIN = 15;

export function configured() {
  const missing = [];
  if (!env('ODLC_ADMIN_PASSWORD_HASH').startsWith('scrypt$')) missing.push('ODLC_ADMIN_PASSWORD_HASH');
  if (env('ODLC_SESSION_SECRET').length < 32) missing.push('ODLC_SESSION_SECRET');
  return missing;
}

const b64u = (buf) => Buffer.from(buf).toString('base64url');

// Formato: scrypt$N$r$p$salt(base64)$hash(base64)
export function hashPassword(password, salt = crypto.randomBytes(16)) {
  const N = 32768, r = 8, p = 1;
  const hash = crypto.scryptSync(String(password).normalize('NFC'), salt, 32, { N, r, p, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${r}$${p}$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(password, stored) {
  const parts = String(stored || '').split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false;
  const [, N, r, p, saltB64, hashB64] = parts;
  const expected = Buffer.from(hashB64, 'base64');
  const got = crypto.scryptSync(String(password).normalize('NFC'), Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(N), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024,
  });
  return got.length === expected.length && crypto.timingSafeEqual(got, expected);
}

function sign(value) {
  return crypto.createHmac('sha256', env('ODLC_SESSION_SECRET')).update(value).digest('base64url');
}

function safeEqual(a, b) {
  const A = Buffer.from(String(a)), B = Buffer.from(String(b));
  return A.length === B.length && crypto.timingSafeEqual(A, B);
}

export function sessionCookie() {
  const payload = b64u(JSON.stringify({ u: ADMIN_EMAIL(), exp: Date.now() + SESSION_HOURS * 3600e3, n: b64u(crypto.randomBytes(9)) }));
  const value = `${payload}.${sign(payload)}`;
  return `${COOKIE}=${value}; Path=/; Max-Age=${SESSION_HOURS * 3600}; HttpOnly; Secure; SameSite=Strict`;
}

export function clearCookie() {
  return `${COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

export function isAuthenticated(req) {
  if (configured().length) return false;
  const raw = (req.headers.get('cookie') || '').split(/;\s*/).find((c) => c.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [payload, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!payload || !sig || !safeEqual(sig, sign(payload))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return data.u === ADMIN_EMAIL() && typeof data.exp === 'number' && data.exp > Date.now();
  } catch {
    return false;
  }
}

const rlKey = (ip) => 'rl/' + crypto.createHash('sha256').update(String(ip)).digest('hex').slice(0, 32);

export async function login(email, password, ip) {
  const key = rlKey(ip);
  const rl = (await getJSON(key)) || { fails: 0, until: 0 };
  if (rl.until > Date.now()) return { ok: false, locked: true };
  const emailOk = safeEqual(String(email || '').trim().toLowerCase(), ADMIN_EMAIL());
  const passOk = verifyPassword(password, env('ODLC_ADMIN_PASSWORD_HASH')); // se calcula siempre: mismo tiempo de respuesta
  if (emailOk && passOk) {
    if (rl.fails) await del(key);
    return { ok: true };
  }
  const fails = rl.fails + 1;
  await setJSON(key, { fails: fails >= MAX_FAILS ? 0 : fails, until: fails >= MAX_FAILS ? Date.now() + LOCK_MIN * 60e3 : 0 });
  return { ok: false, locked: fails >= MAX_FAILS };
}
