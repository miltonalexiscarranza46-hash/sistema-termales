const router = require('express').Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const c = require('../controllers/masajesController');

router.use(verificarToken, permitirRoles('masajista'));

router.get('/servicios', c.listarServicios);
router.get('/masajistas', c.listarMasajistas);
router.get('/disponibles', c.disponibles);
router.get('/citas', c.listarCitas);
router.post('/citas', c.crearCita);
router.patch('/citas/:id/cobrar', c.cobrar);
router.patch('/citas/:id/cancelar', c.cancelar);

module.exports = router;