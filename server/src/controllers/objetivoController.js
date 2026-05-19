const { Objetivo, ResultadoClave, ActividadOKR, Evidencia, Emprendimiento } = require('../models');
const logger = require('../utils/logger');

const obtenerPorEmprendimiento = async (req, res) => {
  try {
    const { emprendimiento_id } = req.params;
    const objetivos = await Objetivo.findAll({
      where: { emprendimiento_id, activo: true },
      include: [{
        model: ResultadoClave,
        as: 'resultadosClave',
        include: [{
          model: ActividadOKR,
          as: 'actividades',
          order: [['orden', 'ASC']]
        }],
        order: [['orden', 'ASC']]
      }, {
        model: Evidencia,
        as: 'evidencias'
      }],
      order: [['createdAt', 'ASC']]
    });
    res.json({ objetivos });
  } catch (error) {
    logger.error('Error al obtener objetivos', { error: error.message });
    res.status(500).json({ mensaje: 'Error al obtener objetivos' });
  }
};

const crear = async (req, res) => {
  try {
    const { emprendimiento_id } = req.params;
    const { titulo, tipo, fecha_limite } = req.body;

    const emp = await Emprendimiento.findByPk(emprendimiento_id);
    if (!emp) return res.status(404).json({ mensaje: 'Emprendimiento no encontrado' });

    const objetivo = await Objetivo.create({ emprendimiento_id, titulo, tipo, fecha_limite });
    res.status(201).json({ objetivo });
  } catch (error) {
    logger.error('Error al crear objetivo', { error: error.message });
    res.status(500).json({ mensaje: 'Error al crear objetivo' });
  }
};

const actualizar = async (req, res) => {
  try {
    const { id } = req.params;
    const objetivo = await Objetivo.findByPk(id);
    if (!objetivo) return res.status(404).json({ mensaje: 'Objetivo no encontrado' });

    const { titulo, tipo, fecha_limite } = req.body;
    await objetivo.update({ titulo, tipo, fecha_limite });
    res.json({ objetivo });
  } catch (error) {
    logger.error('Error al actualizar objetivo', { error: error.message });
    res.status(500).json({ mensaje: 'Error al actualizar objetivo' });
  }
};

const eliminar = async (req, res) => {
  try {
    const { id } = req.params;
    const objetivo = await Objetivo.findByPk(id);
    if (!objetivo) return res.status(404).json({ mensaje: 'Objetivo no encontrado' });

    await objetivo.update({ activo: false });
    res.json({ mensaje: 'Objetivo eliminado' });
  } catch (error) {
    logger.error('Error al eliminar objetivo', { error: error.message });
    res.status(500).json({ mensaje: 'Error al eliminar objetivo' });
  }
};

// Resultados Clave
const crearResultadoClave = async (req, res) => {
  try {
    const { objetivo_id } = req.params;
    const { descripcion } = req.body;

    const objetivo = await Objetivo.findByPk(objetivo_id);
    if (!objetivo) return res.status(404).json({ mensaje: 'Objetivo no encontrado' });

    const count = await ResultadoClave.count({ where: { objetivo_id } });
    const rc = await ResultadoClave.create({ objetivo_id, descripcion, orden: count });
    res.status(201).json({ resultadoClave: rc });
  } catch (error) {
    logger.error('Error al crear resultado clave', { error: error.message });
    res.status(500).json({ mensaje: 'Error al crear resultado clave' });
  }
};

const actualizarResultadoClave = async (req, res) => {
  try {
    const { id } = req.params;
    const rc = await ResultadoClave.findByPk(id);
    if (!rc) return res.status(404).json({ mensaje: 'Resultado clave no encontrado' });

    const { descripcion } = req.body;
    await rc.update({ descripcion });
    res.json({ resultadoClave: rc });
  } catch (error) {
    logger.error('Error al actualizar resultado clave', { error: error.message });
    res.status(500).json({ mensaje: 'Error al actualizar resultado clave' });
  }
};

