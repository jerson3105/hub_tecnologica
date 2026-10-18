import { useState } from 'react';
import api from '../services/api';
import { resolveMentorPhotoUrl } from '../services/media';
import { Sparkles, ChevronRight, ChevronLeft, Loader2, GraduationCap, Target, Trophy, MessageSquare, ExternalLink, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import EmptyState from '../components/ui/EmptyState';
import { Field, Input, Textarea } from '../components/ui/Field';

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

// Opción seleccionable (chip de área o tarjeta de preferencia)
const OPCION_CLS = (activa) => `flex items-center gap-3 rounded-xl border text-left text-sm font-medium transition-all ${
  activa
    ? 'border-brand-cyan bg-brand-cyan/10 text-brand-dark ring-1 ring-brand-cyan/30'
    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
}`;

// Degradado desde cyan-ink (y no desde brand-cyan) para que el texto blanco tenga contraste AA
const DEGRADADO_IA = 'bg-gradient-to-r from-brand-cyan-ink to-brand-purple';

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

  // Tonos -700 sobre fondo -50: el % (texto pequeño en negrita) necesita contraste AA
  const compatibilidadColor = (pct) => {
    if (pct >= 80) return 'text-emerald-700 bg-emerald-50 border-emerald-200';
    if (pct >= 60) return 'text-brand-cyan-ink bg-brand-cyan/10 border-brand-cyan/30';
    return 'text-amber-700 bg-amber-50 border-amber-200';
  };

  const compatibilidadBarra = (pct) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 60) return 'bg-brand-cyan';
    return 'bg-amber-500';
  };

  // ──────────── PASO 1: Áreas ────────────
  const renderPaso1 = () => (
    <div className="space-y-5">
      <fieldset>
        <legend>
          <h3 className="text-lg font-bold text-brand-dark mb-1">¿En qué área(s) te gustaría recibir mentoría?</h3>
          <span className="block text-sm text-gray-500">Selecciona todas las que apliquen</span>
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-5">
          {AREAS.map(area => {
            const activa = form.areas.includes(area);
            return (
              <button
                key={area}
                type="button"
                aria-pressed={activa}
                onClick={() => toggleArea(area)}
                className={`${OPCION_CLS(activa)} px-4 py-3`}
              >
                <span className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all ${
                  activa ? 'border-brand-cyan bg-brand-cyan' : 'border-gray-300'
                }`} aria-hidden="true">
                  {activa && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </span>
                {area}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Field label="Otros (opcional)">
        <Input
          type="text"
          value={form.otros_area}
          onChange={e => setForm(prev => ({ ...prev, otros_area: e.target.value }))}
          placeholder="Escribe otra área si no aparece en la lista"
        />
      </Field>
    </div>
  );

  // ──────────── PASO 2: Reto y apoyo ────────────
  const renderPaso2 = () => (
    <div className="space-y-5">
      <Field label="Describe brevemente qué tipo de apoyo o guía esperas del mentor en las áreas seleccionadas">
        <Textarea
          value={form.apoyo_esperado}
          onChange={e => setForm(prev => ({ ...prev, apoyo_esperado: e.target.value }))}
          rows={3}
          placeholder="Ej: Necesito orientación para definir mi modelo de negocio y validar mi propuesta de valor..."
          className="resize-none"
        />
      </Field>
      <Field
        label="¿Cuál es el principal reto o desafío que estás enfrentando actualmente?"
        requerido
        ayuda="Describe bien tu principal reto o el apoyo que necesitas por parte del mentor(a)."
      >
        <Textarea
          value={form.reto_principal}
          onChange={e => setForm(prev => ({ ...prev, reto_principal: e.target.value }))}
          rows={3}
          placeholder="Ej: Tengo dificultades para conseguir mis primeros clientes..."
          className="resize-none"
        />
      </Field>
      <Field label="¿Qué resultados te gustaría lograr al finalizar tus sesiones de mentoría?">
        <Textarea
          value={form.resultados_esperados}
          onChange={e => setForm(prev => ({ ...prev, resultados_esperados: e.target.value }))}
          rows={3}
          placeholder="Ej: Tener una estrategia de ventas clara y conseguir al menos 5 clientes piloto..."
          className="resize-none"
        />
      </Field>
    </div>
  );

  // ──────────── PASO 3: Preferencia ────────────
  const renderPaso3 = () => (
    <div className="space-y-5">
      <fieldset>
        <legend>
          <h3 className="text-lg font-bold text-brand-dark mb-1">¿Prefieres un mentor con experiencia en tu sector o con visión más general de negocios?</h3>
          <span className="block text-sm text-gray-500">Selecciona una opción</span>
        </legend>
        <div className="space-y-3 mt-5">
          {PREFERENCIAS.map(pref => {
            const activa = form.preferencia_sector === pref.value;
            return (
              <button
                key={pref.value}
                type="button"
                aria-pressed={activa}
                onClick={() => setForm(prev => ({ ...prev, preferencia_sector: pref.value }))}
                className={`${OPCION_CLS(activa)} w-full px-5 py-4`}
              >
                <span className={`w-5 h-5 shrink-0 rounded-full border-2 flex items-center justify-center transition-all ${
                  activa ? 'border-brand-cyan' : 'border-gray-300'
                }`} aria-hidden="true">
                  {activa && <span className="w-2.5 h-2.5 rounded-full bg-brand-cyan" />}
                </span>
                {pref.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Field label="Comentarios o sugerencias adicionales sobre tu proceso de mentoría">
        <Textarea
          value={form.comentarios}
          onChange={e => setForm(prev => ({ ...prev, comentarios: e.target.value }))}
          rows={3}
          placeholder="Cualquier información adicional que nos ayude a encontrar el mentor ideal para ti..."
          className="resize-none"
        />
      </Field>
    </div>
  );

  // ──────────── PASO 4: Confirmación / Procesando ────────────
  const renderPaso4 = () => (
    <div className="text-center py-10 space-y-6">
      {procesando ? (
        <div role="status" className="space-y-6">
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20 rounded-2xl flex items-center justify-center animate-pulse">
            <Sparkles size={36} className="text-brand-cyan-ink" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-brand-dark mb-2">Analizando tu perfil...</h3>
            <p className="text-gray-500 text-sm">Nuestra IA está comparando tus necesidades con los perfiles de mentores disponibles</p>
          </div>
          <Loader2 size={28} className="mx-auto text-brand-cyan-ink animate-spin" aria-hidden="true" />
        </div>
      ) : (
        <>
          <div className="w-20 h-20 mx-auto bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20 rounded-2xl flex items-center justify-center">
            <Sparkles size={36} className="text-brand-purple" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-brand-dark mb-2">¿Todo listo?</h3>
            <p className="text-gray-500 text-sm">Revisaremos tus respuestas y te sugeriremos los mejores mentores para ti</p>
          </div>
          <div className="max-w-md mx-auto bg-gray-50 rounded-xl p-4 text-left space-y-2 text-sm">
            <p><span className="font-semibold text-brand-dark">Áreas:</span> <span className="text-gray-500">{[...form.areas, form.otros_area].filter(Boolean).join(', ')}</span></p>
            <p><span className="font-semibold text-brand-dark">Reto:</span> <span className="text-gray-500">{form.reto_principal}</span></p>
            <p><span className="font-semibold text-brand-dark">Preferencia:</span> <span className="text-gray-500">{form.preferencia_sector}</span></p>
          </div>
          <Button tamanio="lg" icono={Sparkles} onClick={enviarMatch} cargando={procesando} className={DEGRADADO_IA}>
            Encontrar mi mentor ideal
          </Button>
        </>
      )}
    </div>
  );

  // ──────────── PASO 5: Resultados ────────────
  const renderResultados = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-brand-dark mb-1">Resultados del Match</h3>
        <p className="text-sm text-gray-500">Basado en tus respuestas, estos son los mentores que mejor se ajustan a tus necesidades</p>
      </div>

      <div className="space-y-4">
        {(!resultados || resultados.length === 0) && (
          <EmptyState
            icono={GraduationCap}
            tono="neutral"
            compacto
            titulo="No encontramos mentores compatibles en este momento."
            descripcion="Revisa la red de mentores o intenta con otras áreas."
          />
        )}
        {resultados?.map((match, idx) => {
          const nombre = [match.mentor?.nombre, match.mentor?.apellido].filter(Boolean).join(' ');
          const sesiones = parseJSON(match.mentor?.sesiones);
          const startups = parseJSON(match.mentor?.startups);
          return (
            <div key={match.mentor?.id || idx} className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                {/* Foto / Avatar */}
                <div className="flex-shrink-0">
                  {match.mentor?.foto ? (
                    <img src={resolveMentorPhotoUrl(match.mentor.foto)} alt={`Foto de ${nombre}`} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-cyan/20 to-brand-purple/20 flex items-center justify-center" aria-hidden="true">
                      <GraduationCap size={28} className="text-brand-cyan-ink" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <h4 className="text-lg font-bold text-brand-dark min-w-0">
                      {idx === 0 && (
                        <>
                          <Trophy size={16} className="inline -mt-1 mr-1 text-amber-600" aria-hidden="true" />
                          <span className="sr-only">Mejor coincidencia: </span>
                        </>
                      )}
                      {match.mentor?.nombre} {match.mentor?.apellido}
                    </h4>
                    <span className={`flex-shrink-0 px-3 py-1 text-sm font-bold rounded-full border tabular-nums ${compatibilidadColor(match.compatibilidad)}`}>
                      <span className="sr-only">Compatibilidad: </span>{match.compatibilidad}%
                    </span>
                  </div>

                  {/* Barra de compatibilidad (repite el %, que ya se lee arriba) */}
                  <div className="w-full h-1.5 bg-gray-100 rounded-full mb-3" aria-hidden="true">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${compatibilidadBarra(match.compatibilidad)}`}
                      style={{ width: `${match.compatibilidad}%` }}
                    />
                  </div>

                  {/* Razón del match */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-3">{match.razon}</p>

                  {/* Tags */}
                  {(sesiones.length > 0 || startups.length > 0) && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {sesiones.map(s => <Badge key={s} tono="cyan" forma="tag">{s}</Badge>)}
                      {startups.map(s => <Badge key={s} tono="purple" forma="tag">{s}</Badge>)}
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="flex flex-wrap items-center gap-3">
                    {match.mentor?.linkedin && (
                      <a href={match.mentor.linkedin} target="_blank" rel="noopener noreferrer" aria-label={`LinkedIn de ${nombre}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                        <ExternalLink size={12} aria-hidden="true" /> LinkedIn
                      </a>
                    )}
                    {match.mentor?.calendly && (
                      <a href={match.mentor.calendly} target="_blank" rel="noopener noreferrer" aria-label={`Agendar sesión con ${nombre}`}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-green-ink hover:text-emerald-700 transition-colors">
                        <ExternalLink size={12} aria-hidden="true" /> Agendar sesión
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center pt-2">
        <Button variante="secondary" icono={RefreshCw} onClick={reiniciar}>
          Realizar otro match
        </Button>
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
      {/* Stepper: en móvil el nombre del paso solo se oculta a la vista, no al lector de pantalla */}
      {paso < 5 && (
        <ol className="flex items-center justify-center gap-1" aria-label="Pasos del match">
          {pasos.map((p, i) => (
            <li key={p.num} className="flex items-center" aria-current={paso === p.num ? 'step' : undefined}>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                paso >= p.num
                  ? paso === p.num ? 'bg-brand-cyan text-brand-dark' : 'bg-brand-cyan/15 text-brand-cyan-ink'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                <p.icon size={14} aria-hidden="true" />
                <span className="sr-only sm:not-sr-only">{p.label}</span>
              </div>
              {i < pasos.length - 1 && <div className={`w-8 h-0.5 mx-1 ${paso > p.num ? 'bg-brand-cyan/30' : 'bg-gray-200'}`} aria-hidden="true" />}
            </li>
          ))}
        </ol>
      )}

      {/* Content */}
      <div>
        {paso === 1 && renderPaso1()}
        {paso === 2 && renderPaso2()}
        {paso === 3 && renderPaso3()}
        {paso === 4 && renderPaso4()}
        {paso === 5 && renderResultados()}
      </div>

      {/* Navigation (también en el paso 4, para poder volver sin perder las respuestas) */}
      {paso <= 4 && (
        <div className="pt-2">
          <div className="flex justify-between gap-3">
            <Button
              variante="ghost"
              icono={ChevronLeft}
              onClick={() => paso === 1 ? onClose?.() : setPaso(p => p - 1)}
              disabled={procesando}
            >
              {paso === 1 ? 'Cancelar' : 'Anterior'}
            </Button>
            {paso < 4 && (
              <Button
                onClick={() => setPaso(p => p + 1)}
                iconoFinal={ChevronRight}
                disabled={!puedeAvanzar()}
                aria-describedby={!puedeAvanzar() ? 'match-pista' : undefined}
              >
                Siguiente
              </Button>
            )}
          </div>
          {paso < 4 && !puedeAvanzar() && (
            <p id="match-pista" className="text-xs text-gray-500 text-right mt-2">
              {paso === 1 ? 'Selecciona al menos un área para continuar' : paso === 2 ? 'Describe tu reto principal para continuar' : 'Elige una preferencia para continuar'}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default MentorMatch;
