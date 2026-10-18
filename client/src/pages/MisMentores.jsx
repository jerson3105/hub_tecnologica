import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { GraduationCap, Linkedin, Calendar, Search, Briefcase, Globe, Target, ExternalLink, Sparkles, AlertCircle, FileText } from 'lucide-react';
import { useMentores } from '../hooks/useQueryHooks';
import api from '../services/api';
import Modal from '../components/Modal';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Input, Select } from '../components/ui/Field';
import { clasesBoton } from '../components/ui/estilos';
import { resolveMentorPhotoUrl } from '../services/media';
import MentorMatch from './MentorMatch';

const parseJSON = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

// Grupo de etiquetas de la tarjeta: muestra `max` y un "+N", salvo con la tarjeta expandida
const GrupoEtiquetas = ({ titulo, icono, items, max, tono, expandido }) => {
  const Icono = icono;
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs text-gray-500 uppercase tracking-wider font-bold mb-1 flex items-center gap-1">
        <Icono size={10} aria-hidden="true" /> {titulo}
      </p>
      <div className="flex flex-wrap gap-1">
        {(expandido ? items : items.slice(0, max)).map(s => (
          <Badge key={s} tono={tono} forma="tag">{s}</Badge>
        ))}
        {!expandido && items.length > max && <Badge forma="tag">+{items.length - max}</Badge>}
      </div>
    </div>
  );
};

