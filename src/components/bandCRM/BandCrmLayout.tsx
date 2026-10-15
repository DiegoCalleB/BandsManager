/**
 * Maqueta del CRM de bandas: cabecera, vista de registradas o de aliadas y modales.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useBandCrm } from "./BandCrmContext";
import { BandCrmHeader } from "./BandCrmHeader";
import { BandCrmModalsHost } from "./BandCrmModalsHost";
import { BandsWorkspace } from "./BandsWorkspace";
import { RegisteredBandsView } from "./RegisteredBandsView";

/**
 * Maqueta del CRM de bandas: cabecera, vista de registradas o de aliadas y modales.
 * @returns Sección de interfaz.
 */
export function BandCrmLayout() {
  const { subTab } = useBandCrm();
  return (
    <>
<div className="w-full space-y-6">
      <BandCrmHeader />

      {/* TAB 2: REGISTERED BANDS VIEW (registro_bandas) */}
      {subTab === "registered_bands" ? <RegisteredBandsView /> : <BandsWorkspace />}

      <BandCrmModalsHost />
    </div>
    </>
  );
}
