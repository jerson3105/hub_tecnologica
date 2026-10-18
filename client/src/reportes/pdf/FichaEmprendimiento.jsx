import { View, Text } from '@react-pdf/renderer';
import { Informe, Portada, Seccion, Kpis, Tabla, Barra, Chip, Parrafo, Nota, Vacio } from './componentes';
import { C } from './marca';
import { ESTADOS_EMPRENDIMIENTO, TIPOS_OBJETIVO, ESTADOS_ACTIVIDAD } from '../../constants/estados';
import { tipoSesion } from '../../constants/sesiones';
import { avanceDe, actividadesDe } from '../../utils/okr';
import { fechaCorta, fechaLarga, porcentajeTexto } from './formato';

const ABIERTOS = ['planeado', 'en_progreso'];
const TONO_ACTIVIDAD = { completado: 'success', en_progreso: 'warning', no_logrado: 'danger', planeado: 'neutral' };
const ULTIMAS_SESIONES = 8;
const conTexto = (v) => typeof v === 'string' && v.trim().length > 0;
const numero = (v) => (v === null || v === undefined || v === '' ? null : String(Number(v)));

// Compromisos abiertos con la sesión de origen. Vencido = sigue abierto y ya hubo una sesión
// posterior del emprendimiento (misma regla que el servidor).
const compromisosAbiertos = (seguimientos, hoy) => {
  const pasadas = seguimientos.map((s) => s.sesion?.fecha).filter((f) => f && f < hoy);
  return seguimientos.flatMap((seg) => (seg.compromisoItems || [])
    .filter((c) => ABIERTOS.includes(c.estado))
    .map((c) => ({ ...c, sesion: seg.sesion, vencido: !!seg.sesion?.fecha && pasadas.some((f) => f > seg.sesion.fecha) })))
    .sort((a, b) => Number(b.vencido) - Number(a.vencido) || String(a.sesion?.fecha).localeCompare(String(b.sesion?.fecha)));
};

