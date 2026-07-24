-- RLR
CREATE TABLE IF NOT EXISTS colaboradores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  correo TEXT NOT NULL,
  ics_url TEXT NOT NULL,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL
);

ALTER TABLE eventos_rayosx ADD COLUMN destinatario_email TEXT;
ALTER TABLE eventos_rayosx ADD COLUMN destinatario_nombre TEXT;
ALTER TABLE eventos_rayosx ADD COLUMN colaborador_id INTEGER;
