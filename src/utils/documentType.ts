// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

// Detecta el tipo de un documento subido (estructura de canción) por su nombre o URL, para
// decidir cómo previsualizarlo: como imagen, como PDF embebido, o con un enlace de descarga
// cuando no se puede mostrar inline (Word).

export function isImageDocument(name?: string, url?: string): boolean {
  const target = (name || url || '').toLowerCase();
  return /\.(jpe?g|png|webp|gif)(\?|$)/.test(target);
}

export function isPdfDocument(name?: string, url?: string): boolean {
  const target = (name || url || '').toLowerCase();
  return /\.pdf(\?|$)/.test(target);
}
