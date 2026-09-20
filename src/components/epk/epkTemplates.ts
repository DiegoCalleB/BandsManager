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
 bg: 'bg-[var(--bg)]',
 cardBg: 'bg-[var(--bg)]',
 accent: 'bg-[var(--acc)]',
 text: 'text-[var(--acc)]/80',
 pill: 'bg-[var(--acc)]/20 text-[var(--acc)]/80'
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
 cardBg: 'bg-[var(--surface)]',
 accent: 'bg-[var(--bg)]',
 text: 'text-[var(--ink)]',
 pill: 'bg-[var(--sunken)]/80 text-[var(--ink)]'
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
 accent: 'bg-[var(--tentative)]',
 text: 'text-[var(--tentative)]/80',
 pill: 'bg-[var(--tentative)]/20 text-[var(--tentative)]/80'
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
 accent: 'bg-[var(--acc)]',
 text: 'text-[var(--acc)]/80',
 pill: 'bg-[var(--accent-alt)]/10/60 text-[var(--acc)]/80'
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
 pageBg: 'bg-[#f8f8f6] text-[var(--ink)] selection:bg-[var(--bg)] selection:text-[var(--ink)]',
 topBar: 'bg-[var(--surface)]/95 border-[var(--hair)] text-[var(--ink)]',
 topBarBtn: 'bg-[var(--sunken)] hover:bg-[var(--sunken)]/80 text-[var(--ink)] border-[var(--hair)]',
 heroNoPhoto: 'bg-gradient-to-b from-stone-200 via-stone-100 to-[#f8f8f6]',
 heroOverlay: 'bg-gradient-to-t from-[#f8f8f6] via-[#f8f8f6]/85 to-[#f8f8f6]/40',
 heroTitleClass: 'text-[var(--ink)] leading-[0.92] tracking-normal font-serif text-[13vw] sm:text-[6rem] lg:text-[7.5rem] font-bold',
 heroTitleStyle: { fontFamily: "'Playfair Display', Georgia, serif" },
 heroSubtitle: 'text-[var(--ink-3)] font-serif italic',
 sectionHeadingClass: 'text-[var(--ink)] border-b border-[var(--hair)] pb-4 font-serif font-bold tracking-normal',
 sectionHeadingStyle: { fontFamily: "'Playfair Display', Georgia, serif" },
 card: 'bg-[var(--surface)] border-[var(--hair)]/90 text-[var(--ink)]',
 cardHighlight: 'bg-[var(--surface)] border-[var(--hair)] hover:border-[var(--hair)] text-[var(--ink)]',
 statNumber: 'text-[var(--ink)] font-serif font-bold',
 badge: 'bg-[var(--sunken)] text-[var(--ink)] border-[var(--hair)] font-serif',
 accentBtn: 'bg-[var(--bg)] hover:bg-[var(--sunken)] text-[var(--ink)] font-semibold',
 accentBtnSubtle: 'bg-[var(--sunken)] text-[var(--ink)] border-[var(--hair)] hover:bg-[var(--sunken)]/80',
 accentText: 'text-[var(--ink)]',
 bookingCard: 'bg-[var(--sunken)] border-[var(--hair)]',
 bookingTitle: 'text-[var(--ink)] font-serif font-bold',
 memberRole: 'text-[var(--ink-3)] font-serif italic',
 memberCard: 'bg-[var(--surface)] border-[var(--hair)]',
 quoteIcon: 'text-[var(--ink-2)]',
 quoteMedium: 'text-[var(--ink)] font-serif font-bold',
 footer: 'text-[var(--ink-2)] border-[var(--hair)]',
 stickyPlayer: 'bg-[var(--surface)]/95 border-[var(--hair)] text-[var(--ink)]'
 };

 case 'neon':
 return {
 pageBg: 'bg-[#090713] text-[var(--tentative)]/20 selection:bg-[var(--tentative)]/80 selection:text-[var(--ink)]',
 topBar: 'bg-[#110d24]/90 border-[var(--tentative)]/20 text-[var(--tentative)]/20',
 topBarBtn: 'bg-[#181335] hover:bg-[#231b4d] text-[var(--tentative)]/40 border-[var(--tentative)]/40',
 heroNoPhoto: 'bg-gradient-to-br from-[#1b0e3d] via-[#090713] to-[#041d33]/50',
 heroOverlay: 'bg-gradient-to-t from-[#090713] via-[#090713]/85 to-[#090713]/50',
 heroTitleClass: 'text-[var(--ink)] leading-[0.88] tracking-widest text-[14vw] sm:text-[6.5rem] lg:text-[8rem] font-black drop-shadow-[0_0_25px_rgba(217,70,239,0.35)]',
 heroTitleStyle: { fontFamily: "'Space Grotesk', system-ui, sans-serif" },
 heroSubtitle: 'text-[var(--acc)]/80 font-sans tracking-wider',
 sectionHeadingClass: 'text-[var(--ink)] tracking-wider border-b border-[var(--hair)] pb-4',
 sectionHeadingStyle: { fontFamily: "'Space Grotesk', system-ui, sans-serif" },
 card: 'bg-[#120e24] border-[var(--tentative)]/20 text-[var(--tentative)]/20',
 cardHighlight: 'bg-[#161030] border-[var(--tentative)]/30 hover:border-[var(--tentative)]/80/50',
 statNumber: 'text-[var(--acc)]/80 font-sans drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]',
 badge: 'bg-[var(--tentative)]/20 text-[var(--tentative)]/80 border-[var(--tentative)]/40',
 accentBtn: 'bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--ink)] font-bold',
 accentBtnSubtle: 'bg-[var(--tentative)]/15 text-[var(--tentative)]/80 border-[var(--tentative)]/40 hover:bg-[var(--tentative)]/25',
 accentText: 'text-[var(--tentative)]/80',
 bookingCard: 'bg-[#171133] border-[var(--tentative)]/40 text-[var(--tentative)]/20',
 bookingTitle: 'text-[var(--tentative)]/80 font-bold',
 memberRole: 'text-[var(--acc)]/80 font-sans',
 memberCard: 'bg-[#120e24] border-[var(--hair)]',
 quoteIcon: 'text-[var(--tentative)]/40',
 quoteMedium: 'text-[var(--acc)]/80',
 footer: 'text-[var(--tentative)]/60 border-[var(--hair)]',
 stickyPlayer: 'bg-[#110d24]/95 border-[var(--tentative)]/40 text-[var(--tentative)]/20'
 };

 case 'vintage':
 return {
 pageBg: 'bg-[#171310] text-amber-50 selection:bg-[var(--acc)] selection:text-[var(--ink)]',
 topBar: 'bg-[#201a15]/95 border-[var(--hair)]/40 text-[var(--ink)]',
 topBarBtn: 'bg-[#2b221c] hover:bg-[#382d25] text-[var(--ink-2)] border-[var(--hair)]/40',
 heroNoPhoto: 'bg-gradient-to-br from-[#2e2119] via-[#171310] to-[#120d0b]',
 heroOverlay: 'bg-gradient-to-t from-[#171310] via-[#171310]/85 to-[#171310]/50',
 heroTitleClass: 'text-[var(--ink)] leading-[0.9] tracking-wider text-[14vw] sm:text-[6.5rem] lg:text-[8rem] font-black',
 heroTitleStyle: { fontFamily: "'Courier New', Georgia, serif" },
 heroSubtitle: 'text-[var(--acc)]/80 font-sans',
 sectionHeadingClass: 'text-[var(--ink)] tracking-wider border-b border-[var(--hair)]/50 pb-4',
 sectionHeadingStyle: { fontFamily: "'Courier New', Georgia, serif" },
 card: 'bg-[#201a16] border-[var(--hair)]/40 text-[var(--ink)]',
 cardHighlight: 'bg-[#261e19] border-[var(--hair)] text-[var(--ink)] hover:border-[var(--hair)]',
 statNumber: 'text-[var(--acc)]/80 font-sans',
 badge: 'bg-[var(--accent-alt)]/10/60 text-[var(--acc)]/80 border-[var(--hair)]',
 accentBtn: 'bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--ink)] font-bold',
 accentBtnSubtle: 'bg-[var(--acc)]/15 text-[var(--acc)]/80 border-[var(--hair)] hover:bg-[var(--acc)]/25',
 accentText: 'text-[var(--acc)]/80',
 bookingCard: 'bg-[#261f1a] border-[var(--hair)] text-[var(--ink)]',
 bookingTitle: 'text-[var(--acc)]/80 font-bold',
 memberRole: 'text-[var(--acc)]/80/90 font-sans',
 memberCard: 'bg-[#201a16] border-[var(--hair)]/40',
 quoteIcon: 'text-[var(--accent-alt)]/40',
 quoteMedium: 'text-[var(--acc)]/80 font-sans',
 footer: 'text-[var(--accent-alt)]/70 border-[var(--hair)]/40',
 stickyPlayer: 'bg-[#201a16]/95 border-[var(--hair)] text-[var(--ink)]'
 };

 case 'stage':
 default:
 return {
 pageBg: 'bg-[var(--bg)] text-[var(--ink)] selection:bg-[var(--acc)] selection:text-[var(--ink)]',
 topBar: 'bg-[var(--bg)]/90 border-[var(--hair)]/80 text-[var(--ink)]',
 topBarBtn: 'bg-[var(--ink)]/40 hover:bg-[var(--ink-2)]/40 text-[var(--ink)]/80 border-[var(--hair)]',
 heroNoPhoto: 'bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/30',
 heroOverlay: 'bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/50',
 heroTitleClass: 'text-[var(--ink)] leading-[0.88] tracking-tight text-[15vw] sm:text-[7rem] lg:text-[9rem]',
 heroTitleStyle: { fontFamily: "'Anton', 'Oswald', sans-serif" },
 heroSubtitle: 'text-[var(--ink-2)]',
 sectionHeadingClass: 'text-[var(--ink)] tracking-wide border-b border-[var(--hair)]/80 pb-4',
 sectionHeadingStyle: { fontFamily: "'Anton', 'Oswald', sans-serif" },
 card: 'bg-[var(--bg)] border-[var(--hair)]',
 cardHighlight: 'bg-[var(--bg)]/90 border-[var(--hair)] hover:border-[var(--hair)]',
 statNumber: 'text-[var(--acc)]/80 font-sans',
 badge: 'bg-[var(--acc)]/20 text-[var(--acc)]/80 border-[var(--hair)]',
 accentBtn: 'bg-[var(--acc)] hover:bg-[var(--acc)]/80 text-[var(--ink)] font-bold',
 accentBtnSubtle: 'bg-[var(--acc)]/15 text-[var(--ink-2)] border-[var(--hair)] hover:bg-[var(--acc)]/25',
 accentText: 'text-[var(--acc)]/80',
 bookingCard: 'bg-[var(--acc)]/10 border-[var(--hair)]',
 bookingTitle: 'text-[var(--acc)]/80',
 memberRole: 'text-[var(--acc)]/80/90',
 memberCard: 'bg-[var(--bg)] border-[var(--hair)]',
 quoteIcon: 'text-[var(--acc)]/40',
 quoteMedium: 'text-[var(--acc)]/80',
 footer: 'text-[var(--ink-2)] border-[var(--hair)]',
 stickyPlayer: 'bg-[var(--bg)]/95 border-[var(--hair)] text-[var(--ink)]'
 };
 }
}
