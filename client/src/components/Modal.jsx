import { useEffect, useId, useRef, useState } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
// El prefijo tiene que ir en cada selector de la lista: «.modal-body a, button» también elegía
// el botón Cerrar de la cabecera
const FOCUSABLE_CUERPO = FOCUSABLE.split(', ').map((sel) => `.modal-body ${sel}`).join(', ');

// Anchos del sistema visual: sm 440 · md 560 · lg 720 · xl 960 px
const ANCHOS = {
  sm: 'sm:max-w-[27.5rem]',
  md: 'sm:max-w-[35rem]',
  lg: 'sm:max-w-[45rem]',
  xl: 'sm:max-w-[60rem]'
};

const DURACION_SALIDA = 240; // la salida más larga (hoja en móvil); en escritorio dura 160 ms

// Diálogo modal. En móvil es una hoja que sube desde abajo (a ancho completo, con el pulgar cerca
// de las acciones); desde 640 px, un diálogo centrado. Cabecera fija, cuerpo con scroll y, si el
// contenido usa <ModalPie>, acciones fijas al pie.
// closeOnBackdrop es false por defecto: un clic accidental fuera del modal no debe
// descartar un formulario a medio llenar ni una contraseña que solo se muestra una vez.
const Modal = ({ isOpen, onClose, title, descripcion, children, size = 'md', closeOnBackdrop = false }) => {
  const titleId = useId();
  const descripcionId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // Se mantiene montado mientras dura la animación de salida
  const [montado, setMontado] = useState(isOpen);
  if (isOpen && !montado) setMontado(true);
  useEffect(() => {
    if (isOpen || !montado) return undefined;
    const t = setTimeout(() => setMontado(false), DURACION_SALIDA);
    return () => clearTimeout(t);
  }, [isOpen, montado]);

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Foco inicial en el primer campo del contenido (o en el panel si no hay)
    const panel = panelRef.current;
    const first = panel?.querySelector(FOCUSABLE_CUERPO) || panel;
    first?.focus();

    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }
      // Mantener el foco dentro del diálogo
      if (e.key === 'Tab' && panel) {
        const focusables = [...panel.querySelectorAll(FOCUSABLE)];
        if (focusables.length === 0) return;
        const firstEl = focusables[0];
        const lastEl = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [isOpen]);

  if (!montado) return null;
  const saliendo = !isOpen;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" inert={saliendo || undefined}>
      <div
        className={`fixed inset-0 bg-scrim ${saliendo ? 'animate-fade-sale' : 'animate-fade'}`}
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descripcion ? descripcionId : undefined}
        tabIndex={-1}
        className={`relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-panel border border-border bg-popover text-popover-foreground elevation-3 outline-none sm:max-h-[90vh] sm:rounded-panel ${ANCHOS[size] || ANCHOS.md} ${saliendo ? 'animate-panel-sale' : 'animate-panel'}`}
      >
        {/* Asa de la hoja (solo móvil, decorativa) */}
        <span className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border sm:hidden" aria-hidden="true" />
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 pb-4 pt-3 sm:px-6 sm:pt-5">
          <div className="min-w-0">
            <h2 id={titleId} className="font-display text-xl font-semibold leading-snug">{title}</h2>
            {descripcion && <p id={descripcionId} className="mt-1 text-sm text-muted-foreground">{descripcion}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            title="Cerrar"
            className="-mr-2 -mt-1 inline-grid size-10 shrink-0 place-items-center rounded-control text-muted-foreground transition-colors hover:bg-muted hover:text-foreground [@media(pointer:coarse)]:size-11"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>
        <div className="modal-body min-h-0 flex-auto overflow-y-auto overscroll-contain px-5 pt-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-6 sm:pb-6">
          {children}
        </div>
      </div>
    </div>
  );
};

// Pie de acciones de un modal: queda fijo abajo mientras el cuerpo hace scroll. El límite de sticky
// descuenta el relleno del cuerpo, por eso bottom es negativo (igual a ese relleno). En móvil las
// acciones se apilan a lo ancho en el orden del JSX: la principal (la última) queda abajo, junto
// al pulgar. Desde 640 px van en fila a la derecha.
export const ModalPie = ({ children, className = '' }) => (
  <div
    className={`sticky bottom-[calc(-1*max(1.25rem,env(safe-area-inset-bottom)))] z-10 -mx-5 mt-3 -mb-[max(1.25rem,env(safe-area-inset-bottom))] flex flex-col gap-3 border-t border-border bg-popover px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:-bottom-6 sm:-mx-6 sm:-mb-6 sm:flex-row sm:justify-end sm:px-6 sm:pb-4 [&>*]:w-full sm:[&>*]:w-auto ${className}`.trim()}
  >
    {children}
  </div>
);

export default Modal;
