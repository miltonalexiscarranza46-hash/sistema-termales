const router = require('express').Router();
const { login } = require('../controllers/authController');
const { verificarToken } = require('../middleware/auth');

router.post('/login', login);
router.get('/yo', verificarToken, (req, res) => res.json({ ok: true, usuario: req.usuario }));

module.exports = router;