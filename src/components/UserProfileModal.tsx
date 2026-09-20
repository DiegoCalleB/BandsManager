import React, { useState, useEffect } from'react';
import { User as UserIcon, Key, Music, Check, AlertCircle, X, Shield, Palette, Users, Type, Loader2, Guitar, Upload, Camera, Crown, Sparkles, Globe, ChevronDown, Star, ArrowUpDown, ArrowUpCircle, ArrowDownCircle, Plus, Trash2, CreditCard, ExternalLink, Calendar, Bot, Heart } from'lucide-react';
import { User, ThemeName } from'../types';
import { THEMES } from'../utils/theme';
import { FONT_PRESETS, FontPresetKey } from'../utils/typography';
import {
 PREFERENCIAS as PREFERENCIAS_ESPECTRO,
 PreferenciaTema,
 guardarPreferencia as guardarPreferenciaEspectro,
 leerPreferencia as leerPreferenciaEspectro,
 resolverTema as resolverTemaEspectro,
} from'../utils/temaEspectro';
import { uploadFileToServer } from'../utils/audioStorage';
import { api, getAuthHeaders } from'../services/api';
import { getPlanDefinition, getPlanChangeType, normalizePlan, PLANS } from'../utils/planPermissions';
import { useLanguage, SUPPORTED_LANGUAGES } from'../context/LanguageContext';
import { ModalPortal } from'./common/ModalPortal';
import { AgentAutonomySettingsModal } from'./dashboard/AgentAutonomySettingsModal';

// Fase beta: crear un proyecto adicional desde aquí va directo al plan Promo, sin pasar por
// este selector legacy de 3 planes de pago (mismo criterio que BandSwitcherModal.tsx y
// SimplePromoLoginModal.tsx). El selector se conserva intacto más abajo para cuando se quiera
// reabrir la creación de bandas con todos los planes — basta con volver a poner esto a false.
const SIMPLE_PROMO_ONLY_BAND_CREATION = true;

