import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Target, Trash2, Link2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Trazo from '../ui/Trazo';
import ErrorCarga from '../ui/ErrorCarga';
import Skeleton from '../ui/Skeleton';
import { Input } from '../ui/Field';
import { useObjetivos } from '../../hooks/useQueryHooks';
import { avanceDe, actividadesDe } from '../../utils/okr';
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

// OKR del emprendimiento. `editable` (equipo técnico): actualizar el avance, añadir resultados
// clave y actividades y quitar actividades. Borrar objetivos queda para el emprendimiento.
const ObjetivosOkr = ({ emprendimientoId, editable = false, enlaceEdicion = null }) => {
  const queryClient = useQueryClient();
  const { data: objetivos = [], isLoading, isError, refetch } = useObjetivos(emprendimientoId);

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

  if (isLoading) return <div className={`${TARJETA_CLS} grid gap-3 p-5`} role="status" aria-label="Cargando objetivos"><Skeleton className="h-6 w-56" /><Skeleton className="h-1.5 w-full" />{[0, 1].map((i) => <Skeleton key={i} className="h-12" />)}</div>;
  if (isError) return <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudieron cargar los objetivos." onReintentar={refetch} /></div>;

  if (objetivos.length === 0) {
    return (
      <div className={`${TARJETA_CLS} grid justify-items-center gap-3 px-5 py-10 text-center`}>
        <span className="grid size-12 place-items-center rounded-card bg-muted text-muted-foreground"><Target size={24} aria-hidden="true" /></span>
        <p className="font-semibold">Aún no hay objetivos</p>
        <p className="max-w-md text-sm text-muted-foreground">Los define el propio emprendimiento desde «Mis objetivos». Aquí se revisan y se ajusta su avance.</p>
        {enlaceEdicion}
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
        {enlaceEdicion}
      </div>
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

            {(obj.evidencias || []).length > 0 && (
              <div className="grid gap-1.5 border-t border-border pt-3">
                <p className="eyebrow">Evidencias</p>
                <ul className="flex flex-wrap gap-2">
                  {obj.evidencias.map((ev) => (
                    <li key={ev.id}>
                      <a href={ev.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-1.5 rounded-control border border-border px-3 text-[13px] font-medium text-link hover:bg-muted">
                        <Link2 size={13} aria-hidden="true" />{ev.descripcion || 'Evidencia'}<ExternalLink size={12} aria-hidden="true" />
                        <span className="sr-only"> (se abre en otra pestaña)</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
};

export default ObjetivosOkr;
