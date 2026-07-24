// RLR
export function paginaDashboard(): string {
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Brief Agendado — Dashboard</title>
  <style>
    :root{color-scheme:light;}
    body{margin:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#2b3646;}
    header{background:#1a2b4c;color:#fff;padding:20px 28px;}
    header h1{margin:0;font-size:18px;}
    header p{margin:4px 0 0;font-size:13px;color:#b7c0d8;}
    .wrap{max-width:1200px;margin:24px auto;padding:0 20px;}
    .toolbar{display:flex;gap:12px;align-items:center;margin-bottom:14px;flex-wrap:wrap;}
    .toolbar input{padding:8px 12px;border:1px solid #dde1e7;border-radius:8px;font-size:13px;min-width:220px;}
    .toolbar a.btn{padding:8px 14px;border-radius:8px;background:#3457d5;color:#fff;text-decoration:none;font-size:13px;font-weight:600;}
    .card{background:#fff;border-radius:12px;overflow:auto;}
    table{width:100%;border-collapse:collapse;font-size:13px;}
    th{text-align:left;padding:10px 12px;background:#f8f9fb;color:#5b6472;font-weight:600;border-bottom:1px solid #eef0f3;white-space:nowrap;}
    td{padding:10px 12px;border-bottom:1px solid #f2f3f5;vertical-align:top;}
    tr:hover td{background:#fafbfd;}
    .pill{display:inline-block;padding:2px 9px;border-radius:999px;font-size:11.5px;font-weight:600;}
    .pill.ok{background:#e6f4ea;color:#1e7e34;}
    .pill.pend{background:#fff4e0;color:#a86400;}
    .pill.err{background:#fdecea;color:#c0392b;}
    .dl{color:#3457d5;text-decoration:none;font-weight:600;}
    .dl.disabled{color:#c3c8d1;pointer-events:none;}
    .muted{color:#9aa2b1;font-size:12px;}
    #empty{padding:40px;text-align:center;color:#9aa2b1;}
  </style>
</head>
<body>
  <header>
    <h1>Brief Agendado — Dashboard</h1>
    <p>Histórico de citas Rayos X: research, destinatario y estado de envío. <a href="/conectar" style="color:#fff;">Conectar mi calendario →</a></p>
  </header>
  <div class="wrap">
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
    const RESEARCH = { pendiente: {clase:'pend', texto:'pendiente'}, listo: {clase:'ok', texto:'listo'}, error: {clase:'err', texto:'error'} };
    const ENVIO = { pendiente: {clase:'pend', texto:'pendiente'}, enviado: {clase:'ok', texto:'enviado'}, error: {clase:'err', texto:'error'} };

    async function cargar() {
      const r = await fetch('/eventos?limit=300');
      const { eventos } = await r.json();
      window.__eventos = eventos;
      pintar(eventos);
    }

    function pintar(eventos) {
      const cuerpo = document.getElementById('cuerpo');
      const empty = document.getElementById('empty');
      cuerpo.innerHTML = '';
      if (!eventos.length) { empty.style.display = 'block'; return; }
      empty.style.display = 'none';
      for (const ev of eventos) {
        const tr = document.createElement('tr');
        const descarga = ev.dossier_md
          ? '<a class="dl" href="/eventos/' + encodeURIComponent(ev.uid) + '/dossier">Descargar .md</a>'
          : '<span class="dl disabled">—</span>';
        tr.innerHTML =
          '<td>' + fechaCDMX(ev.start_utc) + '</td>' +
          '<td>' + (ev.institucion || ev.summary || '—') + '</td>' +
          '<td>' + (ev.representante_nombre || '—') + '<div class="muted">' + (ev.representante_correo || '') + '</div></td>' +
          '<td>' + (ev.destinatario_nombre || '—') + '<div class="muted">' + (ev.destinatario_email || '') + '</div></td>' +
          '<td>' + pill(ev.research_status, RESEARCH) + '</td>' +
          '<td>' + pill(ev.email_status, ENVIO) + '</td>' +
          '<td>' + fechaCDMX(ev.enviado_en) + '</td>' +
          '<td>' + descarga + '</td>';
        cuerpo.appendChild(tr);
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
