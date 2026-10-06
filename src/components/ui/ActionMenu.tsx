import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreHorizontal } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { IconButton } from './Button';
import { MenuItem } from './MenuItem';
import { cn } from '../../utils/cn';
import { posicionMenu, ajusteHorizontal, type PosicionMenu } from '../../utils/posicionMenu';

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
  /** Obsoleto: el panel se coloca solo según el espacio de la ventana. */
  align?: 'left' | 'right';
  className?: string;
}

/**
 * «⋯» con las acciones secundarias de una fila o tarjeta: una sola acción visible (la principal) y el resto aquí.
 * Se cierra al elegir, al pulsar fuera y con Esc. Sin borde: el panel se separa por luminancia.
 */
export function ActionMenu({ label, items, className }: ActionMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<(PosicionMenu & { left?: number }) | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const anclaRef = useRef<HTMLDivElement>(null);
  const visibles = items.filter((i) => !i.hidden);

  // El panel se pinta en un portal con posición fija, calculada con el espacio real de la ventana:
  // dentro de una tarjeta con `overflow-hidden` (p. ej. un disco plegado) un panel absoluto quedaba
  // recortado y solo se veía la primera opción.
  useLayoutEffect(() => {
    if (!open || !anclaRef.current) return;
    const r = anclaRef.current.getBoundingClientRect();
    setPos(posicionMenu(r, { ancho: window.innerWidth, alto: window.innerHeight }));
  }, [open]);

  // Con el ancho real del panel ya pintado: si se sale por un lado de la pantalla, se corrige.
  useLayoutEffect(() => {
    if (!open || !pos || pos.left !== undefined || !panelRef.current) return;
    const r = panelRef.current.getBoundingClientRect();
    const left = ajusteHorizontal(r, window.innerWidth);
    if (left !== null) setPos({ ...pos, left });
  }, [open, pos]);

  useEffect(() => {
    if (!open) return;
    const cerrar = () => setOpen(false);
    window.addEventListener('resize', cerrar);
    window.addEventListener('scroll', cerrar, true);
    return () => {
      window.removeEventListener('resize', cerrar);
      window.removeEventListener('scroll', cerrar, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  if (visibles.length === 0) return null;

  return (
    <div ref={anclaRef} className={cn('relative shrink-0', className)} onClick={(e) => e.stopPropagation()}>
      <IconButton label={label} size="icon-sm" variant="neutral" aria-haspopup="menu" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <MoreHorizontal className="size-4" aria-hidden />
      </IconButton>
      {open && pos && createPortal(
        <>
          <div className="fixed inset-0 z-[10000]" onClick={(e) => { e.stopPropagation(); setOpen(false); }} />
          <div
            role="menu"
            ref={panelRef}
            style={{ position: 'fixed', top: pos.top, bottom: pos.bottom, ...(pos.left !== undefined ? { left: pos.left } : { right: pos.right }), maxHeight: pos.maxHeight }}
            onClick={(e) => e.stopPropagation()}
            className="menu-pop z-[10001] w-56 max-w-[calc(100vw-2rem)] space-y-0.5 overflow-y-auto rounded-[var(--r-l)] bg-[var(--surface)] p-1.5 shadow-none ring-1 ring-[var(--hair)]"
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
        </>,
        document.body,
      )}
    </div>
  );
}
