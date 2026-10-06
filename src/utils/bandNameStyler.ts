// Unicode transform utilities for Rock/Metal/Korn band name styling

// Korn / Cyrillic / Flipped character replacements
const FLIPPED_MAP: Record<string, string> = {
  R: 'Я',
  r: 'я',
  N: 'И',
  n: 'и',
  E: 'Ǝ',
  e: 'ǝ',
  A: '∀',
  a: 'ɐ',
  B: 'ᗺ',
  b: 'q',
  C: 'Ɔ',
  c: 'ɔ',
  D: 'ᗡ',
  d: 'p',
  F: 'Ⅎ',
  f: 'ɟ',
  G: '⅁',
  g: 'ƃ',
  H: 'H',
  h: 'ɥ',
  I: 'I',
  i: 'ᴉ',
  J: 'ſ',
  j: 'ɾ',
  K: 'ʞ',
  L: '⅃',
  l: 'ʃ',
  M: 'W',
  m: 'ɯ',
  O: 'O',
  o: 'o',
  P: 'Ԁ',
  p: 'd',
  Q: 'Ό',
  q: 'b',
  S: 'Ƨ',
  s: 's',
  T: '⊥',
  t: 'ʇ',
  U: '∩',
  u: 'n',
  V: 'Λ',
  v: 'ʌ',
  W: 'M',
  w: 'ʍ',
  X: 'X',
  x: 'x',
  Y: '⅄',
  y: 'ʎ',
  Z: 'Z',
  z: 'z',
};

// Umlaut Heavy (Mötley Crüe style)
const UMLAUT_MAP: Record<string, string> = {
  A: 'Ä', a: 'ä',
  E: 'Ë', e: 'ë',
  I: 'Ï', i: 'ï',
  O: 'Ö', o: 'ö',
  U: 'Ü', u: 'ü',
  Y: 'Ÿ', y: 'ÿ',
};

// Unicode Gothic / Fraktur Bold
function toGothicBold(text: string): string {
  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    // A-Z
    if (code >= 65 && code <= 90) {
      return String.fromCodePoint(0x1D56C + (code - 65));
    }
    // a-z
    if (code >= 97 && code <= 122) {
      return String.fromCodePoint(0x1D586 + (code - 97));
    }
    return char;
  }).join('');
}

// Unicode Gothic Regular
function toGothicRegular(text: string): string {
  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    // Exceptions in Unicode Gothic standard
    if (char === 'C') return 'ℭ';
    if (char === 'H') return 'ℌ';
    if (char === 'I') return 'ℑ';
    if (char === 'R') return 'ℜ';
    if (char === 'Z') return 'ℨ';
    if (code >= 65 && code <= 90) {
      return String.fromCodePoint(0x1D504 + (code - 65));
    }
    if (code >= 97 && code <= 122) {
      return String.fromCodePoint(0x1D51E + (code - 97));
    }
    return char;
  }).join('');
}

// Unicode Bold Sans
function toBoldSans(text: string): string {
  return text.split('').map(char => {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      return String.fromCodePoint(0x1D5D4 + (code - 65));
    }
    if (code >= 97 && code <= 122) {
      return String.fromCodePoint(0x1D5EE + (code - 97));
    }
    if (code >= 48 && code <= 57) {
      return String.fromCodePoint(0x1D7EC + (code - 48));
    }
    return char;
  }).join('');
}

// Korn Style: Selective R and N replacement with Cyrillic reverse (KoЯn, И)
export function toKornStyle(text: string): string {
  if (!text) return 'KoЯn';
  return text
    .replace(/R/g, 'Я')
    .replace(/r/g, 'я')
    .replace(/N/g, 'И')
    .replace(/n/g, 'и');
}

// Full Reverse Letters
export function toFlippedLetters(text: string): string {
  if (!text) return '';
  return text.split('').map(c => FLIPPED_MAP[c] || c).join('');
}

// Heavy Metal Umlauts
export function toMetalUmlauts(text: string): string {
  if (!text) return '';
  return text.split('').map(c => UMLAUT_MAP[c] || c).join('');
}

// Clean Unicode back to normal Latin
export function cleanToNormalText(text: string): string {
  if (!text) return '';
  return text
    .replace(/Я/g, 'R').replace(/я/g, 'r')
    .replace(/И/g, 'N').replace(/и/g, 'n')
    .replace(/Ǝ/g, 'E').replace(/ǝ/g, 'e')
    .replace(/∀/g, 'A').replace(/ɐ/g, 'a')
    .replace(/Ɔ/g, 'C').replace(/ɔ/g, 'c')
    .replace(/⊥/g, 'T').replace(/ʇ/g, 't')
    .replace(/Λ/g, 'V').replace(/ʌ/g, 'v')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');
}

export interface PresetStyle {
  id: string;
  label: string;
  icon: string;
  apply: (input: string) => string;
  previewSample: string;
}

export const BAND_STYLE_PRESETS: PresetStyle[] = [
  {
    id: 'korn',
    label: 'Estilo KoЯn',
    icon: '⚡',
    apply: (t) => toKornStyle(t),
    previewSample: 'KoЯn',
  },
  {
    id: 'gothic_bold',
    label: 'Gótico Metal',
    icon: '𝕸',
    apply: (t) => toGothicBold(t),
    previewSample: '𝕭𝖑𝖆𝖈𝖐 𝕸𝖊𝖙𝖆𝖑',
  },
  {
    id: 'gothic_classic',
    label: 'Gótico Clásico',
    icon: '𝔊',
    apply: (t) => toGothicRegular(t),
    previewSample: '𝔅𝔞𝔫𝔡𝔞',
  },
  {
    id: 'heavy_umlaut',
    label: 'Metal Diéresis',
    icon: 'Ö',
    apply: (t) => toMetalUmlauts(t),
    previewSample: 'MÖTLËY CRÜË',
  },
  {
    id: 'bold_impact',
    label: 'Bold Impact',
    icon: '𝗕',
    apply: (t) => toBoldSans(t),
    previewSample: '𝗕𝗮𝗻𝗱𝗮',
  },
  {
    id: 'flipped',
    label: 'Letras Invertidas',
    icon: '🔄',
    apply: (t) => toFlippedLetters(t),
    previewSample: '∀ᗺƆᗡ',
  },
];

export const ROCK_SYMBOLS = [
  '⚡', 'Я', 'И', 'Ö', 'Ä', 'Ü', '☠️', '🤘', '🎸', '🥁', '🔥', '★', '✪', '⚔️', '♠', '𝄞', '𝄢', '✦', '☾', '♾️'
];
