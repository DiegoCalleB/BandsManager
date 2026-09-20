import React, { useState } from'react';
import { 
 X, Smartphone, Monitor, Globe2, Sparkles, RefreshCw, 
 Eye, CheckCircle2, Calendar, FileText
} from'lucide-react';
import { FansLanding } from'./FansLanding';
import { Concert, EPKConfig } from'../types';
import { FAN_FORM_LANGUAGES, FanFormLanguage, DEFAULT_FAN_FORM_LANGUAGE, FAN_FORM_TRANSLATIONS, interpolate } from'../i18n/fansTranslations';

interface FansLandingPreviewModalProps {
 isOpen: boolean;
 onClose: () => void;
 currentBandId?: string;
 currentBandName?: string;
 currentBandLogo?: string;
 epkConfig?: Partial<EPKConfig>;
 concerts?: Concert[];
 initialConcertId?: string;
 initialLanguage?: FanFormLanguage;
}

export const FansLandingPreviewModal: React.FC<FansLandingPreviewModalProps> = ({
 isOpen,
 onClose,
 currentBandId,
 currentBandName,
 currentBandLogo,
 epkConfig,
 concerts = [],
 initialConcertId,
 initialLanguage = DEFAULT_FAN_FORM_LANGUAGE
}) => {
 const [deviceMode, setDeviceMode] = useState<'mobile' |'desktop'>('mobile');
 const [selectedLanguage, setSelectedLanguage] = useState<FanFormLanguage>(initialLanguage);
 const [selectedConcertId, setSelectedConcertId] = useState<string>(initialConcertId ||'');
 const [previewScreen, setPreviewScreen] = useState<'form' |'success'>('form');
 const [simKey, setSimKey] = useState<number>(0);

 if (!isOpen) return null;

 const dict = FAN_FORM_TRANSLATIONS[selectedLanguage] || FAN_FORM_TRANSLATIONS.es;
 const t = (key: keyof typeof dict, vars?: Record<string, string | undefined>) =>
 vars ? interpolate(dict[key] ||'', vars) : (dict[key] ||'');

 const selectedConcert = concerts.find(c => c.id === selectedConcertId) || null;
 const effectiveBandName = currentBandName || epkConfig?.contactoBooking?.nombre || (currentBandId?.includes('bakandeya') ?'Bakandeya' :'Tu Banda');

 const handleReset = () => {
 setSimKey(prev => prev + 1);
 setPreviewScreen('form');
 };

 return (
 <div 
 id="fans-landing-preview-modal"
 className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col h-[100dvh] w-screen animate-fade-in overflow-hidden select-none"
 >
 {/* BARRA SUPERIOR PRINCIPAL (DESKTOP & MOBILE) */}
 <header className="w-full bg-[var(--surface)] border-b border-[var(--hair)] px-3 sm:px-5 py-2.5 shrink-0 z-30 shadow-2xl flex items-center justify-between gap-2">
 {/* Lado Izquierdo: Título y Estado */}
 <div className="flex items-center gap-2.5 min-w-0">
 <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/15 flex items-center justify-center text-[var(--acc)] shrink-0">
 <Eye className="w-4 h-4" />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <h2 className="text-xs sm:text-sm font-bold text-[var(--ink)] font-display uppercase tracking-wider truncate">
 {t('previewModalTitle')}
 </h2>
 <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--acc)]/15 text-[var(--acc)]/70 font-bold">
 <Sparkles className="w-3 h-3 text-[var(--acc)]" />
 {t('previewProductionSyncBadge')}
 </span>
 </div>
 <p className="text-[10px] text-[var(--ink-2)] font-mono truncate hidden sm:block">
 {effectiveBandName} • {selectedConcert ? `${selectedConcert.sala} (${selectedConcert.ciudad})` :'Bio / Enlace General'}
 </p>
 </div>
 </div>

 {/* Centro (en pantallas medianas y grandes): Controles Principales */}
 <div className="hidden lg:flex items-center gap-2">
 {/* Selector de Pantalla / Estado */}
 <div className="flex bg-[var(--surface)] rounded-[var(--r-m)] p-1 shadow-inner">
 <button
 type="button"
 onClick={() => setPreviewScreen('form')}
 className={`flex items-center gap-1.5 px-3 py-1 rounded-[var(--r-s)] text-xs font-mono font-bold transition-all cursor-pointer ${
 previewScreen ==='form'
 ?'bg-[var(--acc)] text-[var(--ink)] shadow-md font-extrabold'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <FileText className="w-3.5 h-3.5" />
 <span>{t('previewTabForm')}</span>
 </button>
 <button
 type="button"
 onClick={() => setPreviewScreen('success')}
 className={`flex items-center gap-1.5 px-3 py-1 rounded-[var(--r-s)] text-xs font-mono font-bold transition-all cursor-pointer ${
 previewScreen ==='success'
 ?'bg-emerald-500 text-[var(--ink)] shadow-md font-extrabold'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 >
 <CheckCircle2 className="w-3.5 h-3.5" />
 <span>{t('previewTabSuccess')}</span>
 </button>
 </div>

 {/* Selector de Dispositivo */}
 <div className="flex bg-[var(--surface)] rounded-[var(--r-m)] p-1 shadow-inner">
 <button
 type="button"
 onClick={() => setDeviceMode('mobile')}
 className={`flex items-center gap-1 px-2.5 py-1 rounded-[var(--r-s)] text-xs font-mono font-bold transition-all cursor-pointer ${
 deviceMode ==='mobile'
 ?'bg-[var(--surface)]/80 text-[var(--acc)]/70'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title={t('previewMobile')}
 >
 <Smartphone className="w-3.5 h-3.5" />
 <span>{t('previewMobile')}</span>
 </button>
 <button
 type="button"
 onClick={() => setDeviceMode('desktop')}
 className={`flex items-center gap-1 px-2.5 py-1 rounded-[var(--r-s)] text-xs font-mono font-bold transition-all cursor-pointer ${
 deviceMode ==='desktop'
 ?'bg-[var(--surface)]/80 text-[var(--acc)]/70'
 :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title={t('previewDesktop')}
 >
 <Monitor className="w-3.5 h-3.5" />
 <span>{t('previewDesktop')}</span>
 </button>
 </div>

 {/* Selector de Idioma */}
 <div className="flex items-center bg-[var(--surface)] rounded-[var(--r-m)] p-1 gap-1 shadow-inner">
 <Globe2 className="w-3 h-3 text-[var(--ink-2)] ml-1 mr-0.5" />
 {FAN_FORM_LANGUAGES.map(l => (
 <button
 key={l.code}
 type="button"
 onClick={() => setSelectedLanguage(l.code)}
 className={`px-2 py-0.5 rounded-[var(--r-s)] text-xs font-mono transition-all cursor-pointer ${
 selectedLanguage === l.code
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 font-bold shadow-inner'
 :'text-[var(--ink-2)] hover:text-[var(--ink)] opacity-75 hover:opacity-100'
 }`}
 title={l.label}
 >
 <span>{l.flag}</span>
 <span className="ml-1 uppercase text-[10px]">{l.code}</span>
 </button>
 ))}
 </div>

 {/* Selector de Concierto */}
 {concerts.length > 0 && (
 <div className="flex items-center bg-[var(--surface)] rounded-[var(--r-m)] px-2.5 py-1">
 <Calendar className="w-3.5 h-3.5 text-[var(--acc)] mr-1.5 shrink-0" />
 <select
 value={selectedConcertId}
 onChange={e => setSelectedConcertId(e.target.value)}
 className="bg-transparent text-xs font-mono text-[var(--sunken)] outline-none cursor-pointer max-w-[160px] truncate"
 >
 <option value="" className="bg-[var(--surface)] text-[var(--sunken)]">
 {t('previewGeneralConcert')}
 </option>
 {concerts.map(c => (
 <option key={c.id} value={c.id} className="bg-[var(--surface)] text-[var(--sunken)]">
 {c.ciudad} - {c.sala}
 </option>
 ))}
 </select>
 </div>
 )}
 </div>

 {/* Lado Derecho: Acciones Rápidas */}
 <div className="flex items-center gap-2 shrink-0">
 <button
 type="button"
 onClick={handleReset}
 className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)]/80 text-[var(--ink-3)] hover:text-[var(--ink)] transition cursor-pointer text-xs font-mono"
 title={t('previewReset')}
 >
 <RefreshCw className="w-3.5 h-3.5" />
 <span className="hidden sm:inline">{t('previewReset')}</span>
 </button>

 <button
 type="button"
 onClick={onClose}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] font-bold transition cursor-pointer text-xs font-mono shadow-md active:scale-95"
 title={t('previewClose')}
 >
 <X className="w-4 h-4" />
 <span>{t('previewClose')}</span>
 </button>
 </div>
 </header>

 {/* BARRA SECUNDARIA DE CONTROLES COMPACTA PARA MÓVIL / TABLET */}
 <div className="lg:hidden w-full bg-[var(--surface)] border-b border-[var(--hair)] px-3 py-1.5 flex items-center justify-between gap-2 shrink-0 overflow-x-auto z-20">
 {/* Selector de Pantalla */}
 <div className="flex bg-[var(--surface)] rounded-[var(--r-s)] p-0.5 shrink-0">
 <button
 type="button"
 onClick={() => setPreviewScreen('form')}
 className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all ${
 previewScreen ==='form'
 ?'bg-[var(--acc)] text-[var(--ink)]'
 :'text-[var(--ink-2)]'
 }`}
 >
 {t('previewTabForm')}
 </button>
 <button
 type="button"
 onClick={() => setPreviewScreen('success')}
 className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold transition-all ${
 previewScreen ==='success'
 ?'bg-emerald-500 text-[var(--ink)]'
 :'text-[var(--ink-2)]'
 }`}
 >
 {t('previewTabSuccess')}
 </button>
 </div>

 {/* Selector de Dispositivo */}
 <div className="flex bg-[var(--surface)] rounded-[var(--r-s)] p-0.5 shrink-0">
 <button
 type="button"
 onClick={() => setDeviceMode('mobile')}
 className={`p-1 rounded text-xs transition-all ${
 deviceMode ==='mobile' ?'bg-[var(--surface)]/80 text-[var(--acc)]/70' :'text-[var(--ink-2)]'
 }`}
 >
 <Smartphone className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() => setDeviceMode('desktop')}
 className={`p-1 rounded text-xs transition-all ${
 deviceMode ==='desktop' ?'bg-[var(--surface)]/80 text-[var(--acc)]/70' :'text-[var(--ink-2)]'
 }`}
 >
 <Monitor className="w-3.5 h-3.5" />
 </button>
 </div>

 {/* Idiomas en móvil */}
 <div className="flex items-center gap-1 bg-[var(--surface)] rounded-[var(--r-s)] p-0.5 shrink-0">
 {FAN_FORM_LANGUAGES.map(l => (
 <button
 key={l.code}
 type="button"
 onClick={() => setSelectedLanguage(l.code)}
 className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${
 selectedLanguage === l.code
 ?'bg-[var(--acc)]/20 text-[var(--acc)]/70 font-bold'
 :'text-[var(--ink-2)] opacity-60'
 }`}
 >
 {l.flag}
 </button>
 ))}
 </div>
 </div>

 {/* ÁREA DE VISUALIZACIÓN / SIMULADOR CENTRADO */}
 <main className="w-full flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 flex items-center justify-center bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[var(--surface)] via-[#100f0f] to-[#0a0a0a]">
 {deviceMode ==='mobile' ? (
 /* MOCKUP ELEGANTE DE SMARTPHONE */
 <div className="relative w-full max-w-[400px] mx-auto my-auto flex flex-col items-center justify-center transition-all duration-200">
 {/* Chasis exterior del smartphone */}
 <div className="relative w-full rounded-[38px] p-2 sm:p-2.5 bg-gradient-to-b from-[#2e2d2b] via-[#1c1b1a] to-[var(--bg)] shadow-[0_20px_50px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.06)] border-[var(--hair)]/80">
 {/* Dynamic Island / Altavoz */}
 <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-20 h-3 bg-black rounded-full z-30 flex items-center justify-center pointer-events-none opacity-80">
 <div className="w-2 h-2 rounded-full bg-[var(--surface)] border-[var(--hair)]" />
 </div>

 {/* Pantalla del teléfono con altura adaptativa y scroll nativo */}
 <div className="relative w-full h-[calc(100dvh-170px)] sm:h-[calc(100dvh-150px)] max-h-[700px] min-h-[460px] bg-[var(--bg)] rounded-[30px] overflow-y-auto overflow-x-hidden pt-4 border-[var(--surface)] shadow-inner">
 <FansLanding
 key={`mobile-${simKey}-${selectedLanguage}-${selectedConcertId}-${previewScreen}`}
 currentBandId={currentBandId}
 currentBandName={effectiveBandName}
 currentBandLogo={currentBandLogo}
 isPreview={true}
 previewLanguage={selectedLanguage}
 previewConfig={epkConfig}
 previewConcert={selectedConcert}
 previewConcertName={selectedConcert ? `${selectedConcert.sala} (${selectedConcert.ciudad})` :''}
 previewView={previewScreen}
 onClosePreview={onClose}
 />
 </div>

 {/* Barra inferior de gestos */}
 <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/20 rounded-full z-30 pointer-events-none" />
 </div>
 </div>
 ) : (
 /* MOCKUP DE ESCRITORIO / NAVEGADOR */
 <div className="w-full max-w-4xl bg-[var(--bg)] rounded-[var(--r-l)] shadow-2xl overflow-hidden my-auto flex flex-col h-[calc(100dvh-160px)] max-h-[740px]">
 {/* Barra simulada de navegador */}
 <div className="bg-[var(--surface)] border-b px-4 py-2 flex items-center justify-between gap-3 text-xs font-mono shrink-0">
 <div className="flex items-center gap-1.5">
 <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
 <div className="w-2.5 h-2.5 rounded-full bg-[var(--acc)]/80" />
 <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
 </div>
 <div className="bg-[var(--surface)] rounded-[var(--r-s)] px-3 py-1 text-[var(--ink-2)] text-[11px] flex-1 max-w-md text-center truncate font-mono">
 https://bandmanager.io/unete{selectedConcert ? `/${selectedConcert.ciudad.toLowerCase()}-${selectedConcert.sala.toLowerCase().replace(/\s+/g,'-')}` :''}?lang={selectedLanguage}
 </div>
 <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">
 HTTPS
 </span>
 </div>

 {/* Contenido de la Landing en Desktop */}
 <div className="flex-1 overflow-y-auto">
 <FansLanding
 key={`desktop-${simKey}-${selectedLanguage}-${selectedConcertId}-${previewScreen}`}
 currentBandId={currentBandId}
 currentBandName={effectiveBandName}
 currentBandLogo={currentBandLogo}
 isPreview={true}
 previewLanguage={selectedLanguage}
 previewConfig={epkConfig}
 previewConcert={selectedConcert}
 previewConcertName={selectedConcert ? `${selectedConcert.sala} (${selectedConcert.ciudad})` :''}
 previewView={previewScreen}
 onClosePreview={onClose}
 />
 </div>
 </div>
 )}
 </main>

 {/* PIE DE PÁGINA INFORMATIVO Y ACCESIBLE */}
 <footer className="w-full bg-[var(--surface)] border-t border-[var(--hair)] px-3 sm:px-4 py-1.5 text-center text-[10px] sm:text-[11px] font-mono text-[var(--ink-2)] shrink-0 flex items-center justify-between">
 <div className="flex items-center gap-2 truncate">
 <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0 inline-block" />
 <span className="truncate">{t('previewDisclaimer')}</span>
 </div>
 <button
 type="button"
 onClick={onClose}
 className="text-[var(--acc)] hover:text-[var(--acc)]/70 font-bold underline ml-2 shrink-0 cursor-pointer text-xs"
 >
 {t('previewClose')}
 </button>
 </footer>
 </div>
 );
};
