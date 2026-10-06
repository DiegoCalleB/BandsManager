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
