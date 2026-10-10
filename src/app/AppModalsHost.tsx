/**
 * Modales globales cargados bajo demanda, chat flotante, estudio y avisos.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Guitar,RefreshCw,X } from "lucide-react";
import { Suspense } from "react";
import { SaveErrorBanner } from "../components/SaveErrorBanner";
import { DealSupportPrompt } from "../components/booking/DealSupportPrompt";
import type { EPKConfig,Song } from "../types";
import { useApp } from "./AppContext";
import { BandSwitcherModal,CampaignManagerModal,Chatbot,FontSelectorModal,MusicianOnboardingModal,NotificationSettingsModal,OnboardingWizardModal,PlanLimitModal,SongStudioModal,UserManagementModal,UserProfileModal } from "./lazyViews";

/**
 * Modales globales cargados bajo demanda, chat flotante, estudio y avisos.
 * @returns Sección de interfaz.
 */
export function AppModalsHost() {
  const { showUserManagementModal, isAdmin, currentUser, bandUsers, setShowUserManagementModal, fetchState, currentActiveBandId, currentActiveBandName, currentActiveBandLogo, epkConfig, handleUpdateEpkConfig, showUserProfileModal, setShowUserProfileModal, setCurrentUser, currentTheme, handleThemeChange, currentFont, handleFontChange, availableBands, handleSetMainBand, setShowBandSwitcherModal, handleNavigate, setShowProfileWizardModal, setShowNotificationSettingsModal, showFontModal, setShowFontModal, currentView, isPromoPlan, isFloatingChatOpen, colors, leads, rehearsals, concerts, handleUpdateLead, handleAddLeadWithLimitCheck, handleAddRehearsal, handleAddConcert, setIsFloatingChatOpen, handleChatLoadingChange, isChatLoading, showBandSwitcherModal, handleSwitchBand, planLimitModal, setPlanLimitModal, showCampaignModal, setShowCampaignModal, campaigns, activeCampaign, handleSaveCampaign, handleDeleteCampaign, handleSetActiveCampaign, cleanActiveBandId, showOnboardingModal, showProfileWizardModal, setShowOnboardingModal, isLoggedIn, currentActiveBandPlan, showNotificationSettingsModal, notificationPermission, notificationConfig, updateNotificationConfig, requestNotificationPermission, triggerTestNotification, triggerTestNotificationSound, globalStudioSong, setGlobalStudioSong, setGlobalStudioOpenIris, globalStudioOpenIris } = useApp();
  return (
    <>
{/* Los modales se cargan bajo demanda (safeLazy): necesitan su propio límite de Suspense. */}
        <Suspense fallback={null}>
          {/* User Management Modal for Band Leader */}
          {showUserManagementModal &&
            (isAdmin ||
              currentUser?.role === "leader" ||
              currentUser?.role === "admin") && (
              <UserManagementModal
                currentUser={currentUser}
                users={bandUsers}
                onClose={() => setShowUserManagementModal(false)}
                onRefreshUsers={fetchState}
                bandId={currentActiveBandId}
                bandName={currentActiveBandName}
                bandLogoUrl={currentActiveBandLogo || epkConfig?.logoUrl}
                onRefreshData={fetchState}
                onUpdateLogo={async (newUrl) => {
                  if (handleUpdateEpkConfig) {
                    await handleUpdateEpkConfig({ ...epkConfig, logoUrl: newUrl });
                  }
                  await fetchState();
                }}
              />
            )}

          {/* User Profile & Password Change Modal for All Users */}
          {showUserProfileModal && currentUser && (
            <UserProfileModal
              currentUser={currentUser}
              onClose={() => setShowUserProfileModal(false)}
              onUpdateUser={(updated) => {
                setCurrentUser(updated);
                localStorage.setItem("bandmanager_user", JSON.stringify(updated));
                fetchState();
              }}
              isAdmin={isAdmin}
              onOpenBandManagement={() => setShowUserManagementModal(true)}
              currentTheme={currentTheme}
              onThemeChange={handleThemeChange}
              currentFont={currentFont}
              onFontChange={handleFontChange}
              epkConfig={epkConfig}
              onUpdateEpkConfig={handleUpdateEpkConfig}
              activeBandName={currentActiveBandName}
              onRefreshData={fetchState}
              availableBands={availableBands}
              onSetMainBand={handleSetMainBand}
              onOpenBandSwitcher={() => setShowBandSwitcherModal(true)}
              onNavigateToPlanes={() => handleNavigate("planes")}
              onOpenProfileWizard={() => setShowProfileWizardModal(true)}
              onOpenNotificationSettings={() =>
                setShowNotificationSettingsModal(true)
              }
            />
          )}

          {/* Font Selector Modal */}
          {showFontModal && (
            <FontSelectorModal
              onClose={() => setShowFontModal(false)}
              currentFont={currentFont}
              onSelectFont={(f) => {
                handleFontChange(f);
              }}
            />
          )}

          {/* Floating Chatbot Overlay */}
          {currentView !== "chat" && !isPromoPlan && (
            <div
              className={`fixed bottom-36 lg:bottom-20 right-4 sm:right-6 w-[92vw] sm:w-[420px] max-w-[440px] h-[580px] max-h-[80vh] z-[9999] transition-ui duration-200 ${
                isFloatingChatOpen
                  ? "block animate-in slide-in-from-bottom-5"
                  : "hidden"
              }`}
            >
              <Suspense fallback={null}>
                <Chatbot
                  key={`floating_${currentUser?.id || "guest"}_${currentUser?.band_id || "default"}`}
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
                  isFloating={true}
                  onClose={() => setIsFloatingChatOpen(false)}
                  userRole={currentUser?.role}
                  currentUser={currentUser}
                  activeBandName={currentActiveBandName}
                  onLoadingChange={handleChatLoadingChange}
                />
              </Suspense>
            </div>
          )}

          {/* Floating Chatbot Trigger Button */}
          {currentView !== "chat" && !isPromoPlan && (
            <button
              id="floating-chat-trigger-btn"
              onClick={() => setIsFloatingChatOpen(!isFloatingChatOpen)}
              className={`fixed bottom-20 lg:bottom-5 right-5 z-40 px-3.5 py-2.5 rounded-full flex items-center gap-2.5 transition-ui duration-300 cursor-pointer active:scale-[0.97] group shadow-lg ${
                isFloatingChatOpen
                  ? "bg-[var(--alert-soft)] text-[var(--alert)] border border-[var(--alert)]/30 hover:bg-[var(--alert)]/20"
                  : isChatLoading
                    ? "bg-[var(--surface)] text-[var(--acc-ink)] border border-[var(--acc)]/30 animate-pulse"
                    : "bg-[var(--surface)] text-[var(--ink)] border border-[var(--hair)] hover:border-[var(--acc)]/40 hover:bg-[var(--sunken)]"
              }`}
              title={
                isChatLoading
                  ? "Agente IA ejecutando en segundo plano..."
                  : "Abrir Agente Mánager IA"
              }
            >
              {isFloatingChatOpen ? (
                <X className="w-5 h-5 text-[var(--alert)]" />
              ) : (
                <>
                  <div className="relative">
                    {isChatLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin text-[var(--acc)]" />
                    ) : (
                      <Guitar className="w-4 h-4 text-[var(--acc)]" />
                    )}
                    <span
                      className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${isChatLoading ? "bg-amber-400" : "bg-emerald-400"}`}
                    />
                  </div>
                  <span className="text-xs font-sans font-bold hidden sm:inline-block pr-1 text-[var(--ink)]">
                    {isChatLoading ? "Ejecutando..." : "Agente IA"}
                  </span>
                </>
              )}
            </button>
          )}

          {/* Band Switcher Modal (Netflix Style) */}
          <BandSwitcherModal
            isOpen={showBandSwitcherModal}
            onClose={() => setShowBandSwitcherModal(false)}
            currentUser={currentUser}
            availableBands={availableBands}
            epkConfig={epkConfig}
            onUpdateEpkConfig={handleUpdateEpkConfig}
            onRefreshData={fetchState}
            onSwitchBand={async (bandId) => {
              await handleSwitchBand(bandId);
              await fetchState();
            }}
            onSetMainBand={handleSetMainBand}
            onOpenRegisterBand={() => handleNavigate("bandas")}
            onOpenBandManagement={() => setShowUserManagementModal(true)}
          />

          {/* Soft Limits Upgrade Modal */}
          <PlanLimitModal
            isOpen={planLimitModal.isOpen}
            onClose={() =>
              setPlanLimitModal((prev) => ({ ...prev, isOpen: false }))
            }
            onNavigateToPlanes={() => {
              setPlanLimitModal((prev) => ({ ...prev, isOpen: false }));
              handleNavigate("planes");
            }}
            currentUser={currentUser}
            activeBandName={currentActiveBandName}
            resourceType={planLimitModal.resourceType}
            currentCount={planLimitModal.currentCount}
          />

          {/* Campaign Manager Modal */}
          <CampaignManagerModal
            isOpen={showCampaignModal}
            onClose={() => setShowCampaignModal(false)}
            campaigns={campaigns}
            activeCampaign={activeCampaign}
            onSaveCampaign={handleSaveCampaign}
            onDeleteCampaign={handleDeleteCampaign}
            onSetActiveCampaign={handleSetActiveCampaign}
            onNavigate={handleNavigate}
          />

          {/* Musician First-Time Onboarding Modal ("Elige tu misión") */}
          <MusicianOnboardingModal
            key={`musician-onboarding-${cleanActiveBandId || "default"}`}
            isOpen={showOnboardingModal && !showProfileWizardModal}
            onClose={() => {
              setShowOnboardingModal(false);
              try {
                if (cleanActiveBandId) {
                  localStorage.setItem(
                    `bandmanager_onboarding_completed_${cleanActiveBandId}`,
                    "true",
                  );
                }
                localStorage.setItem(
                  "bandmanager_onboarding_completed",
                  "true",
                );
              } catch {
                // localStorage no disponible: el flujo de onboarding continúa igualmente.
              }
            }}
            onSelectMission={(targetView) => handleNavigate(targetView)}
            bandName={currentActiveBandName}
          />

          <SaveErrorBanner />

          {/* Aviso tras la firma de la sala: aportación voluntaria a BandManager (opcional) */}
          <DealSupportPrompt
            key={`apoyo-${cleanActiveBandId || "default"}`}
            isLoggedIn={isLoggedIn}
            bandId={currentUser?.band_id}
          />

          {/* Comprehensive Band Profile Setup Wizard */}
          <OnboardingWizardModal
            key={`profile-wizard-${cleanActiveBandId || "default"}`}
            isOpen={showProfileWizardModal && isLoggedIn}
            onClose={() => {
              setShowProfileWizardModal(false);
              try {
                if (cleanActiveBandId) {
                  localStorage.setItem(
                    `bandmanager_profile_wizard_completed_${cleanActiveBandId}`,
                    "true",
                  );
                }
                localStorage.setItem(
                  "bandmanager_profile_wizard_completed",
                  "true",
                );
                window.dispatchEvent(
                  new CustomEvent("bandmanager_onboarding_finished"),
                );
              } catch {
                // localStorage no disponible: el flujo de onboarding continúa igualmente.
              }
            }}
            currentUser={currentUser}
            epkConfig={epkConfig as EPKConfig}
            onUpdateEpkConfig={handleUpdateEpkConfig}
            onSongsImported={() => {
              fetchState();
            }}
            onRefreshData={fetchState}
            onAddConcert={handleAddConcert}
            onAddRehearsal={handleAddRehearsal}
            bandId={currentActiveBandId}
            bandName={currentActiveBandName}
            bandLogoUrl={currentActiveBandLogo}
            bandPlan={currentActiveBandPlan}
          />

          {/* Browser Push Notifications Settings Modal */}
          <NotificationSettingsModal
            isOpen={showNotificationSettingsModal}
            onClose={() => setShowNotificationSettingsModal(false)}
            permission={notificationPermission}
            config={notificationConfig}
            onUpdateConfig={updateNotificationConfig}
            onRequestPermission={requestNotificationPermission}
            onTriggerTest={triggerTestNotification}
            onTriggerTestSound={triggerTestNotificationSound}
          />

          {/* Song Studio Global Modal */}
          {globalStudioSong && (
            <SongStudioModal
              song={globalStudioSong}
              colors={colors}
              onClose={() => {
                setGlobalStudioSong(null);
                setGlobalStudioOpenIris(false);
              }}
              onUpdateSong={(updatedSong: Song) => {
                setGlobalStudioSong(updatedSong);
              }}
              currentUser={currentUser}
              currentUsername={currentUser?.name || currentUser?.username}
              initialOpenIrisModal={globalStudioOpenIris}
            />
          )}
        </Suspense>
    </>
  );
}
