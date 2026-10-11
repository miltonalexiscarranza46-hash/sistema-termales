require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

(async () => {
  try {
    const hash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO usuarios (nombre, usuario, contrasena, rol_id)
       VALUES ('Administrador', 'admin', $1, 1)
       ON CONFLICT (usuario) DO UPDATE SET contrasena = EXCLUDED.contrasena`,
      [hash]
    );
    console.log('Usuario admin listo (contraseña: admin123)');
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();