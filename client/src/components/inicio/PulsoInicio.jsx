import { Link } from 'react-router-dom';
import { formatoDecimal } from '../../utils/inicio';
import { formatFecha } from '../../utils/fechas';
import { TARJETA_CLS, TITULO_BLOQUE_CLS } from '../ui/estilosSemanticos';

const Tarjeta = ({ titulo, cifra, children }) => (
  <div className={`${TARJETA_CLS} grid content-start gap-3 p-5`}>
    <div className="flex items-baseline justify-between gap-3">
      <h3 className="text-sm font-medium text-muted-foreground">{titulo}</h3>
      <span className="text-2xl font-semibold tabular-nums">{cifra}</span>
    </div>
    {children}
  </div>
);

const SinDatos = ({ children }) => <p className="text-[13px] text-muted-foreground">{children}</p>;

// Distribución NPS (1-10): detractores ≤ 6, pasivos 7-8, promotores 9-10
const DistribucionNps = ({ nps }) => {
  const tramos = [
    { nombre: 'Detractores', valor: nps.detractores, color: 'bg-danger-solid' },
    { nombre: 'Pasivos', valor: nps.pasivos, color: 'bg-input' },
    { nombre: 'Promotores', valor: nps.promotores, color: 'bg-success-solid' }
  ];
  const descripcion = tramos.map((t) => `${t.nombre} ${t.valor} %`).join(', ');
  return (
    <>
      <div role="img" aria-label={descripcion} className="flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-muted">
        {tramos.filter((t) => t.valor > 0).map((t) => (
          <span key={t.nombre} className={t.color} style={{ width: `${t.valor}%` }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-[13px] tabular-nums text-muted-foreground" aria-hidden="true">
        {tramos.map((t) => (
          <span key={t.nombre} className="inline-flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${t.color}`} />{t.nombre} {t.valor} %
          </span>
        ))}
      </div>
      <p className="text-[13px] text-muted-foreground">{nps.total === 1 ? '1 respuesta' : `${nps.total} respuestas`}</p>
    </>
  );
};

// Línea de asistencia por sesión (la línea se dibuja una vez)
const LineaAsistencia = ({ sesiones }) => {
  const ancho = 300;
  const alto = 64;
  const x = (i) => (sesiones.length === 1 ? ancho / 2 : 4 + (i * (ancho - 8)) / (sesiones.length - 1));
  const y = (p) => alto - 8 - ((p ?? 0) / 100) * (alto - 16);
  const puntos = sesiones.map((s, i) => [x(i), y(s.porcentaje)]);
  const d = puntos.map(([px, py], i) => `${i === 0 ? 'M' : 'L'}${px.toFixed(1)} ${py.toFixed(1)}`).join(' ');
  const ultimo = puntos[puntos.length - 1];
  const descripcion = `Asistencia de las últimas ${sesiones.length} sesiones: ${sesiones.map((s) => `${s.titulo} (${formatFecha(s.fecha, { day: 'numeric', month: 'short' })}) ${s.porcentaje} %`).join('; ')}`;
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} role="img" aria-label={descripcion} className="h-16 w-full overflow-visible">
      <line x1="0" x2={ancho} y1={y(100)} y2={y(100)} className="stroke-chart-grid" strokeDasharray="3 4" />
      {sesiones.length > 1 && (
        <path
          d={d} pathLength="1" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1"
          className="animate-draw stroke-chart-1"
          style={{ '--desde': 1, strokeDashoffset: 0, animationDelay: 'calc(var(--dur-draw) * 0.6)' }}
        />
      )}
      <circle cx={ultimo[0]} cy={ultimo[1]} r="4" className="fill-chart-1" />
    </svg>
  );
};

// Pulso del Inicio (últimos 30 días) o de un programa completo (`periodo` cambia los textos)
const PulsoInicio = ({ pulso, titulo = 'Pulso de los últimos 30 días', periodo = 'en los últimos 30 días' }) => {
  const { nps, asistencia, respuesta } = pulso;
  return (
    <section aria-labelledby="t-pulso" className="grid gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="t-pulso" className={TITULO_BLOQUE_CLS}>{titulo}</h2>
        <Link to="/reportes" className="shrink-0 rounded-control text-sm font-semibold text-link hover:underline">Ver reportes</Link>
      </div>
      <div className="grid grid-cols-[repeat(auto-fit,minmax(min(18rem,100%),1fr))] gap-4">
        <Tarjeta titulo="NPS promedio" cifra={formatoDecimal(nps.promedio)}>
          {nps.total > 0 ? <DistribucionNps nps={nps} /> : <SinDatos>Sin evaluaciones {periodo}.</SinDatos>}
        </Tarjeta>
        <Tarjeta titulo="Asistencia media" cifra={asistencia.media === null ? '—' : `${asistencia.media} %`}>
          {asistencia.sesiones.length > 0
            ? (
              <>
                <LineaAsistencia sesiones={asistencia.sesiones} />
                <p className="text-[13px] text-muted-foreground">
                  {asistencia.sesiones.length === 1 ? '1 sesión con asistencia tomada' : `Últimas ${asistencia.sesiones.length} sesiones con asistencia tomada`}
                </p>
              </>
            )
            : <SinDatos>Aún no se ha tomado asistencia en este periodo.</SinDatos>}
        </Tarjeta>
        <Tarjeta titulo="Respuesta a evaluaciones" cifra={respuesta.tasa === null ? '—' : `${respuesta.tasa} %`}>
          <SinDatos>
            {respuesta.presentes > 0
              ? `${respuesta.respuestas} de ${respuesta.presentes} asistentes evaluaron la sesión. Solo cuentan sesiones realizadas y con asistencia tomada.`
              : 'Se calcula con las sesiones realizadas que tienen asistencia tomada.'}
          </SinDatos>
        </Tarjeta>
      </div>
    </section>
  );
};

export default PulsoInicio;
