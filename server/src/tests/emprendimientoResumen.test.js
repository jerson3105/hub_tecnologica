jest.mock('../models', () => ({
  Emprendimiento: { findAll: jest.fn(), findByPk: jest.fn() },
  Programa: {},
  Integrante: { findAll: jest.fn() },
  Usuario: {},
  Seguimiento: { findAll: jest.fn() },
  Sesion: { findOne: jest.fn() },
  SesionPrograma: { findAll: jest.fn() },
  Compromiso: {},
  Archivo: {},
  Objetivo: { findAll: jest.fn() },
  ResultadoClave: {},
  ActividadOKR: {},
  Asistencia: { findAll: jest.fn() }
}));

jest.mock('../utils/logger', () => ({ error: jest.fn() }));
jest.mock('../utils/fechas', () => ({ hoyLocal: () => '2026-10-17' }));
jest.mock('../utils/acceso', () => ({ puedeAccederEmprendimiento: jest.fn() }));

const { Emprendimiento, Integrante, Seguimiento, Sesion, SesionPrograma, Objetivo, Asistencia } = require('../models');
const { puedeAccederEmprendimiento } = require('../utils/acceso');
const { listarResumen, obtenerResumen } = require('../controllers/emprendimientoController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

const AGRO = { id: 1, nombre: 'AgroIca', sector: 'Agro', estado: 'activo', programa_id: 1, programa: { id: 1, nombre: 'Incubación' } };
const PISCO = { id: 2, nombre: 'Pisco Lab', sector: 'Bebidas', estado: 'graduado', programa_id: 1, programa: { id: 1, nombre: 'Incubación' } };
const S1 = { id: 1, titulo: 'Ronda #1', fecha: '2026-10-01', tipo: 'uno_a_uno_programa' };
const S2 = { id: 2, titulo: 'Ronda #2', fecha: '2026-10-10', tipo: 'uno_a_uno_programa' };

const prepararFilas = () => {
  Seguimiento.findAll.mockResolvedValue([
    { sesion_id: 1, emprendimiento_id: 1, realizado: 'BMC', sesion: S1, compromisoItems: [{ estado: 'completado' }, { estado: 'planeado' }] },
    { sesion_id: 2, emprendimiento_id: 1, realizado: 'OKR', sesion: S2, compromisoItems: [] },
    { sesion_id: 1, emprendimiento_id: 2, realizado: null, sesion: S1, compromisoItems: [] }
  ]);
  Integrante.findAll.mockResolvedValue([
    { emprendimiento_id: 1, usuario_id: 7, es_lider: true, usuario: { id: 7, nombre: 'Diego', apellido: 'Huamán' } },
    { emprendimiento_id: 1, usuario_id: 8, es_lider: false, usuario: { id: 8, nombre: 'Ana', apellido: 'Paz' } }
  ]);
  Objetivo.findAll.mockResolvedValue([]);
  Asistencia.findAll.mockResolvedValue([{ sesion_id: 1, usuario_id: 7, presente: true }]);
};

describe('emprendimientoController listarResumen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prepararFilas();
  });

  it('lists every venture with its health, leader and team size, overdue first', async () => {
    Emprendimiento.findAll.mockResolvedValue([AGRO, PISCO]);
    const res = createResponse();
    await listarResumen({ query: {}, usuario: { rol: 'admin' } }, res);

    const { emprendimientos } = res.json.mock.calls[0][0];
    expect(emprendimientos.map((e) => e.nombre)).toEqual(['AgroIca', 'Pisco Lab']);
    expect(emprendimientos[0]).toMatchObject({
      vencidos: 1, abiertos: 1, ultimaReunion: '2026-10-10', asistencia: 100, lider: 'Diego Huamán', integrantes: 2
    });
    expect(emprendimientos[1]).toMatchObject({ estado: 'graduado', lider: null, integrantes: 0, ultimaReunion: null });
  });

  it('responds 500 when a query fails', async () => {
    Emprendimiento.findAll.mockRejectedValue(new Error('db caída'));
    const res = createResponse();
    await listarResumen({ query: {}, usuario: { rol: 'admin' } }, res);
    expect(res.status).toHaveBeenCalledWith(500);
  });
});

describe('emprendimientoController obtenerResumen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prepararFilas();
    SesionPrograma.findAll.mockResolvedValue([{ sesion_id: 3 }]);
    Sesion.findOne.mockResolvedValue({ id: 3, titulo: 'Ronda #3', fecha: '2026-10-20', tipo: 'uno_a_uno_programa' });
  });

  it('returns 404 for an unknown venture', async () => {
    Emprendimiento.findByPk.mockResolvedValue(null);
    const res = createResponse();
    await obtenerResumen({ params: { id: '9' }, usuario: { rol: 'admin' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('forbids someone outside the venture', async () => {
    Emprendimiento.findByPk.mockResolvedValue(AGRO);
    puedeAccederEmprendimiento.mockResolvedValue(false);
    const res = createResponse();
    await obtenerResumen({ params: { id: '1' }, usuario: { id: 50, rol: 'emprendedor' } }, res);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(Seguimiento.findAll).not.toHaveBeenCalled();
  });

  it('summarises a member venture with commitments kept and next session', async () => {
    Emprendimiento.findByPk.mockResolvedValue(AGRO);
    puedeAccederEmprendimiento.mockResolvedValue(true);
    const res = createResponse();
    await obtenerResumen({ params: { id: '1' }, usuario: { id: 7, rol: 'emprendedor' } }, res);

    const datos = res.json.mock.calls[0][0];
    expect(datos.resumen).toMatchObject({
      id: 1, vencidos: 1, compromisosTotales: 2, compromisosCumplidos: 50, lider: 'Diego Huamán', integrantes: 2
    });
    expect(datos.proximaSesion).toMatchObject({ id: 3 });
    expect(Sesion.findOne).toHaveBeenCalledWith(expect.objectContaining({ order: [['fecha', 'ASC'], ['id', 'ASC']] }));
  });
});
