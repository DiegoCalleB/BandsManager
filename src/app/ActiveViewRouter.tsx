/**
 * Vista activa de la aplicación interna (resumen, CRM, calendario, repertorio…).
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { RefreshCw,ShieldAlert } from "lucide-react";
import { Suspense } from "react";
import Dashboard from "../components/Dashboard";
import ErrorBoundary from "../components/ErrorBoundary";
import { SkeletonDashboard } from "../components/ui/Skeleton";
import type { Rehearsal } from "../types";
import { LeadStatus } from "../types";
import { useApp } from "./AppContext";
import { BandCRM,BookingCRM,CalendarView,Chatbot,EnsayosManager,EPKManager,FansPanel,Finanzas,Merchan,Planes,ReelsCenter,RepertorioSetlists,TourManager } from "./lazyViews";

/**
 * Vista activa de la aplicación interna (resumen, CRM, calendario, repertorio…).
 * @returns Sección de interfaz.
 */
export function ActiveViewRouter() {
  const { currentView, isLoading, leads, colors, handleUpdateLead, handleAddLeadWithLimitCheck, metrics, concerts, rehearsals, handleAddRehearsal, bandUsers, currentUser, currentActiveBandName, currentActiveBandId, availableBands, handleNavigate, setShowUserProfileModal, epkConfig, tours, fans, posts, payments, isPromoPlan, activeCampaign, handleSetActiveCampaign, handleDeleteLead, handleBulkDeleteLeads, handleUpdateEpkConfig, bookingOptions, handleCrmSectionChange, bandsCount, activeBandConcerts, handleDeleteBand, campaigns, handleUpdateRehearsal, handleUpdateConcert, handleDeleteRehearsal, handleDeleteConcert, handleAddConcert, currentActiveBandLogo, activeBandRehearsals, handleAddPost, handleUpdatePost, currentTheme, handleAddFanWithLimitCheck, handleUpdateFan, handleDeleteFan, handleUpdateIncentive, handleAddMetric, handleUpdateMetric, handleDeleteMetric, handleSaveTour, handleDeleteTour, handleAddPayment, isAdmin, handleUpdatePayment, handleChatLoadingChange, currentActiveBandPlan } = useApp();
  return (
    <>
{/* Dynamic Views */}
          <div
            key={currentView}
            className="flex-auto shrink-0 min-h-[500px] flex flex-col animate-fade-in"
          >
            {isLoading ? (
              <SkeletonDashboard />
            ) : (
              <Suspense
                fallback={
                  <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
                    <RefreshCw className="w-8 h-8 animate-spin text-[var(--acc)]" />
                  </div>
                }
              >
                {currentView === "resumen" && (
                  <Dashboard
                    leads={leads}
                    colors={colors}
                    onUpdateLead={handleUpdateLead}
                    onAddLead={handleAddLeadWithLimitCheck}
                    metrics={metrics}
                    concerts={concerts}
                    rehearsals={rehearsals}
                    onAddRehearsal={handleAddRehearsal}
                    bandUsers={bandUsers}
                    currentUser={currentUser}
                    bandName={currentActiveBandName}
                    currentBandId={currentActiveBandId}
                    availableBands={availableBands}
                    onNavigate={handleNavigate}
                    onOpenProfileModal={() => setShowUserProfileModal(true)}
                    epkConfig={epkConfig}
                    tours={tours}
                    fans={fans}
                    posts={posts}
                    payments={payments}
                    isPromoPlan={isPromoPlan}
                  />
                )}
                {(currentView === "booking" ||
                  currentView === "medios" ||
                  currentView === "management") && (
                  <BookingCRM
                    key="contacts-crm"
                    activeCampaign={activeCampaign}
                    onCampaignChange={handleSetActiveCampaign}
                    leads={leads}
                    colors={colors}
                    onUpdateLead={handleUpdateLead}
                    onAddLead={handleAddLeadWithLimitCheck}
                    onDeleteLead={handleDeleteLead}
                    onBulkDeleteLeads={handleBulkDeleteLeads}
                    epkConfig={epkConfig}
                    onUpdateEpkConfig={handleUpdateEpkConfig}
                    initialSection={
                      currentView === "medios"
                        ? "medios"
                        : currentView === "management"
                          ? "grupos"
                          : bookingOptions.sectionTab || "salas"
                    }
                    onSectionChange={handleCrmSectionChange}
                    onNavigate={handleNavigate}
                    bandsCount={bandsCount}
                    initialStatusFilter={
                      (bookingOptions.statusFilter as LeadStatus | "todos") ||
                      "todos"
                    }
                    initialSelectedLeadId={bookingOptions.selectedLeadId}
                    currentUser={currentUser}
                    bandName={currentActiveBandName}
                    currentBandId={currentActiveBandId}
                    concerts={activeBandConcerts || concerts}
                    tours={tours}
                  />
                )}
                {currentView === "bandas" && (
                  <BandCRM
                    colors={colors}
                    leads={leads}
                    onAddLead={handleAddLeadWithLimitCheck}
                    onUpdateLead={handleUpdateLead}
                    onDeleteBand={handleDeleteBand}
                    currentBandId={currentActiveBandId}
                    bandName={currentActiveBandName}
                    onNavigate={handleNavigate}
                  />
                )}
                {currentView === "calendario" && (
                  <CalendarView
                    colors={colors}
                    rehearsals={rehearsals}
                    concerts={concerts}
                    campaigns={campaigns}
                    activeCampaign={activeCampaign}
                    onNavigate={handleNavigate}
                    onUpdateRehearsal={handleUpdateRehearsal}
                    onUpdateConcert={handleUpdateConcert}
                    onDeleteRehearsal={handleDeleteRehearsal}
                    onDeleteConcert={handleDeleteConcert}
                    onAddRehearsal={handleAddRehearsal}
                    onAddConcert={handleAddConcert}
                    initialSelectedEventId={bookingOptions.selectedEventId}
                    initialSelectedDate={bookingOptions.selectedDate}
                    currentBandId={currentActiveBandId}
                    currentBandName={currentActiveBandName}
                    currentBandLogo={currentActiveBandLogo}
                    availableBands={availableBands}
                    bandUsers={bandUsers}
                    currentUser={currentUser}
                    isPromoPlan={isPromoPlan}
                  />
                )}
                {currentView === "ensayos" && (
                  <ErrorBoundary fallbackTitle="Ensayos & Local en Vivo">
                    <EnsayosManager
                      rehearsals={activeBandRehearsals}
                      onSaveRehearsal={(r) => {
                        if (r.id) {
                          handleUpdateRehearsal(r.id, r);
                        } else {
                          handleAddRehearsal(r as Rehearsal);
                        }
                      }}
                      onDeleteRehearsal={handleDeleteRehearsal}
                      concerts={activeBandConcerts}
                      colors={colors}
                      currentBandId={currentActiveBandId}
                      bandUsers={bandUsers}
                    />
                  </ErrorBoundary>
                )}
                {currentView === "reels" && (
                  <ReelsCenter
                    colors={colors}
                    posts={posts}
                    onAddPost={handleAddPost}
                    onUpdatePost={handleUpdatePost}
                    bandName={currentActiveBandName}
                    instagramHandle={
                      (epkConfig?.enlacesRedes?.instagram || "")
                        .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
                        .replace(/^@/, "")
                        .replace(/\/$/, "") || undefined
                    }
                    hasAnySocialLink={Boolean(
                      epkConfig?.enlacesRedes?.instagram ||
                      epkConfig?.enlacesRedes?.tiktok ||
                      epkConfig?.enlacesRedes?.youtube ||
                      epkConfig?.enlacesRedes?.facebook,
                    )}
                  />
                )}
                {(currentView === "repertorio" ||
                  currentView === "catalogo" ||
                  currentView === "discografia") && (
                  <ErrorBoundary fallbackTitle="Repertorio y Setlists">
                    <RepertorioSetlists
                      key={currentActiveBandId}
                      colors={colors}
                      concerts={activeBandConcerts}
                      rehearsals={activeBandRehearsals}
                      bandName={currentActiveBandName}
                      bandId={currentActiveBandId}
                      bandUsers={bandUsers}
                      bandLogoUrl={currentActiveBandLogo}
                      onUpdateConcert={handleUpdateConcert}
                      onUpdateRehearsal={handleUpdateRehearsal}
                      view={currentView}
                      currentUser={currentUser}
                      onNavigate={handleNavigate}
                    />
                  </ErrorBoundary>
                )}
                {currentView === "merchan" && (
                  <Merchan
                    colors={colors}
                    currentTheme={currentTheme}
                    bandId={currentActiveBandId}
                    bandName={currentActiveBandName}
                    bandLogoUrl={currentActiveBandLogo}
                  />
                )}
                {currentView === "epk" && (
                  <ErrorBoundary fallbackTitle="EPK / Dossier Promocional">
                    <EPKManager
                      key={currentActiveBandId}
                      epkConfig={epkConfig}
                      onSave={handleUpdateEpkConfig}
                      colors={colors}
                      currentTheme={currentTheme}
                      currentUser={currentUser}
                      isPromoPlan={isPromoPlan}
                    />
                  </ErrorBoundary>
                )}
                {currentView === "fans" && (
                  <FansPanel
                    fans={fans}
                    concerts={activeBandConcerts}
                    epkConfig={epkConfig}
                    onAddFan={handleAddFanWithLimitCheck}
                    onUpdateFan={handleUpdateFan}
                    onDeleteFan={handleDeleteFan}
                    onUpdateIncentive={handleUpdateIncentive}
                    onUpdateEpkConfig={handleUpdateEpkConfig}
                    currentBandId={currentActiveBandId}
                    currentBandName={currentActiveBandName}
                    currentBandLogo={currentActiveBandLogo}
                    metrics={metrics}
                    onAddMetric={handleAddMetric}
                    onUpdateMetric={handleUpdateMetric}
                    onDeleteMetric={handleDeleteMetric}
                    colors={colors}
                    onNavigate={handleNavigate}
                    isPromo={isPromoPlan}
                    onUpdateConcert={handleUpdateConcert}
                    initialConcertId={bookingOptions.concertId}
                  />
                )}
                {currentView === "giras" && (
                  <ErrorBoundary fallbackTitle="Gestor de Giras">
                    <TourManager
                      colors={colors}
                      tours={tours}
                      concerts={activeBandConcerts}
                      leads={leads}
                      activeCampaign={activeCampaign}
                      setActiveCampaign={handleSetActiveCampaign}
                      onAddLead={handleAddLeadWithLimitCheck}
                      onDeleteLead={handleDeleteLead}
                      onSaveTour={handleSaveTour}
                      onDeleteTour={handleDeleteTour}
                      bandUsers={bandUsers}
                      currentUser={currentUser}
                      currentBandId={currentActiveBandId}
                      currentBandName={currentActiveBandName}
                      onAddConcert={handleAddConcert}
                      onUpdateConcert={handleUpdateConcert}
                      onAddPayment={handleAddPayment}
                      onNavigate={handleNavigate}
                    />
                  </ErrorBoundary>
                )}
                {currentView === "finanzas" &&
                  (isAdmin ? (
                    <Finanzas
                      colors={colors}
                      payments={payments}
                      concerts={activeBandConcerts}
                      onAddPayment={handleAddPayment}
                      onUpdatePayment={handleUpdatePayment}
                      onUpdateConcert={handleUpdateConcert}
                      tours={tours}
                      bandUsers={bandUsers}
                    />
                  ) : (
                    <div
                      className={`p-8 rounded-[var(--r-m)] text-center space-y-3 ${colors.card} `}
                    >
                      <ShieldAlert className="w-10 h-10 text-[var(--alert)] mx-auto" />
                      <h3 className="text-sm font-sans font-bold text-[var(--alert)]">
                        Acceso Restringido
                      </h3>
                      <p className="text-xs text-[var(--ink-2)] max-w-md mx-auto">
                        El apartado de Finanzas es confidencial y solo está
                        accesible para los administradores de la banda.
                      </p>
                    </div>
                  ))}
                {/* Full View Chatbot Instance */}
                {currentView === "chat" && (
                  <div className="w-full h-[calc(100vh-140px)] min-h-[600px] block">
                    <Chatbot
                      key={`main_${currentUser?.id || "guest"}_${currentUser?.band_id || "default"}`}
                      colors={colors}
                      leads={leads}
                      rehearsals={rehearsals}
                      concerts={concerts}
                      epkConfig={epkConfig}
                      onUpdateLead={handleUpdateLead}
                      onCreateLead={handleAddLeadWithLimitCheck}
                      onAddRehearsal={handleAddRehearsal}
                      onAddConcert={handleAddConcert}
                      onNavigate={handleNavigate}
                      isFloating={false}
                      userRole={currentUser?.role}
                      currentUser={currentUser}
                      activeBandName={currentActiveBandName}
                      onLoadingChange={handleChatLoadingChange}
                    />
                  </div>
                )}

                {currentView === "planes" && (
                  <Planes
                    colors={colors}
                    currentUser={currentUser}
                    activeBandName={currentActiveBandName}
                    currentBandPlan={currentActiveBandPlan}
                    onNavigateToModule={handleNavigate}
                  />
                )}
              </Suspense>
            )}
          </div>
    </>
  );
}
