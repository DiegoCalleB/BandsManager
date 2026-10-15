/**
 * Modal de creación de banda en dos pasos con selección de plan.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useBandSwitcher } from "./BandSwitcherContext";
import { CreateBandStepOne } from "./CreateBandStepOne";
import { CreateBandStepTwo } from "./CreateBandStepTwo";

/**
 * Modal de creación de banda en dos pasos con selección de plan.
 * @returns Sección de interfaz.
 */
export function CreateBandModal() {
  const { showCreateBandModal, createBandStep,} = useBandSwitcher();
  return (
    <>
{/* In-App Create / Add Band Modal with Full 2-Step Flow & Plans */}
        {showCreateBandModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-[var(--scrim)]/85 animate-in fade-in duration-150 overflow-y-auto">
            <div
              className={`w-full ${createBandStep === 1 ? "max-w-lg" : "max-w-5xl"} rounded-[var(--r-l)] bg-[var(--surface)] text-[var(--ink-2)] p-6 sm:p-8 space-y-6 transition-ui duration-300 my-auto`}
            >
              {/* Step 1: Band Details */}
              <CreateBandStepOne />

              {/* Step 2: Plans Selection View (Identical to Login Registration Flow) */}
              <CreateBandStepTwo />
            </div>
          </div>
        )}
    </>
  );
}
