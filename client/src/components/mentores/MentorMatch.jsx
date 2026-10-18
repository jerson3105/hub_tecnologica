import { useState } from 'react';
import { Sparkles, ChevronRight, ChevronLeft, Loader2, Trophy, Linkedin, CalendarPlus, RefreshCw, GraduationCap } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../ui/Button';
import CasillasChip from '../ui/CasillasChip';
import { Field, Input, Textarea } from '../ui/Field';
import FotoMentor from './FotoMentor';
import { CHIP_CLS, FONDO_TONO, ACCION_CLS } from '../ui/estilosSemanticos';
import { AREAS_MATCH, PREFERENCIAS_MATCH, listaDe } from '../../constants/mentores';

const VACIO = { areas: [], otros_area: '', apoyo_esperado: '', reto_principal: '', resultados_esperados: '', preferencia_sector: '', comentarios: '' };
const PASOS = ['Áreas', 'Reto', 'Preferencia', 'Match'];
const PREGUNTA_CLS = 'font-display text-lg font-semibold leading-snug';
const tonoCompatibilidad = (pct) => (pct >= 80 ? 'success' : pct >= 60 ? 'info' : 'warning');
const esEnlace = (url) => /^https?:\/\//i.test(url || '');

// Asistente del match con IA (dentro de un Modal): áreas → reto → preferencia → resultados.
// Las respuestas se conservan al ir atrás; el modal no se cierra con un clic fuera.
const MentorMatch = ({ onClose }) => {
  const [paso, setPaso] = useState(1);
  const [form, setForm] = useState(VACIO);
  const [procesando, setProcesando] = useState(false);
  const [resultados, setResultados] = useState(null);
  const cambiar = (campo) => (e) => setForm((f) => ({ ...f, [campo]: e.target.value }));
  const alternarArea = (area) => setForm((f) => ({ ...f, areas: f.areas.includes(area) ? f.areas.filter((a) => a !== area) : [...f.areas, area] }));

  const puedeAvanzar = paso === 1 ? form.areas.length > 0 || !!form.otros_area.trim()
    : paso === 2 ? !!form.reto_principal.trim()
      : paso === 3 ? !!form.preferencia_sector : true;
  const pista = ['Elige al menos un área para continuar', 'Describe tu reto principal para continuar', 'Elige una preferencia para continuar'][paso - 1];

  const enviar = async () => {
    setProcesando(true);
    try {
      const { data } = await api.post('/ia/match-mentor', {
        ...form,
        areas: [...form.areas, form.otros_area.trim()].filter(Boolean)
      });
      setResultados(data.matches || []);
      setPaso(5);
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo hacer el match');
    } finally {
      setProcesando(false);
    }
  };

  if (paso === 5) {
    return (
      <div className="space-y-5">
        <p className="text-sm text-muted-foreground">Según tus respuestas, estos mentores son los que mejor encajan contigo.</p>
        {resultados.length === 0 ? (
          <div className="grid justify-items-center gap-2 rounded-card border border-dashed border-border px-4 py-10 text-center">
            <GraduationCap size={24} className="text-muted-foreground" aria-hidden="true" />
            <p className="font-semibold">No encontramos mentores compatibles ahora</p>
            <p className="text-sm text-muted-foreground">Revisa la red completa o prueba con otras áreas.</p>
          </div>
        ) : (
          <ol className="grid gap-3">
            {resultados.map((match, i) => {
              const m = match.mentor || {};
              const nombre = [m.nombre, m.apellido].filter(Boolean).join(' ');
              const temas = listaDe(m.sesiones);
              return (
                <li key={m.id || i} className="grid gap-3 rounded-card border border-border p-4">
                  <div className="flex items-start gap-3">
                    <FotoMentor mentor={m} tamanio="sm" />
                    <div className="grid min-w-0 flex-1 gap-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        {i === 0 && <><Trophy size={16} className="text-warning" aria-hidden="true" /><span className="sr-only">Mejor coincidencia: </span></>}
                        {nombre}
                        <span className={`${CHIP_CLS} ${FONDO_TONO[tonoCompatibilidad(match.compatibilidad)]} tabular-nums`}>
                          <span className="sr-only">Compatibilidad: </span>{match.compatibilidad} %
                        </span>
                      </p>
                      {match.razon && <p className="text-sm text-muted-foreground">{match.razon}</p>}
                    </div>
                  </div>
                  {temas.length > 0 && (
                    <ul className="flex flex-wrap gap-1.5" aria-label="Temas">
                      {temas.map((t) => <li key={t} className={`${CHIP_CLS} ${FONDO_TONO.info}`}>{t}</li>)}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-1">
                    {esEnlace(m.calendly) && (
                      <a href={m.calendly} target="_blank" rel="noopener noreferrer" className={ACCION_CLS}>
                        <CalendarPlus size={15} aria-hidden="true" />Agendar sesión<span className="sr-only"> con {nombre} (se abre en otra pestaña)</span>
                      </a>
                    )}
                    {esEnlace(m.linkedin) && (
                      <a href={m.linkedin} target="_blank" rel="noopener noreferrer" className={ACCION_CLS}>
                        <Linkedin size={15} aria-hidden="true" />LinkedIn<span className="sr-only"> de {nombre} (se abre en otra pestaña)</span>
                      </a>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        <div className="flex flex-wrap justify-between gap-2 border-t border-border pt-4">
          <Button variante="secondary" icono={RefreshCw} onClick={() => { setForm(VACIO); setResultados(null); setPaso(1); }}>Hacer otro match</Button>
          <Button onClick={onClose}>Listo</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <ol className="flex items-center gap-1.5" aria-label="Pasos del match">
        {PASOS.map((nombre, i) => {
          const n = i + 1;
          return (
            <li key={nombre} className="flex flex-1 items-center gap-1.5" aria-current={paso === n ? 'step' : undefined}>
              <span className={`grid size-7 shrink-0 place-items-center rounded-full text-xs font-semibold ${paso === n ? 'bg-primary text-primary-foreground' : paso > n ? 'bg-info-soft text-info-soft-foreground' : 'bg-muted text-muted-foreground'}`}>{n}</span>
              <span className={`text-[13px] ${paso === n ? 'font-semibold' : 'sr-only sm:not-sr-only sm:text-muted-foreground'}`}>{nombre}</span>
              {n < PASOS.length && <span className="h-px flex-1 bg-border" aria-hidden="true" />}
            </li>
          );
        })}
      </ol>

      {paso === 1 && (
        <div className="space-y-4">
          <h3 className={PREGUNTA_CLS}>¿En qué áreas te gustaría recibir mentoría?</h3>
          <CasillasChip etiqueta="Elige todas las que apliquen" opciones={AREAS_MATCH} seleccion={form.areas} onAlternar={alternarArea} />
          <Field label="Otra área (opcional)">
            <Input value={form.otros_area} onChange={cambiar('otros_area')} placeholder="Si no aparece en la lista" />
          </Field>
        </div>
      )}

      {paso === 2 && (
        <div className="space-y-4">
          <h3 className={PREGUNTA_CLS}>Cuéntanos tu reto</h3>
          <Field label="¿Cuál es el principal reto que enfrentas ahora?" requerido ayuda="Cuanto más concreto, mejor será la sugerencia.">
            <Textarea value={form.reto_principal} onChange={cambiar('reto_principal')} rows={3} placeholder="Ej: Me cuesta conseguir mis primeros clientes" className="resize-y" />
          </Field>
          <Field label="¿Qué apoyo esperas del mentor?">
            <Textarea value={form.apoyo_esperado} onChange={cambiar('apoyo_esperado')} rows={3} placeholder="Ej: Orientación para validar mi propuesta de valor" className="resize-y" />
          </Field>
          <Field label="¿Qué resultados te gustaría lograr?">
            <Textarea value={form.resultados_esperados} onChange={cambiar('resultados_esperados')} rows={3} placeholder="Ej: Una estrategia de ventas clara y 5 clientes piloto" className="resize-y" />
          </Field>
        </div>
      )}

      {paso === 3 && (
        <div className="space-y-4">
          <fieldset className="grid gap-2">
            <legend className={`${PREGUNTA_CLS} mb-2`}>¿Prefieres a alguien de tu sector o con visión general de negocios?</legend>
            {PREFERENCIAS_MATCH.map((opcion) => {
              const activa = form.preferencia_sector === opcion;
              return (
                <label key={opcion} className={`flex min-h-12 cursor-pointer items-center gap-3 rounded-control border px-4 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${activa ? 'border-primary bg-info-soft font-medium' : 'border-input hover:bg-muted'}`}>
                  <input type="radio" name="preferencia" value={opcion} checked={activa} onChange={() => setForm((f) => ({ ...f, preferencia_sector: opcion }))} className="size-4 accent-[var(--primary)]" />
                  {opcion}
                </label>
              );
            })}
          </fieldset>
          <Field label="¿Algo más que debamos saber? (opcional)">
            <Textarea value={form.comentarios} onChange={cambiar('comentarios')} rows={3} className="resize-y" />
          </Field>
        </div>
      )}

      {paso === 4 && (
        <div className="grid justify-items-center gap-4 py-4 text-center" role={procesando ? 'status' : undefined}>
          <span className="grid size-16 place-items-center rounded-card bg-programa-soft text-programa-soft-foreground">
            {procesando ? <Loader2 size={28} className="animate-spin" aria-hidden="true" /> : <Sparkles size={28} aria-hidden="true" />}
          </span>
          <div className="grid gap-1">
            <h3 className={PREGUNTA_CLS}>{procesando ? 'Comparando tu perfil con la red…' : '¿Todo listo?'}</h3>
            <p className="text-sm text-muted-foreground">{procesando ? 'Puede tardar unos segundos.' : 'Te sugeriremos los mentores que mejor encajan con tu One Pager y tus respuestas.'}</p>
          </div>
          {!procesando && (
            <dl className="grid w-full max-w-md gap-1.5 rounded-card bg-muted p-4 text-left text-sm">
              <div><dt className="inline font-semibold">Áreas: </dt><dd className="inline text-muted-foreground">{[...form.areas, form.otros_area.trim()].filter(Boolean).join(', ')}</dd></div>
              <div><dt className="inline font-semibold">Reto: </dt><dd className="inline text-muted-foreground">{form.reto_principal}</dd></div>
              <div><dt className="inline font-semibold">Preferencia: </dt><dd className="inline text-muted-foreground">{form.preferencia_sector}</dd></div>
            </dl>
          )}
        </div>
      )}

      <div className="grid gap-2 border-t border-border pt-4">
        <div className="flex justify-between gap-3">
          <Button variante="ghost" icono={ChevronLeft} onClick={() => (paso === 1 ? onClose() : setPaso((p) => p - 1))} disabled={procesando}>
            {paso === 1 ? 'Cancelar' : 'Anterior'}
          </Button>
          {paso < 4 ? (
            <Button onClick={() => setPaso((p) => p + 1)} iconoFinal={ChevronRight} disabled={!puedeAvanzar} aria-describedby={puedeAvanzar ? undefined : 'match-pista'}>
              Siguiente
            </Button>
          ) : (
            <Button icono={Sparkles} onClick={enviar} cargando={procesando}>Buscar mentores</Button>
          )}
        </div>
        {paso < 4 && !puedeAvanzar && <p id="match-pista" className="text-right text-xs text-muted-foreground">{pista}</p>}
      </div>
    </div>
  );
};

export default MentorMatch;
