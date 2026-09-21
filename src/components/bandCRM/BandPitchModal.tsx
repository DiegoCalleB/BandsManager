import React, { useState } from 'react';
import { BandContact } from '../../types';
import { Repeat, X, Check, Copy, MessageCircle, Send } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';

interface BandPitchModalProps {
 isOpen: boolean;
 onClose: () => void;
 band: BandContact | null;
 activeCampaign?: any;
 proposedBakandeyaCity:'Madrid' |'Sevilla' |'Ambas';
 setProposedBakandeyaCity: (val:'Madrid' |'Sevilla' |'Ambas') => void;
 proposedVenueBakandeya: string;
 setProposedVenueBakandeya: (val: string) => void;
 proposedMonth: string;
 setProposedMonth: (val: string) => void;
 generatePitchText: (band: BandContact) => string;
 customPitchText?: string;
}

export const BandPitchModal: React.FC<BandPitchModalProps> = ({
 isOpen,
 onClose,
 band,
 activeCampaign,
 proposedBakandeyaCity,
 setProposedBakandeyaCity,
 proposedVenueBakandeya,
 setProposedVenueBakandeya,
 proposedMonth,
 setProposedMonth,
 generatePitchText,
 customPitchText
}) => {
 const [copiedPitch, setCopiedPitch] = useState(false);

 if (!isOpen || !band) return null;

 const pitchText = customPitchText || generatePitchText(band);

 return (
 <ModalPortal isOpen={isOpen} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/85 flex items-center justify-center p-4 overflow-y-auto overscroll-contain">
 <div className={`w-full max-w-2xl rounded-[var(--r-l)] p-6 space-y-5 relative overflow-hidden my-auto max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200 ${
 'bg-[var(--surface)] text-[var(--ink)]'
 }`}>
 <div className="flex items-center justify-between pb-3">
 <div className="flex items-center gap-2">
 <Repeat className="w-5 h-5 text-[var(--acc)]" />
 <h3 className="text-base font-bold font-display tracking-wider text-[var(--acc)]">
 Generador de Pitch Date Swap: Bakandeya x {band.nombre_banda}
 </h3>
 </div>
 <button 
 onClick={onClose}
 className="p-1 hover:bg-[var(--surface)]/80 rounded-[var(--r-s)] transition-colors cursor-pointer"
 >
 <X className="w-5 h-5 text-[var(--ink-2)]" />
 </button>
 </div>

 {/* Config Fields */}
 {!activeCampaign?.isActive && (
 <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-[var(--r-m)] bg-[var(--surface)] text-[10px] font-sans">
 <div>
 <label className="block text-[10px] text-[var(--ink-2)] mb-1">Ciudad de Bakandeya</label>
 <select
 value={proposedBakandeyaCity}
 onChange={(e) => setProposedBakandeyaCity(e.target.value as'Madrid' |'Sevilla' |'Ambas')}
 className="w-full bg-[var(--surface)]/80 text-[var(--ink)] px-2 py-1 rounded-[var(--r-s)] text-[10px]"
 >
 <option value="Madrid">Madrid</option>
 <option value="Sevilla">Sevilla</option>
 <option value="Ambas">Madrid & Sevilla</option>
 </select>
 </div>

 <div>
 <label className="block text-[10px] text-[var(--ink-2)] mb-1">Sala propuesta en Madrid/Sevilla</label>
 <input
 type="text"
 value={proposedVenueBakandeya}
 onChange={(e) => setProposedVenueBakandeya(e.target.value)}
 className="w-full bg-[var(--surface)]/80 text-[var(--ink)] px-2 py-1 rounded-[var(--r-s)] text-[10px]"
 />
 </div>

 <div>
 <label className="block text-[10px] text-[var(--ink-2)] mb-1">Periodo / Mes Estimado</label>
 <input
 type="text"
 value={proposedMonth}
 onChange={(e) => setProposedMonth(e.target.value)}
 className="w-full bg-[var(--surface)]/80 text-[var(--ink)] px-2 py-1 rounded-[var(--r-s)] text-[10px]"
 />
 </div>
 </div>
 )}

 {/* Generated Pitch Preview Box */}
 <div className="space-y-1.5">
 <label className="block text-[10px] font-sans tracking-wider text-[var(--acc)] flex items-center justify-between">
 <span>Mensaje de Propuesta Generado (Músico a Músico)</span>
 <span className="text-[10px] text-[var(--ink-2)] lowercase">editable & listo para enviar</span>
 </label>

 <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] text-[10px] font-sans text-[var(--ink-2)] whitespace-pre-wrap leading-relaxed select-text max-h-72 overflow-y-auto">
 {pitchText}
 </div>
 </div>

 {/* Actions Bar */}
 <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
 <div className="text-[10px] font-sans text-[var(--ink-2)]">
 Destinatario: <strong className="text-[var(--ink)]">{band.contacto_nombre || band.nombre_banda}</strong>
 </div>

 <div className="flex items-center gap-2">
 {/* Copy to Clipboard */}
 <button
 onClick={() => {
 navigator.clipboard.writeText(pitchText);
 setCopiedPitch(true);
 setTimeout(() => setCopiedPitch(false), 2000);
 }}
 className="px-2 py-1 bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] rounded-[var(--r-m)] font-sans text-[10px] transition-all cursor-pointer flex items-center gap-1.5"
 >
 {copiedPitch ? <Check className="w-4 h-4 text-[var(--ok)]" /> : <Copy className="w-4 h-4" />}
 <span>{copiedPitch ?'¡Copiado! ':'Copiar Texto'}</span>
 </button>

 {/* WhatsApp Link if phone is present */}
 {band.telefono && (
 <a
 href={`https://wa.me/${band.telefono.replace(/[^0-9]/g,'')}?text=${encodeURIComponent(pitchText)}`}
 target="_blank"
 rel="noreferrer"
 className="px-2 py-1 bg-[var(--surface)]/15 hover:bg-[var(--surface)]/15 text-[var(--ink)] font-sans text-[10px] font-bold rounded-[var(--r-m)] transition-all cursor-pointer flex items-center gap-1.5"
 >
 <MessageCircle className="w-4 h-4" />
 <span>Enviar WhatsApp</span>
 </a>
 )}

 {/* Mailto Link if email is present */}
 {band.email && (
 <a
 href={`mailto:${band.email}?subject=${encodeURIComponent(`Propuesta Date Swap: Bakandeya x ${band.nombre_banda}`)}&body=${encodeURIComponent(pitchText)}`}
 className="px-2 py-1 bg-[var(--acc)]/15 hover:bg-[var(--acc)]/15 text-[var(--ink)] font-sans text-[10px] font-bold rounded-[var(--r-m)] transition-all cursor-pointer flex items-center gap-1.5"
 >
 <Send className="w-4 h-4" />
 <span>Enviar Email</span>
 </a>
 )}
 </div>
 </div>
 </div>
 </div>
 </ModalPortal>
 );
};
