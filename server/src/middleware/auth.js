const jwt = require('jsonwebtoken');
const { Usuario } = require('../models');

const verificarToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ mensaje: 'Token no proporcionado' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const usuario = await Usuario.findByPk(decoded.id);
    if (!usuario || !usuario.activo) {
      return res.status(401).json({ mensaje: 'Token inválido o usuario inactivo' });
    }

    req.usuario = usuario;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ mensaje: 'Token expirado' });
    }
    return res.status(401).json({ mensaje: 'Token inválido' });
  }
};

const esAdmin = (req, res, next) => {
  if (req.usuario.rol !== 'admin') {
    return res.status(403).json({ mensaje: 'Acceso denegado. Se requiere rol de administrador.' });
  }
  next();
};

const esAdminOPropietario = (req, res, next) => {
  if (req.usuario.rol === 'admin') return next();
  if (req.params.usuarioId && parseInt(req.params.usuarioId) === req.usuario.id) return next();
  return res.status(403).json({ mensaje: 'Acceso denegado.' });
};

module.exports = { verificarToken, esAdmin, esAdminOPropietario };
