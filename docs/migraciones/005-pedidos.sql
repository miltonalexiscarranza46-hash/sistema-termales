-- =====================================================
-- 005-pedidos.sql
-- Restaurante y bar: cobro, método de pago y estados.
-- Nota: no existe la 002. Ese número se reservó para pedidos
-- pero no se escribió; 003 y 004 ya estaban aplicadas, por eso
-- esta migración lleva el 005. Orden de ejecución: 001, 003, 004, 005.
-- Se puede ejecutar más de una vez sin romper nada.
-- Si algo falla, no se aplica nada (todo va en una transacción).
-- =====================================================

BEGIN;

-- Quién cobró, cómo pagó y cuándo
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS cobrado_por INT REFERENCES usuarios(id);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS metodo_pago  VARCHAR(20);
ALTER TABLE pedidos ADD COLUMN IF NOT EXISTS fecha_pago   TIMESTAMP;

-- Reglas de integridad
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_estado_chk') THEN
    ALTER TABLE pedidos ADD CONSTRAINT pedidos_estado_chk
      CHECK (estado IN ('abierto', 'cobrado', 'cancelado'));
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_metodo_pago_chk') THEN
    ALTER TABLE pedidos ADD CONSTRAINT pedidos_metodo_pago_chk
      CHECK (metodo_pago IS NULL OR metodo_pago IN ('efectivo', 'tarjeta', 'transferencia'));
  END IF;

  -- Un pedido cobrado siempre tiene quién cobró, método y fecha; los demás no
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pedidos_cobro_coherente_chk') THEN
    ALTER TABLE pedidos ADD CONSTRAINT pedidos_cobro_coherente_chk
      CHECK (
        (estado = 'cobrado'

           AND cobrado_por IS NOT NULL AND metodo_pago IS NOT NULL AND fecha_pago IS NOT NULL)
        OR
        (estado <> 'cobrado'
           AND cobrado_por IS NULL AND metodo_pago IS NULL AND fecha_pago IS NULL)
      );
  END IF;
END $$;

-- Un producto aparece una sola vez por pedido (agregar de nuevo suma la cantidad)
CREATE UNIQUE INDEX IF NOT EXISTS uq_detalle_pedido_producto
  ON detalle_pedido (pedido_id, producto_id);

-- Índices para las consultas del mesero, Caja y Resumen
CREATE INDEX IF NOT EXISTS idx_pedidos_mesero_estado ON pedidos (mesero_id, estado);
CREATE INDEX IF NOT EXISTS idx_pedidos_fecha_pago ON pedidos (fecha_pago) WHERE estado = 'cobrado';
CREATE INDEX IF NOT EXISTS idx_detalle_pedido_pedido ON detalle_pedido (pedido_id);

COMMIT;

-- Para deshacer (solo si hace falta, ejecutar aparte):
-- ALTER TABLE pedidos DROP CONSTRAINT IF EXISTS pedidos_cobro_coherente_chk,
--   DROP CONSTRAINT IF EXISTS pedidos_metodo_pago_chk, DROP CONSTRAINT IF EXISTS pedidos_estado_chk,
--   DROP COLUMN IF EXISTS cobrado_por, DROP COLUMN IF EXISTS metodo_pago, DROP COLUMN IF EXISTS fecha_pago;
-- DROP INDEX IF EXISTS uq_detalle_pedido_producto, idx_pedidos_mesero_estado,
--   idx_pedidos_fecha_pago, idx_detalle_pedido_pedido;