<?php
// Microsoft 365 (Outlook + Teams) con Microsoft Graph.
// OAuth 2.0 «authorization code» + PKCE, aplicación web confidencial.
// Permisos delegados: openid, offline_access, User.Read, Calendars.ReadWrite.
// El token de actualización se guarda cifrado (libsodium) en _datos; nunca llega al navegador.
declare(strict_types=1);

const SCOPES = 'openid offline_access User.Read Calendars.ReadWrite';

class GraphError extends RuntimeException {}

function ms_missing(): array {
    $m = [];
    foreach (['ms_tenant_id', 'ms_client_id', 'ms_client_secret', 'token_key'] as $k) if (cfg($k) === '') $m[] = $k;
    if (cfg('token_key') !== '' && strlen(base64_decode((string)cfg('token_key'))) !== SODIUM_CRYPTO_SECRETBOX_KEYBYTES) $m[] = 'token_key (32 bytes)';
    return $m;
}
function graph_base(): string { return rtrim((string)cfg('graph_base', 'https://graph.microsoft.com/v1.0'), '/'); }
function authority(): string { return rtrim((string)cfg('login_base', 'https://login.microsoftonline.com'), '/') . '/' . rawurlencode((string)cfg('ms_tenant_id')) . '/oauth2/v2.0'; }
function redirect_uri(): string { return (string)cfg('ms_redirect_uri', site_url() . '/api/ms/callback'); }

function enc(string $t): string { $n = random_bytes(SODIUM_CRYPTO_SECRETBOX_NONCEBYTES); return base64_encode($n . sodium_crypto_secretbox($t, $n, base64_decode((string)cfg('token_key')))); }
function dec(string $b): string {
    $raw = base64_decode($b);
    $p = sodium_crypto_secretbox_open(substr($raw, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), substr($raw, 0, SODIUM_CRYPTO_SECRETBOX_NONCEBYTES), base64_decode((string)cfg('token_key')));
    if ($p === false) throw new GraphError('No se ha podido leer la conexión con Microsoft 365.');
    return $p;
}

function http_req(string $method, string $url, array $headers = [], ?string $body = null): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => $method, CURLOPT_RETURNTRANSFER => true, CURLOPT_HTTPHEADER => $headers, CURLOPT_TIMEOUT => 25]);
    if ($body !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
    $res = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
    $err = curl_error($ch);
    curl_close($ch);
    if ($res === false) throw new GraphError('No se ha podido conectar con Microsoft: ' . $err);
    return [$code, json_decode((string)$res, true) ?? []];
}

function token_request(array $params): array {
    [$code, $d] = http_req('POST', authority() . '/token', ['Content-Type: application/x-www-form-urlencoded'],
        http_build_query(['client_id' => cfg('ms_client_id'), 'client_secret' => cfg('ms_client_secret'), 'scope' => SCOPES] + $params));
    if ($code >= 400) { $e = new GraphError($d['error_description'] ?? ($d['error'] ?? "Error $code al obtener el token")); throw $e; }
    return $d;
}

function ms_authorize_url(): string {
    $state = b64u(random_bytes(24));
    $verifier = b64u(random_bytes(48));
    set_json('ms/state-' . $state, ['verifier' => $verifier, 'exp' => time() + 600]);
    return authority() . '/authorize?' . http_build_query([
        'client_id' => cfg('ms_client_id'), 'response_type' => 'code', 'redirect_uri' => redirect_uri(), 'response_mode' => 'query',
        'scope' => SCOPES, 'state' => $state, 'code_challenge' => b64u(hash('sha256', $verifier, true)), 'code_challenge_method' => 'S256',
        'login_hint' => admin_email(), 'prompt' => 'select_account',
    ]);
}

