import React, { useRef } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface TabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  icon?: LucideIcon;
  /** `id` del botón en el DOM (tutoriales y pruebas e2e se anclan a él). */
  domId?: string;
  hidden?: boolean;
}

export interface TabsProps<T extends string = string> {
  items: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  'aria-label': string;
  /** `fill`: todas las pestañas al mismo ancho (2-4 pestañas fijas); `scroll`: a su medida, deslizable. */
  layout?: 'scroll' | 'fill';
  className?: string;
}

/**
 * Pestañas de una vista. La activa se marca con relleno suave del acento (no con borde, Ley 1) y
 * el grupo es accesible de verdad: `role="tablist"`, `aria-selected`, foco itinerante y flechas
 * ← → / Inicio / Fin. Si la fila no cabe, se desliza en horizontal sin barra visible.
 */
export function Tabs<T extends string = string>({ items, value, onChange, layout = 'scroll', className, ...rest }: TabsProps<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const visibles = items.filter((i) => !i.hidden);

  const onKeyDown = (e: React.KeyboardEvent) => {
    const i = visibles.findIndex((t) => t.id === value);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % visibles.length;
    else if (e.key === 'ArrowLeft') next = (i - 1 + visibles.length) % visibles.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = visibles.length - 1;
    if (next < 0) return;
    e.preventDefault();
    const destino = visibles[next];
    onChange(destino.id);
    refs.current[destino.id]?.focus();
  };

  return (
    <div role="tablist" aria-label={rest['aria-label']} onKeyDown={onKeyDown} style={layout === 'fill' ? { gridTemplateColumns: `repeat(${visibles.length}, minmax(0, 1fr))` } : undefined}
      className={cn(layout === 'fill' ? 'grid gap-1' : 'no-scrollbar flex shrink-0 gap-1 overflow-x-auto', className)}>
      {visibles.map(({ id, label, icon: Icon, domId }) => {
        const activa = id === value;
        return (
          <button
            key={id}
            ref={(el) => {
              refs.current[id] = el;
            }}
            id={domId}
            type="button"
            role="tab"
            aria-selected={activa}
            tabIndex={activa ? 0 : -1}
            onClick={() => onChange(id)}
            className={cn(
              'flex min-h-10 cursor-pointer items-center gap-2 rounded-[var(--r-pill)] px-4 py-2 text-xs',
              layout === 'fill' ? 'justify-center px-2 text-center' : 'shrink-0 whitespace-nowrap',
              'text-xs transition-ui focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--acc)]',
              activa ? 'bg-[var(--acc-soft)] font-semibold text-[var(--acc-ink)]' : 'text-[var(--ink-2)] hover:bg-[var(--sunken)] hover:text-[var(--ink)]',
            )}
          >
            {Icon && <Icon aria-hidden className="size-4 shrink-0" />}
            {label}
          </button>
        );
      })}
    </div>
  );
}
