export const AREAS_INTEGRANTE = [
  'CEO',
  'TI (Tecnología)',
  'Investigación y Desarrollo',
  'Marketing',
  'Operaciones',
  'Comercial',
  'Administración'
];

export const GENEROS = [
  { value: 'masculino', label: 'Hombre' },
  { value: 'femenino', label: 'Mujer' },
  { value: 'otro', label: 'Otro' }
];

// Campos de perfil de un usuario/integrante (coinciden con normalizeUserPayload del servidor).
// La ubicación usa el ubigeo: departamento se guarda en `ciudad`, igual que antes en Emprendimientos.
export const DATOS_INTEGRANTE_VACIOS = {
  nombre: '', apellido: '', dni: '', edad: '', fecha_nacimiento: '', genero: '',
  email: '', telefono: '', direccion: '', ciudad: '', provincia: '', distrito: '', linkedin: '',
  area: '', cargo: '', dedicacion: ''
};
