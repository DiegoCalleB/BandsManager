/**
 * Pestaña de contactos clave del evento.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { MessageSquare,Phone,Trash2 } from "lucide-react";
import { Button,IconButton,Input,Select } from "../../ui";
import { ShowIcon } from "../../ui/ShowIcon";
import { useEventDetail } from "./EventDetailContext";

/**
 * Pestaña de contactos clave del evento.
 * @returns Sección de interfaz.
 */
export function KeyContactsTab() {
  const { modalActiveTab, textTitle, setShowAddContactForm, showAddContactForm, handleAddKeyContact, modalRoadbookKey, newContactNombre, setNewContactNombre, newContactRol, setNewContactRol, newContactTelefono, setNewContactTelefono, newContactEmail, setNewContactEmail, newContactNotas, setNewContactNotas, modalRoadbook, openWhatsAppContact, eventDateStr, selectedEventDetails, handleDeleteKeyContact } = useEventDetail();
  return (
    <>
{/* TAB 3: 2. CONTACTOS CLAVE */}
            {modalActiveTab === 'contactos' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-mono font-bold bg-[var(--ok)] text-[var(--on-ok)]">
                      Sección 2
                    </span>
                    <h3 className={`text-sm font-mono font-bold ${textTitle}`}>Directorio de contactos clave de producción</h3>
                  </div>
                  <Button
                    variant="primary"
                    size="xs"
                    type="button"
                    onClick={() => setShowAddContactForm(!showAddContactForm)}
                    className="items-center gap-1"
                  >
                    <span>+</span> Añadir contacto
                  </Button>
                </div>

                {/* Formulario de Nuevo Contacto */}
                {showAddContactForm && (
                  <form
                    onSubmit={(e) => handleAddKeyContact(modalRoadbookKey, e)}
                    className={`p-4 rounded-[var(--r-m)] space-y-3 animate-in fade-in ${
                      'bg-[var(--ok-soft)]'
                    }`}
                  >
                    <h4 className="text-xs font-mono font-bold text-[var(--ok)]">Nuevo contacto clave</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                      <div>
                        <label className="block text-micro font-mono font-bold text-[var(--ink-2)] mb-1">
                          Nombre y Apellidos *
                        </label>
                        <Input
                          size="sm"
                          type="text"
                          required
                          value={newContactNombre}
                          onChange={(e) => setNewContactNombre(e.target.value)}
                          placeholder="Ej: Manuel Producción"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-micro font-mono font-bold text-[var(--ink-2)] mb-1">Rol / Cargo</label>
                        <Select size="sm" aria-label="Rol / Cargo"
                          value={newContactRol}
                          onChange={(e) => setNewContactRol(e.target.value)}
                          wrapperClassName="w-full"
                        >
                          <option value="Promotor / Sala">Promotor / sala</option>
                          <option value="Técnico de Sonido (P.A.)">Técnico de sonido (P.A.)</option>
                          <option value="Técnico de Monitores">Técnico de monitores</option>
                          <option value="Técnico de Iluminación">Técnico de Iluminación</option>
                          <option value="Producción / Camerinos">Producción / Camerinos</option>
                          <option value="Hotel / Alojamiento">Hotel / Alojamiento</option>
                          <option value="Seguridad / Acceso">Seguridad / acceso</option>
                          <option value="Road Manager">Road Manager</option>
                        </Select>
                      </div>
                      <div>
                        <label className="block text-micro font-mono font-bold text-[var(--ink-2)] mb-1">
                          Teléfono (WhatsApp) *
                        </label>
                        <Input
                          size="sm"
                          type="tel"
                          required
                          value={newContactTelefono}
                          onChange={(e) => setNewContactTelefono(e.target.value)}
                          placeholder="+34 600 000 000"
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-micro font-mono font-bold text-[var(--ink-2)] mb-1">Email</label>
                        <Input
                          size="sm"
                          type="email"
                          value={newContactEmail}
                          onChange={(e) => setNewContactEmail(e.target.value)}
                          placeholder="produccion@sala.com"
                          className="w-full"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-micro font-mono font-bold text-[var(--ink-2)] mb-1">Notas u observaciones</label>
                      <Input
                        size="sm"
                        type="text"
                        value={newContactNotas}
                        onChange={(e) => setNewContactNotas(e.target.value)}
                        placeholder="Ej: Contacto para cobro de taquilla y apertura de puerta muelle"
                        className="w-full"
                      />
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <Button
                        variant="ghost"
                        size="xs"
                        type="button"
                        onClick={() => setShowAddContactForm(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        type="submit"
                      >
                        Guardar contacto
                      </Button>
                    </div>
                  </form>
                )}

                {/* Lista de Contactos */}
                <div className="space-y-2.5">
                  {(modalRoadbook.contactosClave || []).length === 0 ? (
                    <div className="text-center py-6 text-[var(--ink-2)] font-mono text-xs">
                      Sin contactos clave para este concierto.
                      <p className="text-micro mt-1 text-[var(--ok)]">
                        Pulsa en &ldquo;+ Añadir Contacto&rdquo; para registrar promotor, técnico de sonido o producción.
                      </p>
                    </div>
                  ) : (
                    (modalRoadbook.contactosClave || []).map((contact) => (
                      <div
                        key={contact.id}
                        className={`p-3.5 rounded-[var(--r-m)] transition-ui flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                          'bg-[var(--sunken)] hover:brightness-95'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-xs font-mono font-bold text-[var(--ink)]">{contact.nombre}</span>
                            <span className="px-2 py-0.5 rounded-[var(--r-s)] text-micro font-mono font-bold bg-[var(--ok)]/20 text-[var(--ink)]">
                              {contact.rol}
                            </span>
                          </div>
                          <p className="text-xs font-mono text-[var(--ink-2)]">
                            <ShowIcon inline emoji="📞" />{contact.telefono}
                            {contact.email && <span className="ml-2 text-[var(--ink-2)]"><ShowIcon inline emoji="✉️" />{contact.email}</span>}
                          </p>
                          {contact.notas && (
                            <p className="text-xs font-sans text-[var(--ink-2)] mt-1 italic">&ldquo;{contact.notas}&rdquo;</p>
                          )}
                        </div>

                        {/* Botones de acción rápida: WhatsApp directo, llamada, eliminar */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                          <Button
                            variant="primary"
                            size="xs"
                            type="button"
                            onClick={() => openWhatsAppContact(contact, eventDateStr, selectedEventDetails.lugar || 'la sala')}
                            className="items-center gap-1"
                            title="Abrir WhatsApp directo con mensaje predefinido"
                          >
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>WhatsApp</span>
                          </Button>
                          <a
                            href={`tel:${contact.telefono.replace(/\s+/g, '')}`}
                            className="px-2.5 py-1 rounded-[var(--r-m)] text-xs font-mono font-bold text-[var(--ok)] hover:bg-[var(--ok)]/10 flex items-center gap-1 transition-colors"
                            title="Llamar directamente por teléfono"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Llamar</span>
                          </a>
                          <IconButton
                            label="Eliminar este contacto"
                            variant="danger"
                            size="icon-xs"
                            type="button"
                            onClick={() => handleDeleteKeyContact(contact.id, modalRoadbookKey)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </IconButton>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
    </>
  );
}
