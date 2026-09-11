import {
  BarChart3,
  Briefcase,
  Video,
  Users,
  FileText,
  Quote,
  Music,
  Image as ImageIcon,
  Headphones,
  Calendar,
  Sparkles,
  Palette,
  Flame,
  Disc,
  Feather
} from 'lucide-react';
import { EPKSectionId, EPKTemplateId, EPKConfig } from '../../types';

export interface EPKTemplateMeta {
  id: EPKTemplateId;
  name: string;
  badge: string;
  description: string;
  recommendedFor: string;
  icon: any;
  preview: {
    bg: string;
    cardBg: string;
    accent: string;
    border: string;
    text: string;
    pill: string;
  };
}

export const EPK_TEMPLATES: EPKTemplateMeta[] = [
  {
    id: 'stage',
    name: 'Escenario Rock (Dark Stage)',
    badge: 'Directo & Potencia',
    description: 'Iluminación oscura con acentos dorados ámbar. Máximo contraste para bandas con directos contundentes.',
    recommendedFor: 'Rock, Metal, Indie, Pop-Rock, Punk, Ska, Mestizaje',
    icon: Flame,
    preview: {
      bg: 'bg-slate-950',
      cardBg: 'bg-slate-900',
      accent: 'bg-amber-500',
      border: 'border-amber-500/40',
      text: 'text-amber-400',
      pill: 'bg-amber-500/20 text-amber-400'
    }
  },
  {
    id: 'minimal',
    name: 'Minimalista Blanco (Prensa & Jazz)',
    badge: 'Editorial & Clásico',
    description: 'Diseño claro y limpio tipo revista cultural. Tipografía refinada, espacios generosos y elegancia editorial.',
    recommendedFor: 'Cantautores, Jazz, Neoclásica, Pop Acústico, Música de Cámara',
    icon: Feather,
    preview: {
      bg: 'bg-[#f8f8f6]',
      cardBg: 'bg-white',
      accent: 'bg-stone-900',
      border: 'border-stone-300',
      text: 'text-stone-900',
      pill: 'bg-stone-200 text-stone-800'
    }
  },
  {
    id: 'neon',
    name: 'Club Neón (Cyber Electronic)',
    badge: 'Vibrante & Moderno',
    description: 'Fondo negro profundo con brillos fucsia y cian neón. Estética nocturna para clubs y festivales de vanguardia.',
    recommendedFor: 'Electrónica, Synthwave, Trap, Hyperpop, DJs, Música Urbana',
    icon: Sparkles,
    preview: {
      bg: 'bg-[#0a0814]',
      cardBg: 'bg-[#140f28]',
      accent: 'bg-fuchsia-500',
      border: 'border-fuchsia-500/40',
      text: 'text-fuchsia-400',
      pill: 'bg-fuchsia-500/20 text-fuchsia-300'
    }
  },
  {
    id: 'vintage',
    name: 'Vinilo Analógico (Warm Folk)',
    badge: 'Cálido & Orgánico',
    description: 'Tonos tostados, café sepia y terracota. Textura analógica inspirada en portadas de vinilos clásicos.',
    recommendedFor: 'Folk, Americana, Blues, Soul, Country, Psicodelia, Bandas de Raíz',
    icon: Disc,
    preview: {
      bg: 'bg-[#181411]',
      cardBg: 'bg-[#241c17]',
      accent: 'bg-orange-600',
      border: 'border-orange-700/40',
      text: 'text-orange-400',
      pill: 'bg-orange-950/60 text-orange-300'
    }
  }
];

export interface EPKSectionMeta {
  id: EPKSectionId;
  label: string;
  subtitle: string;
  icon: any;
  defaultBadge: string;
}

