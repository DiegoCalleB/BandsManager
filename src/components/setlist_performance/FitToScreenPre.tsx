import React, { useCallback, useEffect, useLayoutEffect, useRef } from "react";

// Encoge el texto (zoom) hasta que la canción entera quepa sin scroll; por debajo del mínimo
// deja de encoger y vuelve el scroll, para no dejar acordes ilegibles desde el atril.
const MIN_FIT_ZOOM = 0.55;
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
    const avail =
      box.clientHeight -
      parseFloat(cs.paddingTop) -
      parseFloat(cs.paddingBottom);
    let zoom = 1;
    pre.style.zoom = "1";
    while (pre.scrollHeight > avail && zoom > MIN_FIT_ZOOM) {
      zoom = Math.max(MIN_FIT_ZOOM, +(zoom - 0.05).toFixed(2));
      pre.style.zoom = String(zoom);
    }
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
