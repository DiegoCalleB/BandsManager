import React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { cardVariants } from './variantes';

/**
 * LA tarjeta. Se separa por luz y espacio, nunca por borde (Ley 1): `surface` sobre `--bg`,
 * `sunken` para lo hundido dentro de otra tarjeta. Radio concéntrico: una tarjeta `--r-l` con
 * relleno 8 lleva dentro `--r-m`, no otra `--r-l`.
 */
export interface CardProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  as?: 'div' | 'section' | 'article';
}

export function Card({ as: Tag = 'div', className, tone, radius, padding, ...props }: CardProps) {
  return <Tag className={cn(cardVariants({ tone, radius, padding }), className)} {...props} />;
}
