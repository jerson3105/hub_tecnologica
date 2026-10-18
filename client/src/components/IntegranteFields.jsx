import { Users, MapPin, Briefcase } from 'lucide-react';
import { Field, Input, Select } from './ui/Field';
import { UBIGEO_PERU } from '../data/ubigeo';
import { AREAS_INTEGRANTE, GENEROS } from '../constants/integrantes';

// Si un usuario antiguo tiene un valor escrito a mano que no está en la lista, se conserva
// como opción para no perderlo al guardar.
const conValorActual = (opciones, valor) =>
  valor && !opciones.includes(valor) ? [valor, ...opciones] : opciones;

const Seccion = ({ icono, titulo, children }) => {
  const Icono = icono;
  return (
    <fieldset className="space-y-4">
      <legend className="eyebrow flex items-center gap-1.5 mb-3">
        <Icono size={12} aria-hidden="true" /> {titulo}
      </legend>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </fieldset>
  );
};

// Datos de perfil de un integrante/usuario, compartido por Emprendimientos (admin),
// MiEmprendimiento (líder) y Usuarios (admin). `onCambio(campo, valor)` actualiza un campo;
// la ubicación usa el ubigeo de Perú (departamento -> `ciudad`, provincia, distrito).
const IntegranteFields = ({ valores, onCambio, requerido = true }) => {
  const departamentos = UBIGEO_PERU.map(d => d.nombre);
  const depSel = UBIGEO_PERU.find(d => d.nombre === valores.ciudad);
  const provincias = depSel?.provincias.map(p => p.nombre) || [];
  const provSel = depSel?.provincias.find(p => p.nombre === valores.provincia);
  const distritos = provSel?.distritos || [];

  const texto = (campo, props = {}) => (
    <Input type="text" value={valores[campo] ?? ''} onChange={(e) => onCambio(campo, e.target.value)} {...props} />
  );

  return (
    <div className="space-y-6">
      <Seccion icono={Users} titulo="Datos personales">
        <Field label="Nombres" requerido={requerido}>{texto('nombre', { autoComplete: 'given-name' })}</Field>
        <Field label="Apellidos" requerido={requerido}>{texto('apellido', { autoComplete: 'family-name' })}</Field>
        <Field label="DNI">{texto('dni', { inputMode: 'numeric', maxLength: 20 })}</Field>
        <Field label="Edad">
          <Input type="number" min={0} max={120} value={valores.edad ?? ''} onChange={(e) => onCambio('edad', e.target.value)} />
        </Field>
        <Field label="Fecha de nacimiento">
          <Input type="date" value={valores.fecha_nacimiento ?? ''} onChange={(e) => onCambio('fecha_nacimiento', e.target.value)} />
        </Field>
        <Field label="Género">
          <Select value={valores.genero ?? ''} onChange={(e) => onCambio('genero', e.target.value)}>
            <option value="">Seleccionar</option>
            {GENEROS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </Select>
        </Field>
      </Seccion>

      <Seccion icono={MapPin} titulo="Contacto y ubicación">
        <Field label="Correo" requerido={requerido}>{texto('email', { type: 'email', autoComplete: 'email' })}</Field>
        <Field label="Celular">{texto('telefono', { type: 'tel', autoComplete: 'tel' })}</Field>
        <Field label="Dirección" className="sm:col-span-2">{texto('direccion', { autoComplete: 'street-address' })}</Field>
        <Field label="Departamento">
          <Select
            value={valores.ciudad ?? ''}
            onChange={(e) => {
              onCambio('ciudad', e.target.value);
              onCambio('provincia', '');
              onCambio('distrito', '');
            }}
          >
            <option value="">Seleccionar departamento</option>
            {conValorActual(departamentos, valores.ciudad).map(dep => <option key={dep} value={dep}>{dep}</option>)}
          </Select>
        </Field>
        <Field label="Provincia">
          <Select
            value={valores.provincia ?? ''}
            onChange={(e) => {
              onCambio('provincia', e.target.value);
              onCambio('distrito', '');
            }}
            disabled={!valores.ciudad && !valores.provincia}
          >
            <option value="">Seleccionar provincia</option>
            {conValorActual(provincias, valores.provincia).map(prov => <option key={prov} value={prov}>{prov}</option>)}
          </Select>
        </Field>
        <Field label="Distrito">
          <Select
            value={valores.distrito ?? ''}
            onChange={(e) => onCambio('distrito', e.target.value)}
            disabled={!valores.provincia && !valores.distrito}
          >
            <option value="">Seleccionar distrito</option>
            {conValorActual(distritos, valores.distrito).map(dist => <option key={dist} value={dist}>{dist}</option>)}
          </Select>
        </Field>
        <Field label="LinkedIn">{texto('linkedin', { type: 'url', placeholder: 'https://linkedin.com/in/...' })}</Field>
      </Seccion>

      <Seccion icono={Briefcase} titulo="Perfil">
        <Field label="Área">
          <Select value={valores.area ?? ''} onChange={(e) => onCambio('area', e.target.value)}>
            <option value="">Seleccionar área</option>
            {conValorActual(AREAS_INTEGRANTE, valores.area).map(area => <option key={area} value={area}>{area}</option>)}
          </Select>
        </Field>
        <Field label="Cargo">{texto('cargo')}</Field>
        <Field label="% de dedicación" ayuda="Porcentaje de tiempo dedicado al emprendimiento (0 a 100)">
          <Input type="number" min={0} max={100} value={valores.dedicacion ?? ''} onChange={(e) => onCambio('dedicacion', e.target.value)} />
        </Field>
      </Seccion>
    </div>
  );
};

export default IntegranteFields;
