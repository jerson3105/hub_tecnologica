const path = require('path');
const fs = require('fs');
const { Op } = require('sequelize');
const { Archivo, ArchivoEmprendimiento, Emprendimiento, Integrante, Sesion } = require('../models');
const logger = require('../utils/logger');
const { categoriaSegura } = require('../middleware/upload');
const {
  puedeAccederEmprendimiento, puedeAccederSesion, esUrlHttp,
  emprendimientoIdsDeUsuario, programaIdsDeUsuario, sesionIdsDeProgramas
} = require('../utils/acceso');

// Campos que se devuelven al cliente (sin la ruta interna del servidor)
const ATRIBUTOS_PUBLICOS = { exclude: ['ruta', 'nombre_archivo'] };

const borrarArchivoSubido = (file) => {
  if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path);
};

// Un emprendedor solo puede vincular material a sus emprendimientos (al menos uno)
// y a sesiones de su programa. Devuelve un mensaje de error o null.
const validarDestinoEmprendedor = async (usuario, empIds, sesionId) => {
  if (usuario.rol !== 'emprendedor') return null;
  if (empIds.length === 0) return 'Debes seleccionar tu emprendimiento';
  for (const empId of empIds) {
    if (!(await puedeAccederEmprendimiento(usuario, empId))) {
      return 'No tienes acceso a uno de los emprendimientos seleccionados';
    }
  }
  if (sesionId && !(await puedeAccederSesion(usuario, sesionId))) {
    return 'No tienes acceso a la sesión seleccionada';
  }
  return null;
};

const parsearIds = (valor) => {
  if (!valor) return [];
  if (Array.isArray(valor)) return valor;
  try {
    const ids = JSON.parse(valor);
    return Array.isArray(ids) ? ids : [ids];
  } catch {
    return [valor];
  }
};