export const EPK_SECTIONS_META: Record<EPKSectionId, EPKSectionMeta> = {
  cifras: {
    id: 'cifras',
    label: 'Cifras de Impacto',
    subtitle: 'Oyentes mensuales, directos acumulados, seguidores y ciudades clave',
    icon: BarChart3,
    defaultBadge: 'Social Proof'
  },
  datos: {
    id: 'datos',
    label: 'Datos de Contratación',
    subtitle: 'Contacto directo, duración, formación de músicos y formato de gira',
    icon: Briefcase,
    defaultBadge: 'Para Promotores'
  },
  videos: {
    id: 'videos',
    label: 'Vídeos de Directo',
    subtitle: 'Vídeo principal destacado y actuaciones en salas o festivales',
    icon: Video,
    defaultBadge: 'Directo en Vivo'
  },
  miembros: {
    id: 'miembros',
    label: 'Formación & Músicos',
    subtitle: 'Nombres, fotos de componentes, instrumentos y perfiles sociales',
    icon: Users,
    defaultBadge: 'Integrantes'
  },
  bio: {
    id: 'bio',
    label: 'Biografía & Contacto Directo',
    subtitle: 'Trayectoria oficial, estilo y tarjeta directa para el programador',
    icon: FileText,
    defaultBadge: 'Bio Oficial'
  },
  prensa: {
    id: 'prensa',
    label: 'Citas & Reseñas de Prensa',
    subtitle: 'Titulares en medios musicales, blogs y críticas verificadas',
    icon: Quote,
    defaultBadge: 'Críticas'
  },
  musica: {
    id: 'musica',
    label: 'Temas Destacados & Audio',
    subtitle: 'Canciones más potentes con reproductor de audio integrado',
    icon: Music,
    defaultBadge: 'Audio Oficial'
  },
  galeria: {
    id: 'galeria',
    label: 'Galería de Fotos Oficiales',
    subtitle: 'Fotografías promocionales en alta resolución para cartelería',
    icon: ImageIcon,
    defaultBadge: 'Prensa HD'
  },
  escucha: {
    id: 'escucha',
    label: 'Spotify & Streaming Embebido',
    subtitle: 'Reproductor oficial de Spotify y canal de YouTube enlazados',
    icon: Headphones,
    defaultBadge: 'Streaming'
  },
  conciertos: {
    id: 'conciertos',
    label: 'Próximos Conciertos & Agenda',
    subtitle: 'Gira actual, fechas confirmadas, ciudades y festivales',
    icon: Calendar,
    defaultBadge: 'En Gira'
  }
};

export const DEFAULT_EPK_SECTIONS_ORDER: EPKSectionId[] = [
  'cifras',
  'datos',
  'videos',
  'miembros',
  'bio',
  'prensa',
  'musica',
  'galeria',
  'escucha',
  'conciertos'
];

export function getEffectiveSectionsOrder(config?: Partial<EPKConfig> | null): EPKSectionId[] {
  const configuredOrder = config?.ordenSecciones;
  const hiddenSections = new Set(config?.seccionesOcultas || []);

  const baseOrder = (configuredOrder && configuredOrder.length > 0)
    ? configuredOrder
    : DEFAULT_EPK_SECTIONS_ORDER;

  // Filtrar solo las secciones válidas
  const validSections = baseOrder.filter(id => id in EPK_SECTIONS_META);

  // Asegurar que si hay alguna sección que no estaba en el orden guardado, se añada al final
  DEFAULT_EPK_SECTIONS_ORDER.forEach(id => {
    if (!validSections.includes(id)) {
      validSections.push(id);
    }
  });

  // Excluir secciones ocultadas explícitamente
  return validSections.filter(id => !hiddenSections.has(id));
}

export function getAllSectionsWithVisibility(config?: Partial<EPKConfig> | null): {
  id: EPKSectionId;
  meta: EPKSectionMeta;
  isVisible: boolean;
}[] {
  const configuredOrder = config?.ordenSecciones;
  const hiddenSections = new Set(config?.seccionesOcultas || []);

  const baseOrder = (configuredOrder && configuredOrder.length > 0)
    ? [...configuredOrder]
    : [...DEFAULT_EPK_SECTIONS_ORDER];

  // Añadir secciones que pudieran faltar
  DEFAULT_EPK_SECTIONS_ORDER.forEach(id => {
    if (!baseOrder.includes(id)) {
      baseOrder.push(id);
    }
  });

  return baseOrder
    .filter(id => id in EPK_SECTIONS_META)
    .map(id => ({
      id,
      meta: EPK_SECTIONS_META[id],
      isVisible: !hiddenSections.has(id)
    }));
}

export interface EPKThemeStyles {
  pageBg: string;
  topBar: string;
  topBarBtn: string;
  heroNoPhoto: string;
  heroOverlay: string;
  heroTitleClass: string;
  heroTitleStyle?: React.CSSProperties;
  heroSubtitle: string;
  sectionHeadingClass: string;
  sectionHeadingStyle?: React.CSSProperties;
  card: string;
  cardHighlight: string;
  statNumber: string;
  badge: string;
  accentBtn: string;
  accentBtnSubtle: string;
  accentText: string;
  bookingCard: string;
  bookingTitle: string;
  memberRole: string;
  memberCard: string;
  quoteIcon: string;
  quoteMedium: string;
  footer: string;
  stickyPlayer: string;
}

