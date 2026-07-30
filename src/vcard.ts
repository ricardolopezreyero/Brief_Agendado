// RLR
// vCard 3.0 del prospecto — misma capa probada en el HTML del Método
// Comercial (Seguimiento Comercial), adaptada al EventoRecord del brief.
// Se genera 100% como texto en el servidor, lista para iPhone/Android/
// Google/Outlook. Los links con etiqueta usan el patrón itemN.URL +
// itemN.X-ABLabel de Apple (en iPhone/Mac se ven como enlaces con nombre;
// en Android/Outlook se degradan a un URL más, sin romper nada).
import type { EventoRecord } from './types';
import { fechaLegibleCDMX } from './markdown';

function sanitize(value: string | null | undefined): string {
  if (value === undefined || value === null) return '';
  let s = String(value);
  if (s === 'undefined' || s === 'null' || s === 'NaN') return '';
  s = s.replace(/[ \t]+/g, ' ').split(/\r\n|\r|\n/).map(l => l.trim()).join('\n').trim();
  if (!s) return '';
  s = s.replace(/\\/g, '\\\\'); // backslash primero
  s = s.replace(/;/g, '\\;');
  s = s.replace(/,/g, '\\,');
  s = s.replace(/\r\n|\r|\n/g, '\\n');
  return s;
}

function normalizeUrl(url: string | null | undefined): string {
  if (!url) return '';
  let s = String(url).trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
  return s;
}

function slug(s: string): string {
  return String(s || '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // quita acentos
    .replace(/[^\x00-\x7F]/g, '') // quita emojis / no-ascii
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

// El contacto vale la pena guardarse si hay al menos una forma de
// identificarlo o contactarlo.
export function esElegibleVcf(ev: EventoRecord): boolean {
  return !!((ev.representante_nombre || '').trim()
    || (ev.representante_telefono || '').trim()
    || (ev.representante_correo || '').trim()
    || (ev.institucion || '').trim());
}

export function nombreArchivoVcf(ev: EventoRecord): string {
  const nombre = (ev.representante_nombre || '').trim();
  const org = (ev.institucion || '').trim();
  let base = '';
  if (nombre && org) base = nombre + '-' + org;
  else if (nombre) base = nombre;
  else if (org) base = org;
  else base = ev.uid;
  return (slug(base) || 'contacto') + '.vcf';
}

// "María Pérez López" → { first: "María", last: "Pérez López" }
function partesNombre(nombreCompleto: string): { first: string; last: string } {
  const limpio = nombreCompleto.trim().replace(/\s+/g, ' ');
  if (!limpio) return { first: '', last: '' };
  const tokens = limpio.split(' ');
  if (tokens.length === 1) return { first: tokens[0], last: '' };
  return { first: tokens[0], last: tokens.slice(1).join(' ') };
}

// origen: p.ej. "https://brief.superleads.mx" — para incluir el link al
// propio brief como enlace con etiqueta dentro del contacto.
export function generarVCardEvento(ev: EventoRecord, origen?: string): string {
  const nombre = (ev.representante_nombre || '').trim();
  const { first, last } = partesNombre(nombre);
  const org = (ev.institucion || '').trim();
  const tel = (ev.representante_telefono || '').trim();
  const correo = (ev.representante_correo || '').trim();
  const web = normalizeUrl(ev.web);
  const fn = nombre || org || tel || correo || 'Contacto SuperLeads';

  // Links con lugar propio (no enterrados en NOTE)
  const links: Array<{ label: string; url: string }> = [];
  const whatsapp = (ev.representante_whatsapp || '').trim();
  if (whatsapp) {
    let waUrl: string;
    if (/^https?:\/\//i.test(whatsapp)) {
      waUrl = whatsapp;
    } else {
      // wa.me exige lada de país: a un número local mexicano de 10 dígitos
      // se le antepone 52 (los briefs son de prospectos en México).
      let digits = whatsapp.replace(/[^\d]/g, '');
      if (digits.length === 10) digits = '52' + digits;
      waUrl = 'https://wa.me/' + digits;
    }
    links.push({ label: 'WhatsApp', url: waUrl });
  }
  const crm = normalizeUrl(ev.sl_comercial_link);
  if (crm) links.push({ label: 'SuperLeads CRM', url: crm });
  const zoom = normalizeUrl(ev.zoom_link);
  if (zoom) links.push({ label: 'Zoom', url: zoom });
  if (origen && ev.dossier_md) links.push({ label: 'Brief Rayos X', url: `${origen}/eventos/${encodeURIComponent(ev.uid)}/ver` });

  // NOTE comercial: lo que quieres ver de un vistazo al abrir el contacto
  const notas: string[] = [];
  const asesor = (ev.asesor_superleads || ev.destinatario_nombre || '').trim();
  if (asesor) notas.push('Asesor asignado: ' + asesor);
  if (ev.start_utc) notas.push('Reunión Rayos X: ' + fechaLegibleCDMX(ev.start_utc));
  notas.push('Source: Brief Agendado — Rayos X de Inscripciones');
  const note = notas.join('\n');

  const lines = ['BEGIN:VCARD', 'VERSION:3.0'];
  lines.push('N:' + sanitize(last) + ';' + sanitize(first) + ';;;');
  lines.push('FN:' + sanitize(fn));
  if (org) lines.push('ORG:' + sanitize(org));
  lines.push('TITLE:Lead SIS');
  lines.push('ROLE:Lead');
  if (tel) lines.push('TEL;TYPE=CELL,VOICE:' + sanitize(tel));
  if (correo) lines.push('EMAIL;TYPE=INTERNET,WORK:' + sanitize(correo));
  if (web) lines.push('URL;TYPE=WORK:' + sanitize(web));
  links.forEach((lk, i) => {
    const item = 'item' + (i + 1);
    lines.push(item + '.URL:' + sanitize(lk.url));
    lines.push(item + '.X-ABLabel:' + sanitize(lk.label));
  });
  if (note) lines.push('NOTE:' + sanitize(note));
  lines.push('CATEGORIES:SIS,SuperLeads,lead,rayos-x');
  lines.push('UID:superleads-brief-' + sanitize(ev.uid));
  lines.push('REV:' + new Date().toISOString().replace(/\.\d+Z$/, 'Z'));
  if (asesor) lines.push('X-SUPERLEADS-ASSIGNED-TO:' + sanitize(asesor));
  if (crm) lines.push('X-SUPERLEADS-URL:' + sanitize(crm));
  if (ev.start_utc) lines.push('X-SUPERLEADS-MEETING:' + sanitize(ev.start_utc));
  lines.push('X-SUPERLEADS-SOURCE:Brief Agendado');
  lines.push('END:VCARD');
  return lines.join('\r\n') + '\r\n';
}
