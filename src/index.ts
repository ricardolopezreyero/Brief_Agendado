// RLR
import type { Env } from './types';
import { pollCalendario, enviarBriefsDelDia } from './scheduled';
import { listEventos, getEvento, getLogs, insertLog, insertColaborador, listColaboradores, marcarEnviado, marcarErrorEnvio } from './db';
import { paginaDashboard } from './dashboard';
import { paginaVerDossier } from './viewer';
import { enviarBrief } from './email';

// Ricardo López Reyero
const _k = 'EYE', _rev = 181218;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}

function html(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function formularioConectar(mensaje?: { tipo: 'ok' | 'error'; texto: string }): string {
  const aviso = mensaje
    ? `<p style="margin:0 0 20px;padding:12px 16px;border-radius:8px;font-size:14px;background:${mensaje.tipo === 'ok' ? '#e6f4ea' : '#fdecea'};color:${mensaje.tipo === 'ok' ? '#1e7e34' : '#c0392b'};">${mensaje.texto}</p>`
    : '';
  return `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Conectar calendario — Brief Agendado</title>
  <style>
    body{margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;}
    .card{max-width:480px;margin:48px auto;background:#fff;border-radius:12px;padding:32px;}
    h1{font-size:20px;color:#1a2b4c;margin:0 0 6px;}
    p.sub{font-size:14px;color:#5b6472;margin:0 0 24px;}
    label{display:block;font-size:13px;color:#2b3646;margin:16px 0 6px;font-weight:600;}
    input{width:100%;box-sizing:border-box;padding:10px 12px;border:1px solid #dde1e7;border-radius:8px;font-size:14px;}
    small{display:block;color:#9aa2b1;font-size:12px;margin-top:4px;}
    button{margin-top:24px;width:100%;padding:12px;border:none;border-radius:8px;background:#3457d5;color:#fff;font-size:15px;font-weight:600;cursor:pointer;}
  </style>
</head>
<body>
  <div class="card">
    <h1>Conecta tu calendario a Brief Agendado</h1>
    <p class="sub">Solo para comerciales SuperLeads. Cualquier cita en tu calendario cuyo título contenga <strong>"Rayos X"</strong> disparará una investigación automática del prospecto y te llegará un brief por correo el día de la reunión, a las 9am.</p>
    ${aviso}
    <form method="POST" action="/colaboradores">
      <label>Tu nombre</label>
      <input type="text" name="nombre" required>
      <label>Tu correo (aquí te llegarán los briefs)</label>
      <input type="email" name="correo" required>
      <label>URL del feed .ics privado de tu calendario
        <small>Google Calendar → Configuración de tu calendario → "Integrar calendario" → copia la URL privada en formato iCal (basic.ics)</small>
      </label>
      <input type="url" name="ics_url" required placeholder="https://calendar.google.com/calendar/ical/.../private-.../basic.ics">
      <label>Código de acceso</label>
      <input type="text" name="code" required>
      <button type="submit">Conectar calendario</button>
    </form>
  </div>
</body>
</html>`;
}

async function parseCuerpo(request: Request): Promise<Record<string, string>> {
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('application/json')) {
    return await request.json();
  }
  const form = await request.formData();
  const out: Record<string, string> = {};
  for (const [k, v] of form.entries()) out[k] = String(v);
  return out;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const { method, pathname } = { method: request.method, pathname: url.pathname };

    try {
      if (method === 'GET' && pathname === '/') {
        return html(paginaDashboard());
      }

      if (method === 'GET' && pathname === '/conectar') {
        return html(formularioConectar());
      }

      if (method === 'GET' && pathname.startsWith('/eventos/') && pathname.endsWith('/dossier')) {
        const uid = decodeURIComponent(pathname.slice('/eventos/'.length, -'/dossier'.length));
        const evento = await getEvento(env.DB, uid);
        if (!evento) return json({ error: 'No encontrado' }, 404);
        if (!evento.dossier_md) return json({ error: 'Este evento todavía no tiene dossier' }, 404);

        const nombreArchivo = `dossier-${(evento.institucion || evento.summary || evento.uid).replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
        return new Response(evento.dossier_md, {
          headers: {
            'Content-Type': 'text/markdown; charset=utf-8',
            'Content-Disposition': `attachment; filename="${nombreArchivo}"`,
          },
        });
      }

      if (method === 'GET' && pathname.startsWith('/eventos/') && pathname.endsWith('/ver')) {
        const uid = decodeURIComponent(pathname.slice('/eventos/'.length, -'/ver'.length));
        const evento = await getEvento(env.DB, uid);
        if (!evento) return html('<p>No encontrado.</p>', 404);
        return html(paginaVerDossier(evento));
      }

      if (method === 'POST' && pathname.startsWith('/eventos/') && pathname.endsWith('/enviar')) {
        const uid = decodeURIComponent(pathname.slice('/eventos/'.length, -'/enviar'.length));
        const evento = await getEvento(env.DB, uid);
        if (!evento) return json({ ok: false, error: 'No encontrado' }, 404);

        const resultado = await enviarBrief(env, evento);
        if (resultado.ok) {
          await marcarEnviado(env.DB, uid);
          await insertLog(env.DB, 'INFO', '✓ Brief enviado manualmente desde el dashboard', uid);
          return json({ ok: true });
        }
        await marcarErrorEnvio(env.DB, uid, resultado.error ?? 'error desconocido');
        await insertLog(env.DB, 'ERROR', `✗ Falló envío manual: ${resultado.error}`, uid);
        return json({ ok: false, error: resultado.error ?? 'Error desconocido al enviar' }, 500);
      }

      if (method === 'POST' && pathname === '/colaboradores') {
        const body = await parseCuerpo(request);
        if (body.code !== env.CONNECT_CODE) {
          return html(formularioConectar({ tipo: 'error', texto: 'Código de acceso incorrecto.' }), 403);
        }
        if (!body.nombre || !body.correo || !body.ics_url) {
          return html(formularioConectar({ tipo: 'error', texto: 'Faltan campos.' }), 400);
        }
        try {
          const prueba = await fetch(body.ics_url);
          const texto = prueba.ok ? await prueba.text() : '';
          if (!prueba.ok || !texto.startsWith('BEGIN:VCALENDAR')) {
            return html(formularioConectar({ tipo: 'error', texto: 'Esa URL no parece ser un feed .ics válido. Revisa que sea la URL privada en formato iCal.' }), 400);
          }
        } catch {
          return html(formularioConectar({ tipo: 'error', texto: 'No se pudo acceder a esa URL. Revisa que esté completa y sea pública/privada tipo .ics.' }), 400);
        }

        await insertColaborador(env.DB, { nombre: body.nombre, correo: body.correo, icsUrl: body.ics_url });
        await insertLog(env.DB, 'INFO', `▶ Nuevo colaborador conectado: ${body.nombre} <${body.correo}>`);
        return html(formularioConectar({ tipo: 'ok', texto: `Listo, ${body.nombre}. Tu calendario ya está conectado.` }));
      }

      if (method === 'GET' && pathname === '/colaboradores') {
        return json({ colaboradores: await listColaboradores(env.DB) });
      }

      if (method === 'GET' && pathname === '/eventos') {
        const limit = Number(url.searchParams.get('limit') ?? '50');
        return json({ eventos: await listEventos(env.DB, limit) });
      }

      if (method === 'GET' && pathname === '/logs') {
        const lines = Number(url.searchParams.get('lines') ?? '80');
        return json({ logs: await getLogs(env.DB, lines) });
      }

      // Disparo manual para probar sin esperar al cron
      if (method === 'POST' && pathname === '/probar-poll') {
        await insertLog(env.DB, 'INFO', '▶ Poll manual disparado');
        await pollCalendario(env);
        return json({ ok: true });
      }

      if (method === 'POST' && pathname === '/probar-envio') {
        await insertLog(env.DB, 'INFO', '▶ Envío manual disparado');
        await enviarBriefsDelDia(env);
        return json({ ok: true });
      }

      return json({ error: 'No encontrado' }, 404);
    } catch (e: any) {
      await insertLog(env.DB, 'ERROR', `Error interno: ${e?.message ?? e}`).catch(() => {});
      return json({ error: e?.message ?? 'Error interno' }, 500);
    }
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    // Único cron cada 15 min: primero busca citas nuevas, luego revisa envíos del día.
    await pollCalendario(env);
    await enviarBriefsDelDia(env);
  },
};
