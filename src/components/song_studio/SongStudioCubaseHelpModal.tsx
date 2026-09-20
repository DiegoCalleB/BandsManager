import React from'react';
import { X, Keyboard } from'lucide-react';
import { ModalPortal } from'../common/ModalPortal';

interface SongStudioCubaseHelpModalProps {
 onClose: () => void;
}

export const SongStudioCubaseHelpModal: React.FC<SongStudioCubaseHelpModalProps> = ({ onClose }) => {
 return (
 <ModalPortal isOpen={true} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 text-zinc-100 relative my-auto max-h-[90vh] overflow-y-auto">
 <button
 type="button"
 onClick={onClose}
 className="absolute top-4 right-4 p-1.5 rounded-[var(--r-m)] bg-white/5 hover:bg-white/10 text-[var(--ink-2)] hover:text-white transition-all cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>

 <div className="flex items-center gap-3 border-b border-purple-500/20 pb-4">
 <div className="p-3 rounded-[var(--r-m)] bg-purple-500/20 text-purple-300">
 <Keyboard className="w-6 h-6" />
 </div>
 <div>
 <h3 className="text-lg font-bold text-white flex items-center gap-2">
 Atajos de Teclado Tipo Cubase DAW
 <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-500/30 text-purple-200">
 Modo Studio
 </span>
 </h3>
 <p className="text-xs text-[var(--ink-2)]">
 Controla la reproducción y grabación multipista directamente con tu teclado en tiempo real.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
 <div className="p-3 rounded-[var(--r-m)] bg-white/5 border-[var(--hair)] flex items-center justify-between">
 <span className="text-[var(--ink-3)]">Play / Pausa</span>
 <kbd className="px-2 py-1 rounded bg-black/80 text-purple-300 font-bold shadow">
 Espacio
 </kbd>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-white/5 border-[var(--hair)] flex items-center justify-between">
 <span className="text-[var(--ink-3)]">Pausar Mantenida</span>
 <kbd className="px-2 py-1 rounded bg-black/80 text-amber-300 font-bold shadow">
 P
 </kbd>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-white/5 border-[var(--hair)] flex items-center justify-between">
 <span className="text-[var(--ink-3)]">Detener e ir a Inicio (Stop)</span>
 <kbd className="px-2 py-1 rounded bg-black/80 text-rose-300 font-bold shadow">
 0 / Stop / Home
 </kbd>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-white/5 border-[var(--hair)] flex items-center justify-between">
 <span className="text-[var(--ink-3)]">Alternar Bucle (Loop ON/OFF)</span>
 <kbd className="px-2 py-1 rounded bg-black/80 text-purple-300 font-bold shadow">
 L / /
 </kbd>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-white/5 border-[var(--hair)] flex items-center justify-between">
 <span className="text-[var(--ink-3)]">Fijar Cue In (Inicio Bucle)</span>
 <kbd className="px-2 py-1 rounded bg-black/80 text-indigo-300 font-bold shadow">
 I
 </kbd>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-white/5 border-[var(--hair)] flex items-center justify-between">
 <span className="text-[var(--ink-3)]">Fijar Cue Out (Fin Bucle)</span>
 <kbd className="px-2 py-1 rounded bg-black/80 text-purple-300 font-bold shadow">
 O
 </kbd>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-white/5 border-[var(--hair)] flex items-center justify-between">
 <span className="text-[var(--ink-3)]">Grabar Pista Overdub</span>
 <kbd className="px-2 py-1 rounded bg-black/80 text-rose-300 font-bold shadow">
 R / Numpad *
 </kbd>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-white/5 border-[var(--hair)] flex items-center justify-between">
 <span className="text-[var(--ink-3)]">Nueva Idea / Proyecto</span>
 <kbd className="px-2 py-1 rounded bg-black/80 text-emerald-300 font-bold shadow">
 N
 </kbd>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-white/5 border-[var(--hair)] flex items-center justify-between">
 <span className="text-[var(--ink-3)]">Retroceder 5s / 15s</span>
 <kbd className="px-2 py-1 rounded bg-black/80 text-purple-300 font-bold shadow">
 ← / Shift + ←
 </kbd>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-white/5 border-[var(--hair)] flex items-center justify-between">
 <span className="text-[var(--ink-3)]">Avanzar 5s / 15s</span>
 <kbd className="px-2 py-1 rounded bg-black/80 text-purple-300 font-bold shadow">
 → / Shift + →
 </kbd>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-white/5 border-[var(--hair)] flex items-center justify-between">
 <span className="text-[var(--ink-3)]">Alternar Silencio (Mute)</span>
 <kbd className="px-2 py-1 rounded bg-black/80 text-amber-300 font-bold shadow">
 M
 </kbd>
 </div>

 <div className="p-3 rounded-[var(--r-m)] bg-white/5 border-[var(--hair)] flex items-center justify-between">
 <span className="text-[var(--ink-3)]">Alternar Solo</span>
 <kbd className="px-2 py-1 rounded bg-black/80 text-amber-300 font-bold shadow">
 S
 </kbd>
 </div>
 </div>

 <div className="pt-2 flex items-center justify-between border-t border-[var(--hair)]">
 <span className="text-[11px] text-neutral-500 font-mono">
 💡 Presiona <kbd className="px-1 py-0.5 rounded bg-black/50 border-[var(--hair)] text-[var(--ink-3)]">K</kbd> o <kbd className="px-1 py-0.5 rounded bg-black/50 border-[var(--hair)] text-[var(--ink-3)]">?</kbd> en cualquier momento para abrir este menú.
 </span>
 <button
 type="button"
 onClick={onClose}
 className="px-5 py-2 rounded-[var(--r-m)] text-xs font-bold text-white bg-purple-600 hover:bg-purple-500 transition-all cursor-pointer shadow-lg"
 >
 Entendido
 </button>
 </div>
 </div>
 </div>
 </ModalPortal>
 );
};
