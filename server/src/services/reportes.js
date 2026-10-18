const { agruparPor, resumirNps, porcentaje, programasDe } = require('./inicio');

// Agregados de los informes de impacto y de satisfacción y asistencia. Funciones puras: reciben
// las filas ya cargadas (ver indicadoresController) y devuelven lo que pinta el informe.

const RANGOS_EDAD = ['Menos de 25', '25 a 34', '35 a 44', '45 o más'];

// Edad en años: la guardada o la calculada con la fecha de nacimiento (AAAA-MM-DD)
const edadDe = (usuario, hoy) => {
  if (Number(usuario?.edad) > 0) return Number(usuario.edad);
  const nacimiento = /^(\d{4})-(\d{2})-(\d{2})/.exec(usuario?.fecha_nacimiento || '');
  if (!nacimiento) return null;
  const [anio, mes, dia] = hoy.split('-').map(Number);
  const edad = anio - Number(nacimiento[1]) - ((mes * 100 + dia) < (Number(nacimiento[2]) * 100 + Number(nacimiento[3])) ? 1 : 0);
  return edad > 0 && edad < 120 ? edad : null;
};

const rangoDe = (edad) => {
  if (edad === null) return null;
  if (edad < 25) return RANGOS_EDAD[0];
  if (edad < 35) return RANGOS_EDAD[1];
  if (edad < 45) return RANGOS_EDAD[2];
  return RANGOS_EDAD[3];
};

// Conteo de valores de texto libre agrupando mayúsculas, tildes y espacios («Agroindustria» y
// «agroindustria ») y mostrando la forma más frecuente. De mayor a menor.
const contarTextos = (valores) => {
  const grupos = new Map();
  valores.forEach((valor) => {
    const texto = String(valor || '').trim().replace(/\s+/g, ' ');
    if (!texto) return;
    const clave = texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const grupo = grupos.get(clave) || { total: 0, formas: new Map() };
    grupo.total += 1;
    grupo.formas.set(texto, (grupo.formas.get(texto) || 0) + 1);
    grupos.set(clave, grupo);
  });
  return [...grupos.values()]
    .map((g) => ({ nombre: [...g.formas.entries()].sort((a, b) => b[1] - a[1])[0][0], total: g.total }))
    .sort((a, b) => b.total - a.total || a.nombre.localeCompare(b.nombre, 'es'));
};

// Personas únicas de una lista de integrantes (un usuario cuenta una vez aunque lidere)
const personasDe = (integrantes, hoy) => {
  const porUsuario = new Map();
  integrantes.forEach((i) => {
    if (!i.usuario) return;
    const previo = porUsuario.get(i.usuario_id);
    porUsuario.set(i.usuario_id, { usuario: i.usuario, lider: Boolean(previo?.lider || i.es_lider) });
  });
  const personas = [...porUsuario.values()];
  const mujeres = personas.filter((p) => p.usuario.genero === 'femenino');
  const lideres = personas.filter((p) => p.lider);
  const conRango = personas.map((p) => rangoDe(edadDe(p.usuario, hoy)));
  return {
    total: personas.length,
    mujeres: mujeres.length,
    hombres: personas.filter((p) => p.usuario.genero === 'masculino').length,
    otro: personas.filter((p) => p.usuario.genero === 'otro').length,
    sinDato: personas.filter((p) => !p.usuario.genero).length,
    lideres: lideres.length,
    mujeresLideres: lideres.filter((p) => p.usuario.genero === 'femenino').length,
    edades: [
      ...RANGOS_EDAD.map((rango) => ({ rango, total: conRango.filter((r) => r === rango).length })),
      { rango: 'Sin dato', total: conRango.filter((r) => r === null).length }
    ],
    departamentos: contarTextos(personas.map((p) => p.usuario.ciudad)),
    provincias: contarTextos(personas.map((p) => [p.usuario.provincia, p.usuario.ciudad].filter(Boolean).join(', ')))
  };
};

const estadosDe = (emprendimientos) => ({
  total: emprendimientos.length,
  activos: emprendimientos.filter((e) => e.estado === 'activo').length,
  graduados: emprendimientos.filter((e) => e.estado === 'graduado').length,
  retirados: emprendimientos.filter((e) => e.estado === 'retirado').length
});

const empleosDe = (emprendimientos) => emprendimientos.reduce((t, e) => t + (Number(e.empleos_generados) || 0), 0);

// Informe de impacto: emprendimientos, personas (género, liderazgo, edad, territorio), empleos y
// sectores; con desglose por programa. Los retirados cuentan en el estado, no en personas ni empleos.
const resumirImpacto = ({ programas, emprendimientos, integrantes, hoy }) => {
  const vigentes = emprendimientos.filter((e) => e.estado !== 'retirado');
  const idsVigentes = new Set(vigentes.map((e) => e.id));
  const integrantesVigentes = integrantes.filter((i) => idsVigentes.has(i.emprendimiento_id));
  const personas = personasDe(integrantesVigentes, hoy);
  const empPorPrograma = agruparPor(emprendimientos, 'programa_id');
  const intPorEmp = agruparPor(integrantesVigentes, 'emprendimiento_id');

  return {
    emprendimientos: estadosDe(emprendimientos),
    personas: {
      ...personas,
      porcentajeMujeres: porcentaje(personas.mujeres, personas.total),
      porcentajeMujeresLideres: porcentaje(personas.mujeresLideres, personas.lideres)
    },
    empleos: empleosDe(vigentes),
    sectores: contarTextos(vigentes.map((e) => e.sector)),
    sinSector: vigentes.filter((e) => !String(e.sector || '').trim()).length,
    porPrograma: programas.map((p) => {
      const emps = empPorPrograma.get(p.id) || [];
      const vig = emps.filter((e) => e.estado !== 'retirado');
      const gente = personasDe(vig.flatMap((e) => intPorEmp.get(e.id) || []), hoy);
      return {
        id: p.id,
        nombre: p.nombre,
        estado: p.estado,
        fecha_inicio: p.fecha_inicio,
        fecha_fin: p.fecha_fin,
        ...estadosDe(emps),
        personas: gente.total,
        mujeres: gente.mujeres,
        mujeresLideres: gente.mujeresLideres,
        empleos: empleosDe(vig)
      };
    })
  };
};

