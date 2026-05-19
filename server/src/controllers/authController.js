const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { Usuario, Integrante, Emprendimiento, Programa } = require('../models');
const { generarPasswordAleatorio } = require('../utils/helpers');
const { paginate, paginatedResponse } = require('../utils/pagination');
const logger = require('../utils/logger');

const generarToken = (usuario) => {
  return jwt.sign(
    { id: usuario.id, email: usuario.email, rol: usuario.rol },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(401).json({ mensaje: 'Usuario inactivo' });
    }

    const passwordValido = await usuario.validarPassword(password);
    if (!passwordValido) {
      return res.status(401).json({ mensaje: 'Credenciales inválidas' });
    }

    const token = generarToken(usuario);

    res.json({
      mensaje: 'Login exitoso',
      token,
      usuario: usuario.toJSON()
    });
  } catch (error) {
    logger.error('Error en login', { error: error.message, stack: error.stack });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const registrarUsuario = async (req, res) => {
  try {
    const { nombre, apellido, email, rol, telefono, dni, edad, fecha_nacimiento, direccion, distrito, provincia, ciudad, linkedin, genero, area, cargo, dedicacion } = req.body;

    const existente = await Usuario.findOne({ where: { email } });
    if (existente) {
      return res.status(400).json({ mensaje: 'El email ya está registrado' });
    }

    const passwordGenerado = generarPasswordAleatorio();

    const usuario = await Usuario.create({
      nombre,
      apellido,
      email,
      password: passwordGenerado,
      rol: rol || 'emprendedor',
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

    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      usuario: usuario.toJSON(),
      passwordTemporal: passwordGenerado
    });
  } catch (error) {
    logger.error('Error al registrar usuario', { error: error.message, stack: error.stack });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const obtenerPerfil = async (req, res) => {
  try {
    res.json({ usuario: req.usuario.toJSON() });
  } catch (error) {
    logger.error('Error al obtener perfil', { error: error.message, stack: error.stack });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const cambiarPassword = async (req, res) => {
  try {
    const { passwordActual, passwordNuevo } = req.body;

    const usuario = await Usuario.findByPk(req.usuario.id);
    const passwordValido = await usuario.validarPassword(passwordActual);
    if (!passwordValido) {
      return res.status(400).json({ mensaje: 'Contraseña actual incorrecta' });
    }

    usuario.password = passwordNuevo;
    await usuario.save();

    res.json({ mensaje: 'Contraseña actualizada exitosamente' });
  } catch (error) {
    logger.error('Error al cambiar contraseña', { error: error.message, stack: error.stack });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const listarUsuarios = async (req, res) => {
  try {
    const { rol, activo, busqueda } = req.query;
    const where = {};
    if (rol) where.rol = rol;
    if (activo !== undefined) where.activo = activo === 'true';
    if (busqueda) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${busqueda}%` } },
        { apellido: { [Op.like]: `%${busqueda}%` } },
        { email: { [Op.like]: `%${busqueda}%` } }
      ];
    }

    const includeOpts = [
      {
        model: Integrante,
        as: 'integrantes',
        include: [{
          model: Emprendimiento,
          as: 'emprendimiento',
          attributes: ['id', 'nombre'],
          include: [{
            model: Programa,
            as: 'programa',
            attributes: ['id', 'nombre']
          }]
        }]
      }
    ];

    // Support both paginated and legacy (no page param) responses
    if (req.query.page) {
      const { page, limit, offset } = paginate(req.query);
      const { rows, count } = await Usuario.findAndCountAll({ 
        where, 
        include: includeOpts,
        order: [['apellido', 'ASC'], ['nombre', 'ASC']], 
        limit, 
        offset,
        distinct: true
      });
      res.json(paginatedResponse(rows, count, { page, limit }));
    } else {
      const usuarios = await Usuario.findAll({ 
        where, 
        include: includeOpts,
        order: [['apellido', 'ASC'], ['nombre', 'ASC']] 
      });
      res.json({ usuarios });
    }
  } catch (error) {
    logger.error('Error al listar usuarios', { error: error.message, stack: error.stack });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, apellido, email, telefono, rol, activo, dni, edad, fecha_nacimiento, direccion, distrito, provincia, ciudad, linkedin, genero, area, cargo, dedicacion } = req.body;

    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    if (email && email !== usuario.email) {
      const existente = await Usuario.findOne({ where: { email } });
      if (existente) {
        return res.status(400).json({ mensaje: 'El email ya está en uso' });
      }
    }

    await usuario.update({
      nombre: nombre || usuario.nombre,
      apellido: apellido || usuario.apellido,
      email: email || usuario.email,
      telefono: telefono !== undefined ? telefono : usuario.telefono,
      rol: rol || usuario.rol,
      activo: activo !== undefined ? activo : usuario.activo,
      dni: dni !== undefined ? dni : usuario.dni,
      edad: edad !== undefined ? edad : usuario.edad,
      fecha_nacimiento: fecha_nacimiento !== undefined ? fecha_nacimiento : usuario.fecha_nacimiento,
      direccion: direccion !== undefined ? direccion : usuario.direccion,
      distrito: distrito !== undefined ? distrito : usuario.distrito,
      provincia: provincia !== undefined ? provincia : usuario.provincia,
      ciudad: ciudad !== undefined ? ciudad : usuario.ciudad,
      linkedin: linkedin !== undefined ? linkedin : usuario.linkedin,
      genero: genero !== undefined ? genero : usuario.genero,
      area: area !== undefined ? area : usuario.area,
      cargo: cargo !== undefined ? cargo : usuario.cargo,
      dedicacion: dedicacion !== undefined ? dedicacion : usuario.dedicacion
    });

    res.json({ mensaje: 'Usuario actualizado', usuario: usuario.toJSON() });
  } catch (error) {
    logger.error('Error al actualizar usuario', { error: error.message, stack: error.stack });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const resetearPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const usuario = await Usuario.findByPk(id);
    if (!usuario) {
      return res.status(404).json({ mensaje: 'Usuario no encontrado' });
    }

    const passwordGenerado = generarPasswordAleatorio();
    usuario.password = passwordGenerado;
    await usuario.save();

    res.json({
      mensaje: 'Contraseña reseteada exitosamente',
      passwordTemporal: passwordGenerado
    });
  } catch (error) {
    logger.error('Error al resetear contraseña', { error: error.message, stack: error.stack });
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = {
  login,
  registrarUsuario,
  obtenerPerfil,
  cambiarPassword,
  listarUsuarios,
  actualizarUsuario,
  resetearPassword
};
