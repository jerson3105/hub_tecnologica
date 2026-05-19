import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { descargarArchivo } from '../services/api';
import Modal from '../components/Modal';
import { useAuth } from '../context/AuthContext';
import { Upload, Download, Trash2, FileUp, File, Image, FileText, Film, Link2, ExternalLink, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useQuery } from '@tanstack/react-query';
import { useEmprendimientos, useSesiones, useInvalidate } from '../hooks/useQueryHooks';

const INPUT_CLS = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';
const LABEL_CLS = 'block text-sm font-semibold text-brand-dark mb-1.5';

const Archivos = () => {
  const { esAdmin } = useAuth();
  const invalidate = useInvalidate();
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTipo, setModalTipo] = useState('archivo');
  const [filtroEmprendimiento, setFiltroEmprendimiento] = useState('');
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [formArchivo, setFormArchivo] = useState({
    archivo: null, categoria: 'otro', emprendimiento_ids: [], sesion_id: ''
  });
  const [formEnlace, setFormEnlace] = useState({
    nombre: '', url: '', categoria: 'otro', emprendimiento_ids: [], sesion_id: ''
  });

  const archParams = {};
  if (filtroEmprendimiento) archParams.emprendimiento_id = filtroEmprendimiento;
  if (filtroCategoria) archParams.categoria = filtroCategoria;

  const { data: archivos = [], isLoading: l1 } = useQuery({
    queryKey: ['archivos', archParams],
    queryFn: () => api.get('/archivos', { params: archParams }).then(r => r.data.archivos)
  });
  const { data: emprendimientos = [] } = useEmprendimientos();
  const { data: sesiones = [] } = useSesiones();
  const cargando = l1;

  const toggleEmpArchivo = (empId) => {
    setFormArchivo(prev => ({
      ...prev,
      emprendimiento_ids: prev.emprendimiento_ids.includes(empId)
        ? prev.emprendimiento_ids.filter(id => id !== empId)
        : [...prev.emprendimiento_ids, empId]
    }));
  };

  const toggleEmpEnlace = (empId) => {
    setFormEnlace(prev => ({
      ...prev,
      emprendimiento_ids: prev.emprendimiento_ids.includes(empId)
        ? prev.emprendimiento_ids.filter(id => id !== empId)
        : [...prev.emprendimiento_ids, empId]
    }));
  };

  const abrirModal = (tipo) => {
    setModalTipo(tipo);
    if (tipo === 'archivo') {
      setFormArchivo({ archivo: null, categoria: 'otro', emprendimiento_ids: [], sesion_id: '' });
    } else {
      setFormEnlace({ nombre: '', url: '', categoria: 'otro', emprendimiento_ids: [], sesion_id: '' });
    }
    setModalOpen(true);
  };

  const subirArchivo = async (e) => {
    e.preventDefault();
    if (!formArchivo.archivo) {
      toast.error('Selecciona un archivo');
      return;
    }

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append('archivo', formArchivo.archivo);
      formData.append('categoria', formArchivo.categoria);
      if (formArchivo.emprendimiento_ids.length > 0) {
        formData.append('emprendimiento_ids', JSON.stringify(formArchivo.emprendimiento_ids));
      }
      if (formArchivo.sesion_id) formData.append('sesion_id', formArchivo.sesion_id);

      await api.post('/archivos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Archivo subido exitosamente');
      setModalOpen(false);
      invalidate('archivos');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al subir archivo');
    } finally {
      setSubiendo(false);
    }
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

  const eliminar = async (id) => {
    if (!confirm('¿Eliminar este recurso?')) return;
    try {
      await api.delete(`/archivos/${id}`);
      toast.success('Recurso eliminado');
      invalidate('archivos');
    } catch (error) {
      toast.error('Error al eliminar');
    }
  };

  const getIcono = (arch) => {
    if (arch.tipo === 'enlace') return <Link2 size={18} className="text-brand-cyan" />;
    if (arch.tipo_mime?.startsWith('image/')) return <Image size={18} className="text-brand-green" />;
    if (arch.tipo_mime?.startsWith('video/')) return <Film size={18} className="text-brand-purple" />;
    if (arch.tipo_mime?.includes('pdf')) return <FileText size={18} className="text-red-500" />;
    return <File size={18} className="text-gray-400" />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const formatFecha = (fecha) => {
    if (!fecha) return '-';
    try { return new Date(fecha).toLocaleDateString('es-ES'); } catch { return '-'; }
  };

  const categoriaLabels = { bmc: 'BMC', taller: 'Taller', entregable: 'Entregable', grabacion: 'Grabación', otro: 'Otro' };

  const CheckboxEmprendimientos = ({ selectedIds, onToggle }) => (
    <div>
      <label className={LABEL_CLS}>Emprendimientos <span className="text-xs text-gray-400 font-normal">(selecciona uno o más)</span></label>
      <div className="max-h-36 overflow-y-auto border border-gray-200 rounded-xl p-2 space-y-1">
        {emprendimientos.map(emp => (
          <label key={emp.id} className={`flex items-center gap-2 p-2.5 rounded-xl cursor-pointer hover:bg-brand-cyan/5 transition-colors ${selectedIds.includes(emp.id) ? 'bg-brand-cyan/10 border border-brand-cyan/20' : ''}`}>
            <input type="checkbox" checked={selectedIds.includes(emp.id)} onChange={() => onToggle(emp.id)} className="rounded border-gray-300 text-brand-cyan focus:ring-brand-cyan" />
            <span className="text-sm text-brand-dark font-medium">{emp.nombre}</span>
            <span className="text-xs text-gray-400 ml-auto">{emp.programa?.nombre}</span>
          </label>
        ))}
      </div>
      {selectedIds.length > 0 && <p className="text-xs text-brand-cyan font-semibold mt-1.5">{selectedIds.length} seleccionado(s)</p>}
    </div>
  );

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-green/10 rounded-xl"><FileUp size={22} className="text-brand-green" /></div>
            Archivos y Enlaces
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Gestión de documentos, entregables y enlaces</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select value={filtroEmprendimiento} onChange={(e) => setFiltroEmprendimiento(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all">
            <option value="">Todos los emprendimientos</option>
            {emprendimientos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
          </select>
          <select value={filtroCategoria} onChange={(e) => setFiltroCategoria(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all">
            <option value="">Todas las categorías</option>
            <option value="bmc">BMC</option>
            <option value="taller">Taller</option>
            <option value="entregable">Entregable</option>
            <option value="grabacion">Grabación</option>
            <option value="otro">Otro</option>
          </select>
          <button onClick={() => abrirModal('archivo')} className="bg-brand-dark text-white px-5 py-2.5 rounded-xl hover:bg-brand-dark/90 flex items-center gap-2 text-sm font-medium whitespace-nowrap shadow-sm transition-all hover:shadow-md">
            <Upload size={18} /> Subir Archivo
          </button>
          <button onClick={() => abrirModal('enlace')} className="bg-brand-cyan text-white px-5 py-2.5 rounded-xl hover:bg-brand-cyan/90 flex items-center gap-2 text-sm font-medium whitespace-nowrap shadow-sm transition-all hover:shadow-md">
            <Link2 size={18} /> Agregar Enlace
          </button>
        </div>
      </div>

      {archivos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileUp size={32} className="text-brand-green" />
          </div>
          <p className="text-gray-500 font-medium">No hay archivos ni enlaces</p>
          <p className="text-gray-400 text-sm mt-1">Sube tu primer archivo o agrega un enlace</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Nombre</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Tipo</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Categoría</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Emprendimientos</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Sesión</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Tamaño</th>
                  <th className="text-left py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Fecha</th>
                  <th className="text-right py-3.5 px-4 font-semibold text-brand-dark/60 text-xs uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {archivos.map((arch) => (
                  <tr key={arch.id} className="border-t border-gray-50 hover:bg-brand-cyan/5 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 bg-gray-50 rounded-lg">{getIcono(arch)}</div>
                        <span className="font-medium text-brand-dark truncate max-w-xs">{arch.nombre_original}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${arch.tipo === 'enlace' ? 'bg-brand-cyan/15 text-brand-dark' : 'bg-gray-100 text-gray-600'}`}>
                        {arch.tipo === 'enlace' ? 'Enlace' : 'Archivo'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand-purple/10 text-brand-purple">
                        {categoriaLabels[arch.categoria] || arch.categoria}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {arch.emprendimientos?.map(emp => (
                          <span key={emp.id} className="px-2 py-0.5 rounded-md text-[10px] bg-brand-cyan/10 text-brand-cyan font-semibold">{emp.nombre}</span>
                        ))}
                        {(!arch.emprendimientos || arch.emprendimientos.length === 0) && <span className="text-xs text-gray-300">Sin asignar</span>}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      {arch.sesion ? (
                        <Link to={`/sesiones/${arch.sesion.id}`} className="text-xs text-brand-purple hover:text-brand-dark font-medium transition-colors">
                          {arch.sesion.titulo}
                        </Link>
                      ) : (
                        <span className="text-xs text-gray-300">Sin sesión</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-gray-500">{arch.tipo === 'enlace' ? '-' : formatSize(arch.tamanio)}</td>
                    <td className="py-3.5 px-4 text-gray-500">{formatFecha(arch.createdAt)}</td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex justify-end gap-1">
                        {arch.tipo === 'enlace' ? (
                          <a href={arch.url} target="_blank" rel="noopener noreferrer" className="p-2 text-brand-cyan hover:bg-brand-cyan/10 rounded-xl transition-colors" title="Abrir enlace">
                            <ExternalLink size={15} />
                          </a>
                        ) : (
                          <button onClick={() => descargarArchivo(arch.id, arch.nombre_original)} className="p-2 text-brand-dark hover:bg-brand-cyan/10 rounded-xl transition-colors" title="Descargar">
                            <Download size={15} />
                          </button>
                        )}
                        {esAdmin && (
                          <button onClick={() => eliminar(arch.id)} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors" title="Eliminar">
                            <Trash2 size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Subir Archivo */}
      <Modal isOpen={modalOpen && modalTipo === 'archivo'} onClose={() => setModalOpen(false)} title="Subir Archivo" size="lg">
        <form onSubmit={subirArchivo} className="space-y-5">
          <div>
            <label className={LABEL_CLS}>Archivo *</label>
            <input type="file" onChange={(e) => setFormArchivo({...formArchivo, archivo: e.target.files[0]})} required className={INPUT_CLS} />
            <p className="text-xs text-gray-400 mt-1.5">Máximo 10MB</p>
          </div>
          <div>
            <label className={LABEL_CLS}>Categoría</label>
            <select value={formArchivo.categoria} onChange={(e) => setFormArchivo({...formArchivo, categoria: e.target.value})} className={INPUT_CLS}>
              <option value="bmc">Business Model Canvas</option>
              <option value="taller">Trabajo de Taller</option>
              <option value="entregable">Entregable</option>
              <option value="grabacion">Grabación</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <CheckboxEmprendimientos selectedIds={formArchivo.emprendimiento_ids} onToggle={toggleEmpArchivo} />
          <div>
            <label className={LABEL_CLS}>Sesión</label>
            <select value={formArchivo.sesion_id} onChange={(e) => setFormArchivo({...formArchivo, sesion_id: e.target.value})} className={INPUT_CLS}>
              <option value="">Sin asignar</option>
              {sesiones.map(s => <option key={s.id} value={s.id}>{s.titulo}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancelar</button>
            <button type="submit" disabled={subiendo} className="px-6 py-2.5 text-sm bg-brand-dark text-white rounded-xl hover:bg-brand-dark/90 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm transition-all hover:shadow-md">
              {subiendo ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Upload size={16} />}
              {subiendo ? 'Subiendo...' : 'Subir'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Agregar Enlace */}
      <Modal isOpen={modalOpen && modalTipo === 'enlace'} onClose={() => setModalOpen(false)} title="Agregar Enlace" size="lg">
        <form onSubmit={guardarEnlace} className="space-y-5">
          <div>
            <label className={LABEL_CLS}>Nombre del enlace *</label>
            <input type="text" value={formEnlace.nombre} onChange={(e) => setFormEnlace({...formEnlace, nombre: e.target.value})} required placeholder="Ej: Grabación Taller #1" className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>URL *</label>
            <input type="url" value={formEnlace.url} onChange={(e) => setFormEnlace({...formEnlace, url: e.target.value})} required placeholder="https://..." className={INPUT_CLS} />
          </div>
          <div>
            <label className={LABEL_CLS}>Categoría</label>
            <select value={formEnlace.categoria} onChange={(e) => setFormEnlace({...formEnlace, categoria: e.target.value})} className={INPUT_CLS}>
              <option value="bmc">Business Model Canvas</option>
              <option value="taller">Trabajo de Taller</option>
              <option value="entregable">Entregable</option>
              <option value="grabacion">Grabación</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <CheckboxEmprendimientos selectedIds={formEnlace.emprendimiento_ids} onToggle={toggleEmpEnlace} />
          <div>
            <label className={LABEL_CLS}>Sesión</label>
            <select value={formEnlace.sesion_id} onChange={(e) => setFormEnlace({...formEnlace, sesion_id: e.target.value})} className={INPUT_CLS}>
              <option value="">Sin asignar</option>
              {sesiones.map(s => <option key={s.id} value={s.id}>{s.titulo}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-5 border-t border-gray-100">
            <button type="button" onClick={() => setModalOpen(false)} className="px-5 py-2.5 text-sm text-gray-600 hover:bg-gray-100 rounded-xl font-medium transition-colors">Cancelar</button>
            <button type="submit" disabled={subiendo} className="px-6 py-2.5 text-sm bg-brand-cyan text-white rounded-xl hover:bg-brand-cyan/90 disabled:opacity-50 flex items-center gap-2 font-medium shadow-sm transition-all hover:shadow-md">
              {subiendo ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <Link2 size={16} />}
              {subiendo ? 'Guardando...' : 'Guardar Enlace'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Archivos;
