/**
 * Rastreo web de salas (modal y lead seleccionado), aplicación de datos rastreados y alta de nuevos leads.
 * Extraído de BookingCRM.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import React, { Dispatch, SetStateAction } from "react";
import { Lead, LeadType } from "../../../../types";
import { apiFetch } from "../../../../utils/api";
import { getErrorMessage } from "../../../../utils/errorMessage";
import type { ScrapedField } from "../crmTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface LeadScrapingParams {
  newLeadData: { nombre_sala: string; ciudad: string; region: string; direccion: string; aforo: number; tipo: LeadType; email_contacto: string; email_secundario: string; telefono: string; telefono_movil: string; telefono_fijo: string; website: string; instagram: string; fuente: string; genero: string; notas: string; pitch_generado: string; icono: string; imagen_url: string; };
  setIsModalScraping: Dispatch<SetStateAction<boolean>>;
  setModalScrapeStatus: Dispatch<SetStateAction<string>>;
  setModalScrapeError: Dispatch<SetStateAction<string>>;
  setModalScrapeSuccessMsg: Dispatch<SetStateAction<string>>;
  setNewLeadData: Dispatch<SetStateAction<{ nombre_sala: string; ciudad: string; region: string; direccion: string; aforo: number; tipo: LeadType; email_contacto: string; email_secundario: string; telefono: string; telefono_movil: string; telefono_fijo: string; website: string; instagram: string; fuente: string; genero: string; notas: string; pitch_generado: string; icono: string; imagen_url: string; }>>;
  onUpdateLead: (leadId: string, updatedFields: Partial<Lead>, expectedStatus?: string) => void;
  setSelectedLead: Dispatch<SetStateAction<Lead>>;
  sectionTab: "salas" | "medios" | "grupos";
  effectiveBandName: string;
  onAddLead: (lead: Lead) => void;
  setIsAddingLeadModalOpen: Dispatch<SetStateAction<boolean>>;
}

/**
 * Rastreo web de salas (modal y lead seleccionado), aplicación de datos rastreados y alta de nuevos leads.
 * @param params Estado y callbacks del contenedor ({@link LeadScrapingParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useLeadScraping({ newLeadData, setIsModalScraping, setModalScrapeStatus, setModalScrapeError, setModalScrapeSuccessMsg, setNewLeadData, onUpdateLead, setSelectedLead, sectionTab, effectiveBandName, onAddLead, setIsAddingLeadModalOpen }: LeadScrapingParams) {
  const handleModalScrape = async () => {
    if (!newLeadData.nombre_sala.trim()) {
      alert('Por favor, escribe al menos el nombre de la sala o medio para que el Agente Scout pueda buscar en Google.');
      return;
    }

    setIsModalScraping(true);
    setModalScrapeStatus('Consultando Google Places API & Extraedor de Emails IA...');
    setModalScrapeError('');
    setModalScrapeSuccessMsg('');

    const steps = [
      'Buscando sitio oficial y directorio de salas...',
      'Extrayendo emails de programación y prensa...',
      'Obteniendo teléfono y datos de ubicación...',
      'Consolidando ficha encontrada...',
    ];

    let stepIdx = 0;
    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        setModalScrapeStatus(steps[stepIdx]);
      }
    }, 1200);

    try {
      const res = await apiFetch('/api/scrape-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_sala: newLeadData.nombre_sala,
          ciudad: newLeadData.ciudad,
          region: newLeadData.region,
        }),
      });

      clearInterval(interval);

      if (res.ok) {
        const resData = await res.json();
        if (resData.success && resData.data) {
          const getVal = (f: ScrapedField): string => {
            if (!f) return '';
            return typeof f === 'object' ? f.valor || '' : f;
          };
          const emailVal = getVal(resData.data.email_contacto);
          const telVal = getVal(resData.data.telefono);
          const isMobile = telVal && /^(?:\+?34\s*)?[67]/.test(telVal.trim());
          const isLandline = telVal && /^(?:\+?34\s*)?[89]/.test(telVal.trim());
          const webVal = getVal(resData.data.website);
          const aforoVal = getVal(resData.data.aforo);
          const regionVal = getVal(resData.data.region);
          const generoVal = getVal(resData.data.genero);
          const imgVal = getVal(resData.data.imagen_url);
          const iconVal = getVal(resData.data.icono);

          setNewLeadData((prev) => ({
            ...prev,
            email_contacto: emailVal || prev.email_contacto,
            telefono: telVal || prev.telefono,
            telefono_movil: isMobile ? telVal : prev.telefono_movil,
            telefono_fijo: isLandline ? telVal : prev.telefono_fijo,
            website: webVal || prev.website,
            region: regionVal || prev.region,
            aforo: aforoVal && !isNaN(Number(aforoVal)) ? Number(aforoVal) : prev.aforo,
            genero: generoVal || prev.genero,
            imagen_url: imgVal || prev.imagen_url,
            icono: iconVal || prev.icono,
            notas: prev.notas
              ? `${prev.notas} | Scout: ${resData.data.source_info || 'IA Grounding'}`
              : `Scout IA: ${resData.data.source_info || 'IA Grounding'}`,
          }));

          setModalScrapeSuccessMsg(
            `¡Éxito! Email: ${emailVal || 'No hallado'} | Tel: ${telVal || 'No hallado'} | Web: ${webVal || 'No hallado'}`
          );
        } else {
          setModalScrapeError(resData.error || 'No se pudieron recuperar datos con la IA Scout.');
        }
      } else {
        const errJson = await res.json().catch(() => null);
        setModalScrapeError(errJson?.error || `Error ${res.status}: Fallo de respuesta del servidor.`);
      }
    } catch (err) {
      clearInterval(interval);
      setModalScrapeError(getErrorMessage(err, 'Error de conexión con el Agente Scout.'));
    } finally {
      setIsModalScraping(false);
    }
  };

  const handleAddNewLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeadData.nombre_sala) {
      alert('Por favor, indica al menos el nombre de la sala o medio.');
      return;
    }

    const createdLead: Lead = {
      id: `lead-${Date.now()}`,
      nombre_sala: newLeadData.nombre_sala,
      ciudad: newLeadData.ciudad || 'Nacional',
      region: newLeadData.region || 'Nacional',
      aforo: newLeadData.aforo || 0,
      genero: newLeadData.genero || (sectionTab === 'medios' ? 'Radio' : 'Música en directo'),
      tipo: sectionTab === 'medios' ? 'medio' : newLeadData.tipo,
      email_contacto: newLeadData.email_contacto || '',
      email_secundario: newLeadData.email_secundario || '',
      telefono: newLeadData.telefono || newLeadData.telefono_movil || newLeadData.telefono_fijo || '',
      telefono_movil: newLeadData.telefono_movil || '',
      telefono_fijo: newLeadData.telefono_fijo || '',
      instagram: newLeadData.instagram || '',
      website: newLeadData.website || '',
      icono: newLeadData.icono || (sectionTab === 'medios' ? '📻' : '🏛️'),
      imagen_url: newLeadData.imagen_url || '',
      fuente: 'Alta Manual CRM',
      estado: 'nuevo',
      pitch_generado:
        newLeadData.pitch_generado ||
        (sectionTab === 'medios'
          ? `Asunto: Nota de Prensa: ${effectiveBandName} presenta su directo\n\nEstimada redacción / equipo de ${newLeadData.nombre_sala},\n\nOs remitimos la información de la propuesta musical de ${effectiveBandName}...`
          : `Asunto: Propuesta de concierto: ${effectiveBandName} en ${newLeadData.nombre_sala}\n\nHola equipo de booking,\n\nSomos la banda ${effectiveBandName}...`),
      notas:
        newLeadData.notas ||
        `Añadido desde la sección ${sectionTab === 'medios' ? 'Medios' : 'Salas'} el ${new Date().toISOString().split('T')[0]}`,
    };

    if (onAddLead) {
      onAddLead(createdLead);
    } else {
      onUpdateLead(createdLead.id, createdLead);
    }

    setIsAddingLeadModalOpen(false);
    setSelectedLead(createdLead);
  };

  return { handleAddNewLeadSubmit, handleModalScrape };
}
