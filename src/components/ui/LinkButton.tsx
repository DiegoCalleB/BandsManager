import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

/** Botón con forma de enlace («Ver todo», «Editar», «Reintentar»): solo texto, subrayado al pasar. */
export const linkButtonVariants = cva(
  'inline-flex items-center gap-1 font-semibold cursor-pointer underline-offset-2 hover:underline transition-ui active:opacity-70 disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline',
  {
    variants: {
      tone: {
        acc: 'text-[var(--acc-ink)]',
        muted: 'text-[var(--ink-2)] hover:text-[var(--ink)]',
        danger: 'text-[var(--alert)]',
      },
      size: { xs: 'text-micro', sm: 'text-xs', md: 'text-sm' },
    },
    defaultVariants: { tone: 'acc', size: 'sm' },
  },
);

export interface LinkButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof linkButtonVariants> {}

export const LinkButton = React.forwardRef<HTMLButtonElement, LinkButtonProps>(
  ({ className, tone, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(linkButtonVariants({ tone, size }), className)} {...props} />
  ),
);
LinkButton.displayName = 'LinkButton';
