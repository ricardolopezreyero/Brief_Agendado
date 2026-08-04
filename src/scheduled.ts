// RLR
import type { Env, EventoRecord, FuenteCalendario } from './types';
import { fetchCalendario } from './ics';
import { extraerProspecto } from './extract';
import { ejecutarResearch } from './research';
import { enviarBrief } from './email';
import {
  insertLog, eventoExiste, eventoConResearchFallido, insertEventoBase, guardarProspecto, guardarDossier,
  marcarErrorResearch, marcarEnviado, marcarErrorEnvio, eventosParaEnviarHoy,
  listColaboradoresActivos, eventosManualesDeColaborador,
} from './db';

const HORIZONTE_DIAS = 60; // ignora eventos a más de 60 días, evita procesar un calendario histórico enorme en el primer poll
const PALABRA_CLAVE = 'rayos x'; // solo eventos cuyo título contenga esto activan la investigación
// Cada research consume ~14 subrequests (extracción + fetch del home para redes
// sociales + hasta 8 queries a Brave [6 de DeepSeek + 2 fijas: seguidores y
// reseñas] + 2 mediciones de posicionamiento + 1 búsqueda de fotos +
// redacción). El plan gratuito de Cloudflare limita 50 subrequests por
// invocación, así que se topa cuántos eventos se investigan por corrida del
// cron (3×14=42 < 50) — el resto queda pendiente para la siguiente (cada 15
// min), no se pierde nada.
const MAX_RESEARCH_POR_CORRIDA = 3;

async function fuentesDeCalendario(env: Env): Promise<FuenteCalendario[]> {
  const fuentes: FuenteCalendario[] = [
    { colaboradorId: null, nombre: 'Ricardo López Reyero', correo: 'Ricardo@SuperLeads.mx', icsUrl: env.CALENDAR_ICS_URL },
  ];
  const colaboradores = await listColaboradoresActivos(env.DB);
  for (const c of colaboradores) {
    fuentes.push({ colaboradorId: c.id, nombre: c.nombre, correo: c.correo, icsUrl: c.ics_url });
  }
  return fuentes;
}

export async function investigarEvento(env: Env, uid: string, summary: string, descripcion: string): Promise<void> {
  const prospecto = await extraerProspecto(env.DEEPSEEK_API_KEY, summary, descripcion);
  await guardarProspecto(env.DB, uid, prospecto);

  const dossier = await ejecutarResearch(env.DEEPSEEK_API_KEY, env.BRAVE_API_KEY, prospecto);
  await guardarDossier(env.DB, uid, dossier);
}

// Regenera el dossier usando los datos YA guardados del prospecto (p.ej.
// después de que el usuario los corrigió a mano) — a diferencia de
// investigarEvento, NO vuelve a extraer de la descripción, porque eso
// pisaría las correcciones. El dossier nuevo reemplaza al anterior.
export async function regenerarConDatosGuardados(env: Env, evento: EventoRecord): Promise<void> {
  const prospecto = {
    institucion: evento.institucion ?? '',
    web: evento.web ?? '',
    representante_nombre: evento.representante_nombre ?? '',
    representante_telefono: evento.representante_telefono ?? '',
    representante_correo: evento.representante_correo ?? '',
    representante_whatsapp: evento.representante_whatsapp ?? '',
    asesor_superleads: evento.asesor_superleads ?? '',
    zoom_link: evento.zoom_link ?? '',
    sl_comercial_link: evento.sl_comercial_link ?? '',
    fecha_hora_reunion: '',
  };
  const dossier = await ejecutarResearch(env.DEEPSEEK_API_KEY, env.BRAVE_API_KEY, prospecto);
  await guardarDossier(env.DB, evento.uid, dossier);
}

