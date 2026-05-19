const { Programa, Emprendimiento, Sesion } = require('../models');
const { Op } = require('sequelize');
const { paginate, paginatedResponse } = require('../utils/pagination');
const logger = require('../utils/logger');

const crear = async (req, res) => {
  try {
    const { nombre, descripcion, fecha_inicio, fecha_fin, frecuencia_seguimiento } = req.body;

    const programa = await Programa.create({
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      frecuencia_seguimiento
    });

    res.status(201).json({ mensaje: 'Programa creado exitosamente', programa });
  } catch (error) {
    logger.error('Error al crear programa:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const listar = async (req, res) => {
  try {
    const { estado, activo } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (activo !== undefined) where.activo = activo === 'true';

    const includeOpts = [{ model: Emprendimiento, as: 'emprendimientos', attributes: ['id', 'nombre', 'estado'] }];

    if (req.query.page) {
      const { page, limit, offset } = paginate(req.query);
      const { rows, count } = await Programa.findAndCountAll({ where, include: includeOpts, order: [['fecha_inicio', 'DESC']], limit, offset, distinct: true });
      res.json(paginatedResponse(rows, count, { page, limit }));
    } else {
      const programas = await Programa.findAll({ where, include: includeOpts, order: [['fecha_inicio', 'DESC']] });
      res.json({ programas });
    }
  } catch (error) {
    logger.error('Error al listar programas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const programa = await Programa.findByPk(req.params.id, {
      include: [
        {
          model: Emprendimiento,
          as: 'emprendimientos',
          attributes: ['id', 'nombre', 'sector', 'estado']
        },
        {
          model: Sesion,
          as: 'sesiones',
          attributes: ['id', 'titulo', 'fecha', 'tipo'],
          order: [['fecha', 'ASC']]
        }
      ]
    });

    if (!programa) {
      return res.status(404).json({ mensaje: 'Programa no encontrado' });
    }

    res.json({ programa });
  } catch (error) {
    logger.error('Error al obtener programa:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const actualizar = async (req, res) => {
  try {
    const programa = await Programa.findByPk(req.params.id);
    if (!programa) {
      return res.status(404).json({ mensaje: 'Programa no encontrado' });
    }

    const { nombre, descripcion, fecha_inicio, fecha_fin, frecuencia_seguimiento, estado, activo } = req.body;

    await programa.update({
      nombre: nombre || programa.nombre,
      descripcion: descripcion !== undefined ? descripcion : programa.descripcion,
      fecha_inicio: fecha_inicio || programa.fecha_inicio,
      fecha_fin: fecha_fin || programa.fecha_fin,
      frecuencia_seguimiento: frecuencia_seguimiento || programa.frecuencia_seguimiento,
      estado: estado || programa.estado,
      activo: activo !== undefined ? activo : programa.activo
    });

    res.json({ mensaje: 'Programa actualizado', programa });
  } catch (error) {
    logger.error('Error al actualizar programa:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const eliminar = async (req, res) => {
  try {
    const programa = await Programa.findByPk(req.params.id);
    if (!programa) {
      return res.status(404).json({ mensaje: 'Programa no encontrado' });
    }

    await programa.update({ activo: false });
    res.json({ mensaje: 'Programa desactivado exitosamente' });
  } catch (error) {
    logger.error('Error al eliminar programa:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { crear, listar, obtenerPorId, actualizar, eliminar };
