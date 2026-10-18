import { Link2, File, FileText, Image, Film, FileSpreadsheet, Presentation, FileArchive } from 'lucide-react';

// Icono y tono de cada material según sea un enlace o el tipo del archivo subido
export const iconoMaterial = (a) => {
  if (a.tipo === 'enlace') return { Icono: Link2, tono: 'info' };
  const mime = a.tipo_mime || '';
  if (mime.startsWith('image/')) return { Icono: Image, tono: 'success' };
  if (mime.startsWith('video/')) return { Icono: Film, tono: 'programa' };
  if (mime.includes('pdf')) return { Icono: FileText, tono: 'danger' };
  if (mime.includes('sheet') || mime.includes('excel')) return { Icono: FileSpreadsheet, tono: 'success' };
  if (mime.includes('presentation') || mime.includes('powerpoint')) return { Icono: Presentation, tono: 'warning' };
  if (mime.includes('zip') || mime.includes('rar')) return { Icono: FileArchive, tono: 'neutral' };
  return { Icono: File, tono: 'neutral' };
};

export const formatoTamanio = (bytes) => {
  const n = Number(bytes);
  if (!n) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1).replace('.0', '')} MB`;
};

// «drive.google.com» de un enlace, para saber adónde lleva antes de abrirlo
export const dominioDe = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
};

const normalizar = (texto) => String(texto || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Búsqueda sin tildes por nombre, descripción, sesión y emprendimientos
export const coincideMaterial = (a, texto) => {
  if (!texto) return true;
  const campos = [a.nombre_original, a.descripcion, a.sesion?.titulo, ...(a.emprendimientos || []).map((e) => e.nombre)];
  return normalizar(campos.join(' ')).includes(normalizar(texto));
};

// Grupos para la página de Materiales: primero lo que no es de una sesión (material del
// emprendimiento), luego cada sesión de la más reciente a la más antigua.
export const agruparPorSesion = (archivos) => {
  const sinSesion = [];
  const porSesion = new Map();
  archivos.forEach((a) => {
    if (!a.sesion) {
      sinSesion.push(a);
      return;
    }
    if (!porSesion.has(a.sesion.id)) porSesion.set(a.sesion.id, { id: `s${a.sesion.id}`, sesion: a.sesion, archivos: [] });
    porSesion.get(a.sesion.id).archivos.push(a);
  });
  const sesiones = [...porSesion.values()].sort((x, y) => String(y.sesion.fecha).localeCompare(String(x.sesion.fecha)));
  return [...(sinSesion.length ? [{ id: 'sin-sesion', sesion: null, archivos: sinSesion }] : []), ...sesiones];
};
