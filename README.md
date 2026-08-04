# Brief Agendado — SuperLeads

Cloudflare Worker que, para cualquier cita agendada en el calendario de un
comercial cuyo **título contenga "Rayos X"**, investiga automáticamente al
prospecto (colegio + representante) antes de la reunión y manda un brief por
correo al comercial dueño de esa cita, el mismo día de la junta, a las 9am
hora CDMX.

Producción: **https://brief.superleads.mx**

## Cómo funciona (arquitectura)

```
Calendario de Ricardo (secret CALENDAR_ICS_URL)
Calendarios de otros comerciales (tabla `colaboradores`, autoservicio en /conectar)
   │  feeds ICS privados, solo lectura
   ▼
Cron cada 15 min ── scheduled()
   1. pollCalendario()
      - Lee TODOS los calendarios conectados (el principal + colaboradores activos)
      - Filtra eventos cuyo SUMMARY contenga "Rayos X" (case-insensitive) —
        esa es la palabra clave que activa la investigación, sin importar de
        qué calendario venga
      - Por cada cita nueva (o con research que falló antes): extrae datos
        del prospecto de la DESCRIPTION con DeepSeek (institución, web,
        representante, teléfono, correo, WhatsApp, asesor, Zoom, SL Comercial)
      - Corre el research: DeepSeek diseña 5-6 queries → se ejecutan en
        Brave Search API → DeepSeek redacta el dossier ejecutivo (resumen,
        la institución, **redes sociales oficiales con seguidores si se
        encuentran**, el representante, cruce con el ICP de SuperLeads,
        anclajes de personalización con fuente, score de fit, recomendación)
        siguiendo la estructura de la skill deep-research-agent
      - Las redes sociales se detectan primero directamente en el HTML del
        sitio oficial (header/footer, donde casi siempre están) — más
        confiable que depender solo de resultados de búsqueda; el número de
        seguidores sí se busca aparte y solo se reporta si aparece
        explícitamente en una fuente (nunca se inventa)
      - **Posicionamiento en buscadores (medido, no opinión del LLM)**: se
        busca el nombre del colegio y "colegios privados en <ciudad
        inferida>" (top 10 de Brave) y se calcula determinísticamente en qué
        posición aparece SU dominio — o si no aparece, que es el anclaje de
        venta más fuerte ("las familias que buscan colegio en tu ciudad no
        te encuentran"). Los resultados de la búsqueda por zona también se
        pasan al dossier como lista de competidores visibles. Dominios
        compartidos (linktr.ee, facebook...) se comparan por URL completa
        para no dar falsos positivos. Ver posicionDeSitio() en research.ts.
      - **Fotos relevantes**: Brave Image Search (hasta 4) — la sección se
        arma en código con las URLs reales (no las escribe el LLM, para que
        no alucine links) e incluye la página de origen de cada foto; queda
        como registro visual de cómo se encontró al prospecto. Se renderiza
        en el visor, el correo y el PDF (en el PDF alguna puede salir en
        blanco si su servidor no permite CORS).
      - Tope de 3 investigaciones por corrida (límite de subrequests del
        plan gratuito de Cloudflare, ~14 fetches por research) — lo que no
        alcanza, sigue en la siguiente corrida
   2. enviarBriefsDelDia()
      - Si ya son las 9am hora CDMX (offset fijo UTC-6): busca citas de HOY
        sin enviar (genera el dossier sobre la marcha si aún no corrió)
      - Envía el brief por correo vía Resend, desde brief@superleads.mx, al
        correo del comercial dueño de esa cita
      - Marca la cita como enviada (idempotente — nunca se duplica)
   3. Todo queda en D1 (base "rayosx"), visible en el dashboard
```

## Cómo conecta un comercial nuevo su calendario

`/conectar` está diseñado con marca SuperLeads y pasos ilustrados (incluye un
mockup de dónde sacar la URL correcta en Google Calendar — el error más común
es copiar la dirección "pública" en vez de la "secreta").

1. Entra a `/conectar`. La página deja clarísimo que la palabra clave es
   **"Rayos X"**: solo se investigan y mandan brief las citas cuyo **título**
   la contenga — el resto del calendario se ignora, así que se puede conectar
   el calendario personal sin filtrar nada a mano.
