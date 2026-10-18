import { Link } from 'react-router-dom';
import { ChevronRight, Rocket } from 'lucide-react';
import { estadoReunion } from '../../utils/inicio';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, CHIP_CLS, FONDO_TONO } from '../ui/estilosSemanticos';
import Trazo from '../ui/Trazo';

const NIVEL_REUNION = {
  ok: { texto: 'text-foreground', punto: 'bg-success-solid' },
  aviso: { texto: 'text-warning', punto: 'bg-warning-solid' },
  mal: { texto: 'text-danger', punto: 'bg-danger-solid' },
  ninguno: { texto: 'text-muted-foreground', punto: 'bg-input' }
};

// Solo se marcan los que no están activos
const ESTADO_NO_ACTIVO = {
  graduado: { label: 'Graduado', tono: 'success' },
  retirado: { label: 'Retirado', tono: 'neutral' }
};

const CABECERA_CLS = 'eyebrow whitespace-nowrap border-y border-border px-3 py-2.5 text-left';

// Avance OKR en trazo
const BarraOkr = ({ valor }) => {
  if (valor === null || valor === undefined) return <span className="text-sm text-subtle-foreground">Sin OKR</span>;
  return (
    <span className="flex items-center gap-2.5">
      <Trazo valor={valor} className="min-w-16 flex-1" />
      <span className="w-11 text-right text-sm font-medium tabular-nums">{valor} %</span>
    </span>
  );
};

const Reunion = ({ dias }) => {
  const { texto, nivel } = estadoReunion(dias);
  const estilo = NIVEL_REUNION[nivel];
  return (
    <span className={`inline-flex items-center gap-1.5 ${estilo.texto}`}>
      <span className={`size-2 shrink-0 rounded-full ${estilo.punto}`} aria-hidden="true" />
      {texto}
    </span>
  );
};

const Compromisos = ({ vencidos, abiertos }) => (
  <span className="tabular-nums">
    <span className={`font-semibold ${vencidos > 0 ? 'text-danger' : 'text-muted-foreground'}`}>{vencidos} {vencidos === 1 ? 'vencido' : 'vencidos'}</span>
    <span className="text-muted-foreground"> · {abiertos} {abiertos === 1 ? 'abierto' : 'abiertos'}</span>
  </span>
);

const Inicial = ({ nombre }) => (
  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-[13px] font-semibold" aria-hidden="true">
    {nombre.charAt(0).toUpperCase()}
  </span>
);

const Nombre = ({ fila, truncar = false }) => {
  const estado = ESTADO_NO_ACTIVO[fila.estado];
  return (
    <span className={`flex min-w-0 items-center gap-2 ${truncar ? '' : 'flex-wrap'}`}>
      <span className={truncar ? 'truncate' : ''}>{fila.nombre}</span>
      {estado && <span className={`${CHIP_CLS} ${FONDO_TONO[estado.tono]}`}>{estado.label}</span>}
    </span>
  );
};

const Equipo = ({ lider, integrantes }) => (
  integrantes > 0 ? (
    <span className="grid whitespace-nowrap">
      <span>{lider || 'Sin líder'}</span>
      <span className="text-xs text-muted-foreground">{integrantes === 1 ? '1 integrante' : `${integrantes} integrantes`}</span>
    </span>
  ) : (
    <span className="text-muted-foreground">Sin integrantes</span>
  )
);

const asistenciaTexto = (valor) => (valor === null || valor === undefined ? '—' : `${valor} %`);
const contexto = (c) => [c.sector, c.programa?.nombre].filter(Boolean).join(' · ');

