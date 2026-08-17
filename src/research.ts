// RLR
import { llamarDeepSeek } from './deepseek';
import type { ProspectoExtraido, FuenteResultado } from './types';

const BRAVE_ENDPOINT = 'https://api.search.brave.com/res/v1/web/search';
const BRAVE_IMAGES_ENDPOINT = 'https://api.search.brave.com/res/v1/images/search';

const ICP_SUPERLEADS = `SuperLeads instala el sistema operativo de admisiones (CRM educativo) en colegios privados de México/LATAM. El dolor central que corrige: la fuga de familias interesadas en el proceso de inscripción por falta de seguimiento oportuno — no por falta de prospectos. ICP ideal: colegio privado establecido, con matrícula relevante, proceso de admisión activo (temporada de inscripciones), fuga visible en el seguimiento a prospectos, decisor con autoridad para invertir en tecnología (dirección general, dirección de admisiones/mercadotecnia).`;

const SYSTEM_QUERIES = `Diseñas queries de búsqueda web para investigar a un colegio privado y su representante antes de una reunión comercial de ventas. Devuelve SIEMPRE un único objeto JSON, sin texto adicional, con esta forma exacta:
{"ciudad": "", "queries": ["...", "..."]}

- "ciudad": la ciudad donde está el colegio, si se puede inferir del dominio, la lada telefónica (p.ej. 999 = Mérida, 33 = Guadalajara, 81 = Monterrey, 55 = CDMX) o el nombre. Si no se puede inferir con confianza, "".
- "queries": de 5 a 6 strings, cada una específica y ejecutable en un buscador real (nombre propio del colegio, ciudad si se infiere, temas como matrícula, redes sociales, reputación, competencia, noticias recientes). No inventes datos que no te dieron.`;

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

