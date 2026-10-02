import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

type ConfirmModalProps = {
    open: boolean;
    title: string;
    text?: ReactNode;
    icon?: ReactNode;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onClose: () => void;
};

export function ConfirmModal({
                                 open,
                                 title,
                                 text,
                                 icon,
                                 confirmLabel = 'Підтвердити',
                                 cancelLabel = 'Скасувати',
                                 loading = false,
                                 onConfirm,
                                 onClose,
                             }: ConfirmModalProps) {
    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        function handleKeyDown(event: KeyboardEvent) {
            if (event.key === 'Escape' && !loading) onClose();
        }

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    }, [open, loading, onClose]);

    if (!open) return null;

    return createPortal(
        <div className="cart-modal-backdrop" onClick={() => !loading && onClose()}>
            <div
                className="cart-modal confirm-modal"
                role="alertdialog"
                aria-modal="true"
                aria-label={title}
                onClick={(event) => event.stopPropagation()}
            >
                <button type="button" className="cart-modal-close" onClick={onClose} disabled={loading} aria-label="Закрити">
                    <X size={16} />
                </button>

                {icon && (
                    <div className="cart-modal-art" aria-hidden="true">
                        <span className="cart-modal-spark cart-modal-spark-1">✦</span>
                        <span className="cart-modal-spark cart-modal-spark-2">✦</span>
                        <span className="cart-modal-spark cart-modal-spark-3">✦</span>
                        <div className="cart-modal-circle">{icon}</div>
                    </div>
                )}

                <strong className="cart-modal-title">{title}</strong>
                {text && <p className="cart-modal-subtitle">{text}</p>}

                <div className="cart-modal-actions">
                    <button type="button" className="primary" onClick={onConfirm} disabled={loading}>
                        {loading ? 'Зачекайте…' : confirmLabel}
                    </button>
                    <button type="button" className="cart-modal-secondary" onClick={onClose} disabled={loading}>
                        {cancelLabel}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}