/**
 * Constantes de presentación del Centro de Reels: iconos de interacción por red.
 * Separadas del componente para que la vista y los tests las importen sin arrastrar el estado.
 */
import { Bookmark, Heart, MessageCircle, Share2, ThumbsUp } from "lucide-react";

// Qué iconos de interacción tapan el lateral derecho del vídeo en cada red: no es solo el
// copy lo que cambia por plataforma, la propia UI de la app también se come parte del encuadre
// de forma distinta (Instagram añade guardar, YouTube separa like/dislike, etc.), así que un
// hookText o un subtítulo pegado al borde derecho puede quedar tapado en una red y no en otra.
export const PLATFORM_UI_ICONS: Record<
  "Instagram" | "TikTok" | "YouTube" | "Facebook",
  (typeof Heart)[]
> = {
  Instagram: [Heart, MessageCircle, Share2, Bookmark],
  TikTok: [Heart, MessageCircle, Bookmark, Share2],
  YouTube: [ThumbsUp, MessageCircle, Share2],
  Facebook: [ThumbsUp, MessageCircle, Share2],
};
