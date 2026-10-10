/**
 * Área principal: campaña activa, aviso de sincronización y vista activa.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { ShieldAlert } from "lucide-react";
import { GlobalCampaignBar } from "../components/campaign/GlobalCampaignBar";
import { ActiveViewRouter } from "./ActiveViewRouter";
import { useApp } from "./AppContext";

/**
 * Área principal: campaña activa, aviso de sincronización y vista activa.
 * @returns Sección de interfaz.
 */
export function AppMainContent() {
  const { activeCampaign, currentView, leads, setShowCampaignModal, handleSetActiveCampaign, handleNavigate, syncStatus, fetchState,} = useApp();
  return (
    <>
<main className="flex-1 flex flex-col min-w-0 bg-[var(--bg)] p-3 sm:p-5 lg:p-8 pb-32 lg:pb-8 overflow-y-auto custom-scrollbar">
          {/* Global Active Campaign Banner (solo en módulos de Booking: salas, medios, management, grupos) */}
          {activeCampaign &&
            ["booking", "medios", "management", "bandas"].includes(
              currentView,
            ) && (
              <GlobalCampaignBar
                campaign={activeCampaign}
                allLeads={leads}
                onOpenManager={() => setShowCampaignModal(true)}
                onDeactivate={() => handleSetActiveCampaign(null)}
                onNavigate={handleNavigate}
                currentView={currentView}
              />
            )}

          {/* Sync warning if backend fails */}
          {syncStatus === "error" && (
            <div className="mb-4 p-3 bg-[var(--alert)]/10 rounded-[var(--r-s)] text-[var(--alert)] text-xs flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
              <div className="flex gap-2 items-center">
                <ShieldAlert className="w-5 h-5 text-[var(--alert)] shrink-0" />
                <span>
                  <strong>Sin conexión con el servidor.</strong> Lo que hagas
                  ahora se guarda solo en este navegador hasta que vuelva.
                </span>
              </div>
              <button
                onClick={() => fetchState()}
                className="px-3 py-1.5 bg-[var(--alert)]/10 hover:bg-[var(--alert)]/20 text-[var(--alert)] font-sans text-micro rounded-[var(--r-pill)] transition-ui cursor-pointer whitespace-nowrap active:scale-[0.97]"
              >
                Reintentar Conexión
              </button>
            </div>
          )}

          <ActiveViewRouter />
        </main>
    </>
  );
}
