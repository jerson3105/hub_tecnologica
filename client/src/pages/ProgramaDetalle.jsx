import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Rocket, CalendarDays, Calendar, Repeat, ChevronRight, FolderKanban } from 'lucide-react';
import { usePrograma } from '../hooks/useQueryHooks';

const ProgramaDetalle = () => {
  const { id } = useParams();
  const { data: programa, isLoading: cargando } = usePrograma(id);

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  if (!programa) {
    return <div className="text-center py-12 text-gray-500">Programa no encontrado</div>;
  }

  const estadoConfig = {
    en_curso: { label: 'En Curso', bg: 'bg-brand-green/15 text-brand-green', dot: 'bg-brand-green' },
    finalizado: { label: 'Finalizado', bg: 'bg-gray-100 text-gray-600', dot: 'bg-gray-400' },
    planificado: { label: 'Planificado', bg: 'bg-brand-cyan/15 text-brand-dark', dot: 'bg-brand-cyan' }
  };
  const estado = estadoConfig[programa.estado] || estadoConfig.planificado;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark to-brand-purple rounded-2xl opacity-95"></div>
        <div className="relative px-6 py-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/programas" className="text-white/50 hover:text-white transition-colors"><ArrowLeft size={22} /></Link>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-white/15 text-white`}>
              <span className={`w-1.5 h-1.5 rounded-full ${estado.dot}`}></span>
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
            <Calendar size={18} className="text-brand-cyan" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Fecha Inicio</p>
            <p className="font-bold text-brand-dark">{new Date(programa.fecha_inicio).toLocaleDateString('es-ES')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-brand-purple/10 rounded-lg">
            <Calendar size={18} className="text-brand-purple" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Fecha Fin</p>
            <p className="font-bold text-brand-dark">{new Date(programa.fecha_fin).toLocaleDateString('es-ES')}</p>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm flex items-center gap-3">
          <div className="p-2 bg-brand-green/10 rounded-lg">
            <Repeat size={18} className="text-brand-green" />
          </div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Frecuencia</p>
            <p className="font-bold text-brand-dark capitalize">{programa.frecuencia_seguimiento}</p>
          </div>
        </div>
      </div>

      {/* Emprendimientos */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-green/10 rounded-lg"><Rocket size={18} className="text-brand-green" /></div>
          <h2 className="text-lg font-semibold text-brand-dark">Emprendimientos</h2>
          <span className="ml-1 text-sm text-gray-400">({programa.emprendimientos?.length || 0})</span>
        </div>
        {programa.emprendimientos?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {programa.emprendimientos.map((emp) => (
              <Link key={emp.id} to={`/emprendimientos/${emp.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-brand-cyan/5 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-sm">
                    {emp.nombre?.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-brand-dark group-hover:text-brand-cyan transition-colors">{emp.nombre}</p>
                    {emp.sector && <p className="text-xs text-gray-400">{emp.sector}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                    emp.estado === 'activo' ? 'bg-brand-green/15 text-brand-green' :
                    emp.estado === 'graduado' ? 'bg-brand-cyan/15 text-brand-cyan' :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {emp.estado}
                  </span>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-cyan transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Rocket size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">No hay emprendimientos asignados</p>
          </div>
        )}
      </div>

      {/* Sesiones */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
          <div className="p-1.5 bg-brand-purple/10 rounded-lg"><CalendarDays size={18} className="text-brand-purple" /></div>
          <h2 className="text-lg font-semibold text-brand-dark">Sesiones</h2>
          <span className="ml-1 text-sm text-gray-400">({programa.sesiones?.length || 0})</span>
        </div>
        {programa.sesiones?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {programa.sesiones.map((ses) => (
              <Link key={ses.id} to={`/sesiones/${ses.id}`} className="flex items-center justify-between px-5 py-3.5 hover:bg-brand-cyan/5 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    ses.tipo === 'taller' ? 'bg-brand-purple/10' : 'bg-brand-cyan/10'
                  }`}>
                    <CalendarDays size={16} className={ses.tipo === 'taller' ? 'text-brand-purple' : 'text-brand-cyan'} />
                  </div>
                  <div>
                    <p className="font-medium text-brand-dark group-hover:text-brand-cyan transition-colors">{ses.titulo}</p>
                    <p className="text-xs text-gray-400">{new Date(ses.fecha).toLocaleDateString('es-ES')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${
                    ses.tipo === 'taller' ? 'bg-brand-purple/15 text-brand-purple' : 'bg-brand-cyan/15 text-brand-dark'
                  }`}>
                    {ses.tipo}
                  </span>
                  <ChevronRight size={16} className="text-gray-300 group-hover:text-brand-cyan transition-colors" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <CalendarDays size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">No hay sesiones registradas</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProgramaDetalle;
