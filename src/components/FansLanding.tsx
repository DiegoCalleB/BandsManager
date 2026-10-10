/**
 * Landing pública de fans ("Únete"): redes, conciertos, donaciones y formulario de alta.
 * Orquesta controlador, contexto y vistas; la lógica vive en `fans_landing/` (AGENTS.md §5.6).
 */
import React from "react";
import type { FanFormLanguage } from "../i18n/fansTranslations";
import type { Concert,EPKConfig } from "../types";
import { FansLandingForm } from "./fans_landing/FansLandingForm";
import { FansLandingProvider } from "./fans_landing/FansLandingProvider";
import { FansLandingSuccess } from "./fans_landing/FansLandingSuccess";
import { useFansLandingController } from "./fans_landing/hooks/useFansLandingController";

export interface FansLandingProps {
  currentBandId?: string;
  currentBandName?: string;
  currentBandLogo?: string;
  isPreview?: boolean;
  previewLanguage?: FanFormLanguage;
  previewConfig?: Partial<EPKConfig>;
  previewConcert?: Concert | null;
  previewConcertName?: string;
  previewView?: "form" | "success";
  onClosePreview?: () => void;
}

/**
 * Landing pública de fans.
 * @param props Banda, modo previsualización y callbacks.
 * @returns La pantalla de alta o la de éxito, con su contexto.
 */
export const FansLanding: React.FC<FansLandingProps> = (props) => {
  const controller = useFansLandingController({
    isPreview: props.isPreview ?? false,
    previewLanguage: props.previewLanguage,
    previewConcert: props.previewConcert,
    previewConcertName: props.previewConcertName,
    previewView: props.previewView ?? "form",
    previewConfig: props.previewConfig,
    initialBandId: props.currentBandId,
    initialBandName: props.currentBandName,
    initialBandLogo: props.currentBandLogo,
  });

  return (
    <FansLandingProvider value={{ ...controller, ...props, isPreview: props.isPreview ?? false }}>
      {controller.successData ? <FansLandingSuccess /> : <FansLandingForm />}
    </FansLandingProvider>
  );
};

export default FansLanding;
