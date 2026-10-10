/**
 * Paso 1 de la creación de banda: datos básicos.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ArrowRight,Guitar,Loader2,MapPin,Music,User as UserIcon,X } from "lucide-react";
import { BandNameStylerHelper } from "../common/BandNameStylerHelper";
import { Button,IconButton,Input } from "../ui";
import { SIMPLE_PROMO_ONLY_BAND_CREATION } from "./bandSwitcherConfig";
import { useBandSwitcher } from "./BandSwitcherContext";

/**
 * Paso 1 de la creación de banda: datos básicos.
 * @returns Sección de interfaz.
 */
export function CreateBandStepOne() {
  const { createBandStep, setShowCreateBandModal, handleStep1Submit, newBandName, setNewBandName, newBandLeaderName, setNewBandLeaderName, newBandStyle, setNewBandStyle, newBandLocation, setNewBandLocation, isCreatingBand } = useBandSwitcher();
  return (
    <>
{createBandStep === 1 && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-[var(--r-l)] bg-[var(--acc)]/15 flex items-center justify-center text-[var(--ink)] shrink-0">
                        <Guitar className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-[var(--ink)] font-display ">
                          Añadir nuevo proyecto musical
                        </h3>
                        <p className="text-xs text-[var(--acc)]/80 font-sans">
                          {SIMPLE_PROMO_ONLY_BAND_CREATION
                            ? "Información del proyecto"
                            : "Paso 1 de 2 • Información del proyecto"}
                        </p>
                      </div>
                    </div>
                    <IconButton
                      label="Cerrar"
                      type="button"
                      onClick={() => setShowCreateBandModal(false)}
                    >
                      <X className="w-5 h-5" />
                    </IconButton>
                  </div>

                  <form onSubmit={handleStep1Submit} className="space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
                          <Guitar className="w-3.5 h-3.5 text-[var(--acc)]" />
                          <span>Nombre del proyecto / banda *</span>
                        </label>
                        <BandNameStylerHelper
                          value={newBandName}
                          onChange={(styled) => setNewBandName(styled)}
                        />
                      </div>
                      <Input
                        type="text"
                        value={newBandName}
                        onChange={(e) => setNewBandName(e.target.value)}
                        placeholder="Ej: Los Nocturnos, KoЯn, 𝕭𝖑𝖆𝖈𝖐 𝕸𝖊𝖙𝖆𝖑…"
                        required
                        autoFocus
                        className="w-full"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5 text-[var(--acc)]" />
                        <span>Tu rol o nombre en este proyecto</span>
                      </label>
                      <Input
                        size="sm"
                        type="text"
                        value={newBandLeaderName}
                        onChange={(e) => setNewBandLeaderName(e.target.value)}
                        placeholder="Ej: Kurt Cobain (Guitarra y Mánager)"
                        className="w-full"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
                          <Music className="w-3.5 h-3.5 text-[var(--acc)]" />
                          <span>Estilo musical / género</span>
                        </label>
                        <Input
                          size="sm"
                          type="text"
                          value={newBandStyle}
                          onChange={(e) => setNewBandStyle(e.target.value)}
                          placeholder="Ej: Rock, Indie, Mestizaje, Ska…"
                          className="w-full"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-[var(--acc)]" />
                          <span>Ciudad / ubicación base</span>
                        </label>
                        <Input
                          size="sm"
                          type="text"
                          value={newBandLocation}
                          onChange={(e) => setNewBandLocation(e.target.value)}
                          placeholder="Ej: Madrid, Barcelona, Valencia…"
                          className="w-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4">
                      <Button
                        variant="neutral"
                        type="button"
                        onClick={() => setShowCreateBandModal(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        type="submit"
                        disabled={
                          !newBandName.trim() ||
                          (SIMPLE_PROMO_ONLY_BAND_CREATION && isCreatingBand)
                        }
                        className="items-center gap-2"
                      >
                        {SIMPLE_PROMO_ONLY_BAND_CREATION ? (
                          isCreatingBand ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Creando…</span>
                            </>
                          ) : (
                            <>
                              <span>Crear proyecto</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )
                        ) : (
                          <>
                            <span>Continuar a elegir plan</span>
                            <ArrowRight className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </div>
              )}
    </>
  );
}
