import { useLocation } from 'react-router-dom';
import { Monitor, Sun, Moon } from 'lucide-react';
import { useTema, soloClaro } from '../../tema';

const OPCIONES = [
  { valor: 'sistema', texto: 'Sistema', icono: Monitor },
  { valor: 'claro', texto: 'Claro', icono: Sun },
  { valor: 'oscuro', texto: 'Oscuro', icono: Moon }
];

// Tema Sistema / Claro / Oscuro como grupo de radios (hoja «Más» del móvil y menú de usuario)
const SelectorTema = ({ compacto = false }) => {
  const { tema, oscuro, cambiarTema } = useTema();
  const { pathname } = useLocation();
  return (
    <fieldset className="grid gap-2">
      <legend className={compacto ? 'mb-1.5 px-1 text-xs font-semibold text-muted-foreground' : 'mb-2 text-sm font-semibold'}>Tema</legend>
      <div className="flex gap-1 rounded-control bg-muted p-1">
        {OPCIONES.map((o) => {
          const Icono = o.icono;
          const activo = tema === o.valor;
          return (
            <label
              key={o.valor}
              className={`flex min-h-9 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-[calc(var(--radius-control)-4px)] px-2 text-[13px] font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                activo ? 'bg-card text-foreground elevation-1' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <input type="radio" name="tema" value={o.valor} checked={activo} onChange={() => cambiarTema(o.valor)} className="sr-only" />
              <Icono size={15} aria-hidden="true" />{o.texto}
            </label>
          );
        })}
      </div>
      {oscuro && soloClaro(pathname) && (
        <p className="px-1 text-xs text-muted-foreground">Esta página aún se ve en claro: tendrá modo oscuro cuando se rediseñe.</p>
      )}
    </fieldset>
  );
};

export default SelectorTema;
