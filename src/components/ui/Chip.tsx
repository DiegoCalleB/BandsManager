import React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { chipVariants } from './variantes';

/**
 * Etiqueta de dato o estado (tonalidad, BPM, duración, "posible", "activa").
 * Informa, no se pulsa: si hay que pulsarla, es un `Button`.
 * El color dice qué ES (acento del módulo, ok, alerta), no adorna.
 */
export interface ChipProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof chipVariants> {}

export function Chip({ className, tone, ...props }: ChipProps) {
  return <span className={cn(chipVariants({ tone }), className)} {...props} />;
}
