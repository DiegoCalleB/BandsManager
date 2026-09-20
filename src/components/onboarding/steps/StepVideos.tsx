import React from'react';
import { Video, Youtube, Plus, Trash2, Award } from'lucide-react';
import { EPKVideo } from'../../../types';

interface StepVideosProps {
 videos: EPKVideo[];
 newVideoUrl: string;
 setNewVideoUrl: (url: string) => void;
 newVideoTitle: string;
 setNewVideoTitle: (title: string) => void;
 newVideoType:'videoclip' |'directo' |'entrevista' |'acustico';
 setNewVideoType: (t:'videoclip' |'directo' |'entrevista' |'acustico') => void;
 onAddVideo: () => void;
 onRemoveVideo: (id: string) => void;
 onToggleHighlightVideo: (id: string) => void;
}

export const StepVideos: React.FC<StepVideosProps> = ({
 videos,
 newVideoUrl,
 setNewVideoUrl,
 newVideoTitle,
 setNewVideoTitle,
 newVideoType,
 setNewVideoType,
 onAddVideo,
 onRemoveVideo,
 onToggleHighlightVideo,
}) => {
 return (
 <div className="space-y-6 animate-in fade-in duration-200">
 <div className="flex items-center gap-2 pb-2 border-b border-[var(--hair)]">
 <Video className="w-5 h-5 text-[var(--acc)]" />
 <h3 className="text-base font-semibold text-[var(--ink)]">Vídeos de YouTube & Directos</h3>
 </div>

 <p className="text-xs text-[var(--ink-2)]">
 Los programadores de salas y festivales siempre piden ver cómo suena la banda en directo y vuestros videoclips oficiales.
 </p>

 {/* Videos List */}
 {videos.length > 0 && (
 <div className="space-y-2.5">
 {videos.map((vid) => (
 <div
 key={vid.id}
 className="flex items-center justify-between p-3 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--hair)] hover:border-[var(--hair)] transition-colors"
 >
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-[var(--r-s)] bg-red-500/10 text-red-400 flex items-center justify-center flex-shrink-0">
 <Youtube className="w-5 h-5" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-[var(--ink)]">{vid.titulo}</span>
 {(vid as any).tipo && (
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--sunken)] text-[var(--ink-2)] capitalize">
 {(vid as any).tipo}
 </span>
 )}
 {vid.destacado && (
 <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc)]/70 font-medium flex items-center gap-1">
 <Award className="w-3 h-3" /> Destacado
 </span>
 )}
 </div>
 <a
 href={vid.url}
 target="_blank"
 rel="noreferrer"
 className="text-xs text-[var(--ink-3)] hover:text-[var(--acc)] transition-colors truncate block max-w-md"
 >
 {vid.url}
 </a>
 </div>
 </div>

 <div className="flex items-center gap-1">
 <button
 type="button"
 onClick={() => onToggleHighlightVideo(vid.id)}
 className={`p-1.5 rounded-[var(--r-s)] text-xs transition-colors ${
 vid.destacado ?'text-[var(--acc)] bg-[var(--acc)]/10' :'text-[var(--ink-3)] hover:text-[var(--ink-2)]'
 }`}
 title={vid.destacado ?'Quitar destacado' :'Marcar como vídeo principal'}
 >
 <Award className="w-4 h-4" />
 </button>
 <button
 type="button"
 onClick={() => onRemoveVideo(vid.id)}
 className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-3)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
 title="Eliminar vídeo"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Add Video Form */}
 <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] border-[var(--hair)] space-y-3">
 <h4 className="text-xs font-semibold text-[var(--ink-2)] uppercase tracking-wider flex items-center gap-1.5">
 <Plus className="w-3.5 h-3.5 text-[var(--acc)]" />
 Añadir Nuevo Vídeo (YouTube)
 </h4>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
 <div className="md:col-span-2">
 <input
 type="text"
 value={newVideoUrl}
 onChange={(e) => setNewVideoUrl(e.target.value)}
 placeholder="URL de YouTube (https://www.youtube.com/watch?v=... o youtu.be/...)"
 className="w-full px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-zinc-500 text-xs focus:outline-none focus:"
 />
 </div>

 <div>
 <select
 value={newVideoType}
 onChange={(e) => setNewVideoType(e.target.value as any)}
 className="w-full px-3 py-2 rounded-[var(--r-s)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] text-xs focus:outline-none focus:"
 >
 <option value="videoclip">Videoclip Oficial</option>
 <option value="directo">Directo en Concierto</option>
 <option value="acustico">Sesión Acústica</option>
 <option value="entrevista">Entrevista / Prensa</option>
 </select>
 </div>
 </div>

 <div className="flex items-center justify-between pt-1">
 <input
 type="text"
 value={newVideoTitle}
 onChange={(e) => setNewVideoTitle(e.target.value)}
 placeholder="Título del vídeo (opcional, se extraerá de la URL si se omite)"
 className="w-2/3 px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--bg)] border-[var(--hair)] text-[var(--ink)] placeholder-zinc-500 text-xs focus:outline-none focus:"
 />

 <button
 type="button"
 onClick={onAddVideo}
 disabled={!newVideoUrl.trim()}
 className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--acc-ink)] font-semibold text-xs transition-colors disabled:opacity-50"
 >
 <Plus className="w-3.5 h-3.5" />
 Añadir Vídeo
 </button>
 </div>
 </div>
 </div>
 );
};
