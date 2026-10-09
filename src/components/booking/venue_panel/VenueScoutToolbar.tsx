import type { BookingCampaign } from "../../../types";
/**
 * Barra de herramientas de inteligencia Scout (Jina, Wegow, Instagram).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
 
import { AlertCircle,Calendar,CalendarCheck,CheckCircle2,Compass,ExternalLink,Globe,Instagram,Loader2,PartyPopper,TrendingUp } from "lucide-react";
import { Dispatch,SetStateAction } from "react";
import { Concert,Lead } from "../../../types";
import { checkBandDateConflict,getCityTourHistory } from "../../../utils/bookingTourContext";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueScoutToolbarProps {
  handleScanWithJina: () => Promise<void>;
  isScanningJina: boolean;
  handleDetectVenueDates: () => Promise<void>;
  isDetectingDates: boolean;
  selectedLead: Lead;
  editedLeadInfo: Partial<Lead>;
  handleEnrichInstagram: () => Promise<void>;
  isEnrichingInstagram: boolean;
  scoutActionFeedback: string;
  activeCampaign: BookingCampaign | null | undefined;
  concerts: Concert[];
  bandName: string;
  editedPitch: string;
  setEditedPitch: Dispatch<SetStateAction<string>>;
  setIsEditingPitch: Dispatch<SetStateAction<boolean>>;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  setShowWhatsAppModal: Dispatch<SetStateAction<boolean>>;
}

/**
 * Barra de herramientas de inteligencia Scout (Jina, Wegow, Instagram).
 * @param props Estado y callbacks del contenedor ({@link VenueScoutToolbarProps}).
 * @returns Sección de interfaz.
 */
