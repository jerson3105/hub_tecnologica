jest.mock('../models', () => ({
  Usuario: {
    findOne: jest.fn(),
    create: jest.fn(),
    findByPk: jest.fn()
  },
  Integrante: {},
  Emprendimiento: {},
  Programa: {}
}));

jest.mock('../utils/helpers', () => ({
  generarPasswordAleatorio: jest.fn(() => 'Temp1234!')
}));

jest.mock('../utils/logger', () => ({
  error: jest.fn()
}));

const { Usuario } = require('../models');
const { registrarUsuario, actualizarUsuario } = require('../controllers/authController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe('authController user payload normalization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes blank optional fields to null when creating users', async () => {
    Usuario.findOne.mockResolvedValue(null);
    Usuario.create.mockResolvedValue({
      toJSON: () => ({ id: 1, email: 'admin@test.com' })
    });

    const req = {
      body: {
        nombre: 'Admin',
        apellido: 'Principal',
        email: 'admin@test.com',
        rol: 'admin',
        telefono: '',
        dni: '',
        edad: '',
        fecha_nacimiento: '',
        direccion: '',
        distrito: '',
        provincia: '',
        ciudad: '',
        linkedin: '',
        genero: '',
        area: '',
        cargo: '',
        dedicacion: ''
      }
    };
    const res = createResponse();

    await registrarUsuario(req, res);

    expect(Usuario.create).toHaveBeenCalledWith(expect.objectContaining({
      telefono: null,
      dni: null,
      edad: null,
      fecha_nacimiento: null,
      direccion: null,
      distrito: null,
      provincia: null,
      ciudad: null,
      linkedin: null,
      genero: null,
      area: null,
      cargo: null,
      dedicacion: null
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('normalizes blank optional fields to null when updating users', async () => {
    const update = jest.fn();
    Usuario.findByPk.mockResolvedValue({
      email: 'user@test.com',
      nombre: 'User',
      apellido: 'Test',
      telefono: '999999999',
      rol: 'emprendedor',
      activo: true,
      dni: '12345678',
      edad: 25,
      fecha_nacimiento: '1999-01-01',
      direccion: 'Direccion',
      distrito: 'Distrito',
      provincia: 'Provincia',
      ciudad: 'Ciudad',
      linkedin: 'https://linkedin.com/in/test',
      genero: 'otro',
      area: 'Operaciones',
      cargo: 'Coordinador',
      dedicacion: 100,
      update,
      toJSON: () => ({ id: 1 })
    });

    const req = {
      params: { id: '1' },
      body: {
        telefono: '',
        dni: '',
        edad: '',
        fecha_nacimiento: '',
        direccion: '',
        distrito: '',
        provincia: '',
        ciudad: '',
        linkedin: '',
        genero: '',
        area: '',
        cargo: '',
        dedicacion: ''
      }
    };
    const res = createResponse();

    await actualizarUsuario(req, res);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      telefono: null,
      dni: null,
      edad: null,
      fecha_nacimiento: null,
      direccion: null,
      distrito: null,
      provincia: null,
      ciudad: null,
      linkedin: null,
      genero: null,
      area: null,
      cargo: null,
      dedicacion: null
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ mensaje: 'Usuario actualizado' }));
  });
});