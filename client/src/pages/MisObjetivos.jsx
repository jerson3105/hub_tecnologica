import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useInvalidate } from '../hooks/useQueryHooks';
import toast from 'react-hot-toast';
import {
  Target, Plus, Trash2, Save, X, ChevronRight, Calendar, CheckCircle2, Circle, Clock, XCircle,
  ExternalLink, Link2, Rocket
} from 'lucide-react';

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
  planeado: { label: 'Planeado', color: 'text-gray-400 bg-gray-50', dot: 'bg-gray-300' },
  en_progreso: { label: 'En progreso', color: 'text-amber-600 bg-amber-50', dot: 'bg-amber-400' },
  completado: { label: 'Completado', color: 'text-green-600 bg-green-50', dot: 'bg-green-500' },
  no_logrado: { label: 'No logrado', color: 'text-red-500 bg-red-50', dot: 'bg-red-400' }
};

const INPUT_CLS = 'w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';

const MisObjetivos = () => {
  const invalidate = useInvalidate();
  const [empId, setEmpId] = useState(null);
  const [creando, setCreando] = useState(false);
  const [nuevoObj, setNuevoObj] = useState({ titulo: '', tipo: 'producto_desarrollo', fecha_limite: '' });

  // Obtener emprendimiento del usuario
  const { data: miEmpData } = useQuery({
    queryKey: ['mi-emprendimiento'],
    queryFn: () => api.get('/emprendimientos/mi-emprendimiento').then(r => r.data)
  });

  useEffect(() => {
    if (miEmpData?.emprendimientos?.length > 0) {
      setEmpId(miEmpData.emprendimientos[0].id);
    }
  }, [miEmpData]);

  const { data: objetivos = [] } = useQuery({
    queryKey: ['objetivos', empId],
    queryFn: () => api.get(`/objetivos/emprendimiento/${empId}`).then(r => r.data.objetivos),
    enabled: !!empId
  });

  const crearObjetivo = async () => {
    if (!nuevoObj.titulo) return toast.error('El título es requerido');
    try {
      await api.post(`/objetivos/emprendimiento/${empId}`, nuevoObj);
      toast.success('Objetivo creado');
      setCreando(false);
      setNuevoObj({ titulo: '', tipo: 'producto_desarrollo', fecha_limite: '' });
      invalidate('objetivos');
    } catch { toast.error('Error al crear objetivo'); }
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-cyan/10 rounded-xl"><Target size={22} className="text-brand-cyan" /></div>
            Mis Objetivos
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Gestiona los objetivos y resultados clave de tu emprendimiento</p>
        </div>
        <button onClick={() => setCreando(!creando)} className="px-4 py-2.5 text-sm font-medium bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 flex items-center gap-2 shadow-sm">
          <Plus size={16} /> Nuevo Objetivo
        </button>
      </div>

      {/* Form crear */}
      {creando && (
        <div className="bg-white rounded-2xl border border-brand-cyan/30 p-5 shadow-sm">
          <h3 className="font-bold text-brand-dark mb-3">Nuevo Objetivo</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-brand-dark/50 mb-1">Título del objetivo</label>
              <input value={nuevoObj.titulo} onChange={e => setNuevoObj({ ...nuevoObj, titulo: e.target.value })} className={INPUT_CLS} placeholder="Ej: Validar la demanda real del servicio..." />
            </div>
            <div>
              <label className="block text-xs font-semibold text-brand-dark/50 mb-1">Área</label>
              <select value={nuevoObj.tipo} onChange={e => setNuevoObj({ ...nuevoObj, tipo: e.target.value })} className={INPUT_CLS}>
                {Object.entries(TIPO_OBJ_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
            <div>
              <label className="block text-xs font-semibold text-brand-dark/50 mb-1">Fecha límite</label>
              <input type="date" value={nuevoObj.fecha_limite} onChange={e => setNuevoObj({ ...nuevoObj, fecha_limite: e.target.value })} className={INPUT_CLS} />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setCreando(false)} className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-100 rounded-xl">Cancelar</button>
            <button onClick={crearObjetivo} className="px-4 py-2 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 flex items-center gap-1.5">
              <Save size={14} /> Guardar
            </button>
          </div>
        </div>
      )}

      {/* Lista de objetivos */}
      {objetivos.length === 0 && !creando ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <Target size={40} className="text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 font-medium">No tienes objetivos registrados</p>
          <p className="text-gray-400 text-sm mt-1">Crea tu primer objetivo para comenzar a medir tu progreso</p>
          <button onClick={() => setCreando(true)} className="mt-4 px-5 py-2 bg-brand-dark text-white rounded-xl text-sm font-medium inline-flex items-center gap-2 hover:bg-brand-dark/90">
            <Plus size={16} /> Crear objetivo
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {objetivos.map(obj => (
            <ObjetivoCardEmp key={obj.id} objetivo={obj} invalidate={invalidate} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Objetivo Card (Emprendedor) ───
const ObjetivoCardEmp = ({ objetivo, invalidate }) => {
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
            <div className="text-center">
              <div className={`text-lg font-bold ${avanceTotal >= 80 ? 'text-green-600' : avanceTotal >= 40 ? 'text-amber-500' : 'text-gray-400'}`}>
                {avanceTotal}%
              </div>
              <p className="text-[9px] text-gray-400">Avance</p>
            </div>
            <ChevronRight size={16} className={`text-gray-400 transition-transform ${expandido ? 'rotate-90' : ''}`} />
          </div>
        </div>
      </div>

      {/* Contenido expandido */}
      {expandido && (
        <div className="border-t border-gray-100 p-5 space-y-4">
          {objetivo.resultadosClave?.map(rc => (
            <RCCardEmp key={rc.id} rc={rc} invalidate={invalidate} />
          ))}

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

// ─── Resultado Clave Card (Emprendedor) ───
const RCCardEmp = ({ rc, invalidate }) => {
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

  return (
    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
      <p className="text-sm font-semibold text-brand-dark mb-3">{rc.descripcion}</p>

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

export default MisObjetivos;
