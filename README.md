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
        la institución, el representante, cruce con el ICP de SuperLeads,
        anclajes de personalización con fuente, score de fit, recomendación)
        siguiendo la estructura de la skill deep-research-agent
      - Tope de 5 investigaciones por corrida (límite de subrequests del
        plan gratuito de Cloudflare) — lo que no alcanza, sigue en la
        siguiente corrida
   2. enviarBriefsDelDia()
      - Si ya son las 9am hora CDMX (offset fijo UTC-6): busca citas de HOY
        sin enviar (genera el dossier sobre la marcha si aún no corrió)
      - Envía el brief por correo vía Resend, desde brief@superleads.mx, al
        correo del comercial dueño de esa cita
      - Marca la cita como enviada (idempotente — nunca se duplica)
   3. Todo queda en D1 (base "rayosx"), visible en el dashboard
```

## Cómo conecta un comercial nuevo su calendario

1. Entra a `/conectar`, llena nombre + correo + URL del feed .ics privado de
   su calendario de Google (Configuración del calendario → "Integrar
   calendario" → URL privada en formato iCal) + el código de acceso
   compartido (secret `CONNECT_CODE`).
2. El Worker valida que la URL sea un feed .ics real antes de guardarla.
3. Listo — cualquier cita en su calendario con "Rayos X" en el título
   dispara la investigación y el brief le llega a su propio correo, sin
   tocar código.

El calendario de Ricardo sigue siendo el original: vive en el secret
`CALENDAR_ICS_URL` y no pasa por esta tabla.

## Dashboard

`GET /` — histórico completo: institución, representante, a quién se le
mandó, estado de research/envío y hora de envío, con búsqueda. Por cada fila:

- **Ver** — abre `/eventos/:uid/ver`, una página con el dossier completo
  renderizado (no solo el .md crudo) más un botón para mandar el correo
  desde ahí mismo.
- **Descargar .md** — baja el dossier en markdown.
- **Mandar correo / Reenviar correo** — dispara el envío del brief en el
  acto (sin esperar a las 9am ni al cron), con confirmación antes de enviar.

Pensado para que cualquier comercial pueda entrar y revisar o reenviar sus
briefs pasados.

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
wrangler secret put CONNECT_CODE        # código que deben dar los comerciales para conectar su calendario en /conectar
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
wrangler secret put CONNECT_CODE
wrangler deploy
```

## Operación y diagnóstico

- **`GET /`** — dashboard visual (ver arriba).
- **`GET /eventos?limit=50`** — últimas citas detectadas, en JSON.
- **`GET /eventos/:uid/ver`** — dossier renderizado + botón de envío manual.
- **`GET /eventos/:uid/dossier`** — descarga el dossier en markdown.
- **`POST /eventos/:uid/enviar`** — manda el brief de esa cita ahora mismo.
- **`GET /colaboradores`** — lista de comerciales conectados.
- **`GET /logs?lines=80`** — logs recientes en JSON.
- **`POST /probar-poll`** — dispara manualmente el poll de calendarios (sin
  esperar al cron) para probar cambios.
- **`POST /probar-envio`** — dispara manualmente el chequeo de envío del día
  (solo manda algo si ya pasaron las 9am CDMX y hay citas de hoy pendientes).

### Estados de una cita

| Campo | Valores | Qué significa |
|---|---|---|
| `research_status` | `pendiente` / `listo` / `error` | si el dossier ya se generó |
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
  dashboard.ts      HTML del dashboard (/)
  viewer.ts         HTML de /eventos/:uid/ver (dossier + botón de envío)
  index.ts          Router HTTP + cron + formulario /conectar
migrations/         Esquema D1
```
