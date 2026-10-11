/**
 * Alta, edición, borrado, importación del scout, favoritas y selección de bandas.
 * Extraído de BandCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import type { BookingCampaign } from "../../../types";
import type { BandAiProposal, ScoutedBand } from "../bandCrmTypes";
import React, { Dispatch, SetStateAction } from "react";
import { BandContact, BandRelationshipStatus, Lead } from "../../../types";
import { apiFetch } from "../../../utils/api";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface BandCrudParams {
  setEditingBand: Dispatch<SetStateAction<BandContact>>;
  setFormName: Dispatch<SetStateAction<string>>;
  setFormStyle: Dispatch<SetStateAction<string>>;
  setFormLocation: Dispatch<SetStateAction<string>>;
  setFormStatus: Dispatch<SetStateAction<BandRelationshipStatus>>;
  setFormLastContact: Dispatch<SetStateAction<string>>;
  setFormContactName: Dispatch<SetStateAction<string>>;
  setFormEmail: Dispatch<SetStateAction<string>>;
  setFormPhone: Dispatch<SetStateAction<string>>;
  setFormInstagram: Dispatch<SetStateAction<string>>;
  setFormSpotifyYoutube: Dispatch<SetStateAction<string>>;
  setFormAforo: Dispatch<SetStateAction<number>>;
  setFormNotes: Dispatch<SetStateAction<string>>;
  setFormIcon: Dispatch<SetStateAction<string>>;
  setFormImageUrl: Dispatch<SetStateAction<string>>;
  setAiProposal: Dispatch<SetStateAction<BandAiProposal | null>>;
  setAiError: Dispatch<SetStateAction<string>>;
  setIsAiSearching: Dispatch<SetStateAction<boolean>>;
  setIsAddEditModalOpen: Dispatch<SetStateAction<boolean>>;
  formName: string;
  editingBand: BandContact;
  formStyle: string;
  formLocation: string;
  formStatus: BandRelationshipStatus;
  formLastContact: string;
  formContactName: string;
  formEmail: string;
  formPhone: string;
  formInstagram: string;
  formSpotifyYoutube: string;
  formAforo: number;
  formNotes: string;
  formIcon: string;
  formImageUrl: string;
  setBands: Dispatch<SetStateAction<BandContact[]>>;
  onUpdateLead: (id: string, updatedFields: Partial<Lead>) => void;
  onAddLead: (lead: Lead) => void;
  myBandName: string;
  activeCampaign: BookingCampaign | null;
  setSelectedBandIds: Dispatch<SetStateAction<string[]>>;
  filteredBands: BandContact[];
}

/**
 * Alta, edición, borrado, importación del scout, favoritas y selección de bandas.
 * @param params Estado y callbacks del contenedor ({@link BandCrudParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useBandCrud({ setEditingBand, setFormName, setFormStyle, setFormLocation, setFormStatus, setFormLastContact, setFormContactName, setFormEmail, setFormPhone, setFormInstagram, setFormSpotifyYoutube, setFormAforo, setFormNotes, setFormIcon, setFormImageUrl, setAiProposal, setAiError, setIsAiSearching, setIsAddEditModalOpen, formName, editingBand, formStyle, formLocation, formStatus, formLastContact, formContactName, formEmail, formPhone, formInstagram, formSpotifyYoutube, formAforo, formNotes, formIcon, formImageUrl, setBands, onUpdateLead, onAddLead, myBandName, activeCampaign, setSelectedBandIds, filteredBands }: BandCrudParams) {
  // Handle open modal for creation
  const handleOpenCreateModal = () => {
    setEditingBand(null);
    setFormName("");
    setFormStyle("");
    setFormLocation("Madrid");
    setFormStatus("sin_contactar");
    setFormLastContact(new Date().toISOString().split("T")[0]);
    setFormContactName("");
    setFormEmail("");
    setFormPhone("");
    setFormInstagram("");
    setFormSpotifyYoutube("");
    setFormAforo(0);
    setFormNotes("");
    setFormIcon("🎸");
    setFormImageUrl("");
    setAiProposal(null);
    setAiError(null);
    setIsAiSearching(false);
    setIsAddEditModalOpen(true);
  };

  // Handle open modal for editing
  const handleOpenEditModal = (band: BandContact) => {
    setEditingBand(band);
    setFormName(band.nombre_banda);
    setFormStyle(band.estilo_musical);
    setFormLocation(band.localizacion);
    setFormStatus(band.estado_relacion);
    setFormLastContact(band.ultimo_contacto);
    setFormContactName(band.contacto_nombre || "");
    setFormEmail(band.email || "");
    setFormPhone(band.telefono || "");
    setFormInstagram(band.instagram || "");
    setFormSpotifyYoutube(band.spotify_youtube || "");
    setFormAforo(band.aforo_promedio || 0);
    setFormNotes(band.notas_colaboracion || "");
    setFormIcon(band.icono || "🎸");
    setFormImageUrl(band.imagen_url || "");
    setAiProposal(null);
    setAiError(null);
    setIsAiSearching(false);
    setIsAddEditModalOpen(true);
  };

  // Handle Save (Create or Update)
  const handleSaveBand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      alert("Por favor introduce el nombre de la banda.");
      return;
    }

    if (editingBand) {
      // Update existing
      const updated: BandContact = {
        ...editingBand,
        nombre_banda: formName.trim(),
        estilo_musical: formStyle.trim(),
        localizacion: formLocation.trim(),
        estado_relacion: formStatus,
        ultimo_contacto: formLastContact,
        contacto_nombre: formContactName.trim(),
        email: formEmail.trim(),
        telefono: formPhone.trim(),
        instagram: formInstagram.trim(),
        spotify_youtube: formSpotifyYoutube.trim(),
        aforo_promedio: Number(formAforo) || 0,
        notas_colaboracion: formNotes.trim(),
        ciudad_origen_swap: formLocation.trim(),
        icono: formIcon,
        imagen_url: formImageUrl,
      };

      setBands((prev) =>
        prev.map((b) => (b.id === editingBand.id ? updated : b)),
      );

      try {
        await apiFetch(`/api/bands/${editingBand.id}`, {
          method: "PUT",
          body: JSON.stringify(updated),
        });
      } catch (err) {
        console.error("Error updating band on server:", err);
      }

      // Also sync back to main leads list if onUpdateLead is provided
      if (onUpdateLead) {
        onUpdateLead(editingBand.id, {
          nombre_sala: updated.nombre_banda,
          genero: updated.estilo_musical,
          ciudad: updated.localizacion,
          contacto_nombre: updated.contacto_nombre,
          email_contacto: updated.email,
          telefono: updated.telefono,
          instagram: updated.instagram,
          notas: updated.notas_colaboracion,
          icono: updated.icono,
          imagen_url: updated.imagen_url,
        });
      }
    } else {
      // Create new
      const newBand: BandContact = {
        id: `band-${Date.now()}`,
        nombre_banda: formName.trim(),
        estilo_musical: formStyle.trim(),
        localizacion: formLocation.trim(),
        estado_relacion: formStatus,
        ultimo_contacto:
          formLastContact || new Date().toISOString().split("T")[0],
        contacto_nombre: formContactName.trim(),
        email: formEmail.trim(),
        telefono: formPhone.trim(),
        instagram: formInstagram.trim(),
        spotify_youtube: formSpotifyYoutube.trim(),
        aforo_promedio: Number(formAforo) || 0,
        notas_colaboracion: formNotes.trim(),
        ciudad_origen_swap: formLocation.trim(),
        icono: formIcon,
        imagen_url: formImageUrl,
      };

      setBands((prev) => [newBand, ...prev]);

      try {
        await apiFetch("/api/bands", {
          method: "POST",
          body: JSON.stringify(newBand),
        });
      } catch (err) {
        console.error("Error creating band on server:", err);
      }

      // Sync to main leads list if onAddLead is provided
      if (onAddLead) {
        onAddLead({
          id: newBand.id,
          nombre_sala: newBand.nombre_banda,
          ciudad: newBand.localizacion,
          region: newBand.localizacion,
          aforo: newBand.aforo_promedio || 0,
          genero: newBand.estilo_musical,
          tipo: "grupo",
          email_contacto: newBand.email || "",
          telefono: newBand.telefono || "",
          instagram: newBand.instagram || "",
          contacto_nombre: newBand.contacto_nombre || "",
          fuente: "Red de Co-Booking Bandas",
          estado: "pendiente_aprobacion",
          pitch_generado: `Propuesta Date Swap: ${myBandName} x ${newBand.nombre_banda}`,
          notas: newBand.notas_colaboracion || "",
          icono: newBand.icono,
          imagen_url: newBand.imagen_url,
        });
      }
    }

    setIsAddEditModalOpen(false);
  };

  // Handle Import Scouted Bands
  const handleImportScoutedBands = async (
    importedBands: ScoutedBand[],
  ) => {
    const today = new Date().toISOString().split("T")[0];
    const newBands = [];

    for (const b of importedBands) {
      const newBand = {
        id: `temp-${Date.now()}-${Math.random()}`,
        nombre_banda: b.nombre_banda || "Sin nombre",
        localizacion: b.localizacion || "Desconocida",
        estilo_musical: b.estilo_musical || "Mestizaje",
        estado_relacion: "sin_contactar" as BandRelationshipStatus,
        instagram: b.instagram_url || "",
        spotify: b.spotify_url || "",
        youtube: b.youtube_url || "",
        aforo_promedio: b.aforo_promedio || null,
        fecha_creacion: today,
        ultimo_contacto: today,
        notas: activeCampaign
          ? `Scouteada para campaña: ${activeCampaign.name}`
          : "Scouteada vía IA",
        es_favorito: false,
      };
      newBands.push(newBand);
      try {
        await apiFetch("/api/bands", {
          method: "POST",
          body: JSON.stringify(newBand),
        });
      } catch (err) {
        console.error("Error creating scouted band", err);
      }
    }

    // Optimistic UI update
    setBands((prev) => [...newBands, ...prev]);
  };

  // Handle Delete
  const handleDeleteBand = async (id: string, name: string) => {
    if (
      window.confirm(
        `¿Estás seguro de eliminar el contacto de la banda "${name}"?`,
      )
    ) {
      setBands((prev) => prev.filter((b) => b.id !== id));
      try {
        await apiFetch(`/api/bands/${id}`, { method: "DELETE" });
      } catch (err) {
        console.error("Error deleting band", err);
      }
    }
  };

  // Toggle Favorite
  const handleUpdateBandFavorite = async (id: string, isFav: boolean) => {
    setBands((prev) =>
      prev.map((b) => (b.id === id ? { ...b, es_favorito: isFav } : b)),
    );
    try {
      await apiFetch(`/api/bands/${id}`, {
        method: "PUT",
        body: JSON.stringify({ es_favorito: isFav }),
      });
    } catch (err) {
      console.error("Error updating favorite status", err);
    }
  };

  // Bulk action handlers
  const handleToggleSelectBand = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedBandIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleSelectAllFilteredBands = () => {
    setSelectedBandIds(filteredBands.map((b) => b.id));
  };

  const handleDeselectAllBands = () => {
    setSelectedBandIds([]);
  };

  return { handleOpenCreateModal, handleDeselectAllBands, handleSelectAllFilteredBands, handleOpenEditModal, handleToggleSelectBand, handleUpdateBandFavorite, handleDeleteBand, handleSaveBand, handleImportScoutedBands };
}
