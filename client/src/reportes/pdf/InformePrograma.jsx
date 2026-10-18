import { View, Text } from '@react-pdf/renderer';
import { Informe, Portada, Seccion, Kpis, Tabla, Barra, BarraApilada, Chip, Nota, Vacio } from './componentes';
import { C } from './marca';
import { formatFecha } from '../../utils/fechas';
import { tipoSesion } from '../../constants/sesiones';
import { ESTADOS_PROGRAMA, ESTADOS_EMPRENDIMIENTO } from '../../constants/estados';
import { fechaCorta, fechaLarga, colorAsistencia, tonoNps, porcentajeTexto } from './formato';

const DIAS_SIN_REUNION = 21;

const textoPeriodo = (periodo) => {
  if (!periodo) return null;
  if (periodo.fase === 'por_empezar') return `Empieza en ${periodo.diasParaEmpezar} días · ${periodo.semanas} semanas`;
  if (periodo.fase === 'terminado') return `Programa terminado · ${periodo.semanas} semanas`;
  return `Semana ${periodo.semana} de ${periodo.semanas} · ${periodo.porcentaje} % del calendario`;
};

// Puntos de atención del programa, en frases cortas
const alertasDe = ({ kpis, cartera, sesiones }) => {
  const alertas = [];
  const conVencidos = cartera.filter((f) => f.vencidos > 0);
  if (conVencidos.length) alertas.push(`${kpis.compromisosVencidos} ${kpis.compromisosVencidos === 1 ? 'compromiso vencido' : 'compromisos vencidos'} en ${conVencidos.map((f) => f.nombre).join(', ')}.`);
  const sinReunion = cartera.filter((f) => f.estado === 'activo' && (f.diasSinReunion ?? 0) > DIAS_SIN_REUNION);
  if (sinReunion.length) alertas.push(`Más de ${DIAS_SIN_REUNION} días sin reunión registrada: ${sinReunion.map((f) => `${f.nombre} (${f.diasSinReunion})`).join(', ')}.`);
  const bajaAsistencia = cartera.filter((f) => f.asistencia !== null && f.asistencia < 60);
  if (bajaAsistencia.length) alertas.push(`Asistencia menor al 60 %: ${bajaAsistencia.map((f) => `${f.nombre} (${f.asistencia} %)`).join(', ')}.`);
  const sinTomar = sesiones.filter((s) => s.momento === 'pasada' && s.asistencia === null);
  if (sinTomar.length) alertas.push(`${sinTomar.length} ${sinTomar.length === 1 ? 'sesión realizada sin' : 'sesiones realizadas sin'} asistencia tomada.`);
  if (kpis.registrosPendientes) alertas.push(kpis.registrosPendientes === 1 ? '1 registro de sesión pendiente de completar.' : `${kpis.registrosPendientes} registros de sesión pendientes de completar.`);
  return alertas;
};

