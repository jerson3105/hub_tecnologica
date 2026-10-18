import { createContext, useContext, useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import api from '../services/api';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
};

// Lee la sesión guardada; un JSON corrupto en localStorage no debe romper la app
const leerSesionGuardada = () => {
  try {
    const token = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');
    return token && usuarioGuardado ? JSON.parse(usuarioGuardado) : null;
  } catch {
    localStorage.removeItem('usuario');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const queryClient = useQueryClient();
  const [usuario, setUsuario] = useState(leerSesionGuardada);
  const [cargando, setCargando] = useState(() => leerSesionGuardada() !== null);

  useEffect(() => {
    if (!leerSesionGuardada()) return;
    // Verificar que el token siga siendo válido
    api.get('/auth/perfil')
      .then(res => {
        setUsuario(res.data.usuario);
        localStorage.setItem('usuario', JSON.stringify(res.data.usuario));
      })
      .catch(() => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        setUsuario(null);
        queryClient.clear();
      })
      .finally(() => setCargando(false));
  }, [queryClient]);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, usuario: usr } = res.data;
    queryClient.clear();
    localStorage.setItem('token', token);
    localStorage.setItem('usuario', JSON.stringify(usr));
    setUsuario(usr);
    return usr;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, esAdmin: usuario?.rol === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
};
