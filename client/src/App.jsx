import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useSearchParams } from 'react-router-dom';
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
const Materiales = lazy(() => import('./pages/Materiales'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const Perfil = lazy(() => import('./pages/Perfil'));
const MiEmprendimiento = lazy(() => import('./pages/MiEmprendimiento'));
const OnePager = lazy(() => import('./pages/OnePager'));
const Bmc = lazy(() => import('./pages/Bmc'));
const RegistroRonda = lazy(() => import('./pages/RegistroRonda'));
const Reportes = lazy(() => import('./pages/Reportes'));
const Mentores = lazy(() => import('./pages/Mentores'));
const Seguimiento = lazy(() => import('./pages/Seguimiento'));
const MisObjetivos = lazy(() => import('./pages/MisObjetivos'));
const MiSeguimiento = lazy(() => import('./pages/MiSeguimiento'));

const Cargando = ({ pantallaCompleta = false }) => (
  <div className={`${pantallaCompleta ? 'min-h-screen' : 'h-64'} flex items-center justify-center`} role="status" aria-label="Cargando">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div>
  </div>
);

// /sesiones/:id/nps (enlaces guardados) → pestaña Evaluación de la sesión
const RedirigirEvaluacion = () => {
  const { id } = useParams();
  return <Navigate to={`/sesiones/${id}?tab=evaluacion`} replace />;
};

// /asistencias se retiró: la asistencia se toma en la pestaña de cada sesión.
// /asistencias?sesion=ID (enlaces guardados) → esa pestaña; sin sesión → la lista de sesiones.
const RedirigirAsistencias = () => {
  const [searchParams] = useSearchParams();
  const sesion = Number(searchParams.get('sesion'));
  return <Navigate to={sesion ? `/sesiones/${sesion}?tab=asistencia` : '/sesiones'} replace />;
};

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
            <Route path="/seguimientos" element={<ProtectedRoute adminOnly><Seguimiento /></ProtectedRoute>} />
            <Route path="/usuarios" element={<ProtectedRoute adminOnly><Usuarios /></ProtectedRoute>} />
            <Route path="/asistencias" element={<RedirigirAsistencias />} />
            <Route path="/reportes" element={<ProtectedRoute adminOnly><Reportes /></ProtectedRoute>} />

            {/* Compartidas */}
            <Route path="/emprendimientos/:id" element={<EmprendimientoDetalle />} />
            <Route path="/sesiones" element={<Sesiones />} />
            <Route path="/sesiones/:id" element={<SesionDetalle />} />
            {/* La evaluación vive ahora en la pestaña de la sesión; la ruta antigua redirige */}
            <Route path="/sesiones/:id/nps" element={<RedirigirEvaluacion />} />
            <Route path="/sesiones/:id/registro" element={<ProtectedRoute adminOnly><RegistroRonda /></ProtectedRoute>} />
            <Route path="/perfil" element={<Perfil />} />
            {/* Materiales unifica /archivos (admin) y /mis-archivos (emprendedor); las rutas antiguas redirigen */}
            <Route path="/materiales" element={<Materiales />} />
            <Route path="/archivos" element={<Navigate to="/materiales" replace />} />
            <Route path="/mis-archivos" element={<Navigate to="/materiales" replace />} />
            {/* Mentores unifica la gestión (admin) y Mis Mentores (emprendedor) */}
            <Route path="/mentores" element={<Mentores />} />
            <Route path="/mis-mentores" element={<Navigate to="/mentores" replace />} />

            {/* Emprendedor */}
            <Route path="/mi-emprendimiento" element={<MiEmprendimiento />} />
            <Route path="/one-pager" element={<OnePager />} />
            <Route path="/bmc" element={<Bmc />} />
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
