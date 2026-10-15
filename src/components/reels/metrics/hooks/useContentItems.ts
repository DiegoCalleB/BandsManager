/**
 * Contenido publicado de la banda para cruzarlo con las métricas.
 * Extraído de ReelsMetricsView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { api } from "../../../../services/api";
import { SocialContentItem } from "../../../../types";

/**
 * Contenido publicado de la banda para cruzarlo con las métricas.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useContentItems() {
  const [contentItems, setContentItems] = useState<SocialContentItem[]>([]);

  const [, setIsLoadingContent] = useState(false);

  // Load indexed content items from Supabase
  const loadContentItems = async () => {
    try {
      setIsLoadingContent(true);
      const items = await api.getSocialContentItems();
      if (items && items.length > 0) {
        setContentItems(items);
      }
    } catch (err) {
      console.warn("Could not load content items:", err);
    } finally {
      setIsLoadingContent(false);
    }
  };

  return { loadContentItems, contentItems };
}
