<?php
declare(strict_types=1);
require __DIR__ . '/inc/contratos.php';

$errores = []; $c = null; $v = $_POST;
$req = static fn(string $k) => trim((string)($v[$k] ?? ''));

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if ($req('web') !== '') { http_response_code(400); exit; } // trampa para robots
    $tipo = $req('tipo') === 'particular' ? 'particular' : 'empresa';
    $pago = $req('pago');
    $permitidos = $tipo === 'empresa' ? ['unico', 'cuotas'] : ['unico', 'klarna'];
    foreach (['nombre' => 'el nombre o la razón social', 'nif' => 'el NIF o CIF', 'domicilio' => 'el domicilio', 'email' => 'el correo electrónico', 'firma' => 'su nombre completo como firma'] as $k => $txt) {
        if ($req($k) === '') { $errores[] = 'Falta ' . $txt . '.'; }
    }
    if ($tipo === 'empresa' && $req('representante') === '') { $errores[] = 'Falta el nombre de quien firma en nombre de la empresa.'; }
    if ($req('email') !== '' && !filter_var($req('email'), FILTER_VALIDATE_EMAIL)) { $errores[] = 'El correo electrónico no es válido.'; }
    if (!in_array($pago, $permitidos, true)) { $errores[] = 'Elija una forma de pago.'; }
    if (empty($v['acepto'])) { $errores[] = 'Debe aceptar las condiciones.'; }
    if ($tipo === 'particular' && empty($v['inicio'])) { $errores[] = 'Debe solicitar el inicio inmediato del servicio.'; }

    if (!$errores) {
        $cond = odlc_condiciones_html();
        $c = [
            'ref' => odlc_nueva_referencia(), 'tipo' => $tipo, 'pago' => $pago,
            'nombre' => $req('nombre'), 'nif' => strtoupper($req('nif')), 'domicilio' => $req('domicilio'),
            'representante' => $req('representante'), 'cargo' => $req('cargo'),
            'email' => $req('email'), 'telefono' => $req('telefono'), 'firma' => $req('firma'),
            'fecha_aceptacion' => date('c'), 'ip' => (string)($_SERVER['REMOTE_ADDR'] ?? ''),
            'navegador' => substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 200),
            'condiciones' => $cond, 'huella' => hash('sha256', $cond),
            'fecha_pago' => null, 'importe_pagado' => null,
        ];
        odlc_guardar($c);
        $c['correo_enviado'] = odlc_enviar($c, 'Diagnóstico ODLC · Condiciones aceptadas · ' . $c['ref']);
        odlc_guardar($c);
    }
}

