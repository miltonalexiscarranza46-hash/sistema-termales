const router = require('express').Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const c = require('../controllers/gastosController');

router.use(verificarToken, permitirRoles('administrador'));

router.get('/catalogos', c.catalogos);
router.get('/', c.listar);
router.post('/', c.crear);
router.delete('/:id', c.eliminar);

module.exports = router;