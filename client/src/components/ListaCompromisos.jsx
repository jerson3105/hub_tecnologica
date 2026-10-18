import BadgeDe from './ui/BadgeDe';
import { ESTADOS_ACTIVIDAD } from '../constants/estados';

// Compromisos de un seguimiento: los de la tabla `compromisos` (compromisoItems) con su estado.
// Si no hay ninguno y el seguimiento es antiguo, muestra el campo de texto `compromisos`.
const ListaCompromisos = ({ seguimiento }) => {
  const items = seguimiento?.compromisoItems || [];

  if (items.length === 0) {
    if (!seguimiento?.compromisos) return null;
    return (
      <div className="mb-2">
        <p className="eyebrow">Compromisos</p>
        <p className="text-sm text-foreground mt-0.5 whitespace-pre-line">{seguimiento.compromisos}</p>
      </div>
    );
  }

  return (
    <div className="mb-2">
      <p className="eyebrow">Compromisos ({items.length})</p>
      <ul className="mt-1 space-y-1.5">
        {items.map(c => (
          <li key={c.id} className="flex items-start justify-between gap-3 text-sm text-foreground">
            <span className="min-w-0">{c.descripcion}</span>
            <BadgeDe mapa={ESTADOS_ACTIVIDAD} valor={c.estado} forma="tag" className="shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ListaCompromisos;
