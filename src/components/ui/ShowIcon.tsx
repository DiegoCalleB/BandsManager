import React from 'react';
import {
  Mic, Megaphone, Drum, Guitar, Wrench, MessageCircle, Pause, Bomb, Pin, Zap, Circle,
  type LucideIcon,
} from 'lucide-react';

/**
 * Los elementos del show (chapa, presentación, bis…) se guardan con un emoji como
 * «icono». La interfaz no muestra emojis (craft-interfaces §6): esta tabla los
 * traduce a un icono Lucide del mismo trazo que el resto. Un emoji desconocido
 * cae en un punto neutro, nunca se pinta tal cual.
 */
const POR_EMOJI: Record<string, LucideIcon> = {
  '🎤': Mic,
  '🗣️': Megaphone,
  '🗣': Megaphone,
  '🥁': Drum,
  '🎸': Guitar,
  '🔧': Wrench,
  '💬': MessageCircle,
  '⏸️': Pause,
  '⏸': Pause,
  '💣': Bomb,
  '📌': Pin,
  '⚡': Zap,
};

export function ShowIcon({ emoji, className = 'size-4' }: { emoji?: string | null; className?: string }) {
  const Icon = (emoji && POR_EMOJI[emoji.trim()]) || Circle;
  return <Icon className={className} aria-hidden="true" />;
}
