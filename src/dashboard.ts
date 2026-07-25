// RLR
import { headAbiertoHtml, heroHeader, ESTILOS_SUPERLEADS } from './branding';

export function paginaDashboard(): string {
  return `<!doctype html>
<html lang="es">
${headAbiertoHtml('Brief Agendado — Dashboard')}
<style>
  ${ESTILOS_SUPERLEADS}

  .toolbar{display:flex;gap:12px;align-items:center;margin-bottom:16px;flex-wrap:wrap;}
  .toolbar input{padding:10px 14px;border:.5px solid var(--border);border-radius:8px;font-size:13.5px;font-family:inherit;min-width:260px;background:#fff;}
  .toolbar input:focus{outline:none;border-color:var(--blue);}
  .toolbar a.btn{padding:10px 16px;border-radius:8px;background:var(--navy);color:#fff;text-decoration:none;font-size:13px;font-weight:700;}
  .toolbar a.btn:hover{background:var(--navy-mid);}

  .card{background:#fff;border:.5px solid var(--border);border-radius:12px;overflow:auto;}
  table{width:100%;border-collapse:collapse;font-size:13px;}
  th{text-align:left;padding:12px 14px;background:var(--blue-softer);color:var(--navy);font-weight:700;border-bottom:.5px solid var(--border);white-space:nowrap;font-size:11.5px;text-transform:uppercase;letter-spacing:.3px;}
  td{padding:12px 14px;border-bottom:.5px solid var(--border);vertical-align:top;color:#2b3646;}
  tr:hover td{background:var(--blue-soft);}

  .pill{display:inline-block;padding:3px 10px;border-radius:999px;font-size:11.5px;font-weight:700;}
  .pill.ok{background:rgba(86,239,159,.15);color:var(--green-d);}
  .pill.pend{background:#fff4e0;color:#a86400;}
  .pill.err{background:#fdecea;color:#c0392b;}

  .dl{color:var(--blue);text-decoration:none;font-weight:700;margin-right:10px;}
  .dl:hover{text-decoration:underline;}
  .dl.disabled{color:#c3c8d1;pointer-events:none;}
  .acciones{white-space:nowrap;}
  .btn-enviar{border:none;background:none;color:var(--blue);font-weight:700;font-size:13px;cursor:pointer;padding:0;font-family:inherit;}
  .btn-enviar:hover{text-decoration:underline;}
  .btn-enviar:disabled{color:#c3c8d1;cursor:default;}
  .btn-enviar.enviado{color:var(--green-d);}
  .muted{color:var(--dim);font-size:12px;}
  #empty{padding:48px;text-align:center;color:var(--dim);font-size:13.5px;}
</style>
</head>
<body>
  ${heroHeader({
    eyebrow: 'Brief Agendado',
    titulo: 'Dashboard',
    subtitulo: 'Histórico de citas Rayos X: research, destinatario y estado de envío. <a href="/conectar">Conectar mi calendario →</a>',
    ancho: true,
  })}
  <div class="wrap ancho">
    <div class="toolbar">
      <input id="buscar" type="text" placeholder="Buscar por institución, representante o correo...">
      <a class="btn" href="/eventos?limit=500" target="_blank">Ver JSON crudo</a>
    </div>
    <div class="card">
      <table id="tabla">
        <thead>
          <tr>
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
  </div>
  <script>
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
    const ENVIO = { pendiente: {clase:'pend', texto:'pendiente'}, enviado: {clase:'ok', texto:'enviado'}, error: {clase:'err', texto:'error'} };

    async function cargar() {
      const r = await fetch('/eventos?limit=300');
      const { eventos } = await r.json();
      window.__eventos = eventos;
      pintar(eventos);
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

        tr.innerHTML =
          '<td>' + fechaCDMX(ev.start_utc) + '</td>' +
          '<td>' + (ev.institucion || ev.summary || '—') + '</td>' +
          '<td>' + (ev.representante_nombre || '—') + '<div class="muted">' + (ev.representante_correo || '') + '</div></td>' +
          '<td>' + (ev.destinatario_nombre || '—') + '<div class="muted">' + (ev.destinatario_email || '') + '</div></td>' +
          '<td>' + pill(ev.research_status, RESEARCH) + '</td>' +
          '<td>' + pill(ev.email_status, ENVIO) + '</td>' +
          '<td>' + fechaCDMX(ev.enviado_en) + '</td>';

        const tdResumen = document.createElement('td');
        if (ev.dossier_md) {
          const verA = document.createElement('a');
          verA.className = 'dl'; verA.target = '_blank'; verA.href = '/eventos/' + uidEnc + '/ver'; verA.textContent = 'Ver';
          const dlA = document.createElement('a');
          dlA.className = 'dl'; dlA.href = '/eventos/' + uidEnc + '/dossier'; dlA.textContent = 'Descargar .md';
          tdResumen.append(verA, dlA);
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
        tdAcciones.className = 'acciones';
        const btnEnviar = document.createElement('button');
        btnEnviar.className = ev.email_status === 'enviado' ? 'btn-enviar enviado' : 'btn-enviar';
        btnEnviar.textContent = ev.email_status === 'enviado' ? 'Reenviar correo' : 'Mandar correo';
        btnEnviar.addEventListener('click', () => mandarCorreo(btnEnviar, ev.uid));
        tdAcciones.appendChild(btnEnviar);
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

    document.getElementById('buscar').addEventListener('input', e => {
      const q = e.target.value.toLowerCase();
      const filtrados = (window.__eventos || []).filter(ev =>
        [ev.institucion, ev.representante_nombre, ev.representante_correo, ev.destinatario_nombre, ev.destinatario_email, ev.summary]
          .filter(Boolean).some(v => v.toLowerCase().includes(q))
      );
      pintar(filtrados);
    });

    cargar();
  </script>
</body>
</html>`;
}
