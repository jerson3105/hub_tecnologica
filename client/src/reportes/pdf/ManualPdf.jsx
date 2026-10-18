import { View, Text, Image, StyleSheet } from '@react-pdf/renderer';
import { C } from './marca';
import { Informe, Portada, Tabla } from './componentes';
import { MANUAL } from '../manual/contenido';

// Manual de uso del equipo técnico (A4, misma marca que los informes). El contenido vive en
// reportes/manual/contenido.js; aquí solo se maqueta. Las capturas se sirven desde
// public/manual/ y se cargan por URL.

const s = StyleSheet.create({
  indiceFila: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4.5, borderBottomWidth: 0.6, borderBottomColor: C.borde },
  indiceNumero: { width: 26, fontFamily: 'Bricolage', fontWeight: 700, fontSize: 11, color: C.cianFuerte },
  indiceTitulo: { fontSize: 10, fontWeight: 600 },
  indiceResumen: { fontSize: 8, color: C.suave, marginTop: 1 },
  capituloEyebrow: { fontSize: 7.5, fontWeight: 600, letterSpacing: 1.2, textTransform: 'uppercase', color: C.cianTexto },
  capituloTitulo: { fontFamily: 'Bricolage', fontWeight: 700, fontSize: 21, lineHeight: 1.15, marginTop: 3 },
  capituloIntro: { fontSize: 10, color: C.suave, marginTop: 6, lineHeight: 1.5 },
  capituloLinea: { height: 2, width: 40, backgroundColor: C.cian, borderRadius: 1, marginTop: 10, marginBottom: 6 },
  sub: { flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 6 },
  subBarra: { width: 3, height: 12, backgroundColor: C.cian, borderRadius: 1.5, marginRight: 7 },
  subTexto: { fontFamily: 'Bricolage', fontWeight: 600, fontSize: 12.5 },
  parrafo: { fontSize: 9.5, lineHeight: 1.55, marginBottom: 6 },
  paso: { flexDirection: 'row', marginBottom: 5 },
  pasoNumero: { width: 16, height: 16, borderRadius: 8, backgroundColor: C.tinta, alignItems: 'center', justifyContent: 'center', marginRight: 8, marginTop: 0.5 },
  pasoNumeroTexto: { color: C.blanco, fontSize: 8, fontWeight: 700, lineHeight: 1 },
  pasoTexto: { flex: 1, fontSize: 9.5, lineHeight: 1.5, paddingTop: 1 },
  vineta: { flexDirection: 'row', marginBottom: 3.5 },
  vinetaPunto: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.cianFuerte, marginTop: 5, marginRight: 8 },
  vinetaTexto: { flex: 1, fontSize: 9.5, lineHeight: 1.5 },
  figura: { marginTop: 6, marginBottom: 10 },
  figuraMarco: { backgroundColor: C.fondo },
  figuraPie: { fontSize: 7.5, color: C.suave, marginTop: 4 },
  caja: { flexDirection: 'row', padding: 9, borderRadius: 5, marginTop: 4, marginBottom: 9 },
  cajaEtiqueta: { fontSize: 7, fontWeight: 700, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  cajaTexto: { fontSize: 9, lineHeight: 1.5 },
  ui: { fontWeight: 600, color: C.tinta },
  creditos: { marginTop: 26, fontSize: 8, color: C.suave, lineHeight: 1.5 }
});

const CAJAS = {
  consejo: { fondo: C.cianSuave, borde: C.cian, color: C.cianTexto, etiqueta: 'Consejo' },
  aviso: { fondo: C.ambarSuave, borde: C.ambarMarca, color: C.ambar, etiqueta: 'Atención' },
  emprendedor: { fondo: C.moradoSuave, borde: C.morado, color: C.morado, etiqueta: 'Del lado del emprendedor' }
};

// Texto con los nombres de la interfaz entre comillas latinas («Nuevo programa») en seminegrita
const Rico = ({ children, style }) => {
  const partes = String(children).split(/(«[^»]+»)/g).filter(Boolean);
  return (
    <Text style={style}>
      {partes.map((p, i) => (p.startsWith('«') ? <Text key={i} style={s.ui}>{p}</Text> : p))}
    </Text>
  );
};

// `disponibles` (opcional): capturas que existen; las que falten salen como un recuadro pendiente
const Figura = ({ bloque, numero, disponibles }) => {
  const ancho = bloque.ancho === 'medio' ? 300 : bloque.ancho === 'tercio' ? 210 : 515;
  const falta = disponibles && !disponibles.includes(bloque.img);
  return (
    <View style={[s.figura, bloque.ancho ? { alignItems: 'center' } : null]} wrap={false}>
      <View style={[s.figuraMarco, { width: ancho }]}>
        {falta
          ? <View style={{ height: ancho * 0.55, justifyContent: 'center', alignItems: 'center' }}><Text style={{ fontSize: 8, color: C.tenue }}>Captura pendiente: {bloque.img}</Text></View>
          : <Image src={`${window.location.origin}/manual/${bloque.img}`} style={{ width: ancho }} />}
      </View>
      <Text style={[s.figuraPie, { width: ancho }]}>Figura {numero}. {bloque.pie}</Text>
    </View>
  );
};

const Caja = ({ tipo, texto }) => {
  const c = CAJAS[tipo];
  return (
    <View style={[s.caja, { backgroundColor: c.fondo, borderLeftWidth: 2.5, borderLeftColor: c.borde }]} wrap={false}>
      <View style={{ flex: 1 }}>
        <Text style={[s.cajaEtiqueta, { color: c.color }]}>{c.etiqueta}</Text>
        <Rico style={s.cajaTexto}>{texto}</Rico>
      </View>
    </View>
  );
};

