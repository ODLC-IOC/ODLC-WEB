// Respuestas HTTP comunes y escape de HTML.

const BASE = {
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
};

export function json(data, status = 200, extra = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...BASE, 'Content-Type': 'application/json; charset=utf-8', ...extra },
  });
}

export function html(body, status = 200, extra = {}) {
  return new Response(body, {
    status,
    headers: {
      ...BASE,
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'DENY',
      ...extra,
    },
  });
}

export function redirect(location, extra = {}) {
  return new Response(null, { status: 303, headers: { ...BASE, Location: location, ...extra } });
}

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function clientIp(req, context) {
  return (context && context.ip) || req.headers.get('x-nf-client-connection-ip') || req.headers.get('x-forwarded-for') || 'desconocida';
}

// Protección CSRF: las peticiones que cambian datos deben venir de la propia web.
export function sameOrigin(req) {
  const origin = req.headers.get('origin');
  if (!origin) return req.headers.get('sec-fetch-site') === 'same-origin';
  try {
    return new URL(origin).host === new URL(req.url).host;
  } catch {
    return false;
  }
}
