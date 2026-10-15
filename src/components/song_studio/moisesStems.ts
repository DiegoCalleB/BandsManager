/**
 * Catálogo de stems y presets de separación para el modal de Iris/Moisés. Datos estáticos
 * (etiquetas, descripciones, estilos de insignia) sin lógica ni estado.
 */

export type MoisesSeparationPreset = '2_stems' | '4_stems' | '6_stems' | 'custom';

export interface MoisesStemOption {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  tag: string;
  desc: string;
  badgeBg: string;
}

export const MOISES_AVAILABLE_STEMS: MoisesStemOption[] = [
  {
    id: 'Voz',
    name: 'Voz Principal (Vocals)',
    shortName: 'Voz',
    icon: '🎤',
    tag: 'Acapella / Melodía',
    desc: 'Voz aislada en alta pureza espectral. Permite silenciar la voz original para ensayar cantando o directos.',
    badgeBg: 'bg-[var(--acc)]/20 text-[var(--ink)] ',
  },
  {
    id: 'Instrumental',
    name: 'Base Instrumental (Playback)',
    shortName: 'Instrumental',
    icon: '🎵',
    tag: 'Karaoke / Backing Track',
    desc: 'Mezcla musical completa sin voz principal. La opción predilecta para directos con playback o práctica vocal.',
    badgeBg: 'bg-[var(--alert)]/20 text-[var(--ink)] ',
  },
  {
    id: 'Batería',
    name: 'Batería & Percusión (Drums)',
    shortName: 'Batería',
    icon: '🥁',
    tag: 'Ritmo & Platos',
    desc: 'Aislamiento de bombo, caja, timbales y platos (>1800Hz) para practicar con metrónomo y batería real.',
    badgeBg: 'bg-[var(--acc)]/20 text-[var(--ink)] ',
  },
  {
    id: 'Bajo',
    name: 'Bajo Eléctrico (Bass)',
    shortName: 'Bajo',
    icon: '🎸',
    tag: 'Sub-Bass & Graves',
    desc: 'Frecuencias fundamentales y transitorios de bajo (<180Hz) para estudiar la línea o tocar encima.',
    badgeBg: 'bg-[var(--ok)]/20 text-[var(--ink)] ',
  },
  {
    id: 'Guitarras',
    name: 'Guitarras (Rítmicas & Solos)',
    shortName: 'Guitarras',
    icon: '🎸',
    tag: 'Eléctricas & Acústicas',
    desc: 'Guitarras eléctricas, distorsiones y acústicas sin bleed de voz ni percusión.',
    badgeBg: 'bg-[var(--acc)]/20 text-[var(--ink)] ',
  },
  {
    id: 'Teclados',
    name: 'Teclados & Piano (Keys)',
    shortName: 'Teclados',
    icon: '🎹',
    tag: 'Pianos & Sintes',
    desc: 'Pianos acústicos, sintetizadores polifónicos y teclados aislados para acompañamiento armónico.',
    badgeBg: 'bg-[var(--acc)]/20 text-[var(--ink)] ',
  },
  {
    id: 'Arreglos',
    name: 'Arreglos, Vientos & Cuerdas (Other)',
    shortName: 'Arreglos',
    icon: '🎺',
    tag: 'Metales & Efectos',
    desc: 'Secciones de viento metal, cuartetos de cuerda, solos y efectos secundarios de mezcla.',
    badgeBg: 'bg-[var(--acc)]/20 text-[var(--ink)] ',
  },
];

export const MOISES_PRESETS_CONFIG: Record<MoisesSeparationPreset, { label: string; badge: string; subtitle: string; stems: string[] }> = {
  '2_stems': {
    label: '2 Pistas',
    badge: 'Karaoke / Playback',
    subtitle: 'Voz Principal + Base Instrumental completa',
    stems: ['Voz', 'Instrumental'],
  },
  '4_stems': {
    label: '4 Pistas',
    badge: 'Moises Estándar',
    subtitle: 'Voz, Batería, Bajo y Guitarras/Armonía',
    stems: ['Voz', 'Batería', 'Bajo', 'Guitarras'],
  },
  '6_stems': {
    label: '6 Pistas',
    badge: 'Estudio Completo',
    subtitle: 'Voz, Batería, Bajo, Guitarras, Teclados y Arreglos',
    stems: ['Voz', 'Batería', 'Bajo', 'Guitarras', 'Teclados', 'Arreglos'],
  },
  custom: {
    label: 'A Tu Medida',
    badge: 'Personalizado',
    subtitle: 'Selección manual de instrumentos a aislar',
    stems: [],
  },
};
