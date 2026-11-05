# Web de ODLC · Dirección corporativa externa

Web estática de varias páginas, preparada para SEO y para publicarse en Netlify con el dominio **odlc.es**. Versión del 29/10/2026: la web pasa de ser la de una profesional a la de una empresa, ODLC, con un recorrido en cuatro fases, precios propios y un solo camino para empezar (calculadora → sesión gratuita → propuesta por escrito).

## Páginas

| Página | Archivo | Para qué |
|---|---|---|
| Inicio | `index.html` | Promesa, «Una gestoría tramita. ODLC analiza, diseña y dirige», cifras, interlocutor único, recorrido, calculadora, casos y FAQ. Sin foto |
| El recorrido | `servicios/index.html` | Las cuatro fases con su «desde» y los servicios para cuando la empresa crece |
| 1 · Diagnóstico | `servicios/diagnostico-odlc.html` | 1.900 €, descontable del recorrido |
| 2 · Diseño y constitución | `servicios/diseno-y-constitucion.html` | Desde 400 €; paquete «Empresa con socios» 2.400 € |
| 3 · Puesta en marcha | `servicios/puesta-en-marcha.html` | Desde 6.500 €, con desglose, ESG y proyectos digitales |
| 4 · Orden continuo | `servicios/orden-continuo.html` | Desde 850 €/mes: secretaría, compliance y PBC, seguros, campañas ESG |
| Cuando la empresa crece | `servicios/estructuracion-sociedades-spv.html`, `interim-chief-of-staff.html`, `family-office-externo.html` | SPV y reorganizaciones, Chief of Staff fraccional, Family Office |
| Spain Market Entry | `servicios/spain-market-entry.html` y `en/spain-market-entry.html` | El mismo recorrido para extranjeros |
| Formación | `servicios/formacion-derecho-societario.html` | Taller 1.200 €, jornada 2.400 € |
| Calculadora | `calculadora.html` + `assets/js/calculadora.js` | Hacerlo usted, contratar a un interim o hacerlo con ODLC |
| Quiénes somos | `quienes-somos.html` | Isabel como fundadora, red de asesores, casos y herramientas |
| Reservar sesión | `reservar-sesion.html` | Formulario de sesión gratuita o Diagnóstico (formulario de Netlify `diagnostico`) |
| Recursos gratuitos | `recursos.html` | Guía «Que el conocimiento no se vaya con las personas» (PDF en `assets/descargas/`), «Mapa de empresa» (herramienta en `mapa-de-empresa.html` + `assets/js/mapa.js`, que calcula todo en el navegador sin enviar datos; y la skill para Claude en ZIP como opción) y lista rápida de copias de seguridad (`#copias-de-seguridad`). Enlazada en el pie de todas las páginas. Se lanza en LinkedIn el jueves 12/11/2026: la web tiene que estar subida antes |
| Método, tarifas, red, blog y legales | `metodo-odlc.html`, `tarifas.html`, `red-de-colaboradores.html`, `blog/`, `aviso-legal.html`… | |

Páginas retiradas, con redirección 301 en `netlify.toml`: Índice ODLC, Barómetro ODLC, simulador, Sobre Isabel, diagnostico.html y las páginas de Secretaría, Compliance, Seguros e Implantación (integradas en las fases).

## Calculadora

- Las horas por servicio son los supuestos de Isabel y el visitante puede cambiarlas. Los honorarios son las tarifas publicadas y no se pueden cambiar. Se editan en `assets/js/calculadora.js`, en la lista `services`.
- Con los valores por defecto (90 €/h, 4 meses, interim a 75.000 €/año): hacerlo usted 19.500 €, interim 33.700 €, ODLC 13.400 €. Ahorro: 6.100 € y 20.300 €; 120 horas libres. Si cambian los supuestos, actualizar también las cifras de la portada (`index.html`, bloque «Caso tipo»).
- El botón «Reservar sesión gratuita» lleva el resultado al mensaje del formulario.

## Tarifa de lanzamiento

En `assets/js/main.js`, rellenar `LANZAMIENTO` con fecha de fin y texto. Aparece sola en portada, recorrido, tarifas y calculadora, y desaparece al día siguiente de la fecha.

## Publicar en Netlify

1. Entrar en app.netlify.com → **Add new site → Deploy manually** y arrastrar la carpeta completa (no el ZIP).
2. **Domain management → Add a domain**: `odlc.es` y seguir los pasos de DNS.
3. Los formularios se activan solos (Netlify Forms). En **Forms → diagnostico → Notifications**, añadir el aviso por correo a `isabel@odlc.es`.
4. Dar de alta el sitio en Google Search Console y enviar `https://odlc.es/sitemap.xml`.

