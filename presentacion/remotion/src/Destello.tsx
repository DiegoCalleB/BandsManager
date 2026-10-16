import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

// Destello de luz de película (light leak): bandas cálidas que entran por el borde del fotograma, lo cruzan y se funden,
// con un núcleo casi blanco pegado al borde y una veta magenta en diagonal. Mezcladas en «screen».
// Todo con CSS: no necesita WebGL y cada fotograma sale idéntico.
export const Destello: React.FC<{ centro: number; semilla?: number }> = ({ centro, semilla = 0 }) => {
  const { fps } = useVideoConfig();
  const t = useCurrentFrame() / fps;
  const a = centro - 0.3, dur = 1.7; // empieza un poco antes del corte
  const p = (t - a) / dur;
  if (p <= 0 || p >= 1) return null;
  const sube = Math.sin(Math.PI * Math.min(1, p * 1.08)) ** 1.4; // sube rápido, se queda y baja suave
  const e = p * p * (3 - 2 * p);
  const dir = semilla % 2 === 0 ? 1 : -1; // alterna el borde por el que entra
  const x = (e - 0.5) * 34 * dir; // desplazamiento horizontal, en %
  const banda = (w: number, left: number, fondo: string, dx: number, skew: number, blur: number): React.CSSProperties => ({
    position: 'absolute', top: '-15%', height: '130%', width: `${w}%`, left: `${left}%`, background: fondo,
    transform: `translateX(${x * dx}%) skewX(${skew}deg)`, filter: `blur(${blur}px)`,
  });
  const g = dir === 1 ? '90deg' : '270deg';
  return (
    <AbsoluteFill style={{ mixBlendMode: 'screen', opacity: 0.95 * sube, pointerEvents: 'none', overflow: 'hidden' }}>
      {/* banda ancha naranja-roja pegada al borde */}
      <div style={banda(62, dir === 1 ? -8 : 46, `linear-gradient(${g}, rgba(255,214,150,1) 0%, rgba(255,140,40,.95) 10%, rgba(255,70,25,.7) 34%, rgba(220,30,60,.3) 62%, transparent 100%)`, 1, -14, 30)} />
      {/* núcleo caliente */}
      <div style={banda(16, dir === 1 ? -3 : 87, `linear-gradient(${g}, rgba(255,255,235,1) 0%, rgba(255,226,150,.85) 40%, transparent 100%)`, 0.6, -14, 22)} />
      {/* veta magenta que cruza más despacio */}
      <div style={banda(22, dir === 1 ? 30 : 48, `linear-gradient(${g}, transparent 0%, rgba(255,50,120,.75) 45%, rgba(255,120,60,.4) 70%, transparent 100%)`, -1.5, 18, 36)} />
    </AbsoluteFill>
  );
};
