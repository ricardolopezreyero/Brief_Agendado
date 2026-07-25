// RLR
import type { EventoRecord } from './types';
import { escapeHtml, fechaLegibleCDMX } from './markdown';

interface Mensaje {
  tipo: 'ok' | 'error';
  texto: string;
}

const LOGO_URL = 'https://assets.cdn.filesafe.space/E6Gh1sE1RnPtadmL7wmG/media/698e530bc08665d629146a14.png';

const ESTILOS_COMPARTIDOS = `
  :root{
    --green:#56EF9F; --green-d:#2BC878;
    --navy-deep:#001240; --navy-mid:#001a5e; --navy:#002582;
    --blue:#0039C8; --blue-soft:#F4F7FF; --blue-softer:#EEF2FF;
    --border:#e0e8f8; --muted:#666; --dim:#aaa;
    --ease: cubic-bezier(.16,1,.3,1);
  }
  *{box-sizing:border-box;}
  body{margin:0;background:var(--blue-soft);font-family:"Plus Jakarta Sans",-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;}
  header{background:var(--navy-deep);padding:28px 24px;position:relative;overflow:hidden;}
  header::before{content:"";position:absolute;right:-100px;top:-100px;width:320px;height:320px;border-radius:50%;background:rgba(86,239,159,.05);}
  .brand{display:flex;align-items:center;gap:10px;position:relative;}
  .brand img{width:150px;display:block;}
  .hero-text{max-width:640px;margin:22px auto 0;position:relative;text-align:center;}
  .hero-text .eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:4px 12px;border-radius:20px;background:rgba(86,239,159,.1);color:var(--green);border:.5px solid rgba(86,239,159,.25);margin-bottom:14px;}
  .hero-text h1{margin:0 0 10px;font-size:26px;font-weight:800;letter-spacing:-.6px;color:#fff;}
  .hero-text p{margin:0;font-size:14px;line-height:1.65;color:#7a9fd4;}
  .hero-text p strong{color:var(--green);font-weight:700;}
  .wrap{max-width:640px;margin:0 auto;padding:36px 20px 60px;}
`;

// Deja el <head> abierto a propósito: cada página agrega su <style> propio y
// cierra con </head><body> antes de continuar.
function headAbiertoHtml(titulo: string): string {
  return `<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700&display=swap" rel="stylesheet">`;
}

function avisoHtml(mensaje?: Mensaje): string {
  if (!mensaje) return '';
  const ok = mensaje.tipo === 'ok';
  return `<div class="aviso ${ok ? 'aviso-ok' : 'aviso-error'}">${ok ? '✓' : '✗'} ${mensaje.texto}</div>`;
}

