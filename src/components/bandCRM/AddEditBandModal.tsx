import React from 'react';
import { Music, X, Sparkles, Loader2, Upload, Check } from 'lucide-react';
import { BandRelationshipStatus, BandContact } from '../../types';
import { ShowIcon } from '../ui/ShowIcon';
import { Button, Input, Select, Textarea } from '../ui';

export interface AddEditBandModalProps {
  isOpen: boolean;
  onClose: () => void;
  isStitchLight: boolean;
  editingBand: BandContact | null;
  handleSaveBand: (e: React.FormEvent) => void;
  formName: string;
  setFormName: (val: string) => void;
  formStyle: string;
  setFormStyle: (val: string) => void;
  formLocation: string;
  setFormLocation: (val: string) => void;
  formStatus: BandRelationshipStatus;
  setFormStatus: (val: BandRelationshipStatus) => void;
  formLastContact: string;
  setFormLastContact: (val: string) => void;
  formContactName: string;
  setFormContactName: (val: string) => void;
  formEmail: string;
  setFormEmail: (val: string) => void;
  formPhone: string;
  setFormPhone: (val: string) => void;
  formInstagram: string;
  setFormInstagram: (val: string) => void;
  formSpotifyYoutube: string;
  setFormSpotifyYoutube: (val: string) => void;
  formAforo: number;
  setFormAforo: (val: number) => void;
  formNotes: string;
  setFormNotes: (val: string | ((prev: string) => string)) => void;
  formIcon: string;
  setFormIcon: (val: string) => void;
  formImageUrl: string;
  setFormImageUrl: (val: string) => void;
  handleAiLookup: () => void;
  isAiSearching: boolean;
  aiProposal: any | null;
  setAiProposal: (val: any) => void;
  aiError: string | null;
  setAiError: (val: string | null) => void;
  handleApplyAllAiData: () => void;
  handleLogoUpload: (file: File) => void;
  isUploadingLogo: boolean;
}

