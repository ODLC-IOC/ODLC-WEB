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
const LOGO = 'data:image/png;base64,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';
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
const CSS = '[hidden]{display:none!important}.pick{display:flex;align-items:center;gap:10px}.pick span{font-size:11.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--goldtx)}.pick select{font:500 15px Lora,Georgia,serif;color:var(--fg);background:var(--card);border:1px solid var(--line);border-radius:8px;padding:8px 34px 8px 12px;cursor:pointer}:root{--ink:#14201E;--fg:#1F2A2A;--muted:#545B5B;--gold:#A8843E;--goldtx:#8A6A2C;--line:#E6E0D3;--paper:#F7F5F0;--card:#FBFAF7}
*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--fg);font:14.5px/1.6 Poppins,Arial,sans-serif}
h1,h2,h3{font-family:Lora,Georgia,serif;font-weight:400;margin:0}p{margin:0;color:var(--muted)}
.eb{font-size:11.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--goldtx)}
a.btn,button.btn{display:inline-block;background:var(--ink);color:#fff;border:0;border-radius:8px;padding:9px 16px;font:500 13.5px Poppins,Arial,sans-serif;text-decoration:none;cursor:pointer}
.btn.ghost{background:transparent;color:var(--goldtx);border:1px solid var(--gold)}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.app{display:grid;grid-template-columns:280px minmax(0,1fr);min-height:100vh}
.side{background:var(--ink);color:#E9E4DA;display:flex;flex-direction:column;padding:28px 16px 20px;gap:4px;position:sticky;top:0;height:100vh;overflow-y:auto}
.logo{padding:2px 12px}.logo img{display:block;width:132px;height:auto}
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

function shell(string $brand, string $sub, string $nav, string $title, string $main, string $foot, string $topx = ''): string {
    return '<div class="app"><aside class="side"><div class="logo"><img src="' . LOGO . '" alt="OdlC"></div><div class="sub">' . $sub . '</div>' . $nav . '<div class="foot">' . $foot . '</div></aside>'
        . '<div><div class="top"><b>' . esc($title) . '</b>' . ($topx !== '' ? $topx : '<span class="eb">OdlC</span>') . '</div><div class="main">' . $main . '</div></div></div>';
}
function picker(array $CLI, string $cur = ''): string {
    $o = '<option value="/"' . ($cur === '' ? ' selected' : '') . '>Mi área de gestión</option>';
    foreach ($CLI as $cid => $c) $o .= '<option value="/' . esc(str_replace('%26', '&', rawurlencode($c['slug']))) . '"' . ($cur === $cid ? ' selected' : '') . '>' . esc($c['nombre']) . '</option>';
    return '<label class="pick"><span>Cliente</span><select onchange="location.href=this.value">' . $o . '</select></label>';
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
    html_page($c['nombre'] . ' · OdlC', shell('Od<i>l</i>C', 'Portal de ' . esc($c['nombre']), $nav, $title, $main, '<div class="who">' . ($isAdmin ? 'Vista de Isabel (como el cliente)' : 'Espacio privado de ' . esc($c['nombre'])) . '</div>', $isAdmin ? picker($CLI, $cid) : ''));
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
          . '<div class="row"><a class="btn" href="' . esc($page) . '">Abrir su página</a><button class="btn ghost" type="button" onclick="cp(\'l-' . esc($cid) . '\',this)">Copiar enlace</button></div><code id="l-' . esc($cid) . '" hidden>' . esc(cli_link($c, $host)) . '</code></div>';
    }
    $main .= '</div>';
} else {
    [$title, $dsc] = $SERV[$sec]; $main = '<p>' . esc($dsc) . '</p>'; $cards = '';
    foreach ($all as $d) if ($d['servicio'] === $sec) $cards .= doc_card($d, '/ver/' . $d['_c'] . '/' . $d['_id'], true, $CLI[$d['_c']]['nombre'], '/' . str_replace('%26', '&', rawurlencode($CLI[$d['_c']]['slug'])) . '/compartir/' . $d['_id']);
    $main .= $cards !== '' ? '<div class="docs">' . $cards . '</div>' : '<div class="empty"><h3>Sin documentos todavía</h3><p>Lo que prepares en ' . esc($title) . ' para cada cliente aparecerá aquí.</p></div>';
}
$foot = '<form method="post" action="/salir"><div class="who">' . esc($user) . '</div><input type="hidden" name="t" value="' . esc(g_csrf()) . '"><button>' . ico('salir') . 'Cerrar sesión</button></form>';
html_page('OdlC · Gestión', shell('', 'Área de gestión', $nav, $title, $main, $foot, picker($CLI)));
