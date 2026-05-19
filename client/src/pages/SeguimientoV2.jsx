import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useProgramas, useEmprendimientos, useInvalidate } from '../hooks/useQueryHooks';
import toast from 'react-hot-toast';
import {
  ClipboardList, ChevronRight, Target, Calendar, CheckCircle2, Circle, Clock, XCircle,
  Plus, Trash2, ExternalLink, Link2, FolderKanban, Rocket, Edit3, Save, X, AlertCircle,
  MessageSquare, Video, Users, FileSearch, BookOpen, Presentation, UserCheck
} from 'lucide-react';

const TAB_CLS = (active) => `px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${active ? 'bg-brand-dark text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`;

const TIPO_OBJ_LABELS = {
  ventas: 'Ventas',
  marketing: 'Marketing',
  producto_desarrollo: 'Producto / Desarrollo',
  financiero: 'Financiero',
  legal: 'Legal',
  talento_rrhh: 'Talento / RR.HH.'
};

const TIPO_OBJ_COLORS = {
  ventas: 'bg-green-100 text-green-700',
  marketing: 'bg-blue-100 text-blue-700',
  producto_desarrollo: 'bg-cyan-100 text-cyan-700',
  financiero: 'bg-amber-100 text-amber-700',
  legal: 'bg-purple-100 text-purple-700',
  talento_rrhh: 'bg-pink-100 text-pink-700'
};

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

