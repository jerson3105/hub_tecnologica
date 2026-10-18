// Clases del Inicio con los roles semánticos del sistema visual (responden al modo oscuro).

export const TARJETA_CLS = 'rounded-card border border-border bg-card text-card-foreground elevation-1';

export const TITULO_BLOQUE_CLS = 'font-display text-xl font-semibold leading-snug';

const BOTON_BASE = 'inline-flex h-10 items-center justify-center gap-2 whitespace-nowrap rounded-control px-4 text-sm font-medium transition-colors';
export const BOTON_PRIMARIO_CLS = `${BOTON_BASE} bg-primary text-primary-foreground hover:bg-primary-hover`;
export const BOTON_SECUNDARIO_CLS = `${BOTON_BASE} border border-input bg-card text-foreground hover:bg-muted`;

// Select con los roles semánticos (CAMPO_CLS aún usa los colores de la interfaz anterior)
export const SELECT_CLS = 'h-10 w-full rounded-control border border-input bg-card px-3 text-base text-foreground sm:w-auto sm:text-sm';

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
