const { Mentor } = require('../models');
const path = require('path');
const fs = require('fs');
const { paginate, paginatedResponse } = require('../utils/pagination');
const logger = require('../utils/logger');

const crear = async (req, res) => {
  try {
    const { nombre, apellido, linkedin, calendly, biografia, sesiones, startups, ods } = req.body;

    const data = {
      nombre,
      apellido,
      linkedin,
      calendly: calendly || null,
      biografia: biografia || null,
      sesiones: sesiones ? (typeof sesiones === 'string' ? JSON.parse(sesiones) : sesiones) : [],
      startups: startups ? (typeof startups === 'string' ? JSON.parse(startups) : startups) : [],
      ods: ods ? (typeof ods === 'string' ? JSON.parse(ods) : ods) : []
    };

    if (req.file) {
      data.foto = `/uploads/mentores/${req.file.filename}`;
    }

    const mentor = await Mentor.create(data);
    res.status(201).json({ mensaje: 'Mentor creado exitosamente', mentor });
  } catch (error) {
    logger.error('Error al crear mentor', { error: error.message, stack: error.stack });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const listar = async (req, res) => {
  try {
    const { activo } = req.query;
    const where = {};
    if (activo !== undefined) where.activo = activo === 'true';

    if (req.query.page) {
      const { page, limit, offset } = paginate(req.query);
      const { rows, count } = await Mentor.findAndCountAll({ where, order: [['nombre', 'ASC']], limit, offset });
      res.json(paginatedResponse(rows, count, { page, limit }));
    } else {
      const mentores = await Mentor.findAll({ where, order: [['nombre', 'ASC']] });
      res.json({ mentores });
    }
  } catch (error) {
    logger.error('Error al listar mentores', { error: error.message, stack: error.stack });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const mentor = await Mentor.findByPk(req.params.id);
    if (!mentor) {
      return res.status(404).json({ mensaje: 'Mentor no encontrado' });
    }
    res.json({ mentor });
  } catch (error) {
    logger.error('Error al obtener mentor', { error: error.message, stack: error.stack });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const actualizar = async (req, res) => {
  try {
    const mentor = await Mentor.findByPk(req.params.id);
    if (!mentor) {
      return res.status(404).json({ mensaje: 'Mentor no encontrado' });
    }

    const { nombre, apellido, linkedin, calendly, biografia, sesiones, startups, ods, activo } = req.body;

    const data = {
      nombre: nombre || mentor.nombre,
      apellido: apellido || mentor.apellido,
      linkedin: linkedin || mentor.linkedin,
      calendly: calendly !== undefined ? (calendly || null) : mentor.calendly,
      biografia: biografia !== undefined ? biografia : mentor.biografia,
      sesiones: sesiones ? (typeof sesiones === 'string' ? JSON.parse(sesiones) : sesiones) : mentor.sesiones,
      startups: startups ? (typeof startups === 'string' ? JSON.parse(startups) : startups) : mentor.startups,
      ods: ods ? (typeof ods === 'string' ? JSON.parse(ods) : ods) : mentor.ods,
      activo: activo !== undefined ? activo : mentor.activo
    };

    if (req.file) {
      // Delete old photo if exists
      if (mentor.foto) {
        const oldPath = path.join(__dirname, '../../', mentor.foto);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      data.foto = `/uploads/mentores/${req.file.filename}`;
    }

    await mentor.update(data);
    res.json({ mensaje: 'Mentor actualizado', mentor });
  } catch (error) {
    logger.error('Error al actualizar mentor', { error: error.message, stack: error.stack });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const eliminar = async (req, res) => {
  try {
    const mentor = await Mentor.findByPk(req.params.id);
    if (!mentor) {
      return res.status(404).json({ mensaje: 'Mentor no encontrado' });
    }

    await mentor.update({ activo: false });
    res.json({ mensaje: 'Mentor desactivado exitosamente' });
  } catch (error) {
    logger.error('Error al eliminar mentor', { error: error.message, stack: error.stack });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { crear, listar, obtenerPorId, actualizar, eliminar };
