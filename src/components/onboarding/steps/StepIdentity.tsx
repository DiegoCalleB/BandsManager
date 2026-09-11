import React, { useRef } from 'react';
import { Guitar, Upload, Camera, Loader2, Sparkles } from 'lucide-react';

interface StepIdentityProps {
  localBandName: string;
  setLocalBandName: (name: string) => void;
  genre: string;
  setGenre: (genre: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  city: string;
  setCity: (city: string) => void;
  logoUrl: string;
  setLogoUrl: (url: string) => void;
  isUploadingLogo: boolean;
  onLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  commonGenres: string[];
  commonLanguages: string[];
}

export const StepIdentity: React.FC<StepIdentityProps> = ({
  localBandName,
  setLocalBandName,
  genre,
  setGenre,
  language,
  setLanguage,
  city,
  setCity,
  logoUrl,
  setLogoUrl,
  isUploadingLogo,
  onLogoUpload,
  commonGenres,
  commonLanguages,
}) => {
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 pb-2 border-b border-white/5">
        <Guitar className="w-5 h-5 text-amber-400" />
        <h3 className="text-base font-semibold text-white">Identidad, Estilo & Idioma Principal</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Nombre */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Nombre del Proyecto o Banda <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            value={localBandName}
            onChange={(e) => setLocalBandName(e.target.value)}
            placeholder="Ej. Los Delirio, The Midnight Waves..."
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-sm"
          />
        </div>

        {/* Ciudad Base */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Ciudad / Región de Origen <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Ej. Madrid, Barcelona, Valencia..."
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-sm"
          />
        </div>

        {/* Género */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Género / Estilo Musical <span className="text-amber-400">*</span>
          </label>
          <input
            type="text"
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            placeholder="Ej. Indie Pop, Rock Alternativo..."
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-400 text-sm mb-2"
          />
          <div className="flex flex-wrap gap-1.5">
            {commonGenres.slice(0, 6).map(g => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(g)}
                className={`text-[11px] px-2 py-0.5 rounded-md border transition-colors ${
                  genre.toLowerCase().includes(g.toLowerCase())
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-zinc-800/60 text-zinc-400 border-white/5 hover:border-white/20'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Idioma de las canciones */}
        <div>
          <label className="block text-xs font-medium text-zinc-300 mb-1.5">
            Idioma Predeterminado de las Canciones <span className="text-amber-400">*</span>
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-white focus:outline-none focus:border-amber-400 text-sm mb-2"
          >
            {commonLanguages.map(l => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
          <p className="text-[11px] text-zinc-500">
            Se usará para clasificar tu catálogo y configurar el dossier de prensa en este idioma.
          </p>
        </div>
      </div>

      {/* Subida de Logo o Avatar */}
      <div className="pt-2 border-t border-white/5">
        <label className="block text-xs font-medium text-zinc-300 mb-2">
          Logotipo Oficial o Imagen de Perfil
        </label>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo de la banda" className="w-full h-full object-cover" />
            ) : (
              <Camera className="w-6 h-6 text-zinc-600" />
            )}
            {isUploadingLogo && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
              </div>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <input
              type="file"
              ref={logoInputRef}
              onChange={onLogoUpload}
              accept="image/*"
              className="hidden"
            />
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-medium transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                {logoUrl ? 'Cambiar Imagen / Logo' : 'Subir Imagen desde el dispositivo'}
              </button>
            </div>
            <input
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="O pega aquí una URL directa (https://...)"
              className="w-full px-3 py-1.5 rounded-lg bg-zinc-900/60 border border-white/5 text-zinc-300 placeholder-zinc-600 text-xs focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