// Ficha de avance de un emprendimiento para el equipo, un mentor o un jurado
const FichaEmprendimiento = ({ datos, logo }) => {
  const { emprendimiento: e, resumen, objetivos, onePager, hoy } = datos;
  const seguimientos = e.seguimientos || [];
  const registradas = seguimientos
    .filter((s) => s.sesion?.fecha && s.sesion.fecha <= hoy && conTexto(s.realizado))
    .sort((a, b) => String(b.sesion.fecha).localeCompare(String(a.sesion.fecha)));
  const abiertos = compromisosAbiertos(seguimientos, hoy);
  const equipo = [...(e.integrantes || [])].sort((a, b) => Number(b.es_lider) - Number(a.es_lider));
  const op = onePager || {};
  const camposOp = [
    ['Etapa del proyecto', op.estado_proyecto],
    ['Descripción', op.descripcion || e.descripcion],
    ['Problema que resuelve', op.problematica],
    ['Solución', op.solucion],
    ['Mercado objetivo', op.mercado_objetivo],
    ['Modelo de negocio', op.modelo_negocio],
    ['Ventaja competitiva', op.ventaja_competitiva],
    ['Situación actual', op.estado_actual],
    ['Hitos', op.hitos],
    ['Necesidades', op.necesidades]
  ].filter(([, v]) => conTexto(v));

  return (
    <Informe titulo="Ficha del emprendimiento" alcance={e.nombre}>
      <Portada
        logo={logo}
        eyebrow="Ficha del emprendimiento"
        titulo={e.nombre}
        subtitulo={[e.sector, e.programa?.nombre].filter(Boolean).join(' · ') || null}
        meta={[
          ['Estado', ESTADOS_EMPRENDIMIENTO[e.estado]?.label],
          ['Equipo', equipo.length ? `${equipo.length} ${equipo.length === 1 ? 'persona' : 'personas'}` : null],
          ['Última reunión', resumen?.ultimaReunion ? fechaCorta(resumen.ultimaReunion) : null],
          ['Datos al', fechaLarga(hoy)]
        ]}
      />

      <Seccion titulo="Avance" unida>
        <Kpis columnas={3} items={[
          { valor: porcentajeTexto(resumen?.asistencia), etiqueta: 'Asistencia a sesiones' },
          { valor: porcentajeTexto(resumen?.okr), etiqueta: 'Avance de los OKR', detalle: objetivos.length ? `${objetivos.length} objetivos` : 'Sin objetivos' },
          { valor: porcentajeTexto(resumen?.compromisosCumplidos), etiqueta: 'Compromisos cumplidos', detalle: resumen?.compromisosTotales ? `De ${resumen.compromisosTotales} acordados` : null },
          { valor: abiertos.length, etiqueta: 'Compromisos abiertos', detalle: resumen?.vencidos ? `${resumen.vencidos} vencidos` : 'Ninguno vencido', tono: resumen?.vencidos ? 'warning' : null },
          { valor: registradas.length, etiqueta: 'Sesiones con registro' },
          { valor: numero(e.empleos_generados) ?? '—', etiqueta: 'Empleos generados' }
        ]} />
      </Seccion>

      <Seccion titulo="El proyecto" descripcion={camposOp.length ? 'Según el One Pager del equipo.' : null}>
        {camposOp.length ? camposOp.map(([titulo, texto]) => <Parrafo key={titulo} titulo={titulo}>{texto}</Parrafo>)
          : <Vacio>El equipo aún no completa su One Pager.</Vacio>}
      </Seccion>

      <Seccion titulo="Equipo" unida>
        <Tabla
          columnas={[{ titulo: 'Integrante', ancho: 2 }, { titulo: 'Rol en el equipo', ancho: 2 }, { titulo: '', ancho: 0.8, alinear: 'right' }]}
          filas={equipo.map((i) => [
            `${i.usuario?.nombre || ''} ${i.usuario?.apellido || ''}`.trim(),
            i.rol_emprendimiento || '—',
            i.es_lider ? <Chip key="l" tono="programa">Líder</Chip> : ''
          ])}
          vacio="Aún no hay integrantes."
        />
      </Seccion>

      <Seccion titulo="Objetivos (OKR)">
        {objetivos.length ? objetivos.map((o) => {
          const avance = avanceDe(actividadesDe(o));
          return (
            <View key={o.id} style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 5 }} minPresenceAhead={40}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={{ fontWeight: 600, fontSize: 9.5 }}>{o.titulo}</Text>
                  <Text style={{ fontSize: 7.5, color: C.suave }}>
                    {[TIPOS_OBJETIVO[o.tipo]?.label, o.fecha_limite ? `Hasta el ${fechaCorta(o.fecha_limite)}` : null].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                <View style={{ width: 110, flexDirection: 'row', alignItems: 'center' }}>
                  <View style={{ flex: 1, marginRight: 5 }}><Barra valor={avance ?? 0} /></View>
                  <Text style={{ width: 28, textAlign: 'right', fontWeight: 600 }}>{porcentajeTexto(avance)}</Text>
                </View>
              </View>
              <Tabla
                columnas={[{ titulo: 'Resultado clave · actividad', ancho: 3.4 }, { titulo: 'Real / meta', ancho: 1, alinear: 'right' }, { titulo: 'Estado', ancho: 1.1 }]}
                filas={(o.resultadosClave || []).flatMap((rc) => (rc.actividades?.length ? rc.actividades : [null]).map((a) => [
                  <View key="d">
                    <Text style={{ fontSize: 7, color: C.suave }}>{rc.descripcion}</Text>
                    <Text>{a?.descripcion || 'Sin actividades'}</Text>
                  </View>,
                  a && Number(a.meta_numerica) > 0 ? `${numero(a.meta_real) ?? 0} / ${numero(a.meta_numerica)}` : '—',
                  a ? <Chip key="e" tono={TONO_ACTIVIDAD[a.estado]}>{ESTADOS_ACTIVIDAD[a.estado]?.label || a.estado}</Chip> : ''
                ]))}
                vacio="Sin resultados clave."
              />
            </View>
          );
        }) : <Vacio>El emprendimiento aún no define objetivos.</Vacio>}
      </Seccion>

      <Seccion titulo="Compromisos abiertos">
        <Tabla
          columnas={[{ titulo: 'Compromiso', ancho: 3.2 }, { titulo: 'Acordado en', ancho: 1.8 }, { titulo: 'Estado', ancho: 1 }]}
          filas={abiertos.map((c) => [
            c.descripcion,
            c.sesion ? `${c.sesion.titulo} · ${fechaCorta(c.sesion.fecha)}` : '—',
            c.vencido ? <Chip key="v" tono="warning">Vencido</Chip> : <Chip key="e" tono={c.estado === 'en_progreso' ? 'info' : 'neutral'}>{c.estado === 'en_progreso' ? 'En curso' : 'Planeado'}</Chip>
          ])}
          vacio="No hay compromisos abiertos."
        />
      </Seccion>

      <Seccion titulo="Línea de seguimiento" descripcion={registradas.length > ULTIMAS_SESIONES ? `Las ${ULTIMAS_SESIONES} sesiones más recientes de ${registradas.length}.` : null}>
        {registradas.length ? registradas.slice(0, ULTIMAS_SESIONES).map((s) => (
          <View key={s.id} style={{ flexDirection: 'row', marginBottom: 9 }} wrap={false}>
            <View style={{ width: 66 }}>
              <Text style={{ fontSize: 8, fontWeight: 600 }}>{fechaCorta(s.sesion.fecha)}</Text>
              <Text style={{ fontSize: 7, color: C.suave }}>{tipoSesion(s.sesion.tipo).label}</Text>
            </View>
            <View style={{ flex: 1, paddingLeft: 8, borderLeftWidth: 1.2, borderLeftColor: C.cian }}>
              <Text style={{ fontWeight: 600 }}>{s.sesion.titulo}</Text>
              <Text style={{ marginTop: 2 }}>{s.realizado}</Text>
              {(s.compromisoItems || []).length > 0 && (
                <Text style={{ marginTop: 3, fontSize: 8, color: C.suave }}>
                  Compromisos: {s.compromisoItems.map((c) => c.descripcion).join(' · ')}
                </Text>
              )}
            </View>
          </View>
        )) : <Vacio>Aún no hay sesiones con lo trabajado registrado.</Vacio>}
      </Seccion>

      <Nota>
        Asistencia: sesiones del emprendimiento con asistencia tomada en las que estuvo al menos una persona del equipo.
        Avance de OKR: cada actividad cuenta hasta su meta. Un compromiso está vencido si sigue abierto y ya hubo una sesión posterior.
      </Nota>
    </Informe>
  );
};

export default FichaEmprendimiento;
