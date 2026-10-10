/**
 * Iconos, etiquetas y colores por categoría de artículo de merchandising.
 */
import { Disc3,Music,Shirt,ShoppingBag,Tag } from "lucide-react";
import React from "react";
import type { MerchBoloItem } from "../../../../types";

/** Presentación de cada categoría de merchandising. */
export const MERCH_CATEGORY_ICONS: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  camisetas: {
    icon: <Shirt className="w-3.5 h-3.5" />,
    label: 'Camisetas',
    color: 'text-[var(--ink)] bg-[var(--acc)]/15',
  },
  vinilos: {
    icon: <Disc3 className="w-3.5 h-3.5" />,
    label: 'Vinilos',
    color: 'text-[var(--ink)] bg-[var(--acc)]/15',
  },
  musica: {
    icon: <Music className="w-3.5 h-3.5" />,
    label: 'Música (CD/Tape)',
    color: 'text-[var(--ink)] bg-[var(--acc)]/15',
  },
  accesorios: {
    icon: <Tag className="w-3.5 h-3.5" />,
    label: 'Accesorios & Púas',
    color: 'text-[var(--ink)] bg-[var(--ok)]/15',
  },
  otro: {
    icon: <ShoppingBag className="w-3.5 h-3.5" />,
    label: 'Otro',
    color: 'text-[var(--ink)] bg-[var(--alert)]/15',
  },
};

/** Categoría de un artículo de merchandising del bolo. */
export type MerchCategoria = NonNullable<MerchBoloItem["categoria"]>;
