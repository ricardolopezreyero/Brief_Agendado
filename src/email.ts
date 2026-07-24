// RLR
import type { Env, EventoRecord } from './types';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const DEFAULT_TO = 'Ricardo@SuperLeads.mx';
const FROM = 'Brief Agendado — SuperLeads <brief@superleads.mx>';

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inlineMd(s: string): string {
  let out = escapeHtml(s);
  out = out.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" style="color:#3457d5;">$1</a>');
  return out;
}

// Convierte el markdown del dossier (secciones ## + listas "- ") a HTML de correo.
function dossierToHtml(md: string): string {
  const lines = md.split('\n');
  const blocks: string[] = [];
  let list: string[] = [];
  let paragraph: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length) {
      blocks.push(`<p style="margin:0 0 14px;">${inlineMd(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push(`<ul style="margin:0 0 14px;padding-left:20px;">${list.map(li => `<li style="margin-bottom:8px;">${inlineMd(li)}</li>`).join('')}</ul>`);
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushParagraph(); flushList(); continue; }
    if (line.startsWith('## ')) {
      flushParagraph(); flushList();
      blocks.push(`<p style="margin:24px 0 8px;font-size:15px;font-weight:700;color:#1a2b4c;border-bottom:1px solid #eef0f3;padding-bottom:6px;">${escapeHtml(line.slice(3))}</p>`);
    } else if (line.startsWith('- ')) {
      flushParagraph();
      list.push(line.slice(2).trim());
    } else {
      flushList();
      paragraph.push(line);
    }
  }
  flushParagraph();
  flushList();

  return blocks.join('\n');
}

function datoLineaHtml(etiqueta: string, valor: string | null): string {
  if (!valor) return '';
  const esLink = /^https?:\/\//.test(valor);
  const valorHtml = esLink ? `<a href="${escapeHtml(valor)}" style="color:#3457d5;">${escapeHtml(valor)}</a>` : escapeHtml(valor);
  return `<tr><td style="padding:3px 12px 3px 0;color:#9aa2b1;font-size:13px;white-space:nowrap;">${escapeHtml(etiqueta)}</td><td style="padding:3px 0;font-size:13px;color:#2b3646;">${valorHtml}</td></tr>`;
}

function fechaLegibleCDMX(startUtcIso: string): string {
  const d = new Date(startUtcIso);
  const cdmx = new Date(d.getTime() - 6 * 60 * 60 * 1000);
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const hh = String(cdmx.getUTCHours()).padStart(2, '0');
  const mm = String(cdmx.getUTCMinutes()).padStart(2, '0');
  return `${dias[cdmx.getUTCDay()]} ${cdmx.getUTCDate()} de ${meses[cdmx.getUTCMonth()]} de ${cdmx.getUTCFullYear()}, ${hh}:${mm} hora CDMX`;
}

function buildHtml(evento: EventoRecord): string {
  const fecha = fechaLegibleCDMX(evento.start_utc);
  const datosHtml = [
    datoLineaHtml('Institución', evento.institucion),
    datoLineaHtml('Web', evento.web),
    datoLineaHtml('Representante', evento.representante_nombre),
    datoLineaHtml('Teléfono', evento.representante_telefono),
    datoLineaHtml('Correo', evento.representante_correo),
    datoLineaHtml('WhatsApp', evento.representante_whatsapp),
    datoLineaHtml('Asesor SuperLeads', evento.asesor_superleads),
    datoLineaHtml('Zoom', evento.zoom_link),
    datoLineaHtml('SL Comercial (CRM)', evento.sl_comercial_link),
  ].filter(Boolean).join('\n');

  const dossierHtml = evento.dossier_md ? dossierToHtml(evento.dossier_md) : '<p>No se pudo generar el dossier para esta reunión.</p>';

  return `<!-- RLR -->
<!doctype html>
<html lang="es">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="author" content="Ricardo López Reyero"></head>
<body style="margin:0;padding:0;background:#f4f5f7;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f5f7;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#3457d5;">Brief antes de tu reunión — Rayos X de Inscripciones</p>
              <p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#1a2b4c;">${escapeHtml(evento.institucion || evento.summary)}</p>
              <p style="margin:0 0 20px;font-size:13px;color:#9aa2b1;">Hoy, ${fecha}</p>
              <table role="presentation" style="margin:0 0 20px;">
                ${datosHtml}
              </table>
              <div style="font-size:14.5px;line-height:1.65;color:#2b3646;">
                ${dossierHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #eef0f3;">
              <p style="margin:0;font-size:12px;color:#9aa2b1;">Dossier generado automáticamente antes de la reunión a partir de la cita agendada en el calendario Rayos X.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildText(evento: EventoRecord): string {
  const fecha = fechaLegibleCDMX(evento.start_utc);
  const partes = [
    `Brief antes de tu reunión — ${evento.institucion || evento.summary}`,
    `Hoy, ${fecha}`,
    '',
    `Representante: ${evento.representante_nombre || '—'}`,
    `Teléfono: ${evento.representante_telefono || '—'}`,
    `Correo: ${evento.representante_correo || '—'}`,
    `Zoom: ${evento.zoom_link || '—'}`,
    '',
    evento.dossier_md || 'No se pudo generar el dossier para esta reunión.',
  ];
  return partes.join('\n');
}

async function llamarResend(env: Env, body: Record<string, unknown>): Promise<{ ok: boolean; id?: string; error?: string }> {
  const r = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (r.ok) {
    const data = await r.json() as { id?: string };
    return { ok: true, id: data.id };
  }
  const errBody = await r.text();
  return { ok: false, error: `Resend ${r.status}: ${errBody}` };
}

export async function enviarBrief(env: Env, evento: EventoRecord): Promise<{ ok: boolean; id?: string; error?: string }> {
  const to = evento.destinatario_email || env.BRIEF_TO_EMAIL || DEFAULT_TO;
  const subject = `🔍 Brief: ${evento.institucion || evento.summary} — hoy ${evento.representante_nombre ? `con ${evento.representante_nombre}` : ''}`.trim();

  return llamarResend(env, {
    from: FROM,
    to: [to],
    subject,
    html: buildHtml(evento),
    text: buildText(evento),
  });
}
