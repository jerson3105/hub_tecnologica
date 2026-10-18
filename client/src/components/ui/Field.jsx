import { cloneElement, isValidElement, useId } from 'react';
import { CAMPO_CLS, ETIQUETA_CLS } from './estilos';

// Envuelve un control de formulario: genera el id para asociar la etiqueta (htmlFor),
// enlaza ayuda y error con aria-describedby y marca aria-invalid si hay error.
export const Field = ({ label, requerido = false, ayuda, error, className = '', children }) => {
  const idGenerado = useId();
  const id = (isValidElement(children) && children.props.id) || idGenerado;
  const idAyuda = ayuda ? `${id}-ayuda` : undefined;
  const idError = error ? `${id}-error` : undefined;
  // Se combinan con los que ya traiga el control (p. ej. un mensaje de error compartido)
  const propsHijo = isValidElement(children) ? children.props : {};
  const describedBy = [propsHijo['aria-describedby'], idAyuda, idError].filter(Boolean).join(' ') || undefined;
  const invalido = error ? true : propsHijo['aria-invalid'];

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className={ETIQUETA_CLS}>
          {label}
          {requerido && <span className="text-red-700" aria-hidden="true"> *</span>}
        </label>
      )}
      {isValidElement(children)
        ? cloneElement(children, {
          id,
          'aria-describedby': describedBy,
          'aria-invalid': invalido,
          required: children.props.required ?? (requerido || undefined)
        })
        : children}
      {ayuda && <p id={idAyuda} className="text-xs text-gray-500 mt-1">{ayuda}</p>}
      {error && <p id={idError} className="text-xs text-red-700 mt-1">{error}</p>}
    </div>
  );
};

export const Input = ({ className = '', ...props }) => (
  <input className={`${CAMPO_CLS} ${className}`.trim()} {...props} />
);

export const Select = ({ className = '', children, ...props }) => (
  <select className={`${CAMPO_CLS} ${className}`.trim()} {...props}>
    {children}
  </select>
);

export const Textarea = ({ className = '', ...props }) => (
  <textarea className={`${CAMPO_CLS} ${className}`.trim()} {...props} />
);
