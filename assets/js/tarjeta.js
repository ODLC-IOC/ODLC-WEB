/* Tarjeta digital y tarjeta QR: mantiene el nombre completo en una sola línea,
   reduciendo el tamaño de letra solo si no cabe en la pantalla. */
(function () {
  function fit() {
    document.querySelectorAll('[data-fit]').forEach(function (el) {
      el.style.fontSize = '';
      var size = parseFloat(getComputedStyle(el).fontSize), min = 13;
      while (el.scrollWidth > el.clientWidth + 1 && size > min) {
        size -= 0.5; el.style.fontSize = size + 'px';
      }
    });
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
  window.addEventListener('load', fit);
  window.addEventListener('resize', fit);
  fit();
})();
