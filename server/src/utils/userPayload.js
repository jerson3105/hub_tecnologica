const normalizeOptionalString = (value) => {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'string') return value;

  const trimmedValue = value.trim();
  return trimmedValue === '' ? null : trimmedValue;
};

const normalizeOptionalInteger = (value) => {
  if (value === undefined || value === null) return value;

  if (typeof value === 'string') {
    const trimmedValue = value.trim();
    if (trimmedValue === '') return null;

    const parsedValue = Number.parseInt(trimmedValue, 10);
    return Number.isNaN(parsedValue) ? value : parsedValue;
  }

  return value;
};

const normalizeUserPayload = (payload) => ({
  nombre: normalizeOptionalString(payload.nombre),
  apellido: normalizeOptionalString(payload.apellido),
  email: normalizeOptionalString(payload.email),
  rol: normalizeOptionalString(payload.rol),
  telefono: normalizeOptionalString(payload.telefono),
  dni: normalizeOptionalString(payload.dni),
  edad: normalizeOptionalInteger(payload.edad),
  fecha_nacimiento: normalizeOptionalString(payload.fecha_nacimiento),
  direccion: normalizeOptionalString(payload.direccion),
  distrito: normalizeOptionalString(payload.distrito),
  provincia: normalizeOptionalString(payload.provincia),
  ciudad: normalizeOptionalString(payload.ciudad),
  linkedin: normalizeOptionalString(payload.linkedin),
  genero: normalizeOptionalString(payload.genero),
  area: normalizeOptionalString(payload.area),
  cargo: normalizeOptionalString(payload.cargo),
  dedicacion: normalizeOptionalInteger(payload.dedicacion)
});

module.exports = {
  normalizeOptionalInteger,
  normalizeOptionalString,
  normalizeUserPayload
};