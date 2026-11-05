// Microsoft simulado: token, /me, calendario, eventos y calendarView
import http from 'node:http';
const events = new Map(); let n = 0;
const now = Date.now();
const iso = (ms) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, '.0000000');
// Una reserva de Bookings y una reunión normal ya existentes
const tomorrow10 = Date.UTC(2026, 10, 12, 9, 0);
events.set('BK1', { id: 'BK1', subject: 'Sesión con Laura Gómez', start: { dateTime: iso(tomorrow10) }, end: { dateTime: iso(tomorrow10 + 30 * 60000) }, isOnlineMeeting: true, onlineMeeting: { joinUrl: 'https://teams.microsoft.com/l/meetup-join/BOOKINGS1' }, attendees: [{ emailAddress: { address: 'laura@cliente.es', name: 'Laura Gómez' } }], bodyPreview: 'Reservado con Microsoft Bookings', body: { content: '<html><body><p>Teams</p></body></html>' }, showAs: 'busy' });
events.set('EV9', { id: 'EV9', subject: 'Reunión con notaría', start: { dateTime: iso(Date.UTC(2026, 10, 13, 10, 0)) }, end: { dateTime: iso(Date.UTC(2026, 10, 13, 11, 0)) }, isOnlineMeeting: true, onlineMeeting: { joinUrl: 'https://teams.microsoft.com/l/meetup-join/NOTARIA' }, attendees: [{ emailAddress: { address: 'notaria@ejemplo.es', name: 'Notaría' } }], bodyPreview: 'Hola', body: { content: '<p>x</p>' }, showAs: 'busy' });
export const log = [];
http.createServer((req, res) => {
  let b = ''; req.on('data', (c) => (b += c)); req.on('end', () => {
    const u = new URL(req.url, 'http://x'); log.push(req.method + ' ' + u.pathname);
    const send = (code, d) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(d === undefined ? '' : JSON.stringify(d)); };
    console.log(req.method, u.pathname, b.slice(0, 160));
    if (u.pathname.endsWith('/token')) return send(200, { access_token: 'AT', refresh_token: 'RT' + (++n) });
    if (u.pathname === '/v1.0/me') return send(200, { mail: 'isabel@odlc.es', displayName: 'Isabel' });
    if (u.pathname === '/v1.0/me/calendar') return send(200, { allowedOnlineMeetingProviders: ['teamsForBusiness'] });
    if (u.pathname === '/v1.0/me/calendarView') return send(200, { value: [...events.values()] });
    if (u.pathname === '/v1.0/me/events' && req.method === 'POST') {
      const d = JSON.parse(b); const id = 'EV' + (++n);
      events.set(id, { id, ...d, start: { dateTime: iso(Date.parse(d.start.dateTime + '+01:00')) }, end: { dateTime: iso(Date.parse(d.end.dateTime + '+01:00')) }, onlineMeeting: { joinUrl: 'https://teams.microsoft.com/l/meetup-join/' + id }, showAs: 'busy' });
      return send(201, events.get(id));
    }
    const m = u.pathname.match(/^\/v1\.0\/me\/events\/([^/]+)(\/cancel)?$/);
    if (m) {
      const ev = events.get(decodeURIComponent(m[1])); if (!ev) return send(404, { error: { message: 'no' } });
      if (m[2]) { events.delete(ev.id); return send(202); }
      if (req.method === 'GET') return send(200, ev);
      if (req.method === 'PATCH') { Object.assign(ev, JSON.parse(b)); return send(200, ev); }
      if (req.method === 'DELETE') { events.delete(ev.id); return send(204); }
    }
    send(404, { error: { message: 'ruta simulada no encontrada ' + u.pathname } });
  });
}).listen(8901, () => console.log('mock listo'));
