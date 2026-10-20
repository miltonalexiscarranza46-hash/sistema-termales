-- 004: Reportes diarios de los empleados

CREATE TABLE IF NOT EXISTS reportes (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  usuario_id INTEGER NOT NULL REFERENCES usuarios(id),
  resumen JSONB NOT NULL DEFAULT '{}'::jsonb,
  observaciones VARCHAR(1000),
  leido BOOLEAN NOT NULL DEFAULT FALSE,
  leido_por INTEGER REFERENCES usuarios(id),
  leido_en TIMESTAMP,
  creado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  actualizado_en TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (fecha, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_reportes_fecha
  ON reportes (fecha);
