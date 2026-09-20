import React, { useState, useRef, useEffect } from'react';
import { useLanguage, SUPPORTED_LANGUAGES, SupportedLanguage } from'../context/LanguageContext';
import { Globe, ChevronDown, Check } from'lucide-react';

interface LanguageSelectorProps {
 compact?: boolean;
 className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({ compact = false, className ='' }) => {
 const { language, setLanguage } = useLanguage();
 const [isOpen, setIsOpen] = useState(false);
 const dropdownRef = useRef<HTMLDivElement>(null);

 const currentLangObj = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];

 useEffect(() => {
 const handleClickOutside = (event: MouseEvent) => {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
 setIsOpen(false);
 }
 };
 document.addEventListener('mousedown', handleClickOutside);
 return () => document.removeEventListener('mousedown', handleClickOutside);
 }, []);

 return (
 <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
 <button
 type="button"
 onClick={() => setIsOpen(!isOpen)}
 className={`flex items-center gap-2 px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
 isOpen
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 /40 shadow-xs'
 :'bg-[var(--sunken)] text-[var(--ink-2)] border-[var(--surface)] hover:bg-[var(--surface)] hover:text-[var(--ink)]'
 }`}
 title="Cambiar idioma / Change language"
 >
 <span className="text-sm leading-none">{currentLangObj.flag}</span>
 {!compact && <span className="font-sans font-bold text-xs">{currentLangObj.label}</span>}
 <span className="text-[10px] text-[var(--acc)]/90 font-sans">({currentLangObj.code})</span>
 <ChevronDown className={`w-3.5 h-3.5 text-[var(--ink-2)] transition-transform duration-200 ${isOpen ?'rotate-180 text-[var(--acc)]' :''}`} />
 </button>

 {isOpen && (
 <div className="absolute right-0 mt-2 w-44 rounded-[var(--r-m)] bg-[var(--bg)] border-[var(--surface)] shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in zoom-in-95 duration-100">
 <div className="px-3 py-1.5 border-b border-[var(--surface)]/60 text-[10px] font-sans font-bold tracking-wider text-[var(--ink-2)] flex items-center gap-1.5">
 <Globe className="w-3 h-3 text-[var(--acc)]" />
 <span>Seleccionar Idioma</span>
 </div>
 <div className="py-1">
 {SUPPORTED_LANGUAGES.map((lang) => {
 const isSelected = lang.code === language;
 return (
 <button
 key={lang.code}
 type="button"
 onMouseDown={(e) => {
 e.preventDefault();
 setLanguage(lang.code);
 setIsOpen(false);
 }}
 onClick={() => {
 setLanguage(lang.code);
 setIsOpen(false);
 }}
 className={`w-full flex items-center justify-between px-3 py-2 text-xs font-sans text-left transition-colors cursor-pointer ${
 isSelected
 ?'bg-[var(--acc)]/15 text-[var(--acc)]/70 font-bold'
 :'text-[var(--ink-2)] hover:bg-[var(--sunken)] hover:text-[var(--ink)]'
 }`}
 >
 <div className="flex items-center gap-2.5">
 <span className="text-base leading-none">{lang.flag}</span>
 <span>{lang.label}</span>
 </div>
 {isSelected && <Check className="w-3.5 h-3.5 text-[var(--acc)]" />}
 </button>
 );
 })}
 </div>
 </div>
 )}
 </div>
 );
};
