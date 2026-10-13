const router = require('express').Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const c = require('../controllers/reservasController');

router.use(verificarToken, permitirRoles('administrador', 'cajero'));

router.get('/cabanas', c.listarCabanas);
router.get('/disponibles', c.disponibles);
router.get('/', c.listar);
router.post('/', c.crear);
router.patch('/:id/cancelar', c.cancelar);

module.exports = router;