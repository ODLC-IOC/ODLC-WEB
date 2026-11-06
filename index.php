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
$out = '<header><div><div class="eb">OdlC · Área privada</div><h1>Gestión</h1></div><form method="post" action="/salir" class="row"><span style="font-size:13px;color:var(--muted)">' . esc($user) . '</span><input type="hidden" name="t" value="' . esc(g_csrf()) . '"><button class="ghost">Salir</button></form></header>';
foreach ($CAT as $sid => $s) {
    $out .= '<div class="eb">' . esc($s['titulo']) . '</div>';
    foreach ($s['grupos'] as $gid => $g) {
        $out .= '<section class="card"><div><h2>' . esc($g['titulo']) . '</h2><p>' . esc($g['subtitulo']) . '</p></div>';
        if (!empty($g['enlace'])) {
            $link = $host . '/p/' . $g['enlace'];
            $out .= '<div class="share"><span class="eb">Enlace para el cliente · solo ve la presentación</span><code id="l-' . esc($gid) . '">' . esc($link) . '</code><div class="row"><button type="button" onclick="cp(\'' . esc($gid) . '\',this)">Copiar enlace</button><a class="ghost btn" href="' . esc($link) . '" target="_blank" rel="noopener">Abrir como el cliente</a></div></div>';
        }
        foreach ($g['items'] as $it) {
            $u = '/ver/' . str_replace('%2F', '/', rawurlencode($it['archivo']));
            $out .= '<div class="item"><div><b>' . esc($it['titulo']) . '</b><span class="tag">' . esc($it['tipo']) . '</span><p>' . esc($it['nota']) . '</p></div><div class="row"><a class="btn" href="' . esc($u) . '" target="_blank" rel="noopener">Abrir</a>'
                . (!empty($it['descarga']) ? '<a class="ghost btn" href="' . esc($u) . '?descargar=1">Descargar</a>' : '') . '</div></div>';
        }
        $out .= '</section>';
    }
}
$out .= '<script>function cp(id,b){var t=document.getElementById("l-"+id).textContent;(navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(function(){b.textContent="Copiado"},function(){var r=document.createRange();r.selectNodeContents(document.getElementById("l-"+id));var s=getSelection();s.removeAllRanges();s.addRange(r)});setTimeout(function(){b.textContent="Copiar enlace"},2000)}</script>';
page('OdlC · Gestión', $out);
