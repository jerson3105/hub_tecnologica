import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { Plus, Pencil, ClipboardList, ChevronRight, FolderKanban } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useProgramaResumen, useInvalidate } from '../hooks/useQueryHooks';
import TarjetaKpi from '../components/inicio/TarjetaKpi';
import TablaCartera from '../components/inicio/TablaCartera';
import PulsoInicio from '../components/inicio/PulsoInicio';
import SesionesPrograma from '../components/programas/SesionesPrograma';
import ProgramaFormModal from '../components/programas/ProgramaFormModal';
import Pestanas from '../components/ui/Pestanas';
import Trazo from '../components/ui/Trazo';
import ErrorCarga from '../components/ui/ErrorCarga';
import Skeleton from '../components/ui/Skeleton';
import {
  TARJETA_CLS, CHIP_CLS, FONDO_TONO, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS
} from '../components/ui/estilosSemanticos';
import { rangoFechas, textoPeriodo, estadoPrograma, estadoSugerido, cuandoEs } from '../utils/programas';

const PESTANAS = ['emprendimientos', 'sesiones', 'indicadores'];
const plural = (n, uno, varios) => (n === 1 ? uno : varios);

const indicadoresDe = ({ kpis, proximaSesion }, hoy) => [
  {
    titulo: 'Emprendimientos activos',
    valor: kpis.emprendimientosActivos,
    nota: kpis.emprendimientosGraduados > 0 ? `${kpis.emprendimientosGraduados} ${plural(kpis.emprendimientosGraduados, 'graduado', 'graduados')}` : null
  },
  {
    titulo: 'Sesiones realizadas',
    valor: kpis.sesionesRealizadas,
    nota: `de ${kpis.sesionesTotales}${proximaSesion ? ` · próxima ${cuandoEs(proximaSesion.fecha, hoy).toLowerCase()}` : ''}`
  },
  {
    titulo: 'Registros pendientes',
    valor: kpis.registrosPendientes,
    nota: kpis.registrosPendientes > 0 ? 'De sesiones ya realizadas' : 'Todo registrado',
    tonoNota: kpis.registrosPendientes > 0 ? 'warning' : 'success'
  },
  {
    titulo: 'Compromisos vencidos',
    valor: kpis.compromisosVencidos,
    nota: kpis.compromisosVencidos > 0
      ? `En ${kpis.emprendimientosConVencidos} ${plural(kpis.emprendimientosConVencidos, 'emprendimiento', 'emprendimientos')}`
      : 'Ninguno vencido',
    tonoNota: kpis.compromisosVencidos > 0 ? 'danger' : 'success'
  }
];

const Esqueleto = () => (
  <div className="grid gap-4 lg:gap-6" role="status" aria-label="Cargando el programa">
    <div className="grid gap-3">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="h-1.5 w-full max-w-xl" />
    </div>
    <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
      {[0, 1, 2, 3].map((i) => <div key={i} className={`${TARJETA_CLS} h-28 p-5`}><Skeleton className="h-full" /></div>)}
    </div>
    <div className={`${TARJETA_CLS} grid gap-3 p-5`}>{[0, 1, 2].map((i) => <Skeleton key={i} className="h-10" />)}</div>
  </div>
);

