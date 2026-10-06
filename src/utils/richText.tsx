// © 2026 Diego de la Calle Berzal (DiegoCalleB) — BandManager.io. All rights reserved.
// Source-Available License v1.0 (see LICENSE): non-commercial use only; no copying, derivatives or AI training.

import React from 'react';

/**
 * Renderiza texto con **negrita** simple (sin más markdown) como <strong>.
 * Pensado para frases cortas de traducciones, no para contenido arbitrario.
 */
export function renderBold(text: string): React.ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? <strong key={i} className="text-white">{part}</strong> : part
  );
}
