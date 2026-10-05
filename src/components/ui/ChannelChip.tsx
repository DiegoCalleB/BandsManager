import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';
import { CANAL_COLOR, type Canal } from '../../utils/canalColor';

export interface ChannelChipProps {
  label: string;
  canal: Canal;
  icon: LucideIcon;
  /** Último valor del canal. */
  value: number | string;
  active: boolean;
  onToggle: () => void;
  onSolo: () => void;
  className?: string;
}

/** Leyenda interactiva de una curva: pulsa para mostrar/ocultar, «Solo» para aislarla. */
export function ChannelChip({ label, canal, icon: Icon, value, active, onToggle, onSolo, className }: ChannelChipProps) {
  const color = CANAL_COLOR[canal];
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[var(--r-pill)] text-micro font-medium transition-ui',
        active ? 'bg-[var(--sunken)] text-[var(--ink)]' : 'text-[var(--ink-2)] hover:bg-[var(--sunken)]/60',
        className,
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={active}
        title={active ? `Ocultar ${label}` : `Mostrar ${label}`}
        className="flex min-h-10 cursor-pointer items-center gap-1.5 text-micro md:min-h-8 rounded-[var(--r-pill)] py-1 pl-2.5 pr-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acc)]"
      >
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={active ? { background: color } : { boxShadow: `inset 0 0 0 1.5px ${color}` }}
        />
        <Icon aria-hidden className="hidden size-3.5 shrink-0 text-[var(--ink-2)] sm:block" />
        <span>{label}</span>
        <span className="tabular-nums text-[var(--ink-2)]">{Number(value).toLocaleString('es-ES')}</span>
      </button>
      <button
        type="button"
        onClick={onSolo}
        title={`Ver solo ${label}`}
        className="min-h-10 cursor-pointer rounded-[var(--r-pill)] px-2.5 py-1 text-micro text-[var(--ink-2)] md:min-h-8 hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acc)]"
      >
        Solo
      </button>
    </div>
  );
}
