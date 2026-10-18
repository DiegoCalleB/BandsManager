import { AppMainContent } from "./AppMainContent";
import { AppModalsHost } from "./AppModalsHost";
import { DesktopSidebar } from "./DesktopSidebar";
import { MobileBottomTabBar } from "./MobileBottomTabBar";
import { MobileDrawer } from "./MobileDrawer";
import { MobileGroupSheet } from "./MobileGroupSheet";
import { MobileTopBar } from "./MobileTopBar";
/**
 * Armazón de la aplicación interna: navegación lateral e inferior, cabecera, vista activa y modales.
 */
import { GlobalPlayer } from "../components/GlobalPlayer";
import { PlayerProvider } from "../context/PlayerContext";


import { useApp } from "./AppContext";

/**
 * Aplicación interna con sesión iniciada.
 * @returns El armazón completo con la vista activa.
 */
export function AppShell() {
  const { colors, handleOpenIris, handleOpenStudio,} = useApp();


  return (
    <PlayerProvider>
      <div
        className={`h-screen ${colors.bg} flex flex-col lg:flex-row transition-colors duration-300 font-sans w-full max-w-[100vw] overflow-hidden`}
      >
        {/* LEFT SIDEBAR */}
        <MobileTopBar />

        <MobileBottomTabBar />

        <MobileGroupSheet />

        {/* MOBILE SLIDE-OVER DRAWER */}
        <MobileDrawer />

        <DesktopSidebar />

        {/* Main Content Area */}
        <AppMainContent />

        <AppModalsHost />

        <GlobalPlayer
          colors={colors}
          onOpenStudio={handleOpenStudio}
          onOpenIris={handleOpenIris}
        />
      </div>
    </PlayerProvider>
  );
}
