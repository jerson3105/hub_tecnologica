const { Op } = require('sequelize');
const { Emprendimiento, Integrante, Usuario, Programa, Sesion, SesionPrograma, Asistencia, Nps } = require('../models');
const { resumirImpacto, resumirSatisfaccion } = require('../services/reportes');
const { hoyLocal } = require('../utils/fechas');
const logger = require('../utils/logger');

// Programas del informe: uno (?programa_id=) o todos. null si el id no existe.
const programasDelAlcance = async (programaId) => {
  if (!programaId) return Programa.findAll({ attributes: ['id', 'nombre', 'estado', 'fecha_inicio', 'fecha_fin'], order: [['fecha_inicio', 'DESC'], ['nombre', 'ASC']] });
  const programa = await Programa.findByPk(programaId, { attributes: ['id', 'nombre', 'estado', 'fecha_inicio', 'fecha_fin'] });
  return programa ? [programa] : null;
};

const alcanceDe = (programaId, programas) => (programaId
  ? { programa: { id: programas[0].id, nombre: programas[0].nombre, estado: programas[0].estado, fecha_inicio: programas[0].fecha_inicio, fecha_fin: programas[0].fecha_fin } }
  : { programa: null });

// GET /api/indicadores?programa_id= — informe de impacto (emprendimientos, personas, empleos, sectores)
const obtenerIndicadores = async (req, res) => {
  try {
    const programaId = Number(req.query.programa_id) || null;
    const programas = await programasDelAlcance(programaId);
    if (!programas) return res.status(404).json({ mensaje: 'Programa no encontrado' });

    const emprendimientos = await Emprendimiento.findAll({
      where: programaId ? { programa_id: programaId } : {},
      attributes: ['id', 'nombre', 'sector', 'estado', 'programa_id', 'empleos_generados']
    });
    const integrantes = emprendimientos.length ? await Integrante.findAll({
      where: { emprendimiento_id: emprendimientos.map((e) => e.id) },
      attributes: ['emprendimiento_id', 'usuario_id', 'es_lider'],
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'genero', 'edad', 'fecha_nacimiento', 'ciudad', 'provincia'] }]
    }) : [];

    const hoy = hoyLocal();
    res.json({
      hoy,
      ...alcanceDe(programaId, programas),
      ...resumirImpacto({
        programas: programas.map((p) => p.toJSON()),
        emprendimientos: emprendimientos.map((e) => e.toJSON()),
        integrantes: integrantes.map((i) => i.toJSON()),
        hoy
      })
    });
  } catch (error) {
    logger.error('Error al obtener indicadores:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// GET /api/indicadores/satisfaccion?programa_id= — NPS (con comentarios anónimos) y asistencia
const obtenerSatisfaccion = async (req, res) => {
  try {
    const programaId = Number(req.query.programa_id) || null;
    const programas = await programasDelAlcance(programaId);
    if (!programas) return res.status(404).json({ mensaje: 'Programa no encontrado' });
    const programaIds = programas.map((p) => p.id);
    const hoy = hoyLocal();

    const [emprendimientos, puente] = await Promise.all([
      Emprendimiento.findAll({
        where: { programa_id: programaIds, estado: { [Op.ne]: 'retirado' } },
        attributes: ['id', 'nombre', 'programa_id'],
        order: [['nombre', 'ASC']]
      }),
      SesionPrograma.findAll({ where: { programa_id: programaIds }, attributes: ['sesion_id'] })
    ]);
    const idsPuente = [...new Set(puente.map((p) => p.sesion_id))];
    const [sesiones, integrantes, respuestas] = await Promise.all([
      Sesion.findAll({
        where: { [Op.or]: [{ programa_id: programaIds }, ...(idsPuente.length ? [{ id: idsPuente }] : [])] },
        attributes: ['id', 'titulo', 'fecha', 'tipo', 'programa_id'],
        include: [{ model: Programa, as: 'programas', through: { attributes: [] }, attributes: ['id'] }],
        order: [['fecha', 'ASC'], ['id', 'ASC']]
      }),
      emprendimientos.length ? Integrante.findAll({
        where: { emprendimiento_id: emprendimientos.map((e) => e.id) },
        attributes: ['emprendimiento_id', 'usuario_id'],
        include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] }]
      }) : [],
      Nps.findAll({
        where: { programa_id: programaIds },
        attributes: ['id', 'sesion_id', 'programa_id', 'puntuacion', 'comentario', 'areas_mejora', 'tipo'],
        include: [{ model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha'] }]
      })
    ]);
    const pasadas = sesiones.filter((s) => s.fecha <= hoy).map((s) => s.id);
    const asistencias = pasadas.length
      ? await Asistencia.findAll({ where: { sesion_id: pasadas }, attributes: ['sesion_id', 'usuario_id', 'presente'] })
      : [];

    res.json({
      hoy,
      ...alcanceDe(programaId, programas),
      ...resumirSatisfaccion({
        sesiones: sesiones.map((s) => s.toJSON()),
        respuestas: respuestas.map((r) => r.toJSON()),
        emprendimientos: emprendimientos.map((e) => e.toJSON()),
        integrantes: integrantes.map((i) => i.toJSON()),
        asistencias: asistencias.map((a) => a.toJSON()),
        hoy
      })
    });
  } catch (error) {
    logger.error('Error al obtener satisfacción y asistencia:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { obtenerIndicadores, obtenerSatisfaccion };
