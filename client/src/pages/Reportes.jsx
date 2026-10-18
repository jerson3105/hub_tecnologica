import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileDown, FolderKanban, Rocket, HeartHandshake, MessageSquareHeart } from 'lucide-react';
import api from '../services/api';
import { useProgramas, useEmprendimientos } from '../hooks/useQueryHooks';
import { useDescargarInforme } from '../reportes/descargarInforme';
import TarjetaKpi from '../components/inicio/TarjetaKpi';
import ErrorCarga from '../components/ui/ErrorCarga';
import Skeleton from '../components/ui/Skeleton';
import { CAMPO_CLS, FILTRO_CLS } from '../components/ui/estilos';
import { TARJETA_CLS, TITULO_BLOQUE_CLS, BOTON_PRIMARIO_CLS } from '../components/ui/estilosSemanticos';
import { ESTADOS_PROGRAMA } from '../constants/estados';

const plural = (n, uno, varios) => `${n} ${n === 1 ? uno : varios}`;

// Barras horizontales sencillas (el máximo es el 100 %)
const Barras = ({ items, color = 'bg-primary', vacio }) => {
  if (!items.length) return <p className="text-sm text-muted-foreground">{vacio}</p>;
  const maximo = Math.max(...items.map((i) => i.total), 1);
  return (
    <ul className="grid gap-2">
      {items.map((i) => (
        <li key={i.nombre} className="grid grid-cols-[minmax(0,9rem)_1fr_2.5rem] items-center gap-2 text-sm">
          <span className="truncate" title={i.nombre}>{i.nombre}</span>
          <span className="h-2 overflow-hidden rounded-full bg-muted" aria-hidden="true">
            <span className={`block h-full rounded-full ${i.color || color}`} style={{ width: `${(i.total / maximo) * 100}%` }} />
          </span>
          <span className="text-right font-semibold tabular-nums">{i.total}</span>
        </li>
      ))}
    </ul>
  );
};

