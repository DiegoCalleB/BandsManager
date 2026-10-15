/**
 * Botón flotante móvil para crear un contacto sin fricción.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Plus } from "lucide-react";
import { useBookingCrm } from "./BookingCrmContext";

/**
 * Botón flotante móvil para crear un contacto sin fricción.
 * @returns Sección de interfaz.
 */
export function MobileCreateFab() {
  const { setNewLeadData, sectionTab, setIsAddingLeadModalOpen } = useBookingCrm();
  return (
    <>
      {/* MOBILE FLOATING ACTION BUTTON (FAB) FOR ZERO-FRICTION CREATION */}
      <button data-raw
      id="mobile-fab-add-lead"
      type="button"
      onClick={() => {
      setNewLeadData({
        nombre_sala: '',
        ciudad: '',
        region: 'Nacional',
        direccion: '',
        aforo: 0,
        tipo: sectionTab === 'medios' ? 'medio' : sectionTab === 'grupos' ? 'productora' : 'sala',
        email_contacto: '',
        email_secundario: '',
        telefono: '',
        telefono_movil: '',
        telefono_fijo: '',
        website: '',
        instagram: '',
        fuente: '',
        genero: sectionTab === 'medios' ? 'Radio' : sectionTab === 'grupos' ? 'Management / Booking' : 'Variado',
        notas: '',
        pitch_generado: '',
        icono: sectionTab === 'medios' ? '📻' : sectionTab === 'grupos' ? '💼' : '🏛️',
        imagen_url: '',
      });
      setIsAddingLeadModalOpen(true);
      }}
      className="sm:hidden fixed bottom-36 right-5 z-40 flex items-center justify-center w-14 h-14 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] active:scale-[0.97] transition-ui cursor-pointer"
      style={{ animationDuration: '3s' }}
      title="Añadir contacto"
      >
      <Plus className="w-6 h-6 stroke-[3]" />
      </button>
    </>
  );
}
