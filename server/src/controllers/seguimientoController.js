const { Seguimiento, Sesion, Emprendimiento, Programa, Integrante } = require('../models');
const logger = require('../utils/logger');

const crear = async (req, res) => {
  try {
    const { sesion_id, emprendimiento_ids, emprendimiento_id, realizado, compromisos, observaciones, estado_avance, enlace_grabacion } = req.body;

    const sesion = await Sesion.findByPk(sesion_id);
    if (!sesion) {
      return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    }

    // Soportar tanto un solo emprendimiento_id como un array emprendimiento_ids
    const ids = emprendimiento_ids || [emprendimiento_id];

    if (!ids || ids.length === 0) {
      return res.status(400).json({ mensaje: 'Debe seleccionar al menos un emprendimiento' });
    }

    const creados = [];
    const errores = [];

    for (const empId of ids) {
      const emprendimiento = await Emprendimiento.findByPk(empId);
      if (!emprendimiento) {
        errores.push(`Emprendimiento ${empId} no encontrado`);
        continue;
      }

      const existente = await Seguimiento.findOne({
        where: { sesion_id, emprendimiento_id: empId }
      });
      if (existente) {
        errores.push(`Ya existe seguimiento para ${emprendimiento.nombre}`);
        continue;
      }

      const seguimiento = await Seguimiento.create({
        sesion_id,
        emprendimiento_id: empId,
        realizado,
        compromisos,
        observaciones,
        estado_avance,
        enlace_grabacion
      });
      creados.push(seguimiento);
    }

    if (creados.length === 0 && errores.length > 0) {
      return res.status(400).json({ mensaje: errores.join('. ') });
    }

    res.status(201).json({
      mensaje: `${creados.length} seguimiento(s) registrado(s)`,
      seguimientos: creados,
      errores: errores.length > 0 ? errores : undefined
    });
  } catch (error) {
    logger.error('Error al crear seguimiento:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const listarPorEmprendimiento = async (req, res) => {
  try {
    const { emprendimientoId } = req.params;

    // Verificar acceso si es emprendedor
    if (req.usuario.rol === 'emprendedor') {
      const esIntegrante = await Integrante.findOne({
        where: { emprendimiento_id: emprendimientoId, usuario_id: req.usuario.id }
      });
      if (!esIntegrante) {
        return res.status(403).json({ mensaje: 'No tienes acceso a este emprendimiento' });
      }
    }

    const seguimientos = await Seguimiento.findAll({
      where: { emprendimiento_id: emprendimientoId },
      include: [
        {
          model: Sesion,
          as: 'sesion',
          attributes: ['id', 'titulo', 'fecha', 'tipo'],
          include: [{ model: Programa, as: 'programa', attributes: ['id', 'nombre'] }]
        }
      ],
      order: [[{ model: Sesion, as: 'sesion' }, 'fecha', 'ASC']]
    });

    res.json({ seguimientos });
  } catch (error) {
    logger.error('Error al listar seguimientos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const seguimiento = await Seguimiento.findByPk(req.params.id, {
      include: [
        { model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha', 'tipo'] },
        { model: Emprendimiento, as: 'emprendimiento', attributes: ['id', 'nombre'] }
      ]
    });

    if (!seguimiento) {
      return res.status(404).json({ mensaje: 'Seguimiento no encontrado' });
    }

    // Verificar acceso si es emprendedor
    if (req.usuario.rol === 'emprendedor') {
      const esIntegrante = await Integrante.findOne({
        where: { emprendimiento_id: seguimiento.emprendimiento_id, usuario_id: req.usuario.id }
      });
      if (!esIntegrante) {
        return res.status(403).json({ mensaje: 'No tienes acceso a este seguimiento' });
      }
    }

    res.json({ seguimiento });
  } catch (error) {
    logger.error('Error al obtener seguimiento:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const actualizar = async (req, res) => {
  try {
    const seguimiento = await Seguimiento.findByPk(req.params.id);
    if (!seguimiento) {
      return res.status(404).json({ mensaje: 'Seguimiento no encontrado' });
    }

    const { realizado, compromisos, observaciones, estado_avance, enlace_grabacion } = req.body;

    await seguimiento.update({
      realizado: realizado !== undefined ? realizado : seguimiento.realizado,
      compromisos: compromisos !== undefined ? compromisos : seguimiento.compromisos,
      observaciones: observaciones !== undefined ? observaciones : seguimiento.observaciones,
      estado_avance: estado_avance || seguimiento.estado_avance,
      enlace_grabacion: enlace_grabacion !== undefined ? enlace_grabacion : seguimiento.enlace_grabacion
    });

    res.json({ mensaje: 'Seguimiento actualizado', seguimiento });
  } catch (error) {
    logger.error('Error al actualizar seguimiento:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const eliminar = async (req, res) => {
  try {
    const seguimiento = await Seguimiento.findByPk(req.params.id);
    if (!seguimiento) {
      return res.status(404).json({ mensaje: 'Seguimiento no encontrado' });
    }

    await seguimiento.destroy();
    res.json({ mensaje: 'Seguimiento eliminado' });
  } catch (error) {
    logger.error('Error al eliminar seguimiento:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { crear, listarPorEmprendimiento, obtenerPorId, actualizar, eliminar };
