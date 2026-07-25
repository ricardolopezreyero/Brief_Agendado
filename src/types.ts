// RLR
export interface Env {
  DB: D1Database;
  DEEPSEEK_API_KEY: string;
  BRAVE_API_KEY: string;
  RESEND_API_KEY: string;
  CALENDAR_ICS_URL: string;
  BRIEF_TO_EMAIL?: string; // opcional, default Ricardo@SuperLeads.mx
  CONNECT_CODE: string; // código compartido que deben dar los comerciales para conectar su calendario
}

export interface EventoICS {
  uid: string;
  summary: string;
  startUtc: string; // ISO
  descriptionRaw: string;
}

export interface Colaborador {
  id: number;
  nombre: string;
  correo: string;
  ics_url: string;
  activo: number;
  creado_en: string;
}

export interface FuenteCalendario {
  colaboradorId: number | null; // null == el calendario principal (secret CALENDAR_ICS_URL)
  nombre: string;
  correo: string;
  icsUrl: string;
}

export interface ProspectoExtraido {
  institucion: string;
  web: string;
  representante_nombre: string;
  representante_telefono: string;
  representante_correo: string;
  representante_whatsapp: string;
  asesor_superleads: string;
  zoom_link: string;
  sl_comercial_link: string;
}

export interface EventoRecord {
  uid: string;
  summary: string;
  start_utc: string;
  institucion: string | null;
  web: string | null;
  representante_nombre: string | null;
  representante_telefono: string | null;
  representante_correo: string | null;
  representante_whatsapp: string | null;
  asesor_superleads: string | null;
  zoom_link: string | null;
  sl_comercial_link: string | null;
  raw_description: string;
  destinatario_email: string | null;
  destinatario_nombre: string | null;
  colaborador_id: number | null;
  dossier_md: string | null;
  research_status: 'pendiente' | 'manual' | 'listo' | 'error';
  research_error: string | null;
  email_status: 'pendiente' | 'enviado' | 'error' | 'sin_dossier';
  email_error: string | null;
  creado_en: string;
  investigado_en: string | null;
  enviado_en: string | null;
}

export interface FuenteResultado {
  titulo: string;
  url: string;
  snippet: string;
}
