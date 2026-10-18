import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { descargarArchivo } from '../services/api';
import Modal, { ModalPie } from '../components/Modal';
import Button from '../components/ui/Button';
import IconButton from '../components/ui/IconButton';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Select, Textarea } from '../components/ui/Field';
import { FILTRO_CLS } from '../components/ui/estilos';
import { useAuth } from '../context/AuthContext';
import { Download, Trash2, FileUp, File, Image, FileText, Film, Link2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useEmprendimientos, useSesiones, useInvalidate } from '../hooks/useQueryHooks';
import { formatFecha } from '../utils/fechas';
import { CATEGORIAS_ARCHIVO, estadoDe } from '../constants/estados';

const FORM_ENLACE_VACIO = { nombre: '', url: '', descripcion: '', categoria: 'otro', emprendimiento_ids: [], sesion_id: '' };

const formatSize = (bytes) => {
  if (!bytes) return '-';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

const IconoArchivo = ({ archivo }) => {
  if (archivo.tipo === 'enlace') return <Link2 size={18} className="text-brand-cyan-ink" aria-hidden="true" />;
  if (archivo.tipo_mime?.startsWith('image/')) return <Image size={18} className="text-brand-green-ink" aria-hidden="true" />;
  if (archivo.tipo_mime?.startsWith('video/')) return <Film size={18} className="text-brand-purple" aria-hidden="true" />;
  if (archivo.tipo_mime?.includes('pdf')) return <FileText size={18} className="text-red-600" aria-hidden="true" />;
  return <File size={18} className="text-gray-500" aria-hidden="true" />;
};

// Fuera de Archivos a propósito: si se define dentro, React lo vuelve a montar en cada render
// y la lista pierde el scroll y el foco del teclado al marcar una casilla.
const CheckboxEmprendimientos = ({ emprendimientos, selectedIds, onToggle }) => (
  <fieldset>
    <legend className="block text-sm font-semibold text-brand-dark mb-1.5">
      Emprendimientos <span className="text-xs text-gray-500 font-normal">(selecciona uno o más)</span>
    </legend>
    <div className="max-h-44 overflow-y-auto border border-gray-300 rounded-xl p-2 space-y-1">
      {emprendimientos.map(emp => (
        <label key={emp.id} className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer hover:bg-brand-cyan/5 transition-colors ${selectedIds.includes(emp.id) ? 'bg-brand-cyan/10' : ''}`}>
          <input type="checkbox" checked={selectedIds.includes(emp.id)} onChange={() => onToggle(emp.id)} className="size-4 accent-brand-cyan-ink" />
          <span className="text-sm text-brand-dark font-medium">{emp.nombre}</span>
          <span className="text-xs text-gray-500 ml-auto">{emp.programa?.nombre}</span>
        </label>
      ))}
    </div>
    {selectedIds.length > 0 && <p className="text-xs text-brand-cyan-ink font-semibold mt-1.5" aria-live="polite">{selectedIds.length} seleccionado(s)</p>}
  </fieldset>
);

const Archivos = () => {
  const { esAdmin } = useAuth();
  const invalidate = useInvalidate();
  const [modalOpen, setModalOpen] = useState(false);
  const [filtroEmprendimiento, setFiltroEmprendimiento] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [formEnlace, setFormEnlace] = useState({ ...FORM_ENLACE_VACIO });

  const archParams = {};
  if (filtroEmprendimiento) archParams.emprendimiento_id = filtroEmprendimiento;
  if (filtroCategoria) archParams.categoria = filtroCategoria;
  const hayFiltros = !!(filtroEmprendimiento || filtroCategoria);

  const { data: archivos = [], isLoading: cargando } = useQuery({
    queryKey: ['archivos', archParams],
    queryFn: () => api.get('/archivos', { params: archParams }).then(r => r.data.archivos)
  });
  const { data: emprendimientos = [] } = useEmprendimientos();
  const { data: sesiones = [] } = useSesiones();

  const toggleEmpEnlace = (empId) => {
    setFormEnlace(prev => ({
      ...prev,
      emprendimiento_ids: prev.emprendimiento_ids.includes(empId)
        ? prev.emprendimiento_ids.filter(id => id !== empId)
        : [...prev.emprendimiento_ids, empId]
    }));
  };

  const abrirModal = () => {
    setFormEnlace({ ...FORM_ENLACE_VACIO });
    setModalOpen(true);
  };

  const guardarEnlace = async (e) => {
    e.preventDefault();
    if (!formEnlace.url || !formEnlace.nombre) {
      toast.error('Nombre y URL son requeridos');
      return;
    }

    setSubiendo(true);
    try {
      await api.post('/archivos/enlace', {
        nombre: formEnlace.nombre,
        url: formEnlace.url,
        descripcion: formEnlace.descripcion,
        categoria: formEnlace.categoria,
        emprendimiento_ids: formEnlace.emprendimiento_ids,
        sesion_id: formEnlace.sesion_id || null
      });
      toast.success('Enlace guardado exitosamente');
      setModalOpen(false);
      invalidate('archivos');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al guardar enlace');
    } finally {
      setSubiendo(false);
    }
  };

  const eliminar = async (archivo) => {
    if (!confirm(`¿Eliminar "${archivo.nombre_original}"? Esta acción no se puede deshacer.`)) return;
    try {
      await api.delete(`/archivos/${archivo.id}`);
      toast.success('Recurso eliminado');
      invalidate('archivos');
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
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-green/10 rounded-xl"><FileUp size={22} className="text-brand-green-ink" aria-hidden="true" /></div>
            Materiales
          </h1>
          <p className="text-gray-500 mt-1 sm:ml-12">Gestión de enlaces, recursos y materiales compartidos</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select aria-label="Filtrar por emprendimiento" value={filtroEmprendimiento} onChange={(e) => setFiltroEmprendimiento(e.target.value)} className={FILTRO_CLS}>
            <option value="">Todos los emprendimientos</option>
            {emprendimientos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <select aria-label="Filtrar por categoría" value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className={FILTRO_CLS}>
            <option value="">Todas las categorías</option>
            {Object.entries(CATEGORIAS_ARCHIVO).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
          </select>
          <Button variante="accent" icono={Link2} onClick={abrirModal}>Agregar Enlace</Button>
        </div>
      </div>

      {archivos.length === 0 ? (
        <EmptyState
          icono={FileUp}
          tono="green"
          titulo={hayFiltros ? 'No hay materiales con estos filtros' : 'No hay materiales disponibles'}
          descripcion={hayFiltros ? 'Prueba con otro emprendimiento o categoría.' : 'Agrega tu primer enlace para compartirlo con los emprendimientos'}
          accion={hayFiltros
            ? <Button variante="secondary" onClick={() => { setFiltroEmprendimiento(''); setFiltroCategoria(''); }}>Limpiar filtros</Button>
            : <Button variante="accent" icono={Link2} onClick={abrirModal}>Agregar Enlace</Button>}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <caption className="sr-only">Materiales compartidos</caption>
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th scope="col" className="eyebrow text-left py-3.5 px-4">Nombre</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden lg:table-cell">Tipo</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden md:table-cell">Categoría</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden md:table-cell">Emprendimientos</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden xl:table-cell">Sesión</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden xl:table-cell">Tamaño</th>
                  <th scope="col" className="eyebrow text-left py-3.5 px-4 hidden lg:table-cell">Fecha</th>
                  <th scope="col" className="eyebrow text-right py-3.5 px-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {archivos.map((arch) => {
                  const categoria = estadoDe(CATEGORIAS_ARCHIVO, arch.categoria);
                  return (
                    <tr key={arch.id} className="border-t border-gray-50 hover:bg-brand-cyan/5 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-gray-50 rounded-lg shrink-0"><IconoArchivo archivo={arch} /></div>
                          <div className="min-w-0">
                            <span className="font-medium text-brand-dark block truncate max-w-xs">{arch.nombre_original}</span>
                            {arch.descripcion && (
                              <p className="text-xs text-gray-600 mt-0.5 max-w-xs whitespace-pre-line break-words">{arch.descripcion}</p>
                            )}
                            {/* Resumen de las columnas ocultas en pantallas pequeñas */}
                            <p className="text-xs text-gray-500 mt-0.5 md:hidden">
                              {categoria.label}
                              {arch.emprendimientos?.length > 0 && ` · ${arch.emprendimientos.map(e => e.nombre).join(', ')}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 hidden lg:table-cell">
                        <Badge tono={arch.tipo === 'enlace' ? 'cyan' : 'neutral'}>{arch.tipo === 'enlace' ? 'Enlace' : 'Archivo'}</Badge>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <Badge tono={categoria.tono}>{categoria.label}</Badge>
                      </td>
                      <td className="py-3.5 px-4 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1">
                          {arch.emprendimientos?.map(emp => (
                            <Badge key={emp.id} tono="cyan" forma="tag">{emp.nombre}</Badge>
                          ))}
                          {(!arch.emprendimientos || arch.emprendimientos.length === 0) && <span className="text-xs text-gray-500">Sin asignar</span>}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 hidden xl:table-cell">
                        {arch.sesion ? (
                          <Link to={`/sesiones/${arch.sesion.id}`} className="text-xs text-brand-purple hover:underline font-medium">
                            {arch.sesion.titulo}
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-500">Sin sesión</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-gray-600 hidden xl:table-cell tabular-nums">{arch.tipo === 'enlace' ? '-' : formatSize(arch.tamanio)}</td>
                      <td className="py-3.5 px-4 text-gray-600 hidden lg:table-cell">{formatFecha(arch.createdAt) || '-'}</td>
                      <td className="py-2 px-2 sm:px-4 text-right">
                        <div className="flex justify-end gap-0.5">
                          {arch.tipo === 'enlace' ? (
                            <a
                              href={arch.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Abrir enlace ${arch.nombre_original}`}
                              title="Abrir enlace"
                              className="inline-flex items-center justify-center min-w-10 min-h-10 rounded-xl text-brand-cyan-ink hover:bg-brand-cyan/10 transition-colors"
                            >
                              <ExternalLink size={15} aria-hidden="true" />
                            </a>
                          ) : (
                            <IconButton label={`Descargar ${arch.nombre_original}`} icono={Download} tamanioIcono={15} tono="brand" onClick={() => descargarArchivo(arch.id, arch.nombre_original)} />
                          )}
                          {esAdmin && (
                            <IconButton label={`Eliminar ${arch.nombre_original}`} icono={Trash2} tamanioIcono={15} tono="danger" onClick={() => eliminar(arch)} />
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

      {/* Modal Agregar Enlace */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Agregar Enlace" size="lg">
        <form onSubmit={guardarEnlace} className="space-y-5">
          <Field label="Nombre del enlace" requerido>
            <Input type="text" value={formEnlace.nombre} onChange={(e) => setFormEnlace(prev => ({ ...prev, nombre: e.target.value }))} placeholder="Ej: Grabación Taller #1" />
          </Field>
          <Field label="URL" requerido ayuda="Debe empezar con http:// o https://">
            <Input type="url" value={formEnlace.url} onChange={(e) => setFormEnlace(prev => ({ ...prev, url: e.target.value }))} placeholder="https://..." />
          </Field>
          <Field label="Descripción">
            <Textarea value={formEnlace.descripcion} onChange={(e) => setFormEnlace(prev => ({ ...prev, descripcion: e.target.value }))} rows={3} placeholder="Explica brevemente para qué sirve este material o qué contiene el enlace" className="resize-y min-h-[96px]" />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Categoría">
              <Select value={formEnlace.categoria} onChange={(e) => setFormEnlace(prev => ({ ...prev, categoria: e.target.value }))}>
                <option value="bmc">Business Model Canvas</option>
                <option value="taller">Trabajo de Taller</option>
                <option value="entregable">Entregable</option>
                <option value="grabacion">Grabación</option>
                <option value="otro">Otro</option>
              </Select>
            </Field>
            <Field label="Sesión">
              <Select value={formEnlace.sesion_id} onChange={(e) => setFormEnlace(prev => ({ ...prev, sesion_id: e.target.value }))}>
                <option value="">Sin asignar</option>
                {sesiones.map(s => <option key={s.id} value={s.id}>{s.titulo} ({formatFecha(s.fecha)})</option>)}
              </Select>
            </Field>
          </div>
          <CheckboxEmprendimientos emprendimientos={emprendimientos} selectedIds={formEnlace.emprendimiento_ids} onToggle={toggleEmpEnlace} />
          <ModalPie>
            <Button variante="ghost" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" variante="accent" cargando={subiendo} icono={Link2}>
              {subiendo ? 'Guardando...' : 'Guardar Enlace'}
            </Button>
          </ModalPie>
        </form>
      </Modal>
    </div>
  );
};

export default Archivos;
