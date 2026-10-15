import { epkDe } from "../epkLegacy";
/**
 * Pasos de condiciones de booking y email del agente: caché, desplazamientos, contacto y firma.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { EPKConfig,User } from "../../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BookingAndAgentStepParams {
  epkConfig: EPKConfig;
  currentUser: User;
}

/**
 * Pasos de condiciones de booking y email del agente: caché, desplazamientos, contacto y firma.
 * @param params Estado y callbacks del contenedor ({@link BookingAndAgentStepParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBookingAndAgentStep({ epkConfig, currentUser }: BookingAndAgentStepParams) {
  // --- Step 9: Caché & Condiciones (Only if hasBookingAccess) ---
  const [cacheAcustico, setCacheAcustico] = useState(
    epkDe(epkConfig)?.datosContratacion?.cacheMinimo || 400,
  );

  const [cacheSala, setCacheSala] = useState(
    epkDe(epkConfig)?.datosContratacion?.cacheMaximo || 850,
  );

  const [cacheFestival, setCacheFestival] = useState(
    epkDe(epkConfig)?.cacheFestival || 1800,
  );

  const [condicionesKm, setCondicionesKm] = useState(
    epkDe(epkConfig)?.condicionesKm || "0,25 €/km a partir de 100 km",
  );

  const [requiereAlojamiento, setRequiereAlojamiento] = useState(true);

  const [contactoBookingNombre, setContactoBookingNombre] = useState(
    epkConfig?.contactoBooking?.nombre || currentUser?.name || "",
  );

  const [contactoBookingEmail, setContactoBookingEmail] = useState(
    epkConfig?.contactoBooking?.email || currentUser?.email || "",
  );

  const [contactoBookingTelefono, setContactoBookingTelefono] = useState(
    epkConfig?.contactoBooking?.telefono || "",
  );

  // --- Step 10: Agente IA & Email (Only if hasAiAgentAccess) ---
  const [signatureName, setSignatureName] = useState(currentUser?.name || "");

  const [signatureCargo, setSignatureCargo] = useState("Booking & Management");

  const [signaturePhone, setSignaturePhone] = useState("");

  const [senderEmail, setSenderEmail] = useState(currentUser?.email || "");

  return { cacheSala, setContactoBookingNombre, setContactoBookingEmail, setContactoBookingTelefono, contactoBookingNombre, contactoBookingEmail, contactoBookingTelefono, cacheAcustico, setCacheAcustico, setCacheSala, cacheFestival, setCacheFestival, condicionesKm, setCondicionesKm, requiereAlojamiento, setRequiereAlojamiento, signatureName, setSignatureName, signatureCargo, setSignatureCargo, signaturePhone, setSignaturePhone, senderEmail, setSenderEmail };
}
