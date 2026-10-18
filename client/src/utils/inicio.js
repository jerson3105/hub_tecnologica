import { ListChecks, Users, LayoutGrid, MessageSquareWarning, AlertTriangle } from 'lucide-react';
import { parseFecha } from './fechas';

// Textos y enlaces del Inicio del admin a partir de la respuesta de GET /api/inicio.

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

const mayuscula = (texto) => texto.charAt(0).toUpperCase() + texto.slice(1);

// «Domingo 18 de octubre»
export const fechaLarga = (valor) => {
  const f = parseFecha(valor);
  return f ? mayuscula(`${DIAS[f.getDay()]} ${f.getDate()} de ${MESES[f.getMonth()]}`) : '';
};

export const saludo = (hora = new Date().getHours()) => {
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

export const haceDias = (dias) => {
  if (dias === null || dias === undefined) return '';
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'ayer';
  return `hace ${dias} días`;
};

// Día de la agenda: «Hoy», «Mañana» o el día corto («Jue»), y el número del día
export const diaAgenda = (fecha, hoy) => {
  const f = parseFecha(fecha);
  const h = parseFecha(hoy);
  if (!f || !h) return { dia: '', numero: '' };
  const diferencia = Math.round((f - h) / 86400000);
  const dia = diferencia === 0 ? 'Hoy' : diferencia === 1 ? 'Mañana' : DIAS_CORTOS[f.getDay()];
  return { dia, numero: f.getDate(), esHoy: diferencia === 0 };
};

// «jueves y sábado», a partir de las fechas de las sesiones de la semana
export const diasDeLaSemana = (fechas = []) => {
  const nombres = [...new Set(fechas.map((f) => DIAS[parseFecha(f)?.getDay()]).filter(Boolean))];
  if (nombres.length === 0) return '';
  const texto = nombres.length === 1 ? nombres[0] : `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
  return mayuscula(texto);
};

const listaNombres = (emprendimientos, total) => {
  const nombres = emprendimientos.map((e) => e.nombre).join(', ');
  return total > emprendimientos.length ? `${nombres} y ${total - emprendimientos.length} más` : nombres;
};

// Cada asunto de la bandeja «Requiere tu atención»: icono, tono, textos y destino
export const asuntoDe = (item) => {
  switch (item.tipo) {
    case 'registros':
      return {
        icono: ListChecks,
        tono: 'warning',
        titulo: `${plural(item.total, 'registro', 'registros')} sin completar`,
        detalle: [item.sesion?.titulo, haceDias(item.dias)].filter(Boolean).join(' · '),
        accion: 'Registrar',
        to: `/sesiones/${item.sesion?.id}/registro?emp=${item.enlace?.emprendimientoId}`
      };
    case 'asistencia':
      return {
        icono: Users,
        tono: 'info',
        titulo: item.total === 1 ? 'Asistencia sin tomar' : `${item.total} sesiones sin asistencia`,
        detalle: [item.sesion?.titulo, haceDias(item.dias)].filter(Boolean).join(' · '),
        accion: 'Tomar',
        to: `/sesiones/${item.sesion?.id}?tab=asistencia`
      };
    case 'bmc':
      return {
        icono: LayoutGrid,
        tono: 'programa',
        titulo: `${item.total} BMC con versión nueva sin feedback`,
        detalle: listaNombres(item.emprendimientos || [], item.total),
        accion: 'Revisar',
        to: `/emprendimientos/${item.emprendimientos?.[0]?.id}?tab=bmc`
      };
    case 'detractores':
      return {
        icono: MessageSquareWarning,
        tono: 'danger',
        titulo: `${plural(item.total, 'evaluación', 'evaluaciones')} de detractor con comentario`,
        detalle: item.sesion?.titulo || 'Evaluación del programa',
        accion: 'Ver',
        to: item.sesion ? `/sesiones/${item.sesion.id}?tab=evaluacion` : '/reportes'
      };
    case 'vencidos':
      return {
        icono: AlertTriangle,
        tono: 'danger',
        titulo: `${plural(item.total, 'compromiso vencido', 'compromisos vencidos')}`,
        detalle: `En ${plural(item.emprendimientos, 'emprendimiento', 'emprendimientos')}`,
        accion: 'Ver cartera',
        href: '#cartera'
      };
    default:
      return null;
  }
};

// Subtítulo del saludo: «Tienes 5 asuntos que requieren tu atención y 2 sesiones esta semana.»
export const resumenDelDia = (asuntos, sesionesSemana) => {
  const sesiones = sesionesSemana === 0 ? 'ninguna sesión esta semana' : `${plural(sesionesSemana, 'sesión', 'sesiones')} esta semana`;
  if (asuntos === 0) return `No tienes asuntos pendientes y ${sesiones}.`;
  return `Tienes ${plural(asuntos, 'asunto que requiere', 'asuntos que requieren')} tu atención y ${sesiones}.`;
};

// Estado de la última reunión de un emprendimiento en la cartera
export const estadoReunion = (dias) => {
  if (dias === null || dias === undefined) return { texto: 'Sin reuniones', nivel: 'ninguno' };
  const texto = mayuscula(haceDias(dias));
  if (dias <= 10) return { texto, nivel: 'ok' };
  if (dias <= 21) return { texto, nivel: 'aviso' };
  return { texto, nivel: 'mal' };
};

export const formatoDecimal = (valor) =>
  valor === null || valor === undefined ? '—' : valor.toLocaleString('es-PE', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
