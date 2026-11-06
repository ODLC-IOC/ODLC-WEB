<?php
// Catálogo del área de gestión.
// - 'servicios': las secciones del menú (las mismas para Isabel y para cada cliente).
// - 'clientes': cada cliente con su enlace y sus documentos. 'cliente' => true hace visible el documento en su portal.
// Cada cliente tiene su página (https://gestion.odlc.es/<slug>). Por ahora se entra con el enlace que lleva la llave
// (https://gestion.odlc.es/<slug>?k=<enlace>), como «cualquiera con el enlace» de OneDrive; el navegador la recuerda 30 días.
// Para pedir contraseña, pon en 'clave' el resultado de password_hash('la-contraseña', PASSWORD_DEFAULT).
return [
  'servicios' => [
    'presentaciones' => ['Presentaciones', 'Propuestas y presentaciones de OdlC.'],
    'corporate'      => ['Corporate', 'Sociedades, órganos, poderes, juntas, actas, pactos y contratos.'],
    'compliance'     => ['Compliance', 'Prevención del blanqueo, protección de datos, canal interno y perímetro regulatorio.'],
    'branding'       => ['Branding y web', 'Marca, logotipo, web, zona privada, presentaciones e informes con vuestra imagen.'],
    'contabilidad'   => ['Contabilidad y fiscal', 'Contabilidad, impuestos, facturación con VeriFactu y cierres.'],
    'estrategia'     => ['Estrategia', 'Plan de negocio, modelos, coinversión, gestión de proyectos e informes a inversores.'],
    'tecnologia'     => ['Tecnología e IA', 'CRM, automatizaciones, agentes de IA y ciberseguridad.'],
    'seguros'        => ['Seguros', 'Responsabilidad civil y coberturas de cada operación.'],
    'admin'          => ['Administración OdlC', 'Facturas de OdlC y contratos firmados entre vosotros y OdlC.'],
  ],
  'clientes' => [
    'in-vest' => [
      'nombre' => 'IN&VEST',
      'slug' => 'in&vest',                      // su página: https://gestion.odlc.es/in&vest
      'descripcion' => 'Inversión, gestión y desinversión inmobiliaria · Propuesta de noviembre de 2026',
      'enlace' => '5a37FYkEIfomwo7SkGiU5cTX',   // para revocar el acceso, cambia el valor
      'clave' => '',                            // vacío = basta con el enlace
      'docs' => [
        'presentacion' => ['archivo' => 'presentaciones/in-vest/presentacion-web.html', 'servicio' => 'presentaciones', 'titulo' => 'Propuesta de servicios', 'nota' => 'Backoffice, frontoffice y estrategia. Se pasa como diapositivas, con menú de secciones.', 'tipo' => 'Presentación', 'cliente' => true],
        'presentacion-archivo' => ['archivo' => 'presentaciones/in-vest/OdlC_para_IN-VEST.html', 'servicio' => 'presentaciones', 'titulo' => 'Propuesta de servicios · archivo', 'nota' => 'La misma presentación en un solo archivo, con el informe de marca en PDF dentro. Para llevar sin conexión.', 'tipo' => 'Archivo', 'descarga' => true],
        'guion' => ['archivo' => 'presentaciones/in-vest/guion.html', 'servicio' => 'presentaciones', 'titulo' => 'Guión completo', 'nota' => 'Versión larga con las hojas de precios. Tecla N: notas del ponente.', 'tipo' => 'Interno'],
        'informe-marca' => ['archivo' => 'presentaciones/in-vest/branding-invest.html', 'servicio' => 'branding', 'titulo' => 'Informe de marca', 'nota' => 'Idea y frase de marca, propuestas de logotipo, competencia, web, portal del inversor y registro de marca.', 'tipo' => 'Informe', 'cliente' => true],
        'informe-marca-pdf' => ['archivo' => 'presentaciones/in-vest/Informe_de_marca_IN-VEST.pdf', 'servicio' => 'branding', 'titulo' => 'Informe de marca · PDF', 'nota' => 'El mismo informe en PDF.', 'tipo' => 'PDF', 'descarga' => true, 'cliente' => true],
        'contrato-generador' => ['archivo' => 'presentaciones/in-vest/contrato-gestion.html', 'servicio' => 'corporate', 'titulo' => 'Generador del contrato de gestión', 'nota' => 'Operación, partes, importes y funciones. Descarga el Word.', 'tipo' => 'Herramienta'],
        'contrato-plantilla' => ['archivo' => 'presentaciones/in-vest/Contrato_de_gestion_operativa_plantilla.docx', 'servicio' => 'corporate', 'titulo' => 'Contrato de gestión · plantilla Word', 'nota' => 'Anónima, con los huecos en amarillo.', 'tipo' => 'Word', 'descarga' => true],
      ],
      // Archivos que la presentación abre por dentro (informe de marca)
      'extra' => ['informe' => 'informe-marca', 'informe.pdf' => 'informe-marca-pdf'],
    ],
  ],
];
