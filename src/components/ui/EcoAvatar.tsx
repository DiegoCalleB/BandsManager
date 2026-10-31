import React from 'react';

export interface EcoAvatarProps {
  /** Tamaño y márgenes con utilidades de Tailwind (por defecto, el de un icono pequeño). */
  className?: string;
}

/**
 * Cara de Eco, la mascota de BandManager: sustituye al icono genérico en el agente de IA
 * (botón flotante, cabecera del chat y avatar de cada respuesta). Es decorativa: el significado
 * lo lleva el texto o el `aria-label` del botón que la contiene.
 */
export const EcoAvatar: React.FC<EcoAvatarProps> = ({ className = 'size-5' }) => (
  <img
    src="/eco-avatar.webp"
    alt=""
    width={192}
    height={192}
    draggable={false}
    aria-hidden
    className={`${className} shrink-0 select-none object-contain`}
  />
);