interface UserProfileModalProps {
 currentUser: User;
 onClose: () => void;
 onUpdateUser: (updatedUser: User) => void;
 isStitchLight?: boolean;
 isAdmin?: boolean;
 onOpenBandManagement?: () => void;
 currentTheme?: ThemeName;
 onThemeChange?: (theme: ThemeName) => void;
 currentFont?: FontPresetKey;
 onFontChange?: (font: FontPresetKey) => void;
 epkConfig?: any;
 onUpdateEpkConfig?: (newConfig: any) => Promise<any> | void;
 activeBandName?: string;
 onRefreshData?: () => void;
 availableBands?: Array<{ band_id: string; bandName: string; role?: string; logoUrl?: string; plan?: string; is_main?: boolean }>;
 onSetMainBand?: (bandId: string) => Promise<any>;
 onOpenBandSwitcher?: () => void;
 onNavigateToPlanes?: () => void;
 onOpenProfileWizard?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
 currentUser,
 onClose,
 onUpdateUser,
 isStitchLight,
 isAdmin,
 onOpenBandManagement,
 currentTheme,
 onThemeChange,
 currentFont,
 onFontChange,
 epkConfig,
 onUpdateEpkConfig,
 activeBandName,
 onRefreshData,
 availableBands = [],
 onSetMainBand,
 onOpenBandSwitcher,
 onNavigateToPlanes,
 onOpenProfileWizard
}) => {
 const { language, setLanguage } = useLanguage();
 const [name, setName] = useState(currentUser.name ||'');
 const [instrument, setInstrument] = useState(currentUser.instrument ||'');
 const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor ||'var(--ok)');
 const [selectedMainBandId, setSelectedMainBandId] = useState(currentUser.main_band_id || currentUser.band_id ||'');
 const [bandLogoUrl, setBandLogoUrl] = useState<string>(epkConfig?.logoUrl ||'');

 useEffect(() => {
 if (currentUser) {
 setName(currentUser.name ||'');
 setInstrument(currentUser.instrument ||'');
 setAvatarColor(currentUser.avatarColor ||'var(--ok)');
 setSelectedMainBandId(currentUser.main_band_id || currentUser.band_id ||'');
 }
 }, [currentUser]);

 useEffect(() => {
 if (availableBands) {
 setLocalAvailableBands(availableBands);
 }
 }, [availableBands]);

 useEffect(() => {
 if (epkConfig?.logoUrl) {
 setBandLogoUrl(epkConfig.logoUrl);
 }
 }, [epkConfig?.logoUrl]);
 const [logoImgError, setLogoImgError] = useState(false);
 const [uploadingLogo, setUploadingLogo] = useState(false);
 const [showUpgradeModal, setShowUpgradeModal] = useState(false);
 const [showAppearance, setShowAppearance] = useState(false);
 const [prefEspectro, setPrefEspectro] = useState<PreferenciaTema>(() => leerPreferenciaEspectro());
 const [showAgentConfig, setShowAgentConfig] = useState(false);
 
 const activeBandMatch = availableBands?.find(b => b.band_id === (currentUser.band_id || currentUser.main_band_id) || (b as any).id === (currentUser.band_id || currentUser.main_band_id));
 const effectivePlan = activeBandMatch?.plan || currentUser.plan;
 const currentPlanDef = getPlanDefinition(effectivePlan);
 const isHighestPlan = currentPlanDef.id ==='cabeza_de_cartel';
 // Plan Promo y Promo+ (fase beta, festivales): sin agentes IA ni cambio de plan visible.
 const isPromoUser = normalizePlan(effectivePlan) ==='promo' || normalizePlan(effectivePlan) ==='promo_plus';
 
 // Password change state
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');

 const handleLogoChangeInProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setUploadingLogo(true);
 setError(null);
 setSuccessMsg(null);
 if (!currentUser.band_id) {
 setError('No hay ninguna banda activa para actualizar el logo.');
 setUploadingLogo(false);
 return;
 }
 try {
 const userBandId = currentUser.band_id;
 const url = await uploadFileToServer(file, { bandId: userBandId, category:'logo' });
 setBandLogoUrl(url);

 const updatedEpk = { ...epkConfig, logoUrl: url, bandId: userBandId };
 const authHeaders = getAuthHeaders() as Record<string, string>;
 await fetch('/api/users/upload-logo', {
 method:'POST',
 headers: {'Content-Type':'application/json', ...authHeaders,'x-band-id': userBandId },
 body: JSON.stringify({ logoUrl: url, bandId: userBandId })
 });

 if (onUpdateEpkConfig) {
 await onUpdateEpkConfig(updatedEpk);
 }
 if (onRefreshData) onRefreshData();
 setSuccessMsg('¡Logo del proyecto actualizado con éxito!');
 } catch (err: any) {
 console.error('Error uploading band logo in profile:', err);
 setError('Error al subir el logo de la banda.');
 } finally {
 setUploadingLogo(false);
 }
 };

 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [successMsg, setSuccessMsg] = useState<string | null>(null);

 // Available bands local state & synchronization
 const [localAvailableBands, setLocalAvailableBands] = useState(availableBands);
 useEffect(() => {
 setLocalAvailableBands(availableBands);
 }, [availableBands]);

 // Band creation inside Profile Modal
 const [showCreateBandSection, setShowCreateBandSection] = useState(false);
 const [createBandName, setCreateBandName] = useState('');
 const [createBandLeaderName, setCreateBandLeaderName] = useState(currentUser.name || currentUser.username ||'');
 const [createBandStyle, setCreateBandStyle] = useState('');
 const [createBandLocation, setCreateBandLocation] = useState('España');
 const [createBandPlan, setCreateBandPlan] = useState<'emergente' |'profesional' |'elite' |'promo' |'promo_plus'>('profesional');
 const [isCreatingBand, setIsCreatingBand] = useState(false);

 // Band deletion inside Profile Modal
 const [bandToDeleteInProfile, setBandToDeleteInProfile] = useState<{ id: string; name: string } | null>(null);
 const [deletingBandId, setDeletingBandId] = useState<string | null>(null);

 const handleCreateBandInProfile = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!createBandName.trim()) {
 setError('Por favor, introduce el nombre del proyecto o banda');
 return;
 }
 setIsCreatingBand(true);
 setError(null);
 setSuccessMsg(null);
 const effectivePlan = SIMPLE_PROMO_ONLY_BAND_CREATION ?'promo' : createBandPlan;
 try {
 const res = await api.createBand({
 bandName: createBandName.trim(),
 leaderName: createBandLeaderName.trim() || currentUser.name || currentUser.username ||'Líder',
 plan: effectivePlan,
 estilo_musical: createBandStyle.trim() || undefined,
 localizacion: createBandLocation.trim() || undefined
 });

 if (res && res.success) {
 if (res.user) {
 localStorage.setItem('bakandeya_user', JSON.stringify(res.user));
 onUpdateUser(res.user as User);
 }
 if (res.availableBands && Array.isArray(res.availableBands)) {
 setLocalAvailableBands(res.availableBands);
 }
 if (res.band_id) {
 setSelectedMainBandId(res.band_id);
 }

 // Redirect to Stripe Checkout for paid plans
 if ((effectivePlan as string) !=='ensayo' && effectivePlan !=='promo' && effectivePlan !=='promo_plus' && res.band_id) {
 try {
 await api.startCheckout({
 planId: effectivePlan,
 billingInterval:'monthly',
 bandId: res.band_id,
 userEmail: (currentUser?.email && currentUser.email.includes('@')) ? currentUser.email : undefined
 });
 setShowCreateBandSection(false);
 setCreateBandName('');
 setCreateBandStyle('');
 return;
 } catch (stripeErr) {
 console.error('Error initiating Stripe checkout on create band in profile:', stripeErr);
 }
 }

 setSuccessMsg(`¡Proyecto"${createBandName.trim()}" creado y configurado con éxito!`);
 setShowCreateBandSection(false);
 setCreateBandName('');
 setCreateBandStyle('');
 if (onRefreshData) await onRefreshData();
 } else {
 setError((res as any)?.error ||'No se pudo crear el proyecto musical');
 }
 } catch (err: any) {
 console.error('Error creating band in profile modal:', err);
 setError(err.message ||'Error al crear el nuevo proyecto');
 } finally {
 setIsCreatingBand(false);
 }
 };

 const handleConfirmDeleteBandInProfile = async () => {
 if (!bandToDeleteInProfile) return;
 const { id: targetBandId, name: targetBandName } = bandToDeleteInProfile;
 setDeletingBandId(targetBandId);
 setBandToDeleteInProfile(null);
 setError(null);
 setSuccessMsg(null);

 try {
 const res = await api.leaveBand(targetBandId);
 if (res && res.success) {
 if (res.user) {
 localStorage.setItem('bakandeya_user', JSON.stringify(res.user));
 onUpdateUser(res.user as User);
 setSelectedMainBandId(res.user.main_band_id || res.user.band_id ||'');
 }
 if (res.availableBands && Array.isArray(res.availableBands)) {
 setLocalAvailableBands(res.availableBands);
 }
 setSuccessMsg(`"${targetBandName}" eliminada correctamente de tu cuenta.`);
 if (onRefreshData) await onRefreshData();
 } else {
 setError(res?.message ||'Error al eliminar la banda');
 }
 } catch (err: any) {
 console.error('Error deleting band in profile modal:', err);
 const rawMsg = err?.message ||'';
 const isNetworkErr = rawMsg ==='Failed to fetch' || rawMsg.includes('NetworkError') || rawMsg.includes('fetch');
 const userFriendlyMsg = isNetworkErr 
 ?'Error de conexión con el servidor. Por favor, reintenta en unos instantes.' 
 : (rawMsg ||'Error al eliminar la banda de tu usuario');
 setError(userFriendlyMsg);
 } finally {
 setDeletingBandId(null);
 }
 };

 const colors = ['var(--ok)', // Emerald'#3b82f6', // Blue'#ec4899', // Pink'var(--acc)', // Amber'#8b5cf6', // Purple'#06b6d4', // Cyan'#f97316', // Orange'#ef4444' // Red
 ];

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError(null);
 setSuccessMsg(null);

 if (newPassword && newPassword !== confirmPassword) {
 setError('Las contraseñas no coinciden. Por favor verifícalas.');
 return;
 }

 if (newPassword && newPassword.length < 3) {
 setError('La nueva contraseña debe tener al menos 3 caracteres.');
 return;
 }

 setLoading(true);

 try {
 const token = localStorage.getItem('bakandeya_token');
 if (selectedMainBandId && selectedMainBandId !== (currentUser.main_band_id || currentUser.band_id) && onSetMainBand) {
 await onSetMainBand(selectedMainBandId).catch((e: any) => console.warn('Could not set main band:', e));
 }
 const response = await fetch(`/api/users/${currentUser.id}`, {
 method:'PUT',
 headers: {'Content-Type':'application/json',
 ...(token ? {'Authorization': `Bearer ${token}` } : {})
 },
 body: JSON.stringify({
 name: name.trim(),
 instrument: instrument.trim(),
 avatarColor,
 main_band_id: selectedMainBandId,
 ...(newPassword ? { newPassword: newPassword.trim() } : {})
 })
 });

 const data = await response.json();

 if (!response.ok) {
 throw new Error(data.error ||'Error al actualizar el perfil');
 }

 setSuccessMsg('¡Perfil y contraseña actualizados correctamente!');
 setNewPassword('');
 setConfirmPassword('');
 onUpdateUser(data);
 setTimeout(() => {
 onClose();
 }, 1200);
 } catch (err: any) {
 setError(err.message ||'Error en el servidor');
 } finally {
 setLoading(false);
 }
 };

 return (
 <ModalPortal isOpen={true} onClose={onClose}>
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain animate-in fade-in duration-300">
 <div 
 className={`w-full max-w-md rounded-[var(--r-l)] overflow-hidden flex flex-col my-auto max-h-[90vh] ${
 isStitchLight 
 ?'bg-[var(--surface)] text-[var(--ink)]' 
 :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 >
 {/* Modal Header */}
 <div className={`px-6 py-4 flex justify-between items-center ${
 isStitchLight ?'-slate-200 bg-[var(--bg)]' :'bg-[var(--surface)] bg-[var(--surface)]/60'
 }`}>
 <div className="flex items-center gap-3">
 <div 
 className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-[var(--ink)] font-sans text-sm shrink-0"
 style={{ backgroundColor: avatarColor }}
 >
 {name.slice(0, 2) ||'BK'}
 </div>
 <div>
 <h3 className="font-bold font-display tracking-wider text-sm flex items-center gap-2">
 <span>Mi Perfil & Contraseña</span>
 </h3>
 <p className="text-[11px] text-[var(--ink-2)] font-sans flex items-center gap-1.5 flex-wrap">
 <span>@{currentUser.username} • {isAdmin ?'Administrador' :'Músico'}</span>
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-sans font-extrabold tracking-wider bg-[var(--acc)]/15 text-[var(--acc)]/70">
 <Sparkles className="w-2.5 h-2.5 text-[var(--acc)]" />
 {currentPlanDef.name}
 </span>
 </p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink-2)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Form Body */}
 <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
 {error && (
 <div className="p-3 bg-[var(--alert)]/10 -rose-500/20 rounded-[var(--r-m)] text-xs text-[var(--alert)] flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{error}</span>
 </div>
 )}

 {successMsg && (
 <div className="p-3 bg-[var(--ok)]/10 -emerald-500/20 rounded-[var(--r-m)] text-xs text-[var(--ok)] flex items-center gap-2">
 <Check className="w-4 h-4 shrink-0" />
 <span>{successMsg}</span>
 </div>
 )}

 {/* Plan Suscrito & Upgrade Section */}
 <div className={`p-3.5 rounded-[var(--r-m)] relative overflow-hidden transition-all ${
 isStitchLight 
 ?'bg-[var(--bg)]' 
 :'bg-gradient-to-r from-amber-950/30 via-[var(--surface)] to-[var(--surface)] /30'
 }`}>
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center shrink-0">
 <Crown className="w-5 h-5 text-[var(--acc)]" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-sans text-[var(--ink-2)] tracking-wide">Plan:</span>
 <span className="text-xs font-bold text-[var(--acc)]/70 font-sans">{currentPlanDef.name}</span>
 </div>
 <p className="text-[11px] text-[var(--ink-2)] mt-0.5">{currentPlanDef.description}</p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 {!isHighestPlan && !isPromoUser && (
 <button
 type="button"
 onClick={() => setShowUpgradeModal(true)}
 className="px-3.5 py-2 rounded-[var(--r-m)] bg-gradient-to-r from-[var(--acc)] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[var(--acc-ink)] text-xs font-bold font-sans transition-all duration-200 hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
 >
 <Sparkles className="w-3.5 h-3.5 fill-stone-950" />
 <span>Upgrade</span>
 </button>
 )}

 {onOpenProfileWizard && (
 <button
 type="button"
 onClick={onOpenProfileWizard}
 className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 text-xs font-bold font-sans transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
 title="Abrir Asistente de Inicio / Onboarding"
 >
 <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Guía de Inicio</span>
 </button>
 )}
 </div>
 </div>
 </div>

 <div className="space-y-1">
 <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
 <UserIcon className="w-3.5 h-3.5 text-[var(--ok)]" />
 <span>Nombre Completo / Apodo</span>
 </label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="Tu nombre..."
 className={`w-full px-3 py-2 rounded-[var(--r-m)] text-xs outline-none ${
 isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)] focus:-emerald-500/50'
 }`}
 required
 />
 </div>

 <div className="space-y-1">
 <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
 <Music className="w-3.5 h-3.5 text-[var(--ok)]" />
 <span>Instrumento / Puesto</span>
 </label>
 <input
 type="text"
 value={instrument}
 onChange={(e) => setInstrument(e.target.value)}
 placeholder="Ej: Violín, Percusión, Batería, Técnico de Sonido"
 className={`w-full px-3 py-2 rounded-[var(--r-m)] text-xs outline-none ${
 isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)] focus:-emerald-500/50'
 }`}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
 <Palette className="w-3.5 h-3.5 text-[var(--ok)]" />
 <span>Color de Avatar</span>
 </label>
 <div className="flex items-center gap-2 pt-0.5">
 {colors.map((c) => (
 <button
 key={c}
 type="button"
 onClick={() => setAvatarColor(c)}
 className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
 avatarColor === c ?'scale-110 -white ring-2 ring-emerald-500' :'-transparent opacity-75 hover:opacity-100'
 }`}
 style={{ backgroundColor: c }}
 />
 ))}
 </div>
 </div>

 {/* Active Band Logo Edit Section (Netflix Profile Style) */}
 <div className="space-y-2 pt-2 /80">
 <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <Camera className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Logo de tu Banda / Proyecto Musical</span>
 </span>
 <span className="text-[10px] text-[var(--acc)]/80 font-normal font-sans">Editar Avatar</span>
 </label>

 <div className={`p-3 rounded-[var(--r-m)] flex items-center justify-between gap-3 ${
 isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]'
 }`}>
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-[var(--r-m)] bg-[var(--surface)] overflow-hidden flex items-center justify-center p-1 shrink-0 relative group">
 {bandLogoUrl && !logoImgError ? (
 <img src={bandLogoUrl} alt="Logo Banda" onError={() => setLogoImgError(true)} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
 ) : (
 <Guitar className="w-6 h-6 text-[var(--acc)]" />
 )}
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <p className="text-xs font-bold text-[var(--ink)]">{activeBandName || currentUser.bandName ||'Tu Banda'}</p>
 {isPromoUser ? (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-sans font-extrabold tracking-wider bg-[var(--acc)]/60/15 text-[var(--acc)]/70">
 <Sparkles className="w-2.5 h-2.5 text-[var(--acc)]" />
 <span>{currentPlanDef.name}</span>
 </span>
 ) : (
 <button
 type="button"
 onClick={() => setShowUpgradeModal(true)}
 className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-sans font-extrabold tracking-wider bg-[var(--acc)]/60/15 hover:bg-[var(--acc)]/60/25 text-[var(--acc)]/70 cursor-pointer transition-colors"
 title="Cambiar o mejorar suscripción"
 >
 <Sparkles className="w-2.5 h-2.5 text-[var(--acc)]" />
 <span>{currentPlanDef.name}</span>
 <ArrowUpDown className="w-2.5 h-2.5 text-[var(--acc)] ml-0.5" />
 </button>
 )}
 </div>
 <p className="text-[10px] text-[var(--ink-2)] font-sans">Avatar / Logo oficial de la banda</p>
 </div>
 </div>

 <label className="px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 text-xs font-sans font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95">
 {uploadingLogo ? (
 <>
 <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--acc)]" />
 <span>Subiendo...</span>
 </>
 ) : (
 <>
 <Upload className="w-3.5 h-3.5" />
 <span>Cambiar Logo</span>
 </>
 )}
 <input
 type="file"
 accept="image/*"
 className="hidden"
 disabled={uploadingLogo}
 onChange={handleLogoChangeInProfile}
 />
 </label>
 </div>
 </div>

 {/* Main Band Selection Section */}
 <div className="space-y-2 pt-2 /80">
 <div className="flex items-center justify-between">
 <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
 <Star className="w-3.5 h-3.5 text-[var(--acc)] fill-amber-400" />
 <span>Proyectos y Banda Principal</span>
 </label>
 <div className="flex items-center gap-2">
 {onOpenProfileWizard && (
 <button
 type="button"
 onClick={() => {
 onClose();
 onOpenProfileWizard();
 }}
 className="text-[11px] font-sans text-[var(--acc)] hover:text-[var(--acc)]/80 transition-colors flex items-center gap-1 cursor-pointer font-bold"
 title="Abrir asistente paso a paso de configuración de banda"
 >
 <Sparkles className="w-3 h-3 text-[var(--acc)]" />
 <span>Asistente Perfil</span>
 </button>
 )}
 <button
 type="button"
 onClick={() => setShowCreateBandSection(!showCreateBandSection)}
 className="text-[11px] font-sans text-[var(--ok)] hover:text-[var(--ink-2)] transition-colors flex items-center gap-1 cursor-pointer font-bold"
 >
 <Plus className="w-3 h-3" />
 <span>{showCreateBandSection ?'Cerrar' :'+ Crear Proyecto'}</span>
 </button>
 {onOpenBandSwitcher && (
 <button
 type="button"
 onClick={() => {
 onClose();
 onOpenBandSwitcher();
 }}
 className="text-[11px] font-sans text-[var(--acc)] hover:text-[var(--acc)]/70 transition-colors flex items-center gap-1 cursor-pointer"
 >
 <span>Selector visual</span>
 <ChevronDown className="w-3 h-3 -rotate-90" />
 </button>
 )}
 </div>
 </div>

 {/* Creation Form Accordion */}
 {showCreateBandSection && (
 <div className={`p-3.5 rounded-[var(--r-m)] space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
' bg-[var(--ok-soft)]/50'
 }`}>
 <div className="flex items-center justify-between">
 <p className="text-xs font-bold text-[var(--ok)] flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-[var(--ok)]" />
 <span>Crear Nuevo Proyecto o Banda</span>
 </p>
 <button
 type="button"
 onClick={() => setShowCreateBandSection(false)}
 className="text-[var(--ink-2)] hover:text-[var(--ink-2)] p-1 cursor-pointer"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </div>

 <div className="space-y-2">
 <div>
 <label className="text-[10px] font-sans text-[var(--ink-2)] block mb-1">Nombre del Proyecto / Banda *</label>
 <input
 type="text"
 required
 value={createBandName}
 onChange={(e) => setCreateBandName(e.target.value)}
 placeholder="Ej. Los Nocturnos, Cuarteto Acústico..."
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs outline-none font-medium ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>

 <div className="grid grid-cols-2 gap-2">
 <div>
 <label className="text-[10px] font-sans text-[var(--ink-2)] block mb-1">Estilo / Género</label>
 <input
 type="text"
 value={createBandStyle}
 onChange={(e) => setCreateBandStyle(e.target.value)}
 placeholder="Ej. Indie Rock, Pop..."
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 <div>
 <label className="text-[10px] font-sans text-[var(--ink-2)] block mb-1">Ubicación</label>
 <input
 type="text"
 value={createBandLocation}
 onChange={(e) => setCreateBandLocation(e.target.value)}
 placeholder="Ej. Madrid, Barcelona..."
 className={`w-full px-2.5 py-1.5 rounded-[var(--r-s)] text-xs outline-none ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--ink)]'
 }`}
 />
 </div>
 </div>

 {SIMPLE_PROMO_ONLY_BAND_CREATION ? (
 <p className="text-[10px] font-sans text-[var(--ink-2)]">
 Se creará en el plan <span className="text-[var(--acc)] font-bold">Promo</span> (dossier, calendario y fans).
 </p>
 ) : (
 <div>
 <label className="text-[10px] font-sans text-[var(--ink-2)] block mb-1.5">Plan Inicial del Proyecto</label>
 <div className="grid grid-cols-3 gap-1.5">
 {(['emergente','profesional','elite'] as const).map((pKey) => {
 const planDef = getPlanDefinition(pKey);
 const isPlanSelected = createBandPlan === pKey;
 return (
 <button
 key={pKey}
 type="button"
 onClick={() => setCreateBandPlan(pKey)}
 className={`p-2 rounded-[var(--r-s)] text-left text-[11px] transition-all cursor-pointer ${
 isPlanSelected
 ?'bg-[var(--acc)]/20 /80 text-[var(--acc)]/70'
 : isStitchLight
 ?'bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--bg)]'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:'
 }`}
 >
 <p className="font-bold truncate text-[10px]">{planDef.name.split('')[0]}</p>
 <p className="text-[9px] font-sans text-[var(--acc)]/90">{planDef.price}</p>
 </button>
 );
 })}
 </div>
 </div>
 )}

 <div className="pt-1 flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => setShowCreateBandSection(false)}
 className="px-2.5 py-1 rounded-[var(--r-s)] text-xs text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={handleCreateBandInProfile}
 disabled={isCreatingBand || !createBandName.trim()}
 className="px-3 py-1 rounded-[var(--r-s)] text-xs font-bold bg-[var(--ok)] hover:bg-[var(--ok)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
 >
 {isCreatingBand ? (
 <>
 <Loader2 className="w-3 h-3 animate-spin" />
 <span>Creando...</span>
 </>
 ) : (
 <>
 <Plus className="w-3 h-3" />
 <span>Crear Proyecto</span>
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Delete Confirmation Box */}
 {bandToDeleteInProfile && (
 <div className="p-3 rounded-[var(--r-m)] bg-[var(--alert)]/10 space-y-2 animate-in fade-in duration-200">
 <p className="text-xs font-bold text-[var(--alert)] flex items-center gap-1.5">
 <AlertCircle className="w-3.5 h-3.5 text-[var(--alert)]" />
 <span>¿Eliminar proyecto"{bandToDeleteInProfile.name}"?</span>
 </p>
 <p className="text-[11px] text-[var(--ink-2)]">
 Se desvinculará este proyecto de tu cuenta de usuario. Esta acción no se puede deshacer.
 </p>
 <div className="flex items-center justify-end gap-2 pt-1">
 <button
 type="button"
 onClick={() => setBandToDeleteInProfile(null)}
 className="px-2.5 py-1 rounded-[var(--r-s)] text-xs text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="button"
 onClick={handleConfirmDeleteBandInProfile}
 disabled={!!deletingBandId}
 className="px-3 py-1 rounded-[var(--r-s)] text-xs font-bold bg-[var(--alert)] hover:bg-[var(--alert)] text-[var(--ink)] flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
 >
 {deletingBandId ? (
 <>
 <Loader2 className="w-3 h-3 animate-spin" />
 <span>Eliminando...</span>
 </>
 ) : (
 <>
 <Trash2 className="w-3 h-3" />
 <span>Sí, Eliminar</span>
 </>
 )}
 </button>
 </div>
 </div>
 )}

 <div className={`p-3 rounded-[var(--r-m)] space-y-2 ${
 isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)]'
 }`}>
 <p className="text-[11px] text-[var(--ink-2)]">
 Selecciona tu proyecto principal por defecto o gestiona tus bandas activas:
 </p>

 {localAvailableBands && localAvailableBands.length > 0 ? (
 <div className="space-y-1.5 pt-1">
 {localAvailableBands.map((b) => {
 const isSelected = selectedMainBandId === b.band_id || (b.band_id && selectedMainBandId && selectedMainBandId.replace(/^(band|reg)-/,'') === b.band_id.replace(/^(band|reg)-/,''));
 const isDeleting = deletingBandId === b.band_id;
 return (
 <div
 key={b.band_id}
 className={`w-full p-2.5 rounded-[var(--r-m)] flex items-center justify-between gap-3 transition-all ${
 isSelected
 ?'bg-[var(--acc)]/15 /50 text-[var(--acc)]/70'
 : isStitchLight
 ?'bg-[var(--surface)] text-[var(--ink-2)]'
 :'bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 >
 <button
 type="button"
 onClick={() => setSelectedMainBandId(b.band_id)}
 className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer active:scale-98"
 >
 <div className="w-6 h-6 rounded-[var(--r-s)] bg-[var(--surface)]/80 flex items-center justify-center text-[var(--acc)] shrink-0 text-xs font-sans font-bold">
 {b.bandName.slice(0, 2).toUpperCase()}
 </div>
 <div className="min-w-0">
 <p className="text-xs font-bold truncate">{b.bandName}</p>
 <p className="text-[10px] text-[var(--ink-2)] font-sans capitalize">{b.role ==='leader' ?'Líder / Mánager' :'Miembro'} • {getPlanDefinition(b.plan).name}</p>
 </div>
 </button>

 <div className="flex items-center gap-1.5 shrink-0">
 {isSelected ? (
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[var(--acc)]/60 text-[var(--on-acc)] text-[9px] font-black font-sans">
 <Star className="w-2.5 h-2.5 fill-[var(--ink)]" />
 <span>Principal</span>
 </span>
 ) : (
 <button
 type="button"
 onClick={() => setSelectedMainBandId(b.band_id)}
 className="text-[10px] font-sans text-[var(--ink-2)] hover:text-[var(--acc)] px-1.5 py-0.5 rounded cursor-pointer"
 >
 Hacer principal
 </button>
 )}

 {localAvailableBands.length > 1 && (
 <button
 type="button"
 disabled={isDeleting}
 onClick={() => setBandToDeleteInProfile({ id: b.band_id, name: b.bandName })}
 title="Eliminar proyecto"
 className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--alert)] hover:bg-[var(--alert)]/10 transition-colors cursor-pointer"
 >
 {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 ) : (
 <div className="flex items-center justify-between p-2 rounded-[var(--r-s)] bg-[var(--surface)]">
 <span className="text-xs font-bold text-[var(--ink)]">{activeBandName || currentUser.bandName ||'BAKANDEYA'}</span>
 <span className="text-[10px] font-sans text-[var(--acc)]">Principal</span>
 </div>
 )}
 </div>
 </div>

 {/* Language Selection */}
 <div className="space-y-2 pt-2 /80">
 <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <Globe className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Idioma de la Plataforma / Language</span>
 </span>
 <span className="text-[10px] text-[var(--acc)]/80 font-normal font-sans">Multilenguaje</span>
 </label>
 <div className="pt-1">
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
 {SUPPORTED_LANGUAGES.map((lang) => {
 const isSelected = lang.code === language;
 return (
 <button
 key={lang.code}
 type="button"
 onClick={() => setLanguage(lang.code)}
 className={`p-2.5 rounded-[var(--r-m)] text-left transition-all cursor-pointer flex items-center justify-between gap-2 active:scale-95 ${
 isSelected
 ?'bg-[var(--acc)]/20 /60 text-[var(--acc)]/70 font-bold'
 : isStitchLight
 ?'bg-[var(--bg)] text-[var(--ink-2)] hover:bg-[var(--sunken)]'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover: hover:text-[var(--ink)]'
 }`}
 >
 <div className="flex items-center gap-2 min-w-0">
 <span className="text-base leading-none">{lang.flag}</span>
 <span className="text-xs truncate">{lang.label}</span>
 </div>
 {isSelected && <Check className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />}
 </button>
 );
 })}
 </div>
 </div>
 </div>

 {/* Collapsible Appearance Settings (Theme & Font) */}
 {(onThemeChange || onFontChange) && (
 <div className="pt-3 /80">
 <button
 type="button"
 onClick={() => setShowAppearance(!showAppearance)}
 className={`w-full p-2.5 rounded-[var(--r-m)] text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink-2)] hover:bg-[var(--sunken)]' :'bg-[var(--surface)] text-[var(--ink-2)] hover:'
 }`}
 >
 <div className="flex items-center gap-2">
 <Palette className="w-4 h-4 text-[var(--acc)]" />
 <span className="text-xs font-sans font-semibold">Personalización Visual (Tema y Fuente)</span>
 </div>
 <div className="flex items-center gap-1 text-[11px] font-sans text-[var(--ink-2)]">
 <span>{showAppearance ?'Ocultar' :'Configurar'}</span>
 <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAppearance ?'rotate-180 text-[var(--acc)]' :''}`} />
 </div>
 </button>

 {showAppearance && (
 <div className="mt-3 p-3.5 rounded-[var(--r-m)] space-y-4 bg-[var(--surface)]/50 animate-in fade-in duration-200">
 {onThemeChange && (
 <div className="space-y-2">
 <label className="text-[11px] font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
 <Palette className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Tema Visual de la Aplicación</span>
 </label>
 <div className="grid grid-cols-2 gap-2">
 {Object.entries(THEMES).map(([key, t]) => {
 const isSelected = currentTheme === key;
 return (
 <button
 key={key}
 type="button"
 onClick={() => onThemeChange(key as ThemeName)}
 className={`p-2 rounded-[var(--r-m)] text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
 isSelected
 ?'bg-[var(--acc)]/15 /50 text-[var(--acc)]/70 font-bold'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:'
 }`}
 >
 <span className="text-[11px] font-sans truncate">{t.name}</span>
 {isSelected && <Check className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />}
 </button>
 );
 })}
 </div>
 </div>
 )}

 {onFontChange && (
 <div className="space-y-2 pt-2 /60">
 <label className="text-[11px] font-sans font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
 <Type className="w-3.5 h-3.5 text-[var(--ok)]" />
 <span>Estilo de Fuente & Tipografía</span>
 </label>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
 {FONT_PRESETS.map((p) => {
 const isSelected = currentFont === p.id;
 return (
 <button
 key={p.id}
 type="button"
 onClick={() => onFontChange(p.id)}
 className={`p-2 rounded-[var(--r-m)] text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
 isSelected
 ?'bg-[var(--ok)]/15/50 text-[var(--ink-2)] font-bold'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:'
 }`}
 >
 <div className="flex items-center justify-between gap-1 w-full">
 <span className="text-[11px] font-bold truncate" style={{ fontFamily: p.displayFont }}>
 {p.name}
 </span>
 {isSelected && <Check className="w-3.5 h-3.5 text-[var(--ok)] shrink-0" />}
 </div>
 </button>
 );
 })}
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 )}

 {/* Sistema «Espectro» — el rediseño en curso, real y en vivo. Independiente del
 selector THEMES de arriba (ese es el sistema viejo, con colors/ThemeColors por
 prop — sigue vivo y no se toca). Este escribe directo en <html data-theme> via
 src/utils/temaEspectro.ts, asi que el cambio es instantaneo sin re-render del
 arbol: las 4.365 clases de color se resuelven solas via CSS vars. Por defecto'classic' = exactamente la app de siempre; el resto son las pantallas ya
 migradas (login, panel) mas el resto de la app tal cual, mientras avanza. */}
 <div className="pt-3 /80">
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/[0.04] space-y-2.5">
 <label className="text-[11px] font-sans font-semibold text-[var(--acc)]/70 flex items-center gap-1.5">
 <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Nuevo diseño — Espectro (en pruebas)</span>
 </label>
 <p className="text-[11px] text-[var(--ink-2)] leading-relaxed">
 Ve probando el rediseño mientras migro pantalla a pantalla. Lo que aún no está
 migrado se ve igual que siempre en cualquiera de las cuatro opciones — no rompe nada.
 </p>
 <div className="grid grid-cols-2 gap-2">
 {PREFERENCIAS_ESPECTRO.map((p) => {
 const isSelected = prefEspectro === p.id;
 return (
 <button
 key={p.id}
 type="button"
 onClick={() => {
 setPrefEspectro(p.id);
 guardarPreferenciaEspectro(p.id);
 }}
 className={`p-2 rounded-[var(--r-m)] text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 ${
 isSelected
 ?'bg-[var(--acc)]/15 /50 text-[var(--acc)]/70 font-bold'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:'
 }`}
 title={p.descripcion}
 >
 <span className="text-[11px] font-sans truncate">{p.etiqueta}</span>
 {isSelected && <Check className="w-3.5 h-3.5 text-[var(--acc)] shrink-0" />}
 </button>
 );
 })}
 </div>
 <p className="text-[10px] text-[var(--ink-2)] font-sans">
 Ahora mismo: {resolverTemaEspectro(prefEspectro) ==='dark' ?'oscuro' : resolverTemaEspectro(prefEspectro) ==='light' ?'claro' :'clásico'}
 </p>
 </div>
 </div>

 {/* Agent Configuration Entry Point (Autonomía, Horarios & Email) - un único modal
 centralizado (AgentAutonomySettingsModal, el mismo que usan Dashboard/Chatbot/BookingCRM)
 en vez de duplicar aquí el formulario de horarios (antes BandScheduleConfig, ahora
 eliminado) y de email. EmailAccountConfig sigue siendo el mismo componente compartido,
 solo que ahora se llega a él siempre por el mismo camino. */}
 {currentUser.band_id && !isPromoUser && (
 <div className="pt-3 /80">
 <button
 type="button"
 onClick={() => setShowAgentConfig(true)}
 className={`w-full p-2.5 rounded-[var(--r-m)] text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
 isStitchLight ?'bg-[var(--bg)] text-[var(--ink-2)] hover:bg-[var(--sunken)]' :'bg-[var(--surface)] text-[var(--ink-2)] hover:'
 }`}
 >
 <div className="flex items-center gap-2">
 <Bot className="w-4 h-4 text-[var(--acc)]" />
 <span className="text-xs font-sans font-semibold">Configuración de Agentes IA (Autonomía, Horarios y Email)</span>
 </div>
 <span className="text-[11px] font-sans font-bold text-[var(--acc)] flex items-center gap-1">
 <span>Abrir</span>
 <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
 </span>
 </button>
 </div>
 )}

 <div className="pt-2 bg-[var(--surface)]/80 space-y-3">
 <div className="flex items-center gap-1.5 text-xs font-sans font-bold text-[var(--acc)]">
 <Key className="w-4 h-4" />
 <span>Cambiar Contraseña</span>
 </div>

 <div className="space-y-1">
 <label className="text-[11px] font-sans text-[var(--ink-2)]">
 Nueva Contraseña Secreta
 </label>
 <input
 type="password"
 value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 placeholder="Dejar en blanco para mantener la actual..."
 className={`w-full px-3 py-2 rounded-[var(--r-m)] text-xs outline-none ${
 isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)] focus:-amber-0/50'
 }`}
 />
 </div>

 {newPassword.length > 0 && (
 <div className="space-y-1 animate-in fade-in duration-200">
 <label className="text-[11px] font-sans text-[var(--ink-2)]">
 Confirmar Nueva Contraseña
 </label>
 <input
 type="password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 placeholder="Repite la nueva contraseña..."
 className={`w-full px-3 py-2 rounded-[var(--r-m)] text-xs outline-none ${
 isStitchLight ?'bg-[var(--bg)]' :'bg-[var(--surface)] focus:-amber-0/50'
 }`}
 />
 </div>
 )}
 </div>

 {/* Admin Band Management Section inside Profile */}
 {(isAdmin || currentUser.role ==='leader' || currentUser.role ==='admin') && onOpenBandManagement && (
 <div className="pt-2 bg-[var(--surface)]/80 space-y-2">
 <label className="text-xs font-sans font-semibold text-[var(--ink-2)] flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <Shield className="w-3.5 h-3.5 text-[var(--tentative)]" />
 <span>Administración de la Banda</span>
 </span>
 <span className="text-[10px] text-[var(--tentative)] font-sans font-bold">Solo Admins</span>
 </label>

 <button
 type="button"
 onClick={() => {
 onClose();
 onOpenBandManagement();
 }}
 className={`w-full p-3 rounded-[var(--r-m)] text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
 isStitchLight
 ?'bg-[var(--tentative)]/5 hover:bg-[var(--acc)]/15 text-[var(--ink-2)]'
 :'bg-[var(--tentative)]/15 -indigo-500/30 hover:-indigo-500/60 text-[var(--tentative)]/40'
 }`}
 >
 <div className="flex items-center gap-2.5">
 <Users className="w-4 h-4 text-[var(--tentative)] shrink-0" />
 <div>
 <div className="text-xs font-bold font-sans">Gestión de la Banda</div>
 <div className="text-[10px] opacity-75 font-sans">Crear nuevos músicos, cambiar sus contraseñas y permisos</div>
 </div>
 </div>
 <span className="text-xs font-sans font-bold px-2 py-0.5 rounded bg-[var(--acc)]/15 text-[var(--ink-2)] -indigo-500/30">Abrir &rarr;</span>
 </button>
 </div>
 )}

 <button
 type="submit"
 disabled={loading}
 className={`w-full py-2.5 px-4 rounded-[var(--r-m)] font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 active:scale-98 ${
' bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)]'
 }`}
 >
 {loading ? (
 <span>Guardando cambios...</span>
 ) : (
 <>
 <Check className="w-4 h-4" />
 <span>Guardar Cambios de Perfil</span>
 </>
 )}
 </button>
 </form>

 {/* Modal Footer */}
 <div className={`px-6 py-3 flex justify-between items-center ${
 isStitchLight ?'-slate-200 bg-[var(--bg)]' :'bg-[var(--surface)] bg-[var(--surface)]/60'
 }`}>
 {(isAdmin || currentUser.role ==='leader' || currentUser.role ==='admin') && onOpenBandManagement ? (
 <button
 onClick={() => {
 onClose();
 onOpenBandManagement();
 }}
 className="text-[11px] font-sans text-[var(--ok)] hover:underline flex items-center gap-1 cursor-pointer"
 >
 <Shield className="w-3 h-3" />
 <span>Gestión de la Banda</span>
 </button>
 ) : (
 <span className="text-[10px] font-sans text-[var(--ink-2)]">BandManager.io v2.0</span>
 )}

 <button
 onClick={onClose}
 className="px-4 py-1.5 rounded-[var(--r-s)] text-xs font-sans text-[var(--ink-2)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 Cerrar
 </button>
 </div>
 </div>

 {/* Upgrade Plan Modal */}
 {showUpgradeModal && (
 <ModalPortal isOpen={showUpgradeModal} onClose={() => setShowUpgradeModal(false)}>
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/85 overflow-y-auto overscroll-contain animate-in fade-in duration-200 text-left">
 <div className={`w-full max-w-lg rounded-[var(--r-l)] overflow-hidden flex flex-col my-auto max-h-[90vh] ${
 isStitchLight ?'bg-[var(--surface)] text-[var(--ink)]' :'bg-[var(--surface)] /30 text-[var(--ink-2)]'
 }`}>
 <div className="px-6 py-4 bg-gradient-to-r from-amber-950/60 via-[var(--surface)] to-[var(--surface)] /20 flex justify-between items-center">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center">
 <Sparkles className="w-4 h-4 text-[var(--acc)]" />
 </div>
 <div>
 <h3 className="font-bold text-sm text-[var(--acc)]/70 font-sans tracking-wider">Cambiar Plan de Suscripción</h3>
 <p className="text-[10px] text-[var(--ink-2)] font-sans">Selecciona el plan para tu proyecto musical</p>
 </div>
 </div>
 <button
 onClick={() => setShowUpgradeModal(false)}
 className="p-1 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
 {currentUser?.estado_suscripcion ==='pago_pendiente' && (
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--alert)]/20 text-[var(--ink)] text-xs flex items-center justify-between gap-3">
 <div className="flex items-center gap-2">
 <AlertCircle className="w-5 h-5 text-[var(--alert)] shrink-0" />
 <span>Pago pendiente. Actualiza tu método de pago para mantener tus funciones.</span>
 </div>
 <button
 type="button"
 onClick={async () => {
 try {
 // Sin email de repuesto: el que había era el del dueño de la plataforma y abría SU
 // portal de facturación a quien no tuviera email. Lo resuelve el servidor.
 const res = await api.createPortalSession({
 bandId: currentUser.band_id,
 returnUrl: window.location.href
 });
 if (res.success && res.url) window.location.href = res.url;
 } catch (e) {}
 }}
 className="px-3 py-1 bg-[var(--alert)] hover:bg-[var(--alert)] text-[var(--ink)] font-sans font-bold text-[10px] rounded-[var(--r-s)] transition-all cursor-pointer whitespace-nowrap"
 >
 Actualizar Tarjeta
 </button>
 </div>
 )}

 {currentUser?.plan_pendiente && (
 <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--ink)] text-xs flex items-center gap-2.5">
 <Calendar className="w-4 h-4 text-[var(--acc)] shrink-0" />
 <span>
 Cambio programado a <strong className="uppercase font-sans text-[var(--acc)]/70">{currentUser.plan_pendiente.replace('_','')}</strong> al finalizar el ciclo.
 </span>
 </div>
 )}

 <div className="flex items-center justify-between gap-2 p-3 rounded-[var(--r-m)] bg-[var(--surface)]/80">
 <div className="flex items-center gap-2">
 <CreditCard className="w-4 h-4 text-[var(--acc)] shrink-0" />
 <span className="text-xs text-[var(--ink-2)] font-sans">Facturación & Tarjetas en Stripe:</span>
 </div>
 <button
 type="button"
 onClick={async () => {
 try {
 const res = await api.createPortalSession({
 bandId: currentUser.band_id,
 returnUrl: window.location.href
 });
 if (res.success && res.url) {
 window.location.href = res.url;
 } else {
 alert(res.error ||'No se pudo abrir el portal de Stripe');
 }
 } catch (err: any) {
 alert('Error al conectar con Stripe:' + err.message);
 }
 }}
 className="px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--acc)]/70 text-xs font-sans font-bold transition-all flex items-center gap-1.5 cursor-pointer"
 >
 <span>Portal de Stripe</span>
 <ExternalLink className="w-3 h-3" />
 </button>
 </div>

 <p className="text-xs text-[var(--ink-2)] leading-relaxed">
 Tu proyecto tiene actualmente activo el <strong className="text-[var(--acc)]/70">{currentPlanDef.name}</strong>. Puedes cambiar de plan al instante haciendo clic en el botón de la opción que desees:
 </p>

 <div className="space-y-3">
 {Object.values(PLANS).map((plan) => {
 const isCurrent = plan.id === currentPlanDef.id;
 return (
 <div
 key={plan.id}
 className={`p-4 rounded-[var(--r-m)] transition-all ${
 isCurrent
 ?'bg-[var(--acc)]/10 /50 ring-1 ring-amber-0/30'
 :'bg-[var(--surface)]/60 hover:'
 }`}
 >
 <div className="flex items-center justify-between flex-wrap gap-2">
 <div className="flex items-center gap-2">
 <span className="font-bold text-xs text-[var(--ink)] font-sans">{plan.name}</span>
 <span 
 className="text-[9px] font-sans font-bold px-2 py-0.5 rounded"
 style={{ backgroundColor: `${plan.color}20`, color: plan.color, borderColor: `${plan.color}40` }}
 >
 {plan.badge}
 </span>
 {isCurrent && (
 <span className="text-[9px] font-sans font-bold px-2 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc)]/70">
 Plan Actual
 </span>
 )}
 </div>
 <span className="text-xs font-bold font-sans text-[var(--acc)]">{plan.price}</span>
 </div>

 {plan.stickerGift && (
 <div className="mt-2 px-2.5 py-1 rounded-[var(--r-s)] bg-[var(--acc)]/60/10 flex items-center gap-1.5 text-[10px] font-sans text-[var(--acc)]/70 font-bold">
 <Sparkles className="w-3 h-3 text-[var(--acc)] shrink-0" />
 <span>Regalo de bienvenida: {plan.stickerGift.qty}</span>
 </div>
 )}

 <div className="flex items-center justify-between text-[11px] font-sans text-[var(--ink-2)] mt-1.5">
 <span>{plan.description}</span>
 <span className="text-[var(--ink-2)] font-bold shrink-0">{plan.credits}</span>
 </div>

 <ul className="mt-2.5 space-y-1 font-sans">
 {plan.features.map((feat, idx) => (
 <li key={idx} className="text-[10.5px] text-[var(--ink-2)] flex items-center gap-1.5">
 <Check className="w-3 h-3 text-[var(--ok)] shrink-0" />
 <span>{feat}</span>
 </li>
 ))}
 </ul>

 <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 /80">
 <span className="text-[10px] font-sans text-[var(--ink-2)]">
 {isCurrent ?'Tu plan activo' :'Cambio de plan inmediato'}
 </span>
 {isCurrent ? (
 <span className="text-[10px] font-sans font-bold px-2.5 py-1 rounded bg-[var(--acc)]/20 text-[var(--acc)]/70 flex items-center gap-1">
 <Check className="w-3 h-3 text-[var(--acc)]" />
 <span>Activo</span>
 </span>
 ) : (
 <button
 type="button"
 onClick={async () => {
 try {
 if (plan.id !=='ensayo') {
 await api.startCheckout({
 planId: plan.id,
 billingInterval:'monthly',
 bandId: currentUser.band_id ||'default',
 userEmail: (currentUser?.email && currentUser.email.includes('@')) ? currentUser.email : undefined
 });
 setShowUpgradeModal(false);
 return;
 }

 if (currentUser?.id) {
 await api.updateUser(currentUser.id, { plan: plan.id, band_id: currentUser.band_id } as any);
 }
 const updatedUser = { ...currentUser, plan: plan.id };
 localStorage.setItem('bakandeya_user', JSON.stringify(updatedUser));
 if (onUpdateUser) onUpdateUser(updatedUser as User);
 setShowUpgradeModal(false);
 alert(`¡Plan de suscripción cambiado con éxito a ${plan.name}! Módulos activados.`);
 } catch (e: any) {
 console.error('Error al cambiar plan:', e);
 alert(e?.message ||'No se pudo cambiar el plan. Reintenta en unos instantes.');
 }
 }}
 className="px-3 py-1.5 rounded-[var(--r-s)] bg-gradient-to-r from-[var(--acc)] to-amber-600 hover:from-amber-400 hover:to-amber-500 text-[var(--acc-ink)] font-bold font-sans text-xs transition-all hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
 >
 <Sparkles className="w-3 h-3 fill-stone-950" />
 <span>Seleccionar {plan.name}</span>
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>

 <div className="px-6 py-3 bg-[var(--surface)] flex items-center justify-between">
 {onNavigateToPlanes ? (
 <button
 type="button"
 onClick={() => {
 setShowUpgradeModal(false);
 onClose();
 onNavigateToPlanes();
 }}
 className="text-xs font-sans text-[var(--acc)] hover:text-[var(--acc)]/70 flex items-center gap-1.5 cursor-pointer font-bold"
 >
 <span>Ver comparativa completa y tabla de planes →</span>
 </button>
 ) : <span />}
 <button
 onClick={() => setShowUpgradeModal(false)}
 className="px-4 py-1.5 rounded-[var(--r-s)] text-xs font-sans bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] transition-colors cursor-pointer"
 >
 Cerrar
 </button>
 </div>
 </div>
 </div>
 </ModalPortal>
 )}

 {/* Panel de Control de Agentes IA (Autonomía, Email & Buzón, Horarios, Tono, Auditoría) */}
 {currentUser.band_id && !isPromoUser && (
 <AgentAutonomySettingsModal
 isOpen={showAgentConfig}
 onClose={() => setShowAgentConfig(false)}
 bandName={activeBandName || currentUser.bandName}
 bandId={currentUser.band_id}
 currentUser={currentUser}
 isStitchLight={isStitchLight}
 />
 )}
 </div>
 </ModalPortal>
 );
};
