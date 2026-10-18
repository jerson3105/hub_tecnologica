import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit, Trash2, Eye, CalendarDays, Video, Star, AlertCircle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useProgramas, useNpsPromedios, useInvalidate } from '../hooks/useQueryHooks';
import { formatFecha, esFutura } from '../utils/fechas';
import { tipoSesion } from '../constants/sesiones';
import Badge from '../components/ui/Badge';
import IconButton from '../components/ui/IconButton';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import ErrorCarga from '../components/ui/ErrorCarga';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import { FILTRO_CLS, ETIQUETA_CLS, clasesIconButton } from '../components/ui/estilos';

const Sesiones = () => {
  const { esAdmin } = useAuth();
  const invalidate = useInvalidate();
  // ?nueva=1 abre el formulario al llegar (botón «Nueva sesión» del Inicio y de Programas);
  // ?programa=ID lo deja con ese programa elegido
  const [searchParams, setSearchParams] = useSearchParams();
  const [modalOpen, setModalOpen] = useState(() => esAdmin && searchParams.get('nueva') === '1');
  const [editando, setEditando] = useState(null);
  const [filtroPrograma, setFiltroPrograma] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [form, setForm] = useState(() => ({
    programa_ids: Number(searchParams.get('programa')) ? [Number(searchParams.get('programa'))] : [],
    titulo: '', descripcion: '', fecha: '', tipo: 'uno_a_uno_programa', enlace_grabacion: ''
  }));

  const sesParams = {};
  if (filtroPrograma) sesParams.programa_id = filtroPrograma;
  if (filtroTipo) sesParams.tipo = filtroTipo;

  const { data: sesiones = [], isLoading: l1 } = useQuery({
    queryKey: ['sesiones', sesParams],
    queryFn: () => api.get('/sesiones', { params: sesParams }).then(r => r.data.sesiones)
  });
  const { data: programas = [], isLoading: l2 } = useProgramas();
  const { data: npsPromedios = {}, isError: errorPromedios, refetch: reintentarPromedios } = useNpsPromedios();
  const { data: npsPendientesArr = [], isError: errorPendientes, refetch: reintentarPendientes } = useQuery({
    queryKey: ['nps', 'mis-pendientes'],
    queryFn: () => api.get('/nps/mis-pendientes').then(r => r.data.pendientes || []),
    enabled: !esAdmin
  });
  const npsPendientes = new Set(npsPendientesArr);

  // Se quita ?nueva de la URL para que una recarga no vuelva a abrir el formulario
  useEffect(() => {
    if (searchParams.has('nueva')) setSearchParams({}, { replace: true });
  }, [searchParams, setSearchParams]);
  const cargando = l1 || l2;

  const abrirModal = (sesion = null) => {
    if (sesion) {
      setEditando(sesion);
      setForm({
        programa_ids: sesion.programas?.map(p => p.id) || (sesion.programa?.id ? [sesion.programa.id] : []),
        titulo: sesion.titulo,
        descripcion: sesion.descripcion || '',
        fecha: sesion.fecha,
        tipo: sesion.tipo,
        enlace_grabacion: sesion.enlace_grabacion || ''
      });
    } else {
      setEditando(null);
      setForm({ programa_ids: programas.length > 0 ? [programas[0].id] : [], titulo: '', descripcion: '', fecha: '', tipo: 'uno_a_uno_programa', enlace_grabacion: '' });
    }
    setModalOpen(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!form.programa_ids.length) {
      toast.error('Selecciona al menos un programa');
      return;
    }
    setGuardando(true);
    try {
      if (editando) {
        await api.put(`/sesiones/${editando.id}`, form);
        toast.success('Sesión actualizada');
      } else {
        await api.post('/sesiones', form);
        toast.success('Sesión creada');
      }
      setModalOpen(false);
      invalidate('sesiones', 'timeline');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar esta sesión? También se borrarán sus seguimientos, asistencias y evaluaciones.')) return;
    try {
      await api.delete(`/sesiones/${id}`);
      toast.success('Sesión eliminada');
      invalidate('sesiones', 'timeline');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-purple/10 rounded-xl"><CalendarDays size={22} className="text-brand-purple" aria-hidden="true" /></div>
            Sesiones
          </h1>
          <p className="text-gray-500 mt-1 sm:ml-12">Sesiones de seguimiento y talleres</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select aria-label="Filtrar por programa" value={filtroPrograma} onChange={(e) => setFiltroPrograma(e.target.value)} className={FILTRO_CLS}>
            <option value="">Todos los programas</option>
            {programas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
          <select aria-label="Filtrar por tipo" value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)} className={FILTRO_CLS}>
            <option value="">Todos los tipos</option>
            <option value="diagnostica_1">Diagnóstica 1</option>
            <option value="diagnostica_2">Diagnóstica 2</option>
            <option value="diagnostica_final">Diagnóstica Final</option>
            <option value="taller">Taller</option>
            <option value="uno_a_uno_programa">1 a 1 Programa</option>
            <option value="uno_a_uno_taller">1 a 1 Taller</option>
            <option value="seguimiento">Seguimiento (legacy)</option>
          </select>
          {esAdmin && (
            <Button icono={Plus} onClick={() => abrirModal()}>Nueva Sesión</Button>
          )}
        </div>
      </div>

      {(esAdmin ? errorPromedios : errorPendientes) && (
        <ErrorCarga
          compacto
          className="bg-red-50 border border-red-200 rounded-2xl"
          mensaje={esAdmin ? 'No se pudieron cargar las evaluaciones NPS de las sesiones.' : 'No se pudieron cargar tus evaluaciones pendientes.'}
          onReintentar={esAdmin ? reintentarPromedios : reintentarPendientes}
        />
      )}

      {sesiones.length === 0 ? (
        <EmptyState
          icono={CalendarDays}
          tono="purple"
          titulo={filtroPrograma || filtroTipo ? 'No hay sesiones con estos filtros' : 'No hay sesiones registradas'}
          descripcion={filtroPrograma || filtroTipo
            ? 'Prueba con otro programa o tipo.'
            : (esAdmin ? 'Crea tu primera sesión para comenzar' : 'Aún no hay sesiones programadas para tu programa')}
          accion={(filtroPrograma || filtroTipo)
            ? <Button variante="secondary" onClick={() => { setFiltroPrograma(''); setFiltroTipo(''); }}>Limpiar filtros</Button>
            : (esAdmin && <Button icono={Plus} onClick={() => abrirModal()}>Nueva Sesión</Button>)}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Sesiones registradas</caption>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th scope="col" className="eyebrow text-left py-3.5 px-4">Título</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden lg:table-cell">Programa</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden sm:table-cell">Fecha</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden md:table-cell">Tipo</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden lg:table-cell">Grabación</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4">{esAdmin ? 'NPS' : 'Evaluación'}</th>
                  <th scope="col" className="eyebrow text-right py-3.5 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sesiones.map((ses) => {
                  const tipo = tipoSesion(ses.tipo);
                  const programasSesion = ses.programas?.length > 0 ? ses.programas : (ses.programa ? [ses.programa] : []);
                  return (
                    <tr key={ses.id} className="border-t border-gray-50 hover:bg-brand-cyan/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link to={`/sesiones/${ses.id}`} className="font-medium text-brand-dark hover:text-brand-cyan-ink hover:underline">{ses.titulo}</Link>
                        {/* Resumen de las columnas ocultas en pantallas pequeñas */}
                        <p className="text-xs text-gray-500 mt-0.5 md:hidden">
                          <span className="sm:hidden">{formatFecha(ses.fecha)} · </span>{tipo.label}
                        </p>
                        {ses.enlace_grabacion && (
                          <a href={ses.enlace_grabacion} target="_blank" rel="noopener noreferrer" className="lg:hidden inline-flex items-center gap-1 mt-1 text-xs text-brand-cyan-ink font-medium hover:underline">
                            <Video size={12} aria-hidden="true" /> Ver grabación
                          </a>
                        )}
                      </td>
                      <td className="py-3.5 px-4 hidden lg:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {programasSesion.map(p => (
                            <Badge key={p.id} tono="purple" className="whitespace-nowrap">{p.nombre}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 hidden sm:table-cell whitespace-nowrap">{formatFecha(ses.fecha)}</td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <Badge tono={tipo.tono} className="whitespace-nowrap">{tipo.label}</Badge>
                      </td>
                      <td className="py-3.5 px-4 hidden lg:table-cell">
                        {ses.enlace_grabacion ? (
                          <a href={ses.enlace_grabacion} target="_blank" rel="noopener noreferrer" aria-label={`Ver grabación de ${ses.titulo}`} className="text-brand-cyan-ink hover:text-brand-dark flex items-center gap-1 font-medium transition-colors">
                            <Video size={14} aria-hidden="true" /> Ver
                          </a>
                        ) : (
                          <span className="text-gray-500" aria-label="Sin grabación">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        {esAdmin ? (
                          npsPromedios[ses.id] ? (
                            <Link to={`/sesiones/${ses.id}/nps`} className="flex items-center gap-1 text-amber-700 hover:text-amber-800" title={`${npsPromedios[ses.id].total} evaluaciones`} aria-label={`NPS ${npsPromedios[ses.id].promedio}, ${npsPromedios[ses.id].total} evaluaciones`}>
                              <Star size={14} fill="currentColor" className="text-amber-500" aria-hidden="true" />
                              <span className="text-sm font-bold">{npsPromedios[ses.id].promedio}</span>
                              <span className="text-xs text-gray-500">({npsPromedios[ses.id].total})</span>
                            </Link>
                          ) : (
                            <span className="text-gray-500 text-xs">{errorPromedios ? '—' : 'Sin evaluar'}</span>
                          )
                        ) : (
                          errorPendientes ? (
                            <span className="text-xs text-gray-500" aria-label="Sin datos">—</span>
                          ) : esFutura(ses.fecha) ? (
                            <span className="flex items-center gap-1 text-gray-500 text-xs font-medium"><Clock size={12} aria-hidden="true" /> Próxima</span>
                          ) : npsPendientes.has(ses.id) ? (
                            <Link to={`/sesiones/${ses.id}`} className="flex items-center gap-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold w-fit">
                              <AlertCircle size={12} aria-hidden="true" /> Pendiente
                            </Link>
                          ) : (
                            <span className="flex items-center gap-1 text-brand-green-ink text-xs font-semibold"><Star size={12} fill="currentColor" aria-hidden="true" /> Enviado</span>
                          )
                        )}
                      </td>
                      <td className="py-2 px-2 sm:px-4 text-right">
                        <div className="flex justify-end gap-0.5">
                          <Link to={`/sesiones/${ses.id}`} aria-label={`Ver ${ses.titulo}`} title="Ver detalle" className={clasesIconButton({ tono: 'brand' })}><Eye size={15} aria-hidden="true" /></Link>
                          {esAdmin && (
                            <>
                              <IconButton label={`Editar ${ses.titulo}`} icono={Edit} tamanioIcono={15} tono="purple" onClick={() => abrirModal(ses)} />
                              <IconButton label={`Eliminar ${ses.titulo}`} icono={Trash2} tamanioIcono={15} tono="danger" onClick={() => eliminar(ses.id)} />
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Sesión' : 'Nueva Sesión'} size="lg">
        <form onSubmit={guardar} className="space-y-5">
          <fieldset>
            <legend className={ETIQUETA_CLS}>Programas participantes <span className="text-red-600" aria-hidden="true">*</span></legend>
            <div className="flex flex-wrap gap-2 mt-1">
              {programas.map(p => {
                const checked = form.programa_ids.includes(p.id);
                return (
                  <label key={p.id} className={`flex items-center gap-2 px-3 py-2 border rounded-xl cursor-pointer transition-all text-sm select-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-cyan/60 ${checked ? "border-brand-cyan-ink bg-brand-cyan/5 text-brand-dark font-medium" : "border-gray-300 text-gray-600 hover:border-brand-cyan/40"}`}>
                    <input
                      type="checkbox"
                      value={p.id}
                      checked={checked}
                      onChange={(e) => {
                        const id = parseInt(e.target.value);
                        setForm(prev => ({
                          ...prev,
                          programa_ids: e.target.checked
                            ? [...prev.programa_ids, id]
                            : prev.programa_ids.filter(pid => pid !== id)
                        }));
                      }}
                      className="size-4 accent-brand-cyan-ink"
                    />
                    {p.nombre}
                  </label>
                );
              })}
            </div>
            {form.programa_ids.length === 0 && (
              <p className="text-red-600 text-xs mt-1.5" role="alert">Selecciona al menos un programa</p>
            )}
          </fieldset>
          <Field label="Título" requerido>
            <Input type="text" value={form.titulo} onChange={(e) => setForm({...form, titulo: e.target.value})} placeholder="Ej: Sesión de seguimiento #1" />
          </Field>
          <Field label="Descripción">
            <Textarea value={form.descripcion} onChange={(e) => setForm({...form, descripcion: e.target.value})} rows={3} className="resize-y" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Fecha" requerido>
              <Input type="date" value={form.fecha} onChange={(e) => setForm({...form, fecha: e.target.value})} />
            </Field>
            <Field label="Tipo" requerido>
              <Select value={form.tipo} onChange={(e) => setForm({...form, tipo: e.target.value})}>
                <option value="diagnostica_1">Diagnóstica 1</option>
                <option value="diagnostica_2">Diagnóstica 2</option>
                <option value="diagnostica_final">Diagnóstica Final</option>
                <option value="taller">Taller</option>
                <option value="uno_a_uno_programa">1 a 1 Programa</option>
                <option value="uno_a_uno_taller">1 a 1 Taller</option>
                <option value="seguimiento">Seguimiento (legacy)</option>
              </Select>
            </Field>
          </div>
          <Field label="Enlace de grabación">
            <Input type="url" value={form.enlace_grabacion} onChange={(e) => setForm({...form, enlace_grabacion: e.target.value})} placeholder="https://..." />
          </Field>
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-5 border-t border-gray-100">
            <Button variante="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" cargando={guardando}>{editando ? "Actualizar" : "Crear Sesión"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Sesiones;
