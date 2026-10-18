const { periodoDe, resumirPrograma } = require('../services/programas');
const { indexarAsistencias } = require('../services/inicio');

const HOY = '2026-10-17';
const PROGRAMA = { id: 1, fecha_inicio: '2026-09-01', fecha_fin: '2026-12-15' };

describe('programas service periodoDe', () => {
  it('places the current week inside the program', () => {
    expect(periodoDe(PROGRAMA, HOY)).toEqual({ fase: 'en_curso', porcentaje: 44, semana: 7, semanas: 16, diasParaTerminar: 59 });
  });

  it('counts the days left before it starts and after it ends', () => {
    expect(periodoDe({ fecha_inicio: '2026-11-01', fecha_fin: '2027-02-28' }, HOY)).toMatchObject({ fase: 'por_empezar', porcentaje: 0, diasParaEmpezar: 15 });
    expect(periodoDe({ fecha_inicio: '2026-03-01', fecha_fin: '2026-08-31' }, HOY)).toMatchObject({ fase: 'terminado', porcentaje: 100, diasDesdeFin: 47 });
  });

  it('returns null without dates', () => {
    expect(periodoDe({ fecha_inicio: null, fecha_fin: '2026-12-15' }, HOY)).toBeNull();
  });
});

describe('programas service resumirPrograma', () => {
  const sesion = (id, fecha, tipo = 'uno_a_uno_programa') => ({ id, titulo: `Sesión ${id}`, fecha, tipo, programa_id: 1, programas: [{ id: 1 }] });
  const S1 = sesion(1, '2026-10-01');
  const S2 = sesion(2, '2026-10-08', 'taller');
  const S3 = sesion(3, '2026-10-15');
  const S4 = sesion(4, '2026-10-24');

  const resumen = () => resumirPrograma({
    programa: PROGRAMA,
    hoy: HOY,
    emprendimientos: [
      { id: 1, nombre: 'AgroIca', estado: 'activo', programa_id: 1 },
      { id: 2, nombre: 'Pisco Lab', estado: 'graduado', programa_id: 1 }
    ],
    sesiones: [S1, S2, S3, S4],
    seguimientos: [
      { sesion_id: 1, emprendimiento_id: 1, realizado: 'BMC', sesion: S1, compromisoItems: [{ estado: 'planeado' }] },
      { sesion_id: 3, emprendimiento_id: 1, realizado: 'OKR', sesion: S3, compromisoItems: [] },
      { sesion_id: 1, emprendimiento_id: 2, realizado: 'Pitch', sesion: S1, compromisoItems: [] }
    ],
    integrantes: [{ emprendimiento_id: 1, usuario_id: 7 }, { emprendimiento_id: 2, usuario_id: 8 }],
    objetivos: [],
    nps: [
      { sesion_id: 2, usuario_id: 7, puntuacion: 9 },
      { sesion_id: 2, usuario_id: 8, puntuacion: 5 },
      { sesion_id: null, usuario_id: 7, puntuacion: 10 }
    ],
    asistencia: indexarAsistencias([
      { sesion_id: 2, usuario_id: 7, presente: true },
      { sesion_id: 2, usuario_id: 8, presente: false }
    ])
  });

  it('summarises indicators, next session and the session list', () => {
    const r = resumen();
    expect(r.kpis).toEqual({
      emprendimientosActivos: 1,
      emprendimientosGraduados: 1,
      sesionesTotales: 4,
      sesionesRealizadas: 3,
      // Sesión 3: Pisco Lab sin registro (el taller no lleva registro por emprendimiento)
      registrosPendientes: 1,
      compromisosVencidos: 1,
      emprendimientosConVencidos: 1,
      npsPromedio: 8,
      asistenciaMedia: 50
    });
    expect(r.proximaSesion).toEqual({ id: 4, titulo: 'Sesión 4', fecha: '2026-10-24', tipo: 'uno_a_uno_programa' });
    expect(r.sesiones.map((s) => [s.id, s.momento, s.registros, s.asistencia])).toEqual([
      [1, 'pasada', { registrados: 2, total: 2 }, null],
      [2, 'pasada', null, 50],
      [3, 'pasada', { registrados: 1, total: 2 }, null],
      [4, 'proxima', { registrados: 0, total: 2 }, null]
    ]);
    expect(r.sesiones[1].nps).toMatchObject({ total: 2, promedio: 7 });
  });

  it('builds the portfolio and the pulse of the program', () => {
    const r = resumen();
    expect(r.cartera.map((c) => [c.nombre, c.vencidos, c.ultimaReunion])).toEqual([
      ['AgroIca', 1, '2026-10-15'],
      ['Pisco Lab', 0, '2026-10-01']
    ]);
    expect(r.pulso.asistencia).toEqual({ media: 50, sesiones: [{ id: 2, titulo: 'Sesión 2', fecha: '2026-10-08', porcentaje: 50 }] });
    // Solo cuenta la evaluación de quien estuvo presente
    expect(r.pulso.respuesta).toEqual({ tasa: 100, respuestas: 1, presentes: 1 });
    expect(r.periodo.fase).toBe('en_curso');
  });
});
