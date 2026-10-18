const { Op } = require('sequelize');
const sequelize = require('../config/database');
const {
  Sesion, SesionPrograma, Programa, Emprendimiento, Seguimiento, Compromiso, Integrante, Usuario, Asistencia, Nps
} = require('../models');
const logger = require('../utils/logger');
const { hoyLocal } = require('../utils/fechas');
const { programaIdsDeUsuario, esUrlHttp } = require('../utils/acceso');
const { programasDe, agruparPor } = require('../services/inicio');
const { datosSesion, resumirSesionesAdmin, resumirSesionesEmprendedor, filaDeRonda } = require('../services/sesiones');

const ATRIBUTOS_SESION = [
  'id', 'titulo', 'descripcion', 'fecha', 'tipo', 'hora_inicio', 'hora_fin', 'modalidad', 'lugar',
  'enlace_reunion', 'enlace_grabacion', 'programa_id'
];
const PROGRAMAS = { model: Programa, as: 'programas', through: { attributes: [] }, attributes: ['id', 'nombre'] };
const ESTADOS_COMPROMISO = ['planeado', 'en_progreso', 'completado', 'no_logrado'];

// Error de datos de entrada dentro de la transacción (se responde 400 y se deshace todo)
class ErrorDeEntrada extends Error {}

