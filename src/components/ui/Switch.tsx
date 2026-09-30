import React from 'react';
import { cn } from '../../utils/cn';

export interface SwitchProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'role' | 'aria-checked'> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

/**
 * Interruptor on/off. Es un botón con `role="switch"` (teclado: Espacio/Intro), no un checkbox disfrazado.
 * Encendido = acento del módulo; apagado = `--line-strong`. La zona táctil se amplía con `::after` en la base.
 */
export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  ({ checked, onCheckedChange, className, disabled, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-[var(--r-pill)] transition-ui',
        'active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100',
        checked ? 'bg-[var(--acc)]' : 'bg-[var(--line-strong)]',
        className,
      )}
      {...props}
    >
      <span
        aria-hidden
        className={cn(
          'pointer-events-none block size-[18px] rounded-[var(--r-pill)] bg-[var(--surface)] transition-transform',
          checked ? 'translate-x-[19px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  ),
);
Switch.displayName = 'Switch';
