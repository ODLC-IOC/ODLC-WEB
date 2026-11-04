/* Gestión de cookies conforme al art. 22.2 LSSI y a la Guía sobre el uso de cookies de la AEPD (2023).
   Hoy la web solo usa una cookie técnica propia (odlc_consent) y no muestra aviso porque no hay nada que consentir.
   Para activar medición o publicidad, pegar aquí los identificadores: el aviso aparecerá solo y
   las herramientas se cargarán únicamente después de que la persona acepte. */
var GA4_ID = 'G-DY3P85H57T';               // Google Analytics 4, p. ej. 'G-XXXXXXXXXX'
var LINKEDIN_PARTNER_ID = '';  // LinkedIn Insight Tag, p. ej. '1234567'
var CONSENT_DAYS = 365;        // la AEPD considera buena práctica no superar 24 meses
var POLICY_VERSION = '2026-11-04';

(function () {
  var NAME = 'odlc_consent';
  var TOOLS = [];
  if (GA4_ID) TOOLS.push({ cat: 'analiticas', name: 'Google Analytics 4', owner: 'Google Ireland Ltd.', cookies: '_ga, _ga_*', dur: 'hasta 2 años', purpose: 'Medir de forma estadística cómo se usa la web (páginas vistas, origen de las visitas, descargas, uso de las herramientas y clics en reservar). Los datos de cada visita se conservan 14 meses en Google Analytics.' });
  if (LINKEDIN_PARTNER_ID) TOOLS.push({ cat: 'publicidad', name: 'LinkedIn Insight Tag', owner: 'LinkedIn Ireland Unlimited Company', cookies: 'li_sugr, bcookie, lidc, UserMatchHistory, AnalyticsSyncHistory', dur: 'de 1 día a 6 meses', purpose: 'Medir el resultado de las campañas en LinkedIn y mostrar publicidad relacionada.' });
  var has = function (c) { return TOOLS.some(function (t) { return t.cat === c; }); };
  var read = function () {
    var m = document.cookie.match(new RegExp('(?:^|; )' + NAME + '=([^;]*)'));
    if (!m) return null;
    try { var v = JSON.parse(decodeURIComponent(m[1])); return v.p === POLICY_VERSION ? v : null; } catch (e) { return null; }
  };
  var write = function (a, m) {
    var v = encodeURIComponent(JSON.stringify({ a: !!a, m: !!m, p: POLICY_VERSION, t: Date.now() }));
    document.cookie = NAME + '=' + v + '; Max-Age=' + CONSENT_DAYS * 86400 + '; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  };
  var clearThirdParty = function () {
    document.cookie.split('; ').forEach(function (c) {
      var k = c.split('=')[0];
      if (/^_ga|^_gid|^li_|^AnalyticsSyncHistory|^UserMatchHistory/.test(k)) {
        var host = location.hostname.replace(/^www\./, '');
        ['', '; Domain=' + host, '; Domain=.' + host].forEach(function (d) { document.cookie = k + '=; Max-Age=0; Path=/' + d; });
      }
    });
  };
  var loaded = {};
  var apply = function (c) {
    if (!c) return;
    if (c.a && GA4_ID && !loaded.ga) {
      loaded.ga = 1;
      var s = document.createElement('script'); s.async = true; s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA4_ID; document.head.appendChild(s);
      window.dataLayer = window.dataLayer || []; window.gtag = function () { dataLayer.push(arguments); };
      gtag('js', new Date()); gtag('config', GA4_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
    }
    if (c.m && LINKEDIN_PARTNER_ID && !loaded.li) {
      loaded.li = 1;
      window._linkedin_partner_id = LINKEDIN_PARTNER_ID; window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || []; window._linkedin_data_partner_ids.push(LINKEDIN_PARTNER_ID);
      var l = document.createElement('script'); l.async = true; l.src = 'https://snap.licdn.com/li.lms-analytics/insight.min.js'; document.head.appendChild(l);
    }
  };
  // Eventos propios: solo se envían si la persona ha aceptado las analíticas
  window.odlcTrack = function (name, params) { if (loaded.ga && window.gtag) gtag('event', name, params || {}); };
  // Textos de la política de privacidad que solo aplican si Google Analytics está activo
  Array.prototype.forEach.call(document.querySelectorAll('[data-if-ga]'), function (el) { el.hidden = !GA4_ID; });
  var policyHref = (document.querySelector('a[href$="politica-de-cookies.html"]') || {}).getAttribute ? document.querySelector('a[href$="politica-de-cookies.html"]').getAttribute('href') : 'politica-de-cookies.html';
  var box = null;
  var close = function () { if (box) { box.remove(); box = null; } };
  var save = function (a, m) {
    var prev = read();
    write(a, m); close();
    if (prev && ((prev.a && !a) || (prev.m && !m))) { clearThirdParty(); location.reload(); return; }
    apply({ a: a, m: m });
  };
  var uses = function () {
    var p = [];
    if (has('analiticas')) p.push('analíticas, para medir cómo se usa la web');
    if (has('publicidad')) p.push('publicitarias de LinkedIn, para medir nuestras campañas');
    return p.join(' y ');
  };
  var layer1 = function () {
    close(); box = document.createElement('div'); box.className = 'ck'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-labelledby', 'ck-t');
    box.innerHTML = '<h2 id="ck-t">Cookies</h2><p>Usamos una cookie técnica propia, necesaria para recordar su elección, y, solo si lo acepta, cookies de terceros: ' + uses() + '. Puede aceptarlas, rechazarlas o elegir cuáles. Más información en la <a href="' + policyHref + '">Política de cookies</a>.</p>' +
      '<div class="ck-actions"><button type="button" class="btn btn-primary" data-ck="all">Aceptar todas</button><button type="button" class="btn btn-primary" data-ck="none">Rechazar todas</button><button type="button" class="btn btn-ghost" data-ck="cfg">Configurar</button></div>';
    document.body.appendChild(box);
    box.querySelector('[data-ck=all]').onclick = function () { save(true, true); };
    box.querySelector('[data-ck=none]').onclick = function () { save(false, false); };
    box.querySelector('[data-ck=cfg]').onclick = layer2;
  };
  var opt = function (k, t, d, on, dis) { return '<label class="ck-opt"><span><b>' + t + '</b><span>' + d + '</span></span><input type="checkbox" ' + (k ? 'data-k="' + k + '" ' : '') + (on ? 'checked ' : '') + (dis ? 'disabled ' : '') + 'aria-label="' + t + '"></label>'; };
  var layer2 = function () {
    var c = read() || {};
    close(); box = document.createElement('div'); box.className = 'ck'; box.setAttribute('role', 'dialog'); box.setAttribute('aria-labelledby', 'ck-t');
    var h = '<h2 id="ck-t">Configurar cookies</h2>' + opt('', 'Técnicas · siempre activas', 'Necesarias para que la web funcione y para recordar su elección. No requieren consentimiento.', true, true);
    if (has('analiticas')) h += opt('a', 'Analíticas', 'Google Analytics 4: estadísticas de uso de la web.', c.a, false);
    if (has('publicidad')) h += opt('m', 'Publicitarias', 'LinkedIn Insight Tag: medición de campañas y publicidad relacionada.', c.m, false);
    if (!TOOLS.length) h += '<p style="margin-top:12px">Ahora mismo esta web no utiliza cookies analíticas ni publicitarias: no hay nada que activar.</p>';
    h += '<p style="margin-top:12px">Si guarda sin marcar ninguna opción, equivale a rechazar todas. Puede cambiar su elección cuando quiera desde «Configurar cookies», al pie de cada página. <a href="' + policyHref + '">Política de cookies</a>.</p>';
    h += '<div class="ck-actions">' + (TOOLS.length ? '<button type="button" class="btn btn-primary" data-ck="all">Aceptar todas</button><button type="button" class="btn btn-primary" data-ck="none">Rechazar todas</button><button type="button" class="btn btn-ghost" data-ck="save">Guardar mi elección</button>' : '<button type="button" class="btn btn-primary" data-ck="ok">Cerrar</button>') + '</div>';
    box.innerHTML = h; document.body.appendChild(box);
    var q = function (s) { return box.querySelector(s); };
    if (q('[data-ck=ok]')) q('[data-ck=ok]').onclick = close;
    if (q('[data-ck=all]')) { q('[data-ck=all]').onclick = function () { save(true, true); }; q('[data-ck=none]').onclick = function () { save(false, false); }; }
    if (q('[data-ck=save]')) q('[data-ck=save]').onclick = function () { var a = q('[data-k=a]'), m = q('[data-k=m]'); save(a ? a.checked : false, m ? m.checked : false); };
  };
  document.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('[data-cookie-settings]')) { e.preventDefault(); layer2(); } });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && box && !TOOLS.length) close(); });
  // Tabla de la política de cookies, siempre fiel a la configuración real
  var tb = document.getElementById('ck-third');
  if (tb) tb.innerHTML = TOOLS.length ? TOOLS.map(function (t) { return '<tr><td><b>' + t.cookies + '</b></td><td>' + t.owner + ' (' + t.name + ')</td><td>' + (t.cat === 'analiticas' ? 'Analítica' : 'Publicitaria') + '</td><td>' + t.purpose + '</td><td>' + t.dur + '</td></tr>'; }).join('')
    : '<tr><td colspan="5">Ninguna. Esta web no instala cookies analíticas, publicitarias ni de terceros.</td></tr>';
  var c0 = read();
  if (c0) apply(c0); else if (TOOLS.length) layer1();
})();
