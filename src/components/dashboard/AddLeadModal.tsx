import React from "react";
import { LeadType } from "../../types";
import { Plus, X } from "lucide-react";
import { ModalPortal } from "../common/ModalPortal";
import { ShowIcon } from '../ui/ShowIcon';
import { Button, Input, Select, Textarea } from '../ui';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSubmit: (e: React.FormEvent) => void;
  newSala: string;
  setNewSala: (val: string) => void;
  newCiudad: string;
  setNewCiudad: (val: string) => void;
  newRegion: string;
  setNewRegion: (val: string) => void;
  newAforo: number;
  setNewAforo: (val: number) => void;
  newGenero: string;
  setNewGenero: (val: string) => void;
  newTipo: LeadType;
  setNewTipo: (val: LeadType) => void;
  newEmail: string;
  setNewEmail: (val: string) => void;
  newInstagram: string;
  setNewInstagram: (val: string) => void;
  newNotas: string;
  setNewNotas: (val: string) => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({
  isOpen,
  onClose,
  onAddSubmit,
  newSala,
  setNewSala,
  newCiudad,
  setNewCiudad,
  newRegion,
  setNewRegion,
  newAforo,
  setNewAforo,
  newGenero,
  setNewGenero,
  newTipo,
  setNewTipo,
  newEmail,
  setNewEmail,
  newInstagram,
  setNewInstagram,
  newNotas,
  setNewNotas,
}) => {
  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-[var(--scrim)]/70 z-[9999] flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
        <div className="bg-[var(--surface)] rounded-[var(--r-m)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 my-auto max-h-[90vh] overflow-y-auto">
          <div className="p-4 flex justify-between items-center bg-[var(--sunken)]">
            <h3 className="text-sm font-bold font-display text-[var(--ink)] flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Agregar nueva sala a la hoja
            </h3>
            <button
              onClick={onClose}
              className="text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form
            onSubmit={onAddSubmit}
            className="p-5 space-y-4 text-micro font-sans"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-micro font-sans text-[var(--ink-2)]">
                  Nombre de la sala*
                </label>
                <Input
                  size="sm"
                  id="new-lead-sala"
                  type="text"
                  required
                  value={newSala}
                  onChange={(e) => setNewSala(e.target.value)}
                  placeholder="Ej: Sala Apolo"
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-micro font-sans text-[var(--ink-2)]">
                  Ciudad*
                </label>
                <Input
                  size="sm"
                  id="new-lead-ciudad"
                  type="text"
                  required
                  value={newCiudad}
                  onChange={(e) => setNewCiudad(e.target.value)}
                  placeholder="Ej: Barcelona"
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-micro font-sans text-[var(--ink-2)]">
                  Región / provincia
                </label>
                <Input
                  size="sm"
                  id="new-lead-region"
                  type="text"
                  value={newRegion}
                  onChange={(e) => setNewRegion(e.target.value)}
                  placeholder="Ej: Cataluña"
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-micro font-sans text-[var(--ink-2)]">
                  Aforo estimado (Pax)
                </label>
                <Input
                  size="sm"
                  id="new-lead-aforo"
                  type="number"
                  value={newAforo}
                  onChange={(e) => setNewAforo(Number(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-micro font-sans text-[var(--ink-2)]">
                  Género musical preferente
                </label>
                <Input
                  size="sm"
                  id="new-lead-genero"
                  type="text"
                  value={newGenero}
                  onChange={(e) => setNewGenero(e.target.value)}
                  className="w-full"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-micro font-sans text-[var(--ink-2)]">
                  Categoría de contacto
                </label>
                <Select
                  size="sm"
                  id="new-lead-tipo"
                  value={newTipo}
                  onChange={(e) => setNewTipo(e.target.value as LeadType)}
                  wrapperClassName="w-full"
                >
                  <option value="sala">
                    Sala / teatro (booking directo)
                  </option>
                  <option value="festival">
                    Festival (Escenarios / carteles)
                  </option>
                  <option value="ayuntamiento">
                    Ayuntamiento / fiestas patronales
                  </option>
                  <option value="grupo">
                    Grupo / artista (Colaboración)
                  </option>
                  <option value="productora">
                    Productora / agencia management
                  </option>
                  <option value="medio">
                    Medio de comunicación (Radio 3 / prensa / TV)
                  </option>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-micro font-sans text-[var(--ink-2)]">
                  Usuario de Instagram (@)
                </label>
                <Input
                  size="sm"
                  id="new-lead-instagram"
                  type="text"
                  value={newInstagram}
                  onChange={(e) => setNewInstagram(e.target.value)}
                  placeholder="Ej: @sala_apolo"
                  className="w-full"
                />
              </div>
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="block text-micro font-sans text-[var(--ink-2)]">
                Email de contacto (opcional, sino scout lo buscará)
              </label>
              <Input
                size="sm"
                id="new-lead-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Ej: booking@salaapolo.com"
                className="w-full"
              />
            </div>

            <div className="space-y-1.5 col-span-2">
              <label className="block text-micro font-sans text-[var(--ink-2)]">
                Notas iniciales
              </label>
              <Textarea
                id="new-lead-notes"
                rows={3}
                value={newNotas}
                onChange={(e) => setNewNotas(e.target.value)}
                placeholder="Alguna instrucción de booking, contacto recomendado…"
                className="w-full"
              />
            </div>

            <div className="flex gap-3 justify-end pt-3">
              <Button
                variant="neutral"
                size="xs"
                id="btn-add-cancel"
                type="button"
                onClick={onClose}
                
              >
                Cancelar
              </Button>
              <Button
                variant="neutral"
                size="xs"
                id="btn-add-submit"
                type="submit"
                
              >
                Confirmar registro
              </Button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
};
