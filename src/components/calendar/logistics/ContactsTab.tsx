/**
 * d
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { MessageCircle,Phone,Plus,Users } from "lucide-react";
import { getWhatsAppUrl,openWhatsAppChat,WHATSAPP_WINDOW_NAME } from "../../../utils/whatsapp";
import { useCalendar } from "../CalendarContext";

/**
 * d
 * @returns Sección de interfaz.
 */
export function ContactsTab() {
  const { getCurrentRoadbook, selectedDateKey, selectedConcert, setModalActiveTab, setShowEventFichaModal, textMuted } = useCalendar();
  return (
    <>
      <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1 text-micro">
        {(() => {
          const currentRb = getCurrentRoadbook(selectedDateKey, selectedConcert);
          const contacts = currentRb.contactosClave || [];
          return (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-[var(--ok)] text-micro flex items-center gap-1">
                  <Users className="w-3 h-3" /> 2. Contactos Clave ({contacts.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setModalActiveTab('contactos');
                    setShowEventFichaModal(true);
                  }}
                  className="text-micro underline text-[var(--ok)] hover:text-[var(--ok)] font-mono cursor-pointer"
                >
                  + Gestionar →
                </button>
              </div>
              {contacts.length === 0 ? (
                <p className={`text-micro italic text-center py-3 ${textMuted}`}>Sin contactos clave: apunta quién abre la sala.</p>
              ) : (
                <div className="space-y-1.5">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      className={`p-2 rounded-[var(--r-m)] flex items-center justify-between gap-2 ${'bg-[var(--sunken)] '}`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate text-micro">{c.nombre}</div>
                        <div className="text-micro text-[var(--ink-2)] font-mono flex items-center gap-1">
                          <span className="px-1 py-0.2 rounded bg-[var(--ok)]/10 text-[var(--ok)] text-micro">{c.rol}</span>
                          <span>{c.telefono}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {c.telefono && (
                          <>
                            <a
                              href={getWhatsAppUrl(c.telefono)}
                              target={WHATSAPP_WINDOW_NAME}
                              onClick={(e) => {
                                e.preventDefault();
                                openWhatsAppChat(c.telefono);
                              }}
                              className="p-1 rounded bg-[var(--ok)]/20 text-[var(--ink)] hover:bg-[var(--ok)]/30"
                              title="WhatsApp"
                            >
                              <MessageCircle className="w-3 h-3" />
                            </a>
                            <a
                              href={`tel:${c.telefono}`}
                              className="p-1 rounded bg-[var(--acc)]/20 text-[var(--ink)] hover:bg-[var(--acc)]/30"
                              title="Llamar"
                            >
                              <Phone className="w-3 h-3" />
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setModalActiveTab('contactos');
                  setShowEventFichaModal(true);
                }}
                className="w-full py-1.5 px-2 rounded-[var(--r-m)] text-micro font-mono font-bold bg-[var(--ok)]/20 text-[var(--ink)] hover:bg-[var(--ok)]/30 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Plus className="w-3 h-3" />
                <span>Añadir contactos clave</span>
              </button>
            </div>
          );
        })()}
      </div>
    </>
  );
}
