// Reuniones: validación, conversión horaria Europe/Madrid (horario de verano incluido),
// textos en español, archivo .ics, enlaces de calendario y mensaje de WhatsApp.
import crypto from 'node:crypto';
import { ODLC, DURACIONES, SITE_URL } from './config.mjs';

export const ID_RE = /^[A-Za-z0-9_-]{22}$/;
export const newId = () => crypto.randomBytes(16).toString('base64url'); // 128 bits aleatorios

// ---------- Zona horaria ----------
function tzOffsetMs(utcMs, tz = ODLC.tz) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      .formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]),
  );
  const asUtc = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour % 24, +parts.minute, +parts.second);
  return asUtc - utcMs;
}

// Hora local de Madrid -> instante UTC. Devuelve null si esa hora no existe (salto de marzo).
export function madridToUtc(date, time) {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  const naive = Date.UTC(y, mo - 1, d, h, mi);
  let utc = naive - tzOffsetMs(naive);
  utc = naive - tzOffsetMs(utc);
  const back = localParts(utc);
  if (back.date !== date || back.time !== time) return null;
  return utc;
}

export function localParts(utcMs, tz = ODLC.tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
      .formatToParts(new Date(utcMs)).map((x) => [x.type, x.value]),
  );
  return { date: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export function fechaLarga(utcMs) {
  return cap(new Intl.DateTimeFormat('es-ES', { timeZone: ODLC.tz, weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(utcMs)));
}
export function horaCorta(utcMs) {
  return new Intl.DateTimeFormat('es-ES', { timeZone: ODLC.tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(utcMs));
}
export function zonaTexto(utcMs) {
  // CET (UTC+1) en invierno, CEST (UTC+2) en verano
  const off = tzOffsetMs(utcMs) / 3600e3;
  return `Madrid (UTC+${off})`;
}

// ---------- Validación ----------
const TEAMS_HOST = /(^|\.)(teams\.microsoft\.com|teams\.live\.com|teams\.cloud\.microsoft)$/i;
export function isTeamsUrl(u) {
  try {
    const url = new URL(u);
    return url.protocol === 'https:' && TEAMS_HOST.test(url.hostname) && url.pathname.length > 1;
  } catch {
    return false;
  }
}

const str = (v, max) => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

// Comprueba los datos del formulario. Devuelve { data } o { errors: {campo: mensaje} }.
export function validateInput(body, { requireTeams, allowPast = false } = {}) {
  const errors = {};
  const data = {
    guestName: str(body.guestName, 120),
    guestEmail: str(body.guestEmail, 160).toLowerCase(),
    guestPhone: str(body.guestPhone, 30),
    subject: str(body.subject, 160),
    date: str(body.date, 10),
    time: str(body.time, 5),
    duration: Number(body.duration),
    description: str(body.description, 2000),
    teamsUrl: str(body.teamsUrl, 2000),
    notes: str(body.notes, 2000),
  };
  if (!data.subject) errors.subject = 'Escribe el asunto de la reunión.';
  if (data.guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(data.guestEmail)) errors.guestEmail = 'El correo no es válido.';
  if (data.guestPhone) {
    const digits = data.guestPhone.replace(/[^\d+]/g, '');
    if (!/^\+?\d{9,15}$/.test(digits)) errors.guestPhone = 'Escribe el móvil con prefijo, por ejemplo +34 600 000 000.';
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date)) errors.date = 'Elige una fecha.';
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(data.time)) errors.time = 'Elige una hora válida.';
  if (!DURACIONES.includes(data.duration)) errors.duration = 'Elige una duración: 15, 30, 45, 60 o 90 minutos.';
  if (!errors.date && !errors.time) {
    const start = madridToUtc(data.date, data.time);
    if (start === null) errors.time = 'Esa hora no existe en Madrid (cambio al horario de verano). Elige otra.';
    else if (!allowPast && start < Date.now() - 5 * 60e3) errors.date = 'La fecha y la hora ya han pasado.';
    else if (start > Date.now() + 2 * 365 * 86400e3) errors.date = 'La fecha está demasiado lejos.';
    else {
      data.startUtc = start;
      data.endUtc = start + data.duration * 60e3;
    }
  }
  if (data.teamsUrl && !isTeamsUrl(data.teamsUrl)) errors.teamsUrl = 'Pega un enlace de Microsoft Teams que empiece por https://teams.microsoft.com/…';
  if (requireTeams && !data.teamsUrl) errors.teamsUrl = 'Pega el enlace de la reunión de Teams.';
  return Object.keys(errors).length ? { errors } : { data };
}

// ---------- Estado ----------
export function estado(m, now = Date.now()) {
  if (m.status === 'cancelada') return 'cancelada';
  return m.endUtc < now ? 'pasada' : 'proxima';
}

export const inviteUrl = (m) => `${SITE_URL()}/r/${m.id}`;
export const icsUrl = (m) => `${SITE_URL()}/r/${m.id}/calendario.ics`;

// ---------- Texto del calendario ----------
function calendarBody(m) {
  const lines = [];
  if (m.description) lines.push(m.description, '');
  lines.push('Reunión online por Microsoft Teams.');
  if (m.teamsUrl) lines.push('Unirse a la reunión: ' + m.teamsUrl);
  lines.push('', 'Invitación: ' + inviteUrl(m), '', `${ODLC.nombre} · ${ODLC.empresa}`, ODLC.web);
  return lines.join('\n');
}

export function calendarLinks(m) {
  const z = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, 'Z');
  const title = m.subject;
  const body = calendarBody(m);
  const loc = 'Microsoft Teams';
  const google = 'https://calendar.google.com/calendar/render?' + new URLSearchParams({
    action: 'TEMPLATE', text: title, dates: `${z(m.startUtc)}/${z(m.endUtc)}`, details: body, location: m.teamsUrl || loc, ctz: ODLC.tz,
  });
  const outlookParams = (base) => base + '?' + new URLSearchParams({
    path: '/calendar/action/compose', rru: 'addevent', subject: title, startdt: iso(m.startUtc), enddt: iso(m.endUtc), body, location: loc,
  });
  return {
    google,
    outlookWork: outlookParams('https://outlook.office.com/calendar/0/deeplink/compose'),
    outlookPersonal: outlookParams('https://outlook.live.com/calendar/0/deeplink/compose'),
    ics: icsUrl(m),
  };
}

