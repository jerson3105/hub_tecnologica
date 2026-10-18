jest.mock('../models', () => ({
  Usuario: { findByPk: jest.fn() },
  Emprendimiento: { findByPk: jest.fn() },
  Integrante: { findOne: jest.fn(), findAll: jest.fn() },
  Seguimiento: { findAll: jest.fn(), findByPk: jest.fn() },
  Sesion: { findAll: jest.fn(), findByPk: jest.fn(), count: jest.fn() },
  SesionPrograma: { findOne: jest.fn() },
  Compromiso: { findAll: jest.fn() },
  Programa: {},
  Archivo: {},
  Asistencia: {}
}));

jest.mock('../utils/logger', () => ({ error: jest.fn(), warn: jest.fn(), info: jest.fn() }));

const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-prueba';

const { Usuario, Emprendimiento, Integrante, Seguimiento, Sesion, SesionPrograma, Compromiso } = require('../models');
const { seguimientoVisible, seguimientosVisibles } = require('../utils/privacidad');

const app = express();
app.use(express.json());
app.use('/api/emprendimientos', require('../routes/emprendimientos'));
app.use('/api/sesiones', require('../routes/sesiones'));
app.use('/api/seguimientos', require('../routes/seguimientos'));
app.use('/api/compromisos', require('../routes/compromisos'));

const ADMIN = { id: 1, rol: 'admin', activo: true };
const EMPRENDEDOR = { id: 7, rol: 'emprendedor', activo: true };
const token = (usuario) => `Bearer ${jwt.sign({ id: usuario.id }, process.env.JWT_SECRET)}`;

const SEGUIMIENTO = {
  id: 50,
  sesion_id: 10,
  emprendimiento_id: 4,
  realizado: 'Validamos precios con hoteles',
  observaciones: 'Le cuesta delegar; revisar en la próxima',
  comentario_tallerista: 'Debe reforzar la estructura de costos',
  comentario_emprendedor: 'Nos sirvió el ejercicio',
  estado_avance: 'en_progreso',
  sesion: { id: 10, titulo: 'Seguimiento 1', fecha: '2026-10-01', archivos: [] },
  compromisoItems: []
};

// Simula una instancia de Sequelize: res.json la serializa con toJSON
const instancia = (datos) => ({ ...datos, setDataValue: jest.fn(), toJSON: () => JSON.parse(JSON.stringify(datos)) });

const sinCamposInternos = (seguimiento) => {
  expect(seguimiento).not.toHaveProperty('observaciones');
  expect(seguimiento).not.toHaveProperty('comentario_tallerista');
  expect(seguimiento).toMatchObject({ realizado: SEGUIMIENTO.realizado, comentario_emprendedor: SEGUIMIENTO.comentario_emprendedor });
};

const conCamposInternos = (seguimiento) => {
  expect(seguimiento).toMatchObject({
    observaciones: SEGUIMIENTO.observaciones,
    comentario_tallerista: SEGUIMIENTO.comentario_tallerista
  });
};

beforeEach(() => {
  jest.resetAllMocks();
  Usuario.findByPk.mockImplementation(async (id) => [ADMIN, EMPRENDEDOR].find((u) => u.id === id) || null);
  // El emprendedor es integrante del emprendimiento 4, del programa 3
  Integrante.findOne.mockResolvedValue({ id: 3 });
  Integrante.findAll.mockResolvedValue([{ emprendimiento_id: 4, emprendimiento: { programa_id: 3 } }]);
});

describe('privacidad seguimientoVisible', () => {
  it('returns the follow-up untouched for the admin', () => {
    const seguimiento = instancia(SEGUIMIENTO);
    expect(seguimientoVisible(ADMIN, seguimiento)).toBe(seguimiento);
  });

  it('drops the internal fields for an emprendedor without changing the instance', () => {
    const seguimiento = instancia(SEGUIMIENTO);
    sinCamposInternos(seguimientoVisible(EMPRENDEDOR, seguimiento));
    expect(seguimiento.observaciones).toBe(SEGUIMIENTO.observaciones);
  });

  it('handles plain objects, lists and missing values', () => {
    sinCamposInternos(seguimientosVisibles(EMPRENDEDOR, [{ ...SEGUIMIENTO }])[0]);
    expect(seguimientoVisible(EMPRENDEDOR, null)).toBeNull();
    expect(seguimientosVisibles(EMPRENDEDOR, undefined)).toBeUndefined();
  });
});

