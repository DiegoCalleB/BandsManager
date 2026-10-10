/**
 * Navegación por pestañas de la ficha.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Phone,ShieldCheck,Shirt,Users,Wrench } from "lucide-react";
import { Button } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useEventDetail } from "./EventDetailContext";

/**
 * Navegación por pestañas de la ficha.
 * @returns Sección de interfaz.
 */
export function EventTabsNav() {
  const { modalActiveTab, setModalActiveTab, modalRoadbook, selectedConcert } = useEventDetail();
  return (
    <>
{/* Pestañas de Navegación de la Ficha */}
            <div
              className={`flex items-center gap-1.5 pb-2.5 overflow-x-auto shrink-0 ${''}`}
            >
              <Button
                variant={modalActiveTab === 'resumen' ? "inverse" : "neutral"}
                size="xs"
                type="button"
                onClick={() => setModalActiveTab('resumen')}
                className="shrink-0 items-center gap-1.5"
              >
                <span><ShowIcon inline emoji="📋" />Resumen y info</span>
              </Button>
              <Button
                variant={modalActiveTab === 'tecnica' ? "inverse" : "neutral"}
                size="xs"
                type="button"
                onClick={() => setModalActiveTab('tecnica')}
                className="shrink-0 items-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>1. Logística técnica</span>
              </Button>
              <Button
                variant={modalActiveTab === 'contactos' ? "inverse" : "neutral"}
                size="xs"
                type="button"
                onClick={() => setModalActiveTab('contactos')}
                className="shrink-0 items-center gap-1.5"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>2. Contactos clave</span>
                {modalRoadbook.contactosClave && modalRoadbook.contactosClave.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] text-micro bg-[var(--surface)] font-mono">
                    {modalRoadbook.contactosClave.length}
                  </span>
                )}
              </Button>
              <Button
                variant={modalActiveTab === 'merchan' ? "inverse" : "neutral"}
                size="xs"
                type="button"
                onClick={() => setModalActiveTab('merchan')}
                className="shrink-0 items-center gap-1.5"
              >
                <Shirt className="w-3.5 h-3.5" />
                <span>3. Control Merchandising</span>
                {modalRoadbook.merchControl && modalRoadbook.merchControl.items && modalRoadbook.merchControl.items.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] text-micro bg-[var(--surface)] font-mono">
                    {modalRoadbook.merchControl.items.length}
                  </span>
                )}
              </Button>
              <Button
                variant={modalActiveTab === 'postshow' ? "inverse" : "neutral"}
                size="xs"
                type="button"
                onClick={() => setModalActiveTab('postshow')}
                className="shrink-0 items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>4. Público y Post-Show</span>
                {selectedConcert?.es_hito_destacado && (
                  <span className="px-1.5 py-0.2 rounded-[var(--r-pill)] text-micro bg-[var(--acc)] text-[var(--on-acc)] font-bold"><ShowIcon inline emoji="⭐" />Hito</span>
                )}
              </Button>
              <Button
                variant={modalActiveTab === 'cierre' ? "inverse" : "neutral"}
                size="xs"
                type="button"
                onClick={() => setModalActiveTab('cierre')}
                className="shrink-0 items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>5. Cierre material</span>
                {modalRoadbook.cierreMaterial && modalRoadbook.cierreMaterial.length > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-[var(--r-pill)] text-micro font-mono ${
                      modalRoadbook.cierreMaterial.every((i) => i.checked) ? 'bg-[var(--ok)] text-[var(--on-ok)] font-bold' : 'bg-[var(--surface)]'
                    }`}
                  >
                    {modalRoadbook.cierreMaterial.filter((i) => i.checked).length}/{modalRoadbook.cierreMaterial.length}
                  </span>
                )}
              </Button>
            </div>
    </>
  );
}
