import React, { useEffect, useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { IconButton } from './Button';
import { MenuItem } from './MenuItem';
import { cn } from '../../utils/cn';

export interface ActionMenuItem {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  tone?: 'default' | 'danger';
  hidden?: boolean;
}

export interface ActionMenuProps {
  /** Nombre accesible del disparador (p. ej. «Más acciones del disco»). */
  label: string;
  items: ActionMenuItem[];
  align?: 'left' | 'right';
  className?: string;
}

/**
 * «⋯» con las acciones secundarias de una fila o tarjeta: una sola acción visible (la principal) y el resto aquí.
 * Se cierra al elegir, al pulsar fuera y con Esc. Sin borde: el panel se separa por luminancia.
 */
export function ActionMenu({ label, items, align = 'right', className }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const visibles = items.filter((i) => !i.hidden);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (visibles.length === 0) return null;

  return (
    <div className={cn('relative shrink-0', className)} onClick={(e) => e.stopPropagation()}>
      <IconButton label={label} size="icon-sm" variant="neutral" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="size-4" aria-hidden />
      </IconButton>
      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className={cn(
              'menu-pop absolute top-full z-40 mt-1.5 w-56 max-w-[calc(100vw-2rem)] space-y-0.5 rounded-[var(--r-l)] bg-[var(--surface)] p-1.5 shadow-none ring-1 ring-[var(--hair)]',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            {visibles.map(({ label: l, icon: Icon, onSelect, tone }) => (
              <MenuItem
                key={l}
                tone={tone === 'danger' ? 'danger' : 'default'}
                onClick={() => {
                  setOpen(false);
                  onSelect();
                }}
              >
                {Icon && <Icon className="size-4 shrink-0" aria-hidden />}
                {l}
              </MenuItem>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
