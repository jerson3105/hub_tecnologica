import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// closeOnBackdrop es false por defecto: un clic accidental fuera del modal no debe
// descartar un formulario a medio llenar ni una contraseña que solo se muestra una vez.
const Modal = ({ isOpen, onClose, title, children, size = 'md', closeOnBackdrop = false }) => {
  const titleId = useId();
  const panelRef = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return undefined;

    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Foco inicial en el primer campo del contenido (o en el panel si no hay)
    const panel = panelRef.current;
    const first = panel?.querySelector(`.modal-body ${FOCUSABLE}`) || panel;
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

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div
        className="fixed inset-0 bg-brand-dark/60 backdrop-blur-sm"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          className={`relative bg-white rounded-2xl shadow-2xl w-full ${sizes[size]} max-h-[90vh] overflow-y-auto ring-1 ring-gray-100 outline-none`}
        >
          <div className="surface-dark sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-brand-dark to-brand-dark/95 rounded-t-2xl">
            <h2 id={titleId} className="text-lg font-semibold text-white">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              title="Cerrar"
              className="text-white/70 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-lg"
            >
              <X size={18} />
            </button>
          </div>
          <div className="modal-body p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
