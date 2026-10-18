jest.mock('../models', () => ({
  Seguimiento: { findByPk: jest.fn() },
  Sesion: {},
  Emprendimiento: {},
  Programa: {},
  Integrante: {}
}));

jest.mock('../utils/logger', () => ({ error: jest.fn() }));

const { Seguimiento } = require('../models');
const { actualizar } = require('../controllers/seguimientoController');

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn()
});

describe('seguimientoController actualizar', () => {
  it('saves the emprendedor and tallerista comments of 1-a-1 taller sessions', async () => {
    const update = jest.fn();
    Seguimiento.findByPk.mockResolvedValue({
      realizado: 'antes',
      compromisos: null,
      observaciones: null,
      estado_avance: 'en_progreso',
      enlace_grabacion: null,
      comentario_emprendedor: null,
      comentario_tallerista: null,
      update
    });
    const res = createResponse();

    await actualizar({
      params: { id: '1' },
      body: {
        realizado: 'después',
        comentario_emprendedor: 'Le sirvió el taller',
        comentario_tallerista: 'Avanzó con el pitch'
      }
    }, res);

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      realizado: 'después',
      comentario_emprendedor: 'Le sirvió el taller',
      comentario_tallerista: 'Avanzó con el pitch'
    }));
  });
});
