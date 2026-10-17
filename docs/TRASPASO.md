# Traspaso: tareas del compañero

Proyecto: Sistema Termales Santa Teresa.
Antes de empezar, sigue `docs/INSTALACION.md`.

## 1. Qué te toca

| Módulo | Rol que lo usa | Rama sugerida |
|---|---|---|
| Inventario | bodega (opera), mesero (solo consulta) | `inventario` |
| Restaurante y bar | mesero | `restaurante` |

Milton hace **Caja**. El administrador no opera nada: solo ve resúmenes.

## 2. Primeros pasos

1. Instalar y levantar el proyecto (`INSTALACION.md`).
2. Entrar con los usuarios de prueba (contraseña `1234`): `bodega`, `mesero`, `recepcion`, `masajista`, `cajero`. El usuario administrador te lo da Milton.
3. Leer un módulo terminado como modelo: **Gastos** o **Masajes** (controller, route, JS y CSS).
4. Ver las tablas reales antes de escribir código: en psql, `\dt` y `\d nombre_tabla`. Usa los nombres reales de la base, no los de este documento.

## 3. Reglas obligatorias

- El **servidor** valida el rol en cada ruta (`verificarToken` + `permitirRoles`). Ocultar botones no es seguridad.
- El **servidor** calcula precios y totales. El navegador nunca manda montos.
- Operaciones que tocan stock o dinero van en **transacción** con `SELECT ... FOR UPDATE`.
- Nunca subir `.env`.
- Una rama por módulo. Se hace PR, se **fusiona primero en GitHub** y después `git pull`. No hacer commit directo en `main`.
- Cambios de base de datos: archivo numerado en `docs/migraciones/`.
  - `002-pedidos.sql`: tuyo (Restaurante y bar).
  - `003-caja.sql`: de Milton.
  - `004` en adelante: quien lo necesite avisa al otro.

## 4. Patrón fijo de cada módulo (lista de control)

1. `backend/controllers/xController.js`
2. `backend/routes/x.js` con `verificarToken` y `permitirRoles(...)`
3. Una línea en `backend/server.js`: `app.use('/api/x', require('./routes/x'));`
4. `frontend/js/modulos/x.js` que expone `cargarX(area)`
5. `frontend/css/modulos/x.css`
6. `<link>` y `<script>` en `frontend/pages/dashboard.html` (el script del módulo va antes de `dashboard.js`)
7. `cargar: cargarX` en el arreglo `modulos` de `frontend/js/dashboard.js`
8. Probar primero el backend en PowerShell y luego la pantalla.

## 5. Módulo Inventario

**Permisos:** `bodega` registra productos y movimientos; `mesero` solo consulta. El administrador no entra.

**Reglas:**
- El stock nunca puede quedar negativo. Si una salida deja stock menor a 0, responder **409** con mensaje claro.
- Cada entrada, salida o ajuste se guarda como movimiento (quién, cuándo, cantidad, motivo).
- El stock se calcula y actualiza en el servidor, dentro de una transacción.

**Rutas propuestas:**

| Método | Ruta | Quién |
|---|---|---|
| GET | `/api/inventario/productos` | bodega, mesero |
| POST | `/api/inventario/productos` | bodega |
| POST | `/api/inventario/movimientos` | bodega |
| GET | `/api/inventario/movimientos` | bodega |

**Pantalla:** tabla de productos con stock y alerta de stock bajo; formulario de movimiento (solo bodega).

## 6. Módulo Restaurante y bar

**Flujo:** el mesero abre un pedido, agrega productos (el precio sale de la base), y al cobrar el pedido queda pagado, descuenta stock y suma al día del mesero.

**Reglas:**
- Cobrar y descontar stock ocurre en una sola transacción. Sin stock suficiente: **409**.
- El mesero solo ve y modifica sus propios pedidos.
- Un pedido pagado no se edita.

**Migración `002-pedidos.sql`:** agregar a `pedidos` (revisa antes cuáles ya existen): `cobrado_por`, `metodo_pago`, `fecha_pago`, `entregado_caja` (boolean, por defecto false) y un estado de cuenta.

**Después de terminar:** el Resumen del administrador (`resumenController.js`) debe sumar los pedidos pagados por empleado. Coordina ese cambio con Milton, porque es un archivo compartido.

## 7. Cuándo se considera terminado

- Backend probado en PowerShell con éxito y con errores (403 de otro rol, 409 de stock, 400 de datos inválidos).
- Pantalla probada con el usuario real del rol.
- PR fusionado en GitHub y `main` actualizado.
- Sin datos de prueba ni contraseñas reales en lo que se sube.

## 8. Cuando algo falle

Manda el **mensaje de error completo**, el comando que ejecutaste y en qué paso quedaste.