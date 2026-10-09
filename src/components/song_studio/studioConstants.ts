import type { SongAudioIdea } from '../../types';

/**
 * Catálogos estáticos de Song Studio: secciones del tema (para clasificar ideas) y presets de
 * estilo del generador de pistas con IA. Datos de presentación sin lógica ni estado.
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

// Galería de presets de estilo para el generador de pista con IA: en vez de una caja de texto en
// blanco (parálisis de decisión), un punto de partida de un clic con nombre + descripción de una
// línea, igual que las tarjetas de estilo de herramientas tipo Moisés/Suno Studio.
export const AI_TRACK_STYLE_PRESETS: {
  key: string;
  label: string;
  icon: string;
  description: string;
  style: string;
}[] = [
  {
    key: 'rock',
    label: 'Rock Clásico',
    icon: '🎸',
    description: 'Riffs con guitarra distorsionada, bien pegado a la base rítmica.',
    style: 'Rock clásico, guitarra con distorsión moderada, riff pegado a la batería',
  },
  {
    key: 'balada',
    label: 'Balada Suave',
    icon: '🌊',
    description: 'Arreglo melódico y espacioso, dinámica contenida.',
    style: 'Balada suave, arreglo melódico y espacioso, dinámica contenida y emotiva',
  },
  {
    key: 'funk',
    label: 'Funk Groove',
    icon: '🕺',
    description: 'Patrón sincopado y percusivo, mucho groove.',
    style: 'Funk groove, patrón rítmico sincopado, muy percusivo y bailable',
  },
  {
    key: 'ska',
    label: 'Ska / Balkan',
    icon: '🎷',
    description: 'Vientos y ritmo saltarín, energía festiva.',
    style: 'Ska / Balkan, ritmo saltarín off-beat, energía festiva de fanfarria',
  },
  {
    key: 'pop',
    label: 'Pop Moderno',
    icon: '🌆',
    description: 'Producción limpia, ganchos melódicos directos.',
    style: 'Pop moderno, producción limpia y comercial, ganchos melódicos directos',
  },
  {
    key: 'punk',
    label: 'Punk Energético',
    icon: '🤘',
    description: 'Rápido, crudo, acordes potentes.',
    style: 'Punk rock energético, tempo rápido, acordes potentes, sonido crudo',
  },
  {
    key: 'synth',
    label: 'Synth Atmosférico',
    icon: '🎹',
    description: 'Texturas electrónicas, pads y capas.',
    style: 'Synth atmosférico, texturas electrónicas, pads envolventes y capas',
  },
  {
    key: 'orquestal',
    label: 'Cuerdas Orquestales',
    icon: '🎻',
    description: 'Arreglo sinfónico con dramatismo.',
    style: 'Cuerdas orquestales, arreglo sinfónico con dramatismo y amplitud',
  },
];
