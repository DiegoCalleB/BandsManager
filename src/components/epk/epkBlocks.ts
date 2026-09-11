import React from 'react';
import {
  Palette,
  FileText,
  FileDown,
  Music,
  BarChart3,
  Globe,
  AtSign,
  QrCode,
  Eye
} from 'lucide-react';
import { EPKConfig } from '../../types';
import { tieneTraduccion } from '../../utils/epkTraducciones';

export type EPKBlockId = 'plantillas' | 'perfil' | 'archivos' | 'musica' | 'prensa' | 'donaciones' | 'firma' | 'qr' | 'todos';

export interface EPKBlockMeta {
  id: EPKBlockId;
  label: string;
  shortLabel: string;
  number?: number;
  icon: React.ElementType;
  description: string;
}

export const EPK_BLOCKS: EPKBlockMeta[] = [
  {
    id: 'plantillas',
    label: 'Plantillas & Diseño',
    shortLabel: 'Plantillas',
    number: 1,
    icon: Palette,
    description: 'Elige la plantilla visual (Escenario Rock, Minimalista Claro, Club Neón, Vintage Analógico) y reorganiza el orden de las secciones del dossier.'
  },
  {
    id: 'perfil',
    label: 'Perfil & Bio',
    shortLabel: 'Perfil',
    number: 2,
    icon: FileText,
    description: 'Biografía oficial, trayectoria de la banda, formación de integrantes y datos de contacto de booking.'
  },
  {
    id: 'archivos',
    label: 'Media Kit & PDFs',
    shortLabel: 'Archivos',
    number: 3,
    icon: FileDown,
    description: 'Logo oficial en alta resolución, dossier PDF descargable, rider técnico y galería de fotos de prensa.'
  },
  {
    id: 'musica',
    label: 'Música & Directo',
    shortLabel: 'Música',
    number: 4,
    icon: Music,
    description: 'Adelanto en audio preview para fans, selección de temas destacados, vídeos de conciertos y logística de gira.'
  },
  {
    id: 'prensa',
    label: 'Social Proof & Prensa',
    shortLabel: 'Prensa',
    number: 5,
    icon: BarChart3,
    description: 'Cifras clave de impacto (oyentes Spotify, seguidores en redes, conciertos) y reseñas en medios musicales.'
  },
  {
    id: 'donaciones',
    label: 'Donaciones & Idiomas',
    shortLabel: 'Donaciones',
    number: 6,
    icon: Globe,
    description: 'Canales de aportación directa de fans (Revolut, PayPal) y traducción automática del dossier a 7 idiomas.'
  },
  {
    id: 'firma',
    label: 'Firma de Email',
    shortLabel: 'Firma',
    number: 7,
    icon: AtSign,
    description: 'Generador de firma HTML profesional con enlaces a redes sociales y reproductor de audio.'
  },
  {
    id: 'qr',
    label: 'Código QR',
    shortLabel: 'QR',
    number: 8,
    icon: QrCode,
    description: 'Código QR de acceso instantáneo al EPK público para cartelería física, tarjetas y flyers.'
  },
  {
    id: 'todos',
    label: 'Ver Todo el Dossier',
    shortLabel: 'Ver Todo',
    icon: Eye,
    description: 'Vista secuencial completa de todos los bloques del dossier organizada con divisores limpios.'
  }
];

export interface EPKHealthStats {
  hasLogo: boolean;
  hasBio: boolean;
  hasDossier: boolean;
  hasRider: boolean;
  numMiembros: number;
  numTemas: number;
  numTraducciones: number;
  numFotos: number;
  numVideos: number;
}

export function computeEPKHealth(config: EPKConfig): EPKHealthStats {
  const hasLogo = Boolean(config.logoUrl && config.logoUrl.trim().length > 0);
  const hasBio = Boolean(config.biografia && config.biografia.trim().length >= 80);
  const hasDossier = Boolean(config.dossierPdfUrl && config.dossierPdfUrl.trim().length > 0);
  const hasRider = Boolean(
    (config.riderPdfUrl && config.riderPdfUrl.trim().length > 0) ||
    (config.riderTecnico && config.riderTecnico.trim().length >= 40)
  );
  const numMiembros = config.miembros?.length || 0;
  const numTemas = (config.temasDestacadosIds?.length || 0) + (config.audioPreview?.audioUrl ? 1 : 0);
  const numTraducciones = Object.keys(config.traducciones || {}).filter(k => tieneTraduccion(config, k)).length;
  const numFotos = config.bandPhotos?.length || 0;
  const numVideos = config.videos?.length || 0;

  return {
    hasLogo,
    hasBio,
    hasDossier,
    hasRider,
    numMiembros,
    numTemas,
    numTraducciones,
    numFotos,
    numVideos
  };
}

export function getBlockNavigation(currentBlock: EPKBlockId): {
  prev: EPKBlockMeta | null;
  next: EPKBlockMeta | null;
} {
  const sequence: EPKBlockId[] = ['plantillas', 'perfil', 'archivos', 'musica', 'prensa', 'donaciones', 'firma', 'qr'];
  const idx = sequence.indexOf(currentBlock);

  const prev = idx > 0 ? EPK_BLOCKS.find(b => b.id === sequence[idx - 1]) || null : null;
  const next = idx >= 0 && idx < sequence.length - 1 ? EPK_BLOCKS.find(b => b.id === sequence[idx + 1]) || null : null;

  return { prev, next };
}

export const UNIFIED_PLATFORMS = [
  { key: 'spotify', label: 'Spotify', icon: '🟢', placeholder: 'https://open.spotify.com/artist/...' },
  { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/...' },
  { key: 'youtube', label: 'YouTube', icon: '🔴', placeholder: 'https://youtube.com/...' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: 'https://tiktok.com/@...' },
  { key: 'appleMusic', label: 'Apple Music', icon: '🍎', placeholder: 'https://music.apple.com/...' },
  { key: 'bandcamp', label: 'Bandcamp', icon: '⛺', placeholder: 'https://tubanda.bandcamp.com' },
  { key: 'website', label: 'Sitio Web Oficial', icon: '🌐', placeholder: 'https://www.tubanda.com' },
  { key: 'facebook', label: 'Facebook', icon: '📘', placeholder: 'https://facebook.com/...' },
  { key: 'twitter', label: 'X / Twitter', icon: '🐦', placeholder: 'https://x.com/...' }
];
