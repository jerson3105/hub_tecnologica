import { Link, useSearchParams } from 'react-router-dom';
import { Plus, ClipboardCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useInicio } from '../hooks/useQueryHooks';
import { fechaLarga, saludo, resumenDelDia, diasDeLaSemana, haceDias } from '../utils/inicio';
import TarjetaKpi from '../components/inicio/TarjetaKpi';
import BandejaAtencion from '../components/inicio/BandejaAtencion';
import AgendaSemana from '../components/inicio/AgendaSemana';
import TablaCartera from '../components/inicio/TablaCartera';
import PulsoInicio from '../components/inicio/PulsoInicio';
import ErrorCarga from '../components/ui/ErrorCarga';
import Skeleton from '../components/ui/Skeleton';
import { TARJETA_CLS, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS } from '../components/ui/estilosSemanticos';
import { FILTRO_CLS } from '../components/ui/estilos';

const plural = (n, uno, varios) => (n === 1 ? uno : varios);

// Indicadores accionables: cada nota dice dónde está el problema, no solo cuánto hay
const indicadoresDe = ({ kpis, atencion }) => {
  const registros = atencion.find((a) => a.tipo === 'registros');
  return [
    {
      titulo: 'Emprendimientos activos',
      valor: kpis.emprendimientosActivos,
      nota: kpis.nuevosMes > 0 ? `+${kpis.nuevosMes} este mes` : 'Sin altas este mes',
      tonoNota: kpis.nuevosMes > 0 ? 'success' : 'muted'
    },
    {
      titulo: 'Registros pendientes',
      valor: kpis.registrosPendientes,
      nota: registros ? `${registros.sesion?.titulo}, ${haceDias(registros.dias)}` : 'Todo registrado',
      tonoNota: registros ? 'warning' : 'success'
    },
    {
      titulo: 'Compromisos vencidos',
      valor: kpis.compromisosVencidos,
      nota: kpis.compromisosVencidos > 0
        ? `En ${kpis.emprendimientosConVencidos} ${plural(kpis.emprendimientosConVencidos, 'emprendimiento', 'emprendimientos')}`
        : 'Ninguno vencido',
      tonoNota: kpis.compromisosVencidos > 0 ? 'danger' : 'success'
    },
    {
      titulo: 'Sesiones esta semana',
      valor: kpis.sesionesSemana,
      nota: kpis.sesionesSemana > 0 ? diasDeLaSemana(kpis.fechasSemana) : 'Sin sesiones programadas',
      tonoNota: 'muted'
    }
  ];
};

const EsqueletoInicio = () => (
  <div className="grid grid-cols-1 gap-4 lg:gap-6" role="status" aria-label="Cargando el inicio">
    <div className="grid grid-cols-2 gap-3 sm:gap-4 @3xl:grid-cols-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className={`${TARJETA_CLS} grid gap-3 p-4 sm:p-5`}>
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-8 w-14" />
          <Skeleton className="h-3.5 w-1/2" />
        </div>
      ))}
    </div>
    <div className="grid grid-cols-1 items-start gap-4 @4xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
      {[5, 4].map((filas) => (
        <div key={filas} className={`${TARJETA_CLS} grid gap-4 p-5`}>
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: filas - 1 }, (_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="size-9 shrink-0" />
              <div className="grid flex-1 gap-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
    <div className={`${TARJETA_CLS} grid gap-4 p-5`}>
      <Skeleton className="h-6 w-32" />
      {[0, 1, 2].map((i) => <Skeleton key={i} className="h-9 w-full" />)}
    </div>
  </div>
);

const Inicio = () => {
  const { usuario } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const programaId = searchParams.get('programa') || '';
  const { data, isLoading, isError, isFetching, refetch } = useInicio(programaId);

  const cambiarPrograma = (valor) => {
    setSearchParams(valor ? { programa: valor } : {}, { replace: true });
  };

  const sesionHoy = data?.agenda.find((s) => s.fecha === data.hoy);
  const nombre = usuario?.nombre?.split(' ')[0] || '';

  // @container: las rejillas se adaptan al ancho real del contenido, con o sin sidebar
  return (
    <div className="@container mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <header className="animate-enter flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="eyebrow min-h-4">{data ? fechaLarga(data.hoy) : ''}</p>
          <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">
            {saludo()}{nombre ? `, ${nombre}` : ''}
          </h1>
          {data && (
            <p className="mt-1 text-muted-foreground">{resumenDelDia(data.atencion.length, data.kpis.sesionesSemana)}</p>
          )}
        </div>
        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <label className="flex w-full items-center gap-2 text-sm text-muted-foreground sm:w-auto">
            <span className="shrink-0">Programa</span>
            <select
              value={programaId}
              onChange={(e) => cambiarPrograma(e.target.value)}
              className={FILTRO_CLS}
              disabled={!data}
            >
              <option value="">Todos</option>
              {(data?.programas || []).map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </label>
          <Link to="/sesiones?nueva=1" className={sesionHoy ? BOTON_SECUNDARIO_CLS : BOTON_PRIMARIO_CLS}>
            <Plus size={16} aria-hidden="true" />Nueva sesión
          </Link>
          {sesionHoy && (
            <Link to={`/sesiones/${sesionHoy.id}`} className={BOTON_PRIMARIO_CLS}>
              <ClipboardCheck size={16} aria-hidden="true" />Abrir sesión de hoy
            </Link>
          )}
        </div>
      </header>

      {isLoading && <EsqueletoInicio />}

      {isError && !data && (
        <div className={TARJETA_CLS}>
          <ErrorCarga mensaje="No se pudo cargar el inicio." onReintentar={refetch} />
        </div>
      )}

      {data && (
        <div className={`grid grid-cols-1 gap-4 transition-opacity lg:gap-6 ${isFetching && !isLoading ? 'opacity-70' : ''}`} aria-busy={isFetching}>
          <dl className="grid grid-cols-2 gap-3 sm:gap-4 @3xl:grid-cols-4">
            {indicadoresDe(data).map((k, i) => <TarjetaKpi key={k.titulo} {...k} indice={i} />)}
          </dl>

          <div className="grid grid-cols-1 items-start gap-4 @4xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] lg:gap-6">
            <BandejaAtencion atencion={data.atencion} indice={4} />
            <AgendaSemana agenda={data.agenda} hoy={data.hoy} indice={5} />
          </div>

          <TablaCartera cartera={data.cartera} indice={6} />

          <PulsoInicio pulso={data.pulso} />
        </div>
      )}
    </div>
  );
};

export default Inicio;
