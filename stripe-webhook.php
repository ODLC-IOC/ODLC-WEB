<?php
// Aviso de Stripe cuando el cliente paga: añade la fecha de pago y reenvía la copia.
// Se activa al poner 'stripe_webhook_secret' en odlc_privado/config.php.
declare(strict_types=1);
require __DIR__ . '/inc/contratos.php';

$secret = odlc_config()['stripe_webhook_secret'];
$payload = (string)file_get_contents('php://input');
$sig = (string)($_SERVER['HTTP_STRIPE_SIGNATURE'] ?? '');
if (!$secret) { http_response_code(503); exit('No configurado'); }

parse_str(str_replace(',', '&', $sig), $p);
$t = (string)($p['t'] ?? '');
$ok = $t !== '' && abs(time() - (int)$t) < 600 && isset($p['v1'])
    && hash_equals(hash_hmac('sha256', $t . '.' . $payload, $secret), (string)$p['v1']);
if (!$ok) { http_response_code(400); exit('Firma no válida'); }

$ev = json_decode($payload, true);
if (($ev['type'] ?? '') === 'checkout.session.completed') {
    $s = $ev['data']['object'] ?? [];
    $ref = (string)($s['client_reference_id'] ?? '');
    $c = $ref !== '' ? odlc_cargar($ref) : null;
    if ($c && empty($c['fecha_pago']) && ($s['payment_status'] ?? '') === 'paid') {
        $c['fecha_pago'] = date('c', (int)($ev['created'] ?? time()));
        $total = isset($s['amount_total']) ? number_format($s['amount_total'] / 100, 2, ',', '.') . ' €' : '';
        $c['importe_pagado'] = $c['pago'] === 'cuotas' && $total ? 'primera cuota, ' . $total : $total;
        $c['stripe_sesion'] = (string)($s['id'] ?? '');
        odlc_guardar($c);
        odlc_enviar($c, 'Diagnóstico ODLC · Pago recibido · ' . $c['ref']);
    }
}
http_response_code(200);
echo 'ok';