const MisMentores = () => {
  const { data: mentores = [], isLoading: cargando } = useMentores({ activo: 'true' });
  const [busqueda, setBusqueda] = useState('');
  const [filtroSesion, setFiltroSesion] = useState('');
  const [filtroStartup, setFiltroStartup] = useState('');
  const [mentorSeleccionado, setMentorSeleccionado] = useState(null);
  const [mostrarMatch, setMostrarMatch] = useState(false);
  // Misma consulta que el aviso del menú lateral: se refresca al guardar el One Pager
  const { data: estadosOnePager, isError: errorOnePager } = useQuery({
    queryKey: ['onePagerEstado'],
    queryFn: () => api.get('/one-pager/estado').then(res => res.data.estados || [])
  });
  const onePagerCompleto = errorOnePager
    ? false
    : estadosOnePager === undefined ? null : estadosOnePager.length > 0 && estadosOnePager.every(e => e.completo);

  const mentoresFiltrados = mentores.filter(m => {
    const nombre = `${m.nombre} ${m.apellido}`.toLowerCase();
    if (busqueda && !nombre.includes(busqueda.toLowerCase())) return false;
    if (filtroSesion) {
      const sesiones = parseJSON(m.sesiones);
      if (!sesiones.includes(filtroSesion)) return false;
    }
    if (filtroStartup) {
      const startups = parseJSON(m.startups);
      if (!startups.includes(filtroStartup)) return false;
    }
    return true;
  });

  const hayFiltros = !!(busqueda || filtroSesion || filtroStartup);
  const limpiarFiltros = () => {
    setBusqueda('');
    setFiltroSesion('');
    setFiltroStartup('');
  };

  // Collect unique options for filters
  const todasSesiones = [...new Set(mentores.flatMap(m => parseJSON(m.sesiones)))].sort();
  const todasStartups = [...new Set(mentores.flatMap(m => parseJSON(m.startups)))].sort();

  if (cargando) {
    return <div className="flex items-center justify-center h-64" role="status" aria-label="Cargando"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <div className="p-2 bg-brand-purple/10 rounded-xl"><GraduationCap size={22} className="text-brand-purple" aria-hidden="true" /></div>
          Red de Mentores
        </h1>
        <p className="text-gray-500 mt-1 sm:ml-12">Conoce a nuestros mentores y agenda sesiones 1 a 1</p>
      </div>

      {/* Botón Match IA */}
      {onePagerCompleto === false ? (
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
            <AlertCircle size={18} className="text-amber-600 flex-shrink-0" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-amber-800">Completa tu One Pager para desbloquear el match con IA</p>
              <p className="text-xs text-amber-700 mt-0.5">Necesitamos conocer tu proyecto para sugerirte los mejores mentores.</p>
            </div>
          </div>
          <Link to="/one-pager" className="self-start sm:self-auto flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-brand-dark text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors">
            <FileText size={14} aria-hidden="true" /> Completar One Pager
          </Link>
        </div>
      ) : onePagerCompleto === true ? (
        // Degradado desde cyan-ink (y no desde brand-cyan) para que el texto blanco tenga contraste AA
        <Button icono={Sparkles} onClick={() => setMostrarMatch(true)} className="bg-gradient-to-r from-brand-cyan-ink to-brand-purple">
          Encontrar mi mentor ideal con IA
        </Button>
      ) : null}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
            <Input
              type="text"
              aria-label="Buscar mentor por nombre"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className="pl-10"
            />
          </div>
          <Select aria-label="Filtrar por sesión" value={filtroSesion} onChange={(e) => setFiltroSesion(e.target.value)}>
            <option value="">Todas las sesiones</option>
            {todasSesiones.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Select aria-label="Filtrar por sector" value={filtroStartup} onChange={(e) => setFiltroStartup(e.target.value)}>
            <option value="">Todos los sectores</option>
            {todasStartups.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-500 font-medium" aria-live="polite">{mentoresFiltrados.length} mentor(es) encontrado(s)</p>

      {/* Mentors grid */}
      {mentoresFiltrados.length === 0 ? (
        <EmptyState
          icono={GraduationCap}
          tono="purple"
          titulo="No se encontraron mentores"
          descripcion="Intenta ajustar los filtros de búsqueda"
          accion={hayFiltros ? <Button variante="secondary" onClick={limpiarFiltros}>Limpiar filtros</Button> : null}
        />
      ) : (
        <ul className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {mentoresFiltrados.map(mentor => {
            const nombre = `${mentor.nombre} ${mentor.apellido}`;
            const expandido = mentorSeleccionado?.id === mentor.id;
            const alternar = () => setMentorSeleccionado(expandido ? null : mentor);
            const sesiones = parseJSON(mentor.sesiones);
            const startups = parseJSON(mentor.startups);
            const ods = parseJSON(mentor.ods);

            return (
              // El clic en toda la tarjeta se mantiene para ratón; con teclado se expande desde el botón del nombre
              <li
                key={mentor.id}
                onClick={alternar}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                  expandido ? 'border-brand-purple/30 ring-2 ring-brand-purple/10' : 'border-gray-100 hover:border-brand-purple/20'
                }`}
              >
                <div className="p-5">
                  {/* Header: Photo + Info */}
                  <div className="flex items-start gap-4">
                    {mentor.foto ? (
                      <img src={resolveMentorPhotoUrl(mentor.foto)} alt={`Foto de ${nombre}`} className="w-20 h-20 rounded-2xl object-cover shadow-md flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-brand-purple/10 flex items-center justify-center shadow-md flex-shrink-0" aria-hidden="true">
                        <span className="text-2xl font-bold text-brand-purple">{mentor.nombre.charAt(0)}{mentor.apellido.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-brand-dark text-lg leading-tight">
                        <button
                          type="button"
                          aria-expanded={expandido}
                          onClick={(e) => { e.stopPropagation(); alternar(); }}
                          className="text-left rounded-md hover:text-brand-purple transition-colors"
                        >
                          {nombre}
                        </button>
                      </h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn de ${nombre}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-cyan-ink bg-brand-cyan/10 rounded-lg hover:bg-brand-cyan/20 transition-colors">
                          <Linkedin size={12} aria-hidden="true" /> LinkedIn
                        </a>
                        {mentor.calendly && (
                          <a href={mentor.calendly} target="_blank" rel="noopener noreferrer" aria-label={`Agendar sesión con ${nombre}`} onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-green-ink bg-brand-green/10 rounded-lg hover:bg-brand-green/20 transition-colors">
                            <Calendar size={12} aria-hidden="true" /> Agendar
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {mentor.biografia && (
                    <p className={`text-sm text-gray-500 mt-3 leading-relaxed ${expandido ? '' : 'line-clamp-2'}`}>{mentor.biografia}</p>
                  )}

                  {/* Tags - always show */}
                  <div className="mt-3 space-y-2">
                    <GrupoEtiquetas titulo="Sesiones" icono={Briefcase} items={sesiones} max={3} tono="cyan" expandido={expandido} />
                    <GrupoEtiquetas titulo="Sectores" icono={Globe} items={startups} max={3} tono="green" expandido={expandido} />
                    <GrupoEtiquetas titulo="ODS" icono={Target} items={ods} max={2} tono="purple" expandido={expandido} />
                  </div>

                  {/* Expanded: CTA */}
                  {expandido && mentor.calendly && (
                    <a
                      href={mentor.calendly}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className={clasesBoton({ className: 'mt-4 w-full' })}
                    >
                      <ExternalLink size={14} aria-hidden="true" /> Agendar sesión con {mentor.nombre}
                    </a>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Modal Match IA: el modal compartido no se cierra con un clic fuera (se perderían las respuestas) */}
      <Modal isOpen={mostrarMatch} onClose={() => setMostrarMatch(false)} title="Encuentra tu mentor ideal" size="xl">
        <p className="text-sm text-gray-500 mb-4 flex items-center gap-2">
          <Sparkles size={16} className="text-brand-purple shrink-0" aria-hidden="true" />
          Responde algunas preguntas y nuestra IA te sugerirá los mejores mentores
        </p>
        <MentorMatch onClose={() => setMostrarMatch(false)} />
      </Modal>
    </div>
  );
};

export default MisMentores;
