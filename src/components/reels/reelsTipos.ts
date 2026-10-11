/**
 * Tipos compartidos por las vistas del Centro de Reels (teatro, móvil de vista previa).
 */

/** Redes para las que se prepara y programa un reel. */
export type PlataformaReel = 'Instagram' | 'TikTok' | 'YouTube' | 'Facebook';

/** Palabra de la transcripción con su instante de inicio y fin (segundos), para el karaoke. */
export interface PalabraTemporizada {
  word: string;
  start: number;
  end: number;
}
