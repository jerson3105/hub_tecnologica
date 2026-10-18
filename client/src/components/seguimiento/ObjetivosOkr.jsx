import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Target, Trash2, Link2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Trazo from '../ui/Trazo';
import ErrorCarga from '../ui/ErrorCarga';
import Skeleton from '../ui/Skeleton';
import Button from '../ui/Button';
import { Field, Input, Select } from '../ui/Field';
import { useObjetivos } from '../../hooks/useQueryHooks';
import { avanceDe, actividadesDe } from '../../utils/okr';
import { conEsquema, esEnlaceValido } from '../../utils/enlaces';
import { formatFecha, esFutura } from '../../utils/fechas';
import { TIPOS_OBJETIVO, ESTADOS_ACTIVIDAD, estadoDe } from '../../constants/estados';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO, iconoBotonCls } from '../ui/estilosSemanticos';

const TONO_TIPO = { green: 'success', blue: 'azul', cyan: 'info', amber: 'warning', purple: 'programa', pink: 'danger' };
const TONO_ESTADO = { neutral: 'neutral', amber: 'warning', green: 'success', red: 'danger' };
// Campo numérico estrecho (Input lleva w-full y una clase de ancho extra no lo sobrescribe en Tailwind v4)
const NUMERO_CLS = 'h-10 w-20 rounded-control border border-input bg-card px-2 text-right text-base tabular-nums text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 sm:text-sm';
// Select del estado con el ancho de su contenido (en móvil FILTRO_CLS ocupa toda la fila)
const SELECT_CORTO_CLS = 'h-10 rounded-control border border-input bg-card px-2.5 text-base text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30 sm:text-sm';
const ENLACE_CLS = 'inline-flex min-h-9 items-center gap-1.5 rounded-control px-2 text-[13px] font-semibold text-link hover:bg-info-soft';

const Avance = ({ valor, etiqueta }) => (
  valor === null
    ? <span className="text-[13px] text-subtle-foreground">Sin actividades</span>
    : (
      <span className="flex items-center gap-2.5" aria-label={`${etiqueta}: ${valor} %`}>
        <Trazo valor={valor} className="min-w-20 flex-1" retraso={0.2} />
        <span className="w-11 text-right text-sm font-semibold tabular-nums">{valor} %</span>
      </span>
    )
);

// Una actividad: avance numérico (real de meta) o, sin meta, su estado. Se guarda al salir del
// campo o al elegir; Enter también guarda.
const Actividad = ({ act, editable, onGuardar, onEliminar }) => {
  // Los DECIMAL llegan como texto («12.00»): se muestran como número
  const inicial = act.meta_real === null || act.meta_real === undefined ? '' : String(Number(act.meta_real));
  const [real, setReal] = useState(inicial);
  const meta = Number(act.meta_numerica);
  const conMeta = meta > 0;
  const guardarReal = () => {
    if (String(real) === inicial) return;
    onGuardar(act.id, { meta_real: real === '' ? null : Number(real) });
  };
  const estado = estadoDe(ESTADOS_ACTIVIDAD, act.estado);
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border py-2.5 first:border-t-0">
      <span className="min-w-0 flex-1 text-sm">{act.descripcion}</span>
      {conMeta && (
        editable ? (
          <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
            <input
              type="number"
              min={0}
              value={real}
              onChange={(e) => setReal(e.target.value)}
              onBlur={guardarReal}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
              aria-label={`Avance de «${act.descripcion}» (meta ${meta})`}
              className={NUMERO_CLS}
            />
            de {meta}
          </span>
        ) : (
          <span className="text-[13px] tabular-nums text-muted-foreground">{Number(act.meta_real) || 0} de {meta}</span>
        )
      )}
      {editable ? (
        <select
          value={act.estado}
          onChange={(e) => onGuardar(act.id, { estado: e.target.value })}
          aria-label={`Estado de «${act.descripcion}»`}
          className={SELECT_CORTO_CLS}
        >
          {Object.entries(ESTADOS_ACTIVIDAD).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
        </select>
      ) : (
        <span className={`${CHIP_CLS} ${FONDO_TONO[TONO_ESTADO[estado.tono] || 'neutral']}`}>{estado.label}</span>
      )}
      {editable && onEliminar && (
        <button type="button" onClick={() => onEliminar(act)} className={iconoBotonCls('danger')} aria-label={`Quitar la actividad «${act.descripcion}»`} title="Quitar actividad">
          <Trash2 size={15} aria-hidden="true" />
        </button>
      )}
    </li>
  );
};

