/* Mapa de empresa ODLC: todo se calcula en el navegador; no se envía ni se guarda nada */
(function () {
  var B = [
    {id:'estructura', t:'Estructura', q:[
      ['¿Tiene en un solo documento qué sociedades hay y quién es dueño de cada una, con sus porcentajes?','Hacer el esquema de sociedades y socios en una página.',0],
      ['¿Ha comprobado que ese esquema coincide con lo que figura en el Registro Mercantil?','Pedir notas simples del Registro y comprobar que coinciden con lo que creen.',0]]},
    {id:'gobierno', t:'Gobierno y firmas', q:[
      ['¿Están en vigor los cargos de administrador de todas las sociedades?','Revisar las fechas de nombramiento y renovar los cargos vencidos.',1],
      ['¿Están revocados e inscritos los poderes de las personas que ya no están en la empresa?','Revocar e inscribir los poderes de quien ya no está.',1],
      ['¿Pueden firmar en cada banco al menos dos personas?','Nombrar un segundo autorizado en cada banco.',1]]},
    {id:'bancos', t:'Bancos y financiación', q:[
      ['¿Sabe qué préstamos, avales y garantías tiene vivos cada sociedad y cuándo vencen?','Hacer la lista de financiaciones y avales con su vencimiento.',0],
      ['¿Conoce más de una persona las condiciones y el contacto de cada banco?','Dejar por escrito las condiciones vigentes y el contacto de cada banco.',0]]},
    {id:'calendario', t:'Calendario de obligaciones', q:[
      ['¿Se depositaron en plazo en el Registro las cuentas del último ejercicio?','Depositar las cuentas pendientes: sin depósito, el Registro cierra la hoja registral.',1],
      ['¿Se legalizan los libros cada año antes del 30 de abril?','Legalizar los libros del ejercicio antes del 30 de abril.',0],
      ['¿Hay un calendario de obligaciones con fecha y responsable?','Montar el calendario societario con fecha y responsable.',0]]},
    {id:'documentacion', t:'Documentación', q:[
      ['¿Están escrituras, estatutos, actas y pactos en un solo sitio, con índice?','Reunir la documentación corporativa en un archivo único con índice.',0],
      ['¿Están al día los libros de actas y de socios?','Poner al día los libros de actas y de socios.',0]]},
    {id:'cumplimiento', t:'Cumplimiento y seguros', q:[
      ['¿Está declarada y actualizada la titularidad real de cada sociedad?','Actualizar la titularidad real con el próximo depósito de cuentas.',0],
      ['¿Tiene el registro de actividades de tratamiento de protección de datos?','Preparar el registro de actividades de tratamiento.',0],
      ['¿Ha revisado este año qué cubren sus seguros de D&O, responsabilidad civil y ciberriesgos?','Revisar las pólizas de D&O, responsabilidad civil y ciberriesgos.',0]]},
    {id:'conocimiento', t:'Conocimiento crítico', q:[
      ['¿Cada función imprescindible la conocen al menos dos personas?','Nombrar un suplente para cada función imprescindible.',0],
      ['¿Están escritos los procesos clave: pagos, nóminas, impuestos y cuentas?','Escribir los procedimientos clave, una página cada uno.',0]]},
    {id:'accesos', t:'Accesos y copias', q:[
      ['¿Hay una copia de seguridad semanal, desconectada y guardada fuera de la oficina, además de la nube?','Empezar una copia semanal en disco, desconectada y fuera de la oficina.',1],
      ['¿Ha probado este año que esa copia se puede restaurar?','Probar a restaurar la copia y apuntar la fecha.',1],
      ['¿Hay gestor de contraseñas de empresa y dos personas con acceso a banca, Hacienda, Seguridad Social y certificado digital?','Implantar un gestor de contraseñas de empresa y un segundo acceso a cada servicio.',0]]},
    {id:'asesores', t:'Asesores y proveedores', q:[
      ['¿Sabe quién es su interlocutor en gestoría, abogados, notaría e informática, y qué contrato tiene con cada uno?','Hacer la lista de asesores con su contacto, su alcance y su contrato.',0]]}
  ];
  var form = document.getElementById('mapa-form'); if (!form) return;
  var html = '', n = 0;
  B.forEach(function (b, bi) {
    html += '<fieldset class="mp-block"><legend><span>' + (bi + 1) + '</span> ' + b.t + '</legend>';
    b.q.forEach(function (q, qi) {
      var name = b.id + qi; n++;
      html += '<div class="mp-q"><p>' + q[0] + '</p><div class="mp-opts" role="radiogroup">' +
        ['si:Sí', 'no:No', 'ns:No lo sé'].map(function (o) { var v = o.split(':'); return '<label><input type="radio" name="' + name + '" value="' + v[0] + '"><span>' + v[1] + '</span></label>'; }).join('') +
        '</div></div>';
    });
    html += '</fieldset>';
  });
  document.getElementById('mapa-preguntas').innerHTML = html;
  var prog = document.getElementById('mapa-progreso');
  function count() { var c = form.querySelectorAll('input[type=radio]:checked').length; prog.textContent = c + ' de ' + n + ' respondidas'; return c; }
  form.addEventListener('change', count); count();

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var rows = '', crit = [], rest = [], unknown = 0, sum = [];
    B.forEach(function (b) {
      var yes = 0, badCrit = false;
      b.q.forEach(function (q, qi) {
        var c = form.querySelector('input[name="' + b.id + qi + '"]:checked'), v = c ? c.value : 'ns';
        if (v === 'si') { yes++; return; }
        if (v === 'ns') unknown++;
        (q[2] ? crit : rest).push(q[1] + (v === 'ns' ? ' <em>(no lo sabe: compruébelo primero)</em>' : ''));
        if (q[2]) badCrit = true;
      });
      var st = yes === b.q.length ? 'v' : (badCrit || yes === 0 ? 'r' : 'a');
      var lbl = {v:'Verde', a:'Ámbar', r:'Rojo'}[st];
      var why = st === 'v' ? 'Está, al día y no depende de una sola persona.' : st === 'a' ? 'Está, pero falta algo.' : (badCrit ? 'Hay un punto que puede bloquear o generar responsabilidad.' : 'No está o no se sabe.');
      rows += '<tr><td>' + b.t + '</td><td><span class="mp-pill mp-' + st + '">' + lbl + '</span></td><td>' + why + '</td></tr>';
      sum.push(b.t + ': ' + lbl);
    });
    var all = crit.concat(rest), top = all.slice(0, 5), later = all.slice(5);
    var name = (document.getElementById('mapa-nombre').value || '').trim() || 'Su empresa';
    var d = new Date().toLocaleDateString('es-ES', {day:'numeric', month:'long', year:'numeric'});
    var out = '<h2>Mapa de empresa · ' + name.replace(/[<>&]/g, '') + '</h2><p class="mp-date">' + d + '</p>' +
      '<h3>Semáforo</h3><div class="mp-scroll"><table class="mp-table"><thead><tr><th>Bloque</th><th>Estado</th><th>Por qué</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    if (top.length) {
      out += '<h3>Sus cinco prioridades</h3><ol class="mp-prio">' + top.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ol>';
      if (later.length) out += '<h3>Después</h3><ul class="mp-later">' + later.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>';
    } else out += '<h3>Prioridades</h3><p>Todo en verde. Mantenga los hábitos y revise el mapa una vez al año.</p>';
    if (unknown) out += '<p class="mp-note">Ha respondido «no lo sé» ' + unknown + (unknown === 1 ? ' vez' : ' veces') + '. Suele ser el hallazgo más útil: lo que nadie sabe es lo que falla el día que hace falta.</p>';
    out += '<p class="mp-note">Próxima revisión: dentro de un año o después de cualquier salida importante u operación. El mapa es una herramienta de orden, no asesoramiento jurídico.</p>' +
      '<div class="mp-actions"><button type="button" class="btn btn-ghost" id="mapa-print">Guardar en PDF o imprimir</button><a class="btn btn-primary" id="mapa-book" href="reservar-sesion.html">Revisarlo con ODLC en una sesión gratuita</a><a class="btn btn-ghost" id="mapa-send" href="reservar-sesion.html">Enviarnos el resultado por escrito</a></div>';
    if (window.odlcTrack) window.odlcTrack('mapa_completado', { rojos: (rows.match(/mp-r"/g) || []).length, no_lo_se: unknown });
    var res = document.getElementById('mapa-resultado'); res.innerHTML = out; res.hidden = false;
    var msg = 'Mapa de empresa (' + d + '): ' + sum.join(' · ') + (top.length ? '. Prioridades: ' + top.map(function (t) { return t.replace(/<[^>]+>/g, ''); }).join(' / ') : '');
    var bk = document.getElementById('mapa-book');
    var formUrl = 'reservar-sesion.html?calc=' + encodeURIComponent(msg);
    document.getElementById('mapa-send').href = formUrl;
    if (window.CALENDAR_URL) { bk.href = window.CALENDAR_URL; bk.target = '_blank'; bk.rel = 'noopener'; } else bk.href = formUrl;
    document.getElementById('mapa-print').addEventListener('click', function () { window.print(); });
    res.scrollIntoView({behavior: 'smooth', block: 'start'});
  });
})();
