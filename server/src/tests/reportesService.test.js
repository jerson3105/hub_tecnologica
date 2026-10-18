const { edadDe, contarTextos, resumirImpacto, resumirSatisfaccion } = require('../services/reportes');

const HOY = '2026-10-18';

describe('services/reportes', () => {
  it('computes age from the stored value or the birth date, before or after the birthday', () => {
    expect(edadDe({ edad: 31 }, HOY)).toBe(31);
    expect(edadDe({ fecha_nacimiento: '2000-10-18' }, HOY)).toBe(26);
    expect(edadDe({ fecha_nacimiento: '2000-10-19' }, HOY)).toBe(25);
    expect(edadDe({}, HOY)).toBeNull();
  });

  it('groups free-text values ignoring case, accents and spaces', () => {
    expect(contarTextos(['Agroindustria', ' agroindustria', 'Turismo', 'AGROINDUSTRIA', 'Agroindustría', ''])).toEqual([
      { nombre: 'Agroindustria', total: 4 },
      { nombre: 'Turismo', total: 1 }
    ]);
  });

  it('summarises impact counting each person once and leaving withdrawn teams out of people and jobs', () => {
    const programas = [{ id: 1, nombre: 'Incubación', estado: 'en_curso' }];
    const emprendimientos = [
      { id: 10, programa_id: 1, estado: 'activo', sector: 'Agro', empleos_generados: 3 },
      { id: 11, programa_id: 1, estado: 'graduado', sector: 'agro ', empleos_generados: 2 },
      { id: 12, programa_id: 1, estado: 'retirado', sector: 'Turismo', empleos_generados: 9 }
    ];
    const ana = { id: 1, genero: 'femenino', edad: 23, ciudad: 'ICA', provincia: 'NAZCA' };
    const integrantes = [
      { emprendimiento_id: 10, usuario_id: 1, es_lider: true, usuario: ana },
      { emprendimiento_id: 11, usuario_id: 2, es_lider: true, usuario: { id: 2, genero: 'masculino', fecha_nacimiento: '1980-01-01', ciudad: 'ICA', provincia: 'ICA' } },
      { emprendimiento_id: 11, usuario_id: 3, es_lider: false, usuario: { id: 3, genero: 'femenino' } },
      { emprendimiento_id: 12, usuario_id: 4, es_lider: true, usuario: { id: 4, genero: 'femenino' } }
    ];

    const r = resumirImpacto({ programas, emprendimientos, integrantes, hoy: HOY });

    expect(r.emprendimientos).toEqual({ total: 3, activos: 1, graduados: 1, retirados: 1 });
    expect(r.empleos).toBe(5);
    expect(r.personas).toMatchObject({ total: 3, mujeres: 2, hombres: 1, lideres: 2, mujeresLideres: 1, porcentajeMujeres: 67, porcentajeMujeresLideres: 50 });
    expect(r.personas.edades).toEqual(expect.arrayContaining([{ rango: 'Menos de 25', total: 1 }, { rango: '45 o más', total: 1 }, { rango: 'Sin dato', total: 1 }]));
    expect(r.personas.departamentos).toEqual([{ nombre: 'ICA', total: 2 }]);
    expect(r.sectores).toEqual([{ nombre: 'Agro', total: 2 }]);
    expect(r.porPrograma[0]).toMatchObject({ id: 1, total: 3, retirados: 1, personas: 3, mujeres: 2, empleos: 5 });
  });

  it('measures attendance per person over the sessions of their programme where it was taken', () => {
    const sesiones = [
      { id: 1, titulo: 'Taller', fecha: '2026-10-01', tipo: 'taller', programa_id: 1, programas: [] },
      { id: 2, titulo: '1 a 1', fecha: '2026-10-08', tipo: 'uno_a_uno_programa', programa_id: 1, programas: [] },
      { id: 3, titulo: 'Sin tomar', fecha: '2026-10-10', tipo: 'taller', programa_id: 1, programas: [] },
      { id: 4, titulo: 'Futura', fecha: '2026-11-01', tipo: 'taller', programa_id: 1, programas: [] }
    ];
    const emprendimientos = [{ id: 10, nombre: 'AgroIca', programa_id: 1 }];
    const integrantes = [
      { emprendimiento_id: 10, usuario_id: 1, usuario: { nombre: 'Ana', apellido: 'Ríos' } },
      { emprendimiento_id: 10, usuario_id: 2, usuario: { nombre: 'Luis', apellido: 'Paz' } }
    ];
    const asistencias = [
      { sesion_id: 1, usuario_id: 1, presente: true },
      { sesion_id: 1, usuario_id: 2, presente: false },
      { sesion_id: 2, usuario_id: 1, presente: true }
    ];
    const respuestas = [
      { sesion_id: 1, tipo: 'taller', puntuacion: 10, comentario: 'Muy útil', areas_mejora: '', sesion: { titulo: 'Taller', fecha: '2026-10-01' } },
      { sesion_id: 1, tipo: 'taller', puntuacion: 6, comentario: null, areas_mejora: null, sesion: { titulo: 'Taller', fecha: '2026-10-01' } }
    ];

    const r = resumirSatisfaccion({ sesiones, respuestas, emprendimientos, integrantes, asistencias, hoy: HOY });

    expect(r.asistencia).toMatchObject({ sesionesTomadas: 2, sesionesSinTomar: 1, media: 50 });
    expect(r.asistencia.porPersona.map((p) => [p.nombre, p.presentes, p.sesiones, p.porcentaje])).toEqual([
      ['Luis Paz', 0, 2, 0],
      ['Ana Ríos', 2, 2, 100]
    ]);
    expect(r.asistencia.porEmprendimiento).toEqual([{ id: 10, nombre: 'AgroIca', personas: 2, porcentaje: 50 }]);
    expect(r.nps.global).toMatchObject({ total: 2, promedio: 8, promotores: 50, detractores: 50 });
    expect(r.nps.porSesion).toHaveLength(1);
    // Solo las respuestas con texto, y sin datos de quién respondió
    expect(r.nps.comentarios).toEqual([{ puntuacion: 10, tipo: 'taller', sesion: 'Taller', fecha: '2026-10-01', comentario: 'Muy útil', areasMejora: null }]);
  });
});
