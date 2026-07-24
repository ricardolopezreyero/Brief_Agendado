-- RLR
CREATE TABLE IF NOT EXISTS eventos_rayosx (
  uid TEXT PRIMARY KEY,
  summary TEXT NOT NULL,
  start_utc TEXT NOT NULL,
  institucion TEXT,
  web TEXT,
  representante_nombre TEXT,
  representante_telefono TEXT,
  representante_correo TEXT,
  representante_whatsapp TEXT,
  asesor_superleads TEXT,
  zoom_link TEXT,
  sl_comercial_link TEXT,
  raw_description TEXT NOT NULL,
  dossier_md TEXT,
  research_status TEXT NOT NULL DEFAULT 'pendiente',
  research_error TEXT,
  email_status TEXT NOT NULL DEFAULT 'pendiente',
  email_error TEXT,
  creado_en TEXT NOT NULL,
  investigado_en TEXT,
  enviado_en TEXT
);

CREATE INDEX IF NOT EXISTS idx_eventos_research_status ON eventos_rayosx(research_status);
CREATE INDEX IF NOT EXISTS idx_eventos_email_status ON eventos_rayosx(email_status);
CREATE INDEX IF NOT EXISTS idx_eventos_start_utc ON eventos_rayosx(start_utc);

CREATE TABLE IF NOT EXISTS logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nivel TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  uid TEXT,
  creado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_creado_en ON logs(creado_en);
