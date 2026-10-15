/**
 * Variantes `cva` de los primitivos de UI. Viven aparte de los componentes para que cada
 * `.tsx` exporte solo componentes (Fast Refresh / react-refresh/only-export-components).
 */
import { cva } from 'class-variance-authority';

// --- Button ---
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
        /** Firma del módulo, con mesura: un solo `soft` por vista como mucho. Lo habitual es `neutral`. */
        soft: 'bg-[var(--acc-soft)] text-[var(--acc-ink)] hover:brightness-95',
        /** Acción neutra: la que no debe competir con el acento. */
        neutral: 'bg-[var(--sunken)] text-[var(--ink)] hover:brightness-95',
        /** Terciaria: solo texto/icono hasta que se pasa por encima. */
        ghost: 'bg-transparent text-[var(--ink-2)] hover:bg-[var(--sunken)] hover:text-[var(--ink)]',
        /** Neutra elevada: para botones sobre un panel hundido (`--sunken`), donde `neutral` se confundiría con el fondo. */
        raised: 'bg-[var(--surface)] text-[var(--ink)] hover:brightness-95',
        /** Opción elegida dentro de una pista hundida (segmentado). Neutra: seleccionar no es la acción principal. */
        selected: 'bg-[var(--surface)] text-[var(--ink)] hover:brightness-95',
        /** Filtro/chip elegido fuera de una pista: tinta invertida, sin azul. */
        inverse: 'bg-[var(--ink)] text-[var(--bg)] hover:opacity-90',
        /** Destructiva. Rojo solo aquí y en errores reales. */
        danger: 'bg-[var(--alert-soft)] text-[var(--alert)] hover:brightness-95',
      },
      size: {
        /** Compacto para barras densas (28 px); en táctil el área de pulsación se amplía sola. */
        xs: 'h-7 px-3 text-xs',
        sm: 'h-9 px-3.5 text-xs',
        md: 'h-10 px-4.5 text-sm',
        lg: 'h-11 px-5 text-sm',
        /** Botón de solo icono: cuadrado, zona táctil de 40 px. */
        icon: 'size-10 p-0',
        'icon-sm': 'size-9 p-0',
        /** Icono en filas densas (28 px); en táctil el área de pulsación se amplía sola. */
        'icon-xs': 'size-7 p-0',
      },
    },
    defaultVariants: { variant: 'neutral', size: 'md' },
  },
);

// --- Card ---
export const cardVariants = cva('min-w-0 text-[var(--ink)]', {
  variants: {
    tone: {
      surface: 'bg-[var(--surface)]',
      sunken: 'bg-[var(--sunken)]',
      acc: 'bg-[var(--acc-soft)] text-[var(--acc-ink)]',
    },
    radius: {
      m: 'rounded-[var(--r-m)]',
      l: 'rounded-[var(--r-l)]',
    },
    padding: {
      none: '',
      sm: 'p-3',
      md: 'p-4 sm:p-5',
      lg: 'p-5 sm:p-6',
    },
  },
  defaultVariants: { tone: 'surface', radius: 'l', padding: 'md' },
});

// --- Chip ---
export const chipVariants = cva(
  'inline-flex items-center gap-1 shrink-0 whitespace-nowrap rounded-[var(--r-pill)] px-2 py-0.5 text-xs font-medium tabular-nums',
  {
    variants: {
      tone: {
        neutral: 'bg-[var(--sunken)] text-[var(--ink-2)]',
        acc: 'bg-[var(--acc-soft)] text-[var(--acc-ink)]',
        ok: 'bg-[var(--ok-soft)] text-[var(--ok)]',
        alert: 'bg-[var(--alert-soft)] text-[var(--alert)]',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

// --- Input ---
export const fieldVariants = cva(
  [
    'w-full min-w-0 rounded-[var(--r-s)] border bg-[var(--surface)] text-[var(--ink)]',
    'text-base sm:text-sm placeholder:text-[var(--ink-2)]',
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

// --- LinkButton ---
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

// --- MenuItem ---
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