const subir = async (req, res) => {
  try {
    const { categoria, emprendimiento_ids, emprendimiento_id, sesion_id } = req.body;
    let empIds = parsearIds(emprendimiento_ids);
    // Support single emprendimiento_id from entrepreneur upload form
    if (empIds.length === 0 && emprendimiento_id) {
      empIds = [emprendimiento_id];
    }

    if (!req.file) {
      return res.status(400).json({ mensaje: 'No se proporcionó ningún archivo' });
    }

    const errorDestino = await validarDestinoEmprendedor(req.usuario, empIds, sesion_id);
    if (errorDestino) {
      borrarArchivoSubido(req.file);
      return res.status(403).json({ mensaje: errorDestino });
    }

    const archivo = await Archivo.create({
      tipo: 'archivo',
      nombre_original: req.file.originalname,
      nombre_archivo: req.file.filename,
      ruta: req.file.path,
      tipo_mime: req.file.mimetype,
      tamanio: req.file.size,
      categoria: categoriaSegura(categoria),
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
      attributes: ATRIBUTOS_PUBLICOS,
      include: [{ model: Emprendimiento, as: 'emprendimientos', attributes: ['id', 'nombre'] }]
    });

    res.status(201).json({ mensaje: 'Archivo subido exitosamente', archivo: archivoConRelaciones });
  } catch (error) {
    borrarArchivoSubido(req.file);
    logger.error('Error al subir archivo:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const crearEnlace = async (req, res) => {
  try {
    const { nombre, url, descripcion, categoria, emprendimiento_ids, sesion_id } = req.body;

    if (!url) {
      return res.status(400).json({ mensaje: 'La URL es requerida' });
    }
    if (!esUrlHttp(url)) {
      return res.status(400).json({ mensaje: 'La URL debe empezar con http:// o https://' });
    }
    if (!nombre) {
      return res.status(400).json({ mensaje: 'El nombre es requerido' });
    }

    const empIds = parsearIds(emprendimiento_ids);

    const errorDestino = await validarDestinoEmprendedor(req.usuario, empIds, sesion_id);
    if (errorDestino) {
      return res.status(403).json({ mensaje: errorDestino });
    }

    const archivo = await Archivo.create({
      tipo: 'enlace',
      nombre_original: nombre,
      url: url.trim(),
      descripcion: descripcion?.trim() || null,
      categoria: categoriaSegura(categoria),
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

const INCLUDE_SESION = { model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha', 'tipo'] };

// Material que ve un emprendedor: el vinculado a sus emprendimientos y el compartido con toda
// una sesión de su programa (sin emprendimientos), igual que en el detalle de la sesión y en
// la descarga. De cada material solo ve sus propios emprendimientos, no los de otros equipos.
const listarParaEmprendedor = async (usuario, where) => {
  const [misEmpIds, programaIds] = await Promise.all([
    emprendimientoIdsDeUsuario(usuario.id),
    programaIdsDeUsuario(usuario.id)
  ]);
  const sesionIds = await sesionIdsDeProgramas(programaIds);
  const [vinculados, deSesion] = await Promise.all([
    misEmpIds.length
      ? ArchivoEmprendimiento.findAll({ where: { emprendimiento_id: { [Op.in]: misEmpIds } }, attributes: ['archivo_id'] })
      : [],
    sesionIds.length
      ? Archivo.findAll({
        where: { sesion_id: { [Op.in]: sesionIds } },
        attributes: ['id'],
        include: [{ model: Emprendimiento, as: 'emprendimientos', attributes: ['id'], through: { attributes: [] } }]
      })
      : []
  ]);
  const ids = new Set([
    ...vinculados.map(v => v.archivo_id),
    ...deSesion.filter(a => !a.emprendimientos?.length).map(a => a.id)
  ]);
  // Sin emprendimiento no hay programa ni sesiones: ids vacío, así que misEmpIds nunca lo está abajo
  if (ids.size === 0) return [];

  return Archivo.findAll({
    where: { ...where, id: { [Op.in]: [...ids] } },
    attributes: ATRIBUTOS_PUBLICOS,
    include: [
      {
        model: Emprendimiento,
        as: 'emprendimientos',
        attributes: ['id', 'nombre'],
        through: { attributes: [] },
        where: { id: { [Op.in]: misEmpIds } },
        required: false
      },
      INCLUDE_SESION
    ],
    order: [['created_at', 'DESC']]
  });
};

const listar = async (req, res) => {
  try {
    const { emprendimiento_id, sesion_id, categoria } = req.query;
    const where = {};
    if (sesion_id) where.sesion_id = sesion_id;
    if (categoria) where.categoria = categoria;

    if (req.usuario.rol === 'emprendedor') {
      return res.json({ archivos: await listarParaEmprendedor(req.usuario, where) });
    }

    const archivos = await Archivo.findAll({
      where,
      attributes: ATRIBUTOS_PUBLICOS,
      include: [
        {
          model: Emprendimiento,
          as: 'emprendimientos',
          attributes: ['id', 'nombre'],
        through: { attributes: [] },
          ...(emprendimiento_id ? { where: { id: emprendimiento_id }, required: true } : {})
        },
        INCLUDE_SESION
      ],
      order: [['created_at', 'DESC']]
    });

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

    // Un emprendedor descarga archivos de sus emprendimientos o, si el archivo no está
    // vinculado a ninguno, el material compartido de una sesión de su programa.
    if (req.usuario.rol === 'emprendedor') {
      let permitido;
      if (archivo.emprendimientos?.length > 0) {
        const empIds = archivo.emprendimientos.map(e => e.id);
        permitido = !!(await Integrante.findOne({
          where: { emprendimiento_id: { [Op.in]: empIds }, usuario_id: req.usuario.id }
        }));
      } else {
        permitido = await puedeAccederSesion(req.usuario, archivo.sesion_id);
      }
      if (!permitido) {
        return res.status(403).json({ mensaje: 'No tienes acceso a este archivo' });
      }
    }

    if (archivo.tipo === 'enlace') {
      if (!esUrlHttp(archivo.url)) {
        return res.status(400).json({ mensaje: 'El enlace no es válido' });
      }
      return res.redirect(archivo.url);
    }

    if (!archivo.ruta || !fs.existsSync(archivo.ruta)) {
      return res.status(404).json({ mensaje: 'Archivo no encontrado en el servidor' });
    }

    // La ruta la genera el servidor; `dotfiles: 'allow'` evita un 404 si la app vive
    // bajo un directorio que empieza por punto (p. ej. /home/app/.deploy/...)
    res.download(archivo.ruta, archivo.nombre_original, { dotfiles: 'allow' });
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
