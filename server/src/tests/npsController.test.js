jest.mock('../models', () => ({
  Nps: { findOne: jest.fn(), create: jest.fn(), findAll: jest.fn() },
  Sesion: { findByPk: jest.fn(), findAll: jest.fn() },
  Integrante: { findOne: jest.fn(), findAll: jest.fn() },
  Programa: {},
  SesionPrograma: {},
  Usuario: {},
  Emprendimiento: {}
}));

jest.mock('../config/database', () => ({}));
jest.mock('../utils/logger', () => ({ error: jest.fn() }));
jest.mock('../utils/acceso', () => ({ puedeAccederSesion: jest.fn() }));

const { Op } = require('sequelize');
const { Nps, Sesion, Integrante } = require('../models');
const { puedeAccederSesion } = require('../utils/acceso');
const { hoyLocal, esFutura } = require('../utils/fechas');
const { crear, misPendientes } = require('../controllers/npsController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

const emprendedor = { id: 7, rol: 'emprendedor' };
const enDias = (dias) => {
  const d = new Date(`${hoyLocal()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
};

describe('utils/fechas', () => {
  it('uses the Peru calendar day, not the UTC one', () => {
    // 03:00 UTC del 18 de octubre todavía es 22:00 del 17 en Lima (UTC-5)
    expect(hoyLocal(new Date('2026-10-18T03:00:00Z'))).toBe('2026-10-17');
    expect(esFutura('2026-10-18', new Date('2026-10-18T03:00:00Z'))).toBe(true);
    expect(esFutura('2026-10-17', new Date('2026-10-18T03:00:00Z'))).toBe(false);
  });
});

describe('npsController crear', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    puedeAccederSesion.mockResolvedValue(true);
    Nps.findOne.mockResolvedValue(null);
    Integrante.findOne.mockResolvedValue({ emprendimiento: { programa_id: 1 } });
    Nps.create.mockResolvedValue({ id: 1 });
  });

  it('rejects an evaluation of a session that has not happened yet', async () => {
    Sesion.findByPk.mockResolvedValue({ id: 5, fecha: enDias(3) });
    const res = createResponse();

    await crear({ body: { sesion_id: 5, puntuacion: 9 }, usuario: emprendedor }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Nps.create).not.toHaveBeenCalled();
  });

  it('accepts an evaluation of a session held today', async () => {
    Sesion.findByPk.mockResolvedValue({ id: 5, fecha: hoyLocal() });
    const res = createResponse();

    await crear({ body: { sesion_id: 5, puntuacion: 9 }, usuario: emprendedor }, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(Nps.create).toHaveBeenCalledWith(expect.objectContaining({ sesion_id: 5, programa_id: 1, usuario_id: 7 }));
  });

  it('returns 404 when the session does not exist', async () => {
    Sesion.findByPk.mockResolvedValue(null);
    const res = createResponse();
    await crear({ body: { sesion_id: 99, puntuacion: 9 }, usuario: emprendedor }, res);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});

describe('npsController misPendientes', () => {
  beforeEach(() => jest.clearAllMocks());

  it('only lists sessions up to today', async () => {
    Integrante.findAll.mockResolvedValue([{ emprendimiento: { id: 1, programa_id: 1 } }]);
    Sesion.findAll.mockResolvedValue([{ id: 3 }, { id: 2 }]);
    Nps.findAll.mockResolvedValue([{ sesion_id: 2 }]);
    const res = createResponse();

    await misPendientes({ usuario: emprendedor }, res);

    const consulta = Sesion.findAll.mock.calls[0][0];
    expect(consulta.where.fecha[Op.lte]).toBe(hoyLocal());
    expect(res.json).toHaveBeenCalledWith({ pendientes: [3] });
  });
});