export function VenueScoutToolbar({ handleScanWithJina, isScanningJina, handleDetectVenueDates, isDetectingDates, selectedLead, editedLeadInfo, handleEnrichInstagram, isEnrichingInstagram, scoutActionFeedback, activeCampaign, concerts, bandName, editedPitch, setEditedPitch, setIsEditingPitch, onUpdateLead, setShowWhatsAppModal }: VenueScoutToolbarProps) {
  /** Campos heredados que algunos leads antiguos aún traen y que `Lead` ya no declara. */
  const legacyLead = selectedLead as Lead & { fecha_posible_evento?: string; fechas_disponibles?: string[]; fechas_propuestas?: string[] };
  return (
    <>
{/* Intelligence Scout Tools Toolbar (Jina Reader, Radar Wegow, Instagram Apify) */}
        <div className="bg-[var(--surface)] p-2.5 rounded-[var(--r-m)] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-micro font-mono font-bold text-[var(--acc)] flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-[var(--acc)]" />
              Herramientas Agente Scout e Inteligencia Externa:
            </span>
            <span className="text-micro text-[var(--ink-2)] font-sans">
              Datos verificados sin inventar
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={handleScanWithJina}
              disabled={isScanningJina}
              className="items-center gap-1.5"
              title="Escanea el sitio web con Jina Reader para extraer móviles, fijos, emails de booking y especificaciones técnicas"
            >
              {isScanningJina ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
              ) : (
                <Globe className="w-3.5 h-3.5 text-[var(--acc)]" />
              )}
              <span>
                {isScanningJina
                  ? "Leyendo web..."
                  : "Jina Reader (Web y Teléfonos)"}
              </span>
            </Button>

            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={handleDetectVenueDates}
              disabled={isDetectingDates}
              className="items-center gap-1.5"
              title="Analiza la cartelera de Wegow y ticketing para deducir qué fines de semana tienen libres"
            >
              {isDetectingDates ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
              ) : (
                <Calendar className="w-3.5 h-3.5 text-[var(--acc)]" />
              )}
              <span>
                {isDetectingDates
                  ? "Detectando fechas..."
                  : "Radar Wegow (Fechas Libres)"}
              </span>
            </Button>

            {(selectedLead.instagram || editedLeadInfo.instagram) && (
              <Button
                variant="neutral"
                size="xs"
                type="button"
                onClick={handleEnrichInstagram}
                disabled={isEnrichingInstagram}
                className="items-center gap-1.5"
                title="Extrae WhatsApp comercial y datos de contacto de su perfil de Instagram"
              >
                {isEnrichingInstagram ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
                ) : (
                  <Instagram className="w-3.5 h-3.5 text-[var(--acc)]" />
                )}
                <span>
                  {isEnrichingInstagram
                    ? "Extrayendo..."
                    : "Instagram (WhatsApp Business)"}
                </span>
              </Button>
            )}
          </div>

          {/* Feedback Banner for Scout Tools */}
          {scoutActionFeedback && (
            <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--ink)] text-xs font-sans flex items-center gap-2 animate-fadeIn">
              <span>{scoutActionFeedback}</span>
            </div>
          )}

          {/* 🎯 DISPONIBILIDAD Y CONFLICTO EN LA GIRA DE LA BANDA (Punto 1) */}
          {(() => {
            const targetDate =
              legacyLead.fecha_posible_evento ||
              (selectedLead.fechas_propuestas_sala &&
                selectedLead.fechas_propuestas_sala[0]) ||
              (selectedLead.fechas_libres_detectadas &&
                selectedLead.fechas_libres_detectadas[0]) ||
              selectedLead.fechas_libres_campana?.[0] ||
              legacyLead.fechas_propuestas?.[0] ||
              legacyLead.fechas_disponibles?.[0];
            const conflictCheck = checkBandDateConflict(
              targetDate,
              concerts,
              selectedLead.ciudad,
            );

            if (conflictCheck.status === "conflicto_directo") {
              return (
                <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--alert)] text-[var(--on-alert)] text-xs flex items-center justify-between gap-2.5 animate-fadeIn shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0"><ShowIcon inline emoji="🔴" /></span>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--alert)] text-xs truncate">
                        Conflicto en la agenda de {bandName || "la banda"}
                      </p>
                      <p className="text-xs text-[var(--alert)]">
                        {conflictCheck.mensaje}
                      </p>
                    </div>
                  </div>
                  <span className="text-micro font-mono font-bold px-2 py-0.5 rounded bg-[var(--alert)] text-[var(--on-alert)] shrink-0">
                    Fecha Ocupada
                  </span>
                </div>
              );
            }

            if (conflictCheck.status === "cercano_compatible") {
              return (
                <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--ok)] text-[var(--on-ok)] text-xs flex items-center justify-between gap-2.5 animate-fadeIn shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0"><ShowIcon inline emoji="🚗" /></span>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--ok)] text-xs truncate">
                        Oportunidad de enlace en ruta (Doble fecha)
                      </p>
                      <p className="text-xs text-[var(--ok)]/90">
                        {conflictCheck.mensaje}
                      </p>
                    </div>
                  </div>
                  <span className="text-micro font-mono font-bold px-2 py-0.5 rounded bg-[var(--ok)] text-[var(--on-ok)] shrink-0">
                    Compatible
                  </span>
                </div>
              );
            }

            if (conflictCheck.status === "cercano_aviso") {
              return (
                <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)] text-[var(--on-acc)] text-xs flex items-center justify-between gap-2.5 animate-fadeIn shadow-2xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base shrink-0"><ShowIcon inline emoji="⚠️" /></span>
                    <div className="min-w-0">
                      <p className="font-bold text-[var(--acc)] text-xs truncate">
                        Concierto en fecha adyacente
                      </p>
                      <p className="text-xs text-[var(--acc)]/90">
                        {conflictCheck.mensaje}
                      </p>
                    </div>
                  </div>
                  <span className="text-micro font-mono font-bold px-2 py-0.5 rounded bg-[var(--acc)] text-[var(--on-acc)] shrink-0">
                    Revisar kilometraje
                  </span>
                </div>
              );
            }

            if (targetDate) {
              return (
                <div className="p-2 rounded-[var(--r-m)] bg-[var(--sunken)]/60 text-[var(--ok)] text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                  <span className="text-xs">
                    Agenda de {bandName || "la banda"} disponible para{" "}
                    {targetDate}
                  </span>
                </div>
              );
            }

            return null;
          })()}

          {/* 🏛️ HISTÓRICO DE BOLOS EN LA MISMA CIUDAD (Punto 4) */}
          {(() => {
            const cityHistory = getCityTourHistory(
              selectedLead.ciudad || selectedLead.region,
              concerts,
            );
            if (!cityHistory) return null;

            return (
              <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-between gap-2.5 flex-wrap animate-fadeIn">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0 text-[var(--ink)]">
                    <PartyPopper className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-[var(--acc)] block truncate">
                      Histórico en {cityHistory.ciudad} (
                      {cityHistory.totalConciertos}{" "}
                      {cityHistory.totalConciertos === 1
                        ? "concierto"
                        : "conciertos"}
                      )
                    </span>
                    <span className="text-xs text-[var(--ink-2)] block">
                      {cityHistory.resumenTexto}
                    </span>
                  </div>
                </div>

                <Button
                  variant="neutral"
                  size="xs"
                  type="button"
                  onClick={() => {
                    const current =
                      editedPitch || selectedLead.pitch_generado || "";
                    if (!current.includes(cityHistory.pitchSnippet)) {
                      const updated = current
                        ? `${current}\n\n${cityHistory.pitchSnippet}`
                        : cityHistory.pitchSnippet;
                      setEditedPitch(updated);
                      setIsEditingPitch(true);
                      if (onUpdateLead) {
                        onUpdateLead(selectedLead.id, {
                          pitch_generado: updated,
                        });
                      }
                    }
                  }}
                  className="items-center gap-1 shrink-0"
                  title="Inserta este hito histórico en el pitch para dar credibilidad de taquilla a la sala"
                >
                  <TrendingUp className="w-3 h-3 text-[var(--acc)]" />
                  <span>+ Citar hito en pitch</span>
                </Button>
              </div>
            );
          })()}

          {/* Display Fechas Libres Detectadas Pills if available */}
          {(() => {
            const campaignIsActive =
              activeCampaign &&
              (activeCampaign.isActive ??
                (activeCampaign as BookingCampaign & { is_active?: boolean }).is_active ??
                true);
            const fechasLibres =
              campaignIsActive && editedLeadInfo?.fechas_libres_campana
                ? editedLeadInfo.fechas_libres_campana
                : editedLeadInfo?.fechas_libres_detectadas &&
                    editedLeadInfo.fechas_libres_detectadas.length > 0
                  ? editedLeadInfo.fechas_libres_detectadas
                  : campaignIsActive &&
                      selectedLead?.fechas_libres_campana
                    ? selectedLead.fechas_libres_campana
                    : selectedLead?.fechas_libres_detectadas || [];

            const hasVerifiedSources =
              (Array.isArray(selectedLead?.radar_fuentes_verificadas) &&
                selectedLead.radar_fuentes_verificadas.length > 0) ||
              (Array.isArray(
                editedLeadInfo?.radar_fuentes_verificadas,
              ) &&
                editedLeadInfo.radar_fuentes_verificadas.length > 0);
            const hasOccupied =
              (selectedLead?.fechas_ocupadas?.length || 0) > 0 ||
              (editedLeadInfo?.fechas_ocupadas?.length || 0) > 0;
            const hasWegowOk =
              selectedLead?.radar_wegow_status === "ok" ||
              editedLeadInfo?.radar_wegow_status === "ok";
            const hasBandsintownOk =
              selectedLead?.radar_bandsintown_status === "ok" ||
              editedLeadInfo?.radar_bandsintown_status === "ok";

            const hasConcertsOrSources =
              selectedLead?.datos_fechas_encontrados === true ||
              editedLeadInfo?.datos_fechas_encontrados === true ||
              hasWegowOk ||
              hasBandsintownOk ||
              hasVerifiedSources ||
              hasOccupied;
            const hasNoData =
              !hasConcertsOrSources ||
              selectedLead?.datos_fechas_encontrados === false ||
              editedLeadInfo?.datos_fechas_encontrados === false;

            const wegowStatus =
              selectedLead?.radar_wegow_status ||
              ((selectedLead?.fechas_ocupadas?.length || 0) > 0
                ? "ok"
                : "sin_datos");
            const bandsintownStatus =
              selectedLead?.radar_bandsintown_status || "sin_datos";
            const contrastado = Boolean(
              selectedLead?.contrastado_multi_fuente ||
              (wegowStatus === "ok" && bandsintownStatus === "ok"),
            );

            if (hasNoData) {
              return (
                <div className="pt-1.5 border-t border-[var(--hair)]/80 flex flex-col gap-1.5">
                  <span className="text-micro text-[var(--ink)] font-sans font-medium flex items-center gap-1.5 bg-[var(--acc)]/40 px-2.5 py-1 rounded-[var(--r-s)]">
                    <AlertCircle className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                    (no se han encontrado datos de fechas de esta sala)
                  </span>
                  {(wegowStatus === "ok" || bandsintownStatus === "ok") && (
                    <div className="flex items-center gap-2 text-micro font-mono text-[var(--ink-2)] pl-1">
                      {wegowStatus === "ok" && (
                        <span>
                          Wegow: <strong className="text-[var(--ok)]">Conectado</strong>
                        </span>
                      )}
                      {wegowStatus === "ok" && bandsintownStatus === "ok" && <span>•</span>}
                      {bandsintownStatus === "ok" && (
                        <span>
                          Bandsintown: <strong className="text-[var(--acc)]">Contrastado</strong>
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div className="pt-1 border-t border-[var(--hair)]/80 flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className={`text-micro font-mono font-bold flex items-center gap-1 ${campaignIsActive ? "text-[var(--acc)]" : "text-[var(--acc)]"}`}
                  >
                    <CalendarCheck className="w-3 h-3 text-current" />
                    {campaignIsActive
                      ? "Fechas disponibles para la campaña:"
                      : "Fechas disponibles detectadas:"}
                  </span>
                  {fechasLibres.map((fecha: string, idx: number) => (
                    <Button
                      variant={campaignIsActive ? "primary" : "primary"}
                      size="xs"
                      key={`free-date-${idx}`}
                      type="button"
                      onClick={() => setShowWhatsAppModal(true)}
                      className="items-center gap-1"
                      title="Clic para proponer esta fecha por WhatsApp o Pitch"
                    >
                      <span>{fecha}</span>
                      <span className="text-micro opacity-70"><ShowIcon inline emoji="💬" /></span>
                    </Button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-micro font-mono text-[var(--ink-2)] pl-0.5">
                  {wegowStatus === "ok" && (
                    <a
                      href={`https://www.wegow.com/es-es/busqueda?query=${encodeURIComponent(selectedLead?.nombre_sala || editedLeadInfo?.nombre_sala || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-[var(--ok)] transition-colors cursor-pointer"
                      title="Clic para ver cartelera en Wegow"
                    >
                      <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--ok)]"></span>
                      <span>
                        Wegow: <strong className="text-[var(--ok)]">✓ OK</strong>
                      </span>
                      <ExternalLink className="w-2 h-2 opacity-60" />
                    </a>
                  )}
                  {wegowStatus === "ok" && bandsintownStatus === "ok" && <span>•</span>}
                  {bandsintownStatus === "ok" && (
                    <a
                      href={`https://www.bandsintown.com/a/search?q=${encodeURIComponent(selectedLead?.nombre_sala || editedLeadInfo?.nombre_sala || "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 hover:text-[var(--acc)] transition-colors cursor-pointer"
                      title="Clic para ver cartelera en Bandsintown"
                    >
                      <span className="w-1.5 h-1.5 rounded-[var(--r-pill)] bg-[var(--acc)]"></span>
                      <span>
                        Bandsintown: <strong className="text-[var(--acc)]">✓ OK</strong>
                      </span>
                      <ExternalLink className="w-2 h-2 opacity-60" />
                    </a>
                  )}
                  {contrastado && (
                    <span className="text-[var(--on-acc)] font-bold bg-[var(--acc)] px-1 py-0.2 rounded ">
                      <ShowIcon inline emoji="⭐" />Multi-fuente contrastada
                    </span>
                  )}
                </div>
              </div>
            );
          })()}
        </div>
    </>
  );
}
