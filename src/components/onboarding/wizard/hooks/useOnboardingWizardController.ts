import { epkDe,type EpkWizardExtras } from "../epkLegacy";
import { useBioStep } from "./useBioStep";
import { useBookingAndAgentStep } from "./useBookingAndAgentStep";
import { useEventsStep } from "./useEventsStep";
import { useFansPaymentsStep } from "./useFansPaymentsStep";
import { useIdentityStep } from "./useIdentityStep";
import { useMembersStep } from "./useMembersStep";
import { useMusicSetlistStep } from "./useMusicSetlistStep";
import { usePhotosStep } from "./usePhotosStep";
import { usePressProofStep } from "./usePressProofStep";
import { useRiderStep } from "./useRiderStep";
import { useSocialsMerchStep } from "./useSocialsMerchStep";
import { useVideosStep } from "./useVideosStep";
import { useWizardSteps } from "./useWizardSteps";
/**
 * Controlador del asistente de configuración inicial: compone un hook por paso, hidrata el estado
 * desde la configuración del EPK, guarda y gestiona la navegación entre pasos.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useEffect } from "react";
import {
EPKConfig
} from "../../../../types";
import { markOnboardingCompleted } from "../../../../utils/userPreferences";

import {
WizardMemberItem
} from "../../types";


import type { ResolvedOnboardingWizardProps } from "../../OnboardingWizardModal";

/**
 * Estado y acciones del asistente de configuración inicial.
 * @param params Props del asistente con sus valores por defecto ya aplicados.
 * @returns Todo lo que consumen las vistas.
 */
