-- RLR
-- Estado visual de la cita en el dashboard: NULL = automático (verde si es
-- futura, rojo si ya pasó), 'verde'/'rojo' = fijado a mano por el usuario.
ALTER TABLE eventos_rayosx ADD COLUMN estado_override TEXT;
