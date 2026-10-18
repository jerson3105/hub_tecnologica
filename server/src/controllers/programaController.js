const { Programa, Emprendimiento, Sesion, SesionPrograma, Nps } = require('../models');
const { Op } = require('sequelize');
const { paginate, paginatedResponse } = require('../utils/pagination');
const logger = require('../utils/logger');
const { hoyLocal } = require('../utils/fechas');
const { programasDe, indexarAsistencias } = require('../services/inicio');
const { resumirPrograma } = require('../services/programas');
const { cargarFilasDeEmprendimientos } = require('../services/cargaSeguimiento');

const crear = async (req, res) => {
  try {
    const { nombre, descripcion, fecha_inicio, fecha_fin, frecuencia_seguimiento } = req.body;

    const programa = await Programa.create({
      nombre,
      descripcion,
      fecha_inicio,
      fecha_fin,
      frecuencia_seguimiento
    });

    res.status(201).json({ mensaje: 'Programa creado exitosamente', programa });
  } catch (error) {
    logger.error('Error al crear programa:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const listar = async (req, res) => {
  try {
    const { estado, activo } = req.query;
    const where = {};
    if (estado) where.estado = estado;
    if (activo !== undefined) where.activo = activo === 'true';

    const includeOpts = [{ model: Emprendimiento, as: 'emprendimientos', attributes: ['id', 'nombre', 'estado'] }];

    if (req.query.page) {
      const { page, limit, offset } = paginate(req.query);
      const { rows, count } = await Programa.findAndCountAll({ where, include: includeOpts, order: [['fecha_inicio', 'DESC']], limit, offset, distinct: true });
      res.json(paginatedResponse(rows, count, { page, limit }));
    } else {
      const programas = await Programa.findAll({ where, include: includeOpts, order: [['fecha_inicio', 'DESC']] });
      res.json({ programas });
    }
  } catch (error) {
    logger.error('Error al listar programas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const obtenerPorId = async (req, res) => {
  try {
    const programa = await Programa.findByPk(req.params.id, {
      include: [
        {
          model: Emprendimiento,
          as: 'emprendimientos',
          attributes: ['id', 'nombre', 'sector', 'estado']
        },
        // Sesiones legacy (programa_id directo) y sesiones multi-programa (sesion_programas)
        {
          model: Sesion,
          as: 'sesiones',
          attributes: ['id', 'titulo', 'fecha', 'tipo']
        },
        {
          model: Sesion,
          as: 'sesionesMixtas',
          attributes: ['id', 'titulo', 'fecha', 'tipo'],
          through: { attributes: [] }
        }
      ]
    });

    if (!programa) {
      return res.status(404).json({ mensaje: 'Programa no encontrado' });
    }

    const sesionesPorId = new Map();
    [...(programa.sesiones || []), ...(programa.sesionesMixtas || [])].forEach(s => sesionesPorId.set(s.id, s));
    const sesiones = [...sesionesPorId.values()].sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));

    const datos = programa.toJSON();
    delete datos.sesionesMixtas;
    res.json({ programa: { ...datos, sesiones } });
  } catch (error) {
    logger.error('Error al obtener programa:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const actualizar = async (req, res) => {
  try {
    const programa = await Programa.findByPk(req.params.id);
    if (!programa) {
      return res.status(404).json({ mensaje: 'Programa no encontrado' });
    }

    const { nombre, descripcion, fecha_inicio, fecha_fin, frecuencia_seguimiento, estado, activo } = req.body;

    await programa.update({
      nombre: nombre || programa.nombre,
      descripcion: descripcion !== undefined ? descripcion : programa.descripcion,
      fecha_inicio: fecha_inicio || programa.fecha_inicio,
      fecha_fin: fecha_fin || programa.fecha_fin,
      frecuencia_seguimiento: frecuencia_seguimiento || programa.frecuencia_seguimiento,
      estado: estado || programa.estado,
      activo: activo !== undefined ? activo : programa.activo
    });

    res.json({ mensaje: 'Programa actualizado', programa });
  } catch (error) {
    logger.error('Error al actualizar programa:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

const eliminar = async (req, res) => {
  try {
    const programa = await Programa.findByPk(req.params.id);
    if (!programa) {
      return res.status(404).json({ mensaje: 'Programa no encontrado' });
    }

    await programa.update({ activo: false });
    res.json({ mensaje: 'Programa desactivado exitosamente' });
  } catch (error) {
    logger.error('Error al eliminar programa:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// ─── Resúmenes (cartera, sesiones e indicadores) ───

// Filas de seguimiento de uno o varios programas en pocas consultas (emprendimientos retirados fuera)
const cargarDatosDeProgramas = async (programaIds, hoy) => {
  const [emprendimientos, puente] = await Promise.all([
    Emprendimiento.findAll({
      where: { programa_id: programaIds, estado: { [Op.ne]: 'retirado' } },
      attributes: ['id', 'nombre', 'sector', 'estado', 'programa_id'],
      include: [{ model: Programa, as: 'programa', attributes: ['id', 'nombre'] }],
      order: [['nombre', 'ASC']]
    }),
    SesionPrograma.findAll({ where: { programa_id: programaIds }, attributes: ['sesion_id'] })
  ]);
  const idsPuente = [...new Set(puente.map((p) => p.sesion_id))];

  const [sesiones, nps] = await Promise.all([
    Sesion.findAll({
      // Sesiones antiguas (programa_id) y multi-programa (tabla puente)
      where: { [Op.or]: [{ programa_id: programaIds }, ...(idsPuente.length ? [{ id: idsPuente }] : [])] },
      attributes: ['id', 'titulo', 'fecha', 'tipo', 'programa_id'],
      include: [{ model: Programa, as: 'programas', through: { attributes: [] }, attributes: ['id', 'nombre'] }],
      order: [['fecha', 'ASC'], ['id', 'ASC']]
    }),
    Nps.findAll({ where: { programa_id: programaIds }, attributes: ['id', 'sesion_id', 'programa_id', 'usuario_id', 'puntuacion'] })
  ]);

  // La asistencia de todas las sesiones del programa ya ocurridas (no solo las que tienen fila)
  const filas = await cargarFilasDeEmprendimientos(emprendimientos.map((e) => e.id), hoy, {
    sesionesExtra: sesiones.filter((s) => s.fecha <= hoy).map((s) => s.id)
  });
  return { emprendimientos, sesiones, nps, ...filas };
};

// Las filas de un solo programa. La asistencia cuenta solo a sus integrantes: en una sesión
// compartida con otro programa, el porcentaje es el de este.
const datosDelPrograma = (datos, programaId) => {
  const emprendimientos = datos.emprendimientos.filter((e) => e.programa_id === programaId);
  const empIds = new Set(emprendimientos.map((e) => e.id));
  const integrantes = datos.integrantes.filter((i) => empIds.has(i.emprendimiento_id));
  const usuarios = new Set(integrantes.map((i) => i.usuario_id));
  return {
    emprendimientos,
    sesiones: datos.sesiones.filter((s) => programasDe(s).includes(programaId)),
    seguimientos: datos.seguimientos.filter((s) => empIds.has(s.emprendimiento_id)),
    integrantes,
    objetivos: datos.objetivos.filter((o) => empIds.has(o.emprendimiento_id)),
    nps: datos.nps.filter((r) => r.programa_id === programaId),
    asistencia: indexarAsistencias(datos.asistencias.filter((a) => usuarios.has(a.usuario_id)))
  };
};

// GET /api/programas/resumen — tarjetas del listado: calendario, indicadores y próxima sesión
const listarResumen = async (req, res) => {
  try {
    const hoy = hoyLocal();
    const programas = await Programa.findAll({ order: [['fecha_inicio', 'DESC']] });
    const datos = programas.length ? await cargarDatosDeProgramas(programas.map((p) => p.id), hoy) : null;
    res.json({
      hoy,
      programas: programas.map((programa) => {
        const { periodo, kpis, proximaSesion } = resumirPrograma({ programa, hoy, ...datosDelPrograma(datos, programa.id) });
        return { ...programa.toJSON(), periodo, kpis, proximaSesion };
      })
    });
  } catch (error) {
    logger.error('Error al resumir programas:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

// GET /api/programas/:id/resumen — detalle: cartera, sesiones con registros y pulso del programa
const obtenerResumen = async (req, res) => {
  try {
    const programa = await Programa.findByPk(req.params.id);
    if (!programa) {
      return res.status(404).json({ mensaje: 'Programa no encontrado' });
    }
    const hoy = hoyLocal();
    const datos = await cargarDatosDeProgramas([programa.id], hoy);
    res.json({ hoy, programa: programa.toJSON(), ...resumirPrograma({ programa, hoy, ...datosDelPrograma(datos, programa.id) }) });
  } catch (error) {
    logger.error('Error al resumir el programa:', error);
    res.status(500).json({ mensaje: 'Error interno del servidor' });
  }
};

module.exports = { crear, listar, obtenerPorId, actualizar, eliminar, listarResumen, obtenerResumen };
