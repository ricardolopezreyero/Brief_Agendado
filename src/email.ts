// RLR
import type { Env, EventoRecord } from './types';
import { escapeHtml, dossierToHtml, fechaLegibleCDMX } from './markdown';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

// true si la junta cae en el día natural de HOY en CDMX (offset fijo -6).
// El brief normalmente sale el día de la junta, pero también se puede
// (re)enviar días después desde el dashboard — en ese caso decir "hoy"
// sería incorrecto.
function esHoyCDMX(startUtcIso: string): boolean {
  const evento = new Date(new Date(startUtcIso).getTime() - 6 * 60 * 60 * 1000);
  const ahora = new Date(Date.now() - 6 * 60 * 60 * 1000);
  return evento.getUTCFullYear() === ahora.getUTCFullYear()
    && evento.getUTCMonth() === ahora.getUTCMonth()
    && evento.getUTCDate() === ahora.getUTCDate();
}
const DEFAULT_TO = 'Ricardo@SuperLeads.mx';
const FROM = 'Brief Agendado — SuperLeads <brief@superleads.mx>';

function datoLineaHtml(etiqueta: string, valor: string | null): string {
  if (!valor) return '';
  const esLink = /^https?:\/\//.test(valor);
  const valorHtml = esLink ? `<a href="${escapeHtml(valor)}" style="color:#0039C8;">${escapeHtml(valor)}</a>` : escapeHtml(valor);
  return `<tr><td style="padding:3px 12px 3px 0;color:#98a1b0;font-size:13px;white-space:nowrap;">${escapeHtml(etiqueta)}</td><td style="padding:3px 0;font-size:13px;color:#1a1a1a;">${valorHtml}</td></tr>`;
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
<body style="margin:0;padding:0;background:#F4F7FF;font-family:'Plus Jakarta Sans',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F4F7FF;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width:600px;background:#ffffff;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 8px;">
              <p style="margin:0 0 4px;font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:#0039C8;">Brief antes de tu reunión — Pre-Rayos X de Inscripciones</p>
              <p style="margin:0 0 20px;font-size:20px;font-weight:700;color:#002582;">${escapeHtml(evento.institucion || evento.summary)}</p>
              <p style="margin:0 0 20px;font-size:13px;color:#98a1b0;">${esHoyCDMX(evento.start_utc) ? 'Hoy, ' : ''}${fecha}</p>
              <table role="presentation" style="margin:0 0 20px;">
                ${datosHtml}
              </table>
              <div style="font-size:14.5px;line-height:1.65;color:#1a1a1a;">
                ${dossierHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;border-top:.5px solid #e0e8f8;">
              <p style="margin:0;font-size:12px;color:#98a1b0;">Dossier generado automáticamente antes de la reunión a partir de la cita agendada en el calendario Rayos X.</p>
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
    `${esHoyCDMX(evento.start_utc) ? 'Hoy, ' : ''}${fecha}`,
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
  const cuando = esHoyCDMX(evento.start_utc) ? 'hoy' : '';
  const con = evento.representante_nombre ? `con ${evento.representante_nombre}` : '';
  const sufijo = [cuando, con].filter(Boolean).join(' ');
  // Sin emoji, minúsculas normales, una sola idea — regla de la casa para asuntos.
  const subject = `Brief: ${evento.institucion || evento.summary}${sufijo ? ` — ${sufijo}` : ''}`;

  return llamarResend(env, {
    from: FROM,
    to: [to],
    subject,
    html: buildHtml(evento),
    text: buildText(evento),
  });
}
