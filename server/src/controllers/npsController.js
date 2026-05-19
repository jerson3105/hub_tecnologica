const { Nps, Programa, Sesion, Usuario, Integrante, Emprendimiento } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const logger = require('../utils/logger');

const crear = async (req, res) => {
  try {
    const { sesion_id, programa_id, puntuacion, comentario, tipo, areas_mejora } = req.body;

    // Prevenir duplicados: un usuario solo puede dar NPS una vez por sesión
    if (sesion_id) {
      const existente = await Nps.findOne({
        where: { sesion_id, usuario_id: req.usuario.id }
      });
      if (existente) {
        return res.status(400).json({ mensaje: 'Ya has enviado tu evaluación para esta sesión' });
      }
    }

    const nps = await Nps.create({
      sesion_id: sesion_id || null,
      programa_id,
      usuario_id: req.usuario.id,
      puntuacion,
      comentario,
      tipo,
      areas_mejora
    });

    res.status(201).json({ mensaje: 'NPS registrado', nps });
  } catch (error) {
    logger.error('Error al crear NPS:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const obtenerPorPrograma = async (req, res) => {
  try {
    const { programaId } = req.params;
    const { tipo } = req.query;
    const where = { programa_id: programaId };
    if (tipo) where.tipo = tipo;

    const respuestas = await Nps.findAll({
      where,
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] },
        { model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Calcular NPS
    const total = respuestas.length;
    if (total === 0) {
      return res.json({ respuestas: [], nps: { promotores: 0, pasivos: 0, detractores: 0, score: 0, total: 0 } });
    }

    let promotores = 0, pasivos = 0, detractores = 0;
    respuestas.forEach(r => {
      if (r.puntuacion >= 9) promotores++;
      else if (r.puntuacion >= 7) pasivos++;
      else detractores++;
    });

    const score = Math.round(((promotores - detractores) / total) * 100);

    res.json({
      respuestas,
      nps: { promotores, pasivos, detractores, score, total }
    });
  } catch (error) {
    logger.error('Error al obtener NPS:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const resumenGeneral = async (req, res) => {
  try {
    const programas = await Programa.findAll({
      where: { activo: true },
      attributes: ['id', 'nombre']
    });

    const resumen = [];
    for (const programa of programas) {
      const respuestas = await Nps.findAll({
        where: { programa_id: programa.id },
        attributes: ['puntuacion']
      });

      const total = respuestas.length;
      let promotores = 0, detractores = 0;
      respuestas.forEach(r => {
        if (r.puntuacion >= 9) promotores++;
        else if (r.puntuacion < 7) detractores++;
      });

      const score = total > 0 ? Math.round(((promotores - detractores) / total) * 100) : 0;

      resumen.push({
        programa_id: programa.id,
        programa_nombre: programa.nombre,
        total_respuestas: total,
        nps_score: score
      });
    }

    res.json({ resumen });
  } catch (error) {
    logger.error('Error al obtener resumen NPS:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Obtener NPS de una sesión específica (admin: todos, emprendedor: el suyo)
const obtenerPorSesion = async (req, res) => {
  try {
    const { sesionId } = req.params;

    const sesion = await Sesion.findByPk(sesionId, {
      include: [{ model: Programa, as: 'programa', attributes: ['id', 'nombre'] }]
    });
    if (!sesion) {
      return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    }

    const where = { sesion_id: sesionId };

    const respuestas = await Nps.findAll({
      where,
      include: [
        { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] }
      ],
      order: [['created_at', 'DESC']]
    });

    // Calcular promedio
    const total = respuestas.length;
    const promedio = total > 0 ? (respuestas.reduce((sum, r) => sum + r.puntuacion, 0) / total) : 0;

    res.json({ sesion, respuestas, promedio: Math.round(promedio * 10) / 10, total });
  } catch (error) {
    logger.error('Error al obtener NPS por sesión:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Obtener sesiones pendientes de NPS para el emprendedor actual
const misPendientes = async (req, res) => {
  try {
    // Obtener programas del emprendedor
    const integrantes = await Integrante.findAll({
      where: { usuario_id: req.usuario.id },
      include: [{ model: Emprendimiento, as: 'emprendimiento', attributes: ['id', 'programa_id'] }]
    });
    const programaIds = [...new Set(integrantes.map(i => i.emprendimiento?.programa_id).filter(Boolean))];

    if (programaIds.length === 0) {
      return res.json({ pendientes: [] });
    }

    // Obtener todas las sesiones de esos programas
    const sesiones = await Sesion.findAll({
      where: { programa_id: { [Op.in]: programaIds } },
      attributes: ['id'],
      order: [['fecha', 'DESC']]
    });
    const sesionIds = sesiones.map(s => s.id);

    // Obtener NPS ya enviados por este usuario
    const npsEnviados = await Nps.findAll({
      where: {
        usuario_id: req.usuario.id,
        sesion_id: { [Op.in]: sesionIds }
      },
      attributes: ['sesion_id']
    });
    const sesionesConNps = new Set(npsEnviados.map(n => n.sesion_id));

    // Las pendientes son las que no tienen NPS
    const pendientes = sesionIds.filter(id => !sesionesConNps.has(id));

    res.json({ pendientes });
  } catch (error) {
    logger.error('Error al obtener NPS pendientes:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Obtener promedios NPS para lista de sesiones (usado por el frontend)
const promediosPorSesiones = async (req, res) => {
  try {
    const resultados = await Nps.findAll({
      attributes: [
        'sesion_id',
        [sequelize.fn('AVG', sequelize.col('puntuacion')), 'promedio'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'total']
      ],
      where: { sesion_id: { [Op.not]: null } },
      group: ['sesion_id'],
      raw: true
    });

    const promedios = {};
    resultados.forEach(r => {
      promedios[r.sesion_id] = {
        promedio: Math.round(parseFloat(r.promedio) * 10) / 10,
        total: parseInt(r.total)
      };
    });

    res.json({ promedios });
  } catch (error) {
    logger.error('Error al obtener promedios NPS:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { crear, obtenerPorPrograma, resumenGeneral, obtenerPorSesion, misPendientes, promediosPorSesiones };
