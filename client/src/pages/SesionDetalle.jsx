import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { descargarArchivo } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useInvalidate } from '../hooks/useQueryHooks';
import { ArrowLeft, Video, Users, ClipboardList, FileText, File, Image, Film, Link2, ExternalLink, Download, Star, Send, CheckCircle2, Plus, Save, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const INPUT_CLS = 'w-full px-3 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';

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
    } catch { toast.error('Error al agregar enlace'); }
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
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al enviar evaluación');
    } finally {
      setEnviandoNps(false);
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  if (!sesion) {
    return <div className="text-center py-12 text-gray-500">Sesión no encontrada</div>;
  }

  const estadoAvanceMap = {
    sin_iniciar: { label: 'Sin Iniciar', color: 'bg-gray-100 text-gray-600' },
    en_progreso: { label: 'En Progreso', color: 'bg-brand-cyan/15 text-brand-dark' },
    avanzado: { label: 'Avanzado', color: 'bg-brand-green/15 text-brand-green' },
    completado: { label: 'Completado', color: 'bg-brand-green/20 text-brand-green' }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-dark via-brand-dark to-brand-purple rounded-2xl opacity-95"></div>
        <div className="relative px-6 py-6 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <Link to="/sesiones" className="text-white/50 hover:text-white transition-colors"><ArrowLeft size={22} /></Link>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 bg-white/15 text-white`}>
              <span className={`w-1.5 h-1.5 rounded-full ${sesion.tipo === 'taller' ? 'bg-brand-purple' : 'bg-brand-cyan'}`}></span>
              {sesion.tipo === 'taller' ? 'Taller' : 'Seguimiento'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white">{sesion.titulo}</h1>
          <p className="text-white/60 mt-1">
            {(sesion.programas?.length > 0 ? sesion.programas : (sesion.programa ? [sesion.programa] : []))
              .map(p => p.nombre).join(' · ')}
            {' · '}{new Date(sesion.fecha).toLocaleDateString('es-ES')}
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
            <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><Video size={18} className="text-brand-cyan" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Grabación</h2>
          </div>
          <div className="p-5">
            <a href={sesion.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-brand-cyan hover:text-brand-dark break-all font-medium transition-colors flex items-center gap-2">
              <ExternalLink size={14} className="shrink-0" /> {sesion.enlace_grabacion}
            </a>
          </div>
        </div>
      )}

      {/* Seguimientos de la sesión - NO mostrar para talleres */}
      {sesion.tipo !== 'taller' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-brand-purple/10 rounded-lg"><ClipboardList size={18} className="text-brand-purple" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">{esAdmin ? 'Seguimientos' : 'Mi Seguimiento'}</h2>
            <span className="ml-1 text-sm text-gray-400">({sesion.seguimientos?.length || 0})</span>
          </div>
          {sesion.seguimientos?.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {sesion.seguimientos.map((seg) => (
                <div key={seg.id} className="p-5 hover:bg-brand-cyan/5 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    {esAdmin ? (
                      <Link to={`/emprendimientos/${seg.emprendimiento?.id}`} className="font-semibold text-brand-dark hover:text-brand-cyan transition-colors">
                        {seg.emprendimiento?.nombre}
                      </Link>
                    ) : (
                      <span className="font-semibold text-brand-dark">{seg.emprendimiento?.nombre}</span>
                    )}
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize ${estadoAvanceMap[seg.estado_avance]?.color || 'bg-gray-100 text-gray-600'}`}>
                      {estadoAvanceMap[seg.estado_avance]?.label || seg.estado_avance?.replace('_', ' ')}
                    </span>
                  </div>
                  {seg.realizado && (
                    <div className="mb-2">
                      <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider">Realizado</p>
                      <p className="text-sm text-gray-700 mt-0.5">{seg.realizado}</p>
                    </div>
                  )}
                  {seg.compromisos && (
                    <div className="mb-2">
                      <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider">Compromisos</p>
                      <p className="text-sm text-gray-700 mt-0.5">{seg.compromisos}</p>
                    </div>
                  )}
                  {seg.enlace_grabacion && (
                    <div className="flex items-center gap-2 mt-3 bg-brand-cyan/5 border border-brand-cyan/10 rounded-xl px-3 py-2 w-fit">
                      <Video size={14} className="text-brand-cyan" />
                      <a href={seg.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="text-sm text-brand-dark hover:text-brand-cyan font-medium transition-colors">
                        Grabación de la reunión
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <ClipboardList size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">{esAdmin ? 'No hay seguimientos registrados para esta sesión' : 'No hay seguimiento registrado para esta sesión'}</p>
            </div>
          )}
        </div>
      )}

      {/* Archivos de la sesión */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-brand-green/10 rounded-lg"><FileText size={18} className="text-brand-green" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Archivos</h2>
            <span className="ml-1 text-sm text-gray-400">({sesion.archivos?.length || 0})</span>
          </div>
          {esAdmin && sesion.tipo === 'taller' && (
            <button 
              onClick={() => setAgregandoEnlace(!agregandoEnlace)} 
              className="px-3 py-1.5 text-xs font-medium bg-brand-cyan/10 text-brand-cyan rounded-lg hover:bg-brand-cyan/20 flex items-center gap-1"
            >
              <Plus size={12} /> Agregar enlace
            </button>
          )}
        </div>

        {/* Form para agregar enlace */}
        {agregandoEnlace && esAdmin && (
          <div className="bg-gray-50 border-b border-gray-100 p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input 
                value={nuevoEnlace.nombre} 
                onChange={e => setNuevoEnlace({ ...nuevoEnlace, nombre: e.target.value })}
                className={INPUT_CLS}
                placeholder="Nombre del recurso (ej: Presentación del taller)"
              />
              <input 
                value={nuevoEnlace.url} 
                onChange={e => setNuevoEnlace({ ...nuevoEnlace, url: e.target.value })}
                className={INPUT_CLS}
                placeholder="https://drive.google.com/..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setAgregandoEnlace(false); setNuevoEnlace({ nombre: '', url: '' }); }} className="px-3 py-1.5 text-xs text-gray-500 hover:bg-gray-200 rounded-lg">Cancelar</button>
              <button onClick={agregarEnlace} className="px-3 py-1.5 text-xs bg-brand-dark text-white rounded-lg hover:bg-brand-dark/90 flex items-center gap-1">
                <Save size={12} /> Guardar
              </button>
            </div>
          </div>
        )}

        {sesion.archivos?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {sesion.archivos.map((arch) => {
              const getIcono = () => {
                if (arch.tipo === 'enlace') return <Link2 size={16} className="text-brand-cyan" />;
                if (arch.tipo_mime?.startsWith('image/')) return <Image size={16} className="text-brand-green" />;
                if (arch.tipo_mime?.startsWith('video/')) return <Film size={16} className="text-brand-purple" />;
                if (arch.tipo_mime?.includes('pdf')) return <FileText size={16} className="text-red-500" />;
                return <File size={16} className="text-gray-400" />;
              };
              const categoriaLabels = { bmc: 'BMC', taller: 'Taller', entregable: 'Entregable', grabacion: 'Grabación', otro: 'Otro' };
              return (
                <div key={arch.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-brand-cyan/5 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-gray-50 rounded-xl group-hover:bg-white transition-colors">{getIcono()}</div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-brand-dark truncate">{arch.nombre_original}</p>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-semibold">{categoriaLabels[arch.categoria] || arch.categoria}</span>
                        {esAdmin && arch.emprendimientos?.map(emp => (
                          <span key={emp.id} className="text-[10px] px-2 py-0.5 rounded-md bg-brand-cyan/10 text-brand-cyan font-semibold">{emp.nombre}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-2">
                    {arch.tipo === 'enlace' ? (
                      <a href={arch.url} target="_blank" rel="noopener noreferrer" className="p-2 text-brand-cyan hover:bg-brand-cyan/10 rounded-xl transition-colors" title="Abrir enlace">
                        <ExternalLink size={16} />
                      </a>
                    ) : (
                      <button onClick={() => descargarArchivo(arch.id, arch.nombre_original)} className="p-2 text-brand-dark hover:bg-brand-cyan/10 rounded-xl transition-colors" title="Descargar">
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-10">
            <FileText size={32} className="mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">No hay archivos asignados a esta sesión</p>
          </div>
        )}
      </div>

      {/* Asistencias - solo admin */}
      {esAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-brand-cyan/10 rounded-lg"><Users size={18} className="text-brand-cyan" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Asistencia</h2>
            <span className="ml-1 text-sm text-gray-400">({sesion.asistencias?.length || 0})</span>
          </div>
          {sesion.tipo === 'taller' && asistenciasPorEmp.length > 0 ? (
            /* Grouped by emprendimiento for talleres */
            <div className="p-5 space-y-4">
              {asistenciasPorEmp.map((grupo, idx) => (
                <div key={idx} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-bold text-brand-dark mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-brand-cyan/10 flex items-center justify-center text-brand-cyan text-xs font-bold">
                      {grupo.nombre?.charAt(0)}
                    </span>
                    {grupo.nombre}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Presentes ({grupo.presentes.length})
                      </p>
                      {grupo.presentes.length > 0 ? (
                        <div className="space-y-1.5">
                          {grupo.presentes.map(u => (
                            <div key={u.id} className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center text-green-600 text-[10px] font-bold">
                                {u.nombre?.[0]}{u.apellido?.[0]}
                              </div>
                              {u.nombre} {u.apellido}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Ninguno</p>
                      )}
                    </div>
                    <div>
                      <p className="text-[10px] text-red-600 font-bold uppercase tracking-wider mb-2 flex items-center gap-1">
                        <XCircle size={10} /> Ausentes ({grupo.ausentes.length})
                      </p>
                      {grupo.ausentes.length > 0 ? (
                        <div className="space-y-1.5">
                          {grupo.ausentes.map(u => (
                            <div key={u.id} className="flex items-center gap-2 text-sm text-gray-700">
                              <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center text-red-600 text-[10px] font-bold">
                                {u.nombre?.[0]}{u.apellido?.[0]}
                              </div>
                              {u.nombre} {u.apellido}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 italic">Ninguno</p>
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
                <div key={asis.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-brand-cyan/5 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan font-bold text-xs">
                      {asis.usuario?.nombre?.[0]}{asis.usuario?.apellido?.[0]}
                    </div>
                    <span className="text-sm font-medium text-brand-dark">{asis.usuario?.nombre} {asis.usuario?.apellido}</span>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                    asis.presente ? 'bg-brand-green/15 text-brand-green' : 'bg-red-100 text-red-600'
                  }`}>{asis.presente ? 'Presente' : 'Ausente'}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Users size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No se ha registrado asistencia</p>
            </div>
          )}
        </div>
      )}

      {/* NPS Detail - Solo admin para talleres */}
      {esAdmin && sesion.tipo === 'taller' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-amber-100 rounded-lg"><Star size={18} className="text-amber-500" /></div>
              <h2 className="text-lg font-semibold text-brand-dark">Evaluación NPS</h2>
              <span className="ml-1 text-sm text-gray-400">({npsResponses.length} respuestas)</span>
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
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-cyan/10 rounded-xl flex items-center justify-center text-brand-cyan font-bold text-xs">
                        {nps.usuario?.nombre?.[0]}{nps.usuario?.apellido?.[0]}
                      </div>
                      <span className="text-sm font-medium text-brand-dark">{nps.usuario?.nombre} {nps.usuario?.apellido}</span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-sm font-bold flex items-center gap-1 ${
                      nps.puntuacion >= 9 ? 'bg-green-100 text-green-700' :
                      nps.puntuacion >= 7 ? 'bg-amber-100 text-amber-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      <Star size={12} fill="currentColor" /> {nps.puntuacion}/10
                    </span>
                  </div>
                  {nps.comentario && (
                    <div className="mt-2 pl-11">
                      <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-0.5">Lo que aprendió / más útil</p>
                      <p className="text-sm text-gray-600">{nps.comentario}</p>
                    </div>
                  )}
                  {nps.areas_mejora && (
                    <div className="mt-2 pl-11">
                      <p className="text-[10px] font-bold text-brand-dark/40 uppercase tracking-wider mb-0.5">Sugerencias de mejora</p>
                      <p className="text-sm text-gray-500 italic">{nps.areas_mejora}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <Star size={32} className="mx-auto text-gray-200 mb-2" />
              <p className="text-gray-400 text-sm">No hay evaluaciones registradas</p>
            </div>
          )}
        </div>
      )}

      {/* NPS - Solo emprendedores */}
      {!esAdmin && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 rounded-lg"><Star size={18} className="text-amber-500" /></div>
            <h2 className="text-lg font-semibold text-brand-dark">Evaluación de la Sesión</h2>
          </div>
          {npsEnviado ? (
            <div className="text-center py-10">
              <CheckCircle2 size={40} className="mx-auto text-brand-green mb-3" />
              <p className="text-brand-green font-semibold">Ya enviaste tu evaluación para esta sesión</p>
              <p className="text-gray-400 text-sm mt-1">Gracias por tu retroalimentación</p>
            </div>
          ) : (
            <form onSubmit={enviarNps} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-3">¿Cómo calificarías esta sesión? *</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setNpsPuntuacion(n)}
                      onMouseEnter={() => setNpsHover(n)}
                      onMouseLeave={() => setNpsHover(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        size={28}
                        className={`transition-colors ${
                          n <= (npsHover || npsPuntuacion)
                            ? 'text-amber-400'
                            : 'text-gray-200'
                        }`}
                        fill={n <= (npsHover || npsPuntuacion) ? 'currentColor' : 'none'}
                      />
                    </button>
                  ))}
                  {npsPuntuacion > 0 && (
                    <span className="ml-3 text-lg font-bold text-amber-500">{npsPuntuacion}/10</span>
                  )}
                </div>
                <div className="flex justify-between mt-1 px-1">
                  <span className="text-[10px] text-gray-400">Muy mala</span>
                  <span className="text-[10px] text-gray-400">Excelente</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">¿Qué aprendiste o qué te pareció más útil?</label>
                <textarea
                  value={npsComentario}
                  onChange={(e) => setNpsComentario(e.target.value)}
                  rows={3}
                  placeholder="Comparte tu experiencia..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none resize-none transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-dark mb-1.5">¿Qué podemos mejorar?</label>
                <textarea
                  value={npsAreasMejora}
                  onChange={(e) => setNpsAreasMejora(e.target.value)}
                  rows={2}
                  placeholder="Sugerencias de mejora..."
                  className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none resize-none transition-all text-sm"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={enviandoNps || npsPuntuacion === 0}
                  className="px-6 py-2.5 bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 flex items-center gap-2 text-sm font-medium disabled:opacity-50 shadow-sm transition-all hover:shadow-md"
                >
                  {enviandoNps ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Send size={16} />}
                  {enviandoNps ? 'Enviando...' : 'Enviar Evaluación'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};

export default SesionDetalle;
