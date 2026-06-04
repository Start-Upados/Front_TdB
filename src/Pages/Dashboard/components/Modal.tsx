import { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, description, size = 'md', children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div
        className={`relative bg-surface border border-line rounded-t-2xl sm:rounded-2xl shadow-xl w-full ${sizes[size]} max-h-[90vh] sm:max-h-[85vh] flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between px-5 py-4 border-b border-line">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-ink">{title}</h2>
            {description && <p className="text-xs text-muted mt-0.5">{description}</p>}
          </div>
          <button
            onClick={onClose}
            className="ml-3 p-1.5 rounded-lg hover:bg-surface-soft text-muted hover:text-ink transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-5 py-4 border-t border-line flex flex-col-reverse sm:flex-row items-stretch sm:items-center sm:justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}