describe('GET /api/emprendimientos/:id', () => {
  beforeEach(() => {
    Emprendimiento.findByPk.mockImplementation(async () => instancia({ id: 4, nombre: 'Café de Ica', seguimientos: [SEGUIMIENTO] }));
  });

  it('hides the internal fields of the follow-ups from an emprendedor', async () => {
    const res = await request(app).get('/api/emprendimientos/4').set('Authorization', token(EMPRENDEDOR));
    expect(res.status).toBe(200);
    sinCamposInternos(res.body.emprendimiento.seguimientos[0]);
  });

  it('sends them to the admin', async () => {
    const res = await request(app).get('/api/emprendimientos/4').set('Authorization', token(ADMIN));
    expect(res.status).toBe(200);
    conCamposInternos(res.body.emprendimiento.seguimientos[0]);
  });
});

describe('GET /api/compromisos/timeline/:emprendimiento_id', () => {
  beforeEach(() => {
    Emprendimiento.findByPk.mockResolvedValue({ id: 4, programa_id: 3 });
    Seguimiento.findAll.mockImplementation(async () => [instancia(SEGUIMIENTO)]);
    // Sesiones del programa; la 11 aún no tiene seguimiento y sale como entrada virtual
    Sesion.findAll
      .mockResolvedValueOnce([{ id: 10 }, { id: 11 }])
      .mockResolvedValueOnce([instancia({ id: 11, titulo: 'Seguimiento 2', fecha: '2026-10-15', archivos: [] })]);
  });

  it('hides the internal fields from an emprendedor, virtual entries included', async () => {
    const res = await request(app).get('/api/compromisos/timeline/4').set('Authorization', token(EMPRENDEDOR));
    expect(res.status).toBe(200);
    const [real, virtual] = res.body.seguimientos;
    sinCamposInternos(real);
    expect(virtual).toMatchObject({ virtual: true, sesion_id: 11 });
    expect(virtual).not.toHaveProperty('observaciones');
    expect(virtual).not.toHaveProperty('comentario_tallerista');
  });

  it('sends them to the admin', async () => {
    const res = await request(app).get('/api/compromisos/timeline/4').set('Authorization', token(ADMIN));
    expect(res.status).toBe(200);
    conCamposInternos(res.body.seguimientos[0]);
  });
});

describe('GET /api/compromisos/pendientes/:emprendimiento_id', () => {
  it('does not load the internal fields of the origin follow-up', async () => {
    Seguimiento.findAll.mockResolvedValue([{ id: 50 }]);
    Compromiso.findAll.mockResolvedValue([]);

    const res = await request(app).get('/api/compromisos/pendientes/4').set('Authorization', token(EMPRENDEDOR));

    expect(res.status).toBe(200);
    const origen = Compromiso.findAll.mock.calls[0][0].include.find((i) => i.as === 'seguimientoOrigen');
    expect(origen.attributes).toEqual(expect.arrayContaining(['id', 'sesion_id']));
    expect(origen.attributes).not.toContain('observaciones');
    expect(origen.attributes).not.toContain('comentario_tallerista');
  });
});

describe('GET /api/seguimientos', () => {
  beforeEach(() => {
    Seguimiento.findAll.mockImplementation(async () => [instancia(SEGUIMIENTO)]);
    Seguimiento.findByPk.mockImplementation(async () => instancia(SEGUIMIENTO));
  });

  it('hides the internal fields from an emprendedor in the list and the detail', async () => {
    const lista = await request(app).get('/api/seguimientos/emprendimiento/4').set('Authorization', token(EMPRENDEDOR));
    expect(lista.status).toBe(200);
    sinCamposInternos(lista.body.seguimientos[0]);

    const detalle = await request(app).get('/api/seguimientos/50').set('Authorization', token(EMPRENDEDOR));
    expect(detalle.status).toBe(200);
    sinCamposInternos(detalle.body.seguimiento);
  });

  it('sends them to the admin', async () => {
    const lista = await request(app).get('/api/seguimientos/emprendimiento/4').set('Authorization', token(ADMIN));
    conCamposInternos(lista.body.seguimientos[0]);

    const detalle = await request(app).get('/api/seguimientos/50').set('Authorization', token(ADMIN));
    conCamposInternos(detalle.body.seguimiento);
  });
});

describe('GET /api/sesiones/:id', () => {
  beforeEach(() => {
    SesionPrograma.findOne.mockResolvedValue({ sesion_id: 10 });
    Sesion.findByPk.mockImplementation(async () => instancia({ id: 10, titulo: 'Seguimiento 1', archivos: [], seguimientos: [SEGUIMIENTO] }));
  });

  it('hides the internal fields of the follow-up from an emprendedor', async () => {
    const res = await request(app).get('/api/sesiones/10').set('Authorization', token(EMPRENDEDOR));
    expect(res.status).toBe(200);
    sinCamposInternos(res.body.sesion.seguimientos[0]);
  });

  it('sends them to the admin', async () => {
    const res = await request(app).get('/api/sesiones/10').set('Authorization', token(ADMIN));
    expect(res.status).toBe(200);
    conCamposInternos(res.body.sesion.seguimientos[0]);
  });
});
