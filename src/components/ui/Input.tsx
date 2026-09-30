import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/**
 * EL campo de texto de BandManager (Ley 1: el borde de un campo en reposo sí significa algo — «aquí se escribe»).
 * Un solo aspecto para input, textarea y select: superficie, `--line` en reposo, `--line-strong` al pasar y al
 * enfocar (el anillo de foco de teclado ya lo pone la base). 16 px en móvil para que iOS no haga zoom.
 */
export const fieldVariants = cva(
  [
    'w-full min-w-0 rounded-[var(--r-s)] border bg-[var(--surface)] text-[var(--ink)]',
    'text-base sm:text-sm placeholder:text-[var(--ink-3)]',
    'transition-ui hover:border-[var(--line-strong)] focus:border-[var(--line-strong)]',
    'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[var(--line)]',
    'read-only:bg-[var(--sunken)]',
  ],
  {
    variants: {
      size: {
        sm: 'h-9 px-3',
        md: 'h-10 px-3.5',
        lg: 'h-11 px-4',
      },
      invalid: {
        true: 'border-[var(--alert)] hover:border-[var(--alert)] focus:border-[var(--alert)]',
        false: 'border-[var(--line)]',
      },
    },
    defaultVariants: { size: 'md', invalid: false },
  },
);


export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof fieldVariants> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, invalid, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid ? true : undefined}
      className={cn(fieldVariants({ size, invalid }), className)}
      {...props}
    />
  ),
);
Input.displayName = 'Input';

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    Omit<VariantProps<typeof fieldVariants>, 'size'> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, invalid, rows = 3, ...props }, ref) => (
    <textarea
      ref={ref}
      rows={rows}
      aria-invalid={invalid ? true : undefined}
      className={cn(fieldVariants({ invalid }), 'h-auto min-h-[5.5rem] resize-y py-2.5 leading-relaxed', className)}
      {...props}
    />
  ),
);
Textarea.displayName = 'Textarea';
