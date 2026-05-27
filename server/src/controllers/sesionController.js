const { Sesion, SesionPrograma, Programa, Seguimiento, Emprendimiento, Asistencia, Usuario, Archivo, Integrante } = require('../models');
const { Op } = require('sequelize');
const logger = require('../utils/logger');

const crear = async (req, res) => {
  try {
    const { programa_ids, titulo, descripcion, fecha, tipo, enlace_grabacion } = req.body;

    const ids = (Array.isArray(programa_ids) ? programa_ids : [programa_ids]).map(Number).filter(Boolean);
    if (!ids.length) {
      return res.status(400).json({ mensaje: 'Debe seleccionar al menos un programa' });
    }

    const programas = await Programa.findAll({ where: { id: ids } });
    if (programas.length !== ids.length) {
      return res.status(404).json({ mensaje: 'Uno o más programas no encontrados' });
    }

    const sesion = await Sesion.create({
      programa_id: ids.length === 1 ? ids[0] : null,
      titulo,
      descripcion,
      fecha,
      tipo,
      enlace_grabacion
    });

    await SesionPrograma.bulkCreate(ids.map(pid => ({ sesion_id: sesion.id, programa_id: pid })));

    res.status(201).json({ mensaje: 'Sesión creada exitosamente', sesion });
  } catch (error) {
    logger.error('Error al crear sesión:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const listar = async (req, res) => {
  try {
    const { programa_id, tipo } = req.query;
    const where = {};
    if (tipo) where.tipo = tipo;

    const programasInclude = {
      model: Programa,
      as: 'programas',
      through: { attributes: [] },
      attributes: ['id', 'nombre']
    };

    if (programa_id) {
      programasInclude.where = { id: programa_id };
      programasInclude.required = true;
    }

    if (req.usuario.rol === 'emprendedor') {
      const integrantes = await Integrante.findAll({
        where: { usuario_id: req.usuario.id },
        include: [{ model: Emprendimiento, as: 'emprendimiento', attributes: ['programa_id'] }]
      });
      const programaIds = [...new Set(integrantes.map(i => i.emprendimiento?.programa_id).filter(Boolean))];
      if (!programaIds.length) return res.json({ sesiones: [] });

      if (!programa_id) {
        programasInclude.where = { id: { [Op.in]: programaIds } };
        programasInclude.required = true;
      }
    }

    const sesiones = await Sesion.findAll({
      where,
      include: [programasInclude],
      order: [['fecha', 'DESC']]
    });

    res.json({ sesiones });
  } catch (error) {
    logger.error('Error al listar sesiones:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const esEmprendedor = req.usuario.rol === 'emprendedor';

    // Si es emprendedor, obtener sus emprendimiento IDs para filtrar
    let misEmprendimientoIds = [];
    if (esEmprendedor) {
      const integrantes = await Integrante.findAll({
        where: { usuario_id: req.usuario.id },
        attributes: ['emprendimiento_id']
      });
      misEmprendimientoIds = integrantes.map(i => i.emprendimiento_id);
    }

    const sesion = await Sesion.findByPk(req.params.id, {
      include: [
        { model: Programa, as: 'programas', through: { attributes: [] }, attributes: ['id', 'nombre'] },
        { model: Programa, as: 'programa', attributes: ['id', 'nombre'] },
        {
          model: Seguimiento,
          as: 'seguimientos',
          required: false,
          ...(esEmprendedor && misEmprendimientoIds.length > 0
            ? { where: { emprendimiento_id: misEmprendimientoIds } }
            : {}),
          include: [
            { model: Emprendimiento, as: 'emprendimiento', attributes: ['id', 'nombre'] }
          ]
        },
        {
          model: Asistencia,
          as: 'asistencias',
          include: [
            { model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] }
          ]
        },
        {
          model: Archivo,
          as: 'archivos',
          attributes: ['id', 'tipo', 'nombre_original', 'url', 'tipo_mime', 'tamanio', 'categoria', 'created_at'],
          include: [
            { model: Emprendimiento, as: 'emprendimientos', attributes: ['id', 'nombre'] }
          ]
        }
      ]
    });

    if (!sesion) {
      return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    }

    // Si es emprendedor, filtrar archivos para mostrar solo los asociados a sus emprendimientos o sin emprendimiento
    if (esEmprendedor && sesion.archivos) {
      const archivosFiltrados = sesion.archivos.filter(arch => {
        if (!arch.emprendimientos || arch.emprendimientos.length === 0) return true;
        return arch.emprendimientos.some(emp => misEmprendimientoIds.includes(emp.id));
      });
      sesion.setDataValue('archivos', archivosFiltrados);
    }

    res.json({ sesion });
  } catch (error) {
    logger.error('Error al obtener sesión:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const actualizar = async (req, res) => {
  try {
    const sesion = await Sesion.findByPk(req.params.id);
    if (!sesion) {
      return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    }

    const { programa_ids, titulo, descripcion, fecha, tipo, enlace_grabacion } = req.body;

    if (programa_ids) {
      const ids = (Array.isArray(programa_ids) ? programa_ids : [programa_ids]).map(Number).filter(Boolean);
      if (!ids.length) {
        return res.status(400).json({ mensaje: 'Debe seleccionar al menos un programa' });
      }
      const programas = await Programa.findAll({ where: { id: ids } });
      if (programas.length !== ids.length) {
        return res.status(404).json({ mensaje: 'Uno o más programas no encontrados' });
      }
      await SesionPrograma.destroy({ where: { sesion_id: sesion.id } });
      await SesionPrograma.bulkCreate(ids.map(pid => ({ sesion_id: sesion.id, programa_id: pid })));
      await sesion.update({ programa_id: ids.length === 1 ? ids[0] : null });
    }

    await sesion.update({
      titulo: titulo || sesion.titulo,
      descripcion: descripcion !== undefined ? descripcion : sesion.descripcion,
      fecha: fecha || sesion.fecha,
      tipo: tipo || sesion.tipo,
      enlace_grabacion: enlace_grabacion !== undefined ? enlace_grabacion : sesion.enlace_grabacion
    });

    res.json({ mensaje: 'Sesión actualizada', sesion });
  } catch (error) {
    logger.error('Error al actualizar sesión:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const eliminar = async (req, res) => {
  try {
    const sesion = await Sesion.findByPk(req.params.id);
    if (!sesion) {
      return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    }

    await sesion.destroy();
    res.json({ mensaje: 'Sesión eliminada' });
  } catch (error) {
    logger.error('Error al eliminar sesión:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { crear, listar, obtenerPorId, actualizar, eliminar };
