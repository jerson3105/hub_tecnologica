import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, Check, CircleDashed, Minus, AlertCircle, Loader2, UserX, PartyPopper } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useRegistroSesion } from '../hooks/useQueryHooks';
import RondaFormulario from '../components/sesiones/RondaFormulario';
import Trazo from '../components/ui/Trazo';
import Skeleton from '../components/ui/Skeleton';
import ErrorCarga from '../components/ui/ErrorCarga';
import { FILTRO_CLS } from '../components/ui/estilos';
import { TARJETA_CLS, BOTON_PRIMARIO_CLS, BOTON_SECUNDARIO_CLS } from '../components/ui/estilosSemanticos';
import { TIPOS_CON_REGISTRO } from '../constants/sesiones';
import { formatFecha } from '../utils/fechas';
import { borradorDesde, cuerpoDe, conIdsCreados, ESTADOS_RONDA } from '../utils/ronda';

const ESPERA_AUTOGUARDADO = 1200;

const IconoEstado = ({ estado }) => {
  if (estado === 'registrado') return <span className="grid size-5 place-items-center rounded-full bg-success-solid text-success-solid-foreground"><Check size={12} strokeWidth={3} /></span>;
  if (estado === 'no_asistio') return <span className="grid size-5 place-items-center rounded-full bg-muted text-muted-foreground"><Minus size={12} strokeWidth={3} /></span>;
  return <CircleDashed size={20} className="text-warning" />;
};

