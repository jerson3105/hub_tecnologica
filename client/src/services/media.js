const DEV_BACKEND_ORIGIN = 'http://localhost:5000';

export const getBackendOrigin = () => {
  if (import.meta.env.VITE_API_ORIGIN) {
    return import.meta.env.VITE_API_ORIGIN.replace(/\/$/, '');
  }

  return import.meta.env.DEV ? DEV_BACKEND_ORIGIN : window.location.origin;
};

export const resolveMentorPhotoUrl = (foto) => {
  if (!foto) return null;
  if (/^https?:\/\//i.test(foto)) return foto;

  const path = foto.startsWith('/') ? foto : `/${foto}`;
  return `${getBackendOrigin()}${path}`;
};
