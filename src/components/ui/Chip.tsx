import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * Etiqueta de dato o estado (tonalidad, BPM, duración, "posible", "activa").
 * Informa, no se pulsa: si hay que pulsarla, es un `Button`.
 * El color dice qué ES (acento del módulo, ok, alerta), no adorna.
 */
export const chipVariants = cva(
  'inline-flex items-center gap-1 shrink-0 whitespace-nowrap rounded-[var(--r-pill)] px-2 py-0.5 text-xs font-medium tabular-nums',
  {
    variants: {
      tone: {
        neutral: 'bg-[var(--sunken)] text-[var(--ink-2)]',
        acc: 'bg-[var(--acc-soft)] text-[var(--acc-ink)]',
        ok: 'bg-[var(--ok-soft)] text-[var(--ok)]',
        alert: 'bg-[var(--alert-soft)] text-[var(--alert)]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof chipVariants> {}

export function Chip({ className, tone, ...props }: ChipProps) {
  return <span className={cn(chipVariants({ tone }), className)} {...props} />;
}
