// RLR
import { escapeHtml, LOGO_AZUL, LOGO_BLANCO } from './markdown';

export { LOGO_AZUL, LOGO_BLANCO };

// Los dos mensajes de marca que deben aparecer siempre: en el footer de
// cada página (mini sección) y, vía markdown.ts, al final de todo dossier
// generado (antes de la sección de fuentes). Un solo lugar para editarlos.
export const WHY_SUPERLEADS = 'Creemos que ningún alumno debería perder la oportunidad de estudiar en el colegio correcto por culpa de un mal proceso de admisión, y que los colegios deben ser rentables para poder cumplir su misión educativa.';
export const PROPOSITO_SL = 'Darle Poder a las escuelas para que inscriban fácilmente a millones de estudiantes.';

// Íconos SVG inline (16px, stroke:2, sin relleno) — la guía prohíbe emoji en
// piezas internas/documentos, así que el chrome de la app usa estos en vez
// de ✏️/👤/etc. Set mínimo: solo los que la app usa hoy.
function icono(paths: string): string {
  return `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
}
export const ICONOS = {
  historial: icono('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>'),
  manual: icono('<path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  conectar: icono('<path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>'),
  lapiz: icono('<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>'),
  descargar: icono('<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'),
  correo: icono('<path d="M22 6l-10 7L2 6"/><rect x="2" y="4" width="20" height="16" rx="2"/>'),
  contacto: icono('<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>'),
};

// Estilos del footer compartido — autocontenidos (traen sus propias
// variables) para poder incluirse solos en páginas que no cargan
// ESTILOS_SUPERLEADS completo.
export const ESTILOS_FOOTER = `
  :root{ --navy-deep:#001240; --green:#56EF9F; }
  .site-footer{background:var(--navy-deep);margin-top:48px;padding:32px 24px 22px;position:relative;overflow:hidden;}
  .site-footer::before{content:"";position:absolute;left:-80px;bottom:-80px;width:260px;height:260px;border-radius:50%;background:rgba(86,239,159,.04);}
  .footer-inner{max-width:900px;margin:0 auto;position:relative;}
  .footer-why{display:grid;grid-template-columns:1fr 1fr;gap:28px;padding-bottom:22px;border-bottom:.5px solid rgba(255,255,255,.12);margin-bottom:18px;}
  .footer-why-item .eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:4px 12px;border-radius:20px;background:rgba(86,239,159,.1);color:var(--green);border:.5px solid rgba(86,239,159,.25);margin-bottom:8px;}
  .footer-why-item p.txt{margin:0;font-size:12.5px;line-height:1.65;color:#7a9fd4;}
  .footer-bottom{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;}
  .footer-bottom img{width:110px;display:block;opacity:.9;}
  .footer-bottom p{margin:0;font-size:11px;color:#4a6aaa;}
  @media(max-width:600px){
    .footer-why{grid-template-columns:1fr;gap:18px;}
    .footer-bottom{flex-direction:column;align-items:flex-start;gap:10px;}
  }
  @media print{ .site-footer{display:none;} }
`;

// Tokens y componentes base — copiados literales de guia-estilos.superleads.mx
// (STYLE_GUIDE_SUPERLEADS.md, sección de tokens + componentes). Cualquier
// color/tamaño que no coincida con la guía oficial es un bug, no una opción.
export const ESTILOS_SUPERLEADS = `
  :root{
    --green:#56EF9F; --green-d:#2BC878;
    --navy:#002582; --navy-deep:#001240; --navy-mid:#001a5e;
    --blue:#0039C8; --blue-mid:#2A89FB; --blue-soft:#F4F7FF; --blue-softer:#EEF2FF;
    --ink:#1a1a1a; --border:#e0e8f8; --muted:#5b6478; --dim:#98a1b0;
    --ok:#0ca30c; --warn:#eb6834; --bad:#d03b3b; --destructive:#d92d43;
    --ease: cubic-bezier(.16,1,.3,1);
    --shadow-sm: 0 1px 2px rgba(0,37,130,.04);
    --shadow-card: 0 10px 32px rgba(0,37,130,.08);
    --shadow-btn: 0 10px 28px rgba(0,37,130,.22);
    --shadow-cta: 0 10px 28px rgba(86,239,159,.28);
  }
  *{box-sizing:border-box;}
  body{margin:0;background:var(--blue-soft);font-family:"Plus Jakarta Sans",-apple-system,Segoe UI,Roboto,sans-serif;color:var(--ink);font-size:14px;line-height:1.78;-webkit-font-smoothing:antialiased;}

  /* ── Botones (guía §Componentes) ── */
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;padding:12px 22px;border-radius:8px;border:none;font-family:inherit;font-size:13.5px;font-weight:700;cursor:pointer;text-decoration:none;transition:transform .2s var(--ease),box-shadow .2s var(--ease),background-color .2s;}
  .btn-primary{background:var(--green);color:var(--navy);}
  .btn-primary:hover{transform:translateY(-2px);box-shadow:var(--shadow-cta);}
  .btn-navy{background:var(--navy);color:#fff;}
  .btn-navy:hover{background:var(--navy-mid);transform:translateY(-2px);box-shadow:var(--shadow-btn);}
  .btn-outline{background:#fff;color:var(--navy);border:.5px solid var(--border);}
  .btn-outline:hover{background:var(--navy);color:#fff;border-color:var(--navy);}
  .btn-ghost{background:transparent;color:var(--muted);}
  .btn-ghost:hover{background:rgba(0,37,130,.05);color:var(--navy);}
  .btn:disabled{opacity:.5;cursor:not-allowed;transform:none;box-shadow:none;}
  .btn:active{transform:translateY(0);box-shadow:none;}
  .btn svg{flex-shrink:0;}

  /* ── Badges / eyebrow ── */
  .badge-dark{display:inline-flex;align-items:center;gap:7px;padding:4px 12px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;background:rgba(86,239,159,.1);color:var(--green);border:.5px solid rgba(86,239,159,.25);}

  /* ── App shell: sidebar de aplicación (guía §10.2) ── */
  .app-layout{display:flex;min-height:100vh;align-items:stretch;}
  .sidebar{width:288px;flex-shrink:0;display:flex;flex-direction:column;gap:20px;background:var(--navy-deep);color:#fff;padding:24px 16px;position:sticky;top:0;align-self:flex-start;height:100vh;overflow-y:auto;border-right:.5px solid rgba(86,239,159,.1);}
  .sidebar-logo{padding:0 10px;}
  .sidebar-logo img{height:32px;width:auto;display:block;}
  .sidebar-badge{padding:0 10px;margin-top:12px;}
  .sidebar-cta{width:100%;padding:12px;}
  .sidebar-nav{display:flex;flex-direction:column;gap:4px;flex:1;}
  .sidebar-item{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;border-radius:12px;border:.5px solid transparent;text-decoration:none;transition:background-color .2s;}
  .sidebar-item:hover{background:rgba(255,255,255,.05);}
  .sidebar-item.activo{background:rgba(255,255,255,.07);border-color:rgba(86,239,159,.25);}
  .sidebar-item .icono-item{width:36px;height:36px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.06);color:rgba(255,255,255,.5);transition:background-color .2s,color .2s;}
  .sidebar-item.activo .icono-item{background:var(--green);color:var(--navy);}
  .sidebar-item .titulo{font-size:14px;font-weight:700;color:rgba(255,255,255,.6);line-height:1.3;}
  .sidebar-item.activo .titulo,.sidebar-item:hover .titulo{color:#fff;}
  .sidebar-item .desc{font-size:11px;line-height:1.35;color:#4a6aaa;margin-top:2px;}
  .sidebar-footer{padding:12px 10px 0;border-top:.5px solid rgba(255,255,255,.1);font-size:10px;color:rgba(255,255,255,.2);}

  .app-main{flex:1;min-width:0;padding:40px 48px 64px;max-width:1100px;}
  .app-main.ancho{max-width:none;}
  .narrow{max-width:640px;}

  .mobile-topbar{display:none;}
  @media (max-width:1023px){
    .sidebar{display:none;}
    .mobile-topbar{display:flex;align-items:center;justify-content:space-between;gap:12px;background:var(--navy-deep);padding:12px 18px;position:sticky;top:0;z-index:40;}
    .mobile-topbar img{height:22px;display:block;}
    .mobile-topbar nav{display:flex;gap:16px;overflow-x:auto;}
    .mobile-topbar nav a{color:rgba(255,255,255,.55);font-size:11px;font-weight:700;text-decoration:none;white-space:nowrap;}
    .mobile-topbar nav a.activo{color:var(--green);}
    .app-main{padding:24px 18px 48px;}
  }
  @media print{ .sidebar,.mobile-topbar{display:none !important;} .app-main{padding:0;max-width:none;} }

  /* ── Encabezado de página (dentro del área de contenido, no del sidebar) ── */
  .page-header{margin-bottom:32px;}
  .page-eyebrow{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
  .page-eyebrow::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--blue);flex-shrink:0;}
  .page-eyebrow span{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.3px;color:var(--blue);}
  .page-header h1{margin:0 0 8px;font-size:30px;font-weight:800;letter-spacing:-.7px;color:var(--navy);line-height:1.15;}
  .page-header p{margin:0;font-size:14px;line-height:1.7;color:var(--muted);max-width:640px;}
  .page-header p a{color:var(--blue);}
  @media(max-width:600px){ .page-header h1{font-size:24px;} }

  ${ESTILOS_FOOTER}
`;

// Deja el <head> abierto a propósito: cada página agrega su <style> propio y
// cierra con </head><body> antes de continuar.
export function headAbiertoHtml(titulo: string): string {
  return `<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700&display=swap" rel="stylesheet">`;
}

type ItemSidebar = 'historial' | 'manual' | 'conectar';

const SIDEBAR_ITEMS: Array<{ key: ItemSidebar; href: string; icono: string; titulo: string; desc: string }> = [
  { key: 'historial', href: '/', icono: ICONOS.historial, titulo: 'Historial', desc: 'Todas las citas Rayos X detectadas' },
  { key: 'manual', href: '/manual', icono: ICONOS.manual, titulo: 'Brief Manual', desc: 'Generar un brief sin esperar al calendario' },
  { key: 'conectar', href: '/conectar', icono: ICONOS.conectar, titulo: 'Conectar Calendario', desc: 'Sincroniza tu calendario automáticamente' },
];

// El sidebar es "el patrón para herramientas internas" (guía §10.2): logo +
// badge arriba, CTA principal (nunca al fondo), nav con descripción bajo
// cada título, copyright al pie. En <1024px se oculta (regla explícita de la
// guía) y se reemplaza por una barra superior delgada para no dejar un
// callejón sin salida — la guía marca ese hueco como un anti-patrón conocido.
function sidebarHtml(activo: ItemSidebar): string {
  const items = SIDEBAR_ITEMS.map(it => `
      <a class="sidebar-item${it.key === activo ? ' activo' : ''}" href="${it.href}">
        <span class="icono-item">${it.icono}</span>
        <span><span class="titulo">${it.titulo}</span><br><span class="desc">${it.desc}</span></span>
      </a>`).join('');

  const mobileNav = SIDEBAR_ITEMS.map(it =>
    `<a href="${it.href}"${it.key === activo ? ' class="activo"' : ''}>${it.titulo}</a>`).join('');

  return `<div class="mobile-topbar">
    <a href="/"><img src="${LOGO_BLANCO}" alt="SuperLeads"></a>
    <nav>${mobileNav}</nav>
  </div>
  <aside class="sidebar">
    <div>
      <div class="sidebar-logo"><a href="https://superleads.mx" target="_blank" rel="noopener"><img src="${LOGO_BLANCO}" alt="SuperLeads"></a></div>
      <div class="sidebar-badge"><span class="badge-dark"><span style="width:6px;height:6px;border-radius:50%;background:var(--green);display:inline-block"></span>Brief Agendado</span></div>
    </div>
    <a class="btn btn-primary sidebar-cta" href="/manual">＋ Generar Brief Manual</a>
    <nav class="sidebar-nav">${items}</nav>
    <div class="sidebar-footer">© ${new Date().getFullYear()} SuperLeads · México y LATAM</div>
  </aside>`;
}

// Abre el layout de dos columnas (sidebar + contenido) — cada página cierra
// con APP_SHELL_CERRAR. Uso: `${appShellAbrir('historial')}${pageHeader(...)}...contenido...${APP_SHELL_CERRAR}`.
export function appShellAbrir(activo: ItemSidebar, opts?: { ancho?: boolean }): string {
  return `<div class="app-layout">${sidebarHtml(activo)}<main class="app-main${opts?.ancho ? ' ancho' : ''}">`;
}
export const APP_SHELL_CERRAR = `</main></div>`;

export function pageHeader(eyebrow: string, titulo: string, subtitulo: string): string {
  return `<div class="page-header">
    <div class="page-eyebrow"><span>${escapeHtml(eyebrow)}</span></div>
    <h1>${titulo}</h1>
    <p>${subtitulo}</p>
  </div>`;
}

// Footer compartido por dashboard, /conectar y el viewer del dossier. La
// mini sección "Why SuperLeads" / "Propósito SL" va SIEMPRE arriba del
// footer, antes de la franja de marca — es la misma pareja de mensajes que
// markdown.ts inyecta al final de cada dossier (antes de las fuentes).
export function footerHtml(): string {
  return `<footer class="site-footer">
    <div class="footer-inner">
      <div class="footer-why">
        <div class="footer-why-item">
          <div class="eyebrow" style="display:flex;align-items:center;gap:7px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--green);margin-bottom:8px;"><span>●</span> Why SuperLeads</div>
          <p class="txt">${escapeHtml(WHY_SUPERLEADS)}</p>
        </div>
        <div class="footer-why-item">
          <div class="eyebrow" style="display:flex;align-items:center;gap:7px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--green);margin-bottom:8px;"><span>●</span> Propósito SL</div>
          <p class="txt">${escapeHtml(PROPOSITO_SL)}</p>
        </div>
      </div>
      <div class="footer-bottom">
        <a href="https://superleads.mx" target="_blank" rel="noopener"><img src="${LOGO_BLANCO}" alt="SuperLeads"></a>
        <p>© ${new Date().getFullYear()} SuperLeads · Brief Agendado</p>
      </div>
    </div>
  </footer>`;
}
