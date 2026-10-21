const router = require('express').Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const c = require('../controllers/inventarioController');

router.use(verificarToken);

// Consultar: bodega y meseros
router.get('/productos', permitirRoles('bodega', 'mesero'), c.listarProductos);

// Operar: solo bodega
router.get('/catalogos', permitirRoles('bodega'), c.catalogos);
router.post('/productos', permitirRoles('bodega'), c.crearProducto);
router.put('/productos/:id', permitirRoles('bodega'), c.actualizarProducto);   // <-- NUEVA: Actualizar producto
router.delete('/productos/:id', permitirRoles('bodega'), c.eliminarProducto); // <-- NUEVA: Desactivar/Eliminar producto

router.post('/movimientos', permitirRoles('bodega'), c.registrarMovimiento);
router.get('/movimientos', permitirRoles('bodega'), c.listarMovimientos);

module.exports = router;