const Subtitulo = ({ texto }) => (
  <View style={s.sub}>
    <View style={s.subBarra} />
    <Text style={s.subTexto}>{texto}</Text>
  </View>
);

// Lista numerada o con viñetas. `cabecera` (un subtítulo) viaja con el primer elemento
const Lista = ({ items, numerada, cabecera }) => (
  <View style={{ marginBottom: 6 }}>
    {items.map((item, i) => {
      const fila = numerada ? (
        <View key={i} style={s.paso} wrap={false}>
          <View style={s.pasoNumero}><Text style={s.pasoNumeroTexto}>{i + 1}</Text></View>
          <Rico style={s.pasoTexto}>{item}</Rico>
        </View>
      ) : (
        <View key={i} style={s.vineta} wrap={false}>
          <View style={s.vinetaPunto} />
          <Rico style={s.vinetaTexto}>{item}</Rico>
        </View>
      );
      return i === 0 && cabecera ? <View key={i} wrap={false}>{cabecera}{fila}</View> : fila;
    })}
  </View>
);

// Un bloque del contenido: { p } | { pasos: [] } | { lista: [] } | { img, pie, ancho } | { consejo } |
// { aviso } | { emprendedor } | { tabla: { columnas, filas } } ({ sub } va como cabecera del siguiente).
// `cabecera`: el subtítulo que lo precede, que nunca queda solo al pie
// de una página: va con la primera fila de una tabla o el primer paso de una lista, o con el
// bloque entero si es corto (párrafo, figura, caja).
const Bloque = ({ bloque, numeroFigura, disponibles, cabecera = null }) => {
  if (bloque.pasos) return <Lista items={bloque.pasos} numerada cabecera={cabecera} />;
  if (bloque.lista) return <Lista items={bloque.lista} cabecera={cabecera} />;
  if (bloque.tabla) return <View style={{ marginTop: 4, marginBottom: 10 }}><Tabla columnas={bloque.tabla.columnas} filas={bloque.tabla.filas} cabecera={cabecera} /></View>;
  let contenido = null;
  if (bloque.p) contenido = <Rico style={s.parrafo}>{bloque.p}</Rico>;
  else if (bloque.img) contenido = <Figura bloque={bloque} numero={numeroFigura} disponibles={disponibles} />;
  else {
    const tipo = Object.keys(CAJAS).find((t) => bloque[t]);
    if (tipo) contenido = <Caja tipo={tipo} texto={bloque[tipo]} />;
  }
  return cabecera ? <View wrap={false}>{cabecera}{contenido}</View> : contenido;
};

// Cada capítulo empieza en página nueva. Sus bloques van al mismo nivel que la cabecera (no dentro
// de un contenedor con `break`): con varios contenedores así, react-pdf calculaba mal la altura de
// los bordes al partirlos entre páginas.
const Capitulo = ({ capitulo, numero, disponibles }) => (
  <>
    <View break />
    <View wrap={false}>
      <Text style={s.capituloEyebrow}>{capitulo.anexo ? 'Anexo' : `Capítulo ${numero}`}</Text>
      <Text style={s.capituloTitulo}>{capitulo.titulo}</Text>
      {capitulo.intro ? <Rico style={s.capituloIntro}>{capitulo.intro}</Rico> : null}
      <View style={s.capituloLinea} />
    </View>
    {capitulo.bloques.map((bloque, i) => {
      if (bloque.sub) return null; // se dibuja como cabecera del bloque siguiente
      const previo = capitulo.bloques[i - 1];
      return <Bloque key={i} bloque={bloque} numeroFigura={bloque.figura} disponibles={disponibles} cabecera={previo?.sub ? <Subtitulo texto={previo.sub} /> : null} />;
    })}
  </>
);


// Capítulos numerados (el anexo va con «A») y figuras numeradas dentro de cada capítulo («4.2»)
const numerar = (capitulos) => {
  let n = 0;
  return capitulos.map((c) => {
    const numero = c.anexo ? null : (n += 1);
    let figura = 0;
    return { ...c, numero, bloques: c.bloques.map((b) => (b.img ? { ...b, figura: `${numero ?? 'A'}.${(figura += 1)}` } : b)) };
  });
};

const ManualPdf = ({ logo, datos = {} }) => {
  const numerados = numerar(MANUAL.capitulos);
  return (
    <Informe titulo={MANUAL.titulo} alcance={`Versión ${MANUAL.version}`}>
      <Portada
        logo={logo}
        eyebrow="Guía de uso"
        titulo={MANUAL.titulo}
        subtitulo={MANUAL.subtitulo}
        meta={[['Versión', MANUAL.version], ['Actualizada', MANUAL.fecha], ['Dirección', MANUAL.url]]}
      />
      <View style={{ marginTop: 18 }}>
        <Rico style={[s.parrafo, { fontSize: 10.5, color: C.suave }]}>{MANUAL.presentacion}</Rico>
      </View>

      <Rico style={s.creditos}>{MANUAL.convenciones}</Rico>
      {/* El índice va en su propia página: con los resúmenes no cabe junto a la portada */}
      <View break>
        <Subtitulo texto="Contenido" />
        {numerados.map((c) => (
          <View key={c.id} style={s.indiceFila} wrap={false}>
            <Text style={s.indiceNumero}>{c.anexo ? 'A' : c.numero}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.indiceTitulo}>{c.titulo}</Text>
              {c.resumen ? <Text style={s.indiceResumen}>{c.resumen}</Text> : null}
            </View>
          </View>
        ))}
      </View>

      {numerados.map((c) => <Capitulo key={c.id} capitulo={c} numero={c.numero} disponibles={datos.disponibles} />)}
    </Informe>
  );
};

export default ManualPdf;
