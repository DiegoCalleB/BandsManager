import React from 'react';
import { Music, X, Sparkles, Loader2, Upload, Check } from 'lucide-react';
import { BandRelationshipStatus, BandContact } from '../../types';

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
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div
        className={`w-full max-w-2xl rounded-2xl p-6 space-y-5 shadow-2xl relative overflow-hidden max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${
          isStitchLight ? 'bg-white text-slate-800' : 'bg-[#1c1b1b] text-neutral-100'
        }`}
      >
        <div className="flex items-center justify-between pb-3">
          <div className="flex items-center gap-2">
            <Music className="w-5 h-5 text-[#f2ca50]" />
            <h3 className="text-base font-bold font-display uppercase tracking-wider">
              {editingBand ? `Editar Banda: ${editingBand.nombre_banda}` : 'Añadir Nueva Banda al CRM'}
            </h3>
          </div>
          <button onClick={() => onClose()} className="p-1 hover:bg-neutral-800 rounded-lg transition-colors">
            <X className="w-5 h-5 text-neutral-400" />
          </button>
        </div>

        <form onSubmit={handleSaveBand} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre de la Banda */}
            <div className="space-y-1 md:col-span-2">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] font-mono uppercase text-neutral-400">Nombre de la Banda / Artista *</label>
                <button
                  type="button"
                  onClick={handleAiLookup}
                  disabled={isAiSearching || !formName.trim()}
                  className="flex items-center gap-1.5 text-[10px] font-mono font-bold px-2.5 py-1 rounded-xl bg-[#f2ca50]/10 hover:bg-[#f2ca50]/20 text-[#f2ca50] border border-[#f2ca50]/30 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isAiSearching ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin text-[#f2ca50]" />
                      <span>Buscando en la Web...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3 h-3 text-[#f2ca50]" />
                      <span>Buscar con IA (Autorellenar)</span>
                    </>
                  )}
                </button>
              </div>
              <input
                type="text"
                required
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Pardiez, La Señora Tomasa, Tarraco Ska..."
                className="w-full bg-neutral-900 text-white px-3 py-1.5 rounded-xl text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#f2ca50]/50"
              />
            </div>

            {/* AI Proposal Overlay / Card */}
            {isAiSearching && (
              <div className="md:col-span-2 p-3 bg-neutral-900/90 border border-[#f2ca50]/30 rounded-xl flex items-center gap-3 text-xs text-[#f2ca50] font-mono animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin text-[#f2ca50]" />
                <span>Buscando datos de "{formName}" con IA en la web...</span>
              </div>
            )}

            {aiError && (
              <div className="md:col-span-2 p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl flex items-center justify-between text-xs text-rose-300 font-mono">
                <span>⚠️ {aiError}</span>
                <button type="button" onClick={() => setAiError(null)} className="p-1 hover:bg-rose-900/50 rounded">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {aiProposal && (
              <div className="md:col-span-2 p-3.5 bg-zinc-900 border border-[#f2ca50]/40 rounded-xl space-y-3 text-xs font-mono shadow-xl">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <div className="flex items-center gap-1.5 text-[#f2ca50] font-bold">
                    <Sparkles className="w-4 h-4" />
                    <span>Propuesta de la IA (Revisa antes de confirmar):</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleApplyAllAiData}
                      className="px-3 py-1 bg-[#f2ca50] text-[#3c2f00] font-bold rounded-lg text-[10px] hover:bg-[#e0b83e] transition-all cursor-pointer flex items-center gap-1 shadow"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Aplicar Todo</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiProposal(null)}
                      className="p-1 hover:bg-zinc-800 text-zinc-400 rounded-lg transition-colors cursor-pointer"
                      title="Descartar propuesta"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-zinc-300">
                  {aiProposal.estilo_musical && (
                    <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
                      <div className="truncate pr-2">
                        <span className="text-zinc-500 font-bold">Estilo:</span> {aiProposal.estilo_musical}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormStyle(aiProposal.estilo_musical)}
                        className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {aiProposal.localizacion && (
                    <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
                      <div className="truncate pr-2">
                        <span className="text-zinc-500 font-bold">Origen:</span> {aiProposal.localizacion}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormLocation(aiProposal.localizacion)}
                        className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {aiProposal.contacto_nombre && (
                    <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
                      <div className="truncate pr-2">
                        <span className="text-zinc-500 font-bold">Contacto:</span> {aiProposal.contacto_nombre}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormContactName(aiProposal.contacto_nombre)}
                        className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {aiProposal.email && (
                    <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
                      <div className="truncate pr-2">
                        <span className="text-zinc-500 font-bold">Email:</span> {aiProposal.email}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormEmail(aiProposal.email)}
                        className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {aiProposal.telefono && (
                    <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
                      <div className="truncate pr-2">
                        <span className="text-zinc-500 font-bold">Tel:</span> {aiProposal.telefono}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormPhone(aiProposal.telefono)}
                        className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {aiProposal.instagram && (
                    <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
                      <div className="truncate pr-2">
                        <span className="text-zinc-500 font-bold">Instagram:</span> {aiProposal.instagram}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormInstagram(aiProposal.instagram)}
                        className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {(aiProposal.spotify_url || aiProposal.youtube_url) && (
                    <div className="flex items-center justify-between bg-zinc-950/70 p-2 rounded-lg border border-zinc-800 sm:col-span-2">
                      <div className="truncate max-w-[80%]">
                        <span className="text-zinc-500 font-bold">Música / Media:</span> {aiProposal.spotify_url || aiProposal.youtube_url}
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormSpotifyYoutube(aiProposal.spotify_url || aiProposal.youtube_url)}
                        className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0"
                      >
                        Usar
                      </button>
                    </div>
                  )}

                  {aiProposal.biografia && (
                    <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800 sm:col-span-2 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 font-bold">Resumen / Bio:</span>
                        <button
                          type="button"
                          onClick={() =>
                            setFormNotes((prev) => (prev ? `${prev}\n\n[Bio IA]: ${aiProposal.biografia}` : aiProposal.biografia))
                          }
                          className="text-[10px] font-bold text-[#f2ca50] hover:underline cursor-pointer shrink-0"
                        >
                          Añadir a Notas
                        </button>
                      </div>
                      <p className="text-[10px] text-zinc-300 italic leading-relaxed">{aiProposal.biografia}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Icono o Imagen / Logo de la Banda */}
            <div className="space-y-2 sm:col-span-2 p-3 bg-neutral-900/60 rounded-xl border border-neutral-800">
              <label className="block text-[10px] font-mono uppercase text-[#f2ca50] font-bold">Icono o Logo / Foto de la Banda</label>

              <div className="flex flex-wrap items-center gap-3">
                {/* Preview current avatar */}
                <div className="w-10 h-10 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden shrink-0">
                  {formImageUrl ? (
                    <img src={formImageUrl} alt="Logo Banda" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-xl">{formIcon || '🎸'}</span>
                  )}
                </div>

                {/* Emoji preset selection */}
                <div className="flex-1 space-y-1">
                  <span className="text-[10px] text-neutral-400 block font-mono">Seleccionar icono emoji:</span>
                  <div className="flex flex-wrap gap-1">
                    {['🎸', '🎹', '🥁', '🎤', '🎷', '🎺', '🎧', '🪕', '🎻', '⚡', '🔥', '🌟', '🎶'].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => {
                          setFormIcon(emoji);
                        }}
                        className={`w-7 h-7 rounded-lg text-sm flex items-center justify-center transition-all cursor-pointer ${
                          formIcon === emoji && !formImageUrl
                            ? 'bg-[#f2ca50]/20 border border-[#f2ca50] text-white scale-110'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload file button */}
                <div className="shrink-0 space-y-1">
                  <span className="text-[10px] text-neutral-400 block font-mono">O subir logo (Supabase):</span>
                  <label className="cursor-pointer px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-xl text-[10px] font-mono text-zinc-200 flex items-center gap-1.5 transition-all active:scale-95">
                    {isUploadingLogo ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#f2ca50]" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-[#f2ca50]" />
                    )}
                    <span>{isUploadingLogo ? 'Subiendo...' : 'Subir Imagen'}</span>
                    <input
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
                      className="text-[9px] text-rose-400 hover:underline block text-center"
                    >
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Estilo Musical */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-neutral-400">Estilo Musical *</label>
              <input
                type="text"
                required
                value={formStyle}
                onChange={(e) => setFormStyle(e.target.value)}
                placeholder="Ej: Balkan Ska, Reggae, Punk, Mestizaje..."
                className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
              />
            </div>

            {/* Localización / Ciudad */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-neutral-400">Localización / Ciudad Principal *</label>
              <input
                type="text"
                required
                value={formLocation}
                onChange={(e) => setFormLocation(e.target.value)}
                placeholder="Ej: Barcelona, Madrid, Valencia, Sevilla..."
                className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
              />
            </div>

            {/* Estado de la Relación */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-neutral-400">Estado de la Relación</label>
              <select
                value={formStatus}
                onChange={(e) => setFormStatus(e.target.value as BandRelationshipStatus)}
                className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50 cursor-pointer"
              >
                <option value="sin_contactar">📡 Sin Contactar</option>
                <option value="intercambio_propuesto">🔄 Intercambio Propuesto (Date Swap)</option>
                <option value="concierto_agendado">⚡ Concierto Agendado</option>
                <option value="colegas_aliados">🤝 Colegas / Aliados de Gira</option>
                <option value="pendiente_respuesta">⏳ Pendiente Respuesta</option>
                <option value="no_disponible">❌ No Disponible</option>
              </select>
            </div>

            {/* Persona de Contacto */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-neutral-400">Persona de Contacto / Rol</label>
              <input
                type="text"
                value={formContactName}
                onChange={(e) => setFormContactName(e.target.value)}
                placeholder="Ej: Carlos (Mánager / Teclista)"
                className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
              />
            </div>

            {/* Último Contacto */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-neutral-400">Fecha de Último Contacto</label>
              <input
                type="date"
                value={formLastContact}
                onChange={(e) => setFormLastContact(e.target.value)}
                className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
              />
            </div>

            {/* Email */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-neutral-400">Email de Contacto / Booking</label>
              <input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="ejemplo@banda.com"
                className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-neutral-400">Teléfono / WhatsApp</label>
              <input
                type="text"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="+34 600 000 000"
                className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
              />
            </div>

            {/* Instagram */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-neutral-400">Instagram</label>
              <input
                type="text"
                value={formInstagram}
                onChange={(e) => setFormInstagram(e.target.value)}
                placeholder="@nombrebanda"
                className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
              />
            </div>

            {/* Aforo habitual */}
            <div className="space-y-1">
              <label className="block text-[10px] font-mono uppercase text-neutral-400">Aforo Promedio que Mueven</label>
              <input
                type="number"
                value={formAforo}
                onChange={(e) => setFormAforo(Number(e.target.value))}
                placeholder="300"
                className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
              />
            </div>
          </div>

          {/* Enlace Spotify / YouTube */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase text-neutral-400">Enlace Spotify / YouTube / Dossier</label>
            <input
              type="url"
              value={formSpotifyYoutube}
              onChange={(e) => setFormSpotifyYoutube(e.target.value)}
              placeholder="https://open.spotify.com/artist/..."
              className="w-full bg-neutral-900 text-white px-2 py-1 rounded-xl text-[10px] font-mono focus:outline-none focus:-[#f2ca50]/50"
            />
          </div>

          {/* Notas de Colaboración */}
          <div className="space-y-1">
            <label className="block text-[10px] font-mono uppercase text-neutral-400">
              Notas de Colaboración / Salas propuestas / Intercambios
            </label>
            <textarea
              rows={3}
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Escribe notas relevantes para la colaboración (ej. Dispuestos a compartir fecha en Sala Apolo, proponen fecha en Noviembre)..."
              className="w-full bg-neutral-900 text-white p-3 rounded-xl text-[10px] font-sans leading-relaxed focus:outline-none focus:-[#f2ca50]/50"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => onClose()}
              className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-mono text-[10px] rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-mono font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md"
            >
              {editingBand ? 'Guardar Cambios' : 'Añadir Banda'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