// Informe de avance (o de cierre) de un programa. `datos` = GET /programas/:id/resumen
const InformePrograma = ({ datos, logo }) => {
  const { programa, periodo, kpis, sesiones, cartera, pulso, hoy } = datos;
  const terminado = periodo?.fase === 'terminado' || programa.estado === 'finalizado';
  const okrs = cartera.map((f) => f.okr).filter((v) => v !== null);
  const okrMedio = okrs.length ? Math.round(okrs.reduce((t, v) => t + v, 0) / okrs.length) : null;
  const alertas = alertasDe({ kpis, cartera, sesiones });

  return (
    <Informe titulo={terminado ? 'Informe de cierre' : 'Informe de avance'} alcance={programa.nombre}>
      <Portada
        logo={logo}
        eyebrow={terminado ? 'Informe de cierre de programa' : 'Informe de avance de programa'}
        titulo={programa.nombre}
        subtitulo={textoPeriodo(periodo)}
        meta={[
          ['Periodo', programa.fecha_inicio && programa.fecha_fin ? `${fechaCorta(programa.fecha_inicio)} – ${fechaCorta(programa.fecha_fin)}` : null],
          ['Estado', ESTADOS_PROGRAMA[programa.estado]?.label],
          ['Datos al', fechaLarga(hoy)]
        ]}
      />

      <Seccion titulo="Resumen" unida>
        <Kpis items={[
          { valor: kpis.emprendimientosActivos, etiqueta: 'Emprendimientos activos', detalle: kpis.emprendimientosGraduados ? `${kpis.emprendimientosGraduados} graduados` : null },
          { valor: `${kpis.sesionesRealizadas}/${kpis.sesionesTotales}`, etiqueta: 'Sesiones realizadas' },
          { valor: porcentajeTexto(kpis.asistenciaMedia), etiqueta: 'Asistencia media' },
          { valor: kpis.npsPromedio !== null ? `${kpis.npsPromedio}/10` : '—', etiqueta: 'Satisfacción (NPS)', detalle: pulso.nps.total ? `${pulso.nps.total} respuestas` : 'Sin respuestas' },
          { valor: kpis.compromisosVencidos, etiqueta: 'Compromisos vencidos', tono: kpis.compromisosVencidos ? 'warning' : null, detalle: kpis.emprendimientosConVencidos ? `En ${kpis.emprendimientosConVencidos} emprendimientos` : null },
          { valor: kpis.registrosPendientes, etiqueta: 'Registros pendientes', tono: kpis.registrosPendientes ? 'warning' : null },
          { valor: porcentajeTexto(okrMedio), etiqueta: 'Avance medio de OKR', detalle: okrs.length ? `${okrs.length} con objetivos` : 'Sin objetivos' },
          { valor: porcentajeTexto(pulso.respuesta.tasa), etiqueta: 'Respuesta a la evaluación', detalle: pulso.respuesta.presentes ? `${pulso.respuesta.respuestas} de ${pulso.respuesta.presentes} asistencias` : null }
        ]} />
      </Seccion>

      <Seccion titulo="Puntos de atención" unida>
        {alertas.length ? alertas.map((a) => (
          <View key={a} style={{ flexDirection: 'row', marginBottom: 4 }} wrap={false}>
            <Text style={{ width: 10, color: C.ambar, fontWeight: 700 }}>•</Text>
            <Text style={{ flex: 1 }}>{a}</Text>
          </View>
        )) : <Vacio>Sin alertas: compromisos al día, reuniones recientes y asistencia tomada.</Vacio>}
      </Seccion>

      <Seccion titulo="Cartera" descripcion="Primero lo que pide atención: compromisos vencidos, días sin reunión y menor avance.">
        <Tabla
          columnas={[
            { titulo: 'Emprendimiento', ancho: 2.4 },
            { titulo: 'Asistencia', ancho: 1.6 },
            { titulo: 'Compromisos', ancho: 1.3, alinear: 'center' },
            { titulo: 'OKR', ancho: 0.8, alinear: 'right' },
            { titulo: 'Última reunión', ancho: 1.4 }
          ]}
          filas={cartera.map((f) => [
            <View key="n">
              <Text style={{ fontWeight: 600 }}>{f.nombre}</Text>
              <Text style={{ fontSize: 7, color: C.suave }}>{[f.sector, ESTADOS_EMPRENDIMIENTO[f.estado]?.label].filter(Boolean).join(' · ')}</Text>
            </View>,
            f.asistencia === null ? '—' : (
              <View key="a" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 5 }}><Barra valor={f.asistencia} color={colorAsistencia(f.asistencia)} /></View>
                <Text style={{ width: 26, textAlign: 'right' }}>{f.asistencia} %</Text>
              </View>
            ),
            <Text key="c" style={{ textAlign: 'center' }}>
              {f.abiertos} {f.abiertos === 1 ? 'abierto' : 'abiertos'}{f.vencidos ? <Text style={{ color: C.ambar, fontWeight: 600 }}>{` · ${f.vencidos} ${f.vencidos === 1 ? 'vencido' : 'vencidos'}`}</Text> : ''}
            </Text>,
            porcentajeTexto(f.okr),
            f.ultimaReunion ? `${fechaCorta(f.ultimaReunion)} (hace ${f.diasSinReunion} d)` : 'Sin reuniones'
          ])}
          vacio="El programa aún no tiene emprendimientos."
        />
      </Seccion>

      <Seccion titulo="Sesiones">
        <Tabla
          columnas={[
            { titulo: 'Fecha', ancho: 1 },
            { titulo: 'Sesión', ancho: 2.6 },
            { titulo: 'Registros', ancho: 1, alinear: 'center' },
            { titulo: 'Asistencia', ancho: 1, alinear: 'right' },
            { titulo: 'NPS', ancho: 0.8, alinear: 'right' }
          ]}
          filas={sesiones.map((s) => [
            fechaCorta(s.fecha),
            <View key="s">
              <Text style={{ fontWeight: 500 }}>{s.titulo}</Text>
              <Text style={{ fontSize: 7, color: C.suave }}>{tipoSesion(s.tipo).label}{s.momento !== 'pasada' ? ' · próxima' : ''}</Text>
            </View>,
            s.registros ? `${s.registros.registrados}/${s.registros.total}` : '—',
            s.momento === 'pasada' ? porcentajeTexto(s.asistencia) : '—',
            s.nps ? <Chip key="n" tono={tonoNps(s.nps.promedio)}>{`${s.nps.promedio}`}</Chip> : '—'
          ])}
          vacio="El programa aún no tiene sesiones."
        />
      </Seccion>

      <Seccion unida titulo="Satisfacción" descripcion={pulso.nps.total ? `${pulso.nps.total} respuestas, escala del 1 al 10.` : null}>
        {pulso.nps.total ? (
          <BarraApilada soloPorcentaje partes={[
            { etiqueta: 'Promotores (9-10)', valor: pulso.nps.promotores, color: C.verde },
            { etiqueta: 'Pasivos (7-8)', valor: pulso.nps.pasivos, color: C.ambarMarca },
            { etiqueta: 'Detractores (1-6)', valor: pulso.nps.detractores, color: C.rojo }
          ]} />
        ) : <Vacio>Aún no hay evaluaciones de este programa.</Vacio>}
      </Seccion>

      <Nota>
        Asistencia media: presentes entre las asistencias esperadas de las sesiones donde se tomó. Un compromiso
        está vencido si sigue abierto y el emprendimiento ya tuvo una sesión posterior. Datos del sistema al {formatFecha(hoy)}.
      </Nota>
    </Informe>
  );
};

export default InformePrograma;
