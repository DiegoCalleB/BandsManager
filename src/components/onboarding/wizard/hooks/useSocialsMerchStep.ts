import { epkDe } from "../epkLegacy";
/**
 * Paso de redes y merchandising.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { EPKConfig } from "../../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface SocialsMerchStepParams {
  epkConfig: EPKConfig;
}

/**
 * Paso de redes y merchandising.
 * @param params Estado y callbacks del contenedor ({@link SocialsMerchStepParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useSocialsMerchStep({ epkConfig }: SocialsMerchStepParams) {
  // --- Step 4: Redes & Merch ---
  const [socialLinks, setSocialLinks] = useState({
    instagram: epkConfig?.enlacesRedes?.instagram || "",
    spotify: epkConfig?.enlacesRedes?.spotify || "",
    youtube: epkConfig?.enlacesRedes?.youtube || "",
    tiktok: epkConfig?.enlacesRedes?.tiktok || "",
    website: epkConfig?.enlacesRedes?.website || "",
    whatsapp: epkConfig?.enlacesRedes?.whatsapp || "",
  });

  const [merchStoreUrl, setMerchStoreUrl] = useState(
    epkDe(epkConfig)?.tiendaMerchUrl || "",
  );

  const [merchHighlight, setMerchHighlight] = useState(
    epkDe(epkConfig)?.merchDestacado || "",
  );

  return { setSocialLinks, socialLinks, merchStoreUrl, merchHighlight, setMerchStoreUrl, setMerchHighlight };
}