export const AddEditBandModal: React.FC<AddEditBandModalProps> = ({
  isOpen,
  onClose,
  isStitchLight,
  editingBand,
  handleSaveBand,
  formName,
  setFormName,
  formStyle,
  setFormStyle,
  formLocation,
  setFormLocation,
  formStatus,
  setFormStatus,
  formLastContact,
  setFormLastContact,
  formContactName,
  setFormContactName,
  formEmail,
  setFormEmail,
  formPhone,
  setFormPhone,
  formInstagram,
  setFormInstagram,
  formSpotifyYoutube,
  setFormSpotifyYoutube,
  formAforo,
  setFormAforo,
  formNotes,
  setFormNotes,
  formIcon,
  setFormIcon,
  formImageUrl,
  setFormImageUrl,
  handleAiLookup,
  isAiSearching,
  handleLogoUpload,
  isUploadingLogo,
  aiProposal,
  setAiProposal,
  aiError,
  setAiError,
  handleApplyAllAiData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-[var(--scrim)]/85 flex items-center justify-center p-4 z-[9999]">
      <div
        className={`w-full max-w-2xl rounded-[var(--r-l)] p-6 space-y-5 relative overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${
          'bg-[var(--surface)] text-[var(--ink)]'
        }`}
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[var(--acc)]" />
            <h3 className="text-base font-bold font-display">
              {editingBand ? `Editar Banda: ${editingBand.nombre_banda}` : 'Añadir Nueva Banda al CRM'}
            </h3>
          </div>
          <button onClick={() => onClose()} className="p-1 hover:bg-[var(--sunken)] rounded-[var(--r-pill)] transition-colors">
            <X className="w-5 h-5 text-[var(--ink-2)]" />
          </button>
        </div>

        <form onSubmit={handleSaveBand} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre de la Banda */}
            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-micro font-mono text-[var(--ink-2)]">Nombre de la banda / artista *</label>
                <button
                  type="button"
                  onClick={handleAiLookup}
                  disabled={isAiSearching || !formName.trim()}
                  className="flex items-center gap-1.5 text-micro font-mono font-bold px-2.5 py-1 rounded-[var(--r-pill)] bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc-ink)] transition-ui disabled:opacity-50 cursor-pointer"
                >
                  {isAiSearching ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-[var(--acc)]" />
                      <span>Buscando en la Web…</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-[var(--acc)]" />
                      <span>Buscar con IA (Autorellenar)</span>
                    </>
                  )}
                </button>
              </div>
              <Input
                size="sm"
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Pardiez, La Señora Tomasa, Tarraco Ska…"
                className="w-full"
              />
            </div>

            {/* AI Proposal Overlay / Card */}
            {isAiSearching && (
              <div className="md:col-span-2 p-3 bg-[var(--sunken)]/90 rounded-[var(--r-m)] flex items-center gap-3 text-xs text-[var(--acc-ink)] font-mono">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--acc)]" />
                <span>Buscando datos de "{formName}" con IA en la web…</span>
              </div>
            )}

            {aiError && (
              <div className="md:col-span-2 p-3 bg-[var(--alert)]/40 rounded-[var(--r-m)] flex items-center justify-between text-xs text-[var(--ink)] font-mono">
                <span><ShowIcon inline emoji="⚠️" />{aiError}</span>
                <button type="button" onClick={() => setAiError(null)} className="p-1 hover:bg-[var(--alert)]/50 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {aiProposal && (
              <div className="md:col-span-2 p-3.5 bg-[var(--sunken)] rounded-[var(--r-m)] space-y-3 text-xs font-mono bg-[var(--acc)]/10">
                <div className="flex items-center justify-between border-b border-[var(--hair)] pb-2">
                  <div className="flex items-center gap-1.5 text-[var(--acc)] font-bold">
                    <span>Propuesta de la IA (Revisa antes de confirmar):</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="primary"
                      size="xs"
                      type="button"
                      onClick={handleApplyAllAiData}
                      className="items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aplicar todo</span>
                    </Button>
                    <button
                      type="button"
                      onClick={() => setAiProposal(null)}
                      className="p-1 hover:bg-[var(--surface)] text-[var(--ink-2)] rounded-[var(--r-pill)] transition-colors cursor-pointer"
                      title="Descartar propuesta"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[var(--ink-2)]">
                  {aiProposal.estilo_musical && (
                    <div className="flex items-center justify-between bg-[var(--sunken)]/70 p-2 rounded-[var(--r-m)] ">
                      <div className="truncate pr-2">
                        <span className="text-[var(--ink-2)] font-bold">Estilo:</span> {aiProposal.estilo_musical}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormStyle(aiProposal.estilo_musical)}
                        className="text-micro font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {aiProposal.localizacion && (
                    <div className="flex items-center justify-between bg-[var(--sunken)]/70 p-2 rounded-[var(--r-m)] ">
                      <div className="truncate pr-2">
                        <span className="text-[var(--ink-2)] font-bold">Origen:</span> {aiProposal.localizacion}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormLocation(aiProposal.localizacion)}
                        className="text-micro font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {aiProposal.contacto_nombre && (
                    <div className="flex items-center justify-between bg-[var(--sunken)]/70 p-2 rounded-[var(--r-m)] ">
                      <div className="truncate pr-2">
                        <span className="text-[var(--ink-2)] font-bold">Contacto:</span> {aiProposal.contacto_nombre}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormContactName(aiProposal.contacto_nombre)}
                        className="text-micro font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {aiProposal.email && (
                    <div className="flex items-center justify-between bg-[var(--sunken)]/70 p-2 rounded-[var(--r-m)] ">
                      <div className="truncate pr-2">
                        <span className="text-[var(--ink-2)] font-bold">Email:</span> {aiProposal.email}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormEmail(aiProposal.email)}
                        className="text-micro font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {aiProposal.telefono && (
                    <div className="flex items-center justify-between bg-[var(--sunken)]/70 p-2 rounded-[var(--r-m)] ">
                      <div className="truncate pr-2">
                        <span className="text-[var(--ink-2)] font-bold">Tel:</span> {aiProposal.telefono}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormPhone(aiProposal.telefono)}
                        className="text-micro font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {aiProposal.instagram && (
                    <div className="flex items-center justify-between bg-[var(--sunken)]/70 p-2 rounded-[var(--r-m)] ">
                      <div className="truncate pr-2">
                        <span className="text-[var(--ink-2)] font-bold">Instagram:</span> {aiProposal.instagram}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormInstagram(aiProposal.instagram)}
                        className="text-micro font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {(aiProposal.spotify_url || aiProposal.youtube_url) && (
                    <div className="flex items-center justify-between bg-[var(--sunken)]/70 p-2 rounded-[var(--r-m)] sm:col-span-2">
                      <div className="truncate max-w-[80%]">
                        <span className="text-[var(--ink-2)] font-bold">Música / Media:</span> {aiProposal.spotify_url || aiProposal.youtube_url}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormSpotifyYoutube(aiProposal.spotify_url || aiProposal.youtube_url)}
                        className="text-micro font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {aiProposal.biografia && (
                    <div className="bg-[var(--sunken)]/70 p-2 rounded-[var(--r-m)] sm:col-span-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[var(--ink-2)] font-bold">Resumen / Bio:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormNotes((prev) => (prev ? `${prev}\n\n[Bio IA]: ${aiProposal.biografia}` : aiProposal.biografia))
                          }
                          className="text-micro font-bold text-[var(--acc)] hover:underline cursor-pointer shrink-0"
                        >
                          Añadir a notas
                        </button>
                      </div>
                      <p className="text-micro text-[var(--ink-2)] italic leading-relaxed">{aiProposal.biografia}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Icono o Imagen / Logo de la Banda */}
            <div className="space-y-2 sm:col-span-2 p-3 bg-[var(--sunken)]/60 rounded-[var(--r-m)] ">
              <label className="block text-micro font-mono text-[var(--acc)] font-bold">Icono o logo / foto de la banda</label>

              <div className="flex flex-wrap items-center gap-3">
                {/* Preview current avatar */}
                <div className="w-10 h-10 rounded-[var(--r-pill)] bg-[var(--sunken)] flex items-center justify-center overflow-hidden shrink-0">
                  {formImageUrl ? (
                    <img src={formImageUrl} alt="Logo banda" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{formIcon || '🎸'}</span>
                  )}
                </div>

                {/* Emoji preset selection */}
                <div className="flex-1 space-y-1">
                  <span className="text-micro text-[var(--ink-2)] block font-mono">Seleccionar icono emoji:</span>
                  <div className="flex flex-wrap gap-1">
                    {['🎸', '🎹', '🥁', '🎤', '🎷', '🎺', '🎧', '🪕', '🎻', '⚡', '🔥', '🌟', '🎶'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setFormIcon(emoji);
                        }}
                        className={`w-7 h-7 rounded-[var(--r-m)] text-sm flex items-center justify-center transition-ui cursor-pointer ${
                          formIcon === emoji && !formImageUrl
                            ? 'bg-[var(--acc)]/20 text-[var(--ink)] scale-110'
                            : 'bg-[var(--sunken)] hover:bg-[var(--surface)] text-[var(--ink-2)]'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload file button */}
                <div className="shrink-0 space-y-1">
                  <span className="text-micro text-[var(--ink-2)] block font-mono">O subir un logo:</span>
                  <label className="cursor-pointer px-2.5 py-1.5 bg-[var(--sunken)] hover:bg-[var(--surface)] rounded-[var(--r-m)] text-micro font-mono text-[var(--ink-2)] flex items-center gap-1.5 transition-ui active:scale-[0.97]">
                    {isUploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[var(--acc)]" />
                    )}
                    <span>{isUploadingLogo ? 'Subiendo...' : 'Subir Imagen'}</span>
                    <input aria-label="Icono o logo / foto de la banda"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleLogoUpload(file);
                      }}
                    />
                  </label>
                  {formImageUrl && (
                    <button
                      type="button"
                      onClick={() => setFormImageUrl('')}
                      className="text-micro text-[var(--alert)] hover:underline block text-center"
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Estilo Musical */}
            <div className="space-y-1">
              <label className="block text-micro font-mono text-[var(--ink-2)]">Estilo musical *</label>
              <Input
                size="sm"
                type="text"
                required
                value={formStyle}
                onChange={(e) => setFormStyle(e.target.value)}
                placeholder="Ej: Balkan Ska, Reggae, Punk, Mestizaje…"
                className="w-full"
              />
            </div>

            {/* Localización / Ciudad */}
            <div className="space-y-1">
              <label className="block text-micro font-mono text-[var(--ink-2)]">Localización / ciudad principal *</label>
              <Input
                size="sm"
                type="text"
                required
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="Ej: Barcelona, Madrid, Valencia, Sevilla…"
                className="w-full"
              />
            </div>

            {/* Estado de la Relación */}
            <div className="space-y-1">
              <label className="block text-micro font-mono text-[var(--ink-2)]">Estado de la Relación</label>
              <Select size="sm" aria-label="Estado de la Relación"
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as BandRelationshipStatus)}
                wrapperClassName="w-full"
              >
                <option value="sin_contactar">Sin Contactar</option>
                <option value="intercambio_propuesto">Intercambio propuesto (date swap)</option>
                <option value="concierto_agendado">Concierto Agendado</option>
                <option value="colegas_aliados">Colegas / aliados de gira</option>
                <option value="pendiente_respuesta">Pendiente respuesta</option>
                <option value="no_disponible">No Disponible</option>
              </Select>
            </div>

            {/* Persona de Contacto */}
            <div className="space-y-1">
              <label className="block text-micro font-mono text-[var(--ink-2)]">Persona de contacto / rol</label>
              <Input
                size="sm"
                type="text"
                value={formContactName}
                onChange={(e) => setFormContactName(e.target.value)}
                placeholder="Ej: Carlos (Mánager / Teclista)"
                className="w-full"
              />
            </div>

            {/* Último Contacto */}
            <div className="space-y-1">
              <label className="block text-micro font-mono text-[var(--ink-2)]">Fecha de último contacto</label>
              <Input size="sm" aria-label="Fecha de último contacto"
                type="date"
                value={formLastContact}
                onChange={(e) => setFormLastContact(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-micro font-mono text-[var(--ink-2)]">Email de contacto / Booking</label>
              <Input
                size="sm"
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="ejemplo@banda.com"
                className="w-full"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1">
              <label className="block text-micro font-mono text-[var(--ink-2)]">Teléfono / WhatsApp</label>
              <Input
                size="sm"
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full"
              />
            </div>

            {/* Instagram */}
            <div className="space-y-1">
              <label className="block text-micro font-mono text-[var(--ink-2)]">Instagram</label>
              <Input
                size="sm"
                type="text"
                value={formInstagram}
                onChange={(e) => setFormInstagram(e.target.value)}
                placeholder="@nombrebanda"
                className="w-full"
              />
            </div>

            {/* Aforo habitual */}
            <div className="space-y-1">
              <label className="block text-micro font-mono text-[var(--ink-2)]">Aforo promedio que mueven</label>
              <Input
                size="sm"
                type="number"
                value={formAforo}
                onChange={(e) => setFormAforo(Number(e.target.value))}
                placeholder="300"
                className="w-full"
              />
            </div>
          </div>

          {/* Enlace Spotify / YouTube */}
          <div className="space-y-1">
            <label className="block text-micro font-mono text-[var(--ink-2)]">Enlace Spotify / YouTube / dossier</label>
            <Input
              size="sm"
              type="url"
              value={formSpotifyYoutube}
              onChange={(e) => setFormSpotifyYoutube(e.target.value)}
              placeholder="https://open.spotify.com/artist/…"
              className="w-full"
            />
          </div>

          {/* Notas de Colaboración */}
          <div className="space-y-1">
            <label className="block text-micro font-mono text-[var(--ink-2)]">
              Notas de colaboración / salas propuestas / intercambios
            </label>
            <Textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Escribe notas relevantes para la colaboración (ej. Dispuestos a compartir fecha en Sala Apolo, proponen fecha en Noviembre)…"
              className="w-full"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <Button
              variant="neutral"
              size="xs"
              type="button"
              onClick={() => onClose()}
              
            >
              Cancelar
            </Button>
            <Button
              variant="neutral"
              size="xs"
              type="submit"
              
            >
              {editingBand ? 'Guardar Cambios' : 'Añadir Banda'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
