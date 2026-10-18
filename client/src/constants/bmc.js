// Bloques del Business Model Canvas (campos de BmcVersion), compartidos por la vista del equipo
// técnico y el editor del emprendedor. `celda`: posición en el lienzo clásico de escritorio (10
// columnas); `orden`: orden de lectura en móvil, que cuenta el modelo empezando por el cliente.
export const BLOQUES_BMC = [
  { clave: 'socios_clave', etiqueta: 'Socios clave', tono: 'programa', celda: 'lg:col-span-2 lg:row-span-2', orden: 'order-8',
    pregunta: '¿Con quiénes te alías (proveedores, aliados) y qué te aportan?' },
  { clave: 'actividades_clave', etiqueta: 'Actividades clave', tono: 'info', celda: 'lg:col-span-2', orden: 'order-7',
    pregunta: '¿Qué tienes que hacer muy bien para cumplir tu propuesta de valor?' },
  { clave: 'propuesta_valor', etiqueta: 'Propuesta de valor', tono: 'warning', celda: 'lg:col-span-2 lg:row-span-2', orden: 'order-2',
    pregunta: '¿Qué problema resuelves y qué valor entregas a cada segmento?' },
  { clave: 'relacion_clientes', etiqueta: 'Relación con clientes', tono: 'success', celda: 'lg:col-span-2', orden: 'order-4',
    pregunta: '¿Qué relación tienes con cada segmento: personal, automatizada, comunidad…?' },
  { clave: 'segmento_clientes', etiqueta: 'Segmento de clientes', tono: 'danger', celda: 'lg:col-span-2 lg:row-span-2', orden: 'order-1',
    pregunta: '¿Para quién creas valor? ¿Quiénes son tus clientes más importantes?' },
  { clave: 'recursos_clave', etiqueta: 'Recursos clave', tono: 'info', celda: 'lg:col-span-2', orden: 'order-6',
    pregunta: '¿Qué necesitas para operar: personas, equipos, dinero, conocimiento?' },
  { clave: 'canales', etiqueta: 'Canales', tono: 'success', celda: 'lg:col-span-2', orden: 'order-3',
    pregunta: '¿Cómo llegas a tus clientes y cómo les entregas tu propuesta?' },
  { clave: 'estructura_costos', etiqueta: 'Estructura de costos', tono: 'azul', celda: 'lg:col-span-5', orden: 'order-9',
    pregunta: '¿Cuáles son los costos más importantes de tu modelo?' },
  { clave: 'fuentes_ingresos', etiqueta: 'Fuentes de ingresos', tono: 'success', celda: 'lg:col-span-5', orden: 'order-5',
    pregunta: '¿Por qué te pagan tus clientes, cuánto y cómo?' }
];

export const CLAVES_BMC = BLOQUES_BMC.map((b) => b.clave);