export function paginaConectar(mensaje?: Mensaje): string {
  return `<!doctype html>
<html lang="es">
${headAbiertoHtml('Conectar calendario — Brief Agendado')}
<style>
  ${ESTILOS_COMPARTIDOS}

  .clave{background:var(--navy-deep);border-radius:12px;padding:18px 20px;margin-bottom:24px;display:flex;gap:12px;align-items:flex-start;}
  .clave .icono{flex:none;font-size:18px;}
  .clave p{margin:0;font-size:13px;line-height:1.6;color:#b7c0d8;}
  .clave p b{color:var(--green);}
  .clave code{background:rgba(255,255,255,.08);padding:1px 6px;border-radius:5px;color:#fff;}

  .pasos{background:#fff;border:.5px solid var(--border);border-radius:12px;padding:28px 26px;margin-bottom:24px;}
  .pasos h2{margin:0 0 4px;font-size:15px;font-weight:800;color:var(--navy);}
  .pasos .sub{margin:0 0 20px;font-size:12.5px;color:var(--muted);}

  .paso{display:flex;gap:14px;padding:14px 0;border-top:.5px solid var(--border);}
  .paso:first-of-type{border-top:none;padding-top:0;}
  .num{flex:none;width:26px;height:26px;border-radius:50%;background:var(--navy);color:#fff;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;}
  .paso-texto{font-size:13.5px;line-height:1.6;color:#2b3646;padding-top:2px;}
  .paso-texto b{color:var(--navy);}
  .paso-texto code{background:var(--blue-softer);padding:1px 6px;border-radius:5px;font-size:12px;color:var(--blue);}

  /* Mockup ilustrativo de Google Calendar */
  .mockup{margin-top:10px;border:.5px solid var(--border);border-radius:10px;overflow:hidden;background:#fafbfd;}
  .mockup-bar{background:#f1f3f7;padding:7px 12px;font-size:10.5px;color:var(--dim);border-bottom:.5px solid var(--border);}
  .mockup-body{display:flex;font-size:11.5px;}
  .mockup-side{width:38%;padding:10px 0;border-right:.5px solid var(--border);}
  .mockup-item{padding:6px 12px;color:#555;}
  .mockup-item.activo{background:var(--blue-softer);color:var(--blue);font-weight:700;position:relative;}
  .mockup-item.hijo{padding-left:24px;color:#777;}
  .mockup-main{flex:1;padding:12px;}
  .mockup-field{border:.5px solid var(--border);border-radius:7px;padding:8px 10px;margin-bottom:8px;background:#fff;}
  .mockup-field .lbl{font-size:10px;color:var(--dim);margin-bottom:3px;}
  .mockup-field .val{font-family:monospace;font-size:10.5px;color:#888;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  .mockup-field.destacado{border-color:var(--green-d);background:rgba(86,239,159,.06);}
  .mockup-field.destacado .val{color:var(--navy);font-weight:600;}
  .mockup-field.tachado .val{text-decoration:line-through;color:#c3c8d1;}
  .badge-num{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:50%;background:var(--navy);color:#fff;font-size:9px;font-weight:800;margin-right:5px;flex:none;}

  .aviso{margin:0 0 20px;padding:12px 16px;border-radius:10px;font-size:13.5px;font-weight:600;}
  .aviso-ok{background:rgba(86,239,159,.12);color:var(--green-d);border:.5px solid rgba(43,200,120,.3);}
  .aviso-error{background:#fdecea;color:#c0392b;border:.5px solid #f5c6c1;}

  form{background:#fff;border:.5px solid var(--border);border-radius:12px;padding:28px 26px;}
  form h2{margin:0 0 18px;font-size:15px;font-weight:800;color:var(--navy);}
  label{display:block;font-size:12.5px;font-weight:700;color:var(--navy);margin:16px 0 6px;}
  label:first-of-type{margin-top:0;}
  label small{display:block;font-weight:400;color:var(--muted);font-size:11.5px;margin-top:3px;line-height:1.5;}
  input{width:100%;padding:11px 13px;border:.5px solid var(--border);border-radius:8px;font-size:13.5px;font-family:inherit;background:var(--blue-soft);transition:border-color .2s;}
  input:focus{outline:none;border-color:var(--blue);background:#fff;}
  button{margin-top:24px;width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--green);color:var(--navy);padding:14px 26px;border-radius:8px;font-size:14.5px;font-weight:700;border:none;cursor:pointer;transition:transform .2s var(--ease),box-shadow .2s;}
  button:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(86,239,159,.28);}

  .nota-privacidad{margin-top:14px;font-size:11px;color:var(--dim);line-height:1.6;text-align:center;}

  @media(max-width:480px){ .mockup-body{flex-direction:column;} .mockup-side{width:100%;border-right:none;border-bottom:.5px solid var(--border);} }
</style>
</head>
<body>
  <header>
    <div class="brand"><img src="${LOGO_URL}" alt="SuperLeads"></div>
    <div class="hero-text">
      <div class="eyebrow"><span>●</span> BRIEF AGENDADO</div>
      <h1>Conecta tu calendario</h1>
      <p>Solo para comerciales SuperLeads. Cualquier cita cuyo título contenga <strong>"Rayos X"</strong> dispara una investigación automática del prospecto — te llega un brief por correo el día de la reunión, a las 9am.</p>
    </div>
  </header>

  <div class="wrap">
    ${avisoHtml(mensaje)}

    <div class="clave">
      <div class="icono">🔑</div>
      <p><b>La palabra clave es "Rayos X".</b> Solo se investigan y mandan brief las citas cuyo <b>título</b> (el nombre del evento en tu calendario) contenga <b>"Rayos X"</b> en cualquier parte — como <code>${escapeHtml('María Pérez | 🔵 Rayos X Inscripciones SuperLeads')}</code>. El resto de tus citas se ignora por completo, así que puedes conectar tu calendario normal sin problema.</p>
    </div>

    <div class="pasos">
      <h2>Cómo conseguir la URL de tu calendario</h2>
      <p class="sub">Son 4 pasos en Google Calendar, dos minutos.</p>

      <div class="paso">
        <div class="num">1</div>
        <div class="paso-texto">Entra a <b>Google Calendar</b> → ícono de engrane ⚙️ arriba a la derecha → <b>Configuración</b>.</div>
      </div>
      <div class="paso">
        <div class="num">2</div>
        <div class="paso-texto">En el menú izquierdo, baja hasta <b>"Configuración de mis calendarios"</b> y haz clic en <b>tu nombre/calendario</b> para desplegarlo. Ahí elige <b>"Integrar el calendario"</b>.
          <div class="mockup">
            <div class="mockup-bar">Configuración</div>
            <div class="mockup-body">
              <div class="mockup-side">
                <div class="mockup-item">General</div>
                <div class="mockup-item">Añadir calendario</div>
                <div class="mockup-item activo"><span class="badge-num">2</span>Tu nombre</div>
                <div class="mockup-item hijo">Configuración del calendario</div>
                <div class="mockup-item hijo activo">Integrar el calendario</div>
              </div>
              <div class="mockup-main">
                <div class="mockup-field tachado">
                  <div class="lbl">Dirección pública en formato iCal</div>
                  <div class="val">.../public/basic.ics — no uses esta</div>
                </div>
                <div class="mockup-field destacado">
                  <div class="lbl"><span class="badge-num">3</span>Dirección secreta en formato iCal</div>
                  <div class="val">••••••••• 👁 📋 ← usa esta</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="paso">
        <div class="num">3</div>
        <div class="paso-texto">Busca el campo <b>"Dirección secreta en formato iCal"</b> (NO la "pública" — esa no trae los detalles del prospecto). Haz clic en el ícono del <b>ojo 👁</b> para revelarla y en el ícono de <b>copiar 📋</b> junto a ella.</div>
      </div>
      <div class="paso">
        <div class="num">4</div>
        <div class="paso-texto">Pega esa URL (empieza con <code>https://calendar.google.com/calendar/ical/.../private-.../basic.ics</code>) en el campo de abajo.</div>
      </div>
    </div>

    <form method="POST" action="/colaboradores">
      <h2>Tus datos</h2>
      <label>Tu nombre
        <input type="text" name="nombre" required>
      </label>
      <label>Tu correo
        <small>Aquí te llegarán tus briefs, todos los días a las 9am si hay una junta agendada.</small>
        <input type="email" name="correo" required>
      </label>
      <label>URL secreta del feed .ics de tu calendario
        <small>La del paso 3-4 arriba — la "secreta", no la "pública".</small>
        <input type="url" name="ics_url" required placeholder="https://calendar.google.com/calendar/ical/.../private-.../basic.ics">
      </label>
      <label>Código de acceso
        <small>Te lo comparte tu líder de equipo.</small>
        <input type="text" name="code" required>
      </label>
      <button type="submit">Conectar calendario</button>
      <p class="nota-privacidad">Esta URL solo se usa para leer tus citas de Rayos X — no se comparte con nadie ni se hace pública.</p>
    </form>
  </div>
</body>
</html>`;
}

