import { FileSearch, Presentation, UserCheck, BookOpen, ClipboardList } from 'lucide-react';

// Etiqueta, tono de Badge e icono de cada tipo de sesión, compartidos por todas las páginas
export const TIPOS_SESION = {
  diagnostica_1: { label: 'Diagnóstica 1', tono: 'purple', icono: FileSearch },
  diagnostica_2: { label: 'Diagnóstica 2', tono: 'purple', icono: FileSearch },
  diagnostica_final: { label: 'Diagnóstica Final', tono: 'purple', icono: FileSearch },
  taller: { label: 'Taller', tono: 'blue', icono: Presentation },
  uno_a_uno_programa: { label: '1 a 1 Programa', tono: 'cyan', icono: UserCheck },
  uno_a_uno_taller: { label: '1 a 1 Taller', tono: 'green', icono: BookOpen },
  seguimiento: { label: 'Seguimiento', tono: 'neutral', icono: ClipboardList }
};

export const tipoSesion = (tipo) => TIPOS_SESION[tipo] || TIPOS_SESION.seguimiento;