// Formulario en línea de una sola fila (añadir resultado clave o actividad)
const AgregarEnLinea = ({ etiqueta, placeholder, conMeta = false, onAgregar }) => {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [meta, setMeta] = useState('');
  const [enviando, setEnviando] = useState(false);
  const enviar = async (e) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    const ok = await onAgregar(texto.trim(), meta === '' ? null : Number(meta));
    setEnviando(false);
    if (ok) { setTexto(''); setMeta(''); setAbierto(false); }
  };
  if (!abierto) {
    return <button type="button" onClick={() => setAbierto(true)} className={`${ENLACE_CLS} w-fit`}><Plus size={15} aria-hidden="true" />{etiqueta}</button>;
  }
  return (
    <form onSubmit={enviar} className="flex flex-wrap items-center gap-2">
      <Input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder={placeholder} aria-label={placeholder} autoFocus className="min-w-[12rem] flex-1" />
      {conMeta && <input type="number" min={0} value={meta} onChange={(e) => setMeta(e.target.value)} placeholder="Meta" aria-label="Meta numérica (opcional)" className={NUMERO_CLS} />}
      <button type="submit" disabled={enviando || !texto.trim()} className="inline-flex min-h-10 items-center rounded-control bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">Agregar</button>
      <button type="button" onClick={() => { setAbierto(false); setTexto(''); setMeta(''); }} className="inline-flex min-h-10 items-center rounded-control px-3 text-sm text-muted-foreground hover:bg-muted">Cancelar</button>
    </form>
  );
};

// Evidencia de un objetivo: enlace (Drive, web, video…) con una descripción opcional
const AgregarEvidencia = ({ onAgregar }) => {
  const [abierto, setAbierto] = useState(false);
  const [url, setUrl] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);
  const cerrar = () => { setAbierto(false); setUrl(''); setDescripcion(''); };
  const invalida = url.trim() !== '' && !esEnlaceValido(url);
  const enviar = async (e) => {
    e.preventDefault();
    if (!url.trim() || invalida) return;
    setEnviando(true);
    const ok = await onAgregar(conEsquema(url.trim()), descripcion.trim());
    setEnviando(false);
    if (ok) cerrar();
  };
  if (!abierto) {
    return <button type="button" onClick={() => setAbierto(true)} className={`${ENLACE_CLS} w-fit`}><Plus size={15} aria-hidden="true" />Agregar evidencia</button>;
  }
  return (
    <form onSubmit={enviar} className="flex flex-wrap items-start gap-2">
      <div className="grid min-w-[12rem] flex-1 gap-1">
        <Input value={url} onChange={(e) => setUrl(e.target.value)} type="url" inputMode="url" placeholder="Enlace (Drive, web, video…)" aria-label="Enlace de la evidencia" aria-invalid={invalida || undefined} autoFocus />
        {invalida && <span role="alert" className="text-xs text-danger">Revisa el enlace</span>}
      </div>
      <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Qué muestra (opcional)" aria-label="Descripción de la evidencia" className="min-w-[10rem] flex-1" />
      <button type="submit" disabled={enviando || !url.trim() || invalida} className="inline-flex min-h-10 items-center rounded-control bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary-hover disabled:opacity-50">Agregar</button>
      <button type="button" onClick={cerrar} className="inline-flex min-h-10 items-center rounded-control px-3 text-sm text-muted-foreground hover:bg-muted">Cancelar</button>
    </form>
  );
};

const OBJETIVO_VACIO = { titulo: '', tipo: 'producto_desarrollo', fecha_limite: '' };

