const bcrypt = require('bcryptjs');
const pool = require('../config/db');

const REGEX_USUARIO = /^[a-z0-9._-]{3,50}$/;
// Candado: los cambios que afectan a administradores se hacen de uno en uno
const LOCK_USUARIOS = 7002;

async function otrosAdminsActivos(db, idExcluido) {
  const r = await db.query(
    `SELECT COUNT(*)::int AS n
     FROM usuarios u JOIN roles ro ON ro.id = u.rol_id
     WHERE ro.nombre = 'administrador' AND u.activo = TRUE AND u.id <> $1`,
    [idExcluido]
  );
  return r.rows[0].n;
}

exports.roles = async (req, res) => {
  try {
    const r = await pool.query('SELECT id, nombre FROM roles ORDER BY id');
    res.json({ ok: true, roles: r.rows });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.listar = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.nombre, u.usuario, u.rol_id, ro.nombre AS rol,
              u.activo, u.creado_en
       FROM usuarios u
       JOIN roles ro ON ro.id = u.rol_id
       ORDER BY u.activo DESC, ro.nombre, u.nombre`
    );
    res.json({
      ok: true,
      usuarios: r.rows.map((x) => ({ ...x, es_yo: x.id === req.usuario.id })),
    });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const nombre = (req.body.nombre || '').trim();
    const usuario = (req.body.usuario || '').trim().toLowerCase();
    const contrasena = req.body.contrasena;
    const rolId = Number(req.body.rol_id);

    if (!nombre || nombre.length > 100) {
      return res.status(400).json({ ok: false, mensaje: 'Escribe el nombre (máximo 100 caracteres)' });
    }
    if (!REGEX_USUARIO.test(usuario)) {
      return res.status(400).json({
        ok: false,
        mensaje: 'El usuario debe tener de 3 a 50 caracteres: minúsculas, números, punto, guion o guion bajo',
      });
    }
    if (typeof contrasena !== 'string' || contrasena.length < 6 || contrasena.length > 72) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener entre 6 y 72 caracteres' });
    }
    if (!Number.isInteger(rolId)) {
      return res.status(400).json({ ok: false, mensaje: 'Elige el rol' });
    }

    const rol = await pool.query('SELECT id FROM roles WHERE id = $1', [rolId]);
    if (!rol.rows[0]) {
      return res.status(400).json({ ok: false, mensaje: 'Rol inválido' });
    }

    const hash = await bcrypt.hash(contrasena, 10);

    try {
      const r = await pool.query(
        `INSERT INTO usuarios (nombre, usuario, contrasena, rol_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, nombre, usuario, rol_id, activo`,
        [nombre, usuario, hash, rolId]
      );
      res.status(201).json({ ok: true, mensaje: 'Usuario creado', usuario: r.rows[0] });
    } catch (e) {
      if (e.code === '23505') {
        return res.status(409).json({ ok: false, mensaje: 'Ese nombre de usuario ya existe' });
      }
      throw e;
    }
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.editar = async (req, res) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    const nombre = (req.body.nombre || '').trim();
    const rolId = Number(req.body.rol_id);

    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, mensaje: 'Id inválido' });
    }
    if (!nombre || nombre.length > 100) {
      return res.status(400).json({ ok: false, mensaje: 'Escribe el nombre (máximo 100 caracteres)' });
    }
    if (!Number.isInteger(rolId)) {
      return res.status(400).json({ ok: false, mensaje: 'Elige el rol' });
    }

    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_USUARIOS]);

    const u = await client.query(
      `SELECT u.id, u.rol_id, ro.nombre AS rol
       FROM usuarios u JOIN roles ro ON ro.id = u.rol_id
       WHERE u.id = $1`,
      [id]
    );
    if (!u.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    const nuevo = await client.query('SELECT nombre FROM roles WHERE id = $1', [rolId]);
    if (!nuevo.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(400).json({ ok: false, mensaje: 'Rol inválido' });
    }

    if (rolId !== u.rows[0].rol_id) {
      if (id === req.usuario.id) {
        await client.query('ROLLBACK');
        return res.status(409).json({ ok: false, mensaje: 'No puedes cambiar tu propio rol' });
      }
      if (u.rows[0].rol === 'administrador' && (await otrosAdminsActivos(client, id)) === 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ ok: false, mensaje: 'Debe quedar al menos un administrador activo' });
      }
    }

    await client.query('UPDATE usuarios SET nombre = $1, rol_id = $2 WHERE id = $3', [nombre, rolId, id]);
    await client.query('COMMIT');
    res.json({ ok: true, mensaje: 'Usuario actualizado' });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ ok: false, mensaje: e.message });
  } finally {
    client.release();
  }
};

exports.contrasena = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const contrasena = req.body.contrasena;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, mensaje: 'Id inválido' });
    }
    if (typeof contrasena !== 'string' || contrasena.length < 6 || contrasena.length > 72) {
      return res.status(400).json({ ok: false, mensaje: 'La contraseña debe tener entre 6 y 72 caracteres' });
    }

    const hash = await bcrypt.hash(contrasena, 10);
    const r = await pool.query('UPDATE usuarios SET contrasena = $1 WHERE id = $2 RETURNING id', [hash, id]);
    if (!r.rows[0]) {
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }
    res.json({ ok: true, mensaje: 'Contraseña actualizada' });
  } catch (e) {
    res.status(500).json({ ok: false, mensaje: e.message });
  }
};

exports.activo = async (req, res) => {
  const client = await pool.connect();
  try {
    const id = Number(req.params.id);
    const activo = req.body.activo;

    if (!Number.isInteger(id)) {
      return res.status(400).json({ ok: false, mensaje: 'Id inválido' });
    }
    if (typeof activo !== 'boolean') {
      return res.status(400).json({ ok: false, mensaje: 'Indica si la cuenta queda activa o no' });
    }

    await client.query('BEGIN');
    await client.query('SELECT pg_advisory_xact_lock($1)', [LOCK_USUARIOS]);

    const u = await client.query(
      `SELECT u.id, ro.nombre AS rol
       FROM usuarios u JOIN roles ro ON ro.id = u.rol_id
       WHERE u.id = $1`,
      [id]
    );
    if (!u.rows[0]) {
      await client.query('ROLLBACK');
      return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado' });
    }

    if (!activo) {
      if (id === req.usuario.id) {
        await client.query('ROLLBACK');
        return res.status(409).json({ ok: false, mensaje: 'No puedes desactivar tu propia cuenta' });
      }
      if (u.rows[0].rol === 'administrador' && (await otrosAdminsActivos(client, id)) === 0) {
        await client.query('ROLLBACK');
        return res.status(409).json({ ok: false, mensaje: 'Debe quedar al menos un administrador activo' });
      }
    }

    await client.query('UPDATE usuarios SET activo = $1 WHERE id = $2', [activo, id]);
    await client.query('COMMIT');
    res.json({ ok: true, mensaje: activo ? 'Cuenta activada' : 'Cuenta desactivada' });
  } catch (e) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    res.status(500).json({ ok: false, mensaje: e.message });
  } finally {
    client.release();
  }
};