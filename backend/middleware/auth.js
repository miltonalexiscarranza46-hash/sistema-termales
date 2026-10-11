const jwt = require('jsonwebtoken');

exports.verificarToken = (req, res, next) => {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ ok: false, mensaje: 'No autorizado' });

  try {
    req.usuario = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ ok: false, mensaje: 'Sesión inválida o vencida' });
  }
};

exports.permitirRoles = (...roles) => (req, res, next) => {
  if (!roles.includes(req.usuario.rol)) {
    return res.status(403).json({ ok: false, mensaje: 'No tienes permiso' });
  }
  next();
};