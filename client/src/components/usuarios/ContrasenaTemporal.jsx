import { useState } from 'react';
import { Copy, Check, KeyRound } from 'lucide-react';
import toast from 'react-hot-toast';

// Contraseña temporal recién generada (usuario nuevo o restablecida). Solo se ve esta vez: el
// servidor no la guarda en claro, así que se ofrece copiarla.
const ContrasenaTemporal = ({ password, titulo = 'Contraseña temporal', nombre }) => {
  const [copiada, setCopiada] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopiada(true);
      toast.success('Contraseña copiada');
    } catch {
      toast.error('No se pudo copiar. Selecciónala y cópiala a mano.');
    }
  };

  return (
    <div className="grid gap-3 rounded-card border border-success-solid/40 bg-success-soft p-4 text-success-soft-foreground" role="status">
      <p className="flex items-center gap-2 text-sm font-semibold">
        <KeyRound size={16} aria-hidden="true" />{titulo}{nombre ? ` de ${nombre}` : ''}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <code className="min-w-0 select-all rounded-control border border-border bg-card px-3 py-2 font-mono text-lg tracking-wide text-foreground [overflow-wrap:anywhere]">{password}</code>
        <button
          type="button"
          onClick={copiar}
          className="inline-flex min-h-10 items-center gap-2 rounded-control border border-input bg-card px-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
        >
          {copiada ? <Check size={16} aria-hidden="true" /> : <Copy size={16} aria-hidden="true" />}
          {copiada ? 'Copiada' : 'Copiar'}
        </button>
      </div>
      <p className="text-[13px]">Solo se muestra ahora. Compártela por un canal seguro; la persona puede cambiarla desde Mi perfil.</p>
    </div>
  );
};

export default ContrasenaTemporal;