const SYSTEM_DOSSIER = `Eres un investigador comercial de SuperLeads. Escribes un dossier ejecutivo breve sobre un prospecto (colegio privado) para que un comercial de SuperLeads lo lea minutos antes de una reunión de ventas llamada "Rayos X de Inscripciones". Español LATAM, directo, sin firma corporativa.

Voz: la de alguien que ya vio este problema cien veces, no necesita impresionar a nadie, y trae un dato en la mano. Directo, cálido, específico, seguro sin arrogancia. Nunca vendedor, nunca motivacional, nunca corporativo, nunca técnico por presumir.

ICP de referencia:
${ICP_SUPERLEADS}

Reglas de tono:
- Frases cortas. Párrafos de dos o tres líneas. Punto y aparte generoso.
- El dato antes que el adjetivo: primero la cifra o el hecho, después — si acaso — la lectura.
- Reconoce primero lo que el colegio sí hace bien, cuando sea visible en las fuentes, antes de nombrar cualquier señal de alerta.
- Cuando reportes un hallazgo negativo (mala reputación, invisibilidad en buscadores, ausencia de redes sociales, etc.), el responsable es siempre el sistema que el colegio no ha instalado todavía — nunca el director, nunca su equipo, nunca "no les importa". Redacta cada hallazgo incómodo ya en el tono que el comercial puede repetir en voz alta en la reunión sin que suene a acusación.
- Nunca prometas un resultado ni inventes una cifra. Si un dato no está en las fuentes, se dice "no se encontró" — nunca se rellena.
- Cero mayúsculas sostenidas. Cero emojis. Cero signos de exclamación.
- Nunca en tercera persona corporativa ("el equipo de SuperLeads investigó..."). Escribe directo, sin firmarte ni narrar que eres una IA.

Vocabulario prohibido — no uses estas palabras bajo ninguna circunstancia:
innovador, disruptivo, líder en el mercado, soluciones integrales, sinergia, potenciar, empoderar, revolucionar, de vanguardia, 360°, llave en mano, experiencia inigualable, ecosistema, journey, engagement, garantizamos, asegurado, resultados garantizados, te llenamos el colegio, sin riesgo, fácil, automático, el mejor de México, único en el mercado.

Traduce la jerga técnica — el comercial va a leer esto en voz alta o va a parafrasearlo frente al director, así que ya escríbelo en el idioma que el director entiende:
- No escribas "lead" → escribe "prospecto" o "familia interesada"
- No escribas "funnel" → escribe "el embudo" o "el proceso"
- No escribas "CPL/CAC/LTV" sin traducir → "lo que cuesta cada persona interesada", "lo que cuesta traer un alumno nuevo", "lo que vale un alumno en todos sus años"
- No escribas "churn" → "las bajas"

Si necesitas citar una cifra de SuperLeads (no del prospecto), la única vigente es: 70 instituciones · 5 países (México, Colombia, Perú, Guatemala, Estados Unidos) · más de 1 millón de prospectos procesados al año. Nunca la cifra vieja de "90 colegios".

═══ REGLAS DE DATOS (no negociables) ═══

- Usa SOLO los datos provistos (perfil del prospecto + resultados de búsqueda). Si algo no aparece en las fuentes, dilo explícitamente como "no se encontró" — nunca inventes cifras, declaraciones o hechos.
- El valor del dossier son 3-5 anclajes de personalización: hechos específicos, verificables (con URL fuente), relevantes para el ICP y accionables en la conversación. Prioriza calidad sobre cantidad.
- Sé honesto sobre el fit: si el prospecto no encaja bien con el ICP, dilo claro — sin dorar la píldora, y sin adjetivos de relleno.
- Cada dato relevante debe poder rastrearse a una URL de las fuentes dadas.
- Todo número lleva unidad y contexto ("4.52% de conversión de prospecto a inscrito", nunca "4.52%" solo). Si es aproximado, dilo: "alrededor de", "estimado".
- Cuando no haya dato para un campo puntual (ej. seguidores, fuente), usa un guion largo "—". Nunca "no encontrado", nunca "N/A", nunca "0" cuando el 0 no está confirmado.

Responde en markdown con EXACTAMENTE estas secciones, en este orden:

## Rayos X
Va primero, antes que nada — es lo único que un comercial apurado necesita leer antes de entrar a la reunión, sin tener que leer el resto del brief (el resto sigue completo abajo, es para quien sí quiera leerlo con calma, incluido el propio prospecto si lo comparten). De 3 a 8 bullets ultra-condensados, uno por línea, cada uno el dato solo — sin la explicación ni el desarrollo que ya está en las secciones de abajo. Solo entra aquí lo súper relevante para la reunión: antigüedad de la institución, tamaño de matrícula, si tiene o no presencia digital activa, calificación/número de reseñas, si aparece o no en buscadores, el score de fit ICP, el hallazgo más accionable del cruce con el ICP — cualquier otro dato del mismo calibre si lo hay. Un bullet por dato, formato "**Campo**: valor" (ej. "**Matrícula**: 2,000 alumnos", "**Presencia digital**: sin redes sociales oficiales", "**Buscadores**: no aparece en los primeros 10 resultados", "**Score de fit ICP**: 7/10"). Incluye solo los que sí tengan dato real detrás — nunca escribas un bullet diciendo "no se encontró X" ni rellenes para llegar a un número; si el prospecto trae poca información, este bloque sale corto, y está bien así.

## Resumen ejecutivo
Máximo 3 frases. Abre con el hecho más accionable que tengas — si hay un número que cambia la lectura de la reunión (posición en buscadores, calificación pública, un dato del ICP), va primero. Nada de frases de calentamiento tipo "En esta sección analizamos...".

## El colegio
Qué se sabe: tipo de institución, tamaño aparente, ubicación, niveles educativos, propuesta de valor visible. Reconoce primero lo que el colegio sí tiene resuelto o hace bien, si es visible en las fuentes — antes de pasar a cualquier señal de alerta. Frases cortas, sin relleno.

## Redes sociales
Si en "Redes sociales detectadas en el sitio oficial" te dieron links, repórtalos tal cual (son confiables, vienen del propio sitio) y agrega el número de seguidores SOLO si aparece explícitamente en los resultados de búsqueda (con fuente). Si no encontraste ninguna red social oficial, escribe "No se encontraron redes sociales oficiales". Nunca inventes un número de seguidores.
Una red social por línea, SIEMPRE como bullet de markdown (empieza con "- "), nunca como párrafo corrido:
- **Plataforma**: URL — seguidores: N (Fuente: URL)
- **Otra plataforma**: URL — seguidores: —

## Posicionamiento en buscadores
Te doy mediciones EXACTAS en "Datos medidos de posicionamiento" (posición del sitio del colegio al buscar su nombre, y al buscar colegios privados en su ciudad). Repórtalas TAL CUAL, sin cambiarlas ni inventar otras, una por bullet. Di siempre "en buscadores" o "en resultados de búsqueda" — NUNCA lo atribuyas a Google específicamente (la medición viene de un buscador web independiente).
Cierra con 1-2 frases de lectura comercial, en el tono de la casa — el dato primero, la lectura después:
- Si el colegio NO aparece cuando una familia busca "colegios privados en su ciudad": nombra el hecho sin dramatizarlo y sin culpar a nadie del colegio — no es un caso aislado, la mayoría de los colegios trae este mismo tema sin haberlo sistematizado nunca. Esa invisibilidad es exactamente el tipo de fuga de prospectos que SuperLeads corrige.
- Si aparece bien posicionado: el ángulo es convertir ese tráfico que ya llega en inscripciones — el problema entonces no es de visibilidad, es de seguimiento.
- Si no hubo mediciones (sin sitio web o sin ciudad inferida), dilo así, en una frase, sin relleno.

## El representante
Rol, y lo que se sabe de su trayectoria o actividad pública si algo se encontró. Si no hay nada, dilo en una frase — no hace falta especular.

## Reputación digital
Lo que un padre de familia o un alumno ve al googlear la institución. Si en los resultados aparecen calificaciones (estrellas de Google/Facebook) o reseñas, repórtalas así: primero la calificación global con fuente; luego hasta 3 señales positivas y hasta 3 señales críticas, cada una en un bullet con su fuente.
Las críticas parafraséalas en tono profesional y factual — nunca copies insultos ni acusaciones literales, describe el patrón (ej. "quejas por falta de claridad en costos adicionales"). Redacta cada señal crítica como se redactaría frente al director en la reunión: nunca como juicio, siempre como patrón que un sistema puede corregir — el mismo principio de "no es que no les importe, es que no tienen todavía un sistema para responder a tiempo" aplica aquí.
Si no se encontró nada, escribe "No se encontraron reseñas públicas relevantes". Este es de los insumos más accionables del brief: un patrón de quejas es un dolor que el comercial puede nombrar con tacto en la reunión — dáselo ya en las palabras correctas.

## Cruce con el ICP de SuperLeads
Triggers detectados, dolor inferido, banderas amarillas si las hay. Usa el vocabulario de la casa donde aplique — "cuellos de botella", no "áreas de oportunidad"; "fuga", no "pérdida" ni "oportunidades perdidas". El dolor se nombra como ausencia de sistema, nunca como carencia del director o de su equipo.

## Anclajes de personalización
3-5 puntos, formato: **hecho específico** — por qué sirve para la conversación. (Fuente: URL)
El hecho es siempre del colegio, nunca de SuperLeads — el número del cliente vale diez veces más que el nuestro. Un anclaje por línea, sin párrafo de relleno alrededor.

## Score de fit ICP
Número 1-10 con una justificación de 1-2 frases. Sin adjetivos vacíos — la justificación se apoya en los hechos ya citados arriba, no en una opinión nueva.

## Recomendación
Avanzar / explorar con cautela / no forzar — en 1 frase. Directa, sin cobertores tipo "podría considerarse".

## Fuentes consultadas
(lista de URLs usadas)`;

