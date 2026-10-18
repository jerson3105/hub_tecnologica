// Clases con los roles semánticos del sistema visual (responden al modo oscuro). Las usan las
// pantallas ya rediseñadas (Inicio, Programas); estilos.js conserva las de la interfaz anterior.

export const TARJETA_CLS = 'rounded-card border border-border bg-card text-card-foreground elevation-1';

export const TITULO_BLOQUE_CLS = 'font-display text-xl font-semibold leading-snug';

const BOTON_BASE = 'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-control px-4 text-sm font-medium transition-colors';
export const BOTON_PRIMARIO_CLS = `${BOTON_BASE} bg-primary text-primary-foreground hover:bg-primary-hover`;
export const BOTON_SECUNDARIO_CLS = `${BOTON_BASE} border border-input bg-card text-foreground hover:bg-muted`;
// Acción destructiva o de baja (desactivar, quitar). Clase propia: sumar text-danger a la
// secundaria no gana de forma fiable (misma propiedad).
export const BOTON_PELIGRO_CLS = `${BOTON_BASE} border border-input bg-card text-danger hover:bg-danger-soft`;

// Botón de solo icono (40px; 44px en pantallas táctiles). `tono` cambia el color al pasar el ratón.
const ICONO_TONOS = {
  neutral: 'text-muted-foreground hover:bg-muted hover:text-foreground',
  danger: 'text-muted-foreground hover:bg-danger-soft hover:text-danger-soft-foreground',
  success: 'text-muted-foreground hover:bg-success-soft hover:text-success-soft-foreground'
};
export const iconoBotonCls = (tono = 'neutral') =>
  `relative inline-grid size-10 shrink-0 place-items-center rounded-control transition-colors [@media(pointer:coarse)]:size-11 ${ICONO_TONOS[tono] || ICONO_TONOS.neutral}`;

// Chip pequeño de estado o tipo (fondo suave del tono)
export const CHIP_CLS = 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-chip px-2 py-0.5 text-xs font-semibold';

// Enlace de acción en línea (text-link con fondo suave al pasar el ratón)
export const ACCION_CLS = 'inline-flex min-h-9 items-center gap-1 whitespace-nowrap rounded-control px-2.5 text-sm font-semibold text-link transition-colors hover:bg-info-soft';

export const FONDO_TONO = {
  warning: 'bg-warning-soft text-warning-soft-foreground',
  info: 'bg-info-soft text-info-soft-foreground',
  programa: 'bg-programa-soft text-programa-soft-foreground',
  danger: 'bg-danger-soft text-danger-soft-foreground',
  success: 'bg-success-soft text-success-soft-foreground',
  azul: 'bg-azul-soft text-azul-soft-foreground',
  neutral: 'bg-muted text-foreground'
};

// Tono del chip de cada tipo de sesión (mismo reparto de color que TIPOS_SESION)
export const TONO_TIPO_SESION = {
  diagnostica_1: 'programa',
  diagnostica_2: 'programa',
  diagnostica_final: 'programa',
  taller: 'azul',
  uno_a_uno_programa: 'info',
  uno_a_uno_taller: 'success',
  seguimiento: 'neutral'
};

export const TEXTO_TONO = {
  success: 'text-success',
  warning: 'text-warning',
  danger: 'text-danger',
  muted: 'text-muted-foreground'
};
