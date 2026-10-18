jest.mock('../models', () => ({
  Integrante: { findOne: jest.fn(), findAll: jest.fn() },
  Emprendimiento: {},
  Sesion: { findByPk: jest.fn() },
  SesionPrograma: { findOne: jest.fn() }
}));

const { Integrante, Sesion, SesionPrograma } = require('../models');
const { puedeAccederEmprendimiento, puedeAccederSesion, esUrlHttp } = require('../utils/acceso');

const admin = { id: 1, rol: 'admin' };
const emprendedor = { id: 7, rol: 'emprendedor' };

describe('acceso', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('puedeAccederEmprendimiento', () => {
    it('lets admins access any emprendimiento without querying', async () => {
      await expect(puedeAccederEmprendimiento(admin, 99)).resolves.toBe(true);
      expect(Integrante.findOne).not.toHaveBeenCalled();
    });

    it('lets members access their own emprendimiento', async () => {
      Integrante.findOne.mockResolvedValue({ id: 3 });
      await expect(puedeAccederEmprendimiento(emprendedor, 4)).resolves.toBe(true);
      expect(Integrante.findOne).toHaveBeenCalledWith(expect.objectContaining({
        where: { emprendimiento_id: 4, usuario_id: 7 }
      }));
    });

    it('denies emprendedores that are not members', async () => {
      Integrante.findOne.mockResolvedValue(null);
      await expect(puedeAccederEmprendimiento(emprendedor, 4)).resolves.toBe(false);
    });

    it('denies when the emprendimiento id is missing', async () => {
      await expect(puedeAccederEmprendimiento(emprendedor, undefined)).resolves.toBe(false);
    });
  });

  describe('puedeAccederSesion', () => {
    it('denies emprendedores without a program', async () => {
      Integrante.findAll.mockResolvedValue([]);
      await expect(puedeAccederSesion(emprendedor, 10)).resolves.toBe(false);
    });

    it('allows sessions linked to one of the user programs', async () => {
      Integrante.findAll.mockResolvedValue([{ emprendimiento: { programa_id: 2 } }]);
      SesionPrograma.findOne.mockResolvedValue({ sesion_id: 10 });
      await expect(puedeAccederSesion(emprendedor, 10)).resolves.toBe(true);
    });

    it('allows legacy sessions with a direct programa_id', async () => {
      Integrante.findAll.mockResolvedValue([{ emprendimiento: { programa_id: 2 } }]);
      SesionPrograma.findOne.mockResolvedValue(null);
      Sesion.findByPk.mockResolvedValue({ programa_id: 2 });
      await expect(puedeAccederSesion(emprendedor, 10)).resolves.toBe(true);
    });

    it('denies sessions of other programs', async () => {
      Integrante.findAll.mockResolvedValue([{ emprendimiento: { programa_id: 2 } }]);
      SesionPrograma.findOne.mockResolvedValue(null);
      Sesion.findByPk.mockResolvedValue({ programa_id: 5 });
      await expect(puedeAccederSesion(emprendedor, 10)).resolves.toBe(false);
    });
  });

  describe('esUrlHttp', () => {
    it.each([
      ['https://drive.google.com/x', true],
      ['http://example.com', true],
      ['javascript:alert(1)', false],
      ['data:text/html,hola', false],
      ['www.sin-esquema.com', false],
      ['', false],
      [undefined, false]
    ])('%s -> %s', (url, esperado) => {
      expect(esUrlHttp(url)).toBe(esperado);
    });
  });
});
