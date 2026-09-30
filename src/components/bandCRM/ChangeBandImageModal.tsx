import React, { useState } from 'react';
import { X, Upload, Sparkles, Link as LinkIcon, Trash2, Camera, Loader2, Check } from 'lucide-react';
import { BandContact } from '../../types';
import { apiFetch } from '../../utils/api';
import { uploadFileToServer } from '../../utils/audioStorage';
import { ModalPortal } from '../common/ModalPortal';
import { Button, Input } from '../ui';

interface ChangeBandImageModalProps {
  band: BandContact | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBand: (id: string, updates: Partial<BandContact>) => void;
}

export const ChangeBandImageModal: React.FC<ChangeBandImageModalProps> = ({ band, isOpen, onClose, onUpdateBand }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !band) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0]) return;
    const file = e.target.files[0];
    setIsUploading(true);
    setStatusMsg(null);

    try {
      const uploadedUrl = await uploadFileToServer(file, { category: 'grupos' });
      if (uploadedUrl) {
        onUpdateBand(band.id, { imagen_url: uploadedUrl });
        setStatusMsg({ type: 'success', text: '¡Imagen subida con éxito!' });
        setTimeout(() => onClose(), 600);
      } else {
        setStatusMsg({ type: 'error', text: 'Error al subir la imagen' });
      }
    } catch (err) {
      console.error('Error subiendo imagen:', err);
      setStatusMsg({ type: 'error', text: 'Fallo al procesar el archivo' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleAutoSearchLogo = async () => {
    setIsSearching(true);
    setStatusMsg(null);

    try {
      const res = await apiFetch('/api/bands/ai-lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre_banda: band.nombre_banda,
          localizacion: band.localizacion,
          bandId: band.id,
        }),
      });

      if (res.success && res.data) {
        const newImg = res.data.imagen_url || '';
        const newIcon = res.data.icono || band.icono;

        onUpdateBand(band.id, {
          imagen_url: newImg,
          icono: newIcon,
        });

        if (newImg) {
          setStatusMsg({ type: 'success', text: '¡Logo encontrado e instalado!' });
        } else {
          setStatusMsg({ type: 'error', text: 'No se encontró una imagen oficial pública' });
        }
        setTimeout(() => onClose(), 800);
      } else {
        setStatusMsg({ type: 'error', text: 'No se obtuvo respuesta de la búsqueda' });
      }
    } catch (err) {
      console.error('Error buscando logo con IA:', err);
      setStatusMsg({ type: 'error', text: 'Error en la búsqueda con IA' });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSaveCustomUrl = () => {
    if (!customUrl.trim()) return;
    onUpdateBand(band.id, { imagen_url: customUrl.trim() });
    setStatusMsg({ type: 'success', text: 'URL guardada' });
    setTimeout(() => onClose(), 500);
  };

  const handleRemoveImage = () => {
    onUpdateBand(band.id, { imagen_url: '' });
    setStatusMsg({ type: 'success', text: 'Imagen eliminada' });
    setTimeout(() => onClose(), 500);
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 animate-fadeIn overflow-y-auto overscroll-contain"
        onClick={onClose}
      >
        <div
          className="bg-[var(--surface)] rounded-[var(--r-l)] w-full max-w-md p-5 relative text-[var(--ink)] flex flex-col gap-4 animate-scaleUp my-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-[var(--acc)]/10 rounded-[var(--r-m)]">
                <Camera className="w-5 h-5 text-[var(--acc)]" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-[var(--ink)]">Cambiar imagen / logo</h3>
                <p className="text-xs text-[var(--ink-2)] font-sans">{band.nombre_banda}</p>
              </div>
            </div>
            <button aria-label="Cerrar" onClick={onClose} className="p-1.5 hover:bg-[var(--surface)] rounded-[var(--r-pill)] text-[var(--ink-2)]">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex items-center justify-center py-2 bg-[var(--bg)]/80 rounded-[var(--r-m)]">
            <div className="relative">
              {band.imagen_url ? (
                <img src={band.imagen_url} alt={band.nombre_banda} className="w-20 h-20 rounded-[var(--r-l)] object-cover" />
              ) : (
                <div className="w-20 h-20 rounded-[var(--r-l)] bg-[var(--sunken)] flex items-center justify-center text-3xl">
                  {band.icono || '🎸'}
                </div>
              )}
            </div>
          </div>

          {statusMsg && (
            <div
              className={`px-3 py-2 rounded-[var(--r-m)] text-xs font-semibold text-center flex items-center justify-center gap-1.5 ${statusMsg.type === 'success' ? 'bg-[var(--ok-soft)] text-[var(--ink-2)]' : 'bg-[var(--alert-soft)] text-[var(--ink-2)]'}`}
            >
              {statusMsg.type === 'success' && <Check className="w-4 h-4" />}
              <span>{statusMsg.text}</span>
            </div>
          )}

          <div className="flex flex-col gap-2.5">
            <label className="w-full p-3 bg-[var(--sunken)] hover:bg-[var(--surface)] rounded-[var(--r-m)] flex items-center justify-between transition-ui cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--surface)] text-[var(--acc)] rounded-[var(--r-s)]">
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                </div>
                <div>
                  <span className="block font-bold text-xs text-[var(--ink)]">
                    {isUploading ? 'Subiendo...' : 'Subir desde dispositivo'}
                  </span>
                  <span className="block text-xs text-[var(--ink-2)] font-sans">Formatos JPG, PNG, WEBP o SVG</span>
                </div>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading || isSearching} />
            </label>

            <button
              type="button"
              onClick={handleAutoSearchLogo}
              disabled={isSearching || isUploading}
              className="w-full p-3 bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 rounded-[var(--r-m)] flex items-center justify-between transition-ui cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--acc)]/20 text-[var(--acc-ink)] rounded-[var(--r-s)]">
                  {isSearching ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[var(--acc)]" />
                  ) : (
                    <Sparkles className="w-5 h-5 text-[var(--acc)]" />
                  )}
                </div>
                <div className="text-left">
                  <span className="block font-bold text-xs text-[var(--acc)]/70">Buscar logo con IA</span>
                  <span className="block text-xs text-[var(--acc)]/80 font-sans">Encuentra fotos o favicons oficiales</span>
                </div>
              </div>
            </button>

            {!showUrlInput ? (
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                className="w-full p-2.5 bg-[var(--bg)]/60 hover:bg-[var(--surface)] rounded-[var(--r-m)] flex items-center gap-2.5 text-xs text-[var(--ink-2)] font-medium transition-ui"
              >
                <LinkIcon className="w-4 h-4 text-[var(--ink-2)]" />
                <span>Pegar URL directa de imagen</span>
              </button>
            ) : (
              <div className="p-3 bg-[var(--bg)]/70 rounded-[var(--r-m)] space-y-2">
                <Input
                  size="sm"
                  type="url"
                  placeholder="https://ejemplo.com/logo.png"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full"
                />
                <Button
                  variant="primary"
                  size="xs"
                  onClick={handleSaveCustomUrl}
                  disabled={!customUrl.trim()}
                  
                >
                  Guardar
                </Button>
              </div>
            )}

            {band.imagen_url && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="w-full p-2 bg-[var(--alert-soft)] hover:bg-[var(--alert-soft)] rounded-[var(--r-m)] flex items-center justify-center gap-2 text-xs text-[var(--ink-2)] transition-ui cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-[var(--alert)]" />
                <span>Eliminar imagen actual</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
