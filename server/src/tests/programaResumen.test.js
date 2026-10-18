jest.mock('../models', () => ({
  Programa: { findAll: jest.fn(), findByPk: jest.fn() },
  Emprendimiento: { findAll: jest.fn() },
  Sesion: { findAll: jest.fn() },
  SesionPrograma: { findAll: jest.fn() },
  Seguimiento: { findAll: jest.fn() },
  Compromiso: {},
  Integrante: { findAll: jest.fn() },
  Objetivo: { findAll: jest.fn() },
  ResultadoClave: {},
  ActividadOKR: {},
  Asistencia: { findAll: jest.fn() },
  Nps: { findAll: jest.fn() }
}));

jest.mock('../utils/logger', () => ({ error: jest.fn() }));
jest.mock('../utils/fechas', () => ({ hoyLocal: () => '2026-10-17' }));

const {
  Programa, Emprendimiento, Sesion, SesionPrograma, Seguimiento, Integrante, Objetivo, Asistencia, Nps
} = require('../models');
const { listarResumen, obtenerResumen } = require('../controllers/programaController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

const programa = (id, nombre, extra = {}) => ({
  id, nombre, fecha_inicio: '2026-09-01', fecha_fin: '2026-12-15', estado: 'en_curso', activo: true, ...extra,
  toJSON() { const { toJSON, ...resto } = this; return resto; }
});

// Sesión compartida por los dos programas (taller) y una ronda solo del programa 1
const TALLER = { id: 1, titulo: 'Taller de costos', fecha: '2026-10-08', tipo: 'taller', programa_id: null, programas: [{ id: 1 }, { id: 2 }] };
const RONDA = { id: 2, titulo: 'Ronda 1 a 1 #1', fecha: '2026-10-20', tipo: 'uno_a_uno_programa', programa_id: 1, programas: [{ id: 1 }] };

const prepararDatos = () => {
  Emprendimiento.findAll.mockResolvedValue([
    { id: 1, nombre: 'AgroIca', estado: 'activo', programa_id: 1, programa: { id: 1, nombre: 'Incubación' } },
    { id: 2, nombre: 'TurisNazca', estado: 'activo', programa_id: 2, programa: { id: 2, nombre: 'Aceleración' } }
  ]);
  SesionPrograma.findAll.mockResolvedValue([{ sesion_id: 1 }, { sesion_id: 2 }]);
  Sesion.findAll.mockResolvedValue([TALLER, RONDA]);
  Seguimiento.findAll.mockResolvedValue([]);
  Integrante.findAll.mockResolvedValue([{ emprendimiento_id: 1, usuario_id: 7 }, { emprendimiento_id: 2, usuario_id: 8 }]);
  Objetivo.findAll.mockResolvedValue([]);
  Nps.findAll.mockResolvedValue([
    { sesion_id: 1, programa_id: 1, usuario_id: 7, puntuacion: 9 },
    { sesion_id: 1, programa_id: 2, usuario_id: 8, puntuacion: 4 }
  ]);
  // En el taller compartido estuvo el integrante del programa 1 y faltó el del 2
  Asistencia.findAll.mockResolvedValue([
    { sesion_id: 1, usuario_id: 7, presente: true },
    { sesion_id: 1, usuario_id: 8, presente: false }
  ]);
};

describe('programaController listarResumen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prepararDatos();
  });

  it('summarises each program with its own sessions, attendance and NPS', async () => {
    Programa.findAll.mockResolvedValue([programa(1, 'Incubación'), programa(2, 'Aceleración')]);
    const res = createResponse();
    await listarResumen({ query: {} }, res);

    expect(res.status).not.toHaveBeenCalled();
    const { programas } = res.json.mock.calls[0][0];
    const [incubacion, aceleracion] = programas;

    expect(incubacion).toMatchObject({ id: 1, nombre: 'Incubación', proximaSesion: { id: 2 } });
    expect(incubacion.kpis).toMatchObject({ sesionesTotales: 2, sesionesRealizadas: 1, npsPromedio: 9, asistenciaMedia: 100 });
    expect(incubacion.periodo).toMatchObject({ fase: 'en_curso', semana: 7 });

    // El programa 2 solo comparte el taller: su asistencia y NPS son los de su integrante
    expect(aceleracion).toMatchObject({ id: 2, proximaSesion: null });
    expect(aceleracion.kpis).toMatchObject({ sesionesTotales: 1, npsPromedio: 4, asistenciaMedia: 0 });
  });

  it('responds with an empty list without loading anything else', async () => {
    Programa.findAll.mockResolvedValue([]);
    const res = createResponse();
    await listarResumen({ query: {} }, res);
    expect(res.json).toHaveBeenCalledWith({ hoy: '2026-10-17', programas: [] });
    expect(Emprendimiento.findAll).not.toHaveBeenCalled();
  });
});

describe('programaController obtenerResumen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prepararDatos();
  });

  it('returns 404 for an unknown program', async () => {
    Programa.findByPk.mockResolvedValue(null);
    const res = createResponse();
    await obtenerResumen({ params: { id: '99' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns the program with portfolio, sessions and pulse', async () => {
    Programa.findByPk.mockResolvedValue(programa(1, 'Incubación'));
    const res = createResponse();
    await obtenerResumen({ params: { id: '1' } }, res);

    const datos = res.json.mock.calls[0][0];
    expect(datos.programa).toMatchObject({ id: 1, nombre: 'Incubación' });
    expect(datos.cartera.map((c) => c.nombre)).toEqual(['AgroIca']);
    expect(datos.sesiones.map((s) => [s.id, s.momento, s.registros])).toEqual([
      [1, 'pasada', null],
      [2, 'proxima', { registrados: 0, total: 1 }]
    ]);
    expect(datos.pulso.respuesta).toEqual({ tasa: 100, respuestas: 1, presentes: 1 });
  });

  it('responds 500 when a query fails', async () => {
    Programa.findByPk.mockRejectedValue(new Error('db caída'));
    const res = createResponse();
    await obtenerResumen({ params: { id: '1' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});
