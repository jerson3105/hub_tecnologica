// Clases compartidas de los componentes de UI. Viven aparte de los componentes para poder
// reutilizarlas en elementos que no son <button> (por ejemplo un <Link> con aspecto de botón).
//
// Ojo con className: en Tailwind v4 una clase extra de la misma propiedad que una de la base
// (w-*, px-*, color de texto...) no la sobrescribe de forma fiable. Las variaciones van aquí,
// como variante o tono, no como className.

// Campos: texto de 16px en móvil (evita el zoom de iOS al enfocar) y 14px desde sm;
// borde gray-300 (el gray-200 anterior apenas se distinguía del fondo).
export const CAMPO_CLS = 'w-full px-4 py-2.5 border border-gray-300 rounded-xl bg-white text-base sm:text-sm text-brand-dark placeholder:text-gray-500 outline-none transition-colors focus:border-brand-cyan-ink focus:ring-2 focus:ring-brand-cyan/40 disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed';

// Filtros de cabecera (selects sueltos junto a un botón): ancho completo en móvil y el de su
// contenido desde sm. Añadir "w-auto" a CAMPO_CLS no basta: en el CSS generado gana w-full.
export const FILTRO_CLS = CAMPO_CLS.replace('w-full', 'w-full sm:w-auto');

export const ETIQUETA_CLS = 'block text-sm font-semibold text-brand-dark mb-1.5';

// Colores de texto con fondo suave al pasar el ratón. Los usan IconButton y la variante
// "texto" de Button.
const TONOS_TEXTO = {
  neutral: 'text-gray-600 hover:bg-gray-100',
  brand: 'text-brand-dark hover:bg-brand-cyan/10',
  cyan: 'text-brand-cyan-ink hover:bg-brand-cyan/10',
  purple: 'text-brand-purple hover:bg-brand-purple/10',
  success: 'text-brand-green-ink hover:bg-brand-green/10',
  danger: 'text-red-600 hover:bg-red-50'
};

const VARIANTES_BOTON = {
  primary: 'bg-brand-dark text-white hover:bg-brand-dark/90 shadow-sm hover:shadow-md',
  accent: 'bg-brand-cyan text-brand-dark hover:bg-brand-cyan/90 shadow-sm hover:shadow-md',
  success: 'bg-brand-green text-brand-dark hover:bg-brand-green/90 shadow-sm',
  amber: 'bg-amber-500 text-brand-dark hover:bg-amber-400 shadow-sm',
  secondary: 'border border-gray-300 bg-white text-brand-dark hover:bg-gray-50',
  ghost: 'text-gray-600 hover:bg-gray-100',
  danger: 'bg-red-600 text-white hover:bg-red-700 shadow-sm'
};

const TAMANIOS_BOTON = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-5 text-sm',
  lg: 'h-11 px-6 text-sm'
};

// Variante "texto": acción en línea sin fondo ("Agregar actividad", "Editar", "Descargar").
// Menos relleno lateral para que el texto quede alineado con el contenido.
const TAMANIOS_TEXTO = {
  sm: 'min-h-8 px-2 text-xs',
  md: 'min-h-9 px-2 text-sm',
  lg: 'min-h-10 px-3 text-sm'
};

export const clasesBoton = ({ variante = 'primary', tamanio = 'md', tono = 'cyan', className = '' } = {}) => {
  const esTexto = variante === 'texto';
  const aspecto = esTexto
    ? `${TONOS_TEXTO[tono] || TONOS_TEXTO.cyan} ${TAMANIOS_TEXTO[tamanio] || TAMANIOS_TEXTO.md}`
    : `${VARIANTES_BOTON[variante] || VARIANTES_BOTON.primary} ${TAMANIOS_BOTON[tamanio] || TAMANIOS_BOTON.md}`;
  return `inline-flex items-center justify-center ${esTexto ? 'gap-1.5' : 'gap-2'} rounded-xl font-medium whitespace-nowrap transition-all disabled:opacity-50 disabled:cursor-not-allowed ${aspecto} ${className}`.trim();
};

// Área táctil mínima de 40px (44px en pantallas táctiles)
export const clasesIconButton = ({ tono = 'neutral', className = '' } = {}) =>
  `inline-flex items-center justify-center min-w-10 min-h-10 [@media(pointer:coarse)]:min-w-11 [@media(pointer:coarse)]:min-h-11 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${TONOS_TEXTO[tono] || TONOS_TEXTO.neutral} ${className}`.trim();

export const TONOS_BADGE = {
  neutral: 'bg-gray-100 text-gray-700',
  cyan: 'bg-brand-cyan-light text-brand-cyan-ink',
  green: 'bg-brand-green-light text-brand-green-ink',
  purple: 'bg-brand-purple-light text-brand-purple',
  blue: 'bg-blue-100 text-blue-800',
  pink: 'bg-pink-100 text-pink-800',
  amber: 'bg-amber-100 text-amber-800',
  red: 'bg-red-100 text-red-700'
};

export const PUNTOS_BADGE = {
  neutral: 'bg-gray-400',
  cyan: 'bg-brand-cyan',
  green: 'bg-brand-green',
  purple: 'bg-brand-purple',
  blue: 'bg-blue-500',
  pink: 'bg-pink-500',
  amber: 'bg-amber-500',
  red: 'bg-red-500'
};
