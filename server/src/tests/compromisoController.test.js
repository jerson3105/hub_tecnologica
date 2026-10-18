jest.mock('../models', () => ({
  Compromiso: { findByPk: jest.fn() },
  Seguimiento: { findAll: jest.fn(), bulkCreate: jest.fn() },
  Sesion: { findAll: jest.fn() },
  Emprendimiento: { findByPk: jest.fn() },
  Programa: {},
  Archivo: {}
}));

jest.mock('../utils/logger', () => ({ error: jest.fn() }));

jest.mock('../utils/acceso', () => ({
  puedeAccederEmprendimiento: jest.fn(),
  denegar: (res, mensaje) => res.status(403).json({ mensaje }),
  esAdmin: (usuario) => usuario?.rol === 'admin'
}));

const { Compromiso, Seguimiento, Sesion, Emprendimiento } = require('../models');
const { puedeAccederEmprendimiento } = require('../utils/acceso');
const { actualizarEstado, timelineEmprendimiento } = require('../controllers/compromisoController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

const compromisoDe = (emprendimientoId, extra = {}) => ({
  estado: 'planeado',
  seguimiento_revision_id: null,
  seguimientoOrigen: { emprendimiento_id: emprendimientoId },
  update: jest.fn(),
  ...extra
});

describe('compromisoController actualizarEstado', () => {
  beforeEach(() => jest.clearAllMocks());

  it('rejects an unknown state', async () => {
    const res = createResponse();
    await actualizarEstado({ params: { id: '1' }, body: { estado: 'terminado' }, usuario: { id: 7, rol: 'emprendedor' } }, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(Compromiso.findByPk).not.toHaveBeenCalled();
  });

  it('forbids an emprendedor from changing a commitment of another emprendimiento', async () => {
    const compromiso = compromisoDe(2);
    Compromiso.findByPk.mockResolvedValue(compromiso);
    puedeAccederEmprendimiento.mockResolvedValue(false);
    const res = createResponse();

    await actualizarEstado({ params: { id: '1' }, body: { estado: 'completado' }, usuario: { id: 7, rol: 'emprendedor' } }, res);

    expect(puedeAccederEmprendimiento).toHaveBeenCalledWith({ id: 7, rol: 'emprendedor' }, 2);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(compromiso.update).not.toHaveBeenCalled();
  });

  it('lets an emprendedor change only the state of their own commitment', async () => {
    const compromiso = compromisoDe(1);
    Compromiso.findByPk.mockResolvedValue(compromiso);
    puedeAccederEmprendimiento.mockResolvedValue(true);
    const res = createResponse();

    await actualizarEstado({
      params: { id: '1' },
      body: { estado: 'completado', seguimiento_revision_id: 99 },
      usuario: { id: 7, rol: 'emprendedor' }
    }, res);

    expect(compromiso.update).toHaveBeenCalledWith({ estado: 'completado' });
    expect(res.json).toHaveBeenCalledWith({ compromiso });
  });

  it('lets the admin link the review to a follow-up', async () => {
    const compromiso = compromisoDe(1);
    Compromiso.findByPk.mockResolvedValue(compromiso);
    puedeAccederEmprendimiento.mockResolvedValue(true);
    const res = createResponse();

    await actualizarEstado({
      params: { id: '1' },
      body: { estado: 'no_logrado', seguimiento_revision_id: 99 },
      usuario: { id: 1, rol: 'admin' }
    }, res);

    expect(compromiso.update).toHaveBeenCalledWith({ estado: 'no_logrado', seguimiento_revision_id: 99 });
  });

  it('returns 404 when the commitment does not exist', async () => {
    Compromiso.findByPk.mockResolvedValue(null);
    const res = createResponse();
    await actualizarEstado({ params: { id: '404' }, body: { estado: 'completado' }, usuario: { id: 1, rol: 'admin' } }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('compromisoController timelineEmprendimiento', () => {
  beforeEach(() => jest.clearAllMocks());

  it('does not write and returns sessions without a follow-up as virtual entries', async () => {
    puedeAccederEmprendimiento.mockResolvedValue(true);
    Emprendimiento.findByPk.mockResolvedValue({ id: 1, programa_id: 3 });
    Seguimiento.findAll.mockResolvedValue([
      { sesion_id: 10, toJSON: () => ({ id: 50, sesion_id: 10, sesion: { id: 10, fecha: '2026-10-17', archivos: [] }, compromisoItems: [] }) }
    ]);
    Sesion.findAll
      .mockResolvedValueOnce([{ id: 10 }, { id: 11 }])
      .mockResolvedValueOnce([{ id: 11, toJSON: () => ({ id: 11, fecha: '2026-10-03', archivos: [] }) }]);
    const res = createResponse();

    await timelineEmprendimiento({ params: { emprendimiento_id: '1' }, usuario: { id: 1, rol: 'admin' } }, res);

    expect(Seguimiento.bulkCreate).not.toHaveBeenCalled();
    const { seguimientos } = res.json.mock.calls[0][0];
    expect(seguimientos.map(s => s.sesion_id)).toEqual([11, 10]);
    expect(seguimientos[0]).toMatchObject({ id: null, virtual: true, emprendimiento_id: 1, estado_avance: 'sin_iniciar' });
  });
});
