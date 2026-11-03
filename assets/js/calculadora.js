/* Calculadora ODLC: cuánto le cuesta montar su empresa por su cuenta.
   Horas por servicio: supuestos de Isabel (editables por el visitante).
   Honorarios: tarifas publicadas de ODLC (fijos). ext = abogados que pagaría haciéndolo por su cuenta o con un interim. */
(function () {
  var services = [
    { id: 'const', name: 'Diseño y constitución', who: 'Abogado, notaría, gestoría, banco', legal: 'Estatutos y pacto de socios', n: 4, hs: 30, ho: 8, fee: 2400, ext: 1500 },
    { id: 'marca', name: 'Identidad corporativa', who: 'Diseñador', legal: 'Registro de la marca', n: 1, hs: 15, ho: 4, fee: 900, ext: 300 },
    { id: 'web', name: 'Web corporativa', who: 'Proveedor web', legal: 'Aviso legal, privacidad y cookies', n: 1, hs: 20, ho: 5, fee: 1200, ext: 500 },
    { id: 'ofi', name: 'Oficina', who: 'Comercial, interiorista, suministros', legal: 'Contrato de alquiler y seguros', n: 3, hs: 35, ho: 12, fee: 1500, ext: 600 },
    { id: 'tec', name: 'Tecnología, IA y secretaria virtual', who: 'Informático, proveedor de IA', legal: 'Protección de datos, contratos y política de IA', n: 2, hs: 25, ho: 6, fee: 1300, ext: 800 },
    { id: 'eq', name: 'Equipo', who: 'Selección, gestoría laboral', legal: 'Contratos y políticas internas', n: 2, hs: 30, ho: 10, fee: 1100, ext: 500 },
    { id: 'cont', name: 'Contabilidad y fiscal', who: 'Asesoría contable', legal: '', n: 1, hs: 15, ho: 5, fee: 500, ext: 0 }
  ];
  var $ = function (id) { return document.getElementById(id); };
  if (!$('rows')) return;
  var eur = function (v) { var n = Math.round(Math.abs(v)); return (v < 0 ? '−' : '') + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ' €'; };
  var signed = eur;
  var num = function (el, d) { var v = parseFloat(el.value); return isFinite(v) && v >= 0 ? v : (d || 0); };

  $('rows').innerHTML = services.map(function (s) {
    return '<tr id="r-' + s.id + '">' +
      '<td><label class="svc-check"><input type="checkbox" id="on-' + s.id + '" checked><span>' + s.name + '<span class="who">' + s.who + '</span></span></label></td>' +
      '<td class="num" data-label="Horas haciéndolo usted"><input type="number" id="hs-' + s.id + '" min="0" value="' + s.hs + '" inputmode="numeric" aria-label="Horas haciéndolo usted, ' + s.name + '"></td>' +
      '<td class="num" data-label="Abogados">' + (s.ext ? eur(s.ext) + '<span class="who">' + s.legal + '</span>' : '—') + '</td>' +
      '<td class="num" data-label="Coste haciéndolo usted" id="cs-' + s.id + '"></td>' +
      '<td class="num" data-label="Horas con ODLC"><input type="number" id="ho-' + s.id + '" min="0" value="' + s.ho + '" inputmode="numeric" aria-label="Horas con ODLC, ' + s.name + '"></td>' +
      '<td class="num" data-label="Honorarios ODLC">' + eur(s.fee) + '</td>' +
      '<td class="num" data-label="Coste con ODLC" id="co-' + s.id + '"></td></tr>';
  }).join('');

  var last = '';
  function calc() {
    var h = num($('hora'), 90), m = Math.max(1, num($('meses'), 4)), cos = num($('cos'), 75000);
    var HS = 0, XS = 0, HO = 0, FO = 0, N = 0, sel = [];
    services.forEach(function (s) {
      var on = $('on-' + s.id).checked, hs = num($('hs-' + s.id)), ho = num($('ho-' + s.id));
      $('cs-' + s.id).textContent = eur(hs * h + s.ext);
      $('co-' + s.id).textContent = eur(ho * h + s.fee);
      $('r-' + s.id).classList.toggle('off', !on);
      if (on) { HS += hs; XS += s.ext; HO += ho; FO += s.fee; N += s.n; sel.push(s.name); }
    });
    var solo = HS * h + XS, odlc = HO * h + FO, sal = cos * m / 12, cosT = sal + HO * h + XS;
    $('tSolo').textContent = eur(solo); $('hSolo').textContent = HS + ' h · ' + eur(HS * h);
    $('xSolo').textContent = eur(XS); $('iSolo').textContent = N;
    $('tCos').textContent = eur(cosT); $('mesesTxt').textContent = m + (m === 1 ? ' mes' : ' meses');
    $('sCos').textContent = eur(sal); $('hCos').textContent = HO + ' h · ' + eur(HO * h); $('xCos').textContent = eur(XS);
    $('tOdlc').textContent = eur(odlc); $('fOdlc').textContent = eur(FO); $('hOdlc').textContent = HO + ' h · ' + eur(HO * h);
    $('ftHS').textContent = HS + ' h'; $('ftXS').textContent = eur(XS); $('ftCS').textContent = eur(solo);
    $('ftHO').textContent = HO + ' h'; $('ftFO').textContent = eur(FO); $('ftCO').textContent = eur(odlc);

    var vsSolo = solo - odlc, vsCos = cosT - odlc, libres = HS - HO;
    var line = function (label, v) {
      return '<div><b>' + (v >= 0 ? eur(v) + ' menos' : eur(-v) + ' más') + '</b>' + label + '</div>';
    };
    $('saving').innerHTML = line('con ODLC que haciéndolo usted', vsSolo) + line('con ODLC que contratando a un interim', vsCos) +
      '<div><b>' + libres + ' horas</b>libres para su negocio, y 1 interlocutor en lugar de ' + N + '</div>';

    var dia = h * 8, mes = dia * 19.5, ano = mes * 10.5;
    $('horaCalc').textContent = eur(h) + '/hora son ' + eur(dia) + ' al día, unos ' + eur(mes) + ' al mes y unos ' + eur(ano) + ' al año de facturación (8 horas, 19–20 días al mes, 10,5 meses al año).';

    last = 'Calculadora: hora a ' + eur(h) + ', ' + m + (m === 1 ? ' mes' : ' meses') + '. Servicios: ' + (sel.join(', ') || 'ninguno') +
      '. Hacerlo usted: ' + eur(solo) + '. Interim: ' + eur(cosT) + '. Con ODLC: ' + eur(odlc) + ' (' + signed(vsSolo) + ' frente a hacerlo usted, ' + libres + ' h libres).';
    var b = $('calc-book');
    if (b && !b.getAttribute('data-external')) b.href = 'reservar-sesion.html?calc=' + encodeURIComponent(last);
  }
  document.addEventListener('input', calc);
  document.addEventListener('change', calc);
  calc();
})();
