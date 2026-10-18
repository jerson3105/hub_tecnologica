import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../services/api';
import { useInvalidate } from '../hooks/useQueryHooks';
import toast from 'react-hot-toast';
import MetaRealInput from '../components/MetaRealInput';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Select } from '../components/ui/Field';
import { eliminarConConfirmacion } from '../utils/acciones';
import { formatFecha } from '../utils/fechas';
import BadgeDe from '../components/ui/BadgeDe';
import { ESTADOS_ACTIVIDAD, TIPOS_OBJETIVO, estadoActividad } from '../constants/estados';
import { Target, Plus, Trash2, Save, X, ChevronRight, Calendar, ExternalLink, Link2, Rocket } from 'lucide-react';

// Igual que BTN_BORRAR_SUAVE: en dispositivos con hover el botón aparece al pasar o enfocar
// la fila (que lleva la clase `group`); en pantallas táctiles queda siempre visible.
const REVELAR_EN_HOVER = 'focus-visible:opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 [@media(hover:hover)]:group-focus-within:opacity-100';

const MisObjetivos = () => {
  const invalidate = useInvalidate();
  const [creando, setCreando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [nuevoObj, setNuevoObj] = useState({ titulo: '', tipo: 'producto_desarrollo', fecha_limite: '' });

  // Obtener emprendimiento del usuario
  const { data: miEmpData, isLoading: cargandoEmp } = useQuery({
    queryKey: ['mi-emprendimiento'],
    queryFn: () => api.get('/emprendimientos/mi-emprendimiento').then(r => r.data)
  });

  const empId = miEmpData?.emprendimientos?.[0]?.id ?? null;

  const { data: objetivos = [], isLoading: cargandoObjetivos } = useQuery({
    queryKey: ['objetivos', empId],
    queryFn: () => api.get(`/objetivos/emprendimiento/${empId}`).then(r => r.data.objetivos),
    enabled: !!empId
  });

  const crearObjetivo = async () => {
    if (!nuevoObj.titulo) return toast.error('El título es requerido');
    setGuardando(true);
    try {
      await api.post(`/objetivos/emprendimiento/${empId}`, nuevoObj);
      toast.success('Objetivo creado');
      setCreando(false);
      setNuevoObj({ titulo: '', tipo: 'producto_desarrollo', fecha_limite: '' });
      invalidate('objetivos');
    } catch {
      toast.error('Error al crear objetivo');
    } finally {
      setGuardando(false);
    }
  };

  // Sin esto, mientras carga se mostraba "No se encontró tu emprendimiento"
  if (cargandoEmp || (empId && cargandoObjetivos)) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  if (!empId) {
    return <EmptyState icono={Rocket} tono="neutral" titulo="No se encontró tu emprendimiento" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-cyan/10 rounded-xl"><Target size={22} className="text-brand-cyan-ink" aria-hidden="true" /></div>
            Mis Objetivos
          </h1>
          <p className="text-gray-500 mt-1 sm:ml-12">Gestiona los objetivos y resultados clave de tu emprendimiento</p>
        </div>
        <Button icono={Plus} onClick={() => setCreando(!creando)} aria-expanded={creando}>Nuevo Objetivo</Button>
      </div>

      {/* Form crear */}
      {creando && (
        <div className="bg-white rounded-2xl border border-brand-cyan/30 p-5 shadow-sm">
          <h2 className="font-bold text-brand-dark mb-3">Nuevo Objetivo</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Título del objetivo" requerido className="sm:col-span-2">
              <Input value={nuevoObj.titulo} onChange={e => setNuevoObj({ ...nuevoObj, titulo: e.target.value })} placeholder="Ej: Validar la demanda real del servicio..." />
            </Field>
            <Field label="Área">
              <Select value={nuevoObj.tipo} onChange={e => setNuevoObj({ ...nuevoObj, tipo: e.target.value })}>
                {Object.entries(TIPOS_OBJETIVO).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
            <Field label="Fecha límite">
              <Input type="date" value={nuevoObj.fecha_limite} onChange={e => setNuevoObj({ ...nuevoObj, fecha_limite: e.target.value })} />
            </Field>
          </div>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 mt-4">
            <Button variante="ghost" onClick={() => setCreando(false)}>Cancelar</Button>
            <Button icono={Save} cargando={guardando} onClick={crearObjetivo}>Guardar</Button>
          </div>
        </div>
      )}

      {/* Lista de objetivos */}
      {objetivos.length === 0 && !creando ? (
        <EmptyState
          icono={Target}
          titulo="No tienes objetivos registrados"
          descripcion="Crea tu primer objetivo para comenzar a medir tu progreso"
          accion={<Button icono={Plus} onClick={() => setCreando(true)}>Crear objetivo</Button>}
        />
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
  const [guardandoRC, setGuardandoRC] = useState(false);
  const [agregandoEv, setAgregandoEv] = useState(false);
  const [nuevaEv, setNuevaEv] = useState({ url: '', descripcion: '' });
  const [guardandoEv, setGuardandoEv] = useState(false);

  const avanceTotal = useMemo(() => {
    const acts = objetivo.resultadosClave?.flatMap(rc => rc.actividades || []) || [];
    if (acts.length === 0) return 0;
    const completadas = acts.filter(a => a.estado === 'completado').length;
    return Math.round((completadas / acts.length) * 100);
  }, [objetivo]);

  const crearRC = async () => {
    if (!nuevoRC || guardandoRC) return;
    setGuardandoRC(true);
    try {
      await api.post(`/objetivos/resultado-clave/${objetivo.id}`, { descripcion: nuevoRC });
      setNuevoRC('');
      setAgregandoRC(false);
      invalidate('objetivos');
    } catch {
      toast.error('Error al crear resultado clave');
    } finally {
      setGuardandoRC(false);
    }
  };

  const crearEvidencia = async () => {
    if (guardandoEv) return;
    if (!nuevaEv.url) return toast.error('La URL es requerida');
    setGuardandoEv(true);
    try {
      await api.post(`/objetivos/evidencia/${objetivo.id}`, nuevaEv);
      setNuevaEv({ url: '', descripcion: '' });
      setAgregandoEv(false);
      invalidate('objetivos');
    } catch {
      toast.error('Error al crear evidencia');
    } finally {
      setGuardandoEv(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        className="w-full p-4 sm:p-5 text-left rounded-2xl"
        aria-expanded={expandido}
        aria-controls={`mi-objetivo-${objetivo.id}-detalle`}
        onClick={() => setExpandido(!expandido)}
      >
        <span className="flex items-start justify-between gap-3">
          <span className="flex items-start gap-3 flex-1 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
              <Target size={18} className="text-brand-cyan-ink" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-brand-dark break-words">{objetivo.titulo}</span>
              <span className="flex items-center gap-2 mt-1 flex-wrap">
                <BadgeDe mapa={TIPOS_OBJETIVO} valor={objetivo.tipo} forma="tag" />
                {objetivo.fecha_limite && (
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <Calendar size={12} aria-hidden="true" /> {formatFecha(objetivo.fecha_limite)}
                  </span>
                )}
              </span>
            </span>
          </span>
          <span className="flex items-center gap-3 shrink-0">
            <span className="text-center">
              <span className={`block text-lg font-bold tabular-nums ${avanceTotal >= 80 ? 'text-green-700' : avanceTotal >= 40 ? 'text-amber-700' : 'text-gray-500'}`}>
                {avanceTotal}%
              </span>
              <span className="block text-xs text-gray-500">Avance</span>
            </span>
            <ChevronRight size={16} className={`text-gray-500 transition-transform ${expandido ? 'rotate-90' : ''}`} aria-hidden="true" />
          </span>
        </span>
      </button>

      {/* Contenido expandido */}
      {expandido && (
        <div id={`mi-objetivo-${objetivo.id}-detalle`} className="border-t border-gray-100 p-4 sm:p-5 space-y-4">
          {objetivo.resultadosClave?.map(rc => (
            <RCCardEmp key={rc.id} rc={rc} invalidate={invalidate} />
          ))}

          {agregandoRC ? (
            <div className="flex items-center gap-2">
              <Input
                aria-label="Descripción del resultado clave"
                value={nuevoRC}
                onChange={e => setNuevoRC(e.target.value)}
                placeholder="Descripción del resultado clave..."
                className="flex-1 min-w-0"
                onKeyDown={e => e.key === 'Enter' && crearRC()}
              />
              <IconButton label="Guardar resultado clave" icono={Save} tamanioIcono={14} tono="cyan" onClick={crearRC} cargando={guardandoRC} />
              <IconButton label="Cancelar nuevo resultado clave" icono={X} tamanioIcono={14} onClick={() => setAgregandoRC(false)} />
            </div>
          ) : (
            <Button variante="texto" icono={Plus} onClick={() => setAgregandoRC(true)} className="-ml-2">Agregar resultado clave</Button>
          )}

          {/* Evidencias */}
          <div className="border-t border-gray-50 pt-4">
            <p className="eyebrow mb-2 flex items-center gap-1">
              <Link2 size={11} aria-hidden="true" /> Evidencias
            </p>
            {objetivo.evidencias?.length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {objetivo.evidencias.map(ev => (
                  <li key={ev.id} className="flex items-center gap-2 group">
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-cyan-ink hover:underline flex items-center gap-1.5 flex-1 min-w-0">
                      <ExternalLink size={12} className="shrink-0" aria-hidden="true" />
                      <span className="min-w-0 break-all">{ev.descripcion || ev.url}</span>
                    </a>
                    <IconButton
                      label={`Eliminar evidencia ${ev.descripcion || ev.url}`}
                      icono={Trash2}
                      tamanioIcono={14}
                      tono="danger"
                      className={REVELAR_EN_HOVER}
                      onClick={() => eliminarConConfirmacion('¿Eliminar esta evidencia?', () => api.delete(`/objetivos/evidencia/${ev.id}`), () => invalidate('objetivos'))}
                    />
                  </li>
                ))}
              </ul>
            )}
            {agregandoEv ? (
              <div className="flex items-center gap-2 flex-wrap">
                <Input type="url" aria-label="URL de la evidencia" value={nuevaEv.url} onChange={e => setNuevaEv({ ...nuevaEv, url: e.target.value })} placeholder="https://..." className="flex-1 min-w-[200px]" />
                <Input aria-label="Descripción de la evidencia" value={nuevaEv.descripcion} onChange={e => setNuevaEv({ ...nuevaEv, descripcion: e.target.value })} placeholder="Descripción (opcional)" className="flex-1 min-w-[150px]" />
                <IconButton label="Guardar evidencia" icono={Save} tamanioIcono={14} tono="cyan" onClick={crearEvidencia} cargando={guardandoEv} />
                <IconButton label="Cancelar nueva evidencia" icono={X} tamanioIcono={14} onClick={() => setAgregandoEv(false)} />
              </div>
            ) : (
              <Button variante="texto" tamanio="sm" icono={Plus} onClick={() => setAgregandoEv(true)} className="-ml-2">Agregar evidencia</Button>
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
  const [guardandoAct, setGuardandoAct] = useState(false);

  const crearActividad = async () => {
    if (!nuevaAct.descripcion || guardandoAct) return;
    setGuardandoAct(true);
    try {
      await api.post(`/objetivos/actividad/${rc.id}`, nuevaAct);
      setNuevaAct({ descripcion: '', meta_numerica: 1 });
      setAgregandoAct(false);
      invalidate('objetivos');
    } catch {
      toast.error('Error al crear actividad');
    } finally {
      setGuardandoAct(false);
    }
  };

  const actualizarActividad = async (actId, campo, valor) => {
    try {
      await api.put(`/objetivos/actividad/${actId}`, { [campo]: valor });
      invalidate('objetivos');
    } catch { toast.error('Error al actualizar'); }
  };

  return (
    <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
      <p className="text-sm font-semibold text-brand-dark mb-3 break-words">{rc.descripcion}</p>

      {rc.actividades?.length > 0 && (
        <ul className="space-y-2">
          {rc.actividades.map(act => {
            const est = estadoActividad(act.estado);
            const avance = act.meta_numerica > 0 ? Math.min(100, Math.round((act.meta_real / act.meta_numerica) * 100)) : 0;
            return (
              <li key={act.id} className="flex flex-wrap items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100 group">
                <span className="text-xs text-gray-600 flex-1 min-w-[8rem] break-words">{act.descripcion}</span>
                {/* Sin flex-shrink-0: en móvil el grupo pasa a su propia línea y se reparte en vez de desbordar */}
                <div className="flex flex-wrap items-center gap-2">
                  <MetaRealInput
                    valor={act.meta_real}
                    etiqueta={`Avance real de ${act.descripcion}`}
                    onGuardar={(valor) => actualizarActividad(act.id, 'meta_real', valor)}
                  />
                  <span className="text-xs text-gray-500 tabular-nums">/ {Number(act.meta_numerica)}</span>
                  <span className={`text-xs font-bold w-10 text-right tabular-nums ${avance >= 100 ? 'text-green-700' : avance >= 50 ? 'text-amber-700' : 'text-gray-500'}`}>
                    {avance}%
                  </span>
                  <select
                    value={act.estado}
                    onChange={e => actualizarActividad(act.id, 'estado', e.target.value)}
                    aria-label={`Estado de ${act.descripcion}`}
                    className={`px-2 py-1 rounded-md text-xs font-semibold border-0 cursor-pointer ${est.color}`}
                  >
                    {Object.entries(ESTADOS_ACTIVIDAD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                  <IconButton
                    label={`Eliminar actividad ${act.descripcion}`}
                    icono={Trash2}
                    tamanioIcono={14}
                    tono="danger"
                    className={REVELAR_EN_HOVER}
                    onClick={() => eliminarConConfirmacion('¿Eliminar esta actividad?', () => api.delete(`/objetivos/actividad/${act.id}`), () => invalidate('objetivos'))}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {agregandoAct ? (
        <div className="flex items-center gap-2 mt-2">
          <Input
            aria-label="Descripción de la actividad"
            value={nuevaAct.descripcion}
            onChange={e => setNuevaAct({ ...nuevaAct, descripcion: e.target.value })}
            placeholder="Descripción de la actividad"
            className="flex-1 min-w-0"
            onKeyDown={e => e.key === 'Enter' && crearActividad()}
          />
          {/* Input nativo: el ancho fijo no gana al w-full de CAMPO_CLS */}
          <input
            type="number"
            min="0"
            aria-label="Meta numérica"
            title="Meta numérica"
            value={nuevaAct.meta_numerica}
            onChange={e => setNuevaAct({ ...nuevaAct, meta_numerica: e.target.value })}
            className="w-16 shrink-0 px-2 py-2.5 border border-gray-300 rounded-xl bg-white text-base sm:text-sm text-center text-brand-dark outline-none focus:border-brand-cyan-ink focus:ring-2 focus:ring-brand-cyan/40"
            placeholder="Meta"
          />
          <IconButton label="Guardar actividad" icono={Save} tamanioIcono={14} tono="cyan" onClick={crearActividad} cargando={guardandoAct} />
          <IconButton label="Cancelar nueva actividad" icono={X} tamanioIcono={14} onClick={() => setAgregandoAct(false)} />
        </div>
      ) : (
        <Button variante="texto" tamanio="sm" icono={Plus} onClick={() => setAgregandoAct(true)} className="-ml-2 mt-2">Agregar actividad</Button>
      )}
    </div>
  );
};

export default MisObjetivos;
