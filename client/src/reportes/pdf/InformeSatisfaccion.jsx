import { View, Text } from '@react-pdf/renderer';
import { Informe, Portada, Seccion, Kpis, Tabla, BarraApilada, ListaBarras, Chip, Nota, Vacio } from './componentes';
import { C } from './marca';
import { tipoSesion } from '../../constants/sesiones';
import { fechaCorta, fechaLarga, porcentajeTexto, colorAsistencia, tonoAsistencia, tonoNps, TIPOS_EVALUACION } from './formato';

const promedioTexto = (n) => (n === null || n === undefined ? '—' : `${n}/10`);

// Satisfacción (NPS) y asistencia de un programa o de todos. `datos` = GET /api/indicadores/satisfaccion
const InformeSatisfaccion = ({ datos, logo }) => {
  const { programa, nps, asistencia, hoy } = datos;
  const alcance = programa ? programa.nombre : 'Todos los programas';
  const enRiesgo = asistencia.porPersona.filter((p) => p.porcentaje < 60).length;

  return (
    <Informe titulo="Satisfacción y asistencia" alcance={alcance}>
      <Portada
        logo={logo}
        eyebrow="Informe de satisfacción y asistencia"
        titulo={alcance}
        subtitulo="Cómo valoran las sesiones los emprendedores y cuánto asisten"
        meta={[
          ['Evaluaciones', String(nps.global.total)],
          ['Sesiones con asistencia', String(asistencia.sesionesTomadas)],
          ['Datos al', fechaLarga(hoy)]
        ]}
      />

      <Seccion titulo="En cifras" unida>
        <Kpis columnas={3} items={[
          { valor: promedioTexto(nps.global.promedio), etiqueta: 'Satisfacción media', detalle: `${nps.global.total} respuestas` },
          { valor: porcentajeTexto(nps.global.promotores), etiqueta: 'Promotores (9-10)', tono: 'success' },
          { valor: porcentajeTexto(nps.global.detractores), etiqueta: 'Detractores (1-6)', tono: nps.global.detractores ? 'danger' : null },
          { valor: porcentajeTexto(asistencia.media), etiqueta: 'Asistencia media' },
          { valor: enRiesgo, etiqueta: 'Personas bajo el 60 %', tono: enRiesgo ? 'warning' : null },
          { valor: asistencia.sesionesSinTomar, etiqueta: 'Sesiones sin asistencia tomada', tono: asistencia.sesionesSinTomar ? 'warning' : null }
        ]} />
      </Seccion>

      <Seccion unida titulo="Satisfacción" descripcion="Escala del 1 al 10. Promotores 9-10, pasivos 7-8, detractores 1-6.">
        {nps.global.total ? (
          <>
            <BarraApilada soloPorcentaje partes={[
              { etiqueta: 'Promotores', valor: nps.global.promotores, color: C.verde },
              { etiqueta: 'Pasivos', valor: nps.global.pasivos, color: C.ambarMarca },
              { etiqueta: 'Detractores', valor: nps.global.detractores, color: C.rojo }
            ]} />
            <View style={{ marginTop: 12 }}>
              <Tabla
                columnas={[
                  { titulo: 'Evaluación', ancho: 2.2 },
                  { titulo: 'Respuestas', ancho: 1, alinear: 'right' },
                  { titulo: 'Media', ancho: 0.9, alinear: 'right' },
                  { titulo: 'Promotores', ancho: 1, alinear: 'right' },
                  { titulo: 'Detractores', ancho: 1, alinear: 'right' }
                ]}
                filas={nps.porTipo.map((t) => [
                  TIPOS_EVALUACION[t.tipo] || t.tipo, t.total, promedioTexto(t.promedio), porcentajeTexto(t.promotores), porcentajeTexto(t.detractores)
                ])}
              />
            </View>
          </>
        ) : <Vacio>Aún no hay evaluaciones.</Vacio>}
      </Seccion>

      {nps.porSesion.length > 0 && (
        <Seccion titulo="Por sesión">
          <Tabla
            columnas={[
              { titulo: 'Fecha', ancho: 1 },
              { titulo: 'Sesión', ancho: 2.8 },
              { titulo: 'Respuestas', ancho: 1, alinear: 'right' },
              { titulo: 'Media', ancho: 0.9, alinear: 'right' }
            ]}
            filas={nps.porSesion.map((s) => [
              fechaCorta(s.fecha),
              <View key="s">
                <Text style={{ fontWeight: 500 }}>{s.titulo}</Text>
                <Text style={{ fontSize: 7, color: C.suave }}>{tipoSesion(s.tipo).label}</Text>
              </View>,
              s.total,
              <Chip key="m" tono={tonoNps(s.promedio)}>{promedioTexto(s.promedio)}</Chip>
            ])}
          />
        </Seccion>
      )}

      <Seccion titulo="Lo que dicen" descripcion="Comentarios de las evaluaciones, sin el nombre de quien respondió.">
        {nps.comentarios.length ? nps.comentarios.map((c, i) => (
          <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }} wrap={false}>
            <View style={{ width: 34 }}><Chip tono={tonoNps(c.puntuacion)}>{String(c.puntuacion)}</Chip></View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 7, color: C.suave }}>
                {[c.sesion || TIPOS_EVALUACION[c.tipo], c.fecha ? fechaCorta(c.fecha) : null].filter(Boolean).join(' · ')}
              </Text>
              {c.comentario ? <Text>«{c.comentario}»</Text> : null}
              {c.areasMejora ? <Text style={{ fontSize: 8, color: C.suave, marginTop: 1 }}>A mejorar: {c.areasMejora}</Text> : null}
            </View>
          </View>
        )) : <Vacio>Las evaluaciones aún no tienen comentarios.</Vacio>}
      </Seccion>

      <Seccion unida titulo="Asistencia por emprendimiento" descripcion="Presentes entre las asistencias esperadas de su equipo en las sesiones con asistencia tomada.">
        <ListaBarras
          anchoEtiqueta={160}
          items={asistencia.porEmprendimiento.filter((x) => x.porcentaje !== null).map((x) => ({
            etiqueta: x.nombre, valor: x.porcentaje, texto: `${x.porcentaje} %`, color: colorAsistencia(x.porcentaje)
          }))}
          vacio="Aún no se ha tomado asistencia."
        />
      </Seccion>

      <Seccion titulo="Asistencia por persona" descripcion="De menor a mayor: las primeras filas son a quienes conviene llamar.">
        <Tabla
          columnas={[
            { titulo: 'Persona', ancho: 2 },
            { titulo: 'Emprendimiento', ancho: 2 },
            { titulo: 'Asistió', ancho: 1, alinear: 'right' },
            { titulo: '%', ancho: 0.9, alinear: 'right' }
          ]}
          filas={asistencia.porPersona.map((x) => [
            x.nombre,
            x.emprendimiento,
            `${x.presentes} de ${x.sesiones}`,
            <View key="p" style={{ alignItems: 'flex-end' }}><Chip tono={tonoAsistencia(x.porcentaje)}>{`${x.porcentaje} %`}</Chip></View>
          ])}
          vacio="Aún no se ha tomado asistencia."
        />
      </Seccion>

      <Nota>
        Solo cuentan las sesiones ya realizadas en las que se tomó asistencia; una persona sin marca en una de ellas cuenta
        como ausente. Satisfacción: respuestas a las evaluaciones de sesiones y del programa.
      </Nota>
    </Informe>
  );
};

export default InformeSatisfaccion;
