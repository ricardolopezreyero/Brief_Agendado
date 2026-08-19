// RLR
// Logos oficiales SVG de la guía de estilos SuperLeads (383×68px) — azul para
// fondos claros, blanco para fondos oscuros/navy. El PNG viejo queda deprecado.
export const LOGO_AZUL = 'https://assets.cdn.filesafe.space/E6Gh1sE1RnPtadmL7wmG/media/69cde95ac859395cde4752e3.svg';
export const LOGO_BLANCO = 'https://assets.cdn.filesafe.space/E6Gh1sE1RnPtadmL7wmG/media/69cde95a69eb1fa3e7917e1d.svg';

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
  out = out.replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" style="color:#0039C8;overflow-wrap:anywhere;">$1</a>');
  return out;
}

// Los dos mensajes de marca que van SIEMPRE al final de cualquier dossier,
// justo antes de la sección de fuentes — sin depender de lo que redacte
// DeepSeek. Están duplicados aquí (en vez de importarlos de branding.ts)
// porque branding.ts ya importa de este archivo (LOGO_AZUL/LOGO_BLANCO); mismo
// texto exacto que el footer del sitio, ver branding.ts.
const WHY_SUPERLEADS_MD = 'Creemos que ningún alumno debería perder la oportunidad de estudiar en el colegio correcto por culpa de un mal proceso de admisión, y que los colegios deben ser rentables para poder cumplir su misión educativa.';
const PROPOSITO_SL_MD = 'Darle Poder a las escuelas para que inscriban fácilmente a millones de estudiantes.';

const SECCION_WHY_SUPERLEADS = `## Por qué SuperLeads
**Why SuperLeads:** ${WHY_SUPERLEADS_MD}

**Propósito SL:** ${PROPOSITO_SL_MD}`;

