import { useEffect, useState, type CSSProperties } from 'react';

const FALLBACK_STYLE: CSSProperties = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 };

/**
 * Estilo inline para un overlay que debe cubrir exactamente lo que el usuario ve ahora mismo —
 * no el layout viewport que CSS "inset:0" asume. En un Custom Tab / WebView con su propia barra
 * (p. ej. un enlace abierto desde otra app), el layout viewport y el visual viewport pueden no
 * coincidir, y un position:fixed anclado con inset:0 puede terminar centrado contra un área que
 * no es la que se ve en pantalla — el modal "se pinta muy abajo" aunque el CSS diga inset:0.
 * window.visualViewport da las coordenadas reales del área visible; sin soporte, cae a inset:0.
 */
export function useVisualViewportOverlayStyle(): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>(FALLBACK_STYLE);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;

    const update = () => {
      setStyle({
        position: 'fixed',
        top: vv.offsetTop,
        left: vv.offsetLeft,
        width: vv.width,
        height: vv.height,
      });
    };

    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
    };
  }, []);

  return style;
}
