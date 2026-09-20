import React, { useState, useMemo } from'react';
import {
 Music,
 Sparkles,
 QrCode,
 FileText,
 Rocket,
 CheckCircle2,
 ArrowLeft,
 Check, 
 Loader2, 
 MessageSquare, 
 Users, 
 Radio, 
 ExternalLink,
 ShieldCheck,
 ChevronDown,
 ChevronUp,
 Sliders
} from'lucide-react';
import { 
 FanFormLanguage, 
 DEFAULT_FAN_FORM_LANGUAGE, 
 FAN_FORM_LANGUAGES, 
 isFanFormLanguage,
 idiomasDisponiblesParaConcierto
} from'../i18n/fansTranslations';
import { 
 getMusiciansTranslations, 
 MusiciansLandingDict 
} from'../i18n/musiciansTranslations';

export const PublicMusiciansLanding: React.FC = () => {
 // 1. Detect language from query params or browser
 const initialLang = useMemo<FanFormLanguage>(() => {
 if (typeof window ==='undefined') return DEFAULT_FAN_FORM_LANGUAGE;
 const params = new URLSearchParams(window.location.search);
 const langParam = params.get('lang')?.toLowerCase();
 if (isFanFormLanguage(langParam)) return langParam;
 return DEFAULT_FAN_FORM_LANGUAGE;
 }, []);

 const [currentLang, setCurrentLang] = useState<FanFormLanguage>(initialLang);
 const t: MusiciansLandingDict = useMemo(() => getMusiciansTranslations(currentLang), [currentLang]);

 // Regla contextual de idiomas (idéntica a FansLanding y Dossier EPK):
 // - Si el idioma es italiano ('it'): Italia (🇮🇹), UK (🇬🇧) y España (🇪🇸).
 // - Si es español ('es') o inglés ('en'): España (🇪🇸) y UK (🇬🇧).
 // - Si es checo ('cs'): Chequia (🇨🇿), UK (🇬🇧) y España (🇪🇸).
 const baseLangForFlags = (currentLang ==='it' || currentLang ==='cs')
 ? currentLang
 : ((initialLang ==='it' || initialLang ==='cs') ? initialLang : currentLang);
 const availableCodes = useMemo(() => idiomasDisponiblesParaConcierto(baseLangForFlags), [baseLangForFlags]);
 const availableLanguages = useMemo(() => {
 return FAN_FORM_LANGUAGES.filter(l => availableCodes.includes(l.code))
 .sort((a, b) => availableCodes.indexOf(a.code) - availableCodes.indexOf(b.code));
 }, [availableCodes]);

 // Contextual params (if opened from another band's fan page)
 const originInfo = useMemo(() => {
 if (typeof window ==='undefined') return { fromBand:'', fromConcert:'' };
 const params = new URLSearchParams(window.location.search);
 return {
 fromBand: params.get('from_band') || params.get('band') ||'',
 fromConcert: params.get('from_concert') || params.get('concert') ||''
 };
 }, []);

 // Form State
 const [formData, setFormData] = useState({
 nombreBanda:'',
 nombreContacto:'',
 email:'',
 instagram:'',
 telefono:'',
 ciudad:'',
 genero:'',
 enlaceMusica:'',
 interesPrincipal:'',
 notas:'',
 consentimiento: false
 });

 const [showOptionalDetails, setShowOptionalDetails] = useState(false);
 const [loading, setLoading] = useState(false);
 const [submitted, setSubmitted] = useState(false);
 const [errorMessage, setErrorMessage] = useState<string | null>(null);

 const handleLanguageChange = (lang: FanFormLanguage) => {
 setCurrentLang(lang);
 if (typeof window !=='undefined') {
 const url = new URL(window.location.href);
 url.searchParams.set('lang', lang);
 window.history.replaceState({},'', url.toString());
 }
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setErrorMessage(null);

 // Solo los imprescindibles son obligatorios: Nombre de la Banda y Email (o Instagram)
 if (!formData.nombreBanda.trim() || !formData.email.trim()) {
 setErrorMessage(t.errorRequired);
 return;
 }

 if (!formData.consentimiento) {
 setErrorMessage(t.errorRequired);
 return;
 }

 setLoading(true);

 try {
 const response = await fetch('/api/public/musicians-waitlist', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 ...formData,
 idioma: currentLang,
 bandaOrigen: originInfo.fromBand || undefined,
 conciertoOrigen: originInfo.fromConcert || undefined,
 fechaSolicitud: new Date().toISOString()
 })
 });

 const data = await response.json();

 if (!response.ok || !data.success) {
 throw new Error(data.error || t.errorGeneric);
 }

 setSubmitted(true);
 if (typeof window !=='undefined') {
 window.scrollTo({ top: 0, behavior:'smooth' });
 }
 } catch (err: any) {
 console.error('Error enviando registro de músico:', err);
 setErrorMessage(err?.message || t.errorGeneric);
 } finally {
 setLoading(false);
 }
 };

 const handleBackToOrigin = () => {
 if (typeof window !=='undefined') {
 if (originInfo.fromBand) {
 const clean = originInfo.fromBand.replace(/^(band|reg)-/,'');
 window.location.href = `/fans?band=${encodeURIComponent(clean)}&lang=${currentLang}`;
 } else {
 window.location.href ='/';
 }
 }
 };

 return (
 <div className="min-h-screen bg-[var(--sunken)] text-[var(--sunken)] font-sans selection:bg-[var(--acc)] selection:text-black">
 {/* Background Ambient Glows */}
 <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
 <div className="absolute top-[-10%] left-[20%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px]" />
 <div className="absolute top-[40%] right-[-5%] w-[450px] h-[450px] bg-yellow-600/10 rounded-full blur-[140px]" />
 <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-amber-700/10 rounded-full blur-[140px]" />
 </div>

 {/* Sticky Navigation / Header */}
 <header className="relative z-20 border-b /80 bg-[var(--bg)]/90 backdrop-blur-md sticky top-0">
 <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-[var(--r-m)] overflow-hidden bg-black p-0.5 shadow-md flex items-center justify-center shrink-0">
 <img
 src="/bandmanageriodefinitiva.jpeg"
 alt="BandManager.io Logo"
 className="w-full h-full object-contain rounded-[10px]"
 onError={(e) => { (e.currentTarget as HTMLImageElement).src ='/logo_bandmanager_official.svg'; }}
 />
 </div>
 <div>
 <span className="font-extrabold tracking-tight text-white font-mono text-base flex items-center gap-0.5">
 BandManager<span className="text-[var(--acc)]">.io</span>
 </span>
 <span className="text-[10px] font-mono text-amber-400/80 block -mt-1 tracking-wider uppercase">
 IA Agéntica para tu Banda
 </span>
 </div>
 </div>

 {/* Language Selector (Solo banderas, contextual) */}
 <div className="flex items-center gap-1.5 bg-[var(--surface)]/80 p-1 rounded-[var(--r-m)] shadow-inner" role="group" aria-label="Idioma / Language">
 {availableLanguages.map((lang) => (
 <button
 key={lang.code}
 type="button"
 onClick={() => handleLanguageChange(lang.code)}
 className={`w-8 h-8 rounded-[var(--r-s)] text-base flex items-center justify-center transition-all ${
 currentLang === lang.code
 ?'bg-amber-500/20 text-[var(--acc)] /50 shadow-inner scale-105'
 :'bg-[var(--surface)]/60 /80 hover: opacity-70 hover:opacity-100'
 }`}
 title={lang.label}
 aria-label={lang.label}
 >
 <span className="text-base leading-none select-none">{lang.flag}</span>
 </button>
 ))}
 </div>
 </div>
 </header>

 {/* Main Container */}
 <main className="relative z-10 max-w-4xl mx-auto px-4 py-8 sm:py-12 space-y-12">
 {/* Optional Origin Band Badge */}
 {originInfo.fromBand && (
 <div className="flex items-center justify-between p-3 rounded-[var(--r-m)] bg-amber-500/10 text-xs font-mono text-amber-300 animate-in fade-in">
 <div className="flex items-center gap-2">
 <Radio className="w-4 h-4 text-amber-400 animate-pulse" />
 <span>
 {t.badgeFromBand.replace('{bandName}', originInfo.fromBand.replace(/^(band|reg)-/,'').toUpperCase())}
 </span>
 </div>
 <button
 onClick={handleBackToOrigin}
 className="text-[11px] underline hover:text-white flex items-center gap-1 font-bold"
 >
 <ArrowLeft className="w-3 h-3" />
 {t.backToOrigin.replace('{bandName}', originInfo.fromBand.replace(/^(band|reg)-/,''))}
 </button>
 </div>
 )}

 {/* HERO SECTION */}
 <section className="text-center space-y-5 pt-2">
 {/* Official BandManager Brand Logo */}
 <div className="flex flex-col items-center justify-center gap-3">
 <div className="relative group">
 <div className="absolute -inset-1 bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-amber-600/30 rounded-3xl blur-md opacity-70 group-hover:opacity-100 transition duration-500" />
 <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[var(--r-l)] overflow-hidden bg-black p-1 shadow-2xl flex items-center justify-center">
 <img
 src="/bandmanageriodefinitiva.jpeg"
 alt="BandManager.io"
 className="w-full h-full object-contain rounded-[var(--r-m)]"
 onError={(e) => { (e.currentTarget as HTMLImageElement).src ='/logo_bandmanager_official.svg'; }}
 />
 </div>
 </div>

 <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider mt-1">
 <Sparkles className="w-3.5 h-3.5" />
 <span>{t.badge}</span>
 </div>
 </div>

 <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-[1.15]">
 {t.heroTitle}{''}
 <span className="bg-gradient-to-r from-[var(--acc)] via-amber-300 to-yellow-500 bg-clip-text text-transparent">
 {t.heroHighlight}
 </span>
 </h1>

 <p className="text-[var(--ink-3)] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed font-normal">
 {t.heroSubtitle}
 </p>
 </section>

 {/* FEATURE CARDS */}
 <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)]/70 hover:/30 transition-all space-y-2.5 shadow-lg">
 <div className="w-10 h-10 rounded-[var(--r-m)] bg-amber-500/10 flex items-center justify-center text-amber-400">
 <QrCode className="w-5 h-5" />
 </div>
 <h3 className="font-bold text-white text-base font-mono">
 {t.feature1Title}
 </h3>
 <p className="text-[var(--ink-2)] text-xs sm:text-sm leading-relaxed">
 {t.feature1Desc}
 </p>
 </div>

 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)]/70 hover:/30 transition-all space-y-2.5 shadow-lg">
 <div className="w-10 h-10 rounded-[var(--r-m)] bg-amber-500/10 flex items-center justify-center text-amber-400">
 <FileText className="w-5 h-5" />
 </div>
 <h3 className="font-bold text-white text-base font-mono">
 {t.feature2Title}
 </h3>
 <p className="text-[var(--ink-2)] text-xs sm:text-sm leading-relaxed">
 {t.feature2Desc}
 </p>
 </div>

 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)]/70 hover:/30 transition-all space-y-2.5 shadow-lg">
 <div className="w-10 h-10 rounded-[var(--r-m)] bg-amber-500/10 flex items-center justify-center text-amber-400">
 <Music className="w-5 h-5" />
 </div>
 <h3 className="font-bold text-white text-base font-mono">
 {t.feature3Title}
 </h3>
 <p className="text-[var(--ink-2)] text-xs sm:text-sm leading-relaxed">
 {t.feature3Desc}
 </p>
 </div>
 </section>

 {/* ROADMAP TEASER: hype de que la plataforma sigue creciendo, sin detallar features
 concretas todavía por confirmar */}
 <section className="flex items-center gap-3 sm:gap-4 p-4 sm:p-5 rounded-[var(--r-l)] bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent">
 <div className="w-10 h-10 rounded-[var(--r-m)] bg-amber-500/15 flex items-center justify-center text-amber-400 shrink-0">
 <Rocket className="w-5 h-5" />
 </div>
 <p className="text-[var(--ink-3)] text-xs sm:text-sm leading-relaxed">
 <span className="text-amber-400 font-bold">{t.roadmapTeaserLead}</span>{''}
 {t.roadmapTeaserText}
 </p>
 </section>

 {/* REGISTRATION FORM CARD OR SUCCESS CARD */}
 <section className="relative">
 <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-amber-500/0 to-transparent rounded-3xl -z-10" />

 {submitted ? (
 /* SUCCESS CONFIRMATION */
 <div className="p-8 sm:p-12 rounded-3xl bg-[#141312] shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95">
 <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.2)]">
 <CheckCircle2 className="w-10 h-10" />
 </div>

 <div className="space-y-3">
 <h2 className="text-2xl sm:text-3xl font-black text-white">
 {t.successTitle}
 </h2>
 <p className="text-amber-400 font-mono text-sm font-bold">
 {t.successSubtitle.replace('{bandName}', formData.nombreBanda ||'tu banda')}
 </p>
 <p className="text-[var(--ink-3)] text-sm max-w-lg mx-auto leading-relaxed">
 {t.successMessage}
 </p>
 </div>

 <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
 {originInfo.fromBand && (
 <button
 onClick={handleBackToOrigin}
 className="w-full sm:w-auto px-6 py-3 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-neutral-800 text-white font-mono text-xs font-bold transition"
 >
 {t.successBackToBand.replace('{bandName}', originInfo.fromBand.replace(/^(band|reg)-/,''))}
 </button>
 )}
 <a
 href="/"
 className="w-full sm:w-auto px-6 py-3 rounded-[var(--r-m)] bg-gradient-to-r from-[var(--acc)] to-[#e0a820] text-black font-mono text-xs font-black uppercase tracking-wider transition hover:brightness-110 flex items-center justify-center gap-2"
 >
 <ExternalLink className="w-4 h-4" />
 {t.successExploreApp}
 </a>
 </div>
 </div>
 ) : (
 /* EARLY ACCESS FORM */
 <div className="p-6 sm:p-10 rounded-3xl bg-[#141312] shadow-2xl space-y-6">
 <div className="space-y-2 border-b pb-6 text-center sm:text-left">
 <div className="inline-flex items-center gap-2 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider">
 <Users className="w-4 h-4" />
 <span>Early Access Waitlist</span>
 </div>
 <h2 className="text-2xl font-black text-white">
 {t.formTitle}
 </h2>
 <p className="text-[var(--ink-2)] text-xs sm:text-sm leading-relaxed">
 {t.formSubtitle}
 </p>
 </div>

 {errorMessage && (
 <div className="p-4 rounded-[var(--r-m)] bg-rose-500/10 text-rose-400 text-xs font-mono">
 {errorMessage}
 </div>
 )}

 <form onSubmit={handleSubmit} className="space-y-4">
 {/* 1. DATOS IMPRESCINDIBLES (Prioritarios) */}
 <div className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {/* Band Name */}
 <div className="space-y-1.5">
 <label className="text-[11px] font-bold font-mono uppercase text-[var(--sunken)] tracking-wider flex items-center justify-between">
 <span>{t.labelBandName}</span>
 <span className="text-[var(--acc)] text-[10px] font-normal lowercase tracking-normal">imprescindible</span>
 </label>
 <input
 type="text"
 required
 value={formData.nombreBanda}
 onChange={(e) => setFormData({ ...formData, nombreBanda: e.target.value })}
 placeholder={t.placeholderBandName}
 className="w-full px-3.5 py-3 rounded-[var(--r-m)] bg-[var(--surface)] focus:border-[var(--acc)] focus:ring-1 focus:ring-[var(--acc)] text-sm text-white placeholder:text-neutral-600 outline-none transition font-mono"
 />
 </div>

 {/* Email */}
 <div className="space-y-1.5">
 <label className="text-[11px] font-bold font-mono uppercase text-[var(--sunken)] tracking-wider flex items-center justify-between">
 <span>{t.labelEmail}</span>
 <span className="text-[var(--acc)] text-[10px] font-normal lowercase tracking-normal">imprescindible</span>
 </label>
 <input
 type="email"
 required
 value={formData.email}
 onChange={(e) => setFormData({ ...formData, email: e.target.value })}
 placeholder={t.placeholderEmail}
 className="w-full px-3.5 py-3 rounded-[var(--r-m)] bg-[var(--surface)] focus:border-[var(--acc)] focus:ring-1 focus:ring-[var(--acc)] text-sm text-white placeholder:text-neutral-600 outline-none transition font-mono"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {/* Instagram */}
 <div className="space-y-1.5">
 <label className="text-[11px] font-bold font-mono uppercase text-[var(--ink-3)] tracking-wider flex items-center justify-between">
 <span>{t.labelInstagram}</span>
 <span className="text-neutral-500 text-[10px] font-normal lowercase tracking-normal">recomendado</span>
 </label>
 <input
 type="text"
 value={formData.instagram}
 onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
 placeholder={t.placeholderInstagram}
 className="w-full px-3.5 py-3 rounded-[var(--r-m)] bg-[var(--surface)] focus:border-[var(--acc)] focus:ring-1 focus:ring-[var(--acc)] text-sm text-white placeholder:text-neutral-600 outline-none transition font-mono"
 />
 </div>

 {/* Contact Person Name */}
 <div className="space-y-1.5">
 <label className="text-[11px] font-bold font-mono uppercase text-[var(--ink-3)] tracking-wider flex items-center justify-between">
 <span>{t.labelContactName}</span>
 <span className="text-neutral-500 text-[10px] font-normal lowercase tracking-normal">opcional</span>
 </label>
 <input
 type="text"
 value={formData.nombreContacto}
 onChange={(e) => setFormData({ ...formData, nombreContacto: e.target.value })}
 placeholder={t.placeholderContactName}
 className="w-full px-3.5 py-3 rounded-[var(--r-m)] bg-[var(--surface)] focus:border-[var(--acc)] text-sm text-white placeholder:text-neutral-600 outline-none transition font-mono"
 />
 </div>
 </div>
 </div>

 {/* 2. BOTÓN DESPLEGABLE DE INFORMACIÓN ADICIONAL (OPCIONAL) */}
 <div className="pt-1">
 <button
 type="button"
 onClick={() => setShowOptionalDetails(!showOptionalDetails)}
 className="w-full py-2.5 px-4 rounded-[var(--r-m)] bg-[var(--surface)]/70 hover:bg-[var(--surface)] hover: text-xs font-mono text-[var(--ink-3)] flex items-center justify-between transition-colors group"
 >
 <span className="flex items-center gap-2">
 <Sliders className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span className="group-hover:text-white transition-colors font-medium">
 {showOptionalDetails ? t.moreInfoToggleClose : t.moreInfoToggleOpen}
 </span>
 </span>
 {showOptionalDetails ? (
 <ChevronUp className="w-4 h-4 text-[var(--ink-2)] group-hover:text-[var(--acc)] transition-colors" />
 ) : (
 <ChevronDown className="w-4 h-4 text-[var(--ink-2)] group-hover:text-[var(--acc)] transition-colors" />
 )}
 </button>
 </div>

 {/* 3. CAMPOS OPCIONALES DESPLEGABLES */}
 {showOptionalDetails && (
 <div className="p-4 rounded-[var(--r-l)] bg-[var(--surface)]/90 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
 <p className="text-[11px] font-mono text-[var(--ink-2)] -mt-1">
 {t.moreInfoSubtitle}
 </p>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {/* Music Genre */}
 <div className="space-y-1.5">
 <label className="text-[11px] font-bold font-mono uppercase text-[var(--ink-2)] tracking-wider">
 {t.labelGenre}
 </label>
 <input
 type="text"
 value={formData.genero}
 onChange={(e) => setFormData({ ...formData, genero: e.target.value })}
 placeholder={t.placeholderGenre}
 className="w-full px-3.5 py-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 focus:border-[var(--acc)] text-sm text-white placeholder:text-neutral-600 outline-none transition font-mono"
 />
 </div>

 {/* City */}
 <div className="space-y-1.5">
 <label className="text-[11px] font-bold font-mono uppercase text-[var(--ink-2)] tracking-wider">
 {t.labelCity}
 </label>
 <input
 type="text"
 value={formData.ciudad}
 onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
 placeholder={t.placeholderCity}
 className="w-full px-3.5 py-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 focus:border-[var(--acc)] text-sm text-white placeholder:text-neutral-600 outline-none transition font-mono"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 {/* Phone / WhatsApp */}
 <div className="space-y-1.5">
 <label className="text-[11px] font-bold font-mono uppercase text-[var(--ink-2)] tracking-wider">
 {t.labelPhone}
 </label>
 <input
 type="tel"
 value={formData.telefono}
 onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
 placeholder={t.placeholderPhone}
 className="w-full px-3.5 py-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 focus:border-[var(--acc)] text-sm text-white placeholder:text-neutral-600 outline-none transition font-mono"
 />
 </div>

 {/* Music link */}
 <div className="space-y-1.5">
 <label className="text-[11px] font-bold font-mono uppercase text-[var(--ink-2)] tracking-wider">
 {t.labelMusicLink}
 </label>
 <input
 type="text"
 value={formData.enlaceMusica}
 onChange={(e) => setFormData({ ...formData, enlaceMusica: e.target.value })}
 placeholder={t.placeholderMusicLink}
 className="w-full px-3.5 py-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 focus:border-[var(--acc)] text-sm text-white placeholder:text-neutral-600 outline-none transition font-mono"
 />
 </div>
 </div>

 {/* Priority Feature */}
 <div className="space-y-1.5">
 <label className="text-[11px] font-bold font-mono uppercase text-[var(--ink-2)] tracking-wider">
 {t.labelMainInterest}
 </label>
 <select
 value={formData.interesPrincipal}
 onChange={(e) => setFormData({ ...formData, interesPrincipal: e.target.value })}
 className="w-full px-3.5 py-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 focus:border-[var(--acc)] text-sm text-white outline-none transition font-mono"
 >
 <option value="">{t.optionSelectInterest}</option>
 <option value="fans">{t.optionInterestFans}</option>
 <option value="epk">{t.optionInterestEpk}</option>
 <option value="repertorio">{t.optionInterestRepertoire}</option>
 <option value="todo">{t.optionInterestAll}</option>
 </select>
 </div>

 {/* Notes */}
 <div className="space-y-1.5">
 <label className="text-[11px] font-bold font-mono uppercase text-[var(--ink-2)] tracking-wider">
 {t.labelNotes}
 </label>
 <textarea
 rows={2}
 value={formData.notas}
 onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
 placeholder={t.placeholderNotes}
 className="w-full px-3.5 py-2.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 focus:border-[var(--acc)] text-sm text-white placeholder:text-neutral-600 outline-none transition font-mono resize-none"
 />
 </div>
 </div>
 )}

 {/* Consent checkbox */}
 <div className="pt-2">
 <label className="flex items-start gap-3 p-3 rounded-[var(--r-m)] bg-[var(--surface)]/80 cursor-pointer group hover: transition">
 <input
 type="checkbox"
 required
 checked={formData.consentimiento}
 onChange={(e) => setFormData({ ...formData, consentimiento: e.target.checked })}
 className="mt-0.5 w-4 h-4 rounded bg-[var(--surface)] text-[var(--acc)] focus:ring-[var(--acc)]"
 />
 <span className="text-xs font-mono text-[var(--ink-2)] group-hover:text-[var(--ink-3)] leading-relaxed">
 {t.consentCheckbox}
 </span>
 </label>
 </div>

 {/* Submit button */}
 <button
 type="submit"
 disabled={loading}
 className="w-full py-4 rounded-[var(--r-m)] bg-gradient-to-r from-[var(--acc)] via-amber-400 to-[#e0a820] text-black font-mono font-black text-sm uppercase tracking-wider shadow-lg shadow-amber-500/20 hover:brightness-110 active:scale-[0.99] transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
 >
 {loading ? (
 <>
 <Loader2 className="w-5 h-5 animate-spin" />
 <span>{t.submittingButton}</span>
 </>
 ) : (
 <>
 <Sparkles className="w-4 h-4 text-black" />
 <span>{t.submitButton}</span>
 </>
 )}
 </button>
 </form>

 <div className="pt-2 text-center">
 <p className="text-[11px] font-mono text-neutral-500 flex items-center justify-center gap-1.5">
 <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
 <span>Tus datos se tratan con total privacidad y nunca se ceden a terceros.</span>
 </p>
 </div>
 </div>
 )}
 </section>

 {/* Footer */}
 <footer className="text-center py-6 border-t border-[var(--surface)] text-xs font-mono text-neutral-500">
 <p>{t.footerText}</p>
 </footer>
 </main>
 </div>
 );
};

export default PublicMusiciansLanding;