2. Llena nombre + correo + la URL **secreta** del feed .ics (Configuración
   del calendario → "Integrar el calendario" → "Dirección secreta en formato
   iCal", con el ícono del ojo 👁). Sin código de acceso — es una herramienta
   interna, `/conectar` no está enlazado desde ningún lado público.
3. El Worker valida que la URL sea un feed .ics real antes de guardarla.
4. **Backlog de citas ya agendadas**: si el comercial ya tenía citas "Rayos X"
   agendadas antes de conectar su calendario, esas NO se investigan solas —
   aparecen listadas en la pantalla de confirmación con un botón **"Generar
   brief"** por cada una, para dispararlas a mano cuando quiera. De ahí en
   adelante, cualquier cita nueva sí es 100% automática (la agarra el
   siguiente `pollCalendario()`).

El calendario de Ricardo sigue siendo el original: vive en el secret
`CALENDAR_ICS_URL` y no pasa por esta tabla.

## Dashboard

`GET /` — histórico completo: institución, representante, a quién se le
mandó, estado de research/envío y hora de envío, con búsqueda. Con marca
SuperLeads (logo, header navy, tipografía Plus Jakarta Sans — `src/branding.ts`,
compartido con `/conectar` y `/eventos/:uid/ver`). Por cada fila:

- **Ver** — abre `/eventos/:uid/ver`, una página con el dossier completo
  renderizado (no solo el .md crudo) más botones para mandar el correo o
  descargar el PDF desde ahí mismo.
- **Descargar .md** — baja el dossier en markdown.
- **PDF** — abre `/eventos/:uid/ver?descargar=pdf` en una pestaña nueva y
  dispara la descarga sola apenas carga (sin tener que darle clic de nuevo
  ahí). El PDF tiene estilo SuperLeads (logo, header navy, tipografía Plus
  Jakarta Sans) y se genera **100% en el navegador**, sin tocar el servidor:
  usa `html2canvas` para capturar una plantilla oculta con la marca y
  `jsPDF` para armar el archivo. La paginación es a nivel de bloque
  (párrafo/lista/encabezado), nunca corta texto a la mitad, y un
  encabezado nunca se queda solo al pie de una página — si no cabe junto con
  el contenido que le sigue, ambos se empujan a la siguiente. Las imágenes se
  embeben como JPEG (no PNG) para que el archivo pese poco. El nombre lleva
  timestamp: `brief-<institución>-AAAA_MM_DD-HH_MM.pdf`.
- **Mandar correo / Reenviar correo** — dispara el envío del brief en el
  acto (sin esperar a las 9am ni al cron), con confirmación antes de enviar.
- **🟢/🔴 (primera columna)** — estado de la cita: verde = próxima, rojo = ya
  pasó. Se calcula solo por la fecha, pero un clic sobre el círculo lo
  cambia a mano (queda guardado en `estado_override`). Los chips de arriba
  (Todos / 🟢 Próximos / 🔴 Pasados) filtran con un clic, combinables con el
  buscador.
- **✏️ (junto al representante)** — abre `/eventos/:uid/ver?editar=1` con el
  formulario de edición ya desplegado.

Pensado para que cualquier comercial pueda entrar y revisar o reenviar sus
briefs pasados.

## Brief manual (`/manual`)

Botón "＋ Generar brief manual" en el dashboard. Para cuando alguien capturó
mal los datos en el calendario y hay que rehacer el brief: se pega el texto
con los datos del prospecto (la descripción completa de la cita, o
corregida), se elige a qué correo mandar el brief (default Ricardo), y se
genera al momento — extracción con DeepSeek (incluida la fecha de la
reunión si viene en el texto, para fechar el evento) + research completo.
El evento queda en el histórico con uid `manual-<timestamp>`.

## Editar datos y regenerar (`/eventos/:uid/ver`)

El lápiz ✏️ junto al título abre un formulario con los datos extraídos
(institución, web, nombre, teléfono, correo, WhatsApp). Dos opciones:

- **Guardar** — solo corrige los datos guardados.
- **Guardar y generar nuevo brief** — guarda y corre el research otra vez
  usando los datos corregidos (SIN re-extraer de la descripción original,
  que pisaría las correcciones — ver `regenerarConDatosGuardados()` en
  `src/scheduled.ts`). El dossier nuevo reemplaza al anterior.

Como el research tarda 30-60s, tanto la regeneración como `/manual` muestran
una **barra de progreso** con etapas ("Buscando información...",
"Redactando el brief...") que avanza sola hasta 92% y cierra al 100% cuando
el servidor responde — sin sacar al usuario de la página; al terminar, la
página se recarga sola con el brief nuevo. La barra avanza por tiempo (el
Worker no reporta progreso real), pero el cierre al 100% sí es la señal
real de que terminó.

La página del brief también tiene arriba los botones **Descargar PDF**
(primario, verde) y **Descargar .md** (secundario), además de los del pie.

## Motores usados

- **DeepSeek** (`deepseek-v4-flash` para extracción/queries,
  `deepseek-v4-pro` para redactar el dossier final).
- **Brave Search API** — el único motor con acceso real a internet; DeepSeek
  no navega por sí mismo, así que sin esto el research se inventaría datos.
- **Resend** — envío del correo (mismo dominio verificado `superleads.mx`
  que usa `fathom-resumen`, con su propia API key).

## Recursos de Cloudflare

| Recurso | Nombre | Notas |
|---|---|---|
| D1 | `rayosx` | tablas `eventos_rayosx`, `colaboradores`, `logs` (ver `migrations/`) |
| Cron trigger | `*/15 * * * *` | único cron: poll de calendarios + envío de briefs del día (la cuenta tiene tope de 5 cron triggers en total) |

## Secrets requeridos

```bash
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put BRAVE_API_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put CALENDAR_ICS_URL   # URL privada del feed .ics de Ricardo, nunca en el código
```

Opcional: `BRIEF_TO_EMAIL` (variable, no secret) — respaldo si un evento no
trae destinatario resuelto.

## Instalación y deploy

```bash
npm install
wrangler d1 migrations apply rayosx --remote
wrangler secret put DEEPSEEK_API_KEY
wrangler secret put BRAVE_API_KEY
wrangler secret put RESEND_API_KEY
wrangler secret put CALENDAR_ICS_URL
wrangler deploy
```

## Operación y diagnóstico

- **`GET /`** — dashboard visual (ver arriba).
- **`GET /eventos?limit=50`** — últimas citas detectadas, en JSON.
- **`GET /eventos/:uid/ver`** — dossier renderizado + botón de envío manual.
- **`GET /eventos/:uid/dossier`** — descarga el dossier en markdown.
- **`POST /eventos/:uid/enviar`** — manda el brief de esa cita ahora mismo.
- **`POST /eventos/:uid/investigar`** — genera el dossier de una cita en
  estado `manual` (backlog al conectar) o reintenta una que falló.
- **`POST /eventos/:uid/estado`** — fija el estado 🟢/🔴 a mano (`{estado}`).
- **`POST /eventos/:uid/datos`** — guarda los datos del prospecto corregidos.
- **`POST /eventos/:uid/regenerar`** — regenera el dossier con los datos
  guardados (sin re-extraer), reemplazando al anterior.
- **`GET|POST /manual`** — página y endpoint de brief manual desde texto.
- **`GET /colaboradores`** — lista de comerciales conectados.
- **`GET /logs?lines=80`** — logs recientes en JSON.
- **`POST /probar-poll`** — dispara manualmente el poll de calendarios (sin
  esperar al cron) para probar cambios.
- **`POST /probar-envio`** — dispara manualmente el chequeo de envío del día
  (solo manda algo si ya pasaron las 9am CDMX y hay citas de hoy pendientes).

### Estados de una cita

| Campo | Valores | Qué significa |
|---|---|---|
| `research_status` | `pendiente` / `manual` / `listo` / `error` | `manual` = ya agendada al conectar el calendario, esperando el botón "Generar brief"; el resto se explica solo |
| `email_status` | `pendiente` / `enviado` / `error` | si el brief ya se mandó |

Si el research falla, el correo del día se manda de todos modos con los
datos de contacto disponibles (mejor un brief incompleto que ninguno), y en
la siguiente corrida del poll se reintenta automáticamente cualquier research
que haya quedado en `error`.

## Zona horaria

El feed ICS puede traer horas en UTC o en hora local con `TZID`. Este Worker
asume que toda hora no-UTC del calendario es `America/Mexico_City`
(offset fijo `-6`, sin horario de verano desde 2022 en México) — ver
`src/ics.ts`. El envío a las 9am también se calcula con ese mismo offset fijo
en `src/scheduled.ts`.

## Estructura del repo

```
src/
  types.ts        Env, tipos de evento/prospecto/dossier/colaborador
  ics.ts          Fetch + parser del feed .ics (RFC 5545 mínimo necesario)
  deepseek.ts      Cliente HTTP de DeepSeek (chat completions)
  extract.ts       Extracción de datos del prospecto desde la DESCRIPTION
  research.ts      Queries + Brave Search + redacción del dossier
  email.ts         Plantilla HTML/texto del brief + envío por Resend
  db.ts            D1: eventos_rayosx, colaboradores, logs
  scheduled.ts      Orquesta poll de calendarios y envío del día
  markdown.ts       Render compartido de markdown→HTML (dossier) + fecha CDMX
  branding.ts        Header/CSS con marca SuperLeads, compartido por dashboard/conectar
  dashboard.ts      HTML del dashboard (/)
  viewer.ts         HTML de /eventos/:uid/ver (dossier + botón de envío + PDF)
  conectar.ts        HTML de /conectar (marca SuperLeads, pasos + backlog manual)
  index.ts          Router HTTP + cron

## Nota sobre el dominio custom y JS inline

`brief.superleads.mx` corre dentro de la misma zona de Cloudflare que el
resto de superleads.mx, así que las optimizaciones de la zona (Auto Minify
de JS, entre otras) se aplican a la respuesta del Worker — cosa que NO pasa
en el subdominio `*.workers.dev`. Ese minificador puede corromper comillas
escapadas dentro de un `<script>` inline (p.ej. `onclick="fn(this, '${uid
.replace(/'/g,"\\'")}')"`) y tumbar el bloque de script completo en
silencio. Por eso en `dashboard.ts` y `conectar.ts` los botones de las filas
se conectan con `addEventListener` leyendo `data-*`/closures en vez de
`onclick="fn(this,'...')"` con valores escapados a mano — evita el problema
de raíz en lugar de depender de que el minificador no lo rompa.
migrations/         Esquema D1
```
