/**
 * Simulador interactivo de taquilla, caché y break-even del lead.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
 
import { Calculator, RefreshCw, Coins } from "lucide-react";
import { Button, Input } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import React, { Dispatch, SetStateAction } from "react";
import { Lead } from "../../../types";

/** Estado y callbacks que el contenedor inyecta a la sección. */
export interface VenueFinancialSimulatorCardProps {
  handleRecalculateFinancial: (overrideData?: { precioAnticipada: number; precioTaquilla: number; alquilerSalaFijo: number; porcentajeSala: number; gastosProduccionFijos: number; numMusicos: number; }) => Promise<void>;
  isRecalculatingFinancial: boolean;
  simAnticipada: number;
  setSimAnticipada: Dispatch<SetStateAction<number>>;
  simTaquilla: number;
  setSimTaquilla: Dispatch<SetStateAction<number>>;
  simAlquiler: number;
  setSimAlquiler: Dispatch<SetStateAction<number>>;
  simPctSala: number;
  setSimPctSala: Dispatch<SetStateAction<number>>;
  simGastosProd: number;
  setSimGastosProd: Dispatch<SetStateAction<number>>;
  simNumMusicos: number;
  setSimNumMusicos: Dispatch<SetStateAction<number>>;
  selectedLead: Lead;
}

/**
 * Simulador interactivo de taquilla, caché y break-even del lead.
 * @param props Estado y callbacks del contenedor ({@link VenueFinancialSimulatorCardProps}).
 * @returns Sección de interfaz.
 */
export function VenueFinancialSimulatorCard({ handleRecalculateFinancial, isRecalculatingFinancial, simAnticipada, setSimAnticipada, simTaquilla, setSimTaquilla, simAlquiler, setSimAlquiler, simPctSala, setSimPctSala, simGastosProd, setSimGastosProd, simNumMusicos, setSimNumMusicos, selectedLead }: VenueFinancialSimulatorCardProps) {
  return (
    <>
{/* 7. HERRAMIENTA 5: SIMULADOR INTERACTIVO DE TAQUILLA, CACHÉ & BREAK-EVEN (P&L FINANCIERO) */}
          <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3.5 bg-[var(--ok)]/10">
            <div className="flex items-center justify-between border-b border-[var(--hair)]/80 pb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2 text-[var(--ok)] font-bold text-xs">
                <Calculator className="w-4 h-4" />
                <span className="text-sm">
                  Simulador de Taquilla, Caché y Break-Even (P&L por Concierto)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="xs"
                  type="button"
                  onClick={() => handleRecalculateFinancial()}
                  disabled={isRecalculatingFinancial}
                  className="items-center gap-1.5"
                >
                  <RefreshCw
                    className={`w-3.5 h-3.5 ${isRecalculatingFinancial ? "animate-spin" : ""}`}
                  />
                  <span>Recalcular y guardar P&L</span>
                </Button>
              </div>
            </div>

            {/* Inputs de simulación */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🎟️" />Anticipada (€)
                </label>
                <Input size="sm" aria-label="Anticipada (€)"
                  type="number"
                  value={simAnticipada}
                  onChange={(e) => setSimAnticipada(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🚪" />Puerta (€)
                </label>
                <Input size="sm" aria-label="Puerta (€)"
                  type="number"
                  value={simTaquilla}
                  onChange={(e) => setSimTaquilla(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🏢" />Alquiler sala (€)
                </label>
                <Input size="sm" aria-label="Alquiler sala (€)"
                  type="number"
                  value={simAlquiler}
                  onChange={(e) => setSimAlquiler(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  % Sala / taquilla
                </label>
                <Input size="sm" aria-label="% Sala / taquilla"
                  type="number"
                  value={simPctSala}
                  onChange={(e) => setSimPctSala(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🚐" />Gastos Viaje/Prod (€)
                </label>
                <Input size="sm" aria-label="Gastos Viaje/Prod (€)"
                  type="number"
                  value={simGastosProd}
                  onChange={(e) => setSimGastosProd(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)] space-y-1">
                <label className="text-micro text-[var(--ink-2)] block font-medium">
                  <ShowIcon inline emoji="🎸" />Nº Músicos
                </label>
                <Input size="sm" aria-label="Nº Músicos"
                  type="number"
                  value={simNumMusicos}
                  onChange={(e) => setSimNumMusicos(Number(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Resultados de rentabilidad */}
            {selectedLead.financial_break_even ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--ok)]/30 text-center">
                    <span className="text-micro text-[var(--ok)] font-bold block">
                      Punto de Equilibrio
                    </span>
                    <span className="text-xl font-extrabold text-[var(--ok)] font-mono block">
                      {selectedLead.financial_break_even.entradas_break_even}
                    </span>
                    <span className="text-micro text-[var(--ink-2)] block">
                      entradas para no perder (€0)
                    </span>
                  </div>

                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] text-center">
                    <span className="text-micro text-[var(--ink-2)] font-bold block">
                      % Aforo Requerido
                    </span>
                    <span className="text-xl font-bold text-[var(--ink-2)] font-mono block">
                      {Math.round(
                        ((selectedLead.financial_break_even
                          .entradas_break_even || 1) /
                          (selectedLead.aforo || 250)) *
                          100,
                      )}
                      %
                    </span>
                    <span className="text-micro text-[var(--ink-2)] block">
                      de {selectedLead.aforo || 250} aforo máx.
                    </span>
                  </div>

                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--surface)] text-center">
                    <span className="text-micro text-[var(--ink-2)] font-bold block">
                      Beneficio Banda (80% lleno)
                    </span>
                    <span className="text-xl font-bold text-[var(--ok)] font-mono block">
                      {
                        selectedLead.financial_break_even
                          .beneficio_estimado_lleno
                      }{" "}
                      €
                    </span>
                    <span className="text-micro text-[var(--ink-2)] block">
                      margen neto total
                    </span>
                  </div>

                  <div className="p-3 rounded-[var(--r-m)] bg-[var(--ok)]/40 text-center">
                    <span className="text-micro text-[var(--ok)] font-bold block">
                      Limpio por músico
                    </span>
                    <span className="text-xl font-extrabold text-[var(--ok)] font-mono block">
                      {
                        selectedLead.financial_break_even
                          .beneficio_por_musico_estimado
                      }{" "}
                      €
                    </span>
                    <span className="text-micro text-[var(--ok)]/80 block">
                      / cada uno (
                      {selectedLead.financial_break_even.num_musicos}{" "}
                      integrantes)
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--ok)]/20 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-[var(--ok)] shrink-0" />
                    <span className="text-[var(--ink-2)] text-xs">
                      Con{" "}
                      <strong className="text-[var(--ok)]">
                        {selectedLead.financial_break_even.entradas_break_even}{" "}
                        entradas
                      </strong>{" "}
                      cubrís íntegramente el alquiler de la sala ({simAlquiler}
                      €) y los gastos de furgoneta/sonido ({simGastosProd}€).
                    </span>
                  </div>
                  <span className="font-bold text-[var(--ok)] font-mono shrink-0 ml-2">
                    ✓ Margen Positivo
                  </span>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center text-[var(--ink-2)] text-xs italic">
                Ajusta los precios y pulsa “Recalcular y Guardar P&L” para
                simular la rentabilidad del concierto.
              </div>
            )}
          </div>
    </>
  );
}
