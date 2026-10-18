jest.mock('../models', () => ({
  Objetivo: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  ResultadoClave: { findByPk: jest.fn(), count: jest.fn(), create: jest.fn() },
  ActividadOKR: { findByPk: jest.fn(), count: jest.fn(), create: jest.fn(), destroy: jest.fn() },
  Evidencia: { findByPk: jest.fn(), create: jest.fn() },
  Emprendimiento: { findByPk: jest.fn() }
}));

jest.mock('../utils/acceso', () => ({
  ...jest.requireActual('../utils/acceso'),
  puedeAccederEmprendimiento: jest.fn()
}));

jest.mock('../utils/logger', () => ({ error: jest.fn() }));

const { Objetivo, ActividadOKR, Emprendimiento } = require('../models');
const { puedeAccederEmprendimiento } = require('../utils/acceso');
const ctrl = require('../controllers/objetivoController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

const emprendedor = { id: 7, rol: 'emprendedor' };

describe('objetivoController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects reading the OKRs of an emprendimiento the user does not belong to', async () => {
    puedeAccederEmprendimiento.mockResolvedValue(false);
    const res = createResponse();

    await ctrl.obtenerPorEmprendimiento({ params: { emprendimiento_id: '8' }, usuario: emprendedor }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(Objetivo.findAll).not.toHaveBeenCalled();
  });

  it('rejects deleting another team objective', async () => {
    Objetivo.findByPk.mockResolvedValue({ id: 3, emprendimiento_id: 8, update: jest.fn() });
    puedeAccederEmprendimiento.mockResolvedValue(false);
    const res = createResponse();

    await ctrl.eliminar({ params: { id: '3' }, usuario: emprendedor }, res);

    expect(puedeAccederEmprendimiento).toHaveBeenCalledWith(emprendedor, 8);
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('stores an empty fecha_limite as null instead of an invalid date', async () => {
    Emprendimiento.findByPk.mockResolvedValue({ id: 8 });
    puedeAccederEmprendimiento.mockResolvedValue(true);
    Objetivo.create.mockResolvedValue({ id: 1 });
    const res = createResponse();

    await ctrl.crear({
      params: { emprendimiento_id: '8' },
      usuario: emprendedor,
      body: { titulo: ' Validar demanda ', tipo: 'ventas', fecha_limite: '' }
    }, res);

    expect(Objetivo.create).toHaveBeenCalledWith({
      emprendimiento_id: '8',
      titulo: 'Validar demanda',
      tipo: 'ventas',
      fecha_limite: null
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('treats a cleared meta_real as 0 instead of sending an empty string', async () => {
    const update = jest.fn();
    ActividadOKR.findByPk.mockResolvedValue({
      id: 4,
      descripcion: 'Llamar clientes',
      meta_numerica: 10,
      meta_real: 5,
      estado: 'en_progreso',
      resultadoClave: { objetivo: { emprendimiento_id: 8 } },
      update
    });
    puedeAccederEmprendimiento.mockResolvedValue(true);
    const res = createResponse();

    await ctrl.actualizarActividad({ params: { id: '4' }, usuario: emprendedor, body: { meta_real: '' } }, res);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ meta_real: 0, meta_numerica: 10 }));
  });
});
