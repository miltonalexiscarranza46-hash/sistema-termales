// backend/routes/bar.js
const express = require('express');
const router = express.Router();

// AJUSTAR: copiar los require exactos que usa routes/gastos.js
const { verificarToken, permitirRoles } = require('../middleware/auth');
const ctrl = require('../controllers/barController');

// Todo el módulo es solo del mesero (el administrador no opera, solo ve resúmenes)
router.use(verificarToken, permitirRoles('mesero'));

router.get('/pedidos', ctrl.listarPedidos);
router.post('/pedidos', ctrl.abrirPedido);
router.get('/pedidos/:id', ctrl.obtenerPedido);
router.post('/pedidos/:id/items', ctrl.agregarItem);
router.delete('/pedidos/:id/items/:itemId', ctrl.quitarItem);
router.post('/pedidos/:id/cobrar', ctrl.cobrarPedido);

module.exports = router;