const router = require('express').Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const c = require('../controllers/reportesController');

const empleados = ['recepcionista', 'masajista', 'mesero', 'bodega', 'cajero'];

router.use(verificarToken);

// Empleados
router.get('/hoy', permitirRoles(...empleados), c.hoy);
router.post('/', permitirRoles(...empleados), c.enviar);

// Administrador
router.get('/', permitirRoles('administrador'), c.listar);
router.get('/:id', permitirRoles('administrador'), c.ver);
router.patch('/:id/leido', permitirRoles('administrador'), c.marcarLeido);

module.exports = router;