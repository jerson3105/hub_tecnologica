const { Op } = require('sequelize');
const {
  Programa, Emprendimiento, Integrante, Seguimiento, Sesion, Compromiso, Asistencia, Nps,
  BmcVersion, Objetivo, ResultadoClave, ActividadOKR
} = require('../models');
const logger = require('../utils/logger');
const { hoyLocal } = require('../utils/fechas');
const {
  TIPOS_CON_REGISTRO, sumarDias, diasEntre, tieneTexto, porcentaje,
  resumirEmprendimiento, ordenarCartera, resumirNps, compromisosDe
} = require('../services/inicio');

const CAMPOS_BMC = ['socios_clave', 'actividades_clave', 'recursos_clave', 'propuesta_valor', 'relacion_clientes', 'canales', 'segmento_clientes', 'estructura_costos', 'fuentes_ingresos'];
const sesionResumida = (s) => (s ? { id: s.id, titulo: s.titulo, fecha: s.fecha, tipo: s.tipo } : null);
// Programas de una sesión (la tabla puente y, en sesiones antiguas, la columna programa_id)
const programasDe = (sesion) => [...new Set([...(sesion.programas || []).map((p) => p.id), sesion.programa_id].filter(Boolean))];
// Día (en la zona del negocio) de una marca de tiempo
const diaLocal = (marca) => (marca ? hoyLocal(new Date(marca)) : null);