// Alta de un objetivo (lo hace el propio emprendimiento): qué quiere lograr, área y fecha límite
const NuevoObjetivo = ({ onCrear, onCancelar }) => {
  const [datos, setDatos] = useState(OBJETIVO_VACIO);
  const [enviando, setEnviando] = useState(false);
  const cambiar = (campo) => (e) => setDatos({ ...datos, [campo]: e.target.value });
  const enviar = async (e) => {
    e.preventDefault();
    if (!datos.titulo.trim()) return;
    setEnviando(true);
    const ok = await onCrear({ ...datos, titulo: datos.titulo.trim(), fecha_limite: datos.fecha_limite || null });
    setEnviando(false);
    if (ok) onCancelar();
  };
  return (
    <form onSubmit={enviar} aria-labelledby="t-nuevo-objetivo" className={`${TARJETA_CLS} grid gap-4 p-5`}>
      <div>
        <h3 id="t-nuevo-objetivo" className="font-display text-lg font-semibold">Nuevo objetivo</h3>
        <p className="text-[13px] text-muted-foreground">Después le añades resultados clave (cómo sabrás que lo lograste) y actividades.</p>
      </div>
      <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_13rem_11rem]">
        <Field label="¿Qué quieres lograr?" requerido ayuda="Concreto: «Validar la demanda con 30 clientes»" className="sm:col-span-2 lg:col-span-1">
          <Input value={datos.titulo} onChange={cambiar('titulo')} maxLength={255} autoFocus />
        </Field>
        <Field label="Área">
          <Select value={datos.tipo} onChange={cambiar('tipo')}>
            {Object.entries(TIPOS_OBJETIVO).map(([valor, { label }]) => <option key={valor} value={valor}>{label}</option>)}
          </Select>
        </Field>
        <Field label="Fecha límite">
          <Input type="date" value={datos.fecha_limite} onChange={cambiar('fecha_limite')} />
        </Field>
      </div>
      <div className="flex flex-wrap justify-end gap-2">
        <Button variante="ghost" onClick={onCancelar}>Cancelar</Button>
        <Button type="submit" icono={Plus} cargando={enviando} disabled={!datos.titulo.trim()}>Crear objetivo</Button>
      </div>
    </form>
  );
};

