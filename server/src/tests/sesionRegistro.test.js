jest.mock('../models', () => ({
  Sesion: { findByPk: jest.fn(), findAll: jest.fn(), findOne: jest.fn() },
  SesionPrograma: { findAll: jest.fn() },
  Programa: {},
  Emprendimiento: { findByPk: jest.fn(), findAll: jest.fn() },
  Seguimiento: { findOrCreate: jest.fn(), findAll: jest.fn() },
  Compromiso: { findAll: jest.fn(), create: jest.fn(), destroy: jest.fn() },
  Integrante: { findAll: jest.fn() },
  Usuario: {},
  Asistencia: { findOrCreate: jest.fn(), findAll: jest.fn() },
  Nps: { findAll: jest.fn() }
}));

jest.mock('../config/database', () => ({ transaction: jest.fn((fn) => fn({ id: 'tx' })) }));
jest.mock('../utils/logger', () => ({ error: jest.fn() }));
jest.mock('../utils/fechas', () => ({ hoyLocal: () => '2026-10-17' }));
jest.mock('../utils/acceso', () => ({
  programaIdsDeUsuario: jest.fn(),
  esUrlHttp: (v) => /^https?:\/\//.test(v)
}));

const { Sesion, Emprendimiento, Seguimiento, Compromiso, Integrante, Asistencia, Nps } = require('../models');
const { programaIdsDeUsuario } = require('../utils/acceso');
const { guardarRegistro, listarResumen } = require('../controllers/sesionResumenController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

const SESION = { id: 5, fecha: '2026-10-17', programa_id: 1, programas: [{ id: 1, nombre: 'Incubación' }] };
const peticion = (body) => ({ params: { id: '5', emprendimientoId: '1' }, body, usuario: { id: 1, rol: 'admin' } });

const prepararGuardado = () => {
  Sesion.findByPk.mockResolvedValue(SESION);
  Emprendimiento.findByPk.mockResolvedValue({ id: 1, programa_id: 1, estado: 'activo' });
  const seguimiento = { id: 20, update: jest.fn() };
  Seguimiento.findOrCreate.mockResolvedValue([seguimiento, false]);
  // cargarRonda tras guardar
  Emprendimiento.findAll.mockResolvedValue([{ id: 1, nombre: 'AgroIca', programa: { id: 1, nombre: 'Incubación' } }]);
  Seguimiento.findAll.mockResolvedValue([]);
  Integrante.findAll.mockResolvedValue([{ emprendimiento_id: 1, usuario_id: 7, usuario: { nombre: 'Lucía' } }]);
  Asistencia.findAll.mockResolvedValue([]);
  return seguimiento;
};

describe('sesionResumenController guardarRegistro', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects a venture outside the session programs', async () => {
    Sesion.findByPk.mockResolvedValue(SESION);
    Emprendimiento.findByPk.mockResolvedValue({ id: 1, programa_id: 2, estado: 'activo' });
    const res = createResponse();
    await guardarRegistro(peticion({ realizado: 'x' }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Seguimiento.findOrCreate).not.toHaveBeenCalled();
  });

  it('rejects an invalid commitment state and a non-http recording link', async () => {
    const res = createResponse();
    await guardarRegistro(peticion({ revisiones: [{ id: 1, estado: 'hecho' }] }), res);
    expect(res.status).toHaveBeenCalledWith(400);
    const res2 = createResponse();
    await guardarRegistro(peticion({ enlace_grabacion: 'javascript:alert(1)' }), res2);
    expect(res2.status).toHaveBeenCalledWith(400);
  });

  it('saves notes, syncs this session commitments and returns the ids of the new ones', async () => {
    const seguimiento = prepararGuardado();
    const previo = { id: 200, descripcion: 'Llamar a hoteles', orden: 0, update: jest.fn() };
    Compromiso.findAll.mockResolvedValueOnce([previo, { id: 201, descripcion: 'Borrar', orden: 1 }]);
    Compromiso.create.mockResolvedValue({ id: 300 });
    const res = createResponse();

    await guardarRegistro(peticion({
      realizado: 'Precios y canal',
      observaciones: '',
      compromisos: [{ id: 200, descripcion: 'Llamar a 3 hoteles' }, { clave: 'n1', descripcion: 'Cotizar empaques' }, { clave: 'n2', descripcion: '   ' }]
    }), res);

    expect(seguimiento.update).toHaveBeenCalledWith({ realizado: 'Precios y canal', observaciones: null }, { transaction: { id: 'tx' } });
    expect(previo.update).toHaveBeenCalledWith({ descripcion: 'Llamar a 3 hoteles', orden: 0 }, expect.anything());
    expect(Compromiso.create).toHaveBeenCalledWith(
      { seguimiento_id: 20, descripcion: 'Cotizar empaques', orden: 1, estado: 'planeado' }, expect.anything()
    );
    expect(Compromiso.destroy).toHaveBeenCalledWith({ where: { id: [201] }, transaction: { id: 'tx' } });
    expect(res.json.mock.calls[0][0].creados).toEqual([{ clave: 'n1', id: 300 }]);
  });

  it('saves the workshop comments of a 1 a 1 de taller', async () => {
    const seguimiento = prepararGuardado();
    const res = createResponse();
    await guardarRegistro(peticion({ comentario_tallerista: 'Buen avance', comentario_emprendedor: '' }), res);
    expect(seguimiento.update).toHaveBeenCalledWith({ comentario_tallerista: 'Buen avance', comentario_emprendedor: null }, { transaction: { id: 'tx' } });
  });

  it('marks earlier commitments as reviewed in this session', async () => {
    prepararGuardado();
    const anterior = { id: 100, seguimiento_id: 10, update: jest.fn() };
    Compromiso.findAll.mockResolvedValueOnce([anterior]);
    const res = createResponse();
    await guardarRegistro(peticion({ revisiones: [{ id: 100, estado: 'completado' }] }), res);
    expect(anterior.update).toHaveBeenCalledWith({ estado: 'completado', seguimiento_revision_id: 20 }, expect.anything());
    expect(res.status).not.toHaveBeenCalled();
  });

  it('refuses to review a commitment of another venture and rolls back', async () => {
    prepararGuardado();
    Compromiso.findAll.mockResolvedValueOnce([]);
    const res = createResponse();
    await guardarRegistro(peticion({ revisiones: [{ id: 999, estado: 'completado' }] }), res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('takes attendance only for team members', async () => {
    prepararGuardado();
    const fila = { presente: false, update: jest.fn() };
    Asistencia.findOrCreate.mockResolvedValue([fila, false]);
    const res = createResponse();
    await guardarRegistro(peticion({ asistencia: [{ usuario_id: 7, presente: true }] }), res);
    expect(fila.update).toHaveBeenCalledWith({ presente: true }, expect.anything());

    const res2 = createResponse();
    await guardarRegistro(peticion({ asistencia: [{ usuario_id: 50, presente: true }] }), res2);
    expect(res2.status).toHaveBeenCalledWith(400);
  });
});

describe('sesionResumenController listarResumen', () => {
  beforeEach(() => jest.clearAllMocks());

  it('gives an emprendedor their sessions with pending evaluations', async () => {
    programaIdsDeUsuario.mockResolvedValue([1]);
    Sesion.findAll.mockResolvedValue([
      { id: 1, titulo: 'Taller', fecha: '2026-10-10', tipo: 'taller', programas: [{ id: 1, nombre: 'Incubación' }] },
      { id: 2, titulo: 'Ronda', fecha: '2026-10-20', tipo: 'uno_a_uno_programa', programas: [{ id: 1, nombre: 'Incubación' }] }
    ]);
    Nps.findAll.mockResolvedValue([]);
    const res = createResponse();
    await listarResumen({ usuario: { id: 7, rol: 'emprendedor' } }, res);
    const { sesiones } = res.json.mock.calls[0][0];
    expect(sesiones.map((s) => s.evaluacion)).toEqual(['pendiente', null]);
  });

  it('returns nothing to an emprendedor without a program', async () => {
    programaIdsDeUsuario.mockResolvedValue([]);
    const res = createResponse();
    await listarResumen({ usuario: { id: 7, rol: 'emprendedor' } }, res);
    expect(res.json).toHaveBeenCalledWith({ hoy: '2026-10-17', sesiones: [] });
    expect(Sesion.findAll).not.toHaveBeenCalled();
  });
});