function ms_callback(array $q): array {
    if (!empty($q['error'])) throw new GraphError($q['error_description'] ?? $q['error']);
    $state = (string)($q['state'] ?? ''); $code = (string)($q['code'] ?? '');
    if (!preg_match('/^[A-Za-z0-9_-]{32}$/', $state) || $code === '') throw new GraphError('Respuesta de Microsoft incompleta.');
    $p = get_json('ms/state-' . $state); del_key('ms/state-' . $state);
    if (!$p || $p['exp'] < time()) throw new GraphError('La autorización ha caducado. Vuelve a intentarlo.');
    $tok = token_request(['grant_type' => 'authorization_code', 'code' => $code, 'redirect_uri' => redirect_uri(), 'code_verifier' => $p['verifier']]);
    $me = graph('GET', '/me?$select=displayName,mail,userPrincipalName', null, $tok['access_token']);
    $acc = strtolower((string)($me['mail'] ?? $me['userPrincipalName'] ?? ''));
    if ($acc !== admin_email()) throw new GraphError("La cuenta $acc no está autorizada. Entra con " . admin_email() . '.');
    $cal = graph('GET', '/me/calendar?$select=allowedOnlineMeetingProviders', null, $tok['access_token']);
    $prov = $cal['allowedOnlineMeetingProviders'] ?? [];
    set_json('ms/token', ['refresh' => enc($tok['refresh_token']), 'account' => $acc, 'providers' => $prov, 'teams' => in_array('teamsForBusiness', $prov, true), 'connectedAt' => time() * 1000]);
    return ['account' => $acc];
}

function ms_status(): array {
    if ($m = ms_missing()) return ['configured' => false, 'missing' => $m];
    $t = get_json('ms/token');
    if (!$t) return ['configured' => true, 'connected' => false];
    return ['configured' => true, 'connected' => true, 'account' => $t['account'], 'teams' => $t['teams'], 'providers' => $t['providers']];
}
function ms_ready(): bool { $s = ms_status(); return !empty($s['connected']) && !empty($s['teams']); }

function access_token(): string {
    static $cached = null;
    if ($cached) return $cached;
    if (ms_missing()) throw new GraphError('La integración con Microsoft 365 no está configurada.');
    $t = get_json('ms/token');
    if (!$t) throw new GraphError('Microsoft 365 no está conectado. Conéctalo desde el panel.');
    try { $tok = token_request(['grant_type' => 'refresh_token', 'refresh_token' => dec($t['refresh'])]); }
    catch (GraphError $e) { del_key('ms/token'); throw new GraphError('La conexión con Microsoft 365 ha caducado. Vuelve a conectarla desde el panel.'); }
    if (!empty($tok['refresh_token'])) { $t['refresh'] = enc($tok['refresh_token']); set_json('ms/token', $t); }
    return $cached = $tok['access_token'];
}

function graph(string $method, string $path, ?array $body = null, ?string $token = null, string $tzPref = ODLC_TZ): array {
    [$code, $d] = http_req($method, graph_base() . $path, [
        'Authorization: Bearer ' . ($token ?? access_token()), 'Content-Type: application/json', 'Prefer: outlook.timezone="' . $tzPref . '"',
    ], $body === null ? null : json_encode($body, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES));
    if ($code >= 400) { $e = new GraphError($d['error']['message'] ?? "Microsoft Graph respondió $code"); throw $e; }
    return $d;
}
function graph_code(string $method, string $path, ?array $body = null): int {
    [$code] = http_req($method, graph_base() . $path, ['Authorization: Bearer ' . access_token(), 'Content-Type: application/json'], $body === null ? null : json_encode($body));
    return $code;
}

