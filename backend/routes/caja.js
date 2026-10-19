const router = require('express').Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const c = require('../controllers/cajaController');

router.use(verificarToken, permitirRoles('cajero'));

router.get('/dia', c.dia);
router.post('/entregas', c.entregar);
router.delete('/entregas/:id', c.eliminarEntrega);
router.post('/cierre', c.cerrar);

module.exports = router;