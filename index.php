<?php
// gestion.odlc.es — área de gestión de Isabel y portal de cada cliente. Todo pasa por aquí (ver .htaccess).
declare(strict_types=1);
require __DIR__ . '/_app/lib.php';
$CAT = require __DIR__ . '/_app/catalogo.php';
$SERV = $CAT['servicios']; $CLI = $CAT['clientes'];
const MIME = ['html' => 'text/html; charset=utf-8', 'pdf' => 'application/pdf', 'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'png' => 'image/png', 'jpg' => 'image/jpeg'];
$path = '/' . trim((string)parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
g_headers();

// ---------- Iconos y maqueta ----------
const ICO = [
 'inicio' => '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
 'presentaciones' => '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4M8 20h8"/>',
 'corporate' => '<path d="M4 21V8l8-5 8 5v13"/><path d="M9 21v-6h6v6M4 21h16"/>',
 'compliance' => '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
 'branding' => '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.5-1.6 0-1.3-1-1.7-1-2.9 0-.9.7-1.5 1.6-1.5H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1"/><circle cx="11" cy="7.5" r="1"/><circle cx="15.5" cy="8.5" r="1"/>',
 'contabilidad' => '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
 'estrategia' => '<path d="M3 17l6-6 4 4 8-8"/><path d="M15 7h6v6"/>',
 'tecnologia' => '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4"/>',
 'seguros' => '<path d="M3 12a9 9 0 0 1 18 0z"/><path d="M12 12v7a2 2 0 0 1-4 0"/>',
 'clientes' => '<path d="M10 14a4 4 0 0 1 0-5.6l3-3a4 4 0 0 1 5.6 5.6l-1.5 1.5"/><path d="M14 10a4 4 0 0 1 0 5.6l-3 3a4 4 0 0 1-5.6-5.6l1.5-1.5"/>',
 'admin' => '<path d="M6 3h9l4 4v14H6z"/><path d="M15 3v4h4M9 12h7M9 16h5"/><circle cx="9" cy="8" r="0.6"/>',
 'salir' => '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
];
function ico(string $k): string { return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . (ICO[$k] ?? '') . '</svg>'; }

function html_page(string $title, string $body, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: text/html; charset=utf-8');
    header('X-Frame-Options: DENY');
    echo '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' . esc($title) . '</title>'
      . '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500&family=Poppins:wght@400;500;600&display=swap"><style>' . CSS . '</style></head><body>' . $body
      . '<script>function cp(id,b){var t=document.getElementById(id).textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent="Copiado"},function(){var r=document.createRange();r.selectNodeContents(document.getElementById(id));var s=getSelection();s.removeAllRanges();s.addRange(r)});setTimeout(function(){b.textContent="Copiar enlace"},2000)}
function sh(b,u){b.disabled=true;fetch(u,{method:"POST",credentials:"same-origin"}).then(function(r){return r.json()}).then(function(j){var o=b.closest(".doc").querySelector(".shout");if(!j.url){o.textContent="No se ha podido crear el enlace.";o.hidden=false;return}var id="s"+Math.random().toString(36).slice(2);o.innerHTML="<span class=\"eb\">Enlace público</span><code></code><button class=\"btn\" type=\"button\">Copiar enlace</button>";o.querySelector("code").id=id;o.querySelector("code").textContent=j.url;o.querySelector("button").onclick=function(){cp(id,this)};o.hidden=false}).catch(function(){}).finally(function(){b.disabled=false})}</script></body></html>';
    exit;
}
const CSS = '[hidden]{display:none!important}:root{--ink:#14201E;--fg:#1F2A2A;--muted:#545B5B;--gold:#A8843E;--goldtx:#8A6A2C;--line:#E6E0D3;--paper:#F7F5F0;--card:#FBFAF7}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--fg);font:14.5px/1.6 Poppins,Arial,sans-serif}
h1,h2,h3{font-family:Lora,Georgia,serif;font-weight:400;margin:0}p{margin:0;color:var(--muted)}
.eb{font-size:11.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--goldtx)}
a.btn,button.btn{display:inline-block;background:var(--ink);color:#fff;border:0;border-radius:8px;padding:9px 16px;font:500 13.5px Poppins,Arial,sans-serif;text-decoration:none;cursor:pointer}
.btn.ghost{background:transparent;color:var(--goldtx);border:1px solid var(--gold)}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.app{display:grid;grid-template-columns:280px minmax(0,1fr);min-height:100vh}
.side{background:var(--ink);color:#E9E4DA;display:flex;flex-direction:column;padding:28px 16px 20px;gap:4px;position:sticky;top:0;height:100vh;overflow-y:auto}
.logo{font-family:Lora,Georgia,serif;font-size:34px;color:#FAF8F4;padding:0 12px;letter-spacing:.02em;line-height:1.1}.logo i{font-style:normal;color:#C9A55C}
.sub{font-size:13.5px;color:#BFC6C2;padding:10px 12px 16px;border-bottom:1px solid #2A3633;margin-bottom:10px}
.nv{display:flex;align-items:center;gap:14px;color:#E9E4DA;text-decoration:none;padding:10px 14px;border-radius:8px;font-size:14.5px}
.nv:hover{background:#1F2D2A}.nv.on{background:#2B3936;color:#fff}.nv svg{color:#C9A55C;flex:none}.nv em{margin-left:auto;font-style:normal;font-size:11.5px;color:#9AA39F}
.sep{font-size:10.5px;letter-spacing:.12em;text-transform:uppercase;color:#7F8A86;padding:14px 14px 4px}
.foot{margin-top:auto;border-top:1px solid #2A3633;padding-top:14px}.foot button{background:transparent;border:0;color:#E9E4DA;display:flex;gap:12px;align-items:center;padding:10px 14px;font:14.5px Poppins,Arial,sans-serif;cursor:pointer}
.who{font-size:12px;color:#9AA39F;padding:0 14px 6px}
.top{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:22px 40px;border-bottom:1px solid var(--line)}
.top b{font-family:Lora,Georgia,serif;font-weight:400;font-size:24px;color:var(--fg);border-left:2px solid var(--gold);padding-left:16px}
.main{padding:28px 40px 60px;display:grid;gap:22px;align-content:start}
.hero{background:linear-gradient(90deg,#F3EFE7,#EFE6D2);border:1px solid var(--line);border-radius:12px;padding:40px 44px}
.hero h1{font-size:38px;line-height:1.15}.hero p{margin-top:14px;max-width:56ch}.hero i{display:block;width:90px;height:3px;background:var(--gold);margin-top:22px}
.kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
.kpi{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:20px;display:flex;gap:16px;align-items:center}.kpi svg{color:var(--gold);width:32px;height:32px}
.kpi span{display:block;font-size:13.5px;color:var(--muted)}.kpi b{font-family:Lora,Georgia,serif;font-weight:400;font-size:30px}
.tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}
.tile{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:26px 18px;display:grid;justify-items:center;text-align:center;gap:10px;text-decoration:none;color:var(--fg)}
.tile svg{width:44px;height:44px;color:var(--gold)}.tile b{font-family:Lora,Georgia,serif;font-weight:400;font-size:19px}.tile small{color:var(--muted);font-size:12.5px}.tile span{color:var(--gold)}.tile:hover{border-color:var(--gold)}
.docs{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.doc{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:22px;display:grid;gap:10px;align-content:start}
.doc h3{font-weight:500;font-size:19px}.doc p{font-size:13.5px}.dh{display:flex;justify-content:space-between;align-items:center;gap:8px}
.tag{font-size:10.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--goldtx);border:1px solid var(--gold);border-radius:99px;padding:1px 9px}
.shout{background:#F3EFE7;border-radius:8px;padding:12px 14px;display:grid;gap:8px}.shout code{font-size:13px;word-break:break-all}.tag.vis{color:#2F5B4B;border-color:#2F5B4B}
.empty{background:var(--card);border:1px dashed #D6CDB9;border-radius:10px;padding:26px;display:grid;gap:6px}
.share{background:var(--card);border:1px solid var(--line);border-left:3px solid var(--gold);border-radius:10px;padding:20px 22px;display:grid;gap:10px}.share code{display:block;font-size:13.5px;word-break:break-all}.share p{font-size:13px}
.login{max-width:420px;margin:12vh auto;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:32px;display:grid;gap:14px}
.login input{font:15px Poppins,Arial,sans-serif;padding:10px 12px;border:1px solid var(--line);border-radius:8px}
@media(max-width:900px){.app{grid-template-columns:1fr}.side{position:static;height:auto}.main,.top{padding-left:16px;padding-right:16px}.hero{padding:28px 22px}.hero h1{font-size:30px}}';

function shell(string $brand, string $sub, string $nav, string $title, string $main, string $foot): string {
    return '<div class="app"><aside class="side"><div class="logo">' . $brand . '</div><div class="sub">' . $sub . '</div>' . $nav . '<div class="foot">' . $foot . '</div></aside>'
        . '<div><div class="top"><b>' . esc($title) . '</b><span class="eb">OdlC</span></div><div class="main">' . $main . '</div></div></div>';
}
function nav_link(string $href, string $icon, string $label, bool $on, string $extra = ''): string {
    return '<a class="nv' . ($on ? ' on' : '') . '" href="' . esc($href) . '">' . ico($icon) . '<span>' . esc($label) . '</span>' . ($extra !== '' ? '<em>' . esc($extra) . '</em>' : '') . '</a>';
}
function send_file(string $rel, bool $download = false): never {
    $base = realpath(__DIR__ . '/contenido'); $f = realpath(__DIR__ . '/contenido/' . $rel);
    if (!$base || !$f || !str_starts_with($f, $base . DIRECTORY_SEPARATOR) || !is_file($f)) html_page('No encontrado', '<div class="login"><h2>No encontrado</h2></div>', 404);
    $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION)); $fn = basename($f);
    header('Content-Type: ' . (MIME[$ext] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($f));
    header('Content-Disposition: ' . ($download || !in_array($ext, ['html', 'pdf', 'png', 'jpg'], true) ? 'attachment' : 'inline') . '; filename="' . $fn . '"; filename*=UTF-8\'\'' . rawurlencode($fn));
    if ($ext === 'html') header('X-Frame-Options: SAMEORIGIN');
    readfile($f); exit;
}
function send_json_g(array $d, int $code = 200): never { http_response_code($code); header('Content-Type: application/json; charset=utf-8'); echo json_encode($d, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); exit; }
function doc_card(array $d, string $url, bool $admin, string $cliente = '', string $shareUrl = ''): string {
    $tags = '<span class="tag">' . esc($d['tipo']) . '</span>' . ($admin ? (!empty($d['cliente']) ? '<span class="tag vis">Lo ve el cliente</span>' : '') : '');
    return '<div class="doc"><div class="dh"><span class="eb">' . esc($cliente) . '</span><span class="row">' . $tags . '</span></div><h3>' . esc($d['titulo']) . '</h3><p>' . esc($d['nota']) . '</p><div class="row"><a class="btn" href="' . esc($url) . '" target="_blank" rel="noopener">Abrir</a>'
        . (!empty($d['descarga']) ? '<a class="btn ghost" href="' . esc($url) . '?descargar=1">Descargar</a>' : '') . ($shareUrl !== '' ? share_btn($shareUrl) : '') . '</div><div class="shout" hidden></div></div>';
}

// ---------- Enlaces públicos para compartir un documento ----------
function shares_file(): string { return g_data() . '/gestion/enlaces.json'; }
function shares(): array { $f = shares_file(); $d = is_file($f) ? json_decode((string)file_get_contents($f), true) : []; return is_array($d) ? $d : []; }
function share_create(string $cid, string $doc, string $by): string {
    $all = shares();
    foreach ($all as $t => $x) if ($x['c'] === $cid && $x['d'] === $doc) return $t; // un enlace por documento
    $t = b64u(random_bytes(16)); $all[$t] = ['c' => $cid, 'd' => $doc, 'por' => $by, 'fecha' => date('c')];
    file_put_contents(shares_file(), json_encode($all, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
    return $t;
}
function share_btn(string $url): string { return '<button class="btn ghost" type="button" onclick="sh(this,\'' . esc($url) . '\')">Compartir</button>'; }

// ======================= PORTAL DEL CLIENTE =======================
function cli_link(array $c, string $host): string { return $host . '/' . $c['slug'] . '?k=' . $c['enlace']; }
$dpath = rawurldecode($path);
if (preg_match('#^/c/([A-Za-z0-9_-]{22})(?:/(informe|informe\.pdf))?$#', $path, $m)) {
    $x = shares()[$m[1]] ?? null; $c = $x ? ($CLI[$x['c']] ?? null) : null; $d = $c['docs'][$x['d'] ?? ''] ?? null;
    if (!$d) html_page('Enlace no válido', '<div class="login"><h2>Este enlace no es válido</h2><p>Pide uno nuevo a quien te lo envió.</p></div>', 404);
    if (!empty($m[2])) { $e = $c['docs'][$c['extra'][$m[2]] ?? ''] ?? null; if ($x['d'] === 'presentacion' && $e) send_file($e['archivo'], $m[2] === 'informe.pdf'); html_page('No encontrado', '<div class="login"><h2>No encontrado</h2></div>', 404); }
    send_file($d['archivo'], !empty($d['descarga']) && isset($_GET['descargar']));
}
// Enlace antiguo /p/<enlace> → su página
if (preg_match('#^/p/([A-Za-z0-9_-]{20,})#', $dpath, $m)) foreach ($CLI as $c) if (hash_equals((string)$c['enlace'], $m[1])) { header('Location: /' . rawurlencode($c['slug']) . '?k=' . $c['enlace'], true, 302); exit; }
foreach ($CLI as $cid => $c) {
    $slug = '/' . $c['slug'];
    if ($dpath !== $slug && !str_starts_with($dpath, $slug . '/')) continue;
    $base = '/' . str_replace('%26', '&', rawurlencode($c['slug'])); $rest = trim(substr($dpath, strlen($slug)), '/');
    $ck = 'odlc_c_' . $cid; $okv = g_sign('cli|' . $cid . '|' . $c['enlace'] . '|' . $c['clave']);
    // 1) Enlace con llave: se guarda en el navegador y se quita de la barra
    if (isset($_GET['k']) && hash_equals((string)$c['enlace'], (string)$_GET['k']) && empty($c['clave'])) {
        header('Set-Cookie: ' . $ck . '=' . $okv . '; Path=/; Max-Age=' . (30 * 86400) . '; HttpOnly; Secure; SameSite=Lax');
        header('Location: ' . $base . ($rest !== '' ? '/' . $rest : ''), true, 303); exit;
    }
    // 2) Contraseña (cuando se active)
    if (!empty($c['clave']) && $rest === 'entrar' && $method === 'POST') {
        if (password_verify((string)($_POST['clave'] ?? ''), (string)$c['clave'])) { header('Set-Cookie: ' . $ck . '=' . $okv . '; Path=/; Max-Age=28800; HttpOnly; Secure; SameSite=Lax'); header('Location: ' . $base, true, 303); exit; }
        sleep(1); $err = 'Contraseña incorrecta.';
    }
    $isAdmin = g_user() !== null;
    if (!$isAdmin && !hash_equals($okv, (string)($_COOKIE[$ck] ?? ''))) {
        if (!empty($c['clave'])) html_page($c['nombre'] . ' · OdlC', '<form class="login" method="post" action="' . esc($base) . '/entrar"><div class="eb">OdlC · Portal de ' . esc($c['nombre']) . '</div><h2>Acceso privado</h2>' . (!empty($err) ? '<p style="color:#9B2C2C">' . esc($err) . '</p>' : '') . '<input type="password" name="clave" placeholder="Contraseña" autocomplete="current-password" required><button class="btn">Entrar</button></form>', 401);
        html_page($c['nombre'] . ' · OdlC', '<div class="login"><div class="eb">OdlC · Portal de ' . esc($c['nombre']) . '</div><h2>Acceso privado</h2><p>Para entrar, usa el enlace que te ha enviado OdlC.</p></div>', 401);
    }
    $vis = array_filter($c['docs'], fn($d) => !empty($d['cliente']));
    if (preg_match('#^compartir/([a-z0-9-]+)$#', $rest, $cm) && $method === 'POST') {
        if (!isset($vis[$cm[1]]) && !($isAdmin && isset($c['docs'][$cm[1]]))) send_json_g(['error' => 'No encontrado'], 404);
        send_json_g(['url' => 'https://' . ($_SERVER['HTTP_HOST'] ?? 'gestion.odlc.es') . '/c/' . share_create($cid, $cm[1], $isAdmin ? (string)g_user() : $c['nombre'])]);
    }
    if (isset($c['extra'][$rest]) && isset($vis[$c['extra'][$rest]])) send_file($vis[$c['extra'][$rest]]['archivo'], str_ends_with($rest, '.pdf'));
    if ($rest === 'presentacion' && isset($vis['presentacion'])) send_file($vis['presentacion']['archivo']);
    if (preg_match('#^d/([a-z0-9-]+)$#', $rest, $dm) && isset($vis[$dm[1]])) send_file($vis[$dm[1]]['archivo'], !empty($vis[$dm[1]]['descarga']) && isset($_GET['descargar']));
    $sec = preg_match('#^s/([a-z]+)$#', $rest, $sm) && isset($SERV[$sm[1]]) ? $sm[1] : 'inicio';
    if ($rest !== '' && $sec === 'inicio') html_page('No encontrado', '<div class="login"><h2>No encontrado</h2></div>', 404);
    $count = fn($s) => count(array_filter($vis, fn($d) => $d['servicio'] === $s));
    $nav = nav_link($base, 'inicio', 'Inicio', $sec === 'inicio');
    foreach ($SERV as $k => [$t]) $nav .= ($k === 'admin' ? '<div class="sep">Con OdlC</div>' : '') . nav_link($base . '/s/' . $k, $k, $t, $sec === $k, $count($k) ? (string)$count($k) : '');
    if ($sec === 'inicio') {
        $main = '<section class="hero"><div><div class="eb">' . esc($c['nombre']) . '</div><h1>Bienvenidos a vuestro<br>espacio con OdlC</h1><p>Aquí encontraréis todo lo que preparamos para vosotros, ordenado por servicio.</p><i></i></div></section><div class="tiles">';
        foreach ($SERV as $k => [$t]) $main .= '<a class="tile" href="' . esc($base . '/s/' . $k) . '">' . ico($k) . '<b>' . esc($t) . '</b><small>' . ($count($k) ? $count($k) . ' documento' . ($count($k) > 1 ? 's' : '') : 'En preparación') . '</small><span>→</span></a>';
        $main .= '</div>'; $title = 'Inicio';
    } else {
        [$title, $dsc] = $SERV[$sec];
        $main = '<p>' . esc($dsc) . '</p>'; $cards = '';
        foreach ($vis as $id => $d) if ($d['servicio'] === $sec) $cards .= doc_card($d, $id === 'presentacion' ? $base . '/presentacion' : $base . '/d/' . $id, false, $c['nombre'], $base . '/compartir/' . $id);
        $main .= $cards !== '' ? '<div class="docs">' . $cards . '</div>' : '<div class="empty"><h3>En preparación</h3><p>Cuando OdlC empiece a trabajar en esta área, aquí aparecerán vuestros documentos.</p></div>';
    }
    html_page($c['nombre'] . ' · OdlC', shell('Od<i>l</i>C', 'Portal de ' . esc($c['nombre']), $nav, $title, $main, '<div class="who">' . ($isAdmin ? 'Vista de Isabel (como el cliente)' : 'Espacio privado de ' . esc($c['nombre'])) . '</div>'));
}

// ======================= INICIO DE SESIÓN (ISABEL) =======================
if ($path === '/entrar') {
    if ($mm = g_missing()) html_page('Configuración', '<div class="login"><h2>Falta configuración</h2><p>' . esc(implode(', ', $mm)) . '</p></div>', 503);
    $next = (string)($_GET['next'] ?? '/'); if (!preg_match('#^/[A-Za-z0-9/_.-]*$#', $next)) $next = '/';
    header('Location: ' . g_login_url($next), true, 303); exit;
}
if ($path === '/auth/callback') {
    try { [$email, $next] = g_callback($_GET); g_set_session($email); header('Location: ' . ($next ?: '/'), true, 303); exit; }
    catch (Throwable $e) { html_page('Acceso', '<div class="login"><h2>No se ha podido entrar</h2><p>' . esc($e->getMessage()) . '</p><a class="btn" href="/entrar">Volver a intentarlo</a></div>', 403); }
}
if ($path === '/salir' && $method === 'POST') {
    if (!hash_equals(g_csrf(), (string)($_POST['t'] ?? ''))) html_page('Salir', '<div class="login"><p>Solicitud no válida.</p></div>', 400);
    g_clear_session(); header('Location: /', true, 303); exit;
}
$user = g_user();
if (!$user) html_page('OdlC · Gestión', '<div class="login"><div class="eb">OdlC · Área privada</div><h2>Gestión</h2><p>Acceso reservado. Entra con tu cuenta de Microsoft de OdlC.</p><a class="btn" href="/entrar?next=' . esc(rawurlencode($path)) . '">Entrar con Microsoft</a></div>', 401);

// ======================= ÁREA DE ISABEL =======================
if (preg_match('#^/ver/([a-z0-9-]+)/([a-z0-9-]+)$#', $path, $m) && isset($CLI[$m[1]]['docs'][$m[2]])) {
    $d = $CLI[$m[1]]['docs'][$m[2]]; send_file($d['archivo'], !empty($d['descarga']) && isset($_GET['descargar']));
}
$host = 'https://' . ($_SERVER['HTTP_HOST'] ?? 'gestion.odlc.es');
$sec = 'inicio';
if (preg_match('#^/s/([a-z]+)$#', $path, $m) && (isset($SERV[$m[1]]) || $m[1] === 'clientes')) $sec = $m[1];
$all = []; foreach ($CLI as $cid => $c) foreach ($c['docs'] as $id => $d) if (empty($d['cliente'])) $all[] = $d + ['_c' => $cid, '_id' => $id];
$count = fn($s) => count(array_filter($all, fn($d) => $d['servicio'] === $s));
$nav = nav_link('/', 'inicio', 'Inicio', $sec === 'inicio') . '<div class="sep">Servicios</div>';
foreach ($SERV as $k => [$t]) $nav .= ($k === 'admin' ? '<div class="sep">Con los clientes</div>' : '') . nav_link('/s/' . $k, $k, $t, $sec === $k, $count($k) ? (string)$count($k) : '');
$nav .= '<div class="sep">Clientes</div>' . nav_link('/s/clientes', 'clientes', 'Clientes', $sec === 'clientes', (string)count($CLI));
$share = function (string $cid, array $c) use ($host): string {
    $link = cli_link($c, $host);
    return '<div class="share"><div class="dh"><span class="eb">' . esc($c['nombre']) . ' · portal del cliente</span><span class="tag">' . (!empty($c['clave']) ? 'Con contraseña' : 'Con enlace') . '</span></div><p>Su página: <b>' . esc(($_SERVER['HTTP_HOST'] ?? 'gestion.odlc.es') . '/' . $c['slug']) . '</b> · enlace para entrar:</p><code id="l-' . esc($cid) . '">' . esc($link) . '</code><p>' . esc($c['descripcion']) . '. Ve solo los documentos marcados «Lo ve el cliente», ordenados por servicio.</p><div class="row"><button class="btn" type="button" onclick="cp(\'l-' . esc($cid) . '\',this)">Copiar enlace</button><a class="btn ghost" href="' . esc($link) . '" target="_blank" rel="noopener">Abrir como el cliente</a></div></div>';
};
if ($sec === 'inicio') {
    $main = '<section class="hero"><div><h1>Bienvenida a tu<br>área de gestión</h1><p>Tus documentos de trabajo ordenados por servicio y, en Clientes, la página de cada cliente.</p><i></i></div></section>';
    $main .= '<div class="kpis"><div class="kpi">' . ico('clientes') . '<div><span>Clientes</span><b>' . count($CLI) . '</b></div></div><div class="kpi">' . ico('presentaciones') . '<div><span>Documentos</span><b>' . count($all) . '</b></div></div><div class="kpi">' . ico('compliance') . '<div><span>Visibles para clientes</span><b>' . array_sum(array_map(fn($c) => count(array_filter($c['docs'], fn($d) => !empty($d['cliente']))), $CLI)) . '</b></div></div></div><div class="tiles">';
    foreach ($SERV as $k => [$t]) $main .= '<a class="tile" href="/s/' . $k . '">' . ico($k) . '<b>' . esc($t) . '</b><small>' . ($count($k) ? $count($k) . ' documento' . ($count($k) > 1 ? 's' : '') : 'Sin documentos') . '</small><span>→</span></a>';
    $main .= '<a class="tile" href="/s/clientes">' . ico('clientes') . '<b>Clientes</b><small>' . count($CLI) . ' cliente' . (count($CLI) > 1 ? 's' : '') . '</small><span>→</span></a></div>'; $title = 'Inicio';
} elseif ($sec === 'clientes') {
    $title = 'Clientes';
    $main = '<p>Cada cliente tiene su página. Pincha en un cliente para abrirla tal como la ve él. Por ahora entran con su enlace; más adelante, con contraseña.</p><div class="docs">';
    foreach ($CLI as $cid => $c) {
        $page = '/' . str_replace('%26', '&', rawurlencode($c['slug'])); $nv = count(array_filter($c['docs'], fn($d) => !empty($d['cliente'])));
        $main .= '<div class="doc"><div class="dh"><span class="eb">Cliente</span><span class="tag">' . (!empty($c['clave']) ? 'Con contraseña' : 'Con enlace') . '</span></div><h3>' . esc($c['nombre']) . '</h3><p>' . esc($c['descripcion']) . '</p><p><b>' . esc(($_SERVER['HTTP_HOST'] ?? 'gestion.odlc.es') . $page) . '</b> · ' . $nv . ' documentos visibles</p>'
          . '<div class="row"><a class="btn" href="' . esc($page) . '" target="_blank" rel="noopener">Abrir su página</a><button class="btn ghost" type="button" onclick="cp(\'l-' . esc($cid) . '\',this)">Copiar enlace</button></div><code id="l-' . esc($cid) . '" hidden>' . esc(cli_link($c, $host)) . '</code></div>';
    }
    $main .= '</div>';
} else {
    [$title, $dsc] = $SERV[$sec]; $main = '<p>' . esc($dsc) . '</p>'; $cards = '';
    foreach ($all as $d) if ($d['servicio'] === $sec) $cards .= doc_card($d, '/ver/' . $d['_c'] . '/' . $d['_id'], true, $CLI[$d['_c']]['nombre'], '/' . str_replace('%26', '&', rawurlencode($CLI[$d['_c']]['slug'])) . '/compartir/' . $d['_id']);
    $main .= $cards !== '' ? '<div class="docs">' . $cards . '</div>' : '<div class="empty"><h3>Sin documentos todavía</h3><p>Lo que prepares en ' . esc($title) . ' para cada cliente aparecerá aquí.</p></div>';
}
$foot = '<form method="post" action="/salir"><div class="who">' . esc($user) . '</div><input type="hidden" name="t" value="' . esc(g_csrf()) . '"><button>' . ico('salir') . 'Cerrar sesión</button></form>';
html_page('OdlC · Gestión', shell('Od<i>l</i>C', 'Área de gestión', $nav, $title, $main, $foot));
