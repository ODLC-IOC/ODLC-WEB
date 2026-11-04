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

## Reservar sesión

Todas las páginas llevan a `reservar-sesion.html`. En cuanto se pegue el enlace del calendario en `CALENDAR_URL` (`assets/js/main.js`), todos los botones van directos a él.

## Imágenes

Imágenes para redes de cada página en `assets/img/og/` y portadas de los 26 artículos en `assets/img/blog/`, todas con la marca ODLC («Dirección corporativa externa · odlc.es»). Foto de Isabel solo en Quiénes somos y en la firma de los artículos.

## Cookies (art. 22.2 LSSI y Guía de cookies de la AEPD, 2023)

- **Google Analytics 4 activo desde el 4/11/2026** (`GA4_ID = 'G-DY3P85H57T'`). No se carga hasta que la persona acepta las cookies analíticas, con Google Signals y la personalización de anuncios desactivados. Las tipografías siguen alojadas en `assets/fonts/`.
- `assets/js/cookies.js` es el gestor. Para medir visitas o campañas, pegar el identificador en `GA4_ID` (Google Analytics 4) o `LINKEDIN_PARTNER_ID` (LinkedIn Insight Tag). El aviso aparece solo, con «Aceptar todas», «Rechazar todas» y «Configurar» al mismo nivel, y las herramientas no se cargan hasta que la persona acepta.
- La tabla de `politica-de-cookies.html` se rellena sola con lo que esté activo. «Configurar cookies», al pie de todas las páginas, permite cambiar o retirar el consentimiento.
- Si se añade cualquier otra herramienta de terceros (vídeo incrustado, chat, píxel), hay que darla de alta en el gestor y en la política antes de publicarla.
- Antes de publicar: completar NIF y domicilio en aviso legal, privacidad y cookies.

## Newsletter «Empresas y Patrimonios en Orden»

- **LinkedIn:** cuando Isabel cree la newsletter, pegar su enlace en `assets/js/main.js`, en `NEWSLETTER_URL`. Los botones de LinkedIn aparecen solos.
- **Correo:** los altas llegan a Netlify, **Forms → newsletter**. Añadir el aviso por correo y, cuando haya herramienta de envío (p. ej. Brevo), exportar o conectar la lista.

## Partners de la red

En `red-de-colaboradores.html` cada área con partner lleva ficha propia (clase `has-partner` y bloque `.partner`): Crearte Consulting (selección), Solve Legal (contabilidad y tributario), Iuris Corporate (compliance), Sabseg (seguros) e Iván Fernández (IT e IA). También aparecen en «Quién interviene» de cada servicio, en la ficha de Implantación y en el diagrama de la portada.

## Pendiente antes de publicar

- **NIF y domicilio** de Isabel en `aviso-legal.html`, `privacidad.html` y `politica-de-cookies.html` (marcados como [pendiente]). El titular legal de la web sigue siendo Isabel Olivares de la Cerda.
- **Enlace del calendario** en `CALENDAR_URL`.
- **Confirmar con Isabel:** precio de Formación (por taller y jornada, no por persona); fecha y condiciones de la tarifa de lanzamiento; las webs que quiere mostrar en «Proyectos recientes»; los módulos de Orden continuo (PBC y seguros); si las campañas ESG llevan precio.
- **Iván Fernández (IT e IA):** su ficha no lleva enlace porque aún no tiene web.
- **Partners:** confirmar con Solve Legal, Iuris Corporate y Sabseg los textos de sus fichas.

## Google Analytics 4

- Propiedad odlc.es, ID de medición `G-DY3P85H57T`. Retención de datos: 14 meses (la política de privacidad lo dice así).
- Eventos clave: `file_download` (automático, medición mejorada), `mapa_completado`, y las páginas `gracias.html` y `newsletter-gracias.html`.
- `mapa_completado` todavía no existe en la web. Cuando se publique la herramienta del mapa, en el momento en que se completa: `odlcEvent('mapa_completado');`. Solo se envía si la persona ha aceptado las cookies.
- Los formularios envían por POST: el email nunca aparece en la dirección de las páginas de gracias, así que Analytics no recibe datos personales.
