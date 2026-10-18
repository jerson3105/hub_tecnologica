jest.mock('../models', () => ({
  Seguimiento: { findAll: jest.fn(), bulkCreate: jest.fn() },
  SesionPrograma: { findAll: jest.fn() },
  Emprendimiento: { findAll: jest.fn(), findByPk: jest.fn() }
}));

const { Seguimiento, SesionPrograma, Emprendimiento } = require('../models');
const { asegurarSeguimientosDeSesion, asegurarSeguimientosDeEmprendimiento } = require('../services/seguimientos');

describe('services/seguimientos', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates the missing follow-ups of a session for the active emprendimientos of its programs', async () => {
    SesionPrograma.findAll.mockResolvedValue([{ programa_id: 1 }, { programa_id: 2 }]);
    Emprendimiento.findAll.mockResolvedValue([{ id: 7 }, { id: 8 }, { id: 9 }]);
    Seguimiento.findAll.mockResolvedValue([{ emprendimiento_id: 8 }]);

    const creados = await asegurarSeguimientosDeSesion(5);

    expect(Emprendimiento.findAll.mock.calls[0][0].where.programa_id).toEqual([1, 2]);
    expect(Seguimiento.bulkCreate).toHaveBeenCalledWith([
      { sesion_id: 5, emprendimiento_id: 7, estado_avance: 'sin_iniciar' },
      { sesion_id: 5, emprendimiento_id: 9, estado_avance: 'sin_iniciar' }
    ], { ignoreDuplicates: true });
    expect(creados).toBe(2);
  });

  it('creates the follow-ups of an emprendimiento for every session of its program', async () => {
    Emprendimiento.findByPk.mockResolvedValue({ id: 4, programa_id: 1, estado: 'activo' });
    SesionPrograma.findAll.mockResolvedValue([{ sesion_id: 10 }, { sesion_id: 11 }, { sesion_id: 11 }]);
    Seguimiento.findAll.mockResolvedValue([{ sesion_id: 10 }]);

    await asegurarSeguimientosDeEmprendimiento(4);

    expect(Seguimiento.bulkCreate).toHaveBeenCalledWith(
      [{ sesion_id: 11, emprendimiento_id: 4, estado_avance: 'sin_iniciar' }],
      { ignoreDuplicates: true }
    );
  });

  it('does nothing for a withdrawn emprendimiento', async () => {
    Emprendimiento.findByPk.mockResolvedValue({ id: 4, programa_id: 1, estado: 'retirado' });
    await asegurarSeguimientosDeEmprendimiento(4);
    expect(Seguimiento.bulkCreate).not.toHaveBeenCalled();
  });
});
