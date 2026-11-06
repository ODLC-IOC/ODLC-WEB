<?php
// Área privada gestion.odlc.es. Entrada solo con Microsoft (OpenID Connect, código + PKCE)
// y solo para la cuenta de la administradora. Claves en public_html/_datos/config.php (las mismas de citas.odlc.es).
declare(strict_types=1);

const G_ADMIN = 'isabel@odlc.es';
const G_COOKIE = '__Host-odlc_g';
const G_HOURS = 8;

function g_data(): string { $d = dirname(__DIR__, 2) . '/_datos'; if (!is_dir("$d/gestion")) @mkdir("$d/gestion", 0750, true); return $d; }
function g_cfg(string $k, $def = '') {
    // Claves propias de la app «GESTION ODLC» (en _app/config-gestion.php o en _datos/config.php); si no hay, las de citas
    if (in_array($k, ['ms_tenant_id', 'ms_client_id', 'ms_client_secret'], true)) {
        static $own = null; if ($own === null) { $f = __DIR__ . '/config-gestion.php'; $own = is_file($f) ? (include $f) : []; if (!is_array($own)) $own = []; }
        if (!empty($own[$k])) return $own[$k];
        $v = g_cfg_raw('gestion_' . $k); if ($v !== '') return $v;
    }
    return g_cfg_raw($k, $def);
}
function g_cfg_raw(string $k, $def = '') { static $c = null; if ($c === null) { $f = g_data() . '/config.php'; $c = is_file($f) ? (include $f) : []; if (!is_array($c)) $c = []; } $v = $c[$k] ?? ''; return ($v === '' || $v === null) ? $def : $v; }
function g_admin(): string { return strtolower(trim((string)g_cfg('gestion_admin_email', G_ADMIN))); }
function b64u(string $s): string { return rtrim(strtr(base64_encode($s), '+/', '-_'), '='); }
function b64u_dec(string $s): string { return (string)base64_decode(strtr($s, '-_', '+/')); }
function esc($s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'); }
function g_missing(): array { $m = []; if (strlen((string)g_cfg('session_secret')) < 32) $m[] = 'session_secret'; foreach (['ms_tenant_id', 'ms_client_id', 'ms_client_secret'] as $k) if (g_cfg($k) === '') $m[] = $k; return $m; }
function g_sign(string $v): string { return b64u(hash_hmac('sha256', 'gestion|' . $v, (string)g_cfg('session_secret'), true)); }
function g_redirect_uri(): string { return (string)g_cfg('gestion_redirect_uri', 'https://gestion.odlc.es/auth/callback'); }
function g_authority(): string { return 'https://login.microsoftonline.com/' . rawurlencode((string)g_cfg('ms_tenant_id')) . '/oauth2/v2.0'; }

function g_headers(): void {
    header('Cache-Control: no-store, private');
    header('X-Robots-Tag: noindex, nofollow');
    header('X-Content-Type-Options: nosniff');
    header('Referrer-Policy: no-referrer');
}

// ---------- Sesión ----------
function g_user(): ?string {
    if (g_missing()) return null;
    $p = explode('.', $_COOKIE[G_COOKIE] ?? '');
    if (count($p) !== 2 || !hash_equals(g_sign($p[0]), $p[1])) return null;
    $d = json_decode(b64u_dec($p[0]), true);
    if (!is_array($d) || ($d['exp'] ?? 0) <= time()) return null;
    $u = strtolower((string)($d['u'] ?? ''));
    return $u === g_admin() ? $u : null;
}
function g_set_session(string $email): void {
    $payload = b64u(json_encode(['u' => $email, 'exp' => time() + G_HOURS * 3600, 'n' => b64u(random_bytes(9))]));
    header('Set-Cookie: ' . G_COOKIE . '=' . $payload . '.' . g_sign($payload) . '; Path=/; Max-Age=' . (G_HOURS * 3600) . '; HttpOnly; Secure; SameSite=Lax');
}
function g_clear_session(): void { header('Set-Cookie: ' . G_COOKIE . '=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax'); }
function g_csrf(): string { return b64u(hash_hmac('sha256', 'csrf|' . ($_COOKIE[G_COOKIE] ?? ''), (string)g_cfg('session_secret'), true)); }

// ---------- Microsoft ----------
function g_state_file(string $s): string { return g_data() . '/gestion/state-' . $s . '.json'; }
function g_login_url(string $next): string {
    $state = b64u(random_bytes(24)); $verifier = b64u(random_bytes(48)); $nonce = b64u(random_bytes(16));
    foreach (glob(g_data() . '/gestion/state-*.json') ?: [] as $f) if (filemtime($f) < time() - 900) @unlink($f);
    file_put_contents(g_state_file($state), json_encode(['v' => $verifier, 'n' => $nonce, 'next' => $next, 'exp' => time() + 600]), LOCK_EX);
    return g_authority() . '/authorize?' . http_build_query([
        'client_id' => g_cfg('ms_client_id'), 'response_type' => 'code', 'redirect_uri' => g_redirect_uri(), 'response_mode' => 'query',
        'scope' => 'openid profile email', 'state' => $state, 'nonce' => $nonce,
        'code_challenge' => b64u(hash('sha256', $verifier, true)), 'code_challenge_method' => 'S256',
        'login_hint' => g_admin(), 'prompt' => 'select_account']);
}
// Devuelve [email, next] o lanza una excepción con un mensaje para la persona
function g_callback(array $q): array {
    if (!empty($q['error'])) throw new RuntimeException((string)($q['error_description'] ?? $q['error']));
    $state = (string)($q['state'] ?? ''); $code = (string)($q['code'] ?? '');
    if (!preg_match('/^[A-Za-z0-9_-]{32}$/', $state) || $code === '') throw new RuntimeException('Respuesta de Microsoft incompleta.');
    $f = g_state_file($state); $p = is_file($f) ? json_decode((string)file_get_contents($f), true) : null; @unlink($f);
    if (!is_array($p) || $p['exp'] < time()) throw new RuntimeException('El inicio de sesión ha caducado. Vuelve a intentarlo.');
    $ch = curl_init(g_authority() . '/token');
    curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 25,
        CURLOPT_HTTPHEADER => ['Content-Type: application/x-www-form-urlencoded'],
        CURLOPT_POSTFIELDS => http_build_query(['client_id' => g_cfg('ms_client_id'), 'client_secret' => g_cfg('ms_client_secret'),
            'grant_type' => 'authorization_code', 'code' => $code, 'redirect_uri' => g_redirect_uri(), 'code_verifier' => $p['v'], 'scope' => 'openid profile email'])]);
    $res = curl_exec($ch); $http = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE); curl_close($ch);
    $tok = json_decode((string)$res, true) ?: [];
    if ($res === false || $http >= 400) throw new RuntimeException((string)($tok['error_description'] ?? 'No se ha podido completar el inicio de sesión.'));
    $parts = explode('.', (string)($tok['id_token'] ?? ''));
    $c = count($parts) === 3 ? json_decode(b64u_dec($parts[1]), true) : null;
    $tenant = strtolower((string)g_cfg('ms_tenant_id'));
    if (!is_array($c)) throw new RuntimeException('Respuesta de Microsoft no válida.');
    if (($c['aud'] ?? '') !== g_cfg('ms_client_id')) throw new RuntimeException('El token no es para esta aplicación.');
    if (($c['exp'] ?? 0) < time() - 60) throw new RuntimeException('El inicio de sesión ha caducado.');
    if (!hash_equals($p['n'], (string)($c['nonce'] ?? ''))) throw new RuntimeException('El inicio de sesión no es válido.');
    if (strtolower((string)($c['tid'] ?? '')) !== $tenant) throw new RuntimeException('La cuenta no pertenece al directorio de OdlC.');
    if (strtolower((string)($c['iss'] ?? '')) !== "https://login.microsoftonline.com/$tenant/v2.0") throw new RuntimeException('Emisor del token no reconocido.');
    $email = strtolower(trim((string)($c['preferred_username'] ?? '')));
    if ($email !== g_admin()) throw new RuntimeException('Esta área es privada. La cuenta ' . $email . ' no tiene acceso.');
    return [$email, (string)$p['next']];
}
