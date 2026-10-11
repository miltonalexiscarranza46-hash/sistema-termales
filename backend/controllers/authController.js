const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

exports.login = async (req, res) => {
  try {
    const { usuario, contrasena } = req.body;
    if (!usuario || !contrasena) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan datos' });
    }

    const r = await pool.query(
      `SELECT u.id, u.nombre, u.contrasena, r.nombre AS rol
       FROM usuarios u JOIN roles r ON r.id = u.rol_id
       WHERE u.usuario = $1 AND u.activo = TRUE`,
      [usuario.trim()]
    );
    const u = r.rows[0];

    if (!u || !(await bcrypt.compare(contrasena, u.contrasena))) {
      return res.status(401).json({ ok: false, mensaje: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: u.id, nombre: u.nombre, rol: u.rol },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({ ok: true, token, usuario: { id: u.id, nombre: u.nombre, rol: u.rol } });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });

  }
};