// ---------- Eventos ----------
function local_iso(int $ms): string { return dt($ms)->format('Y-m-d\TH:i:s'); }
function links_html(array $m): string {
    return '<p style="font-family:Arial,sans-serif;font-size:14px;color:#17302A">'
        . '<b>OdlC</b> · <a href="' . esc(invite_url($m)) . '">Invitación, materiales y calendario</a> · <a href="' . esc(card_url()) . '">Tarjeta de contacto de ' . esc(ODLC_NOMBRE) . '</a></p><hr>';
}
function event_payload(array $m, bool $invite): array {
    $text = implode("\n\n", array_filter([$m['description'] ?? '', 'Por OdlC: ' . implode(', ', team_of($m)), !empty($m['guestName']) ? 'Invitado: ' . $m['guestName'] : '']));
    $e = [
        'subject' => $m['subject'],
        'body' => ['contentType' => 'HTML', 'content' => links_html($m) . '<p>' . nl2br(esc($text)) . '</p>'],
        'start' => ['dateTime' => local_iso($m['startUtc']), 'timeZone' => ODLC_TZ],
        'end' => ['dateTime' => local_iso($m['endUtc']), 'timeZone' => ODLC_TZ],
    ];
    if ($invite && !empty($m['guestEmail'])) $e['attendees'] = [['emailAddress' => ['address' => $m['guestEmail'], 'name' => $m['guestName'] ?: $m['guestEmail']], 'type' => 'required']];
    return $e;
}
function create_teams_event(array $m, bool $invite): array {
    $ev = graph('POST', '/me/events', event_payload($m, $invite) + ['isOnlineMeeting' => true, 'onlineMeetingProvider' => 'teamsForBusiness', 'transactionId' => $m['id']]);
    $join = $ev['onlineMeeting']['joinUrl'] ?? '';
    for ($i = 0; !$join && $i < 4; $i++) { usleep(1200000); $a = graph('GET', '/me/events/' . rawurlencode($ev['id']) . '?$select=onlineMeeting'); $join = $a['onlineMeeting']['joinUrl'] ?? ''; }
    if (!$join) throw new GraphError('Outlook ha creado el evento, pero Microsoft no ha devuelto el enlace de Teams. Revisa que tu cuenta permite reuniones de Teams o usa el modo manual.');
    return ['eventId' => $ev['id'], 'joinUrl' => $join];
}
function update_teams_event(array $m, bool $invite): void { graph('PATCH', '/me/events/' . rawurlencode($m['graphEventId']), event_payload($m, $invite)); }
function cancel_teams_event(array $m): void {
    $id = rawurlencode($m['graphEventId']);
    $c = graph_code('POST', "/me/events/$id/cancel", ['comment' => 'Reunión cancelada.']);
    if ($c === 400) $c = graph_code('DELETE', "/me/events/$id");
    if ($c >= 400 && $c !== 404) throw new GraphError("Outlook no ha podido cancelar el evento ($c).");
}

// ---------- Eventos de Outlook / Bookings ya existentes ----------
function outlook_events(): array {
    $from = gmdate('Y-m-d\TH:i:s\Z'); $to = gmdate('Y-m-d\TH:i:s\Z', time() + 60 * 86400);
    $d = graph('GET', '/me/calendarView?' . http_build_query(['startDateTime' => $from, 'endDateTime' => $to, '$top' => 100, '$orderby' => 'start/dateTime',
        '$select' => 'id,subject,start,end,isOnlineMeeting,onlineMeeting,attendees,isCancelled,bodyPreview,categories,transactionId,organizer'], '', '&', PHP_QUERY_RFC3986), null, null, 'UTC');
    $linked = get_json('ms/linked') ?? [];
    $out = [];
    foreach ($d['value'] ?? [] as $e) {
        $join = $e['onlineMeeting']['joinUrl'] ?? '';
        if (!$join || !empty($e['isCancelled'])) continue;
        $guest = null;
        foreach ($e['attendees'] ?? [] as $a) { $addr = strtolower($a['emailAddress']['address'] ?? ''); if ($addr && $addr !== admin_email()) { $guest = $a['emailAddress']; break; } }
        $start = strtotime($e['start']['dateTime'] . 'Z') * 1000; $end = strtotime($e['end']['dateTime'] . 'Z') * 1000;
        $mid = $linked[$e['id']] ?? (preg_match(ID_RE, (string)($e['transactionId'] ?? '')) && get_json('m/' . $e['transactionId']) ? $e['transactionId'] : null);
        $preview = (string)($e['bodyPreview'] ?? '');
        $out[] = ['eventId' => $e['id'], 'subject' => $e['subject'] ?? '(sin asunto)', 'startUtc' => $start, 'endUtc' => $end,
            'fecha' => fecha_larga($start), 'hora' => hora_corta($start), 'horaFin' => hora_corta($end), 'joinUrl' => $join,
            'guestName' => $guest['name'] ?? '', 'guestEmail' => strtolower($guest['address'] ?? ''), 'meetingId' => $mid,
            'bookings' => (bool)preg_match('/bookings|bookwithme|reserva/i', $preview . ' ' . implode(' ', $e['categories'] ?? []))];
    }
    return $out;
}

