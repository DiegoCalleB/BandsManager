import React, { useRef } from "react";
import {
  Guitar,
  Upload,
  Camera,
  Loader2,
  Sparkles,
  Globe,
  Type,
  Check,
} from "lucide-react";
import {
  BAND_FONT_OPTIONS,
  getFontFamilyById,
} from "../../../config/bandFonts";
import {
  useLanguage,
  SUPPORTED_LANGUAGES,
  SupportedLanguage,
} from "../../../context/LanguageContext";
import { Button, Input } from '../../ui';

interface StepIdentityProps {
  localBandName: string;
  setLocalBandName: (name: string) => void;
  genre: string;
  setGenre: (genre: string) => void;
  language: string;
  setLanguage: (lang: string) => void;
  fontStyle: string;
  setFontStyle: (font: string) => void;
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
  fontStyle,
  setFontStyle,
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
  const { language: currentAppLang } = useLanguage();

  const previewName = localBandName.trim() || "Nombre de la Banda";
  const selectedFontFamily = getFontFamilyById(fontStyle);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. IDENTIDAD & NOMBRE DE LA BANDA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Guitar className="w-4 h-4 text-[var(--acc)]" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              Nombre del proyecto musical y ubicación
            </h3>
          </div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--r-s)] bg-[var(--surface)]/80 text-xs text-[var(--ink-2)] font-sans">
            <Globe className="w-3 h-3 text-[var(--acc)]" />
            <span>
              Idioma:{" "}
              <strong className="text-[var(--ink)]">
                {language || "Español"}
              </strong>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Nombre de la Banda */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">
              Nombre de la banda o proyecto musical{" "}
              <span className="text-[var(--acc)]">*</span>
            </label>
            <Input
              type="text"
              value={localBandName}
              onChange={(e) => setLocalBandName(e.target.value)}
              placeholder="Ej. Linkin Park, Los Delirio, The Midnight Waves…"
              className="w-full"
            />
          </div>

          {/* Ciudad Base */}
          <div>
            <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">
              Ciudad / región de origen{" "}
              <span className="text-[var(--acc)]">*</span>
            </label>
            <Input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Ej. Madrid, Barcelona, Valencia, Los Ángeles…"
              className="w-full"
            />
          </div>

          {/* Género */}
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-[var(--ink-2)] mb-1.5">
              Género / estilo musical{" "}
              <span className="text-[var(--acc)]">*</span>
            </label>
            <Input
              type="text"
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              placeholder="Ej. Nu-Metal, Rock Alternativo, Indie Pop, Ska-Rock…"
              className="w-full mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {commonGenres.slice(0, 8).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGenre(g)}
                  className={`text-xs px-2.5 py-1 rounded-[var(--r-pill)] transition-colors cursor-pointer ${
                    genre.toLowerCase().includes(g.toLowerCase())
                      ? "bg-[var(--acc)]/20 text-[var(--ink)]  font-semibold"
                      : "bg-[var(--sunken)]/60 text-[var(--ink-2)] "
                  } hover:brightness-95`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 3. ELECCIÓN DEL ESTILO DE LA FUENTE PARA EL NOMBRE DE LA BANDA */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-[var(--acc)]" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">
              3. Estilo de Tipografía para el Nombre de la Banda
            </h3>
          </div>
          <span className="text-xs font-sans text-[var(--ink-2)]">
            Se aplicará al Dossier EPK, cartelería y cabeceras
          </span>
        </div>

        <p className="text-xs text-[var(--ink-2)]">
          Selecciona cómo quieres que luzca el nombre de tu banda en el EPK
          oficial y materiales de prensa:
        </p>

        {/* Font Grid with Live Band Name Previews */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {BAND_FONT_OPTIONS.map((f) => {
            const isSelected = fontStyle === f.id || fontStyle === f.fontFamily;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => setFontStyle(f.id)}
                className={`p-3.5 rounded-[var(--r-m)] text-left transition-ui relative overflow-hidden group cursor-pointer ${
                  isSelected
                    ? "bg-[var(--acc)]/10  ring-1 ring-[var(--acc)]/30"
                    : "bg-[var(--bg)]/90  hover:bg-[var(--bg)]"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`text-micro font-sans font-bold px-2 py-0.5 rounded-[var(--r-pill)] ${
                      isSelected
                        ? "bg-[var(--ink)] text-[var(--bg)]"
                        : "bg-[var(--sunken)] text-[var(--ink-2)]"
                    }`}
                  >
                    {f.badge}
                  </span>
                  {isSelected && (
                    <span className="flex items-center gap-1 text-xs font-bold text-[var(--acc)] font-sans">
                      <Check className="w-3.5 h-3.5" /> Seleccionada
                    </span>
                  )}
                </div>

                {/* Live Styled Band Name */}
                <div
                  className={`text-lg sm:text-xl py-1 truncate leading-tight transition-colors ${
                    isSelected
                      ? "text-[var(--acc)]/70"
                      : "text-[var(--ink)] group-hover:text-[var(--ink)]"
                  }`}
                  style={{ fontFamily: f.fontFamily }}
                >
                  {previewName}
                </div>

                <p className="text-xs text-[var(--ink-2)] mt-1 line-clamp-2 leading-relaxed">
                  {f.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Live Banner Preview */}
        <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)]  flex flex-col sm:flex-row items-center justify-between gap-4 mt-2">
          <div className="flex items-center gap-3.5 w-full sm:w-auto">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo"
                className="w-12 h-12 rounded-[var(--r-m)] object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-[var(--r-m)] bg-[var(--acc)]/20 text-[var(--ink)] font-bold flex items-center justify-center shrink-0 text-base">
                {previewName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <span className="text-micro font-sans text-[var(--acc)] font-bold block">
                Previsualización en dossier EPK
              </span>
              <div
                className="text-xl sm:text-2xl text-[var(--ink)] truncate font-bold leading-tight"
                style={{ fontFamily: selectedFontFamily }}
              >
                {previewName}
              </div>
              <p className="text-xs text-[var(--ink-2)] truncate">
                {genre || "Género musical"} · {city || "Ciudad"} · {language}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="text-xs text-[var(--ink-2)] font-sans">
              Fuente activa:{" "}
              <strong className="text-[var(--acc)]/70">
                {BAND_FONT_OPTIONS.find((f) => f.id === fontStyle)?.name ||
                  "Headline Rock"}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* 4. SUBIDA DE LOGOTIPO OFICIAL O AVATAR */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-[var(--acc)]" />
          <h3 className="text-sm font-semibold text-[var(--ink)]">
            4. Logotipo oficial o imagen de perfil
          </h3>
        </div>

        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-[var(--r-l)] bg-[var(--surface)] flex items-center justify-center overflow-hidden flex-shrink-0 relative group">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="Logo de la banda"
                className="w-full h-full object-cover"
              />
            ) : (
              <Camera className="w-6 h-6 text-[var(--ink-2)]" />
            )}
            {isUploadingLogo && (
              <div className="absolute inset-0 bg-[var(--scrim)]/70 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-[var(--acc)] animate-spin" />
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
              <Button
                variant="neutral"
                size="sm"
                type="button"
                onClick={() => logoInputRef.current?.click()}
                disabled={isUploadingLogo}
                className="items-center gap-2"
              >
                <Upload className="w-3.5 h-3.5" />
                {logoUrl
                  ? "Cambiar Imagen / Logo"
                  : "Subir Imagen desde el dispositivo"}
              </Button>
            </div>
            <Input
              size="sm"
              type="text"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="O pega aquí una URL directa (https://…)"
              className="w-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