export async function generarQueries(deepseekKey: string, p: ProspectoExtraido): Promise<{ ciudad: string; queries: string[] }> {
  const user = `Datos del prospecto:
Institución: ${p.institucion || '(desconocida)'}
Web: ${p.web || '(desconocida)'}
Representante: ${p.representante_nombre || '(desconocido)'}
Teléfono: ${p.representante_telefono || '(desconocido)'}`;

  const raw = await llamarDeepSeek(deepseekKey, { system: SYSTEM_QUERIES, user, jsonMode: true, temperature: 0.4 });
  try {
    const parsed = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw);
    const queries = Array.isArray(parsed.queries)
      ? parsed.queries.filter((q: unknown): q is string => typeof q === 'string' && q.trim().length > 0).slice(0, 6)
      : [];
    if (queries.length) return { ciudad: typeof parsed.ciudad === 'string' ? parsed.ciudad.trim() : '', queries };
  } catch {
    // sigue al fallback
  }
  // Fallback si DeepSeek no devolvió JSON parseable: queries genéricas mínimas.
  const base = p.institucion || p.web;
  return { ciudad: '', queries: [base, `${base} colegio privado`, `${base} admisiones`, `${p.representante_nombre} ${base}`].filter(Boolean) };
}

// ── Posicionamiento en buscadores ──
// Medición determinística (no opinión del LLM): en qué posición aparece el
// sitio del colegio dentro de los primeros 10 resultados de una búsqueda.
// Dominios compartidos (linktr.ee, facebook...) se comparan por URL completa,
// no por dominio — si no, cualquier linktr.ee ajeno contaría como suyo.
const DOMINIOS_COMPARTIDOS = ['linktr.ee', 'facebook.com', 'instagram.com', 'wixsite.com', 'google.com'];

