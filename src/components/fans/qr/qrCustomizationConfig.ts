/**
 * Tipos y configuraciones para la personalización avanzada del Código QR de Fans
 * Permite transformar el QR en una obra visual única (Dinosaurio, Pac-Man, Rock Skull,
 * Vinilo, Cyberpunk, etc.) manteniendo 100% de escaneabilidad matemática.
 */

export type QrDotStyle =
  | 'rounded'    // Círculos suaves
  | 'squircle'   // Cuadrados redondeados modernos
  | 'pixel'      // Bloques retro arcade 8-bit
  | 'diamond'    // Diamantes a 45 grados
  | 'classics'   // Cuadros clásicos nítidos
  | 'grooves'    // Líneas con surcos de vinilo
  | 'stars';     // Estrellas de 4 puntas

export type QrEyeStyle =
  | 'classic'    // Cuadrados concéntricos clásicos
  | 'rounded'    // Marco redondeado con diana circular
  | 'dino'       // Huella / garra prehistórica
  | 'pacman'     // Ojo estilo bloque arcade / fantasma
  | 'hexagon'    // Hexágono futurista cyber
  | 'shield'     // Escudo / cresta heráldica de rock
  | 'star'       // Estrella de rock con diana
  | 'vinyl';     // Anillos de vinilo

export type QrMascot =
  | 'band_logo'      // Logotipo oficial subido de la banda
  | 'dino'           // 🦖 Dinosaurio T-Rex Rockero con guitarra
  | 'pacman'         // 🕹️ Pac-Man retro arcade con fantasmas
  | 'rock_skull'     // 💀 Calavera rockera con auriculares
  | 'electric_bolt'  // ⚡ Rayo de alto voltaje
  | 'vinyl'          // 💿 Disco de vinilo con galleta central
  | 'cassette'       // 📻 Cassette de cinta analógica 90s
  | 'guitar'         // 🎸 Guitarra eléctrica
  | 'microphone'     // 🎤 Micrófono vintage de escenario
  | 'saturn'         // 🪐 Planeta Saturno cósmico
  | 'cyber_cat'      // 🐱 Gato cyberpunk con gafas de sol
  | 'none';          // Sin mascota central

export type QrColorPreset =
  | 'lava'           // Naranja volcánico a carmesí intenso
  | 'cyberpunk'      // Fucsia neón a cian eléctrico
  | 'pacman_arcade'  // Amarillo arcade sobre azul medianoche
  | 'dino_jungle'    // Verde esmeralda y lima jurásico
  | 'royal_gold'     // Oro platino deluxe
  | 'rock_crimson'   // Rojo sangre rock y obsidiana
  | 'emerald_indie'  // Verde menta y jade
  | 'band_accent'    // Color corporativo de la banda (var(--acc))
  | 'classic_black'  // Blanco y negro eterno
  | 'custom';        // Colores personalizados

export type QrFrameStyle =
  | 'none'            // Solo el código QR
  | 'concert_merch'   // Marco escenario: "ESCANEA CON TU MÓVIL" + Banda
  | 'arcade_cabinet'  // Marco máquina recreativa arcade 80s
  | 'dino_park'       // Marco Jurassic Rock: "ROAR FOR VIP ACCESS"
  | 'vinyl_sleeve'    // Marco funda de vinilo edición coleccionista
  | 'backstage_pass'  // Marco pase VIP de backstage con cordón
  | 'neon_marquee';   // Marco cartel luminoso de sala

export interface QrCustomConfig {
  dotStyle: QrDotStyle;
  eyeStyle: QrEyeStyle;
  mascot: QrMascot;
  colorPreset: QrColorPreset;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  gradientType: 'linear' | 'radial' | 'none';
  frameStyle: QrFrameStyle;
  frameTitle?: string;
  frameSubtitle?: string;
  showBackgroundGlow: boolean;
  logoBackgroundShape: 'circle' | 'squircle' | 'diamond' | 'shield';
}

