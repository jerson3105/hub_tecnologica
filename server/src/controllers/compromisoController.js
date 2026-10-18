const { Compromiso, Seguimiento, Sesion, Emprendimiento, Programa, Archivo } = require('../models');
const logger = require('../utils/logger');
const { puedeAccederEmprendimiento, denegar, esAdmin } = require('../utils/acceso');

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

const ESTADOS_VALIDOS = ['planeado', 'en_progreso', 'completado', 'no_logrado'];

const actualizarEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, seguimiento_revision_id } = req.body;

    if (estado !== undefined && !ESTADOS_VALIDOS.includes(estado)) {
      return res.status(400).json({ mensaje: 'Estado no válido' });
    }

    const compromiso = await Compromiso.findByPk(id, {
      include: [{ model: Seguimiento, as: 'seguimientoOrigen', attributes: ['emprendimiento_id'] }]
    });
    if (!compromiso) return res.status(404).json({ mensaje: 'Compromiso no encontrado' });

    // El emprendedor puede marcar los compromisos de su propio emprendimiento
    if (!(await puedeAccederEmprendimiento(req.usuario, compromiso.seguimientoOrigen?.emprendimiento_id))) {
      return denegar(res, 'No tienes acceso a este compromiso');
    }

    const cambios = { estado: estado || compromiso.estado };
    // Vincular la revisión a un seguimiento es parte del registro de la sesión: solo el equipo
    if (esAdmin(req.usuario) && seguimiento_revision_id) {
      cambios.seguimiento_revision_id = seguimiento_revision_id;
    }
    await compromiso.update(cambios);
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

    const emp = await Emprendimiento.findByPk(emprendimiento_id, { attributes: ['id', 'programa_id'] });
    if (!emp) return res.status(404).json({ mensaje: 'Emprendimiento no encontrado' });
    const empId = Number(emprendimiento_id);

    const includeSesion = [
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
    ];
    const atributosSesion = ['id', 'titulo', 'fecha', 'tipo', 'enlace_grabacion'];

    // Solo lectura: los seguimientos se crean al crear la sesión o el emprendimiento
    // (services/seguimientos.js), no al consultar el timeline
    const seguimientos = await Seguimiento.findAll({
      where: { emprendimiento_id },
      include: [
        { model: Sesion, as: 'sesion', attributes: atributosSesion, include: includeSesion },
        { model: Compromiso, as: 'compromisoItems' },
        { model: Compromiso, as: 'compromisosRevisados' }
      ],
      // Sequelize ignora `order` dentro de un include: el orden anidado va aquí
      order: [
        [{ model: Sesion, as: 'sesion' }, 'fecha', 'ASC'],
        [{ model: Compromiso, as: 'compromisoItems' }, 'orden', 'ASC']
      ]
    });

    // Sesiones del programa que aún no tienen seguimiento (datos anteriores a este cambio):
    // se devuelven como entradas virtuales; el equipo las crea al editarlas por primera vez
    const conSeguimiento = new Set(seguimientos.map((s) => s.sesion_id));
    const sesionesPrograma = await Sesion.findAll({
      include: [{ model: Programa, as: 'programas', through: { attributes: [] }, where: { id: emp.programa_id }, required: true, attributes: [] }],
      attributes: ['id']
    });
    const faltantes = sesionesPrograma.map((s) => s.id).filter((id) => !conSeguimiento.has(id));
    const sesionesFaltantes = faltantes.length
      ? await Sesion.findAll({ where: { id: faltantes }, attributes: atributosSesion, include: includeSesion })
      : [];

    const virtuales = sesionesFaltantes.map((sesion) => ({
      id: null,
      virtual: true,
      sesion_id: sesion.id,
      emprendimiento_id: empId,
      realizado: null,
      compromisos: null,
      observaciones: null,
      estado_avance: 'sin_iniciar',
      enlace_grabacion: null,
      comentario_emprendedor: null,
      comentario_tallerista: null,
      sesion: sesion.toJSON(),
      compromisoItems: [],
      compromisosRevisados: []
    }));

    const resultado = [...seguimientos.map((s) => s.toJSON()), ...virtuales]
      .sort((a, b) => String(a.sesion?.fecha || '').localeCompare(String(b.sesion?.fecha || '')));

    // Archivos de la sesión: los generales y los asignados a este emprendimiento
    resultado.forEach((seg) => {
      if (!seg.sesion?.archivos) return;
      seg.sesion.archivos = seg.sesion.archivos.filter((archivo) =>
        !archivo.emprendimientos || archivo.emprendimientos.length === 0 ||
        archivo.emprendimientos.some((empArchivo) => empArchivo.id === empId)
      );
    });

    res.json({ seguimientos: resultado });
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
