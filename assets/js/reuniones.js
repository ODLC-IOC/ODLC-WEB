/* Panel privado de reuniones ODLC. No contiene credenciales: todas las operaciones
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
      mode: form.mode.value, guestName: form.guestName.value, guestEmail: form.guestEmail.value, guestPhone: form.guestPhone.value,
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
    req.then(function (d) {
      msg(m, current ? 'Cambios guardados.' : 'Invitación creada.', 'ok');
      showResult(d.meeting, !!current); resetForm(true); loadList();
    }).catch(function (err) { showErrors(err.fields); msg(m, err.message, 'err'); })
      .then(function () { btn.disabled = false; });
  });

  function resetForm(keepMsg) {
    current = null; form.reset(); form.id.value = ''; clearErrors();
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
    form.date.value = m.local.date; form.time.value = m.local.time; form.duration.value = String(m.duration);
    form.date.removeAttribute('min');
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
