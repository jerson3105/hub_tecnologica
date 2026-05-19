const { Compromiso, Seguimiento, Sesion, Emprendimiento, Programa } = require('../models');
const logger = require('../utils/logger');

const obtenerPorSeguimiento = async (req, res) => {
  try {
    const { seguimiento_id } = req.params;
    const compromisos = await Compromiso.findAll({
      where: { seguimiento_id },
      order: [['orden', 'ASC']]
    });
    res.json({ compromisos });
  } catch (error) {
    logger.error('Error al obtener compromisos', { error: error.message });
    res.status(500).json({ mensaje: 'Error al obtener compromisos' });
  }
};

const obtenerPendientesPorEmprendimiento = async (req, res) => {
  try {
    const { emprendimiento_id } = req.params;
    const seguimientos = await Seguimiento.findAll({
      where: { emprendimiento_id },
      attributes: ['id']
    });
    const segIds = seguimientos.map(s => s.id);

    const compromisos = await Compromiso.findAll({
      where: {
        seguimiento_id: segIds,
        estado: ['planeado', 'en_progreso']
      },
      include: [{
        model: Seguimiento,
        as: 'seguimientoOrigen',
        include: [{
          model: Sesion,
          as: 'sesion',
          attributes: ['id', 'titulo', 'fecha']
        }]
      }],
      order: [['createdAt', 'ASC']]
    });
    res.json({ compromisos });
  } catch (error) {
    logger.error('Error al obtener compromisos pendientes', { error: error.message });
    res.status(500).json({ mensaje: 'Error al obtener compromisos pendientes' });
  }
};

const crear = async (req, res) => {
  try {
    const { seguimiento_id } = req.params;
    const { descripcion } = req.body;

    const seg = await Seguimiento.findByPk(seguimiento_id);
    if (!seg) return res.status(404).json({ mensaje: 'Seguimiento no encontrado' });

    const count = await Compromiso.count({ where: { seguimiento_id } });
    const compromiso = await Compromiso.create({
      seguimiento_id, descripcion, orden: count
    });
    res.status(201).json({ compromiso });
  } catch (error) {
    logger.error('Error al crear compromiso', { error: error.message });
    res.status(500).json({ mensaje: 'Error al crear compromiso' });
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, seguimiento_revision_id } = req.body;

    const compromiso = await Compromiso.findByPk(id);
    if (!compromiso) return res.status(404).json({ mensaje: 'Compromiso no encontrado' });

    await compromiso.update({
      estado,
      seguimiento_revision_id: seguimiento_revision_id || compromiso.seguimiento_revision_id
    });
    res.json({ compromiso });
  } catch (error) {
    logger.error('Error al actualizar compromiso', { error: error.message });
    res.status(500).json({ mensaje: 'Error al actualizar compromiso' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const compromiso = await Compromiso.findByPk(id);
    if (!compromiso) return res.status(404).json({ mensaje: 'Compromiso no encontrado' });

    await compromiso.destroy();
    res.json({ mensaje: 'Compromiso eliminado' });
  } catch (error) {
    logger.error('Error al eliminar compromiso', { error: error.message });
    res.status(500).json({ mensaje: 'Error al eliminar compromiso' });
  }
};

const timelineEmprendimiento = async (req, res) => {
  try {
    const { emprendimiento_id } = req.params;

    // Obtener el programa del emprendimiento
    const emp = await Emprendimiento.findByPk(emprendimiento_id, { attributes: ['id', 'programa_id'] });
    if (!emp) return res.status(404).json({ mensaje: 'Emprendimiento no encontrado' });

    // Obtener todas las sesiones del programa
    const sesiones = await Sesion.findAll({
      where: { programa_id: emp.programa_id },
      attributes: ['id'],
      order: [['fecha', 'ASC']]
    });

    // Obtener seguimientos existentes para este emprendimiento
    const existentes = await Seguimiento.findAll({
      where: { emprendimiento_id },
      attributes: ['sesion_id']
    });
    const sesionesConSeg = new Set(existentes.map(s => s.sesion_id));

    // Auto-crear seguimientos faltantes
    const faltantes = sesiones.filter(s => !sesionesConSeg.has(s.id));
    if (faltantes.length > 0) {
      await Seguimiento.bulkCreate(
        faltantes.map(s => ({
          sesion_id: s.id,
          emprendimiento_id: parseInt(emprendimiento_id),
          estado_avance: 'sin_iniciar'
        })),
        { ignoreDuplicates: true }
      );
    }

    // Consultar todos los seguimientos con sus relaciones
    const seguimientos = await Seguimiento.findAll({
      where: { emprendimiento_id },
      include: [
        {
          model: Sesion,
          as: 'sesion',
          attributes: ['id', 'titulo', 'fecha', 'tipo', 'enlace_grabacion'],
          include: [{ model: Programa, as: 'programa', attributes: ['id', 'nombre'] }]
        },
        {
          model: Compromiso,
          as: 'compromisoItems',
          order: [['orden', 'ASC']]
        },
        {
          model: Compromiso,
          as: 'compromisosRevisados'
        }
      ],
      order: [[{ model: Sesion, as: 'sesion' }, 'fecha', 'ASC']]
    });
    res.json({ seguimientos });
  } catch (error) {
    logger.error('Error al obtener timeline', { error: error.message });
    res.status(500).json({ mensaje: 'Error al obtener timeline' });
  }
};

module.exports = {
  obtenerPorSeguimiento,
  obtenerPendientesPorEmprendimiento,
  crear,
  actualizarEstado,
  eliminar,
  timelineEmprendimiento
};
