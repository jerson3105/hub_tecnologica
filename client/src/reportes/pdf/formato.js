import { formatFecha } from '../../utils/fechas';
import { C } from './marca';

// Formatos compartidos por los informes PDF
export const fechaCorta = (valor) => formatFecha(valor, { day: 'numeric', month: 'short', year: 'numeric' });
export const fechaLarga = (valor) => formatFecha(valor, { day: 'numeric', month: 'long', year: 'numeric' });
export const porcentajeTexto = (valor) => (valor === null || valor === undefined ? '—' : `${valor} %`);

// Umbrales: asistencia < 60 % pide atención y < 40 % es grave; NPS ≥ 9 promotor, ≤ 6 detractor
export const colorAsistencia = (valor) => (valor < 40 ? C.rojo : valor < 60 ? C.ambarMarca : C.cianFuerte);
export const tonoAsistencia = (valor) => (valor < 40 ? 'danger' : valor < 60 ? 'warning' : 'success');
export const tonoNps = (valor) => (valor >= 9 ? 'success' : valor >= 7 ? 'warning' : 'danger');

export const TIPOS_EVALUACION = {
  taller: 'Talleres',
  seguimiento: 'Seguimiento 1 a 1',
  programa_medio: 'Mitad del programa',
  programa_final: 'Cierre del programa'
};
