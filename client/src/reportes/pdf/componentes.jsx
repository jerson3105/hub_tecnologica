import { Children, cloneElement } from 'react';
import { Document, Page, View, Text, Image, StyleSheet, Svg, Path, Circle } from '@react-pdf/renderer';
import { C } from './marca';

// Piezas comunes de los informes PDF: página con cabecera y pie de marca, portada, secciones,
// indicadores, tablas y barras. A4 vertical, márgenes de 40 pt.

const TONOS = {
  info: [C.cianSuave, C.cianTexto],
  success: [C.verdeSuave, C.verde],
  warning: [C.ambarSuave, C.ambar],
  danger: [C.rojoSuave, C.rojo],
  programa: [C.moradoSuave, C.morado],
  azul: [C.azulSuave, C.azul],
  neutral: [C.muted, C.tinta]
};

const s = StyleSheet.create({
  pagina: { paddingTop: 58, paddingBottom: 54, paddingHorizontal: 40, fontFamily: 'Geist', fontSize: 9, color: C.tinta, lineHeight: 1.45, backgroundColor: C.blanco },
  encabezado: { position: 'absolute', top: 22, left: 40, right: 40 },
  encabezadoCaja: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 7, borderBottomWidth: 0.6, borderBottomColor: C.borde },
  encabezadoTexto: { fontSize: 7.5, color: C.suave },
  // Con `top` y no `bottom`: con `bottom` react-pdf no pinta el pie cuando el contenido ocupa varias páginas.
  // A4 mide 841,89 pt de alto: el pie queda a ~22 pt del borde inferior.
  pie: { position: 'absolute', top: 800, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between', paddingTop: 7, borderTopWidth: 0.6, borderTopColor: C.borde, fontSize: 7, color: C.tenue },
  eyebrow: { fontSize: 7.5, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: C.cianTexto },
  titulo: { fontFamily: 'Bricolage', fontWeight: 700, fontSize: 24, lineHeight: 1.15, marginTop: 4 },
  subtitulo: { fontSize: 10.5, color: C.suave, marginTop: 4 },
  meta: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 12 },
  metaItem: { marginRight: 22, marginBottom: 4 },
  metaEtiqueta: { fontSize: 7, color: C.tenue, textTransform: 'uppercase', letterSpacing: 0.8 },
  metaValor: { fontSize: 9, fontWeight: 500 },
  seccion: { marginTop: 20 },
  seccionTitulo: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  seccionBarra: { width: 3, height: 13, backgroundColor: C.cian, borderRadius: 1.5, marginRight: 7 },
  seccionTexto: { fontFamily: 'Bricolage', fontWeight: 600, fontSize: 13 },
  seccionDescripcion: { fontSize: 8.5, color: C.suave, marginTop: -4, marginBottom: 8 },
  kpis: { flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -4 },
  kpi: { margin: 4, padding: 10, borderRadius: 6, backgroundColor: C.fondo, borderWidth: 0.6, borderColor: C.borde },
  kpiValor: { fontFamily: 'Bricolage', fontWeight: 700, fontSize: 18, lineHeight: 1.1 },
  kpiEtiqueta: { fontSize: 7.5, color: C.suave, marginTop: 3 },
  kpiDetalle: { fontSize: 7, color: C.tenue, marginTop: 1 },
  filaCabecera: { flexDirection: 'row', backgroundColor: C.tinta, borderTopLeftRadius: 3.5, borderTopRightRadius: 3.5 },
  celdaCabecera: { paddingVertical: 5, paddingHorizontal: 6, fontSize: 7, fontWeight: 600, color: C.blanco, letterSpacing: 0.3 },
  // Cada fila lleva sus bordes laterales: la tabla se ve continua aunque se parta entre páginas
  fila: { flexDirection: 'row', borderTopWidth: 0.6, borderLeftWidth: 0.6, borderRightWidth: 0.6, borderColor: C.borde },
  filaUltima: { borderBottomWidth: 0.6, borderBottomLeftRadius: 4, borderBottomRightRadius: 4 },
  celda: { paddingVertical: 5, paddingHorizontal: 6, fontSize: 8 },
  chip: { paddingVertical: 1.5, paddingHorizontal: 5, borderRadius: 3, fontSize: 7, fontWeight: 600, alignSelf: 'flex-start' },
  barraFondo: { height: 6, borderRadius: 3, backgroundColor: C.muted, flexDirection: 'row', overflow: 'hidden' },
  leyenda: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 5 },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginTop: 2 },
  punto: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  nota: { marginTop: 14, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: C.cian, fontSize: 7.5, color: C.suave },
  vacio: { padding: 10, borderRadius: 4, backgroundColor: C.fondo, fontSize: 8.5, color: C.suave }
});

const tono = (nombre) => TONOS[nombre] || TONOS.neutral;

// Logo de la marca o, si no cargó, su nombre en texto con «ICA» en cian
const Marca = ({ logo, alto }) => (logo
  ? <Image src={logo.src} style={{ height: alto, width: alto * logo.proporcion }} />
  : <Text style={{ fontFamily: 'Bricolage', fontWeight: 700, fontSize: alto * 0.8 }}>Hub Tecnológ<Text style={{ color: C.cian }}>ICA</Text></Text>);