// ---------- .ics (RFC 5545) ----------
const icsEsc = (s) => String(s ?? '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
function fold(line) {
  // Líneas de 75 octetos como máximo, sin partir caracteres UTF-8
  const out = [];
  let cur = '', bytes = 0;
  for (const ch of line) {
    const b = Buffer.byteLength(ch);
    if (bytes + b > (out.length ? 74 : 75)) { out.push(cur); cur = ''; bytes = 0; }
    cur += ch; bytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}
const icsLocal = (ms) => {
  const p = localParts(ms);
  return p.date.replace(/-/g, '') + 'T' + p.time.replace(':', '') + '00';
};
const icsUtc = (ms) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');

const VTIMEZONE = [
  'BEGIN:VTIMEZONE', 'TZID:Europe/Madrid', 'X-LIC-LOCATION:Europe/Madrid',
  'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
  'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
  'END:VTIMEZONE',
];

export function buildIcs(m) {
  const cancelled = m.status === 'cancelada';
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//ODLC//Reuniones ODLC//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    ...VTIMEZONE,
    'BEGIN:VEVENT',
    `UID:${m.uid}`,
    `DTSTAMP:${icsUtc(Date.now())}`,
    `LAST-MODIFIED:${icsUtc(m.updatedAt || m.createdAt)}`,
    `CREATED:${icsUtc(m.createdAt)}`,
    `SEQUENCE:${m.sequence || 0}`,
    `DTSTART;TZID=Europe/Madrid:${icsLocal(m.startUtc)}`,
    `DTEND;TZID=Europe/Madrid:${icsLocal(m.endUtc)}`,
    `SUMMARY:${icsEsc((cancelled ? 'Cancelada: ' : '') + m.subject)}`,
    `DESCRIPTION:${icsEsc(calendarBody(m))}`,
    `LOCATION:${icsEsc('Microsoft Teams')}`,
    `ORGANIZER;CN=${icsEsc(ODLC.nombre)}:mailto:${ODLC.email}`,
    `STATUS:${cancelled ? 'CANCELLED' : 'CONFIRMED'}`,
    'TRANSP:OPAQUE',
  ];
  if (m.teamsUrl) lines.push(`URL:${m.teamsUrl}`, `X-MICROSOFT-SKYPETEAMSMEETINGURL:${m.teamsUrl}`);
  if (!cancelled) lines.push('BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsEsc(m.subject)}`, 'TRIGGER:-PT15M', 'END:VALARM');
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}

// ---------- WhatsApp ----------
const CLOCKS = ['🕛', '🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚'];
const HALF = ['🕧', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦'];
function clock(hhmm) {
  const [h, mi] = hhmm.split(':').map(Number);
  return (mi >= 15 && mi < 45 ? HALF : CLOCKS)[(mi >= 45 ? h + 1 : h) % 12];
}

export function whatsappText(m) {
  const hora = horaCorta(m.startUtc);
  const saludo = m.guestName ? `Hola, ${m.guestName}:` : 'Hola:';
  return [
    saludo, '',
    'Te envío la invitación para nuestra reunión con ODLC.', '',
    `📅 ${fechaLarga(m.startUtc)}`,
    `${clock(hora)} ${hora} h (Madrid)`,
    '💻 Microsoft Teams', '',
    'Puedes consultar la invitación, unirte a la reunión y añadirla a tu calendario aquí:', '',
    inviteUrl(m), '',
    'Un saludo,', '',
    ODLC.nombre,
    ODLC.empresa,
  ].join('\n');
}

export function whatsappLink(m, text = whatsappText(m)) {
  const phone = (m.guestPhone || '').replace(/[^\d]/g, '');
  const withPrefix = phone.length === 9 ? '34' + phone : phone; // número español sin prefijo
  return `https://wa.me/${withPrefix}?text=${encodeURIComponent(text)}`;
}

// Vista para el panel privado (incluye los datos de contacto del invitado)
export function adminView(m) {
  return {
    ...m,
    estado: estado(m),
    fecha: fechaLarga(m.startUtc),
    hora: horaCorta(m.startUtc),
    horaFin: horaCorta(m.endUtc),
    local: localParts(m.startUtc),
    url: inviteUrl(m),
    whatsappText: whatsappText(m),
    whatsappLink: whatsappLink(m),
  };
}
