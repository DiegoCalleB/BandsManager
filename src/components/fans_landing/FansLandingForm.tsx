
import { FansLandingBody } from "./FansLandingBody";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";
/**
 * Pantalla principal de la landing: identidad, redes, conciertos y formulario Únete.
 * Extraído de FansLanding.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */



import { useFansLanding } from "./FansLandingContext";

/**
 * Pantalla principal de la landing: identidad, redes, conciertos y formulario Únete.
 * @returns Pantalla completa de la landing.
 */
export function FansLandingForm() {
  const { isPreview } = useFansLanding();
  return (
    <div
      className={`${isPreview ? "min-h-full p-2 sm:p-4" : "min-h-screen p-4 pt-8 sm:items-center sm:pt-4"} bg-[var(--bg)] flex items-start justify-center`}
    >
      <FansLandingBody />

      <PrivacyPolicyModal />
    </div>
  );
}
