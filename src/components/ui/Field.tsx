import React from 'react';
import { cn } from '../../utils/cn';

export interface FieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  /** Ayuda breve bajo el campo. Se sustituye por `error` si lo hay. */
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Marca el campo como opcional con “(opcional)”; lo obligatorio no se marca, es lo normal. */
  optional?: boolean;
}

/**
 * Etiqueta + campo + ayuda/error. Usa `<label>` envolvente: el control queda asociado sin ids y
 * un toque en la etiqueta enfoca el campo (mejor en móvil). Caja de frase, sin mayúsculas decorativas.
 */
export function Field({ label, hint, error, optional, className, children, ...props }: FieldProps) {
  return (
    <div className={cn('grid gap-1.5', className)} {...props}>
      <label className="grid gap-1.5">
        <span className="text-xs font-medium text-[var(--ink-2)]">
          {label}
          {optional && <span className="font-normal text-[var(--ink-2)]"> (opcional)</span>}
        </span>
        {children}
      </label>
      {(error || hint) && (
        <p role={error ? 'alert' : undefined} className={cn('text-xs', error ? 'text-[var(--alert)]' : 'text-[var(--ink-2)]')}>
          {error || hint}
        </p>
      )}
    </div>
  );
}
