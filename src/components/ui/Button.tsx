import React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { buttonVariants } from './variantes';

/**
 * EL botón de BandManager. Uno solo: si necesitas otra variante, se añade aquí,
 * no se escribe a mano en la pantalla (craft-interfaces: «un solo botón»).
 *
 * Lleva de serie lo que hace que un botón «responda»: `:active` a 0,97, transición
 * con lista explícita de propiedades, foco de teclado (global), zona táctil ≥ 40 px
 * y estado deshabilitado. El color del acento lo pone el módulo (`data-modulo`).
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';

export interface IconButtonProps extends Omit<ButtonProps, 'aria-label' | 'children' | 'size'> {
  /** Nombre accesible (y tooltip). Obligatorio: un botón de solo icono sin nombre no existe para un lector de pantalla. */
  label: string;
  size?: 'icon' | 'icon-sm' | 'icon-xs';
  children: React.ReactNode;
}

/** Botón de solo icono: `Button` cuadrado con `aria-label` y `title` obligatorios. Por defecto discreto (ghost). */
export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ label, size = 'icon-sm', variant = 'ghost', children, ...props }, ref) => (
    <Button ref={ref} variant={variant} size={size} aria-label={label} title={label} {...props}>
      {children}
    </Button>
  ),
);
IconButton.displayName = 'IconButton';
