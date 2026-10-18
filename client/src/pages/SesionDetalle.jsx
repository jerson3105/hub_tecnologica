import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { descargarArchivo } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useInvalidate } from '../hooks/useQueryHooks';
import { ArrowLeft, Video, Users, ClipboardList, FileText, File, Image, Film, Link2, ExternalLink, Download, Star, Send, CheckCircle2, Plus, Save, XCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { tipoSesion } from '../constants/sesiones';
import { CATEGORIAS_ARCHIVO, estadoDe, ESTADOS_AVANCE } from '../constants/estados';
import { formatFecha, esFutura } from '../utils/fechas';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import EmptyState from '../components/ui/EmptyState';
import ListaCompromisos from '../components/ListaCompromisos';
import { Field, Input, Textarea } from '../components/ui/Field';
import { clasesIconButton } from '../components/ui/estilos';

const SesionDetalle = () => {
  const { id } = useParams();
  const { esAdmin } = useAuth();
  const invalidate = useInvalidate();
  const [npsEnviadoLocal, setNpsEnviadoLocal] = useState(false);
  const [npsPuntuacion, setNpsPuntuacion] = useState(0);
  const [npsComentario, setNpsComentario] = useState('');
  const [npsAreasMejora, setNpsAreasMejora] = useState('');
  const [npsHover, setNpsHover] = useState(0);
  const [enviandoNps, setEnviandoNps] = useState(false);
  const [agregandoEnlace, setAgregandoEnlace] = useState(false);
  const [nuevoEnlace, setNuevoEnlace] = useState({ nombre: '', url: '' });
  const [guardandoEnlace, setGuardandoEnlace] = useState(false);

  const { data: sesion, isLoading: cargando, refetch: refetchSesion } = useQuery({
    queryKey: ['sesion', id],
    queryFn: () => api.get(`/sesiones/${id}`).then(r => r.data.sesion),
    enabled: !!id
  });

  const { data: npsPendientes } = useQuery({
    queryKey: ['nps', 'mis-pendientes'],
    queryFn: () => api.get('/nps/mis-pendientes').then(r => r.data.pendientes || []),
    enabled: !!id && !esAdmin,
    staleTime: 0
  });

  // NPS data for admin view
  const { data: npsData } = useQuery({
    queryKey: ['nps-sesion', id],
    queryFn: () => api.get(`/nps/sesion/${id}`).then(r => r.data),
    enabled: !!id && esAdmin
  });

  const npsResponses = npsData?.respuestas || [];
  const npsPromedio = npsData?.promedio || 0;

  const npsEnviado = npsEnviadoLocal || (npsPendientes && !npsPendientes.includes(parseInt(id)));
  // Las sesiones futuras no se evalúan (el servidor también lo rechaza)
  const sesionFutura = esFutura(sesion?.fecha);

  // Group asistencias by emprendimiento
  const asistenciasPorEmp = useMemo(() => {
    const asistencias = sesion?.asistencias || [];
    const grupos = {};
    asistencias.forEach(a => {
      const empNombre = a.usuario?.integrantes?.[0]?.emprendimiento?.nombre || 'Sin emprendimiento';
      const empId = a.usuario?.integrantes?.[0]?.emprendimiento?.id || 0;
      if (!grupos[empId]) grupos[empId] = { nombre: empNombre, presentes: [], ausentes: [] };
      if (a.presente) grupos[empId].presentes.push(a.usuario);
      else grupos[empId].ausentes.push(a.usuario);
    });
    return Object.values(grupos);
  }, [sesion?.asistencias]);

  const agregarEnlace = async () => {
    if (!nuevoEnlace.nombre || !nuevoEnlace.url) return toast.error('Nombre y URL son requeridos');
    setGuardandoEnlace(true);
    try {
      await api.post('/archivos/enlace', {
        nombre: nuevoEnlace.nombre,
        url: nuevoEnlace.url,
        categoria: 'taller',
        sesion_id: parseInt(id),
        emprendimiento_ids: []
      });
      toast.success('Enlace agregado');
      setAgregandoEnlace(false);
      setNuevoEnlace({ nombre: '', url: '' });
      refetchSesion();
    } catch {
      toast.error('Error al agregar enlace');
    } finally {
      setGuardandoEnlace(false);
    }
  };

  const enviarNps = async (e) => {
    e.preventDefault();
    if (npsPuntuacion === 0) {
      toast.error('Selecciona una puntuación');
      return;
    }
    if (!sesion) return;
    setEnviandoNps(true);
    try {
      await api.post('/nps', {
        sesion_id: parseInt(id),
        puntuacion: npsPuntuacion,
        comentario: npsComentario,
        tipo: sesion.tipo === 'taller' ? 'taller' : 'seguimiento',
        areas_mejora: npsAreasMejora
      });
      toast.success('Evaluación enviada exitosamente');
      setNpsEnviadoLocal(true);
      // Refresca el aviso "Pendiente" de la lista de sesiones
      invalidate('nps');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al enviar evaluación');
    } finally {
      setEnviandoNps(false);
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  if (!sesion) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Sesión no encontrada o sin acceso</p>
        <Link to="/sesiones" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-brand-cyan-ink hover:underline">
          <ArrowLeft size={14} aria-hidden="true" /> Volver a sesiones
        </Link>
      </div>
    );
  }

  const tipoMeta = tipoSesion(sesion.tipo);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative surface-dark">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark to-brand-purple rounded-2xl opacity-95"></div>
        <div className="relative px-6 py-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/sesiones" aria-label="Volver a sesiones" className="text-white/70 hover:text-white transition-colors rounded-lg"><ArrowLeft size={22} aria-hidden="true" /></Link>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-white/15 text-white`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sesion.tipo === 'taller' ? 'bg-brand-purple' : 'bg-brand-cyan'}`} aria-hidden="true"></span>
              {tipoMeta.label}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{sesion.titulo}</h1>
          <p className="text-white/60 mt-1">
            {(sesion.programas?.length > 0 ? sesion.programas : (sesion.programa ? [sesion.programa] : []))
              .map(p => p.nombre).join(' · ')}
            {' · '}{formatFecha(sesion.fecha)}
          </p>
        </div>
      </div>

      {sesion.descripcion && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <p className="text-gray-600 leading-relaxed">{sesion.descripcion}</p>
        </div>
      )}

      {sesion.enlace_grabacion && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><Video size={18} className="text-brand-cyan-ink" aria-hidden="true" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Grabación</h2>
          </div>
          <div className="p-5">
            <a href={sesion.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-brand-cyan-ink hover:text-brand-dark break-all font-medium transition-colors flex items-center gap-2">
              <ExternalLink size={14} className="shrink-0" aria-hidden="true" /> {sesion.enlace_grabacion}
            </a>
          </div>
        </div>
      )}

      {/* Seguimientos de la sesión - NO mostrar para talleres */}
      {sesion.tipo !== 'taller' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-brand-purple/10 rounded-lg"><ClipboardList size={18} className="text-brand-purple" aria-hidden="true" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">{esAdmin ? 'Seguimientos' : 'Mi Seguimiento'}</h2>
            <span className="ml-1 text-sm text-gray-500">({sesion.seguimientos?.length || 0})</span>
          </div>
          {sesion.seguimientos?.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {sesion.seguimientos.map((seg) => {
                const avance = estadoDe(ESTADOS_AVANCE, seg.estado_avance, { label: seg.estado_avance?.replace('_', ' '), tono: 'neutral' });
                return (
                  <div key={seg.id} className="p-5 hover:bg-brand-cyan/5 transition-colors">
                    <div className="flex items-center justify-between gap-3 mb-3">
                      {esAdmin ? (
                        <Link to={`/emprendimientos/${seg.emprendimiento?.id}`} className="font-semibold text-brand-dark hover:text-brand-cyan-ink transition-colors">
                          {seg.emprendimiento?.nombre}
                        </Link>
                      ) : (
                        <span className="font-semibold text-brand-dark">{seg.emprendimiento?.nombre}</span>
                      )}
                      <Badge tono={avance.tono} className="capitalize shrink-0">{avance.label}</Badge>
                    </div>
                    {seg.realizado && (
                      <div className="mb-2">
                        <p className="eyebrow">Realizado</p>
                        <p className="text-sm text-gray-700 mt-0.5">{seg.realizado}</p>
                      </div>
                    )}
                    <ListaCompromisos seguimiento={seg} />
                    {seg.enlace_grabacion && (
                      <div className="flex items-center gap-2 mt-3 bg-brand-cyan/5 border border-brand-cyan/10 rounded-xl px-3 py-2 w-fit">
                        <Video size={14} className="text-brand-cyan-ink" aria-hidden="true" />
                        <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-dark hover:text-brand-cyan-ink font-medium transition-colors">
                          Grabación de la reunión
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
                icono={ClipboardList}
                tono="purple"
                compacto
                titulo={esAdmin ? 'No hay seguimientos registrados para esta sesión' : 'No hay seguimiento registrado para esta sesión'} sinMarco />
          )}
        </div>
      )}

      {/* Archivos de la sesión */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-green/10 rounded-lg"><FileText size={18} className="text-brand-green-ink" aria-hidden="true" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Archivos</h2>
            <span className="ml-1 text-sm text-gray-500">({sesion.archivos?.length || 0})</span>
          </div>
          {esAdmin && sesion.tipo === 'taller' && (
            <Button
              variante="accent"
              tamanio="sm"
              icono={Plus}
              onClick={() => setAgregandoEnlace(!agregandoEnlace)}
              aria-expanded={agregandoEnlace}
              aria-controls="form-agregar-enlace"
            >
              Agregar enlace
            </Button>
          )}
        </div>

        {/* Form para agregar enlace */}
        {agregandoEnlace && esAdmin && (
          <div id="form-agregar-enlace" className="bg-gray-50 border-b border-gray-100 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                value={nuevoEnlace.nombre}
                onChange={e => setNuevoEnlace({ ...nuevoEnlace, nombre: e.target.value })}
                placeholder="Nombre del recurso (ej: Presentación del taller)"
                aria-label="Nombre del recurso"
              />
              <Input
                value={nuevoEnlace.url}
                onChange={e => setNuevoEnlace({ ...nuevoEnlace, url: e.target.value })}
                placeholder="https://drive.google.com/..."
                aria-label="URL del recurso"
                type="url"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2">
              <Button variante="ghost" tamanio="sm" onClick={() => { setAgregandoEnlace(false); setNuevoEnlace({ nombre: '', url: '' }); }}>Cancelar</Button>
              <Button tamanio="sm" icono={Save} cargando={guardandoEnlace} onClick={agregarEnlace}>Guardar</Button>
            </div>
          </div>
        )}

        {sesion.archivos?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {sesion.archivos.map((arch) => {
              const getIcono = () => {
                if (arch.tipo === 'enlace') return <Link2 size={16} className="text-brand-cyan-ink" aria-hidden="true" />;
                if (arch.tipo_mime?.startsWith('image/')) return <Image size={16} className="text-brand-green-ink" aria-hidden="true" />;
                if (arch.tipo_mime?.startsWith('video/')) return <Film size={16} className="text-brand-purple" aria-hidden="true" />;
                if (arch.tipo_mime?.includes('pdf')) return <FileText size={16} className="text-red-500" aria-hidden="true" />;
                return <File size={16} className="text-gray-500" aria-hidden="true" />;
              };
              const categoria = estadoDe(CATEGORIAS_ARCHIVO, arch.categoria);
              return (
                <div key={arch.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-brand-cyan/5 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-white transition-colors">{getIcono()}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-dark truncate">{arch.nombre_original}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <Badge tono={categoria.tono} forma="tag">{categoria.label}</Badge>
                        {esAdmin && arch.emprendimientos?.map(emp => (
                          <Badge key={emp.id} tono="cyan" forma="tag">{emp.nombre}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {arch.tipo === 'enlace' ? (
                      <a href={arch.url} target="_blank" rel="noopener noreferrer" className={clasesIconButton({ tono: 'cyan' })} title="Abrir enlace" aria-label={`Abrir enlace ${arch.nombre_original}`}>
                        <ExternalLink size={16} aria-hidden="true" />
                      </a>
                    ) : (
                      <IconButton label={`Descargar ${arch.nombre_original}`} icono={Download} tono="brand" onClick={() => descargarArchivo(arch.id, arch.nombre_original)} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icono={FileText} tono="green" compacto titulo="No hay archivos asignados a esta sesión" sinMarco />
        )}
      </div>

      {/* Asistencias - solo admin */}
      {esAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><Users size={18} className="text-brand-cyan-ink" aria-hidden="true" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Asistencia</h2>
            <span className="ml-1 text-sm text-gray-500">({sesion.asistencias?.length || 0})</span>
          </div>
          {sesion.tipo === 'taller' && asistenciasPorEmp.length > 0 ? (
            /* Grouped by emprendimiento for talleres */
            <div className="p-5 space-y-4">
              {asistenciasPorEmp.map((grupo, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-bold text-brand-dark mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-brand-cyan/10 flex items-center justify-center text-brand-cyan-ink text-xs font-bold" aria-hidden="true">
                      {grupo.nombre?.charAt(0)}
                    </span>
                    {grupo.nombre}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-green-700 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                        <CheckCircle2 size={10} aria-hidden="true" /> Presentes ({grupo.presentes.length})
                      </p>
                      {grupo.presentes.length > 0 ? (
                        <div className="space-y-1.5">
                          {grupo.presentes.map(u => (
                            <div key={u.id} className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center text-green-700 text-xs font-bold" aria-hidden="true">
                                {u.nombre?.[0]}{u.apellido?.[0]}
                              </div>
                              {u.nombre} {u.apellido}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Ninguno</p>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-red-700 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                        <XCircle size={10} aria-hidden="true" /> Ausentes ({grupo.ausentes.length})
                      </p>
                      {grupo.ausentes.length > 0 ? (
                        <div className="space-y-1.5">
                          {grupo.ausentes.map(u => (
                            <div key={u.id} className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center text-red-700 text-xs font-bold" aria-hidden="true">
                                {u.nombre?.[0]}{u.apellido?.[0]}
                              </div>
                              {u.nombre} {u.apellido}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-500 italic">Ninguno</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : sesion.asistencias?.length > 0 ? (
            /* Simple list for non-taller sessions */
            <div className="divide-y divide-gray-50">
              {sesion.asistencias.map((asis) => (
                <div key={asis.id} className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-brand-cyan/5 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 shrink-0 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan-ink font-bold text-xs" aria-hidden="true">
                      {asis.usuario?.nombre?.[0]}{asis.usuario?.apellido?.[0]}
                    </div>
                    <span className="text-sm font-medium text-brand-dark">{asis.usuario?.nombre} {asis.usuario?.apellido}</span>
                  </div>
                  <Badge tono={asis.presente ? 'green' : 'red'} className="shrink-0">{asis.presente ? 'Presente' : 'Ausente'}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icono={Users} tono="cyan" compacto titulo="No se ha registrado asistencia" sinMarco />
          )}
        </div>
      )}

      {/* NPS Detail - Solo admin (los emprendedores evalúan todos los tipos de sesión) */}
      {esAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 rounded-lg"><Star size={18} className="text-amber-500" aria-hidden="true" /></div>
              <h2 className="text-lg font-semibold text-brand-dark">Evaluación NPS</h2>
              <span className="ml-1 text-sm text-gray-500">({npsResponses.length} respuestas)</span>
            </div>
            {npsPromedio > 0 && (
              <span className={`px-3 py-1.5 rounded-xl text-sm font-bold ${
                npsPromedio >= 9 ? 'bg-green-100 text-green-700' :
                npsPromedio >= 7 ? 'bg-amber-100 text-amber-700' :
                'bg-red-100 text-red-700'
              }`}>
                Promedio: {npsPromedio.toFixed(1)}/10
              </span>
            )}
          </div>
          {npsResponses.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {npsResponses.map(nps => (
                <div key={nps.id} className="p-5 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 shrink-0 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan-ink font-bold text-xs" aria-hidden="true">
                        {nps.usuario?.nombre?.[0]}{nps.usuario?.apellido?.[0]}
                      </div>
                      <span className="text-sm font-medium text-brand-dark">{nps.usuario?.nombre} {nps.usuario?.apellido}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-sm font-bold flex items-center gap-1 shrink-0 ${
                      nps.puntuacion >= 9 ? 'bg-green-100 text-green-700' :
                      nps.puntuacion >= 7 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      <Star size={12} fill="currentColor" aria-hidden="true" /> {nps.puntuacion}/10
                    </span>
                  </div>
                  {nps.comentario && (
                    <div className="mt-2 pl-11">
                      <p className="eyebrow mb-0.5">Lo que aprendió / más útil</p>
                      <p className="text-sm text-gray-600">{nps.comentario}</p>
                    </div>
                  )}
                  {nps.areas_mejora && (
                    <div className="mt-2 pl-11">
                      <p className="eyebrow mb-0.5">Sugerencias de mejora</p>
                      <p className="text-sm text-gray-500 italic">{nps.areas_mejora}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icono={Star} tono="neutral" compacto titulo="No hay evaluaciones registradas" sinMarco />
          )}
        </div>
      )}

      {/* NPS - Solo emprendedores */}
      {!esAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-lg"><Star size={18} className="text-amber-500" aria-hidden="true" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Evaluación de la Sesión</h2>
          </div>
          {sesionFutura ? (
            <div className="text-center py-10 px-5">
              <Clock size={40} className="mx-auto text-gray-500 mb-3" aria-hidden="true" />
              <p className="text-brand-dark font-semibold">Podrás evaluar esta sesión cuando se haya realizado</p>
              <p className="text-gray-500 text-sm mt-1">Fecha prevista: {formatFecha(sesion.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          ) : npsEnviado ? (
            <div className="text-center py-10">
              <CheckCircle2 size={40} className="mx-auto text-brand-green-ink mb-3" aria-hidden="true" />
              <p className="text-brand-green-ink font-semibold">Ya enviaste tu evaluación para esta sesión</p>
              <p className="text-gray-500 text-sm mt-1">Gracias por tu retroalimentación</p>
            </div>
          ) : (
            <form onSubmit={enviarNps} className="p-5 space-y-5">
              <div>
                <p id="nps-pregunta" className="block text-sm font-semibold text-brand-dark mb-3">
                  ¿Cómo calificarías esta sesión?<span className="text-red-700" aria-hidden="true"> *</span>
                </p>
                {/* 10 columnas fluidas: en móvil (375px) antes las notas 9 y 10 quedaban fuera de pantalla */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <div role="radiogroup" aria-labelledby="nps-pregunta" aria-required="true" className="grid grid-cols-10 gap-0.5 sm:gap-1 w-full max-w-sm">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        role="radio"
                        aria-checked={npsPuntuacion === n}
                        aria-label={`${n} de 10`}
                        onClick={() => setNpsPuntuacion(n)}
                        onMouseEnter={() => setNpsHover(n)}
                        onMouseLeave={() => setNpsHover(0)}
                        className="aspect-square flex items-center justify-center rounded-lg p-0.5"
                      >
                        <Star
                          className={`w-full h-full max-w-7 transition-colors ${
                            n <= (npsHover || npsPuntuacion)
                              ? 'text-amber-400'
                              : 'text-gray-500'
                          }`}
                          fill={n <= (npsHover || npsPuntuacion) ? 'currentColor' : 'none'}
                          aria-hidden="true"
                        />
                      </button>
                    ))}
                  </div>
                  {npsPuntuacion > 0 && (
                    <span className="text-lg font-bold text-amber-700 tabular-nums" aria-live="polite">{npsPuntuacion}/10</span>
                  )}
                </div>
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-xs text-gray-500">Muy mala</span>
                  <span className="text-xs text-gray-500">Excelente</span>
                </div>
              </div>
              <Field label="¿Qué aprendiste o qué te pareció más útil?">
                <Textarea
                  value={npsComentario}
                  onChange={(e) => setNpsComentario(e.target.value)}
                  rows={3}
                  placeholder="Comparte tu experiencia..."
                  className="resize-none"
                />
              </Field>
              <Field label="¿Qué podemos mejorar?">
                <Textarea
                  value={npsAreasMejora}
                  onChange={(e) => setNpsAreasMejora(e.target.value)}
                  rows={2}
                  placeholder="Sugerencias de mejora..."
                  className="resize-none"
                />
              </Field>
              <div className="flex justify-end">
                <Button
                  type="submit"
                  icono={Send}
                  cargando={enviandoNps}
                  disabled={npsPuntuacion === 0}
                >
                  {enviandoNps ? 'Enviando...' : 'Enviar Evaluación'}
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default SesionDetalle;
