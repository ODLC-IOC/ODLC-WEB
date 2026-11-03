/* Configuración: cuando Isabel tenga su enlace de reserva (Google Calendar, Calendly, etc.), pégalo aquí. */
var CALENDAR_URL = '';
var CONTACT_EMAIL = 'isabel@odlc.es';
/* Cuando Isabel cree la newsletter «Empresas y Patrimonios en Orden» en LinkedIn, pegar aquí su enlace. El botón aparece solo. */
var NEWSLETTER_URL = '';
/* Tarifa de lanzamiento: con fecha de fin (AAAA-MM-DD) y texto, aparece sola en portada, recorrido, tarifas y calculadora,
   y desaparece al día siguiente de la fecha. Vacío = no se muestra. Ejemplo:
   var LANZAMIENTO = { hasta: '2027-01-31', texto: 'Puesta en marcha a 5.500 € en lugar de 6.500 € para proyectos contratados' }; */
var LANZAMIENTO = { hasta: '', texto: '' };

(function () {
  // Menú móvil
  var t = document.querySelector('.menu-toggle'), m = document.querySelector('.menu');
  if (t && m) t.addEventListener('click', function () {
    var open = m.classList.toggle('open'); t.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // Año en el pie
  document.querySelectorAll('[data-year]').forEach(function (e) { e.textContent = new Date().getFullYear(); });
  // Botones de calendario: solo aparecen cuando hay enlace configurado
  document.querySelectorAll('[data-calendar]').forEach(function (e) {
    if (CALENDAR_URL) { e.href = CALENDAR_URL; e.hidden = false; } else { e.hidden = true; }
  });
  document.querySelectorAll('[data-calendar-pending]').forEach(function (e) { e.hidden = !!CALENDAR_URL; });

  // ───── Formulario de diagnóstico ─────
  var form = document.getElementById('diagnostico-form');
  if (form) {
    var p = new URLSearchParams(location.search);
    if (p.get('calc')) {
      var hc = form.querySelector('input[name=calculadora]'); if (hc) hc.value = p.get('calc');
      var mc = form.querySelector('textarea[name=mensaje]'); if (mc && !mc.value) mc.value = p.get('calc') + '\n\n';
    }
    var svc = p.get('servicio'); if (svc) { var sel = form.querySelector('select[name=servicio]'); if (sel) sel.value = svc; }
    // Sin Netlify Forms (p. ej. abriendo el archivo en local), se usa el correo como alternativa
    form.addEventListener('submit', function (ev) {
      var onNetlify = /netlify\.app$/.test(location.hostname) || form.hasAttribute('data-force-netlify');
      if (location.protocol === 'file:' || (!onNetlify && !document.querySelector('meta[name="form-backend"][content="netlify"]'))) {
        ev.preventDefault();
        var fd = new FormData(form), lines = [];
        fd.forEach(function (v, k) { if (k !== 'form-name' && k !== 'bot-field' && v) lines.push(k.replace(/_/g, ' ') + ': ' + v); });
        location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Solicitud: ' + (fd.get('tipo') || 'Sesión gratuita')) + '&body=' + encodeURIComponent(lines.join('\n'));
      }
    });
  }
})();

(function () {
  // ───── Newsletter «Empresas y Patrimonios en Orden» ─────
  document.querySelectorAll('[data-newsletter]').forEach(function (e) {
    if (NEWSLETTER_URL) { e.href = NEWSLETTER_URL; e.hidden = false; } else { e.hidden = true; }
  });
  document.querySelectorAll('[data-newsletter-alt]').forEach(function (e) { e.hidden = !NEWSLETTER_URL; });
  document.querySelectorAll('form[name=newsletter]').forEach(function (f) {
    f.addEventListener('submit', function (ev) {
      var onNetlify = /netlify\.app$/.test(location.hostname) || !!document.querySelector('meta[name="form-backend"][content="netlify"]');
      if (location.protocol === 'file:' || !onNetlify) {
        ev.preventDefault();
        var mail = f.querySelector('input[name=email]').value;
        location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent('Alta en Empresas y Patrimonios en Orden') + '&body=' + encodeURIComponent('Quiero suscribirme a Empresas y Patrimonios en Orden con este correo: ' + mail);
      }
    });
  });

  // ───── Reservar sesión: con CALENDAR_URL, todos los botones van directos al calendario ─────
  document.querySelectorAll('[data-book]').forEach(function (e) {
    if (CALENDAR_URL) { e.href = CALENDAR_URL; e.target = '_blank'; e.rel = 'noopener'; e.setAttribute('data-external', '1'); }
  });
  var qs0 = new URLSearchParams(location.search);
  if (qs0.get('tipo') === 'sesion') {
    var r0 = document.querySelector('input[name=tipo]'); if (r0) r0.checked = true;
    var f0 = document.getElementById('diagnostico-form'); if (f0) setTimeout(function () { f0.scrollIntoView({ block: 'start' }); }, 50);
  }

  // ───── Blog: solo se muestran los artículos cuya fecha ya ha llegado (?todos=1 muestra todos) ─────
  var d0 = new Date();
  var TODAY = d0.getFullYear() + '-' + String(d0.getMonth() + 1).padStart(2, '0') + '-' + String(d0.getDate()).padStart(2, '0');
  var esc = function (t) { var e = document.createElement('i'); e.textContent = t; return e.innerHTML; };
  var POSTS = (window.BLOG || []).filter(function (x) { return /[?&]todos=1/.test(location.search) || x.date <= TODAY; });
  var bl = document.getElementById('post-list');
  if (bl && POSTS.length) {
    var pre = bl.getAttribute('data-prefix') || '';
    bl.innerHTML = POSTS.slice().reverse().map(function (x) {
      return '<a class="post-item has-img" href="' + pre + x.slug + '.html"><div class="post-date"><b>' + esc(x.dshort) + '</b>' + x.mins + ' min de lectura</div><div><p class="post-cat">' + esc(x.cat) + '</p><h2>' + esc(x.title) + '</h2><p>' + esc(x.excerpt) + '</p></div><div class="post-thumb"><img src="' + pre + '../assets/img/blog/' + x.slug + '.png" alt="" width="1200" height="630" loading="lazy"></div></a>';
    }).join('');
  }
  document.querySelectorAll('[data-related-posts]').forEach(function (box) {
    var svc = box.getAttribute('data-svc'), base = box.getAttribute('data-base') || '';
    var list = POSTS.filter(function (x) { return x.svc === svc; }).reverse();
    if (list.length < 3) list = list.concat(POSTS.slice().reverse().filter(function (x) { return list.indexOf(x) < 0; }));
    list = list.slice(0, 3);
    var sec = box.closest('section');
    if (!list.length) { if (sec) sec.hidden = true; return; }
    box.innerHTML = list.map(function (x) {
      return '<a href="' + base + 'blog/' + x.slug + '.html"><img src="' + base + 'assets/img/blog/' + x.slug + '.png" alt="" width="1200" height="630" loading="lazy"><span>' + esc(x.title) + '</span></a>';
    }).join('');
  });

  // ───── Tarifa de lanzamiento ─────
  if (LANZAMIENTO.hasta && LANZAMIENTO.texto && TODAY <= LANZAMIENTO.hasta) {
    var p2 = LANZAMIENTO.hasta.split('-'), meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    var fecha = (+p2[2]) + ' de ' + meses[+p2[1] - 1] + ' de ' + p2[0];
    document.querySelectorAll('[data-launch]').forEach(function (e) {
      e.innerHTML = '<b>Tarifa de lanzamiento</b> hasta el ' + fecha + ': ' + esc(LANZAMIENTO.texto) + '.';
      e.hidden = false;
    });
  }
})();
// ───── Red animada: se dibuja al entrar en pantalla ─────
(function () {
  var nets = document.querySelectorAll('.net');
  if (!nets.length) return;
  if (!('IntersectionObserver' in window)) { nets.forEach(function (n) { n.classList.add('on'); }); return; }
  var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }); }, { threshold: 0.25 });
  nets.forEach(function (n) { io.observe(n); });
})();
