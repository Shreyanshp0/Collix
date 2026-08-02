import { X } from 'lucide-react';
import { useEffect, useRef } from 'react';

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

function focusableElements(container) {
  if (!container) return [];
  return Array.from(
    container.querySelectorAll(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((el) => !el.hasAttribute('disabled'));
}

function Modal({
  size = 'lg',
  sectionLabel = '',
  title = '',
  subtitle = '',
  isOpen = false,
  onClose = () => {},
  children,
  footer,
}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;

    const prevActive = document.activeElement;

    const container = containerRef.current;
    const els = focusableElements(container);
    if (els.length) els[0].focus(); else container?.focus();

    const handleKey = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
      if (e.key === 'Tab') {
        const focusables = focusableElements(container);
        if (focusables.length === 0) {
          e.preventDefault();
          return;
        }
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKey);

    return () => {
      document.removeEventListener('keydown', handleKey);
      try {
        prevActive?.focus?.();
      } catch (err) {
        void err; // ignore focus restore errors
      }
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`relative w-full ${SIZE_CLASSES[size] || SIZE_CLASSES.lg} rounded-md border-2 border-border bg-[#0f131b] p-0 shadow-panel transform transition-all duration-180 ease-out`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-start justify-between gap-4 border-b-2 border-border px-5 py-4">
            <div>
              {sectionLabel && <p className="section-label text-groupBlue">{sectionLabel}</p>}
              {title && <h2 className="mt-1 text-lg font-black uppercase tracking-[0.12em] text-primaryText">{title}</h2>}
              {subtitle && <p className="mt-2 text-sm text-secondaryText">{subtitle}</p>}
            </div>

            <div className="ml-4 flex-shrink-0">
              <button type="button" className="rounded-md border-2 border-border bg-background p-2" onClick={onClose} aria-label="Close modal">
                <X className="h-4 w-4 text-secondaryText" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>

          {footer && (
            <div className="border-t-2 border-border px-5 py-3">{footer}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Modal;