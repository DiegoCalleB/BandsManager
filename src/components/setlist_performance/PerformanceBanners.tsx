/**
 * Avisos de notas del tema y del modo avión.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Plane } from "lucide-react";
import { useSetlistPerformance } from "./SetlistPerformanceContext";

/**
 * Avisos de notas del tema y del modo avión.
 * @returns Sección de interfaz.
 */
export function PerformanceBanners() {
  const { isBlock, showNotes, notes, showFlightModeInfo } = useSetlistPerformance();
  return (
    <>
{/* NOTES BANNER — cosas como"cambio de afinación","entra el segundo cantante", que un
 músico necesita ver ANTES de tocar el tema, no descubrirlas a mitad. */}
      {!isBlock && showNotes && notes && (
  <div className="shrink-0 bg-[var(--acc-soft)]  px-4 py-2.5 text-sm text-[var(--acc)] whitespace-pre-wrap z-20">
    {notes}
  </div>
      )}

      {/* Una web no puede activar el modo avión del dispositivo — ninguna app sin permisos de
 sistema puede tocar la radio del móvil, por seguridad. Esto es honesto sobre esa
 limitación en vez de fingir un botón que no haría nada. */}
      {showFlightModeInfo && (
  <div className="shrink-0 bg-[var(--bg)]/90 px-4 py-2.5 text-sm text-[var(--tentative)] z-20 flex items-start gap-2">
    <Plane className="w-4 h-4 shrink-0 mt-0.5" />
    <p>
      No hay forma de activar el modo avión desde aquí — ninguna web (ni
      casi ninguna app) puede tocar la conectividad del móvil, es una
      restricción de seguridad del propio sistema. Actívalo tú a mano
      antes de subir al escenario: la app ya funciona sin conexión una vez
      cargado el repertorio, así que no pasa nada por quedarte sin señal.
    </p>
  </div>
      )}
    </>
  );
}
