// RLR
import { llamarDeepSeek } from './deepseek';
import type { ProspectoExtraido, FuenteResultado } from './types';

const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';

const ICP_SUPERLEADS = `SuperLeads vende un sistema de admisiones (CRM educativo) para colegios privados en México/LATAM. El dolor central que resuelve: familias interesadas que se pierden en el proceso de inscripción por falta de seguimiento oportuno ("inscripciones fantasma"). ICP ideal: colegio privado establecido, con matrícula relevante, proceso de admisión activo (temporada de inscripciones), dolor visible en seguimiento a leads/prospectos, decisor con autoridad para invertir en tecnología (dirección general, dirección de admisiones/mercadotecnia).`;

const SYSTEM_QUERIES = `Diseñas queries de búsqueda web para investigar a un colegio privado y su representante antes de una reunión comercial de ventas. Devuelve SIEMPRE un único array JSON de 5 a 6 strings (las queries), sin texto adicional. Cada query debe ser específica y ejecutable en un buscador real (nombre propio del colegio, ciudad si se infiere del dominio/teléfono, temas como matrícula, redes sociales, reputación, competencia, noticias recientes). No inventes datos que no te dieron.`;

// Dominios de redes sociales que buscamos directamente en el HTML del sitio
// oficial (header/footer) — mucho más confiable que confiar en resultados de
// búsqueda para el LINK en sí. El número de seguidores sí se busca aparte.
const REDES_DOMINIOS: Array<{ nombre: string; patron: RegExp }> = [
  { nombre: 'Facebook', patron: /https?:\/\/(www\.)?facebook\.com\/(?!sharer|share|dialog|plugins)[^"'\s<>]+/i },
  { nombre: 'Instagram', patron: /https?:\/\/(www\.)?instagram\.com\/(?!p\/|reel\/)[^"'\s<>]+/i },
  { nombre: 'TikTok', patron: /https?:\/\/(www\.)?tiktok\.com\/@[^"'\s<>]+/i },
  { nombre: 'YouTube', patron: /https?:\/\/(www\.)?youtube\.com\/(channel|c|user|@)[^"'\s<>]+/i },
  { nombre: 'X / Twitter', patron: /https?:\/\/(www\.)?(x|twitter)\.com\/(?!intent|share)[^"'\s<>]+/i },
  { nombre: 'LinkedIn', patron: /https?:\/\/(www\.)?linkedin\.com\/(company|school)\/[^"'\s<>]+/i },
];

function limpiarUrlRedSocial(url: string): string {
  return url.replace(/["'<>].*$/, '').replace(/[)\].,;]+$/, '');
}

// Busca links de redes sociales oficiales directamente en el HTML del sitio
// (casi siempre están en el header o footer del home). Si falla o no hay web,
// regresa vacío — nunca tumba el research completo.
export async function extraerRedesSociales(webUrl: string): Promise<Array<{ plataforma: string; url: string }>> {
  if (!webUrl) return [];
  try {
    const r = await fetch(webUrl, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BriefAgendado/1.0)' } });
    if (!r.ok) return [];
    const html = await r.text();

    const encontradas: Array<{ plataforma: string; url: string }> = [];
    for (const { nombre, patron } of REDES_DOMINIOS) {
      const m = html.match(patron);
      if (m) encontradas.push({ plataforma: nombre, url: limpiarUrlRedSocial(m[0]) });
    }
    return encontradas;
  } catch {
    return [];
  }
}

const SYSTEM_DOSSIER = `Eres un investigador comercial de SuperLeads que redacta un dossier ejecutivo breve sobre un prospecto (colegio privado) antes de una reunión de ventas llamada "Rayos X de Inscripciones". Escribes en español LATAM, tono profesional y directo.

ICP de referencia:
${ICP_SUPERLEADS}

Reglas:
- Usa SOLO los datos provistos (perfil del prospecto + resultados de búsqueda). Si algo no aparece en las fuentes, dilo explícitamente como "no se encontró" — nunca inventes cifras, declaraciones o hechos.
- El valor del dossier son 3-5 anclajes de personalización: hechos específicos, verificables (con URL fuente), relevantes para el ICP y accionables en la conversación. Prioriza calidad sobre cantidad.
- Sé honesto sobre el fit: si el prospecto no encaja bien con el ICP, dilo claro.
- Cada dato relevante debe poder rastrearse a una URL de las fuentes dadas.

Responde en markdown con EXACTAMENTE estas secciones, en este orden:

## Resumen ejecutivo
(3 frases máximo)

## El colegio
(qué se sabe: tipo de institución, tamaño aparente, ubicación, niveles educativos, propuesta de valor visible)

## Redes sociales
Si en "Redes sociales detectadas en el sitio oficial" te dieron links, repórtalos tal cual (son confiables, vienen del propio sitio) y agrega el número de seguidores SOLO si aparece explícitamente en los resultados de búsqueda (con fuente). Si no encontraste ninguna red social oficial, escribe "No se encontraron redes sociales oficiales". Nunca inventes un número de seguidores.
Una red social por línea, SIEMPRE como bullet de markdown (empieza con "- "), nunca como párrafo corrido:
- **Plataforma**: URL — seguidores: N (Fuente: URL)
- **Otra plataforma**: URL — seguidores: no encontrado

## El representante
(rol, lo que se sabe de su trayectoria/actividad pública si algo se encontró; si no hay nada, decirlo)

## Cruce con el ICP de SuperLeads
(triggers detectados, dolor inferido, banderas amarillas si las hay)

## Anclajes de personalización
(3-5 puntos, formato: **hecho específico** — por qué sirve para la conversación. (Fuente: URL))

## Score de fit ICP
(número 1-10 con una justificación de 1-2 frases)

## Recomendación
(avanzar / explorar con cautela / no forzar — en 1 frase)

## Fuentes consultadas
(lista de URLs usadas)`;

export async function generarQueries(deepseekKey: string, p: ProspectoExtraido): Promise<string[]> {
  const user = `Datos del prospecto:
Institución: ${p.institucion || '(desconocida)'}
Web: ${p.web || '(desconocida)'}
Representante: ${p.representante_nombre || '(desconocido)'}
Teléfono: ${p.representante_telefono || '(desconocido)'}`;

  const raw = await llamarDeepSeek(deepseekKey, { system: SYSTEM_QUERIES, user, temperature: 0.4 });
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    const arr = JSON.parse(match ? match[0] : raw);
    if (Array.isArray(arr)) return arr.filter((q): q is string => typeof q === 'string' && q.trim().length > 0).slice(0, 6);
  } catch {
    // sigue al fallback
  }
  // Fallback si DeepSeek no devolvió JSON parseable: queries genéricas mínimas.
  const base = p.institucion || p.web;
  return [base, `${base} colegio privado`, `${base} admisiones`, `${p.representante_nombre} ${base}`].filter(Boolean);
}

// Se agrega siempre, además de las que diseñe DeepSeek — el número de
// seguidores casi nunca aparece en el propio sitio, hay que buscarlo aparte.
function querySeguidores(p: ProspectoExtraido): string | null {
  const base = p.institucion || p.web;
  return base ? `${base} seguidores Facebook Instagram` : null;
}

export async function buscarBrave(braveKey: string, query: string): Promise<FuenteResultado[]> {
  const url = new URL(BRAVE_ENDPOINT);
  url.searchParams.set('q', query);
  url.searchParams.set('count', '5');
  url.searchParams.set('country', 'mx');
  url.searchParams.set('search_lang', 'es');

  const r = await fetch(url.toString(), {
    headers: {
      'Accept': 'application/json',
      'X-Subscription-Token': braveKey,
    },
  });

  if (!r.ok) {
    return []; // una query fallida no debe tumbar todo el research
  }

  const data = await r.json() as { web?: { results?: Array<{ title: string; url: string; description?: string }> } };
  const resultados = data.web?.results ?? [];
  return resultados.map(res => ({ titulo: res.title, url: res.url, snippet: res.description ?? '' }));
}

export async function ejecutarResearch(deepseekKey: string, braveKey: string, p: ProspectoExtraido): Promise<string> {
  const [queriesGeneradas, redesDetectadas] = await Promise.all([
    generarQueries(deepseekKey, p),
    extraerRedesSociales(p.web),
  ]);

  const seguidores = querySeguidores(p);
  const queries = seguidores ? [...queriesGeneradas, seguidores] : queriesGeneradas;

  const resultadosPorQuery = await Promise.all(queries.map(async q => ({
    query: q,
    resultados: await buscarBrave(braveKey, q),
  })));

  const fuentesTexto = resultadosPorQuery.map(({ query, resultados }) => {
    if (!resultados.length) return `### Query: "${query}"\n(sin resultados)`;
    const lista = resultados.map(r => `- **${r.titulo}** — ${r.url}\n  ${r.snippet}`).join('\n');
    return `### Query: "${query}"\n${lista}`;
  }).join('\n\n');

  const redesTexto = redesDetectadas.length
    ? redesDetectadas.map(r => `- ${r.plataforma}: ${r.url}`).join('\n')
    : '(no se encontraron links de redes sociales en el HTML del sitio oficial — si algo aparece en los resultados de búsqueda, repórtalo con cautela)';

  const user = `Perfil del prospecto:
Institución: ${p.institucion || '(desconocida)'}
Web: ${p.web || '(desconocida)'}
Representante: ${p.representante_nombre || '(desconocido)'} — Teléfono: ${p.representante_telefono || '(desconocido)'} — Correo: ${p.representante_correo || '(desconocido)'}

Redes sociales detectadas en el sitio oficial:
${redesTexto}

Resultados de búsqueda web:

${fuentesTexto}`;

  return llamarDeepSeek(deepseekKey, { system: SYSTEM_DOSSIER, user, temperature: 0.3, model: 'deepseek-v4-pro' });
}
