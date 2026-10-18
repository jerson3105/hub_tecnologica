const { resumirSesionesAdmin, resumirSesionesEmprendedor, estadoEnRonda, filaDeRonda, momentoDe } = require('../services/sesiones');

const HOY = '2026-10-17';
const sesion = (id, fecha, tipo = 'uno_a_uno_programa', programaId = 1) => ({
  id, titulo: `Sesión ${id}`, fecha, tipo, programa_id: programaId, programas: [{ id: programaId, nombre: 'Incubación' }]
});

describe('sesiones service momentoDe', () => {
  it('classifies past, today and upcoming sessions', () => {
    expect(momentoDe('2026-10-10', HOY)).toBe('pasada');
    expect(momentoDe(HOY, HOY)).toBe('hoy');
    expect(momentoDe('2026-10-20', HOY)).toBe('proxima');
  });
});

describe('sesiones service resumirSesionesAdmin', () => {
  it('counts records only for sessions that need them, plus attendance and NPS', () => {
    const filas = resumirSesionesAdmin({
      sesiones: [sesion(1, '2026-10-10'), sesion(2, '2026-10-12', 'taller'), sesion(3, '2026-10-20')],
      emprendimientos: [{ id: 1, programa_id: 1 }, { id: 2, programa_id: 1 }],
      seguimientos: [
        { sesion_id: 1, emprendimiento_id: 1, realizado: 'BMC' },
        { sesion_id: 1, emprendimiento_id: 2, realizado: '  ' }
      ],
      asistencias: [{ sesion_id: 2, presente: true }, { sesion_id: 2, presente: false }],
      nps: [{ sesion_id: 2, puntuacion: 10 }, { sesion_id: 2, puntuacion: 7 }],
      hoy: HOY
    });
    expect(filas.map((f) => [f.id, f.momento, f.registros, f.asistencia, f.nps])).toEqual([
      [1, 'pasada', { registrados: 1, total: 2 }, null, null],
      [2, 'pasada', null, { presentes: 1, total: 2 }, { promedio: 8.5, total: 2 }],
      [3, 'proxima', { registrados: 0, total: 2 }, null, null]
    ]);
    expect(filas[0]).toMatchObject({ participantes: 2, programas: [{ id: 1, nombre: 'Incubación' }] });
  });
});

describe('sesiones service resumirSesionesEmprendedor', () => {
  it('asks to evaluate only sessions that already happened', () => {
    const filas = resumirSesionesEmprendedor({
      sesiones: [sesion(1, '2026-10-10'), sesion(2, HOY), sesion(3, '2026-10-20')],
      evaluadas: new Set([1]),
      hoy: HOY
    });
    expect(filas.map((f) => f.evaluacion)).toEqual(['hecha', 'pendiente', null]);
    expect(filas[0]).not.toHaveProperty('registros');
  });
});

describe('sesiones service estadoEnRonda', () => {
  const miembro = (presente) => ({ presente });
  it('is recorded when there are notes, regardless of attendance', () => {
    expect(estadoEnRonda({ seguimiento: { realizado: 'Precios' }, equipo: [miembro(false)] })).toBe('registrado');
  });
  it('is "did not attend" only when attendance was taken for the whole team and nobody came', () => {
    expect(estadoEnRonda({ seguimiento: null, equipo: [miembro(false), miembro(false)] })).toBe('no_asistio');
    expect(estadoEnRonda({ seguimiento: null, equipo: [miembro(false), miembro(null)] })).toBe('pendiente');
    expect(estadoEnRonda({ seguimiento: { realizado: '' }, equipo: [] })).toBe('pendiente');
  });
});

describe('sesiones service filaDeRonda', () => {
  const ACTUAL = sesion(5, '2026-10-17');
  const fila = (extra = {}) => filaDeRonda({
    emprendimiento: { id: 1, nombre: 'AgroIca', sector: 'Agro', programa: { id: 1, nombre: 'Incubación' } },
    sesion: ACTUAL,
    seguimientos: [
      {
        id: 10, sesion_id: 3, sesion: { id: 3, titulo: 'Ronda #1', fecha: '2026-10-03' },
        compromisoItems: [
          { id: 100, descripcion: 'Cotizar empaques', estado: 'planeado', orden: 0 },
          { id: 101, descripcion: 'Visitar mercado', estado: 'completado', orden: 1 },
          { id: 102, descripcion: 'Revisar costos', estado: 'completado', orden: 2, seguimiento_revision_id: 20 }
        ]
      },
      { id: 20, sesion_id: 5, realizado: 'Precios', observaciones: null, sesion: ACTUAL, compromisoItems: [{ id: 200, descripcion: 'Llamar a hoteles', estado: 'planeado', orden: 0 }] },
      { id: 30, sesion_id: 7, sesion: { id: 7, titulo: 'Ronda #3', fecha: '2026-10-24' }, compromisoItems: [{ id: 300, descripcion: 'Futuro', estado: 'planeado' }] }
    ],
    integrantes: [
      { usuario_id: 7, es_lider: true, rol_emprendimiento: 'Fundadora', usuario: { nombre: 'Lucía', apellido: 'Quispe' } },
      { usuario_id: 8, es_lider: false, usuario: { nombre: 'Ana', apellido: 'Paz' } }
    ],
    asistencias: [{ usuario_id: 7, presente: true }, { usuario_id: 99, presente: true }],
    ...extra
  });

  it('builds notes, this session commitments and the team with attendance', () => {
    const f = fila();
    expect(f.seguimiento).toEqual({ id: 20, realizado: 'Precios', observaciones: '', enlace_grabacion: '' });
    expect(f.compromisos).toEqual([{ id: 200, descripcion: 'Llamar a hoteles', estado: 'planeado' }]);
    expect(f.equipo).toEqual([
      { usuario_id: 7, nombre: 'Lucía', apellido: 'Quispe', rol: 'Fundadora', es_lider: true, presente: true },
      { usuario_id: 8, nombre: 'Ana', apellido: 'Paz', rol: null, es_lider: false, presente: null }
    ]);
    expect(f.estado).toBe('registrado');
  });

  it('lists open commitments from earlier sessions and the ones already reviewed here', () => {
    expect(fila().anteriores.map((c) => [c.id, c.revisadoAqui])).toEqual([[100, false], [102, true]]);
  });
});
