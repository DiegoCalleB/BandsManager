// Estilos de subtítulo disponibles para los reels (datos puros, compartidos por el estudio y el mockup).

export interface SubtitleStyleConfig {
  id: 'gold' | 'neon' | 'cinematic' | 'minimal';
  name: string;
  colorClass: string;
  bgClass: string;
  fontClass: string;
  preview: string;
}

export const SUBTITLE_STYLES: SubtitleStyleConfig[] = [
  {
    id: 'gold',
    name: 'Indie Gold (Viral Bounce)',
    colorClass: 'text-[var(--acc-ink)] font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]',
    bgClass: 'bg-[var(--scrim)]/50 px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/10',
    fontClass: 'font-display',
    preview: 'CUANDO EL SOLO EXPLOTA 🔥🎸'
  },
  {
    id: 'neon',
    name: 'Cyber Neon (Hyperpop)',
    colorClass: 'text-[var(--acc-ink)] font-bold drop-shadow-[0_0_12px_rgba(6,182,212,0.9)]',
    bgClass: 'bg-[var(--sunken)]/80 px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/10',
    fontClass: 'font-mono',
    preview: 'ESTE RIFF CAMBIÓ TODO ⚡'
  },
  {
    id: 'cinematic',
    name: 'Cinematic White (Pill)',
    colorClass: 'text-[var(--ink)] font-extrabold ',
    bgClass: 'bg-[var(--scrim)]/75 px-3 py-1 rounded-full ',
    fontClass: 'font-sans',
    preview: 'El público no se lo esperaba 👀'
  },
  {
    id: 'minimal',
    name: 'Minimal Clean (Wave)',
    colorClass: 'text-[var(--ink)] font-bold ',
    bgClass: 'bg-transparent',
    fontClass: 'font-sans',
    preview: 'Grabado en directo en Madrid 🎤'
  }
];
