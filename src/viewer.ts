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
    .titulo-linea{display:flex;align-items:center;gap:10px;}
    .btn-lapiz{border:none;background:none;font-size:16px;cursor:pointer;padding:2px;line-height:1;}
    #formEditar{display:none;background:#F4F7FF;border:.5px solid #e0e8f8;border-radius:10px;padding:20px;margin:0 0 24px;}
    #formEditar label{display:block;font-size:12px;font-weight:600;color:#002582;margin:12px 0 4px;}
    #formEditar label:first-of-type{margin-top:0;}
    #formEditar input{width:100%;box-sizing:border-box;padding:9px 12px;border:.5px solid #e0e8f8;border-radius:8px;font-size:13px;font-family:inherit;background:#fff;}
    #formEditar input:focus{outline:none;border-color:#0039C8;}
    .form-botones{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap;}
    #estadoEditar{margin-top:10px;font-size:13px;}
  </style>
</head>
<body>
  <div class="wrap">
    <div class="top">
      <a href="/">← Volver al dashboard</a>
      <a href="/eventos/${encodeURIComponent(evento.uid)}/dossier">Descargar .md</a>
    </div>
    <div class="card">
      <p class="eyebrow">Pre-Rayos X de Inscripciones</p>
      <div class="titulo-linea">
        <h1>${escapeHtml(tituloBrief)}</h1>
        <button class="btn-lapiz" id="btnLapiz" title="Editar datos del prospecto">✏️</button>
      </div>
      <p class="fecha">${fecha}</p>

      <div id="formEditar">
        <label>Institución<input id="e_institucion" value="${escapeHtml(evento.institucion || '')}"></label>
        <label>Web<input id="e_web" value="${escapeHtml(evento.web || '')}"></label>
        <label>Nombre del representante<input id="e_nombre" value="${escapeHtml(evento.representante_nombre || '')}"></label>
        <label>Teléfono<input id="e_telefono" value="${escapeHtml(evento.representante_telefono || '')}"></label>
        <label>Correo<input id="e_correo" value="${escapeHtml(evento.representante_correo || '')}"></label>
        <label>WhatsApp<input id="e_whatsapp" value="${escapeHtml(evento.representante_whatsapp || '')}"></label>
        <div class="form-botones">
          <button class="btn secondary" id="btnGuardar">Guardar</button>
          <button class="btn primary" id="btnRegenerar">Guardar y generar nuevo brief</button>
        </div>
        <div id="estadoEditar"></div>
      </div>

      <table>${datos}</table>
      <div id="dossierBody">${cuerpo}</div>

      <div class="acciones">
        <button class="btn primary" id="btnEnviar" data-correo="${escapeHtml(evento.destinatario_email || '')}" onclick="mandarCorreo(this)">Mandar correo con este resumen</button>
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
      <p style="margin:20px 0 4px;font-size:10px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#56EF9F;">Pre-Rayos X de Inscripciones</p>
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
      if (!confirm('¿Mandar el brief de esta cita ahora mismo a ' + (btn.dataset.correo || '') + '?')) return;
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
      return d.getFullYear() + '_' + pad(d.getMonth()+1) + '_' + pad(d.getDate()) + '-' + pad(d.getHours()) + '_' + pad(d.getMinutes());
    }

    const PDF_PAGE_W = 794;
    const PDF_PAGE_H = Math.round(PDF_PAGE_W * 297 / 210); // proporción A4

    // Agrupa los bloques del dossier en páginas sin cortar ninguno a la mitad
    // (cada párrafo/lista/encabezado es un bloque atómico). Además, un
    // encabezado nunca se queda solo al pie de página: si no cabe junto con
    // el bloque que le sigue, ambos se empujan a la página siguiente.
    function paginarBloques(blocks) {
      const pages = [[]];
      let alto = 0;
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const h = b.el.getBoundingClientRect().height;
        const esEncabezado = b.el.dataset && b.el.dataset.h === '1';
        let necesario = h;
        if (esEncabezado && blocks[i + 1]) {
          necesario += blocks[i + 1].el.getBoundingClientRect().height;
        }
        const disponible = PDF_PAGE_H - alto;
        if (alto > 0 && necesario > disponible && h <= PDF_PAGE_H) {
          pages.push([]);
          alto = 0;
        }
        pages[pages.length - 1].push(b);
        alto += h;
      }
      return pages;
    }

    function construirPagina(items) {
      const cont = document.createElement('div');
      cont.style.cssText = 'position:fixed;left:-99999px;top:0;width:' + PDF_PAGE_W + 'px;background:#fff;font-family:"Plus Jakarta Sans",-apple-system,Segoe UI,Roboto,sans-serif;';

      let i = 0;
      if (items[i] && items[i].kind === 'header') {
        cont.appendChild(items[i].el.cloneNode(true));
        i++;
      }

      const bodyItems = [];
      let footerItem = null;
      for (; i < items.length; i++) {
        if (items[i].kind === 'footer') footerItem = items[i];
        else bodyItems.push(items[i]);
      }
      if (bodyItems.length) {
        const wrap = document.createElement('div');
        wrap.style.padding = cont.childNodes.length ? '28px 40px' : '32px 40px 8px';
        for (const b of bodyItems) wrap.appendChild(b.el.cloneNode(true));
        cont.appendChild(wrap);
      }
      if (footerItem) cont.appendChild(footerItem.el.cloneNode(true));

      document.body.appendChild(cont);
      return cont;
    }

    async function generarPDF(btn) {
      const estado = document.getElementById('estadoPdf');
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = 'Generando PDF...';
      estado.style.color = '#5b6472';
      estado.textContent = '';

      const temporales = [];
      try {
        // Clona el dossier renderizado hacia la plantilla oculta con estilo SuperLeads
        document.getElementById('dossierBodyPdf').innerHTML = document.getElementById('dossierBody').innerHTML;
        document.getElementById('pdfFechaGeneracion').textContent = new Date().toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short' });

        const target = document.getElementById('pdfTarget');
        const headerEl = target.children[0];
        const bodyWrap = target.children[1];
        const footerEl = target.children[2];
        const tableEl = bodyWrap.children[0];
        const dossierWrap = bodyWrap.children[1];

        const blocks = [
          { el: headerEl, kind: 'header' },
          { el: tableEl, kind: 'body' },
          ...Array.from(dossierWrap.children).map(el => ({ el: el, kind: 'body' })),
          { el: footerEl, kind: 'footer' },
        ];

        const paginas = paginarBloques(blocks);

        // Primero arma y captura cada página (sin construir el PDF todavía, para
        // conocer la altura real de cada una antes de crear el documento).
        const capturas = [];
        for (const items of paginas) {
          const cont = construirPagina(items);
          temporales.push(cont);
          const alto = cont.offsetHeight;
          const canvas = await html2canvas(cont, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
          capturas.push({ dataUrl: canvas.toDataURL('image/jpeg', 0.92), alto: alto });
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'px', format: [PDF_PAGE_W, capturas[0].alto], hotfixes: ['px_scaling'] });
        capturas.forEach((cap, idx) => {
          if (idx > 0) pdf.addPage([PDF_PAGE_W, cap.alto]);
          pdf.addImage(cap.dataUrl, 'JPEG', 0, 0, PDF_PAGE_W, cap.alto);
        });

        pdf.save('brief-${nombreSlug}-' + timestampArchivo() + '.pdf');
        estado.style.color = '#1e7e34';
        estado.textContent = '✓ PDF descargado.';
      } catch (e) {
        estado.style.color = '#c0392b';
        estado.textContent = '✗ No se pudo generar el PDF: ' + (e && e.message ? e.message : 'error desconocido');
      } finally {
        temporales.forEach(n => n.remove());
        btn.disabled = false;
        btn.textContent = original;
      }
    }

    // ── Edición de datos del prospecto ──
    const formEditar = document.getElementById('formEditar');
    document.getElementById('btnLapiz').addEventListener('click', () => {
      formEditar.style.display = formEditar.style.display === 'block' ? 'none' : 'block';
    });

    function datosEditados() {
      return {
        institucion: document.getElementById('e_institucion').value.trim(),
        web: document.getElementById('e_web').value.trim(),
        representante_nombre: document.getElementById('e_nombre').value.trim(),
        representante_telefono: document.getElementById('e_telefono').value.trim(),
        representante_correo: document.getElementById('e_correo').value.trim(),
        representante_whatsapp: document.getElementById('e_whatsapp').value.trim(),
      };
    }

    async function guardarDatos() {
      const r = await fetch('/eventos/${encodeURIComponent(evento.uid)}/datos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datosEditados()),
      });
      const data = await r.json();
      if (!data.ok) throw new Error(data.error || 'No se pudo guardar');
    }

    document.getElementById('btnGuardar').addEventListener('click', async () => {
      const estado = document.getElementById('estadoEditar');
      estado.style.color = '#5b6472';
      estado.textContent = 'Guardando...';
      try {
        await guardarDatos();
        estado.style.color = '#1e7e34';
        estado.textContent = '✓ Datos guardados. Recargando...';
        location.href = '/eventos/${encodeURIComponent(evento.uid)}/ver';
      } catch (e) {
        estado.style.color = '#c0392b';
        estado.textContent = '✗ ' + e.message;
      }
    });

    document.getElementById('btnRegenerar').addEventListener('click', async () => {
      if (!confirm('Se guardan los datos corregidos y se genera un brief NUEVO con ellos — el anterior se reemplaza. ¿Continuar?')) return;
      const estado = document.getElementById('estadoEditar');
      const btn = document.getElementById('btnRegenerar');
      btn.disabled = true;
      estado.style.color = '#5b6472';
      estado.textContent = 'Guardando datos y regenerando el brief... (puede tardar un minuto)';
      try {
        await guardarDatos();
        const r = await fetch('/eventos/${encodeURIComponent(evento.uid)}/regenerar', { method: 'POST' });
        const data = await r.json();
        if (!data.ok) throw new Error(data.error || 'No se pudo regenerar');
        estado.style.color = '#1e7e34';
        estado.textContent = '✓ Brief regenerado. Recargando...';
        location.href = '/eventos/${encodeURIComponent(evento.uid)}/ver';
      } catch (e) {
        estado.style.color = '#c0392b';
        estado.textContent = '✗ ' + e.message;
        btn.disabled = false;
      }
    });

    // Permite disparar la descarga desde otra pantalla (el dashboard) sin
    // tener que entrar aquí y darle clic de nuevo: /ver?descargar=pdf
    if (new URLSearchParams(location.search).get('descargar') === 'pdf') {
      window.addEventListener('load', () => generarPDF(document.getElementById('btnPdf')));
    }
    // ...y abrir el formulario de edición directo desde el lápiz del dashboard
    if (new URLSearchParams(location.search).get('editar') === '1') {
      formEditar.style.display = 'block';
    }
  </script>
</body>
</html>`;
}