// Cartera ordenada por atención requerida. Tabla cuando el bloque mide 48rem o más (consulta de
// contenedor: depende del ancho real, con o sin sidebar) y tarjetas por debajo.
// `mostrarEquipo` añade líder e integrantes; `herramientas` (búsqueda, filtros) va bajo el título.
const TablaCartera = ({
  cartera = [], indice = 0, titulo = 'Cartera', vacio = 'No hay emprendimientos activos en este programa.',
  mostrarEquipo = false, herramientas = null, accionVacio = null
}) => (
  <section id="cartera" aria-labelledby="t-cartera" className={`${TARJETA_CLS} @container animate-enter escalonado scroll-mt-4`} style={{ '--i': indice }}>
    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-5 py-4">
      <h2 id="t-cartera" className={TITULO_BLOQUE_CLS}>{titulo}</h2>
      <span className="text-[13px] text-muted-foreground" aria-live="polite">
        {cartera.length === 1 ? '1 emprendimiento' : `${cartera.length} emprendimientos`} · primero lo que requiere atención
      </span>
    </div>
    {herramientas && <div className="border-t border-border px-5 py-3">{herramientas}</div>}

    {cartera.length === 0 ? (
      <div className="flex flex-wrap items-center gap-3 border-t border-border px-5 py-6">
        <span className="grid size-9 shrink-0 place-items-center rounded-control bg-muted text-muted-foreground">
          <Rocket size={18} aria-hidden="true" />
        </span>
        <p className="flex-1 text-sm text-muted-foreground">{vacio}</p>
        {accionVacio}
      </div>
    ) : (
      <>
        {/* Bloque ancho */}
        <div className="hidden overflow-x-auto @3xl:block">
          <table className="w-full border-collapse text-sm">
            <caption className="sr-only">Cartera de emprendimientos ordenada por atención requerida</caption>
            <thead>
              <tr>
                <th scope="col" className={`${CABECERA_CLS} pl-5`}>Emprendimiento</th>
                {mostrarEquipo && <th scope="col" className={CABECERA_CLS}>Equipo</th>}
                <th scope="col" className={CABECERA_CLS}>Última reunión</th>
                <th scope="col" className={CABECERA_CLS}>Compromisos</th>
                <th scope="col" className={`${CABECERA_CLS} w-48`}>Avance OKR</th>
                <th scope="col" className={`${CABECERA_CLS} text-right`}>Asistencia</th>
                <th scope="col" className={`${CABECERA_CLS} pr-5`}><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody>
              {cartera.map((c) => (
                <tr key={c.id} className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/40">
                  <th scope="row" className="py-3 pl-5 pr-3 text-left font-semibold">
                    <span className="flex items-center gap-2.5">
                      <Inicial nombre={c.nombre} />
                      <span className="grid min-w-0">
                        <Nombre fila={c} />
                        <span className="whitespace-nowrap text-xs font-normal text-muted-foreground">{contexto(c)}</span>
                      </span>
                    </span>
                  </th>
                  {mostrarEquipo && <td className="p-3"><Equipo lider={c.lider} integrantes={c.integrantes} /></td>}
                  <td className="whitespace-nowrap p-3"><Reunion dias={c.diasSinReunion} /></td>
                  <td className="whitespace-nowrap p-3"><Compromisos vencidos={c.vencidos} abiertos={c.abiertos} /></td>
                  <td className="p-3"><BarraOkr valor={c.okr} /></td>
                  <td className="p-3 text-right tabular-nums">{asistenciaTexto(c.asistencia)}</td>
                  <td className="py-3 pl-3 pr-5 text-right">
                    <Link
                      to={`/emprendimientos/${c.id}`}
                      aria-label={`Abrir ${c.nombre}`}
                      className="inline-grid size-9 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <ChevronRight size={16} aria-hidden="true" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bloque estrecho */}
        <ul className="border-t border-border @3xl:hidden">
          {cartera.map((c) => (
            <li key={c.id} className="border-b border-border last:border-b-0">
              <Link to={`/emprendimientos/${c.id}`} className="grid gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50">
                <span className="flex items-center gap-2.5">
                  <Inicial nombre={c.nombre} />
                  <span className="grid min-w-0 flex-1">
                    <span className="text-sm font-semibold"><Nombre fila={c} truncar /></span>
                    <span className="truncate text-xs text-muted-foreground">{contexto(c)}</span>
                  </span>
                  <ChevronRight size={16} className="shrink-0 text-muted-foreground" aria-hidden="true" />
                </span>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-[13px] @xl:grid-cols-4">
                  {mostrarEquipo && (
                    <div className="col-span-2 grid gap-0.5 @xl:col-span-4">
                      <dt className="text-xs text-muted-foreground">Equipo</dt>
                      <dd>
                        {c.integrantes > 0
                          ? `${c.lider || 'Sin líder'} · ${c.integrantes === 1 ? '1 integrante' : `${c.integrantes} integrantes`}`
                          : 'Sin integrantes'}
                      </dd>
                    </div>
                  )}
                  <div className="grid gap-0.5">
                    <dt className="text-xs text-muted-foreground">Última reunión</dt>
                    <dd><Reunion dias={c.diasSinReunion} /></dd>
                  </div>
                  <div className="grid gap-0.5">
                    <dt className="text-xs text-muted-foreground">Compromisos</dt>
                    <dd><Compromisos vencidos={c.vencidos} abiertos={c.abiertos} /></dd>
                  </div>
                  <div className="grid gap-0.5">
                    <dt className="text-xs text-muted-foreground">Avance OKR</dt>
                    <dd><BarraOkr valor={c.okr} /></dd>
                  </div>
                  <div className="grid gap-0.5">
                    <dt className="text-xs text-muted-foreground">Asistencia</dt>
                    <dd className="tabular-nums">{asistenciaTexto(c.asistencia)}</dd>
                  </div>
                </dl>
              </Link>
            </li>
          ))}
        </ul>
      </>
    )}
  </section>
);

export default TablaCartera;
