/**
 * Paso de biografía: lema, formato, duración y generación con IA.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { EPKConfig } from "../../../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BioStepParams {
  epkConfig: EPKConfig;
  localBandName: string;
  genre: string;
  city: string;
}

/**
 * Paso de biografía: lema, formato, duración y generación con IA.
 * @param params Estado y callbacks del contenedor ({@link BioStepParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBioStep({ epkConfig, localBandName, genre, city }: BioStepParams) {
  // --- Step 2: Bio & Formato ---
  const [slogan, setSlogan] = useState(epkConfig?.fraseImpacto || "");

  const [bio, setBio] = useState(epkConfig?.biografia || "");

  const [formato, setFormato] = useState(
    epkConfig?.datosContratacion?.formatos || "Banda completa en directo",
  );

  const [numMusicos, setNumMusicos] = useState(
    epkConfig?.datosContratacion?.numMusicos || 4,
  );

  const [duracionDirecto, setDuracionDirecto] = useState(
    epkConfig?.datosContratacion?.duracionDirecto || "60 min",
  );

  // Generate Bio with AI
  const handleGenerateBioAI = () => {
    const aiBio = `${localBandName || "La banda"} es una formación musical de ${genre} nacida en ${city}. Con un sonido contundente y melodías adictivas, combinan la energía visceral de sus directos con letras honestas que conectan de inmediato con el público. Preparados para girar por todo el circuito de salas y festivales.`;
    setBio(aiBio);
    if (!slogan) {
      setSlogan(`Sonido ${genre} con la máxima potencia de directo.`);
    }
  };

  return { setSlogan, setFormato, setNumMusicos, setDuracionDirecto, setBio, slogan, bio, formato, numMusicos, duracionDirecto, handleGenerateBioAI };
}
