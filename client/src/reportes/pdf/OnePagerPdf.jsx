import { View, Text, Link } from '@react-pdf/renderer';
import { Informe, Portada, Seccion, Tabla, Chip, Parrafo, Vacio } from './componentes';
import { C } from './marca';
import { fechaLarga } from './formato';

const conTexto = (v) => typeof v === 'string' && v.trim().length > 0;

// Contenido clave del One Pager por secciones; se omiten los campos vacíos y las secciones sin ninguno
const SECCIONES = [
  ['Problema y solución', [['problematica', 'Problemática / oportunidad'], ['solucion', 'Solución / propuesta de valor']]],
  ['Mercado y modelo de negocio', [['mercado_objetivo', 'Mercado objetivo'], ['modelo_negocio', 'Modelo de negocio'], ['ventaja_competitiva', 'Ventaja competitiva']]],
  ['Tracción y necesidades', [['estado_actual', 'Estado actual / tracción'], ['hitos', 'Hitos / logros'], ['necesidades', 'Necesidades del proyecto']]]
];

const REDES = [
  ['pagina_web', 'Web'], ['facebook', 'Facebook'], ['instagram', 'Instagram'], ['twitter', 'X / Twitter'], ['youtube', 'YouTube'], ['linkedin', 'LinkedIn']
];

// El enlace lleva protocolo; a la vista va sin él: «instagram.com/proyecto»
const destinoDe = (url) => (/^https?:\/\//i.test(url) ? url : `https://${url}`);
const aLaVista = (url) => url.replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/$/, '');

const s = {
  descripcion: { fontSize: 11, lineHeight: 1.5, marginTop: 16 },
  contacto: { flexDirection: 'row', paddingVertical: 4.5, borderBottomWidth: 0.6, borderBottomColor: C.borde },
  contactoEtiqueta: { width: 84, fontSize: 7.5, fontWeight: 600, color: C.suave, textTransform: 'uppercase', letterSpacing: 0.6, paddingTop: 1 },
  enlace: { color: C.cianTexto, textDecoration: 'none' }
};

// One Pager del emprendimiento: la hoja de presentación que completa el equipo, con su logo si lo
// dejó enlazado. `datos` = GET /emprendimientos/:id y GET /one-pager/:id
const OnePagerPdf = ({ datos, logo, logoProyecto }) => {
  const { emprendimiento: e, onePager } = datos;
  const op = onePager || {};
  const equipo = [...(e.integrantes || [])].sort((a, b) => Number(b.es_lider) - Number(a.es_lider));
  const secciones = SECCIONES
    .map(([titulo, campos]) => [titulo, campos.filter(([clave]) => conTexto(op[clave]))])
    .filter(([, campos]) => campos.length);
  const contactos = [
    conTexto(op.correo_proyecto) ? ['Correo', `mailto:${op.correo_proyecto.trim()}`, op.correo_proyecto.trim()] : null,
    ...REDES.filter(([clave]) => conTexto(op[clave])).map(([clave, etiqueta]) => {
      const url = op[clave].trim();
      return [etiqueta, destinoDe(url), aLaVista(url)];
    })
  ].filter(Boolean);

  return (
    <Informe titulo="One Pager" alcance={e.nombre}>
      <Portada
        logo={logo}
        imagen={logoProyecto}
        eyebrow="One Pager"
        titulo={e.nombre}
        subtitulo={[e.sector, e.programa?.nombre].filter(Boolean).join(' · ') || null}
        meta={[
          ['Etapa', op.estado_proyecto],
          ['Equipo', equipo.length ? `${equipo.length} ${equipo.length === 1 ? 'persona' : 'personas'}` : null],
          ['Contacto', op.correo_proyecto],
          ['Actualizado', op.updatedAt ? fechaLarga(op.updatedAt) : null]
        ]}
      />

      {onePager ? (
        <>
          {conTexto(op.descripcion) ? <Text style={s.descripcion}>{op.descripcion.trim()}</Text> : null}

          {secciones.map(([titulo, campos]) => (
            <Seccion key={titulo} titulo={titulo}>
              {campos.map(([clave, etiqueta]) => <Parrafo key={clave} titulo={etiqueta}>{op[clave].trim()}</Parrafo>)}
            </Seccion>
          ))}

          <Seccion titulo="Equipo">
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

          {(contactos.length > 0 || conTexto(op.otros_links)) && (
            // Filas sueltas y no en un bloque: el título viaja con la primera y el resto puede pasar de página
            <Seccion titulo="Contacto y redes">
              {contactos.map(([etiqueta, destino, texto]) => (
                <View key={etiqueta} style={s.contacto} wrap={false}>
                  <Text style={s.contactoEtiqueta}>{etiqueta}</Text>
                  <Text style={{ flex: 1 }}><Link src={destino} style={s.enlace}>{texto}</Link></Text>
                </View>
              ))}
              {conTexto(op.otros_links) && (
                <View style={s.contacto} wrap={false}>
                  <Text style={s.contactoEtiqueta}>Otros enlaces</Text>
                  <Text style={{ flex: 1 }}>{op.otros_links.trim()}</Text>
                </View>
              )}
            </Seccion>
          )}
        </>
      ) : <View style={{ marginTop: 16 }}><Vacio>El equipo aún no completa su One Pager.</Vacio></View>}
    </Informe>
  );
};

export default OnePagerPdf;
