import { useState } from 'react';
import { Plus, FolderOpen } from 'lucide-react';
import FilaMaterial from './FilaMaterial';
import EnlaceMaterialModal from './EnlaceMaterialModal';
import useEliminarMaterial from './useEliminarMaterial';
import Skeleton from '../ui/Skeleton';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, BOTON_SECUNDARIO_CLS } from '../ui/estilosSemanticos';

// Pestaña Materiales del emprendimiento: todo lo compartido con él, de cualquier sesión o sin
// sesión, del más reciente al más antiguo. El equipo técnico puede añadir y eliminar.
const MaterialesEmprendimiento = ({ emprendimientoId, archivos, esAdmin }) => {
  const eliminar = useEliminarMaterial();
  const [agregando, setAgregando] = useState(false);

  return (
    <section aria-labelledby="t-materiales" className={TARJETA_CLS}>
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="min-w-0">
          <h2 id="t-materiales" className={TITULO_BLOQUE_CLS}>Materiales</h2>
          <p className="mt-0.5 text-[13px] text-muted-foreground">Lo compartido con este emprendimiento, en sus sesiones o fuera de ellas.</p>
        </div>
        {esAdmin && (
          <button type="button" onClick={() => setAgregando(true)} className={BOTON_SECUNDARIO_CLS}>
            <Plus size={16} aria-hidden="true" />Agregar enlace
          </button>
        )}
      </div>
      {!archivos ? (
        <div className="grid gap-3 border-t border-border px-5 py-4" role="status" aria-label="Cargando materiales">
          {[0, 1].map((i) => <Skeleton key={i} className="h-10" />)}
        </div>
      ) : archivos.length === 0 ? (
        <div className="flex items-center gap-3 border-t border-border px-5 py-6">
          <span className="grid size-9 shrink-0 place-items-center rounded-control bg-muted text-muted-foreground"><FolderOpen size={18} aria-hidden="true" /></span>
          <p className="text-sm text-muted-foreground">Aún no hay materiales para este emprendimiento.</p>
        </div>
      ) : (
        <ul className="border-t border-border">
          {archivos.map((a) => <FilaMaterial key={a.id} archivo={a} conSesion onEliminar={esAdmin ? eliminar : undefined} />)}
        </ul>
      )}
      {agregando && <EnlaceMaterialModal emprendimientoInicial={emprendimientoId} onClose={() => setAgregando(false)} />}
    </section>
  );
};

export default MaterialesEmprendimiento;
