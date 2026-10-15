import React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { menuItemVariants } from './variantes';

/** Fila de un menú desplegable o popover: ancho completo, icono + texto, hover con `--sunken`. */
export interface MenuItemProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof menuItemVariants> {}

export const MenuItem = React.forwardRef<HTMLButtonElement, MenuItemProps>(
  ({ className, tone, dense, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} role="menuitem" className={cn(menuItemVariants({ tone, dense }), className)} {...props} />
  ),
);
MenuItem.displayName = 'MenuItem';
