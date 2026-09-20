import React, { useRef } from'react';
import { Camera, Upload, Trash2, Loader2, Plus, Image as ImageIcon } from'lucide-react';

interface StepPhotosProps {
 photos: string[];
 isUploadingPhoto: boolean;
 onPhotoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
 onRemovePhoto: (index: number) => void;
 newPhotoUrl: string;
 setNewPhotoUrl: (url: string) => void;
 onAddPhotoUrl: () => void;
}

export const StepPhotos: React.FC<StepPhotosProps> = ({
 photos,
 isUploadingPhoto,
 onPhotoUpload,
 onRemovePhoto,
 newPhotoUrl,
 setNewPhotoUrl,
 onAddPhotoUrl,
}) => {
 const photoInputRef = useRef<HTMLInputElement | null>(null);

 return (
 <div className="space-y-6 animate-in fade-in duration-200">
 <div className="flex items-center gap-2 pb-2 border-b border-[var(--hair)]">
 <Camera className="w-5 h-5 text-[var(--acc)]" />
 <h3 className="text-base font-semibold text-white">Galería de Fotos para Prensa & EPK</h3>
 </div>

 <p className="text-xs text-zinc-400">
 Sube fotografías promocionales de alta calidad (horizontales y verticales) para que salas, medios y festivales las usen en carteles y notas de prensa.
 </p>

 {/* Grid of photos */}
 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
 {photos.map((url, idx) => (
 <div
 key={idx}
 className="aspect-video rounded-[var(--r-m)] bg-zinc-900 border-[var(--hair)] overflow-hidden relative group"
 >
 <img src={url} alt={`Foto promo ${idx + 1}`} className="w-full h-full object-cover" />
 <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
 <button
 type="button"
 onClick={() => onRemovePhoto(idx)}
 className="p-1.5 rounded-[var(--r-s)] bg-red-500/80 hover:bg-red-500 text-white transition-colors"
 title="Eliminar foto"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}

 {/* Upload box */}
 <div
 onClick={() => photoInputRef.current?.click()}
 className="aspect-video rounded-[var(--r-m)] border-2 border-dashed border-[var(--hair)] hover:/40 bg-zinc-900/40 hover:bg-zinc-900/70 flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-colors"
 >
 <input
 type="file"
 ref={photoInputRef}
 onChange={onPhotoUpload}
 accept="image/*"
 multiple
 className="hidden"
 />
 {isUploadingPhoto ? (
 <Loader2 className="w-5 h-5 text-[var(--acc)] animate-spin" />
 ) : (
 <>
 <Upload className="w-5 h-5 text-zinc-500 mb-1" />
 <span className="text-[11px] font-medium text-zinc-300">Subir desde dispositivo</span>
 </>
 )}
 </div>
 </div>

 {/* Add via URL */}
 <div className="pt-2 border-t border-[var(--hair)] flex gap-2">
 <input
 type="text"
 value={newPhotoUrl}
 onChange={(e) => setNewPhotoUrl(e.target.value)}
 placeholder="O añade una URL de imagen directa (https://...)"
 className="flex-1 px-3 py-2 rounded-[var(--r-m)] bg-zinc-900 border-[var(--hair)] text-white placeholder-zinc-500 text-xs focus:outline-none focus:"
 />
 <button
 type="button"
 onClick={onAddPhotoUrl}
 disabled={!newPhotoUrl.trim()}
 className="px-3 py-2 rounded-[var(--r-m)] bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
 >
 <Plus className="w-3.5 h-3.5" /> Añadir
 </button>
 </div>
 </div>
 );
};
