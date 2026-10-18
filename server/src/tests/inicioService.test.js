const {
  sumarDias, diasEntre, compromisosDe, avanceOkr, asistenciaDe, resumirEmprendimiento, ordenarCartera, resumirNps
} = require('../services/inicio');

const HOY = '2026-10-17';
const seg = (sesionId, fecha, extra = {}) => ({ sesion_id: sesionId, sesion: { id: sesionId, fecha, tipo: 'seguimiento' }, compromisoItems: [], ...extra });

describe('inicio service fechas', () => {
  it('adds days across months and years', () => {
    expect(sumarDias('2026-10-17', 7)).toBe('2026-10-24');
    expect(sumarDias('2026-10-01', -1)).toBe('2026-09-30');
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
  });

  it('counts whole days between two dates', () => {
    expect(diasEntre('2026-10-10', HOY)).toBe(7);
    expect(diasEntre(HOY, HOY)).toBe(0);
  });
});

describe('inicio service compromisosDe', () => {
  it('marks an open commitment as overdue once a later past session exists', () => {
    const seguimientos = [
      seg(1, '2026-10-01', { compromisoItems: [{ estado: 'planeado' }, { estado: 'completado' }] }),
      seg(2, '2026-10-08')
    ];
    expect(compromisosDe(seguimientos, HOY)).toEqual({ abiertos: 1, vencidos: 1 });
  });

  it('does not mark as overdue when the next session is still in the future', () => {
    const seguimientos = [
      seg(1, '2026-10-01', { compromisoItems: [{ estado: 'en_progreso' }] }),
      seg(2, '2026-10-20')
    ];
    expect(compromisosDe(seguimientos, HOY)).toEqual({ abiertos: 1, vencidos: 0 });
  });
});

describe('inicio service avanceOkr', () => {
  it('returns null without activities', () => {
    expect(avanceOkr([])).toBeNull();
  });

  it('caps each activity at its goal and uses the state when there is no numeric goal', () => {
    const actividades = [
      { meta_numerica: 10, meta_real: 5 },
      { meta_numerica: 4, meta_real: 8 },
      { meta_numerica: null, meta_real: null, estado: 'completado' },
      { meta_numerica: 0, meta_real: 0, estado: 'pendiente' }
    ];
    // (0.5 + 1 + 1 + 0) / 4
    expect(avanceOkr(actividades)).toBe(63);
  });
});

describe('inicio service asistenciaDe', () => {
  it('counts sessions with attendance where at least one member was present', () => {
    const resultado = asistenciaDe({
      seguimientos: [seg(1, '2026-10-01'), seg(2, '2026-10-08'), seg(3, '2026-10-15'), seg(4, '2026-10-20')],
      hoy: HOY,
      usuarios: new Set([7, 8]),
      sesionesConAsistencia: new Set([1, 2, 4]),
      presentesPorSesion: new Map([[1, new Set([8])], [2, new Set([99])], [4, new Set([7])]])
    });
    // Sesión 3 sin asistencia tomada y sesión 4 futura: 1 de 2
    expect(resultado).toBe(50);
  });

  it('returns null when no attendance was taken', () => {
    expect(asistenciaDe({
      seguimientos: [seg(1, '2026-10-01')], hoy: HOY, usuarios: new Set([7]),
      sesionesConAsistencia: new Set(), presentesPorSesion: new Map()
    })).toBeNull();
  });
});

describe('inicio service resumirEmprendimiento', () => {
  it('takes the last past session with a record as the last meeting', () => {
    const fila = resumirEmprendimiento({
      emprendimiento: { id: 1, nombre: 'AgroIca', sector: 'Agro', estado: 'activo', programa: { id: 1, nombre: 'Incubación' } },
      seguimientos: [
        seg(1, '2026-10-01', { realizado: 'Revisamos el BMC' }),
        seg(2, '2026-10-08', { realizado: '   ' }),
        seg(3, '2026-10-20', { realizado: 'Futura' })
      ],
      hoy: HOY,
      usuarios: new Set(),
      actividades: [],
      sesionesConAsistencia: new Set(),
      presentesPorSesion: new Map()
    });
    expect(fila).toMatchObject({
      id: 1, programa: { id: 1, nombre: 'Incubación' }, ultimaReunion: '2026-10-01', diasSinReunion: 16, okr: null, asistencia: null
    });
  });
});

describe('inicio service ordenarCartera', () => {
  it('puts overdue commitments first, then the longest without a meeting, then the lowest OKR', () => {
    const filas = [
      { nombre: 'C', vencidos: 0, diasSinReunion: 3, okr: 80 },
      { nombre: 'A', vencidos: 2, diasSinReunion: 1, okr: 90 },
      { nombre: 'D', vencidos: 0, diasSinReunion: null, okr: null },
      { nombre: 'B', vencidos: 0, diasSinReunion: 3, okr: 20 },
      { nombre: 'E', vencidos: 0, diasSinReunion: 20, okr: 50 }
    ];
    expect(ordenarCartera(filas).map((f) => f.nombre)).toEqual(['A', 'E', 'B', 'C', 'D']);
  });
});

describe('inicio service resumirNps', () => {
  it('splits scores into detractors, passives and promoters', () => {
    const resumen = resumirNps([{ puntuacion: 10 }, { puntuacion: 9 }, { puntuacion: 7 }, { puntuacion: 4 }]);
    expect(resumen).toEqual({ total: 4, promedio: 7.5, detractores: 25, pasivos: 25, promotores: 50 });
  });

  it('returns an empty summary without answers', () => {
    expect(resumirNps([])).toEqual({ total: 0, promedio: null, detractores: 0, pasivos: 0, promotores: 0 });
  });
});
