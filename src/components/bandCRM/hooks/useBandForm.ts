/**
 * Formulario de banda: campos, logo, búsqueda con IA y aplicación de los datos propuestos.
 * Extraído de BandCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { BookingCampaign } from "../../../types";
import type { BandAiProposal, BandAiLookupResponse } from "../bandCrmTypes";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { BandRelationshipStatus } from "../../../types";
import { apiFetch } from "../../../utils/api";
import { uploadFileToServer } from "../../../utils/audioStorage";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandFormParams {
  setActiveCampaign: Dispatch<SetStateAction<BookingCampaign | null>>;
  currentBandId: string;
}

/**
 * Formulario de banda: campos, logo, búsqueda con IA y aplicación de los datos propuestos.
 * @param params Estado y callbacks del contenedor ({@link BandFormParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandForm({ setActiveCampaign, currentBandId }: BandFormParams) {
  // Form Fields State
  const [formName, setFormName] = useState("");

  const [formStyle, setFormStyle] = useState("");

  const [formLocation, setFormLocation] = useState("Madrid");

  const [formStatus, setFormStatus] =
    useState<BandRelationshipStatus>("sin_contactar");

  const [formLastContact, setFormLastContact] = useState(
    () => new Date().toISOString().split("T")[0],
  );

  const [formContactName, setFormContactName] = useState("");

  const [formEmail, setFormEmail] = useState("");

  const [formPhone, setFormPhone] = useState("");

  const [formInstagram, setFormInstagram] = useState("");

  const [formSpotifyYoutube, setFormSpotifyYoutube] = useState("");

  const [formAforo, setFormAforo] = useState<number>(0);

  const [formNotes, setFormNotes] = useState("");

  const [formIcon, setFormIcon] = useState("🎸");

  const [formImageUrl, setFormImageUrl] = useState("");

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);

  const [isScoutModalOpen, setIsScoutModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("bandmanager_active_campaign");
    if (saved) {
      try {
        setActiveCampaign(JSON.parse(saved));
      } catch {
        // Campaña guardada ilegible: se ignora y se parte sin campaña activa.
      }
    }
  }, []);

  const handleLogoUpload = async (file: File) => {
    if (!currentBandId) {
      alert("No hay ninguna banda activa para subir la imagen.");
      return;
    }
    try {
      setIsUploadingLogo(true);
      const url = await uploadFileToServer(file, {
        bandId: currentBandId,
        category: "grupos",
      });
      if (url) {
        setFormImageUrl(url);
      }
    } catch (err) {
      console.error("Error uploading band image:", err);
      alert("Error al subir la imagen a Supabase");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // AI Band Lookup state
  const [isAiSearching, setIsAiSearching] = useState(false);

  const [aiProposal, setAiProposal] = useState<BandAiProposal | null>(null);

  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiLookup = async () => {
    if (!formName.trim()) {
      alert(
        "Por favor introduce el nombre de la banda primero para buscar con IA.",
      );
      return;
    }
    setIsAiSearching(true);
    setAiError(null);
    setAiProposal(null);
    try {
      const data = await apiFetch<BandAiLookupResponse>("/api/bands/ai-lookup", {
        method: "POST",
        body: JSON.stringify({
          nombre_banda: formName.trim(),
          localizacion: formLocation.trim(),
        }),
      });
      if (data?.success && data?.data) {
        setAiProposal(data.data);
      } else {
        setAiError(data?.error || "No se encontraron datos para esta banda.");
      }
    } catch (err) {
      console.error("Error en búsqueda de IA:", err);
      setAiError("Error al conectar con la IA para la búsqueda.");
    } finally {
      setIsAiSearching(false);
    }
  };

  const handleApplyAllAiData = () => {
    if (!aiProposal) return;
    if (aiProposal.estilo_musical) setFormStyle(aiProposal.estilo_musical);
    if (aiProposal.localizacion) setFormLocation(aiProposal.localizacion);
    if (aiProposal.contacto_nombre)
      setFormContactName(aiProposal.contacto_nombre);
    if (aiProposal.email) setFormEmail(aiProposal.email);
    if (aiProposal.telefono) setFormPhone(aiProposal.telefono);
    if (aiProposal.instagram) setFormInstagram(aiProposal.instagram);
    if (aiProposal.spotify_url || aiProposal.youtube_url) {
      setFormSpotifyYoutube(aiProposal.spotify_url || aiProposal.youtube_url);
    }
    if (aiProposal.icono) setFormIcon(aiProposal.icono);
    if (aiProposal.imagen_url) setFormImageUrl(aiProposal.imagen_url);
    if (aiProposal.biografia) {
      setFormNotes((prev) =>
        prev
          ? `${prev}\n\n[Bio IA]: ${aiProposal.biografia}`
          : aiProposal.biografia,
      );
    }
    setAiProposal(null);
  };

  return { setFormName, setFormStyle, setFormLocation, setFormStatus, setFormLastContact, setFormContactName, setFormEmail, setFormPhone, setFormInstagram, setFormSpotifyYoutube, setFormAforo, setFormNotes, setFormIcon, setFormImageUrl, setAiProposal, setAiError, setIsAiSearching, formName, formStyle, formLocation, formStatus, formLastContact, formContactName, formEmail, formPhone, formInstagram, formSpotifyYoutube, formAforo, formNotes, formIcon, formImageUrl, setIsScoutModalOpen, handleAiLookup, isAiSearching, aiProposal, aiError, handleApplyAllAiData, handleLogoUpload, isUploadingLogo, isScoutModalOpen };
}
