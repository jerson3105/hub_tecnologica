const { Compromiso, Seguimiento, Sesion, Emprendimiento, Programa, Archivo } = require('../models');
const logger = require('../utils/logger');
const { puedeAccederEmprendimiento, denegar } = require('../utils/acceso');

const obtenerPorSeguimiento = async (req, res) => {
  try {
    const { seguimiento_id } = req.params;
    const seg = await Seguimiento.findByPk(seguimiento_id, { attributes: ['emprendimiento_id'] });
    if (!seg) return res.status(404).json({ mensaje: 'Seguimiento no encontrado' });
    if (!(await puedeAccederEmprendimiento(req.usuario, seg.emprendimiento_id))) {
      return denegar(res, 'No tienes acceso a este seguimiento');
    }
    const compromisos = await Compromiso.findAll({
      where: { seguimiento_id },
      order: [['orden', 'ASC']]
    });
    res.json({ compromisos });
  } catch (error) {
    logger.error('Error al obtener compromisos', { error: error.message });
    res.status(500).json({ mensaje: 'Error al obtener compromisos' });
  }
};

const obtenerPendientesPorEmprendimiento = async (req, res) => {
  try {
    const { emprendimiento_id } = req.params;
    if (!(await puedeAccederEmprendimiento(req.usuario, emprendimiento_id))) {
      return denegar(res, 'No tienes acceso a este emprendimiento');
    }
    const seguimientos = await Seguimiento.findAll({
      where: { emprendimiento_id },
      attributes: ['id']
    });
    const segIds = seguimientos.map(s => s.id);

    const compromisos = await Compromiso.findAll({
      where: {
        seguimiento_id: segIds,
        estado: ['planeado', 'en_progreso']
      },
      include: [{
        model: Seguimiento,
        as: 'seguimientoOrigen',
        include: [{
          model: Sesion,
          as: 'sesion',
          attributes: ['id', 'titulo', 'fecha']
        }]
      }],
      order: [['createdAt', 'ASC']]
    });
    res.json({ compromisos });
  } catch (error) {
    logger.error('Error al obtener compromisos pendientes', { error: error.message });
    res.status(500).json({ mensaje: 'Error al obtener compromisos pendientes' });
  }
};

