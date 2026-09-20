import React from 'react';
import { Globe, Check, Sparkles, Languages, MessageSquareText, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from '../../../context/LanguageContext';

interface StepLanguageProps {
 language: string;
 setLanguage: (lang: string) => void;
 onContinue?: () => void;
}

const LANGUAGE_DETAILS: Record<SupportedLanguage, {
 nativeName: string;
 region: string;
 description: string;
 aiNote: string;
}> = {
 es: {
 nativeName: 'Español (Castellano)',
 region: 'España & Latinoamérica',
 description: 'Panel de control, asistentes de IA y dossier en castellano.',
 aiNote: 'Propuestas de booking redactadas con tono profesional y coloquial español.'
 },
 en: {
 nativeName: 'English (International)',
 region: 'UK, US, Europe & International Touring',
 description: 'Interface, AI agents and press kit in English for international booking.',
 aiNote: 'Booking pitches and email threads optimized for European and worldwide festivals.'
 },
 ca: {
 nativeName: 'Català',
 region: 'Catalunya, Illes Balears & Comunitat Valenciana',
 description: 'Panell en català, comunicacions de sales i dossier per al circuit català.',
 aiNote: 'Redacció i propostes adaptades al circuit de festes majors i sales catalanes.'
 },
 gl: {
 nativeName: 'Galego',
 region: 'Galicia & Circuíto Galego de Música',
 description: 'Panel en galego, axentes de booking e dossier de prensa.',
 aiNote: 'Comunicacións e propostas optimizadas para salas e festivais galegos.'
 },
 eu: {
 nativeName: 'Euskara',
 region: 'Euskal Herria & Nafarroa',
 description: 'Panela euskaraz, kudeaketa eta prentsa-dosierra.',
 aiNote: 'Euskal zirkuiturako eta jaialdietarako egokitutako proposamenak.'
 }
};

export const StepLanguage: React.FC<StepLanguageProps> = ({
 language,
 setLanguage,
 onContinue,
}) => {
 const { language: currentAppLang, setLanguage: setAppLang } = useLanguage();

 const handleSelectLanguage = (langCode: SupportedLanguage, langLabel: string) => {
 setAppLang(langCode);
 setLanguage(langLabel);
 };

 return (
 <div className="space-y-6 animate-in fade-in duration-200">
 {/* Header Banner */}
 <div className="p-4 sm:p-5 rounded-[var(--r-l)] bg-gradient-to-br from-amber-500/15 via-[#181614] to-[#121110] shadow-xl shadow-amber-500/5">
 <div className="flex items-start gap-3.5">
 <div className="w-10 h-10 rounded-[var(--r-m)] bg-amber-500/20 text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
 <Globe className="w-5 h-5 text-amber-400" />
 </div>
 <div className="space-y-1">
 <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold uppercase tracking-wider">
 <Sparkles className="w-3 h-3 text-amber-400" />
 <span>Primer Paso Obligatorio / First Step</span>
 </div>
 <h3 className="text-base sm:text-lg font-bold font-display text-white">
 ¿En qué idioma quieres trabajar con tu banda?
 </h3>
 <p className="text-xs sm:text-sm text-text-[var(--ink-3)] leading-relaxed">
 Selecciona tu idioma principal. Esta configuración adapta al instante la interfaz, el estilo de redacción de los agentes de IA y tu dossier de prensa oficial.
 </p>
 </div>
 </div>
 </div>

 {/* Language Cards Grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {SUPPORTED_LANGUAGES.map((lang) => {
 const isSelected =
 currentAppLang === lang.code ||
 language.toLowerCase().includes(lang.label.toLowerCase()) ||
 (lang.code === 'es' && language.toLowerCase() === 'español') ||
 (lang.code === 'en' && (language.toLowerCase() === 'english' || language.toLowerCase() === 'inglés'));

 const details = LANGUAGE_DETAILS[lang.code] || {
 nativeName: lang.label,
 region: 'Global',
 description: 'Idioma para la plataforma y comunicaciones.',
 aiNote: 'Generación de contenido adaptada.'
 };

 return (
 <div
 key={lang.code}
 role="button"
 tabIndex={0}
 onClick={() => handleSelectLanguage(lang.code, lang.label)}
 onKeyDown={(e) => {
 if (e.key === 'Enter' || e.key === ' ') {
 e.preventDefault();
 handleSelectLanguage(lang.code, lang.label);
 }
 }}
 className={`relative p-4 rounded-[var(--r-l)] text-left transition-all cursor-pointer flex flex-col justify-between gap-3 ${
 isSelected
 ? 'bg-gradient-to-br from-amber-500/20 via-amber-950/20 to-bg-[var(--surface)]/90 ring-2 ring-amber-500/30 shadow-lg shadow-amber-500/10 scale-[1.01]'
 : 'bg-[#181614]/90 hover:bg-[#201d19] border-white/10 hover:border-white/20'
 }`}
 >
 {/* Top Row: Flag & Name */}
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-3">
 <span className="text-2xl sm:text-3xl" role="img" aria-label={lang.label}>
 {lang.flag}
 </span>
 <div>
 <div className="flex items-center gap-2">
 <h4 className={`text-sm sm:text-base font-bold transition-colors ${isSelected ? 'text-amber-300' : 'text-white'}`}>
 {lang.label}
 </h4>
 {isSelected && (
 <span className="px-1.5 py-0.5 rounded bg-amber-400 text-stone-950 text-[9px] font-mono font-extrabold uppercase">
 Activo
 </span>
 )}
 </div>
 <p className="text-[11px] text-text-[var(--ink-2)] font-mono">
 {details.nativeName}
 </p>
 </div>
 </div>

 <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
 isSelected 
 ? 'bg-amber-400 text-stone-950' 
 : 'border-white/20 bg-neutral-800/40 text-transparent'
 }`}>
 <Check className="w-3.5 h-3.5 stroke-[3]" />
 </div>
 </div>

 {/* Bottom Row: Details & AI Note */}
 <div className="space-y-1.5 pt-2 border-t border-white/5">
 <p className="text-xs text-text-[var(--ink-3)] leading-snug">
 {details.description}
 </p>
 <div className="flex items-center gap-1.5 text-[11px] text-amber-300/80 font-mono">
 <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
 <span className="truncate">{details.aiNote}</span>
 </div>
 </div>
 </div>
 );
 })}
 </div>

 {/* Impact Breakdown Cards */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
 <div className="p-3.5 rounded-[var(--r-m)] bg-[#141312] border-[#262320] flex items-start gap-2.5">
 <div className="p-2 rounded-[var(--r-s)] bg-amber-500/10 text-amber-400 shrink-0">
 <Languages className="w-4 h-4" />
 </div>
 <div>
 <h5 className="text-xs font-bold text-bg-[var(--sunken)]">Panel & Menús</h5>
 <p className="text-[11px] text-text-[var(--ink-2)] mt-0.5 leading-relaxed">
 Todos los módulos, botones y tablas cambian de inmediato en tiempo real.
 </p>
 </div>
 </div>

 <div className="p-3.5 rounded-[var(--r-m)] bg-[#141312] border-[#262320] flex items-start gap-2.5">
 <div className="p-2 rounded-[var(--r-s)] bg-sky-500/10 text-sky-400 shrink-0">
 <MessageSquareText className="w-4 h-4" />
 </div>
 <div>
 <h5 className="text-xs font-bold text-bg-[var(--sunken)]">Agentes de IA</h5>
 <p className="text-[11px] text-text-[var(--ink-2)] mt-0.5 leading-relaxed">
 Redacción de propuestas y respuestas a salas afinadas según el idioma seleccionado.
 </p>
 </div>
 </div>

 <div className="p-3.5 rounded-[var(--r-m)] bg-[#141312] border-[#262320] flex items-start gap-2.5">
 <div className="p-2 rounded-[var(--r-s)] bg-emerald-500/10 text-emerald-400 shrink-0">
 <FileText className="w-4 h-4" />
 </div>
 <div>
 <h5 className="text-xs font-bold text-bg-[var(--sunken)]">Dossier EPK</h5>
 <p className="text-[11px] text-text-[var(--ink-2)] mt-0.5 leading-relaxed">
 Biografía oficial y fichas técnicas generadas con este idioma por defecto.
 </p>
 </div>
 </div>
 </div>
 </div>
 );
};
