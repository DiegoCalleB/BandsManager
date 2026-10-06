import React, { useState } from 'react';
import { X, Upload, Sparkles, Link as LinkIcon, Trash2, Camera, Loader2, Check } from 'lucide-react';
import { BandContact } from '../../types';
import { apiFetch } from '../../utils/api';
import { uploadFileToServer } from '../../utils/audioStorage';
import { ModalPortal } from '../common/ModalPortal';

interface ChangeBandImageModalProps {
  band: BandContact | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateBand: (id: string, updates: Partial<BandContact>) => void;
}

export const ChangeBandImageModal: React.FC<ChangeBandImageModalProps> = ({
  band,
  isOpen,
  onClose,
  onUpdateBand
}) => {
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
          bandId: band.id
        })
      });

      if (res.success && res.data) {
        const newImg = res.data.imagen_url || '';
        const newIcon = res.data.icono || band.icono;
        
        onUpdateBand(band.id, {
          imagen_url: newImg,
          icono: newIcon
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
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto overscroll-contain"
        onClick={onClose}
      >
        <div 
          className="bg-[#181716] border border-zinc-800 rounded-2xl w-full max-w-md p-5 shadow-2xl relative text-zinc-100 flex flex-col gap-4 animate-scaleUp my-auto max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl">
              <Camera className="w-5 h-5 text-[#f2ca50]" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-zinc-100">Cambiar Imagen / Logo</h3>
              <p className="text-xs text-zinc-400 font-sans">{band.nombre_banda}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-400"><X className="w-5 h-5" /></button>
        </div>

        <div className="flex items-center justify-center py-2 bg-zinc-900/80 rounded-xl border border-zinc-800/80">
          <div className="relative">
            {band.imagen_url ? (
              <img src={band.imagen_url} alt={band.nombre_banda} className="w-20 h-20 rounded-2xl object-cover border-2 border-[#f2ca50] shadow-lg" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-3xl shadow-inner">
                {band.icono || '🎸'}
              </div>
            )}
          </div>
        </div>

        {statusMsg && (
          <div className={`px-3 py-2 rounded-xl text-xs font-semibold text-center flex items-center justify-center gap-1.5 ${statusMsg.type === 'success' ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-300' : 'bg-rose-950/80 border border-rose-800 text-rose-300'}`}>
            {statusMsg.type === 'success' && <Check className="w-4 h-4" />}
            <span>{statusMsg.text}</span>
          </div>
        )}

        <div className="flex flex-col gap-2.5">
          <label className="w-full p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-700/80 rounded-xl flex items-center justify-between transition-all cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-800 text-[#f2ca50] rounded-lg">{isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}</div>
              <div>
                <span className="block font-bold text-xs text-zinc-200">{isUploading ? 'Subiendo...' : 'Subir desde dispositivo'}</span>
                <span className="block text-[11px] text-zinc-400 font-sans">Formatos JPG, PNG, WEBP o SVG</span>
              </div>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} disabled={isUploading || isSearching} />
          </label>

          <button
            type="button"
            onClick={handleAutoSearchLogo}
            disabled={isSearching || isUploading}
            className="w-full p-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl flex items-center justify-between transition-all cursor-pointer disabled:opacity-50"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-300 rounded-lg">
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-amber-400" /> : <Sparkles className="w-5 h-5 text-amber-400" />}
              </div>
              <div className="text-left">
                <span className="block font-bold text-xs text-amber-300">Buscar Logo con IA</span>
                <span className="block text-[11px] text-amber-400/80 font-sans">Encuentra fotos o favicons oficiales</span>
              </div>
            </div>
          </button>

          {!showUrlInput ? (
            <button type="button" onClick={() => setShowUrlInput(true)} className="w-full p-2.5 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-xl flex items-center gap-2.5 text-xs text-zinc-300 font-medium transition-all">
              <LinkIcon className="w-4 h-4 text-zinc-400" />
              <span>Pegar URL directa de imagen</span>
            </button>
          ) : (
            <div className="p-3 bg-zinc-900 border border-zinc-700 rounded-xl space-y-2">
              <input type="url" placeholder="https://ejemplo.com/logo.png" value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} className="w-full bg-black/60 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-[#f2ca50]" />
              <button onClick={handleSaveCustomUrl} disabled={!customUrl.trim()} className="px-3 py-1.5 bg-[#f2ca50] text-black font-bold text-xs rounded-lg hover:bg-amber-400">Guardar</button>
            </div>
          )}

          {band.imagen_url && (
            <button type="button" onClick={handleRemoveImage} className="w-full p-2 bg-rose-950/40 hover:bg-rose-950/80 border border-rose-900/50 rounded-xl flex items-center justify-center gap-2 text-xs text-rose-300 transition-all cursor-pointer">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Eliminar imagen actual</span>
            </button>
          )}
        </div>
      </div>
    </div>
    </ModalPortal>
  );
};