## Blog: 26 artículos preparados (9 nov. 2026 – 3 may. 2027)

Los 26 artículos están ya en `blog/`, uno por lunes. La portada del blog solo muestra los que ya han llegado a su fecha, así que se puede subir todo de una vez. Para ver todos antes de tiempo: `blog/index.html?todos=1`. Los textos se generan con `build_blog.py` y `blog_data.py`; si se edita un artículo a mano, mantener la fecha en sus datos estructurados.

## Reservar sesión (Microsoft Bookings, 04/11/2026)

En `assets/js/main.js`: `CALENDAR_URL` es la sesión gratuita y la usan todos los botones «Reservar sesión» (se abre en pestaña nueva); `DIAGNOSTICO_URL` es la reunión de arranque del Diagnóstico y aparece en `reservar-sesion.html` y en la página del Diagnóstico. El formulario de `reservar-sesion.html` se mantiene como alternativa por escrito y es adonde lleva «Enviarnos el resultado» del Mapa de empresa.

## Imágenes

Imágenes para redes de cada página en `assets/img/og/` y portadas de los 26 artículos en `assets/img/blog/`, todas con la marca ODLC («Dirección corporativa externa · odlc.es»). Foto de Isabel solo en Quiénes somos y en la firma de los artículos.

## Cookies (art. 22.2 LSSI y Guía de cookies de la AEPD, 2023)

- Hoy la web **no instala ninguna cookie** hasta que alguien guarda una elección, ni se conecta a terceros: las tipografías están alojadas en `assets/fonts/`. Por eso no aparece aviso: no hay nada que consentir.
- `assets/js/cookies.js` es el gestor. Para medir visitas o campañas, pegar el identificador en `GA4_ID` (Google Analytics 4) o `LINKEDIN_PARTNER_ID` (LinkedIn Insight Tag). El aviso aparece solo, con «Aceptar todas», «Rechazar todas» y «Configurar» al mismo nivel, y las herramientas no se cargan hasta que la persona acepta.
- La tabla de `politica-de-cookies.html` se rellena sola con lo que esté activo. «Configurar cookies», al pie de todas las páginas, permite cambiar o retirar el consentimiento.
- Si se añade cualquier otra herramienta de terceros (vídeo incrustado, chat, píxel), hay que darla de alta en el gestor y en la política antes de publicarla.
- Antes de publicar: completar NIF y domicilio en aviso legal, privacidad y cookies.
- Revisión del 04/11/2026: la web sigue sin instalar cookies, así que no lleva aviso. Política de privacidad ampliada (Mapa de empresa, Recursos, Netlify como encargado y transferencia con el Marco de Privacidad UE-EE. UU.). Firmar el DPA de Netlify. Si se incrusta el calendario de reservas dentro de la web (iframe de Calendly o similar), darlo de alta en `cookies.js` antes: instala cookies de terceros. Para medir visitas sin aviso, usar una analítica sin cookies (p. ej. Netlify Analytics, en servidor) y mencionarla en la política de privacidad.

## Newsletter «Empresas y Patrimonios en Orden»

- **LinkedIn:** cuando Isabel cree la newsletter, pegar su enlace en `assets/js/main.js`, en `NEWSLETTER_URL`. Los botones de LinkedIn aparecen solos.
- **Correo:** los altas llegan a Netlify, **Forms → newsletter**. Añadir el aviso por correo y, cuando haya herramienta de envío (p. ej. Brevo), exportar o conectar la lista.

## Partners de la red

En `red-de-colaboradores.html` cada área con partner lleva ficha propia (clase `has-partner` y bloque `.partner`): Crearte Consulting (selección), Solve Legal (contabilidad y tributario), Iuris Corporate (compliance), Sabseg (seguros) e Iván Fernández (IT e IA). También aparecen en «Quién interviene» de cada servicio, en la ficha de Implantación y en el diagrama de la portada.

## Pendiente antes de publicar

- **Recursos · skill «Mapa de empresa»:** la versión publicada (`assets/descargas/skill-mapa-de-empresa.zip`) la ha preparado el equipo con el esquema de la guía. Si Isabel tiene la suya, se sustituye el ZIP manteniendo el nombre del archivo y de la carpeta `mapa-de-empresa`.

- **NIF y domicilio** de Isabel en `aviso-legal.html`, `privacidad.html` y `politica-de-cookies.html` (marcados como [pendiente]). El titular legal de la web sigue siendo Isabel Olivares de la Cerda.
- **Confirmar con Isabel:** precio de Formación (por taller y jornada, no por persona); fecha y condiciones de la tarifa de lanzamiento; las webs que quiere mostrar en «Proyectos recientes»; los módulos de Orden continuo (PBC y seguros); si las campañas ESG llevan precio.
- **Iván Fernández (IT e IA):** su ficha no lleva enlace porque aún no tiene web.
- **Partners:** confirmar con Solve Legal, Iuris Corporate y Sabseg los textos de sus fichas.

