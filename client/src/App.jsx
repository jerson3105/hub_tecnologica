import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Programas from './pages/Programas';
import ProgramaDetalle from './pages/ProgramaDetalle';
import Emprendimientos from './pages/Emprendimientos';
import EmprendimientoDetalle from './pages/EmprendimientoDetalle';
import Sesiones from './pages/Sesiones';
import SesionDetalle from './pages/SesionDetalle';
import Archivos from './pages/Archivos';
import Usuarios from './pages/Usuarios';
import Asistencias from './pages/Asistencias';
import Perfil from './pages/Perfil';
import MiEmprendimiento from './pages/MiEmprendimiento';
import MisArchivos from './pages/MisArchivos';
import OnePager from './pages/OnePager';
import Bmc from './pages/Bmc';
import SesionNps from './pages/SesionNps';
import Reportes from './pages/Reportes';
import Mentores from './pages/Mentores';
import MisMentores from './pages/MisMentores';
import SeguimientoV2 from './pages/SeguimientoV2';
import MisObjetivos from './pages/MisObjetivos';
import MiSeguimiento from './pages/MiSeguimiento';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

const RedirectByRole = () => {
  const { usuario, cargando } = useAuth();
  if (cargando) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div></div>;
  if (!usuario) return <Navigate to="/login" replace />;
  return usuario.rol === 'admin' ? <Navigate to="/dashboard" replace /> : <Navigate to="/mi-emprendimiento" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RedirectByRole />} />

          {/* Rutas protegidas con layout */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            {/* Admin */}
            <Route path="/dashboard" element={<ProtectedRoute adminOnly><Dashboard /></ProtectedRoute>} />
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
      </Router>
    </AuthProvider>
  );
}

export default App;
