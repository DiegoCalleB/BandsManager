export type FontPresetKey = 'onest' | 'helvetica' | 'plus_jakarta' | 'outfit' | 'inter' | 'dm_sans' | 'lora' | 'space_grotesk' | 'sora';

export interface FontPreset {
  id: FontPresetKey;
  name: string;
  subtitle: string;
  displayFont: string;
  bodyFont: string;
  description: string;
  badge: string;
  isSoft: boolean;
}

export const FONT_PRESETS: FontPreset[] = [
  {
    id: 'onest',
    name: 'Onest',
    subtitle: 'La de Espectro',
    displayFont: '"Onest Variable", "Onest", system-ui, -apple-system, "Segoe UI", sans-serif',
    bodyFont: '"Onest Variable", "Onest", system-ui, -apple-system, "Segoe UI", sans-serif',
    description:
      'Humanista, de aperturas abiertas y altura de x generosa: hecha para leerse durante horas, no para impresionar. Es la tipografía de BandManager.',
    badge: 'Recomendada',
    isSoft: true,
  },
  {
    id: 'helvetica',
    name: 'Helvetica Modern',
    subtitle: 'Limpia, Neoclásica & Profesional',
    displayFont: '"Helvetica Neue", Helvetica, "Inter", Arial, sans-serif',
    bodyFont: '"Helvetica Neue", Helvetica, "Inter", Arial, sans-serif',
    description:
      'Estilo internacional limpio y equilibrado. Elimina cualquier aspecto retro o de programador para ofrecer una lectura sofisticada y accesible.',
    badge: 'Clásica',
    isSoft: true,
  },
  {
    id: 'plus_jakarta',
    name: 'Plus Jakarta Sans',
    subtitle: 'Limpia & Equilibrada',
    displayFont: '"Plus Jakarta Sans", sans-serif',
    bodyFont: '"Plus Jakarta Sans", sans-serif',
    description: 'Limpia, equilibrada y muy suave a la vista. Elimina la dureza visual y le da un aspecto profesional y moderno.',
    badge: 'Suave',
    isSoft: true,
  },
  {
    id: 'outfit',
    name: 'Outfit',
    subtitle: 'Suave & Contemporánea',
    displayFont: '"Outfit", sans-serif',
    bodyFont: '"Plus Jakarta Sans", sans-serif',
    description: 'Curvas redondeadas y trazado contemporáneo. Transmite calidez, elegancia y lectura sin esfuerzo.',
    badge: 'Suave',
    isSoft: true,
  },
  {
    id: 'dm_sans',
    name: 'DM Sans',
    subtitle: 'Geométrica Fina',
    displayFont: '"DM Sans", sans-serif',
    bodyFont: '"DM Sans", sans-serif',
    description: 'Geometría pulida y estilizada. Excelente para aligerar la densidad en listados, tablas y fichas.',
    badge: 'Ligera',
    isSoft: true,
  },
  {
    id: 'inter',
    name: 'Inter Standard',
    subtitle: 'Clásica UI Neutra',
    displayFont: '"Inter", sans-serif',
    bodyFont: '"Inter", sans-serif',
    description: 'La tipografía estándar de las aplicaciones modernas: neutra, ultra precisa e hiperlegible.',
    badge: 'Clásica',
    isSoft: true,
  },
  {
    id: 'lora',
    name: 'Lora Editorial',
    subtitle: 'Editorial & Distinguida',
    displayFont: '"Lora", serif',
    bodyFont: '"Plus Jakarta Sans", sans-serif',
    description: 'Titulares en serifa editorial elegante combinados con un cuerpo sans-serif suave y moderno.',
    badge: 'Editorial',
    isSoft: true,
  },
  {
    id: 'space_grotesk',
    name: 'Space Grotesk',
    subtitle: 'Geométrica Intensa',
    displayFont: '"Space Grotesk", sans-serif',
    bodyFont: '"Inter", sans-serif',
    description: 'Estilo geométrico y potente con personalidad muy marcada (la opción inicial previa).',
    badge: 'Intensa',
    isSoft: false,
  },
  {
    id: 'sora',
    name: 'Sora',
    subtitle: 'Futurista & Tech',
    displayFont: '"Sora", sans-serif',
    bodyFont: '"DM Sans", sans-serif',
    description: 'Diseño tecnológico moderno, nítido y bien espaciado para un toque vanguardista.',
    badge: 'Tech',
    isSoft: true,
  },
];

/** Clave v2: la v1 guardaba «helvetica» para todo el mundo (era el valor por defecto que se
 *  persistía al primer arranque), así que nadie llegó a ver Onest. Con una clave nueva todos
 *  pasan a la tipografía de Espectro una vez; quien elija otra después, la conserva. */
const FONT_STORAGE_KEY = 'bandmanager_font_v2';

export function getStoredFontPreset(): FontPresetKey {
  try {
    const saved = localStorage.getItem(FONT_STORAGE_KEY) as FontPresetKey;
    if (saved && FONT_PRESETS.some((p) => p.id === saved)) return saved;
  } catch {
    /* sin localStorage: se usa la de Espectro */
  }
  return 'onest';
}

/** Google Fonts de cada preset que no sea Onest (que se carga desde index.html). */
const GOOGLE_FAMILY: Record<string, string> = {
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700',
  Outfit: 'Outfit:wght@400;500;600;700',
  'DM Sans': 'DM+Sans:wght@400;500;600;700',
  Inter: 'Inter:wght@400;500;600;700',
  Lora: 'Lora:wght@400;500;600;700',
  'Space Grotesk': 'Space+Grotesk:wght@400;500;600;700',
  Sora: 'Sora:wght@400;500;600;700',
};

/** Carga bajo demanda solo las familias del preset elegido (antes se pedían cuatro siempre). */
function ensureFontsLoaded(preset: FontPreset) {
  const names = new Set<string>();
  for (const stack of [preset.displayFont, preset.bodyFont]) {
    const m = stack.match(/"([^"]+)"/);
    if (m && GOOGLE_FAMILY[m[1]]) names.add(m[1]);
  }
  names.forEach((n) => {
    const id = `gf-${n.replace(/\s+/g, '-').toLowerCase()}`;
    if (document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${GOOGLE_FAMILY[n]}&display=swap`;
    document.head.appendChild(link);
  });
}

export function applyFontPreset(presetKey: FontPresetKey) {
  const preset = FONT_PRESETS.find((p) => p.id === presetKey) || FONT_PRESETS[0];
  ensureFontsLoaded(preset);
  document.documentElement.style.setProperty('--font-display-current', preset.displayFont);
  document.documentElement.style.setProperty('--font-sans-current', preset.bodyFont);
  document.documentElement.setAttribute('data-font', preset.id);

  // Apply direct style properties to body and root to ensure instant recalculation
  document.body.style.fontFamily = preset.bodyFont;

  try {
    localStorage.setItem(FONT_STORAGE_KEY, preset.id);
  } catch {
    /* sin localStorage: no se persiste */
  }
}