const crear = async (req, res) => {
  try {
    const { seguimiento_id } = req.params;
    const { descripcion } = req.body;
    if (!descripcion?.trim()) return res.status(400).json({ mensaje: 'La descripción es requerida' });

    const seg = await Seguimiento.findByPk(seguimiento_id);
    if (!seg) return res.status(404).json({ mensaje: 'Seguimiento no encontrado' });

    const count = await Compromiso.count({ where: { seguimiento_id } });
    const compromiso = await Compromiso.create({
      seguimiento_id, descripcion: descripcion.trim(), orden: count
    });
    res.status(201).json({ compromiso });
  } catch (error) {
    logger.error('Error al crear compromiso', { error: error.message });
    res.status(500).json({ mensaje: 'Error al crear compromiso' });
  }
};

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, seguimiento_revision_id } = req.body;

    const compromiso = await Compromiso.findByPk(id);
    if (!compromiso) return res.status(404).json({ mensaje: 'Compromiso no encontrado' });

    await compromiso.update({
      estado: estado || compromiso.estado,
      seguimiento_revision_id: seguimiento_revision_id || compromiso.seguimiento_revision_id
    });
    res.json({ compromiso });
  } catch (error) {
    logger.error('Error al actualizar compromiso', { error: error.message });
    res.status(500).json({ mensaje: 'Error al actualizar compromiso' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const compromiso = await Compromiso.findByPk(id);
    if (!compromiso) return res.status(404).json({ mensaje: 'Compromiso no encontrado' });

    await compromiso.destroy();
    res.json({ mensaje: 'Compromiso eliminado' });
  } catch (error) {
    logger.error('Error al eliminar compromiso', { error: error.message });
    res.status(500).json({ mensaje: 'Error al eliminar compromiso' });
  }
};

const timelineEmprendimiento = async (req, res) => {
  try {
    const { emprendimiento_id } = req.params;
    if (!(await puedeAccederEmprendimiento(req.usuario, emprendimiento_id))) {
      return denegar(res, 'No tienes acceso a este emprendimiento');
    }

    // Obtener el programa del emprendimiento
    const emp = await Emprendimiento.findByPk(emprendimiento_id, { attributes: ['id', 'programa_id'] });
    if (!emp) return res.status(404).json({ mensaje: 'Emprendimiento no encontrado' });

    // Obtener todas las sesiones del programa via sesion_programas
    const sesiones = await Sesion.findAll({
      include: [{
        model: Programa,
        as: 'programas',
        through: { attributes: [] },
        where: { id: emp.programa_id },
        required: true
      }],
      attributes: ['id'],
      order: [['fecha', 'ASC']]
    });

    // Obtener seguimientos existentes para este emprendimiento
    const existentes = await Seguimiento.findAll({
      where: { emprendimiento_id },
      attributes: ['sesion_id']
    });
    const sesionesConSeg = new Set(existentes.map(s => s.sesion_id));

    // Auto-crear seguimientos faltantes
    const faltantes = sesiones.filter(s => !sesionesConSeg.has(s.id));
    if (faltantes.length > 0) {
      await Seguimiento.bulkCreate(
        faltantes.map(s => ({
          sesion_id: s.id,
          emprendimiento_id: parseInt(emprendimiento_id),
          estado_avance: 'sin_iniciar'
        })),
        { ignoreDuplicates: true }
      );
    }

    // Consultar todos los seguimientos con sus relaciones
    const seguimientos = await Seguimiento.findAll({
      where: { emprendimiento_id },
      include: [
        {
          model: Sesion,
          as: 'sesion',
          attributes: ['id', 'titulo', 'fecha', 'tipo', 'enlace_grabacion'],
          include: [
            { model: Programa, as: 'programa', attributes: ['id', 'nombre'] },
            {
              model: Archivo,
              as: 'archivos',
              required: false,
              attributes: ['id', 'tipo', 'nombre_original', 'url', 'categoria', 'created_at'],
              include: [
                {
                  model: Emprendimiento,
                  as: 'emprendimientos',
                  attributes: ['id', 'nombre'],
                  through: { attributes: [] },
                  required: false
                }
              ]
            }
          ]
        },
        {
          model: Compromiso,
          as: 'compromisoItems'
        },
        {
          model: Compromiso,
          as: 'compromisosRevisados'
        }
      ],
      // Sequelize ignora `order` dentro de un include: el orden anidado va aquí
      order: [
        [{ model: Sesion, as: 'sesion' }, 'fecha', 'ASC'],
        [{ model: Compromiso, as: 'compromisoItems' }, 'orden', 'ASC']
      ]
    });

    const empId = Number(emprendimiento_id);
    seguimientos.forEach((seg) => {
      if (!seg.sesion?.archivos) {
        return;
      }

      const archivosFiltrados = seg.sesion.archivos.filter((archivo) => {
        if (!archivo.emprendimientos || archivo.emprendimientos.length === 0) {
          return true;
        }

        return archivo.emprendimientos.some((empArchivo) => empArchivo.id === empId);
      });

      seg.sesion.setDataValue('archivos', archivosFiltrados);
    });

    res.json({ seguimientos });
  } catch (error) {
    logger.error('Error al obtener timeline', { error: error.message });
    res.status(500).json({ mensaje: 'Error al obtener timeline' });
  }
};

module.exports = {
  obtenerPorSeguimiento,
  obtenerPendientesPorEmprendimiento,
  crear,
  actualizarEstado,
  eliminar,
  timelineEmprendimiento
};
