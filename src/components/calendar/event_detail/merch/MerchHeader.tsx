/**
 * Cabecera del control de merchandising: título, resumen copiable, alta de artículo y aviso de copiado.
 * Extraído de MerchandisingTab (Strangler Fig) para respetar AGENTS.md §5.6.
 */
import { motion } from "framer-motion";
import { Check,CheckCircle2,Copy,Plus } from "lucide-react";
import { Button } from "../../../ui";
import { useEventDetail } from "../EventDetailContext";

/**
 * Cabecera del control de merchandising: título, resumen copiable, alta de artículo y aviso de copiado.
 * @returns Sección de interfaz.
 */
export function MerchHeader() {
  const { handleCopyMerchSummary, merchCopiedToast, modalRoadbook, modalRoadbookKey, selectedConcert, setShowAddMerchForm, showAddMerchForm, textSub, textTitle } = useEventDetail();
  return (
    <>
      {/* Cabecera de la Sección de Merchan */}
      <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-mono font-bold bg-[var(--acc)] text-[var(--on-acc)]">
            Sección 3
          </span>
          <div>
            <h3 className={`text-sm font-mono font-bold ${textTitle}`}>Control de merchandising por bolo</h3>
            <p className={`text-xs font-mono ${textSub}`}>
              Inventario que sube a la furgoneta vs. stock final de noche, arqueo de Efectivo y Bizum
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="neutral"
            size="xs"
            type="button"
            onClick={() => handleCopyMerchSummary(modalRoadbook, modalRoadbookKey, selectedConcert)}
            className="items-center gap-1"
            title="Copiar arqueo y balance para WhatsApp"
          >
            {merchCopiedToast ? <Check className="w-3.5 h-3.5 text-[var(--ok)]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{merchCopiedToast ? '¡Copiado!' : 'Copiar Arqueo (WhatsApp)'}</span>
          </Button>
          <Button
            variant="primary"
            size="xs"
            type="button"
            onClick={() => setShowAddMerchForm(!showAddMerchForm)}
            className="items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddMerchForm ? 'Cerrar' : '+ Añadir Producto'}</span>
          </Button>
        </div>
      </div>

      {/* Toast de copiado */}
      {merchCopiedToast && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-2.5 rounded-[var(--r-m)] bg-[var(--ok)]/20 text-[var(--ink)] text-xs font-mono flex items-center gap-2"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[var(--ok)]" />
          <span>¡Resumen de arqueo y ventas copiado al portapapeles con formato WhatsApp para el grupo de la banda!</span>
        </motion.div>
      )}

    </>
  );
}
