// HTML generado en el servidor: invitación pública, página no encontrada, acceso y panel privado.
import { esc } from './http.mjs';
import { ODLC, SITE_URL } from './config.mjs';
import { fechaLarga, horaCorta, zonaTexto, calendarLinks, estado } from './meeting.mjs';

const V = '20261105';

function head({ title, description = '', ogUrl = '', robots = 'noindex, nofollow', og = true }) {
  const site = SITE_URL();
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
${description ? `<meta name="description" content="${esc(description)}">` : ''}
<meta name="robots" content="${robots}">
<meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#17302A">
${og ? `<meta property="og:type" content="website">
<meta property="og:locale" content="es_ES">
<meta property="og:site_name" content="OdlC">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
${ogUrl ? `<meta property="og:url" content="${esc(ogUrl)}">` : ''}
<meta property="og:image" content="${site}/assets/img/og/invitacion-odlc.png">
<meta property="og:image:secure_url" content="${site}/assets/img/og/invitacion-odlc.png">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="OdlC · Invitación a reunión">
<meta name="twitter:card" content="summary_large_image">` : ''}
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/lora-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/styles.css?v=20261104">
<link rel="stylesheet" href="/assets/css/tarjeta.css?v=${V}">
</head>`;
}

const ICO = {
  teams: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="m16 10.5 5-3v9l-5-3"/></svg>',
  cal: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="3.5" y="5" width="17" height="15.5" rx="1.5"/><path d="M3.5 9.5h17M8 3v4M16 3v4M12 12.5v5M9.5 15h5"/></svg>',
};

function cardShell(inner, kicker = 'Invitación a reunión') {
  return `<body class="t-page">
<main class="t-card">
  <header class="t-head">
    <img src="/assets/img/logo-odlc-claro.svg" alt="OdlC" width="230" height="75">
    <p class="t-kicker">${esc(kicker)}</p>
  </header>
  <section class="t-body">${inner}
    <p class="t-foot">OdlC · <a href="${ODLC.web}">odlc.es</a></p>
  </section>
</main>
</body>
</html>`;
}

export function invitationPage(m) {
  const st = estado(m);
  const links = calendarLinks(m);
  const fecha = new Intl.DateTimeFormat('es-ES', { timeZone: ODLC.tz, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(m.startUtc)).replace('.', '');
  const dia = fechaLarga(m.startUtc).split(',')[0];
  const zona = zonaTexto(m.startUtc).match(/\((.+)\)/)[1];
  const status = st === 'cancelada'
    ? '<p class="r-status cancelada">Reunión cancelada</p>'
    : st === 'pasada' ? '<p class="r-status pasada">Reunión ya celebrada</p>' : '';
  const join = st === 'proxima' && m.teamsUrl
    ? `<a class="t-btn" href="${esc(m.teamsUrl)}" target="_blank" rel="noopener noreferrer">${ICO.teams}Unirse a la reunión</a>`
    : '';
  const cal = st === 'cancelada'
    ? `<a class="t-btn t-light" href="${esc(links.ics)}">${ICO.cal}Actualizar mi calendario</a>`
    : st === 'proxima' ? `<details class="r-cal">
      <summary class="t-btn t-light">${ICO.cal}Añadir al calendario</summary>
      <div class="r-sheet" role="dialog" aria-label="Elegir calendario">
        <p class="r-sheet-t">¿En qué calendario?</p>
        <div class="r-opts">
          <a href="${esc(links.outlookWork)}" target="_blank" rel="noopener noreferrer"><b>Outlook</b><span>Microsoft 365</span></a>
          <a href="${esc(links.google)}" target="_blank" rel="noopener noreferrer"><b>Google</b><span>Calendar</span></a>
          <a href="${esc(links.ics)}"><b>Apple</b><span>iPhone · Mac</span></a>
          <a href="${esc(links.outlookPersonal)}" target="_blank" rel="noopener noreferrer"><b>Outlook.com</b><span>Hotmail</span></a>
        </div>
        <a class="r-other" href="${esc(links.ics)}" download="reunion-odlc.ics">Otro calendario · descargar .ics</a>
      </div>
    </details>` : '';
  const inner = `
    ${status}
    <p class="r-eyebrow">Reunión con OdlC</p>
    <h1 class="r-title">${esc(m.subject)}</h1>
    <p class="r-guest">${esc(ODLC.nombre)}${m.guestName ? ` · para ${esc(m.guestName)}` : ''}</p>
    <dl class="r-grid">
      <div><dt>Fecha</dt><dd>${esc(fecha)}</dd><dd class="r-s">${esc(dia)}</dd></div>
      <div><dt>Hora</dt><dd>${esc(horaCorta(m.startUtc))} h</dd><dd class="r-s">hasta las ${esc(horaCorta(m.endUtc))}</dd></div>
      <div><dt>Zona</dt><dd>Madrid</dd><dd class="r-s">${esc(zona)}</dd></div>
      <div><dt>Duración</dt><dd>${m.duration} min</dd><dd class="r-s">Microsoft Teams</dd></div>
    </dl>
    ${m.description ? `<p class="r-desc">${esc(m.description).replace(/\n/g, '<br>')}</p>` : ''}
    ${join}
    ${cal}`;
  return head({
    title: 'Invitación a reunión · OdlC',
    description: 'Consulte la invitación, únase por Microsoft Teams y añádala a su calendario.',
    ogUrl: `${SITE_URL()}/r/${m.id}`,
  }) + cardShell(inner);
}

export function notFoundPage() {
  return head({ title: 'Invitación no disponible · OdlC', og: false }) + cardShell(`
    <h1 class="r-title">Invitación no disponible</h1>
    <p class="r-sub" style="margin-top:10px">El enlace no es correcto o la invitación ya no existe. Si necesita ayuda, escriba a <a href="mailto:${ODLC.email}">${ODLC.email}</a>.</p>`, 'OdlC');
}

// ---------- Panel privado ----------
function panelHead(title) {
  return head({ title, og: false });
}

export function loginPage({ missing = [] } = {}) {
  const warn = missing.length
    ? `<p class="p-msg err">Falta configurar en Netlify: ${missing.map(esc).join(', ')}. El acceso está desactivado hasta entonces.</p>`
    : '';
  return panelHead('Acceso · Reuniones OdlC') + `<body class="p-page">
<header class="p-top"><div class="wrap"><img src="/assets/img/logo-odlc-claro.svg" alt="OdlC" width="96" height="31"><span>Área privada</span></div></header>
<main class="p-main">
  <section class="p-box p-login">
    <h1>Reuniones</h1>
    <p class="p-muted">Acceso reservado.</p>
    ${warn}
    <form id="login" novalidate>
      <div class="p-field"><label for="email">Correo</label><input id="email" name="email" type="email" autocomplete="username" required></div>
      <div class="p-field" style="margin-top:14px"><label for="password">Contraseña</label><input id="password" name="password" type="password" autocomplete="current-password" required></div>
      <div class="p-actions"><button class="p-btn" type="submit" ${missing.length ? 'disabled' : ''}>Entrar</button></div>
      <p class="p-msg err" id="login-msg" role="alert"></p>
    </form>
  </section>
</main>
<script>
document.getElementById('login').addEventListener('submit', async function (e) {
  e.preventDefault();
  var msg = document.getElementById('login-msg'), btn = this.querySelector('button');
  msg.textContent = ''; btn.disabled = true;
  try {
    var r = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin',
      body: JSON.stringify({ email: this.email.value, password: this.password.value }) });
    var d = await r.json().catch(function () { return {}; });
    if (r.ok) { location.replace('/reuniones'); return; }
    msg.textContent = d.error || 'No se ha podido entrar.';
  } catch (err) { msg.textContent = 'Sin conexión. Inténtalo de nuevo.'; }
  btn.disabled = false;
});
</script>
</body></html>`;
}

export function panelPage() {
  return panelHead('Reuniones · OdlC') + `<body class="p-page">
