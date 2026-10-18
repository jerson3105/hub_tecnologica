import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import './App.css';

// Cada página se descarga al visitarla: un emprendedor no baja el código del panel de admin
const Inicio = lazy(() => import('./pages/Inicio'));
const Programas = lazy(() => import('./pages/Programas'));
const ProgramaDetalle = lazy(() => import('./pages/ProgramaDetalle'));
const Emprendimientos = lazy(() => import('./pages/Emprendimientos'));
const EmprendimientoDetalle = lazy(() => import('./pages/EmprendimientoDetalle'));
const Sesiones = lazy(() => import('./pages/Sesiones'));
const SesionDetalle = lazy(() => import('./pages/SesionDetalle'));
const Archivos = lazy(() => import('./pages/Archivos'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const Asistencias = lazy(() => import('./pages/Asistencias'));
const Perfil = lazy(() => import('./pages/Perfil'));
const MiEmprendimiento = lazy(() => import('./pages/MiEmprendimiento'));
const MisArchivos = lazy(() => import('./pages/MisArchivos'));
const OnePager = lazy(() => import('./pages/OnePager'));
const Bmc = lazy(() => import('./pages/Bmc'));
const SesionNps = lazy(() => import('./pages/SesionNps'));
const Reportes = lazy(() => import('./pages/Reportes'));
const Mentores = lazy(() => import('./pages/Mentores'));
const MisMentores = lazy(() => import('./pages/MisMentores'));
const SeguimientoV2 = lazy(() => import('./pages/SeguimientoV2'));
const MisObjetivos = lazy(() => import('./pages/MisObjetivos'));
const MiSeguimiento = lazy(() => import('./pages/MiSeguimiento'));

const Cargando = ({ pantallaCompleta = false }) => (
  <div className={`${pantallaCompleta ? 'min-h-screen' : 'h-64'} flex items-center justify-center`} role="status" aria-label="Cargando">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div>
  </div>
);

const RedirectByRole = () => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <Cargando pantallaCompleta />;
  if (!usuario) return <Navigate to="/login" replace />;
  return usuario.rol === 'admin' ? <Navigate to="/dashboard" replace /> : <Navigate to="/mi-emprendimiento" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Suspense fallback={<Cargando pantallaCompleta />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RedirectByRole />} />

          {/* Rutas protegidas con layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Admin */}
            <Route path="/dashboard" element={<ProtectedRoute adminOnly><Inicio /></ProtectedRoute>} />
            <Route path="/programas" element={<ProtectedRoute adminOnly><Programas /></ProtectedRoute>} />
            <Route path="/programas/:id" element={<ProtectedRoute adminOnly><ProgramaDetalle /></ProtectedRoute>} />
            <Route path="/emprendimientos" element={<ProtectedRoute adminOnly><Emprendimientos /></ProtectedRoute>} />
            <Route path="/seguimientos" element={<ProtectedRoute adminOnly><SeguimientoV2 /></ProtectedRoute>} />
            <Route path="/archivos" element={<ProtectedRoute adminOnly><Archivos /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute adminOnly><Usuarios /></ProtectedRoute>} />
            <Route path="/asistencias" element={<ProtectedRoute adminOnly><Asistencias /></ProtectedRoute>} />
            <Route path="/reportes" element={<ProtectedRoute adminOnly><Reportes /></ProtectedRoute>} />
            <Route path="/mentores" element={<ProtectedRoute adminOnly><Mentores /></ProtectedRoute>} />

            {/* Compartidas */}
            <Route path="/emprendimientos/:id" element={<EmprendimientoDetalle />} />
            <Route path="/sesiones" element={<Sesiones />} />
            <Route path="/sesiones/:id" element={<SesionDetalle />} />
            <Route path="/sesiones/:id/nps" element={<ProtectedRoute adminOnly><SesionNps /></ProtectedRoute>} />
            <Route path="/perfil" element={<Perfil />} />

            {/* Emprendedor */}
            <Route path="/mi-emprendimiento" element={<MiEmprendimiento />} />
            <Route path="/mis-archivos" element={<MisArchivos />} />
            <Route path="/one-pager" element={<OnePager />} />
            <Route path="/bmc" element={<Bmc />} />
            <Route path="/mis-mentores" element={<MisMentores />} />
            <Route path="/mis-objetivos" element={<MisObjetivos />} />
            <Route path="/mi-seguimiento" element={<MiSeguimiento />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}

export default App;
