require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const usuarios = [
  { nombre: 'Cajero Prueba',        usuario: 'cajero',        rol: 'cajero' },
  { nombre: 'Mesero Prueba',        usuario: 'mesero',        rol: 'mesero' },
  { nombre: 'Recepcionista Prueba', usuario: 'recepcion',     rol: 'recepcionista' },
  { nombre: 'Masajista Prueba',     usuario: 'masajista',     rol: 'masajista' },
  { nombre: 'Bodega Prueba',        usuario: 'bodega',        rol: 'bodega' },
];

(async () => {
  try {
    const hash = await bcrypt.hash('1234', 10);
    for (const u of usuarios) {
      await pool.query(
        `INSERT INTO usuarios (nombre, usuario, contrasena, rol_id)
         SELECT $1, $2, $3, id FROM roles WHERE nombre = $4
         ON CONFLICT (usuario) DO UPDATE
           SET contrasena = EXCLUDED.contrasena, rol_id = EXCLUDED.rol_id`,
        [u.nombre, u.usuario, hash, u.rol]
      );
      console.log('Listo:', u.usuario, '->', u.rol);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
})();