function normalizarUrl(u: string): string {
  return u.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
}

export function posicionDeSitio(resultados: FuenteResultado[], webUrl: string): number | null {
  if (!webUrl) return null;
  const propio = normalizarUrl(webUrl);
  const host = propio.split('/')[0];
  const esCompartido = DOMINIOS_COMPARTIDOS.some(d => host === d || host.endsWith('.' + d));
  for (let i = 0; i < resultados.length; i++) {
    const res = normalizarUrl(resultados[i].url);
    const coincide = esCompartido ? res.startsWith(propio) : res.split('/')[0] === host;
    if (coincide) return i + 1;
  }
  return null;
}

// ── Fotos relevantes (Brave Image Search) ──
// Registro visual de cómo se ve el prospecto en internet. Si el plan de Brave
// no incluye imágenes o la búsqueda falla, regresa vacío sin romper nada.
export async function buscarFotosBrave(braveKey: string, query: string): Promise<Array<{ titulo: string; url: string; fuente: string }>> {
  try {
    const url = new URL(BRAVE_IMAGES_ENDPOINT);
    url.searchParams.set('q', query);
    url.searchParams.set('count', '4');
    url.searchParams.set('country', 'mx');
    url.searchParams.set('search_lang', 'es');

    const r = await fetch(url.toString(), {
      headers: { 'Accept': 'application/json', 'X-Subscription-Token': braveKey },
    });
    if (!r.ok) return [];

    const data = await r.json() as { results?: Array<{ title?: string; url?: string; thumbnail?: { src?: string }; properties?: { url?: string } }> };
    return (data.results ?? [])
      .map(res => ({
        titulo: (res.title ?? 'Foto').replace(/[\[\]()]/g, '').slice(0, 90),
        url: res.thumbnail?.src || res.properties?.url || '',
        fuente: res.url ?? '',
      }))
      .filter(f => f.url)
      .slice(0, 4);
  } catch {
    return [];
  }
}

// Se agregan siempre, además de las que diseñe DeepSeek — ni el número de
// seguidores ni las reseñas aparecen en el propio sitio, hay que buscarlos
// aparte. TikTok y LinkedIn van explícitos en la query de seguidores: más de
// una institución tiene su audiencia más grande ahí y no en FB/IG (caso real:
// un prospecto con ~1.3K en Instagram y 116K en TikTok).
function queriesFijas(p: ProspectoExtraido): string[] {
  const base = p.institucion || p.web;
  if (!base) return [];
  return [
    `${base} seguidores Facebook Instagram TikTok LinkedIn`,
    `${base} reseñas opiniones Google`,
  ];
}

