import { parseFecha } from './fechas';

// Textos de Programas a partir de GET /api/programas/resumen y /:id/resumen.

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

// «1 mar – 15 dic 2026» (el año solo al final si coincide)
export const rangoFechas = (inicio, fin) => {
  const a = parseFecha(inicio);
  const b = parseFecha(fin);
  if (!a || !b) return '';
  const corto = (f, conAnio) => `${f.getDate()} ${MESES_CORTOS[f.getMonth()]}${conAnio ? ` ${f.getFullYear()}` : ''}`;
  return `${corto(a, a.getFullYear() !== b.getFullYear())} – ${corto(b, true)}`;
};

export const mesCorto = (fecha) => {
  const f = parseFecha(fecha);
  return f ? MESES_CORTOS[f.getMonth()] : '';
};

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

// Cuándo es una sesión: «Hoy», «Mañana», «jueves 22» esta semana o «3 nov» más adelante
export const cuandoEs = (fecha, hoy) => {
  const f = parseFecha(fecha);
  const h = parseFecha(hoy);
  if (!f || !h) return '';
  const dias = Math.round((f - h) / 86400000);
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Mañana';
  if (dias > 1 && dias < 7) return `${DIAS[f.getDay()]} ${f.getDate()}`;
  return `${f.getDate()} ${MESES_CORTOS[f.getMonth()]}`;
};

// Dónde está el programa en su calendario: «Semana 7 de 16 · quedan 59 días»
export const textoPeriodo = (periodo) => {
  if (!periodo) return '';
  if (periodo.fase === 'por_empezar') return `Empieza en ${plural(periodo.diasParaEmpezar, 'día', 'días')}`;
  if (periodo.fase === 'terminado') return periodo.diasDesdeFin === 0 ? 'Terminó hoy' : `Terminó hace ${plural(periodo.diasDesdeFin, 'día', 'días')}`;
  return `Semana ${periodo.semana} de ${periodo.semanas} · ${periodo.diasParaTerminar === 0 ? 'termina hoy' : `quedan ${plural(periodo.diasParaTerminar, 'día', 'días')}`}`;
};

export const ESTADOS = {
  planificado: { label: 'Planificado', tono: 'info' },
  en_curso: { label: 'En curso', tono: 'success' },
  finalizado: { label: 'Finalizado', tono: 'neutral' }
};

export const estadoPrograma = (estado) => ESTADOS[estado] || ESTADOS.planificado;

// El estado lo cambia el equipo a mano; si las fechas dicen otra cosa se propone corregirlo
export const estadoSugerido = (programa) => {
  const fase = programa.periodo?.fase;
  if (programa.activo === false || !fase) return null;
  if (fase === 'en_curso' && programa.estado === 'planificado') {
    return { estado: 'en_curso', texto: 'Por sus fechas ya está en curso.', accion: 'Marcar en curso' };
  }
  if (fase === 'terminado' && programa.estado !== 'finalizado') {
    return { estado: 'finalizado', texto: 'Su fecha de fin ya pasó.', accion: 'Marcar finalizado' };
  }
  return null;
};

// Avisos de una tarjeta: solo lo que requiere acción
export const avisosDe = (kpis) => [
  kpis.registrosPendientes > 0 && { tono: 'warning', texto: plural(kpis.registrosPendientes, 'registro pendiente', 'registros pendientes') },
  kpis.compromisosVencidos > 0 && { tono: 'danger', texto: plural(kpis.compromisosVencidos, 'compromiso vencido', 'compromisos vencidos') }
].filter(Boolean);
