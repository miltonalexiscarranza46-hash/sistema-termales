const router = require('express').Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const c = require('../controllers/accesosController');

router.use(verificarToken, permitirRoles('administrador', 'cajero'));

router.get('/tipos', c.listarTipos);
router.get('/hoy', c.hoy);
router.post('/', c.registrar);

module.exports = router;