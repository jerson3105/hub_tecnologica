const { Op } = require('sequelize');
const { Emprendimiento, Integrante, Usuario, Programa, Seguimiento, Archivo, Sesion } = require('../models');
const { generarPasswordAleatorio } = require('../utils/helpers');
const { paginate, paginatedResponse } = require('../utils/pagination');
const logger = require('../utils/logger');
const { normalizeUserPayload } = require('../utils/userPayload');

const crear = async (req, res) => {
  try {
    const { nombre, descripcion, sector, programa_id } = req.body;

    const programa = await Programa.findByPk(programa_id);
    if (!programa) {
      return res.status(404).json({ mensaje: 'Programa no encontrado' });
    }

    const emprendimiento = await Emprendimiento.create({
      nombre,
      descripcion,
      sector,
      programa_id
    });

    res.status(201).json({ mensaje: 'Emprendimiento creado exitosamente', emprendimiento });
  } catch (error) {
    logger.error('Error al crear emprendimiento:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const listar = async (req, res) => {
  try {
    const { programa_id, estado } = req.query;
    const where = {};
    if (programa_id) where.programa_id = programa_id;
    if (estado) where.estado = estado;

    // Si es emprendedor, solo ver sus emprendimientos
    if (req.usuario.rol === 'emprendedor') {
      const integrantes = await Integrante.findAll({
        where: { usuario_id: req.usuario.id },
        attributes: ['emprendimiento_id']
      });
      const ids = integrantes.map(i => i.emprendimiento_id);
      where.id = ids;
    }

    const includeOpts = [
      { model: Programa, as: 'programa', attributes: ['id', 'nombre'] },
      { model: Integrante, as: 'integrantes', include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email'] }] }
    ];

    if (req.query.page) {
      const { page, limit, offset } = paginate(req.query);
      const { rows, count } = await Emprendimiento.findAndCountAll({ where, include: includeOpts, order: [['nombre', 'ASC']], limit, offset, distinct: true });
      res.json(paginatedResponse(rows, count, { page, limit }));
    } else {
      const emprendimientos = await Emprendimiento.findAll({ where, include: includeOpts, order: [['nombre', 'ASC']] });
      res.json({ emprendimientos });
    }
  } catch (error) {
    logger.error('Error al listar emprendimientos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const emprendimiento = await Emprendimiento.findByPk(req.params.id, {
      include: [
        { model: Programa, as: 'programa', attributes: ['id', 'nombre', 'estado'] },
        {
          model: Integrante,
          as: 'integrantes',
          include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido', 'email', 'telefono'] }]
        },
        {
          model: Seguimiento,
          as: 'seguimientos',
          attributes: ['id', 'realizado', 'compromisos', 'observaciones', 'estado_avance', 'enlace_grabacion', 'created_at'],
          include: [
            { model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha'] }
          ]
        },
        {
          model: Archivo,
          as: 'archivos',
          attributes: ['id', 'nombre_original', 'categoria', 'sesion_id', 'created_at'],
          where: { sesion_id: null },
          required: false
        }
      ],
      order: [
        [{ model: Seguimiento, as: 'seguimientos' }, { model: Sesion, as: 'sesion' }, 'fecha', 'DESC']
      ]
    });

    if (!emprendimiento) {
      return res.status(404).json({ mensaje: 'Emprendimiento no encontrado' });
    }

    // Verificar acceso si es emprendedor
    if (req.usuario.rol === 'emprendedor') {
      const esIntegrante = await Integrante.findOne({
        where: { emprendimiento_id: emprendimiento.id, usuario_id: req.usuario.id }
      });
      if (!esIntegrante) {
        return res.status(403).json({ mensaje: 'No tienes acceso a este emprendimiento' });
      }
    }

    res.json({ emprendimiento });
  } catch (error) {
    logger.error('Error al obtener emprendimiento:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const actualizar = async (req, res) => {
  try {
    const emprendimiento = await Emprendimiento.findByPk(req.params.id);
    if (!emprendimiento) {
      return res.status(404).json({ mensaje: 'Emprendimiento no encontrado' });
    }

    const { nombre, descripcion, sector, estado, programa_id } = req.body;

    await emprendimiento.update({
      nombre: nombre || emprendimiento.nombre,
      descripcion: descripcion !== undefined ? descripcion : emprendimiento.descripcion,
      sector: sector !== undefined ? sector : emprendimiento.sector,
      estado: estado || emprendimiento.estado,
      programa_id: programa_id || emprendimiento.programa_id
    });

    res.json({ mensaje: 'Emprendimiento actualizado', emprendimiento });
  } catch (error) {
    logger.error('Error al actualizar emprendimiento:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const eliminar = async (req, res) => {
  try {
    const emprendimiento = await Emprendimiento.findByPk(req.params.id);
    if (!emprendimiento) {
      return res.status(404).json({ mensaje: 'Emprendimiento no encontrado' });
    }

    await emprendimiento.update({ estado: 'retirado' });
    res.json({ mensaje: 'Emprendimiento desactivado' });
  } catch (error) {
    logger.error('Error al eliminar emprendimiento:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const agregarIntegrante = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre, apellido, dni, edad, fecha_nacimiento, telefono, email,
      direccion, distrito, provincia, ciudad, linkedin, genero, area, cargo, dedicacion,
      rol_emprendimiento, es_lider
    } = { ...req.body, ...normalizeUserPayload(req.body) };

    const emprendimiento = await Emprendimiento.findByPk(id);
    if (!emprendimiento) {
      return res.status(404).json({ mensaje: 'Emprendimiento no encontrado' });
    }

    // Si es emprendedor, verificar que sea líder de este emprendimiento
    if (req.usuario.rol === 'emprendedor') {
      const lider = await Integrante.findOne({
        where: { emprendimiento_id: id, usuario_id: req.usuario.id, es_lider: true }
      });
      if (!lider) {
        return res.status(403).json({ mensaje: 'Solo los líderes pueden agregar integrantes' });
      }
    }

    if (!nombre || !apellido || !email) {
      return res.status(400).json({ mensaje: 'Nombre, apellido y correo son requeridos' });
    }

    // Verificar si el email ya existe
    let usuario = await Usuario.findOne({ where: { email } });

    if (usuario) {
      // Si el usuario ya existe, verificar que no sea ya integrante
      const existente = await Integrante.findOne({
        where: { emprendimiento_id: id, usuario_id: usuario.id }
      });
      if (existente) {
        return res.status(400).json({ mensaje: 'Este usuario ya es integrante de este emprendimiento' });
      }
    } else {
      // Crear nuevo usuario con todos los campos
      const passwordGenerado = generarPasswordAleatorio();
      usuario = await Usuario.create({
        nombre,
        apellido,
        email,
        password: passwordGenerado,
        rol: 'emprendedor',
        telefono,
        dni,
        edad,
        fecha_nacimiento,
        direccion,
        distrito,
        provincia,
        ciudad,
        linkedin,
        genero,
        area,
        cargo,
        dedicacion
      });
    }

    const integrante = await Integrante.create({
      emprendimiento_id: id,
      usuario_id: usuario.id,
      rol_emprendimiento,
      es_lider: es_lider || false
    });

    res.status(201).json({
      mensaje: 'Integrante agregado exitosamente',
      integrante,
      usuario: usuario.toJSON()
    });
  } catch (error) {
    logger.error('Error al agregar integrante:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const eliminarIntegrante = async (req, res) => {
  try {
    const { id, integranteId } = req.params;

    // Verificar acceso si es emprendedor (debe ser líder)
    if (req.usuario.rol === 'emprendedor') {
      const lider = await Integrante.findOne({
        where: { emprendimiento_id: id, usuario_id: req.usuario.id, es_lider: true }
      });
      if (!lider) {
        return res.status(403).json({ mensaje: 'Solo los líderes pueden eliminar integrantes' });
      }
    }

    const integrante = await Integrante.findOne({
      where: { id: integranteId, emprendimiento_id: id }
    });
    if (!integrante) {
      return res.status(404).json({ mensaje: 'Integrante no encontrado' });
    }

    await integrante.destroy();
    res.json({ mensaje: 'Integrante eliminado' });
  } catch (error) {
    logger.error('Error al eliminar integrante:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const buscarUsuariosParaIntegrante = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el usuario sea admin o líder de este emprendimiento
    if (req.usuario.rol === 'emprendedor') {
      const lider = await Integrante.findOne({
        where: { emprendimiento_id: id, usuario_id: req.usuario.id, es_lider: true }
      });
      if (!lider) {
        return res.status(403).json({ mensaje: 'Solo los líderes pueden buscar usuarios' });
      }
    }

    // Obtener integrantes actuales para excluirlos
    const integrantesActuales = await Integrante.findAll({
      where: { emprendimiento_id: id },
      attributes: ['usuario_id']
    });
    const idsExcluir = integrantesActuales.map(i => i.usuario_id);

    const where = { rol: 'emprendedor', activo: true };
    if (idsExcluir.length > 0) {
      where.id = { [Op.notIn]: idsExcluir };
    }

    const usuarios = await Usuario.findAll({
      where,
      attributes: ['id', 'nombre', 'apellido', 'email'],
      order: [['nombre', 'ASC']]
    });

    res.json({ usuarios });
  } catch (error) {
    logger.error('Error al buscar usuarios:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const miEmprendimiento = async (req, res) => {
  try {
    const integrantes = await Integrante.findAll({
      where: { usuario_id: req.usuario.id },
      attributes: ['emprendimiento_id']
    });
    const ids = integrantes.map(i => i.emprendimiento_id);

    if (ids.length === 0) {
      return res.json({ emprendimientos: [] });
    }

    const emprendimientos = await Emprendimiento.findAll({
      where: { id: ids },
      include: [
        { model: Programa, as: 'programa', attributes: ['id', 'nombre'] }
      ],
      order: [['nombre', 'ASC']]
    });

    res.json({ emprendimientos });
  } catch (error) {
    logger.error('Error al obtener mis emprendimientos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { crear, listar, obtenerPorId, actualizar, eliminar, agregarIntegrante, eliminarIntegrante, buscarUsuariosParaIntegrante, miEmprendimiento };
