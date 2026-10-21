import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";

// Cabe sin scroll probando, en orden: 1, 2 y 3 columnas encogiendo hasta ZOOM_LEGIBLE, y solo
// entonces 1 columna hasta MIN_FIT_ZOOM. Si ni así, queda el scroll: acordes ilegibles en el
// atril son peor que un scroll.
const ZOOM_LEGIBLE = 0.75;
const MIN_FIT_ZOOM = 0.55;
const MIN_COL_PX = 260;
export const FitToScreenPre: React.FC<{ text: string; className: string }> = ({
  text,
  className,
}) => {
  const boxRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);

  const fit = useCallback(() => {
    const box = boxRef.current;
    const pre = preRef.current;
    if (!box || !pre) return;
    const cs = getComputedStyle(box);
    const availH =
      box.clientHeight -
      parseFloat(cs.paddingTop) -
      parseFloat(cs.paddingBottom);
    const availW =
      box.clientWidth -
      parseFloat(cs.paddingLeft) -
      parseFloat(cs.paddingRight);

    const probar = (cols: number, floor: number) => {
      pre.style.columnCount = cols > 1 ? String(cols) : "";
      pre.style.columnFill = cols > 1 ? "auto" : "";
      pre.style.maxWidth = cols > 1 ? "none" : "";
      for (let z = 1; z >= floor - 0.001; z = +(z - 0.05).toFixed(2)) {
        pre.style.zoom = String(z);
        // con zoom, la altura CSS se escala: se compensa para ocupar el alto visible
        pre.style.height = cols > 1 ? `${availH / z}px` : "";
        const cabe =
          cols > 1
            ? pre.scrollWidth <= pre.clientWidth + 1
            : pre.scrollHeight <= availH;
        if (cabe) return true;
      }
      return false;
    };

    for (const cols of [1, 2, 3]) {
      if (cols > 1 && availW / cols < MIN_COL_PX * ZOOM_LEGIBLE) break;
      if (probar(cols, ZOOM_LEGIBLE)) return;
    }
    if (!probar(1, MIN_FIT_ZOOM)) pre.style.zoom = String(MIN_FIT_ZOOM);
  }, []);

  useLayoutEffect(() => {
    fit();
  }, [fit, text, className]);

  useEffect(() => {
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [fit]);

  return (
    <div ref={boxRef} className="flex-1 overflow-y-auto p-4 sm:p-6">
      <pre ref={preRef} className={className}>
        {text}
      </pre>
    </div>
  );
};