// Crea la invitación de un evento de Outlook/Bookings y añade sus enlaces dentro del propio evento
function import_outlook_event(array $ev): array {
    $now = time() * 1000; $id = new_id();
    $dur = (int)round(($ev['endUtc'] - $ev['startUtc']) / 60000);
    $m = ['id' => $id, 'uid' => "$id@odlc.es", 'mode' => 'outlook', 'source' => $ev['bookings'] ? 'bookings' : 'outlook', 'tz' => ODLC_TZ, 'status' => 'programada', 'sequence' => 0,
        'createdAt' => $now, 'updatedAt' => $now, 'subject' => mb_substr($ev['subject'], 0, 160), 'guestName' => mb_substr($ev['guestName'], 0, 120), 'guestEmail' => $ev['guestEmail'],
        'guestPhone' => '', 'description' => '', 'notes' => '', 'team' => [ODLC_NOMBRE], 'startUtc' => $ev['startUtc'], 'endUtc' => $ev['endUtc'], 'duration' => $dur,
        'teamsUrl' => $ev['joinUrl'], 'graphEventId' => $ev['eventId'], 'materials' => []];
    set_json("m/$id", $m);
    $linked = get_json('ms/linked') ?? []; $linked[$ev['eventId']] = $id; set_json('ms/linked', $linked);
    // Añade al principio del cuerpo del evento los enlaces de la invitación y de la tarjeta (sin tocar el bloque de Teams)
    try {
        $full = graph('GET', '/me/events/' . rawurlencode($ev['eventId']) . '?$select=body');
        $html = (string)($full['body']['content'] ?? '');
        $new = preg_match('/<body[^>]*>/i', $html) ? preg_replace('/(<body[^>]*>)/i', '$1' . links_html($m), $html, 1) : links_html($m) . $html;
        graph('PATCH', '/me/events/' . rawurlencode($ev['eventId']), ['body' => ['contentType' => 'HTML', 'content' => $new]]);
        $m['outlookUpdated'] = true;
    } catch (GraphError $e) { $m['outlookUpdated'] = false; }
    set_json("m/$id", $m);
    return $m;
}

// Reservas de Bookings: crea las invitaciones solas (se llama desde el panel y desde el cron)
function sync_bookings(): int {
    if (!cfg('auto_bookings', true) || !ms_ready()) return 0;
    $last = get_json('ms/sync'); if ($last && $last['at'] > time() - 120) return 0;
    set_json('ms/sync', ['at' => time()]);
    $n = 0;
    foreach (outlook_events() as $ev) if ($ev['bookings'] && !$ev['meetingId']) { import_outlook_event($ev); $n++; }
    return $n;
}

// ---------- Disponibilidad para la página de reservas ----------
function busy_intervals(int $fromMs, int $toMs): array {
    $d = graph('GET', '/me/calendarView?' . http_build_query(['startDateTime' => gmdate('Y-m-d\TH:i:s\Z', intdiv($fromMs, 1000)), 'endDateTime' => gmdate('Y-m-d\TH:i:s\Z', intdiv($toMs, 1000)),
        '$top' => 250, '$select' => 'start,end,showAs,isCancelled'], '', '&', PHP_QUERY_RFC3986), null, null, 'UTC');
    $busy = [];
    foreach ($d['value'] ?? [] as $e) {
        if (!empty($e['isCancelled']) || in_array($e['showAs'] ?? 'busy', ['free', 'workingElsewhere'], true)) continue;
        $busy[] = [strtotime($e['start']['dateTime'] . 'Z') * 1000, strtotime($e['end']['dateTime'] . 'Z') * 1000];
    }
    return $busy;
}
