/**
 * Centro de Reels: pipeline de contenido y analizador de vídeo con IA.
 * Orquesta controlador, contexto y maqueta; la lógica vive en `reels_center/` (AGENTS.md §5.6).
 */
import type { SocialPost, ThemeColors } from "../types";
import type { HighlightClip, OptimalTime, ReelCard } from "../utils/reelsUtils";
import { useReelsCenterController } from "./reels_center/hooks/useReelsCenterController";
import { ReelsCenterLayout } from "./reels_center/ReelsCenterLayout";
import { ReelsCenterProvider } from "./reels_center/ReelsCenterProvider";
import type { YoutubeVideoMeta } from "./reels_center/reelsHelpers";

export type { HighlightClip,OptimalTime,ReelCard,YoutubeVideoMeta };

interface ReelsCenterProps {
  colors: ThemeColors;
  posts: SocialPost[];
  onAddPost: (post: SocialPost) => Promise<void>;
  onUpdatePost: (id: string, updatedFields: Partial<SocialPost>) => Promise<void>;
  bandName?: string;
  instagramHandle?: string;
  /** El backend ya rastrea Instagram, TikTok, YouTube y Facebook: basta con tener uno configurado. */
  hasAnySocialLink?: boolean;
}

/**
 * Pantalla "Medios": gestiona el pipeline de reels y extrae highlights de vídeos con IA.
 * @param props Tema, publicaciones y callbacks de persistencia de la banda activa.
 * @returns La pantalla completa con su contexto.
 */
export default function ReelsCenter({
  colors,
  posts = [],
  onAddPost,
  onUpdatePost,
  bandName,
  instagramHandle,
  hasAnySocialLink,
}: ReelsCenterProps) {
  const controller = useReelsCenterController({
    bandName,
    instagramHandle,
    hasAnySocialLink,
    onAddPost,
    posts,
  });

  return (
    <ReelsCenterProvider
      value={{ ...controller, colors, posts, onAddPost, onUpdatePost, bandName, instagramHandle, hasAnySocialLink }}
    >
      <ReelsCenterLayout />
    </ReelsCenterProvider>
  );
}