export function useOnboardingWizardController({
  isOpen,
  onClose,
  currentUser,
  epkConfig,
  onUpdateEpkConfig,
  onSongsImported,
  onRefreshData,
  onAddConcert,
  onAddRehearsal,
  bandId,
  bandName,
  bandLogoUrl,
  bandPlan,
}: ResolvedOnboardingWizardProps) {
  const { currentStepIndex, activeSteps, setCurrentStepIndex, userPlanId, isCelebrationStep, currentStepDef } = useWizardSteps({ bandPlan, currentUser });

  // Active Band ID
  const activeBandId = bandId || currentUser?.band_id || "band_default";

  const { localBandName, genre, city, logoUrl, setLocalBandName, setLogoUrl, setGenre, setLanguage, setFontStyle, setCity, language, fontStyle, isUploadingLogo, handleLogoUpload } = useIdentityStep({ bandName, currentUser, epkConfig, bandLogoUrl, activeBandId });

  const { setSlogan, setFormato, setNumMusicos, setDuracionDirecto, setBio, slogan, bio, formato, numMusicos, duracionDirecto, handleGenerateBioAI } = useBioStep({ epkConfig, localBandName, genre, city });

  const { members, setMembers, setNewMemberName, setNewMemberRole, setNewMemberEmail, setNewMemberInstagram, newMemberName, newMemberRole, newMemberEmail, newMemberInstagram, handleAddMember, handleRemoveMember } = useMembersStep({ epkConfig, currentUser });

  const { setSocialLinks, socialLinks, merchStoreUrl, merchHighlight, setMerchStoreUrl, setMerchHighlight } = useSocialsMerchStep({ epkConfig });

  const { setVideos, setNewVideoUrl, setNewVideoTitle, videos, newVideoUrl, newVideoTitle, newVideoType, setNewVideoType, handleAddVideo, handleRemoveVideo, handleToggleHighlightVideo } = useVideosStep({ epkConfig });

  const { setSpotifyQuery, setSpotifyAlbums, setSelectedSpotifyTracks, setUploadedSongs, setManualSongs, setCreatedSetlistName, musicSubTab, setMusicSubTab, spotifyQuery, isSearchingSpotify, spotifyAlbums, selectedSpotifyTracks, handleSearchSpotify, handleToggleTrackSelection, handleSelectAllTracksInAlbum, handleImportSpotifyTracks, isImportingSpotify, uploadedSongs, isUploadingAudio, handleAudioFileUpload, manualSongs, newManualTitle, setNewManualTitle, newManualTonalidad, setNewManualTonalidad, newManualBpm, setNewManualBpm, newManualDuracion, setNewManualDuracion, handleAddManualSong, handleRemoveManualSong, handleBulkAddManualSongs, createdSetlistName, isCreatingSetlist, handleGenerateSetlist, totalImportedSongsCount } = useMusicSetlistStep({ bandName, currentUser, logoUrl, localBandName, genre, onSongsImported, activeBandId });

  const { setRiderTecnicoText, setRiderPdfUrl, setRiderPdfName, setCanalesMesa, setLlevaMicrofoniaPropia, setLlevaInEars, setNecesitaBacklineBateria, riderTecnicoText, riderPdfUrl, riderPdfName, canalesMesa, llevaMicrofoniaPropia, llevaInEars, necesitaBacklineBateria, isUploadingRider, handleRiderUpload } = useRiderStep({ epkConfig, activeBandId });

  const { setPressQuotes, pressQuotes, cifrasOyentes, cifrasDirectos, cifrasComunidad, festivalesDestacados, newQuoteText, setNewQuoteText, newQuoteMedia, setNewQuoteMedia, handleAddQuote, handleRemoveQuote, setFestivalesDestacados, setCifrasOyentes, setCifrasDirectos, setCifrasComunidad } = usePressProofStep({ epkConfig });

  const { cacheSala, setContactoBookingNombre, setContactoBookingEmail, setContactoBookingTelefono, contactoBookingNombre, contactoBookingEmail, contactoBookingTelefono, cacheAcustico, setCacheAcustico, setCacheSala, cacheFestival, setCacheFestival, condicionesKm, setCondicionesKm, requiereAlojamiento, setRequiereAlojamiento, signatureName, setSignatureName, signatureCargo, setSignatureCargo, signaturePhone, setSignaturePhone, senderEmail, setSenderEmail } = useBookingAndAgentStep({ epkConfig, currentUser });

  const { events, newEventTitle, setNewEventTitle, newEventType, setNewEventType, newEventDate, setNewEventDate, newEventTime, setNewEventTime, newEventCity, setNewEventCity, newEventVenue, setNewEventVenue, newEventTicketUrl, setNewEventTicketUrl, newEventAttendancePropia, setNewEventAttendancePropia, newEventAttendanceOtras, setNewEventAttendanceOtras, newEventSharedBands, setNewEventSharedBands, newEventPostShowReview, setNewEventPostShowReview, newEventIsMilestone, setNewEventIsMilestone, handleAddEvent, handleRemoveEvent } = useEventsStep({ city, onAddRehearsal, members, onAddConcert, cacheSala });

  const { setPhotos, photos, isUploadingPhoto, handlePhotoUpload, handleRemovePhoto, newPhotoUrl, setNewPhotoUrl, handleAddPhotoUrl } = usePhotosStep({ epkConfig, activeBandId });

  const { bizumNumber, revolutTag, paypalEmail, ibanNumber, fanCallToAction, fanWelcomeMessage, fanRewardDescription, fanRewardLink, discountCode, setFanCallToAction, setFanWelcomeMessage, setFanRewardDescription, setFanRewardLink, leadMagnetFileName, setLeadMagnetFileName, isUploadingLeadMagnet, handleLeadMagnetUpload, setDiscountCode, setBizumNumber, setRevolutTag, setPaypalEmail, setIbanNumber } = useFansPaymentsStep({ epkConfig, activeBandId });

  // Sincronizar y reiniciar datos de la banda cuando se abre el modal o cambia la banda/epkConfig
  useEffect(() => {
    if (isOpen) {
      const resolvedName =
        (bandName && bandName !== "Banda"
          ? bandName
          : "") ||
        (currentUser?.bandName && currentUser.bandName !== "Banda"
          ? currentUser.bandName
          : "") ||
        (epkConfig?.contactoBooking?.nombre &&
        epkConfig.contactoBooking.nombre.toLowerCase() !== "banda"
          ? epkConfig.contactoBooking.nombre
          : "") ||
        "";

      if (resolvedName) {
        setLocalBandName(resolvedName);
        setSpotifyQuery(resolvedName);
      } else {
        setLocalBandName("");
        setSpotifyQuery("");
      }

      // Reiniciar logo explícitamente: si la banda actual no tiene logo, NO heredar el logo de la última banda creada
      setLogoUrl(epkConfig?.logoUrl || bandLogoUrl || "");

      // Reiniciar miembros explícitamente:
      const defaultLeaderMember: WizardMemberItem = {
        id: "leader",
        name: currentUser?.name || currentUser?.username || "Tú (Líder)",
        role: currentUser?.instrument || "Voz / Guitarra",
        email: currentUser?.email || "",
        instagram: "",
        isLeader: true,
      };

      if (
        epkConfig?.miembros &&
        Array.isArray(epkConfig.miembros) &&
        epkConfig.miembros.length > 0
      ) {
        setMembers(
          epkConfig.miembros.map((m, idx) => ({
            id: m.id || `m_${idx}_${Date.now()}`,
            name: m.nombre,
            role: m.rol || "Músico",
            email: "",
            instagram: m.instagram || "",
            isLeader: idx === 0,
          })),
        );
      } else {
        // Para una nueva banda sin miembros configurados en su epkConfig, resetear siempre al líder actual,
        // evitando arrastrar el nombre del primer miembro o de la banda previa
        setMembers([defaultLeaderMember]);
      }

      setNewMemberName("");
      setNewMemberRole("");
      setNewMemberEmail("");
      setNewMemberInstagram("");

      setGenre(epkConfig?.genero || "Indie Rock");
      setLanguage(epkConfig?.idioma || "Español");
      setFontStyle(epkConfig?.fontStyle || epkConfig?.tipografia || "anton");
      setCity(epkConfig?.datosContratacion?.ciudadBase || "Madrid, España");
      setSlogan(epkConfig?.fraseImpacto || "");
      setFormato(
        epkConfig?.datosContratacion?.formatos || "Banda completa en directo",
      );
      setNumMusicos(epkConfig?.datosContratacion?.numMusicos || 4);
      setDuracionDirecto(
        epkConfig?.datosContratacion?.duracionDirecto || "60 min",
      );

      if (epkConfig?.biografia) {
        setBio(epkConfig.biografia);
      } else {
        setBio("");
      }

      setSocialLinks({
        instagram: epkConfig?.enlacesRedes?.instagram || "",
        spotify: epkConfig?.enlacesRedes?.spotify || "",
        youtube: epkConfig?.enlacesRedes?.youtube || "",
        tiktok: epkConfig?.enlacesRedes?.tiktok || "",
        website: epkConfig?.enlacesRedes?.website || "",
        whatsapp: epkConfig?.enlacesRedes?.whatsapp || "",
      });

      setVideos(epkConfig?.videos || []);
      setNewVideoUrl("");
      setNewVideoTitle("");

      setRiderTecnicoText(
        epkDe(epkConfig)?.riderTecnico || epkConfig?.dossierTextoExtra || "",
      );
      setRiderPdfUrl(epkDe(epkConfig)?.riderPdfUrl || "");
      setRiderPdfName(epkDe(epkConfig)?.riderPdfName || "");
      setCanalesMesa(epkDe(epkConfig)?.canalesMesa || 12);
      setLlevaMicrofoniaPropia(
        Boolean(epkDe(epkConfig)?.llevaMicrofoniaPropia),
      );
      setLlevaInEars(Boolean(epkDe(epkConfig)?.llevaInEars));
      setNecesitaBacklineBateria(
        Boolean(epkDe(epkConfig)?.necesitaBacklineBateria),
      );

      setPhotos(epkConfig?.bandPhotos || epkDe(epkConfig)?.fotos || []);
      setPressQuotes(
        Array.isArray(epkDe(epkConfig)?.resenasPrensa?.citas)
          ? epkDe(epkConfig).resenasPrensa.citas
          : [],
      );

      const bookingName =
        epkConfig?.contactoBooking?.nombre &&
        epkConfig.contactoBooking.nombre.toLowerCase() !== "banda"
          ? epkConfig.contactoBooking.nombre
          : resolvedName ||
            currentUser?.name ||
            currentUser?.username ||
            "Tú (Líder)";
      setContactoBookingNombre(bookingName);
      setContactoBookingEmail(
        epkConfig?.contactoBooking?.email || currentUser?.email || "",
      );
      setContactoBookingTelefono(epkConfig?.contactoBooking?.telefono || "");

      setSpotifyAlbums([]);
      setSelectedSpotifyTracks(new Set());
      setUploadedSongs([]);
      setManualSongs([]);
      setCreatedSetlistName(null);
    }
    // Los setters de useState son estables: solo reabrir o cambiar de banda/EPK rehidrata el formulario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeBandId, bandName, bandLogoUrl, currentUser, epkConfig]);

  // Save full configuration
  const handleSaveConfiguration = async () => {
    const finalBandName = (
      localBandName ||
      bandName ||
      currentUser?.bandName ||
      ""
    ).trim();
    const updatedEpk: Partial<EPKConfig> & EpkWizardExtras = {
      ...epkConfig,
      bandId: activeBandId,
      bandName: finalBandName,
      genero: genre,
      idioma: language,
      fontStyle,
      tipografia: fontStyle,
      logoUrl,
      fraseImpacto: slogan,
      biografia: bio,
      bandPhotos: photos,
      videos,
      miembros: members.map((m) => ({
        id: m.id,
        nombre: m.name,
        rol: m.role,
        instagram: m.instagram,
      })),
      enlacesRedes: {
        ...epkConfig?.enlacesRedes,
        ...socialLinks,
        bizum: bizumNumber,
        revolut: revolutTag,
        paypal: paypalEmail,
        iban: ibanNumber,
      },
      datosContratacion: {
        ...epkConfig?.datosContratacion,
        ciudadBase: city,
        formatos: formato,
        numMusicos,
        duracionDirecto,
      },
      contactoBooking: {
        nombre: finalBandName || contactoBookingNombre || bandName,
        email: contactoBookingEmail,
        telefono: contactoBookingTelefono,
      },
      incentivoFans: {
        ...epkConfig?.incentivoFans,
        fraseGancho: fanCallToAction,
        mensajeAgradecimiento: fanWelcomeMessage,
        premioTexto: fanRewardDescription,
        enlaceDescarga: fanRewardLink,
        codigoDescuento: discountCode,
      },
      donacionRevolut: {
        ...epkConfig?.donacionRevolut,
        habilitado: Boolean(
          bizumNumber || revolutTag || paypalEmail || ibanNumber,
        ),
        bizumTelefono: bizumNumber,
        revolutTag,
        paypalUser: paypalEmail,
        ibanCuenta: ibanNumber,
      },
      resenasPrensa: {
        habilitado: pressQuotes.length > 0,
        citas: pressQuotes,
      },
      cifrasClave: {
        habilitado: Boolean(cifrasOyentes || cifrasDirectos || cifrasComunidad),
        oyentes: cifrasOyentes,
        directos: cifrasDirectos,
        comunidad: cifrasComunidad,
      },
      riderTecnico: riderTecnicoText,
      riderPdfUrl,
      riderPdfName,
      // Extended properties
      ...({
        canalesMesa,
        llevaMicrofoniaPropia,
        llevaInEars,
        necesitaBacklineBateria,
        festivalesDestacados,
        tiendaMerchUrl: merchStoreUrl,
        merchDestacado: merchHighlight,
      } satisfies EpkWizardExtras),
    };

    if (onUpdateEpkConfig) {
      await onUpdateEpkConfig(updatedEpk);
    }
    if (onRefreshData) {
      onRefreshData();
    }
  };

  // Navigation handlers
  const handleNextStep = async () => {
    if (currentStepIndex === activeSteps.length - 1) {
      // Last step: save and advance to celebration
      await handleSaveConfiguration();
      setCurrentStepIndex(activeSteps.length);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleSkipStep = () => {
    if (currentStepIndex === activeSteps.length - 1) {
      setCurrentStepIndex(activeSteps.length);
    } else {
      setCurrentStepIndex((prev) => prev + 1);
    }
  };

  const handleFinishWizard = () => {
    markOnboardingCompleted(
      activeBandId,
      { wizard: true, onboarding: true },
      true,
    ).catch(() => {});
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("bandmanager_onboarding_finished"));
    }
    onClose();
  };

  return { currentStepIndex, activeSteps, setCurrentStepIndex, userPlanId, isCelebrationStep, currentStepDef, localBandName, genre, city, logoUrl, setLocalBandName, setLogoUrl, setGenre, setLanguage, setFontStyle, setCity, language, fontStyle, isUploadingLogo, handleLogoUpload, setSlogan, setFormato, setNumMusicos, setDuracionDirecto, setBio, slogan, bio, formato, numMusicos, duracionDirecto, handleGenerateBioAI, members, setMembers, setNewMemberName, setNewMemberRole, setNewMemberEmail, setNewMemberInstagram, newMemberName, newMemberRole, newMemberEmail, newMemberInstagram, handleAddMember, handleRemoveMember, setSocialLinks, socialLinks, merchStoreUrl, merchHighlight, setMerchStoreUrl, setMerchHighlight, setVideos, setNewVideoUrl, setNewVideoTitle, videos, newVideoUrl, newVideoTitle, newVideoType, setNewVideoType, handleAddVideo, handleRemoveVideo, handleToggleHighlightVideo, setSpotifyQuery, setSpotifyAlbums, setSelectedSpotifyTracks, setUploadedSongs, setManualSongs, setCreatedSetlistName, musicSubTab, setMusicSubTab, spotifyQuery, isSearchingSpotify, spotifyAlbums, selectedSpotifyTracks, handleSearchSpotify, handleToggleTrackSelection, handleSelectAllTracksInAlbum, handleImportSpotifyTracks, isImportingSpotify, uploadedSongs, isUploadingAudio, handleAudioFileUpload, manualSongs, newManualTitle, setNewManualTitle, newManualTonalidad, setNewManualTonalidad, newManualBpm, setNewManualBpm, newManualDuracion, setNewManualDuracion, handleAddManualSong, handleRemoveManualSong, handleBulkAddManualSongs, createdSetlistName, isCreatingSetlist, handleGenerateSetlist, totalImportedSongsCount, setRiderTecnicoText, setRiderPdfUrl, setRiderPdfName, setCanalesMesa, setLlevaMicrofoniaPropia, setLlevaInEars, setNecesitaBacklineBateria, riderTecnicoText, riderPdfUrl, riderPdfName, canalesMesa, llevaMicrofoniaPropia, llevaInEars, necesitaBacklineBateria, isUploadingRider, handleRiderUpload, setPressQuotes, pressQuotes, cifrasOyentes, cifrasDirectos, cifrasComunidad, festivalesDestacados, newQuoteText, setNewQuoteText, newQuoteMedia, setNewQuoteMedia, handleAddQuote, handleRemoveQuote, setFestivalesDestacados, setCifrasOyentes, setCifrasDirectos, setCifrasComunidad, cacheSala, setContactoBookingNombre, setContactoBookingEmail, setContactoBookingTelefono, contactoBookingNombre, contactoBookingEmail, contactoBookingTelefono, cacheAcustico, setCacheAcustico, setCacheSala, cacheFestival, setCacheFestival, condicionesKm, setCondicionesKm, requiereAlojamiento, setRequiereAlojamiento, signatureName, setSignatureName, signatureCargo, setSignatureCargo, signaturePhone, setSignaturePhone, senderEmail, setSenderEmail, events, newEventTitle, setNewEventTitle, newEventType, setNewEventType, newEventDate, setNewEventDate, newEventTime, setNewEventTime, newEventCity, setNewEventCity, newEventVenue, setNewEventVenue, newEventTicketUrl, setNewEventTicketUrl, newEventAttendancePropia, setNewEventAttendancePropia, newEventAttendanceOtras, setNewEventAttendanceOtras, newEventSharedBands, setNewEventSharedBands, newEventPostShowReview, setNewEventPostShowReview, newEventIsMilestone, setNewEventIsMilestone, handleAddEvent, handleRemoveEvent, setPhotos, photos, isUploadingPhoto, handlePhotoUpload, handleRemovePhoto, newPhotoUrl, setNewPhotoUrl, handleAddPhotoUrl, bizumNumber, revolutTag, paypalEmail, ibanNumber, fanCallToAction, fanWelcomeMessage, fanRewardDescription, fanRewardLink, discountCode, setFanCallToAction, setFanWelcomeMessage, setFanRewardDescription, setFanRewardLink, leadMagnetFileName, setLeadMagnetFileName, isUploadingLeadMagnet, handleLeadMagnetUpload, setDiscountCode, setBizumNumber, setRevolutTag, setPaypalEmail, setIbanNumber, activeBandId, handleSaveConfiguration, handleNextStep, handlePrevStep, handleSkipStep, handleFinishWizard };
}
