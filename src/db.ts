// RLR
import type { Env, EventoRecord, EventoICS, ProspectoExtraido, Colaborador } from './types';

export async function insertLog(db: D1Database, nivel: 'INFO' | 'WARNING' | 'ERROR', mensaje: string, uid?: string): Promise<void> {
  await db.prepare('INSERT INTO logs (nivel, mensaje, uid, creado_en) VALUES (?, ?, ?, ?)')
    .bind(nivel, mensaje, uid ?? null, new Date().toISOString())
    .run();
}

export async function getLogs(db: D1Database, lines: number): Promise<Array<{ nivel: string; mensaje: string; uid: string | null; creado_en: string }>> {
  const { results } = await db.prepare('SELECT nivel, mensaje, uid, creado_en FROM logs ORDER BY id DESC LIMIT ?')
    .bind(lines).all();
  return results as any;
}

export async function eventoExiste(db: D1Database, uid: string): Promise<boolean> {
  const row = await db.prepare('SELECT uid FROM eventos_rayosx WHERE uid = ?').bind(uid).first();
  return !!row;
}

// true si el evento existe pero su research anterior falló (candidato a reintento en el próximo poll)
export async function eventoConResearchFallido(db: D1Database, uid: string): Promise<boolean> {
  const row = await db.prepare(`SELECT uid FROM eventos_rayosx WHERE uid = ? AND research_status = 'error'`).bind(uid).first();
  return !!row;
}

export async function insertEventoBase(db: D1Database, evento: EventoICS, destinatario: { email: string; nombre: string; colaboradorId: number | null }): Promise<void> {
  await db.prepare(`
    INSERT INTO eventos_rayosx (uid, summary, start_utc, raw_description, destinatario_email, destinatario_nombre, colaborador_id, research_status, email_status, creado_en)
    VALUES (?, ?, ?, ?, ?, ?, ?, 'pendiente', 'pendiente', ?)
    ON CONFLICT(uid) DO NOTHING
  `).bind(
    evento.uid, evento.summary, evento.startUtc, evento.descriptionRaw,
    destinatario.email, destinatario.nombre, destinatario.colaboradorId,
    new Date().toISOString(),
  ).run();
}

export async function listColaboradoresActivos(db: D1Database): Promise<Colaborador[]> {
  const { results } = await db.prepare('SELECT * FROM colaboradores WHERE activo = 1').all();
  return results as unknown as Colaborador[];
}

export async function insertColaborador(db: D1Database, c: { nombre: string; correo: string; icsUrl: string }): Promise<void> {
  await db.prepare('INSERT INTO colaboradores (nombre, correo, ics_url, activo, creado_en) VALUES (?, ?, ?, 1, ?)')
    .bind(c.nombre, c.correo, c.icsUrl, new Date().toISOString()).run();
}

export async function listColaboradores(db: D1Database): Promise<Colaborador[]> {
  const { results } = await db.prepare('SELECT * FROM colaboradores ORDER BY id DESC').all();
  return results as unknown as Colaborador[];
}

export async function guardarProspecto(db: D1Database, uid: string, p: ProspectoExtraido): Promise<void> {
  await db.prepare(`
    UPDATE eventos_rayosx SET
      institucion = ?, web = ?, representante_nombre = ?, representante_telefono = ?,
      representante_correo = ?, representante_whatsapp = ?, asesor_superleads = ?,
      zoom_link = ?, sl_comercial_link = ?
    WHERE uid = ?
  `).bind(
    p.institucion, p.web, p.representante_nombre, p.representante_telefono,
    p.representante_correo, p.representante_whatsapp, p.asesor_superleads,
    p.zoom_link, p.sl_comercial_link, uid,
  ).run();
}

export async function guardarDossier(db: D1Database, uid: string, dossierMd: string): Promise<void> {
  await db.prepare(`
    UPDATE eventos_rayosx SET dossier_md = ?, research_status = 'listo', research_error = NULL, investigado_en = ?
    WHERE uid = ?
  `).bind(dossierMd, new Date().toISOString(), uid).run();
}

export async function marcarErrorResearch(db: D1Database, uid: string, error: string): Promise<void> {
  await db.prepare(`UPDATE eventos_rayosx SET research_status = 'error', research_error = ? WHERE uid = ?`)
    .bind(error, uid).run();
}

export async function marcarEnviado(db: D1Database, uid: string): Promise<void> {
  await db.prepare(`UPDATE eventos_rayosx SET email_status = 'enviado', email_error = NULL, enviado_en = ? WHERE uid = ?`)
    .bind(new Date().toISOString(), uid).run();
}

export async function marcarErrorEnvio(db: D1Database, uid: string, error: string): Promise<void> {
  await db.prepare(`UPDATE eventos_rayosx SET email_status = 'error', email_error = ? WHERE uid = ?`)
    .bind(error, uid).run();
}

export async function eventosPendientesDeResearch(db: D1Database): Promise<EventoRecord[]> {
  const { results } = await db.prepare(`SELECT * FROM eventos_rayosx WHERE research_status = 'pendiente'`).all();
  return results as unknown as EventoRecord[];
}

// Eventos cuya junta es HOY (rango UTC ya calculado por el caller para el día
// natural en America/Mexico_City) y aún no enviados. No exige research_status
// = 'listo': si el research falló, igual se manda el correo con los datos de
// contacto disponibles en vez de que la junta pase sin ningún aviso.
export async function eventosParaEnviarHoy(db: D1Database, inicioUtc: string, finUtc: string): Promise<EventoRecord[]> {
  const { results } = await db.prepare(`
    SELECT * FROM eventos_rayosx
    WHERE email_status = 'pendiente'
      AND start_utc >= ? AND start_utc < ?
  `).bind(inicioUtc, finUtc).all();
  return results as unknown as EventoRecord[];
}

export async function listEventos(db: D1Database, limit: number): Promise<EventoRecord[]> {
  const { results } = await db.prepare('SELECT * FROM eventos_rayosx ORDER BY start_utc DESC LIMIT ?').bind(limit).all();
  return results as unknown as EventoRecord[];
}

export async function getEvento(db: D1Database, uid: string): Promise<EventoRecord | null> {
  const row = await db.prepare('SELECT * FROM eventos_rayosx WHERE uid = ?').bind(uid).first<EventoRecord>();
  return row ?? null;
}
