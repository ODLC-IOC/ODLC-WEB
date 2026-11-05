/* Panel privado de reuniones OdlC. No contiene credenciales: todas las operaciones
   pasan por /api/..., que comprueba la sesión en el servidor. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var form = $('#meeting'), list = $('#list'), filter = 'proxima', meetings = [], current = null, ms = {};

  function api(path, opts) {
    opts = opts || {};
    return fetch('/api' + path, {
      method: opts.method || 'GET', credentials: 'same-origin',
      headers: opts.body ? { 'Content-Type': 'application/json' } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined
    }).then(function (r) {
      if (r.status === 401) { location.replace('/reuniones'); throw new Error('Sesión caducada'); }
      return r.json().catch(function () { return {}; }).then(function (d) { if (!r.ok) { var e = new Error(d.error || 'Error ' + r.status); e.fields = d.fields; throw e; } return d; });
    });
  }

  function msg(el, text, kind) { el.textContent = text || ''; el.className = 'p-msg' + (kind ? ' ' + kind : ''); }

  /* ---------- Microsoft 365 ---------- */
  function loadMs() {
    return api('/ms/estado').then(function (s) {
      ms = s;
      var t = $('#ms-text'), c = $('#ms-connect'), d = $('#ms-disconnect'), auto = $('#mode-auto');
      c.hidden = d.hidden = true;
      if (!s.configured) { t.textContent = 'Modo automático no configurado todavía (faltan las claves de Microsoft Entra ID). El modo manual funciona.'; auto.disabled = true; }
      else if (!s.connected) { t.textContent = 'Sin conectar. Conecta tu cuenta ' + (s.adminEmail || '') + ' para crear reuniones de Teams automáticamente.'; c.hidden = false; auto.disabled = true; }
      else if (!s.teams) { t.textContent = 'Conectado como ' + s.account + ', pero tu calendario no admite reuniones de Teams (proveedores: ' + ((s.providers || []).join(', ') || 'ninguno') + '). Usa el modo manual.'; d.hidden = false; auto.disabled = true; }
      else { t.textContent = 'Conectado como ' + s.account + '. Outlook y Teams disponibles.'; d.hidden = false; auto.disabled = false; }
      if (auto.disabled && auto.checked) { $('input[name=mode][value=manual]').checked = true; }
      syncMode();
    }).catch(function () { $('#ms-text').textContent = 'No se ha podido comprobar la conexión.'; });
  }
  $('#ms-disconnect').addEventListener('click', function () {
    api('/ms/desconectar', { method: 'POST', body: {} }).then(loadMs);
  });

  function syncMode() {
    var auto = form.mode.value === 'auto';
    var editingAuto = current && current.mode === 'auto';
    $('#teams-field').hidden = auto || editingAuto;
    $('#invite-field').hidden = !(auto || editingAuto);
    $$('input[name=mode]').forEach(function (r) { r.disabled = !!current || (r.value === 'auto' && !(ms.connected && ms.teams)); });
  }
  $$('input[name=mode]').forEach(function (r) { r.addEventListener('change', syncMode); });

  /* ---------- Formulario ---------- */
  function today() { var d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); }
  form.date.min = today();

  function clearErrors() { $$('[aria-invalid]', form).forEach(function (e) { e.removeAttribute('aria-invalid'); }); $$('.p-err', form).forEach(function (e) { e.remove(); }); }
  function showErrors(fields) {
    Object.keys(fields || {}).forEach(function (k) {
      var input = form.elements[k]; if (!input) return;
      input.setAttribute('aria-invalid', 'true');
      var s = document.createElement('small'); s.className = 'p-err'; s.style.color = '#9B3127'; s.textContent = fields[k];
      input.parentNode.appendChild(s);
    });
    var first = $('[aria-invalid=true]', form); if (first) first.focus();
  }

  function payload() {
    return {
      mode: form.mode.value, guestName: form.guestName.value, guestEmail: form.guestEmail.value, guestPhone: form.guestPhone.value, team: form.team.value,
      subject: form.subject.value, date: form.date.value, time: form.time.value, duration: Number(form.duration.value),
      teamsUrl: form.teamsUrl.value, description: form.description.value, notes: form.notes.value, sendInvite: form.sendInvite.checked
    };
  }

  function localValidate(p) {
    var f = {};
    if (!p.subject.trim()) f.subject = 'Escribe el asunto.';
    if (!p.date) f.date = 'Elige una fecha.';
    if (!p.time) f.time = 'Elige una hora.';
    if (p.guestEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.guestEmail)) f.guestEmail = 'El correo no es válido.';
    var needsTeams = (current ? current.mode : p.mode) === 'manual';
    if (needsTeams && !/^https:\/\/([a-z0-9-]+\.)*(teams\.microsoft\.com|teams\.live\.com|teams\.cloud\.microsoft)\//i.test(p.teamsUrl.trim())) f.teamsUrl = 'Pega un enlace de Microsoft Teams válido (https://teams.microsoft.com/…).';
    if (p.mode === 'auto' && p.sendInvite && !p.guestEmail) f.guestEmail = 'Para enviar la convocatoria por correo, escribe el correo del invitado.';
    return f;
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault(); clearErrors();
    var p = payload(), m = $('#form-msg'), errs = localValidate(p);
    if (Object.keys(errs).length) { showErrors(errs); msg(m, 'Revisa los campos marcados.', 'err'); return; }
    var btn = $('#save'); btn.disabled = true;
    msg(m, p.mode === 'auto' && !current ? 'Creando el evento en Outlook y la reunión de Teams…' : 'Guardando…');
    var req = current ? api('/reuniones/' + current.id, { method: 'PUT', body: p }) : api('/reuniones', { method: 'POST', body: p });
    var wasEditing = !!current;
    req.then(function (d) { return uploadMaterials(d.meeting, m); }).then(function (meeting) {
      msg(m, wasEditing ? 'Cambios guardados.' : 'Invitación creada.', 'ok');
      showResult(meeting, wasEditing); resetForm(true); loadList();
    }).catch(function (err) { showErrors(err.fields); msg(m, err.message, 'err'); })
      .then(function () { btn.disabled = false; });
  });

  /* ---------- Importar desde Outlook (.ics) y pegar invitación de Teams ---------- */
  var TEAMS_RE = /https:\/\/(?:[a-z0-9-]+\.)*(?:teams\.microsoft\.com|teams\.live\.com|teams\.cloud\.microsoft)\/[^\s<>"'\\)]+/i;
  function teamsFrom(text) { var mm = String(text || '').replace(/\\n/g, ' ').match(TEAMS_RE); return mm ? mm[0].replace(/[.,;]+$/, '') : ''; }
  form.teamsUrl.addEventListener('paste', function () {
    var input = this; setTimeout(function () { var u = teamsFrom(input.value); if (u && u !== input.value) input.value = u; }, 0);
  });
  form.teamsUrl.addEventListener('change', function () { var u = teamsFrom(this.value); if (u) this.value = u; });

  function icsUnescape(v) { return v.replace(/\\n/gi, '\n').replace(/\\([,;\\])/g, '$1'); }
  function parseIcs(text) {
    var lines = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/), ev = null, inEv = false;
    lines.forEach(function (l) {
      if (l === 'BEGIN:VEVENT' && !ev) { inEv = true; ev = {}; return; }
      if (l === 'END:VEVENT') { inEv = false; return; }
      if (!inEv) return;
      var i = l.indexOf(':'); if (i < 0) return;
      var head = l.slice(0, i), val = l.slice(i + 1), name = head.split(';')[0].toUpperCase();
      if (!(name in ev)) ev[name] = { params: head, value: val };
    });
    return ev;
  }
  // Devuelve la hora de Madrid (AAAA-MM-DD, HH:MM) de un DTSTART/DTEND del .ics
  function icsToMadrid(p) {
    var v = p.value, m = v.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/); if (!m) return null;
    var utc;
    if (/Z$/.test(v)) utc = Date.UTC(+m[1], m[2] - 1, +m[3], +m[4] || 0, +m[5] || 0);
    else {
      var tz = (p.params.match(/TZID=("?)([^;:"]+)\1/i) || [])[2] || 'Europe/Madrid';
      var iana = /romance|madrid|w\. europe|central europe|paris|brussels/i.test(tz) ? 'Europe/Madrid' : /gmt standard|london|dublin|lisbon/i.test(tz) ? 'Europe/London' : /utc|greenwich/i.test(tz) ? 'UTC' : tz;
      var naive = Date.UTC(+m[1], m[2] - 1, +m[3], +m[4] || 0, +m[5] || 0);
      try { utc = naive - offset(naive, iana); utc = naive - offset(utc, iana); } catch (e) { utc = naive - offset(naive, 'Europe/Madrid'); }
    }
    var f = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Madrid', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(utc)).reduce(function (o, x) { o[x.type] = x.value; return o; }, {});
    return { date: f.year + '-' + f.month + '-' + f.day, time: f.hour + ':' + f.minute, utc: utc };
  }
  function offset(ms, tz) {
    var f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }).formatToParts(new Date(ms)).reduce(function (o, x) { o[x.type] = x.value; return o; }, {});
    return Date.UTC(+f.year, f.month - 1, +f.day, +f.hour % 24, +f.minute, +f.second) - ms;
  }
  $('#ics-file').addEventListener('change', function () {
    var file = this.files[0], input = this, m = $('#form-msg'); if (!file) return;
    file.text().then(function (text) {
      var ev = parseIcs(text);
      if (!ev || !ev.DTSTART) throw new Error('El archivo no contiene una reunión.');
      var s = icsToMadrid(ev.DTSTART), e = ev.DTEND ? icsToMadrid(ev.DTEND) : null;
      if (!s) throw new Error('No se ha podido leer la fecha.');
      if (ev.SUMMARY) form.subject.value = icsUnescape(ev.SUMMARY.value).slice(0, 160);
      form.date.value = s.date; form.time.value = s.time;
      if (e) {
        var mins = Math.round((e.utc - s.utc) / 60000), opts = [15, 30, 45, 60, 90];
        form.duration.value = String(opts.reduce(function (a, b) { return Math.abs(b - mins) < Math.abs(a - mins) ? b : a; }));
      }
      var link = teamsFrom((ev['X-MICROSOFT-SKYPETEAMSMEETINGURL'] || {}).value) || teamsFrom((ev.LOCATION || {}).value) || teamsFrom((ev.URL || {}).value) || teamsFrom((ev.DESCRIPTION || {}).value) || teamsFrom(text);
      if (link) { $('input[name=mode][value=manual]').checked = true; syncMode(); form.teamsUrl.value = link; }
      if (ev.DESCRIPTION && !form.description.value) {
        var d = icsUnescape(ev.DESCRIPTION.value).split(/_{10,}|Reunión de Microsoft Teams|Microsoft Teams meeting/i)[0].trim();
        if (d) form.description.value = d.slice(0, 2000);
      }
      msg(m, 'Reunión importada de Outlook' + (link ? ' con su enlace de Teams' : ' (no se ha encontrado enlace de Teams: pégalo a mano)') + '. Revisa los datos y pulsa Crear invitación.', link ? 'ok' : 'err');
    }).catch(function (err) { msg(m, err.message || 'No se ha podido leer el archivo.', 'err'); })
      .then(function () { input.value = ''; });
  });

  /* ---------- Materiales ---------- */
  var fileInput = $('#files'), matsEl = $('#mats');
  function fmtSize(b) { return b < 1048576 ? Math.max(1, Math.round(b / 1024)) + ' KB' : (b / 1048576).toFixed(1).replace('.', ',') + ' MB'; }
  function renderMats() {
    matsEl.innerHTML = '';
    (current && current.materials || []).forEach(function (f) {
      var li = el('li'); li.appendChild(el('span', null, (f.kind === 'link' ? 'Enlace · ' : '') + f.name + (f.size ? ' · ' + fmtSize(f.size) : '')));
      li.appendChild(btn('Quitar', 'x', function () {
        api('/reuniones/' + current.id + '/materiales/' + f.id, { method: 'DELETE' }).then(function (d) { current.materials = d.meeting.materials; renderMats(); loadList(); })
          .catch(function (e) { msg($('#form-msg'), e.message, 'err'); });
      }));
      li.lastChild.className = ''; matsEl.appendChild(li);
    });
    Array.prototype.forEach.call(fileInput.files, function (f) {
      var li = el('li'); li.appendChild(el('span', null, f.name + ' · ' + fmtSize(f.size) + (f.size > 4194304 ? ' · supera 4 MB' : ' · se subirá al guardar'))); matsEl.appendChild(li);
    });
  }
  fileInput.addEventListener('change', renderMats);
  function uploadMaterials(meeting, m) {
    var files = Array.prototype.slice.call(fileInput.files), url = $('#mat-url').value.trim(), name = $('#mat-name').value.trim();
    var chain = Promise.resolve(meeting), errors = [];
    files.forEach(function (f, i) {
      chain = chain.then(function (cur) {
        msg(m, 'Subiendo material ' + (i + 1) + ' de ' + files.length + '…');
        return fetch('/api/reuniones/' + meeting.id + '/materiales', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': f.type || 'application/octet-stream', 'X-File-Name': encodeURIComponent(f.name) }, body: f })
          .then(function (r) { return r.json().then(function (d) { if (!r.ok) { errors.push(f.name + ': ' + (d.error || r.status)); return cur; } return d.meeting; }); });
      });
    });
    if (url) chain = chain.then(function (cur) {
      return api('/reuniones/' + meeting.id + '/materiales', { method: 'POST', body: { url: url, name: name } }).catch(function (e) { errors.push(e.message); return { meeting: cur }; }).then(function (d) { return d.meeting || cur; });
    });
    return chain.then(function (cur) { if (errors.length) setTimeout(function () { msg($('#result-msg'), 'No se han podido añadir: ' + errors.join(' · '), 'err'); }, 50); return cur; });
  }

  function resetForm(keepMsg) {
    current = null; form.reset(); form.id.value = ''; form.team.value = form.team.dataset.default; clearErrors(); fileInput.value = ''; renderMats();
    $('#form-title').textContent = 'Nueva reunión'; $('#save').textContent = 'Crear invitación'; $('#cancel-edit').hidden = true;
    if (!keepMsg) msg($('#form-msg'), '');
    syncMode();
  }
  $('#cancel-edit').addEventListener('click', function () { resetForm(); });

  function edit(m) {
    current = m; clearErrors();
    form.id.value = m.id;
    $$('input[name=mode]').forEach(function (r) { r.checked = r.value === m.mode; });
    ['guestName', 'guestEmail', 'guestPhone', 'subject', 'teamsUrl', 'description', 'notes'].forEach(function (k) { form[k].value = m[k] || ''; });
    form.team.value = (m.team && m.team.length ? m.team : [form.team.dataset.default]).join('\n');
    form.date.value = m.local.date; form.time.value = m.local.time; form.duration.value = String(m.duration);
    form.date.removeAttribute('min');
    fileInput.value = ''; renderMats();
    $('#form-title').textContent = 'Editar reunión'; $('#save').textContent = 'Guardar cambios'; $('#cancel-edit').hidden = false;
    syncMode();
    form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------- Resultado y WhatsApp ---------- */
  var shown = null;
  function waHref(m, text) {
    var phone = (m.guestPhone || '').replace(/\D/g, '');
    if (phone.length === 9) phone = '34' + phone;
    return 'https://wa.me/' + phone + '?text=' + encodeURIComponent(text);
  }
  function showResult(m, updated) {
    shown = m;
    $('#result').hidden = false;
    $('#result-text').textContent = (updated ? 'Reunión actualizada. ' : '') + m.fecha + ', ' + m.hora + ' h (Madrid) · ' + m.url;
    $('#wa-text').value = updated ? m.whatsappText.replace('Te envío la invitación', 'Te envío la invitación actualizada') : m.whatsappText;
    $('#wa-send').href = waHref(m, $('#wa-text').value);
    $('#open-invite').href = m.url;
    msg($('#result-msg'), '');
    $('#result').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  $('#wa-text').addEventListener('input', function () { if (shown) $('#wa-send').href = waHref(shown, this.value); });
  $('#wa-send').addEventListener('click', function () {
    msg($('#result-msg'), 'WhatsApp se ha abierto con el mensaje preparado. Se enviará cuando pulses Enviar en WhatsApp.', 'ok');
  });

  function copy(text, where) {
    var done = function () { msg(where, 'Copiado.', 'ok'); };
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { var t = document.createElement('textarea'); t.value = text; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); done(); } catch (e) { msg(where, 'No se ha podido copiar.', 'err'); } t.remove(); }
  }
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () { if (shown) copy(b.dataset.copy === 'link' ? shown.url : $('#wa-text').value, $('#result-msg')); });
  });

  /* ---------- Listado ---------- */
  function loadList() {
    return api('/reuniones').then(function (d) { meetings = d.meetings || []; render(); })
      .catch(function (e) { list.innerHTML = ''; var p = document.createElement('p'); p.className = 'p-msg err'; p.textContent = e.message; list.appendChild(p); });
  }
  var LABEL = { proxima: 'Próxima', pasada: 'Pasada', cancelada: 'Cancelada' };
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function btn(text, cls, fn) { var b = el('button', 'p-btn ' + (cls || 'ghost'), text); b.type = 'button'; b.addEventListener('click', fn); return b; }
  function link(text, href, cls) { var a = el('a', 'p-btn ' + (cls || 'ghost'), text); a.href = href; a.target = '_blank'; a.rel = 'noopener'; return a; }

  function render() {
    var items = meetings.filter(function (m) { return filter === 'todas' || m.estado === filter; });
    items.sort(function (a, b) { return filter === 'proxima' ? a.startUtc - b.startUtc : b.startUtc - a.startUtc; });
    list.innerHTML = '';
    if (!items.length) { list.appendChild(el('p', 'p-muted', 'No hay reuniones en esta lista.')); return; }
    items.forEach(function (m) {
      var row = el('article', 'p-item');
      var h = el('h3', null, m.guestName || 'Sin nombre de invitado');
      h.appendChild(el('span', 'p-badge ' + m.estado, LABEL[m.estado]));
      row.appendChild(h);
      row.appendChild(el('p', null, m.subject));
      row.appendChild(el('p', null, m.fecha + ' · ' + m.hora + '–' + m.horaFin + ' h (Madrid) · ' + m.duration + ' min · ' + (m.mode === 'auto' ? 'Outlook + Teams' : 'Enlace manual')));
      if (m.notes) row.appendChild(el('p', null, 'Notas: ' + m.notes));
      if (m.materials && m.materials.length) row.appendChild(el('p', null, 'Materiales: ' + m.materials.map(function (f) { return f.name; }).join(', ')));
      var a = el('div', 'p-actions');
      a.appendChild(link('Abrir invitación', m.url));
      a.appendChild(btn('Copiar enlace', 'ghost', function () { copy(m.url, rowMsg); }));
      if (m.estado !== 'cancelada') {
        a.appendChild(btn('WhatsApp', 'wa', function () { showResult(m, false); }));
        a.appendChild(btn('Editar', 'ghost', function () { edit(m); }));
        var cancel = btn('Cancelar', 'danger', function () {
          if (cancel.dataset.armed) {
            cancel.disabled = true;
            api('/reuniones/' + m.id + '/cancelar', { method: 'POST', body: {} })
              .then(function (d) { loadList(); showResult(d.meeting, false); $('#wa-text').value = d.cancelText; $('#wa-send').href = waHref(d.meeting, d.cancelText); })
              .catch(function (e) { msg(rowMsg, e.message, 'err'); cancel.disabled = false; });
          } else { cancel.dataset.armed = '1'; cancel.textContent = '¿Seguro? Sí, cancelar'; setTimeout(function () { delete cancel.dataset.armed; cancel.textContent = 'Cancelar'; }, 5000); }
        });
        a.appendChild(cancel);
      }
      row.appendChild(a);
      var rowMsg = el('p', 'p-msg'); row.appendChild(rowMsg);
      list.appendChild(row);
    });
  }
  $$('[data-filter]').forEach(function (b) {
    b.addEventListener('click', function () {
      filter = b.dataset.filter;
      $$('[data-filter]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      render();
    });
  });

  $('#logout').addEventListener('click', function () { api('/logout', { method: 'POST', body: {} }).finally(function () { location.replace('/reuniones'); }); });

  var q = new URLSearchParams(location.search);
  if (q.get('ms')) { history.replaceState(null, '', '/reuniones'); var t = $('#ms-text'); setTimeout(function () { if (q.get('ms') !== 'ok') t.textContent = 'No se ha podido conectar: ' + (q.get('detalle') || q.get('ms')); }, 600); }
  loadMs(); loadList();
})();
