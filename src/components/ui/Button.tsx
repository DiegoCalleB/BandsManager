import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * EL botón de BandManager. Uno solo: si necesitas otra variante, se añade aquí,
 * no se escribe a mano en la pantalla (craft-interfaces: «un solo botón»).
 *
 * Lleva de serie lo que hace que un botón «responda»: `:active` a 0,97, transición
 * con lista explícita de propiedades, foco de teclado (global), zona táctil ≥ 40 px
 * y estado deshabilitado. El color del acento lo pone el módulo (`data-modulo`).
 */
export const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 shrink-0 whitespace-nowrap select-none',
    'rounded-[var(--r-pill)] font-semibold cursor-pointer',
    'transition-ui active:scale-[0.97]',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
  ],
  {
    variants: {
      variant: {
        /** La acción principal de la pantalla. Solo una por vista. */
        primary: 'bg-[var(--acc)] text-[var(--on-acc)] hover:brightness-95',
        /** Acción secundaria con la firma del módulo. */
        soft: 'bg-[var(--acc-soft)] text-[var(--acc-ink)] hover:brightness-95',
        /** Acción neutra: la que no debe competir con el acento. */
        neutral: 'bg-[var(--sunken)] text-[var(--ink)] hover:brightness-95',
        /** Terciaria: solo texto/icono hasta que se pasa por encima. */
        ghost: 'bg-transparent text-[var(--ink-2)] hover:bg-[var(--sunken)] hover:text-[var(--ink)]',
        /** Destructiva. Rojo solo aquí y en errores reales. */
        danger: 'bg-[var(--alert-soft)] text-[var(--alert)] hover:brightness-95',
      },
      size: {
        sm: 'h-9 px-3.5 text-xs',
        md: 'h-10 px-4.5 text-sm',
        lg: 'h-11 px-5 text-sm',
        /** Botón de solo icono: cuadrado, zona táctil de 40 px. */
        icon: 'size-10 p-0',
        'icon-sm': 'size-9 p-0',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = 'Button';
