// RLR
import type { EventoRecord } from './types';
import { escapeHtml, dossierToHtml, fechaLegibleCDMX } from './markdown';

function fila(etiqueta: string, valor: string | null): string {
  if (!valor) return '';
  const esLink = /^https?:\/\//.test(valor);
  const valorHtml = esLink ? `<a href="${escapeHtml(valor)}" target="_blank" style="color:#3457d5;">${escapeHtml(valor)}</a>` : escapeHtml(valor);
  return `<tr><td style="padding:4px 14px 4px 0;color:#9aa2b1;font-size:13px;white-space:nowrap;">${escapeHtml(etiqueta)}</td><td style="padding:4px 0;font-size:13px;color:#2b3646;">${valorHtml}</td></tr>`;
}

export function paginaVerDossier(evento: EventoRecord): string {
  const fecha = fechaLegibleCDMX(evento.start_utc);
  const datos = [
    fila('Institución', evento.institucion),
    fila('Web', evento.web),
    fila('Representante', evento.representante_nombre),
    fila('Teléfono', evento.representante_telefono),
    fila('Correo', evento.representante_correo),
    fila('WhatsApp', evento.representante_whatsapp),
    fila('Zoom', evento.zoom_link),
    fila('SL Comercial (CRM)', evento.sl_comercial_link),
    fila('Para', evento.destinatario_nombre ? `${evento.destinatario_nombre} <${evento.destinatario_email}>` : evento.destinatario_email),
  ].filter(Boolean).join('\n');

  const cuerpo = evento.dossier_md ? dossierToHtml(evento.dossier_md) : '<p>Esta cita todavía no tiene dossier generado.</p>';

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(evento.institucion || evento.summary)} — Brief Agendado</title>
  <style>
    body{margin:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#2b3646;}
    .wrap{max-width:720px;margin:0 auto;padding:32px 20px 60px;}
    .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;}
    .top a{color:#3457d5;text-decoration:none;font-size:13px;font-weight:600;}
    .card{background:#fff;border-radius:12px;padding:32px;}
    .eyebrow{margin:0 0 4px;font-size:12.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#3457d5;}
    h1{margin:0 0 16px;font-size:22px;color:#1a2b4c;}
    .fecha{margin:0 0 20px;font-size:13px;color:#9aa2b1;}
    table{border-collapse:collapse;margin:0 0 24px;}
    .acciones{margin-top:28px;padding-top:20px;border-top:1px solid #eef0f3;display:flex;gap:10px;flex-wrap:wrap;}
    .btn{display:inline-block;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;cursor:pointer;border:none;}
    .btn.primary{background:#3457d5;color:#fff;}
    .btn.secondary{background:#f0f2f6;color:#2b3646;}
    #estadoEnvio{margin-top:10px;font-size:13px;}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <a href="/">← Volver al dashboard</a>
      <a href="/eventos/${encodeURIComponent(evento.uid)}/dossier">Descargar .md</a>
    </div>
    <div class="card">
      <p class="eyebrow">Rayos X de Inscripciones</p>
      <h1>${escapeHtml(evento.institucion || evento.summary)}</h1>
      <p class="fecha">${fecha}</p>
      <table>${datos}</table>
      <div>${cuerpo}</div>

      <div class="acciones">
        <button class="btn primary" onclick="mandarCorreo(this)">Mandar correo con este resumen</button>
        <a class="btn secondary" href="/eventos/${encodeURIComponent(evento.uid)}/dossier">Descargar .md</a>
      </div>
      <div id="estadoEnvio"></div>
    </div>
  </div>
  <script>
    async function mandarCorreo(btn) {
      if (!confirm('¿Mandar el brief de esta cita ahora mismo a ${escapeHtml((evento.destinatario_email || '').replace(/'/g, "\\'"))}?')) return;
      btn.disabled = true;
      btn.textContent = 'Enviando...';
      const estado = document.getElementById('estadoEnvio');
      try {
        const r = await fetch('/eventos/${encodeURIComponent(evento.uid)}/enviar', { method: 'POST' });
        const data = await r.json();
        if (data.ok) {
          estado.style.color = '#1e7e34';
          estado.textContent = '✓ Correo enviado.';
        } else {
          estado.style.color = '#c0392b';
          estado.textContent = '✗ ' + (data.error || 'No se pudo enviar.');
        }
      } catch (e) {
        estado.style.color = '#c0392b';
        estado.textContent = '✗ Error de red al enviar.';
      } finally {
        btn.disabled = false;
        btn.textContent = 'Mandar correo con este resumen';
      }
    }
  </script>
</body>
</html>`;
}
