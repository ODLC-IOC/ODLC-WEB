<?php
// gestion.odlc.es — área privada de Isabel. Todo pasa por aquí (ver .htaccess).
declare(strict_types=1);
require __DIR__ . '/_app/lib.php';
$CAT = require __DIR__ . '/_app/catalogo.php';
const MIME = ['html' => 'text/html; charset=utf-8', 'pdf' => 'application/pdf', 'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'png' => 'image/png', 'jpg' => 'image/jpeg', 'xlsx' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

$path = '/' . trim((string)parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
g_headers();

function page(string $title, string $body, int $code = 200): never {
    http_response_code($code);
    header('Content-Type: text/html; charset=utf-8');
    header('X-Frame-Options: DENY');
    echo '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>' . esc($title) . '</title>'
      . '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Lora:wght@400;500&family=Poppins:wght@400;500;600&display=swap"><style>'
      . ':root{--bg:#EFEDE8;--card:#fff;--fg:#1F2A2A;--muted:#545B5B;--gold:#A8843E;--goldtx:#8A6A2C;--line:#E6E0D3;--soft:#F7F4EE;--green:#17302A}'
      . '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:14.5px/1.6 Poppins,Arial,sans-serif}'
      . '.wrap{max-width:980px;margin:0 auto;padding:32px max(16px,env(safe-area-inset-left,0px)) 64px;display:grid;gap:22px}'
      . 'header{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;border-left:5px solid var(--green);padding-left:16px}'
      . 'h1,h2{font-family:Lora,Georgia,serif;font-weight:400;margin:0}h1{font-size:30px}h2{font-size:22px}'
      . '.eb{font-size:11.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--goldtx)}'
      . '.card{background:var(--card);border-radius:10px;padding:24px;display:grid;gap:14px}p{margin:0;color:var(--muted)}'
      . '.item{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 16px;align-items:center;padding:12px 0;border-top:1px solid var(--line)}'
      . '.item b{font-weight:500}.item p{font-size:13px}.tag{font-size:10.5px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--goldtx);border:1px solid var(--gold);border-radius:99px;padding:1px 9px;margin-left:6px}'
      . 'a.btn,button{display:inline-block;background:var(--green);color:#fff;border:0;border-radius:8px;padding:9px 16px;font:500 13.5px Poppins,Arial,sans-serif;text-decoration:none;cursor:pointer}'
      . 'a.ghost,button.ghost{background:transparent;color:var(--goldtx);border:1px solid var(--gold)}'
      . '.share{background:var(--soft);border-radius:8px;padding:14px 16px;display:grid;gap:8px}.share code{font-size:13px;word-break:break-all;color:var(--fg)}'
      . '.row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}@media(max-width:560px){.item{grid-template-columns:1fr}}'
      . '</style></head><body><div class="wrap">' . $body . '</div></body></html>';
    exit;
}
function send_file(string $rel, bool $download = false): never {
    $base = realpath(__DIR__ . '/contenido');
    $f = realpath(__DIR__ . '/contenido/' . $rel);
    if (!$base || !$f || !str_starts_with($f, $base . DIRECTORY_SEPARATOR) || !is_file($f)) page('No encontrado', '<div class="card"><h2>No encontrado</h2></div>', 404);
    $ext = strtolower(pathinfo($f, PATHINFO_EXTENSION));
    header('Content-Type: ' . (MIME[$ext] ?? 'application/octet-stream'));
    header('Content-Length: ' . filesize($f));
    $fn = basename($f); header('Content-Disposition: ' . ($download || !in_array($ext, ['html', 'pdf', 'png', 'jpg'], true) ? 'attachment' : 'inline') . '; filename="' . $fn . '"; filename*=UTF-8\'\'' . rawurlencode($fn));
    if ($ext === 'html') header('X-Frame-Options: SAMEORIGIN');
    readfile($f);
    exit;
}
function all_items(array $CAT): array { $o = []; foreach ($CAT as $s) foreach ($s['grupos'] as $g) foreach ($g['items'] as $it) $o[$it['archivo']] = $it; return $o; }

// ---------- Enlace del cliente: solo su presentación, sin iniciar sesión ----------
if (preg_match('#^/p/([A-Za-z0-9_-]{20,})(?:/(informe|informe\.pdf))?$#', $path, $m)) {
    foreach ($CAT as $s) foreach ($s['grupos'] as $g)
        if (!empty($g['enlace']) && hash_equals((string)$g['enlace'], $m[1])) {
            if (empty($m[2])) send_file($g['compartida']);
            if (!empty($g['compartida_extra'][$m[2]])) send_file($g['compartida_extra'][$m[2]], $m[2] === 'informe.pdf');
        }
    page('Enlace no válido', '<div class="card"><h2>Este enlace no es válido o ha caducado</h2><p>Pide uno nuevo a OdlC.</p></div>', 404);
}

// ---------- Inicio de sesión con Microsoft ----------
if ($path === '/entrar') {
    if ($m = g_missing()) page('Configuración', '<div class="card"><h2>Falta configuración</h2><p>Faltan en _datos/config.php: ' . esc(implode(', ', $m)) . '</p></div>', 503);
    $next = (string)($_GET['next'] ?? '/');
    if (!preg_match('#^/[A-Za-z0-9/_.-]*$#', $next)) $next = '/';
    header('Location: ' . g_login_url($next), true, 303); exit;
}
if ($path === '/auth/callback') {
    try { [$email, $next] = g_callback($_GET); g_set_session($email); header('Location: ' . ($next ?: '/'), true, 303); exit; }
    catch (Throwable $e) { page('Acceso', '<div class="card"><h2>No se ha podido entrar</h2><p>' . esc($e->getMessage()) . '</p><div class="row"><a class="btn" href="/entrar">Volver a intentarlo</a></div></div>', 403); }
}
if ($path === '/salir' && $method === 'POST') {
    if (!hash_equals(g_csrf(), (string)($_POST['t'] ?? ''))) page('Salir', '<div class="card"><p>Solicitud no válida.</p></div>', 400);
    g_clear_session(); header('Location: /', true, 303); exit;
}

// ---------- A partir de aquí, solo Isabel ----------
$user = g_user();
if (!$user) {
    page('OdlC · Gestión', '<header><div><div class="eb">OdlC · Área privada</div><h1>Gestión</h1></div></header><div class="card"><p>Acceso reservado. Entra con tu cuenta de Microsoft de OdlC.</p><div class="row"><a class="btn" href="/entrar?next=' . esc(rawurlencode($path)) . '">Entrar con Microsoft</a></div></div>', 401);
}

if (preg_match('#^/ver/(.+)$#', $path, $m)) {
    $rel = rawurldecode($m[1]); $items = all_items($CAT);
    if (!isset($items[$rel])) page('No encontrado', '<div class="card"><h2>No encontrado</h2></div>', 404);
    send_file($rel, !empty($items[$rel]['descarga']) && isset($_GET['descargar']));
}

$host = 'https://' . ($_SERVER['HTTP_HOST'] ?? 'gestion.odlc.es');
const SECC = ['inicio' => 'Inicio', 'presentaciones' => 'Presentaciones', 'informes' => 'Informes', 'contratos' => 'Contratos', 'clientes' => 'Enlaces de clientes'];
const ICO = [
 'inicio' => '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
 'presentaciones' => '<rect x="3" y="4" width="18" height="12" rx="1"/><path d="M12 16v4M8 20h8"/>',
 'informes' => '<path d="M5 20V10M10 20V4M15 20v-7M20 20v-11"/>',
 'contratos' => '<path d="M7 3h7l5 5v13H7z"/><path d="M14 3v5h5M10 13h6M10 17h6"/>',
 'clientes' => '<path d="M10 14a4 4 0 0 1 0-5.6l3-3a4 4 0 0 1 5.6 5.6l-1.5 1.5"/><path d="M14 10a4 4 0 0 1 0 5.6l-3 3a4 4 0 0 1-5.6-5.6l1.5-1.5"/>',
 'salir' => '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
];
function ico(string $k): string { return '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' . (ICO[$k] ?? '') . '</svg>'; }
$sec = preg_match('#^/s/([a-z]+)$#', $path, $mm) && isset(SECC[$mm[1]]) ? $mm[1] : 'inicio';
// Todos los documentos, con su cliente
$docs = []; $grupos = [];
foreach ($CAT as $s0) foreach ($s0['grupos'] as $gid => $g) { $grupos[$gid] = $g; foreach ($g['items'] as $it) $docs[] = $it + ['cliente' => $g['titulo']]; }
function card(array $it): string {
    $u = '/ver/' . str_replace('%2F', '/', rawurlencode($it['archivo']));
    return '<div class="doc"><div class="dh"><span class="cl">' . esc($it['cliente']) . '</span><span class="tag">' . esc($it['tipo']) . '</span></div><h3>' . esc($it['titulo']) . '</h3><p>' . esc($it['nota']) . '</p><div class="row"><a class="btn" href="' . esc($u) . '" target="_blank" rel="noopener">Abrir</a>' . (!empty($it['descarga']) ? '<a class="btn ghost" href="' . esc($u) . '?descargar=1">Descargar</a>' : '') . '</div></div>';
}
function share(string $gid, array $g, string $host): string {
    $link = $host . '/p/' . $g['enlace'];
    return '<div class="share"><div><span class="eb">' . esc($g['titulo']) . ' · lo que ve el cliente</span><code id="l-' . esc($gid) . '">' . esc($link) . '</code><p>Solo la presentación y su informe de marca. Para retirar el acceso, se cambia el enlace.</p></div><div class="row"><button type="button" onclick="cp(\'' . esc($gid) . '\',this)">Copiar enlace</button><a class="btn ghost" href="' . esc($link) . '" target="_blank" rel="noopener">Abrir como el cliente</a></div></div>';
}
$nav = '';
foreach (SECC as $k => $t) $nav .= '<a class="nv' . ($k === $sec ? ' on' : '') . '" href="' . ($k === 'inicio' ? '/' : '/s/' . $k) . '">' . ico($k) . '<span>' . esc($t) . '</span></a>';
$main = '';
if ($sec === 'inicio') {
    $cnt = fn($c) => count(array_filter($docs, fn($d) => ($d['cat'] ?? '') === $c));
    $main .= '<section class="hero"><div><h1>Bienvenida a tu<br>área de gestión</h1><p>Presentaciones, informes y contratos de cada cliente, y los enlaces que compartes con ellos.</p><i></i></div></section>';
    $main .= '<div class="kpis"><div class="kpi">' . ico('clientes') . '<div><span>Clientes</span><b>' . count($grupos) . '</b></div></div><div class="kpi">' . ico('presentaciones') . '<div><span>Presentaciones</span><b>' . $cnt('presentaciones') . '</b></div></div><div class="kpi">' . ico('informes') . '<div><span>Informes</span><b>' . $cnt('informes') . '</b></div></div><div class="kpi">' . ico('contratos') . '<div><span>Contratos</span><b>' . $cnt('contratos') . '</b></div></div></div>';
    $main .= '<div class="tiles">';
    foreach (['presentaciones', 'informes', 'contratos', 'clientes'] as $k) $main .= '<a class="tile" href="/s/' . $k . '">' . ico($k) . '<b>' . esc(SECC[$k]) . '</b><span>→</span></a>';
    $main .= '</div>';
} elseif ($sec === 'clientes') {
    $main .= '<h2>Enlaces de clientes</h2><p class="lead">Como «cualquiera con el enlace» de OneDrive: quien tenga la URL ve solo su presentación.</p>';
    foreach ($grupos as $gid => $g) if (!empty($g['enlace'])) $main .= share($gid, $g, $host);
} else {
    $main .= '<h2>' . esc(SECC[$sec]) . '</h2><div class="docs">';
    foreach ($docs as $d) if (($d['cat'] ?? '') === $sec) $main .= card($d);
    $main .= '</div>';
    if ($sec === 'presentaciones') foreach ($grupos as $gid => $g) if (!empty($g['enlace'])) $main .= share($gid, $g, $host);
}
$css = '<style>body{background:#F7F5F0}.wrap{display:none}.app{display:grid;grid-template-columns:270px minmax(0,1fr);min-height:100vh}
.side{background:#14201E;color:#E9E4DA;display:flex;flex-direction:column;padding:28px 16px 20px;gap:6px;position:sticky;top:0;height:100vh}
.logo{font-family:Lora,Georgia,serif;font-size:34px;color:#FAF8F4;padding:0 12px;letter-spacing:.02em}.logo i{font-style:normal;color:#C9A55C}
.sub{font-size:13.5px;color:#BFC6C2;padding:10px 12px 18px;border-bottom:1px solid #2A3633;margin-bottom:10px}
.nv{display:flex;align-items:center;gap:14px;color:#E9E4DA;text-decoration:none;padding:12px 14px;border-radius:8px;font-size:15px}
.nv:hover{background:#1F2D2A}.nv.on{background:#2B3936;color:#fff}.nv svg{color:#C9A55C;flex:none}
.side form{margin-top:auto;border-top:1px solid #2A3633;padding-top:14px}.side form button{background:transparent;border:0;color:#E9E4DA;display:flex;gap:12px;align-items:center;padding:10px 14px;font:15px Poppins,Arial,sans-serif;cursor:pointer}
.who{font-size:12px;color:#9AA39F;padding:0 14px 6px}
.top{display:flex;justify-content:space-between;align-items:center;padding:22px 40px;border-bottom:1px solid #E6E0D3}
.top b{font-family:Lora,Georgia,serif;font-weight:400;font-size:24px;color:#1F2A2A;border-left:2px solid #A8843E;padding-left:16px}
.main{padding:28px 40px 60px;display:grid;gap:22px;align-content:start}
.hero{background:linear-gradient(90deg,#F3EFE7,#EFE6D2);border:1px solid #E6E0D3;border-radius:12px;padding:40px 44px}
.hero h1{font-size:40px;line-height:1.15;color:#1F2A2A}.hero p{margin-top:14px;max-width:52ch}.hero i{display:block;width:90px;height:3px;background:#A8843E;margin-top:22px}
.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.kpi{background:#FBFAF7;border:1px solid #E6E0D3;border-radius:10px;padding:22px;display:flex;gap:16px;align-items:center}.kpi svg{color:#A8843E;width:34px;height:34px}
.kpi span{display:block;font-size:13.5px;color:#545B5B}.kpi b{font-family:Lora,Georgia,serif;font-weight:400;font-size:32px;color:#1F2A2A}
.tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.tile{background:#FBFAF7;border:1px solid #E6E0D3;border-radius:10px;padding:30px 18px;display:grid;justify-items:center;gap:12px;text-decoration:none;color:#1F2A2A}
.tile svg{width:48px;height:48px;color:#A8843E}.tile b{font-family:Lora,Georgia,serif;font-weight:400;font-size:20px}.tile span{color:#A8843E;font-size:20px}.tile:hover{border-color:#A8843E}
h2{font-size:30px}.lead{margin-top:-10px}
.docs{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px}
.doc{background:#FBFAF7;border:1px solid #E6E0D3;border-radius:10px;padding:22px;display:grid;gap:10px;align-content:start}
.doc h3{font-family:Lora,Georgia,serif;font-weight:500;font-size:19px;margin:0;color:#1F2A2A}.doc p{font-size:13.5px}
.dh{display:flex;justify-content:space-between;align-items:center}.cl{font-size:11.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#8A6A2C}
.share{background:#FBFAF7;border:1px solid #E6E0D3;border-left:3px solid #A8843E;border-radius:10px;padding:20px 22px;display:grid;gap:12px}.share code{display:block;margin:6px 0;font-size:13.5px;word-break:break-all}.share p{font-size:13px}
@media(max-width:900px){.app{grid-template-columns:1fr}.side{position:static;height:auto}.kpis,.tiles{grid-template-columns:1fr 1fr}.main,.top{padding-left:16px;padding-right:16px}}
</style>';
$out = $css . '</div><div class="app"><aside class="side"><div class="logo">Od<i>l</i>C</div><div class="sub">Área de gestión</div>' . $nav
  . '<form method="post" action="/salir"><div class="who">' . esc($user) . '</div><input type="hidden" name="t" value="' . esc(g_csrf()) . '"><button>' . ico('salir') . 'Cerrar sesión</button></form></aside>'
  . '<div><div class="top"><b>' . esc(SECC[$sec]) . '</b><span class="eb">OdlC · Área privada</span></div><div class="main">' . $main . '</div></div></div><div>';
$out .= '<script>function cp(id,b){var t=document.getElementById("l-"+id).textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent="Copiado"},function(){var r=document.createRange();r.selectNodeContents(document.getElementById("l-"+id));var s=getSelection();s.removeAllRanges();s.addRange(r)});setTimeout(function(){b.textContent="Copiar enlace"},2000)}</script>';
page('OdlC · Gestión', $out);
