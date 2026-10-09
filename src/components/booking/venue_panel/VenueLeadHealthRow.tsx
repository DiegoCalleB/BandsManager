/**
 * Salud del lead, calidad y selector de categoría.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
/* eslint-disable
 @typescript-eslint/no-unused-vars,
 @typescript-eslint/no-explicit-any,
 react-hooks/exhaustive-deps
*/
import { LeadHealthBadge } from "../LeadHealthBadge";
import { ReliabilityBadge } from "../../common/ReliabilityBadge";
import { LeadType, LeadStatus, Lead } from "../../../types";
import React from "react";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueLeadHealthRowProps {
  selectedLead: Lead;
  onUpdateLead: (id: string, updates: Partial<Lead>) => void;
  getStatusDotColor: (status: string) => string;
  normalizeStatus: (status: string) => LeadStatus;
  handleCorrectStatus: (newStatus: LeadStatus) => void;
}

/**
 * Salud del lead, calidad y selector de categoría.
 * @param props Estado y callbacks del contenedor ({@link VenueLeadHealthRowProps}).
 * @returns Sección de interfaz.
 */
export function VenueLeadHealthRow({ selectedLead, onUpdateLead, getStatusDotColor, normalizeStatus, handleCorrectStatus }: VenueLeadHealthRowProps) {
  return (
    <>
{/* Lead Health / Temperature Badge & Quality Indicator & Category Selector */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1800/80">
          <div className="flex flex-wrap items-center gap-2">
            <LeadHealthBadge
              lead={selectedLead}
              showDescription={true}
              size="md"
            />
            <ReliabilityBadge item={selectedLead} size="md" />
            {selectedLead.ultimo_sentimiento && (
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-m)] bg-[var(--acc)]/40 text-xs font-sans text-[var(--ink)]"
                title={
                  selectedLead.ultimo_analisis_resumen ||
                  `Sentimiento: ${selectedLead.ultimo_sentimiento_label || selectedLead.ultimo_sentimiento}`
                }
              >
                <span className="font-bold">
                  {selectedLead.ultimo_sentimiento_label ||
                    selectedLead.ultimo_sentimiento}
                </span>
                {selectedLead.ultima_intencion_etiqueta && (
                  <span className="text-[var(--ink-2)] font-mono text-micro">
                    ({selectedLead.ultima_intencion_etiqueta})
                  </span>
                )}
                {selectedLead.temperatura_lead && (
                  <span className="text-micro px-1.5 py-0.2 rounded bg-[var(--acc)]/20 text-[var(--ink)] font-mono">
                    {selectedLead.temperatura_lead === "muy_caliente"
                      ? "Muy Caliente"
                      : selectedLead.temperatura_lead === "caliente"
                        ? "Caliente"
                        : selectedLead.temperatura_lead === "tibio"
                          ? "Tibio"
                          : "Frío"}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Category / Type Recategorizer */}
            <div className="flex items-center gap-1.5 bg-[var(--surface)] px-2.5 py-1 rounded-[var(--r-m)]">
              <span className="text-micro text-[var(--acc)] font-sans font-bold">
                Tipo:
              </span>
              <select data-raw
                value={String(selectedLead.tipo || "sala").toLowerCase()}
                onChange={(e) => {
                  const newType = e.target.value as LeadType;
                  onUpdateLead(selectedLead.id, { tipo: newType });
                }}
                className="text-xs font-sans font-bold text-[var(--acc)]/70 bg-transparent cursor-pointer focus:outline-none"
                title="Cambiar categoría / tipo de este lead"
              >
                <option
                  value="sala"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Sala de conciertos
                </option>
                <option
                  value="festival"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Festival
                </option>
                <option
                  value="ayuntamiento"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Ayuntamiento / fiestas
                </option>
                <option
                  value="discoteca"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Discoteca / Club
                </option>
                <option
                  value="grupo"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Grupo / banda aliada
                </option>
                <option
                  value="agencia"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Agencia de Booking
                </option>
                <option
                  value="manager"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Manager / Representante
                </option>
                <option
                  value="productora"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Productora de eventos
                </option>
                <option
                  value="sello"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Discográfica / Sello
                </option>
                <option
                  value="medio"
                  className="bg-[var(--bg)] text-[var(--ink)]"
                >
                  Medio / prensa / radio
                </option>
              </select>
            </div>

            {/* Status selector */}
            <div className="flex items-center gap-1.5 bg-[var(--surface)] px-2.5 py-1 rounded-[var(--r-m)]">
              <span
                className={`w-2 h-2 rounded-[var(--r-pill)] ${getStatusDotColor(selectedLead.estado)}`}
              />
              <select data-raw
                value={normalizeStatus(selectedLead.estado)}
                onChange={(e) =>
                  handleCorrectStatus(e.target.value as LeadStatus)
                }
                className="text-xs font-sans font-bold text-[var(--ink)] bg-transparent cursor-pointer focus:outline-none"
              >
                <option value="nuevo" className="bg-[var(--bg)]">
                  Por contactar (nuevo)
                </option>
                <option value="esperando_respuesta" className="bg-[var(--bg)]">
                  Contactado (esperando respuesta)
                </option>
                <option value="respondido" className="bg-[var(--bg)]">
                  En conversación (ha respondido)
                </option>
                <option value="negociando" className="bg-[var(--bg)]">
                  En negociación
                </option>
                <option value="confirmado" className="bg-[var(--bg)]">
                  Concierto confirmado 
                </option>
                <option value="aplazado" className="bg-[var(--bg)]">
                  Aplazado (recontactar luego) 
                </option>
                <option value="no_interesado" className="bg-[var(--bg)]">
                  Descartado / No interesado
                </option>
              </select>
            </div>
          </div>
        </div>
    </>
  );
}