// Documento de una página continua (se pagina sola) con cabecera desde la página 2 y pie en todas
export const Informe = ({ titulo, alcance, children }) => (
  <Document title={`${titulo}${alcance ? ` · ${alcance}` : ''}`} author="HUB TecnológICA" creator="HUB TecnológICA" producer="HUB TecnológICA" language="es">
    <Page size="A4" style={s.pagina}>
      <View
        fixed
        style={s.encabezado}
        render={({ pageNumber }) => (pageNumber > 1 ? (
          <View style={s.encabezadoCaja}>
            {/* Texto y no imagen: las imágenes dentro de render no se dibujan */}
            <Marca logo={null} alto={11} />
            <Text style={s.encabezadoTexto}>{titulo}{alcance ? ` · ${alcance}` : ''}</Text>
          </View>
        ) : null)}
      />
      {children}
      <View fixed style={s.pie}>
        <Text>HUB TecnológICA · {titulo}</Text>
        <Text render={({ pageNumber, totalPages }) => `Página ${pageNumber} de ${totalPages}`} />
      </View>
    </Page>
  </Document>
);

// «La línea» de la marca: un trazo fino que termina en la espiral del logo
const Trazo = () => (
  <Svg width="515" height="16" viewBox="0 0 515 16" style={{ marginTop: 14 }}>
    <Path d="M0 8 H486" stroke={C.cian} strokeWidth={1.2} />
    <Circle cx="496" cy="8" r="6" stroke={C.cian} strokeWidth={1.2} fill="none" />
    <Circle cx="496" cy="8" r="2.5" stroke={C.morado} strokeWidth={1.2} fill="none" />
  </Svg>
);

export const Portada = ({ logo, eyebrow, titulo, subtitulo, meta = [] }) => (
  <View>
    <View style={{ marginBottom: 18 }}><Marca logo={logo} alto={30} /></View>
    <Text style={s.eyebrow}>{eyebrow}</Text>
    <Text style={s.titulo}>{titulo}</Text>
    {subtitulo ? <Text style={s.subtitulo}>{subtitulo}</Text> : null}
    {meta.length > 0 && (
      <View style={s.meta}>
        {meta.filter(([, valor]) => valor).map(([etiqueta, valor]) => (
          <View key={etiqueta} style={s.metaItem}>
            <Text style={s.metaEtiqueta}>{etiqueta}</Text>
            <Text style={s.metaValor}>{valor}</Text>
          </View>
        ))}
      </View>
    )}
    <Trazo />
  </View>
);

// Sección con título. `unida`: las secciones cortas (cifras, gráficos) pasan enteras a la página
// siguiente en vez de partirse. Las largas se parten, pero el título viaja siempre con su primer
// elemento (en una tabla, con la cabecera y la primera fila): nunca queda solo al pie de una página.
// (`minPresenceAhead` de react-pdf no lo garantizaba.)
export const Seccion = ({ titulo, descripcion, children, nuevaPagina = false, unida = false }) => {
  const cabecera = (
    <>
      <View style={s.seccionTitulo}>
        <View style={s.seccionBarra} />
        <Text style={s.seccionTexto}>{titulo}</Text>
      </View>
      {descripcion ? <Text style={s.seccionDescripcion}>{descripcion}</Text> : null}
    </>
  );
  if (unida) return <View style={s.seccion} break={nuevaPagina} wrap={false}>{cabecera}{children}</View>;
  const [primero, ...resto] = Children.toArray(children);
  return (
    <View style={s.seccion} break={nuevaPagina}>
      {primero?.type === Tabla ? cloneElement(primero, { cabecera }) : <View wrap={false}>{cabecera}{primero}</View>}
      {resto}
    </View>
  );
};

// Indicadores en rejilla. `items` = [{ valor, etiqueta, detalle, tono }]. Ancho útil 515 pt + 8 de
// los márgenes negativos de la rejilla.
const ANCHO_UTIL_KPIS = 523;
export const Kpis = ({ items, columnas = 4 }) => (
  <View style={s.kpis}>
    {items.map((k) => (
      <View key={k.etiqueta} style={[s.kpi, { width: ANCHO_UTIL_KPIS / columnas - 8 }]} wrap={false}>
        <Text style={[s.kpiValor, k.tono ? { color: tono(k.tono)[1] } : null]}>{k.valor ?? '—'}</Text>
        <Text style={s.kpiEtiqueta}>{k.etiqueta}</Text>
        {k.detalle ? <Text style={s.kpiDetalle}>{k.detalle}</Text> : null}
      </View>
    ))}
  </View>
);

export const Chip = ({ children, tono: nombre = 'neutral' }) => {
  const [fondo, texto] = tono(nombre);
  return <Text style={[s.chip, { backgroundColor: fondo, color: texto }]}>{children}</Text>;
};

