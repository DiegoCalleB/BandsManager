/**
 * Paso 2 de la creación de banda: elección de plan.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ArrowLeft,X } from "lucide-react";
import { Button,IconButton } from "../ui";
import { ShowIcon } from "../ui/ShowIcon";
import { useBandSwitcher } from "./BandSwitcherContext";
import { PlanCardCabezaDeCartel } from "./PlanCardCabezaDeCartel";
import { PlanCardDeGira } from "./PlanCardDeGira";
import { PlanCardEnsayo } from "./PlanCardEnsayo";
import { PlanCardLocal } from "./PlanCardLocal";

/**
 * Paso 2 de la creación de banda: elección de plan.
 * @returns Sección de interfaz.
 */
export function CreateBandStepTwo() {
  const { createBandStep, setCreateBandStep, isCreatingBand, setShowCreateBandModal, newBandName, newBandFeatureCategory, setNewBandFeatureCategory,} = useBandSwitcher();
  return (
    <>
{createBandStep === 2 && (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between">
                    <Button
                      variant="neutral"
                      size="xs"
                      type="button"
                      onClick={() => setCreateBandStep(1)}
                      disabled={isCreatingBand}
                      className="items-center gap-2"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Volver a datos de la banda</span>
                    </Button>
                    <IconButton
                      label="Cerrar"
                      type="button"
                      onClick={() => setShowCreateBandModal(false)}
                      disabled={isCreatingBand}
                    >
                      <X className="w-5 h-5" />
                    </IconButton>
                  </div>

                  <div className="text-center space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-bold text-[var(--ink-2)] ">
                      Elige el plan para{" "}
                      <span className="text-[var(--acc)]">
                        {newBandName.trim() || "tu Proyecto"}
                      </span>
                    </h2>
                    <p className="text-[var(--ink-2)] max-w-xl mx-auto text-xs sm:text-sm">
                      Sube de nivel tu carrera musical. Puedes cambiar de plan
                      en cualquier momento.
                    </p>

                    {/* Filter category pills */}
                    <div className="flex flex-wrap items-center justify-center gap-2 pt-3">
                      <Button
                        variant={newBandFeatureCategory === "all" ? "inverse" : "neutral"}
                        size="xs"
                        type="button"
                        onClick={() => setNewBandFeatureCategory("all")}
                      >
                        Todas las funciones
                      </Button>
                      <Button
                        variant={newBandFeatureCategory === "booking" ? "inverse" : "neutral"}
                        size="xs"
                        type="button"
                        onClick={() => setNewBandFeatureCategory("booking")}
                      >
                        <ShowIcon inline emoji="🎯" />Booking y salas
                      </Button>
                      <Button
                        variant={newBandFeatureCategory === "media" ? "inverse" : "neutral"}
                        size="xs"
                        type="button"
                        onClick={() => setNewBandFeatureCategory("media")}
                      >
                        <ShowIcon inline emoji="📱" />Redes, EPK y fans
                      </Button>
                      <Button
                        variant={newBandFeatureCategory === "finance" ? "inverse" : "neutral"}
                        size="xs"
                        type="button"
                        onClick={() => setNewBandFeatureCategory("finance")}
                      >
                        <ShowIcon inline emoji="💼" />Finanzas y agentes 360
                      </Button>
                    </div>
                  </div>

                  {/* 4 Pricing & Plan Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-stretch pt-2">
                    {/* PLAN 1: ENSAYO */}
                    <PlanCardEnsayo />

                    {/* PLAN 2: LOCAL */}
                    <PlanCardLocal />

                    {/* PLAN 3: DE GIRA (Destacado) */}
                    <PlanCardDeGira />

                    {/* PLAN 4: CABEZA DE CARTEL */}
                    <PlanCardCabezaDeCartel />
                  </div>
                </div>
              )}
    </>
  );
}