export function getTemplateStyles(templateId?: EPKTemplateId): EPKThemeStyles {
  switch (templateId) {
    case 'minimal':
      return {
        pageBg: 'bg-[#f8f8f6] text-stone-900 selection:bg-stone-900 selection:text-white',
        topBar: 'bg-white/95 border-stone-200 text-stone-900 shadow-xs',
        topBarBtn: 'bg-stone-100 hover:bg-stone-200 text-stone-800 border-stone-300',
        heroNoPhoto: 'bg-gradient-to-b from-stone-200 via-stone-100 to-[#f8f8f6]',
        heroOverlay: 'bg-gradient-to-t from-[#f8f8f6] via-[#f8f8f6]/85 to-[#f8f8f6]/40',
        heroTitleClass: 'text-stone-950 leading-[0.92] tracking-normal font-serif text-[13vw] sm:text-[6rem] lg:text-[7.5rem] font-bold',
        heroTitleStyle: { fontFamily: "'Playfair Display', Georgia, serif" },
        heroSubtitle: 'text-stone-600 font-serif italic',
        sectionHeadingClass: 'text-stone-950 border-b border-stone-300 pb-4 font-serif font-bold tracking-normal',
        sectionHeadingStyle: { fontFamily: "'Playfair Display', Georgia, serif" },
        card: 'bg-white border-stone-200/90 shadow-xs text-stone-800',
        cardHighlight: 'bg-white border-stone-300 shadow-xs hover:border-stone-400 text-stone-900',
        statNumber: 'text-stone-900 font-serif font-bold',
        badge: 'bg-stone-100 text-stone-800 border-stone-300 font-serif',
        accentBtn: 'bg-stone-900 hover:bg-stone-800 text-white font-semibold shadow-xs',
        accentBtnSubtle: 'bg-stone-100 text-stone-900 border-stone-300 hover:bg-stone-200',
        accentText: 'text-stone-900',
        bookingCard: 'bg-stone-100 border-stone-300 shadow-xs',
        bookingTitle: 'text-stone-950 font-serif font-bold',
        memberRole: 'text-stone-600 font-serif italic',
        memberCard: 'bg-white border-stone-200 shadow-xs',
        quoteIcon: 'text-stone-400',
        quoteMedium: 'text-stone-900 font-serif font-bold',
        footer: 'text-stone-500 border-stone-300',
        stickyPlayer: 'bg-white/95 border-stone-300 text-stone-900 shadow-xl'
      };

    case 'neon':
      return {
        pageBg: 'bg-[#090713] text-purple-100 selection:bg-fuchsia-500 selection:text-white',
        topBar: 'bg-[#110d24]/90 border-fuchsia-900/50 text-purple-100 shadow-lg',
        topBarBtn: 'bg-[#181335] hover:bg-[#231b4d] text-purple-200 border-purple-800/60',
        heroNoPhoto: 'bg-gradient-to-br from-[#1b0e3d] via-[#090713] to-[#041d33]/50',
        heroOverlay: 'bg-gradient-to-t from-[#090713] via-[#090713]/85 to-[#090713]/50',
        heroTitleClass: 'text-white uppercase leading-[0.88] tracking-widest text-[14vw] sm:text-[6.5rem] lg:text-[8rem] font-black drop-shadow-[0_0_25px_rgba(217,70,239,0.35)]',
        heroTitleStyle: { fontFamily: "'Space Grotesk', system-ui, sans-serif" },
        heroSubtitle: 'text-cyan-300 font-mono tracking-wider',
        sectionHeadingClass: 'text-white uppercase tracking-wider border-b border-fuchsia-900/60 pb-4',
        sectionHeadingStyle: { fontFamily: "'Space Grotesk', system-ui, sans-serif" },
        card: 'bg-[#120e24] border-purple-900/50 text-purple-100',
        cardHighlight: 'bg-[#161030] border-fuchsia-500/30 shadow-[0_0_20px_rgba(217,70,239,0.1)] hover:border-fuchsia-400/50',
        statNumber: 'text-cyan-400 font-mono drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]',
        badge: 'bg-fuchsia-500/20 text-fuchsia-300 border-fuchsia-500/40',
        accentBtn: 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-bold shadow-[0_0_20px_rgba(217,70,239,0.4)]',
        accentBtnSubtle: 'bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/40 hover:bg-fuchsia-500/25',
        accentText: 'text-fuchsia-400',
        bookingCard: 'bg-[#171133] border-fuchsia-500/40 text-purple-100 shadow-[0_0_25px_rgba(217,70,239,0.12)]',
        bookingTitle: 'text-fuchsia-300 font-bold',
        memberRole: 'text-cyan-400 font-mono',
        memberCard: 'bg-[#120e24] border-purple-900/50',
        quoteIcon: 'text-fuchsia-500/40',
        quoteMedium: 'text-cyan-400',
        footer: 'text-purple-400/60 border-purple-900/60',
        stickyPlayer: 'bg-[#110d24]/95 border-fuchsia-500/40 text-purple-100 shadow-2xl'
      };

    case 'vintage':
      return {
        pageBg: 'bg-[#171310] text-amber-50 selection:bg-orange-600 selection:text-white',
        topBar: 'bg-[#201a15]/95 border-amber-900/40 text-amber-100 shadow-md',
        topBarBtn: 'bg-[#2b221c] hover:bg-[#382d25] text-amber-200 border-amber-800/40',
        heroNoPhoto: 'bg-gradient-to-br from-[#2e2119] via-[#171310] to-[#120d0b]',
        heroOverlay: 'bg-gradient-to-t from-[#171310] via-[#171310]/85 to-[#171310]/50',
        heroTitleClass: 'text-amber-100 uppercase leading-[0.9] tracking-wider text-[14vw] sm:text-[6.5rem] lg:text-[8rem] font-black',
        heroTitleStyle: { fontFamily: "'Courier New', Georgia, serif" },
        heroSubtitle: 'text-orange-300 font-mono',
        sectionHeadingClass: 'text-amber-100 uppercase tracking-wider border-b border-amber-900/50 pb-4',
        sectionHeadingStyle: { fontFamily: "'Courier New', Georgia, serif" },
        card: 'bg-[#201a16] border-amber-900/40 text-amber-100 shadow-md',
        cardHighlight: 'bg-[#261e19] border-orange-700/35 text-amber-100 hover:border-orange-600/50',
        statNumber: 'text-orange-400 font-mono',
        badge: 'bg-orange-950/60 text-orange-300 border-orange-800/60',
        accentBtn: 'bg-orange-600 hover:bg-orange-500 text-stone-950 font-bold shadow-md',
        accentBtnSubtle: 'bg-orange-600/15 text-orange-300 border-orange-600/40 hover:bg-orange-600/25',
        accentText: 'text-orange-400',
        bookingCard: 'bg-[#261f1a] border-orange-800/40 text-amber-100 shadow-md',
        bookingTitle: 'text-orange-400 font-bold',
        memberRole: 'text-amber-400/90 font-mono',
        memberCard: 'bg-[#201a16] border-amber-900/40',
        quoteIcon: 'text-orange-500/40',
        quoteMedium: 'text-orange-400 font-mono',
        footer: 'text-amber-600/70 border-amber-900/40',
        stickyPlayer: 'bg-[#201a16]/95 border-orange-700/40 text-amber-100 shadow-2xl'
      };

    case 'stage':
    default:
      return {
        pageBg: 'bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950',
        topBar: 'bg-slate-900/90 border-slate-800/80 text-slate-100',
        topBarBtn: 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700',
        heroNoPhoto: 'bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/30',
        heroOverlay: 'bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/50',
        heroTitleClass: 'text-white uppercase leading-[0.88] tracking-tight text-[15vw] sm:text-[7rem] lg:text-[9rem]',
        heroTitleStyle: { fontFamily: "'Anton', 'Oswald', sans-serif" },
        heroSubtitle: 'text-amber-300',
        sectionHeadingClass: 'text-white uppercase tracking-wide border-b border-slate-800/80 pb-4',
        sectionHeadingStyle: { fontFamily: "'Anton', 'Oswald', sans-serif" },
        card: 'bg-slate-950 border-slate-800',
        cardHighlight: 'bg-slate-900/90 border-amber-500/20 shadow-lg hover:border-amber-500/40',
        statNumber: 'text-amber-400 font-mono',
        badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
        accentBtn: 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg',
        accentBtnSubtle: 'bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25',
        accentText: 'text-amber-400',
        bookingCard: 'bg-amber-500/10 border-amber-500/30',
        bookingTitle: 'text-amber-400',
        memberRole: 'text-amber-400/90',
        memberCard: 'bg-slate-950 border-slate-800',
        quoteIcon: 'text-amber-500/40',
        quoteMedium: 'text-amber-400',
        footer: 'text-slate-500 border-slate-800',
        stickyPlayer: 'bg-slate-900/95 border-amber-500/40 text-white'
      };
  }
}
