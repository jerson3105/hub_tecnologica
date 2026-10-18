const { Op } = require('sequelize');
const { Emprendimiento, Integrante, Usuario, Programa, Seguimiento, Archivo, Sesion, Compromiso } = require('../models');
const { generarPasswordAleatorio } = require('../utils/helpers');
const { paginate, paginatedResponse } = require('../utils/pagination');
const logger = require('../utils/logger');
const { normalizeUserPayload } = require('../utils/userPayload');
const { asegurarSeguimientosDeEmprendimiento } = require('../services/seguimientos');

// Crea los seguimientos del emprendimiento para las sesiones de su programa. Si falla no se
// pierde el cambio: el timeline muestra las sesiones igualmente y el registro se crea al editarlo.
const prepararSeguimientos = async (emprendimientoId) => {
  try {
    await asegurarSeguimientosDeEmprendimiento(emprendimientoId);
  } catch (error) {
    logger.error('No se pudieron crear los seguimientos del emprendimiento', { emprendimientoId, error: error.message });
  }
};

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
    await prepararSeguimientos(emprendimiento.id);

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
            { model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha'] },
            // Compromisos de la tabla nueva; `compromisos` (texto) queda solo para datos antiguos
            { model: Compromiso, as: 'compromisoItems', attributes: ['id', 'descripcion', 'estado', 'orden'] }
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
        [{ model: Seguimiento, as: 'seguimientos' }, { model: Sesion, as: 'sesion' }, 'fecha', 'DESC'],
        [{ model: Seguimiento, as: 'seguimientos' }, { model: Compromiso, as: 'compromisoItems' }, 'orden', 'ASC']
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
    const programaAnterior = emprendimiento.programa_id;
    const estadoAnterior = emprendimiento.estado;

    await emprendimiento.update({
      nombre: nombre || emprendimiento.nombre,
      descripcion: descripcion !== undefined ? descripcion : emprendimiento.descripcion,
      sector: sector !== undefined ? sector : emprendimiento.sector,
      estado: estado || emprendimiento.estado,
      programa_id: programa_id || emprendimiento.programa_id
    });

    // Cambió de programa o volvió de «retirado»: faltan los seguimientos de las sesiones de su programa
    if (emprendimiento.programa_id !== programaAnterior || (estadoAnterior === 'retirado' && emprendimiento.estado !== 'retirado')) {
      await prepararSeguimientos(emprendimiento.id);
    }

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
      usuario_id,
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

    let usuario;
    let passwordTemporal = null;
    let usuarioCreado = false;
    const esLider = req.usuario.rol === 'emprendedor';

    if (usuario_id) {
      // Vincular cuentas existentes es tarea del admin: un líder podría apropiarse de cuentas ajenas
      if (esLider) {
        return res.status(403).json({ mensaje: 'Solo el administrador puede asignar usuarios existentes' });
      }
      usuario = await Usuario.findByPk(usuario_id);
      if (!usuario) {
        return res.status(404).json({ mensaje: 'Usuario no encontrado' });
      }
    } else {
      if (!nombre || !apellido || !email) {
        return res.status(400).json({ mensaje: 'Nombre, apellido y correo son requeridos' });
      }

      usuario = await Usuario.findOne({ where: { email } });

      if (usuario && esLider) {
        return res.status(400).json({
          mensaje: 'Ese correo ya tiene una cuenta. Pide al administrador que la asigne a tu emprendimiento'
        });
      }

      if (!usuario) {
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
        passwordTemporal = passwordGenerado;
        usuarioCreado = true;
      }
    }

    if (!usuario.activo) {
      return res.status(400).json({ mensaje: 'No se puede asignar un usuario inactivo' });
    }

    if (usuario.rol !== 'emprendedor') {
      return res.status(400).json({ mensaje: 'Solo los usuarios emprendedores pueden asignarse a un emprendimiento' });
    }

    const asignacionExistente = await Integrante.findOne({
      where: { usuario_id: usuario.id },
      include: [{ model: Emprendimiento, as: 'emprendimiento', attributes: ['id', 'nombre'] }]
    });

    if (asignacionExistente && asignacionExistente.emprendimiento_id !== Number(id)) {
      return res.status(400).json({
        mensaje: `Este usuario ya pertenece al emprendimiento ${asignacionExistente.emprendimiento?.nombre || 'asignado'}`
      });
    }

    const existente = await Integrante.findOne({
      where: { emprendimiento_id: id, usuario_id: usuario.id }
    });
    if (existente) {
      return res.status(400).json({ mensaje: 'Este usuario ya es integrante de este emprendimiento' });
    }

    const integrante = await Integrante.create({
      emprendimiento_id: id,
      usuario_id: usuario.id,
      rol_emprendimiento,
      es_lider: es_lider || false
    });

    // Solo datos básicos: un líder no necesita el DNI, la dirección, etc. del integrante
    const { id: usuarioId, nombre: nombreUsuario, apellido: apellidoUsuario, email: emailUsuario } = usuario.toJSON();

    res.status(201).json({
      mensaje: 'Integrante agregado exitosamente',
      integrante,
      usuario: { id: usuarioId, nombre: nombreUsuario, apellido: apellidoUsuario, email: emailUsuario },
      usuarioCreado,
      passwordTemporal
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

const resetearPasswordIntegrante = async (req, res) => {
  try {
    const { id, integranteId } = req.params;

    const emprendimiento = await Emprendimiento.findByPk(id);
    if (!emprendimiento) {
      return res.status(404).json({ mensaje: 'Emprendimiento no encontrado' });
    }

    if (req.usuario.rol === 'emprendedor') {
      const lider = await Integrante.findOne({
        where: { emprendimiento_id: id, usuario_id: req.usuario.id, es_lider: true }
      });
      if (!lider) {
        return res.status(403).json({ mensaje: 'Solo los líderes pueden resetear contraseñas' });
      }
    }

    const integrante = await Integrante.findOne({
      where: { id: integranteId, emprendimiento_id: id },
      include: [{ model: Usuario, as: 'usuario' }]
    });
    if (!integrante || !integrante.usuario) {
      return res.status(404).json({ mensaje: 'Integrante no encontrado' });
    }

    if (req.usuario.rol === 'emprendedor' && integrante.usuario_id === req.usuario.id) {
      return res.status(400).json({ mensaje: 'No puedes resetear tu propia contraseña desde esta vista' });
    }

    if (integrante.usuario.rol !== 'emprendedor') {
      return res.status(400).json({ mensaje: 'Solo se pueden resetear contraseñas de usuarios emprendedores' });
    }

    const passwordGenerado = generarPasswordAleatorio();
    integrante.usuario.password = passwordGenerado;
    await integrante.usuario.save();

    res.json({
      mensaje: 'Contraseña reseteada exitosamente',
      passwordTemporal: passwordGenerado
    });
  } catch (error) {
    logger.error('Error al resetear contraseña de integrante:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const buscarUsuariosParaIntegrante = async (req, res) => {
  try {
    // El listado incluye correos y teléfonos de todos los emprendedores sin equipo:
    // solo el admin lo usa para asignar cuentas existentes
    if (req.usuario.rol !== 'admin') {
      return res.status(403).json({ mensaje: 'Solo el administrador puede buscar usuarios' });
    }

    // Excluir usuarios ya asignados a cualquier emprendimiento
    const integrantesActuales = await Integrante.findAll({
      attributes: ['usuario_id']
    });
    const idsExcluir = integrantesActuales.map(i => i.usuario_id);

    const where = { rol: 'emprendedor', activo: true };
    if (idsExcluir.length > 0) {
      where.id = { [Op.notIn]: idsExcluir };
    }

    const usuarios = await Usuario.findAll({
      where,
      attributes: ['id', 'nombre', 'apellido', 'email', 'telefono', 'cargo'],
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

module.exports = {
  crear,
  listar,
  obtenerPorId,
  actualizar,
  eliminar,
  agregarIntegrante,
  eliminarIntegrante,
  resetearPasswordIntegrante,
  buscarUsuariosParaIntegrante,
  miEmprendimiento
};
