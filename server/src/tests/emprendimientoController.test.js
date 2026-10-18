jest.mock('../models', () => ({
  Emprendimiento: {
    findByPk: jest.fn()
  },
  Integrante: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  Usuario: {
    findOne: jest.fn(),
    create: jest.fn()
  },
  Programa: {},
  Seguimiento: {},
  Archivo: {},
  Sesion: {}
}));

jest.mock('../utils/helpers', () => ({
  generarPasswordAleatorio: jest.fn(() => 'Temp1234!')
}));

jest.mock('../utils/logger', () => ({
  error: jest.fn()
}));

const { Emprendimiento, Integrante, Usuario } = require('../models');
const { agregarIntegrante } = require('../controllers/emprendimientoController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe('emprendimientoController agregarIntegrante', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('normalizes blank optional fields to null when creating the user', async () => {
    Emprendimiento.findByPk.mockResolvedValue({ id: 4 });
    Usuario.findOne.mockResolvedValue(null);
    Usuario.create.mockResolvedValue({
      id: 9,
      activo: true,
      rol: 'emprendedor',
      toJSON: () => ({ id: 9, email: 'testing2@gmail.com' })
    });
    Integrante.create.mockResolvedValue({ id: 5 });

    const req = {
      params: { id: '4' },
      usuario: { id: 1, rol: 'admin' },
      body: {
        nombre: 'tester 2',
        apellido: 'test',
        email: 'testing2@gmail.com',
        telefono: '',
        dni: '',
        edad: '',
        fecha_nacimiento: '1994-05-26',
        direccion: '',
        distrito: '',
        provincia: '',
        ciudad: '',
        linkedin: '',
        genero: 'masculino',
        area: '',
        cargo: '',
        dedicacion: '',
        rol_emprendimiento: 'lider',
        es_lider: true
      }
    };
    const res = createResponse();

    await agregarIntegrante(req, res);

    expect(Usuario.create).toHaveBeenCalledWith(expect.objectContaining({
      telefono: null,
      dni: null,
      edad: null,
      direccion: null,
      distrito: null,
      provincia: null,
      ciudad: null,
      linkedin: null,
      area: null,
      cargo: null,
      dedicacion: null,
      fecha_nacimiento: '1994-05-26',
      genero: 'masculino'
    }));
    expect(Integrante.create).toHaveBeenCalledWith(expect.objectContaining({
      emprendimiento_id: '4',
      usuario_id: 9,
      es_lider: true
    }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('does not let a team leader link an existing account by usuario_id', async () => {
    Emprendimiento.findByPk.mockResolvedValue({ id: 4 });
    Integrante.findOne.mockResolvedValue({ id: 1, es_lider: true });

    const req = {
      params: { id: '4' },
      usuario: { id: 2, rol: 'emprendedor' },
      body: { usuario_id: 15 }
    };
    const res = createResponse();

    await agregarIntegrante(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(Usuario.findOne).not.toHaveBeenCalled();
    expect(Integrante.create).not.toHaveBeenCalled();
  });

  it('does not let a team leader claim an account that already exists by email', async () => {
    Emprendimiento.findByPk.mockResolvedValue({ id: 4 });
    Integrante.findOne.mockResolvedValue({ id: 1, es_lider: true });
    Usuario.findOne.mockResolvedValue({ id: 15, activo: true, rol: 'emprendedor' });

    const req = {
      params: { id: '4' },
      usuario: { id: 2, rol: 'emprendedor' },
      body: { nombre: 'Ana', apellido: 'Ruiz', email: 'ana@test.com' }
    };
    const res = createResponse();

    await agregarIntegrante(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(Integrante.create).not.toHaveBeenCalled();
  });

  it('returns only basic user data to the caller', async () => {
    Emprendimiento.findByPk.mockResolvedValue({ id: 4 });
    Integrante.findOne.mockResolvedValue(null);
    Usuario.findOne.mockResolvedValue(null);
    Usuario.create.mockResolvedValue({
      id: 9,
      activo: true,
      rol: 'emprendedor',
      toJSON: () => ({ id: 9, nombre: 'Ana', apellido: 'Ruiz', email: 'ana@test.com', dni: '12345678', direccion: 'Calle 1' })
    });
    Integrante.create.mockResolvedValue({ id: 5 });

    const req = {
      params: { id: '4' },
      usuario: { id: 1, rol: 'admin' },
      body: { nombre: 'Ana', apellido: 'Ruiz', email: 'ana@test.com' }
    };
    const res = createResponse();

    await agregarIntegrante(req, res);

    const payload = res.json.mock.calls[0][0];
    expect(payload.usuario).toEqual({ id: 9, nombre: 'Ana', apellido: 'Ruiz', email: 'ana@test.com' });
  });
});