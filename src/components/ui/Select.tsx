import React from 'react';
import { ChevronDown } from 'lucide-react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { fieldVariants } from './Input';

export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof fieldVariants> {
  /** Clases del contenedor (ancho, margen). Las del campo van en `className`. */
  wrapperClassName?: string;
}

/** Selector nativo (mejor en móvil y con teclado) con la misma piel que `Input` y su chevrón propio. */
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, size, invalid, children, ...props }, ref) => (
    <div className={cn('relative w-full', wrapperClassName)}>
      <select
        ref={ref}
        aria-invalid={invalid ? true : undefined}
        className={cn(fieldVariants({ size, invalid }), 'appearance-none cursor-pointer pr-9', className)}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-[var(--ink-2)]"
      />
    </div>
  ),
);
Select.displayName = 'Select';
