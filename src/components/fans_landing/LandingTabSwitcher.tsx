/**
 * Selector de pestañas redes/formulario
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Button } from "../ui";
import { useFansLanding } from "./FansLandingContext";

/**
 * Selector de pestañas redes/formulario
 * @returns Sección de interfaz.
 */
export function LandingTabSwitcher() {
  const { activeTab, setActiveTab, t } = useFansLanding();
  return (
    <>
{/* Dual Tab Mode Switcher */}
        <div className="flex bg-[var(--sunken)] p-1 rounded-[var(--r-l)] text-xs font-sans">
          <Button
            variant={activeTab === "redes" ? "selected" : "ghost"}
            size="sm"
            type="button"
            onClick={() => setActiveTab("redes")}
            className="flex-1 items-center justify-center gap-1.5 px-2"
          >
            <span className="truncate">{t("tabFollow")}</span>
          </Button>
          <Button
            variant={activeTab === "form" ? "selected" : "ghost"}
            size="sm"
            type="button"
            onClick={() => setActiveTab("form")}
            className="flex-1 items-center justify-center gap-1.5 px-2"
          >
            <span className="truncate">{t("tabJoin")}</span>
          </Button>
        </div>
    </>
  );
}