export interface QrPresetTheme {
  id: string;
  name: string;
  icon: string;
  description: string;
  config: Partial<QrCustomConfig>;
}

export const QR_PRESET_THEMES: QrPresetTheme[] = [
  {
    id: 'dino',
    name: 'Dinosaurio Rockero',
    icon: '🦖',
    description: 'Garra jurásica, puntos orgánicos y el mítico T-Rex con guitarra eléctrica.',
    config: {
      dotStyle: 'rounded',
      eyeStyle: 'dino',
      mascot: 'dino',
      colorPreset: 'dino_jungle',
      primaryColor: '#10b981',
      secondaryColor: '#84cc16',
      backgroundColor: '#062817',
      gradientType: 'linear',
      frameStyle: 'dino_park',
      frameTitle: '🦖 JURASSIC FAN CLUB',
      frameSubtitle: 'Escanea para conseguir temas inéditos y pase VIP',
      showBackgroundGlow: true,
      logoBackgroundShape: 'squircle',
    },
  },
  {
    id: 'pacman',
    name: 'Pac-Man Arcade 80s',
    icon: '🕹️',
    description: 'Píxeles 8-bit, ojos de fantasmas retro y Pac-Man comiendo bolas de concierto.',
    config: {
      dotStyle: 'pixel',
      eyeStyle: 'pacman',
      mascot: 'pacman',
      colorPreset: 'pacman_arcade',
      primaryColor: '#facc15',
      secondaryColor: '#38bdf8',
      backgroundColor: '#03071e',
      gradientType: 'linear',
      frameStyle: 'arcade_cabinet',
      frameTitle: '🕹️ INSERT COIN TO JOIN',
      frameSubtitle: 'High score asegurado: gana merchan y temas exclusivos',
      showBackgroundGlow: true,
      logoBackgroundShape: 'squircle',
    },
  },
  {
    id: 'rock_skull',
    name: 'Rock Calavera & Fuego',
    icon: '💀',
    description: 'Calavera con auriculares, ojos de escudo y degradado de lava ardiendo.',
    config: {
      dotStyle: 'diamond',
      eyeStyle: 'shield',
      mascot: 'rock_skull',
      colorPreset: 'lava',
      primaryColor: '#ef4444',
      secondaryColor: '#f97316',
      backgroundColor: '#180707',
      gradientType: 'linear',
      frameStyle: 'concert_merch',
      frameTitle: '⚡ FAN ZONE OFICIAL ⚡',
      frameSubtitle: 'Únete a la familia del rock en un solo toque',
      showBackgroundGlow: true,
      logoBackgroundShape: 'shield',
    },
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk Neón',
    icon: '⚡',
    description: 'Ojos hexagonales, rayos láser y degradado cian a fucsia holográfico.',
    config: {
      dotStyle: 'squircle',
      eyeStyle: 'hexagon',
      mascot: 'electric_bolt',
      colorPreset: 'cyberpunk',
      primaryColor: '#06b6d4',
      secondaryColor: '#ec4899',
      backgroundColor: '#0a0a1a',
      gradientType: 'linear',
      frameStyle: 'neon_marquee',
      frameTitle: '⚡ NEON LIVE CONNECTION ⚡',
      frameSubtitle: 'Sincroniza tu móvil con la banda en directo',
      showBackgroundGlow: true,
      logoBackgroundShape: 'diamond',
    },
  },
  {
    id: 'vinyl',
    name: 'Vinilo Coleccionista',
    icon: '💿',
    description: 'Surcos de vinilo, ojos de tocadiscos y acabado en oro platino.',
    config: {
      dotStyle: 'grooves',
      eyeStyle: 'vinyl',
      mascot: 'vinyl',
      colorPreset: 'royal_gold',
      primaryColor: '#eab308',
      secondaryColor: '#f59e0b',
      backgroundColor: '#17140b',
      gradientType: 'radial',
      frameStyle: 'vinyl_sleeve',
      frameTitle: '💿 EDICIÓN LIMITADA 💿',
      frameSubtitle: 'Descarga audio máster directo de mesa de sonido',
      showBackgroundGlow: false,
      logoBackgroundShape: 'circle',
    },
  },
  {
    id: 'cassette',
    name: 'Mixtape 90s',
    icon: '📻',
    description: 'Cinta de cassette analógica, tonos retro y ambiente nostálgico.',
    config: {
      dotStyle: 'rounded',
      eyeStyle: 'rounded',
      mascot: 'cassette',
      colorPreset: 'lava',
      primaryColor: '#fb923c',
      secondaryColor: '#e879f9',
      backgroundColor: '#1f132b',
      gradientType: 'linear',
      frameStyle: 'backstage_pass',
      frameTitle: '📼 VINTAGE MIXTAPE 📼',
      frameSubtitle: 'Las maquetas secretas que no están en Spotify',
      showBackgroundGlow: true,
      logoBackgroundShape: 'squircle',
    },
  },
  {
    id: 'band_logo',
    name: 'Identidad de la Banda',
    icon: '✨',
    description: 'Logotipo oficial de vuestro grupo enmarcado con los colores de vuestro EPK.',
    config: {
      dotStyle: 'squircle',
      eyeStyle: 'rounded',
      mascot: 'band_logo',
      colorPreset: 'band_accent',
      primaryColor: 'var(--acc)',
      secondaryColor: '#6366f1',
      backgroundColor: '#0f172a',
      gradientType: 'linear',
      frameStyle: 'concert_merch',
      frameTitle: '⚡ CLUB DE FANS OFICIAL ⚡',
      frameSubtitle: 'Consigue acceso anticipado a entradas y conciertos',
      showBackgroundGlow: true,
      logoBackgroundShape: 'squircle',
    },
  },
  {
    id: 'classic_black',
    name: 'Clásico Blanco & Negro',
    icon: '⬛',
    description: 'Estilo monocromático limpio y sobrio para cualquier imprenta.',
    config: {
      dotStyle: 'classics',
      eyeStyle: 'classic',
      mascot: 'none',
      colorPreset: 'classic_black',
      primaryColor: '#ffffff',
      secondaryColor: '#cbd5e1',
      backgroundColor: '#020617',
      gradientType: 'none',
      frameStyle: 'none',
      frameTitle: '',
      frameSubtitle: '',
      showBackgroundGlow: false,
      logoBackgroundShape: 'squircle',
    },
  },
];

