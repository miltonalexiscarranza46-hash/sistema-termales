const router = require('express').Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const c = require('../controllers/barController');

// Solo el mesero opera; el administrador no entra a este módulo
router.use(verificarToken, permitirRoles('mesero'));

router.get('/catalogos', c.catalogos);
router.get('/productos', c.productos);
router.get('/resumen', c.miResumen);

router.get('/pedidos', c.listarPedidos);
router.post('/pedidos', c.abrirPedido);
router.get('/pedidos/:id', c.verPedido);
router.post('/pedidos/:id/items', c.agregarItem);
router.patch('/pedidos/:id/items/:productoId', c.cambiarCantidad);
router.post('/pedidos/:id/cobrar', c.cobrar);
router.post('/pedidos/:id/cancelar', c.cancelar);

module.exports = router;