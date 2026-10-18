import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de autenticación
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const esLogin = error.config?.url?.includes('/auth/login');
    // Un 401 en el propio login son credenciales incorrectas: lo maneja el formulario,
    // sin recargar la página (antes se perdía el mensaje y el correo escrito)
    if (error.response?.status === 401 && !esLogin && window.location.pathname !== '/login') {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
      toast.error('Tu sesión expiró. Vuelve a iniciar sesión.', { id: 'sesion-expirada' });
      setTimeout(() => { window.location.href = '/login'; }, 1200);
    }
    return Promise.reject(error);
  }
);

export const descargarArchivo = async (archivoId, nombreOriginal) => {
  const toastId = toast.loading('Descargando...');
  try {
    const res = await api.get(`/archivos/${archivoId}/descargar`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(res.data);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreOriginal || 'archivo';
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    toast.success('Descarga iniciada', { id: toastId });
  } catch (error) {
    let mensaje = 'No se pudo descargar el archivo';
    // Con responseType blob, el mensaje de error del servidor llega como Blob
    if (error.response?.data instanceof Blob) {
      try { mensaje = JSON.parse(await error.response.data.text()).mensaje || mensaje; } catch { /* sin detalle */ }
    }
    toast.error(mensaje, { id: toastId });
  }
};

export default api;
