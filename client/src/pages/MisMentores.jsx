import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { GraduationCap, Linkedin, Calendar, Search, Briefcase, Globe, Target, ExternalLink, Sparkles, X, AlertCircle, FileText } from 'lucide-react';
import { useMentores } from '../hooks/useQueryHooks';
import api from '../services/api';
import { resolveMentorPhotoUrl } from '../services/media';
import MentorMatch from './MentorMatch';

const parseJSON = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

const MisMentores = () => {
  const { data: mentores = [], isLoading: cargando } = useMentores({ activo: 'true' });
  const [busqueda, setBusqueda] = useState('');
  const [filtroSesion, setFiltroSesion] = useState('');
  const [filtroStartup, setFiltroStartup] = useState('');
  const [mentorSeleccionado, setMentorSeleccionado] = useState(null);
  const [mostrarMatch, setMostrarMatch] = useState(false);
  const [onePagerCompleto, setOnePagerCompleto] = useState(null);

  useEffect(() => {
    api.get('/one-pager/estado').then(res => {
      const estados = res.data.estados || [];
      const todosCompletos = estados.length > 0 && estados.every(e => e.completo);
      setOnePagerCompleto(todosCompletos);
    }).catch(() => setOnePagerCompleto(false));
  }, []);

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

  // Collect unique options for filters
  const todasSesiones = [...new Set(mentores.flatMap(m => parseJSON(m.sesiones)))].sort();
  const todasStartups = [...new Set(mentores.flatMap(m => parseJSON(m.startups)))].sort();

  if (cargando) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-cyan"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <div className="p-2 bg-brand-purple/10 rounded-xl"><GraduationCap size={22} className="text-brand-purple" /></div>
          Red de Mentores
        </h1>
        <p className="text-gray-400 mt-1 ml-12">Conoce a nuestros mentores y agenda sesiones 1 a 1</p>
      </div>

      {/* Botón Match IA */}
      {onePagerCompleto === false ? (
        <div className="flex items-center gap-3 px-5 py-3 bg-amber-50 border border-amber-200 rounded-xl">
          <AlertCircle size={18} className="text-amber-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Completa tu One Pager para desbloquear el match con IA</p>
            <p className="text-xs text-amber-600 mt-0.5">Necesitamos conocer tu proyecto para sugerirte los mejores mentores.</p>
          </div>
          <Link to="/one-pager" className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white text-xs font-semibold rounded-lg hover:bg-amber-600 transition-colors">
            <FileText size={14} /> Completar One Pager
          </Link>
        </div>
      ) : onePagerCompleto === true ? (
        <button
          onClick={() => setMostrarMatch(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-brand-cyan to-brand-purple text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-cyan/25 transition-all text-sm"
        >
          <Sparkles size={16} />
          Encontrar mi mentor ideal con IA
        </button>
      ) : null}

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm"
            />
          </div>
          <select value={filtroSesion} onChange={(e) => setFiltroSesion(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm">
            <option value="">Todas las sesiones</option>
            {todasSesiones.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select value={filtroStartup} onChange={(e) => setFiltroStartup(e.target.value)} className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm">
            <option value="">Todos los sectores</option>
            {todasStartups.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Results count */}
      <p className="text-xs text-gray-400 font-medium">{mentoresFiltrados.length} mentor(es) encontrado(s)</p>

      {/* Mentors grid */}
      {mentoresFiltrados.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center shadow-sm">
          <div className="w-16 h-16 bg-brand-purple/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <GraduationCap size={32} className="text-brand-purple" />
          </div>
          <p className="text-gray-500 font-medium">No se encontraron mentores</p>
          <p className="text-xs text-gray-400 mt-1">Intenta ajustar los filtros de búsqueda</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {mentoresFiltrados.map(mentor => {
            const sesiones = parseJSON(mentor.sesiones);
            const startups = parseJSON(mentor.startups);
            const ods = parseJSON(mentor.ods);

            return (
              <div
                key={mentor.id}
                onClick={() => setMentorSeleccionado(mentorSeleccionado?.id === mentor.id ? null : mentor)}
                className={`bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                  mentorSeleccionado?.id === mentor.id ? 'border-brand-purple/30 ring-2 ring-brand-purple/10' : 'border-gray-100 hover:border-brand-purple/20'
                }`}
              >
                <div className="p-5">
                  {/* Header: Photo + Info */}
                  <div className="flex items-start gap-4">
                    {mentor.foto ? (
                      <img src={resolveMentorPhotoUrl(mentor.foto)} alt={mentor.nombre} className="w-20 h-20 rounded-2xl object-cover shadow-md flex-shrink-0" />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-brand-purple/10 flex items-center justify-center shadow-md flex-shrink-0">
                        <span className="text-2xl font-bold text-brand-purple">{mentor.nombre.charAt(0)}{mentor.apellido.charAt(0)}</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-brand-dark text-lg leading-tight">{mentor.nombre} {mentor.apellido}</h3>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <a href={mentor.linkedin} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-cyan bg-brand-cyan/10 rounded-lg hover:bg-brand-cyan/20 transition-colors">
                          <Linkedin size={12} /> LinkedIn
                        </a>
                        {mentor.calendly && (
                          <a href={mentor.calendly} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-brand-green bg-brand-green/10 rounded-lg hover:bg-brand-green/20 transition-colors">
                            <Calendar size={12} /> Agendar
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Bio */}
                  {mentor.biografia && (
                    <p className={`text-sm text-gray-500 mt-3 leading-relaxed ${mentorSeleccionado?.id === mentor.id ? '' : 'line-clamp-2'}`}>{mentor.biografia}</p>
                  )}

                  {/* Tags - always show */}
                  <div className="mt-3 space-y-2">
                    {sesiones.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-300 uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><Briefcase size={10} /> Sesiones</p>
                        <div className="flex flex-wrap gap-1">
                          {(mentorSeleccionado?.id === mentor.id ? sesiones : sesiones.slice(0, 3)).map(s => (
                            <span key={s} className="px-2 py-0.5 text-[10px] font-semibold bg-brand-cyan/10 text-brand-cyan rounded-md">{s}</span>
                          ))}
                          {mentorSeleccionado?.id !== mentor.id && sesiones.length > 3 && <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-400 rounded-md">+{sesiones.length - 3}</span>}
                        </div>
                      </div>
                    )}
                    {startups.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-300 uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><Globe size={10} /> Sectores</p>
                        <div className="flex flex-wrap gap-1">
                          {(mentorSeleccionado?.id === mentor.id ? startups : startups.slice(0, 3)).map(s => (
                            <span key={s} className="px-2 py-0.5 text-[10px] font-semibold bg-brand-green/10 text-brand-green rounded-md">{s}</span>
                          ))}
                          {mentorSeleccionado?.id !== mentor.id && startups.length > 3 && <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-400 rounded-md">+{startups.length - 3}</span>}
                        </div>
                      </div>
                    )}
                    {ods.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-300 uppercase tracking-wider font-bold mb-1 flex items-center gap-1"><Target size={10} /> ODS</p>
                        <div className="flex flex-wrap gap-1">
                          {(mentorSeleccionado?.id === mentor.id ? ods : ods.slice(0, 2)).map(o => (
                            <span key={o} className="px-2 py-0.5 text-[10px] font-semibold bg-brand-purple/10 text-brand-purple rounded-md">{o}</span>
                          ))}
                          {mentorSeleccionado?.id !== mentor.id && ods.length > 2 && <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-400 rounded-md">+{ods.length - 2}</span>}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Expanded: CTA */}
                  {mentorSeleccionado?.id === mentor.id && mentor.calendly && (
                    <a
                      href={mentor.calendly}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-white bg-brand-dark rounded-xl hover:bg-brand-dark/90 shadow-sm transition-all hover:shadow-md"
                    >
                      <ExternalLink size={14} /> Agendar sesión con {mentor.nombre}
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Match IA */}
      {mostrarMatch && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 pb-10 overflow-y-auto">
          <div className="fixed inset-0 bg-black/50" onClick={() => setMostrarMatch(false)} />
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl mx-4 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20 rounded-xl">
                  <Sparkles size={20} className="text-brand-purple" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-brand-dark">Encuentra tu mentor ideal</h2>
                  <p className="text-xs text-gray-400">Responde algunas preguntas y nuestra IA te sugerirá los mejores mentores</p>
                </div>
              </div>
              <button onClick={() => setMostrarMatch(false)} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            <MentorMatch onClose={() => setMostrarMatch(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default MisMentores;

