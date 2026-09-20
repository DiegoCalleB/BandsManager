import React, { useState } from'react';
import { 
 Sparkles, CheckCircle2, Globe, Heart, ExternalLink, 
 Copy, Check, ArrowRight, Disc3, Layers, Calendar, Users 
} from'lucide-react';

interface StepCompletedCelebrationProps {
 bandName: string;
 totalSongs: number;
 totalVideos: number;
 totalPhotos: number;
 totalEvents: number;
 hasRider: boolean;
 planName: string;
 onFinish: () => void;
}

export const StepCompletedCelebration: React.FC<StepCompletedCelebrationProps> = ({
 bandName,
 totalSongs,
 totalVideos,
 totalPhotos,
 totalEvents,
 hasRider,
 planName,
 onFinish,
}) => {
 const [copiedEpk, setCopiedEpk] = useState(false);
 const [copiedFans, setCopiedFans] = useState(false);

 const epkUrl = `${window.location.origin}/epk`;
 const fansUrl = `${window.location.origin}/fans`;

 const copyToClipboard = (text: string, type:'epk' |'fans') => {
 navigator.clipboard.writeText(text);
 if (type ==='epk') {
 setCopiedEpk(true);
 setTimeout(() => setCopiedEpk(false), 2500);
 } else {
 setCopiedFans(true);
 setTimeout(() => setCopiedFans(false), 2500);
 }
 };

 return (
 <div className="space-y-6 text-center animate-in zoom-in-95 duration-300 py-4">
 {/* Celebration Icon */}
 <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-500 to-amber-300 text-black flex items-center justify-center mx-auto shadow-xl shadow-amber-500/20">
 <Sparkles className="w-8 h-8" />
 </div>

 <div>
 <h3 className="text-2xl font-bold text-white mb-1">
 ¡Perfil y Dossier de {bandName ||'tu Banda'} Listos!
 </h3>
 <p className="text-sm text-zinc-400 max-w-md mx-auto">
 Tus dos portales públicos interactivos ya están completamente operativos y sincronizados con tus datos.
 </p>
 </div>

 {/* Stats Summary Pills */}
 <div className="flex flex-wrap justify-center gap-2 max-w-lg mx-auto">
 <span className="text-xs px-3 py-1 rounded-full bg-zinc-900 border-[var(--hair)] text-zinc-300 flex items-center gap-1.5">
 <Disc3 className="w-3.5 h-3.5 text-amber-400" /> {totalSongs} Temas
 </span>
 <span className="text-xs px-3 py-1 rounded-full bg-zinc-900 border-[var(--hair)] text-zinc-300 flex items-center gap-1.5">
 <Globe className="w-3.5 h-3.5 text-red-400" /> {totalVideos} Vídeos
 </span>
 <span className="text-xs px-3 py-1 rounded-full bg-zinc-900 border-[var(--hair)] text-zinc-300 flex items-center gap-1.5">
 <Calendar className="w-3.5 h-3.5 text-blue-400" /> {totalEvents} Fechas
 </span>
 {hasRider && (
 <span className="text-xs px-3 py-1 rounded-full bg-zinc-900 border-[var(--hair)] text-zinc-300 flex items-center gap-1.5">
 <Layers className="w-3.5 h-3.5 text-emerald-400" /> Rider Técnico
 </span>
 )}
 </div>

 {/* Action Cards for EPK and Fans */}
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto pt-2">
 {/* EPK Card */}
 <div className="p-5 rounded-[var(--r-l)] bg-zinc-900/90 shadow-lg space-y-3 relative overflow-hidden group">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Globe className="w-5 h-5 text-amber-400" />
 <h4 className="text-sm font-semibold text-white">Dossier EPK Online</h4>
 </div>
 <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-medium">
 Para Salas y Festivales
 </span>
 </div>

 <p className="text-xs text-zinc-400">
 Prensa, biografía, videoclips, reproductor de audio, fotos en alta resolución y rider descargable.
 </p>

 <div className="flex items-center gap-2 pt-1">
 <a
 href="/epk"
 target="_blank"
 rel="noreferrer"
 className="flex-1 py-2 px-3 rounded-[var(--r-m)] bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
 >
 <ExternalLink className="w-3.5 h-3.5" /> Ver Dossier EPK
 </a>
 <button
 type="button"
 onClick={() => copyToClipboard(epkUrl,'epk')}
 className="p-2 rounded-[var(--r-m)] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors flex items-center justify-center"
 title="Copiar enlace EPK"
 >
 {copiedEpk ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
 </button>
 </div>
 </div>

 {/* Fans Landing Card */}
 <div className="p-5 rounded-[var(--r-l)] bg-zinc-900/90 shadow-lg space-y-3 relative overflow-hidden group">
 <div className="flex items-center justify-between">
 <div className="flex items-center gap-2">
 <Heart className="w-5 h-5 text-pink-400" />
 <h4 className="text-sm font-semibold text-white">Landing & QR de Fans</h4>
 </div>
 <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 font-medium">
 Para Conciertos
 </span>
 </div>

 <p className="text-xs text-zinc-400">
 Captación de base de fans, descarga de regalo (lead magnet), propinas y pagos directos por Bizum/Revolut.
 </p>

 <div className="flex items-center gap-2 pt-1">
 <a
 href="/fans"
 target="_blank"
 rel="noreferrer"
 className="flex-1 py-2 px-3 rounded-[var(--r-m)] bg-pink-500 hover:bg-pink-400 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
 >
 <ExternalLink className="w-3.5 h-3.5" /> Ver Landing Fans
 </a>
 <button
 type="button"
 onClick={() => copyToClipboard(fansUrl,'fans')}
 className="p-2 rounded-[var(--r-m)] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors flex items-center justify-center"
 title="Copiar enlace Fans"
 >
 {copiedFans ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
 </button>
 </div>
 </div>
 </div>

 {/* Finish CTA */}
 <div className="pt-4">
 <button
 type="button"
 onClick={onFinish}
 className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[var(--r-l)] bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm shadow-xl shadow-amber-500/20 hover:scale-[1.02] transition-all"
 >
 Entrar a BandManager.ai <ArrowRight className="w-4 h-4" />
 </button>
 </div>
 </div>
 );
};