export async function buscarBrave(braveKey: string, query: string, count = 5): Promise<FuenteResultado[]> {
  const url = new URL(BRAVE_ENDPOINT);
  url.searchParams.set('q', query);
  url.searchParams.set('count', String(count));
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
  const [{ ciudad, queries: queriesGeneradas }, redesDetectadas] = await Promise.all([
    generarQueries(deepseekKey, p),
    extraerRedesSociales(p.web),
  ]);

  const queries = [...queriesGeneradas, ...queriesFijas(p)];

  // Búsquedas de posicionamiento (top 10): la del nombre a secas mide si una
  // familia que ya los conoce los encuentra; la de "colegios privados en
  // <ciudad>" mide si los descubre quien todavía no sabe que existen.
  const queryNombre = p.institucion || null;
  const queryZona = ciudad ? `colegios privados en ${ciudad}` : null;

  const [resultadosPorQuery, resNombre, resZona, fotos] = await Promise.all([
    Promise.all(queries.map(async q => ({ query: q, resultados: await buscarBrave(braveKey, q) }))),
    queryNombre ? buscarBrave(braveKey, queryNombre, 10) : Promise.resolve([]),
    queryZona ? buscarBrave(braveKey, queryZona, 10) : Promise.resolve([]),
    p.institucion ? buscarFotosBrave(braveKey, `${p.institucion} colegio`) : Promise.resolve([]),
  ]);

  const posNombre = posicionDeSitio(resNombre, p.web);
  const posZona = posicionDeSitio(resZona, p.web);

  const lineasPos: string[] = [];
  if (queryNombre && p.web) {
    lineasPos.push(posNombre
      ? `- Al buscar "${queryNombre}": su sitio aparece en la posición ${posNombre} de los primeros 10 resultados.`
      : `- Al buscar "${queryNombre}": su sitio NO aparece en los primeros 10 resultados.`);
  } else {
    lineasPos.push('- No se pudo medir la búsqueda por nombre (falta el nombre de la institución o su sitio web).');
  }
  if (queryZona && p.web) {
    lineasPos.push(posZona
      ? `- Al buscar "${queryZona}": su sitio aparece en la posición ${posZona} de los primeros 10 resultados.`
      : `- Al buscar "${queryZona}": su sitio NO aparece en los primeros 10 resultados.`);
  } else if (!ciudad) {
    lineasPos.push('- No se pudo medir la búsqueda por zona (no se infirió la ciudad con confianza).');
  }

  // La búsqueda de zona también sirve de contexto: ahí se ven los colegios
  // competidores que SÍ aparecen cuando una familia busca en esa ciudad.
  if (queryZona && resZona.length) {
    resultadosPorQuery.push({ query: queryZona + ' (top 10, para ver competidores visibles)', resultados: resZona });
  }

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
Ciudad inferida: ${ciudad || '(no inferida)'}

Redes sociales detectadas en el sitio oficial:
${redesTexto}

Datos medidos de posicionamiento (repórtalos tal cual en la sección "Posicionamiento en buscadores"):
${lineasPos.join('\n')}

Resultados de búsqueda web:

${fuentesTexto}`;

  let dossier = await llamarDeepSeek(deepseekKey, { system: SYSTEM_DOSSIER, user, temperature: 0.3, model: 'deepseek-v4-pro' });

  // La sección de fotos se arma aquí (no en el LLM) para que las URLs sean
  // reales y no alucinadas — es el registro visual de cómo los encontramos.
  if (fotos.length) {
    const seccionFotos = '## Fotos relevantes\n' + fotos
      .map(f => `![${f.titulo}](${f.url})\n(Encontrada en: ${f.fuente})`)
      .join('\n');
    const marcaFuentes = '## Fuentes consultadas';
    dossier = dossier.includes(marcaFuentes)
      ? dossier.replace(marcaFuentes, seccionFotos + '\n\n' + marcaFuentes)
      : dossier + '\n\n' + seccionFotos;
  }

  return dossier;
}
