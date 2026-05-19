import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useInvalidate } from '../hooks/useQueryHooks';
import toast from 'react-hot-toast';
import {
  ClipboardList, ChevronRight, Target, Calendar, CheckCircle2, Circle, Clock, XCircle,
  Plus, Trash2, ExternalLink, Link2, FolderKanban, Rocket, Edit3, Save, X, AlertCircle,
  MessageSquare, Video, Users, FileSearch, BookOpen, Presentation, UserCheck
} from 'lucide-react';

const TAB_CLS = (active) => `px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${active ? 'bg-brand-dark text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`;

const ESTADO_ACT = {
  planeado: { label: 'Planeado', icon: Circle, color: 'text-gray-400 bg-gray-50', dot: 'bg-gray-300' },
  en_progreso: { label: 'En progreso', icon: Clock, color: 'text-amber-600 bg-amber-50', dot: 'bg-amber-400' },
  completado: { label: 'Completado', icon: CheckCircle2, color: 'text-green-600 bg-green-50', dot: 'bg-green-500' },
  no_logrado: { label: 'No logrado', icon: XCircle, color: 'text-red-500 bg-red-50', dot: 'bg-red-400' }
};

const TIPO_SESION_META = {
  diagnostica_1: { label: 'Diagnóstica 1', icon: FileSearch, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  diagnostica_2: { label: 'Diagnóstica 2', icon: FileSearch, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  diagnostica_final: { label: 'Diagnóstica Final', icon: FileSearch, color: 'bg-purple-100 text-purple-700 border-purple-200' },
  taller: { label: 'Taller', icon: Presentation, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  uno_a_uno_programa: { label: '1 a 1 Programa', icon: UserCheck, color: 'bg-cyan-100 text-cyan-700 border-cyan-200' },
  uno_a_uno_taller: { label: '1 a 1 Taller', icon: BookOpen, color: 'bg-green-100 text-green-700 border-green-200' },
  seguimiento: { label: 'Seguimiento', icon: ClipboardList, color: 'bg-gray-100 text-gray-600 border-gray-200' }
};

const INPUT_CLS = 'w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';

const MiSeguimiento = () => {
  const invalidate = useInvalidate();
  const [empId, setEmpId] = useState(null);
  const [empData, setEmpData] = useState(null);
  const [tab, setTab] = useState('timeline');

  // Obtener emprendimiento del usuario
  const { data: miEmpData, isLoading: loadingEmp } = useQuery({
    queryKey: ['mi-emprendimiento'],
    queryFn: () => api.get('/emprendimientos/mi-emprendimiento').then(r => r.data)
  });

  useEffect(() => {
    if (miEmpData?.emprendimientos?.length > 0) {
      setEmpId(miEmpData.emprendimientos[0].id);
      setEmpData(miEmpData.emprendimientos[0]);
    }
  }, [miEmpData]);

  // Timeline data
  const { data: timelineData } = useQuery({
    queryKey: ['timeline', empId],
    queryFn: () => api.get(`/compromisos/timeline/${empId}`).then(r => r.data.seguimientos),
    enabled: !!empId
  });

  // Compromisos pendientes
  const { data: pendientesData } = useQuery({
    queryKey: ['compromisos-pendientes', empId],
    queryFn: () => api.get(`/compromisos/pendientes/${empId}`).then(r => r.data.compromisos),
    enabled: !!empId
  });

  const timeline = timelineData || [];
  const pendientes = pendientesData || [];

  // Filter sessions by type (reverse to show newest first)
  const diagnosticas = useMemo(() => timeline.filter(s => ['diagnostica_1', 'diagnostica_2', 'diagnostica_final'].includes(s.sesion?.tipo)).reverse(), [timeline]);
  const talleres = useMemo(() => timeline.filter(s => s.sesion?.tipo === 'taller').reverse(), [timeline]);
  const unoAUnoPrograma = useMemo(() => timeline.filter(s => ['uno_a_uno_programa', 'seguimiento'].includes(s.sesion?.tipo)).reverse(), [timeline]);
  const unoAUnoTaller = useMemo(() => timeline.filter(s => s.sesion?.tipo === 'uno_a_uno_taller').reverse(), [timeline]);

  const counts = useMemo(() => ({
    diagnosticas: diagnosticas.length,
    talleres: talleres.length,
    programa: unoAUnoPrograma.length,
    taller11: unoAUnoTaller.length
  }), [diagnosticas, talleres, unoAUnoPrograma, unoAUnoTaller]);

  if (loadingEmp) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  if (!empId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Rocket size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No se encontró tu emprendimiento</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <div className="p-2 bg-brand-cyan/10 rounded-xl"><ClipboardList size={22} className="text-brand-cyan" /></div>
          Mi Seguimiento
        </h1>
        <p className="text-gray-400 mt-1 ml-12">Seguimiento de tu emprendimiento en el programa</p>
      </div>

      {/* Info del emprendimiento */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xl">
            {empData?.nombre?.charAt(0)}
          </div>
          <div>
            <h2 className="font-bold text-brand-dark text-lg">{empData?.nombre}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <FolderKanban size={14} className="text-brand-purple" />
              <span>{empData?.programa?.nombre}</span>
            </div>
          </div>
          {pendientes.length > 0 && (
            <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle size={14} className="text-amber-500" />
              <span className="text-xs font-medium text-amber-700">{pendientes.length} compromiso(s) pendiente(s)</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setTab('timeline')} className={TAB_CLS(tab === 'timeline')}>Timeline</button>
        <button onClick={() => setTab('diagnosticos')} className={TAB_CLS(tab === 'diagnosticos')}>
          Diagnósticos {counts.diagnosticas > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{counts.diagnosticas}</span>}
        </button>
        <button onClick={() => setTab('talleres')} className={TAB_CLS(tab === 'talleres')}>
          Talleres {counts.talleres > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{counts.talleres}</span>}
        </button>
        <button onClick={() => setTab('1a1_programa')} className={TAB_CLS(tab === '1a1_programa')}>
          1 a 1 Programa {counts.programa > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{counts.programa}</span>}
        </button>
        <button onClick={() => setTab('1a1_taller')} className={TAB_CLS(tab === '1a1_taller')}>
          1 a 1 Taller {counts.taller11 > 0 && <span className="ml-1 px-1.5 py-0.5 rounded-full bg-white/20 text-[10px]">{counts.taller11}</span>}
        </button>
      </div>

      {/* Tab Content */}
      {tab === 'timeline' && <TimelineTab timeline={timeline} pendientes={pendientes} />}
      {tab === 'diagnosticos' && <SesionesReadOnlyTab sesiones={diagnosticas} tipo="diagnostico" />}
      {tab === 'talleres' && <SesionesReadOnlyTab sesiones={talleres} tipo="taller" />}
      {tab === '1a1_programa' && <SesionesReadOnlyTab sesiones={unoAUnoPrograma} tipo="programa" />}
      {tab === '1a1_taller' && <SesionesReadOnlyTab sesiones={unoAUnoTaller} tipo="taller11" />}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: TIMELINE (read-only for emprendedor)
// ═══════════════════════════════════════════════════════════
const TimelineTab = ({ timeline, pendientes }) => {
  if (timeline.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No hay sesiones registradas</p>
        <p className="text-gray-400 text-sm mt-1">Las sesiones del programa aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Compromisos pendientes */}
      {pendientes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
          <h3 className="font-bold text-amber-800 text-sm flex items-center gap-2 mb-3">
            <AlertCircle size={16} /> Compromisos pendientes
          </h3>
          <div className="space-y-2">
            {pendientes.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-amber-100">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ESTADO_ACT[c.estado]?.dot}`}></span>
                <span className="text-sm text-gray-700 flex-1">{c.descripcion}</span>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${ESTADO_ACT[c.estado]?.color}`}>
                  {ESTADO_ACT[c.estado]?.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>
        <div className="space-y-6">
          {[...timeline].reverse().map((seg) => {
            const tipoMeta = TIPO_SESION_META[seg.sesion?.tipo] || TIPO_SESION_META.seguimiento;
            const TipoIcon = tipoMeta.icon;
            return (
              <div key={seg.id} className="relative pl-14">
                <div className="absolute left-4 top-5 w-5 h-5 rounded-full bg-white border-2 border-brand-cyan flex items-center justify-center z-10">
                  <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>
                </div>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                  <div className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 border ${tipoMeta.color}`}>
                        <TipoIcon size={10} /> {tipoMeta.label}
                      </span>
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar size={10} /> {seg.sesion?.fecha}
                      </span>
                    </div>
                    <h4 className="font-bold text-brand-dark">{seg.sesion?.titulo}</h4>
                    {seg.realizado && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Lo trabajado</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{seg.realizado}</p>
                      </div>
                    )}
                    {seg.observaciones && (
                      <div className="mt-2">
                        <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Observaciones</p>
                        <p className="text-sm text-gray-500 whitespace-pre-line">{seg.observaciones}</p>
                      </div>
                    )}
                    {seg.enlace_grabacion && (
                      <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm text-brand-cyan hover:underline">
                        <Video size={14} /> Ver grabación
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: SESIONES READ-ONLY (for emprendedor)
// ═══════════════════════════════════════════════════════════
const SesionesReadOnlyTab = ({ sesiones, tipo }) => {
  const configs = {
    diagnostico: { icon: FileSearch, color: 'bg-purple-50 border-purple-100', iconColor: 'text-purple-600', emptyLabel: 'sesiones diagnósticas' },
    taller: { icon: Presentation, color: 'bg-blue-50 border-blue-100', iconColor: 'text-blue-600', emptyLabel: 'talleres' },
    programa: { icon: UserCheck, color: 'bg-cyan-50 border-cyan-100', iconColor: 'text-cyan-600', emptyLabel: 'sesiones 1 a 1 de programa' },
    taller11: { icon: BookOpen, color: 'bg-green-50 border-green-100', iconColor: 'text-green-600', emptyLabel: 'sesiones 1 a 1 de taller' }
  };
  const cfg = configs[tipo] || configs.programa;
  const Icon = cfg.icon;

  if (sesiones.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <Icon size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No hay {cfg.emptyLabel}</p>
        <p className="text-gray-400 text-sm mt-1">Aparecerán aquí cuando se programen</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {sesiones.map((seg, idx) => (
        <div key={seg.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden`}>
          <div className={`px-5 py-3 border-b flex items-center gap-3 ${cfg.color}`}>
            <div className={`w-8 h-8 rounded-lg bg-white/80 flex items-center justify-center`}>
              <Icon size={16} className={cfg.iconColor} />
            </div>
            <div>
              <h4 className="font-bold text-brand-dark text-sm">{seg.sesion?.titulo}</h4>
              <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                <Calendar size={10} /> {seg.sesion?.fecha}
              </p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            {seg.realizado ? (
              <div>
                <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Lo trabajado</p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{seg.realizado}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">Sin información registrada aún</p>
            )}
            {seg.observaciones && (
              <div>
                <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Observaciones</p>
                <p className="text-sm text-gray-500 whitespace-pre-line">{seg.observaciones}</p>
              </div>
            )}
            {seg.enlace_grabacion && (
              <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-brand-cyan hover:underline">
                <Video size={14} /> Ver grabación
              </a>
            )}
            {/* Compromisos */}
            {seg.compromisoItems?.length > 0 && (
              <div className="border-t border-gray-100 pt-3">
                <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-2">Compromisos</p>
                <div className="space-y-1.5">
                  {seg.compromisoItems.map(c => (
                    <div key={c.id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ESTADO_ACT[c.estado]?.dot}`}></span>
                      <span className="text-sm text-gray-700 flex-1">{c.descripcion}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${ESTADO_ACT[c.estado]?.color}`}>
                        {ESTADO_ACT[c.estado]?.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MiSeguimiento;
