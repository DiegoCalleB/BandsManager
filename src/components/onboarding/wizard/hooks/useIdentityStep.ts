/**
 * Paso de identidad: nombre, género, idioma, tipografía, ciudad y logo.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useState } from "react";
import { EPKConfig,User } from "../../../../types";
import { uploadFileToServer } from "../../../../utils/audioStorage";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface IdentityStepParams {
  bandName: string;
  currentUser: User;
  epkConfig: EPKConfig;
  bandLogoUrl: string;
  activeBandId: string;
}

/**
 * Paso de identidad: nombre, género, idioma, tipografía, ciudad y logo.
 * @param params Estado y callbacks del contenedor ({@link IdentityStepParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useIdentityStep({ bandName, currentUser, epkConfig, bandLogoUrl, activeBandId }: IdentityStepParams) {
  // --- Step 1: Identidad & Idioma ---
  const [localBandName, setLocalBandName] = useState(
    bandName || currentUser?.bandName || "",
  );

  const [genre, setGenre] = useState(epkConfig?.genero || "Indie Rock");

  const [language, setLanguage] = useState(epkConfig?.idioma || "Español");

  const [fontStyle, setFontStyle] = useState(
    epkConfig?.fontStyle || epkConfig?.tipografia || "anton",
  );

  const [city, setCity] = useState(
    epkConfig?.datosContratacion?.ciudadBase || "Madrid, España",
  );

  const [logoUrl, setLogoUrl] = useState(
    epkConfig?.logoUrl || bandLogoUrl || "",
  );

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  // --- Handlers ---

  // Upload Logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const url = await uploadFileToServer(file, {
        bandId: activeBandId,
        category: "logo",
      });
      if (url) {
        setLogoUrl(url);
      }
    } catch (err) {
      console.error("Error uploading logo:", err);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  return { localBandName, genre, city, logoUrl, setLocalBandName, setLogoUrl, setGenre, setLanguage, setFontStyle, setCity, language, fontStyle, isUploadingLogo, handleLogoUpload };
}
