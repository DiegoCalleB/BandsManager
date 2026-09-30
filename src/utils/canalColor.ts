/**
 * Un canal = un color, el mismo en la curva y en su leyenda. Un solo sitio para no
 * desincronizar gráfico y chips (antes cada chip pintaba lo suyo y el rojo de error se colaba).
 */
export const CANAL_COLOR = {
  instagram: 'var(--acc)',
  tiktok: 'var(--ink)',
  youtube: 'var(--tentative)',
  spotify: 'var(--ok)',
  fans: 'var(--ink-3)',
} as const;

export type Canal = keyof typeof CANAL_COLOR;
