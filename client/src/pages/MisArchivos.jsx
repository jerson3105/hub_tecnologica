import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api, { descargarArchivo } from '../services/api';
import Modal from '../components/Modal';
import { Upload, Download, FileUp, File, Image, FileText, Film, Link2, ExternalLink, CalendarDays } from 'lucide-react';
import toast from 'react-hot-toast';
import { useArchivos, useEmprendimientos, useInvalidate } from '../hooks/useQueryHooks';

const INPUT_CLS = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm';
const LABEL_CLS = 'block text-sm font-semibold text-brand-dark mb-1.5';

const MisArchivos = () => {
  const { data: archivos = [], isLoading: l1 } = useArchivos();
  const { data: emprendimientos = [], isLoading: l2 } = useEmprendimientos();
  const invalidate = useInvalidate();
  const cargando = l1 || l2;
  const [modalOpen, setModalOpen] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [formArchivo, setFormArchivo] = useState({
    archivo: null, categoria: 'entregable', emprendimiento_id: ''
  });

  // Set default emprendimiento_id when data loads
  useEffect(() => {
    if (emprendimientos.length > 0 && !formArchivo.emprendimiento_id) {
      setFormArchivo(prev => ({ ...prev, emprendimiento_id: emprendimientos[0].id.toString() }));
    }
  }, [emprendimientos]);

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
      if (formArchivo.emprendimiento_id) formData.append('emprendimiento_id', formArchivo.emprendimiento_id);

      await api.post('/archivos', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Archivo subido exitosamente');
      setModalOpen(false);
      setFormArchivo(prev => ({ ...prev, archivo: null }));
      invalidate('archivos');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al subir archivo');
    } finally {
      setSubiendo(false);
    }
  };

  const getIcono = (tipo) => {
    if (tipo?.startsWith('image/')) return <Image size={18} className="text-brand-green" />;
    if (tipo?.startsWith('video/')) return <Film size={18} className="text-brand-purple" />;
    if (tipo?.includes('pdf')) return <FileText size={18} className="text-red-500" />;
    return <File size={18} className="text-gray-400" />;
  };

  const formatSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const categoriaLabels = { bmc: 'BMC', taller: 'Taller', entregable: 'Entregable', grabacion: 'Grabación', otro: 'Otro' };

  const formatFecha = (fecha) => {
    if (!fecha) return '';
    try { return new Date(fecha).toLocaleDateString('es-ES'); } catch { return ''; }
  };

  // Agrupar archivos por sesión
  const archivosPorSesion = {};
  const archivosSinSesion = [];
  archivos.forEach(arch => {
    if (arch.sesion) {
      const key = arch.sesion.id;
      if (!archivosPorSesion[key]) {
        archivosPorSesion[key] = { sesion: arch.sesion, archivos: [] };
      }
      archivosPorSesion[key].archivos.push(arch);
    } else {
      archivosSinSesion.push(arch);
    }
  });

  const getIconoArch = (arch) => {
    if (arch.tipo === 'enlace') return <Link2 size={18} className="text-brand-cyan" />;
    return getIcono(arch.tipo_mime);
  };

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  const renderArchivo = (arch) => (
    <div key={arch.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-brand-cyan/20 transition-all shadow-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-gray-50 rounded-xl shrink-0">{getIconoArch(arch)}</div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-brand-dark text-sm truncate">{arch.nombre_original}</p>
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-brand-purple/10 text-brand-purple text-[10px] font-semibold">{categoriaLabels[arch.categoria] || arch.categoria}</span>
            {arch.tipo !== 'enlace' && <span>{formatSize(arch.tamanio)}</span>}
          </p>
          {arch.sesion && (
            <Link to={`/sesiones/${arch.sesion.id}`} className="text-xs text-brand-purple hover:text-brand-dark mt-1.5 flex items-center gap-1 font-medium transition-colors">
              <CalendarDays size={10} /> {arch.sesion.titulo}
            </Link>
          )}
          <p className="text-xs text-gray-300 mt-1">{formatFecha(arch.createdAt || arch.created_at)}</p>
        </div>
      </div>
      {arch.tipo === 'enlace' ? (
        <a href={arch.url} target="_blank" rel="noopener noreferrer" className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-sm text-brand-cyan hover:bg-brand-cyan/5 rounded-xl border border-brand-cyan/20 font-medium transition-colors">
          <ExternalLink size={14} /> Abrir enlace
        </a>
      ) : (
        <button onClick={() => descargarArchivo(arch.id, arch.nombre_original)} className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 text-sm text-brand-dark hover:bg-brand-cyan/5 rounded-xl border border-gray-200 font-medium transition-colors">
          <Download size={14} /> Descargar
        </button>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-green/10 rounded-xl"><FileUp size={22} className="text-brand-green" /></div>
            Mis Archivos
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Documentos y entregables de tu emprendimiento</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="bg-brand-dark text-white px-5 py-2.5 rounded-xl hover:bg-brand-dark/90 flex items-center gap-2 text-sm font-medium shadow-sm transition-all hover:shadow-md">
          <Upload size={18} /> Subir Archivo
        </button>
      </div>

      {archivos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileUp size={32} className="text-brand-green" />
          </div>
          <p className="text-gray-500 font-medium">No has subido archivos aún</p>
          <button onClick={() => setModalOpen(true)} className="mt-3 text-brand-cyan hover:text-brand-dark text-sm font-medium transition-colors">Subir primer archivo</button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Archivos agrupados por sesión */}
          {Object.values(archivosPorSesion).map(({ sesion, archivos: archs }) => (
            <div key={sesion.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-brand-purple/10 rounded-lg"><CalendarDays size={14} className="text-brand-purple" /></div>
                <Link to={`/sesiones/${sesion.id}`} className="font-semibold text-brand-dark hover:text-brand-purple text-sm transition-colors">
                  {sesion.titulo}
                </Link>
                <span className="text-xs text-gray-300">{formatFecha(sesion.fecha)}</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-medium">{archs.length} archivo(s)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archs.map(renderArchivo)}
              </div>
            </div>
          ))}

          {/* Archivos sin sesión */}
          {archivosSinSesion.length > 0 && (
            <div>
              {Object.keys(archivosPorSesion).length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 bg-gray-100 rounded-lg"><File size={14} className="text-gray-400" /></div>
                  <span className="font-semibold text-brand-dark text-sm">Sin sesión asignada</span>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-medium">{archivosSinSesion.length} archivo(s)</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivosSinSesion.map(renderArchivo)}
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Subir Archivo">
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
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className={LABEL_CLS}>Emprendimiento</label>
            <select value={formArchivo.emprendimiento_id} onChange={(e) => setFormArchivo({...formArchivo, emprendimiento_id: e.target.value})} className={INPUT_CLS}>
              {emprendimientos.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
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
    </div>
  );
};

export default MisArchivos;
