const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Archivo, ArchivoEmprendimiento, Emprendimiento, Integrante, Sesion } = require('../models');
const { paginate, paginatedResponse } = require('../utils/pagination');
const logger = require('../utils/logger');

const subir = async (req, res) => {
  try {
    const { categoria, emprendimiento_ids, emprendimiento_id, sesion_id } = req.body;
    let empIds = emprendimiento_ids ? (Array.isArray(emprendimiento_ids) ? emprendimiento_ids : JSON.parse(emprendimiento_ids)) : [];
    // Support single emprendimiento_id from entrepreneur upload form
    if (empIds.length === 0 && emprendimiento_id) {
      empIds = [emprendimiento_id];
    }

    // Verificar acceso si es emprendedor
    if (req.usuario.rol === 'emprendedor' && empIds.length > 0) {
      for (const empId of empIds) {
        const esIntegrante = await Integrante.findOne({
          where: { emprendimiento_id: empId, usuario_id: req.usuario.id }
        });
        if (!esIntegrante) {
          if (req.file) fs.unlinkSync(req.file.path);
          return res.status(403).json({ mensaje: 'No tienes acceso a uno de los emprendimientos seleccionados' });
        }
      }
    }

    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó ningún archivo' });
    }

    const archivo = await Archivo.create({
      tipo: 'archivo',
      nombre_original: req.file.originalname,
      nombre_archivo: req.file.filename,
      ruta: req.file.path,
      tipo_mime: req.file.mimetype,
      tamanio: req.file.size,
      categoria: categoria || 'otro',
      sesion_id: sesion_id || null,
      subido_por: req.usuario.id
    });

    // Crear relaciones con emprendimientos
    if (empIds.length > 0) {
      await ArchivoEmprendimiento.bulkCreate(
        empIds.map(empId => ({ archivo_id: archivo.id, emprendimiento_id: empId }))
      );
    }

    const archivoConRelaciones = await Archivo.findByPk(archivo.id, {
      include: [{ model: Emprendimiento, as: 'emprendimientos', attributes: ['id', 'nombre'] }]
    });

    res.status(201).json({ mensaje: 'Archivo subido exitosamente', archivo: archivoConRelaciones });
  } catch (error) {
    logger.error('Error al subir archivo:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const crearEnlace = async (req, res) => {
  try {
    const { nombre, url, categoria, emprendimiento_ids, sesion_id } = req.body;

    if (!url) {
      return res.status(400).json({ mensaje: 'La URL es requerida' });
    }
    if (!nombre) {
      return res.status(400).json({ mensaje: 'El nombre es requerido' });
    }

    const empIds = emprendimiento_ids || [];

    // Verificar acceso si es emprendedor
    if (req.usuario.rol === 'emprendedor' && empIds.length > 0) {
      for (const empId of empIds) {
        const esIntegrante = await Integrante.findOne({
          where: { emprendimiento_id: empId, usuario_id: req.usuario.id }
        });
        if (!esIntegrante) {
          return res.status(403).json({ mensaje: 'No tienes acceso a uno de los emprendimientos seleccionados' });
        }
      }
    }

    const archivo = await Archivo.create({
      tipo: 'enlace',
      nombre_original: nombre,
      url,
      categoria: categoria || 'otro',
      sesion_id: sesion_id || null,
      subido_por: req.usuario.id
    });

    if (empIds.length > 0) {
      await ArchivoEmprendimiento.bulkCreate(
        empIds.map(empId => ({ archivo_id: archivo.id, emprendimiento_id: empId }))
      );
    }

    const archivoConRelaciones = await Archivo.findByPk(archivo.id, {
      include: [{ model: Emprendimiento, as: 'emprendimientos', attributes: ['id', 'nombre'] }]
    });

    res.status(201).json({ mensaje: 'Enlace guardado exitosamente', archivo: archivoConRelaciones });
  } catch (error) {
    logger.error('Error al crear enlace:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const listar = async (req, res) => {
  try {
    const { emprendimiento_id, sesion_id, categoria } = req.query;
    const where = {};
    if (sesion_id) where.sesion_id = sesion_id;
    if (categoria) where.categoria = categoria;

    let archivos;

    if (req.usuario.rol === 'emprendedor') {
      const integrantes = await Integrante.findAll({
        where: { usuario_id: req.usuario.id },
        attributes: ['emprendimiento_id']
      });
      const misEmpIds = integrantes.map(i => i.emprendimiento_id);

      archivos = await Archivo.findAll({
        where,
        include: [
          {
            model: Emprendimiento,
            as: 'emprendimientos',
            attributes: ['id', 'nombre'],
            where: { id: { [Op.in]: misEmpIds } },
            required: true
          },
          { model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha'] }
        ],
        order: [['created_at', 'DESC']]
      });
    } else if (emprendimiento_id) {
      archivos = await Archivo.findAll({
        where,
        include: [
          {
            model: Emprendimiento,
            as: 'emprendimientos',
            attributes: ['id', 'nombre'],
            where: { id: emprendimiento_id },
            required: true
          },
          { model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha'] }
        ],
        order: [['created_at', 'DESC']]
      });
    } else {
      archivos = await Archivo.findAll({
        where,
        include: [
          {
            model: Emprendimiento,
            as: 'emprendimientos',
            attributes: ['id', 'nombre']
          },
          { model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha'] }
        ],
        order: [['created_at', 'DESC']]
      });
    }

    res.json({ archivos });
  } catch (error) {
    logger.error('Error al listar archivos:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const descargar = async (req, res) => {
  try {
    const archivo = await Archivo.findByPk(req.params.id, {
      include: [{ model: Emprendimiento, as: 'emprendimientos', attributes: ['id'] }]
    });
    if (!archivo) {
      return res.status(404).json({ mensaje: 'Archivo no encontrado' });
    }

    if (archivo.tipo === 'enlace') {
      return res.redirect(archivo.url);
    }

    // Verificar acceso si es emprendedor
    if (req.usuario.rol === 'emprendedor' && archivo.emprendimientos?.length > 0) {
      const empIds = archivo.emprendimientos.map(e => e.id);
      const esIntegrante = await Integrante.findOne({
        where: { emprendimiento_id: { [Op.in]: empIds }, usuario_id: req.usuario.id }
      });
      if (!esIntegrante) {
        return res.status(403).json({ mensaje: 'No tienes acceso a este archivo' });
      }
    }

    if (!fs.existsSync(archivo.ruta)) {
      return res.status(404).json({ mensaje: 'Archivo no encontrado en el servidor' });
    }

    res.download(archivo.ruta, archivo.nombre_original);
  } catch (error) {
    logger.error('Error al descargar archivo:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const eliminar = async (req, res) => {
  try {
    const archivo = await Archivo.findByPk(req.params.id);
    if (!archivo) {
      return res.status(404).json({ mensaje: 'Archivo no encontrado' });
    }

    // Eliminar relaciones
    await ArchivoEmprendimiento.destroy({ where: { archivo_id: archivo.id } });

    // Eliminar archivo físico si es tipo archivo
    if (archivo.tipo === 'archivo' && archivo.ruta && fs.existsSync(archivo.ruta)) {
      fs.unlinkSync(archivo.ruta);
    }

    await archivo.destroy();
    res.json({ mensaje: 'Archivo eliminado' });
  } catch (error) {
    logger.error('Error al eliminar archivo:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { subir, crearEnlace, listar, descargar, eliminar };
