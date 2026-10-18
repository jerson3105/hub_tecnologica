jest.mock('../models', () => ({
  Programa: { findAll: jest.fn() },
  Emprendimiento: { findAll: jest.fn() },
  Integrante: { findAll: jest.fn() },
  Seguimiento: { findAll: jest.fn() },
  Sesion: { findAll: jest.fn() },
  Compromiso: {},
  Asistencia: { findAll: jest.fn() },
  Nps: { findAll: jest.fn() },
  BmcVersion: { findAll: jest.fn() },
  Objetivo: { findAll: jest.fn() },
  ResultadoClave: {},
  ActividadOKR: {}
}));

jest.mock('../utils/logger', () => ({ error: jest.fn() }));

// «Hoy» fijo: sábado 17 de octubre de 2026
jest.mock('../utils/fechas', () => ({
  hoyLocal: (ahora) => (ahora ? new Date(ahora.getTime() - 5 * 3600000).toISOString().slice(0, 10) : '2026-10-17')
}));

const {
  Programa, Emprendimiento, Integrante, Seguimiento, Sesion, Asistencia, Nps, BmcVersion, Objetivo
} = require('../models');
const { obtenerInicio } = require('../controllers/inicioController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

const PROGRAMAS = [{ id: 1, nombre: 'Incubación' }, { id: 2, nombre: 'Aceleración' }];
const sesion = (id, fecha, tipo = 'seguimiento', programaId = 1) => ({
  id, titulo: `Sesión ${id}`, fecha, tipo, programa_id: programaId,
  programas: [PROGRAMAS.find((p) => p.id === programaId)]
});

const S_PASADA = sesion(10, '2026-10-08');
const S_RECIENTE = sesion(11, '2026-10-15');
const S_TALLER = sesion(12, '2026-10-14', 'taller');
const S_HOY = sesion(13, '2026-10-17');
const S_FUTURA = sesion(14, '2026-10-21', 'seguimiento', 2);

const prepararDatos = () => {
  Programa.findAll.mockResolvedValue(PROGRAMAS.map((p) => ({ ...p, estado: 'activo' })));
  Emprendimiento.findAll.mockResolvedValue([
    { id: 1, nombre: 'AgroIca', sector: 'Agro', estado: 'activo', programa_id: 1, programa: PROGRAMAS[0], createdAt: new Date('2026-10-02T15:00:00Z') },
    { id: 2, nombre: 'TurisNazca', sector: 'Turismo', estado: 'activo', programa_id: 2, programa: PROGRAMAS[1], createdAt: new Date('2026-09-10T15:00:00Z') }
  ]);
  Seguimiento.findAll.mockResolvedValue([
    // AgroIca: registró la sesión 10 con un compromiso aún abierto; la 11 no tiene fila (cuenta como pendiente)
    { id: 100, sesion_id: 10, emprendimiento_id: 1, realizado: 'Revisión del BMC', sesion: S_PASADA, compromisoItems: [{ id: 1, estado: 'planeado' }] },
    { id: 101, sesion_id: 12, emprendimiento_id: 1, realizado: null, sesion: S_TALLER, compromisoItems: [] },
    { id: 102, sesion_id: 11, emprendimiento_id: 99, realizado: null, sesion: S_RECIENTE, compromisoItems: [] },
    { id: 103, sesion_id: 14, emprendimiento_id: 2, realizado: null, sesion: S_FUTURA, compromisoItems: [] }
  ]);
  Integrante.findAll.mockResolvedValue([{ emprendimiento_id: 1, usuario_id: 7 }, { emprendimiento_id: 2, usuario_id: 8 }]);
  Objetivo.findAll.mockResolvedValue([
    { id: 1, emprendimiento_id: 1, resultadosClave: [{ id: 1, actividades: [{ meta_numerica: 10, meta_real: 4 }] }] }
  ]);
  BmcVersion.findAll.mockResolvedValue([
    { id: 3, emprendimiento_id: 1, version: 2, feedback: null, propuesta_valor: 'Uva sin pesticidas' },
    { id: 2, emprendimiento_id: 1, version: 1, feedback: 'Bien', propuesta_valor: 'Uva' },
    { id: 4, emprendimiento_id: 2, version: 1, feedback: null }
  ]);
  Sesion.findAll.mockResolvedValue([S_PASADA, S_TALLER, S_RECIENTE, S_HOY, S_FUTURA]);
  Nps.findAll.mockResolvedValue([
    { id: 1, sesion_id: 10, usuario_id: 7, puntuacion: 4, comentario: 'Muy larga', createdAt: new Date('2026-10-09T15:00:00Z'), sesion: S_PASADA },
    { id: 2, sesion_id: 10, usuario_id: 9, puntuacion: 10, comentario: null, createdAt: new Date('2026-10-09T16:00:00Z'), sesion: S_PASADA },
    // Fuera de la ventana: 16 de septiembre en Lima
    { id: 3, sesion_id: 10, usuario_id: 7, puntuacion: 2, comentario: 'Antigua', createdAt: new Date('2026-09-17T03:00:00Z'), sesion: S_PASADA }
  ]);
  Asistencia.findAll.mockResolvedValue([
    { sesion_id: 10, usuario_id: 7, presente: true },
    { sesion_id: 10, usuario_id: 9, presente: false }
  ]);
};

describe('inicioController obtenerInicio', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prepararDatos();
  });

  it('builds the indicators, attention tray, agenda, portfolio and pulse', async () => {
    const res = createResponse();
    await obtenerInicio({ query: {}, usuario: { id: 1, rol: 'admin' } }, res);

    expect(res.status).not.toHaveBeenCalled();
    const datos = res.json.mock.calls[0][0];

    expect(datos.hoy).toBe('2026-10-17');
    expect(datos.kpis).toEqual({
      emprendimientosActivos: 2,
      nuevosMes: 1,
      registrosPendientes: 1,
      compromisosVencidos: 1,
      emprendimientosConVencidos: 1,
      sesionesSemana: 2,
      fechasSemana: ['2026-10-17', '2026-10-21']
    });

    expect(datos.atencion.map((a) => a.tipo)).toEqual(['registros', 'asistencia', 'bmc', 'detractores', 'vencidos']);
    expect(datos.atencion[0]).toMatchObject({ total: 1, sesion: { id: 11 }, dias: 2, enlace: { programaId: 1, emprendimientoId: 1 } });
    // La sesión 10 tiene asistencia; la 11 y el taller 12 no
    expect(datos.atencion[1]).toMatchObject({ total: 2, sesion: { id: 11 } });
    // Solo la última versión de AgroIca cuenta (la de TurisNazca está vacía)
    expect(datos.atencion[2]).toMatchObject({ total: 1, emprendimientos: [{ id: 1, nombre: 'AgroIca' }] });
    expect(datos.atencion[3]).toMatchObject({ total: 1, sesion: { id: 10 } });

    expect(datos.agenda.map((s) => s.id)).toEqual([13, 14]);
    expect(datos.agenda[0].registros).toEqual({ registrados: 0, total: 1 });

    expect(datos.cartera[0]).toMatchObject({ id: 1, vencidos: 1, ultimaReunion: '2026-10-08', okr: 40, asistencia: 100 });

    expect(datos.pulso.nps).toEqual({ total: 2, promedio: 7, detractores: 50, pasivos: 0, promotores: 50 });
    expect(datos.pulso.asistencia).toEqual({ media: 50, sesiones: [{ id: 10, titulo: 'Sesión 10', fecha: '2026-10-08', porcentaje: 50 }] });
    // La respuesta de alguien ausente no cuenta para la tasa
    expect(datos.pulso.respuesta).toEqual({ tasa: 100, respuestas: 1, presentes: 1 });
  });

  it('filters by program', async () => {
    const res = createResponse();
    await obtenerInicio({ query: { programa_id: '2' }, usuario: { id: 1, rol: 'admin' } }, res);

    expect(Emprendimiento.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ programa_id: 2 })
    }));
    const datos = res.json.mock.calls[0][0];
    expect(datos.agenda.map((s) => s.id)).toEqual([14]);
  });

  it('responds 500 when a query fails', async () => {
    Programa.findAll.mockRejectedValue(new Error('db caída'));
    const res = createResponse();
    await obtenerInicio({ query: {}, usuario: { id: 1, rol: 'admin' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