export const DEFAULT_QR_CUSTOM_CONFIG: QrCustomConfig = {
  dotStyle: 'squircle',
  eyeStyle: 'rounded',
  mascot: 'band_logo',
  colorPreset: 'band_accent',
  primaryColor: '#6366f1',
  secondaryColor: '#a855f7',
  backgroundColor: '#0f172a',
  gradientType: 'linear',
  frameStyle: 'concert_merch',
  frameTitle: '⚡ ESCANEA CON TU MÓVIL ⚡',
  frameSubtitle: 'Únete a la familia de la banda y descarga temas inéditos',
  showBackgroundGlow: true,
  logoBackgroundShape: 'squircle',
};

const memoryStorage: Record<string, string> = {};

export function getStoredQrConfig(bandId?: string): QrCustomConfig {
  if (!bandId) return DEFAULT_QR_CUSTOM_CONFIG;
  try {
    let raw: string | null = null;
    if (typeof localStorage !== 'undefined') {
      raw = localStorage.getItem(`band_qr_config_${bandId}`);
    }
    if (!raw && memoryStorage[`band_qr_config_${bandId}`]) {
      raw = memoryStorage[`band_qr_config_${bandId}`];
    }
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_QR_CUSTOM_CONFIG, ...parsed };
    }
  } catch {}
  return DEFAULT_QR_CUSTOM_CONFIG;
}

export function saveStoredQrConfig(bandId: string, config: QrCustomConfig): void {
  if (!bandId) return;
  try {
    const json = JSON.stringify(config);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(`band_qr_config_${bandId}`, json);
    }
    memoryStorage[`band_qr_config_${bandId}`] = json;
  } catch {}
}
