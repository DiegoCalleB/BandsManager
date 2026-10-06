// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

export interface BandFontOption {
  id: string;
  name: string;
  category: string;
  fontFamily: string;
  badge: string;
  description: string;
  previewExample?: string;
}

export const BAND_FONT_OPTIONS: BandFontOption[] = [
  {
    id: 'anton',
    name: 'Headline Rock',
    category: 'Rock & Metal',
    fontFamily: "'Anton', 'Oswald', sans-serif",
    badge: 'Rock / Metal / Headliner',
    description: 'Mayúsculas contundentes y de alto impacto para escenarios principales y festivales.',
    previewExample: 'POTENCIA DIRECTO'
  },
  {
    id: 'bebas',
    name: 'Bebas Neue',
    category: 'Cartelería & Festival',
    fontFamily: "'Bebas Neue', sans-serif",
    badge: 'Cartel / Festival',
    description: 'Estilo póster de festival limpio, condensado y contundente.',
    previewExample: 'EN DIRECTO 2026'
  },
  {
    id: 'space-grotesk',
    name: 'Space Grotesk',
    category: 'Indie & Synthwave',
    fontFamily: "'Space Grotesk', system-ui, sans-serif",
    badge: 'Indie / Vanguardia',
    description: 'Geométrica, moderna y alternativa para bandas vanguardistas y synth.',
    previewExample: 'MODERN SOUND'
  },
  {
    id: 'permanent-marker',
    name: 'Permanent Marker',
    category: 'Punk & Grunge',
    fontFamily: "'Permanent Marker', cursive",
    badge: 'Punk / Underground',
    description: 'Estilo rotulador analógico, desgastado y con actitud callejera/garage.',
    previewExample: 'RAW NOISE'
  },
  {
    id: 'caveat',
    name: 'Caveat Hand',
    category: 'Folk & Acústico',
    fontFamily: "'Caveat', cursive",
    badge: 'Folk / Cantautor',
    description: 'Caligráfica manuscrita, cercana, orgánica y cálida para acústicos.',
    previewExample: 'Canciones del alma'
  },
  {
    id: 'playfair',
    name: 'Playfair Display',
    category: 'Editorial & Elegante',
    fontFamily: "'Playfair Display', Georgia, serif",
    badge: 'Elegante / Vinilo',
    description: 'Serif distinguida, estética de disco de vinilo y elegancia atemporal.',
    previewExample: 'Edición Exclusiva'
  },
  {
    id: 'cinzel',
    name: 'Cinzel Épico',
    category: 'Sinfónico & Épico',
    fontFamily: "'Cinzel', serif",
    badge: 'Sinfónico / Clásico',
    description: 'Inspiración clásica y majestuosa para directos orquestales o metal sinfónico.',
    previewExample: 'SYMPHONIC TOUR'
  },
  {
    id: 'courier',
    name: 'Courier Prime',
    category: 'Vintage & Retro',
    fontFamily: "'Courier Prime', monospace",
    badge: 'Vintage / Master Tape',
    description: 'Tipografía mecanográfica analógica inspirada en cintas y libretas de estudio.',
    previewExample: 'ANALOG SESSION'
  },
  {
    id: 'plus-jakarta',
    name: 'Plus Jakarta Sans',
    category: 'Pop & Urbano',
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    badge: 'Pop / Clean Global',
    description: 'Limpia, equilibrada y de máxima legibilidad en streaming y redes sociales.',
    previewExample: 'GLOBAL SOUND'
  }
];

export function getFontFamilyById(fontId?: string): string {
  if (!fontId) return "'Anton', 'Oswald', sans-serif";
  const found = BAND_FONT_OPTIONS.find(f => f.id === fontId || f.fontFamily === fontId || f.name.toLowerCase() === fontId.toLowerCase());
  return found ? found.fontFamily : fontId;
}
