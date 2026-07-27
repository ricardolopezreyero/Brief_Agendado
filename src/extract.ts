// RLR
import { llamarDeepSeek } from './deepseek';
import type { ProspectoExtraido } from './types';

const SYSTEM_PROMPT = `Extraes datos estructurados de la descripción de una cita agendada en el calendario "Rayos X de Inscripciones" de SuperLeads (empresa que vende un sistema de admisiones para colegios privados).

La descripción suele traer (pero el formato puede variar): nombre del colegio/institución, su sitio web, el nombre del representante que agendó, su teléfono, correo, WhatsApp, el asesor de SuperLeads asignado, el link de la reunión de Zoom, y un link "SL Comercial" (CRM interno).

Responde SIEMPRE con un único objeto JSON, sin texto adicional, con esta forma exacta (usa "" si un campo no aparece, nunca inventes datos):
{
  "institucion": "",
  "web": "",
  "representante_nombre": "",
  "representante_telefono": "",
  "representante_correo": "",
  "representante_whatsapp": "",
  "asesor_superleads": "",
  "zoom_link": "",
  "sl_comercial_link": "",
  "fecha_hora_reunion": ""
}

"fecha_hora_reunion": si la descripción menciona el día y la hora de la reunión (p.ej. "Día y hora: martes, 21 de julio de 2026 11:30"), conviértelo a formato "YYYY-MM-DDTHH:MM" (hora local tal cual aparece, sin zona horaria). Si no aparece, "".`;

export async function extraerProspecto(apiKey: string, summary: string, descripcion: string): Promise<ProspectoExtraido> {
  const user = `Título del evento: ${summary}\n\nDescripción:\n${descripcion}`;
  const raw = await llamarDeepSeek(apiKey, { system: SYSTEM_PROMPT, user, jsonMode: true, temperature: 0 });

  let parsed: Partial<ProspectoExtraido>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`DeepSeek devolvió un JSON inválido al extraer prospecto: ${raw.slice(0, 300)}`);
  }

  return {
    institucion: parsed.institucion ?? '',
    web: parsed.web ?? '',
    representante_nombre: parsed.representante_nombre ?? '',
    representante_telefono: parsed.representante_telefono ?? '',
    representante_correo: parsed.representante_correo ?? '',
    representante_whatsapp: parsed.representante_whatsapp ?? '',
    asesor_superleads: parsed.asesor_superleads ?? '',
    zoom_link: parsed.zoom_link ?? '',
    sl_comercial_link: parsed.sl_comercial_link ?? '',
    fecha_hora_reunion: parsed.fecha_hora_reunion ?? '',
  };
}
