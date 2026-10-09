/**
 * Barra de acciones rápidas de booking.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { Zap, MessageCircle, Smartphone, Phone, PhoneCall } from "lucide-react";
import { Lead } from "../../../types";
import React, { Dispatch, SetStateAction } from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueQuickActionBarProps {
  setShowFastDealModal: Dispatch<SetStateAction<boolean>>;
  setShowWhatsAppModal: Dispatch<SetStateAction<boolean>>;
  selectedLead: Lead;
}

/**
 * Barra de acciones rápidas de booking.
 * @param props Estado y callbacks del contenedor ({@link VenueQuickActionBarProps}).
 * @returns Sección de interfaz.
 */
export function VenueQuickActionBar({ setShowFastDealModal, setShowWhatsAppModal, selectedLead }: VenueQuickActionBarProps) {
  return (
    <>
{/* Quick Action Bar for Booking Manager */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1">
          {/* Botón 1-Click Deal */}
          <button
            type="button"
            onClick={() => setShowFastDealModal(true)}
            className="py-2.5 px-3 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-500 border border-emerald-500/30 rounded-[var(--r-m)] font-bold text-xs flex items-center justify-center gap-2 transition-ui cursor-pointer group shadow-2xs"
            title="Generar Hoja de Acuerdo y Enlace 1-Click para la Sala"
          >
            <Zap className="w-4 h-4 fill-current shrink-0 text-emerald-500" />
            <span>Cerrar Bolo 1-Click</span>
          </button>

          {/* Botón WhatsApp — Abre el visual preview drawer con mensaje adaptado y wa.me */}
          <button
            type="button"
            onClick={() => setShowWhatsAppModal(true)}
            className="py-2.5 px-3 bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--on-ok)] rounded-[var(--r-m)] font-bold text-xs flex items-center justify-center gap-2 transition-ui cursor-pointer group"
            title={
              selectedLead.telefono_movil
                ? `Abrir propuesta para WhatsApp (${selectedLead.telefono_movil})`
                : "Escribir propuesta por WhatsApp"
            }
          >
            <MessageCircle className="w-4 h-4 text-[var(--ok)] shrink-0 transition-transform" />
            <span>
              WhatsApp {selectedLead.telefono_movil ? "Móvil" : "Directo"}
            </span>
          </button>

          {selectedLead.telefono_movil ? (
            <a
              href={`tel:${selectedLead.telefono_movil}`}
              className="py-2.5 px-3 bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--on-acc)] rounded-[var(--r-m)] font-bold text-xs flex items-center justify-center gap-2 transition-ui cursor-pointer"
              title={`Llamar al teléfono móvil: ${selectedLead.telefono_movil}`}
            >
              <Smartphone className="w-4 h-4 text-[var(--acc)] shrink-0" />
              <span>Llamar móvil</span>
            </a>
          ) : null}

          {selectedLead.telefono_fijo ? (
            <a
              href={`tel:${selectedLead.telefono_fijo}`}
              className="py-2.5 px-3 bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--on-acc)] rounded-[var(--r-m)] font-bold text-xs flex items-center justify-center gap-2 transition-ui cursor-pointer"
              title={`Llamar al teléfono fijo: ${selectedLead.telefono_fijo}`}
            >
              <Phone className="w-4 h-4 text-[var(--acc)] shrink-0" />
              <span>Llamar fijo</span>
            </a>
          ) : !selectedLead.telefono_movil && selectedLead.telefono ? (
            <a
              href={`tel:${selectedLead.telefono}`}
              className="py-2.5 px-3 bg-[var(--bg)]/90 hover:bg-[var(--tentative)] text-[var(--ink-2)] rounded-[var(--r-m)] font-bold text-xs flex items-center justify-center gap-2 transition-ui cursor-pointer"
            >
              <PhoneCall className="w-4 h-4 text-[var(--ink-2)]" />
              <span>Llamar por Tel</span>
            </a>
          ) : null}
        </div>
    </>
  );
}
