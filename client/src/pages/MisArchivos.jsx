import { Link } from 'react-router-dom';
import { descargarArchivo } from '../services/api';
import { Download, FileUp, File, Image, FileText, Film, Link2, ExternalLink, CalendarDays } from 'lucide-react';
import { useArchivos } from '../hooks/useQueryHooks';
import { formatFecha } from '../utils/fechas';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { clasesBoton } from '../components/ui/estilos';
import { CATEGORIAS_ARCHIVO, estadoDe } from '../constants/estados';

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

const MisArchivos = () => {
  const { data: archivos = [], isLoading: cargando } = useArchivos();

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

  if (cargando) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  const renderArchivo = (arch) => {
    const categoria = estadoDe(CATEGORIAS_ARCHIVO, arch.categoria);
    return (
      <li key={arch.id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md hover:border-brand-cyan/20 transition-all shadow-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-gray-50 rounded-xl shrink-0"><IconoArchivo archivo={arch} /></div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-brand-dark text-sm truncate">{arch.nombre_original}</p>
            {arch.descripcion && <p className="text-sm text-gray-500 mt-2 leading-relaxed whitespace-pre-line break-words">{arch.descripcion}</p>}
            <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1.5 flex-wrap">
              <Badge tono={categoria.tono} forma="tag">{categoria.label}</Badge>
              <Badge tono="cyan" forma="tag">{arch.tipo === 'enlace' ? 'Enlace' : 'Archivo'}</Badge>
              {arch.tipo !== 'enlace' && <span>{formatSize(arch.tamanio)}</span>}
            </p>
            {arch.sesion && (
              <Link to={`/sesiones/${arch.sesion.id}`} className="text-xs text-brand-purple hover:text-brand-dark mt-1.5 flex items-center gap-1 font-medium transition-colors">
                <CalendarDays size={10} aria-hidden="true" /> {arch.sesion.titulo}
              </Link>
            )}
            <p className="text-xs text-gray-500 mt-1">{formatFecha(arch.createdAt || arch.created_at)}</p>
          </div>
        </div>
        {arch.tipo === 'enlace' ? (
          <a href={arch.url} target="_blank" rel="noopener noreferrer" aria-label={`Abrir enlace ${arch.nombre_original}`} className={clasesBoton({ variante: 'secondary', className: 'mt-3 w-full' })}>
            <ExternalLink size={14} aria-hidden="true" /> Abrir enlace
          </a>
        ) : (
          <Button variante="secondary" icono={Download} aria-label={`Descargar ${arch.nombre_original}`} onClick={() => descargarArchivo(arch.id, arch.nombre_original)} className="mt-3 w-full">
            Descargar
          </Button>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <div className="p-2 bg-brand-green/10 rounded-xl"><FileUp size={22} className="text-brand-green-ink" aria-hidden="true" /></div>
            Mis Materiales
          </h1>
          <p className="text-gray-500 mt-1 sm:ml-12">Enlaces y recursos compartidos de tu emprendimiento</p>
        </div>
      </div>

      {archivos.length === 0 ? (
        <EmptyState
          icono={FileUp}
          tono="green"
          titulo="No hay materiales compartidos aún"
          descripcion="Cuando se agreguen enlaces o recursos para tu emprendimiento, aparecerán aquí."
        />
      ) : (
        <div className="space-y-6">
          {Object.values(archivosPorSesion).map(({ sesion, archivos: archs }) => (
            <div key={sesion.id}>
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <div className="p-1 bg-brand-purple/10 rounded-lg"><CalendarDays size={14} className="text-brand-purple" aria-hidden="true" /></div>
                <h2 className="font-semibold text-brand-dark text-sm">
                  <Link to={`/sesiones/${sesion.id}`} className="hover:text-brand-purple transition-colors">
                    {sesion.titulo}
                  </Link>
                </h2>
                <span className="text-xs text-gray-500">{formatFecha(sesion.fecha)}</span>
                <Badge forma="tag">{archs.length} material(es)</Badge>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archs.map(renderArchivo)}
              </ul>
            </div>
          ))}

          {archivosSinSesion.length > 0 && (
            <div>
              {Object.keys(archivosPorSesion).length > 0 && (
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <div className="p-1 bg-gray-100 rounded-lg"><File size={14} className="text-gray-500" aria-hidden="true" /></div>
                  <h2 className="font-semibold text-brand-dark text-sm">Sin sesión asignada</h2>
                  <Badge forma="tag">{archivosSinSesion.length} material(es)</Badge>
                </div>
              )}
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {archivosSinSesion.map(renderArchivo)}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MisArchivos;