const SeguimientoV2 = () => {
  const { data: programas = [] } = useProgramas();
  const [filtroPrograma, setFiltroPrograma] = useState('');
  const [filtroEmp, setFiltroEmp] = useState('');
  const [tab, setTab] = useState('timeline');
  const invalidate = useInvalidate();

  const empParams = filtroPrograma ? { programa_id: filtroPrograma } : {};
  const { data: emprendimientos = [] } = useEmprendimientos(empParams);

  const empSeleccionado = emprendimientos.find(e => String(e.id) === String(filtroEmp));

  // Timeline data (all seguimientos with sessions)
  const { data: timelineData } = useQuery({
    queryKey: ['timeline', filtroEmp],
    queryFn: () => api.get(`/compromisos/timeline/${filtroEmp}`).then(r => r.data.seguimientos),
    enabled: !!filtroEmp
  });

  // Objetivos OKR
  const { data: objetivosData } = useQuery({
    queryKey: ['objetivos', filtroEmp],
    queryFn: () => api.get(`/objetivos/emprendimiento/${filtroEmp}`).then(r => r.data.objetivos),
    enabled: !!filtroEmp
  });

  // Compromisos pendientes
  const { data: pendientesData } = useQuery({
    queryKey: ['compromisos-pendientes', filtroEmp],
    queryFn: () => api.get(`/compromisos/pendientes/${filtroEmp}`).then(r => r.data.compromisos),
    enabled: !!filtroEmp
  });

  const timeline = timelineData || [];
  const objetivos = objetivosData || [];
  const pendientes = pendientesData || [];

  // Filter sessions by type for each tab (reverse to show newest first)
  const diagnosticas = useMemo(() => timeline.filter(s => ['diagnostica_1', 'diagnostica_2', 'diagnostica_final'].includes(s.sesion?.tipo)).reverse(), [timeline]);
  const talleres = useMemo(() => timeline.filter(s => s.sesion?.tipo === 'taller').reverse(), [timeline]);
  const unoAUnoPrograma = useMemo(() => timeline.filter(s => ['uno_a_uno_programa', 'seguimiento'].includes(s.sesion?.tipo)).reverse(), [timeline]);
  const unoAUnoTaller = useMemo(() => timeline.filter(s => s.sesion?.tipo === 'uno_a_uno_taller').reverse(), [timeline]);

  // Count badges
  const counts = useMemo(() => ({
    diagnosticas: diagnosticas.length,
    talleres: talleres.length,
    programa: unoAUnoPrograma.length,
    taller11: unoAUnoTaller.length
  }), [diagnosticas, talleres, unoAUnoPrograma, unoAUnoTaller]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <div className="p-2 bg-brand-cyan/10 rounded-xl"><ClipboardList size={22} className="text-brand-cyan" /></div>
          Seguimiento
        </h1>
        <p className="text-gray-400 mt-1 ml-12">Seguimiento integral de emprendimientos</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-brand-dark/50 uppercase tracking-wider mb-1.5">Programa</label>
            <select
              value={filtroPrograma}
              onChange={(e) => { setFiltroPrograma(e.target.value); setFiltroEmp(''); }}
              className={INPUT_CLS}
            >
              <option value="">Todos los programas</option>
              {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-brand-dark/50 uppercase tracking-wider mb-1.5">Emprendimiento</label>
            <select
              value={filtroEmp}
              onChange={(e) => setFiltroEmp(e.target.value)}
              className={INPUT_CLS}
            >
              <option value="">Seleccionar emprendimiento</option>
              {emprendimientos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </select>
          </div>
        </div>
      </div>

      {!filtroEmp ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-cyan/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Rocket size={32} className="text-brand-cyan" />
          </div>
          <p className="text-gray-500 font-medium">Selecciona un emprendimiento</p>
          <p className="text-gray-400 text-sm mt-1">Elige un programa y emprendimiento para ver su seguimiento</p>
        </div>
      ) : (
        <>
          {/* Info del emprendimiento */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green font-bold text-xl">
                {empSeleccionado?.nombre?.charAt(0)}
              </div>
              <div>
                <h2 className="font-bold text-brand-dark text-lg">{empSeleccionado?.nombre}</h2>
                <div className="flex items-center gap-2 text-sm text-gray-400">
                  <FolderKanban size={14} className="text-brand-purple" />
                  <span>{empSeleccionado?.programa?.nombre}</span>
                  {empSeleccionado?.sector && <><span>·</span><span>{empSeleccionado.sector}</span></>}
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
            <button onClick={() => setTab('timeline')} className={TAB_CLS(tab === 'timeline')}>
              Timeline
            </button>
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
            <button onClick={() => setTab('objetivos')} className={TAB_CLS(tab === 'objetivos')}>
              Objetivos OKR
            </button>
          </div>

          {/* Tab Content */}
          {tab === 'timeline' && <TimelineTab timeline={timeline} pendientes={pendientes} invalidate={invalidate} empId={filtroEmp} />}
          {tab === 'diagnosticos' && <DiagnosticosTab sesiones={diagnosticas} invalidate={invalidate} />}
          {tab === 'talleres' && <TalleresTab sesiones={talleres} invalidate={invalidate} />}
          {tab === '1a1_programa' && <SesionesEditableTab sesiones={unoAUnoPrograma} invalidate={invalidate} empId={filtroEmp} tipo="programa" />}
          {tab === '1a1_taller' && <SesionesEditableTab sesiones={unoAUnoTaller} invalidate={invalidate} empId={filtroEmp} tipo="taller" />}
          {tab === 'objetivos' && <ObjetivosTab objetivos={objetivos} invalidate={invalidate} empId={filtroEmp} />}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: TIMELINE (all session types, chronological)
// ═══════════════════════════════════════════════════════════
const TimelineTab = ({ timeline, pendientes, invalidate, empId }) => {
  if (timeline.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <Calendar size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No hay sesiones registradas</p>
        <p className="text-gray-400 text-sm mt-1">Las sesiones del programa aparecerán aquí en orden cronológico</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {/* Compromisos pendientes destacados */}
      {pendientes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
          <h3 className="font-bold text-amber-800 text-sm flex items-center gap-2 mb-3">
            <AlertCircle size={16} /> Compromisos pendientes de sesiones anteriores
          </h3>
          <div className="space-y-2">
            {pendientes.map(c => (
              <div key={c.id} className="flex items-center gap-3 bg-white rounded-xl px-4 py-2.5 border border-amber-100">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${ESTADO_ACT[c.estado]?.dot}`}></span>
                <span className="text-sm text-gray-700 flex-1">{c.descripcion}</span>
                <span className="text-[10px] text-gray-400">
                  Sesión: {c.seguimientoOrigen?.sesion?.titulo}
                </span>
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
          {timeline.map((seg, idx) => {
            const tipoMeta = TIPO_SESION_META[seg.sesion?.tipo] || TIPO_SESION_META.seguimiento;
            const TipoIcon = tipoMeta.icon;
            return (
              <div key={seg.id} className="relative pl-14">
                <div className="absolute left-4 top-5 w-5 h-5 rounded-full bg-white border-2 border-brand-cyan flex items-center justify-center z-10">
                  <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${tipoMeta.color}`}>
                          <TipoIcon size={10} /> {tipoMeta.label}
                        </span>
                      </div>
                      <h4 className="font-bold text-brand-dark">{seg.sesion?.titulo}</h4>
                      <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1.5">
                        <Calendar size={11} /> {seg.sesion?.fecha}
                        {seg.enlace_grabacion && (
                          <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:underline flex items-center gap-1 ml-2">
                            <Video size={11} /> Grabación
                          </a>
                        )}
                      </p>
                    </div>
                    {seg.estado_avance && seg.estado_avance !== 'sin_iniciar' && (
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${ESTADO_ACT[seg.estado_avance]?.color || 'bg-gray-100 text-gray-500'}`}>
                        {seg.estado_avance?.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {seg.realizado && (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Lo trabajado</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{seg.realizado}</p>
                    </div>
                  )}

                  {seg.observaciones && (
                    <div className="mb-3">
                      <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Observaciones</p>
                      <p className="text-sm text-gray-500 whitespace-pre-line">{seg.observaciones}</p>
                    </div>
                  )}

                  {seg.compromisoItems?.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-2">Compromisos</p>
                      <div className="space-y-1.5">
                        {seg.compromisoItems.map(c => {
                          const est = ESTADO_ACT[c.estado] || ESTADO_ACT.planeado;
                          return (
                            <div key={c.id} className="flex items-center gap-2.5 text-sm">
                              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${est.dot}`}></span>
                              <span className="flex-1 text-gray-700">{c.descripcion}</span>
                              <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${est.color}`}>{est.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
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
// TAB: DIAGNÓSTICOS (read-only view of diagnostic sessions)
// ═══════════════════════════════════════════════════════════
const DiagnosticosTab = ({ sesiones, invalidate }) => {
  const [editandoSeg, setEditandoSeg] = useState(null);
  const [formSeg, setFormSeg] = useState({ realizado: '', observaciones: '' });

  const guardarSeguimiento = async (segId) => {
    try {
      await api.put(`/seguimientos/${segId}`, formSeg);
      toast.success('Diagnóstico actualizado');
      setEditandoSeg(null);
      invalidate('timeline');
    } catch { toast.error('Error al guardar'); }
  };

  const ordenDiag = { diagnostica_1: 1, diagnostica_2: 2, diagnostica_final: 3 };
  const sorted = [...sesiones].sort((a, b) => (ordenDiag[a.sesion?.tipo] || 0) - (ordenDiag[b.sesion?.tipo] || 0));

  if (sorted.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <FileSearch size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No hay sesiones diagnósticas</p>
        <p className="text-gray-400 text-sm mt-1">Las sesiones de tipo diagnóstica aparecerán aquí cuando se creen en el programa</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Sesiones diagnósticas del programa: evaluación inicial, intermedia y final del emprendimiento.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {['diagnostica_1', 'diagnostica_2', 'diagnostica_final'].map(tipo => {
          const seg = sorted.find(s => s.sesion?.tipo === tipo);
          const meta = TIPO_SESION_META[tipo];
          const TipoIcon = meta.icon;
          const esEditando = editandoSeg === seg?.id;

          return (
            <div key={tipo} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${seg ? 'border-gray-100' : 'border-dashed border-gray-200'}`}>
              <div className={`px-4 py-3 border-b flex items-center gap-2 ${seg ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100'}`}>
                <TipoIcon size={14} className={seg ? 'text-purple-600' : 'text-gray-400'} />
                <span className={`text-sm font-bold ${seg ? 'text-purple-800' : 'text-gray-400'}`}>{meta.label}</span>
              </div>
              {seg ? (
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-brand-dark text-sm">{seg.sesion?.titulo}</h4>
                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Calendar size={10} /> {seg.sesion?.fecha}</p>
                  </div>
                  {esEditando ? (
                    <>
                      <div>
                        <label className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider">Resultados / Hallazgos</label>
                        <textarea value={formSeg.realizado} onChange={e => setFormSeg({ ...formSeg, realizado: e.target.value })} className={`${INPUT_CLS} min-h-[80px] resize-none mt-1`} placeholder="Resultados del diagnóstico..." />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider">Observaciones</label>
                        <textarea value={formSeg.observaciones} onChange={e => setFormSeg({ ...formSeg, observaciones: e.target.value })} className={`${INPUT_CLS} min-h-[60px] resize-none mt-1`} placeholder="Observaciones..." />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button onClick={() => setEditandoSeg(null)} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-100 rounded-lg">Cancelar</button>
                        <button onClick={() => guardarSeguimiento(seg.id)} className="px-3 py-1.5 text-xs bg-brand-dark text-white rounded-lg flex items-center gap-1"><Save size={12} /> Guardar</button>
                      </div>
                    </>
                  ) : (
                    <>
                      {seg.realizado ? (
                        <div>
                          <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Resultados / Hallazgos</p>
                          <p className="text-sm text-gray-600 whitespace-pre-line">{seg.realizado}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-300 italic">Sin resultados registrados</p>
                      )}
                      {seg.observaciones && (
                        <div>
                          <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Observaciones</p>
                          <p className="text-xs text-gray-500 whitespace-pre-line">{seg.observaciones}</p>
                        </div>
                      )}
                      <button onClick={() => { setEditandoSeg(seg.id); setFormSeg({ realizado: seg.realizado || '', observaciones: seg.observaciones || '' }); }} className="text-xs text-brand-purple hover:text-brand-dark font-medium flex items-center gap-1">
                        <Edit3 size={12} /> Editar
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-xs text-gray-400">Aún no hay una sesión de este tipo</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: TALLERES (list of workshop sessions)
// ═══════════════════════════════════════════════════════════
const TalleresTab = ({ sesiones, invalidate }) => {
  const [editandoSeg, setEditandoSeg] = useState(null);
  const [formSeg, setFormSeg] = useState({ realizado: '', observaciones: '' });

  const guardarSeguimiento = async (segId) => {
    try {
      await api.put(`/seguimientos/${segId}`, formSeg);
      toast.success('Taller actualizado');
      setEditandoSeg(null);
      invalidate('timeline');
    } catch { toast.error('Error al guardar'); }
  };

  if (sesiones.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <Presentation size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No hay talleres registrados</p>
        <p className="text-gray-400 text-sm mt-1">Las sesiones de tipo taller aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Talleres del programa: sesiones grupales de formación y capacitación.</p>
      {sesiones.map((seg, idx) => {
        const esEditando = editandoSeg === seg.id;
        return (
          <div key={seg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-5 py-3 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Presentation size={16} className="text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-brand-dark text-sm">{seg.sesion?.titulo}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><Calendar size={10} /> {seg.sesion?.fecha}</p>
                </div>
              </div>
              {!esEditando && (
                <button onClick={() => { setEditandoSeg(seg.id); setFormSeg({ realizado: seg.realizado || '', observaciones: seg.observaciones || '' }); }} className="p-2 text-brand-purple hover:bg-brand-purple/10 rounded-xl">
                  <Edit3 size={14} />
                </button>
              )}
            </div>
            <div className="p-5 space-y-3">
              {esEditando ? (
                <>
                  <div>
                    <label className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider">Temas trabajados</label>
                    <textarea value={formSeg.realizado} onChange={e => setFormSeg({ ...formSeg, realizado: e.target.value })} className={`${INPUT_CLS} min-h-[80px] resize-none mt-1`} placeholder="Temas trabajados en el taller..." />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider">Observaciones</label>
                    <textarea value={formSeg.observaciones} onChange={e => setFormSeg({ ...formSeg, observaciones: e.target.value })} className={`${INPUT_CLS} min-h-[60px] resize-none mt-1`} placeholder="Observaciones..." />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setEditandoSeg(null)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>
                    <button onClick={() => guardarSeguimiento(seg.id)} className="px-4 py-2 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 flex items-center gap-1.5"><Save size={14} /> Guardar</button>
                  </div>
                </>
              ) : (
                <>
                  {seg.realizado ? (
                    <div>
                      <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Temas trabajados</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{seg.realizado}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-300 italic">Sin registro de temas trabajados</p>
                  )}
                  {seg.observaciones && (
                    <div>
                      <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1">Observaciones</p>
                      <p className="text-sm text-gray-500 whitespace-pre-line">{seg.observaciones}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: OBJETIVOS OKR
// ═══════════════════════════════════════════════════════════
const ObjetivosTab = ({ objetivos, invalidate }) => {
  // Admin solo visualiza, no crea objetivos (los crea el emprendedor desde "Mis Objetivos")
  return (
    <div className="space-y-5">
      {/* Lista de objetivos */}
      {objetivos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Target size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No hay objetivos registrados</p>
          <p className="text-gray-400 text-sm mt-1">El emprendedor puede crear objetivos OKR desde su vista "Mis Objetivos"</p>
        </div>
      ) : (
        objetivos.map(obj => (
          <ObjetivoCard key={obj.id} objetivo={obj} invalidate={invalidate} />
        ))
      )}
    </div>
  );
};

// ─── Objetivo Card ───
const ObjetivoCard = ({ objetivo, invalidate }) => {
  const [expandido, setExpandido] = useState(true);
  const [agregandoRC, setAgregandoRC] = useState(false);
  const [nuevoRC, setNuevoRC] = useState('');
  const [agregandoEv, setAgregandoEv] = useState(false);
  const [nuevaEv, setNuevaEv] = useState({ url: '', descripcion: '' });

  const avanceTotal = useMemo(() => {
    const acts = objetivo.resultadosClave?.flatMap(rc => rc.actividades || []) || [];
    if (acts.length === 0) return 0;
    const completadas = acts.filter(a => a.estado === 'completado').length;
    return Math.round((completadas / acts.length) * 100);
  }, [objetivo]);

  const crearRC = async () => {
    if (!nuevoRC) return;
    try {
      await api.post(`/objetivos/resultado-clave/${objetivo.id}`, { descripcion: nuevoRC });
      setNuevoRC('');
      setAgregandoRC(false);
      invalidate('objetivos');
    } catch { toast.error('Error al crear resultado clave'); }
  };

  const crearEvidencia = async () => {
    if (!nuevaEv.url) return toast.error('La URL es requerida');
    try {
      await api.post(`/objetivos/evidencia/${objetivo.id}`, nuevaEv);
      setNuevaEv({ url: '', descripcion: '' });
      setAgregandoEv(false);
      invalidate('objetivos');
    } catch { toast.error('Error al crear evidencia'); }
  };

  const eliminarObj = async () => {
    if (!window.confirm('¿Eliminar este objetivo?')) return;
    try {
      await api.delete(`/objetivos/${objetivo.id}`);
      toast.success('Objetivo eliminado');
      invalidate('objetivos');
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 cursor-pointer" onClick={() => setExpandido(!expandido)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1">
            <div className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Target size={18} className="text-brand-cyan" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-brand-dark">{objetivo.titulo}</h3>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${TIPO_OBJ_COLORS[objetivo.tipo]}`}>
                  {TIPO_OBJ_LABELS[objetivo.tipo]}
                </span>
                {objetivo.fecha_limite && (
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Calendar size={10} /> {objetivo.fecha_limite}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Avance circular */}
            <div className="text-center">
              <div className={`text-lg font-bold ${avanceTotal >= 80 ? 'text-green-600' : avanceTotal >= 40 ? 'text-amber-500' : 'text-gray-400'}`}>
                {avanceTotal}%
              </div>
              <p className="text-[9px] text-gray-400">Avance</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); eliminarObj(); }} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
              <Trash2 size={14} />
            </button>
            <ChevronRight size={16} className={`text-gray-400 transition-transform ${expandido ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      {/* Contenido expandido */}
      {expandido && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          {/* Resultados Clave */}
          {objetivo.resultadosClave?.map(rc => (
            <ResultadoClaveCard key={rc.id} rc={rc} invalidate={invalidate} />
          ))}

          {/* Agregar RC */}
          {agregandoRC ? (
            <div className="flex gap-2">
              <input value={nuevoRC} onChange={e => setNuevoRC(e.target.value)} placeholder="Descripción del resultado clave..." className={`${INPUT_CLS} flex-1`} onKeyDown={e => e.key === 'Enter' && crearRC()} />
              <button onClick={crearRC} className="px-3 py-2 bg-brand-cyan text-white rounded-xl text-sm font-medium"><Save size={14} /></button>
              <button onClick={() => setAgregandoRC(false)} className="px-3 py-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={14} /></button>
            </div>
          ) : (
            <button onClick={() => setAgregandoRC(true)} className="text-sm text-brand-cyan hover:text-brand-dark font-medium flex items-center gap-1.5">
              <Plus size={14} /> Agregar resultado clave
            </button>
          )}

          {/* Evidencias */}
          <div className="border-t border-gray-50 pt-4">
            <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Link2 size={11} /> Evidencias
            </p>
            {objetivo.evidencias?.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {objetivo.evidencias.map(ev => (
                  <div key={ev.id} className="flex items-center gap-2 group">
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-cyan hover:underline flex items-center gap-1.5 flex-1">
                      <ExternalLink size={12} /> {ev.descripcion || ev.url}
                    </a>
                    <button onClick={async () => { await api.delete(`/objetivos/evidencia/${ev.id}`); invalidate('objetivos'); }} className="p-1 text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {agregandoEv ? (
              <div className="flex gap-2 flex-wrap">
                <input value={nuevaEv.url} onChange={e => setNuevaEv({ ...nuevaEv, url: e.target.value })} placeholder="URL de la evidencia" className={`${INPUT_CLS} flex-1 min-w-[200px]`} />
                <input value={nuevaEv.descripcion} onChange={e => setNuevaEv({ ...nuevaEv, descripcion: e.target.value })} placeholder="Descripción (opcional)" className={`${INPUT_CLS} flex-1 min-w-[150px]`} />
                <button onClick={crearEvidencia} className="px-3 py-2 bg-brand-cyan text-white rounded-xl text-sm"><Save size={14} /></button>
                <button onClick={() => setAgregandoEv(false)} className="px-3 py-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={14} /></button>
              </div>
            ) : (
              <button onClick={() => setAgregandoEv(true)} className="text-xs text-brand-cyan hover:text-brand-dark font-medium flex items-center gap-1">
                <Plus size={12} /> Agregar evidencia
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Resultado Clave Card ───
const ResultadoClaveCard = ({ rc, invalidate }) => {
  const [agregandoAct, setAgregandoAct] = useState(false);
  const [nuevaAct, setNuevaAct] = useState({ descripcion: '', meta_numerica: 1 });

  const crearActividad = async () => {
    if (!nuevaAct.descripcion) return;
    try {
      await api.post(`/objetivos/actividad/${rc.id}`, nuevaAct);
      setNuevaAct({ descripcion: '', meta_numerica: 1 });
      setAgregandoAct(false);
      invalidate('objetivos');
    } catch { toast.error('Error al crear actividad'); }
  };

  const actualizarActividad = async (actId, campo, valor) => {
    try {
      await api.put(`/objetivos/actividad/${actId}`, { [campo]: valor });
      invalidate('objetivos');
    } catch { toast.error('Error al actualizar'); }
  };

  const eliminarRC = async () => {
    if (!window.confirm('¿Eliminar este resultado clave y sus actividades?')) return;
    try {
      await api.delete(`/objetivos/resultado-clave/${rc.id}`);
      invalidate('objetivos');
    } catch { toast.error('Error al eliminar'); }
  };

  return (
    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-brand-dark">{rc.descripcion}</p>
        <button onClick={eliminarRC} className="p-1 text-red-400 hover:bg-red-50 rounded-lg flex-shrink-0">
          <Trash2 size={12} />
        </button>
      </div>

      {/* Actividades */}
      <div className="space-y-2">
        {rc.actividades?.map(act => {
          const est = ESTADO_ACT[act.estado] || ESTADO_ACT.planeado;
          const avance = act.meta_numerica > 0 ? Math.min(100, Math.round((act.meta_real / act.meta_numerica) * 100)) : 0;
          return (
            <div key={act.id} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100 group">
              <span className="text-xs text-gray-500 flex-1">{act.descripcion}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
                <input
                  type="number"
                  value={act.meta_real}
                  onChange={e => actualizarActividad(act.id, 'meta_real', e.target.value)}
                  className="w-14 px-2 py-1 border border-gray-200 rounded-md text-xs text-center"
                  title="Meta real"
                />
                <span className="text-[10px] text-gray-400">/ {act.meta_numerica}</span>
                <span className={`text-[10px] font-bold w-10 text-right ${avance >= 100 ? 'text-green-600' : avance >= 50 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {avance}%
                </span>
                <select
                  value={act.estado}
                  onChange={e => actualizarActividad(act.id, 'estado', e.target.value)}
                  className={`px-2 py-1 rounded-md text-[10px] font-semibold border-0 cursor-pointer ${est.color}`}
                >
                  {Object.entries(ESTADO_ACT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
                <button onClick={async () => { await api.delete(`/objetivos/actividad/${act.id}`); invalidate('objetivos'); }} className="p-1 text-red-400 opacity-0 group-hover:opacity-100">
                  <Trash2 size={11} />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Agregar actividad */}
      {agregandoAct ? (
        <div className="flex gap-2 mt-2">
          <input value={nuevaAct.descripcion} onChange={e => setNuevaAct({ ...nuevaAct, descripcion: e.target.value })} placeholder="Descripción de la actividad" className={`${INPUT_CLS} flex-1`} onKeyDown={e => e.key === 'Enter' && crearActividad()} />
          <input type="number" value={nuevaAct.meta_numerica} onChange={e => setNuevaAct({ ...nuevaAct, meta_numerica: e.target.value })} className="w-16 px-2 py-2 border border-gray-200 rounded-xl text-sm text-center" placeholder="Meta" />
          <button onClick={crearActividad} className="px-3 py-2 bg-brand-cyan text-white rounded-xl text-sm"><Save size={14} /></button>
          <button onClick={() => setAgregandoAct(false)} className="px-3 py-2 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={14} /></button>
        </div>
      ) : (
        <button onClick={() => setAgregandoAct(true)} className="text-xs text-brand-cyan hover:text-brand-dark font-medium flex items-center gap-1 mt-2">
          <Plus size={12} /> Agregar actividad
        </button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: SESIONES 1 A 1 (Programa y Taller) — editable con compromisos
// ═══════════════════════════════════════════════════════════
const SesionesEditableTab = ({ sesiones, invalidate, empId, tipo }) => {
  const [editandoSeg, setEditandoSeg] = useState(null);
  const [formSeg, setFormSeg] = useState({ realizado: '', observaciones: '', comentario_emprendedor: '', comentario_tallerista: '', enlace_grabacion: '' });
  const [nuevoCompromiso, setNuevoCompromiso] = useState('');

  const esTaller = tipo === 'taller';
  const headerBg = esTaller ? 'bg-green-50 border-green-100' : 'bg-cyan-50 border-cyan-100';
  const headerIconBg = esTaller ? 'bg-green-100' : 'bg-cyan-100';
  const headerIconColor = esTaller ? 'text-green-600' : 'text-cyan-600';
  const HeaderIcon = esTaller ? BookOpen : UserCheck;
  const emptyLabel = esTaller ? 'sesiones 1 a 1 de taller' : 'sesiones 1 a 1 de programa';

  const iniciarEdicion = (seg) => {
    setEditandoSeg(seg.id);
    setFormSeg({
      realizado: seg.realizado || '',
      observaciones: seg.observaciones || '',
      comentario_emprendedor: seg.comentario_emprendedor || '',
      comentario_tallerista: seg.comentario_tallerista || '',
      enlace_grabacion: seg.enlace_grabacion || ''
    });
  };

  const guardarSeguimiento = async (segId) => {
    try {
      const payload = { 
        realizado: formSeg.realizado, 
        observaciones: formSeg.observaciones,
        enlace_grabacion: formSeg.enlace_grabacion || null
      };
      if (esTaller) {
        payload.comentario_emprendedor = formSeg.comentario_emprendedor;
        payload.comentario_tallerista = formSeg.comentario_tallerista;
      }
      await api.put(`/seguimientos/${segId}`, payload);
      toast.success('Sesión actualizada');
      setEditandoSeg(null);
      invalidate('timeline');
    } catch { toast.error('Error al guardar'); }
  };

  const agregarCompromiso = async (segId) => {
    if (!nuevoCompromiso) return;
    try {
      await api.post(`/compromisos/seguimiento/${segId}`, { descripcion: nuevoCompromiso });
      setNuevoCompromiso('');
      invalidate('timeline', 'compromisos-pendientes');
    } catch { toast.error('Error al crear compromiso'); }
  };

  const actualizarCompromiso = async (id, estado) => {
    try {
      await api.put(`/compromisos/${id}`, { estado });
      invalidate('timeline', 'compromisos-pendientes');
    } catch { toast.error('Error al actualizar'); }
  };

  if (sesiones.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
        <HeaderIcon size={32} className="text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No hay {emptyLabel} registradas</p>
        <p className="text-gray-400 text-sm mt-1">Aparecerán aquí cuando se creen sesiones de este tipo en el programa</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        {esTaller
          ? 'Sesiones individuales de seguimiento post-taller con cada emprendimiento.'
          : 'Sesiones continuas 1 a 1 del programa con el emprendimiento. Aquí se registran avances y compromisos entre sesiones.'}
      </p>
      {sesiones.map((seg, idx) => {
        const esEditando = editandoSeg === seg.id;
        return (
          <div key={seg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className={`px-5 py-3 border-b flex items-center justify-between ${headerBg}`}>
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg ${headerIconBg} flex items-center justify-center`}>
                  <HeaderIcon size={16} className={headerIconColor} />
                </div>
                <div>
                  <h4 className="font-bold text-brand-dark text-sm">{seg.sesion?.titulo}</h4>
                  <p className="text-xs text-gray-400 flex items-center gap-1.5 mt-0.5">
                    <Calendar size={10} /> {seg.sesion?.fecha}
                    {seg.enlace_grabacion && (
                      <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:underline flex items-center gap-1 ml-2">
                        <Video size={10} /> Ver grabación
                      </a>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {seg.estado_avance && seg.estado_avance !== 'sin_iniciar' && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${ESTADO_ACT[seg.estado_avance]?.color || 'bg-gray-100 text-gray-500'}`}>
                    {seg.estado_avance?.replace('_', ' ')}
                  </span>
                )}
                {!esEditando && (
                  <button onClick={() => iniciarEdicion(seg)} className="p-2 text-brand-purple hover:bg-brand-purple/10 rounded-xl">
                    <Edit3 size={14} />
                  </button>
                )}
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Lo trabajado */}
              <div>
                <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1.5">Lo trabajado en esta sesión</p>
                {esEditando ? (
                  <textarea value={formSeg.realizado} onChange={e => setFormSeg({ ...formSeg, realizado: e.target.value })} className={`${INPUT_CLS} min-h-[80px] resize-none`} placeholder="Describe lo trabajado..." />
                ) : (
                  <p className="text-sm text-gray-600 whitespace-pre-line">{seg.realizado || <span className="text-gray-300 italic">Sin registrar</span>}</p>
                )}
              </div>

              {/* Observaciones */}
              <div>
                <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1.5">Observaciones</p>
                {esEditando ? (
                  <textarea value={formSeg.observaciones} onChange={e => setFormSeg({ ...formSeg, observaciones: e.target.value })} className={`${INPUT_CLS} min-h-[60px] resize-none`} placeholder="Observaciones..." />
                ) : (
                  <p className="text-sm text-gray-500 whitespace-pre-line">{seg.observaciones || <span className="text-gray-300 italic">Sin observaciones</span>}</p>
                )}
              </div>

              {/* Enlace de grabación */}
              <div>
                <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Video size={10} /> Enlace de grabación
                </p>
                {esEditando ? (
                  <input 
                    type="url"
                    value={formSeg.enlace_grabacion} 
                    onChange={e => setFormSeg({ ...formSeg, enlace_grabacion: e.target.value })} 
                    className={INPUT_CLS} 
                    placeholder="https://meet.google.com/... o https://zoom.us/..." 
                  />
                ) : (
                  seg.enlace_grabacion ? (
                    <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-cyan hover:underline flex items-center gap-1.5">
                      <Video size={14} /> {seg.enlace_grabacion}
                    </a>
                  ) : (
                    <p className="text-sm text-gray-300 italic">Sin grabación</p>
                  )
                )}
              </div>

              {/* Comentarios adicionales para sesiones 1 a 1 de taller */}
              {esTaller && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                  <div>
                    <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1.5">Comentario del emprendedor</p>
                    {esEditando ? (
                      <textarea value={formSeg.comentario_emprendedor} onChange={e => setFormSeg({ ...formSeg, comentario_emprendedor: e.target.value })} className={`${INPUT_CLS} min-h-[60px] resize-none`} placeholder="¿Qué dice el emprendedor?" />
                    ) : (
                      <p className="text-sm text-gray-600 whitespace-pre-line">{seg.comentario_emprendedor || <span className="text-gray-300 italic">Sin comentario</span>}</p>
                    )}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-1.5">Comentario del tallerista</p>
                    {esEditando ? (
                      <textarea value={formSeg.comentario_tallerista} onChange={e => setFormSeg({ ...formSeg, comentario_tallerista: e.target.value })} className={`${INPUT_CLS} min-h-[60px] resize-none`} placeholder="¿Qué dice el tallerista?" />
                    ) : (
                      <p className="text-sm text-gray-600 whitespace-pre-line">{seg.comentario_tallerista || <span className="text-gray-300 italic">Sin comentario</span>}</p>
                    )}
                  </div>
                </div>
              )}

              {esEditando && (
                <div className="flex justify-end gap-2">
                  <button onClick={() => setEditandoSeg(null)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>
                  <button onClick={() => guardarSeguimiento(seg.id)} className="px-4 py-2 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 flex items-center gap-1.5">
                    <Save size={14} /> Guardar
                  </button>
                </div>
              )}

              {/* Compromisos */}
              <div className="border-t border-gray-100 pt-4">
                <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-2">Compromisos para la siguiente sesión</p>
                <div className="space-y-2">
                  {seg.compromisoItems?.map(c => {
                    const est = ESTADO_ACT[c.estado] || ESTADO_ACT.planeado;
                    return (
                      <div key={c.id} className="flex items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2 group">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${est.dot}`}></span>
                        <span className="text-sm text-gray-700 flex-1">{c.descripcion}</span>
                        <select
                          value={c.estado}
                          onChange={e => actualizarCompromiso(c.id, e.target.value)}
                          className={`px-2 py-1 rounded-md text-[10px] font-semibold border-0 cursor-pointer ${est.color}`}
                        >
                          {Object.entries(ESTADO_ACT).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button onClick={async () => { await api.delete(`/compromisos/${c.id}`); invalidate('timeline', 'compromisos-pendientes'); }} className="p-1 text-red-400 opacity-0 group-hover:opacity-100">
                          <Trash2 size={12} />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Agregar compromiso */}
                <div className="flex gap-2 mt-2">
                  <input
                    value={nuevoCompromiso}
                    onChange={e => setNuevoCompromiso(e.target.value)}
                    placeholder="Nuevo compromiso..."
                    className={`${INPUT_CLS} flex-1`}
                    onKeyDown={e => e.key === 'Enter' && agregarCompromiso(seg.id)}
                  />
                  <button onClick={() => agregarCompromiso(seg.id)} className="px-3 py-2 bg-brand-cyan text-white rounded-xl text-sm font-medium flex items-center gap-1">
                    <Plus size={14} /> Agregar
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SeguimientoV2;