const ProgramaDetalle = () => {
  const { id } = useParams();
  const { data, isLoading, isError, error, refetch } = useProgramaResumen(id);
  const invalidate = useInvalidate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [editando, setEditando] = useState(false);
  const tab = PESTANAS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'emprendimientos';
  const cambiarTab = (nueva) => setSearchParams(nueva === 'emprendimientos' ? {} : { tab: nueva }, { replace: true });

  const refrescar = () => invalidate('programas', 'programa', 'inicio');

  if (isLoading) return <div className="mx-auto max-w-page"><Esqueleto /></div>;

  if (isError && !data) {
    const noExiste = error?.response?.status === 404;
    return (
      <div className={`${TARJETA_CLS} mx-auto grid max-w-page justify-items-center gap-3 px-5 py-12 text-center`}>
        {noExiste ? (
          <>
            <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><FolderKanban size={24} aria-hidden="true" /></span>
            <p className="font-semibold">Programa no encontrado</p>
            <Link to="/programas" className={BOTON_SECUNDARIO_CLS}>Volver a Programas</Link>
          </>
        ) : (
          <ErrorCarga mensaje="No se pudo cargar el programa." onReintentar={refetch} />
        )}
      </div>
    );
  }

  const { programa, periodo, cartera, sesiones, pulso, hoy } = data;
  const estado = estadoPrograma(programa.estado);
  const sugerencia = estadoSugerido({ ...programa, periodo });
  const nuevaSesion = (
    <Link to={`/sesiones?nueva=1&programa=${programa.id}`} className={BOTON_PRIMARIO_CLS}>
      <Plus size={16} aria-hidden="true" />Nueva sesión
    </Link>
  );

  const corregirEstado = async () => {
    try {
      await api.put(`/programas/${programa.id}`, { estado: sugerencia.estado });
      toast.success(sugerencia.estado === 'en_curso' ? 'Programa marcado en curso' : 'Programa marcado como finalizado');
      refrescar();
    } catch {
      toast.error('No se pudo actualizar el estado');
    }
  };

  return (
    <div className="@container mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <nav aria-label="Ruta" className="animate-enter text-sm">
        <ol className="flex items-center gap-1.5 text-muted-foreground">
          <li><Link to="/programas" className="rounded-chip hover:text-link hover:underline">Programas</Link></li>
          <li aria-hidden="true"><ChevronRight size={14} /></li>
          <li aria-current="page" className="truncate font-medium text-foreground">{programa.nombre}</li>
        </ol>
      </nav>

      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div className="grid min-w-0 max-w-2xl flex-1 gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`${CHIP_CLS} ${FONDO_TONO[estado.tono]}`}>{estado.label}</span>
            {programa.activo === false && <span className={`${CHIP_CLS} ${FONDO_TONO.neutral}`}>Desactivado</span>}
          </div>
          <h1 className="font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{programa.nombre}</h1>
          {programa.descripcion && <p className="text-muted-foreground">{programa.descripcion}</p>}
          {periodo && (
            <div className="mt-1 grid max-w-xl gap-1.5">
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="font-medium">{textoPeriodo(periodo)}</span>
                <span className="tabular-nums text-muted-foreground">{periodo.porcentaje} %</span>
              </div>
              <Trazo valor={periodo.porcentaje} completo={periodo.fase === 'terminado'} retraso={0.3} />
              <p className="text-[13px] text-muted-foreground">
                {rangoFechas(programa.fecha_inicio, programa.fecha_fin)} · seguimiento {programa.frecuencia_seguimiento}
              </p>
            </div>
          )}
        </div>
        <div className="flex w-full flex-wrap gap-3 sm:w-auto">
          <button type="button" onClick={() => setEditando(true)} className={BOTON_SECUNDARIO_CLS}>
            <Pencil size={16} aria-hidden="true" />Editar
          </button>
          <Link to={`/seguimientos?programa=${programa.id}`} className={BOTON_SECUNDARIO_CLS}>
            <ClipboardList size={16} aria-hidden="true" />Seguimiento
          </Link>
          {nuevaSesion}
        </div>
      </header>

      {sugerencia && (
        <div className="animate-enter flex flex-wrap items-center justify-between gap-2 rounded-card border border-border bg-info-soft px-4 py-2.5 text-sm">
          <span className="text-info-soft-foreground">
            Está marcado como «{estado.label.toLowerCase()}». {sugerencia.texto}
          </span>
          <button type="button" onClick={corregirEstado} className="min-h-9 rounded-control px-2 font-semibold text-link hover:bg-card/60">
            {sugerencia.accion}
          </button>
        </div>
      )}

      <dl className="grid grid-cols-2 gap-3 sm:gap-4 @3xl:grid-cols-4">
        {indicadoresDe(data, hoy).map((k, i) => <TarjetaKpi key={k.titulo} {...k} indice={i} />)}
      </dl>

      <div className="grid gap-4">
        <Pestanas
          idBase="programa"
          etiqueta="Secciones del programa"
          activa={tab}
          onCambiar={cambiarTab}
          pestanas={[
            { id: 'emprendimientos', label: 'Emprendimientos', contador: cartera.length },
            { id: 'sesiones', label: 'Sesiones', contador: sesiones.length },
            { id: 'indicadores', label: 'Indicadores' }
          ]}
        />
        <div role="tabpanel" id={`programa-panel-${tab}`} aria-labelledby={`programa-tab-${tab}`} tabIndex={0} className="rounded-card">
          {tab === 'emprendimientos' && (
            <TablaCartera cartera={cartera} titulo="Cartera del programa" vacio="Este programa aún no tiene emprendimientos activos." />
          )}
          {tab === 'sesiones' && <SesionesPrograma sesiones={sesiones} programaId={programa.id} nuevaSesion={nuevaSesion} />}
          {tab === 'indicadores' && <PulsoInicio pulso={pulso} titulo="Indicadores del programa" periodo="en este programa" />}
        </div>
      </div>

      {editando && <ProgramaFormModal programa={programa} onClose={() => setEditando(false)} onGuardado={refrescar} />}
    </div>
  );
};

export default ProgramaDetalle;
