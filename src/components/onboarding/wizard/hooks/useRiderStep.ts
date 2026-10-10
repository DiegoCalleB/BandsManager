import { epkDe } from "../epkLegacy";
/**
 * Paso de rider técnico: texto, PDF y necesidades de escenario.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React,{ useState } from "react";
import { EPKConfig } from "../../../../types";
import { uploadFileToServer } from "../../../../utils/audioStorage";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface RiderStepParams {
  epkConfig: EPKConfig;
  activeBandId: string;
}

/**
 * Paso de rider técnico: texto, PDF y necesidades de escenario.
 * @param params Estado y callbacks del contenedor ({@link RiderStepParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useRiderStep({ epkConfig, activeBandId }: RiderStepParams) {
  // --- Step 7: Rider Técnico ---
  const [riderTecnicoText, setRiderTecnicoText] = useState(
    epkDe(epkConfig)?.riderTecnico || epkConfig?.dossierTextoExtra || "",
  );

  const [riderPdfUrl, setRiderPdfUrl] = useState(
    epkDe(epkConfig)?.riderPdfUrl || "",
  );

  const [riderPdfName, setRiderPdfName] = useState(
    epkDe(epkConfig)?.riderPdfName || "",
  );

  const [isUploadingRider, setIsUploadingRider] = useState(false);

  const [canalesMesa, setCanalesMesa] = useState(
    epkDe(epkConfig)?.canalesMesa || 12,
  );

  const [llevaMicrofoniaPropia, setLlevaMicrofoniaPropia] = useState(
    Boolean(epkDe(epkConfig)?.llevaMicrofoniaPropia),
  );

  const [llevaInEars, setLlevaInEars] = useState(
    Boolean(epkDe(epkConfig)?.llevaInEars),
  );

  const [necesitaBacklineBateria, setNecesitaBacklineBateria] = useState(
    Boolean(epkDe(epkConfig)?.necesitaBacklineBateria),
  );

  // Upload Rider PDF
  const handleRiderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingRider(true);
    try {
      const url = await uploadFileToServer(file, {
        bandId: activeBandId,
        category: "rider",
      });
      if (url) {
        setRiderPdfUrl(url);
        setRiderPdfName(file.name);
      }
    } catch (err) {
      console.error("Error uploading rider:", err);
    } finally {
      setIsUploadingRider(false);
    }
  };

  return { setRiderTecnicoText, setRiderPdfUrl, setRiderPdfName, setCanalesMesa, setLlevaMicrofoniaPropia, setLlevaInEars, setNecesitaBacklineBateria, riderTecnicoText, riderPdfUrl, riderPdfName, canalesMesa, llevaMicrofoniaPropia, llevaInEars, necesitaBacklineBateria, isUploadingRider, handleRiderUpload };
}
