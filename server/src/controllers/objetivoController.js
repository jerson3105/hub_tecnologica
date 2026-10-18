const { Objetivo, ResultadoClave, ActividadOKR, Evidencia, Emprendimiento } = require('../models');
const logger = require('../utils/logger');
const { puedeAccederEmprendimiento, denegar, esUrlHttp } = require('../utils/acceso');

// Los campos opcionales llegan como '' desde los formularios; la BD espera null o un número
const fechaONull = (valor) => (valor ? valor : null);
const numeroONull = (valor) => {
  if (valor === '' || valor === null || valor === undefined) return null;
  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
};

// Cada recurso hijo se resuelve hasta su emprendimiento para validar el acceso
const cargarObjetivo = async (req, res, id) => {
  const objetivo = await Objetivo.findByPk(id);
  if (!objetivo) {
    res.status(404).json({ mensaje: 'Objetivo no encontrado' });
    return null;
  }
  if (!(await puedeAccederEmprendimiento(req.usuario, objetivo.emprendimiento_id))) {
    denegar(res, 'No tienes acceso a este objetivo');
    return null;
  }
  return objetivo;
};

const cargarResultadoClave = async (req, res, id) => {
  const rc = await ResultadoClave.findByPk(id, {
    include: [{ model: Objetivo, as: 'objetivo', attributes: ['emprendimiento_id'] }]
  });
  if (!rc) {
    res.status(404).json({ mensaje: 'Resultado clave no encontrado' });
    return null;
  }
  if (!(await puedeAccederEmprendimiento(req.usuario, rc.objetivo?.emprendimiento_id))) {
    denegar(res, 'No tienes acceso a este resultado clave');
    return null;
  }
  return rc;
};

const cargarActividad = async (req, res, id) => {
  const act = await ActividadOKR.findByPk(id, {
    include: [{
      model: ResultadoClave,
      as: 'resultadoClave',
      attributes: ['id'],
      include: [{ model: Objetivo, as: 'objetivo', attributes: ['emprendimiento_id'] }]
    }]
  });
  if (!act) {
    res.status(404).json({ mensaje: 'Actividad no encontrada' });
    return null;
  }
  if (!(await puedeAccederEmprendimiento(req.usuario, act.resultadoClave?.objetivo?.emprendimiento_id))) {
    denegar(res, 'No tienes acceso a esta actividad');
    return null;
  }
  return act;
};

