/* Kit de marca · herramienta de OdlC
   La pantalla es de la web de OdlC; la extracción la hace por detrás el motor del kit (app en Lovable),
   a través de su API.
   Uso en cualquier página o artículo del blog:
     <div data-kit-marca></div>
     <script src="…/assets/js/kit-marca.js" defer></script>
   Opcional: data-raiz="../" en artículos del blog, para que los enlaces internos funcionen.

   Cuando la API esté publicada, pegar aquí su dirección. Mientras esté vacía, el bloque
   muestra «Disponible muy pronto». */
var KIT_MARCA_API = '';   // p. ej. 'https://kit-marca-odlc.lovable.app'

(function () {
  var esc = function (s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  var safeUrl = function (u) { return /^https:\/\//i.test(u || '') ? u : ''; };
  var safeHex = function (h) { return /^#[0-9a-f]{3,8}$/i.test(h || '') ? h : ''; };

  function build(box) {
    if (box.getAttribute('data-ready')) return;
    box.setAttribute('data-ready', '1');
    var raiz = box.getAttribute('data-raiz') || '';
    box.classList.add('km-box');

    if (!KIT_MARCA_API) {
      box.innerHTML = head() + '<p class="km-soon">Disponible muy pronto.</p>';
      return;
    }

    box.innerHTML = head() +
      '<form class="km-form" novalidate>' +
        '<label class="sr-only" for="km-url-' + uid + '">Web de la empresa</label>' +
        '<div class="km-row"><input id="km-url-' + uid + '" type="text" inputmode="url" autocomplete="url" placeholder="www.suempresa.es" required>' +
        '<button class="btn btn-primary" type="submit">Obtener el kit</button></div>' +
        '<p class="km-note">La web que indique se envía al servicio que hace la extracción y se analiza su contenido público. No pedimos ni guardamos datos personales. Más información en la <a href="' + raiz + 'privacidad.html">política de privacidad</a>.</p>' +
      '</form>' +
      '<div class="km-status" aria-live="polite"></div>' +
      '<div class="km-result" hidden></div>';
    uid++;

    var form = box.querySelector('.km-form');
    var input = form.querySelector('input');
    var btn = form.querySelector('button');
    var status = box.querySelector('.km-status');
    var result = box.querySelector('.km-result');

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var url = input.value.trim();
      if (!url) { status.innerHTML = '<p class="km-error">Escriba la dirección de una web.</p>'; input.focus(); return; }
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      try { new URL(url); } catch (e) { status.innerHTML = '<p class="km-error">Esa dirección no parece válida. Pruebe con el formato www.empresa.es.</p>'; return; }

      btn.disabled = true; result.hidden = true;
      status.innerHTML = '<p class="km-loading"><span class="km-spin" aria-hidden="true"></span>Analizando la web. Suele tardar entre 30 segundos y un minuto…</p>';

      fetch(KIT_MARCA_API.replace(/\/$/, '') + '/api/kit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url })
      })
        .then(function (r) { return r.json().catch(function () { return {}; }).then(function (d) { return { ok: r.ok, d: d }; }); })
        .then(function (res) {
          if (!res.ok || !res.d || res.d.error) throw new Error((res.d && res.d.error) || 'No hemos podido analizar esa web.');
          status.innerHTML = '';
          result.innerHTML = render(res.d, raiz);
          result.hidden = false;
          result.scrollIntoView({ behavior: 'smooth', block: 'start' });
          track('kit_marca_ok');
        })
        .catch(function (err) {
          status.innerHTML = '<p class="km-error">' + esc(err.message || 'No hemos podido analizar esa web.') + ' Inténtelo de nuevo en unos minutos o pruebe con otra dirección.</p>';
          track('kit_marca_error');
        })
        .then(function () { btn.disabled = false; });
    });
  }
  var uid = 0;

  function head() {
    return '<span class="tag">Herramienta gratuita · OdlC</span><h3 class="km-title">Kit de marca</h3>' +
      '<p class="km-lead">Introduzca la web de una empresa y obtenga sus colores, tipografías, logotipos y tono de voz, listos para descargar en PDF.</p>';
  }

  function render(k, raiz) {
    var h = '<div class="km-kit-head"><div><p class="eyebrow">Kit de marca</p><h3>' + esc(k.nombre || k.web) + '</h3>' +
      (k.descripcion ? '<p>' + esc(k.descripcion) + '</p>' : '') + '</div>' +
      (safeUrl(k.pdf_url) ? '<a class="btn btn-brass" href="' + esc(k.pdf_url) + '" target="_blank" rel="noopener" download>Descargar PDF</a>' : '') + '</div>';

    if (k.colores && k.colores.length) {
      h += '<h4>Colores</h4><div class="km-colors">' + k.colores.map(function (c) {
        var hex = safeHex(c.hex); if (!hex) return '';
        return '<button type="button" class="km-color" data-copy="' + esc(hex) + '" title="Copiar ' + esc(hex) + '">' +
          '<span class="km-swatch" style="background:' + hex + '"></span>' +
          '<b>' + esc(hex.toUpperCase()) + '</b>' + (c.nombre ? '<small>' + esc(c.nombre) + '</small>' : '') + (c.uso ? '<small>' + esc(c.uso) + '</small>' : '') + '</button>';
      }).join('') + '</div>';
    }
    if (k.tipografias && k.tipografias.length) {
      h += '<h4>Tipografías</h4><ul class="km-fonts">' + k.tipografias.map(function (t) {
        return '<li><b>' + esc(t.familia) + '</b>' + (t.uso ? '<span>' + esc(t.uso) + '</span>' : '') + '</li>';
      }).join('') + '</ul>';
    }
    if (k.logos && k.logos.length) {
      h += '<h4>Logotipos</h4><div class="km-logos">' + k.logos.map(function (l) {
        var u = safeUrl(l.url); if (!u) return '';
        return '<a class="km-logo" href="' + esc(u) + '" target="_blank" rel="noopener"><img src="' + esc(u) + '" alt="' + esc(l.tipo || 'Logotipo') + '" loading="lazy" referrerpolicy="no-referrer"></a>';
      }).join('') + '</div>';
    }
    if (k.voz && (k.voz.resumen || (k.voz.rasgos && k.voz.rasgos.length))) {
      h += '<h4>Tono de voz</h4>' + (k.voz.resumen ? '<p>' + esc(k.voz.resumen) + '</p>' : '') +
        (k.voz.rasgos && k.voz.rasgos.length ? '<ul class="km-traits">' + k.voz.rasgos.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('') + '</ul>' : '');
    }
    h += '<div class="km-cta"><div><h4>¿Quiere poner en orden la marca de su empresa?</h4>' +
      '<p>En OdlC dirigimos el proceso completo de identidad corporativa, de la estrategia al registro de la marca.</p></div>' +
      '<a class="btn btn-brass" data-book href="' + raiz + 'reservar-sesion.html">Reservar sesión gratuita</a></div>' +
      '<p class="km-note">Resultado orientativo, obtenido de forma automática a partir del contenido público de la web. Las marcas y logotipos pertenecen a sus titulares.</p>';
    return h;
  }

  // Copiar un color al pulsarlo
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.km-color');
    if (!b || !navigator.clipboard) return;
    navigator.clipboard.writeText(b.getAttribute('data-copy')).then(function () {
      b.classList.add('km-copied'); setTimeout(function () { b.classList.remove('km-copied'); }, 1200);
    }).catch(function () {});
  });

  // Medición solo si la persona aceptó la analítica (gtag lo carga cookies.js tras el consentimiento)
  function track(name) { try { if (window.gtag) window.gtag('event', name); } catch (e) {} }

  function init() { document.querySelectorAll('[data-kit-marca]').forEach(build); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
