<?php
// Contratación del Diagnóstico ODLC: registro de aceptaciones y copias para el cliente.
// Los datos se guardan fuera de la web (odlc_privado), nunca en public_html.
declare(strict_types=1);
date_default_timezone_set('Europe/Madrid');

const ODLC_EMAIL = 'isabel@odlc.es';
const ODLC_FROM  = 'ODLC <isabel@odlc.es>';

function odlc_priv_dir(): string {
    $root = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? dirname(__DIR__)), '/');
    $dir = dirname($root) . '/odlc_privado';
    if (!is_dir($dir . '/contratos')) { @mkdir($dir . '/contratos', 0750, true); }
    return $dir;
}

function odlc_config(): array {
    $f = odlc_priv_dir() . '/config.php';
    $c = is_file($f) ? (array)(require $f) : [];
    return $c + ['stripe_unico' => '', 'stripe_cuotas' => '', 'stripe_webhook_secret' => ''];
}

function h(?string $s): string { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

function odlc_nueva_referencia(): string {
    $f = odlc_priv_dir() . '/contador.txt';
    $fp = fopen($f, 'c+');
    flock($fp, LOCK_EX);
    $n = (int)stream_get_contents($fp) + 1;
    ftruncate($fp, 0); rewind($fp); fwrite($fp, (string)$n);
    flock($fp, LOCK_UN); fclose($fp);
    return sprintf('ODLC-D-%s-%04d', date('Y'), $n);
}

function odlc_ruta(string $ref): string {
    if (!preg_match('/^ODLC-D-\d{4}-\d{4}$/', $ref)) { throw new RuntimeException('Referencia no válida'); }
    return odlc_priv_dir() . '/contratos/' . $ref . '.json';
}

function odlc_guardar(array $c): void {
    file_put_contents(odlc_ruta($c['ref']), json_encode($c, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
}

function odlc_cargar(string $ref): ?array {
    $f = odlc_ruta($ref);
    return is_file($f) ? json_decode((string)file_get_contents($f), true) : null;
}

// Texto de las condiciones: se toma de condiciones-diagnostico.html, que es la única fuente.
function odlc_condiciones_html(): string {
    $html = (string)file_get_contents(dirname(__DIR__) . '/condiciones-diagnostico.html');
    if (preg_match('#<div class="wrap prose">(.*?)</div></section>#s', $html, $m)) {
        $t = preg_replace('#<h1>.*?</h1>#s', '', $m[1]);
        $t = preg_replace('#<p class="note">.*?</p>#s', '', $t);
        return str_replace(['href="servicios/', 'href="privacidad'], ['href="https://odlc.es/servicios/', 'href="https://odlc.es/privacidad'], $t);
    }
    return '<p>Condiciones disponibles en https://odlc.es/condiciones-diagnostico.html</p>';
}

function odlc_formas_pago(): array {
    return ['unico' => 'Pago único al contratar', 'klarna' => 'Plazos a través de Klarna (particulares)', 'cuotas' => 'Tres cuotas: al contratar, a los 15 y a los 30 días (empresas)'];
}

// Documento que ve y recibe el cliente
function odlc_documento(array $c): string {
    $f = static fn(string $d) => date('d/m/Y \a \l\a\s H:i', strtotime($d)) . ' h';
    $filas = [
        'Referencia' => $c['ref'],
        'Cliente' => $c['nombre'],
        $c['tipo'] === 'empresa' ? 'CIF' : 'NIF' => $c['nif'],
        'Domicilio' => $c['domicilio'],
    ];
    if ($c['tipo'] === 'empresa') { $filas['Representante'] = $c['representante'] . ($c['cargo'] ? ' (' . $c['cargo'] . ')' : ''); }
    $filas += [
        'Correo electrónico' => $c['email'],
        'Teléfono' => $c['telefono'] ?: '—',
        'Tipo de cliente' => $c['tipo'] === 'empresa' ? 'Empresa o profesional' : 'Particular (consumidor)',
        'Forma de pago' => odlc_formas_pago()[$c['pago']] ?? $c['pago'],
        'Precio' => '1.900 € + IVA',
    ];
    $tabla = '';
    foreach ($filas as $k => $v) { $tabla .= '<tr><th style="text-align:left;padding:6px 12px 6px 0;vertical-align:top;white-space:nowrap">' . h($k) . '</th><td style="padding:6px 0">' . h($v) . '</td></tr>'; }

    $acept = '<p><b>Aceptado electrónicamente</b> por ' . h($c['firma']) . ' el ' . h($f($c['fecha_aceptacion'])) . ', desde la dirección IP ' . h($c['ip']) . '.</p>';
    if ($c['tipo'] === 'particular') { $acept .= '<p>El cliente ha solicitado expresamente que el Diagnóstico comience de inmediato, en los términos de la cláusula 8.</p>'; }
    $acept .= !empty($c['fecha_pago'])
        ? '<p><b>Pago recibido</b> el ' . h($f($c['fecha_pago'])) . ($c['importe_pagado'] ? ' · ' . h($c['importe_pagado']) : '') . '.</p>'
        : '<p><b>Pago:</b> pendiente.</p>';
    $acept .= '<p style="font-size:12px;color:#666">Huella del texto aceptado (SHA-256): ' . h($c['huella']) . '</p>';

    return '<h2 style="margin-top:0">Datos de la compra</h2><table style="border-collapse:collapse;font-size:15px">' . $tabla . '</table>'
        . '<div style="border:1px solid #c9b98f;border-radius:8px;padding:12px 16px;margin:20px 0;background:#faf7ef">' . $acept . '</div>'
        . '<h2>Condiciones de compra del Diagnóstico ODLC</h2>' . $c['condiciones'];
}

function odlc_enviar(array $c, string $asunto): bool {
    $cuerpo = '<!doctype html><html><body style="font-family:Georgia,serif;color:#1b1b1b;max-width:720px;margin:auto;line-height:1.5">'
        . '<p>Estimado/a ' . h($c['firma']) . ':</p><p>Le enviamos la copia de las condiciones de compra del <b>Diagnóstico ODLC</b> que ha aceptado en odlc.es. Consérvela para su archivo.</p>'
        . odlc_documento($c)
        . '<p>Para cualquier duda, responda a este correo.</p><p>Isabel Olivares de la Cerda<br>ODLC · Dirección corporativa externa<br><a href="https://odlc.es">odlc.es</a></p></body></html>';
    $asunto = '=?UTF-8?B?' . base64_encode($asunto) . '?=';
    $cab = "MIME-Version: 1.0\r\nContent-Type: text/html; charset=UTF-8\r\nFrom: " . ODLC_FROM . "\r\n";
    $ok1 = @mail($c['email'], $asunto, $cuerpo, $cab . "Reply-To: " . ODLC_EMAIL . "\r\n", '-f' . ODLC_EMAIL);
    $ok2 = @mail(ODLC_EMAIL, $asunto, $cuerpo, $cab . "Reply-To: " . $c['email'] . "\r\n", '-f' . ODLC_EMAIL);
    return $ok1 && $ok2;
}

function odlc_enlace_pago(array $c): string {
    $cfg = odlc_config();
    $base = $c['pago'] === 'cuotas' ? $cfg['stripe_cuotas'] : $cfg['stripe_unico'];
    if (!$base) { return ''; }
    return $base . (strpos($base, '?') !== false ? '&' : '?') . http_build_query(['client_reference_id' => $c['ref'], 'prefilled_email' => $c['email']]);
}
