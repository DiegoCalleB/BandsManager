// Estilos de fondo de un cartel. Fuente única: la usan el servidor (prompt y validación) y el cliente.

export const ESTILOS_CARTEL = ['gigposter', 'neon', 'collage', 'minimal', 'vintage'] as const;
export type EstiloCartel = (typeof ESTILOS_CARTEL)[number];

export function esEstiloCartel(valor: unknown): valor is EstiloCartel {
  return typeof valor === 'string' && (ESTILOS_CARTEL as readonly string[]).includes(valor);
}

export const ETIQUETA_ESTILO: Record<EstiloCartel, string> = {
  gigposter: 'Serigrafía',
  neon: 'Neón',
  collage: 'Collage punk',
  minimal: 'Minimal',
  vintage: 'Vintage 70',
};
