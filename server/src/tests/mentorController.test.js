jest.mock('../models', () => ({
  Mentor: { findAll: jest.fn(), findByPk: jest.fn(), create: jest.fn() }
}));

jest.mock('../utils/logger', () => ({ error: jest.fn() }));

const fs = require('fs');
const { Mentor } = require('../models');
const ctrl = require('../controllers/mentorController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

const admin = { id: 1, rol: 'admin' };
const emprendedor = { id: 7, rol: 'emprendedor' };

describe('mentorController', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('rejects a LinkedIn that is not an http(s) link and removes the uploaded photo', async () => {
    const existe = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
    const borrar = jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});
    const res = createResponse();

    await ctrl.crear({
      body: { nombre: 'Ana', apellido: 'Ríos', linkedin: 'javascript:alert(1)' },
      file: { path: '/tmp/foto.jpg' },
      usuario: admin
    }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Mentor.create).not.toHaveBeenCalled();
    expect(borrar).toHaveBeenCalledWith('/tmp/foto.jpg');
    existe.mockRestore();
    borrar.mockRestore();
  });

  it('rejects an invalid scheduling link when editing', async () => {
    const update = jest.fn();
    Mentor.findByPk.mockResolvedValue({ id: 3, update });
    const res = createResponse();

    await ctrl.actualizar({ params: { id: '3' }, body: { calendly: 'calendly.com/ana' }, usuario: admin }, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('lets the team reactivate a mentor without sending the links again', async () => {
    const update = jest.fn();
    Mentor.findByPk.mockResolvedValue({ id: 3, linkedin: 'https://linkedin.com/in/ana', calendly: null, activo: false, update });
    const res = createResponse();

    await ctrl.actualizar({ params: { id: '3' }, body: { activo: true }, usuario: admin }, res);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ activo: true, linkedin: 'https://linkedin.com/in/ana' }));
  });

  it('only lists active mentors to an entrepreneur, even if they ask for inactive ones', async () => {
    Mentor.findAll.mockResolvedValue([]);
    const res = createResponse();

    await ctrl.listar({ query: { activo: 'false' }, usuario: emprendedor }, res);

    expect(Mentor.findAll.mock.calls[0][0].where).toEqual({ activo: true });
  });

  it('hides an inactive mentor from an entrepreneur', async () => {
    Mentor.findByPk.mockResolvedValue({ id: 3, activo: false });
    const res = createResponse();

    await ctrl.obtenerPorId({ params: { id: '3' }, usuario: emprendedor }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
