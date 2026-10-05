import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * LA tarjeta. Se separa por luz y espacio, nunca por borde (Ley 1): `surface` sobre `--bg`,
 * `sunken` para lo hundido dentro de otra tarjeta. Radio concéntrico: una tarjeta `--r-l` con
 * relleno 8 lleva dentro `--r-m`, no otra `--r-l`.
 */
export const cardVariants = cva('min-w-0 text-[var(--ink)]', {
  variants: {
    tone: {
      surface: 'bg-[var(--surface)]',
      sunken: 'bg-[var(--sunken)]',
      acc: 'bg-[var(--acc-soft)] text-[var(--acc-ink)]',
    },
    radius: {
      m: 'rounded-[var(--r-m)]',
      l: 'rounded-[var(--r-l)]',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4 sm:p-5',
      lg: 'p-5 sm:p-6',
    },
  },
  defaultVariants: { tone: 'surface', radius: 'l', padding: 'md' },
});

export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  as?: 'div' | 'section' | 'article';
}

export function Card({ as: Tag = 'div', className, tone, radius, padding, ...props }: CardProps) {
  return <Tag className={cn(cardVariants({ tone, radius, padding }), className)} {...props} />;
}
