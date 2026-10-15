/**
 * Controlador de la landing pública de fans: idioma, formulario, perfil de banda, pagos y reproducción.
 * Extraído de FansLanding.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { FanFormLanguage } from "../../../i18n/fansTranslations";
import { Concert,EPKConfig } from "../../../types";
import { useAudioPreview } from "./useAudioPreview";
import { useFanBandProfile } from "./useFanBandProfile";
import { useFanEngagement } from "./useFanEngagement";
import { useFanJoinForm } from "./useFanJoinForm";
import { useFanLanguage } from "./useFanLanguage";
import { useFanPayments } from "./useFanPayments";
import { useFanSignupSubmit } from "./useFanSignupSubmit";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface FansLandingControllerParams {
  isPreview: boolean;
  previewLanguage: FanFormLanguage;
  previewConcert: Concert;
  previewConcertName: string;
  previewView: "form" | "success";
  previewConfig: Partial<EPKConfig>;
  initialBandId: string;
  initialBandName: string;
  initialBandLogo: string;
}

/**
 * Controlador de la landing pública de fans: idioma, formulario, perfil de banda, pagos y reproducción.
 * @param params Estado y callbacks del contenedor ({@link FansLandingControllerParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useFansLandingController({ isPreview, previewLanguage, previewConcert, previewConcertName, previewView, previewConfig, initialBandId, initialBandName, initialBandLogo }: FansLandingControllerParams) {
  const { t, conciertoLanguage, language, setLanguage, availableLanguages } = useFanLanguage({ isPreview, previewLanguage });

  const { setConcertName, setFormData, setIsConcertLink, setConcertId, concertId, activeTab, formData, setError, setLoading, setSuccessData, concertName, successData, isConcertLink, setActiveTab, error, setShowPrivacyModal, loading, showPrivacyModal } = useFanJoinForm({ previewConcert, previewConcertName, isPreview, previewView, previewConfig });


  const { setImgError, bandName, resolvedBandId, audioPreviewConfig, donacionRevolut, socialLinks, contactoBooking, logoUrl, imgError, miembros, upcomingConcerts } = useFanBandProfile({ isPreview, previewConfig, previewConcert, previewConcertName, initialBandId, initialBandName, initialBandLogo, setConcertId, setConcertName, setIsConcertLink });


  const { trackClick, clickCounts, handleShareWithFriend, copiedShareLink } = useFanEngagement({ bandName, resolvedBandId, concertId, previewConcert, activeTab });

  const { toggleAudioPreview, isPlayingAudioPreview } = useAudioPreview({ audioPreviewConfig, trackClick });

  const { revolutUrl, paypalUrl, hasBizum, hasRevolut, hasPaypal, revolutDisplay, paypalDisplay, handleCopyBizum, bizumPhone, copiedBizum } = useFanPayments({ donacionRevolut, socialLinks, trackClick });

  // El Dossier/EPK público, mismo patrón de URL que usa EPKManager.tsx: a diferencia de
  // Revolut/PayPal, este enlace no depende de que la banda lo configure, siempre existe.
  // Lleva &lang= con el idioma del concierto: así quien entra al EPK desde un Únete de Italia
  // lo ve en italiano por defecto, no en español. EpkLanguage y FanFormLanguage comparten
  // exactamente los mismos códigos (es/en/it/cs), así que conciertoLanguage vale tal cual.
  const epkUrl = `https://bandmanager.io/epk?band=${encodeURIComponent(resolvedBandId)}&lang=${encodeURIComponent(conciertoLanguage)}`;

  const { handleSubmit } = useFanSignupSubmit({ formData, setError, t, setLoading, isPreview, previewConfig, setSuccessData, resolvedBandId, concertId, concertName });

  const [showAllConcerts, setShowAllConcerts] = useState(false);

  const [showOptionalFields, setShowOptionalFields] = useState(false);

  return { revolutUrl, paypalUrl, hasBizum, donacionRevolut, language, t, bandName, clickCounts, hasRevolut, hasPaypal, trackClick, revolutDisplay, paypalDisplay, handleCopyBizum, bizumPhone, copiedBizum, successData, setSuccessData, setFormData, isConcertLink, setLanguage, availableLanguages, handleShareWithFriend, copiedShareLink, socialLinks, epkUrl, contactoBooking, logoUrl, imgError, setImgError, concertName, audioPreviewConfig, toggleAudioPreview, isPlayingAudioPreview, activeTab, setActiveTab, miembros, upcomingConcerts, showAllConcerts, setShowAllConcerts, handleSubmit, error, formData, setShowOptionalFields, showOptionalFields, setShowPrivacyModal, loading, resolvedBandId, showPrivacyModal };
}
