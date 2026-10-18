jest.mock('../models', () => ({
  Archivo: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() },
  ArchivoEmprendimiento: { findAll: jest.fn(), bulkCreate: jest.fn(), destroy: jest.fn() },
  Emprendimiento: {},
  Integrante: { findOne: jest.fn() },
  Sesion: {}
}));

jest.mock('../utils/acceso', () => ({
  ...jest.requireActual('../utils/acceso'),
  emprendimientoIdsDeUsuario: jest.fn(),
  programaIdsDeUsuario: jest.fn(),
  sesionIdsDeProgramas: jest.fn()
}));

jest.mock('../utils/logger', () => ({ error: jest.fn() }));

const { Op } = require('sequelize');
const { Archivo, ArchivoEmprendimiento } = require('../models');
const { emprendimientoIdsDeUsuario, programaIdsDeUsuario, sesionIdsDeProgramas } = require('../utils/acceso');
const ctrl = require('../controllers/archivoController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

const emprendedor = { id: 7, rol: 'emprendedor' };

describe('archivoController.listar', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('shows an entrepreneur the material of their team and the one shared with a whole session', async () => {
    emprendimientoIdsDeUsuario.mockResolvedValue([4]);
    programaIdsDeUsuario.mockResolvedValue([2]);
    sesionIdsDeProgramas.mockResolvedValue([10, 11]);
    ArchivoEmprendimiento.findAll.mockResolvedValue([{ archivo_id: 1 }]);
    // 2: para toda la sesión 10 · 3: para otro equipo de la sesión 11 (no se ve)
    Archivo.findAll
      .mockResolvedValueOnce([{ id: 2, emprendimientos: [] }, { id: 3, emprendimientos: [{ id: 9 }] }])
      .mockResolvedValueOnce([{ id: 1 }, { id: 2 }]);
    const res = createResponse();

    await ctrl.listar({ query: { categoria: 'taller' }, usuario: emprendedor }, res);

    const consulta = Archivo.findAll.mock.calls[1][0];
    expect(consulta.where.categoria).toBe('taller');
    expect(consulta.where.id[Op.in].sort()).toEqual([1, 2]);
    // Solo sus propios emprendimientos en cada material, sin exigir que tenga alguno
    const incluye = consulta.include.find((i) => i.as === 'emprendimientos');
    expect(incluye.where.id[Op.in]).toEqual([4]);
    expect(incluye.required).toBe(false);
    expect(consulta.attributes).toEqual({ exclude: ['ruta', 'nombre_archivo'] });
    expect(res.json).toHaveBeenCalledWith({ archivos: [{ id: 1 }, { id: 2 }] });
  });

  it('returns nothing to an entrepreneur without a team', async () => {
    emprendimientoIdsDeUsuario.mockResolvedValue([]);
    programaIdsDeUsuario.mockResolvedValue([]);
    sesionIdsDeProgramas.mockResolvedValue([]);
    const res = createResponse();

    await ctrl.listar({ query: {}, usuario: emprendedor }, res);

    expect(Archivo.findAll).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ archivos: [] });
  });

  it('lets the technical team filter by emprendimiento', async () => {
    Archivo.findAll.mockResolvedValue([]);
    const res = createResponse();

    await ctrl.listar({ query: { emprendimiento_id: '4' }, usuario: { id: 1, rol: 'admin' } }, res);

    const incluye = Archivo.findAll.mock.calls[0][0].include.find((i) => i.as === 'emprendimientos');
    expect(incluye.where).toEqual({ id: '4' });
    expect(incluye.required).toBe(true);
    expect(res.json).toHaveBeenCalledWith({ archivos: [] });
  });
});
