import { parseFecha } from './fechas';
import { MODALIDADES } from '../constants/sesiones';

// Textos y agrupación del listado de sesiones (GET /api/sesiones/resumen).

// '10:00:00' → '10:00'
export const hora = (valor) => (valor ? String(valor).slice(0, 5) : '');

// «10:00–12:00», «10:00» o ''
export const horario = (s) => {
  if (!s?.hora_inicio) return '';
  return s.hora_fin ? `${hora(s.hora_inicio)}–${hora(s.hora_fin)}` : hora(s.hora_inicio);
};

// «Presencial · Cámara de Comercio» / «Virtual»
export const modalidadTexto = (s) => {
  const m = MODALIDADES[s?.modalidad];
  if (!m) return '';
  return s.lugar && s.modalidad !== 'virtual' ? `${m.label} · ${s.lugar}` : m.label;
};

const DIAS = 86400000;
const diasDesde = (fecha, hoy) => Math.round((parseFecha(hoy) - parseFecha(fecha)) / DIAS);

// Una sesión ya ocurrida (de los últimos 30 días) a la que le falta algo: registros por completar
// o asistencia sin tomar. Las más antiguas no se arrastran: van a «Realizadas» con su aviso.
export const pendientesDe = (s) => ({
  registros: s.registros ? s.registros.total - s.registros.registrados : 0,
  asistencia: !s.asistencia && (s.participantes || 0) > 0
});

export const porCerrar = (s, hoy) => {
  if (s.momento !== 'pasada' || diasDesde(s.fecha, hoy) > 30) return false;
  const p = pendientesDe(s);
  return p.registros > 0 || p.asistencia;
};

// Grupos en orden de urgencia. Admin: Por cerrar · Hoy · Esta semana · Más adelante · Realizadas.
// Emprendedor: Por evaluar · Hoy · Esta semana · Más adelante · Realizadas.
// Las próximas van de la más cercana a la más lejana; lo pasado, de lo más reciente a lo más antiguo.
export const agruparSesiones = (sesiones, hoy, esAdmin) => {
  const grupos = { urgente: [], hoy: [], semana: [], despues: [], realizadas: [] };
  sesiones.forEach((s) => {
    if (s.momento === 'hoy') grupos.hoy.push(s);
    else if (s.momento === 'proxima') (diasDesde(hoy, s.fecha) <= 7 ? grupos.semana : grupos.despues).push(s); // días que faltan
    else if (esAdmin ? porCerrar(s, hoy) : s.evaluacion === 'pendiente') grupos.urgente.push(s);
    else grupos.realizadas.push(s);
  });
  const asc = (a, b) => String(a.fecha).localeCompare(String(b.fecha)) || String(a.hora_inicio || '').localeCompare(String(b.hora_inicio || ''));
  grupos.semana.sort(asc);
  grupos.despues.sort(asc);
  grupos.hoy.sort(asc);
  return [
    { id: 'urgente', titulo: esAdmin ? 'Por cerrar' : 'Por evaluar', ayuda: esAdmin ? 'Sesiones de los últimos 30 días con registros o asistencia pendientes' : 'Cuéntanos qué te parecieron', sesiones: grupos.urgente },
    { id: 'hoy', titulo: 'Hoy', sesiones: grupos.hoy },
    { id: 'semana', titulo: 'Próximos 7 días', sesiones: grupos.semana },
    { id: 'despues', titulo: 'Más adelante', sesiones: grupos.despues },
    { id: 'realizadas', titulo: 'Realizadas', sesiones: grupos.realizadas }
  ].filter((g) => g.sesiones.length > 0);
};