// Página con la misma cabecera y pie que el resto de la web
$plantilla = (string)file_get_contents(__DIR__ . '/condiciones-diagnostico.html');
ob_start();
if ($c) {
    $pagar = odlc_enlace_pago($c); ?>
<section class="block"><div class="wrap prose">
  <h1>Compra registrada</h1>
  <p>Gracias, <?= h($c['firma']) ?>. Hemos registrado su aceptación con la referencia <b><?= h($c['ref']) ?></b><?= $c['correo_enviado'] ? ' y le hemos enviado una copia a <b>' . h($c['email']) . '</b>' : '' ?>.</p>
  <?php if ($pagar): ?>
    <p><a class="btn btn-primary" href="<?= h($pagar) ?>">Pagar y reservar la reunión inicial</a></p>
    <p class="note">Al completar el pago podrá elegir la fecha de la reunión inicial y recibirá la copia con la fecha de pago.</p>
  <?php else: ?>
    <p>En breve le enviaremos el enlace de pago. Al recibir el pago, le llegará la copia con la fecha de pago y el enlace para reservar la reunión inicial.</p>
  <?php endif; ?>
  <hr><?= odlc_documento($c) ?>
</div></section>
<?php } else { $s = static fn(string $k, string $val) => $req($k) === $val ? 'checked' : ''; ?>
<section class="block"><div class="wrap prose">
  <h1>Comprar el Diagnóstico ODLC</h1>
  <p>1.900 € + IVA · se descuenta íntegramente si después contrata el recorrido. Rellene sus datos y acepte las condiciones de compra. Recibirá una copia por correo con la fecha de aceptación y, después, con la fecha de pago.</p>
  <?php if ($errores): ?><div class="note" role="alert" style="border-left:4px solid #a33;padding:8px 12px"><?php foreach ($errores as $e) { echo '<p style="margin:4px 0">' . h($e) . '</p>'; } ?></div><?php endif; ?>
  <form class="form" method="POST" action="contratar-diagnostico.php" id="contratar">
    <p hidden><label>No rellenar <input name="web"></label></p>
    <div><label>Contrata como…</label><div class="radio-cards two">
      <label class="radio-card"><input type="radio" name="tipo" value="empresa" <?= $req('tipo') !== 'particular' ? 'checked' : '' ?>><b>Empresa o profesional</b><small>Sociedad, autónomo o grupo</small></label>
      <label class="radio-card"><input type="radio" name="tipo" value="particular" <?= $s('tipo', 'particular') ?>><b>Particular o familia</b><small>Como persona física</small></label>
    </div></div>
    <div class="row"><div><label for="c-nombre">Nombre o razón social</label><input id="c-nombre" name="nombre" required value="<?= h($req('nombre')) ?>"></div>
      <div><label for="c-nif">NIF o CIF</label><input id="c-nif" name="nif" required value="<?= h($req('nif')) ?>"></div></div>
    <div><label for="c-dom">Domicilio</label><input id="c-dom" name="domicilio" required value="<?= h($req('domicilio')) ?>"></div>
    <div class="row" data-solo="empresa"><div><label for="c-rep">Firma en nombre de la empresa</label><input id="c-rep" name="representante" value="<?= h($req('representante')) ?>"></div>
      <div><label for="c-cargo">Cargo</label><input id="c-cargo" name="cargo" placeholder="Administrador único, consejero delegado…" value="<?= h($req('cargo')) ?>"></div></div>
    <div class="row"><div><label for="c-email">Correo electrónico</label><input id="c-email" type="email" name="email" required value="<?= h($req('email')) ?>"></div>
      <div><label for="c-tel">Teléfono (opcional)</label><input id="c-tel" type="tel" name="telefono" value="<?= h($req('telefono')) ?>"></div></div>
    <div><label>Forma de pago</label><div class="radio-cards">
      <label class="radio-card"><input type="radio" name="pago" value="unico" <?= $req('pago') === '' || $s('pago', 'unico') ? 'checked' : '' ?>><b>Pago único</b><small>Con tarjeta, al contratar</small></label>
      <label class="radio-card" data-solo="empresa"><input type="radio" name="pago" value="cuotas" <?= $s('pago', 'cuotas') ?>><b>Tres cuotas</b><small>Al contratar, a los 15 y a los 30 días</small></label>
      <label class="radio-card" data-solo="particular"><input type="radio" name="pago" value="klarna" <?= $s('pago', 'klarna') ?>><b>Plazos con Klarna</b><small>Klarna le ofrece los plazos al pagar</small></label>
    </div></div>
    <label class="consent"><input type="checkbox" name="acepto" value="1" required><span>He leído y acepto las <a href="condiciones-diagnostico.html" target="_blank" rel="noopener">condiciones de compra del Diagnóstico ODLC</a>, incluido que el precio es total y no cancelable.</span></label>
    <label class="consent" data-solo="particular"><input type="checkbox" name="inicio" value="1"><span>Solicito que el Diagnóstico comience de inmediato y reconozco que, una vez prestado por completo, perderé el derecho de desistimiento; si desisto antes, abonaré las fases ya iniciadas.</span></label>
    <div><label for="c-firma">Firma: escriba su nombre completo</label><input id="c-firma" name="firma" required autocomplete="name" value="<?= h($req('firma')) ?>"></div>
    <div><button class="btn btn-primary" type="submit">Aceptar y continuar al pago</button></div>
    <p class="form-note">Se registrarán la fecha, la hora y la dirección IP de su aceptación. Datos tratados según la <a href="privacidad.html">política de privacidad</a>.</p>
  </form>
</div></section>
<script>
(function(){var f=document.getElementById('contratar');function upd(){var t=f.querySelector('input[name=tipo]:checked').value;
f.querySelectorAll('[data-solo]').forEach(function(e){var on=e.getAttribute('data-solo')===t;e.hidden=!on;e.querySelectorAll('input').forEach(function(i){i.disabled=!on;});});
var r=f.querySelector('#c-rep');if(r)r.required=(t==='empresa');var ini=f.querySelector('input[name=inicio]');if(ini)ini.required=(t==='particular');
var p=f.querySelector('input[name=pago]:checked');if(!p||p.disabled){f.querySelector('input[name=pago][value=unico]').checked=true;}}
f.addEventListener('change',upd);upd();})();
</script>
<?php }
$main = '<main id="contenido">' . ob_get_clean() . '</main>';
$out = preg_replace_callback('#<main id="contenido">.*?</main>#s', static fn() => $main, $plantilla, 1);
$out = str_replace('<title>Condiciones del Diagnóstico · ODLC</title>', '<title>Comprar el Diagnóstico · ODLC</title>', $out);
header('Cache-Control: no-store');
echo $out;
