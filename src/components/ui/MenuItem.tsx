import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/** Fila de un menú desplegable o popover: ancho completo, icono + texto, hover con `--sunken`. */
export const menuItemVariants = cva(
  [
    'flex w-full items-center gap-2.5 rounded-[var(--r-s)] px-3 py-2 text-left text-sm font-medium cursor-pointer select-none',
    'transition-ui active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
  ],
  {
    variants: {
      tone: {
        default: 'text-[var(--ink)] hover:bg-[var(--sunken)]',
        muted: 'text-[var(--ink-2)] hover:bg-[var(--sunken)] hover:text-[var(--ink)]',
        acc: 'text-[var(--acc-ink)] hover:bg-[var(--acc-soft)]',
        danger: 'text-[var(--alert)] hover:bg-[var(--alert-soft)]',
      },
      dense: { true: 'px-2.5 py-1.5 text-xs', false: '' },
    },
    defaultVariants: { tone: 'default', dense: false },
  },
);

export interface MenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof menuItemVariants> {}

export const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ className, tone, dense, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} role="menuitem" className={cn(menuItemVariants({ tone, dense }), className)} {...props} />
  ),
);
MenuItem.displayName = 'MenuItem';
