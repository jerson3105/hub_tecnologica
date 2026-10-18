import { FileSearch, Presentation, UserCheck, BookOpen, ClipboardList, MapPin, Video, MonitorSmartphone } from 'lucide-react';

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

// Tipos que se ofrecen al crear una sesión («Seguimiento» es heredado: solo se muestra en las antiguas)
export const TIPOS_CREABLES = ['uno_a_uno_programa', 'uno_a_uno_taller', 'taller', 'diagnostica_1', 'diagnostica_2', 'diagnostica_final'];

// Sesiones con un registro por emprendimiento (los talleres son grupales). Igual que en el servidor.
export const TIPOS_CON_REGISTRO = ['seguimiento', 'uno_a_uno_programa', 'uno_a_uno_taller', 'diagnostica_1', 'diagnostica_2', 'diagnostica_final'];

export const MODALIDADES = {
  presencial: { label: 'Presencial', icono: MapPin },
  virtual: { label: 'Virtual', icono: Video },
  hibrida: { label: 'Híbrida', icono: MonitorSmartphone }
};
