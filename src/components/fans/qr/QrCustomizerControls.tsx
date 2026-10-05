import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  RotateCcw,
  Sliders,
  Upload,
} from 'lucide-react';
import {
  QrCustomConfig,
  QR_PRESET_THEMES,
  DEFAULT_QR_CUSTOM_CONFIG,
  QrFrameStyle,
} from './qrCustomizationConfig';
import { Button, Input } from '../../ui';

interface QrCustomizerControlsProps {
  config: QrCustomConfig;
  onChange: (newConfig: QrCustomConfig) => void;
  bandLogoUrl?: string;
  bandName?: string;
  onUploadLogoClick?: () => void;
}

export const QrCustomizerControls: React.FC<QrCustomizerControlsProps> = ({
  config,
  onChange,
  bandLogoUrl,
  bandName = 'Banda',
  onUploadLogoClick,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Identificar qué tema está activo actualmente
  const activePresetId =
    QR_PRESET_THEMES.find((t) => t.config.mascot === config.mascot)?.id ||
    (config.mascot === 'band_logo' ? 'band_logo' : 'custom');

  const handleSelectTheme = (themeId: string) => {
    const theme = QR_PRESET_THEMES.find((t) => t.id === themeId);
    if (theme && theme.config) {
      onChange({
        ...config,
        ...theme.config,
      });
    }
  };

  const handleReset = () => {
    onChange(DEFAULT_QR_CUSTOM_CONFIG);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--acc)]/20 rounded-[var(--r-l)] p-4 sm:p-5 space-y-4">
      {/* Cabecera limpia y directa */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/10 text-[var(--acc)] flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-[var(--ink)] font-display">
              Elige el Estilo del QR
            </h4>
            <p className="text-[11px] text-[var(--ink-2)] font-sans">
              1 toque para aplicar mascota, colores, ojos y marco temático
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleReset}
          className="text-xs text-[var(--ink-2)] hover:text-[var(--acc)] flex items-center gap-1 font-sans cursor-pointer transition"
          title="Restablecer diseño"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      {/* Grid de Estilos Visuales de 1 Solo Toque */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
        {QR_PRESET_THEMES.map((theme) => {
          const isSelected = activePresetId === theme.id;
          return (
            <button
              key={theme.id}
              type="button"
              onClick={() => handleSelectTheme(theme.id)}
              className={`p-3 rounded-[var(--r-m)] border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 group ${
                isSelected
                  ? 'bg-[var(--acc)]/15 border-[var(--acc)] text-[var(--ink)] ring-1 ring-[var(--acc)] shadow-sm'
                  : 'bg-[var(--sunken)] border-transparent text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]/80'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-2xl group-hover:scale-110 transition-transform">
                  {theme.icon}
                </span>
                {isSelected && (
                  <span className="w-5 h-5 rounded-full bg-[var(--acc)] text-[var(--on-acc)] flex items-center justify-center">
                    <Check className="w-3 h-3" />
                  </span>
                )}
              </div>
              <div>
                <div className="text-xs font-bold font-display text-[var(--ink)]">
                  {theme.name}
                </div>
                <p className="text-[10px] text-[var(--ink-2)] font-sans line-clamp-1">
                  {theme.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Aviso rápido si eligen 'band_logo' y no tienen logo subido */}
      {config.mascot === 'band_logo' && !bandLogoUrl && onUploadLogoClick && (
        <div className="p-3 bg-[var(--sunken)] rounded-[var(--r-m)] flex items-center justify-between text-xs">
          <span className="text-[var(--ink-2)]">
            Puedes subir el logotipo oficial de {bandName} para que aparezca en el centro:
          </span>
          <Button size="sm" onClick={onUploadLogoClick}>
            <Upload className="w-3.5 h-3.5 mr-1" /> Subir Logo
          </Button>
        </div>
      )}

      {/* Ajustes avanzados opcionales (Plegados por defecto para máxima simplicidad) */}
      <div className="pt-2 border-t border-[var(--sunken)]">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="w-full flex items-center justify-between text-xs font-bold text-[var(--ink-2)] hover:text-[var(--acc)] font-sans transition cursor-pointer py-1"
        >
          <span className="flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5" /> Ajustes rápidos (marco y colores)
          </span>
          <span>{showAdvanced ? '▲' : '▼'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-3 space-y-3 pt-2">
            {/* Interruptor de Marco */}
            <div className="flex items-center justify-between bg-[var(--sunken)] p-3 rounded-[var(--r-m)]">
              <span className="text-xs font-bold text-[var(--ink)] font-sans">
                Mostrar marco con título bajo el QR:
              </span>
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...config,
                    frameStyle:
                      config.frameStyle === 'none' ? 'concert_merch' : 'none',
                  })
                }
                className={`px-3 py-1 rounded-[var(--r-s)] text-xs font-bold font-sans transition cursor-pointer ${
                  config.frameStyle !== 'none'
                    ? 'bg-[var(--acc)] text-[var(--on-acc)]'
                    : 'bg-[var(--surface)] text-[var(--ink-2)] border border-[var(--sunken)]'
                }`}
              >
                {config.frameStyle !== 'none' ? 'Activado' : 'Desactivado'}
              </button>
            </div>

            {/* Texto del marco si está activo */}
            {config.frameStyle !== 'none' && (
              <div>
                <label className="text-[11px] font-bold text-[var(--ink-2)] font-sans block mb-1">
                  Texto del Marco:
                </label>
                <Input
                  size="sm"
                  type="text"
                  value={config.frameTitle || ''}
                  onChange={(e) =>
                    onChange({ ...config, frameTitle: e.target.value })
                  }
                  placeholder="Ej: ⚡ ESCANEA CON TU MÓVIL ⚡"
                  className="w-full"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
