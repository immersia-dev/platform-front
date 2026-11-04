import type { ReactNode } from 'react';

type ActionDialogIntent = 'default' | 'danger';

type ActionDialogProps = {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel?: string;
  intent?: ActionDialogIntent;
  disabled?: boolean;
  children?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ActionDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = 'Cancelar',
  intent = 'default',
  disabled = false,
  children,
  onConfirm,
  onClose,
}: ActionDialogProps) {
  if (!open) return null;

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="action-dialog-title"
        className="dialog-panel"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div>
          <h2 id="action-dialog-title" className="text-2xl font-semibold text-white">
            {title}
          </h2>
          {description ? <p className="mt-2 text-sm leading-6 text-white/60">{description}</p> : null}
        </div>

        {children ? <div className="dialog-body">{children}</div> : null}

        <div className="dialog-actions">
          <button type="button" className="secondary-btn" onClick={onClose}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={intent === 'danger' ? 'danger-btn' : 'primary-btn sm:w-auto sm:px-5'}
            onClick={onConfirm}
            disabled={disabled}
          >
            {confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
