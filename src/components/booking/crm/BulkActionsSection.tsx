/**
 * Barra de acciones masivas y listado con selección múltiple.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Lead } from "../../../types";
import { apiFetch } from "../../../utils/api";
import { getErrorMessage } from "../../../utils/errorMessage";
import { BulkLeadsActionBar } from "../BulkLeadsActionBar";
import { BulkProgressItem } from "../BulkProgressModal";
import { useBookingCrm } from "./BookingCrmContext";

/**
 * Barra de acciones masivas y listado con selección múltiple.
 * @returns Sección de interfaz.
 */
export function BulkActionsSection() {
  const { selectedLeadIds, filteredLeads, setSelectedLeadIds, onUpdateLead, leads, setBulkProgressState, activeCampaign, setIsExportLeadsOpen, onBulkDeleteLeads, onDeleteLead, sectionTab } = useBookingCrm();
  return (
    <>
      {/* 🎯 GMAIL-STYLE BULK ACTIONS BAR (STICKY AT TOP OF LIST) */}
      <BulkLeadsActionBar
      selectedCount={selectedLeadIds.length}
      totalFilteredCount={filteredLeads.length}
      isAllSelected={filteredLeads.length > 0 && filteredLeads.every((l) => selectedLeadIds.includes(l.id))}
      onSelectAll={() => setSelectedLeadIds(filteredLeads.map((l) => l.id))}
      onDeselectAll={() => setSelectedLeadIds([])}
      onBulkStatusChange={(newStatus) => {
        if (selectedLeadIds.length === 0) return;
        selectedLeadIds.forEach((id) => {
          onUpdateLead(id, { estado: newStatus });
        });
      }}
      onBulkToggleFavorite={(isFav) => {
        if (selectedLeadIds.length === 0) return;
        selectedLeadIds.forEach((id) => {
          onUpdateLead(id, { es_favorito: isFav });
        });
      }}
      onBulkGeneratePitches={async () => {
        const selectedList = leads.filter((l) => selectedLeadIds.includes(l.id));
        if (selectedList.length === 0) return;

        const initialItems: BulkProgressItem[] = selectedList.map((l) => ({
          id: l.id,
          name: l.nombre_sala,
          status: 'pending',
        }));

        setBulkProgressState({
          isOpen: true,
          title: 'Generando Pitches con IA Agéntica',
          subtitle: 'Redactando propuestas personalizadas basadas en el ADN de la banda',
          items: initialItems,
          currentIndex: 0,
          totalCount: initialItems.length,
          isCompleted: false,
        });

        const updatedItems = [...initialItems];

        for (let i = 0; i < selectedList.length; i++) {
          const targetLead = selectedList[i];
          updatedItems[i] = {
            ...updatedItems[i],
            status: 'in_progress',
            detail: 'Contactando Agente Redactor...',
          };
          setBulkProgressState((prev) => ({
            ...prev,
            items: [...updatedItems],
            currentIndex: i,
          }));

          try {
            const campaignIsActive = Boolean(
              activeCampaign && (activeCampaign.isActive ?? activeCampaign.is_active ?? true)
            );
            const res = await apiFetch(`/api/leads/${targetLead.id}/regenerate-pitch`, {
              method: 'POST',
              body: JSON.stringify({
                activeCampaign: campaignIsActive ? activeCampaign : undefined,
              }),
            });

            if (res.success && res.newPitchText) {
              onUpdateLead(targetLead.id, {
                pitch_generado: res.newPitchText,
                estado: 'pendiente_aprobacion',
              });
              updatedItems[i] = {
                ...updatedItems[i],
                status: 'success',
                detail: res.simulated ? 'Propuesta lista (motor local ADN)' : 'Propuesta redactada',
              };
            } else {
              updatedItems[i] = {
                ...updatedItems[i],
                status: 'error',
                detail: res.error || 'No se pudo generar la propuesta',
              };
            }
          } catch (err) {
            updatedItems[i] = {
              ...updatedItems[i],
              status: 'error',
              detail: getErrorMessage(err, 'Error al generar'),
            };
          }

          setBulkProgressState((prev) => ({
            ...prev,
            items: [...updatedItems],
            currentIndex: i + 1,
          }));
        }

        setBulkProgressState((prev) => ({
          ...prev,
          isCompleted: true,
        }));
      }}
      onBulkEnrich={async () => {
        const selectedList = leads.filter((l) => selectedLeadIds.includes(l.id));
        if (selectedList.length === 0) return;

        const initialItems: BulkProgressItem[] = selectedList.map((l) => ({
          id: l.id,
          name: l.nombre_sala,
          status: 'pending',
        }));

        setBulkProgressState({
          isOpen: true,
          title: 'Enriquecimiento Masivo con Agente Scout',
          subtitle: 'Buscando datos de contacto, aforo, dirección y redes',
          items: initialItems,
          currentIndex: 0,
          totalCount: initialItems.length,
          isCompleted: false,
        });

        const updatedItems = [...initialItems];

        for (let i = 0; i < selectedList.length; i++) {
          const targetLead = selectedList[i];
          updatedItems[i] = {
            ...updatedItems[i],
            status: 'in_progress',
            detail: 'Buscando datos...',
          };
          setBulkProgressState((prev) => ({
            ...prev,
            items: [...updatedItems],
            currentIndex: i,
          }));

          try {
            const res = await apiFetch(`/api/leads/enrich-lead`, {
              method: 'POST',
              body: JSON.stringify({
                leadId: targetLead.id,
                name: targetLead.nombre_sala,
                city: targetLead.ciudad || 'España',
              }),
            });

            if (res.success && res.data) {
              const d = res.data;
              const updates: Partial<Lead> = {};
              if (d.email && !targetLead.email_contacto) updates.email_contacto = d.email;
              if (d.phone && !targetLead.telefono) updates.telefono = d.phone;
              if (d.website && !targetLead.website) updates.website = d.website;
              if (d.capacity && !targetLead.aforo) updates.aforo = d.capacity;
              if (d.address && !targetLead.direccion) updates.direccion = d.address;
              if (d.instagram && !targetLead.instagram) updates.instagram = d.instagram;

              if (Object.keys(updates).length > 0) {
                onUpdateLead(targetLead.id, updates);
                updatedItems[i] = {
                  ...updatedItems[i],
                  status: 'success',
                  detail: `Actualizado: ${Object.keys(updates).join(', ')}`,
                };
              } else {
                updatedItems[i] = {
                  ...updatedItems[i],
                  status: 'success',
                  detail: 'Ficha al día',
                };
              }
            } else {
              updatedItems[i] = {
                ...updatedItems[i],
                status: 'success',
                detail: 'Sin datos nuevos',
              };
            }
          } catch (err) {
            updatedItems[i] = {
              ...updatedItems[i],
              status: 'error',
              detail: getErrorMessage(err, 'Error en búsqueda'),
            };
          }

          setBulkProgressState((prev) => ({
            ...prev,
            items: [...updatedItems],
            currentIndex: i + 1,
          }));
        }

        setBulkProgressState((prev) => ({
          ...prev,
          isCompleted: true,
        }));
      }}
      onBulkExportCsv={() => setIsExportLeadsOpen(true)}
      onBulkDelete={() => {
        if (selectedLeadIds.length === 0) return;
        const idsToDelete = [...selectedLeadIds];
        setSelectedLeadIds([]);
        if (onBulkDeleteLeads) {
          onBulkDeleteLeads(idsToDelete);
        } else if (onDeleteLead) {
          idsToDelete.forEach((id) => onDeleteLead(id));
        }
      }}
      sectionTab={sectionTab}
      />
    </>
  );
}
