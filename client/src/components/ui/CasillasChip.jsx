import { Check } from 'lucide-react';
import { ETIQUETA_CLS } from './estilos';

// Selección múltiple con aspecto de chips (casillas reales, ocultas a la vista; el foco se
// marca en el chip). `opciones` = textos; `seleccion` = los marcados.
const CasillasChip = ({ etiqueta, ayuda, opciones, seleccion, onAlternar }) => (
  <fieldset>
    <legend className={ETIQUETA_CLS}>
      {etiqueta}
      {seleccion.length > 0 && <span className="font-normal text-muted-foreground"> · {seleccion.length} {seleccion.length === 1 ? 'elegido' : 'elegidos'}</span>}
    </legend>
    {ayuda && <p className="-mt-1 mb-2 text-xs text-muted-foreground">{ayuda}</p>}
    <div className="flex flex-wrap gap-2">
      {opciones.map((opcion) => {
        const activo = seleccion.includes(opcion);
        return (
          <label
            key={opcion}
            className={`inline-flex min-h-9 cursor-pointer select-none items-center gap-2 rounded-control border px-3 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
              activo ? 'border-primary bg-info-soft font-medium text-foreground' : 'border-input text-muted-foreground hover:bg-muted'
            }`}
          >
            <input type="checkbox" checked={activo} onChange={() => onAlternar(opcion)} className="sr-only" />
            <span className={`grid size-4 shrink-0 place-items-center rounded-[4px] border ${activo ? 'border-primary bg-primary text-primary-foreground' : 'border-input'}`} aria-hidden="true">
              {activo && <Check size={11} strokeWidth={3} />}
            </span>
            {opcion}
          </label>
        );
      })}
    </div>
  </fieldset>
);

export default CasillasChip;
