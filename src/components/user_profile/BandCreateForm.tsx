/**
 * Formulario de alta de una banda nueva.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Loader2,Plus,X } from "lucide-react";
import { getPlanDefinition } from "../../utils/planPermissions";
import { Button,IconButton,Input } from "../ui";
import { SIMPLE_PROMO_ONLY_BAND_CREATION } from "./profileModel";
import { useUserProfile } from "./UserProfileContext";

/**
 * Formulario de alta de una banda nueva.
 * @returns Sección de interfaz.
 */
export function BandCreateForm() {
  const { showCreateBandSection, setShowCreateBandSection, createBandName, setCreateBandName, createBandStyle, setCreateBandStyle, createBandLocation, setCreateBandLocation, createBandPlan, setCreateBandPlan, handleCreateBandInProfile, isCreatingBand } = useUserProfile();
  return (
    <>
      {showCreateBandSection && (
        <div
          className={`p-3.5 rounded-[var(--r-m)] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 ${"bg-[var(--ok-soft)]/50"}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-[var(--ok)] flex items-center gap-1.5">
              <span>Crear nuevo proyecto o banda</span>
            </p>
            <IconButton
              label="Cerrar"
              size="icon-xs"
              type="button"
              onClick={() => setShowCreateBandSection(false)}
            >
              <X className="w-3.5 h-3.5" />
            </IconButton>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-micro font-sans text-[var(--ink-2)] block mb-1">
                Nombre del proyecto / banda *
              </label>
              <Input
                size="sm"
                type="text"
                required
                value={createBandName}
                onChange={(e) => setCreateBandName(e.target.value)}
                placeholder="Ej. Los Nocturnos, Cuarteto Acústico…"
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-micro font-sans text-[var(--ink-2)] block mb-1">
                  Estilo / género
                </label>
                <Input
                  size="sm"
                  type="text"
                  value={createBandStyle}
                  onChange={(e) => setCreateBandStyle(e.target.value)}
                  placeholder="Ej. Indie Rock, Pop…"
                  className="w-full"
                />
              </div>
              <div>
                <label className="text-micro font-sans text-[var(--ink-2)] block mb-1">
                  Ubicación
                </label>
                <Input
                  size="sm"
                  type="text"
                  value={createBandLocation}
                  onChange={(e) =>
                    setCreateBandLocation(e.target.value)
                  }
                  placeholder="Ej. Madrid, Barcelona…"
                  className="w-full"
                />
              </div>
            </div>

            {SIMPLE_PROMO_ONLY_BAND_CREATION ? (
              <p className="text-micro font-sans text-[var(--ink-2)]">
                Se creará en el plan{" "}
                <span className="text-[var(--acc)] font-bold">
                  Promo
                </span>{" "}
                (dossier, calendario y fans).
              </p>
            ) : (
              <div>
                <label className="text-micro font-sans text-[var(--ink-2)] block mb-1.5">
                  Plan inicial del proyecto
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["emergente", "profesional", "elite"] as const).map(
                    (pKey) => {
                      const planDef = getPlanDefinition(pKey);
                      const isPlanSelected = createBandPlan === pKey;
                      return (
                        <button
                          key={pKey}
                          type="button"
                          onClick={() => setCreateBandPlan(pKey)}
                          className={`p-2 rounded-[var(--r-s)] text-left text-xs transition-ui cursor-pointer ${
                            isPlanSelected
                              ? "bg-[var(--acc)]/20  text-[var(--ink)]"
                              : "bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--bg)]"
                          }`}
                        >
                          <p className="font-bold truncate text-micro">
                            {planDef.name.split(" ")[0]}
                          </p>
                          <p className="text-micro font-sans text-[var(--acc)]/90">
                            {planDef.price}
                          </p>
                        </button>
                      );
                    },
                  )}
                </div>
              </div>
            )}

            <div className="pt-1 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreateBandSection(false)}
                className="px-2.5 py-1 rounded-[var(--r-s)] text-xs text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
              >
                Cancelar
              </button>
              <Button
                variant="primary"
                size="xs"
                type="button"
                onClick={handleCreateBandInProfile}
                disabled={isCreatingBand || !createBandName.trim()}
                className="items-center gap-1.5"
              >
                {isCreatingBand ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Creando…</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-3 h-3" />
                    <span>Crear proyecto</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