const obtenerPorEmprendimiento = async (req, res) => {
  try {
    const { emprendimiento_id } = req.params;
    if (!(await puedeAccederEmprendimiento(req.usuario, emprendimiento_id))) {
      return denegar(res, 'No tienes acceso a este emprendimiento');
    }

    const objetivos = await Objetivo.findAll({
      where: { emprendimiento_id, activo: true },
      include: [{
        model: ResultadoClave,
        as: 'resultadosClave',
        include: [{ model: ActividadOKR, as: 'actividades' }]
      }, {
        model: Evidencia,
        as: 'evidencias'
      }],
      // Sequelize ignora `order` dentro de un include: el orden anidado va aquí
      order: [
        ['createdAt', 'ASC'],
        [{ model: ResultadoClave, as: 'resultadosClave' }, 'orden', 'ASC'],
        [{ model: ResultadoClave, as: 'resultadosClave' }, { model: ActividadOKR, as: 'actividades' }, 'orden', 'ASC']
      ]
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
    if (!(await puedeAccederEmprendimiento(req.usuario, emprendimiento_id))) {
      return denegar(res, 'No tienes acceso a este emprendimiento');
    }
    if (!titulo?.trim()) return res.status(400).json({ mensaje: 'El título es requerido' });

    const objetivo = await Objetivo.create({
      emprendimiento_id,
      titulo: titulo.trim(),
      tipo,
      fecha_limite: fechaONull(fecha_limite)
    });
    res.status(201).json({ objetivo });
  } catch (error) {
    logger.error('Error al crear objetivo', { error: error.message });
    res.status(500).json({ mensaje: 'Error al crear objetivo' });
  }
};

const actualizar = async (req, res) => {
  try {
    const objetivo = await cargarObjetivo(req, res, req.params.id);
    if (!objetivo) return;

    const { titulo, tipo, fecha_limite } = req.body;
    await objetivo.update({
      titulo: titulo !== undefined ? titulo : objetivo.titulo,
      tipo: tipo !== undefined ? tipo : objetivo.tipo,
      fecha_limite: fecha_limite !== undefined ? fechaONull(fecha_limite) : objetivo.fecha_limite
    });
    res.json({ objetivo });
  } catch (error) {
    logger.error('Error al actualizar objetivo', { error: error.message });
    res.status(500).json({ mensaje: 'Error al actualizar objetivo' });
  }
};

const eliminar = async (req, res) => {
  try {
    const objetivo = await cargarObjetivo(req, res, req.params.id);
    if (!objetivo) return;

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

    const objetivo = await cargarObjetivo(req, res, objetivo_id);
    if (!objetivo) return;
    if (!descripcion?.trim()) return res.status(400).json({ mensaje: 'La descripción es requerida' });

    const count = await ResultadoClave.count({ where: { objetivo_id } });
    const rc = await ResultadoClave.create({ objetivo_id, descripcion: descripcion.trim(), orden: count });
    res.status(201).json({ resultadoClave: rc });
  } catch (error) {
    logger.error('Error al crear resultado clave', { error: error.message });
    res.status(500).json({ mensaje: 'Error al crear resultado clave' });
  }
};

const actualizarResultadoClave = async (req, res) => {
  try {
    const rc = await cargarResultadoClave(req, res, req.params.id);
    if (!rc) return;

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
    const rc = await cargarResultadoClave(req, res, req.params.id);
    if (!rc) return;

    await ActividadOKR.destroy({ where: { resultado_clave_id: rc.id } });
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

    const rc = await cargarResultadoClave(req, res, resultado_clave_id);
    if (!rc) return;
    if (!descripcion?.trim()) return res.status(400).json({ mensaje: 'La descripción es requerida' });

    const count = await ActividadOKR.count({ where: { resultado_clave_id } });
    const act = await ActividadOKR.create({
      resultado_clave_id,
      descripcion: descripcion.trim(),
      meta_numerica: numeroONull(meta_numerica) ?? 1,
      orden: count
    });
    res.status(201).json({ actividad: act });
  } catch (error) {
    logger.error('Error al crear actividad', { error: error.message });
    res.status(500).json({ mensaje: 'Error al crear actividad' });
  }
};

const actualizarActividad = async (req, res) => {
  try {
    const act = await cargarActividad(req, res, req.params.id);
    if (!act) return;

    const { descripcion, meta_numerica, meta_real, estado } = req.body;
    await act.update({
      descripcion: descripcion !== undefined ? descripcion : act.descripcion,
      meta_numerica: meta_numerica !== undefined ? (numeroONull(meta_numerica) ?? act.meta_numerica) : act.meta_numerica,
      meta_real: meta_real !== undefined ? (numeroONull(meta_real) ?? 0) : act.meta_real,
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
    const act = await cargarActividad(req, res, req.params.id);
    if (!act) return;

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

    const objetivo = await cargarObjetivo(req, res, objetivo_id);
    if (!objetivo) return;
    if (!esUrlHttp(url)) {
      return res.status(400).json({ mensaje: 'La URL debe empezar con http:// o https://' });
    }

    const ev = await Evidencia.create({ objetivo_id, url: url.trim(), descripcion: descripcion?.trim() || null });
    res.status(201).json({ evidencia: ev });
  } catch (error) {
    logger.error('Error al crear evidencia', { error: error.message });
    res.status(500).json({ mensaje: 'Error al crear evidencia' });
  }
};

const eliminarEvidencia = async (req, res) => {
  try {
    const ev = await Evidencia.findByPk(req.params.id, {
      include: [{ model: Objetivo, as: 'objetivo', attributes: ['emprendimiento_id'] }]
    });
    if (!ev) return res.status(404).json({ mensaje: 'Evidencia no encontrada' });
    if (!(await puedeAccederEmprendimiento(req.usuario, ev.objetivo?.emprendimiento_id))) {
      return denegar(res, 'No tienes acceso a esta evidencia');
    }

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
