import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, CheckCircle2, Circle, Download, Sparkles } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { useDescargarInforme } from '../../reportes/descargarInforme';
import Button from '../ui/Button';
import ErrorCarga from '../ui/ErrorCarga';
import Skeleton from '../ui/Skeleton';
import Trazo from '../ui/Trazo';
import { Field, Input, Textarea } from '../ui/Field';
import { ETIQUETA_CLS } from '../ui/estilos';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, BOTON_SECUNDARIO_CLS } from '../ui/estilosSemanticos';

const ETAPAS = ['Idea', 'Prototipo', 'MVP', 'Operando', 'Escalando'];
// Mismos campos obligatorios que el servidor (onePagerController.CAMPOS_REQUERIDOS)
const OBLIGATORIOS = [
  ['estado_proyecto', 'Etapa del proyecto'],
  ['descripcion', 'Descripción'],
  ['correo_proyecto', 'Correo del proyecto'],
  ['problematica', 'Problema u oportunidad'],
  ['solucion', 'Solución'],
  ['modelo_negocio', 'Modelo de negocio']
];
const CAMPOS = [
  'estado_proyecto', 'descripcion', 'correo_proyecto', 'problematica', 'solucion', 'modelo_negocio',
  'mercado_objetivo', 'ventaja_competitiva', 'hitos', 'estado_actual', 'necesidades',
  'pagina_web', 'facebook', 'instagram', 'twitter', 'youtube', 'linkedin', 'logo_url', 'otros_links'
];
const ENLACES = [
  ['pagina_web', 'Página web', 'https://…'], ['linkedin', 'LinkedIn', 'https://linkedin.com/company/…'],
  ['instagram', 'Instagram', 'https://instagram.com/…'], ['facebook', 'Facebook', 'https://facebook.com/…'],
  ['twitter', 'X / Twitter', 'https://x.com/…'], ['youtube', 'YouTube', 'https://youtube.com/@…'],
  ['logo_url', 'Logo (enlace a la imagen)', 'https://…']
];
// Los enlaces se aceptan sin esquema («instagram.com/miproyecto») y se guardan con https://
const conEsquema = (v) => (/^https?:\/\//i.test(v) ? v : `https://${v}`);
const URL_VALIDA = /^https?:\/\/[^\s./]+\.\S+$/i;
const CAMPOS_ENLACE = new Set(ENLACES.map(([c]) => c));
const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const lleno = (v) => typeof v === 'string' && v.trim().length > 0;
const desde = (op) => Object.fromEntries(CAMPOS.map((c) => [c, op?.[c] || '']));
const idCampo = (c) => `op-${c}`;

// Texto largo con su guía y un contador orientativo (no corta: es una recomendación)
const TextoGuiado = ({ campo, etiqueta, ayuda, sugerido, valores, onCambio, obligatorio = false, filas = 3 }) => {
  const largo = valores[campo].length;
  return (
    <Field label={etiqueta} requerido={obligatorio} ayuda={`${ayuda}${sugerido ? ` · ${largo}/${sugerido} caracteres sugeridos` : ''}`}>
      <Textarea id={idCampo(campo)} value={valores[campo]} onChange={(e) => onCambio(campo, e.target.value)} rows={filas} className="resize-y" />
    </Field>
  );
};

const Seccion = ({ titulo, descripcion, children }) => (
  <section className={`${TARJETA_CLS} grid gap-4 p-5`}>
    <div>
      <h3 className="font-display text-lg font-semibold">{titulo}</h3>
      {descripcion && <p className="text-[13px] text-muted-foreground">{descripcion}</p>}
    </div>
    {children}
  </section>
);

// Editor del One Pager dentro de Mi emprendimiento. Se guarda a medias cuando se quiera; estará
// «completo» (y desbloquea el match con mentores con IA y el PDF) con los 6 campos obligatorios.
// `onSalir` vuelve a la vista; `onPendientes(bool)` avisa al espacio si hay cambios sin guardar.
const OnePagerEditor = ({ emprendimiento, onSalir, onPendientes }) => {
  const queryClient = useQueryClient();
  const { descargar, generando } = useDescargarInforme();
  const [borrador, setBorrador] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['onePager', String(emprendimiento.id)],
    queryFn: () => api.get(`/one-pager/${emprendimiento.id}`).then((r) => r.data)
  });

  const original = desde(data?.onePager);
  const valores = borrador ?? original;
  const hayCambios = !!borrador && CAMPOS.some((c) => borrador[c] !== original[c]);
  const hechos = OBLIGATORIOS.filter(([c]) => lleno(valores[c])).length;
  const errores = {
    correo_proyecto: lleno(valores.correo_proyecto) && !CORREO_VALIDO.test(valores.correo_proyecto.trim()) ? 'Revisa el correo' : null,
    ...Object.fromEntries(ENLACES.map(([c]) => [c, lleno(valores[c]) && !URL_VALIDA.test(conEsquema(valores[c].trim())) ? 'Revisa el enlace (p. ej. instagram.com/tuproyecto)' : null]))
  };
  const hayErrores = Object.values(errores).some(Boolean);

  useEffect(() => { onPendientes?.(hayCambios); }, [hayCambios, onPendientes]);
  useEffect(() => () => onPendientes?.(false), [onPendientes]);
  useEffect(() => {
    if (!hayCambios) return undefined;
    const avisar = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', avisar);
    return () => window.removeEventListener('beforeunload', avisar);
  }, [hayCambios]);

  const cambiar = (campo, valor) => setBorrador({ ...valores, [campo]: valor });
  const salir = () => {
    if (hayCambios && !window.confirm('Tienes cambios sin guardar en el One Pager. ¿Descartarlos?')) return;
    onSalir();
  };
  const irA = (campo) => {
    const el = document.getElementById(idCampo(campo)) || document.querySelector(`[name="${campo}"]`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el?.focus({ preventScroll: true });
  };

  const guardar = async () => {
    if (hayErrores) {
      toast.error('Revisa los campos marcados antes de guardar');
      return;
    }
    setGuardando(true);
    try {
      const limpio = Object.fromEntries(CAMPOS.map((c) => {
        const v = valores[c].trim();
        return [c, v && CAMPOS_ENLACE.has(c) ? conEsquema(v) : v];
      }));
      const antes = data?.completo;
      const { data: respuesta } = await api.put(`/one-pager/${emprendimiento.id}`, limpio);
      queryClient.setQueryData(['onePager', String(emprendimiento.id)], { onePager: respuesta.onePager, completo: respuesta.completo });
      ['onePagerEstado', 'emprendimiento'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      setBorrador(null);
      toast.success(respuesta.completo && !antes ? 'One Pager completo: ya puedes usar el match con mentores' : 'One Pager guardado');
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo guardar el One Pager');
    } finally {
      setGuardando(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`${TARJETA_CLS} grid gap-3 p-5`} role="status" aria-label="Cargando el One Pager">
        <Skeleton className="h-6 w-48" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}
      </div>
    );
  }
  if (isError) return <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudo cargar el One Pager." onReintentar={refetch} /></div>;

  const completo = hechos === OBLIGATORIOS.length;
  const props = { valores, onCambio: cambiar };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className={TITULO_BLOQUE_CLS}>Editar One Pager</h2>
          <p className="text-[13px] text-muted-foreground">Guárdalo a medias cuando quieras; con los 6 campos marcados con * queda completo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data?.completo && !hayCambios && (
            <Button variante="secondary" tamanio="sm" icono={Download} cargando={generando('onepager', emprendimiento.id)} onClick={() => descargar('onepager', emprendimiento.id)}>
              Descargar PDF
            </Button>
          )}
          <button type="button" onClick={salir} className={BOTON_SECUNDARIO_CLS}><ArrowLeft size={16} aria-hidden="true" />Ver One Pager</button>
        </div>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-6">
        <div className="grid gap-4">
          <Seccion titulo="Lo esencial" descripcion="Lo primero que leen un mentor o un jurado.">
            <fieldset className="grid gap-2">
              <legend className={ETIQUETA_CLS}>Etapa del proyecto <span className="text-danger" aria-hidden="true">*</span></legend>
              <div className="flex flex-wrap gap-2">
                {ETAPAS.map((etapa) => {
                  const activa = valores.estado_proyecto === etapa;
                  return (
                    <label key={etapa} className={`inline-flex min-h-10 cursor-pointer items-center rounded-control border px-3.5 text-sm font-medium transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${activa ? 'border-primary bg-info-soft text-foreground' : 'border-input text-muted-foreground hover:bg-muted'}`}>
                      <input type="radio" name="estado_proyecto" value={etapa} checked={activa} onChange={() => cambiar('estado_proyecto', etapa)} className="sr-only" />
                      {etapa}
                    </label>
                  );
                })}
              </div>
            </fieldset>
            <TextoGuiado {...props} campo="descripcion" etiqueta="Descripción" obligatorio sugerido={300} filas={3}
              ayuda="En dos o tres frases: qué hacen, para quién y por qué importa" />
            <Field label="Correo del proyecto" requerido error={errores.correo_proyecto}>
              <Input id={idCampo('correo_proyecto')} type="email" value={valores.correo_proyecto} onChange={(e) => cambiar('correo_proyecto', e.target.value)} placeholder="contacto@tuproyecto.pe" autoComplete="email" />
            </Field>
          </Seccion>

          <Seccion titulo="Problema y solución">
            <TextoGuiado {...props} campo="problematica" etiqueta="Problema u oportunidad" obligatorio sugerido={500}
              ayuda="¿Qué dolor o necesidad atienden? ¿A quién le pasa y cuánto le cuesta?" />
            <TextoGuiado {...props} campo="solucion" etiqueta="Solución / propuesta de valor" obligatorio sugerido={500}
              ayuda="¿Cómo lo resuelven y qué los hace diferentes de las alternativas?" />
          </Seccion>

          <Seccion titulo="Negocio y mercado">
            <TextoGuiado {...props} campo="modelo_negocio" etiqueta="Modelo de negocio" obligatorio sugerido={400}
              ayuda="¿Quién paga, por qué y cómo? (venta, suscripción, comisión…)" />
            <TextoGuiado {...props} campo="mercado_objetivo" etiqueta="Mercado objetivo" sugerido={400}
              ayuda="¿Quiénes son sus clientes y cuántos hay? Mejor con datos de Ica o de Perú" />
            <TextoGuiado {...props} campo="ventaja_competitiva" etiqueta="Ventaja competitiva" sugerido={400}
              ayuda="¿Qué tienen que es difícil de copiar?" />
          </Seccion>

          <Seccion titulo="Avance y necesidades" descripcion="Ayuda al equipo técnico y a los mentores a saber cómo apoyarles.">
            <TextoGuiado {...props} campo="hitos" etiqueta="Hitos y logros" sugerido={400} ayuda="Premios, primeras ventas, pilotos, alianzas…" />
            <TextoGuiado {...props} campo="estado_actual" etiqueta="Estado actual / tracción" sugerido={400} ayuda="Clientes, ventas o usuarios a la fecha" />
            <TextoGuiado {...props} campo="necesidades" etiqueta="Necesidades" sugerido={300} ayuda="Financiamiento, alianzas, mentoría, tecnología…" />
          </Seccion>

          <Seccion titulo="Presencia en línea" descripcion="Pega el enlace de cada perfil que tengan.">
            <div className="grid gap-4 sm:grid-cols-2">
              {ENLACES.map(([campo, etiqueta, ejemplo]) => (
                <Field key={campo} label={etiqueta} error={errores[campo]}>
                  <Input id={idCampo(campo)} type="url" inputMode="url" value={valores[campo]} onChange={(e) => cambiar(campo, e.target.value)} placeholder={ejemplo} />
                </Field>
              ))}
            </div>
            <Field label="Otros enlaces" ayuda="Uno por línea: catálogo, video demo, nota de prensa…">
              <Textarea id={idCampo('otros_links')} value={valores.otros_links} onChange={(e) => cambiar('otros_links', e.target.value)} rows={2} className="resize-y" />
            </Field>
          </Seccion>
        </div>

        <aside aria-label="Para completar" className={`${TARJETA_CLS} grid gap-3 p-4 lg:sticky lg:top-20`}>
          <div className="grid gap-2">
            <p className="flex items-baseline justify-between text-sm font-semibold">
              Para completar <span className="tabular-nums text-muted-foreground">{hechos}/{OBLIGATORIOS.length}</span>
            </p>
            <Trazo valor={(hechos / OBLIGATORIOS.length) * 100} />
          </div>
          <ul className="grid gap-0.5">
            {OBLIGATORIOS.map(([campo, etiqueta]) => {
              const ok = lleno(valores[campo]);
              return (
                <li key={campo}>
                  <button type="button" onClick={() => irA(campo)} className="flex w-full items-center gap-2 rounded-control px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted">
                    {ok
                      ? <CheckCircle2 size={16} className="shrink-0 text-success" aria-hidden="true" />
                      : <Circle size={16} className="shrink-0 text-subtle-foreground" aria-hidden="true" />}
                    <span className={ok ? 'text-muted-foreground' : ''}>{etiqueta}</span>
                    <span className="sr-only">{ok ? ': listo' : ': falta'}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          <p className="flex items-start gap-2 rounded-control bg-programa-soft px-3 py-2 text-[13px] text-programa-soft-foreground">
            <Sparkles size={15} className="mt-0.5 shrink-0" aria-hidden="true" />
            {data?.completo
              ? 'Ya tienes el PDF y el match con mentores con IA.'
              : completo ? 'Guarda para desbloquear el PDF y el match con mentores con IA.' : 'Completo, desbloquea el PDF y el match con mentores con IA.'}
          </p>
        </aside>
      </div>

      {hayCambios && (
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:bottom-0 lg:mx-0 lg:rounded-card lg:border lg:bg-card lg:px-5">
          <span className={`text-sm ${hayErrores ? 'text-danger' : 'text-warning'}`} aria-live="polite">
            {hayErrores ? 'Hay campos por revisar' : 'Cambios sin guardar'}
          </span>
          <div className="flex gap-2">
            <Button variante="ghost" onClick={() => setBorrador(null)} disabled={guardando}>Descartar</Button>
            <Button icono={Save} cargando={guardando} onClick={guardar}>Guardar</Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnePagerEditor;
