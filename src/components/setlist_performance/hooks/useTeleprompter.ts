/**
 * Modo teleprompter: modo, reproducción, velocidad y autoscroll.
 * Extraído de SetlistPerformanceView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect,useRef,useState } from "react";

/**
 * Modo teleprompter: modo, reproducción, velocidad y autoscroll.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useTeleprompter() {
  // Modo teleprompter:'sections' (por bloques con pedal) o'scroll' (desplazamiento continuo)
  const [teleprompterMode, setTeleprompterMode] = useState<
    "sections" | "scroll"
  >("sections");

  const [isTeleprompterPlaying, setIsTeleprompterPlaying] =
    useState<boolean>(false);

  const [teleprompterSpeed, setTeleprompterSpeed] = useState<number>(1);

  const teleprompterScrollRef = useRef<HTMLDivElement | null>(null);

  // Autoscroll suave para el modo Teleprompter
  useEffect(() => {
    if (teleprompterMode !== "scroll" || !isTeleprompterPlaying) return;

    let animId: number;
    let lastTime = performance.now();

    const scrollStep = (currentTime: number) => {
      const elapsed = currentTime - lastTime;
      lastTime = currentTime;
      if (teleprompterScrollRef.current) {
        const delta = (28 * teleprompterSpeed * elapsed) / 1000;
        teleprompterScrollRef.current.scrollTop += delta;
      }
      animId = requestAnimationFrame(scrollStep);
    };

    animId = requestAnimationFrame(scrollStep);
    return () => cancelAnimationFrame(animId);
  }, [teleprompterMode, isTeleprompterPlaying, teleprompterSpeed]);

  return { teleprompterMode, setIsTeleprompterPlaying, setTeleprompterMode, isTeleprompterPlaying, teleprompterSpeed, setTeleprompterSpeed, teleprompterScrollRef };
}
