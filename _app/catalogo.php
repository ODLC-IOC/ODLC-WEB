<?php
// Qué hay en el área privada. Los archivos viven en /contenido y solo se sirven con sesión,
// salvo la presentación de cada cliente, que se abre con su enlace (como «cualquiera con el enlace» de OneDrive).
return [
  'presentaciones' => [
    'titulo' => 'Presentaciones',
    'grupos' => [
      'in-vest' => [
        'titulo' => 'IN&VEST',
        'subtitulo' => 'Inversión, gestión y desinversión inmobiliaria · Propuesta de noviembre de 2026',
        // Enlace para el cliente: https://gestion.odlc.es/p/<enlace>. Para revocarlo, cambia el valor.
        'enlace' => '5a37FYkEIfomwo7SkGiU5cTX',
        'compartida' => 'presentaciones/in-vest/presentacion-web.html',
        // Lo único que se abre además desde la presentación del cliente
        'compartida_extra' => ['informe' => 'presentaciones/in-vest/branding-invest.html', 'informe.pdf' => 'presentaciones/in-vest/Informe_de_marca_IN-VEST.pdf'],
        'items' => [
          ['archivo' => 'presentaciones/in-vest/OdlC_para_IN-VEST.html', 'titulo' => 'Presentación para el cliente', 'nota' => 'Sin precios, con menú de secciones y el informe de marca en PDF dentro. Para descargar y llevar sin conexión.', 'tipo' => 'Cliente', 'descarga' => true, 'cat' => 'presentaciones'],
          ['archivo' => 'presentaciones/in-vest/guion.html', 'titulo' => 'Guión completo', 'nota' => 'Versión larga con las hojas de precios. Tecla N: notas del ponente.', 'tipo' => 'Interno', 'cat' => 'presentaciones'],
          ['archivo' => 'presentaciones/in-vest/branding-invest.html', 'titulo' => 'Informe de marca · web', 'nota' => 'Con los logotipos desplegables y el portal con cada logo.', 'tipo' => 'Web', 'cat' => 'informes'],
          ['archivo' => 'presentaciones/in-vest/Informe_de_marca_IN-VEST.pdf', 'titulo' => 'Informe de marca · PDF', 'nota' => 'Igual que la web, en una sola página continua.', 'tipo' => 'PDF', 'descarga' => true, 'cat' => 'informes'],
          ['archivo' => 'presentaciones/in-vest/contrato-gestion.html', 'titulo' => 'Generador del contrato de gestión', 'nota' => 'Operación, partes, importes y funciones. Descarga el Word.', 'tipo' => 'Herramienta', 'cat' => 'contratos'],
          ['archivo' => 'presentaciones/in-vest/Contrato_de_gestion_operativa_plantilla.docx', 'titulo' => 'Contrato de gestión · plantilla Word', 'nota' => 'Anónima, con los huecos en amarillo.', 'tipo' => 'Word', 'descarga' => true, 'cat' => 'contratos'],
        ],
      ],
    ],
  ],
];
