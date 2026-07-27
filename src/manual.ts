// RLR
import { ESTILOS_SUPERLEADS, headAbiertoHtml, heroHeader } from './branding';

export function paginaManual(): string {
  return `<!doctype html>
<html lang="es">
${headAbiertoHtml('Generar brief manual — Brief Agendado')}
<style>
  ${ESTILOS_SUPERLEADS}
  .card{background:#fff;border:.5px solid var(--border);border-radius:12px;padding:28px 26px;}
  .card h2{margin:0 0 4px;font-size:15px;font-weight:800;color:var(--navy);}
  .card .sub{margin:0 0 20px;font-size:12.5px;color:var(--muted);line-height:1.6;}
  label{display:block;font-size:12.5px;font-weight:700;color:var(--navy);margin:16px 0 6px;}
  label:first-of-type{margin-top:0;}
  label small{display:block;font-weight:400;color:var(--muted);font-size:11.5px;margin-top:3px;line-height:1.5;}
  textarea{width:100%;min-height:260px;padding:12px 14px;border:.5px solid var(--border);border-radius:8px;font-size:13px;font-family:inherit;background:var(--blue-soft);resize:vertical;line-height:1.6;}
  textarea:focus{outline:none;border-color:var(--blue);background:#fff;}
  input{width:100%;padding:11px 13px;border:.5px solid var(--border);border-radius:8px;font-size:13.5px;font-family:inherit;background:var(--blue-soft);}
  input:focus{outline:none;border-color:var(--blue);background:#fff;}
  button{margin-top:24px;width:100%;display:inline-flex;align-items:center;justify-content:center;gap:8px;background:var(--green);color:var(--navy);padding:14px 26px;border-radius:8px;font-size:14.5px;font-weight:700;border:none;cursor:pointer;transition:transform .2s var(--ease),box-shadow .2s;}
  button:hover{transform:translateY(-2px);box-shadow:0 10px 28px rgba(86,239,159,.28);}
  button:disabled{opacity:.6;cursor:default;transform:none;box-shadow:none;}
  #estado{margin-top:14px;font-size:13.5px;font-weight:600;text-align:center;}
  #progresoWrap{display:none;margin-top:18px;}
  #progresoBarra-fondo{height:10px;background:#e0e8f8;border-radius:999px;overflow:hidden;}
  #progresoBarra{height:100%;width:0%;background:linear-gradient(90deg,#0039C8,#56EF9F);border-radius:999px;transition:width .5s ease;}
  #progresoTexto{margin-top:8px;font-size:13px;font-weight:600;color:var(--navy);text-align:center;}
</style>
</head>
<body>
  ${heroHeader({
    eyebrow: 'Brief Agendado',
    titulo: 'Generar brief manual',
    subtitulo: 'Pega aquí los datos del prospecto tal cual vienen en la descripción del calendario (o corregidos) y se genera el brief al momento — útil cuando alguien capturó algo mal y hay que rehacerlo.',
    volverHref: '/',
  })}
  <div class="wrap">
    <div class="card">
      <h2>Datos del prospecto</h2>
      <p class="sub">Copia y pega toda la descripción de la cita (institución, web, nombre, teléfono, correo...). Entre más completo, mejor sale la investigación.</p>
      <label>Texto con los datos
        <textarea id="texto" placeholder="Institución educativa&#10;COLEGIO EJEMPLO&#10;Web: https://www.colegioejemplo.edu.mx&#10;&#10;Representante de la institución&#10;Nombre: María Pérez&#10;Teléfono: 999 000 0000&#10;Correo: admisiones@colegioejemplo.edu.mx&#10;..."></textarea>
      </label>
      <label>Mandar el brief a (correo)
        <small>A quién le llega este brief. Si lo dejas vacío, va a Ricardo@SuperLeads.mx.</small>
        <input type="email" id="correo" placeholder="Ricardo@SuperLeads.mx">
      </label>
      <button id="btnGenerar">Generar brief</button>
      <div id="progresoWrap">
        <div id="progresoBarra-fondo"><div id="progresoBarra"></div></div>
        <div id="progresoTexto"></div>
      </div>
      <div id="estado"></div>
    </div>
  </div>
  <script>
    let progresoTimer = null;
    function iniciarProgreso() {
      const wrap = document.getElementById('progresoWrap');
      const barra = document.getElementById('progresoBarra');
      const texto = document.getElementById('progresoTexto');
      wrap.style.display = 'block';
      let pct = 0;
      const etapas = [
        [0, 'Leyendo los datos del prospecto...'],
        [15, 'Buscando información en internet...'],
        [45, 'Analizando resultados y cruzando con el ICP...'],
        [72, 'Redactando el brief...'],
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
      if (ok) { barra.style.width = '100%'; texto.style.color = '#2BC878'; }
      else { barra.style.background = '#c0392b'; texto.style.color = '#c0392b'; }
      texto.textContent = mensaje;
    }

    document.getElementById('btnGenerar').addEventListener('click', async () => {
      const btn = document.getElementById('btnGenerar');
      const texto = document.getElementById('texto').value.trim();
      const correo = document.getElementById('correo').value.trim();
      const estado = document.getElementById('estado');
      if (texto.length < 20) {
        estado.style.color = '#c0392b';
        estado.textContent = 'Pega los datos del prospecto primero.';
        return;
      }
      btn.disabled = true;
      estado.textContent = '';
      iniciarProgreso();
      try {
        const r = await fetch('/manual', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texto: texto, correo: correo }),
        });
        const data = await r.json();
        if (data.ok && data.uid) {
          terminarProgreso(true, '✓ ¡Brief listo! Abriéndolo...');
          setTimeout(() => { window.location.href = '/eventos/' + encodeURIComponent(data.uid) + '/ver'; }, 900);
        } else {
          terminarProgreso(false, '✗ ' + (data.error || 'No se pudo generar el brief.'));
          btn.disabled = false;
        }
      } catch (e) {
        terminarProgreso(false, '✗ Error de red al generar.');
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
}