// Genera un brief desde texto pegado a mano (página /manual) — para cuando
// alguien capturó mal los datos en el calendario y hay que rehacer el brief
// con la información correcta, sin esperar a ninguna cita.
export async function generarBriefManual(env: Env, texto: string, destinatario: { email: string; nombre: string }): Promise<string> {
  const uid = `manual-${Date.now()}`;
  const prospecto = await extraerProspecto(env.DEEPSEEK_API_KEY, 'Brief manual | Rayos X', texto);

  // Si el texto trae la fecha de la reunión, se usa (hora CDMX → UTC con
  // offset fijo -6); si no, se fecha al momento de generarlo.
  let startUtc = new Date().toISOString();
  const m = prospecto.fecha_hora_reunion.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (m) {
    startUtc = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4] + 6, +m[5])).toISOString();
  }

  const summary = `${prospecto.institucion || prospecto.representante_nombre || 'Prospecto'} | Rayos X (manual)`;
  await insertEventoBase(env.DB, { uid, summary, startUtc, descriptionRaw: texto }, { email: destinatario.email, nombre: destinatario.nombre, colaboradorId: null });
  await guardarProspecto(env.DB, uid, prospecto);
  await insertLog(env.DB, 'INFO', `▶ Brief manual solicitado: ${summary}`, uid);

  const dossier = await ejecutarResearch(env.DEEPSEEK_API_KEY, env.BRAVE_API_KEY, prospecto);
  await guardarDossier(env.DB, uid, dossier);
  await insertLog(env.DB, 'INFO', '✓ Dossier manual listo', uid);
  return uid;
}

// Se corre una sola vez, justo al conectar un colaborador: guarda (sin
// investigar) las citas "Rayos X" que ya estaban agendadas en su calendario,
// para que las dispare manualmente desde /conectar o el dashboard. De ahí en
// adelante, pollCalendario() se encarga solo de las citas nuevas.
export async function descubrirExistentes(env: Env, fuente: FuenteCalendario): Promise<EventoRecord[]> {
  const ahora = Date.now();
  const limite = ahora + HORIZONTE_DIAS * 24 * 60 * 60 * 1000;

  const eventos = await fetchCalendario(fuente.icsUrl);
  const relevantes = eventos.filter(ev => {
    const t = new Date(ev.startUtc).getTime();
    const enRango = Number.isFinite(t) && t >= ahora && t <= limite;
    return enRango && ev.summary.toLowerCase().includes(PALABRA_CLAVE);
  });

  for (const ev of relevantes) {
    if (await eventoExiste(env.DB, ev.uid)) continue;
    await insertEventoBase(env.DB, ev, { email: fuente.correo, nombre: fuente.nombre, colaboradorId: fuente.colaboradorId }, 'manual');
  }

  return fuente.colaboradorId ? eventosManualesDeColaborador(env.DB, fuente.colaboradorId) : [];
}

export async function pollCalendario(env: Env): Promise<void> {
  const ahora = Date.now();
  const limite = ahora + HORIZONTE_DIAS * 24 * 60 * 60 * 1000;
  const fuentes = await fuentesDeCalendario(env);
  let investigadosEnEstaCorrida = 0;

  for (const fuente of fuentes) {
    if (investigadosEnEstaCorrida >= MAX_RESEARCH_POR_CORRIDA) break;
    let eventos;
    try {
      eventos = await fetchCalendario(fuente.icsUrl);
    } catch (e: any) {
      await insertLog(env.DB, 'ERROR', `No se pudo leer el calendario de ${fuente.nombre}: ${e?.message ?? e}`);
      continue;
    }

    const relevantes = eventos.filter(ev => {
      const t = new Date(ev.startUtc).getTime();
      const enRango = Number.isFinite(t) && t >= ahora && t <= limite;
      const tieneClave = ev.summary.toLowerCase().includes(PALABRA_CLAVE);
      return enRango && tieneClave;
    });

    for (const ev of relevantes) {
      if (investigadosEnEstaCorrida >= MAX_RESEARCH_POR_CORRIDA) break;

      const existe = await eventoExiste(env.DB, ev.uid);
      const reintentar = existe && await eventoConResearchFallido(env.DB, ev.uid);
      if (existe && !reintentar) continue;
      investigadosEnEstaCorrida++;

      if (!existe) {
        await insertEventoBase(env.DB, ev, { email: fuente.correo, nombre: fuente.nombre, colaboradorId: fuente.colaboradorId });
        await insertLog(env.DB, 'INFO', `▶ Nueva cita Rayos X detectada (${fuente.nombre}): ${ev.summary}`, ev.uid);
      } else {
        await insertLog(env.DB, 'INFO', `↻ Reintentando research que había fallado`, ev.uid);
      }

      try {
        await investigarEvento(env, ev.uid, ev.summary, ev.descriptionRaw);
        await insertLog(env.DB, 'INFO', `✓ Dossier listo`, ev.uid);
      } catch (e: any) {
        const error = e?.message ?? String(e);
        await marcarErrorResearch(env.DB, ev.uid, error);
        await insertLog(env.DB, 'ERROR', `✗ Falló research: ${error}`, ev.uid);
      }
    }
  }
}

