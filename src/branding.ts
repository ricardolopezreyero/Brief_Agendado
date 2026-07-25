// RLR
import { escapeHtml, LOGO_SUPERLEADS } from './markdown';

export { LOGO_SUPERLEADS };

export const ESTILOS_SUPERLEADS = `
  :root{
    --green:#56EF9F; --green-d:#2BC878;
    --navy-deep:#001240; --navy-mid:#001a5e; --navy:#002582;
    --blue:#0039C8; --blue-soft:#F4F7FF; --blue-softer:#EEF2FF;
    --border:#e0e8f8; --muted:#666; --dim:#aaa;
    --ease: cubic-bezier(.16,1,.3,1);
  }
  *{box-sizing:border-box;}
  body{margin:0;background:var(--blue-soft);font-family:"Plus Jakarta Sans",-apple-system,Segoe UI,Roboto,sans-serif;color:#1a1a1a;}
  header{background:var(--navy-deep);padding:28px 24px;position:relative;overflow:hidden;}
  header.compacto{padding:18px 24px;}
  header::before{content:"";position:absolute;right:-100px;top:-100px;width:320px;height:320px;border-radius:50%;background:rgba(86,239,159,.05);}
  .brand{display:flex;align-items:center;gap:10px;position:relative;}
  .brand img{width:150px;display:block;}
  .volver-header{position:absolute;top:32px;right:24px;color:#7a9fd4;font-size:13px;font-weight:600;text-decoration:none;}
  .volver-header:hover{color:#fff;}
  .hero-text{max-width:640px;margin:22px auto 0;position:relative;text-align:center;}
  .hero-text.ancho{max-width:900px;}
  .hero-text.compacto{margin-top:10px;text-align:left;max-width:none;}
  .hero-text .eyebrow{display:inline-flex;align-items:center;gap:7px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;padding:4px 12px;border-radius:20px;background:rgba(86,239,159,.1);color:var(--green);border:.5px solid rgba(86,239,159,.25);margin-bottom:14px;}
  .hero-text.compacto .eyebrow{margin-bottom:8px;}
  .hero-text h1{margin:0 0 10px;font-size:26px;font-weight:800;letter-spacing:-.6px;color:#fff;}
  .hero-text.compacto h1{margin:0 0 4px;font-size:22px;}
  .hero-text p{margin:0;font-size:14px;line-height:1.65;color:#7a9fd4;}
  .hero-text.compacto p{font-size:13px;}
  .hero-text p strong{color:var(--green);font-weight:700;}
  .hero-text a{color:var(--green);}
  .wrap{max-width:640px;margin:0 auto;padding:36px 20px 60px;}
  .wrap.ancho{max-width:none;padding:24px 32px 60px;}
`;

// Deja el <head> abierto a propósito: cada página agrega su <style> propio y
// cierra con </head><body> antes de continuar.
export function headAbiertoHtml(titulo: string): string {
  return `<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(titulo)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700&display=swap" rel="stylesheet">`;
}

export function heroHeader(opts: { eyebrow: string; titulo: string; subtitulo: string; ancho?: boolean; compacto?: boolean; volverHref?: string }): string {
  const volver = opts.volverHref ? `<a class="volver-header" href="${escapeHtml(opts.volverHref)}">← Volver</a>` : '';
  const clase = [opts.ancho ? 'ancho' : '', opts.compacto ? 'compacto' : ''].filter(Boolean).join(' ');
  return `<header${opts.compacto ? ' class="compacto"' : ''}>
    <div class="brand"><a href="https://superleads.mx" target="_blank" rel="noopener"><img src="${LOGO_SUPERLEADS}" alt="SuperLeads"></a></div>
    ${volver}
    <div class="hero-text${clase ? ' ' + clase : ''}">
      <div class="eyebrow"><span>●</span> ${escapeHtml(opts.eyebrow)}</div>
      <h1>${opts.titulo}</h1>
      <p>${opts.subtitulo}</p>
    </div>
  </header>`;
}
