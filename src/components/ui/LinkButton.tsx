import React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';
import { linkButtonVariants } from './variantes';

/** Botón con forma de enlace («Ver todo», «Editar», «Reintentar»): solo texto, subrayado al pasar. */
export interface LinkButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof linkButtonVariants> {}

export const LinkButton = React.forwardRef<HTMLButtonElement, LinkButtonProps>(
  ({ className, tone, size, type = 'button', ...props }, ref) => (
    <button ref={ref} type={type} className={cn(linkButtonVariants({ tone, size }), className)} {...props} />
  ),
);
LinkButton.displayName = 'LinkButton';
