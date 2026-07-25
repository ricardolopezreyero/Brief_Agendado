// RLR
import type { Env } from './types';
import { pollCalendario, enviarBriefsDelDia, descubrirExistentes, investigarEvento } from './scheduled';
import {
  listEventos, getEvento, getLogs, insertLog, insertColaborador, listColaboradores,
  marcarEnviado, marcarErrorEnvio, marcarErrorResearch,
} from './db';
import { paginaDashboard } from './dashboard';
import { paginaVerDossier } from './viewer';
import { paginaConectar, paginaConectado } from './conectar';
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

function extraerUid(pathname: string, sufijo: string): string {
  return decodeURIComponent(pathname.slice('/eventos/'.length, -sufijo.length));
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
        return html(paginaConectar());
      }

      if (method === 'GET' && pathname.startsWith('/eventos/') && pathname.endsWith('/dossier')) {
        const uid = extraerUid(pathname, '/dossier');
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
        const uid = extraerUid(pathname, '/ver');
        const evento = await getEvento(env.DB, uid);
        if (!evento) return html('<p>No encontrado.</p>', 404);
        return html(paginaVerDossier(evento));
      }

      if (method === 'POST' && pathname.startsWith('/eventos/') && pathname.endsWith('/enviar')) {
        const uid = extraerUid(pathname, '/enviar');
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

      // Dispara la investigación de una cita que quedó en estado 'manual'
      // (ya agendada al momento de conectar el calendario) o que falló antes.
      if (method === 'POST' && pathname.startsWith('/eventos/') && pathname.endsWith('/investigar')) {
        const uid = extraerUid(pathname, '/investigar');
        const evento = await getEvento(env.DB, uid);
        if (!evento) return json({ ok: false, error: 'No encontrado' }, 404);

        try {
          await investigarEvento(env, evento.uid, evento.summary, evento.raw_description);
          await insertLog(env.DB, 'INFO', '✓ Dossier generado manualmente', uid);
          return json({ ok: true });
        } catch (e: any) {
          const error = e?.message ?? String(e);
          await marcarErrorResearch(env.DB, uid, error);
          await insertLog(env.DB, 'ERROR', `✗ Falló research manual: ${error}`, uid);
          return json({ ok: false, error }, 500);
        }
      }

      if (method === 'POST' && pathname === '/colaboradores') {
        const body = await parseCuerpo(request);
        if (body.code !== env.CONNECT_CODE) {
          return html(paginaConectar({ tipo: 'error', texto: 'Código de acceso incorrecto.' }), 403);
        }
        if (!body.nombre || !body.correo || !body.ics_url) {
          return html(paginaConectar({ tipo: 'error', texto: 'Faltan campos.' }), 400);
        }
        try {
          const prueba = await fetch(body.ics_url);
          const texto = prueba.ok ? await prueba.text() : '';
          if (!prueba.ok || !texto.startsWith('BEGIN:VCALENDAR')) {
            return html(paginaConectar({ tipo: 'error', texto: 'Esa URL no parece ser un feed .ics válido. Revisa que sea la dirección SECRETA en formato iCal (no la pública).' }), 400);
          }
        } catch {
          return html(paginaConectar({ tipo: 'error', texto: 'No se pudo acceder a esa URL. Revisa que esté completa y sea del feed .ics.' }), 400);
        }

        const colaboradorId = await insertColaborador(env.DB, { nombre: body.nombre, correo: body.correo, icsUrl: body.ics_url });
        await insertLog(env.DB, 'INFO', `▶ Nuevo colaborador conectado: ${body.nombre} <${body.correo}>`);

        // Citas "Rayos X" que ya existían en su calendario: se guardan pero NO
        // se investigan solas — de ahí en adelante sí, vía pollCalendario.
        let backlog: Awaited<ReturnType<typeof descubrirExistentes>> = [];
        try {
          backlog = await descubrirExistentes(env, { colaboradorId, nombre: body.nombre, correo: body.correo, icsUrl: body.ics_url });
          if (backlog.length) {
            await insertLog(env.DB, 'INFO', `${backlog.length} cita(s) Rayos X ya agendada(s) encontrada(s) para ${body.nombre}, quedan para generar manualmente`);
          }
        } catch (e: any) {
          await insertLog(env.DB, 'WARNING', `No se pudo revisar el backlog de citas de ${body.nombre}: ${e?.message ?? e}`);
        }

        return html(paginaConectado(body.nombre, backlog));
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
