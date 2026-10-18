import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogIn, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import IconButton from '../components/ui/IconButton';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [errorLogin, setErrorLogin] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    setErrorLogin('');
    try {
      const usr = await login(email, password);
      toast.success('Bienvenido, ' + usr.nombre);
      navigate(usr.rol === 'admin' ? '/dashboard' : '/mi-emprendimiento');
    } catch (error) {
      // El mensaje queda visible junto al formulario (antes solo un toast que se perdía al recargar)
      setErrorLogin(error.response?.data?.mensaje || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-brand-dark" style={{ backgroundImage: 'url(/login-bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center', backgroundRepeat: 'no-repeat' }}>
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-brand-dark/50" aria-hidden="true"></div>

      <main className="relative z-10 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-md p-8 sm:p-10">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="HUB TecnológICA" className="h-20 w-auto object-contain mx-auto mb-4" />
          <h1 className="text-brand-cyan-ink font-medium text-sm tracking-wide">Sistema de Seguimiento</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="login-email" className="block text-sm font-semibold text-brand-dark mb-1.5">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-invalid={!!errorLogin}
              aria-describedby={errorLogin ? 'login-error' : undefined}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan-ink outline-none transition-all text-base sm:text-sm"
              placeholder="correo@ejemplo.com"
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-semibold text-brand-dark mb-1.5">Contraseña</label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-invalid={!!errorLogin}
                aria-describedby={errorLogin ? 'login-error' : undefined}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan-ink outline-none transition-all text-base sm:text-sm pr-12"
                placeholder="••••••••"
              />
              {/* Botón conmutador: la etiqueta es fija y el estado lo da aria-pressed */}
              <IconButton
                label="Mostrar contraseña"
                icono={showPassword ? EyeOff : Eye}
                tamanioIcono={18}
                aria-pressed={showPassword}
                aria-controls="login-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-1 top-1/2 -translate-y-1/2"
              />
            </div>
          </div>

          {errorLogin && (
            <p id="login-error" role="alert" className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">
              {errorLogin}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            aria-busy={cargando || undefined}
            className="w-full bg-brand-dark text-white py-3 rounded-xl font-medium hover:bg-brand-dark/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-dark/20 hover:shadow-xl hover:shadow-brand-dark/30 text-sm"
          >
            {cargando ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" aria-hidden="true"></div>
                Ingresando...
              </>
            ) : (
              <>
                <LogIn size={18} aria-hidden="true" />
                Iniciar Sesión
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-8">Hub TecnológICA © {new Date().getFullYear()}</p>
      </main>
    </div>
  );
};

export default Login;
