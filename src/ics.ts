// RLR
import type { EventoICS } from './types';

const MEXICO_CITY_OFFSET_HOURS = 6; // UTC-6 fijo (sin horario de verano desde 2022)

function unescapeICSText(v: string): string {
  return v
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

// Desdobla líneas continuadas (RFC 5545: una línea que empieza con espacio o
// tab es continuación de la anterior) y normaliza saltos de línea.
function unfoldLines(ics: string): string[] {
  const raw = ics.replace(/\r\n/g, '\n').split('\n');
  const out: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(' ') || line.startsWith('\t')) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else if (line.length) {
      out.push(line);
    }
  }
  return out;
}

function parseDtStart(line: string): string {
  // Formas: "DTSTART:20260721T173000Z" | "DTSTART;TZID=America/Mexico_City:20260721T113000" | "DTSTART;VALUE=DATE:20260721"
  const [propPart, valuePart] = splitPropValue(line);
  const value = valuePart.trim();
  const isUtc = value.endsWith('Z');
  const digits = value.replace('Z', '');

  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6, 8));
  const hasTime = digits.length > 8;
  const hour = hasTime ? Number(digits.slice(9, 11)) : 0;
  const minute = hasTime ? Number(digits.slice(11, 13)) : 0;
  const second = hasTime ? Number(digits.slice(13, 15)) : 0;

  if (isUtc) {
    return new Date(Date.UTC(year, month - 1, day, hour, minute, second)).toISOString();
  }

  // Sin "Z": Google casi siempre manda TZID explícito para eventos con hora.
  // Tratamos cualquier hora "de pared" que no sea UTC como America/Mexico_City
  // (offset fijo -6), que es el único calendario que consume este Worker.
  const tzid = propPart.match(/TZID=([^;:]+)/i)?.[1];
  const offsetHours = !tzid || /mexico_city|america/i.test(tzid) ? MEXICO_CITY_OFFSET_HOURS : 0;
  return new Date(Date.UTC(year, month - 1, day, hour + offsetHours, minute, second)).toISOString();
}

function splitPropValue(line: string): [string, string] {
  const idx = line.indexOf(':');
  return [line.slice(0, idx), line.slice(idx + 1)];
}

export function parseICS(ics: string): EventoICS[] {
  const lines = unfoldLines(ics);
  const eventos: EventoICS[] = [];
  let dentro = false;
  let uid = '';
  let summary = '';
  let dtstart = '';
  let description = '';

  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      dentro = true;
      uid = '';
      summary = '';
      dtstart = '';
      description = '';
      continue;
    }
    if (line === 'END:VEVENT') {
      if (dentro && uid && dtstart) {
        eventos.push({ uid, summary, startUtc: dtstart, descriptionRaw: description });
      }
      dentro = false;
      continue;
    }
    if (!dentro) continue;

    if (line.startsWith('UID:')) {
      uid = line.slice('UID:'.length).trim();
    } else if (line.startsWith('SUMMARY:') || line.startsWith('SUMMARY;')) {
      summary = unescapeICSText(splitPropValue(line)[1]);
    } else if (line.startsWith('DTSTART')) {
      try {
        dtstart = parseDtStart(line);
      } catch {
        dtstart = '';
      }
    } else if (line.startsWith('DESCRIPTION:') || line.startsWith('DESCRIPTION;')) {
      description = unescapeICSText(splitPropValue(line)[1]);
    }
  }

  return eventos;
}

export async function fetchCalendario(icsUrl: string): Promise<EventoICS[]> {
  const r = await fetch(icsUrl, { headers: { 'User-Agent': 'Brief-Agendado/1.0' } });
  if (!r.ok) throw new Error(`No se pudo leer el calendario ICS: ${r.status}`);
  const text = await r.text();
  return parseICS(text);
}
