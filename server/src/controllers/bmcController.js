const { BmcVersion, Emprendimiento, Integrante, Usuario } = require('../models');
const logger = require('../utils/logger');

const CAMPOS_BMC = [
  'socios_clave', 'actividades_clave', 'recursos_clave',
  'propuesta_valor', 'relacion_clientes', 'canales',
  'segmento_clientes', 'estructura_costos', 'fuentes_ingresos'
];

// Listar versiones de BMC de un emprendimiento
const listarVersiones = async (req, res) => {
  try {
    const { emprendimientoId } = req.params;

    // Verificar acceso si es emprendedor
    if (req.usuario.rol === 'emprendedor') {
      const esIntegrante = await Integrante.findOne({
        where: { emprendimiento_id: emprendimientoId, usuario_id: req.usuario.id }
      });
      if (!esIntegrante) {
        return res.status(403).json({ mensaje: 'No tienes acceso a este emprendimiento' });
      }
    }

    const versiones = await BmcVersion.findAll({
      where: { emprendimiento_id: emprendimientoId },
      attributes: ['id', 'version', 'nombre', 'feedback', 'feedback_fecha', 'created_at', 'updated_at'],
      include: [
        { model: Usuario, as: 'feedbackUsuario', attributes: ['id', 'nombre', 'apellido'] }
      ],
      order: [['version', 'DESC']]
    });

    res.json({ versiones });
  } catch (error) {
    logger.error('Error al listar versiones BMC:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Obtener una versión específica
const obtenerVersion = async (req, res) => {
  try {
    const bmc = await BmcVersion.findByPk(req.params.id, {
      include: [
        { model: Emprendimiento, as: 'emprendimiento', attributes: ['id', 'nombre'] },
        { model: Usuario, as: 'feedbackUsuario', attributes: ['id', 'nombre', 'apellido'] }
      ]
    });

    if (!bmc) {
      return res.status(404).json({ mensaje: 'Versión de BMC no encontrada' });
    }

    // Verificar acceso si es emprendedor
    if (req.usuario.rol === 'emprendedor') {
      const esIntegrante = await Integrante.findOne({
        where: { emprendimiento_id: bmc.emprendimiento_id, usuario_id: req.usuario.id }
      });
      if (!esIntegrante) {
        return res.status(403).json({ mensaje: 'No tienes acceso a este BMC' });
      }
    }

    res.json({ bmc });
  } catch (error) {
    logger.error('Error al obtener BMC:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Crear nueva versión
const crearVersion = async (req, res) => {
  try {
    const { emprendimiento_id, nombre } = req.body;

    // Verificar acceso
    if (req.usuario.rol === 'emprendedor') {
      const esIntegrante = await Integrante.findOne({
        where: { emprendimiento_id, usuario_id: req.usuario.id }
      });
      if (!esIntegrante) {
        return res.status(403).json({ mensaje: 'No tienes acceso a este emprendimiento' });
      }
    }

    // Obtener siguiente número de versión
    const ultimaVersion = await BmcVersion.findOne({
      where: { emprendimiento_id },
      order: [['version', 'DESC']],
      attributes: ['version']
    });
    const nuevaVersion = (ultimaVersion?.version || 0) + 1;

    // Extraer campos BMC del body
    const datosBmc = {};
    CAMPOS_BMC.forEach(campo => {
      if (req.body[campo] !== undefined) {
        datosBmc[campo] = req.body[campo];
      }
    });

    const bmc = await BmcVersion.create({
      emprendimiento_id,
      version: nuevaVersion,
      nombre: nombre || `Versión ${nuevaVersion}`,
      ...datosBmc
    });

    res.status(201).json({ mensaje: 'Versión de BMC creada', bmc });
  } catch (error) {
    logger.error('Error al crear BMC:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Actualizar versión existente
const actualizarVersion = async (req, res) => {
  try {
    const bmc = await BmcVersion.findByPk(req.params.id);
    if (!bmc) {
      return res.status(404).json({ mensaje: 'Versión de BMC no encontrada' });
    }

    // Verificar acceso
    if (req.usuario.rol === 'emprendedor') {
      const esIntegrante = await Integrante.findOne({
        where: { emprendimiento_id: bmc.emprendimiento_id, usuario_id: req.usuario.id }
      });
      if (!esIntegrante) {
        return res.status(403).json({ mensaje: 'No tienes acceso a este BMC' });
      }
    }

    const datosActualizar = {};
    if (req.body.nombre !== undefined) datosActualizar.nombre = req.body.nombre;
    CAMPOS_BMC.forEach(campo => {
      if (req.body[campo] !== undefined) {
        datosActualizar[campo] = req.body[campo];
      }
    });

    await bmc.update(datosActualizar);
    res.json({ mensaje: 'BMC actualizado', bmc });
  } catch (error) {
    logger.error('Error al actualizar BMC:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Eliminar versión
const eliminarVersion = async (req, res) => {
  try {
    const bmc = await BmcVersion.findByPk(req.params.id);
    if (!bmc) {
      return res.status(404).json({ mensaje: 'Versión de BMC no encontrada' });
    }

    await bmc.destroy();
    res.json({ mensaje: 'Versión de BMC eliminada' });
  } catch (error) {
    logger.error('Error al eliminar BMC:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Admin da feedback a una versión
const darFeedback = async (req, res) => {
  try {
    const bmc = await BmcVersion.findByPk(req.params.id);
    if (!bmc) {
      return res.status(404).json({ mensaje: 'Versión de BMC no encontrada' });
    }

    const { feedback } = req.body;
    await bmc.update({
      feedback,
      feedback_por: req.usuario.id,
      feedback_fecha: new Date()
    });

    res.json({ mensaje: 'Feedback registrado', bmc });
  } catch (error) {
    logger.error('Error al dar feedback BMC:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { listarVersiones, obtenerVersion, crearVersion, actualizarVersion, eliminarVersion, darFeedback };
