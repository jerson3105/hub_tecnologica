const { OnePager, Emprendimiento, Integrante } = require('../models');
const logger = require('../utils/logger');

// Obtener el one pager de un emprendimiento
const obtener = async (req, res) => {
  try {
    const { emprendimiento_id } = req.params;

    // Verificar acceso si es emprendedor
    if (req.usuario.rol === 'emprendedor') {
      const esIntegrante = await Integrante.findOne({
        where: { emprendimiento_id, usuario_id: req.usuario.id }
      });
      if (!esIntegrante) {
        return res.status(403).json({ mensaje: 'No tienes acceso a este emprendimiento' });
      }
    }

    let onePager = await OnePager.findOne({ where: { emprendimiento_id } });

    if (!onePager) {
      return res.json({ onePager: null, completo: false });
    }

    const completo = verificarCompleto(onePager);
    res.json({ onePager, completo });
  } catch (error) {
    logger.error('Error al obtener one pager:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Crear o actualizar el one pager
const guardar = async (req, res) => {
  try {
    const { emprendimiento_id } = req.params;

    // Verificar que el emprendimiento existe
    const emprendimiento = await Emprendimiento.findByPk(emprendimiento_id);
    if (!emprendimiento) {
      return res.status(404).json({ mensaje: 'Emprendimiento no encontrado' });
    }

    // Verificar acceso si es emprendedor
    if (req.usuario.rol === 'emprendedor') {
      const esIntegrante = await Integrante.findOne({
        where: { emprendimiento_id, usuario_id: req.usuario.id }
      });
      if (!esIntegrante) {
        return res.status(403).json({ mensaje: 'No tienes acceso a este emprendimiento' });
      }
    }

    const campos = {
      estado_proyecto: req.body.estado_proyecto,
      descripcion: req.body.descripcion,
      pagina_web: req.body.pagina_web,
      facebook: req.body.facebook,
      instagram: req.body.instagram,
      twitter: req.body.twitter,
      youtube: req.body.youtube,
      linkedin: req.body.linkedin,
      otros_links: req.body.otros_links,
      correo_proyecto: req.body.correo_proyecto,
      logo_url: req.body.logo_url,
      problematica: req.body.problematica,
      solucion: req.body.solucion,
      modelo_negocio: req.body.modelo_negocio,
      mercado_objetivo: req.body.mercado_objetivo,
      ventaja_competitiva: req.body.ventaja_competitiva,
      hitos: req.body.hitos,
      necesidades: req.body.necesidades,
      estado_actual: req.body.estado_actual
    };

    let onePager = await OnePager.findOne({ where: { emprendimiento_id } });

    if (onePager) {
      await onePager.update(campos);
    } else {
      onePager = await OnePager.create({ emprendimiento_id, ...campos });
    }

    const completo = verificarCompleto(onePager);
    res.json({ mensaje: 'One Pager guardado exitosamente', onePager, completo });
  } catch (error) {
    logger.error('Error al guardar one pager:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Verificar estado de completitud para un emprendedor (sus emprendimientos)
const verificarEstado = async (req, res) => {
  try {
    const integrantes = await Integrante.findAll({
      where: { usuario_id: req.usuario.id },
      attributes: ['emprendimiento_id']
    });

    const ids = integrantes.map(i => i.emprendimiento_id);
    const resultados = [];

    for (const empId of ids) {
      const onePager = await OnePager.findOne({ where: { emprendimiento_id: empId } });
      resultados.push({
        emprendimiento_id: empId,
        existe: !!onePager,
        completo: onePager ? verificarCompleto(onePager) : false
      });
    }

    res.json({ estados: resultados });
  } catch (error) {
    logger.error('Error al verificar estado one pager:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Campos requeridos para considerar el one pager "completo"
const CAMPOS_REQUERIDOS = [
  'estado_proyecto', 'descripcion', 'correo_proyecto',
  'problematica', 'solucion', 'modelo_negocio'
];

function verificarCompleto(onePager) {
  if (!onePager) return false;
  return CAMPOS_REQUERIDOS.every(campo => {
    const valor = onePager[campo];
    return valor && valor.toString().trim().length > 0;
  });
}

module.exports = { obtener, guardar, verificarEstado };
