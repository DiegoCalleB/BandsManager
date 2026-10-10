/**
 * Pestaña de control de merchandising por bolo.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { useEventDetail } from "./EventDetailContext";
import { MerchAddForm } from "./merch/MerchAddForm";
import { MerchCashPanel } from "./merch/MerchCashPanel";
import { MerchHeader } from "./merch/MerchHeader";
import { MerchItemsTable } from "./merch/MerchItemsTable";
import { MerchKpiGrid } from "./merch/MerchKpiGrid";

/**
 * Pestaña de control de merchandising por bolo.
 * @returns Sección de interfaz.
 */
export function MerchandisingTab() {
  const { modalActiveTab } = useEventDetail();
  if (modalActiveTab !== "merchan") return null;
  return (
    <div className="space-y-4">
      <MerchHeader />
      <MerchKpiGrid />
      <MerchAddForm />
      <MerchItemsTable />
      <MerchCashPanel />
    </div>
  );
}
