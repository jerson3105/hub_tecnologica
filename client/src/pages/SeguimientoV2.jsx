import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useProgramas, useEmprendimientos, useInvalidate } from '../hooks/useQueryHooks';
import toast from 'react-hot-toast';
import MetaRealInput from '../components/MetaRealInput';
import { eliminarConConfirmacion, BTN_BORRAR_SUAVE } from '../utils/acciones';
import { formatFecha } from '../utils/fechas';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import BadgeDe from '../components/ui/BadgeDe';
import { ESTADOS_AVANCE, ESTADOS_ACTIVIDAD, TIPOS_OBJETIVO, estadoDe, estadoActividad } from '../constants/estados';
import { tipoSesion } from '../constants/sesiones';
import {
  ClipboardList, ChevronRight, Target, Calendar,
  Plus, Trash2, ExternalLink, Link2, FolderKanban, Rocket, Edit3, Save, X, AlertCircle,
  Video, FileSearch, BookOpen, Presentation, UserCheck
} from 'lucide-react';

const TAB_CLS = (active) => `px-4 py-2.5 text-sm font-medium rounded-xl transition-all whitespace-nowrap ${active ? 'bg-brand-dark text-white shadow-sm' : 'text-gray-500 hover:bg-gray-100'}`;

const BadgeAvance = ({ estado }) => {
  const avance = estadoDe(ESTADOS_AVANCE, estado, { label: estado.replace('_', ' '), tono: 'neutral' });
  return <Badge tono={avance.tono} className="shrink-0">{avance.label}</Badge>;
};

const BadgeEstado = ({ estado }) => {
  const est = estadoActividad(estado);
  return <Badge tono={est.tono} forma="tag" className="shrink-0">{est.label}</Badge>;
};

const LINK_CATEGORIA_LABELS = {
  grabacion: 'Grabación',
  taller: 'Taller',
  entregable: 'Entregable',
  bmc: 'BMC',
  otro: 'Otro'
};

// Referencia estable para que los useMemo no se recalculen en cada render
const SIN_DATOS = [];

const PESTANAS = ['timeline', 'diagnosticos', 'talleres', '1a1_programa', '1a1_taller', 'objetivos'];