## Google Analytics 4 (preparado el 04/11/2026)

1. Pegar el ID de medición (`G-…`) en `assets/js/cookies.js`, en `GA4_ID`, y volver a subir la web. Aparecen solos el aviso de cookies, la fila de Google Analytics en la política de cookies y el apartado de Google Analytics en la política de privacidad.
2. Google Analytics solo se carga después de «Aceptar». Señales de Google y personalización de anuncios desactivadas en el código.
3. En Google Analytics → Administrar: retención de datos de eventos **14 meses** (la política de privacidad dice 14 meses); señales de Google **desactivadas**; aceptar las condiciones de tratamiento de datos; recogida de datos granulares de ubicación y dispositivo **desactivada**.
4. Medición mejorada activada (incluye descargas de PDF y ZIP). Evento propio `mapa_completado` desde el Mapa de empresa.
5. Eventos clave dados de alta: `mapa_completado`, `file_download`, `gracias.html` (solicitud por formulario) y `newsletter-gracias.html`. Añadir `reservar_sesion` (clic en Microsoft Bookings, con el parámetro `tipo`: `sesion_gratuita` o `arranque_diagnostico`), porque la mayoría de las reservas ya no pasan por `gracias.html`.
6. ID de medición configurado: `G-DY3P85H57T`.

## Tarjeta digital, QR, reservas y reuniones (05/11/2026)

### Rutas

| URL | Qué es | Dónde |
|---|---|---|
| `odlc.es/vcard_ioc` | Tarjeta de visita digital (noindex, fuera del menú) | `vcard_ioc.html` |
| `odlc.es/qr_ioc` | Tarjeta QR para enseñarla desde el móvil | `qr_ioc.html` |
| `citas.odlc.es/` | Página de reservas para clientes (React) | `citas/` |
| `citas.odlc.es/panel` | Panel privado de reuniones (React; exige sesión) | `citas/` |
| `citas.odlc.es/r/:id` | Invitación pública, `.ics` y materiales (solo lectura) | `citas/api/r.php` |
| `citas.odlc.es/api/...` | API PHP: acceso, reuniones, Microsoft 365, reservas | `citas/api/index.php` |
| `odlc.es/reuniones`, `odlc.es/cita` | Redirigen al panel y a la página de reservas | `.htaccess` |

- vCard 3.0 real: `assets/descargas/isabel-olivares-de-la-cerda-odlc.vcf` (empresa «OdlC», sin cargo). Botón «Guardar contacto · vCard» bajo la foto de Quiénes somos.
- QR permanente a `https://odlc.es/vcard_ioc`: `assets/img/qr/`. Tarjeta QR descargable incluida.
- La marca se escribe **OdlC** (nunca en mayúsculas con CSS).
- LinkedIn: `https://www.linkedin.com/in/isabel-olivares-de-la-cerda/` en toda la web.

### Cómo se publica

Hostinger copia la rama `main` de GitHub en `public_html` (webhook). El subdominio `citas.odlc.es` apunta a `public_html/citas`. La app React se edita en `citas-app/` y se compila con `npm run citas` (genera `citas/index.html` y `citas/app/`); el resultado compilado se sube a Git para que Hostinger no tenga que compilar nada. La API es PHP 8 (cURL, intl y sodium, incluidos en Hostinger).

### Datos y claves

En `public_html/_datos/` (fuera de Git, bloqueado con `.htaccess`): `config.php` con las claves, la lista de personas autorizadas, las reuniones, los materiales y la conexión con Microsoft. `config.php`:

```php
<?php return [
  'admin_email' => 'isabel@odlc.es',   // administradora: siempre autorizada
  'session_secret' => '…',              // 64 caracteres aleatorios
  'token_key' => '…',                   // 32 bytes en base64 (cifra el token del calendario)
  'site_url' => 'https://citas.odlc.es',
  'ms_tenant_id' => '…', 'ms_client_id' => '…', 'ms_client_secret' => '…',
  'auto_bookings' => true,              // convertir solas las reservas de Bookings
];
```

### Acceso al panel: sin contraseñas

