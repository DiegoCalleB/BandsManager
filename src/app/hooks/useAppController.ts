/**
 * Controlador de la aplicación: sesión, datos, banda activa, navegación, tema y estado del armazón.
 * Extraído de App.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { findNavGroupIdForItem } from "../../config/navGroups";
import { useLanguage } from "../../context/LanguageContext";
import { useAppData } from "../../hooks/useAppData";
import { useAuth } from "../../hooks/useAuth";
import { useActiveBand } from "./useActiveBand";
import { useAppNavigation } from "./useAppNavigation";
import { useAppTheme } from "./useAppTheme";
import { useGlobalStudio } from "./useGlobalStudio";
import { useHashRoute } from "./useHashRoute";
import { useNavState } from "./useNavState";
import { usePlanLimitGuards } from "./usePlanLimitGuards";
import { useShellState } from "./useShellState";

/**
 * Controlador de la aplicación: sesión, datos, banda activa, navegación, tema y estado del armazón.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useAppController() {
  const { t, language, refreshTranslation } = useLanguage();

  // Authentication Custom Hook
  const {
    currentUser,
    isLoggedIn,
    isAdmin,
    availableBands,
    setCurrentUser,
    refreshSession,
    handleLoginSuccess,
    handleSwitchBand,
    handleSetMainBand,
    handleLogout,
  } = useAuth();

  // Application Data & Sync Custom Hook
  const {
    leads,
    rehearsals,
    tours,
    concerts,
    posts,
    payments,
    messages,
    metrics,
    bandUsers,
    fans,
    epkConfig,
    campaigns,
    activeCampaign,
    isLoading,
    syncStatus,
    fetchState,
    handleSaveCampaign,
    handleDeleteCampaign,
    handleSetActiveCampaign,
    handleUpdateEpkConfig,
    handleUpdateLead,
    handleUpdateRehearsal,
    handleUpdateConcert,
    handleDeleteRehearsal,
    handleDeleteConcert,
    handleAddLead,
    handleDeleteLead,
    handleBulkDeleteLeads,
    handleDeleteBand,
    handleAddRehearsal,
    handleAddConcert,
    handleAddPost,
    handleUpdatePost,
    handleAddMetric,
    handleUpdateMetric,
    handleDeleteMetric,
    handleAddPayment,
    handleUpdatePayment,
    handleSaveTour,
    handleDeleteTour,
    handleAddFan,
    handleUpdateFan,
    handleDeleteFan,
    handleUpdateIncentive,
  } = useAppData(isLoggedIn, currentUser?.band_id);

  const [showUserManagementModal, setShowUserManagementModal] = useState(false);

  const [showUserProfileModal, setShowUserProfileModal] = useState(false);

  const [showCampaignModal, setShowCampaignModal] = useState(false);

  const [showProfileWizardModal, setShowProfileWizardModal] =
    useState<boolean>(false);

  const [showOnboardingModal, setShowOnboardingModal] =
    useState<boolean>(false);

  const [showNotificationSettingsModal, setShowNotificationSettingsModal] =
    useState<boolean>(false);

  const { currentActiveBandPlan, isPromoPlan, currentActiveBandId, isSameBand, currentActiveBandName, currentActiveBandLogo, cleanActiveBandId } = useActiveBand({ currentUser, availableBands, epkConfig, isLoggedIn, setShowProfileWizardModal, setShowOnboardingModal });

  const { handleAddLeadWithLimitCheck, handleAddFanWithLimitCheck, planLimitModal, setPlanLimitModal } = usePlanLimitGuards({ leads, currentActiveBandPlan, handleAddLead, fans, handleAddFan });

  const { setIsMobileMenuOpen, setOpenNavGroupIds, setShowBandSwitcherModal, openGroupSheetId, isMobileMenuOpen, setOpenGroupSheetId, openNavGroupIds, handleChatLoadingChange, isFloatingChatOpen, setIsFloatingChatOpen, isChatLoading, showBandSwitcherModal } = useShellState();

  const { bandsCount, currentView, notificationPermission, notificationConfig, notificationHistory, notificationUnreadCount, requestNotificationPermission, markAllNotificationsAsRead, markNotificationAsRead, clearNotificationHistory, handleNavigate, bookingOptions, handleCrmSectionChange, updateNotificationConfig, triggerTestNotification, triggerTestNotificationSound } = useAppNavigation({ language, refreshTranslation, isLoggedIn, currentActiveBandPlan, isAdmin, setShowUserProfileModal, isPromoPlan, setIsMobileMenuOpen, setOpenNavGroupIds, leads, messages, currentActiveBandId });

  const { colors, currentTheme, handleThemeChange, currentFont, handleFontChange, showFontModal, setShowFontModal } = useAppTheme({ currentUser, refreshSession, fetchState });

  const { globalStudioSong, setGlobalStudioSong, setGlobalStudioOpenIris, globalStudioOpenIris, handleOpenStudio, handleOpenIris } = useGlobalStudio();

  const { navBadges, shouldGroupNav, toggleNavGroup, activeBandConcerts, activeBandRehearsals } = useNavState({ concerts, isSameBand, currentActiveBandId, currentActiveBandName, rehearsals, leads, bandsCount, currentActiveBandPlan, setOpenNavGroupIds });

  const { isMusicianRoute, isEpkRoute, isDealRoute, isFanRoute, isTfmRoute, verLogin, entrarDesdeLanding, isDirectLandingRoute, volverALanding } = useHashRoute({ isLoggedIn });

  const grupoActivo = findNavGroupIdForItem(currentView);

  return { grupoActivo, isMusicianRoute, isEpkRoute, isDealRoute, isFanRoute, currentActiveBandId, currentActiveBandName, currentActiveBandLogo, isTfmRoute, verLogin, entrarDesdeLanding, isDirectLandingRoute, isLoggedIn, handleLoginSuccess, volverALanding, currentView, colors, setShowBandSwitcherModal, syncStatus, setShowUserProfileModal, currentActiveBandPlan, notificationPermission, notificationConfig, notificationHistory, notificationUnreadCount, setShowNotificationSettingsModal, requestNotificationPermission, markAllNotificationsAsRead, markNotificationAsRead, clearNotificationHistory, handleNavigate, setShowOnboardingModal, isPromoPlan, activeCampaign, setShowCampaignModal, openGroupSheetId, isMobileMenuOpen, t, setOpenGroupSheetId, setIsMobileMenuOpen, isAdmin, navBadges, shouldGroupNav, openNavGroupIds, toggleNavGroup, leads, posts, currentUser, handleLogout, handleSetActiveCampaign, fetchState, isLoading, handleUpdateLead, handleAddLeadWithLimitCheck, metrics, concerts, rehearsals, handleAddRehearsal, bandUsers, availableBands, epkConfig, tours, fans, payments, handleDeleteLead, handleBulkDeleteLeads, handleUpdateEpkConfig, bookingOptions, handleCrmSectionChange, bandsCount, activeBandConcerts, handleDeleteBand, campaigns, handleUpdateRehearsal, handleUpdateConcert, handleDeleteRehearsal, handleDeleteConcert, handleAddConcert, activeBandRehearsals, handleAddPost, handleUpdatePost, currentTheme, handleAddFanWithLimitCheck, handleUpdateFan, handleDeleteFan, handleUpdateIncentive, handleAddMetric, handleUpdateMetric, handleDeleteMetric, handleSaveTour, handleDeleteTour, handleAddPayment, handleUpdatePayment, handleChatLoadingChange, showUserManagementModal, setShowUserManagementModal, showUserProfileModal, setCurrentUser, handleThemeChange, currentFont, handleFontChange, handleSetMainBand, setShowProfileWizardModal, showFontModal, setShowFontModal, isFloatingChatOpen, setIsFloatingChatOpen, isChatLoading, showBandSwitcherModal, handleSwitchBand, planLimitModal, setPlanLimitModal, showCampaignModal, handleSaveCampaign, handleDeleteCampaign, cleanActiveBandId, showOnboardingModal, showProfileWizardModal, showNotificationSettingsModal, updateNotificationConfig, triggerTestNotification, triggerTestNotificationSound, globalStudioSong, setGlobalStudioSong, setGlobalStudioOpenIris, globalStudioOpenIris, handleOpenStudio, handleOpenIris };
}
