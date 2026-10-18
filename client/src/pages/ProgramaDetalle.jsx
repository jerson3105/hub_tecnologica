import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Rocket, CalendarDays, Calendar, Repeat, ChevronRight, FolderKanban } from 'lucide-react';
import { usePrograma } from '../hooks/useQueryHooks';
import { formatFecha } from '../utils/fechas';
import { tipoSesion } from '../constants/sesiones';
import { ESTADOS_PROGRAMA, ESTADOS_EMPRENDIMIENTO, estadoDe } from '../constants/estados';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { PUNTOS_BADGE, clasesBoton } from '../components/ui/estilos';

const ProgramaDetalle = () => {
  const { id } = useParams();
  const { data: programa, isLoading: cargando } = usePrograma(id);

  if (cargando) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  if (!programa) {
    return (
      <EmptyState
        icono={FolderKanban}
        tono="neutral"
        titulo="Programa no encontrado"
        accion={<Link to="/programas" className={clasesBoton({ variante: 'secondary' })}>Volver a Programas</Link>}
      />
    );
  }

  const estado = estadoDe(ESTADOS_PROGRAMA, programa.estado, ESTADOS_PROGRAMA.planificado);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark to-brand-purple rounded-2xl opacity-95" aria-hidden="true"></div>
        <div className="relative px-6 py-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/programas" aria-label="Volver a Programas" title="Volver a Programas" className="inline-flex items-center justify-center min-w-10 min-h-10 -ml-2 rounded-xl text-white/50 hover:text-white transition-colors">
              <ArrowLeft size={22} aria-hidden="true" />
            </Link>
            {/* Sobre el fondo oscuro se mantiene la pastilla translúcida; el punto usa el color del estado */}
            <span className="px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-white/15 text-white">
              <span className={`w-1.5 h-1.5 rounded-full ${PUNTOS_BADGE[estado.tono] || PUNTOS_BADGE.neutral}`} aria-hidden="true"></span>
              {estado.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{programa.nombre}</h1>
          {programa.descripcion && <p className="text-white/60 mt-1">{programa.descripcion}</p>}
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-brand-cyan/10 rounded-lg">
            <Calendar size={18} className="text-brand-cyan-ink" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha Inicio</p>
            <p className="font-bold text-brand-dark">{formatFecha(programa.fecha_inicio)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-brand-purple/10 rounded-lg">
            <Calendar size={18} className="text-brand-purple" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha Fin</p>
            <p className="font-bold text-brand-dark">{formatFecha(programa.fecha_fin)}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-brand-green/10 rounded-lg">
            <Repeat size={18} className="text-brand-green-ink" aria-hidden="true" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Frecuencia</p>
            <p className="font-bold text-brand-dark capitalize">{programa.frecuencia_seguimiento}</p>
          </div>
        </div>
      </div>

      {/* Emprendimientos */}
      <section aria-labelledby="titulo-emprendimientos" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-green/10 rounded-lg"><Rocket size={18} className="text-brand-green-ink" aria-hidden="true" /></div>
          <h2 id="titulo-emprendimientos" className="text-lg font-semibold text-brand-dark">Emprendimientos</h2>
          <span className="ml-1 text-sm text-gray-500">({programa.emprendimientos?.length || 0})</span>
        </div>
        {programa.emprendimientos?.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {programa.emprendimientos.map((emp) => {
              const estadoEmp = estadoDe(ESTADOS_EMPRENDIMIENTO, emp.estado);
              return (
                <li key={emp.id}>
                  <Link to={`/emprendimientos/${emp.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-brand-cyan/5 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green-ink font-bold text-sm shrink-0" aria-hidden="true">
                        {emp.nombre?.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-brand-dark break-words group-hover:text-brand-cyan-ink transition-colors">{emp.nombre}</p>
                        {emp.sector && <p className="text-xs text-gray-500">{emp.sector}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tono={estadoEmp.tono}>{estadoEmp.label}</Badge>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-brand-cyan-ink transition-colors" aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icono={Rocket} tono="neutral" compacto titulo="No hay emprendimientos asignados" sinMarco />
        )}
      </section>

      {/* Sesiones */}
      <section aria-labelledby="titulo-sesiones" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-purple/10 rounded-lg"><CalendarDays size={18} className="text-brand-purple" aria-hidden="true" /></div>
          <h2 id="titulo-sesiones" className="text-lg font-semibold text-brand-dark">Sesiones</h2>
          <span className="ml-1 text-sm text-gray-500">({programa.sesiones?.length || 0})</span>
        </div>
        {programa.sesiones?.length > 0 ? (
          <ul className="divide-y divide-gray-50">
            {programa.sesiones.map((ses) => {
              const tipo = tipoSesion(ses.tipo);
              return (
                <li key={ses.id}>
                  <Link to={`/sesiones/${ses.id}`} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-brand-cyan/5 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        ses.tipo === 'taller' ? 'bg-brand-purple/10' : 'bg-brand-cyan/10'
                      }`} aria-hidden="true">
                        <CalendarDays size={16} className={ses.tipo === 'taller' ? 'text-brand-purple' : 'text-brand-cyan-ink'} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-brand-dark break-words group-hover:text-brand-cyan-ink transition-colors">{ses.titulo}</p>
                        <p className="text-xs text-gray-500">{formatFecha(ses.fecha)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge tono={tipo.tono} className="whitespace-nowrap">{tipo.label}</Badge>
                      <ChevronRight size={16} className="text-gray-400 group-hover:text-brand-cyan-ink transition-colors" aria-hidden="true" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icono={CalendarDays} tono="neutral" compacto titulo="No hay sesiones registradas" sinMarco />
        )}
      </section>
    </div>
  );
};

export default ProgramaDetalle;
