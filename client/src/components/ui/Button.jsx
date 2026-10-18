import { clasesBoton } from './estilos';

// Botón con variantes del sistema. `cargando` lo deshabilita (evita el doble envío) y muestra un spinner.
// `variante="texto"` es una acción en línea sin fondo; su color lo da `tono` (cyan, purple, brand,
// success, danger, neutral). `iconoFinal` pinta un icono después del texto ("Siguiente →").
const Button = ({
  variante = 'primary',
  tamanio = 'md',
  tono,
  cargando = false,
  icono,
  iconoFinal,
  type = 'button',
  disabled,
  className = '',
  children,
  ...props
}) => {
  const Icono = icono;
  const IconoFinal = iconoFinal;
  const tamanioIcono = tamanio === 'sm' ? 14 : 16;
  return (
    <button
      type={type}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={clasesBoton({ variante, tamanio, tono, className })}
      {...props}
    >
      {cargando ? (
        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" aria-hidden="true" />
      ) : Icono ? (
        <Icono size={tamanioIcono} aria-hidden="true" />
      ) : null}
      {children}
      {IconoFinal && !cargando && <IconoFinal size={tamanioIcono} aria-hidden="true" />}
    </button>
  );
};

export default Button;
