/**
 * Modal de alta manual de un fan.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Plus,Users } from "lucide-react";
import { Button,Input,Select,Textarea } from "../ui";
import type { Fan } from "../../types";
import { useFansPanel } from "./FansPanelContext";

/**
 * Modal de alta manual de un fan.
 * @returns Sección de interfaz.
 */
export function FansAddModal() {
  const { showAddModal, setShowAddModal, handleManualAddSubmit, newNombre, setNewNombre, newEmail, setNewEmail, newCiudad, setNewCiudad, newOrigen, setNewOrigen, newNivel, setNewNivel, newInstagram, setNewInstagram, newCancionFavorita, setNewCancionFavorita, newMensaje, setNewMensaje } = useFansPanel();
  return (
    <>
{showAddModal && (
        <div className="fixed inset-0 bg-[var(--surface)]/80 z-50 flex items-center justify-center p-4">
          <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3">
              <h3 className="text-lg font-bold text-[var(--ink)] font-display flex items-center gap-2">
                <Users className="w-5 h-5 text-[var(--acc)]" />
                Registrar fan / seguidor manual
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                    Nombre *
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    required
                    placeholder="Nombre completo o alias"
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                    Email *
                  </label>
                  <Input
                    size="sm"
                    type="email"
                    required
                    placeholder="email@ejemplo.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                    Ciudad
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    placeholder="Ej: Madrid, Sevilla…"
                    value={newCiudad}
                    onChange={(e) => setNewCiudad(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                    Origen / canal
                  </label>
                  <Select size="sm" aria-label="Origen / canal"
                    value={newOrigen}
                    onChange={(e) => setNewOrigen(e.target.value)}
                    wrapperClassName="w-full"
                  >
                    <option value="Manual">Registro manual</option>
                    <option value="Concierto Directo">
                      Concierto / directo
                    </option>
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="Spotify">Spotify / Streaming</option>
                    <option value="Web Oficial">Web Oficial / QR</option>
                    <option value="Recomendación">Recomendación / Amigo</option>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                    Nivel Fan
                  </label>
                  <Select size="sm" aria-label="Nivel Fan"
                    value={newNivel}
                    onChange={(e) => setNewNivel(e.target.value as NonNullable<Fan["nivelFan"]>)}
                    wrapperClassName="w-full"
                  >
                    <option value="fiel">Oyente Fiel</option>
                    <option value="superfan">Superfan directos</option>
                    <option value="fundador">Fan Fundador</option>
                    <option value="backstage">Backstage VIP</option>
                  </Select>
                </div>
                <div>
                  <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                    Instagram (Opcional)
                  </label>
                  <Input
                    size="sm"
                    type="text"
                    placeholder="@usuario"
                    value={newInstagram}
                    onChange={(e) => setNewInstagram(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                  Canción favorita (opcional)
                </label>
                <Input
                  size="sm"
                  type="text"
                  placeholder="Ej: La Noche Entera, Balada…"
                  value={newCancionFavorita}
                  onChange={(e) => setNewCancionFavorita(e.target.value)}
                  className="w-full"
                />
              </div>

              <div>
                <label className="text-micro font-bold text-[var(--acc)] font-sans mb-1.5 block">
                  Mensaje / dedicatoria para el muro (opcional)
                </label>
                <Textarea
                  rows={2}
                  placeholder="Dedicatoria o saludo que aparecerá en el muro de la comunidad…"
                  value={newMensaje}
                  onChange={(e) => setNewMensaje(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <Button
                  variant="neutral"
                  type="button"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancelar
                </Button>
                <Button
                  variant="primary"
                  type="submit"
                  className="items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Guardar Fan
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
