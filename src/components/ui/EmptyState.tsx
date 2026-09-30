import React from 'react';
import { PublicoSilhouette } from './PublicoSilhouette';
import { cn } from '../../utils/cn';

export interface EmptyStateProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** La frase con voz propia: «La sala está vacía. Vamos a llenarla.», nunca «No hay datos». */
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Normalmente un `<Button>`. Una sola acción. */
  action?: React.ReactNode;
  /** Compacto para tarjetas pequeñas y listas. */
  compact?: boolean;
}

/** Estado vacío de BandManager: El Público al 12 %, una frase del circuito y una acción (craft-interfaces §6). */
export function EmptyState({ title, description, action, compact, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn('flex flex-col items-center text-center', compact ? 'gap-2 py-6' : 'gap-3 py-12', className)}
      {...props}
    >
      <PublicoSilhouette size={compact ? 'small' : 'medium'} opacity={0.12} />
      <p className="text-sm font-semibold text-[var(--ink)] text-balance">{title}</p>
      {description && <p className="max-w-sm text-xs text-[var(--ink-2)] text-pretty">{description}</p>}
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}
