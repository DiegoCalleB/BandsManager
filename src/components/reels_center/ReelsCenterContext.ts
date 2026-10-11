/**
 * Contexto del Centro de Reels: reparte el estado y las acciones del controlador a las vistas.
 * Existe para que cada vista lea solo lo que usa, sin encadenar decenas de props desde la pantalla.
 */
import { createContext, useContext } from 'react';
import type { SocialPost, ThemeColors } from '../../types';
import type { useReelsCenterController } from './hooks/useReelsCenterController';

/** Todo lo que expone el controlador (inferido de su retorno, siempre sincronizado). */
export type ReelsCenterController = ReturnType<typeof useReelsCenterController>;

/** Props de la pantalla que las vistas también necesitan. */
export interface ReelsCenterHostProps {
  colors: ThemeColors;
  posts: SocialPost[];
  onAddPost: (post: SocialPost) => Promise<void>;
  onUpdatePost: (id: string, updatedFields: Partial<SocialPost>) => Promise<void>;
  bandName?: string;
  instagramHandle?: string;
  hasAnySocialLink?: boolean;
}

/** Valor del contexto: controlador + props de la pantalla. */
export type ReelsCenterContextValue = ReelsCenterController & ReelsCenterHostProps;

export const ReelsCenterContext = createContext<ReelsCenterContextValue | null>(null);

/**
 * Lee el contexto del Centro de Reels.
 * @returns El valor del contexto.
 * @throws Error si se usa fuera de {@link ReelsCenterProvider} (error de programación, falla rápido).
 */
export function useReelsCenter(): ReelsCenterContextValue {
  const value = useContext(ReelsCenterContext);
  if (!value) throw new Error('useReelsCenter debe usarse dentro de <ReelsCenterProvider>');
  return value;
}
