// RLR
import { headAbiertoHtml, appShellAbrir, APP_SHELL_CERRAR, pageHeader, footerHtml, ESTILOS_SUPERLEADS, ICONOS } from './branding';

export function paginaDashboard(): string {
  return `<!doctype html>
<html lang="es">
${headAbiertoHtml('Brief Agendado — Dashboard')}
<style>
  ${ESTILOS_SUPERLEADS}

  .toolbar{display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap;}
  .toolbar input{padding:10px 14px;border:.5px solid var(--border);border-radius:8px;font-size:13.5px;font-family:inherit;min-width:260px;background:#fff;}
  .toolbar input:focus{outline:none;border-color:var(--blue);}

  .chips{display:flex;gap:8px;}
  .chip{border:.5px solid var(--border);background:#fff;border-radius:999px;padding:8px 16px;font-size:12.5px;font-weight:700;color:var(--muted);cursor:pointer;font-family:inherit;}
  .chip.activo{border-color:var(--navy);background:var(--navy);color:#fff;}

  .btn-estado{border:none;background:none;font-size:15px;cursor:pointer;padding:2px;line-height:1;}
  .btn-lapiz{display:inline-flex;align-items:center;color:var(--dim);text-decoration:none;margin-left:6px;}
  .btn-lapiz:hover{color:var(--blue);}

  .card{background:#fff;border:.5px solid var(--border);border-radius:12px;overflow:auto;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{text-align:left;padding:12px 14px;background:var(--blue-softer);color:var(--navy);font-weight:700;border-bottom:.5px solid var(--border);white-space:nowrap;font-size:11.5px;text-transform:uppercase;letter-spacing:.3px;}
  td{padding:12px 14px;border-bottom:.5px solid var(--border);vertical-align:top;color:#2b3646;}
  tr:hover td{background:var(--blue-soft);}

  .pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:700;}
  .pill.ok{background:rgba(86,239,159,.15);color:var(--green-d);}
  .pill.pend{background:#fff4e0;color:#a86400;}
  .pill.err{background:#fdecea;color:#c0392b;}

  /* Acciones como botones reales (chips), no como texto subrayado — se
     agrupan en una fila que puede pasar a doble línea si no cabe (flex-wrap),
     tanto en la columna "Resumen" como en "Acciones". */
  .botones{display:flex;flex-wrap:wrap;gap:6px;align-items:center;}
  .dl{display:inline-flex;align-items:center;gap:4px;padding:6px 11px;border-radius:7px;background:var(--blue-softer);color:var(--blue);text-decoration:none;font-weight:700;font-size:12px;line-height:1.2;border:.5px solid transparent;transition:background .15s,color .15s;white-space:nowrap;}
  .dl:hover{background:var(--blue);color:#fff;}
  .dl.pdf{background:rgba(86,239,159,.15);color:var(--green-d);}
  .dl.pdf:hover{background:var(--green);color:var(--navy-deep);}
  .dl.vcf{background:rgba(86,239,159,.15);color:var(--green-d);}
  .dl.vcf:hover{background:var(--green);color:var(--navy-deep);}
  .dl.disabled{color:#c3c8d1;background:var(--blue-soft);pointer-events:none;}
  .btn-enviar{display:inline-flex;align-items:center;gap:4px;border:none;background:var(--blue);color:#fff;font-weight:700;font-size:12px;cursor:pointer;padding:6px 12px;border-radius:7px;font-family:inherit;white-space:nowrap;transition:background .15s;}
  .btn-enviar:hover{background:var(--navy);}
  .btn-enviar:disabled{background:var(--blue-soft);color:#c3c8d1;cursor:default;}
  .btn-enviar.enviado{background:rgba(86,239,159,.18);color:var(--green-d);}
  .btn-enviar.enviado:hover{background:rgba(86,239,159,.3);}
  .muted{color:var(--dim);font-size:12px;}
  #empty{padding:48px;text-align:center;color:var(--dim);font-size:13.5px;}

  /* Móvil: la tabla se convierte en tarjetas apiladas (cada <tr> es una
     tarjeta, cada <td> muestra su etiqueta con ::before) para que quepa en
     el ancho de la pantalla sin scroll horizontal. Los botones de acciones
     usan flex-wrap y pueden acomodarse en dos filas si hace falta. */
  @media(max-width:760px){
    .app-main.ancho{padding:16px 12px 48px;}
    .card{overflow:visible;border-radius:10px;}
    .toolbar input{min-width:0;width:100%;}
    .chips{flex-wrap:wrap;}
    table, thead, tbody, tr, th, td{display:block;width:100%;}
    thead{display:none;}
    tbody tr{padding:14px 14px 10px;border-bottom:8px solid var(--blue-soft);}
    tbody tr:last-child{border-bottom:none;}
    td{display:flex;gap:12px;align-items:flex-start;justify-content:space-between;padding:6px 0;border-bottom:none;}
    td::before{content:attr(data-label);flex:none;width:104px;font-size:10.5px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;color:var(--dim);padding-top:2px;}
    td > *:not(.botones){flex:1;min-width:0;text-align:right;}
    td .botones{flex:1;justify-content:flex-end;}
  }
</style>
</head>
<body>
  ${appShellAbrir('historial', { ancho: true })}
    ${pageHeader('Brief Agendado', 'Historial de Rayos X', 'Todas las citas Rayos X detectadas desde tu calendario, más recientes primero.')}
    <div class="toolbar">
      <input id="buscar" type="text" placeholder="Buscar por institución, representante o correo...">
      <div class="chips">
        <button class="chip activo" data-filtro="todos">Todos</button>
        <button class="chip" data-filtro="verde">🟢 Próximos</button>
        <button class="chip" data-filtro="rojo">🔴 Pasados</button>
      </div>
    </div>
    <div class="card">
      <table id="tabla">
        <thead>
          <tr>
            <th></th>
            <th>Reunión (CDMX)</th>
            <th>Institución</th>
            <th>Representante</th>
            <th>Para</th>
            <th>Research</th>
            <th>Envío</th>
            <th>Enviado el</th>
            <th>Resumen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody id="cuerpo"></tbody>
      </table>
      <div id="empty" style="display:none;">Sin citas todavía.</div>
    </div>
  ${APP_SHELL_CERRAR}
  ${footerHtml()}
  <script>
    const ICONO_LAPIZ = '${ICONOS.lapiz}';
    const ICONO_CONTACTO = '${ICONOS.contacto}';
    function fechaCDMX(iso) {
      if (!iso) return '—';
      const d = new Date(new Date(iso).getTime() - 6*60*60*1000);
      const pad = n => String(n).padStart(2,'0');
      return pad(d.getUTCDate()) + '/' + pad(d.getUTCMonth()+1) + '/' + d.getUTCFullYear() + ' ' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes());
    }
    function pill(status, mapa) {
      const info = mapa[status] || { clase: 'pend', texto: status };
      return '<span class="pill ' + info.clase + '">' + info.texto + '</span>';
    }
    const RESEARCH = { pendiente: {clase:'pend', texto:'pendiente'}, manual: {clase:'pend', texto:'sin generar'}, listo: {clase:'ok', texto:'listo'}, error: {clase:'err', texto:'error'} };
    const ENVIO = { pendiente: {clase:'pend', texto:'pendiente'}, enviado: {clase:'ok', texto:'enviado'}, error: {clase:'err', texto:'error'}, sin_dossier: {clase:'err', texto:'sin dossier'} };

    // 🟢 = cita futura, 🔴 = cita pasada — automático por fecha, salvo que el
    // usuario lo haya fijado a mano (estado_override).
    let filtroEstado = 'todos';
    function estadoDe(ev) {
      if (ev.estado_override === 'verde' || ev.estado_override === 'rojo') return ev.estado_override;
      return new Date(ev.start_utc).getTime() >= Date.now() ? 'verde' : 'rojo';
    }

    async function cargar() {
      const r = await fetch('/eventos?limit=300');
      const { eventos } = await r.json();
      window.__eventos = eventos;
      aplicarFiltros();
    }

    function aplicarFiltros() {
      const q = document.getElementById('buscar').value.toLowerCase();
      let lista = window.__eventos || [];
      if (filtroEstado !== 'todos') lista = lista.filter(ev => estadoDe(ev) === filtroEstado);
      if (q) {
        lista = lista.filter(ev =>
          [ev.institucion, ev.representante_nombre, ev.representante_correo, ev.destinatario_nombre, ev.destinatario_email, ev.summary]
            .filter(Boolean).some(v => v.toLowerCase().includes(q))
        );
      }
      pintar(lista);
    }

    // Nota: las filas se arman con appendChild/addEventListener (no con
    // onclick="fn(this,'...')" embebido en el HTML) a propósito — el
    // minificador de JS de Cloudflare en el dominio custom llega a corromper
    // comillas escapadas dentro de <script>, lo que rompía todo el bloque.
    function pintar(eventos) {
      const cuerpo = document.getElementById('cuerpo');
      const empty = document.getElementById('empty');
      cuerpo.innerHTML = '';
      if (!eventos.length) { empty.style.display = 'block'; return; }
      empty.style.display = 'none';
      for (const ev of eventos) {
        const tr = document.createElement('tr');
        const uidEnc = encodeURIComponent(ev.uid);

        // Primera celda: 🟢/🔴 clickeable para cambiarlo a mano
        const tdEstado = document.createElement('td');
        tdEstado.dataset.label = 'Estado';
        const btnEstado = document.createElement('button');
        btnEstado.className = 'btn-estado';
        const est = estadoDe(ev);
        btnEstado.textContent = est === 'verde' ? '🟢' : '🔴';
        btnEstado.title = est === 'verde' ? 'Próxima — clic para marcar como pasada' : 'Pasada — clic para marcar como próxima';
        btnEstado.addEventListener('click', () => cambiarEstado(btnEstado, ev));
        tdEstado.appendChild(btnEstado);
        tr.appendChild(tdEstado);

        const tdInfo = document.createElement('td');
        tdInfo.dataset.label = 'Reunión (CDMX)';
        tdInfo.innerHTML = fechaCDMX(ev.start_utc);
        tr.appendChild(tdInfo);

        const tdInst = document.createElement('td');
        tdInst.dataset.label = 'Institución';
        tdInst.textContent = ev.institucion || ev.summary || '—';
        tr.appendChild(tdInst);

        const tdRep = document.createElement('td');
        tdRep.dataset.label = 'Representante';
        tdRep.innerHTML = (ev.representante_nombre || '—') + '<div class="muted">' + (ev.representante_correo || '') + '</div>';
        if (ev.dossier_md || ev.institucion) {
          const lapiz = document.createElement('a');
          lapiz.className = 'btn-lapiz';
          lapiz.href = '/eventos/' + uidEnc + '/ver?editar=1';
          lapiz.target = '_blank';
          lapiz.title = 'Editar datos del prospecto';
          lapiz.innerHTML = ICONO_LAPIZ;
          tdRep.firstChild ? tdRep.insertBefore(lapiz, tdRep.querySelector('.muted')) : tdRep.appendChild(lapiz);
        }
        tr.appendChild(tdRep);

        const restoHtml =
          '<td data-label="Para">' + (ev.destinatario_nombre || '—') + '<div class="muted">' + (ev.destinatario_email || '') + '</div></td>' +
          '<td data-label="Research">' + pill(ev.research_status, RESEARCH) + '</td>' +
          '<td data-label="Envío">' + pill(ev.email_status, ENVIO) + '</td>' +
          '<td data-label="Enviado el">' + fechaCDMX(ev.enviado_en) + '</td>';
        const tmp = document.createElement('template');
        tmp.innerHTML = restoHtml;
        tr.append(...tmp.content.children);

        const tdResumen = document.createElement('td');
        tdResumen.dataset.label = 'Resumen';
        if (ev.dossier_md) {
          const contenedor = document.createElement('div');
          contenedor.className = 'botones';
          const verA = document.createElement('a');
          verA.className = 'dl'; verA.target = '_blank'; verA.href = '/eventos/' + uidEnc + '/ver'; verA.textContent = 'Ver';
          const dlA = document.createElement('a');
          dlA.className = 'dl'; dlA.href = '/eventos/' + uidEnc + '/dossier'; dlA.textContent = '.md';
          const pdfA = document.createElement('a');
          pdfA.className = 'dl pdf'; pdfA.target = '_blank'; pdfA.href = '/eventos/' + uidEnc + '/ver?descargar=pdf'; pdfA.textContent = 'PDF';
          contenedor.append(verA, dlA, pdfA);
          tdResumen.appendChild(contenedor);
        } else if (ev.research_status === 'manual' || ev.research_status === 'error') {
          const btn = document.createElement('button');
          btn.className = 'btn-enviar';
          btn.textContent = 'Generar brief';
          btn.addEventListener('click', () => generarBrief(btn, ev.uid));
          tdResumen.appendChild(btn);
        } else {
          tdResumen.innerHTML = '<span class="dl disabled">—</span>';
        }
        tr.appendChild(tdResumen);

        const tdAcciones = document.createElement('td');
        tdAcciones.dataset.label = 'Acciones';
        const accionesWrap = document.createElement('div');
        accionesWrap.className = 'botones';
        const btnEnviar = document.createElement('button');
        btnEnviar.className = ev.email_status === 'enviado' ? 'btn-enviar enviado' : 'btn-enviar';
        btnEnviar.textContent = ev.email_status === 'enviado' ? 'Reenviar correo' : 'Mandar correo';
        btnEnviar.addEventListener('click', () => mandarCorreo(btnEnviar, ev.uid));
        accionesWrap.appendChild(btnEnviar);
        // Descargar la ficha de contacto (.vcf) — lista para guardar en el
        // teléfono (iPhone/Android), con web, WhatsApp, CRM y link al brief.
        if (ev.representante_nombre || ev.representante_telefono || ev.representante_correo || ev.institucion) {
          const vcfA = document.createElement('a');
          vcfA.className = 'dl vcf';
          vcfA.href = '/eventos/' + uidEnc + '/vcard';
          vcfA.title = 'Descargar contacto (vCard)';
          vcfA.innerHTML = ICONO_CONTACTO + ' Contacto';
          accionesWrap.appendChild(vcfA);
        }
        tdAcciones.appendChild(accionesWrap);
        tr.appendChild(tdAcciones);

        cuerpo.appendChild(tr);
      }
    }

    async function mandarCorreo(btn, uid) {
      const destino = (window.__eventos || []).find(e => e.uid === uid);
      const correo = destino ? destino.destinatario_email : '';
      if (!confirm('¿Mandar el brief de esta cita ahora mismo a ' + correo + '?')) return;
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = 'Enviando...';
      try {
        const r = await fetch('/eventos/' + encodeURIComponent(uid) + '/enviar', { method: 'POST' });
        const data = await r.json();
        if (data.ok) {
          btn.textContent = '✓ Enviado';
          btn.classList.add('enviado');
          await cargar();
        } else {
          alert('No se pudo enviar: ' + (data.error || 'error desconocido'));
          btn.textContent = original;
        }
      } catch (e) {
        alert('Error de red al enviar.');
        btn.textContent = original;
      } finally {
        btn.disabled = false;
      }
    }

    async function generarBrief(btn, uid) {
      btn.disabled = true;
      const original = btn.textContent;
      btn.textContent = 'Investigando...';
      try {
        const r = await fetch('/eventos/' + encodeURIComponent(uid) + '/investigar', { method: 'POST' });
        const data = await r.json();
        if (data.ok) {
          await cargar();
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

    async function cambiarEstado(btn, ev) {
      const nuevo = estadoDe(ev) === 'verde' ? 'rojo' : 'verde';
      btn.disabled = true;
      try {
        const r = await fetch('/eventos/' + encodeURIComponent(ev.uid) + '/estado', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: nuevo }),
        });
        const data = await r.json();
        if (data.ok) {
          ev.estado_override = nuevo;
          aplicarFiltros();
        } else {
          alert('No se pudo cambiar el estado: ' + (data.error || 'error desconocido'));
        }
      } catch (e) {
        alert('Error de red al cambiar el estado.');
      } finally {
        btn.disabled = false;
      }
    }

    document.getElementById('buscar').addEventListener('input', aplicarFiltros);

    document.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        filtroEstado = chip.dataset.filtro;
        document.querySelectorAll('.chip').forEach(c => c.classList.toggle('activo', c === chip));
        aplicarFiltros();
      });
    });

    cargar();
  </script>
</body>
</html>`;
}
