-- 003: Caja (entregas de efectivo y cierre del dia)

CREATE TABLE IF NOT EXISTS entregas_caja (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  empleado_id INTEGER NOT NULL REFERENCES usuarios(id),
  monto NUMERIC(10,2) NOT NULL CHECK (monto >= 0),
  nota VARCHAR(200),
  recibido_por INTEGER NOT NULL REFERENCES usuarios(id),
  creado_en TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_entregas_caja_fecha
  ON entregas_caja (fecha, empleado_id);

CREATE TABLE IF NOT EXISTS cierres_caja (
  id SERIAL PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  esperado NUMERIC(10,2) NOT NULL,
  recibido NUMERIC(10,2) NOT NULL,
  diferencia NUMERIC(10,2) NOT NULL,
  nota VARCHAR(200),
  cerrado_por INTEGER NOT NULL REFERENCES usuarios(id),
  cerrado_en TIMESTAMP NOT NULL DEFAULT NOW()
);