// Estado del guardado del emprendimiento que se está editando (anunciado a lectores de pantalla)
const IndicadorGuardado = ({ estado, onReintentar }) => {
  if (!estado) return null;
  const textos = {
    pendiente: { icono: <CircleDashed size={14} />, texto: 'Cambios sin guardar', cls: 'text-muted-foreground' },
    guardando: { icono: <Loader2 size={14} className="animate-spin" />, texto: 'Guardando…', cls: 'text-muted-foreground' },
    guardado: { icono: <Check size={14} />, texto: `Guardado${estado.en ? ` a las ${estado.en.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false })}` : ''}`, cls: 'text-success' },
    error: { icono: <AlertCircle size={14} />, texto: estado.mensaje ? `No se pudo guardar: ${estado.mensaje}` : 'No se pudo guardar', cls: 'text-danger' }
  };
  const t = textos[estado.estado];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[13px] ${t.cls}`} role="status" aria-live="polite">
      <span aria-hidden="true">{t.icono}</span>{t.texto}
      {estado.estado === 'error' && <button type="button" onClick={onReintentar} className="ml-1 font-semibold underline">Reintentar</button>}
    </span>
  );
};

const RegistroRonda = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data, isLoading, isError, refetch } = useRegistroSesion(id);

  // Borradores por emprendimiento. El ref es la fuente de verdad (los guardados leen de ahí sin
  // esperar a un render); el estado solo sirve para pintar.
  const borradoresRef = useRef({});
  const [borradores, setBorradores] = useState({});
  const [estados, setEstados] = useState({});
  const versiones = useRef({});
  const temporizadores = useRef({});
  const enVuelo = useRef({});
  const repetir = useRef({});
  // Referencia a la última versión de guardar, para repetir el guardado desde dentro de sí mismo
  const guardarRef = useRef(null);

  const emps = data?.emprendimientos || [];
  const elegido = Number(searchParams.get('emp'));
  const actual = emps.find((e) => e.id === elegido) || emps.find((e) => e.estado === 'pendiente') || emps[0];
  const indice = actual ? emps.indexOf(actual) : -1;
  const registrados = emps.filter((e) => e.estado !== 'pendiente').length;

  const fijarEstado = (empId, estado) => setEstados((prev) => ({ ...prev, [empId]: estado }));
  const fijarBorrador = (empId, borrador) => {
    borradoresRef.current = { ...borradoresRef.current, [empId]: borrador };
    setBorradores(borradoresRef.current);
  };

  const guardar = async (empId) => {
    clearTimeout(temporizadores.current[empId]);
    delete temporizadores.current[empId];
    const borrador = borradoresRef.current[empId];
    if (!borrador) return true;
    // Un guardado a la vez por emprendimiento: si llega otro cambio, se repite al terminar
    if (enVuelo.current[empId]) {
      repetir.current[empId] = true;
      return enVuelo.current[empId];
    }
    const version = versiones.current[empId] || 0;
    setEstados((prev) => ({ ...prev, [empId]: { estado: 'guardando' } }));
    const promesa = api.put(`/sesiones/${id}/registro/${empId}`, cuerpoDe(borrador))
      .then(({ data: respuesta }) => {
        queryClient.setQueryData(['sesion', id, 'registro'], (previo) => previo && ({
          ...previo,
          emprendimientos: previo.emprendimientos.map((e) => (e.id === empId ? respuesta.emprendimiento : e))
        }));
        if (respuesta.creados?.length) {
          borradoresRef.current = { ...borradoresRef.current, [empId]: conIdsCreados(borradoresRef.current[empId], respuesta.creados) };
          setBorradores(borradoresRef.current);
        }
        const alDia = (versiones.current[empId] || 0) === version;
        setEstados((prev) => ({ ...prev, [empId]: alDia ? { estado: 'guardado', en: new Date() } : { estado: 'pendiente' } }));
        return true;
      })
      .catch((error) => {
        setEstados((prev) => ({ ...prev, [empId]: { estado: 'error', mensaje: error.response?.data?.mensaje } }));
        return false;
      })
      .finally(() => {
        enVuelo.current[empId] = null;
        if (repetir.current[empId]) {
          repetir.current[empId] = false;
          guardarRef.current?.(empId);
        }
      });
    enVuelo.current[empId] = promesa;
    return promesa;
  };
  useEffect(() => { guardarRef.current = guardar; });

  const cambiar = (emp, fn) => {
    const base = borradoresRef.current[emp.id] ?? borradorDesde(emp);
    fijarBorrador(emp.id, fn(base));
    versiones.current[emp.id] = (versiones.current[emp.id] || 0) + 1;
    fijarEstado(emp.id, { estado: 'pendiente' });
    clearTimeout(temporizadores.current[emp.id]);
    temporizadores.current[emp.id] = setTimeout(() => guardar(emp.id), ESPERA_AUTOGUARDADO);
  };

  // Cambiar de emprendimiento guarda lo pendiente del anterior
  const ir = (emp) => {
    if (!emp || emp.id === actual?.id) return;
    if (actual && estados[actual.id]?.estado === 'pendiente') guardar(actual.id);
    setSearchParams({ emp: String(emp.id) }, { replace: true });
    window.scrollTo({ top: 0 });
  };

  const siguientePendiente = () => {
    const resto = [...emps.slice(indice + 1), ...emps.slice(0, indice)];
    return resto.find((e) => e.estado === 'pendiente') || null;
  };

  const guardarYSeguir = async () => {
    if (!actual) return;
    const ok = await guardar(actual.id);
    if (!ok) {
      toast.error('No se pudo guardar. Revisa el aviso y vuelve a intentarlo.');
      return;
    }
    // Se lee el estado ya actualizado por el guardado
    const datos = queryClient.getQueryData(['sesion', id, 'registro']);
    const lista = datos?.emprendimientos || emps;
    const pos = lista.findIndex((e) => e.id === actual.id);
    const siguiente = [...lista.slice(pos + 1), ...lista.slice(0, pos)].find((e) => e.estado === 'pendiente');
    if (siguiente) ir(siguiente);
    else toast.success('Todos los emprendimientos de la ronda están registrados');
  };

  const noAsistio = () => {
    if (!actual) return;
    cambiar(actual, (b) => ({ ...b, asistencia: Object.fromEntries(actual.equipo.map((m) => [m.usuario_id, false])) }));
    guardarYSeguir();
  };

  // Aviso al salir con cambios sin guardar
  useEffect(() => {
    const alSalir = (e) => {
      const sinGuardar = Object.values(estados).some((s) => ['pendiente', 'guardando', 'error'].includes(s?.estado));
      if (sinGuardar) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', alSalir);
    return () => window.removeEventListener('beforeunload', alSalir);
  }, [estados]);

  // Al desmontar (navegación interna) se guarda lo que esperaba su autoguardado
  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => {
      Object.keys(pendientes).forEach((empId) => {
        clearTimeout(pendientes[empId]);
        if (borradoresRef.current[empId]) guardarRef.current?.(Number(empId));
      });
    };
  }, []);

  // Al salir, el resto de la app se refresca con lo registrado (queryClient es estable; useInvalidate
  // devuelve una función nueva en cada render y dispararía esta limpieza en cada uno)
  useEffect(() => () => {
    ['sesiones', 'sesion', 'inicio', 'programa', 'emprendimiento', 'emprendimientos', 'timeline']
      .forEach((clave) => queryClient.invalidateQueries({ queryKey: [clave] }));
  }, [queryClient]);

  if (isLoading) {
    return (
      <div className="mx-auto grid max-w-page gap-4" role="status" aria-label="Cargando la ronda">
        <Skeleton className="h-8 w-80 max-w-full" />
        <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
          <Skeleton className="hidden h-96 rounded-card lg:block" />
          <div className="grid gap-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-40 rounded-card" />)}</div>
        </div>
      </div>
    );
  }
  if (isError || !data) {
    return <div className={`${TARJETA_CLS} mx-auto max-w-page`}><ErrorCarga mensaje="No se pudo cargar la sesión." onReintentar={refetch} /></div>;
  }

  const { sesion, proximaSesion } = data;
  const volver = `/sesiones/${sesion.id}`;
  // En los talleres el registro por emprendimiento es opcional (no cuenta como pendiente)
  const opcional = !TIPOS_CON_REGISTRO.includes(sesion.tipo);
  const borrador = actual ? (borradores[actual.id] ?? borradorDesde(actual)) : null;
  const porcentaje = emps.length ? Math.round((registrados / emps.length) * 100) : 0;
  const quedan = emps.length - registrados;

  return (
    <div className="mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <header className="animate-enter grid gap-3">
        <Link to={volver} className="inline-flex w-fit items-center gap-1.5 rounded-control text-sm text-muted-foreground hover:text-link">
          <ArrowLeft size={15} aria-hidden="true" />Volver a la sesión
        </Link>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="eyebrow">Registrar ronda</p>
            <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{sesion.titulo}</h1>
            <p className="mt-1 text-muted-foreground first-letter:uppercase">
              {formatFecha(sesion.fecha, { weekday: 'long', day: 'numeric', month: 'long' })}
              {sesion.programas.length > 0 && ` · ${sesion.programas.map((p) => p.nombre).join(', ')}`}
            </p>
          </div>
          {emps.length > 0 && (
            <div className="grid w-full max-w-72 gap-1.5 sm:w-72">
              <p className="flex items-baseline justify-between text-sm" aria-live="polite">
                <span className="font-semibold">{registrados} de {emps.length} registrados</span>
                <span className="text-muted-foreground">{quedan === 0 ? 'Ronda completa' : `faltan ${quedan}`}</span>
              </p>
              <Trazo valor={porcentaje} retraso={0} />
            </div>
          )}
        </div>
      </header>

      {opcional && emps.length > 0 && (
        <p className="rounded-control bg-info-soft px-4 py-2.5 text-sm text-info-soft-foreground">
          En los talleres este registro es opcional: sirve para dejar notas, compromisos o la asistencia de un emprendimiento concreto.
        </p>
      )}
      {emps.length === 0 ? (
        <div className={`${TARJETA_CLS} p-6 text-sm text-muted-foreground`}>Ningún emprendimiento activo participa en esta sesión.</div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-6">
          {/* Lista de la ronda: barra lateral fija en escritorio, selector en móvil */}
          <nav aria-label="Emprendimientos de la ronda" className={`${TARJETA_CLS} hidden p-2 lg:sticky lg:top-4 lg:block`}>
            <ul className="grid gap-0.5">
              {emps.map((e) => {
                const esActual = e.id === actual?.id;
                const guardandoEste = estados[e.id]?.estado === 'guardando';
                return (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => ir(e)}
                      aria-current={esActual ? 'step' : undefined}
                      className={`flex w-full items-center gap-3 rounded-control px-3 py-2.5 text-left transition-colors ${esActual ? 'bg-info-soft' : 'hover:bg-muted'}`}
                    >
                      <span aria-hidden="true" className="shrink-0">{guardandoEste ? <Loader2 size={18} className="animate-spin text-muted-foreground" /> : <IconoEstado estado={e.estado} />}</span>
                      <span className="grid min-w-0">
                        <span className={`truncate text-sm ${esActual ? 'font-semibold' : 'font-medium'}`}>{e.nombre}</span>
                        <span className="text-xs text-muted-foreground">{ESTADOS_RONDA[e.estado].label}</span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="grid min-w-0 gap-4">
            <div className="flex items-center gap-2 lg:hidden">
              <select aria-label="Emprendimiento" value={actual?.id} onChange={(e) => ir(emps.find((x) => x.id === Number(e.target.value)))} className={`${FILTRO_CLS} flex-1`}>
                {emps.map((e, i) => <option key={e.id} value={e.id}>{i + 1}. {e.nombre} · {ESTADOS_RONDA[e.estado].label}</option>)}
              </select>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
              <div className="min-w-0">
                <h2 className="font-display text-xl font-semibold leading-snug">{actual.nombre}</h2>
                <p className="text-[13px] text-muted-foreground">
                  {[actual.sector, actual.programa?.nombre, `${indice + 1} de ${emps.length}`].filter(Boolean).join(' · ')}
                </p>
              </div>
              <IndicadorGuardado estado={estados[actual.id]} onReintentar={() => guardar(actual.id)} />
            </div>

            <RondaFormulario
              key={actual.id}
              emp={actual}
              borrador={borrador}
              proximaSesion={proximaSesion}
              tipo={sesion.tipo}
              onCambio={(fn) => cambiar(actual, fn)}
            />

            {/* Acciones fijas al pie, junto al pulgar y siempre a la vista */}
            <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur lg:mx-0 lg:rounded-card lg:border lg:bg-card lg:px-5">
              <button type="button" onClick={noAsistio} className={BOTON_SECUNDARIO_CLS} disabled={!actual.equipo.length} title={actual.equipo.length ? undefined : 'Sin integrantes'}>
                <UserX size={16} aria-hidden="true" />No asistió
              </button>
              {quedan === 0 && !siguientePendiente() && estados[actual.id]?.estado !== 'pendiente' ? (
                <button type="button" onClick={() => navigate(volver)} className={BOTON_PRIMARIO_CLS}>
                  <PartyPopper size={16} aria-hidden="true" />Terminar
                </button>
              ) : (
                <button type="button" onClick={guardarYSeguir} className={BOTON_PRIMARIO_CLS}>
                  Guardar y siguiente<ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistroRonda;