<header class="p-top"><div class="wrap"><img src="/assets/img/logo-odlc-claro.svg" alt="OdlC" width="96" height="31"><span>Reuniones</span><button type="button" id="logout">Salir</button></div></header>
<main class="p-main">

  <section class="p-box" id="ms-box">
    <div class="p-ms">
      <div><h2>Microsoft 365</h2><p class="p-muted" id="ms-text" style="margin:0">Comprobando…</p></div>
      <div class="p-actions" style="margin:0"><a class="p-btn ghost" id="ms-connect" href="/api/ms/conectar" hidden>Conectar con Microsoft 365</a><button class="p-btn ghost" id="ms-disconnect" type="button" hidden>Desconectar</button></div>
    </div>
  </section>

  <section class="p-box">
    <h1 id="form-title">Nueva reunión</h1>
    <p class="p-muted">Hora de Madrid (Europe/Madrid). Los campos con * son obligatorios.</p>
    <form id="meeting" novalidate>
      <input type="hidden" name="id">
      <div class="p-mode" role="radiogroup" aria-label="Enlace de Teams">
        <label><input type="radio" name="mode" value="manual" checked><span><b>Pegar enlace de Teams</b>Creo la reunión en Outlook o Teams y pego aquí su enlace.</span></label>
        <label><input type="radio" name="mode" value="auto" id="mode-auto"><span><b>Crear en Outlook y Teams</b>El sistema crea el evento en mi calendario y trae el enlace real.</span></label>
      </div>
      <div class="p-grid" style="margin-top:18px">
        <div class="p-field"><label for="guestName">Nombre del invitado</label><input id="guestName" name="guestName" maxlength="120" autocomplete="off"><small>Aparece en el saludo y en la invitación.</small></div>
        <div class="p-field"><label for="guestEmail">Correo del invitado</label><input id="guestEmail" name="guestEmail" type="email" maxlength="160" autocomplete="off"><small>Opcional si solo lo envías por WhatsApp. No aparece en la invitación.</small></div>
        <div class="p-field"><label for="guestPhone">Móvil del invitado</label><input id="guestPhone" name="guestPhone" type="tel" maxlength="30" autocomplete="off" placeholder="+34 600 000 000"><small>Opcional: abre WhatsApp directamente en su chat.</small></div>
        <div class="p-field"><label for="subject">Asunto *</label><input id="subject" name="subject" maxlength="160" required></div>
        <div class="p-field"><label for="date">Fecha *</label><input id="date" name="date" type="date" required></div>
        <div class="p-field"><label for="time">Hora *</label><input id="time" name="time" type="time" step="300" required></div>
        <div class="p-field"><label for="duration">Duración *</label><select id="duration" name="duration"><option value="15">15 minutos</option><option value="30">30 minutos</option><option value="45">45 minutos</option><option value="60" selected>60 minutos</option><option value="90">90 minutos</option></select></div>
        <div class="p-field"><label for="tz">Zona horaria</label><input id="tz" value="Europe/Madrid (Madrid)" readonly></div>
        <div class="p-field full" id="teams-field"><label for="teamsUrl">Enlace de Microsoft Teams *</label><input id="teamsUrl" name="teamsUrl" type="url" inputmode="url" placeholder="https://teams.microsoft.com/l/meetup-join/…"></div>
        <div class="p-field full" id="invite-field" hidden><label><input type="checkbox" name="sendInvite" style="width:auto;margin-right:8px">Enviar también la convocatoria de Outlook al correo del invitado</label></div>
        <div class="p-field full"><label for="description">Descripción para el invitado</label><textarea id="description" name="description" maxlength="2000"></textarea><small>Aparece en la invitación y en su calendario. No escribas información confidencial.</small></div>
        <div class="p-field full"><label for="notes">Notas privadas</label><textarea id="notes" name="notes" maxlength="2000"></textarea><small>Solo las ves tú en este panel.</small></div>
      </div>
      <div class="p-actions"><button class="p-btn" type="submit" id="save">Crear invitación</button><button class="p-btn ghost" type="button" id="cancel-edit" hidden>Cancelar edición</button></div>
      <p class="p-msg" id="form-msg" role="status"></p>
    </form>
  </section>

  <section class="p-box p-result" id="result" hidden>
    <h2>Invitación lista</h2>
    <p class="p-muted" id="result-text"></p>
    <label class="p-field" for="wa-text" style="display:block"><span style="font-size:12px;font-weight:600;color:var(--green)">Mensaje de WhatsApp (puedes retocarlo antes de enviarlo)</span></label>
    <div class="p-field"><textarea id="wa-text" rows="14"></textarea></div>
    <div class="p-actions">
      <a class="p-btn wa" id="wa-send" href="#" target="_blank" rel="noopener">Enviar por WhatsApp</a>
      <a class="p-btn ghost" id="open-invite" href="#" target="_blank" rel="noopener">Abrir invitación</a>
      <button class="p-btn ghost" type="button" data-copy="link">Copiar enlace</button>
      <button class="p-btn ghost" type="button" data-copy="msg">Copiar mensaje</button>
    </div>
    <p class="p-msg ok" id="result-msg" role="status"></p>
  </section>

  <section class="p-box">
    <h2>Mis reuniones</h2>
    <div class="p-tabs" role="group" aria-label="Filtrar">
      <button type="button" data-filter="proxima" aria-pressed="true">Próximas</button>
      <button type="button" data-filter="pasada" aria-pressed="false">Pasadas</button>
      <button type="button" data-filter="cancelada" aria-pressed="false">Canceladas</button>
      <button type="button" data-filter="todas" aria-pressed="false">Todas</button>
    </div>
    <div id="list"><p class="p-muted">Cargando…</p></div>
  </section>
</main>
<script src="/assets/js/reuniones.js?v=${V}" defer></script>
</body></html>`;
}
