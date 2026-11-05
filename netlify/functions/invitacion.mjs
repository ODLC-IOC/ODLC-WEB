// /r/:id y /r/:id/calendario.ics — invitación pública (solo lectura).
import { html } from '../lib/http.mjs';
import { getJSON } from '../lib/store.mjs';
import { ID_RE, buildIcs } from '../lib/meeting.mjs';
import { invitationPage, notFoundPage } from '../lib/pages.mjs';

export default async (req, context) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return new Response('Método no permitido', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const id = context.params.id;
  const m = ID_RE.test(id || '') ? await getJSON(`m/${id}`) : null;
  const wantsIcs = new URL(req.url).pathname.endsWith('/calendario.ics');
  if (!m) return html(notFoundPage(), 404);
  if (wantsIcs) {
    return new Response(buildIcs(m), {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="reunion-odlc.ics"',
        'Cache-Control': 'no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  }
  return html(invitationPage(m));
};

export const config = { path: ['/r/:id', '/r/:id/calendario.ics'] };
