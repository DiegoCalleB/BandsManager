import { AudioPreviewPlayer } from "./AudioPreviewPlayer";
import { FanIdentityHeader } from "./FanIdentityHeader";
import { SocialLinksTab } from "./SocialLinksTab";
/**
 * Logo, título y origen del concierto
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { InsigniaBandManager } from "../ui";
import { BookingContactSection } from "./BookingContactSection";
import { useFansLanding } from "./FansLandingContext";
import { LandingTabSwitcher } from "./LandingTabSwitcher";
import { MusiciansBanner } from "./MusiciansBanner";
import { SignupFormTab } from "./SignupFormTab";

/**
 * Logo, título y origen del concierto
 * @returns Sección de interfaz.
 */
export function FansLandingBody() {
  const { isPreview, resolvedBandId } = useFansLanding();
  return (
    <>
<div
        className={`max-w-md w-full bg-[var(--surface)] rounded-[var(--r-l)] ${isPreview ? "p-4 sm:p-6" : "p-6 sm:p-8"} space-y-6 relative overflow-hidden`}
      >
        <div className="absolute top-0 inset-x-0 h-1 bg-[var(--acc)]" />

        <FanIdentityHeader />

        <AudioPreviewPlayer />

        <LandingTabSwitcher />

        <SocialLinksTab />

        <SignupFormTab />

        <BookingContactSection />

        <MusiciansBanner />
        <InsigniaBandManager bandId={resolvedBandId} origen="fans" className="text-center" />
      </div>
    </>
  );
}