// Barra apilada con leyenda (género, estados)
const Reparto = ({ partes, etiqueta }) => {
  const total = partes.reduce((t, p) => t + p.valor, 0);
  return (
    <div className="grid gap-2">
      <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={`${etiqueta}: ${partes.map((p) => `${p.etiqueta} ${p.valor}`).join(', ')}`}>
        {total > 0 && partes.filter((p) => p.valor > 0).map((p) => <span key={p.etiqueta} className={p.color} style={{ width: `${(p.valor / total) * 100}%` }} />)}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted-foreground" aria-hidden="true">
        {partes.map((p) => (
          <li key={p.etiqueta} className="inline-flex items-center gap-1.5">
            <span className={`size-2.5 rounded-full ${p.color}`} />{p.etiqueta} <span className="font-semibold text-foreground tabular-nums">{p.valor}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const Bloque = ({ titulo, children, className = '' }) => (
  <section className={`${TARJETA_CLS} grid content-start gap-4 p-5 ${className}`}>
    <h3 className="text-sm font-semibold text-muted-foreground">{titulo}</h3>
    {children}
  </section>
);

// Indicadores de impacto en pantalla (los mismos datos que el informe de impacto)
const Panorama = ({ datos, alcanceTodos }) => {
  const { emprendimientos: e, personas: p } = datos;
  return (
    <div className="@container grid gap-4">
      <dl className="grid grid-cols-2 gap-3 sm:gap-4 @3xl:grid-cols-3 @5xl:grid-cols-6">
        <TarjetaKpi indice={0} titulo="Emprendimientos acompañados" valor={e.activos + e.graduados} nota={`${e.activos} activos · ${e.graduados} graduados`} />
        <TarjetaKpi indice={1} titulo="Personas en los equipos" valor={p.total} />
        <TarjetaKpi indice={2} titulo="Mujeres" valor={p.porcentajeMujeres} sufijo=" %" nota={`${p.mujeres} de ${p.total}`} />
        <TarjetaKpi indice={3} titulo="Mujeres líderes" valor={p.mujeresLideres} nota={p.lideres ? `${p.porcentajeMujeresLideres} % de ${p.lideres} líderes` : null} />
        <TarjetaKpi indice={4} titulo="Empleos generados" valor={datos.empleos} />
        <TarjetaKpi indice={5} titulo="Graduados" valor={e.graduados} nota={e.retirados ? plural(e.retirados, 'retirado', 'retirados') : null} />
      </dl>
      <div className="grid gap-4 @3xl:grid-cols-3">
        <Bloque titulo="Personas">
          <Reparto etiqueta="Género" partes={[
            { etiqueta: 'Mujeres', valor: p.mujeres, color: 'bg-programa-solid' },
            { etiqueta: 'Hombres', valor: p.hombres, color: 'bg-primary' },
            ...(p.otro ? [{ etiqueta: 'Otro', valor: p.otro, color: 'bg-warning-solid' }] : []),
            ...(p.sinDato ? [{ etiqueta: 'Sin dato', valor: p.sinDato, color: 'bg-border' }] : [])
          ]} />
          <Barras items={p.edades.map((x) => ({ nombre: x.rango, total: x.total, color: x.rango === 'Sin dato' ? 'bg-border' : 'bg-azul-solid' }))} vacio="Sin datos de edad." />
        </Bloque>
        <Bloque titulo="Sectores">
          <Barras items={datos.sectores.slice(0, 6)} color="bg-warning-solid" vacio="Sin sectores registrados." />
          {datos.sectores.length > 6 && <p className="text-[13px] text-muted-foreground">Y {plural(datos.sectores.length - 6, 'sector más', 'sectores más')} en el informe.</p>}
        </Bloque>
        <Bloque titulo="Territorio (departamento)">
          <Barras items={p.departamentos.slice(0, 6)} color="bg-success-solid" vacio="Sin datos de ubicación." />
        </Bloque>
      </div>
      {alcanceTodos && datos.porPrograma.length > 1 && (
        <section className={`${TARJETA_CLS} overflow-hidden`}>
          <h3 className="px-5 pt-4 text-sm font-semibold text-muted-foreground">Por programa</h3>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full min-w-[34rem] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-5 py-2 font-semibold">Programa</th>
                  {['Emprend.', 'Graduados', 'Personas', 'Mujeres', 'Empleos'].map((t) => <th key={t} scope="col" className="px-3 py-2 text-right font-semibold">{t}</th>)}
                </tr>
              </thead>
              <tbody>
                {datos.porPrograma.map((x) => (
                  <tr key={x.id} className="border-b border-border last:border-b-0">
                    <th scope="row" className="px-5 py-2.5 text-left font-medium">
                      {x.nombre} <span className="font-normal text-muted-foreground">· {ESTADOS_PROGRAMA[x.estado]?.label}</span>
                    </th>
                    {[x.total - x.retirados, x.graduados, x.personas, x.mujeres, x.empleos].map((v, i) => <td key={i} className="px-3 py-2.5 text-right tabular-nums">{v}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};

// Tarjeta de un informe PDF: qué incluye, para quién, qué alcance y el botón de descarga
const TarjetaInforme = ({ icono, titulo, para, incluye, etiquetaSelector, selector, onDescargar, cargando, deshabilitado, indice }) => {
  const Icono = icono;
  return (
    <article className={`${TARJETA_CLS} animate-enter escalonado flex flex-col gap-4 p-5`} style={{ '--i': indice }}>
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-control bg-info-soft text-info-soft-foreground"><Icono size={20} aria-hidden="true" /></span>
        <div className="grid gap-0.5">
          <h3 className="font-display text-lg font-semibold leading-snug">{titulo}</h3>
          <p className="text-[13px] text-muted-foreground">{para}</p>
        </div>
      </div>
      <p className="text-sm">{incluye}</p>
      <div className="mt-auto grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
        <label className="grid gap-1.5 text-sm font-medium">
          {etiquetaSelector}
          {selector}
        </label>
        <button type="button" onClick={onDescargar} disabled={deshabilitado || cargando} className={`${BOTON_PRIMARIO_CLS} disabled:cursor-not-allowed disabled:opacity-60`}>
          <FileDown size={16} aria-hidden="true" className={cargando ? 'animate-pulse' : ''} />
          {cargando ? 'Generando…' : 'Descargar PDF'}
        </button>
      </div>
    </article>
  );
};

// Reportes: panorama de impacto en pantalla y cuatro informes en PDF con la marca
const Reportes = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const alcance = searchParams.get('programa') || '';
  const { data: programas = [] } = useProgramas();
  const { data: emprendimientos = [] } = useEmprendimientos();
  const { data: impacto, isLoading, isError, refetch } = useQuery({
    queryKey: ['indicadores', alcance],
    queryFn: () => api.get('/indicadores', { params: alcance ? { programa_id: alcance } : {} }).then((r) => r.data)
  });
  const { descargar, generando } = useDescargarInforme();
  const enCurso = programas.find((p) => p.estado === 'en_curso') || programas[0];
  const [programaInforme, setProgramaInforme] = useState('');
  const [empInforme, setEmpInforme] = useState('');
  const [alcanceImpacto, setAlcanceImpacto] = useState('');
  const [alcanceSatisfaccion, setAlcanceSatisfaccion] = useState('');
  const programaElegido = programaInforme || (enCurso ? String(enCurso.id) : '');

  const opcionesProgramas = programas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>);
  const porPrograma = programas
    .map((p) => ({ programa: p, emps: emprendimientos.filter((e) => e.programa_id === p.id).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')) }))
    .filter((g) => g.emps.length);
  const selectorAlcance = (valor, cambiar) => (
    <select value={valor} onChange={(e) => cambiar(e.target.value)} className={CAMPO_CLS}>
      <option value="">Todos los programas</option>
      {opcionesProgramas}
    </select>
  );

  return (
    <div className="mx-auto grid max-w-page grid-cols-1 gap-4 lg:gap-6">
      <header className="animate-enter">
        <p className="eyebrow">Análisis</p>
        <h1 className="mt-1 font-display text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">Reportes</h1>
        <p className="mt-1 text-muted-foreground">Los indicadores de la incubadora y los informes en PDF para compartir.</p>
      </header>

      <section aria-labelledby="t-panorama" className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="t-panorama" className={TITULO_BLOQUE_CLS}>Panorama</h2>
            <p className="text-[13px] text-muted-foreground">Emprendimientos, personas y empleo{impacto ? ` · datos al ${impacto.hoy.split('-').reverse().join('/')}` : ''}.</p>
          </div>
          <select aria-label="Alcance de los indicadores" value={alcance} onChange={(e) => setSearchParams(e.target.value ? { programa: e.target.value } : {}, { replace: true })} className={FILTRO_CLS}>
            <option value="">Todos los programas</option>
            {opcionesProgramas}
          </select>
        </div>
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="status" aria-label="Cargando indicadores">
            {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28 rounded-card" />)}
          </div>
        )}
        {isError && !impacto && <div className={TARJETA_CLS}><ErrorCarga mensaje="No se pudieron cargar los indicadores." onReintentar={refetch} /></div>}
        {impacto && <Panorama datos={impacto} alcanceTodos={!alcance} />}
      </section>

      <section aria-labelledby="t-informes" className="grid gap-4">
        <div>
          <h2 id="t-informes" className={TITULO_BLOQUE_CLS}>Informes en PDF</h2>
          <p className="text-[13px] text-muted-foreground">Con el logo y los colores del HUB, listos para enviar o imprimir.</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <TarjetaInforme
            indice={0}
            icono={FolderKanban}
            titulo="Informe de programa"
            para="Para dirección o el financiador del programa."
            incluye="Avance o cierre: indicadores, puntos de atención, cartera por emprendimiento (asistencia, compromisos, OKR, última reunión), sesiones y satisfacción."
            etiquetaSelector="Programa"
            selector={(
              <select value={programaElegido} onChange={(e) => setProgramaInforme(e.target.value)} className={CAMPO_CLS}>
                {programas.length === 0 && <option value="">No hay programas</option>}
                {opcionesProgramas}
              </select>
            )}
            onDescargar={() => descargar('programa', programaElegido)}
            cargando={generando('programa', programaElegido)}
            deshabilitado={!programaElegido}
          />
          <TarjetaInforme
            indice={1}
            icono={Rocket}
            titulo="Ficha del emprendimiento"
            para="Para el propio equipo, un mentor o un jurado de graduación."
            incluye="One Pager, equipo, OKR con su avance, compromisos abiertos y vencidos, últimas sesiones registradas y asistencia."
            etiquetaSelector="Emprendimiento"
            selector={(
              <select value={empInforme} onChange={(e) => setEmpInforme(e.target.value)} className={CAMPO_CLS}>
                <option value="">Elegir emprendimiento</option>
                {porPrograma.map((g) => (
                  <optgroup key={g.programa.id} label={g.programa.nombre}>
                    {g.emps.map((e) => <option key={e.id} value={e.id}>{e.nombre}{e.estado !== 'activo' ? ` (${e.estado})` : ''}</option>)}
                  </optgroup>
                ))}
              </select>
            )}
            onDescargar={() => descargar('emprendimiento', empInforme)}
            cargando={generando('emprendimiento', empInforme)}
            deshabilitado={!empInforme}
          />
          <TarjetaInforme
            indice={2}
            icono={HeartHandshake}
            titulo="Impacto para aliados"
            para="Para aliados, financiadores y memorias anuales."
            incluye="Emprendimientos acompañados y graduados, personas por género, edad y territorio, mujeres líderes, empleos y sectores; con desglose por programa."
            etiquetaSelector="Alcance"
            selector={selectorAlcance(alcanceImpacto, setAlcanceImpacto)}
            onDescargar={() => descargar('impacto', alcanceImpacto)}
            cargando={generando('impacto', alcanceImpacto)}
          />
          <TarjetaInforme
            indice={3}
            icono={MessageSquareHeart}
            titulo="Satisfacción y asistencia"
            para="Para el equipo técnico: mejorar las sesiones y a quién llamar."
            incluye="NPS por tipo de evaluación y por sesión, comentarios anónimos y áreas de mejora, asistencia por emprendimiento y por persona."
            etiquetaSelector="Alcance"
            selector={selectorAlcance(alcanceSatisfaccion, setAlcanceSatisfaccion)}
            onDescargar={() => descargar('satisfaccion', alcanceSatisfaccion)}
            cargando={generando('satisfaccion', alcanceSatisfaccion)}
          />
        </div>
      </section>
    </div>
  );
};

export default Reportes;
