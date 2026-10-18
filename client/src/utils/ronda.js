// Borrador local de un emprendimiento en «Registrar ronda» y su conversión al cuerpo de
// PUT /api/sesiones/:id/registro/:emprendimientoId.

let contador = 0;
export const claveNueva = () => `n${Date.now().toString(36)}${(contador += 1)}`;

export const borradorDesde = (emp) => ({
  realizado: emp.seguimiento.realizado || '',
  observaciones: emp.seguimiento.observaciones || '',
  enlace_grabacion: emp.seguimiento.enlace_grabacion || '',
  comentario_tallerista: emp.seguimiento.comentario_tallerista || '',
  comentario_emprendedor: emp.seguimiento.comentario_emprendedor || '',
  compromisos: emp.compromisos.map((c) => ({ id: c.id, clave: `c${c.id}`, descripcion: c.descripcion })),
  // Solo los compromisos anteriores que se tocaron en esta pantalla
  revisiones: {},
  asistencia: Object.fromEntries(emp.equipo.map((m) => [m.usuario_id, m.presente]))
});

export const enlaceValido = (valor) => !valor || /^https?:\/\/\S+$/i.test(valor.trim());

export const cuerpoDe = (b) => ({
  realizado: b.realizado,
  observaciones: b.observaciones,
  comentario_tallerista: b.comentario_tallerista,
  comentario_emprendedor: b.comentario_emprendedor,
  // Un enlace mal escrito no bloquea el resto del guardado: se avisa en el campo y no se envía
  ...(enlaceValido(b.enlace_grabacion) ? { enlace_grabacion: b.enlace_grabacion.trim() } : {}),
  compromisos: b.compromisos.map(({ id, clave, descripcion }) => ({ id: id || undefined, clave, descripcion })),
  revisiones: Object.entries(b.revisiones).map(([id, estado]) => ({ id: Number(id), estado })),
  asistencia: Object.entries(b.asistencia)
    .filter(([, presente]) => presente !== null && presente !== undefined)
    .map(([usuarioId, presente]) => ({ usuario_id: Number(usuarioId), presente }))
});

// Tras guardar, los compromisos nuevos reciben su id (por su clave) para no crearlos otra vez
export const conIdsCreados = (b, creados) => {
  if (!creados?.length) return b;
  const ids = new Map(creados.map((c) => [c.clave, c.id]));
  return { ...b, compromisos: b.compromisos.map((c) => (!c.id && ids.has(c.clave) ? { ...c, id: ids.get(c.clave) } : c)) };
};

export const ESTADOS_RONDA = {
  registrado: { label: 'Registrado', tono: 'success' },
  no_asistio: { label: 'No asistió', tono: 'neutral' },
  pendiente: { label: 'Pendiente', tono: 'warning' }
};

// Revisión de un compromiso anterior (control de tres estados)
export const OPCIONES_REVISION = [
  { valor: 'completado', texto: 'Cumplido' },
  { valor: 'en_progreso', texto: 'En curso' },
  { valor: 'no_logrado', texto: 'No se hizo' }
];
