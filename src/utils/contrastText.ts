/**
 * Color de texto legible sobre un fondo cualquiera (avatares con el color que elige el usuario).
 * El usuario puede guardar un hex libre (#06B6D4) o un token (var(--acc)); con texto fijo en `--ink`
 * un cian claro daba 2:1 (iniciales ilegibles). Para hex se calcula el contraste real; para tokens,
 * su pareja `--on-*`.
 */
const ON_TOKEN: Record<string, string> = {
  'var(--acc)': 'var(--on-acc)',
  'var(--ok)': 'var(--on-ok)',
  'var(--alert)': 'var(--on-alert)',
  'var(--tentative)': 'var(--on-tentative)',
};

const lin = (c: number) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

export function textOnColor(color?: string | null): string {
  if (!color) return 'var(--ink)';
  if (ON_TOKEN[color]) return ON_TOKEN[color];
  const m = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return 'var(--ink)';
  const h = m[1].length === 3 ? m[1].split('').map((x) => x + x).join('') : m[1];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const L = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  // Contraste con blanco vs. con casi-negro (#0B0D10): gana el mayor
  const conBlanco = 1.05 / (L + 0.05);
  const conNegro = (L + 0.05) / 0.054;
  return conBlanco >= conNegro ? '#FFFFFF' : '#0B0D10';
}
