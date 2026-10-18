import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { ArrowRight, Eye, EyeOff, Moon, Sun, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTema } from '../tema';
import { useLogo } from '../utils/logo';
import Button from '../components/ui/Button';
import { CAMPO_CLS } from '../components/ui/estilos';
import { iconoBotonCls } from '../components/ui/estilosSemanticos';

// Campos de 44 px (objetivo táctil); CAMPO_CLS trae min-h-10 y una clase extra no lo sobrescribe
const CAMPO_LOGIN_CLS = CAMPO_CLS.replace('min-h-10', 'min-h-11');

const ALIADOS = [
  'Cámara de Comercio, Industria y Turismo de Ica',
  'Marcobre',
  'Ministerio de la Producción',
  'ProInnóvate',
  'Comunidad AGESE'
];

// La foto de marca trae los logos de los aliados incrustados arriba y abajo: se muestra ampliada al
// 150 % del alto y centrada, así solo se ve la franja central (cohete y geoglifos). Los aliados van
// como texto (se leen en móvil y con lector de pantalla). La foto ya trae los geoglifos en línea
// (colibrí y espiral): es el único motivo ilustrado de la pantalla.
const FONDO_MARCA = {
  backgroundImage: 'url(/login-bg.jpg)',
  backgroundSize: 'auto 150%',
  backgroundPosition: '12% 50%',
  backgroundRepeat: 'no-repeat'
};

const Aliados = ({ className = '' }) => (
  <div className={`grid gap-2.5 ${className}`.trim()}>
    <p className="text-xs font-semibold uppercase tracking-[0.06em]">Con el apoyo de</p>
    <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm font-medium">
      {ALIADOS.map((a) => <li key={a}>{a}</li>)}
    </ul>
  </div>
);

const Login = () => {
  const { login, usuario } = useAuth();
  const { oscuro, cambiarTema } = useTema();
  const logo = useLogo(oscuro ? 'negativo' : 'positivo');
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verClave, setVerClave] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Con la sesión ya iniciada, /login lleva al inicio de su rol
  if (usuario) return <Navigate to="/" replace />;

  const enviar = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const usr = await login(email.trim(), password);
      toast.success(`Hola, ${usr.nombre}`);
      navigate(usr.rol === 'admin' ? '/dashboard' : '/mi-emprendimiento', { replace: true });
    } catch (err) {
      // El mensaje queda junto al formulario (un toast se pierde)
      setError(err.response?.data?.mensaje || (err.response ? 'No se pudo iniciar sesión' : 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.'));
      setCargando(false);
    }
  };
  const revisarMayusculas = (e) => setMayusculas(e.getModifierState?.('CapsLock') || false);
  const describedBy = (...ids) => ids.filter(Boolean).join(' ') || undefined;

  return (
    <div className="grid min-h-dvh grid-cols-1 bg-background text-foreground lg:grid-cols-[minmax(0,1.2fr)_minmax(26rem,1fr)]">
      {/* Panel de marca: siempre en noche, en ambos temas */}
      <section
        aria-label="HUB TecnológICA"
        className="relative isolate flex min-h-52 flex-col justify-end gap-6 overflow-hidden bg-petroleo-950 px-6 py-8 text-cian-50 sm:px-10 lg:min-h-0 lg:gap-8 lg:px-14 lg:py-12"
        style={FONDO_MARCA}
      >
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-petroleo-950 via-petroleo-950/55 to-petroleo-950/25" />
        <div className="grid max-w-xl gap-3">
          <p className="animate-enter text-balance font-display text-[1.75rem] font-bold leading-[1.08] tracking-[-0.02em] sm:text-4xl lg:text-5xl">
            Cada paso de tu emprendimiento, en un solo trazo.
          </p>
          <p className="animate-enter text-[15px] text-cian-100/85 [animation-delay:35ms] lg:text-[17px]">
            Incubación y aceleración de emprendimientos en Ica.
          </p>
        </div>
        <Aliados className="hidden text-cian-100/80 lg:grid [&_li]:text-cian-50/90" />
      </section>

      {/* Formulario */}
      <main className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:py-12">
        {/* Posición en un envoltorio: iconoBotonCls ya lleva «relative» y no se puede sobrescribir */}
        <div className="absolute right-4 top-4">
          <button
            type="button"
            onClick={() => cambiarTema(oscuro ? 'claro' : 'oscuro')}
            className={iconoBotonCls()}
            aria-label={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={oscuro ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
          >
            {oscuro ? <Sun size={20} aria-hidden="true" /> : <Moon size={20} aria-hidden="true" />}
          </button>
        </div>

        <form onSubmit={enviar} className="animate-enter mx-auto grid w-full max-w-sm gap-5 [animation-delay:70ms]" aria-labelledby="t-login">
          {logo
            ? <img src={logo} alt="HUB TecnológICA" className="h-11 w-auto justify-self-start" />
            : <span className="h-11" aria-hidden="true" />}
          <div className="grid gap-1.5">
            <h1 id="t-login" className="font-display text-3xl font-semibold leading-tight tracking-[-0.015em]">Inicia sesión</h1>
            <p className="text-muted-foreground">Sistema de seguimiento de HUB TecnológICA</p>
          </div>

          {error && (
            <p id="login-error" role="alert" className="flex items-start gap-2 rounded-control bg-danger-soft px-3 py-2.5 text-sm text-danger-soft-foreground">
              <AlertCircle size={16} className="mt-0.5 shrink-0" aria-hidden="true" />{error}
            </p>
          )}

          <div className="grid gap-1.5">
            <label htmlFor="login-email" className="text-sm font-semibold">Correo electrónico</label>
            <input
              id="login-email"
              type="email"
              autoComplete="username"
              inputMode="email"
              autoCapitalize="none"
              spellCheck={false}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
              aria-invalid={!!error || undefined}
              aria-describedby={describedBy(error && 'login-error')}
              placeholder="tu@correo.com"
              className={CAMPO_LOGIN_CLS}
            />
          </div>

          <div className="grid gap-1.5">
            <label htmlFor="login-clave" className="text-sm font-semibold">Contraseña</label>
            <div className="relative">
              <input
                id="login-clave"
                type={verClave ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={revisarMayusculas}
                onKeyDown={revisarMayusculas}
                onBlur={() => setMayusculas(false)}
                required
                aria-invalid={!!error || undefined}
                aria-describedby={describedBy(error && 'login-error', mayusculas && 'login-mayus')}
                className={`${CAMPO_LOGIN_CLS} pr-12`}
              />
              <span className="absolute right-0.5 top-1/2 -translate-y-1/2">
                <button
                  type="button"
                  onClick={() => setVerClave((v) => !v)}
                  aria-pressed={verClave}
                  aria-controls="login-clave"
                  aria-label="Mostrar contraseña"
                  title={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  className={iconoBotonCls()}
                >
                  {verClave ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
                </button>
              </span>
            </div>
            {mayusculas && <p id="login-mayus" className="text-xs font-medium text-warning">Bloq Mayús está activado.</p>}
          </div>

          <Button type="submit" tamanio="lg" cargando={cargando} iconoFinal={ArrowRight} className="w-full">
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </Button>

          <p className="text-[13px] text-muted-foreground">
            ¿Olvidaste tu contraseña? Pide una temporal al equipo técnico del HUB.
          </p>

          <Aliados className="border-t border-border pt-5 text-muted-foreground lg:hidden [&_ul]:text-[13px]" />
          <p className="text-xs text-subtle-foreground">HUB TecnológICA © {new Date().getFullYear()}</p>
        </form>
      </main>
    </div>
  );
};

export default Login;