export function paginaConectado(nombre: string, eventosBacklog: EventoRecord[]): string {
  const filas = eventosBacklog.map(ev => `
    <div class="backlog-item" data-uid="${escapeHtml(ev.uid)}">
      <div>
        <div class="bi-titulo">${escapeHtml(ev.institucion || ev.summary)}</div>
        <div class="bi-fecha">${fechaLegibleCDMX(ev.start_utc)}</div>
      </div>
      <button class="btn-generar" onclick="generarBrief(this, '${ev.uid.replace(/'/g, "\\'")}')">Generar brief</button>
    </div>`).join('\n');

  const backlogHtml = eventosBacklog.length ? `
    <div class="pasos">
      <h2>Citas de Rayos X que ya tenías agendadas</h2>
      <p class="sub">Estas no se investigan solas porque ya existían antes de conectar tu calendario. Dale "Generar brief" a las que quieras tener listas — las que agendes de aquí en adelante sí son automáticas.</p>
      <div class="backlog">${filas}</div>
    </div>` : `
    <div class="pasos">
      <p class="sub" style="margin:0;">No encontramos citas con "Rayos X" en el título agendadas todavía en tu calendario. En cuanto agendes una, se investigará sola.</p>
    </div>`;

  return `<!doctype html>
<html lang="es">
${headAbiertoHtml('Calendario conectado — Brief Agendado')}
<style>
  ${ESTILOS_COMPARTIDOS}
  .pasos{background:#fff;border:.5px solid var(--border);border-radius:12px;padding:28px 26px;margin-bottom:20px;}
  .pasos h2{margin:0 0 4px;font-size:15px;font-weight:800;color:var(--navy);}
  .pasos .sub{margin:0 0 20px;font-size:12.5px;color:var(--muted);line-height:1.6;}
  .aviso-ok{background:rgba(86,239,159,.12);color:var(--green-d);border:.5px solid rgba(43,200,120,.3);padding:12px 16px;border-radius:10px;font-size:13.5px;font-weight:600;margin-bottom:20px;}
  .backlog-item{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 0;border-top:.5px solid var(--border);}
  .backlog-item:first-child{border-top:none;padding-top:0;}
  .bi-titulo{font-size:13.5px;font-weight:700;color:var(--navy);}
  .bi-fecha{font-size:12px;color:var(--muted);margin-top:2px;}
  .btn-generar{flex:none;border:.5px solid var(--blue);background:#fff;color:var(--blue);padding:8px 14px;border-radius:8px;font-size:12.5px;font-weight:700;cursor:pointer;font-family:inherit;}
  .btn-generar:hover{background:var(--blue-softer);}
  .btn-generar:disabled{opacity:.6;cursor:default;}
  .btn-generar.ok{border-color:var(--green-d);color:var(--green-d);}
  .volver{display:inline-flex;align-items:center;gap:6px;color:var(--blue);text-decoration:none;font-size:13px;font-weight:600;}
</style>
</head>
<body>
  <header>
    <div class="brand"><img src="${LOGO_URL}" alt="SuperLeads"></div>
    <div class="hero-text">
      <div class="eyebrow"><span>●</span> BRIEF AGENDADO</div>
      <h1>¡Listo, ${escapeHtml(nombre.split(' ')[0])}!</h1>
      <p>Tu calendario ya está conectado. Cualquier cita nueva con <strong>"Rayos X"</strong> en el título se investigará sola y te llegará el brief el día de la reunión, a las 9am.</p>
    </div>
  </header>
  <div class="wrap">
    <div class="aviso-ok">✓ Calendario conectado correctamente.</div>
    ${backlogHtml}
    <a class="volver" href="/">← Ir al dashboard</a>
  </div>
  <script>
    async function generarBrief(btn, uid) {
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = 'Investigando...';
      try {
        const r = await fetch('/eventos/' + encodeURIComponent(uid) + '/investigar', { method: 'POST' });
        const data = await r.json();
        if (data.ok) {
          btn.textContent = '✓ Listo';
          btn.classList.add('ok');
        } else {
          alert('No se pudo generar: ' + (data.error || 'error desconocido'));
          btn.textContent = original;
          btn.disabled = false;
        }
      } catch (e) {
        alert('Error de red.');
        btn.textContent = original;
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>`;
}
