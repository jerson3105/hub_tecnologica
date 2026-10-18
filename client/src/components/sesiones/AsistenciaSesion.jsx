import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Save, UserCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import Button from '../ui/Button';
import { TARJETA_CLS, TITULO_BLOQUE_CLS } from '../ui/estilosSemanticos';

const OPCION_CLS = 'min-h-9 rounded-[calc(var(--radius-control)-4px)] px-3 text-[13px] font-semibold transition-colors';

// Toma de asistencia de la sesión, agrupada por emprendimiento. Los cambios se acumulan y se
// guardan juntos (botón fijo al pie); avisa si se intenta salir sin guardar.
const AsistenciaSesion = ({ sesionId, emprendimientos, sesionFutura }) => {
  const queryClient = useQueryClient();
  const [cambios, setCambios] = useState({}); // usuario_id → presente
  const [guardando, setGuardando] = useState(false);

  const miembros = emprendimientos.flatMap((e) => e.equipo.map((m) => ({ ...m, emprendimiento: e.nombre })));
  const valor = (m) => (m.usuario_id in cambios ? cambios[m.usuario_id] : m.presente);
  const pendientes = Object.keys(cambios).length;
  const marcados = miembros.filter((m) => valor(m) !== null && valor(m) !== undefined);
  const presentes = marcados.filter((m) => valor(m)).length;

  const marcar = (usuarioId, presente) => setCambios((prev) => ({ ...prev, [usuarioId]: presente }));
  const marcarGrupo = (lista, presente) => setCambios((prev) => ({ ...prev, ...Object.fromEntries(lista.map((m) => [m.usuario_id, presente])) }));

  useEffect(() => {
    if (!pendientes) return undefined;
    const alSalir = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', alSalir);
    return () => window.removeEventListener('beforeunload', alSalir);
  }, [pendientes]);

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.post('/asistencias', {
        sesion_id: Number(sesionId),
        asistencias: Object.entries(cambios).map(([usuarioId, presente]) => ({ usuario_id: Number(usuarioId), presente }))
      });
      toast.success('Asistencia guardada');
      // Lo guardado pasa a la caché antes de limpiar los cambios: sin parpadeo de valores viejos
      queryClient.setQueryData(['sesion', sesionId, 'registro'], (previo) => previo && ({
        ...previo,
        emprendimientos: previo.emprendimientos.map((e) => ({
          ...e,
          equipo: e.equipo.map((m) => (m.usuario_id in cambios ? { ...m, presente: cambios[m.usuario_id] } : m))
        }))
      }));
      setCambios({});
      ['sesion', 'sesiones', 'inicio', 'programa', 'emprendimiento', 'emprendimientos'].forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
    } catch (error) {
      toast.error(error.response?.data?.mensaje || 'No se pudo guardar la asistencia');
    } finally {
      setGuardando(false);
    }
  };

  if (miembros.length === 0) {
    return (
      <div className={`${TARJETA_CLS} flex items-center gap-3 p-5`}>
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-muted text-muted-foreground"><Users size={18} aria-hidden="true" /></span>
        <p className="text-sm text-muted-foreground">Los emprendimientos de esta sesión aún no tienen integrantes.</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="t-asistencia" className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="t-asistencia" className={TITULO_BLOQUE_CLS}>Asistencia</h2>
          <p className="text-[13px] text-muted-foreground" aria-live="polite">
            {marcados.length === 0 ? `Sin tomar · ${miembros.length} participantes` : `${presentes} presentes de ${marcados.length} marcados · ${miembros.length} participantes`}
          </p>
        </div>
        <Button variante="secondary" tamanio="sm" icono={UserCheck} onClick={() => marcarGrupo(miembros, true)} disabled={sesionFutura}>
          Todos presentes
        </Button>
      </div>
      {sesionFutura && (
        <p className="rounded-control bg-info-soft px-3 py-2 text-[13px] text-info-soft-foreground">La sesión aún no ocurre: podrás tomar la asistencia ese día.</p>
      )}

      <div className="grid gap-3 @3xl:grid-cols-2">
        {emprendimientos.filter((e) => e.equipo.length > 0).map((e) => (
          <div key={e.id} className={`${TARJETA_CLS} grid content-start gap-2 p-4`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold">{e.nombre}</h3>
              <button type="button" onClick={() => marcarGrupo(e.equipo, true)} disabled={sesionFutura} className="rounded-control px-2 py-1 text-[13px] font-semibold text-link hover:bg-info-soft disabled:opacity-50">
                Todos
              </button>
            </div>
            <ul className="grid gap-1.5">
              {e.equipo.map((m) => {
                const v = valor(m);
                return (
                  <li key={m.usuario_id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="min-w-0 text-sm">
                      {m.nombre} {m.apellido}
                      {m.usuario_id in cambios && <span className="ml-1.5 text-xs text-warning">· sin guardar</span>}
                    </span>
                    <div role="radiogroup" aria-label={`Asistencia de ${m.nombre} ${m.apellido}`} className="flex gap-1 rounded-control bg-muted p-1">
                      <button type="button" role="radio" aria-checked={v === true} disabled={sesionFutura} onClick={() => marcar(m.usuario_id, true)}
                        className={`${OPCION_CLS} ${v === true ? 'bg-success-solid text-success-solid-foreground' : 'text-muted-foreground hover:bg-card hover:text-foreground'}`}>
                        Presente
                      </button>
                      <button type="button" role="radio" aria-checked={v === false} disabled={sesionFutura} onClick={() => marcar(m.usuario_id, false)}
                        className={`${OPCION_CLS} ${v === false ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-card hover:text-foreground'}`}>
                        Ausente
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {pendientes > 0 && (
        <div className="sticky bottom-[calc(4rem+env(safe-area-inset-bottom))] z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:bottom-0 lg:mx-0 lg:rounded-card lg:border lg:bg-card lg:px-5">
          <span className="text-sm text-warning" aria-live="polite">{pendientes === 1 ? '1 cambio sin guardar' : `${pendientes} cambios sin guardar`}</span>
          <div className="flex gap-2">
            <Button variante="ghost" onClick={() => setCambios({})}>Descartar</Button>
            <Button icono={Save} cargando={guardando} onClick={guardar}>Guardar asistencia</Button>
          </div>
        </div>
      )}
    </section>
  );
};

export default AsistenciaSesion;
