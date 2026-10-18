// En desarrollo Vite redirige /uploads al backend y en producción se sirve desde el mismo
// origen, así que basta una ruta relativa. VITE_API_ORIGIN permite un backend en otro dominio.
export const getBackendOrigin = () => (import.meta.env.VITE_API_ORIGIN || '').replace(/\/$/, '');

export const resolveMentorPhotoUrl = (foto) => {
  if (!foto) return null;
  if (/^https?:\/\//i.test(foto)) return foto;

  const path = foto.startsWith('/') ? foto : `/${foto}`;
  return `${getBackendOrigin()}${path}`;
};
