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

## Tarjeta digital, QR y reuniones (05/11/2026)

### Rutas

| URL | Qué es | Archivo |
|---|---|---|
| `/vcard_ioc` | Tarjeta de visita digital (noindex, fuera del menú) | `vcard_ioc.html` |
| `/qr_ioc` | Tarjeta QR para enseñarla desde el móvil | `qr_ioc.html` |
| `/reuniones` | Panel privado de reuniones (exige sesión) | `netlify/functions/panel.mjs` |
| `/r/:id` y `/r/:id/calendario.ics` | Invitación pública y su archivo de calendario (solo lectura) | `netlify/functions/invitacion.mjs` |
| `/api/...` | Operaciones del panel: acceso, reuniones, Microsoft 365 | `netlify/functions/api.mjs` |

- vCard 3.0 real: `assets/descargas/isabel-olivares-de-la-cerda-odlc.vcf` (UTF-8, nombre y apellidos separados, ODLC, móvil, correo, web, LinkedIn y Madrid, España; sin cargo). La usan la tarjeta y el botón «Guardar contacto · vCard» bajo la foto de Quiénes somos.
- QR permanente a `https://odlc.es/vcard_ioc`: `assets/img/qr/qr-vcard-ioc.svg` y `.png`; tarjeta QR descargable: `assets/img/qr/tarjeta-qr-isabel-olivares-odlc.png`. Mientras no cambie la URL, el QR no caduca.
- Estilos: `assets/css/tarjeta.css` (se carga después de `styles.css` y usa sus tipografías y colores). Logotipo original: `logo-odlc-claro.svg` sobre verde y `logo-odlc.svg` sobre blanco.
- Vista previa en WhatsApp de las invitaciones: `assets/img/og/invitacion-odlc.png` (sin datos de la reunión).
- LinkedIn corregido en toda la web: `https://www.linkedin.com/in/isabel-olivares-de-la-cerda/`.

### Requisitos de publicación

El panel y las invitaciones funcionan con **Netlify Functions** y **Netlify Blobs** (datos guardados en la UE, Fráncfort). Para que Netlify instale `@netlify/blobs` y publique las funciones, el sitio tiene que estar **enlazado al repositorio de GitHub** (Site configuration → Build & deploy → Link repository) o publicarse con `netlify deploy`. La subida manual arrastrando la carpeta no publica funciones. En Hostinger solo funcionarían la tarjeta, el QR y la vCard (reglas en `.htaccess`).

### Variables de entorno (Netlify → Project configuration → Environment variables)

Nunca en el repositorio. Para generar o cambiar la contraseña: `npm install` y `npm run claves` (pide la contraseña sin mostrarla y devuelve el hash).

| Variable | Valor |
|---|---|
| `ODLC_ADMIN_EMAIL` | `isabel@odlc.es` |
| `ODLC_ADMIN_PASSWORD_HASH` | Hash scrypt de la contraseña (no la contraseña) |
| `ODLC_SESSION_SECRET` | Cadena aleatoria de 48 bytes |
| `ODLC_TOKEN_KEY` | 32 bytes aleatorios en base64 (cifra el token de Microsoft) |
| `MS_TENANT_ID`, `MS_CLIENT_ID`, `MS_CLIENT_SECRET` | De Microsoft Entra ID (ver abajo). Marcar `MS_CLIENT_SECRET` como secreto |

Tras crear o cambiar variables, hacer un nuevo deploy.

### Seguridad

- Contraseña solo como hash scrypt en el servidor; sesión en cookie `HttpOnly`, `Secure`, `SameSite=Strict`, firmada y de 8 horas; bloqueo de 15 minutos tras 5 intentos fallidos; las peticiones que cambian datos deben venir de odlc.es.
- Sin sesión, `/reuniones` solo entrega la pantalla de acceso, y la API responde 401.
- Identificadores de invitación aleatorios de 128 bits. La invitación muestra nombre del invitado, asunto, fecha, enlace de Teams y la descripción; nunca su correo, su móvil ni las notas privadas.
- El token de Microsoft se guarda cifrado (AES-256-GCM) en el servidor; el navegador no lo recibe nunca.

### Microsoft 365 (modo automático): registrar la aplicación en Microsoft Entra ID

1. Entrar en https://entra.microsoft.com con una cuenta administradora de odlc.es → **Identity → Applications → App registrations → New registration**.
2. Nombre: `ODLC Reuniones`. Supported account types: **Accounts in this organizational directory only (Single tenant)**. Redirect URI: plataforma **Web**, `https://odlc.es/api/ms/callback`. **Register**.
3. En **Overview**, copiar *Application (client) ID* → `MS_CLIENT_ID` y *Directory (tenant) ID* → `MS_TENANT_ID`.
4. **Certificates & secrets → Client secrets → New client secret** (24 meses). Copiar el **Value** (solo se ve una vez) → `MS_CLIENT_SECRET`. Apuntar en el calendario renovarlo antes de que caduque.
5. **API permissions → Add a permission → Microsoft Graph → Delegated permissions**: `openid`, `offline_access`, `User.Read`, `Calendars.ReadWrite`. Pulsar **Grant admin consent for ODLC** (opcional, pero evita la pantalla de consentimiento).
6. No hace falta ningún permiso de aplicación ni `OnlineMeetings`: el evento se crea en el calendario de isabel@odlc.es con `isOnlineMeeting` y Teams genera el enlace.
7. Guardar las variables en Netlify, nuevo deploy, entrar en `/reuniones` → **Conectar con Microsoft 365** → entrar con isabel@odlc.es. El panel comprueba en ese momento que el calendario admite Teams (`allowedOnlineMeetingProviders`) y solo acepta la cuenta isabel@odlc.es.

Al editar una reunión automática se actualiza el evento de Outlook; al cancelarla se cancela (o se elimina si no tenía asistentes). La casilla «Enviar también la convocatoria de Outlook» añade al invitado como asistente y Outlook le envía el correo.

### Pruebas

`npm install && npm test` ejecuta 30 pruebas sin red: horario de verano e invierno, acceso, bloqueo, validación, persistencia, invitación, `.ics`, Google Calendar, WhatsApp, edición, cancelación y el flujo de Microsoft Graph simulado.

### Novedades del panel (05/11/2026, tarde)

- **Asistentes de OdlC**: campo propio (uno por línea); por defecto, Isabel. Aparecen en la invitación y en el calendario.
- **Materiales**: archivos PDF, Word, Excel, PowerPoint, imágenes, texto o CSV de hasta 4 MB (límite de Netlify Functions), guardados en Netlify Blobs y descargables desde la invitación (`/r/:id/material/:idArchivo`); se ocultan si la reunión se cancela. Para archivos grandes o que vayan a cambiar, pegar un **enlace de OneDrive o SharePoint** (compartido como «Cualquier persona con el vínculo puede ver»): el invitado siempre abre la última versión.
- **Importar de Outlook (.ics)**: rellena asunto, fecha, hora (convierte la zona de Outlook, p. ej. «Romance Standard Time»), duración, enlace de Teams y descripción.
- **Pegar la invitación de Teams entera** en el campo del enlace: se queda solo con el enlace.
- Invitación esquemática (fecha, hora, zona, duración) y «Añadir al calendario» abre un selector.
