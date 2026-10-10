import { PerformanceBanners } from "./PerformanceBanners";
import { PerformanceFooter } from "./PerformanceFooter";
import { PerformancePage } from "./PerformancePage";
import { PerformancePracticePanel } from "./PerformancePracticePanel";
import { PerformanceRehearsalBar } from "./PerformanceRehearsalBar";
import { PerformanceSongDrawer } from "./PerformanceSongDrawer";
import { PerformanceTopBar } from "./PerformanceTopBar";

import { useSetlistPerformance } from "./SetlistPerformanceContext";

/**
 * Pantalla principal del visor: barra superior, página del tema, navegación y paneles.
 * @returns La pantalla del visor con un elemento actual.
 */
export function SetlistPerformanceStage() {
  const { containerRef, glareMode, handleTouchStart, handleTouchEnd } = useSetlistPerformance();

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] flex flex-col overflow-hidden select-none ${glareMode ? "bg-[var(--surface)] text-[var(--ink)]" : "bg-[var(--surface)] text-[var(--ink)]"}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* THIN TOP BAR — el título es lo único que un músico necesita leer de un vistazo para
 saber en qué tema está; antes competía por sitio con 8 iconos y se quedaba truncado a
 3 letras. Ahora solo quedan aquí los dos controles que hacen falta siempre a mano
 (menú y cerrar) — todo lo demás vive en el menú"⋯", y los datos pasivos (batería,
 posición, verificación) bajan a una segunda línea fina que no le roba sitio al título. */}
      <PerformanceTopBar />

      {/* BANNER MODO ENSAYO: destacado con tempo, tonalidad y acceso directo a Iris/Studio */}
      <PerformanceRehearsalBar />

      <PerformanceBanners />

      {/* THE"PAGE" — full-bleed content area with tap zones on the sides to turn songs, like
 forScore / iBooks. The zones sit ABOVE the content but only intercept clicks on their
 own strip, so scrolling/pinching the sheet itself still works normally.
 Estas zonas eran `hidden sm:flex` — no existían en absoluto en un móvil, que es
 precisamente el dispositivo que un cantante sujeta en el atril. Ahora son anchas
 (28% de la pantalla a cada lado) y visibles con opacidad baja siempre, no solo al
 hover (que no existe en touch), para que un golpe del atril o un dedo impreciso
 siga acertando. */}
      <PerformancePage />

      {/* THIN BOTTOM BAR — page dots + prev/next for touch, live transposition & teleprompter */}
      <PerformanceFooter />

      {/* Fallback internal Practice Mode Panel if not handled by parent */}
      <PerformancePracticePanel />

      {/* Drawer: Repertorio completo, pistas Iris y accesos directos a Studio */}
      <PerformanceSongDrawer />
    </div>
  );
};
