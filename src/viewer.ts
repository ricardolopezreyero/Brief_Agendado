// RLR
import type { EventoRecord } from './types';
import { escapeHtml, dossierToHtml, fechaLegibleCDMX, LOGO_SUPERLEADS } from './markdown';

function fila(etiqueta: string, valor: string | null): string {
  if (!valor) return '';
  const esLink = /^https?:\/\//.test(valor);
  const valorHtml = esLink ? `<a href="${escapeHtml(valor)}" target="_blank" style="color:#3457d5;">${escapeHtml(valor)}</a>` : escapeHtml(valor);
  return `<tr><td style="padding:4px 14px 4px 0;color:#9aa2b1;font-size:13px;white-space:nowrap;">${escapeHtml(etiqueta)}</td><td style="padding:4px 0;font-size:13px;color:#2b3646;">${valorHtml}</td></tr>`;
}

// Fila de la misma info pero con colores/tamaños pensados para el PDF (fondo blanco, texto navy).
function filaPdf(etiqueta: string, valor: string | null): string {
  if (!valor) return '';
  return `<tr><td style="padding:5px 16px 5px 0;color:#9aa2b1;font-size:12px;white-space:nowrap;vertical-align:top;">${escapeHtml(etiqueta)}</td><td style="padding:5px 0;font-size:12px;color:#1a1a1a;word-break:break-word;">${escapeHtml(valor)}</td></tr>`;
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

  const datosPdf = [
    filaPdf('Institución', evento.institucion),
    filaPdf('Web', evento.web),
    filaPdf('Representante', evento.representante_nombre),
    filaPdf('Teléfono', evento.representante_telefono),
    filaPdf('Correo', evento.representante_correo),
    filaPdf('WhatsApp', evento.representante_whatsapp),
  ].filter(Boolean).join('\n');

  const cuerpo = evento.dossier_md ? dossierToHtml(evento.dossier_md) : '<p>Esta cita todavía no tiene dossier generado.</p>';
  const tituloBrief = evento.institucion || evento.summary;
  const nombreSlug = tituloBrief.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(tituloBrief)} — Brief Agendado</title>
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
    .acciones{margin-top:28px;padding-top:20px;border-top:1px solid #eef0f3;display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
    .btn{display:inline-block;padding:9px 16px;border-radius:8px;font-size:13px;font-weight:600;text-decoration:none;cursor:pointer;border:none;font-family:inherit;}
    .btn.primary{background:#3457d5;color:#fff;}
    .btn.secondary{background:#f0f2f6;color:#2b3646;}
    .btn.pdf{background:#56EF9F;color:#001240;}
    .btn:disabled{opacity:.6;cursor:default;}
    #estadoEnvio{margin-top:10px;font-size:13px;}
    #estadoPdf{margin-top:10px;font-size:13px;}
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
      <h1>${escapeHtml(tituloBrief)}</h1>
      <p class="fecha">${fecha}</p>
      <table>${datos}</table>
      <div id="dossierBody">${cuerpo}</div>

      <div class="acciones">
        <button class="btn primary" onclick="mandarCorreo(this)">Mandar correo con este resumen</button>
        <button class="btn pdf" id="btnPdf" onclick="generarPDF(this)">Descargar PDF</button>
        <a class="btn secondary" href="/eventos/${encodeURIComponent(evento.uid)}/dossier">Descargar .md</a>
      </div>
      <div id="estadoEnvio"></div>
      <div id="estadoPdf"></div>
    </div>
  </div>

  <!-- Plantilla oculta, con estilo SuperLeads, que se captura para armar el PDF -->
  <div id="pdfTarget" style="position:fixed;left:-99999px;top:0;width:794px;background:#fff;font-family:'Plus Jakarta Sans',-apple-system,Segoe UI,Roboto,sans-serif;">
    <div style="background:#001240;padding:28px 40px;">
      <img src="${LOGO_SUPERLEADS}" crossorigin="anonymous" style="width:150px;display:block;">
      <p style="margin:20px 0 4px;font-size:10px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#56EF9F;">Rayos X de Inscripciones</p>
      <h1 style="margin:0 0 6px;font-size:22px;font-weight:800;color:#fff;letter-spacing:-.4px;">${escapeHtml(tituloBrief)}</h1>
      <p style="margin:0;font-size:11.5px;color:#7a9fd4;">${fecha}</p>
    </div>
    <div style="padding:28px 40px;">
      <table style="border-collapse:collapse;margin:0 0 22px;">${datosPdf}</table>
      <div id="dossierBodyPdf" style="font-size:12px;line-height:1.6;color:#1a1a1a;"></div>
    </div>
    <div style="padding:16px 40px;border-top:.5px solid #e0e8f8;">
      <p style="margin:0;font-size:9.5px;color:#aaa;">Generado automáticamente por Brief Agendado — SuperLeads · <span id="pdfFechaGeneracion"></span></p>
    </div>
  </div>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
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

    function timestampArchivo() {
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      return d.getFullYear() + pad(d.getMonth()+1) + pad(d.getDate()) + '-' + pad(d.getHours()) + pad(d.getMinutes());
    }

    async function generarPDF(btn) {
      const estado = document.getElementById('estadoPdf');
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = 'Generando PDF...';
      estado.style.color = '#5b6472';
      estado.textContent = '';

      try {
        // Clona el dossier renderizado hacia la plantilla oculta con estilo SuperLeads
        document.getElementById('dossierBodyPdf').innerHTML = document.getElementById('dossierBody').innerHTML;
        document.getElementById('pdfFechaGeneracion').textContent = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });

        const target = document.getElementById('pdfTarget');
        const canvas = await html2canvas(target, { scale: 2, backgroundColor: '#ffffff', useCORS: true });

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pageWidth = 210, pageHeight = 297;
        const imgWidth = pageWidth;
        const imgHeight = canvas.height * imgWidth / canvas.width;

        let heightLeft = imgHeight;
        let position = 0;
        const imgData = canvas.toDataURL('image/png');

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        pdf.save('brief-${nombreSlug}-' + timestampArchivo() + '.pdf');
        estado.style.color = '#1e7e34';
        estado.textContent = '✓ PDF descargado.';
      } catch (e) {
        estado.style.color = '#c0392b';
        estado.textContent = '✗ No se pudo generar el PDF: ' + (e && e.message ? e.message : 'error desconocido');
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    }
  </script>
</body>
</html>`;
}