const SeguimientoV2 = () => {
  const { data: programas = [] } = useProgramas();
  // Programa, emprendimiento y pestaña viven en la URL (?programa=&emp=&tab=): sobreviven a
  // una recarga y se pueden compartir o abrir desde otra página.
  const [searchParams, setSearchParams] = useSearchParams();
  const filtroPrograma = searchParams.get('programa') || '';
  const filtroEmp = searchParams.get('emp') || '';
  const tab = PESTANAS.includes(searchParams.get('tab')) ? searchParams.get('tab') : 'timeline';
  const actualizarUrl = (cambios) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(cambios).forEach(([clave, valor]) => {
        if (valor) next.set(clave, valor);
        else next.delete(clave);
      });
      return next;
    }, { replace: true });
  };
  const setFiltroPrograma = (valor) => actualizarUrl({ programa: valor, emp: '' });
  const setFiltroEmp = (valor) => actualizarUrl({ emp: valor });
  const setTab = (valor) => actualizarUrl({ tab: valor === 'timeline' ? '' : valor });
  const invalidate = useInvalidate();

  const empParams = filtroPrograma ? { programa_id: filtroPrograma } : {};
  const { data: emprendimientos = [] } = useEmprendimientos(empParams);

  const empSeleccionado = emprendimientos.find(e => String(e.id) === String(filtroEmp));

  // Timeline data (all seguimientos with sessions)
  const { data: timelineData, isLoading: cargandoTimeline } = useQuery({
    queryKey: ['timeline', filtroEmp],
    queryFn: () => api.get(`/compromisos/timeline/${filtroEmp}`).then(r => r.data.seguimientos),
    enabled: !!filtroEmp
  });

  // Objetivos OKR
  const { data: objetivosData, isLoading: cargandoObjetivos } = useQuery({
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

  const timeline = timelineData || SIN_DATOS;
  const objetivos = objetivosData || SIN_DATOS;
  const pendientes = pendientesData || SIN_DATOS;

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
          <div className="p-2 bg-brand-cyan/10 rounded-xl"><ClipboardList size={22} className="text-brand-cyan-ink" aria-hidden="true" /></div>
          Seguimiento
        </h1>
        <p className="text-gray-500 mt-1 sm:ml-12">Seguimiento integral de emprendimientos</p>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Programa">
            <Select id="seg-filtro-programa" value={filtroPrograma} onChange={(e) => setFiltroPrograma(e.target.value)}>
              <option value="">Todos los programas</option>
              {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
          </Field>
          <Field label="Emprendimiento">
            <Select id="seg-filtro-emp" value={filtroEmp} onChange={(e) => setFiltroEmp(e.target.value)}>
              <option value="">Seleccionar emprendimiento</option>
              {emprendimientos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
            </Select>
          </Field>
        </div>
      </div>

      {!filtroEmp ? (
        <EmptyState
          icono={Rocket}
          titulo="Selecciona un emprendimiento"
          descripcion="Elige un programa y emprendimiento para ver su seguimiento"
        />
      ) : (
        <>
          {/* Info del emprendimiento */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-green/10 flex items-center justify-center text-brand-green-ink font-bold text-xl shrink-0" aria-hidden="true">
                {empSeleccionado?.nombre?.charAt(0)}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-brand-dark text-lg">{empSeleccionado?.nombre}</h2>
                <div className="flex flex-wrap items-center gap-x-2 text-sm text-gray-500">
                  <FolderKanban size={14} className="text-brand-purple" aria-hidden="true" />
                  <span>{empSeleccionado?.programa?.nombre}</span>
                  {empSeleccionado?.sector && <><span aria-hidden="true">·</span><span>{empSeleccionado.sector}</span></>}
                </div>
              </div>
              {pendientes.length > 0 && (
                <Badge tono="amber" icono={AlertCircle} className="sm:ml-auto">
                  {pendientes.length} compromiso(s) pendiente(s)
                </Badge>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap" role="tablist" aria-label="Secciones del seguimiento">
            {[
              { key: 'timeline', label: 'Timeline' },
              { key: 'diagnosticos', label: 'Diagnósticos', count: counts.diagnosticas },
              { key: 'talleres', label: 'Talleres', count: counts.talleres },
              { key: '1a1_programa', label: '1 a 1 Programa', count: counts.programa },
              { key: '1a1_taller', label: '1 a 1 Taller', count: counts.taller11 },
              { key: 'objetivos', label: 'Objetivos OKR' }
            ].map(t => (
              <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={TAB_CLS(tab === t.key)}>
                {t.label} {t.count > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs tabular-nums ${tab === t.key ? 'bg-white/20' : 'bg-gray-200 text-gray-700'}`}>{t.count}</span>}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {cargandoTimeline || (tab === 'objetivos' && cargandoObjetivos) ? (
            <div className="flex items-center justify-center h-40" role="status" aria-label="Cargando">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-cyan"></div>
            </div>
          ) : (
            <>
              {tab === 'timeline' && <TimelineTab timeline={timeline} pendientes={pendientes} />}
              {tab === 'diagnosticos' && <DiagnosticosTab sesiones={diagnosticas} invalidate={invalidate} />}
              {tab === 'talleres' && <TalleresTab sesiones={talleres} invalidate={invalidate} />}
              {tab === '1a1_programa' && <SesionesEditableTab sesiones={unoAUnoPrograma} invalidate={invalidate} tipo="programa" />}
              {tab === '1a1_taller' && <SesionesEditableTab sesiones={unoAUnoTaller} invalidate={invalidate} tipo="taller" />}
              {tab === 'objetivos' && <ObjetivosTab objetivos={objetivos} invalidate={invalidate} />}
            </>
          )}
        </>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: TIMELINE (all session types, chronological)
// ═══════════════════════════════════════════════════════════
const TimelineTab = ({ timeline, pendientes }) => {
  if (timeline.length === 0) {
    return (
      <EmptyState
        icono={Calendar}
        tono="neutral"
        compacto
        titulo="No hay sesiones registradas"
        descripcion="Las sesiones del programa aparecerán aquí en orden cronológico"
      />
    );
  }

  return (
    <div className="space-y-1">
      {/* Compromisos pendientes destacados */}
      {pendientes.length > 0 && (
        <section aria-labelledby="titulo-pendientes" className="bg-amber-50 border border-amber-200 rounded-2xl p-4 sm:p-5 mb-4">
          <h3 id="titulo-pendientes" className="font-bold text-amber-800 text-sm flex items-center gap-2 mb-3">
            <AlertCircle size={16} aria-hidden="true" /> Compromisos pendientes de sesiones anteriores
          </h3>
          <ul className="space-y-2">
            {pendientes.map(c => (
              <li key={c.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 bg-white rounded-xl px-4 py-2.5 border border-amber-100">
                <span className={`w-2 h-2 rounded-full shrink-0 ${estadoActividad(c.estado).dot}`} aria-hidden="true"></span>
                <span className="text-sm text-gray-700 flex-1 min-w-[10rem]">{c.descripcion}</span>
                <span className="text-xs text-gray-500 basis-full sm:basis-auto pl-5 sm:pl-0">
                  Sesión: {c.seguimientoOrigen?.sesion?.titulo}
                </span>
                <BadgeEstado estado={c.estado} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Timeline */}
      <div className="relative">
        <div className="absolute left-3 sm:left-6 top-0 bottom-0 w-0.5 bg-gray-200" aria-hidden="true"></div>
        <ol className="space-y-6">
          {timeline.map((seg) => {
            const tipoMeta = tipoSesion(seg.sesion?.tipo);
            return (
              <li key={seg.id} className="relative pl-9 sm:pl-14">
                <div className="absolute left-1 sm:left-4 top-5 w-5 h-5 rounded-full bg-white border-2 border-brand-cyan flex items-center justify-center z-10" aria-hidden="true">
                  <div className="w-2 h-2 rounded-full bg-brand-cyan"></div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-5 shadow-sm">
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge tono={tipoMeta.tono} forma="tag" icono={tipoMeta.icono}>{tipoMeta.label}</Badge>
                      </div>
                      <h4 className="font-bold text-brand-dark">{seg.sesion?.titulo}</h4>
                      <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1">
                        <Calendar size={12} aria-hidden="true" /> {formatFecha(seg.sesion?.fecha)}
                        {seg.enlace_grabacion && (
                          <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-brand-cyan-ink hover:underline flex items-center gap-1 ml-2">
                            <Video size={12} aria-hidden="true" /> Grabación
                          </a>
                        )}
                      </p>
                    </div>
                    {seg.estado_avance && seg.estado_avance !== 'sin_iniciar' && (
                      <BadgeAvance estado={seg.estado_avance} />
                    )}
                  </div>

                  {seg.realizado && (
                    <div className="mb-3">
                      <p className="eyebrow mb-1">Lo trabajado</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{seg.realizado}</p>
                    </div>
                  )}

                  {seg.observaciones && (
                    <div className="mb-3">
                      <p className="eyebrow mb-1">Observaciones</p>
                      <p className="text-sm text-gray-500 whitespace-pre-line">{seg.observaciones}</p>
                    </div>
                  )}

                  {seg.compromisoItems?.length > 0 && (
                    <div>
                      <p className="eyebrow mb-2">Compromisos</p>
                      <ul className="space-y-1.5">
                        {seg.compromisoItems.map(c => {
                          const est = estadoActividad(c.estado);
                          return (
                            <li key={c.id} className="flex flex-wrap items-center gap-2.5 text-sm">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${est.dot}`} aria-hidden="true"></span>
                              <span className="flex-1 min-w-[8rem] text-gray-700">{c.descripcion}</span>
                              <BadgeEstado estado={c.estado} />
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: DIAGNÓSTICOS (read-only view of diagnostic sessions)
// ═══════════════════════════════════════════════════════════
const DiagnosticosTab = ({ sesiones, invalidate }) => {
  const [editandoSeg, setEditandoSeg] = useState(null);
  const [formSeg, setFormSeg] = useState({ realizado: '', observaciones: '', enlace_grabacion: '' });
  const [formEnlace, setFormEnlace] = useState({ nombre: '', url: '', categoria: 'otro' });
  const [guardandoEnlace, setGuardandoEnlace] = useState(false);
  const [eliminandoEnlaceId, setEliminandoEnlaceId] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const iniciarEdicion = (seg) => {
    setEditandoSeg(seg.id);
    setFormSeg({
      realizado: seg.realizado || '',
      observaciones: seg.observaciones || '',
      enlace_grabacion: seg.enlace_grabacion || ''
    });
    setFormEnlace({ nombre: '', url: '', categoria: 'otro' });
  };

  const cancelarEdicion = () => {
    setEditandoSeg(null);
    setFormEnlace({ nombre: '', url: '', categoria: 'otro' });
    setEliminandoEnlaceId(null);
  };

  const obtenerEnlacesSesion = (seg) => (seg.sesion?.archivos || []).filter((archivo) => archivo.tipo === 'enlace' && archivo.url);

  const guardarSeguimiento = async (segId) => {
    setGuardando(true);
    try {
      await api.put(`/seguimientos/${segId}`, formSeg);
      toast.success('Diagnóstico actualizado');
      cancelarEdicion();
      invalidate('timeline');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const agregarEnlace = async (seg) => {
    if (!formEnlace.nombre.trim() || !formEnlace.url.trim()) {
      toast.error('Nombre y URL son requeridos');
      return;
    }

    setGuardandoEnlace(true);
    try {
      await api.post('/archivos/enlace', {
        nombre: formEnlace.nombre.trim(),
        url: formEnlace.url.trim(),
        categoria: formEnlace.categoria,
        emprendimiento_ids: [seg.emprendimiento_id],
        sesion_id: seg.sesion?.id
      });
      toast.success('Enlace agregado al diagnóstico');
      setFormEnlace({ nombre: '', url: '', categoria: 'otro' });
      invalidate('timeline');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al agregar enlace');
    } finally {
      setGuardandoEnlace(false);
    }
  };

  const eliminarEnlace = async (archivoId) => {
    if (!window.confirm('¿Eliminar este enlace del diagnóstico?')) {
      return;
    }

    setEliminandoEnlaceId(archivoId);
    try {
      await api.delete(`/archivos/${archivoId}`);
      toast.success('Enlace eliminado');
      invalidate('timeline');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al eliminar enlace');
    } finally {
      setEliminandoEnlaceId(null);
    }
  };

  const ordenDiag = { diagnostica_1: 1, diagnostica_2: 2, diagnostica_final: 3 };
  const sorted = [...sesiones].sort((a, b) => (ordenDiag[a.sesion?.tipo] || 0) - (ordenDiag[b.sesion?.tipo] || 0));

  if (sorted.length === 0) {
    return (
      <EmptyState
        icono={FileSearch}
        tono="purple"
        compacto
        titulo="No hay sesiones diagnósticas"
        descripcion="Las sesiones de tipo diagnóstica aparecerán aquí cuando se creen en el programa"
      />
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Sesiones diagnósticas del programa: evaluación inicial, intermedia y final del emprendimiento.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {['diagnostica_1', 'diagnostica_2', 'diagnostica_final'].map(tipo => {
          const seg = sorted.find(s => s.sesion?.tipo === tipo);
          const meta = tipoSesion(tipo);
          const TipoIcon = meta.icono;
          const esEditando = editandoSeg === seg?.id;
          const enlacesAdicionales = seg ? obtenerEnlacesSesion(seg) : [];

          return (
            <div key={tipo} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${seg ? 'border-gray-100' : 'border-dashed border-gray-200'}`}>
              <div className={`px-4 py-3 border-b flex items-center gap-2 ${seg ? 'bg-purple-50 border-purple-100' : 'bg-gray-50 border-gray-100'}`}>
                <TipoIcon size={14} className={seg ? 'text-purple-600' : 'text-gray-500'} aria-hidden="true" />
                <h3 className={`text-sm font-bold ${seg ? 'text-purple-800' : 'text-gray-500'}`}>{meta.label}</h3>
              </div>
              {seg ? (
                <div className="p-4 space-y-3">
                  <div>
                    <h4 className="font-semibold text-brand-dark text-sm">{seg.sesion?.titulo}</h4>
                    <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Calendar size={12} aria-hidden="true" /> {formatFecha(seg.sesion?.fecha)}</p>
                  </div>
                  {esEditando ? (
                    <>
                      <Field label="Resultados / Hallazgos">
                        <Textarea value={formSeg.realizado} onChange={e => setFormSeg({ ...formSeg, realizado: e.target.value })} rows={3} className="resize-y" placeholder="Resultados del diagnóstico..." />
                      </Field>
                      <Field label="Observaciones">
                        <Textarea value={formSeg.observaciones} onChange={e => setFormSeg({ ...formSeg, observaciones: e.target.value })} rows={2} className="resize-y" placeholder="Observaciones..." />
                      </Field>
                      <Field label="Grabación principal">
                        <Input
                          type="url"
                          value={formSeg.enlace_grabacion}
                          onChange={e => setFormSeg({ ...formSeg, enlace_grabacion: e.target.value })}
                          placeholder="https://drive.google.com/... o https://zoom.us/..."
                        />
                      </Field>
                      <fieldset className="border-t border-gray-100 pt-3 space-y-3">
                        <legend className="eyebrow flex items-center gap-1.5 pt-3">
                          <Link2 size={12} aria-hidden="true" /> Enlaces adicionales
                        </legend>

                        {enlacesAdicionales.length > 0 ? (
                          <ul className="space-y-2">
                            {enlacesAdicionales.map((archivo) => (
                              <li key={archivo.id} className="flex items-start justify-between gap-2 rounded-xl border border-gray-100 pl-3 pr-1 py-1">
                                <div className="min-w-0 py-1">
                                  <a href={archivo.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-brand-cyan-ink hover:underline break-all inline-flex items-center gap-1.5">
                                    <ExternalLink size={12} aria-hidden="true" /> {archivo.nombre_original}
                                  </a>
                                  <p className="text-xs text-gray-500 mt-1">{LINK_CATEGORIA_LABELS[archivo.categoria] || 'Enlace'}</p>
                                </div>
                                <IconButton
                                  label={`Eliminar enlace ${archivo.nombre_original}`}
                                  icono={Trash2}
                                  tamanioIcono={14}
                                  tono="danger"
                                  onClick={() => eliminarEnlace(archivo.id)}
                                  cargando={eliminandoEnlaceId === archivo.id}
                                />
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Sin enlaces adicionales</p>
                        )}

                        <div className="grid grid-cols-1 gap-2">
                          <Input
                            type="text"
                            aria-label="Nombre del enlace"
                            value={formEnlace.nombre}
                            onChange={e => setFormEnlace({ ...formEnlace, nombre: e.target.value })}
                            placeholder="Nombre del enlace"
                          />
                          <Input
                            type="url"
                            aria-label="URL del enlace"
                            value={formEnlace.url}
                            onChange={e => setFormEnlace({ ...formEnlace, url: e.target.value })}
                            placeholder="https://..."
                          />
                          <Select
                            aria-label="Categoría del enlace"
                            value={formEnlace.categoria}
                            onChange={e => setFormEnlace({ ...formEnlace, categoria: e.target.value })}
                          >
                            <option value="otro">Enlace adicional</option>
                            <option value="grabacion">Grabación</option>
                            <option value="entregable">Entregable</option>
                            <option value="taller">Taller</option>
                            <option value="bmc">BMC</option>
                          </Select>
                        </div>

                        <div className="flex justify-end">
                          <Button variante="accent" tamanio="sm" icono={Plus} cargando={guardandoEnlace} onClick={() => agregarEnlace(seg)}>
                            {guardandoEnlace ? 'Agregando...' : 'Agregar enlace'}
                          </Button>
                        </div>
                      </fieldset>
                      <div className="flex justify-end gap-2">
                        <Button variante="ghost" tamanio="sm" onClick={cancelarEdicion}>Cancelar</Button>
                        <Button tamanio="sm" icono={Save} cargando={guardando} onClick={() => guardarSeguimiento(seg.id)}>Guardar</Button>
                      </div>
                    </>
                  ) : (
                    <>
                      {seg.realizado ? (
                        <div>
                          <p className="eyebrow mb-1">Resultados / Hallazgos</p>
                          <p className="text-sm text-gray-600 whitespace-pre-line">{seg.realizado}</p>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Sin resultados registrados</p>
                      )}
                      {seg.observaciones && (
                        <div>
                          <p className="eyebrow mb-1">Observaciones</p>
                          <p className="text-xs text-gray-500 whitespace-pre-line">{seg.observaciones}</p>
                        </div>
                      )}
                      <div>
                        <p className="eyebrow mb-1 flex items-center gap-1"><Video size={12} aria-hidden="true" /> Grabación principal</p>
                        {seg.enlace_grabacion ? (
                          <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-cyan-ink hover:underline flex items-center gap-1 break-all">
                            <Video size={12} aria-hidden="true" /> {seg.enlace_grabacion}
                          </a>
                        ) : (
                          <p className="text-xs text-gray-500 italic">Sin grabación registrada</p>
                        )}
                      </div>
                      {enlacesAdicionales.length > 0 && (
                        <div>
                          <p className="eyebrow mb-1 flex items-center gap-1"><Link2 size={12} aria-hidden="true" /> Enlaces adicionales</p>
                          <div className="space-y-1.5">
                            {enlacesAdicionales.map((archivo) => (
                              <a key={archivo.id} href={archivo.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-brand-cyan-ink hover:underline break-all">
                                <ExternalLink size={12} aria-hidden="true" />
                                <span>{archivo.nombre_original}</span>
                                <span className="text-xs text-gray-500">({LINK_CATEGORIA_LABELS[archivo.categoria] || 'Enlace'})</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      <Button variante="texto" tono="purple" tamanio="sm" icono={Edit3} onClick={() => iniciarEdicion(seg)} aria-label={`Editar ${meta.label}`} className="-ml-2">Editar</Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center">
                  <p className="text-xs text-gray-500">Aún no hay una sesión de este tipo</p>
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
  const [guardando, setGuardando] = useState(false);

  const guardarSeguimiento = async (segId) => {
    setGuardando(true);
    try {
      await api.put(`/seguimientos/${segId}`, formSeg);
      toast.success('Taller actualizado');
      setEditandoSeg(null);
      invalidate('timeline');
    } catch {
      toast.error('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  if (sesiones.length === 0) {
    return (
      <EmptyState
        icono={Presentation}
        tono="neutral"
        compacto
        titulo="No hay talleres registrados"
        descripcion="Las sesiones de tipo taller aparecerán aquí"
      />
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">Talleres del programa: sesiones grupales de formación y capacitación.</p>
      {sesiones.map((seg) => {
        const esEditando = editandoSeg === seg.id;
        return (
          <div key={seg.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="bg-blue-50 px-4 sm:px-5 py-3 border-b border-blue-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                  <Presentation size={16} className="text-blue-600" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-brand-dark text-sm">{seg.sesion?.titulo}</h4>
                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Calendar size={12} aria-hidden="true" /> {formatFecha(seg.sesion?.fecha)}</p>
                </div>
              </div>
              {!esEditando && (
                <IconButton
                  label={`Editar ${seg.sesion?.titulo || 'taller'}`}
                  icono={Edit3}
                  tamanioIcono={14}
                  tono="purple"
                  onClick={() => { setEditandoSeg(seg.id); setFormSeg({ realizado: seg.realizado || '', observaciones: seg.observaciones || '' }); }}
                />
              )}
            </div>
            <div className="p-4 sm:p-5 space-y-3">
              {esEditando ? (
                <>
                  <Field label="Temas trabajados">
                    <Textarea value={formSeg.realizado} onChange={e => setFormSeg({ ...formSeg, realizado: e.target.value })} rows={3} className="resize-y" placeholder="Temas trabajados en el taller..." />
                  </Field>
                  <Field label="Observaciones">
                    <Textarea value={formSeg.observaciones} onChange={e => setFormSeg({ ...formSeg, observaciones: e.target.value })} rows={2} className="resize-y" placeholder="Observaciones..." />
                  </Field>
                  <div className="flex justify-end gap-2">
                    <Button variante="ghost" onClick={() => setEditandoSeg(null)}>Cancelar</Button>
                    <Button icono={Save} cargando={guardando} onClick={() => guardarSeguimiento(seg.id)}>Guardar</Button>
                  </div>
                </>
              ) : (
                <>
                  {seg.realizado ? (
                    <div>
                      <p className="eyebrow mb-1">Temas trabajados</p>
                      <p className="text-sm text-gray-600 whitespace-pre-line">{seg.realizado}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Sin registro de temas trabajados</p>
                  )}
                  {seg.observaciones && (
                    <div>
                      <p className="eyebrow mb-1">Observaciones</p>
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
        <EmptyState
          icono={Target}
          tono="neutral"
          compacto
          titulo="No hay objetivos registrados"
          descripcion={'El emprendedor puede crear objetivos OKR desde su vista "Mis Objetivos"'}
        />
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
      {/* Header: el título despliega/oculta; borrar es un botón aparte (no anidado) */}
      <div className="p-4 sm:p-5 flex items-start gap-2">
        <button
          type="button"
          aria-expanded={expandido}
          aria-controls={`objetivo-${objetivo.id}-detalle`}
          onClick={() => setExpandido(!expandido)}
          className="flex items-start justify-between gap-3 flex-1 min-w-0 text-left rounded-xl"
        >
          <span className="flex items-start gap-3 flex-1 min-w-0">
            <span className="w-10 h-10 rounded-xl bg-brand-cyan/10 flex items-center justify-center shrink-0 mt-0.5" aria-hidden="true">
              <Target size={18} className="text-brand-cyan-ink" />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-bold text-brand-dark">{objetivo.titulo}</span>
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
          <span className="flex items-center gap-2 shrink-0">
            <span className="text-center">
              <span className={`block text-lg font-bold tabular-nums ${avanceTotal >= 80 ? 'text-green-700' : avanceTotal >= 40 ? 'text-amber-700' : 'text-gray-500'}`}>
                {avanceTotal}%
              </span>
              <span className="block text-xs text-gray-500">Avance</span>
            </span>
            <ChevronRight size={16} className={`text-gray-500 transition-transform ${expandido ? 'rotate-90' : ''}`} aria-hidden="true" />
          </span>
        </button>
        <IconButton label={`Eliminar objetivo ${objetivo.titulo}`} icono={Trash2} tamanioIcono={14} tono="danger" onClick={eliminarObj} />
      </div>

      {/* Contenido expandido */}
      {expandido && (
        <div id={`objetivo-${objetivo.id}-detalle`} className="border-t border-gray-100 p-4 sm:p-5 space-y-4">
          {/* Resultados Clave */}
          {objetivo.resultadosClave?.map(rc => (
            <ResultadoClaveCard key={rc.id} rc={rc} invalidate={invalidate} />
          ))}

          {/* Agregar RC */}
          {agregandoRC ? (
            <div className="flex gap-2">
              <Input aria-label="Descripción del resultado clave" value={nuevoRC} onChange={e => setNuevoRC(e.target.value)} placeholder="Descripción del resultado clave..." className="flex-1" onKeyDown={e => e.key === 'Enter' && crearRC()} />
              <IconButton label="Guardar resultado clave" icono={Save} tamanioIcono={14} tono="cyan" onClick={crearRC} />
              <IconButton label="Cancelar" icono={X} tamanioIcono={14} onClick={() => setAgregandoRC(false)} />
            </div>
          ) : (
            <Button variante="texto" icono={Plus} onClick={() => setAgregandoRC(true)} className="-ml-2">Agregar resultado clave</Button>
          )}

          {/* Evidencias */}
          <div className="border-t border-gray-50 pt-4">
            <p className="eyebrow mb-2 flex items-center gap-1">
              <Link2 size={12} aria-hidden="true" /> Evidencias
            </p>
            {objetivo.evidencias?.length > 0 && (
              <ul className="space-y-1.5 mb-3">
                {objetivo.evidencias.map(ev => (
                  <li key={ev.id} className="flex items-center gap-2 group">
                    <a href={ev.url} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-cyan-ink hover:underline flex items-center gap-1.5 flex-1 min-w-0 break-all">
                      <ExternalLink size={12} className="shrink-0" aria-hidden="true" /> {ev.descripcion || ev.url}
                    </a>
                    <button
                      type="button"
                      onClick={() => eliminarConConfirmacion('¿Eliminar esta evidencia?', () => api.delete(`/objetivos/evidencia/${ev.id}`), () => invalidate('objetivos'))}
                      aria-label={`Eliminar evidencia ${ev.descripcion || ev.url}`}
                      title="Eliminar evidencia"
                      className={BTN_BORRAR_SUAVE}
                    >
                      <Trash2 size={12} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {agregandoEv ? (
              <div className="flex gap-2 flex-wrap">
                <Input type="url" aria-label="URL de la evidencia" value={nuevaEv.url} onChange={e => setNuevaEv({ ...nuevaEv, url: e.target.value })} placeholder="https://..." className="flex-1 min-w-[12rem]" />
                <Input aria-label="Descripción de la evidencia" value={nuevaEv.descripcion} onChange={e => setNuevaEv({ ...nuevaEv, descripcion: e.target.value })} placeholder="Descripción (opcional)" className="flex-1 min-w-[10rem]" />
                <IconButton label="Guardar evidencia" icono={Save} tamanioIcono={14} tono="cyan" onClick={crearEvidencia} />
                <IconButton label="Cancelar" icono={X} tamanioIcono={14} onClick={() => setAgregandoEv(false)} />
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
        <p className="text-sm font-semibold text-brand-dark pt-2.5">{rc.descripcion}</p>
        <IconButton label={`Eliminar resultado clave ${rc.descripcion}`} icono={Trash2} tamanioIcono={14} tono="danger" onClick={eliminarRC} className="shrink-0" />
      </div>

      {/* Actividades */}
      <ul className="space-y-2">
        {rc.actividades?.map(act => {
          const est = estadoActividad(act.estado);
          const avance = act.meta_numerica > 0 ? Math.min(100, Math.round((act.meta_real / act.meta_numerica) * 100)) : 0;
          return (
            <li key={act.id} className="flex flex-wrap items-center gap-2 bg-white rounded-lg px-3 py-2 border border-gray-100 group">
              <span className="text-xs text-gray-600 flex-1 min-w-[8rem]">{act.descripcion}</span>
              <div className="flex items-center gap-2 flex-shrink-0">
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
                <button
                  type="button"
                  onClick={() => eliminarConConfirmacion('¿Eliminar esta actividad?', () => api.delete(`/objetivos/actividad/${act.id}`), () => invalidate('objetivos'))}
                  aria-label={`Eliminar actividad ${act.descripcion}`}
                  title="Eliminar actividad"
                  className={BTN_BORRAR_SUAVE}
                >
                  <Trash2 size={12} aria-hidden="true" />
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Agregar actividad */}
      {agregandoAct ? (
        <div className="flex flex-wrap sm:flex-nowrap gap-2 mt-2">
          <Input aria-label="Descripción de la actividad" value={nuevaAct.descripcion} onChange={e => setNuevaAct({ ...nuevaAct, descripcion: e.target.value })} placeholder="Descripción de la actividad" className="flex-1 min-w-[10rem]" onKeyDown={e => e.key === 'Enter' && crearActividad()} />
          <div className="w-20 shrink-0">
            <Input type="number" min="0" aria-label="Meta numérica" title="Meta numérica" value={nuevaAct.meta_numerica} onChange={e => setNuevaAct({ ...nuevaAct, meta_numerica: e.target.value })} className="text-center" placeholder="Meta" />
          </div>
          <IconButton label="Guardar actividad" icono={Save} tamanioIcono={14} tono="cyan" onClick={crearActividad} />
          <IconButton label="Cancelar" icono={X} tamanioIcono={14} onClick={() => setAgregandoAct(false)} />
        </div>
      ) : (
        <Button variante="texto" tamanio="sm" icono={Plus} onClick={() => setAgregandoAct(true)} className="-ml-2 mt-2">Agregar actividad</Button>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════
// TAB: SESIONES 1 A 1 (Programa y Taller) — editable con compromisos
// ═══════════════════════════════════════════════════════════
const SesionesEditableTab = ({ sesiones, invalidate, tipo }) => {
  const [editandoSeg, setEditandoSeg] = useState(null);
  const [formSeg, setFormSeg] = useState({ realizado: '', observaciones: '', comentario_emprendedor: '', comentario_tallerista: '', enlace_grabacion: '' });
  // Un borrador por sesión: antes un único estado hacía que el texto apareciera en todas las tarjetas
  const [nuevosCompromisos, setNuevosCompromisos] = useState({});
  const [guardando, setGuardando] = useState(false);
  const setNuevoCompromiso = (segId, texto) => setNuevosCompromisos(prev => ({ ...prev, [segId]: texto }));

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
    setGuardando(true);
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
    } catch {
      toast.error('Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const agregarCompromiso = async (segId) => {
    const descripcion = (nuevosCompromisos[segId] || '').trim();
    if (!descripcion) return;
    try {
      await api.post(`/compromisos/seguimiento/${segId}`, { descripcion });
      setNuevoCompromiso(segId, '');
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
      <EmptyState
        icono={HeaderIcon}
        tono={esTaller ? 'green' : 'cyan'}
        compacto
        titulo={`No hay ${emptyLabel} registradas`}
        descripcion="Aparecerán aquí cuando se creen sesiones de este tipo en el programa"
      />
    );
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        {esTaller
          ? 'Sesiones individuales de seguimiento post-taller con cada emprendimiento.'
          : 'Sesiones continuas 1 a 1 del programa con el emprendimiento. Aquí se registran avances y compromisos entre sesiones.'}
      </p>
      {sesiones.map((seg) => {
        const esEditando = editandoSeg === seg.id;
        return (
          <article key={seg.id} aria-labelledby={`sesion-${seg.id}-titulo`} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className={`px-4 sm:px-5 py-3 border-b flex flex-wrap items-center justify-between gap-2 ${headerBg}`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg ${headerIconBg} flex items-center justify-center shrink-0`} aria-hidden="true">
                  <HeaderIcon size={16} className={headerIconColor} />
                </div>
                <div className="min-w-0">
                  <h4 id={`sesion-${seg.id}-titulo`} className="font-bold text-brand-dark text-sm">{seg.sesion?.titulo}</h4>
                  <p className="text-xs text-gray-500 flex flex-wrap items-center gap-x-1.5 gap-y-1 mt-0.5">
                    <Calendar size={12} aria-hidden="true" /> {formatFecha(seg.sesion?.fecha)}
                    {seg.enlace_grabacion && (
                      <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-brand-cyan-ink hover:underline flex items-center gap-1 ml-2">
                        <Video size={12} aria-hidden="true" /> Ver grabación
                      </a>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-auto">
                {seg.estado_avance && seg.estado_avance !== 'sin_iniciar' && (
                  <BadgeAvance estado={seg.estado_avance} />
                )}
                {!esEditando && (
                  <IconButton label={`Editar ${seg.sesion?.titulo || 'sesión'}`} icono={Edit3} tamanioIcono={14} tono="purple" onClick={() => iniciarEdicion(seg)} />
                )}
              </div>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {esEditando ? (
                <>
                  <Field label="Lo trabajado en esta sesión">
                    <Textarea value={formSeg.realizado} onChange={e => setFormSeg({ ...formSeg, realizado: e.target.value })} rows={3} className="resize-y" placeholder="Describe lo trabajado..." />
                  </Field>
                  <Field label="Observaciones">
                    <Textarea value={formSeg.observaciones} onChange={e => setFormSeg({ ...formSeg, observaciones: e.target.value })} rows={2} className="resize-y" placeholder="Observaciones..." />
                  </Field>
                  <Field label="Enlace de grabación">
                    <Input
                      type="url"
                      value={formSeg.enlace_grabacion}
                      onChange={e => setFormSeg({ ...formSeg, enlace_grabacion: e.target.value })}
                      placeholder="https://meet.google.com/... o https://zoom.us/..."
                    />
                  </Field>
                  {esTaller && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                      <Field label="Comentario del emprendedor">
                        <Textarea value={formSeg.comentario_emprendedor} onChange={e => setFormSeg({ ...formSeg, comentario_emprendedor: e.target.value })} rows={2} className="resize-y" placeholder="¿Qué dice el emprendedor?" />
                      </Field>
                      <Field label="Comentario del tallerista">
                        <Textarea value={formSeg.comentario_tallerista} onChange={e => setFormSeg({ ...formSeg, comentario_tallerista: e.target.value })} rows={2} className="resize-y" placeholder="¿Qué dice el tallerista?" />
                      </Field>
                    </div>
                  )}
                  <div className="flex justify-end gap-2">
                    <Button variante="ghost" onClick={() => setEditandoSeg(null)}>Cancelar</Button>
                    <Button icono={Save} cargando={guardando} onClick={() => guardarSeguimiento(seg.id)}>Guardar</Button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="eyebrow mb-1.5">Lo trabajado en esta sesión</p>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{seg.realizado || <span className="text-gray-500 italic">Sin registrar</span>}</p>
                  </div>
                  <div>
                    <p className="eyebrow mb-1.5">Observaciones</p>
                    <p className="text-sm text-gray-500 whitespace-pre-line">{seg.observaciones || <span className="italic">Sin observaciones</span>}</p>
                  </div>
                  <div>
                    <p className="eyebrow mb-1.5 flex items-center gap-1">
                      <Video size={12} aria-hidden="true" /> Enlace de grabación
                    </p>
                    {seg.enlace_grabacion ? (
                      <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-cyan-ink hover:underline flex items-center gap-1.5 break-all">
                        <Video size={14} className="shrink-0" aria-hidden="true" /> {seg.enlace_grabacion}
                      </a>
                    ) : (
                      <p className="text-sm text-gray-500 italic">Sin grabación</p>
                    )}
                  </div>
                  {esTaller && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
                      <div>
                        <p className="eyebrow mb-1.5">Comentario del emprendedor</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{seg.comentario_emprendedor || <span className="text-gray-500 italic">Sin comentario</span>}</p>
                      </div>
                      <div>
                        <p className="eyebrow mb-1.5">Comentario del tallerista</p>
                        <p className="text-sm text-gray-600 whitespace-pre-line">{seg.comentario_tallerista || <span className="text-gray-500 italic">Sin comentario</span>}</p>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Compromisos */}
              <div className="border-t border-gray-100 pt-4">
                <p className="eyebrow mb-2" id={`compromisos-${seg.id}`}>Compromisos para la siguiente sesión</p>
                <ul className="space-y-2" aria-labelledby={`compromisos-${seg.id}`}>
                  {seg.compromisoItems?.map(c => {
                    const est = estadoActividad(c.estado);
                    return (
                      <li key={c.id} className="flex flex-wrap items-center gap-2.5 bg-gray-50 rounded-lg px-3 py-2 group">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${est.dot}`} aria-hidden="true"></span>
                        <span className="text-sm text-gray-700 flex-1 min-w-[8rem]">{c.descripcion}</span>
                        <select
                          value={c.estado}
                          onChange={e => actualizarCompromiso(c.id, e.target.value)}
                          aria-label={`Estado del compromiso ${c.descripcion}`}
                          className={`px-2 py-1 rounded-md text-xs font-semibold border-0 cursor-pointer ${est.color}`}
                        >
                          {Object.entries(ESTADOS_ACTIVIDAD).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                        </select>
                        <button
                          type="button"
                          onClick={() => eliminarConConfirmacion('¿Eliminar este compromiso?', () => api.delete(`/compromisos/${c.id}`), () => invalidate('timeline', 'compromisos-pendientes'))}
                          aria-label={`Eliminar compromiso ${c.descripcion}`}
                          title="Eliminar compromiso"
                          className={BTN_BORRAR_SUAVE}
                        >
                          <Trash2 size={12} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {/* Agregar compromiso */}
                <div className="flex gap-2 mt-2">
                  <Input
                    value={nuevosCompromisos[seg.id] || ''}
                    onChange={e => setNuevoCompromiso(seg.id, e.target.value)}
                    aria-label={`Nuevo compromiso para ${seg.sesion?.titulo || 'la sesión'}`}
                    placeholder="Nuevo compromiso..."
                    className="flex-1 min-w-0"
                    onKeyDown={e => e.key === 'Enter' && agregarCompromiso(seg.id)}
                  />
                  <Button variante="accent" icono={Plus} onClick={() => agregarCompromiso(seg.id)} className="shrink-0">Agregar</Button>
                </div>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
};

export default SeguimientoV2;