// Satisfacción (NPS) y asistencia de las sesiones ya ocurridas. Los comentarios van sin nombre:
// el informe se comparte fuera del equipo técnico.
const resumirSatisfaccion = ({ sesiones, respuestas, emprendimientos, integrantes, asistencias, hoy }) => {
  const pasadas = sesiones.filter((s) => s.fecha <= hoy);
  const porSesion = agruparPor(respuestas.filter((r) => r.sesion_id), 'sesion_id');
  const porTipo = agruparPor(respuestas, 'tipo');

  // Asistencia: solo sesiones donde se tomó (tienen filas). Cada persona cuenta en las sesiones
  // de su programa; una persona sin fila en una sesión tomada cuenta como ausente.
  const filasPorSesion = agruparPor(asistencias, 'sesion_id');
  const tomadas = pasadas.filter((s) => filasPorSesion.has(s.id));
  const presentesPorSesion = new Map(tomadas.map((s) => [
    s.id,
    new Set(filasPorSesion.get(s.id).filter((a) => a.presente).map((a) => a.usuario_id))
  ]));
  const programaDeEmp = new Map(emprendimientos.map((e) => [e.id, e.programa_id]));
  const sesionesDePrograma = (programaId) => tomadas.filter((s) => programasDe(s).includes(programaId));

  const personas = integrantes.filter((i) => i.usuario && programaDeEmp.has(i.emprendimiento_id)).map((i) => {
    const propias = sesionesDePrograma(programaDeEmp.get(i.emprendimiento_id));
    const presentes = propias.filter((s) => presentesPorSesion.get(s.id).has(i.usuario_id)).length;
    return {
      usuario_id: i.usuario_id,
      nombre: `${i.usuario.nombre} ${i.usuario.apellido}`.trim(),
      emprendimiento_id: i.emprendimiento_id,
      sesiones: propias.length,
      presentes,
      porcentaje: porcentaje(presentes, propias.length)
    };
  });
  const nombreEmp = new Map(emprendimientos.map((e) => [e.id, e.nombre]));
  const porEmp = agruparPor(personas, 'emprendimiento_id');
  const totalSesiones = personas.reduce((t, p) => t + p.sesiones, 0);
  const totalPresentes = personas.reduce((t, p) => t + p.presentes, 0);

  return {
    nps: {
      global: resumirNps(respuestas),
      porTipo: [...porTipo.entries()].map(([tipo, lista]) => ({ tipo, ...resumirNps(lista) }))
        .sort((a, b) => b.total - a.total),
      porSesion: pasadas.filter((s) => porSesion.has(s.id)).map((s) => ({
        id: s.id, titulo: s.titulo, fecha: s.fecha, tipo: s.tipo, ...resumirNps(porSesion.get(s.id))
      })),
      comentarios: respuestas
        .filter((r) => String(r.comentario || '').trim() || String(r.areas_mejora || '').trim())
        .map((r) => ({
          puntuacion: r.puntuacion,
          tipo: r.tipo,
          sesion: r.sesion ? r.sesion.titulo : null,
          fecha: r.sesion ? r.sesion.fecha : null,
          comentario: String(r.comentario || '').trim() || null,
          areasMejora: String(r.areas_mejora || '').trim() || null
        }))
        .sort((a, b) => String(b.fecha || '').localeCompare(String(a.fecha || '')))
    },
    asistencia: {
      sesionesTomadas: tomadas.length,
      sesionesSinTomar: pasadas.length - tomadas.length,
      media: porcentaje(totalPresentes, totalSesiones),
      porEmprendimiento: [...porEmp.entries()].map(([id, gente]) => {
        const sesionesEsperadas = gente.reduce((t, p) => t + p.sesiones, 0);
        const presentes = gente.reduce((t, p) => t + p.presentes, 0);
        return { id, nombre: nombreEmp.get(id), personas: gente.length, porcentaje: porcentaje(presentes, sesionesEsperadas) };
      }).sort((a, b) => (a.porcentaje ?? 101) - (b.porcentaje ?? 101) || a.nombre.localeCompare(b.nombre, 'es')),
      porPersona: personas
        .filter((p) => p.sesiones > 0)
        .map((p) => ({ ...p, emprendimiento: nombreEmp.get(p.emprendimiento_id) }))
        .sort((a, b) => a.porcentaje - b.porcentaje || a.nombre.localeCompare(b.nombre, 'es'))
    }
  };
};

module.exports = { edadDe, contarTextos, resumirImpacto, resumirSatisfaccion, RANGOS_EDAD };
