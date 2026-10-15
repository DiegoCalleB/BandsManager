import type { SongAudioIdea } from '../../types';

/**
 * Catálogo estático de Song Studio: secciones del tema para clasificar ideas. Datos de
 * presentación sin lógica ni estado.
 */

/** Secciones en las que se clasifica una idea de audio, con su etiqueta, icono y color. */
export const SECCIONES_TEMA: {
  key: SongAudioIdea['seccion'];
  label: string;
  icon: string;
  color: string;
}[] = [
  {
    key: 'general',
    label: 'Idea General / Demo',
    icon: '🎵',
    color: 'bg-[var(--tentative)]/10 text-[var(--tentative)]',
  },
  {
    key: 'intro',
    label: 'Intro',
    icon: '🚀',
    color: 'bg-[var(--ok)]/10 text-[var(--ok)]',
  },
  {
    key: 'verso',
    label: 'Verso / Estrofa',
    icon: '📝',
    color: 'bg-[var(--acc)]/10 text-[var(--ink)]',
  },
  {
    key: 'estribillo',
    label: 'Estribillo / Chorus',
    icon: '🔥',
    color: 'bg-[var(--acc)]/10 text-[var(--ink)] /30',
  },
  {
    key: 'puente',
    label: 'Puente / Bridge',
    icon: '🌉',
    color: 'bg-[var(--tentative)]/10 text-[var(--tentative)]',
  },
  {
    key: 'solo',
    label: 'Solo / Arreglo',
    icon: '🎸',
    color: 'bg-[var(--alert)]/10 text-[var(--alert)]',
  },
  {
    key: 'outro',
    label: 'Outro / Final',
    icon: '🏁',
    color: 'bg-[var(--acc)]/10 text-[var(--ink)]',
  },
];
