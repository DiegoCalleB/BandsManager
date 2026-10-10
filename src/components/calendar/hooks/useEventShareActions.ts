/**
 * Hoja de ruta, texto para compartir, copia de la ficha, aviso a la banda y borrado del evento.
 * Extraído de CalendarView.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { Dispatch, SetStateAction } from "react";
import { getCachedEventWeatherAlerts } from "../../../services/weatherService";
import { Concert, Rehearsal } from "../../../types";
import { triggerNativeMobileNotification } from "../../../utils/webPush";
import { openWhatsAppChat } from "../../../utils/whatsapp";
import type { BandTaggedEvent } from "../calendarTypes";
import { useCalendarRoadbook } from "../useCalendarRoadbook";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface EventShareActionsParams {
  selectedConcert: Concert;
  getBandIdentity: (bandId?: string, bandNameFallback?: string) => { name: string; initials: string; logoUrl: string; palette: { bg: string; badge: string; dot: string; accent: string; }; };
  monthNames: string[];
  isPromoPlan: boolean;
  setCopiedEventModalId: Dispatch<SetStateAction<string>>;
  onShowNotification: (message: string, type?: "success" | "error" | "info") => void;
  setShowReminderModal: Dispatch<SetStateAction<boolean>>;
  onDeleteConcert: (id: string) => void;
  onDeleteRehearsal: (id: string) => void;
  setDeletingEventConfirmId: Dispatch<SetStateAction<string>>;
  setShowEventFichaModal: Dispatch<SetStateAction<boolean>>;
  setSelectedEventId: Dispatch<SetStateAction<string>>;
}

/**
 * Hoja de ruta, texto para compartir, copia de la ficha, aviso a la banda y borrado del evento.
 * @param params Estado y callbacks del contenedor ({@link EventShareActionsParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useEventShareActions({ selectedConcert, getBandIdentity, monthNames, isPromoPlan, setCopiedEventModalId, onShowNotification, setShowReminderModal, onDeleteConcert, onDeleteRehearsal, setDeletingEventConfirmId, setShowEventFichaModal, setSelectedEventId }: EventShareActionsParams) {
  // Roadbooks & Merch state per event date (Encapsulated in custom hook)
  const {
    allRoadbooks,
    getDefaultRoadbook,
    getCurrentRoadbook,
    updateRoadbookField,
    handleToggleCierreItem,
    handleToggleAllCierreItems,
    handleAddCierreItem,
    handleDeleteCierreItem,
    handleAddKeyContact,
    handleDeleteKeyContact,
    openWhatsAppContact,
    handleUpdateMerchItem,
    handleAddMerchItem,
    handleDeleteMerchItem,
    handleUpdateMerchTotals,
    handleCopyMerchSummary,
    newCierreItemText,
    setNewCierreItemText,
    newCierreItemCat,
    setNewCierreItemCat,
    showAddContactForm,
    setShowAddContactForm,
    newContactNombre,
    setNewContactNombre,
    newContactRol,
    setNewContactRol,
    newContactTelefono,
    setNewContactTelefono,
    newContactEmail,
    setNewContactEmail,
    newContactNotas,
    setNewContactNotas,
    showAddMerchForm,
    setShowAddMerchForm,
    newMerchNombre,
    setNewMerchNombre,
    newMerchCategoria,
    setNewMerchCategoria,
    newMerchTalla,
    setNewMerchTalla,
    newMerchPrecio,
    setNewMerchPrecio,
    newMerchStockInicial,
    setNewMerchStockInicial,
    merchCopiedToast,
    saveRoadbook,
  } = useCalendarRoadbook(selectedConcert, getBandIdentity);

  const getEventShareText = React.useCallback(
    (event: Concert | Rehearsal, isConcert: boolean) => {
      const bandInfo = getBandIdentity(event.band_id, (event as Concert & Rehearsal & BandTaggedEvent).bandName || (event as BandTaggedEvent).band_name);
      const dateObj = new Date(event.fecha);
      const dateFormatted = !isNaN(dateObj.getTime())
        ? `${dateObj.getDate()} de ${monthNames[dateObj.getMonth()]}, ${dateObj.getFullYear()}`
        : event.fecha;

      let msg = `🎸 *CONVOCATORIA: ${bandInfo.name.toUpperCase()}*\n`;
      if (isConcert) {
        const c = event as Concert;
        msg += `🎤 *Concierto:* ${c.sala} (${c.ciudad})\n`;
        msg += `📅 *Fecha:* ${dateFormatted}\n`;
        msg += `⏰ *Hora Show:* 21:30h (Prueba de sonido: 18:30h)\n`;
        if (c.direccion) msg += `📍 *Dirección:* ${c.direccion}\n`;
        if (c.cache && !isPromoPlan) msg += `💰 *Caché acordado:* ${c.cache} €\n`;
        if (c.giraNombre) msg += `🚐 *Gira:* ${c.giraNombre}\n`;
        if (c.entradasUrl) msg += `🎟️ *Venta de entradas:* ${c.entradasUrl}\n`;
        if (c.notas) msg += `📝 *Notas / Rider:* ${c.notas}\n`;

        // Alertas meteorológicas en la convocatoria
        const weatherAlerts = getCachedEventWeatherAlerts(c.ciudad, c.fecha);
        if (weatherAlerts.length > 0) {
          msg += `\n⚠️ *ALERTAS METEOROLÓGICAS DE ESCENARIO:*\n`;
          weatherAlerts.forEach((a) => {
            msg += `• ${a.badge}: ${a.shortAdvice}\n`;
          });
        }
      } else {
        const r = event as Rehearsal;
        msg += `🥁 *Ensayo / Convocatoria:* ${r.lugar}\n`;
        msg += `📅 *Fecha:* ${dateFormatted}\n`;
        msg += `⏰ *Hora:* ${r.hora}\n`;
        if (r.asunto) msg += `🎯 *Asunto:* ${r.asunto}\n`;
        if (r.enlace_reunion) msg += `🔗 *Enlace:* ${r.enlace_reunion}\n`;
        if (r.notas) msg += `📝 *Notas:* ${r.notas}\n`;
      }
      msg += `\n⚡ *Gestionado con BandManager.io*`;
      return msg;
    },
    [getBandIdentity, isPromoPlan, monthNames]
  );

  const handleShareEventWhatsApp = React.useCallback(
    (event: Concert | Rehearsal, isConcert: boolean) => {
      const msg = getEventShareText(event, isConcert);
      openWhatsAppChat(undefined, msg);
    },
    [getEventShareText]
  );

  const handleCopyEventFicha = React.useCallback(
    (event: Concert | Rehearsal, isConcert: boolean) => {
      const msg = getEventShareText(event, isConcert);
      navigator.clipboard.writeText(msg);
      setCopiedEventModalId(event.id);
      setTimeout(() => setCopiedEventModalId(null), 2500);
      if (onShowNotification) onShowNotification('Ficha del evento copiada al portapapeles', 'success');
    },
    [getEventShareText, onShowNotification, setCopiedEventModalId]
  );

  const handleNotifyBandMembers = React.useCallback(
    (event: Concert | Rehearsal, isConcert: boolean) => {
      const title = isConcert ? `Concierto en ${(event as Concert).sala}` : `Ensayo en ${(event as Rehearsal).lugar}`;
      const body = `Convocatoria: ${event.fecha} a las ${isConcert ? '21:30' : (event as Rehearsal).hora}`;
      triggerNativeMobileNotification(title, { body });
      setShowReminderModal(true);
      if (onShowNotification) onShowNotification('Convocatoria enviada a los músicos de la banda', 'success');
    },
    [onShowNotification, setShowReminderModal]
  );

  const handleDeleteEventFromModal = React.useCallback(
    (eventId: string, isConcert: boolean) => {
      if (isConcert && onDeleteConcert) {
        onDeleteConcert(eventId);
      } else if (!isConcert && onDeleteRehearsal) {
        onDeleteRehearsal(eventId);
      }
      setDeletingEventConfirmId(null);
      setShowEventFichaModal(false);
      setSelectedEventId(null);
      if (onShowNotification) onShowNotification('Evento eliminado del calendario', 'info');
    },
    [onDeleteConcert, onDeleteRehearsal, onShowNotification, setDeletingEventConfirmId, setSelectedEventId, setShowEventFichaModal]
  );

  return { allRoadbooks, getDefaultRoadbook, getCurrentRoadbook, updateRoadbookField, handleToggleCierreItem, handleToggleAllCierreItems, handleAddCierreItem, handleDeleteCierreItem, newCierreItemText, setNewCierreItemText, newCierreItemCat, setNewCierreItemCat, showAddContactForm, setShowAddContactForm, newContactNombre, setNewContactNombre, newContactRol, setNewContactRol, newContactTelefono, setNewContactTelefono, newContactEmail, setNewContactEmail, newContactNotas, setNewContactNotas, handleAddKeyContact, handleDeleteKeyContact, openWhatsAppContact, handleUpdateMerchItem, handleAddMerchItem, handleDeleteMerchItem, handleUpdateMerchTotals, handleCopyMerchSummary, showAddMerchForm, setShowAddMerchForm, newMerchNombre, setNewMerchNombre, newMerchCategoria, setNewMerchCategoria, newMerchTalla, setNewMerchTalla, newMerchPrecio, setNewMerchPrecio, newMerchStockInicial, setNewMerchStockInicial, merchCopiedToast, saveRoadbook, handleDeleteEventFromModal, handleShareEventWhatsApp, handleNotifyBandMembers, handleCopyEventFicha };
}
