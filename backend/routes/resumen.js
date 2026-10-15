const router = require('express').Router();
const { verificarToken, permitirRoles } = require('../middleware/auth');
const c = require('../controllers/resumenController');

router.use(verificarToken, permitirRoles('administrador'));

router.get('/dia', c.dia);

module.exports = router;