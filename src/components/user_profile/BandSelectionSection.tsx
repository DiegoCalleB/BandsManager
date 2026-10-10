/**
 * Banda principal: lista de bandas, alta y baja.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ChevronDown,Loader2,Plus,Sparkles,Star,Trash2 } from "lucide-react";
import { getPlanDefinition } from "../../utils/planPermissions";
import { BandCreateForm } from "./BandCreateForm";
import { BandDeleteConfirm } from "./BandDeleteConfirm";
import { useUserProfile } from "./UserProfileContext";

/**
 * Banda principal: lista de bandas, alta y baja.
 * @returns Sección de interfaz.
 */
export function BandSelectionSection() {
  const { onOpenProfileWizard, onClose, setShowCreateBandSection, showCreateBandSection, onOpenBandSwitcher, localAvailableBands, selectedMainBandId, deletingBandId, setSelectedMainBandId, setBandToDeleteInProfile, activeBandName, currentUser } = useUserProfile();
  return (
    <>
      <div className="space-y-2 pt-2 ">
        <div className="flex items-center justify-between">
          <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[var(--acc)] fill-[var(--acc)]" />
            <span>Proyectos y banda principal</span>
          </label>
          <div className="flex items-center gap-2">
            {onOpenProfileWizard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenProfileWizard();
                }}
                className="text-xs font-sans text-[var(--acc)] hover:text-[var(--acc)]/80 transition-colors flex items-center gap-1 cursor-pointer font-bold"
                title="Abrir asistente paso a paso de configuración de banda"
              >
                <Sparkles className="w-3 h-3 text-[var(--acc)]" />
                <span>Asistente perfil</span>
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                setShowCreateBandSection(!showCreateBandSection)
              }
              className="text-xs font-sans text-[var(--ok)] hover:text-[var(--ink-2)] transition-colors flex items-center gap-1 cursor-pointer font-bold"
            >
              <Plus className="w-3 h-3" />
              <span>
                {showCreateBandSection ? "Cerrar" : "+ Crear Proyecto"}
              </span>
            </button>
            {onOpenBandSwitcher && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenBandSwitcher();
                }}
                className="text-xs font-sans text-[var(--acc)] hover:text-[var(--acc)]/70 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>Selector visual</span>
                <ChevronDown className="w-3 h-3 -rotate-90" />
              </button>
            )}
          </div>
        </div>

        {/* Creation Form Accordion */}
        <BandCreateForm />

        {/* Delete Confirmation Box */}
        <BandDeleteConfirm />

        <div
          className={`p-3 rounded-[var(--r-m)] space-y-2 ${"bg-[var(--sunken)]"}`}
        >
          <p className="text-xs text-[var(--ink-2)]">
            Selecciona tu proyecto principal por defecto o gestiona tus
            bandas activas:
          </p>

          {localAvailableBands && localAvailableBands.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              {localAvailableBands.map((b) => {
                const isSelected =
                  selectedMainBandId === b.band_id ||
                  (b.band_id &&
                    selectedMainBandId &&
                    selectedMainBandId.replace(/^(band|reg)-/, "") ===
                      b.band_id.replace(/^(band|reg)-/, ""));
                const isDeleting = deletingBandId === b.band_id;
                return (
                  <div
                    key={b.band_id}
                    className={`w-full p-2.5 rounded-[var(--r-m)] flex items-center justify-between gap-3 transition-ui ${
                      isSelected
                        ? "bg-[var(--acc)]/15  text-[var(--ink)]"
                        : "bg-[var(--surface)] text-[var(--ink-2)]"
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedMainBandId(b.band_id)}
                      className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer active:scale-[0.97]"
                    >
                      <div className="w-6 h-6 rounded-[var(--r-s)] bg-[var(--surface)]/80 flex items-center justify-center text-[var(--acc)] shrink-0 text-xs font-sans font-bold">
                        {b.bandName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">
                          {b.bandName}
                        </p>
                        <p className="text-micro text-[var(--ink-2)] font-sans capitalize">
                          {b.role === "leader"
                            ? "Líder / Mánager"
                            : "Miembro"}{" "}
                          • {getPlanDefinition(b.plan).name}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {isSelected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)] text-micro font-bold font-sans">
                          <Star className="w-2.5 h-2.5 fill-[var(--ink)]" />
                          <span>Principal</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setSelectedMainBandId(b.band_id)}
                          className="text-micro font-sans text-[var(--ink-2)] hover:text-[var(--acc)] px-1.5 py-0.5 rounded cursor-pointer"
                        >
                          Hacer principal
                        </button>
                      )}

                      {localAvailableBands.length > 1 && (
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() =>
                            setBandToDeleteInProfile({
                              id: b.band_id,
                              name: b.bandName,
                            })
                          }
                          title="Eliminar proyecto"
                          className="p-1.5 rounded-[var(--r-pill)] text-[var(--ink-2)] hover:text-[var(--alert)] hover:bg-[var(--alert)]/10 transition-colors cursor-pointer"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center justify-between p-2 rounded-[var(--r-s)] bg-[var(--surface)]">
              <span className="text-xs font-bold text-[var(--ink)]">
                {activeBandName || currentUser.bandName || "Banda"}
              </span>
              <span className="text-micro font-sans text-[var(--acc)]">
                Principal
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
