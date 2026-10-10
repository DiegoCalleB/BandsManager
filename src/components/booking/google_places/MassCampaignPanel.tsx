/**
 * Panel de búsqueda masiva según la campaña activa.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Loader2,Sparkles,Target } from "lucide-react";
import { ShowIcon } from "../../ui/ShowIcon";
import { useGooglePlacesExplorer } from "./GooglePlacesExplorerContext";

/**
 * Panel de búsqueda masiva según la campaña activa.
 * @returns Sección de interfaz.
 */
export function MassCampaignPanel() {
  const { activeCampaign, aforoMin, aforoMax, handleMassCampaignSearch, isMassCampaignSearching, isSearching, massFilterTipos, setMassFilterTipos } = useGooglePlacesExplorer();
  return (
    <>
      <div className="p-4 rounded-[var(--r-m)] bg-[var(--acc)]/10  space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="p-2 rounded-[var(--r-s)] bg-[var(--acc)]/20 text-[var(--ink)] shrink-0">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold font-display text-[var(--acc)]/70">
                  Prospección masiva de campaña
                </span>
                {activeCampaign && (
                  <span className="text-micro px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)] font-sans">
                    {activeCampaign.name}
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--ink-2)] mt-0.5">
                Descubre simultáneamente todos los recintos, salas,
                locales y discotecas del aforo (
                {aforoMin || activeCampaign?.minCapacity || "0"} -{" "}
                {aforoMax || activeCampaign?.maxCapacity || "∞"} pax),
                adaptados a las ciudades objetivo y estilo de la banda.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleMassCampaignSearch}
            disabled={isMassCampaignSearching || isSearching}
            className="w-full sm:w-auto px-4 py-2.5 bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold text-xs rounded-[var(--r-m)] flex items-center justify-center gap-2 transition-ui/20 cursor-pointer disabled:opacity-50 shrink-0"
          >
            {isMassCampaignSearching ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[var(--acc-ink)]" />
                <span>Rastreando ciudades…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[var(--acc-ink)]" />
                <span>Lanzar búsqueda masiva</span>
              </>
            )}
          </button>
        </div>

        {/* Selector de Tipos de Espacio para la prospección masiva */}
        <div className="pt-2800/80 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-micro font-sans text-[var(--ink-2)] font-bold mr-1">
              Espacios a rastrear:
            </span>
            {[
              { id: "sala", label: "Salas & Recintos", icon: "🏛️" },
              { id: "local", label: "Locales & Bares", icon: "☕" },
              {
                id: "discoteca",
                label: "Discotecas & Clubs",
                icon: "🪩",
              },
              { id: "teatro", label: "Teatros & Auditorios", icon: "🎭" },
              { id: "grupo", label: "Bandas & Co-booking", icon: "🎸" },
            ].map((item) => {
              const isChecked = massFilterTipos.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    if (isChecked) {
                      if (massFilterTipos.length > 1) {
                        setMassFilterTipos(
                          massFilterTipos.filter((t) => t !== item.id),
                        );
                      }
                    } else {
                      setMassFilterTipos([...massFilterTipos, item.id]);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-[var(--r-pill)] text-micro font-bold flex items-center gap-1 transition-ui cursor-pointer ${
                    isChecked
                      ? "bg-[var(--ink)] text-[var(--bg)] "
                      : "bg-[var(--bg)]/80 text-[var(--ink-2)] hover:text-[var(--ink-2)]"
                  }`}
                >
                  <span><ShowIcon inline emoji={item.icon} /></span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {activeCampaign?.targetCities &&
            activeCampaign.targetCities.length > 0 && (
              <span className="text-micro text-[var(--ink-2)] font-sans">
                Ciudades ({activeCampaign.targetCities.length}):{" "}
                <strong className="text-[var(--ink)]">
                  {activeCampaign.targetCities.join(",")}
                </strong>
              </span>
            )}
        </div>
      </div>
    </>
  );
}
