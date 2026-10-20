// backend/routes/inventario.js
const express = require('express');
const router = express.Router();

// AJUSTAR: copiar los require exactos que usa routes/gastos.js
const { verificarToken, permitirRoles } = require('../middleware/auth');
const ctrl = require('../controllers/inventarioController');

// Consulta: bodega y mesero
router.get('/productos', verificarToken, permitirRoles('bodega', 'mesero'), ctrl.listarProductos);

// Escritura: solo bodega
router.post('/productos', verificarToken, permitirRoles('bodega'), ctrl.crearProducto);
router.post('/movimientos', verificarToken, permitirRoles('bodega'), ctrl.registrarMovimiento);
router.get('/movimientos', verificarToken, permitirRoles('bodega'), ctrl.listarMovimientos);

module.exports = router;