// OKR del emprendimiento. `editable`: actualizar el avance, añadir resultados clave, actividades
// y evidencias y quitar actividades y evidencias (equipo técnico y el propio emprendimiento).
// `propio` (el emprendimiento, en Mi plan): además crear y quitar objetivos, que el equipo técnico
// solo revisa.
const ObjetivosOkr = ({ emprendimientoId, editable = false, propio = false }) => {
  const queryClient = useQueryClient();
  const { data: objetivos = [], isLoading, isError, refetch } = useObjetivos(emprendimientoId);
  const [creando, setCreando] = useState(false);

  const refrescar = () => ['objetivos', 'emprendimientos', 'emprendimiento', 'inicio', 'programa', 'programas']
    .forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
  const ejecutar = async (accion, exito) => {
    try {
      await accion();
      if (exito) toast.success(exito);
      refrescar();
      return true;
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo guardar');
      return false;
    }
  };
  const guardarActividad = (id, cambios) => ejecutar(() => api.put(`/objetivos/actividad/${id}`, cambios));
  const eliminarActividad = (act) => window.confirm(`¿Quitar la actividad «${act.descripcion}»?`)
    && ejecutar(() => api.delete(`/objetivos/actividad/${act.id}`), 'Actividad quitada');
  const crearObjetivo = (datos) => ejecutar(() => api.post(`/objetivos/emprendimiento/${emprendimientoId}`, datos), 'Objetivo creado');
  const eliminarObjetivo = (obj) => window.confirm(`¿Quitar el objetivo «${obj.titulo}» con sus resultados clave y actividades?`)
    && ejecutar(() => api.delete(`/objetivos/${obj.id}`), 'Objetivo quitado');
  const quitarEvidencia = (ev) => window.confirm(`¿Quitar la evidencia «${ev.descripcion || ev.url}»?`)
    && ejecutar(() => api.delete(`/objetivos/evidencia/${ev.id}`), 'Evidencia quitada');

  if (isLoading) return <div className={`${TARJETA_CLS} grid gap-3 p-5`} role="status" aria-label="Cargando objetivos"><Skeleton className="h-6 w-56" /><Skeleton className="h-1.5 w-full" />{[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}</div>;
  if (isError) return <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudieron cargar los objetivos." onReintentar={refetch} /></div>;

  const formulario = creando && <NuevoObjetivo onCrear={crearObjetivo} onCancelar={() => setCreando(false)} />;

  if (objetivos.length === 0) {
    return formulario || (
      <div className={`${TARJETA_CLS} grid justify-items-center gap-3 px-5 py-10 text-center`}>
        <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><Target size={24} aria-hidden="true" /></span>
        <p className="font-semibold">{propio ? 'Aún no tienes objetivos' : 'Aún no hay objetivos'}</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {propio
            ? 'Define de 1 a 3 objetivos para el programa: cada uno se mide con resultados clave y avanza con actividades.'
            : 'Los define el propio emprendimiento desde «Mi plan». Aquí se revisan y se ajusta su avance.'}
        </p>
        {propio && <Button icono={Plus} onClick={() => setCreando(true)}>Crear mi primer objetivo</Button>}
      </div>
    );
  }

  const general = avanceDe(objetivos.flatMap(actividadesDe));

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid min-w-[14rem] flex-1 gap-1">
          <p className="text-sm font-semibold">Avance general</p>
          <Avance valor={general} etiqueta="Avance general" />
        </div>
        {propio && !creando && <Button variante="secondary" icono={Plus} onClick={() => setCreando(true)}>Nuevo objetivo</Button>}
      </div>
      {formulario}
      {objetivos.map((obj) => {
        const tipo = TIPOS_OBJETIVO[obj.tipo];
        const vencido = obj.fecha_limite && !esFutura(obj.fecha_limite) && avanceDe(actividadesDe(obj)) !== 100;
        return (
          <section key={obj.id} aria-labelledby={`obj-${obj.id}`} className={`${TARJETA_CLS} grid gap-4 p-5`}>
            <div className="grid gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                {tipo && <span className={`${CHIP_CLS} ${FONDO_TONO[TONO_TIPO[tipo.tono]] || FONDO_TONO.neutral}`}>{tipo.label}</span>}
                {obj.fecha_limite && (
                  <span className={`${CHIP_CLS} ${FONDO_TONO[vencido ? 'danger' : 'neutral']}`}>
                    {vencido ? 'Venció' : 'Vence'} el {formatFecha(obj.fecha_limite, { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {propio && (
                  <button type="button" onClick={() => eliminarObjetivo(obj)} className={`${iconoBotonCls('danger')} ml-auto`} aria-label={`Quitar el objetivo «${obj.titulo}»`} title="Quitar objetivo">
                    <Trash2 size={15} aria-hidden="true" />
                  </button>
                )}
              </div>
              <h3 id={`obj-${obj.id}`} className={TITULO_BLOQUE_CLS}>{obj.titulo}</h3>
              <Avance valor={avanceDe(actividadesDe(obj))} etiqueta={`Avance de ${obj.titulo}`} />
            </div>

            <ol className="grid gap-3">
              {(obj.resultadosClave || []).map((rc, i) => (
                <li key={rc.id} className="grid gap-1 rounded-control border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold"><span className="mr-1.5 text-muted-foreground tabular-nums">RC{i + 1}</span>{rc.descripcion}</p>
                    <span className="text-[13px] font-semibold tabular-nums text-muted-foreground">
                      {avanceDe(rc.actividades) === null ? '—' : `${avanceDe(rc.actividades)} %`}
                    </span>
                  </div>
                  {(rc.actividades || []).length > 0 && (
                    <ul className="grid">
                      {rc.actividades.map((act) => (
                        <Actividad key={`${act.id}-${act.meta_real}`} act={act} editable={editable} onGuardar={guardarActividad} onEliminar={editable ? eliminarActividad : null} />
                      ))}
                    </ul>
                  )}
                  {editable && (
                    <AgregarEnLinea
                      etiqueta="Agregar actividad"
                      placeholder="Describe la actividad"
                      conMeta
                      onAgregar={(descripcion, meta) => ejecutar(() => api.post(`/objetivos/actividad/${rc.id}`, { descripcion, meta_numerica: meta }), 'Actividad agregada')}
                    />
                  )}
                </li>
              ))}
            </ol>
            {editable && (
              <AgregarEnLinea
                etiqueta="Agregar resultado clave"
                placeholder="Describe el resultado clave"
                onAgregar={(descripcion) => ejecutar(() => api.post(`/objetivos/resultado-clave/${obj.id}`, { descripcion }), 'Resultado clave agregado')}
              />
            )}

            {((obj.evidencias || []).length > 0 || editable) && (
              <div className="grid gap-1.5 border-t border-border pt-3">
                <p className="eyebrow">Evidencias</p>
                {(obj.evidencias || []).length > 0 && (
                  <ul className="flex flex-wrap gap-2">
                    {obj.evidencias.map((ev) => (
                      <li key={ev.id} className="flex items-center">
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-border px-3 text-[13px] font-medium text-link hover:bg-muted">
                          <Link2 size={13} aria-hidden="true" />{ev.descripcion || 'Evidencia'}<ExternalLink size={12} aria-hidden="true" />
                          <span className="sr-only"> (se abre en otra pestaña)</span>
                        </a>
                        {editable && (
                          <button type="button" onClick={() => quitarEvidencia(ev)} className={iconoBotonCls('danger')} aria-label={`Quitar la evidencia «${ev.descripcion || ev.url}»`} title="Quitar evidencia">
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                {editable && (
                  <AgregarEvidencia
                    onAgregar={(url, descripcion) => ejecutar(() => api.post(`/objetivos/evidencia/${obj.id}`, { url, descripcion }), 'Evidencia agregada')}
                  />
                )}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default ObjetivosOkr;
