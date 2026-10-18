import { useState } from 'react';
import { Plus, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useProgramasResumen, useInvalidate } from '../hooks/useQueryHooks';
import TarjetaPrograma from '../components/programas/TarjetaPrograma';
import ProgramaFormModal from '../components/programas/ProgramaFormModal';
import ErrorCarga from '../components/ui/ErrorCarga';
import Skeleton from '../components/ui/Skeleton';
import { TARJETA_CLS, BOTON_PRIMARIO_CLS } from '../components/ui/estilosSemanticos';

// En curso primero, luego los que van a empezar y al final los terminados
const ORDEN_FASE = { en_curso: 0, por_empezar: 1, terminado: 2 };
const ordenar = (programas) => [...programas].sort((a, b) =>
  (ORDEN_FASE[a.periodo?.fase] ?? 3) - (ORDEN_FASE[b.periodo?.fase] ?? 3) || String(b.fecha_inicio).localeCompare(String(a.fecha_inicio)));

const REJILLA_CLS = 'grid grid-cols-[repeat(auto-fill,minmax(min(24rem,100%),1fr))] gap-4 lg:gap-6';

const Esqueleto = () => (
  <ul className={REJILLA_CLS} role="status" aria-label="Cargando programas">
    {[0, 1].map((i) => (
      <li key={i} className={`${TARJETA_CLS} grid gap-4 p-5`}>
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-1.5 w-full" />
        <div className="grid grid-cols-3 gap-3">{[0, 1, 2].map((j) => <Skeleton key={j} className="h-10" />)}</div>
        <Skeleton className="h-4 w-1/2" />
      </li>
    ))}
  </ul>
);

const Programas = () => {
  const { data, isLoading, isError, refetch } = useProgramasResumen();
  const invalidate = useInvalidate();
  const [formulario, setFormulario] = useState(null); // null cerrado · { programa } abierto
  const [verDesactivados, setVerDesactivados] = useState(false);

  const refrescar = () => invalidate('programas', 'programa', 'inicio');

  // «Eliminar» desactiva (activo = false) y se puede revertir
  const cambiarActivo = async (programa) => {
    const desactivar = programa.activo !== false;
    if (desactivar && !window.confirm(`¿Desactivar el programa «${programa.nombre}»? Podrás reactivarlo después.`)) return;
    try {
      if (desactivar) await api.delete(`/programas/${programa.id}`);
      else await api.put(`/programas/${programa.id}`, { activo: true });
      toast.success(desactivar ? 'Programa desactivado' : 'Programa reactivado');
      refrescar();
    } catch {
      toast.error('No se pudo actualizar el programa');
    }
  };

  const corregirEstado = async (programa, estado) => {
    try {
      await api.put(`/programas/${programa.id}`, { estado });
      toast.success(estado === 'en_curso' ? 'Programa marcado en curso' : 'Programa marcado como finalizado');
      refrescar();
    } catch {
      toast.error('No se pudo actualizar el estado');
    }
  };

  const programas = ordenar(data?.programas || []);
  const activos = programas.filter((p) => p.activo !== false);
  const desactivados = programas.filter((p) => p.activo === false);
  const visibles = verDesactivados ? desactivados : activos;
  const enCurso = activos.filter((p) => p.periodo?.fase === 'en_curso').length;
  const emprendimientos = activos.reduce((t, p) => t + p.kpis.emprendimientosActivos, 0);

  return (
    <div className="mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow">Gestión</p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Programas</h1>
          {data && (
            <p className="mt-1 text-muted-foreground">
              {enCurso === 1 ? '1 programa en curso' : `${enCurso} programas en curso`} · {emprendimientos === 1 ? '1 emprendimiento activo' : `${emprendimientos} emprendimientos activos`}
            </p>
          )}
        </div>
        <button type="button" onClick={() => setFormulario({ programa: null })} className={BOTON_PRIMARIO_CLS}>
          <Plus size={16} aria-hidden="true" />Nuevo programa
        </button>
      </header>

      {desactivados.length > 0 && (
        <div className="flex gap-1 rounded-control bg-muted p-1 sm:w-fit" role="group" aria-label="Mostrar programas">
          {[
            { valor: false, texto: `Activos (${activos.length})` },
            { valor: true, texto: `Desactivados (${desactivados.length})` }
          ].map((o) => (
            <button
              key={o.texto}
              type="button"
              aria-pressed={verDesactivados === o.valor}
              onClick={() => setVerDesactivados(o.valor)}
              className={`min-h-9 flex-1 rounded-[calc(var(--radius-control)-4px)] px-3 text-sm font-semibold transition-colors sm:flex-none ${
                verDesactivados === o.valor ? 'bg-card text-foreground elevation-1' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {o.texto}
            </button>
          ))}
        </div>
      )}

      {isLoading && <Esqueleto />}

      {isError && !data && (
        <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudieron cargar los programas." onReintentar={refetch} /></div>
      )}

      {data && visibles.length === 0 && (
        <div className={`${TARJETA_CLS} grid justify-items-center gap-3 px-5 py-12 text-center`}>
          <span className="grid size-12 place-items-center rounded-card bg-programa-soft text-programa-soft-foreground">
            <FolderKanban size={24} aria-hidden="true" />
          </span>
          <div>
            <p className="font-semibold">{verDesactivados ? 'No hay programas desactivados' : 'Aún no hay programas'}</p>
            {!verDesactivados && <p className="text-sm text-muted-foreground">Crea el primero para organizar emprendimientos y sesiones.</p>}
          </div>
          {!verDesactivados && (
            <button type="button" onClick={() => setFormulario({ programa: null })} className={BOTON_PRIMARIO_CLS}>
              <Plus size={16} aria-hidden="true" />Crear programa
            </button>
          )}
        </div>
      )}

      {data && visibles.length > 0 && (
        <ul className={REJILLA_CLS}>
          {visibles.map((programa, i) => (
            <TarjetaPrograma
              key={programa.id}
              programa={programa}
              hoy={data.hoy}
              indice={i}
              onEditar={(p) => setFormulario({ programa: p })}
              onCambiarActivo={cambiarActivo}
              onCorregirEstado={corregirEstado}
            />
          ))}
        </ul>
      )}

      {formulario && (
        <ProgramaFormModal programa={formulario.programa} onClose={() => setFormulario(null)} onGuardado={refrescar} />
      )}
    </div>
  );
};

export default Programas;
