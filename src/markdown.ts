// RLR
export const LOGO_SUPERLEADS = 'https://assets.cdn.filesafe.space/E6Gh1sE1RnPtadmL7wmG/media/698e530bc08665d629146a14.png';

export function escapeHtml(s: string): string {
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

// Convierte el markdown del dossier (secciones ## + listas "- ") a HTML.
export function dossierToHtml(md: string): string {
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

export function fechaLegibleCDMX(startUtcIso: string): string {
  const d = new Date(startUtcIso);
  const cdmx = new Date(d.getTime() - 6 * 60 * 60 * 1000);
  const dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const hh = String(cdmx.getUTCHours()).padStart(2, '0');
  const mm = String(cdmx.getUTCMinutes()).padStart(2, '0');
  return `${dias[cdmx.getUTCDay()]} ${cdmx.getUTCDate()} de ${meses[cdmx.getUTCMonth()]} de ${cdmx.getUTCFullYear()}, ${hh}:${mm} hora CDMX`;
}