// GET /api/inicio — todo lo que el equipo técnico necesita ver al entrar, en una sola petición.
// ?programa_id= filtra cartera, agenda, bandeja y pulso por programa.
const obtenerInicio = async (req, res) => {
  try {
    const hoy = hoyLocal();
    const programaId = req.query.programa_id ? Number(req.query.programa_id) : null;
    const hace30 = sumarDias(hoy, -30);
    const hace14 = sumarDias(hoy, -14);
    const en7 = sumarDias(hoy, 7);
    const inicioMes = `${hoy.slice(0, 8)}01`;

    const [programas, emprendimientos] = await Promise.all([
      Programa.findAll({ attributes: ['id', 'nombre', 'estado'], order: [['nombre', 'ASC']] }),
      Emprendimiento.findAll({
        where: { estado: { [Op.ne]: 'retirado' }, ...(programaId ? { programa_id: programaId } : {}) },
        attributes: ['id', 'nombre', 'sector', 'estado', 'programa_id', 'createdAt'],
        include: [{ model: Programa, as: 'programa', attributes: ['id', 'nombre'] }]
      })
    ]);
    const empIds = emprendimientos.map((e) => e.id);

    const [seguimientos, integrantes, objetivos, bmcs, sesionesVentana, npsVentana] = await Promise.all([
      empIds.length ? Seguimiento.findAll({
        where: { emprendimiento_id: empIds },
        attributes: ['id', 'sesion_id', 'emprendimiento_id', 'realizado'],
        include: [
          { model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha', 'tipo'] },
          { model: Compromiso, as: 'compromisoItems', attributes: ['id', 'estado'] }
        ]
      }) : [],
      empIds.length ? Integrante.findAll({ where: { emprendimiento_id: empIds }, attributes: ['emprendimiento_id', 'usuario_id'] }) : [],
      empIds.length ? Objetivo.findAll({
        where: { emprendimiento_id: empIds, activo: true },
        attributes: ['id', 'emprendimiento_id'],
        include: [{
          model: ResultadoClave, as: 'resultadosClave', attributes: ['id'],
          include: [{ model: ActividadOKR, as: 'actividades', attributes: ['meta_numerica', 'meta_real', 'estado'] }]
        }]
      }) : [],
      empIds.length ? BmcVersion.findAll({
        where: { emprendimiento_id: empIds },
        attributes: ['id', 'emprendimiento_id', 'version', 'feedback', ...CAMPOS_BMC],
        order: [['version', 'DESC']]
      }) : [],
      Sesion.findAll({
        where: { fecha: { [Op.between]: [hace30, en7] } },
        attributes: ['id', 'titulo', 'fecha', 'tipo', 'programa_id'],
        include: [{ model: Programa, as: 'programas', through: { attributes: [] }, attributes: ['id', 'nombre'] }],
        order: [['fecha', 'ASC']]
      }),
      Nps.findAll({
        // Margen de un día para la zona horaria; el corte exacto se hace abajo con diaLocal
        where: { createdAt: { [Op.gte]: new Date(`${sumarDias(hace30, -1)}T00:00:00Z`) }, ...(programaId ? { programa_id: programaId } : {}) },
        attributes: ['id', 'sesion_id', 'usuario_id', 'puntuacion', 'comentario', 'createdAt'],
        include: [{ model: Sesion, as: 'sesion', attributes: ['id', 'titulo', 'fecha'] }],
        order: [['createdAt', 'DESC']]
      })
    ]);

    const nps = npsVentana.filter((r) => diaLocal(r.createdAt) >= hace30);
    const sesionesFiltradas = programaId
      ? sesionesVentana.filter((s) => programasDe(s).includes(programaId))
      : sesionesVentana;

    // Asistencia de todas las sesiones que se miran (las pasadas de los emprendimientos y la ventana)
    const idsAsistencia = [...new Set([
      ...seguimientos.filter((s) => s.sesion?.fecha && s.sesion.fecha <= hoy).map((s) => s.sesion_id),
      ...sesionesFiltradas.map((s) => s.id)
    ])];
    const asistencias = idsAsistencia.length
      ? await Asistencia.findAll({ where: { sesion_id: idsAsistencia }, attributes: ['sesion_id', 'usuario_id', 'presente'] })
      : [];
    const sesionesConAsistencia = new Set(asistencias.map((a) => a.sesion_id));
    const presentesPorSesion = new Map();
    const totalesPorSesion = new Map();
    asistencias.forEach((a) => {
      totalesPorSesion.set(a.sesion_id, (totalesPorSesion.get(a.sesion_id) || 0) + 1);
      if (!a.presente) return;
      if (!presentesPorSesion.has(a.sesion_id)) presentesPorSesion.set(a.sesion_id, new Set());
      presentesPorSesion.get(a.sesion_id).add(a.usuario_id);
    });

    // Índices por emprendimiento
    const porEmp = (lista, clave = 'emprendimiento_id') => lista.reduce((mapa, item) => {
      const id = item[clave];
      if (!mapa.has(id)) mapa.set(id, []);
      mapa.get(id).push(item);
      return mapa;
    }, new Map());
    const segPorEmp = porEmp(seguimientos);
    const usuariosPorEmp = new Map([...porEmp(integrantes)].map(([id, filas]) => [id, new Set(filas.map((f) => f.usuario_id))]));
    const actividadesPorEmp = new Map([...porEmp(objetivos)].map(([id, objs]) => [
      id,
      objs.flatMap((o) => (o.resultadosClave || []).flatMap((rc) => rc.actividades || []))
    ]));

    // Cartera
    const cartera = ordenarCartera(emprendimientos.map((emprendimiento) => resumirEmprendimiento({
      emprendimiento,
      seguimientos: segPorEmp.get(emprendimiento.id) || [],
      hoy,
      usuarios: usuariosPorEmp.get(emprendimiento.id) || new Set(),
      actividades: actividadesPorEmp.get(emprendimiento.id) || [],
      sesionesConAsistencia,
      presentesPorSesion
    })));

    // Registros esperados: uno por sesión y emprendimiento de sus programas. Si la fila aún no
    // existe cuenta como pendiente, igual que la entrada virtual del timeline.
    const segPorPar = new Map(seguimientos.map((s) => [`${s.sesion_id}-${s.emprendimiento_id}`, s]));
    const empsPorPrograma = porEmp(emprendimientos, 'programa_id');
    const registrosDe = (sesion) => {
      const emps = programasDe(sesion).flatMap((pid) => empsPorPrograma.get(pid) || []);
      const pendientes = emps.filter((e) => !tieneTexto(segPorPar.get(`${sesion.id}-${e.id}`)?.realizado));
      return { total: emps.length, registrados: emps.length - pendientes.length, pendientes };
    };

    // Indicadores
    const registrosPendientes = sesionesFiltradas
      .filter((s) => s.fecha >= hace30 && s.fecha < hoy && TIPOS_CON_REGISTRO.includes(s.tipo))
      .flatMap((s) => registrosDe(s).pendientes.map((emprendimiento) => ({ sesion: s, emprendimiento })));
    const vencidosPorEmp = emprendimientos.map((e) => ({ emp: e, ...compromisosDe(segPorEmp.get(e.id) || [], hoy) }));
    const conVencidos = vencidosPorEmp.filter((v) => v.vencidos > 0);
    const totalVencidos = conVencidos.reduce((t, v) => t + v.vencidos, 0);
    const semana = sesionesFiltradas.filter((s) => s.fecha >= hoy && s.fecha <= sumarDias(hoy, 6));

    const kpis = {
      emprendimientosActivos: emprendimientos.filter((e) => e.estado === 'activo').length,
      nuevosMes: emprendimientos.filter((e) => diaLocal(e.createdAt) >= inicioMes).length,
      registrosPendientes: registrosPendientes.length,
      compromisosVencidos: totalVencidos,
      emprendimientosConVencidos: conVencidos.length,
      sesionesSemana: semana.length,
      fechasSemana: semana.map((s) => s.fecha)
    };

    // Bandeja «Requiere tu atención»
    const atencion = [];
    if (registrosPendientes.length) {
      const reciente = [...registrosPendientes].sort((a, b) => b.sesion.fecha.localeCompare(a.sesion.fecha))[0];
      atencion.push({
        tipo: 'registros',
        total: registrosPendientes.length,
        sesion: sesionResumida(reciente.sesion),
        dias: diasEntre(reciente.sesion.fecha, hoy),
        enlace: { programaId: reciente.emprendimiento.programa_id, emprendimientoId: reciente.emprendimiento.id }
      });
    }
    const sinAsistencia = sesionesFiltradas
      .filter((s) => s.fecha >= hace14 && s.fecha < hoy && !sesionesConAsistencia.has(s.id))
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
    if (sinAsistencia.length) {
      atencion.push({ tipo: 'asistencia', total: sinAsistencia.length, sesion: sesionResumida(sinAsistencia[0]), dias: diasEntre(sinAsistencia[0].fecha, hoy) });
    }
    const ultimaVersion = new Map();
    bmcs.forEach((v) => { if (!ultimaVersion.has(v.emprendimiento_id)) ultimaVersion.set(v.emprendimiento_id, v); });
    const bmcSinFeedback = [...ultimaVersion.values()]
      .filter((v) => !tieneTexto(v.feedback) && CAMPOS_BMC.some((c) => tieneTexto(v[c])))
      .map((v) => emprendimientos.find((e) => e.id === v.emprendimiento_id))
      .filter(Boolean);
    if (bmcSinFeedback.length) {
      atencion.push({ tipo: 'bmc', total: bmcSinFeedback.length, emprendimientos: bmcSinFeedback.slice(0, 3).map((e) => ({ id: e.id, nombre: e.nombre })) });
    }
    const detractores = nps.filter((r) => r.puntuacion <= 6 && tieneTexto(r.comentario));
    if (detractores.length) {
      atencion.push({ tipo: 'detractores', total: detractores.length, sesion: sesionResumida(detractores[0].sesion) });
    }
    if (totalVencidos) {
      const primero = [...conVencidos].sort((a, b) => b.vencidos - a.vencidos)[0].emp;
      atencion.push({
        tipo: 'vencidos',
        total: totalVencidos,
        emprendimientos: conVencidos.length,
        enlace: { programaId: primero.programa_id, emprendimientoId: primero.id }
      });
    }

    // Agenda: hoy y los próximos 7 días (los talleres no llevan registro por emprendimiento)
    const agenda = sesionesFiltradas
      .filter((s) => s.fecha >= hoy && s.fecha <= en7)
      .map((s) => {
        const { total, registrados } = registrosDe(s);
        return {
          ...sesionResumida(s),
          programas: (s.programas || []).map((p) => p.nombre),
          registros: TIPOS_CON_REGISTRO.includes(s.tipo) ? { registrados, total } : null
        };
      });

    // Pulso de los últimos 30 días
    const pasadasConAsistencia = sesionesFiltradas
      .filter((s) => s.fecha >= hace30 && s.fecha <= hoy && totalesPorSesion.get(s.id))
      .map((s) => ({
        ...sesionResumida(s),
        presentes: presentesPorSesion.get(s.id)?.size || 0,
        total: totalesPorSesion.get(s.id)
      }));
    const totalPresentes = pasadasConAsistencia.reduce((t, s) => t + s.presentes, 0);
    const totalRegistrosAsistencia = pasadasConAsistencia.reduce((t, s) => t + s.total, 0);
    const idsPasadas = new Set(pasadasConAsistencia.map((s) => s.id));
    // Tasa de respuesta: encuestas NPS de quienes estuvieron presentes
    const respuestasDePasadas = nps.filter((r) => idsPasadas.has(r.sesion_id) && presentesPorSesion.get(r.sesion_id)?.has(r.usuario_id)).length;

    const pulso = {
      nps: resumirNps(nps),
      asistencia: {
        media: porcentaje(totalPresentes, totalRegistrosAsistencia),
        sesiones: pasadasConAsistencia.slice(-6).map((s) => ({ id: s.id, titulo: s.titulo, fecha: s.fecha, porcentaje: porcentaje(s.presentes, s.total) }))
      },
      respuesta: { tasa: porcentaje(respuestasDePasadas, totalPresentes), respuestas: respuestasDePasadas, presentes: totalPresentes }
    };

    res.json({
      hoy,
      programas: programas.map((p) => ({ id: p.id, nombre: p.nombre, estado: p.estado })),
      kpis,
      atencion,
      agenda,
      cartera,
      pulso
    });
  } catch (error) {
    logger.error('Error al obtener el inicio', { error: error.message });
    res.status(500).json({ mensaje: 'Error al obtener el inicio' });
  }
};

module.exports = { obtenerInicio };
