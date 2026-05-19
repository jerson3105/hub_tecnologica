import { Link } from 'react-router-dom';
import { FolderKanban, Rocket, Users, CalendarDays, Star, AlertCircle, FileText, Video, TrendingUp, BarChart3, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useProgramas, useEmprendimientos, useSesiones, useUsuarios, useNpsPromedios, useNpsResumen } from '../hooks/useQueryHooks';

const Dashboard = () => {
  const { data: programas = [], isLoading: l1 } = useProgramas();
  const { data: emprendimientos = [], isLoading: l2 } = useEmprendimientos();
  const { data: sesiones = [], isLoading: l3 } = useSesiones();
  const { data: usuarios = [], isLoading: l4 } = useUsuarios();
  const { data: npsPromedios = {} } = useNpsPromedios();
  const { data: npsResumen = [] } = useNpsResumen();

  const cargando = l1 || l2 || l3 || l4;
  const sesionesRecientes = sesiones.slice(0, 5);
  const stats = { programas: programas.length, emprendimientos: emprendimientos.length, sesiones: sesiones.length, usuarios: usuarios.length };

  if (cargando) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div>
      </div>
    );
  }

  const cards = [
    { label: 'Programas', value: stats.programas, icon: FolderKanban, bg: 'bg-brand-cyan/10', iconBg: 'bg-brand-cyan', link: '/programas' },
    { label: 'Emprendimientos', value: stats.emprendimientos, icon: Rocket, bg: 'bg-brand-green/10', iconBg: 'bg-brand-green', link: '/emprendimientos' },
    { label: 'Sesiones', value: stats.sesiones, icon: CalendarDays, bg: 'bg-brand-purple/10', iconBg: 'bg-brand-purple', link: '/sesiones' },
    { label: 'Usuarios', value: stats.usuarios, icon: Users, bg: 'bg-brand-dark/5', iconBg: 'bg-brand-dark', link: '/usuarios' },
  ];

  // NPS global average
  const allNps = Object.values(npsPromedios);
  const npsGlobalPromedio = allNps.length > 0
    ? (allNps.reduce((s, n) => s + n.promedio * n.total, 0) / allNps.reduce((s, n) => s + n.total, 0))
    : 0;
  const npsGlobalTotal = allNps.reduce((s, n) => s + n.total, 0);

  return (
    <div className="space-y-6">
      {/* Header with gradient accent */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark to-brand-purple rounded-2xl opacity-95"></div>
        <div className="relative px-6 py-6 rounded-2xl">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-brand-cyan/80 mt-1">Resumen general del sistema</p>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.label} to={card.link} className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:border-brand-cyan/30 transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{card.label}</p>
                <p className="text-3xl font-bold text-brand-dark mt-1">{card.value}</p>
              </div>
              <div className={`${card.iconBg} p-3 rounded-xl shadow-sm`}>
                <card.icon size={22} className="text-white" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-brand-cyan font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Ver detalle <ArrowUpRight size={12} className="ml-1" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sesiones recientes con NPS */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
              <div className="p-1.5 bg-brand-purple/10 rounded-lg"><CalendarDays size={18} className="text-brand-purple" /></div>
              Sesiones Recientes
            </h2>
            <Link to="/sesiones" className="text-xs text-brand-cyan hover:text-brand-dark font-medium flex items-center gap-0.5">
              Ver todas <ChevronRight size={14} />
            </Link>
          </div>
          {sesionesRecientes.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No hay sesiones registradas</p>
          ) : (
            <div className="space-y-2">
              {sesionesRecientes.map((ses) => (
                <div key={ses.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                  <div className="min-w-0 flex-1">
                    <Link to={`/sesiones/${ses.id}`} className="font-medium text-gray-800 text-sm hover:text-brand-cyan truncate block">{ses.titulo}</Link>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        ses.tipo === 'taller' ? 'bg-brand-purple/10 text-brand-purple' : 'bg-brand-cyan/10 text-brand-dark'
                      }`}>{ses.tipo === 'taller' ? 'Taller' : 'Seguimiento'}</span>
                      <span className="text-xs text-gray-400">{new Date(ses.fecha).toLocaleDateString('es-ES')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-3">
                    {ses.enlace_grabacion && <Video size={14} className="text-brand-cyan" />}
                    {npsPromedios[ses.id] ? (
                      <Link to={`/sesiones/${ses.id}/nps`} className="flex items-center gap-1 text-amber-500 hover:text-amber-600">
                        <Star size={14} fill="currentColor" />
                        <span className="text-sm font-bold">{npsPromedios[ses.id].promedio}</span>
                      </Link>
                    ) : (
                      <span className="text-[10px] text-gray-300 bg-gray-50 px-2 py-0.5 rounded-full">Sin NPS</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* NPS por programa */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
              <div className="p-1.5 bg-brand-green/10 rounded-lg"><BarChart3 size={18} className="text-brand-green" /></div>
              NPS por Programa
            </h2>
          </div>
          {npsGlobalTotal > 0 && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-brand-dark to-brand-purple rounded-xl mb-4">
              <div className="p-2 bg-white/15 rounded-lg">
                <Star size={24} className="text-amber-300" fill="currentColor" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Math.round(npsGlobalPromedio * 10) / 10}<span className="text-sm font-normal text-white/60 ml-1">/10</span></p>
                <p className="text-xs text-white/60">Promedio global · {npsGlobalTotal} evaluaciones</p>
              </div>
            </div>
          )}
          {npsResumen.length === 0 ? (
            <p className="text-gray-400 text-center py-6">No hay evaluaciones NPS aún</p>
          ) : (
            <div className="space-y-3">
              {npsResumen.map((item) => (
                <div key={item.programa_id} className="p-3 rounded-lg border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-brand-dark">{item.programa_nombre}</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                        item.nps_score >= 50 ? 'bg-brand-green/15 text-brand-green' :
                        item.nps_score >= 0 ? 'bg-amber-100 text-amber-700' :
                        'bg-red-100 text-red-700'
                      }`}>NPS: {item.nps_score}</span>
                      <span className="text-[10px] text-gray-400">{item.total_respuestas} resp.</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-500 ${
                        item.nps_score >= 50 ? 'bg-brand-green' :
                        item.nps_score >= 0 ? 'bg-amber-400' :
                        'bg-red-400'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, (item.nps_score + 100) / 2))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Programas */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
            <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><FolderKanban size={18} className="text-brand-cyan" /></div>
            Programas
          </h2>
          <Link to="/programas" className="text-xs text-brand-cyan hover:text-brand-dark font-medium flex items-center gap-0.5">
            Ver todos <ChevronRight size={14} />
          </Link>
        </div>
        {programas.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <AlertCircle size={40} className="mx-auto mb-2 text-gray-200" />
            <p>No hay programas registrados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-3 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Nombre</th>
                  <th className="text-left py-3 px-3 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Estado</th>
                  <th className="text-left py-3 px-3 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Emprendimientos</th>
                  <th className="text-left py-3 px-3 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Frecuencia</th>
                </tr>
              </thead>
              <tbody>
                {programas.map((prog) => (
                  <tr key={prog.id} className="border-b border-gray-50 hover:bg-brand-cyan/5 transition-colors">
                    <td className="py-3.5 px-3 font-medium">
                      <Link to={`/programas/${prog.id}`} className="text-brand-dark hover:text-brand-cyan transition-colors">{prog.nombre}</Link>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        prog.estado === 'en_curso' ? 'bg-brand-green/15 text-brand-green' :
                        prog.estado === 'finalizado' ? 'bg-gray-100 text-gray-600' :
                        'bg-brand-cyan/10 text-brand-dark'
                      }`}>
                        {prog.estado === 'en_curso' ? 'En Curso' : prog.estado === 'finalizado' ? 'Finalizado' : 'Planificado'}
                      </span>
                    </td>
                    <td className="py-3.5 px-3">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-green/10 text-brand-green text-xs font-bold">{prog.emprendimientos?.length || 0}</span>
                    </td>
                    <td className="py-3.5 px-3 text-gray-500 capitalize">{prog.frecuencia_seguimiento}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
