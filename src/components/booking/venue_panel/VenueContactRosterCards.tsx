/**
 * Tarjeta de contacto y ubicación y roster de artistas representados.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { ShowIcon } from "../../ui/ShowIcon";
import { getWhatsAppUrl, WHATSAPP_WINDOW_NAME, openWhatsAppChat } from "../../../utils/whatsapp";
import { Smartphone, Phone, PhoneCall, Sparkles } from "lucide-react";
import { Button } from "../../ui";
import DirectionsCard from "../../DirectionsCard";
import { Lead } from "../../../types";
import React from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueContactRosterCardsProps {
  selectedLead: Lead;
  handleEnrichLead: () => Promise<void>;
  isEnrichingLead: boolean;
  enrichStatusMsg: string;
  autoDetectVenueAddress: (venueName: string, city: string) => string;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
}

/**
 * Tarjeta de contacto y ubicación y roster de artistas representados.
 * @param props Estado y callbacks del contenedor ({@link VenueContactRosterCardsProps}).
 * @returns Sección de interfaz.
 */
export function VenueContactRosterCards({ selectedLead, handleEnrichLead, isEnrichingLead, enrichStatusMsg, autoDetectVenueAddress, onUpdateLead }: VenueContactRosterCardsProps) {
  return (
    <>
{/* CONTACT & LOCATION CARD */}
      <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-2.5800">
        <div className="flex items-center justify-between">
          <p className="text-micro font-sans font-bold text-[var(--ink-2)]">
            Ficha de contacto y ubicación
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {selectedLead.email_contacto && (
              <span
                className="text-xs text-[var(--acc)]/70 font-sans font-medium truncate max-w-[200px] notranslate"
                translate="no"
                title={`Email Principal: ${selectedLead.email_contacto}`}
              >
                <ShowIcon inline emoji="✉️" />{selectedLead.email_contacto}
              </span>
            )}
            {selectedLead.email_secundario && (
              <span
                className="text-xs text-[var(--acc)]/80 font-sans font-medium truncate max-w-[200px] notranslate"
                translate="no"
                title={`Email Secundario / Promotora: ${selectedLead.email_secundario}`}
              >
                <ShowIcon inline emoji="✉️" />2 {selectedLead.email_secundario}
              </span>
            )}
            {selectedLead.telefono_movil && (
              <a
                href={getWhatsAppUrl(selectedLead.telefono_movil)}
                target={WHATSAPP_WINDOW_NAME}
                onClick={(e) => {
                  e.preventDefault();
                  openWhatsAppChat(selectedLead.telefono_movil);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--ok)] text-[var(--on-ok)] text-xs font-mono font-bold hover:bg-[var(--ok)] transition-colors shadow-2xs"
                title={`WhatsApp móvil: ${selectedLead.telefono_movil}`}
              >
                <Smartphone className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />
                <span>{selectedLead.telefono_movil}</span>
              </a>
            )}
            {selectedLead.telefono_fijo && (
              <a
                href={`tel:${selectedLead.telefono_fijo}`}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--acc)] text-[var(--on-acc)] text-xs font-mono font-bold hover:bg-[var(--acc)] transition-colors shadow-2xs"
                title={`Teléfono fijo: ${selectedLead.telefono_fijo}`}
              >
                <Phone className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />
                <span>{selectedLead.telefono_fijo}</span>
              </a>
            )}
            {!selectedLead.telefono_movil &&
              !selectedLead.telefono_fijo &&
              selectedLead.telefono && (
                <span
                  className="text-xs text-[var(--ink-2)] font-mono font-medium inline-flex items-center gap-1"
                  title={`Teléfono: ${selectedLead.telefono}`}
                >
                  <PhoneCall className="w-3.5 h-3.5 text-[var(--ink-2)] shrink-0" />
                  <span>{selectedLead.telefono}</span>
                </span>
              )}
            <Button
              variant="neutral"
              size="xs"
              onClick={handleEnrichLead}
              disabled={isEnrichingLead}
              className="items-center gap-1.5"
              title="Scout Enriquecedor: Completa emails, webs y datos faltantes sin alucinaciones"
            >
              <Sparkles
                className={`w-3 h-3 text-[var(--acc)] ${isEnrichingLead ? "animate-spin" : ""}`}
              />
              <span>
                {isEnrichingLead ? "Completando..." : "Scout Enriquecedor"}
              </span>
            </Button>
          </div>
        </div>

        {enrichStatusMsg && (
          <div className="p-2 bg-[var(--acc)]/10 rounded-[var(--r-s)] text-[var(--ink)] text-xs font-sans flex items-center gap-1.5 animate-fadeIn">
            <span>{enrichStatusMsg}</span>
          </div>
        )}

        {selectedLead.direccion ? (
          <p className="text-xs font-sans font-bold text-[var(--ink)]">
            {selectedLead.direccion}
          </p>
        ) : (
          <button
            onClick={() => {
              const detected = autoDetectVenueAddress(
                selectedLead.nombre_sala,
                selectedLead.ciudad,
              );
              onUpdateLead(selectedLead.id, { direccion: detected });
            }}
            className="text-xs font-sans font-bold text-[var(--acc)] hover:text-[var(--acc)] cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-detectar dirección exacta
          </button>
        )}

        <div className="pt-1 flex justify-center">
          <DirectionsCard
            query={
              selectedLead.direccion ||
              `${selectedLead.nombre_sala}, ${selectedLead.ciudad}`
            }
            locationName={selectedLead.nombre_sala}
            address={selectedLead.direccion || selectedLead.ciudad}
          />
        </div>
      </div>

      {/* ROSTER / ARTISTAS REPRESENTADOS (Si aplica) */}
      {(selectedLead.roster ||
        ["agencia", "manager", "productora", "sello", "grupo"].includes(
          String(selectedLead.tipo || "").toLowerCase(),
        )) && (
        <div className="bg-[var(--sunken)] rounded-[var(--r-m)] p-4 space-y-2">
          <p className="text-micro font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
            <span><ShowIcon inline emoji="🎸" /></span> Róster de Artistas y Servicios de Representación
          </p>
          {selectedLead.roster ? (
            <p className="text-xs font-sans text-[var(--ink)] bg-[var(--surface)] p-2.5 rounded-[var(--r-s)] leading-relaxed">
              {selectedLead.roster}
            </p>
          ) : (
            <p className="text-xs font-sans text-[var(--ink-2)] italic">
              Sin róster especificado. Haz clic en el botón de edición para
              añadir las bandas que gestiona.
            </p>
          )}
        </div>
      )}
    </>
  );
}