// Inserta la sección fija "Por qué SuperLeads" siempre en el mismo lugar:
// al final del dossier, justo antes de "## Fuentes consultadas" (la
// bibliografía). Si por algún motivo el dossier no trae esa sección
// (DeepSeek no la generó), se agrega al final de todos modos — nunca se
// pierde. Idempotente: si ya está insertada, no la duplica.
export function conWhySuperLeads(dossierMd: string): string {
  if (dossierMd.includes('## Por qué SuperLeads')) return dossierMd;

  const lineas = dossierMd.split('\n');
  // Tolerante al número de sección ("## 7 · Fuentes" y también "## Fuentes"):
  // los títulos van numerados por la guía de estilos, y una coincidencia exacta
  // se rompía sola en cuanto alguien renumeraba.
  const idxFuentes = lineas.findIndex(l => /^##\s*(?:\d+\s*·\s*)?fuentes/i.test(l.trim()));

  if (idxFuentes === -1) {
    return `${dossierMd.trimEnd()}\n\n${SECCION_WHY_SUPERLEADS}\n`;
  }

  const antes = lineas.slice(0, idxFuentes).join('\n').trimEnd();
  const desde = lineas.slice(idxFuentes).join('\n');
  return `${antes}\n\n${SECCION_WHY_SUPERLEADS}\n\n${desde}`;
}

// Estilos del dossier, según la guía de estilos de SuperLeads.
//
// Van EN LÍNEA y con la familia repetida en cada elemento a propósito: este HTML
// se manda por correo, y Outlook no hereda `font-family` del <body>. Sin esto el
// brief le llega al cliente en serif.
//
// De la guía: §4.1 la escala tipográfica · §3.3 los colores de texto ·
// §4.2 tabular-nums obligatorio en cifras · §5 radios · §8 bordes de .5px.
const FUENTE = "'Plus Jakarta Sans',-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif";

// 17px ≈ 12.75pt, dentro del rango de "título de sección" de documento
// (§20.5: 12.5–14pt). Antes iba a 15px, el MISMO tamaño que el cuerpo, así que
// las secciones no se distinguían del texto: la jerarquía desaparecía.
const H2 = `margin:26px 0 10px;font-family:${FUENTE};font-size:17px;font-weight:700;letter-spacing:-.4px;line-height:1.2;color:#002582;border-bottom:.5px solid #e0e8f8;padding-bottom:6px;`;

// El cuerpo declara color, tamaño e interlineado en vez de heredarlos, por lo
// del correo. `tabular-nums` porque el brief es casi todo cifras y sin él los
// dígitos bailan de una línea a otra (§4.2).
const CUERPO = `font-family:${FUENTE};font-size:14px;line-height:1.78;color:#1a1a1a;font-variant-numeric:tabular-nums;`;

// Convierte el markdown del dossier (secciones ## + listas "- ") a HTML.
// Siempre pasa primero por conWhySuperLeads() para que la mini sección de
// marca aparezca en TODO lugar donde se renderiza un dossier (viewer,
// correo, PDF) sin tener que tocar cada llamador.
export function dossierToHtml(md: string): string {
  const lines = conWhySuperLeads(md).split('\n');
  const blocks: string[] = [];
  let list: string[] = [];
  let paragraph: string[] = [];
  // La primera sección ("1 · Antes de entrar") es el condensado que un comercial
  // lee en vez de todo el brief — se resalta como callout (guia-estilos) para
  // que salte a la vista en pantalla, PDF y correo por igual.
  //
  // Se detecta por palabras clave, NO por título exacto. Antes era
  // /^resumen brief pre rayos x inscripciones$/i y el recuadro no se activó
  // jamás: el modelo escribía "Resumen ejecutivo" y la comparación exacta
  // fallaba en silencio. Comprobado en los cinco dossiers de producción.
  let enRayosX = false;

  const flushParagraph = () => {
    if (paragraph.length) {
      // Filete de 3px: el de la casa para callouts. Los bordes estructurales van
      // a .5px (§8), pero un filete de acento es otra cosa.
      const estilo = enRayosX
        ? `${CUERPO}margin:0 0 20px;padding:16px 20px;border-left:3px solid #002582;background:#EEF2FF;border-radius:0 12px 12px 0;`
        : `${CUERPO}margin:0 0 14px;`;
      blocks.push(`<p style="${estilo}">${inlineMd(paragraph.join(' '))}</p>`);
      paragraph = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      const estilo = enRayosX
        ? `${CUERPO}margin:0 0 20px;padding:16px 24px 16px 38px;border-left:3px solid #002582;background:#EEF2FF;border-radius:0 12px 12px 0;`
        : `${CUERPO}margin:0 0 14px;padding-left:20px;`;
      blocks.push(`<ul style="${estilo}">${list.map(li => `<li style="${CUERPO}margin-bottom:8px;">${inlineMd(li)}</li>`).join('')}</ul>`);
      list = [];
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flushParagraph(); flushList(); continue; }
    const img = line.match(/^!\[([^\]]*)\]\((https?:\/\/[^\s)]+)\)/);
    if (line.startsWith('## ')) {
      flushParagraph(); flushList();
      const titulo = line.slice(3).trim();
      enRayosX = /antes de entrar/i.test(titulo);
      blocks.push(`<h2 data-h="1" style="${H2}">${escapeHtml(titulo)}</h2>`);
    } else if (img) {
      // Imagen de markdown en su propia línea (sección "Fotos relevantes")
      flushParagraph(); flushList();
      blocks.push(`<figure style="margin:0 0 14px;display:inline-block;vertical-align:top;width:48%;margin-right:2%;"><img src="${escapeHtml(img[2])}" alt="${escapeHtml(img[1])}" style="width:100%;border-radius:12px;display:block;"><figcaption style="font-family:${FUENTE};font-size:11px;color:#98a1b0;margin-top:4px;line-height:1.4;">${escapeHtml(img[1])}</figcaption></figure>`);
    } else if (line.startsWith('(Encontrada en:')) {
      // Pie de foto con la página de origen — va pegado a la figura anterior
      const urlFuente = line.match(/https?:\/\/[^\s)]+/)?.[0];
      if (urlFuente && blocks.length && blocks[blocks.length - 1].startsWith('<figure')) {
        blocks[blocks.length - 1] = blocks[blocks.length - 1].replace(
          '</figcaption></figure>',
          ` · <a href="${escapeHtml(urlFuente)}" style="color:#0039C8;">fuente</a></figcaption></figure>`,
        );
      }
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