const eliminarResultadoClave = async (req, res) => {
  try {
    const { id } = req.params;
    const rc = await ResultadoClave.findByPk(id);
    if (!rc) return res.status(404).json({ mensaje: 'Resultado clave no encontrado' });

    await ActividadOKR.destroy({ where: { resultado_clave_id: id } });
    await rc.destroy();
    res.json({ mensaje: 'Resultado clave eliminado' });
  } catch (error) {
    logger.error('Error al eliminar resultado clave', { error: error.message });
    res.status(500).json({ mensaje: 'Error al eliminar resultado clave' });
  }
};

// Actividades
const crearActividad = async (req, res) => {
  try {
    const { resultado_clave_id } = req.params;
    const { descripcion, meta_numerica } = req.body;

    const rc = await ResultadoClave.findByPk(resultado_clave_id);
    if (!rc) return res.status(404).json({ mensaje: 'Resultado clave no encontrado' });

    const count = await ActividadOKR.count({ where: { resultado_clave_id } });
    const act = await ActividadOKR.create({
      resultado_clave_id, descripcion, meta_numerica: meta_numerica || 1, orden: count
    });
    res.status(201).json({ actividad: act });
  } catch (error) {
    logger.error('Error al crear actividad', { error: error.message });
    res.status(500).json({ mensaje: 'Error al crear actividad' });
  }
};

const actualizarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const act = await ActividadOKR.findByPk(id);
    if (!act) return res.status(404).json({ mensaje: 'Actividad no encontrada' });

    const { descripcion, meta_numerica, meta_real, estado } = req.body;
    await act.update({
      descripcion: descripcion !== undefined ? descripcion : act.descripcion,
      meta_numerica: meta_numerica !== undefined ? meta_numerica : act.meta_numerica,
      meta_real: meta_real !== undefined ? meta_real : act.meta_real,
      estado: estado || act.estado
    });
    res.json({ actividad: act });
  } catch (error) {
    logger.error('Error al actualizar actividad', { error: error.message });
    res.status(500).json({ mensaje: 'Error al actualizar actividad' });
  }
};

const eliminarActividad = async (req, res) => {
  try {
    const { id } = req.params;
    const act = await ActividadOKR.findByPk(id);
    if (!act) return res.status(404).json({ mensaje: 'Actividad no encontrada' });

    await act.destroy();
    res.json({ mensaje: 'Actividad eliminada' });
  } catch (error) {
    logger.error('Error al eliminar actividad', { error: error.message });
    res.status(500).json({ mensaje: 'Error al eliminar actividad' });
  }
};

// Evidencias
const crearEvidencia = async (req, res) => {
  try {
    const { objetivo_id } = req.params;
    const { url, descripcion } = req.body;

    const objetivo = await Objetivo.findByPk(objetivo_id);
    if (!objetivo) return res.status(404).json({ mensaje: 'Objetivo no encontrado' });

    const ev = await Evidencia.create({ objetivo_id, url, descripcion });
    res.status(201).json({ evidencia: ev });
  } catch (error) {
    logger.error('Error al crear evidencia', { error: error.message });
    res.status(500).json({ mensaje: 'Error al crear evidencia' });
  }
};

const eliminarEvidencia = async (req, res) => {
  try {
    const { id } = req.params;
    const ev = await Evidencia.findByPk(id);
    if (!ev) return res.status(404).json({ mensaje: 'Evidencia no encontrada' });

    await ev.destroy();
    res.json({ mensaje: 'Evidencia eliminada' });
  } catch (error) {
    logger.error('Error al eliminar evidencia', { error: error.message });
    res.status(500).json({ mensaje: 'Error al eliminar evidencia' });
  }
};

module.exports = {
  obtenerPorEmprendimiento,
  crear,
  actualizar,
  eliminar,
  crearResultadoClave,
  actualizarResultadoClave,
  eliminarResultadoClave,
  crearActividad,
  actualizarActividad,
  eliminarActividad,
  crearEvidencia,
  eliminarEvidencia
};
