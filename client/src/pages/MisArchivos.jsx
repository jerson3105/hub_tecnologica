import { Link } from 'react-router-dom';
import { descargarArchivo } from '../services/api';
import { Download, FileUp, File, Image, FileText, Film, Link2, ExternalLink, CalendarDays } from 'lucide-react';
import { useArchivos } from '../hooks/useQueryHooks';

const MisArchivos = () => {
  const { data: archivos = [], isLoading: cargando } = useArchivos();

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
          {arch.descripcion && <p className="text-sm text-gray-500 mt-2 leading-relaxed whitespace-pre-line break-words">{arch.descripcion}</p>}
          <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1.5 flex-wrap">
            <span className="px-2 py-0.5 rounded-md bg-brand-purple/10 text-brand-purple text-[10px] font-semibold">{categoriaLabels[arch.categoria] || arch.categoria}</span>
            <span className="px-2 py-0.5 rounded-md bg-brand-cyan/10 text-brand-cyan text-[10px] font-semibold">{arch.tipo === 'enlace' ? 'Enlace' : 'Archivo'}</span>
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
            Mis Materiales
          </h1>
          <p className="text-gray-400 mt-1 ml-12">Enlaces y recursos compartidos de tu emprendimiento</p>
        </div>
      </div>

      {archivos.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-green/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileUp size={32} className="text-brand-green" />
          </div>
          <p className="text-gray-500 font-medium">No hay materiales compartidos aún</p>
          <p className="text-gray-400 text-sm mt-1">Cuando se agreguen enlaces o recursos para tu emprendimiento, aparecerán aquí.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.values(archivosPorSesion).map(({ sesion, archivos: archs }) => (
            <div key={sesion.id}>
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1 bg-brand-purple/10 rounded-lg"><CalendarDays size={14} className="text-brand-purple" /></div>
                <Link to={`/sesiones/${sesion.id}`} className="font-semibold text-brand-dark hover:text-brand-purple text-sm transition-colors">
                  {sesion.titulo}
                </Link>
                <span className="text-xs text-gray-300">{formatFecha(sesion.fecha)}</span>
                <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-medium">{archs.length} material(es)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archs.map(renderArchivo)}
              </div>
            </div>
          ))}

          {archivosSinSesion.length > 0 && (
            <div>
              {Object.keys(archivosPorSesion).length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-1 bg-gray-100 rounded-lg"><File size={14} className="text-gray-400" /></div>
                  <span className="font-semibold text-brand-dark text-sm">Sin sesión asignada</span>
                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md font-medium">{archivosSinSesion.length} material(es)</span>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivosSinSesion.map(renderArchivo)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MisArchivos;
