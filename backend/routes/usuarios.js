const router = require('express').Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const c = require('../controllers/usuariosController');

router.use(verificarToken, permitirRoles('administrador'));

router.get('/roles', c.roles);
router.get('/', c.listar);
router.post('/', c.crear);
router.patch('/:id', c.editar);
router.patch('/:id/contrasena', c.contrasena);
router.patch('/:id/activo', c.activo);

module.exports = router;