- Solo **«Iniciar sesión con Microsoft»**, con el directorio de Microsoft 365 de OdlC (inquilino propio): cuentas @odlc.es o personas invitadas a ese Microsoft 365.
- Además, la cuenta tiene que estar en **Personas autorizadas** (sección del panel que solo ve la administradora). isabel@odlc.es está siempre; el resto se añade o se quita desde ahí. Al quitar a alguien, su sesión deja de valer en ese momento.
- Se identifica a cada persona por su nombre de inicio de sesión en el directorio de OdlC (`preferred_username`), comprobando inquilino (`tid`), emisor, destinatario, caducidad y `nonce`; nunca por el campo «email», que otras organizaciones pueden rellenar a su gusto.
- Solo la administradora puede conectar el calendario y gestionar accesos.

### Seguridad

Sesión en cookie `HttpOnly`, `Secure`, `SameSite=Strict`, firmada, de 8 horas; peticiones que cambian datos solo desde el propio sitio; OAuth 2.0 con PKCE, `state` de un solo uso y `nonce`. Identificadores de 128 bits. La invitación nunca muestra correo, móvil ni notas privadas. Token del calendario cifrado con libsodium. Reservas: casilla de privacidad, campo trampa contra robots y máximo 4 reservas por hora e IP.

### Microsoft 365: registrar la aplicación en Microsoft Entra ID

1. https://entra.microsoft.com (con isabel@odlc.es como administradora) → **Identity → Applications → App registrations → New registration**. Nombre `OdlC Citas`; *Accounts in this organizational directory only (Single tenant)*; Redirect URI **Web** `https://citas.odlc.es/api/ms/callback`.
2. Copiar *Application (client) ID* → `ms_client_id` y *Directory (tenant) ID* → `ms_tenant_id`.
3. **Certificates & secrets → New client secret** (24 meses) → copiar el **Value** → `ms_client_secret`. Apuntar su renovación.
4. **API permissions → Microsoft Graph → Delegated**: `openid`, `profile`, `email`, `offline_access`, `User.Read`, `Calendars.ReadWrite`, `BookingsAppointment.ReadWrite.All` → **Grant admin consent for OdlC**.
5. Entrar en `citas.odlc.es/panel` → **Iniciar sesión con Microsoft** → **Conectar con Microsoft 365** (calendario). Se comprueba que el calendario admite Teams y solo se acepta isabel@odlc.es.
6. Para dar acceso a alguien de fuera: en Microsoft 365, invitarle como invitado (Entra ID → Users → Invite external user) y añadir su correo en **Personas autorizadas**.

### Microsoft Bookings

La API de Microsoft solo permite crear citas en **páginas de reservas compartidas** de Bookings, no en la página personal «Bookings with me». Para que la página de citas.odlc.es reserve a través de Bookings:

1. https://outlook.office.com/bookings → **Nueva página de reservas** → **Compartida**. Nombre `OdlC`, zona horaria Madrid, horario de atención.
2. **Servicios**: crear «Sesión gratuita OdlC», 30 min, **Reunión de Teams** activado (y, si se quiere, «Arranque del Diagnóstico OdlC», 60 min). Isabel como miembro del personal.
3. En el panel → **Página de reservas · Microsoft Bookings** → elegir `OdlC`. Desde ese momento, citas.odlc.es muestra esos servicios, cada reserva se crea en Bookings (que envía al cliente su confirmación con Teams y la pone en el calendario de Isabel) y se abre la invitación de OdlC.
4. Los botones «Reservar sesión» de odlc.es pueden apuntar a `https://citas.odlc.es/` en lugar del enlace de Bookings (variable `CALENDAR_URL` de `assets/js/main.js`).

### Qué hace la conexión

- **Modo automático:** crea el evento en Outlook con Teams; el evento lleva el enlace de la invitación y de la tarjeta.
- **Citas de Outlook y Bookings:** el panel lista las reuniones de Teams de los próximos 60 días. Las reservas de Bookings (detectadas por el texto «Bookings»/«reserva») se convierten solas al abrir el panel o con la tarea programada; las demás, con «Crear invitación». El enlace se añade al principio del cuerpo del evento sin tocar el bloque de Teams (si el evento tiene invitados, Outlook puede enviarles la actualización).
- **Página de reservas `citas.odlc.es`:** muestra los huecos libres de tu calendario (L–J 9:30–14:00 y 16:00–18:30, V 9:30–14:00, 24 h de antelación, 21 días, 15 min de margen; se cambia en `_datos/reservas.json`). Al confirmar, crea el evento con Teams en tu Outlook, Outlook envía la convocatoria al cliente y se abre su invitación. Microsoft no permite crear citas por programa en la página personal «Bookings with me»; por eso la reserva va directa a tu calendario.

### Pruebas

`citas-app/pruebas/`: servidor PHP local, Microsoft simulado y comprobaciones de extremo a extremo (25 comprobaciones, todas superadas el 05/11/2026, incluido el rechazo de cuentas no autorizadas).
