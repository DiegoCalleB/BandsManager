import React, { useEffect, useRef } from 'react';
import { drawIrisPrism, IRIS_PRISM_PERIOD } from '../../utils/irisPrismCanvas';

interface IrisPrismProps {
  className?: string;
  labels?: boolean;
}

export const IrisPrism: React.FC<IrisPrismProps> = ({ className = '', labels = false }) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let raf = 0;
    let w = 0;
    let h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (still) drawIrisPrism(ctx, w, h, IRIS_PRISM_PERIOD * 0.3, labels);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();
    const t0 = performance.now();
    const tick = (now: number) => {
      drawIrisPrism(ctx, w, h, (now - t0) / 1000, labels);
      raf = requestAnimationFrame(tick);
    };
    if (!still) raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [labels]);

  return <canvas ref={ref} aria-hidden="true" className={`block w-full ${className}`} />;
};
