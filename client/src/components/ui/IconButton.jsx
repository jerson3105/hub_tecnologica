import { clasesIconButton } from './estilos';

// Botón de solo icono. `label` es obligatoria: da el nombre accesible (aria-label) y el tooltip.
// `cargando` lo deshabilita y cambia el icono por un spinner mientras dura la petición.
const IconButton = ({ label, icono, tamanioIcono = 16, tono = 'neutral', cargando = false, type = 'button', disabled, className = '', ...props }) => {
  const Icono = icono;
  if (import.meta.env.DEV && !label) {
    console.warn('IconButton requiere la prop "label"');
  }
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled || cargando}
      aria-busy={cargando || undefined}
      className={clasesIconButton({ tono, className })}
      {...props}
    >
      {cargando
        ? <span className="animate-spin rounded-full border-b-2 border-current" style={{ width: tamanioIcono, height: tamanioIcono }} aria-hidden="true" />
        : <Icono size={tamanioIcono} aria-hidden="true" />}
    </button>
  );
};

export default IconButton;