// GET /api/sesiones/resumen — listado con el estado de cada sesión. Al equipo técnico: registros,
// asistencia y evaluación; a un emprendedor: sus sesiones y si le falta evaluarlas.
const listarResumen = async (req, res) => {
  try {
    const hoy = hoyLocal();

    if (req.usuario.rol !== 'admin') {
      const programaIds = await programaIdsDeUsuario(req.usuario.id);
      if (!programaIds.length) return res.json({ hoy, sesiones: [] });
      const sesiones = await Sesion.findAll({
        attributes: ATRIBUTOS_SESION,
        include: [{ ...PROGRAMAS, where: { id: programaIds }, required: true }],
        order: [['fecha', 'DESC'], ['hora_inicio', 'ASC']]
      });
      const respuestas = sesiones.length
        ? await Nps.findAll({ where: { usuario_id: req.usuario.id, sesion_id: sesiones.map((s) => s.id) }, attributes: ['sesion_id'] })
        : [];
      const evaluadas = new Set(respuestas.map((r) => r.sesion_id));
      return res.json({ hoy, sesiones: resumirSesionesEmprendedor({ sesiones, evaluadas, hoy }) });
    }

    const [sesiones, emprendimientos, seguimientos, asistencias, nps] = await Promise.all([
      Sesion.findAll({ attributes: ATRIBUTOS_SESION, include: [PROGRAMAS], order: [['fecha', 'DESC'], ['hora_inicio', 'ASC']] }),
      Emprendimiento.findAll({ where: { estado: { [Op.ne]: 'retirado' } }, attributes: ['id', 'programa_id'] }),
      Seguimiento.findAll({ attributes: ['sesion_id', 'emprendimiento_id', 'realizado'] }),
      Asistencia.findAll({ attributes: ['sesion_id', 'presente'] }),
      Nps.findAll({ where: { sesion_id: { [Op.ne]: null } }, attributes: ['sesion_id', 'puntuacion'] })
    ]);
    res.json({ hoy, sesiones: resumirSesionesAdmin({ sesiones, emprendimientos, seguimientos, asistencias, nps, hoy }) });
  } catch (error) {
    logger.error('Error al resumir sesiones:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// Sesión y estado de cada emprendimiento que participa (o solo de uno)
const cargarRonda = async (sesionId, emprendimientoId = null) => {
  const sesion = await Sesion.findByPk(sesionId, { attributes: ATRIBUTOS_SESION, include: [PROGRAMAS] });
  if (!sesion) return null;
  const programaIds = programasDe(sesion);
  const emprendimientos = programaIds.length
    ? await Emprendimiento.findAll({
      where: { programa_id: programaIds, estado: { [Op.ne]: 'retirado' }, ...(emprendimientoId ? { id: emprendimientoId } : {}) },
      attributes: ['id', 'nombre', 'sector', 'programa_id'],
      include: [{ model: Programa, as: 'programa', attributes: ['id', 'nombre'] }],
      order: [['nombre', 'ASC']]
    })
    : [];
  const empIds = emprendimientos.map((e) => e.id);
  const [seguimientos, integrantes, asistencias] = await Promise.all([
    empIds.length ? Seguimiento.findAll({
      where: { emprendimiento_id: empIds },
      attributes: ['id', 'sesion_id', 'emprendimiento_id', 'realizado', 'observaciones', 'enlace_grabacion', 'comentario_tallerista', 'comentario_emprendedor'],
      include: [
        { model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha'] },
        { model: Compromiso, as: 'compromisoItems', attributes: ['id', 'descripcion', 'estado', 'orden', 'seguimiento_revision_id'] }
      ]
    }) : [],
    empIds.length ? Integrante.findAll({
      where: { emprendimiento_id: empIds },
      attributes: ['emprendimiento_id', 'usuario_id', 'rol_emprendimiento', 'es_lider'],
      include: [{ model: Usuario, as: 'usuario', attributes: ['id', 'nombre', 'apellido'] }]
    }) : [],
    Asistencia.findAll({ where: { sesion_id: sesion.id }, attributes: ['usuario_id', 'presente'] })
  ]);
  const segPorEmp = agruparPor(seguimientos, 'emprendimiento_id');
  const intPorEmp = agruparPor(integrantes, 'emprendimiento_id');
  const filas = emprendimientos.map((emprendimiento) => filaDeRonda({
    emprendimiento,
    sesion,
    seguimientos: segPorEmp.get(emprendimiento.id) || [],
    integrantes: intPorEmp.get(emprendimiento.id) || [],
    asistencias
  }));
  return { sesion, filas };
};

// Siguiente sesión de los mismos programas (fecha sugerida para los compromisos nuevos)
const siguienteSesion = async (sesion) => {
  const programaIds = programasDe(sesion);
  if (!programaIds.length) return null;
  const puente = await SesionPrograma.findAll({ where: { programa_id: programaIds }, attributes: ['sesion_id'] });
  const ids = puente.map((p) => p.sesion_id);
  return Sesion.findOne({
    where: { fecha: { [Op.gt]: sesion.fecha }, [Op.or]: [{ programa_id: programaIds }, ...(ids.length ? [{ id: ids }] : [])] },
    attributes: ['id', 'titulo', 'fecha', 'tipo'],
    order: [['fecha', 'ASC'], ['id', 'ASC']]
  });
};

// GET /api/sesiones/:id/registro — pantalla «Registrar ronda»
const obtenerRegistro = async (req, res) => {
  try {
    const ronda = await cargarRonda(req.params.id);
    if (!ronda) return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    const proximaSesion = await siguienteSesion(ronda.sesion);
    res.json({ hoy: hoyLocal(), sesion: datosSesion(ronda.sesion), proximaSesion, emprendimientos: ronda.filas });
  } catch (error) {
    logger.error('Error al obtener el registro de la sesión:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// PUT /api/sesiones/:id/registro/:emprendimientoId — guarda de una vez (en una transacción) lo
// trabajado, los compromisos nuevos, la revisión de los anteriores y la asistencia del equipo.
// Todos los campos son opcionales: solo se toca lo que llega. `compromisos` es la lista completa
// de los de esta reunión (los que faltan se borran); los nuevos llevan `clave` y la respuesta
// devuelve su id en `creados` para que el cliente no los duplique en el siguiente guardado.
const guardarRegistro = async (req, res) => {
  const sesionId = Number(req.params.id);
  const empId = Number(req.params.emprendimientoId);
  const {
    realizado, observaciones, enlace_grabacion, comentario_tallerista, comentario_emprendedor, compromisos, revisiones, asistencia
  } = req.body;
  try {
    if (enlace_grabacion && !esUrlHttp(enlace_grabacion)) {
      return res.status(400).json({ mensaje: 'El enlace de la grabación debe empezar por http:// o https://' });
    }
    if ((compromisos !== undefined && !Array.isArray(compromisos)) || (revisiones !== undefined && !Array.isArray(revisiones))
      || (asistencia !== undefined && !Array.isArray(asistencia))) {
      return res.status(400).json({ mensaje: 'Formato de registro inválido' });
    }
    if ((revisiones || []).some((r) => !ESTADOS_COMPROMISO.includes(r.estado))) {
      return res.status(400).json({ mensaje: 'Estado de compromiso inválido' });
    }

    const sesion = await Sesion.findByPk(sesionId, { attributes: ['id', 'fecha', 'programa_id'], include: [PROGRAMAS] });
    if (!sesion) return res.status(404).json({ mensaje: 'Sesión no encontrada' });
    const emprendimiento = await Emprendimiento.findByPk(empId, { attributes: ['id', 'programa_id', 'estado'] });
    if (!emprendimiento || emprendimiento.estado === 'retirado' || !programasDe(sesion).includes(emprendimiento.programa_id)) {
      return res.status(400).json({ mensaje: 'El emprendimiento no participa en esta sesión' });
    }

    const creados = [];
    await sequelize.transaction(async (transaction) => {
      const [seguimiento] = await Seguimiento.findOrCreate({
        where: { sesion_id: sesionId, emprendimiento_id: empId },
        defaults: { estado_avance: 'sin_iniciar' },
        transaction
      });

      const cambios = {};
      if (realizado !== undefined) cambios.realizado = realizado || null;
      if (observaciones !== undefined) cambios.observaciones = observaciones || null;
      if (enlace_grabacion !== undefined) cambios.enlace_grabacion = enlace_grabacion || null;
      if (comentario_tallerista !== undefined) cambios.comentario_tallerista = comentario_tallerista || null;
      if (comentario_emprendedor !== undefined) cambios.comentario_emprendedor = comentario_emprendedor || null;
      if (Object.keys(cambios).length) await seguimiento.update(cambios, { transaction });

      if (Array.isArray(compromisos)) {
        const existentes = await Compromiso.findAll({ where: { seguimiento_id: seguimiento.id }, transaction });
        const porId = new Map(existentes.map((c) => [c.id, c]));
        const conservados = new Set();
        let orden = 0;
        for (const item of compromisos) {
          const descripcion = String(item?.descripcion || '').trim();
          if (!descripcion) continue; // las filas vacías no se guardan
          const previo = item.id ? porId.get(Number(item.id)) : null;
          if (previo) {
            conservados.add(previo.id);
            if (previo.descripcion !== descripcion || previo.orden !== orden) await previo.update({ descripcion, orden }, { transaction });
          } else {
            const nuevo = await Compromiso.create({ seguimiento_id: seguimiento.id, descripcion, orden, estado: 'planeado' }, { transaction });
            conservados.add(nuevo.id);
            creados.push({ clave: item.clave ?? null, id: nuevo.id });
          }
          orden += 1;
        }
        const quitar = existentes.filter((c) => !conservados.has(c.id)).map((c) => c.id);
        if (quitar.length) await Compromiso.destroy({ where: { id: quitar }, transaction });
      }

      if (revisiones?.length) {
        // Solo compromisos de reuniones anteriores del mismo emprendimiento
        const ids = [...new Set(revisiones.map((r) => Number(r.id)))];
        const validos = await Compromiso.findAll({
          where: { id: ids },
          include: [{ model: Seguimiento, as: 'seguimientoOrigen', attributes: ['id', 'emprendimiento_id'], where: { emprendimiento_id: empId } }],
          transaction
        });
        if (validos.length !== ids.length || validos.some((c) => c.seguimiento_id === seguimiento.id)) {
          throw new ErrorDeEntrada('Hay compromisos revisados que no son de reuniones anteriores de este emprendimiento');
        }
        for (const r of revisiones) {
          await validos.find((c) => c.id === Number(r.id)).update({ estado: r.estado, seguimiento_revision_id: seguimiento.id }, { transaction });
        }
      }

      if (asistencia?.length) {
        const miembros = await Integrante.findAll({ where: { emprendimiento_id: empId }, attributes: ['usuario_id'], transaction });
        const ids = new Set(miembros.map((m) => m.usuario_id));
        if (asistencia.some((a) => !ids.has(Number(a.usuario_id)))) {
          throw new ErrorDeEntrada('Solo se puede tomar asistencia a los integrantes de este emprendimiento');
        }
        for (const a of asistencia) {
          const [fila, creada] = await Asistencia.findOrCreate({
            where: { sesion_id: sesionId, usuario_id: Number(a.usuario_id) },
            defaults: { presente: !!a.presente },
            transaction
          });
          if (!creada && fila.presente !== !!a.presente) await fila.update({ presente: !!a.presente }, { transaction });
        }
      }
    });

    const ronda = await cargarRonda(sesionId, empId);
    res.json({ emprendimiento: ronda.filas[0], creados });
  } catch (error) {
    if (error instanceof ErrorDeEntrada) return res.status(400).json({ mensaje: error.message });
    logger.error('Error al guardar el registro de la sesión:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { listarResumen, obtenerRegistro, guardarRegistro, cargarRonda };
