import { Text } from '@react-pdf/renderer';
import { Informe, Portada, Seccion, Kpis, Tabla, BarraApilada, ListaBarras, Columnas, Nota, Vacio } from './componentes';
import { C, SERIE } from './marca';
import { ESTADOS_PROGRAMA } from '../../constants/estados';
import { fechaCorta, fechaLarga, porcentajeTexto } from './formato';

const TOPE = 8;
const SubTitulo = ({ children }) => <Text style={{ fontSize: 8, fontWeight: 600, color: C.suave, marginBottom: 6 }}>{children}</Text>;
const barras = (lista, tope = TOPE) => lista.slice(0, tope).map((x) => ({ etiqueta: x.nombre, valor: x.total }));

// Informe de impacto para aliados y financiadores. `datos` = GET /api/indicadores?programa_id=
const InformeImpacto = ({ datos, logo }) => {
  const { programa } = datos;
  const { emprendimientos: e, personas: p } = datos;
  const acompanados = e.activos + e.graduados;
  const alcance = programa ? programa.nombre : 'Todos los programas';

  return (
    <Informe titulo="Informe de impacto" alcance={alcance}>
      <Portada
        logo={logo}
        eyebrow="Informe de impacto"
        titulo={alcance}
        subtitulo="Emprendimientos acompañados, personas y empleo"
        meta={[
          ['Periodo', programa?.fecha_inicio && programa?.fecha_fin ? `${fechaCorta(programa.fecha_inicio)} – ${fechaCorta(programa.fecha_fin)}` : null],
          ['Programas', programa ? null : String(datos.porPrograma.length)],
          ['Datos al', fechaLarga(datos.hoy)]
        ]}
      />

      <Seccion titulo="En cifras" unida>
        <Kpis columnas={3} items={[
          { valor: acompanados, etiqueta: 'Emprendimientos acompañados', detalle: `${e.activos} activos · ${e.graduados} graduados` },
          { valor: p.total, etiqueta: 'Personas en los equipos' },
          { valor: datos.empleos, etiqueta: 'Empleos generados', detalle: 'Declarados por los emprendimientos' },
          { valor: porcentajeTexto(p.porcentajeMujeres), etiqueta: 'Mujeres en los equipos', detalle: `${p.mujeres} de ${p.total} personas` },
          { valor: p.mujeresLideres, etiqueta: 'Mujeres líderes', detalle: p.lideres ? `${porcentajeTexto(p.porcentajeMujeresLideres)} de ${p.lideres} líderes` : null },
          { valor: e.graduados, etiqueta: 'Emprendimientos graduados', detalle: e.retirados ? `${e.retirados} se retiraron` : null }
        ]} />
      </Seccion>

      <Seccion titulo="Emprendimientos" unida>
        <BarraApilada partes={[
          { etiqueta: 'Activos', valor: e.activos, color: C.cianFuerte },
          { etiqueta: 'Graduados', valor: e.graduados, color: C.verde },
          { etiqueta: 'Retirados', valor: e.retirados, color: C.tenue }
        ]} />
      </Seccion>

      <Seccion titulo="Personas" unida>
        <Columnas>
          <>
            <SubTitulo>Género</SubTitulo>
            {p.total ? (
              <BarraApilada partes={[
                { etiqueta: 'Mujeres', valor: p.mujeres, color: SERIE[2] },
                { etiqueta: 'Hombres', valor: p.hombres, color: SERIE[0] },
                ...(p.otro ? [{ etiqueta: 'Otro', valor: p.otro, color: SERIE[1] }] : []),
                ...(p.sinDato ? [{ etiqueta: 'Sin dato', valor: p.sinDato, color: C.borde }] : [])
              ]} />
            ) : <Vacio>Sin personas registradas.</Vacio>}
          </>
          <>
            <SubTitulo>Edad</SubTitulo>
            <ListaBarras anchoEtiqueta={70} color={SERIE[4]} items={p.edades.map((x) => ({ etiqueta: x.rango, valor: x.total, color: x.rango === 'Sin dato' ? C.borde : undefined }))} />
          </>
        </Columnas>
      </Seccion>

      <Seccion unida titulo="Territorio" descripcion="Lugar de residencia declarado por cada integrante.">
        <Columnas>
          <>
            <SubTitulo>Departamentos</SubTitulo>
            <ListaBarras anchoEtiqueta={90} color={SERIE[3]} items={barras(p.departamentos)} vacio="Sin datos de ubicación." />
          </>
          <>
            <SubTitulo>Provincias</SubTitulo>
            <ListaBarras anchoEtiqueta={110} color={SERIE[3]} items={barras(p.provincias)} vacio="Sin datos de ubicación." />
          </>
        </Columnas>
      </Seccion>

      <Seccion unida titulo="Sectores" descripcion={datos.sinSector ? `${datos.sinSector} emprendimientos sin sector registrado.` : null}>
        <ListaBarras anchoEtiqueta={170} color={SERIE[1]} items={barras(datos.sectores, 12)} vacio="Sin sectores registrados." />
      </Seccion>

      {!programa && datos.porPrograma.length > 0 && (
        <Seccion titulo="Por programa" unida>
          <Tabla
            columnas={[
              { titulo: 'Programa', ancho: 2.4 },
              { titulo: 'Emprend.', ancho: 0.9, alinear: 'right' },
              { titulo: 'Graduados', ancho: 0.9, alinear: 'right' },
              { titulo: 'Personas', ancho: 0.9, alinear: 'right' },
              { titulo: 'Mujeres', ancho: 0.9, alinear: 'right' },
              { titulo: 'Líderes mujeres', ancho: 1, alinear: 'right' },
              { titulo: 'Empleos', ancho: 0.8, alinear: 'right' }
            ]}
            filas={datos.porPrograma.map((x) => [
              `${x.nombre}${ESTADOS_PROGRAMA[x.estado] ? ` · ${ESTADOS_PROGRAMA[x.estado].label}` : ''}`,
              x.total - x.retirados, x.graduados, x.personas, x.mujeres, x.mujeresLideres, x.empleos
            ])}
          />
        </Seccion>
      )}

      <Nota>
        Personas: integrantes únicos de los equipos activos y graduados (cada persona cuenta una vez). Los emprendimientos
        retirados solo cuentan en el estado. Edad según el dato registrado o la fecha de nacimiento. Empleos: los que declara
        cada emprendimiento en el sistema.
      </Nota>
    </Informe>
  );
};

export default InformeImpacto;