function rangoHoyCDMX(): { inicioUtc: string; finUtc: string; horaCDMX: number } {
  const ahora = new Date();
  const cdmx = new Date(ahora.getTime() - 6 * 60 * 60 * 1000);
  const y = cdmx.getUTCFullYear();
  const m = cdmx.getUTCMonth();
  const d = cdmx.getUTCDate();
  // Medianoche CDMX == 06:00 UTC (offset fijo -6)
  const inicioUtc = new Date(Date.UTC(y, m, d, 6, 0, 0)).toISOString();
  const finUtc = new Date(Date.UTC(y, m, d + 1, 6, 0, 0)).toISOString();
  return { inicioUtc, finUtc, horaCDMX: cdmx.getUTCHours() };
}

async function asegurarResearch(env: Env, evento: EventoRecord): Promise<EventoRecord> {
  if (evento.research_status === 'listo') return evento;
  // Cae aquí si la cita apareció después del último poll, o si quedó en
  // 'manual' (backlog al conectar el calendario) y nadie la disparó a mano
  // antes del día de la junta — se corre aquí como respaldo para no mandar
  // el correo del día sin dossier si se puede evitar.
  try {
    await investigarEvento(env, evento.uid, evento.summary, evento.raw_description);
    await insertLog(env.DB, 'INFO', '✓ Dossier generado como respaldo antes del envío', evento.uid);
  } catch (e: any) {
    const error = e?.message ?? String(e);
    await marcarErrorResearch(env.DB, evento.uid, error);
    await insertLog(env.DB, 'ERROR', `✗ Falló research de respaldo: ${error}`, evento.uid);
  }
  const actualizado = await env.DB.prepare('SELECT * FROM eventos_rayosx WHERE uid = ?').bind(evento.uid).first<EventoRecord>();
  return actualizado ?? evento;
}

export async function enviarBriefsDelDia(env: Env): Promise<void> {
  const { inicioUtc, finUtc, horaCDMX } = rangoHoyCDMX();
  if (horaCDMX < 9) return; // aún no son las 9am CDMX, no hay nada que enviar todavía

  const eventos = await eventosParaEnviarHoy(env.DB, inicioUtc, finUtc);

  for (let evento of eventos) {
    evento = await asegurarResearch(env, evento);

    const resultado = await enviarBrief(env, evento);
    if (resultado.ok) {
      await marcarEnviado(env.DB, evento.uid);
      await insertLog(env.DB, 'INFO', `✓ Brief enviado`, evento.uid);
    } else {
      await marcarErrorEnvio(env.DB, evento.uid, resultado.error ?? 'error desconocido');
      await insertLog(env.DB, 'ERROR', `✗ Falló envío del brief: ${resultado.error}`, evento.uid);
    }
  }
}
