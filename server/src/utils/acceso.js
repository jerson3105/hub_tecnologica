const { Op } = require('sequelize');
const { Integrante, Emprendimiento, Sesion, SesionPrograma } = require('../models');

const esAdmin = (usuario) => usuario?.rol === 'admin';

// IDs de los emprendimientos a los que pertenece el usuario
const emprendimientoIdsDeUsuario = async (usuarioId) => {
  const integrantes = await Integrante.findAll({
    where: { usuario_id: usuarioId },
    attributes: ['emprendimiento_id']
  });
  return integrantes.map(i => i.emprendimiento_id);
};

// IDs de los programas de los emprendimientos del usuario
const programaIdsDeUsuario = async (usuarioId) => {
  const integrantes = await Integrante.findAll({
    where: { usuario_id: usuarioId },
    include: [{ model: Emprendimiento, as: 'emprendimiento', attributes: ['programa_id'] }]
  });
  return [...new Set(integrantes.map(i => i.emprendimiento?.programa_id).filter(Boolean))];
};

// IDs de las sesiones de esos programas (vínculo SesionPrograma o programa_id legacy)
const sesionIdsDeProgramas = async (programaIds) => {
  if (programaIds.length === 0) return [];
  const [vinculos, legacy] = await Promise.all([
    SesionPrograma.findAll({ where: { programa_id: { [Op.in]: programaIds } }, attributes: ['sesion_id'] }),
    Sesion.findAll({ where: { programa_id: { [Op.in]: programaIds } }, attributes: ['id'] })
  ]);
  return [...new Set([...vinculos.map(v => v.sesion_id), ...legacy.map(s => s.id)])];
};

// Admin o integrante del emprendimiento
const puedeAccederEmprendimiento = async (usuario, emprendimientoId) => {
  if (esAdmin(usuario)) return true;
  if (!emprendimientoId) return false;
  const integrante = await Integrante.findOne({
    where: { emprendimiento_id: emprendimientoId, usuario_id: usuario.id },
    attributes: ['id']
  });
  return !!integrante;
};

// Admin o integrante de un emprendimiento de alguno de los programas de la sesión
const puedeAccederSesion = async (usuario, sesionId) => {
  if (esAdmin(usuario)) return true;
  if (!sesionId) return false;

  const programaIds = await programaIdsDeUsuario(usuario.id);
  if (programaIds.length === 0) return false;

  const vinculo = await SesionPrograma.findOne({
    where: { sesion_id: sesionId, programa_id: { [Op.in]: programaIds } },
    attributes: ['sesion_id']
  });
  if (vinculo) return true;

  // Sesiones legacy con programa_id directo
  const sesion = await Sesion.findByPk(sesionId, { attributes: ['programa_id'] });
  return !!sesion && programaIds.includes(sesion.programa_id);
};

const denegar = (res, mensaje = 'No tienes acceso a este recurso') =>
  res.status(403).json({ mensaje });

const esUrlHttp = (valor) => {
  if (typeof valor !== 'string') return false;
  try {
    const url = new URL(valor.trim());
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
};

module.exports = {
  esAdmin,
  emprendimientoIdsDeUsuario,
  programaIdsDeUsuario,
  sesionIdsDeProgramas,
  puedeAccederEmprendimiento,
  puedeAccederSesion,
  denegar,
  esUrlHttp
};
