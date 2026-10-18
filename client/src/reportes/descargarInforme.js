import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { nombreArchivo } from './nombreArchivo';

// Datos de cada informe (endpoints existentes) y nombre del archivo
const CARGAS = {
  programa: async (id) => {
    const { data } = await api.get(`/programas/${id}/resumen`);
    return { datos: data, archivo: ['Informe', data.periodo?.fase === 'terminado' ? 'cierre' : 'avance', data.programa.nombre, data.hoy] };
  },
  emprendimiento: async (id) => {
    const [detalle, resumen, objetivos, onePager] = await Promise.all([
      api.get(`/emprendimientos/${id}`),
      api.get(`/emprendimientos/${id}/resumen`),
      api.get(`/objetivos/emprendimiento/${id}`),
      // Sin One Pager la ficha sigue: esa sección lo indica
      api.get(`/one-pager/${id}`).catch(() => ({ data: {} }))
    ]);
    const emprendimiento = detalle.data.emprendimiento;
    return {
      datos: {
        emprendimiento,
        resumen: resumen.data.resumen,
        objetivos: objetivos.data.objetivos || [],
        onePager: onePager.data.onePager || null,
        hoy: resumen.data.hoy
      },
      archivo: ['Ficha', emprendimiento.nombre, resumen.data.hoy]
    };
  },
  impacto: async (programaId) => {
    const { data } = await api.get('/indicadores', { params: programaId ? { programa_id: programaId } : {} });
    return { datos: data, archivo: ['Impacto', data.programa?.nombre || 'todos-los-programas', data.hoy] };
  },
  satisfaccion: async (programaId) => {
    const { data } = await api.get('/indicadores/satisfaccion', { params: programaId ? { programa_id: programaId } : {} });
    return { datos: data, archivo: ['Satisfaccion-y-asistencia', data.programa?.nombre || 'todos-los-programas', data.hoy] };
  }
};

const descargarBlob = (blob, nombre) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

// Pide los datos, genera el PDF con la marca (el generador se descarga solo la primera vez) y lo
// guarda. `id` = programa o emprendimiento; en impacto y satisfacción, vacío = todos los programas.
export const descargarInforme = async (tipo, id) => {
  const toastId = toast.loading('Preparando el PDF…');
  try {
    const [{ datos, archivo }, { generarPdf }] = await Promise.all([
      CARGAS[tipo](id),
      import('./pdf/generar.jsx')
    ]);
    const blob = await generarPdf(tipo, datos);
    descargarBlob(blob, nombreArchivo(archivo));
    toast.success('PDF descargado', { id: toastId });
  } catch (error) {
    console.error(error);
    toast.error(error.response?.data?.mensaje || 'No se pudo generar el PDF', { id: toastId });
  }
};

// Botones de descarga: marca cuál se está generando para mostrar su estado de carga
export const useDescargarInforme = () => {
  const [generando, setGenerando] = useState(null);
  const descargar = async (tipo, id = '') => {
    setGenerando(`${tipo}-${id}`);
    try {
      await descargarInforme(tipo, id);
    } finally {
      setGenerando(null);
    }
  };
  return { descargar, generando: (tipo, id = '') => generando === `${tipo}-${id}` };
};
