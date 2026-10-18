import { Link } from 'react-router-dom';
import { FolderKanban, Rocket, Users, CalendarDays, Star, AlertCircle, Video, BarChart3, ArrowUpRight, ChevronRight } from 'lucide-react';
import { useProgramas, useEmprendimientos, useSesiones, useUsuarios, useNpsPromedios, useNpsResumen } from '../hooks/useQueryHooks';
import { formatFecha } from '../utils/fechas';
import { tipoSesion } from '../constants/sesiones';
import { ESTADOS_PROGRAMA, estadoDe } from '../constants/estados';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';

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
      <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando">
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
                <card.icon size={22} className="text-white" aria-hidden="true" />
              </div>
            </div>
            <div className="mt-3 flex items-center text-xs text-brand-cyan-ink font-medium opacity-0 group-hover:opacity-100 transition-opacity">
              Ver detalle <ArrowUpRight size={12} className="ml-1" aria-hidden="true" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sesiones recientes con NPS */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3 mb-4">
            <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
              <div className="p-1.5 bg-brand-purple/10 rounded-lg"><CalendarDays size={18} className="text-brand-purple" aria-hidden="true" /></div>
              Sesiones Recientes
            </h2>
            <Link to="/sesiones" className="text-xs text-brand-cyan-ink hover:text-brand-dark font-medium flex items-center gap-0.5 shrink-0">
              Ver todas <ChevronRight size={14} aria-hidden="true" />
            </Link>
          </div>
          {sesionesRecientes.length === 0 ? (
            <EmptyState icono={CalendarDays} tono="purple" compacto sinMarco titulo="No hay sesiones registradas" />
          ) : (
            <div className="space-y-2">
              {sesionesRecientes.map((ses) => {
                const tipo = tipoSesion(ses.tipo);
                return (
                  <div key={ses.id} className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                    <div className="min-w-0 flex-1">
                      <Link to={`/sesiones/${ses.id}`} className="font-medium text-gray-800 text-sm hover:text-brand-cyan-ink truncate block">{ses.titulo}</Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge tono={tipo.tono} className="whitespace-nowrap">{tipo.label}</Badge>
                        <span className="text-xs text-gray-500">{formatFecha(ses.fecha)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      {ses.enlace_grabacion && <Video size={14} className="text-brand-cyan-ink" role="img" aria-label="Con grabación" />}
                      {npsPromedios[ses.id] ? (
                        <Link to={`/sesiones/${ses.id}/nps`} className="flex items-center gap-1 text-amber-700 hover:text-amber-800" aria-label={`NPS ${npsPromedios[ses.id].promedio} de ${ses.titulo}`}>
                          <Star size={14} fill="currentColor" className="text-amber-500" aria-hidden="true" />
                          <span className="text-sm font-bold">{npsPromedios[ses.id].promedio}</span>
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full whitespace-nowrap">Sin NPS</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* NPS por programa */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-brand-dark flex items-center gap-2">
              <div className="p-1.5 bg-brand-green/10 rounded-lg"><BarChart3 size={18} className="text-brand-green-ink" aria-hidden="true" /></div>
              NPS por Programa
            </h2>
          </div>
          {npsGlobalTotal > 0 && (
            <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-brand-dark to-brand-purple rounded-xl mb-4">
              <div className="p-2 bg-white/15 rounded-lg">
                <Star size={24} className="text-amber-300" fill="currentColor" aria-hidden="true" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{Math.round(npsGlobalPromedio * 10) / 10}<span className="text-sm font-normal text-white/60 ml-1">/10</span></p>
                <p className="text-xs text-white/60">Promedio global · {npsGlobalTotal} evaluaciones</p>
              </div>
            </div>
          )}
          {npsResumen.length === 0 ? (
            <EmptyState icono={BarChart3} tono="green" compacto sinMarco titulo="No hay evaluaciones NPS aún" />
          ) : (
            <div className="space-y-3">
              {npsResumen.map((item) => (
                <div key={item.programa_id} className="p-3 rounded-lg border border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <span className="text-sm font-medium text-brand-dark">{item.programa_nombre}</span>
                    <div className="flex items-center gap-2">
                      <Badge tono={item.nps_score >= 50 ? 'green' : item.nps_score >= 0 ? 'amber' : 'red'}>NPS: {item.nps_score}</Badge>
                      <span className="text-xs text-gray-500">{item.total_respuestas} resp.</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2" aria-hidden="true">
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
            <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><FolderKanban size={18} className="text-brand-cyan-ink" aria-hidden="true" /></div>
            Programas
          </h2>
          <Link to="/programas" className="text-xs text-brand-cyan-ink hover:text-brand-dark font-medium flex items-center gap-0.5">
            Ver todos <ChevronRight size={14} aria-hidden="true" />
          </Link>
        </div>
        {programas.length === 0 ? (
          <EmptyState icono={AlertCircle} tono="neutral" compacto sinMarco titulo="No hay programas registrados" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Programas</caption>
              <thead>
                <tr className="border-b border-gray-100">
                  <th scope="col" className="eyebrow text-left py-3 px-3">Nombre</th>
                  <th scope="col" className="eyebrow text-left py-3 px-3">Estado</th>
                  <th scope="col" className="eyebrow text-left py-3 px-3 hidden md:table-cell">Emprendimientos</th>
                  <th scope="col" className="eyebrow text-left py-3 px-3 hidden md:table-cell">Frecuencia</th>
                </tr>
              </thead>
              <tbody>
                {programas.map((prog) => {
                  const estado = estadoDe(ESTADOS_PROGRAMA, prog.estado);
                  return (
                    <tr key={prog.id} className="border-b border-gray-50 hover:bg-brand-cyan/5 transition-colors">
                      <td className="py-3.5 px-3 font-medium">
                        <Link to={`/programas/${prog.id}`} className="text-brand-dark hover:text-brand-cyan-ink transition-colors">{prog.nombre}</Link>
                        {/* Resumen de las columnas ocultas en pantallas pequeñas */}
                        <p className="text-xs font-normal text-gray-500 mt-0.5 md:hidden">
                          {prog.emprendimientos?.length || 0} emprendimientos{prog.frecuencia_seguimiento ? ` · ${prog.frecuencia_seguimiento}` : ''}
                        </p>
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge tono={estado.tono} className="whitespace-nowrap">{estado.label}</Badge>
                      </td>
                      <td className="py-3.5 px-3 hidden md:table-cell">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-green/10 text-brand-green-ink text-xs font-bold">{prog.emprendimientos?.length || 0}</span>
                      </td>
                      <td className="py-3.5 px-3 text-gray-500 capitalize hidden md:table-cell">{prog.frecuencia_seguimiento}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
