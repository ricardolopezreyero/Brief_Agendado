// RLR
import type { EventoRecord } from './types';
import { escapeHtml, dossierToHtml, fechaLegibleCDMX } from './markdown';
import { headAbiertoHtml, appShellAbrir, APP_SHELL_CERRAR, footerHtml, ESTILOS_SUPERLEADS, LOGO_AZUL, LOGO_BLANCO, ICONOS } from './branding';
import { esElegibleVcf, nombreArchivoVcf } from './vcard';

function fila(etiqueta: string, valor: string | null): string {
  if (!valor) return '';
  const esLink = /^https?:\/\//.test(valor);
  const valorHtml = esLink ? `<a href="${escapeHtml(valor)}" target="_blank" style="color:var(--blue);">${escapeHtml(valor)}</a>` : escapeHtml(valor);
  return `<tr><td style="padding:4px 14px 4px 0;color:var(--dim);font-size:13px;white-space:nowrap;">${escapeHtml(etiqueta)}</td><td style="padding:4px 0;font-size:13px;color:var(--ink);">${valorHtml}</td></tr>`;
}

// Fila de la misma info pero pensada para el PDF (misma paleta, tamaño de impresión).
function filaPdf(etiqueta: string, valor: string | null): string {
  if (!valor) return '';
  return `<tr><td style="padding:5px 16px 5px 0;color:#5b6472;font-size:12px;white-space:nowrap;vertical-align:top;">${escapeHtml(etiqueta)}</td><td style="padding:5px 0;font-size:12px;color:#111827;font-weight:600;word-break:break-word;">${escapeHtml(valor)}</td></tr>`;
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
${headAbiertoHtml(`${tituloBrief} — Brief Rayos X · SuperLeads`)}
<style>
  ${ESTILOS_SUPERLEADS}

  .top{display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;gap:12px;flex-wrap:wrap;}
  .top a.volver{color:var(--blue);text-decoration:none;font-size:13px;font-weight:600;}
  .top-acciones{display:flex;gap:8px;align-items:center;}

  .card{background:#fff;border:.5px solid var(--border);border-radius:12px;padding:32px;box-shadow:var(--shadow-sm);}
  .titulo-linea{display:flex;align-items:center;gap:10px;}
  .titulo-linea h1{margin:0;}
  .btn-lapiz{display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:8px;border:none;background:var(--blue-softer);color:var(--blue);cursor:pointer;padding:0;flex-shrink:0;transition:background-color .2s,color .2s;}
  .btn-lapiz:hover{background:var(--blue);color:#fff;}
  .fecha-brief{margin:6px 0 20px;font-size:13px;color:var(--dim);}
  table{border-collapse:collapse;margin:0 0 24px;}

  #formEditar{display:none;background:var(--blue-soft);border:.5px solid var(--border);border-radius:10px;padding:20px;margin:0 0 24px;}
  #formEditar label{display:block;font-size:12px;font-weight:600;color:var(--navy);margin:12px 0 4px;}
  #formEditar label:first-of-type{margin-top:0;}
  #formEditar input{width:100%;box-sizing:border-box;padding:9px 12px;border:.5px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;background:#fff;}
  #formEditar input:focus{outline:none;border-color:var(--blue);}
  .form-botones{display:flex;gap:10px;margin-top:18px;flex-wrap:wrap;}
  #estadoEditar{margin-top:10px;font-size:13px;}

  #progresoWrap{display:none;margin-top:16px;}
  #progresoBarra-fondo{height:10px;background:var(--border);border-radius:999px;overflow:hidden;}
  #progresoBarra{height:100%;width:0%;background:linear-gradient(90deg,var(--blue),var(--green));border-radius:999px;transition:width .5s ease;}
  #progresoTexto{margin-top:8px;font-size:13px;font-weight:600;color:var(--navy);}

  .acciones{margin-top:28px;padding-top:20px;border-top:.5px solid var(--border);display:flex;gap:10px;flex-wrap:wrap;align-items:center;}
  #estadoEnvio,#estadoPdf{margin-top:10px;font-size:13px;font-weight:600;}

  /* Links largos (Zoom, CRM, fuentes del dossier) nunca desbordan el ancho */
  .card a{word-break:break-all;overflow-wrap:anywhere;}
  #dossierBody{overflow-wrap:anywhere;}

  @media(max-width:600px){
    .card{padding:22px 16px;}
    .card > table, .card > table tbody, .card > table tr, .card > table td{display:block;width:100%;}
    .card > table td{padding:1px 0 !important;white-space:normal !important;}
    .card > table tr{padding:5px 0;}
    .acciones .btn{flex:1 1 auto;text-align:center;justify-content:center;}
  }
</style>
</head>
<body>
  ${appShellAbrir('historial')}
    <div class="top">
      <a class="volver" href="/">← Volver al historial</a>
      <div class="top-acciones">
        <button class="btn btn-navy" onclick="generarPDF(this)">${ICONOS.descargar} Descargar PDF</button>
        <a class="btn btn-outline" href="/eventos/${encodeURIComponent(evento.uid)}/dossier">${ICONOS.descargar} Descargar .md</a>
      </div>
    </div>
    <div class="card">
      <div class="page-eyebrow"><span>Pre-Rayos X de Inscripciones</span></div>
      <div class="titulo-linea">
        <h1>${escapeHtml(tituloBrief)}</h1>
        <button class="btn-lapiz" id="btnLapiz" title="Editar datos del prospecto">${ICONOS.lapiz}</button>
      </div>
      <p class="fecha-brief">${fecha}</p>

      <div id="formEditar">
        <label>Institución<input id="e_institucion" value="${escapeHtml(evento.institucion || '')}"></label>
        <label>Web<input id="e_web" value="${escapeHtml(evento.web || '')}"></label>
        <label>Nombre del representante<input id="e_nombre" value="${escapeHtml(evento.representante_nombre || '')}"></label>
        <label>Teléfono<input id="e_telefono" value="${escapeHtml(evento.representante_telefono || '')}"></label>
        <label>Correo<input id="e_correo" value="${escapeHtml(evento.representante_correo || '')}"></label>
        <label>WhatsApp<input id="e_whatsapp" value="${escapeHtml(evento.representante_whatsapp || '')}"></label>
        <div class="form-botones">
          <button class="btn btn-outline" id="btnGuardar">Guardar</button>
          <button class="btn btn-primary" id="btnRegenerar">Guardar y regenerar brief</button>
        </div>
        <div id="progresoWrap">
          <div id="progresoBarra-fondo"><div id="progresoBarra"></div></div>
          <div id="progresoTexto"></div>
        </div>
        <div id="estadoEditar"></div>
      </div>

      <table>${datos}</table>
      <div id="dossierBody">${cuerpo}</div>

      <div class="acciones">
        <button class="btn btn-primary" id="btnEnviar" data-correo="${escapeHtml(evento.destinatario_email || '')}" onclick="mandarCorreo(this)">${ICONOS.correo} Mandar correo con este resumen</button>
        <button class="btn btn-navy" id="btnPdf" onclick="generarPDF(this)">${ICONOS.descargar} Descargar PDF</button>
        ${esElegibleVcf(evento) ? `<a class="btn btn-outline" href="/eventos/${encodeURIComponent(evento.uid)}/vcard" download="${escapeHtml(nombreArchivoVcf(evento))}">${ICONOS.contacto} Guardar contacto</a>` : ''}
        <a class="btn btn-outline" href="/eventos/${encodeURIComponent(evento.uid)}/dossier">${ICONOS.descargar} Descargar .md</a>
      </div>
      <div id="estadoEnvio"></div>
      <div id="estadoPdf"></div>
    </div>
  ${APP_SHELL_CERRAR}
  ${footerHtml()}

  <!-- ═══ Plantillas ocultas para armar el PDF (html2canvas + jsPDF) ═══
       Tamaño Carta (216×279mm) con portada + páginas interiores con folio,
       según la anatomía de documento de la guía de estilos SuperLeads. -->

  <!-- Portada: logo blanco, institución, fecha, confidencialidad — sin folio -->
  <div id="pdfPortada" style="position:fixed;left:-99999px;top:0;width:816px;height:1054px;background:#001240;font-family:'Plus Jakarta Sans',-apple-system,Segoe UI,Roboto,sans-serif;padding:76px 60px;box-sizing:border-box;display:flex;flex-direction:column;">
    <img src="${LOGO_BLANCO}" style="width:196px;display:block;">
    <div style="flex:1;display:flex;flex-direction:column;justify-content:center;">
      <p style="margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:1.3px;text-transform:uppercase;color:#56EF9F;">Pre-Rayos X de Inscripciones</p>
      <h1 style="margin:0 0 14px;font-size:36px;font-weight:800;color:#fff;letter-spacing:-1px;line-height:1.15;">${escapeHtml(tituloBrief)}</h1>
      <p style="margin:0;font-size:13px;color:#7a9fd4;">${fecha}</p>
    </div>
    <p style="margin:0;font-size:9px;color:#4a6aaa;">Confidencial — Uso interno SuperLeads</p>
  </div>

  <!-- Plantillas de header/footer interior + fuente de contenido (tabla de
       datos + dossier). Todo fuera del flujo normal (position:fixed) para
       que no agreguen scroll fantasma en blanco al final de la página. -->
  <div style="position:fixed;left:-99999px;top:0;">
    <div id="pdfInteriorHeaderTpl" style="width:696px;padding-bottom:12px;border-bottom:1px solid #d8dce4;display:flex;align-items:center;justify-content:space-between;font-family:'Plus Jakarta Sans',sans-serif;">
      <img src="${LOGO_AZUL}" style="width:104px;display:block;">
      <span style="font-size:9.5px;font-weight:600;letter-spacing:.04em;color:#5b6472;text-transform:uppercase;">Brief Rayos X — ${escapeHtml(evento.institucion || tituloBrief)}</span>
    </div>
    <div id="pdfInteriorFooterTpl" style="width:696px;padding-top:10px;border-top:1px solid #d8dce4;display:flex;align-items:center;justify-content:space-between;font-family:'Plus Jakarta Sans',sans-serif;">
      <span style="font-size:8.5px;color:#5b6472;">${escapeHtml(evento.institucion || tituloBrief)} · ${fecha}</span>
      <span class="pdf-folio" style="font-size:9px;color:#98a1b0;"></span>
    </div>
    <div id="pdfDatosWrap" style="width:696px;font-family:'Plus Jakarta Sans',sans-serif;">
      <table style="border-collapse:collapse;margin:0 0 4px;">${datosPdf}</table>
    </div>
    <div id="dossierBodyPdf" style="width:696px;font-size:13px;line-height:1.6;color:#111827;font-family:'Plus Jakarta Sans',sans-serif;"></div>
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
          estado.style.color = 'var(--ok)';
          estado.textContent = '✓ Correo enviado.';
        } else {
          estado.style.color = 'var(--destructive)';
          estado.textContent = '✗ No se pudo enviar el correo. Intenta de nuevo o descarga el PDF y compártelo directo.';
        }
      } catch (e) {
        estado.style.color = 'var(--destructive)';
        estado.textContent = '✗ No se pudo enviar el correo. Intenta de nuevo o descarga el PDF y compártelo directo.';
      } finally {
        btn.disabled = false;
        btn.innerHTML = '${ICONOS.correo} Mandar correo con este resumen';
      }
    }

    function timestampArchivo() {
      const d = new Date();
      const pad = n => String(n).padStart(2, '0');
      return d.getFullYear() + '_' + pad(d.getMonth()+1) + '_' + pad(d.getDate()) + '-' + pad(d.getHours()) + '_' + pad(d.getMinutes());
    }

    // Tamaño Carta (216×279mm a 96dpi) — la guía de documentos SuperLeads usa
    // Carta, nunca A4. Ancho de contenido 696px ≈ 184mm (márgenes 60px≈16mm).
    const PDF_PAGE_W = 816;
    const PDF_PAGE_H = Math.round(PDF_PAGE_W * 279 / 216);
    const PDF_MARGIN_X = 60;

    // Agrupa los bloques del dossier en páginas sin cortar ninguno a la mitad
    // (cada párrafo/lista/encabezado es un bloque atómico). Además, un
    // encabezado nunca se queda solo al pie de página: si no cabe junto con
    // el bloque que le sigue, ambos se empujan a la página siguiente.
    // presupuestoAlto: espacio disponible por página, descontando ya el
    // header/footer interiores fijos.
    function paginarBloques(blocks, presupuestoAlto) {
      const pages = [[]];
      let alto = 0;
      for (let i = 0; i < blocks.length; i++) {
        const b = blocks[i];
        const h = b.getBoundingClientRect().height;
        const esEncabezado = b.dataset && b.dataset.h === '1';
        let necesario = h;
        if (esEncabezado && blocks[i + 1]) {
          necesario += blocks[i + 1].getBoundingClientRect().height;
        }
        const disponible = presupuestoAlto - alto;
        if (alto > 0 && necesario > disponible && h <= presupuestoAlto) {
          pages.push([]);
          alto = 0;
        }
        pages[pages.length - 1].push(b);
        alto += h;
      }
      return pages;
    }

    async function generarPDF(btn) {
      const estado = document.getElementById('estadoPdf');
      btn.disabled = true;
      const original = btn.innerHTML;
      btn.textContent = 'Generando PDF...';
      estado.style.color = 'var(--muted)';
      estado.textContent = '';

      const temporales = [];
      try {
        document.getElementById('dossierBodyPdf').innerHTML = document.getElementById('dossierBody').innerHTML;

        // 1) Portada — siempre 1 página, tamaño Carta completo.
        const portada = document.getElementById('pdfPortada');
        const portadaCanvas = await html2canvas(portada, { scale: 2, backgroundColor: '#001240', useCORS: true });

        // 2) Bloques de contenido interior: tabla de datos + dossier.
        const datosWrap = document.getElementById('pdfDatosWrap');
        const dossierWrap = document.getElementById('dossierBodyPdf');
        const bloques = [datosWrap, ...Array.from(dossierWrap.children)];

        // Presupuesto vertical por página interior = alto de página − header − footer − paddings.
        const headerAlto = document.getElementById('pdfInteriorHeaderTpl').getBoundingClientRect().height;
        const footerAlto = document.getElementById('pdfInteriorFooterTpl').getBoundingClientRect().height;
        const presupuesto = PDF_PAGE_H - headerAlto - footerAlto - 76 - 40; // 76 top margin, 40 aire entre bloques y chrome
        const paginas = paginarBloques(bloques, presupuesto);
        const totalPaginas = paginas.length;

        const capturasInterior = [];
        for (let i = 0; i < paginas.length; i++) {
          const cont = document.createElement('div');
          cont.style.cssText = 'position:fixed;left:-99999px;top:0;width:' + PDF_PAGE_W + 'px;min-height:' + PDF_PAGE_H + 'px;background:#fff;font-family:"Plus Jakarta Sans",sans-serif;padding:38px ' + PDF_MARGIN_X + 'px;box-sizing:border-box;display:flex;flex-direction:column;';

          const header = document.getElementById('pdfInteriorHeaderTpl').cloneNode(true);
          header.style.width = '100%';
          cont.appendChild(header);

          const body = document.createElement('div');
          body.style.cssText = 'flex:1;padding-top:26px;';
          for (const b of paginas[i]) body.appendChild(b.cloneNode(true));
          cont.appendChild(body);

          const footer = document.getElementById('pdfInteriorFooterTpl').cloneNode(true);
          footer.style.width = '100%';
          footer.querySelector('.pdf-folio').textContent = (i + 1) + ' / ' + totalPaginas;
          cont.appendChild(footer);

          document.body.appendChild(cont);
          temporales.push(cont);

          const canvas = await html2canvas(cont, { scale: 2, backgroundColor: '#ffffff', useCORS: true, windowWidth: PDF_PAGE_W });
          capturasInterior.push(canvas);
        }

        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({ unit: 'px', format: [PDF_PAGE_W, PDF_PAGE_H], hotfixes: ['px_scaling'] });
        pdf.addImage(portadaCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PDF_PAGE_W, PDF_PAGE_H);
        for (const canvas of capturasInterior) {
          pdf.addPage([PDF_PAGE_W, PDF_PAGE_H]);
          pdf.addImage(canvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, PDF_PAGE_W, PDF_PAGE_H);
        }

        pdf.save('brief-${nombreSlug}-' + timestampArchivo() + '.pdf');
        estado.style.color = 'var(--ok)';
        estado.textContent = '✓ PDF descargado.';
      } catch (e) {
        estado.style.color = 'var(--destructive)';
        estado.textContent = '✗ No se pudo generar el PDF. Vuelve a intentar — si se repite, copia el link de esta página y avísale a Ricardo.';
      } finally {
        temporales.forEach(n => n.remove());
        btn.disabled = false;
        btn.innerHTML = original;
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
      estado.style.color = 'var(--muted)';
      estado.textContent = 'Guardando...';
      try {
        await guardarDatos();
        estado.style.color = 'var(--ok)';
        estado.textContent = '✓ Datos guardados. Recargando...';
        location.href = '/eventos/${encodeURIComponent(evento.uid)}/ver';
      } catch (e) {
        estado.style.color = 'var(--destructive)';
        estado.textContent = '✗ ' + e.message;
      }
    });

    // ── Barra de progreso de la regeneración ──
    // El research tarda 30-60s; sin esto no se sabe si algo está pasando.
    // Avanza sola por etapas hasta 92% y llega a 100% cuando el servidor
    // responde — nunca saca al usuario de la página.
    let progresoTimer = null;
    function iniciarProgreso() {
      const wrap = document.getElementById('progresoWrap');
      const barra = document.getElementById('progresoBarra');
      const texto = document.getElementById('progresoTexto');
      wrap.style.display = 'block';
      let pct = 0;
      const etapas = [
        [0, 'Guardando los datos corregidos...'],
        [15, 'Buscando información del prospecto en internet...'],
        [45, 'Analizando resultados y cruzando con el ICP...'],
        [72, 'Redactando el nuevo brief...'],
        [88, 'Casi listo, dando los últimos toques...'],
      ];
      const pinta = () => {
        barra.style.width = pct + '%';
        let t = etapas[0][1];
        for (const [lim, txt] of etapas) if (pct >= lim) t = txt;
        texto.textContent = t + ' ' + Math.round(pct) + '%';
      };
      pinta();
      progresoTimer = setInterval(() => {
        pct = Math.min(pct + (pct < 30 ? 2.5 : pct < 65 ? 1.2 : 0.4), 92);
        pinta();
      }, 500);
    }
    function terminarProgreso(ok, mensaje) {
      clearInterval(progresoTimer);
      const barra = document.getElementById('progresoBarra');
      const texto = document.getElementById('progresoTexto');
      if (ok) {
        barra.style.width = '100%';
        texto.style.color = 'var(--ok)';
      } else {
        barra.style.background = 'var(--destructive)';
        texto.style.color = 'var(--destructive)';
      }
      texto.textContent = mensaje;
    }

    document.getElementById('btnRegenerar').addEventListener('click', async () => {
      if (!confirm('Se guardan los datos corregidos y se genera un brief NUEVO con ellos — el anterior se reemplaza. ¿Continuar?')) return;
      const btn = document.getElementById('btnRegenerar');
      const btnG = document.getElementById('btnGuardar');
      btn.disabled = true;
      btnG.disabled = true;
      document.getElementById('estadoEditar').textContent = '';
      iniciarProgreso();
      try {
        await guardarDatos();
        const r = await fetch('/eventos/${encodeURIComponent(evento.uid)}/regenerar', { method: 'POST' });
        const data = await r.json();
        if (!data.ok) throw new Error(data.error || 'No se pudo regenerar');
        terminarProgreso(true, '✓ ¡Brief nuevo listo! Cargándolo...');
        setTimeout(() => location.replace('/eventos/${encodeURIComponent(evento.uid)}/ver'), 900);
      } catch (e) {
        terminarProgreso(false, '✗ ' + e.message);
        btn.disabled = false;
        btnG.disabled = false;
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