// Tabla. `columnas` = [{ titulo, ancho (flex), alinear }]; cada fila es una lista de celdas:
// texto, número o elemento (p. ej. un Chip o una Barra). Se parte entre páginas por filas; la
// cabecera, la primera fila y `cabecera` (el título de la sección) van siempre juntos.
export const Tabla = ({ columnas, filas, vacio = 'Sin datos.', cabecera = null }) => {
  if (!filas.length) return <View wrap={false}>{cabecera}<Text style={s.vacio}>{vacio}</Text></View>;
  const celdaDe = (col) => ({ flex: col.ancho || 1, textAlign: col.alinear || 'left' });
  const ultima = filas.length - 1;
  const fila = (celdas, i) => (
    <View
      key={i}
      wrap={false}
      style={[s.fila, i % 2 === 1 ? { backgroundColor: C.fondo } : null, i === ultima ? s.filaUltima : null]}
    >
      {celdas.map((celda, j) => (
        <View key={j} style={[s.celda, celdaDe(columnas[j])]}>
          {typeof celda === 'string' || typeof celda === 'number' || celda === null || celda === undefined
            ? <Text style={{ textAlign: columnas[j].alinear || 'left' }}>{celda ?? '—'}</Text>
            : celda}
        </View>
      ))}
    </View>
  );
  return (
    <View>
      <View wrap={false}>
        {cabecera}
        <View style={s.filaCabecera}>
          {columnas.map((col) => <Text key={col.titulo} style={[s.celdaCabecera, celdaDe(col)]}>{col.titulo.toUpperCase()}</Text>)}
        </View>
        {fila(filas[0], 0)}
      </View>
      {filas.slice(1).map((celdas, i) => fila(celdas, i + 1))}
    </View>
  );
};

// Barra de porcentaje (0-100)
export const Barra = ({ valor, color = C.cianFuerte, ancho }) => (
  <View style={[s.barraFondo, ancho ? { width: ancho } : null]}>
    <View style={{ width: `${Math.max(0, Math.min(100, valor || 0))}%`, backgroundColor: color }} />
  </View>
);

// Barra apilada con leyenda. `partes` = [{ etiqueta, valor, color }]: valores absolutos o, con
// `soloPorcentaje`, porcentajes que ya suman 100.
export const BarraApilada = ({ partes, alto = 10, soloPorcentaje = false }) => {
  const total = partes.reduce((t, p) => t + (p.valor || 0), 0);
  return (
    <View>
      <View style={[s.barraFondo, { height: alto, borderRadius: alto / 2 }]}>
        {total > 0 && partes.filter((p) => p.valor > 0).map((p) => (
          <View key={p.etiqueta} style={{ width: `${(p.valor / total) * 100}%`, backgroundColor: p.color }} />
        ))}
      </View>
      <View style={s.leyenda}>
        {partes.map((p) => (
          <View key={p.etiqueta} style={s.leyendaItem}>
            <View style={[s.punto, { backgroundColor: p.color }]} />
            <Text style={{ fontSize: 7.5, color: C.suave }}>
              {p.etiqueta} <Text style={{ color: C.tinta, fontWeight: 600 }}>{soloPorcentaje ? `${p.valor} %` : p.valor}</Text>
              {!soloPorcentaje && total > 0 ? ` (${Math.round((p.valor / total) * 100)} %)` : ''}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

// Gráfico de barras horizontales. `items` = [{ etiqueta, valor, texto }]; el máximo marca el 100 %
export const ListaBarras = ({ items, color = C.cianFuerte, vacio = 'Sin datos.', anchoEtiqueta = 150 }) => {
  if (!items.length) return <Text style={s.vacio}>{vacio}</Text>;
  const maximo = Math.max(...items.map((i) => i.valor), 1);
  return (
    <View>
      {items.map((item) => (
        <View key={item.etiqueta} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }} wrap={false}>
          <Text style={{ width: anchoEtiqueta, fontSize: 8, paddingRight: 6 }}>{item.etiqueta}</Text>
          <View style={{ flex: 1 }}><Barra valor={(item.valor / maximo) * 100} color={item.color || color} /></View>
          <Text style={{ width: 54, fontSize: 8, fontWeight: 600, textAlign: 'right' }}>{item.texto ?? item.valor}</Text>
        </View>
      ))}
    </View>
  );
};

export const Parrafo = ({ titulo, children }) => (children ? (
  <View style={{ marginBottom: 8 }} wrap>
    {titulo ? <Text style={{ fontSize: 7.5, fontWeight: 600, color: C.suave, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 2 }}>{titulo}</Text> : null}
    <Text style={{ fontSize: 9 }}>{children}</Text>
  </View>
) : null);

export const Nota = ({ children }) => <Text style={s.nota}>{children}</Text>;
export const Vacio = ({ children }) => <Text style={s.vacio}>{children}</Text>;

// Dos columnas que pasan a apilarse si no caben (react-pdf no tiene media queries: ancho fijo)
export const Columnas = ({ children }) => (
  <View style={{ flexDirection: 'row', marginHorizontal: -8 }}>
    {[].concat(children).filter(Boolean).map((hijo, i) => <View key={i} style={{ flex: 1, paddingHorizontal: 8 }}>{hijo}</View>)}
  </View>
);

