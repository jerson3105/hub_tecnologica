import { AlertTriangle, RotateCcw } from 'lucide-react';
import Button from './Button';

// Error al cargar un bloque de datos. Sustituye a los `.catch(() => [])` que mostraban una lista
// vacía («no hay datos») cuando en realidad la petición había fallado.
const ErrorCarga = ({ mensaje = 'No se pudo cargar esta información.', onReintentar, compacto = false, className = '' }) => (
  <div
    role="alert"
    className={`flex flex-wrap items-center gap-3 ${compacto ? 'px-4 py-3' : 'p-5'} text-sm text-danger-soft-foreground ${className}`.trim()}
  >
    <AlertTriangle size={18} className="shrink-0 text-danger" aria-hidden="true" />
    <span className="flex-1 min-w-[12rem]">{mensaje}</span>
    {onReintentar && (
      <Button variante="secondary" tamanio="sm" icono={RotateCcw} onClick={() => onReintentar()}>Reintentar</Button>
    )}
  </div>
);

export default ErrorCarga;
