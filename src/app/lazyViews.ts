/**
 * Vistas y modales cargados bajo demanda, con reintento si falla la carga del módulo.
 */
import React,{ lazy } from "react";

// Vistas grandes cargadas bajo demanda: sin esto, visitar /unete o abrir cualquier pestaña
// metía en el mismo bundle inicial el CRM, calendario, reels, repertorio, etc. — un fan que
// solo quiere donar por Revolut/PayPal pagaba el peso entero de todo el panel interno.
/**
 * Carga diferida con un reintento si falla la importación dinámica; si vuelve a fallar, recarga
 * la página una vez cada 10 s (típico tras un despliegue que cambia los nombres de los chunks).
 */
export function safeLazy<T extends React.ComponentType<never>>(factory: () => Promise<{ default: T }>) {
  return lazy(async () => {
    try {
      return await factory();
    } catch (err: unknown) {
      console.warn("Retrying dynamic module load after error:", err);
      await new Promise((resolve) => setTimeout(resolve, 200));
      try {
        return await factory();
      } catch (retryErr: unknown) {
        const key = "last_dynamic_import_reload";
        const last = Number(sessionStorage.getItem(key) || 0);
        if (Date.now() - last > 10000 && typeof window !== "undefined") {
          sessionStorage.setItem(key, String(Date.now()));
          window.location.reload();
          return new Promise<never>(() => {});
        }
        throw retryErr;
      }
    }
  });
}

export const BookingCRM = safeLazy(() => import("../components/BookingCRM"));

export const BandCRM = safeLazy(() => import("../components/BandCRM"));

export const CalendarView = safeLazy(() => import("../components/CalendarView"));

export const ReelsCenter = safeLazy(() => import("../components/ReelsCenter"));

export const Finanzas = safeLazy(() => import("../components/Finanzas"));

export const TourManager = safeLazy(() => import("../components/TourManager"));

export const RepertorioSetlists = safeLazy(
  () => import("../components/RepertorioSetlists"),
);

export const Merchan = safeLazy(() => import("../components/Merchan"));

export const Chatbot = safeLazy(() => import("../components/Chatbot"));

export const EPKManager = safeLazy(() => import("../components/EPKManager"));

export const EnsayosManager = safeLazy(() =>
  import("../components/ensayos/EnsayosManager").then((m) => ({
    default: m.EnsayosManager,
  })),
);

export const FansPanel = safeLazy(() => import("../components/FansPanel"));

export const FansLanding = safeLazy(() => import("../components/FansLanding"));

export const PublicMusiciansLanding = safeLazy(() =>
  import("../components/PublicMusiciansLanding").then((m) => ({
    default: m.PublicMusiciansLanding,
  })),
);

export const PublicEPK = safeLazy(() =>
  import("../components/PublicEPK").then((m) => ({ default: m.PublicEPK })),
);

export const PublicDealView = safeLazy(() =>
  import("../pages/PublicDealView").then((m) => ({ default: m.PublicDealView })),
);

export const Planes = safeLazy(() => import("../components/Planes"));


export const PublicLanding = safeLazy(() =>
  import("../components/PublicLanding").then((m) => ({ default: m.PublicLanding })),
);

export const PublicTfmLanding = safeLazy(() =>
  import("../components/PublicTfmLanding").then((m) => ({ default: m.PublicTfmLanding })),
);

export const LoginModal = safeLazy(() =>
  import("../components/LoginModal").then((m) => ({ default: m.LoginModal })),
);

export const SimplePromoLoginModal = safeLazy(() =>
  import("../components/SimplePromoLoginModal").then((m) => ({
    default: m.SimplePromoLoginModal,
  })),
);

export const UserManagementModal = safeLazy(() =>
  import("../components/UserManagementModal").then((m) => ({
    default: m.UserManagementModal,
  })),
);

export const UserProfileModal = safeLazy(() =>
  import("../components/UserProfileModal").then((m) => ({
    default: m.UserProfileModal,
  })),
);

export const FontSelectorModal = safeLazy(() =>
  import("../components/FontSelectorModal").then((m) => ({
    default: m.FontSelectorModal,
  })),
);

export const BandSwitcherModal = safeLazy(() =>
  import("../components/BandSwitcherModal").then((m) => ({
    default: m.BandSwitcherModal,
  })),
);

export const PlanLimitModal = safeLazy(() =>
  import("../components/PlanLimitModal").then((m) => ({
    default: m.PlanLimitModal,
  })),
);

export const CampaignManagerModal = safeLazy(() =>
  import("../components/campaign/CampaignManagerModal").then((m) => ({
    default: m.CampaignManagerModal,
  })),
);

export const SongStudioModal = safeLazy(() => import("../components/SongStudioModal"));


export const MusicianOnboardingModal = safeLazy(() =>
  import("../components/onboarding/MusicianOnboardingModal").then((m) => ({
    default: m.MusicianOnboardingModal,
  })),
);

export const OnboardingWizardModal = safeLazy(() =>
  import("../components/onboarding/OnboardingWizardModal").then((m) => ({
    default: m.OnboardingWizardModal,
  })),
);

export const NotificationSettingsModal = safeLazy(() =>
  import("../components/notifications/NotificationSettingsModal").then((m) => ({
    default: m.NotificationSettingsModal,
  })),
);
