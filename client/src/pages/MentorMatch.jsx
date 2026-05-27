import { useState } from 'react';
import api from '../services/api';
import { resolveMentorPhotoUrl } from '../services/media';
import { Sparkles, ChevronRight, ChevronLeft, Loader2, GraduationCap, Target, Trophy, MessageSquare, ExternalLink, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

const AREAS = [
  'Tecnología',
  'Product Market Fit',
  'Comercial / Ventas',
  'Finanzas',
  'Legal / Tributos',
  'Logística',
  'Producto',
  'Marketing / Comunicación',
  'Comercio Internacional',
  'Liderazgo / Gestión de equipos',
  'Innovación / Desarrollo de producto'
];

const PREFERENCIAS = [
  { value: 'En mi sector específico', label: 'En mi sector específico' },
  { value: 'Con visión general de negocios', label: 'Con visión general de negocios' },
  { value: 'No tengo preferencias', label: 'No tengo preferencias' }
];

const INPUT_CLS = 'w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-cyan/40 focus:border-brand-cyan outline-none transition-all text-sm resize-none';

const parseJSON = (val) => {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
  return [];
};

const MentorMatch = ({ onClose }) => {
  const [paso, setPaso] = useState(1);
  const [procesando, setProcesando] = useState(false);
  const [resultados, setResultados] = useState(null);

  const [form, setForm] = useState({
    areas: [],
    otros_area: '',
    apoyo_esperado: '',
    reto_principal: '',
    resultados_esperados: '',
    preferencia_sector: '',
    comentarios: ''
  });

  const toggleArea = (area) => {
    setForm(prev => ({
      ...prev,
      areas: prev.areas.includes(area)
        ? prev.areas.filter(a => a !== area)
        : [...prev.areas, area]
    }));
  };

  const puedeAvanzar = () => {
    if (paso === 1) return form.areas.length > 0;
    if (paso === 2) return form.reto_principal.trim().length > 0;
    if (paso === 3) return form.preferencia_sector !== '';
    return true;
  };

  const enviarMatch = async () => {
    setProcesando(true);
    try {
      const areasFinales = [...form.areas];
      if (form.otros_area.trim()) areasFinales.push(form.otros_area.trim());

      const res = await api.post('/ia/match-mentor', {
        areas: areasFinales,
        apoyo_esperado: form.apoyo_esperado,
        reto_principal: form.reto_principal,
        resultados_esperados: form.resultados_esperados,
        preferencia_sector: form.preferencia_sector,
        comentarios: form.comentarios
      });

      setResultados(res.data.matches);
      setPaso(5);
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'Error al procesar el match');
    } finally {
      setProcesando(false);
    }
  };

  const reiniciar = () => {
    setForm({ areas: [], otros_area: '', apoyo_esperado: '', reto_principal: '', resultados_esperados: '', preferencia_sector: '', comentarios: '' });
    setResultados(null);
    setPaso(1);
  };

  const compatibilidadColor = (pct) => {
    if (pct >= 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (pct >= 60) return 'text-brand-cyan bg-brand-cyan/10 border-brand-cyan/30';
    return 'text-amber-600 bg-amber-50 border-amber-200';
  };

  const compatibilidadBarra = (pct) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-brand-cyan';
    return 'bg-amber-500';
  };

  // ──────────── PASO 1: Áreas ────────────
  const renderPaso1 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-brand-dark mb-1">¿En qué área(s) te gustaría recibir mentoría?</h3>
        <p className="text-sm text-gray-400">Selecciona todas las que apliquen</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {AREAS.map(area => (
          <button
            key={area}
            type="button"
            onClick={() => toggleArea(area)}
            className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left text-sm font-medium transition-all ${
              form.areas.includes(area)
                ? 'border-brand-cyan bg-brand-cyan/10 text-brand-dark ring-1 ring-brand-cyan/30'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
              form.areas.includes(area) ? 'border-brand-cyan bg-brand-cyan' : 'border-gray-300'
            }`}>
              {form.areas.includes(area) && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            {area}
          </button>
        ))}
      </div>
      <div>
        <label className="block text-sm font-semibold text-brand-dark mb-1.5">Otros (opcional)</label>
        <input
          type="text"
          value={form.otros_area}
          onChange={e => setForm(prev => ({ ...prev, otros_area: e.target.value }))}
          placeholder="Escribe otra área si no aparece en la lista"
          className={INPUT_CLS}
        />
      </div>
    </div>
  );

  // ──────────── PASO 2: Reto y apoyo ────────────
  const renderPaso2 = () => (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-semibold text-brand-dark mb-1.5">
          Describe brevemente qué tipo de apoyo o guía esperas del mentor en las áreas seleccionadas
        </label>
        <textarea
          value={form.apoyo_esperado}
          onChange={e => setForm(prev => ({ ...prev, apoyo_esperado: e.target.value }))}
          rows={3}
          placeholder="Ej: Necesito orientación para definir mi modelo de negocio y validar mi propuesta de valor..."
          className={INPUT_CLS}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-brand-dark mb-1.5">
          ¿Cuál es el principal reto o desafío que estás enfrentando actualmente? <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-400 mb-1.5">Describe bien tu principal reto o el apoyo que necesitas por parte del mentor(a).</p>
        <textarea
          value={form.reto_principal}
          onChange={e => setForm(prev => ({ ...prev, reto_principal: e.target.value }))}
          rows={3}
          placeholder="Ej: Tengo dificultades para conseguir mis primeros clientes..."
          className={INPUT_CLS}
        />
      </div>
      <div>
        <label className="block text-sm font-semibold text-brand-dark mb-1.5">
          ¿Qué resultados te gustaría lograr al finalizar tus sesiones de mentoría?
        </label>
        <textarea
          value={form.resultados_esperados}
          onChange={e => setForm(prev => ({ ...prev, resultados_esperados: e.target.value }))}
          rows={3}
          placeholder="Ej: Tener una estrategia de ventas clara y conseguir al menos 5 clientes piloto..."
          className={INPUT_CLS}
        />
      </div>
    </div>
  );

  // ──────────── PASO 3: Preferencia ────────────
  const renderPaso3 = () => (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-brand-dark mb-1">¿Prefieres un mentor con experiencia en tu sector o con visión más general de negocios?</h3>
        <p className="text-sm text-gray-400">Selecciona una opción</p>
      </div>
      <div className="space-y-3">
        {PREFERENCIAS.map(pref => (
          <button
            key={pref.value}
            type="button"
            onClick={() => setForm(prev => ({ ...prev, preferencia_sector: pref.value }))}
            className={`w-full flex items-center gap-3 px-5 py-4 rounded-xl border text-left text-sm font-medium transition-all ${
              form.preferencia_sector === pref.value
                ? 'border-brand-cyan bg-brand-cyan/10 text-brand-dark ring-1 ring-brand-cyan/30'
                : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
              form.preferencia_sector === pref.value ? 'border-brand-cyan' : 'border-gray-300'
            }`}>
              {form.preferencia_sector === pref.value && (
                <div className="w-2.5 h-2.5 rounded-full bg-brand-cyan" />
              )}
            </div>
            {pref.label}
          </button>
        ))}
      </div>
      <div>
        <label className="block text-sm font-semibold text-brand-dark mb-1.5">
          Comentarios o sugerencias adicionales sobre tu proceso de mentoría
        </label>
        <textarea
          value={form.comentarios}
          onChange={e => setForm(prev => ({ ...prev, comentarios: e.target.value }))}
          rows={3}
          placeholder="Cualquier información adicional que nos ayude a encontrar el mentor ideal para ti..."
          className={INPUT_CLS}
        />
      </div>
    </div>
  );

  // ──────────── PASO 4: Confirmación / Procesando ────────────
  const renderPaso4 = () => (
    <div className="text-center py-10 space-y-6">
      {procesando ? (
        <>
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20 rounded-2xl flex items-center justify-center animate-pulse">
            <Sparkles size={36} className="text-brand-cyan" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-brand-dark mb-2">Analizando tu perfil...</h3>
            <p className="text-gray-400 text-sm">Nuestra IA está comparando tus necesidades con los perfiles de mentores disponibles</p>
          </div>
          <Loader2 size={28} className="mx-auto text-brand-cyan animate-spin" />
        </>
      ) : (
        <>
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20 rounded-2xl flex items-center justify-center">
            <Sparkles size={36} className="text-brand-purple" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-brand-dark mb-2">¿Todo listo?</h3>
            <p className="text-gray-400 text-sm">Revisaremos tus respuestas y te sugeriremos los mejores mentores para ti</p>
          </div>
          <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
            <p><span className="font-semibold text-brand-dark">Áreas:</span> <span className="text-gray-500">{[...form.areas, form.otros_area].filter(Boolean).join(', ')}</span></p>
            <p><span className="font-semibold text-brand-dark">Reto:</span> <span className="text-gray-500">{form.reto_principal}</span></p>
            <p><span className="font-semibold text-brand-dark">Preferencia:</span> <span className="text-gray-500">{form.preferencia_sector}</span></p>
          </div>
          <button
            onClick={enviarMatch}
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-brand-cyan to-brand-purple text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-brand-cyan/25 transition-all"
          >
            <Sparkles size={18} />
            Encontrar mi mentor ideal
          </button>
        </>
      )}
    </div>
  );

  // ──────────── PASO 5: Resultados ────────────
  const renderResultados = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-brand-dark mb-1">Resultados del Match</h3>
        <p className="text-sm text-gray-400">Basado en tus respuestas, estos son los mentores que mejor se ajustan a tus necesidades</p>
      </div>

      <div className="space-y-4">
        {resultados?.map((match, idx) => (
          <div key={match.mentor?.id || idx} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-4">
              {/* Foto / Avatar */}
              <div className="flex-shrink-0">
                {match.mentor?.foto ? (
                  <img src={resolveMentorPhotoUrl(match.mentor.foto)} alt={match.mentor.nombre} className="w-16 h-16 rounded-xl object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20 flex items-center justify-center">
                    <GraduationCap size={28} className="text-brand-cyan" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <h4 className="text-lg font-bold text-brand-dark">
                    {idx === 0 && <span className="text-brand-cyan">🏆 </span>}
                    {match.mentor?.nombre} {match.mentor?.apellido}
                  </h4>
                  <span className={`flex-shrink-0 px-3 py-1 text-sm font-bold rounded-full border ${compatibilidadColor(match.compatibilidad)}`}>
                    {match.compatibilidad}%
                  </span>
                </div>

                {/* Barra de compatibilidad */}
                <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${compatibilidadBarra(match.compatibilidad)}`}
                    style={{ width: `${match.compatibilidad}%` }}
                  />
                </div>

                {/* Razón del match */}
                <p className="text-sm text-gray-600 leading-relaxed mb-3">{match.razon}</p>

                {/* Tags */}
                {(() => {
                  const sesiones = parseJSON(match.mentor?.sesiones);
                  const startups = parseJSON(match.mentor?.startups);
                  return (sesiones.length > 0 || startups.length > 0) ? (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {sesiones.map(s => (
                        <span key={s} className="px-2 py-0.5 text-xs font-medium bg-brand-cyan/10 text-brand-dark rounded-md">{s}</span>
                      ))}
                      {startups.map(s => (
                        <span key={s} className="px-2 py-0.5 text-xs font-medium bg-brand-purple/10 text-brand-purple rounded-md">{s}</span>
                      ))}
                    </div>
                  ) : null;
                })()}

                {/* Acciones */}
                <div className="flex items-center gap-3">
                  {match.mentor?.linkedin && (
                    <a href={match.mentor.linkedin} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                      <ExternalLink size={12} /> LinkedIn
                    </a>
                  )}
                  {match.mentor?.calendly && (
                    <a href={match.mentor.calendly} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-green hover:text-emerald-700 transition-colors">
                      <ExternalLink size={12} /> Agendar sesión
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-2">
        <button
          onClick={reiniciar}
          className="inline-flex items-center gap-2 px-6 py-2.5 border border-gray-200 text-sm font-medium text-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} />
          Realizar otro match
        </button>
      </div>
    </div>
  );

  // ──────────── STEPPER ────────────
  const pasos = [
    { num: 1, label: 'Áreas', icon: Target },
    { num: 2, label: 'Reto', icon: MessageSquare },
    { num: 3, label: 'Preferencia', icon: Trophy },
    { num: 4, label: 'Match', icon: Sparkles }
  ];

  return (
    <div className="space-y-5">
      {/* Stepper */}
      {paso < 5 && (
        <div className="flex items-center justify-center gap-1">
          {pasos.map((p, i) => (
            <div key={p.num} className="flex items-center">
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                paso >= p.num
                  ? paso === p.num ? 'bg-brand-cyan text-white' : 'bg-brand-cyan/15 text-brand-cyan'
                  : 'bg-gray-100 text-gray-400'
              }`}>
                <p.icon size={14} />
                <span className="hidden sm:inline">{p.label}</span>
              </div>
              {i < pasos.length - 1 && <div className={`w-8 h-0.5 mx-1 ${paso > p.num ? 'bg-brand-cyan/30' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div>
        {paso === 1 && renderPaso1()}
        {paso === 2 && renderPaso2()}
        {paso === 3 && renderPaso3()}
        {paso === 4 && renderPaso4()}
        {paso === 5 && renderResultados()}
      </div>

      {/* Navigation */}
      {paso < 4 && (
        <div className="flex justify-between pt-2">
          <button
            onClick={() => paso === 1 ? onClose?.() : setPaso(p => p - 1)}
            className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-medium rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <ChevronLeft size={16} /> {paso === 1 ? 'Cancelar' : 'Anterior'}
          </button>
          <button
            onClick={() => setPaso(p => p + 1)}
            disabled={!puedeAvanzar()}
            className={`flex items-center gap-1.5 px-5 py-2.5 text-sm font-semibold rounded-xl transition-all ${
              puedeAvanzar()
                ? 'bg-brand-dark text-white hover:bg-brand-dark/90'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            Siguiente <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MentorMatch;
