/**
 * Cuadrícula de tarjetas de banda y acceso a crear banda.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ArrowLeft,ArrowRight as ArrowRightIcon,ArrowUpDown,Check,Crown,Guitar,Loader2,Plus,Settings,Star,Trash2 } from "lucide-react";
import { isSameBandId } from "../../utils/bandUtils";
import { getPlanDefinition } from "../../utils/planPermissions";
import { IconButton } from "../ui";
import { SIMPLE_PROMO_ONLY_BAND_CREATION } from "./bandSwitcherConfig";
import { useBandSwitcher } from "./BandSwitcherContext";

/**
 * Cuadrícula de tarjetas de banda y acceso a crear banda.
 * @returns Sección de interfaz.
 */
export function BandCardsGrid() {
  const { uniqueBands, searchQuery, currentActiveBandId, localMainBandId, mainBandId, switchingBandId, settingMainBandId, leavingBandId, draggedBandId, handleDragStart, handleDragOver, handleDrop, handleSelectBand, handleSetMainBandAction, handleMoveBand, setSelectedBandForSettings, handleRequestLeaveBand, failedLogos, setFailedLogos, setSelectedBandForUpgrade, setShowUpgradeModal, openCreateBandModal } = useBandSwitcher();
  return (
    <>
{/* Band Cards Grid (Sleek Profile Switcher) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 md:gap-5 justify-center items-stretch max-h-[55vh] overflow-y-auto p-2 no-scrollbar">
            {uniqueBands
              .filter(
                (band) =>
                  !searchQuery ||
                  band.bandName
                    .toLowerCase()
                    .includes(searchQuery.toLowerCase()),
              )
              .map((band, index, array) => {
                const isActive = isSameBandId(
                  band.band_id,
                  currentActiveBandId,
                );
                const isMain = isSameBandId(
                  band.band_id,
                  localMainBandId || mainBandId,
                );
                const isSwitching = switchingBandId === band.band_id;
                const isSettingMain = settingMainBandId === band.band_id;
                const isLeavingThis = leavingBandId === band.band_id;
                const isDragged = draggedBandId === band.band_id;
                const planDef = getPlanDefinition(band.plan);

                return (
                  <div
                    key={`netflix-band-${band.band_id}`}
                    draggable={!switchingBandId && !isLeavingThis}
                    onDragStart={(e) => handleDragStart(band.band_id, e)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(band.band_id, e)}
                    onClick={() =>
                      !switchingBandId &&
                      !isSettingMain &&
                      !isLeavingThis &&
                      handleSelectBand(band.band_id)
                    }
                    className={`group relative flex flex-col items-center p-3 sm:p-4 rounded-[var(--r-l)] min-h-[175px] transition-ui duration-300 cursor-pointer select-none ${
                      isDragged ? "opacity-30 scale-95" : ""
                    } ${
                      isActive
                        ? "bg-[var(--acc)]/20 ring-1 ring-[var(--acc)]/40"
                        : "bg-[var(--sunken)] hover:bg-[var(--surface)]"
                    } ${switchingBandId && !isSwitching ? "opacity-40 grayscale pointer-events-none" : ""}`}
                  >
                    {/* Top Bar on Card: Star (Principal) + Reorder arrows on left, Settings + Delete on right */}
                    <div className="w-full flex items-center justify-between gap-1 z-20 mb-2 shrink-0">
                      {/* Left: Star (Principal) + Reorder arrows */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Star Button (Principal) */}
                        <button
                          type="button"
                          onClick={(e) =>
                            handleSetMainBandAction(e, band.band_id)
                          }
                          disabled={isMain || !!settingMainBandId}
                          className={`p-1.5 rounded-[var(--r-pill)] transition-ui cursor-pointer flex items-center justify-center z-30 ${
                            isMain
                              ? "text-[var(--on-acc)] bg-[var(--acc)]"
                              : "text-[var(--ink-2)] hover:text-[var(--acc)]/70 bg-[var(--surface)] hover:bg-[var(--surface)]/80 "
                          }`}
                          title={
                            isMain
                              ? "Banda Principal por defecto"
                              : "Fijar como Banda Principal"
                          }
                        >
                          <Star
                            className={`w-3.5 h-3.5 ${isMain ? "fill-[var(--acc)] text-[var(--acc)]" : "text-[var(--ink-2)]"}`}
                          />
                        </button>

                        {/* Quick Reorder (left/right) */}
                        <div className="hidden sm:flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          {array.length > 1 && (
                            <>
                              <IconButton
                                label="Mover a la izquierda"
                                size="icon-xs"
                                type="button"
                                disabled={index === 0}
                                onClick={(e) =>
                                  handleMoveBand(band.band_id, "left", e)
                                }
                              >
                                <ArrowLeft className="w-3 h-3" />
                              </IconButton>
                              <IconButton
                                label="Mover a la derecha"
                                size="icon-xs"
                                type="button"
                                disabled={index === array.length - 1}
                                onClick={(e) =>
                                  handleMoveBand(band.band_id, "right", e)
                                }
                              >
                                <ArrowRightIcon className="w-3 h-3" />
                              </IconButton>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Top Right: Manage Settings & Logo (Gear) + Delete Button (Trash) */}
                      <div className="flex items-center gap-1 z-30 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSelectedBandForSettings(band);
                          }}
                          className="p-1.5 rounded-[var(--r-pill)] text-[var(--ink-2)] hover:text-[var(--acc-ink)] bg-[var(--surface)] hover:brightness-95 transition-ui cursor-pointer"
                          title={`Ajustes mínimos y logotipo de ${band.bandName}`}
                        >
                          <Settings className="w-3.5 h-3.5" />
                        </button>

                        <IconButton
                          label="Eliminar esta banda de mi usuario"
                          variant="danger"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleRequestLeaveBand(band.band_id, band.bandName);
                          }}
                          disabled={!!leavingBandId}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </IconButton>
                      </div>
                    </div>

                    {/* Central Logo Avatar */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[var(--r-l)] overflow-hidden bg-[var(--surface)] transition-ui flex items-center justify-center p-2 my-1 shrink-0">
                      {band.logoUrl && !failedLogos.has(band.band_id) ? (
                        <img
                          src={band.logoUrl}
                          alt={band.bandName}
                          onError={() =>
                            setFailedLogos((prev) =>
                              new Set(prev).add(band.band_id),
                            )
                          }
                          className="w-full h-full object-contain filter transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-full h-full rounded-[var(--r-m)] bg-[var(--acc)]/15 flex flex-col items-center justify-center text-[var(--ink)] gap-1">
                          <Guitar className="w-8 h-8 opacity-80" />
                          <span className="text-xs font-bold font-sans text-[var(--ink-2)]">
                            {band.bandName.slice(0, 2).toUpperCase()}
                          </span>
                        </div>
                      )}

                      {/* Loading Spinner Overlay */}
                      {(isSwitching || isSettingMain || isLeavingThis) && (
                        <div className="absolute inset-0 bg-[var(--scrim)]/85 flex flex-col items-center justify-center text-[var(--on-scrim)] gap-1 z-30">
                          <Loader2 className="w-5 h-5 animate-spin text-[var(--acc)]" />
                          <span className="text-micro font-sans text-[var(--acc)] font-bold">
                            {isSettingMain
                              ? "Guardando"
                              : isLeavingThis
                                ? "Eliminando"
                                : "Cambiando"}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Band Title */}
                    <div className="w-full text-center mt-2 shrink-0">
                      <h3
                        className="text-sm font-bold font-display text-[var(--ink)] group-hover:text-[var(--acc)]/70 transition-colors truncate px-1"
                        title={band.bandName}
                      >
                        {band.bandName}
                      </h3>
                    </div>

                    {/* Plan Badge */}
                    <div className="mt-1 flex items-center justify-center shrink-0">
                      {SIMPLE_PROMO_ONLY_BAND_CREATION ||
                      band.plan === "promo" ||
                      band.plan === "promo_plus" ? (
                        <span
                          className="inline-flex items-center gap-1 text-micro font-sans font-semibold px-2 py-0.5 rounded-[var(--r-s)]"
                          style={{
                            backgroundColor: `${planDef.color}18`,
                            color: planDef.color,
                            borderColor: `${planDef.color}40`,
                          }}
                          title={`Plan actual: ${planDef.name}`}
                        >
                          <Crown className="w-2.5 h-2.5" />
                          <span>{planDef.name}</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            setSelectedBandForUpgrade(band);
                            setShowUpgradeModal(true);
                          }}
                          className="inline-flex items-center gap-1 text-micro font-sans font-semibold px-2 py-0.5 rounded-[var(--r-s)] transition-ui cursor-pointer group/plan"
                          style={{
                            backgroundColor: `${planDef.color}18`,
                            color: planDef.color,
                            borderColor: `${planDef.color}40`,
                          }}
                          title={`Plan actual: ${planDef.name}. Clic para Cambiar Plan (Upgrade / Downgrade)`}
                        >
                          <Crown className="w-2.5 h-2.5" />
                          <span>{planDef.name}</span>
                          <ArrowUpDown className="w-2.5 h-2.5 opacity-60 group-hover/plan:opacity-100" />
                        </button>
                      )}
                    </div>

                    {/* Active Status Badge */}
                    <div className="mt-1.5 flex items-center justify-center h-5 shrink-0">
                      {isActive && (
                        <span className="inline-flex items-center gap-1 text-micro font-sans font-bold px-2.5 py-0.5 rounded-[var(--r-pill)] bg-[var(--ok)]/15 text-[var(--ink)]">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                          <span>Activa</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

            {/* Option Card: Add/Register Band */}
            <div
              onClick={openCreateBandModal}
              className="group flex flex-col items-center justify-center p-5 rounded-[var(--r-l)] bg-[var(--sunken)] hover:bg-[var(--surface)] transition-ui duration-300 cursor-pointer text-[var(--ink-2)] hover:text-[var(--acc)]/70 min-h-[170px]"
            >
              <div className="w-12 h-12 rounded-[var(--r-l)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink-2)] group-hover:text-[var(--acc)] transition-ui mb-2">
                <Plus className="w-5 h-5 transition-transform" />
              </div>
              <span className="text-xs font-bold font-display text-center">
                Añadir proyecto
              </span>
              <span className="text-micro font-sans text-[var(--ink-2)] mt-0.5 text-center">
                Registrar otra banda
              </span>
            </div>
          </div>
    </>
  );
}
