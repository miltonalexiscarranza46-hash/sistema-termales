-- Roles nuevos (Paso A)
INSERT INTO roles (nombre)
VALUES ('recepcionista'), ('masajista'), ('bodega')
ON CONFLICT (nombre) DO NOTHING;

-- Área nueva, para reportes y gastos por área
INSERT INTO areas (nombre) VALUES ('masajes')
ON CONFLICT (nombre) DO NOTHING;

-- Catálogo de servicios de masaje
CREATE TABLE IF NOT EXISTS servicios_masaje (
  id           SERIAL PRIMARY KEY,
  nombre       VARCHAR(80)  NOT NULL UNIQUE,
  duracion_min INTEGER      NOT NULL CHECK (duracion_min > 0),
  precio       NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  activo       BOOLEAN      NOT NULL DEFAULT TRUE
);

-- Citas: se agenda con hora y luego se cobra
CREATE TABLE IF NOT EXISTS citas_masaje (
  id           SERIAL PRIMARY KEY,
  cliente_id   INTEGER NOT NULL REFERENCES clientes(id),
  servicio_id  INTEGER NOT NULL REFERENCES servicios_masaje(id),
  masajista_id INTEGER NOT NULL REFERENCES usuarios(id),
  inicio       TIMESTAMP NOT NULL,
  fin          TIMESTAMP NOT NULL,
  precio       NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
  estado       VARCHAR(15) NOT NULL DEFAULT 'agendada'
               CHECK (estado IN ('agendada', 'cobrada', 'cancelada')),
  cobrado_en   TIMESTAMP,
  creado_en    TIMESTAMP NOT NULL DEFAULT now(),
  CHECK (fin > inicio)
);

CREATE INDEX IF NOT EXISTS idx_citas_masajista_inicio
  ON citas_masaje (masajista_id, inicio);

-- Servicios de EJEMPLO (reemplazar por los reales)
INSERT INTO servicios_masaje (nombre, duracion_min, precio) VALUES
  ('Masaje relajante',      60, 25.00),
  ('Masaje descontracturante', 60, 30.00),
  ('Piedras calientes',     90, 40.00)
ON CONFLICT (nombre) DO NOTHING;