// Clases compartidas de los componentes de UI. Viven aparte de los componentes para poder
// reutilizarlas en elementos que no son <button> (por ejemplo un <Link> con aspecto de botón).
//
// Ojo con className: en Tailwind v4 una clase extra de la misma propiedad que una de la base
// (w-*, px-*, color de texto...) no la sobrescribe de forma fiable. Las variaciones van aquí,
// como variante o tono, no como className.

// Todas las clases usan los roles semánticos del sistema visual (responden al modo oscuro).
//
// Campos: texto de 16px en móvil (evita el zoom de iOS al enfocar) y 14px desde sm; borde con el
// rol «input» (≥ 3:1 sobre el fondo, como pide WCAG para los controles).
export const CAMPO_CLS = 'w-full min-h-10 px-3.5 py-2 border border-input rounded-control bg-card text-base sm:text-sm text-foreground placeholder:text-subtle-foreground outline-none transition-colors hover:border-petroleo-500 focus:border-ring focus:ring-2 focus:ring-ring/30 aria-[invalid=true]:border-danger disabled:bg-muted disabled:text-muted-foreground disabled:opacity-80 disabled:cursor-not-allowed';

// Filtros de cabecera (selects sueltos junto a un botón): ancho completo en móvil y el de su
// contenido desde sm. Añadir "w-auto" a CAMPO_CLS no basta: en el CSS generado gana w-full.
export const FILTRO_CLS = CAMPO_CLS.replace('w-full', 'w-full sm:w-auto');

export const ETIQUETA_CLS = 'block text-sm font-semibold text-foreground mb-1.5';

// Colores de texto con fondo suave al pasar el ratón. Los usan IconButton y la variante
// "texto" de Button.
const TONOS_TEXTO = {
  neutral: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  brand: 'text-foreground hover:bg-muted',
  cyan: 'text-link hover:bg-info-soft',
  purple: 'text-programa hover:bg-programa-soft',
  success: 'text-success hover:bg-success-soft',
  danger: 'text-danger hover:bg-danger-soft'
};

const VARIANTES_BOTON = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary-hover',
  accent: 'bg-brand text-brand-foreground hover:bg-brand-hover',
  success: 'bg-success-solid text-success-solid-foreground hover:bg-success-solid/90',
  amber: 'bg-warning-solid text-warning-solid-foreground hover:bg-warning-solid/90',
  secondary: 'border border-input bg-card text-foreground hover:bg-muted',
  ghost: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  danger: 'bg-danger-solid text-danger-solid-foreground hover:bg-danger-solid/90'
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
  return `inline-flex items-center justify-center ${esTexto ? 'gap-1.5' : 'gap-2'} rounded-control font-medium whitespace-nowrap transition-colors active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${aspecto} ${className}`.trim();
};

export const TONOS_BADGE = {
  neutral: 'bg-muted text-foreground',
  cyan: 'bg-info-soft text-info-soft-foreground',
  green: 'bg-success-soft text-success-soft-foreground',
  purple: 'bg-programa-soft text-programa-soft-foreground',
  blue: 'bg-azul-soft text-azul-soft-foreground',
  pink: 'bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-200',
  amber: 'bg-warning-soft text-warning-soft-foreground',
  red: 'bg-danger-soft text-danger-soft-foreground'
};

export const PUNTOS_BADGE = {
  neutral: 'bg-input',
  cyan: 'bg-info-solid',
  green: 'bg-success-solid',
  purple: 'bg-programa-solid',
  blue: 'bg-azul-solid',
  pink: 'bg-pink-500',
  amber: 'bg-warning-solid',
  red: 'bg-danger-solid'
};
