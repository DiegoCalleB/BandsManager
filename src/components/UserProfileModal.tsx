import React, { useState, useEffect } from 'react';
import { User as UserIcon, Key, Music, Check, AlertCircle, X, Shield, Palette, Users, Type, Mail, HardDrive, Unlink, Loader2, Guitar, Upload, Camera, Crown, Sparkles, Globe, ChevronDown, Star, ArrowUpDown, ArrowUpCircle, ArrowDownCircle, Plus, Trash2, CreditCard, ExternalLink, Calendar } from 'lucide-react';
import { User, ThemeName, GoogleOAuthConfig } from '../types';
import { THEMES } from '../utils/theme';
import { FONT_PRESETS, FontPresetKey } from '../utils/typography';
import { googleSignIn, logout } from '../utils/gmail';
import { uploadFileToServer } from '../utils/audioStorage';
import { api, getAuthHeaders } from '../services/api';
import { getPlanDefinition, getPlanChangeType, PLANS } from '../utils/planPermissions';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';

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
 onNavigateToPlanes
}) => {
 const { language, setLanguage } = useLanguage();
 const [name, setName] = useState(currentUser.name || '');
 const [instrument, setInstrument] = useState(currentUser.instrument || '');
 const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || '#10b981');
 const [selectedMainBandId, setSelectedMainBandId] = useState(currentUser.main_band_id || currentUser.band_id || 'band-bakandeya');
 const [bandLogoUrl, setBandLogoUrl] = useState<string>(epkConfig?.logoUrl || '');

 useEffect(() => {
   if (currentUser) {
     setName(currentUser.name || '');
     setInstrument(currentUser.instrument || '');
     setAvatarColor(currentUser.avatarColor || '#10b981');
     setSelectedMainBandId(currentUser.main_band_id || currentUser.band_id || 'band-bakandeya');
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
 
 const currentPlanDef = getPlanDefinition(currentUser.plan);
 const isHighestPlan = currentPlanDef.id === 'cabeza_de_cartel';
 
 // Password change state
 const [newPassword, setNewPassword] = useState('');
 const [confirmPassword, setConfirmPassword] = useState('');

 const handleLogoChangeInProfile = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file) return;
  setUploadingLogo(true);
  setError(null);
  setSuccessMsg(null);
  try {
   const userBandId = currentUser.band_id || 'band-bakandeya';
   const url = await uploadFileToServer(file, { bandId: userBandId, category: 'logo' });
   setBandLogoUrl(url);

   const updatedEpk = { ...epkConfig, logoUrl: url };
   if (onUpdateEpkConfig) {
    await onUpdateEpkConfig(updatedEpk);
   } else {
    const authHeaders = getAuthHeaders() as Record<string, string>;
    await fetch('/api/epk', {
     method: 'PUT',
     headers: { 'Content-Type': 'application/json', ...authHeaders },
     body: JSON.stringify({ logoUrl: url, bandId: userBandId })
    });
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
 const [createBandLeaderName, setCreateBandLeaderName] = useState(currentUser.name || currentUser.username || '');
 const [createBandStyle, setCreateBandStyle] = useState('');
 const [createBandLocation, setCreateBandLocation] = useState('España');
 const [createBandPlan, setCreateBandPlan] = useState<'emergente' | 'profesional' | 'elite'>('profesional');
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
   try {
     const res = await api.createBand({
       bandName: createBandName.trim(),
       leaderName: createBandLeaderName.trim() || currentUser.name || currentUser.username || 'Líder',
       plan: createBandPlan,
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
       if (createBandPlan && (createBandPlan as string) !== 'ensayo' && res.band_id) {
         try {
           await api.startCheckout({
             planId: createBandPlan,
             billingInterval: 'monthly',
             bandId: res.band_id,
             userEmail: currentUser.email || 'diego.delacalleb@gmail.com'
           });
           setShowCreateBandSection(false);
           setCreateBandName('');
           setCreateBandStyle('');
           return;
         } catch (stripeErr) {
           console.error('Error initiating Stripe checkout on create band in profile:', stripeErr);
         }
       }

       setSuccessMsg(`¡Proyecto "${createBandName.trim()}" creado y configurado con éxito!`);
       setShowCreateBandSection(false);
       setCreateBandName('');
       setCreateBandStyle('');
       if (onRefreshData) await onRefreshData();
     } else {
       setError((res as any)?.error || 'No se pudo crear el proyecto musical');
     }
   } catch (err: any) {
     console.error('Error creating band in profile modal:', err);
     setError(err.message || 'Error al crear el nuevo proyecto');
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
         setSelectedMainBandId(res.user.main_band_id || res.user.band_id || 'band-bakandeya');
       }
       if (res.availableBands && Array.isArray(res.availableBands)) {
         setLocalAvailableBands(res.availableBands);
       }
       setSuccessMsg(`"${targetBandName}" eliminada correctamente de tu cuenta.`);
       if (onRefreshData) await onRefreshData();
     } else {
       setError(res?.message || 'Error al eliminar la banda');
     }
   } catch (err: any) {
     console.error('Error deleting band in profile modal:', err);
     setError(err.message || 'Error al eliminar la banda de tu usuario');
   } finally {
     setDeletingBandId(null);
   }
 };

 // Google OAuth state
 const [oauthLoading, setOauthLoading] = useState(false);
 const [googleOAuthState, setGoogleOAuthState] = useState<GoogleOAuthConfig | null>(
 currentUser.googleOAuth || null
 );

 const handleConnectGoogleOAuth = async () => {
 setOauthLoading(true);
 setError(null);
 setSuccessMsg(null);
 try {
 const res = await googleSignIn();
 const googleData: GoogleOAuthConfig = {
 connected: true,
 email: res.user?.email || '',
 displayName: res.user?.displayName || res.user?.email || '',
 photoURL: res.user?.photoURL || '',
 accessToken: res.accessToken,
 scopes: [
 'https://www.googleapis.com/auth/gmail.readonly',
 'https://www.googleapis.com/auth/gmail.compose',
 'https://www.googleapis.com/auth/gmail.send',
 'https://www.googleapis.com/auth/drive.readonly'
 ],
 connectedAt: new Date().toISOString()
 };

 setGoogleOAuthState(googleData);

 const token = localStorage.getItem('bakandeya_token');
 const updateRes = await fetch(`/api/users/${currentUser.id}`, {
 method: 'PUT',
 headers: {
 'Content-Type': 'application/json',
 ...(token ? { Authorization: `Bearer ${token}` } : {})
 },
 body: JSON.stringify({ googleOAuth: googleData })
 });

 if (updateRes.ok) {
 const updatedUser = await updateRes.json();
 onUpdateUser(updatedUser);
 setSuccessMsg(`¡Cuenta Google (${googleData.email}) conectada con OAuth 2.0 para Gmail y Drive!`);
 } else {
 setSuccessMsg(`Cuenta Google autenticada: ${googleData.email}`);
 }
 } catch (err: any) {
 console.error("Error connecting Google OAuth:", err);
 setError(err.message || 'Error al conectar con Google OAuth.');
 } finally {
 setOauthLoading(false);
 }
 };

 const handleDisconnectGoogleOAuth = async () => {
 setOauthLoading(true);
 try {
 await logout();
 const disconnectedState: GoogleOAuthConfig = { connected: false };
 setGoogleOAuthState(disconnectedState);

 const token = localStorage.getItem('bakandeya_token');
 const updateRes = await fetch(`/api/users/${currentUser.id}`, {
 method: 'PUT',
 headers: {
 'Content-Type': 'application/json',
 ...(token ? { Authorization: `Bearer ${token}` } : {})
 },
 body: JSON.stringify({ googleOAuth: disconnectedState })
 });

 if (updateRes.ok) {
 const updatedUser = await updateRes.json();
 onUpdateUser(updatedUser);
 }
 setSuccessMsg('Conexión con Google revocada.');
 } catch (err: any) {
 setError(err.message || 'Error al desconectar de Google.');
 } finally {
 setOauthLoading(false);
 }
 };

 const colors = [
 '#10b981', // Emerald
 '#3b82f6', // Blue
 '#ec4899', // Pink
 '#f59e0b', // Amber
 '#8b5cf6', // Purple
 '#06b6d4', // Cyan
 '#f97316', // Orange
 '#ef4444' // Red
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
 method: 'PUT',
 headers: {
  'Content-Type': 'application/json',
  ...(token ? { 'Authorization': `Bearer ${token}` } : {})
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
 throw new Error(data.error || 'Error al actualizar el perfil');
 }

 setSuccessMsg('¡Perfil y contraseña actualizados correctamente!');
 setNewPassword('');
 setConfirmPassword('');
 onUpdateUser(data);
 setTimeout(() => {
 onClose();
 }, 1200);
 } catch (err: any) {
 setError(err.message || 'Error en el servidor');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
 <div 
 className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col ${
 isStitchLight 
 ? 'bg-white -slate-200 text-slate-800' 
 : 'bg-neutral-900 -neutral-800 text-neutral-100'
 }`}
 >
 {/* Modal Header */}
 <div className={`px-6 py-4 flex justify-between items-center ${
 isStitchLight ? '-slate-200 bg-slate-50' : '-neutral-800 bg-neutral-950/60'
 }`}>
 <div className="flex items-center gap-3">
 <div 
 className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner uppercase font-mono text-sm shrink-0"
 style={{ backgroundColor: avatarColor }}
 >
 {name.slice(0, 2) || 'BK'}
 </div>
 <div>
 <h3 className="font-bold font-display uppercase tracking-wider text-sm flex items-center gap-2">
 <span>Mi Perfil & Contraseña</span>
 </h3>
 <p className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5 flex-wrap">
 <span>@{currentUser.username} • {isAdmin ? 'Administrador' : 'Músico'}</span>
 <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-sm">
 <Sparkles className="w-2.5 h-2.5 text-amber-400" />
 {currentPlanDef.name}
 </span>
 </p>
 </div>
 </div>
 <button
 onClick={onClose}
 className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50 transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Form Body */}
 <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
 {error && (
 <div className="p-3 bg-rose-500/10 -rose-500/20 rounded-xl text-xs text-rose-400 flex items-center gap-2">
 <AlertCircle className="w-4 h-4 shrink-0" />
 <span>{error}</span>
 </div>
 )}

 {successMsg && (
 <div className="p-3 bg-emerald-500/10 -emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2">
 <Check className="w-4 h-4 shrink-0" />
 <span>{successMsg}</span>
 </div>
 )}

 {/* Plan Suscrito & Upgrade Section */}
 <div className={`p-3.5 rounded-xl border relative overflow-hidden transition-all ${
 isStitchLight 
 ? 'bg-slate-50 border-amber-200' 
 : 'bg-gradient-to-r from-amber-950/30 via-neutral-900 to-neutral-950 border-amber-500/30'
 }`}>
 <div className="flex items-center justify-between gap-3">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
 <Crown className="w-5 h-5 text-amber-400" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-mono text-neutral-400 uppercase tracking-wide">Plan:</span>
 <span className="text-xs font-bold text-amber-300 font-mono">{currentPlanDef.name}</span>
 </div>
 <p className="text-[11px] text-neutral-300 mt-0.5">{currentPlanDef.description}</p>
 </div>
 </div>

 {!isHighestPlan && (
 <button
 type="button"
 onClick={() => setShowUpgradeModal(true)}
 className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 text-xs font-bold font-mono transition-all duration-200 shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 flex items-center gap-1.5 shrink-0 cursor-pointer"
 >
 <Sparkles className="w-3.5 h-3.5 fill-stone-950" />
 <span>Upgrade</span>
 </button>
 )}
 </div>
 </div>

 <div className="space-y-1">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
 <UserIcon className="w-3.5 h-3.5 text-emerald-400" />
 <span>Nombre Completo / Apodo</span>
 </label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="Tu nombre..."
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800 focus:-emerald-500/50'
 }`}
 required
 />
 </div>

 <div className="space-y-1">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
 <Music className="w-3.5 h-3.5 text-emerald-400" />
 <span>Instrumento / Puesto</span>
 </label>
 <input
 type="text"
 value={instrument}
 onChange={(e) => setInstrument(e.target.value)}
 placeholder="Ej: Violín, Percusión, Batería, Técnico de Sonido"
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800 focus:-emerald-500/50'
 }`}
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
 <Palette className="w-3.5 h-3.5 text-emerald-400" />
 <span>Color de Avatar</span>
 </label>
 <div className="flex items-center gap-2 pt-0.5">
 {colors.map((c) => (
 <button
 key={c}
 type="button"
 onClick={() => setAvatarColor(c)}
 className={`w-7 h-7 rounded-full transition-transform cursor-pointer ${
 avatarColor === c ? 'scale-110 -white ring-2 ring-emerald-500' : '-transparent opacity-75 hover:opacity-100'
 }`}
 style={{ backgroundColor: c }}
 />
 ))}
 </div>
 </div>

 {/* Active Band Logo Edit Section (Netflix Profile Style) */}
 <div className="space-y-2 pt-2 border-t border-neutral-800/80">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <Camera className="w-3.5 h-3.5 text-amber-400" />
 <span>Logo de tu Banda / Proyecto Musical</span>
 </span>
 <span className="text-[10px] text-amber-400/80 font-normal font-mono">Editar Avatar</span>
 </label>

 <div className={`p-3 rounded-xl flex items-center justify-between gap-3 ${
 isStitchLight ? 'bg-slate-50 border border-slate-200' : 'bg-neutral-950 border border-neutral-800'
 }`}>
 <div className="flex items-center gap-3">
 <div className="w-12 h-12 rounded-xl bg-neutral-900 border border-neutral-700 overflow-hidden flex items-center justify-center p-1 shrink-0 relative group">
 {bandLogoUrl && !logoImgError ? (
 <img src={bandLogoUrl} alt="Logo Banda" onError={() => setLogoImgError(true)} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
 ) : (
 <Guitar className="w-6 h-6 text-amber-400" />
 )}
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap">
 <p className="text-xs font-bold text-white">{activeBandName || currentUser.bandName || 'Tu Banda'}</p>
 <button
   type="button"
   onClick={() => setShowUpgradeModal(true)}
   className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-extrabold uppercase tracking-wider bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 shadow-sm cursor-pointer transition-colors"
   title="Cambiar o mejorar suscripción"
 >
   <Sparkles className="w-2.5 h-2.5 text-amber-400" />
   <span>{currentPlanDef.name}</span>
   <ArrowUpDown className="w-2.5 h-2.5 text-amber-400 ml-0.5" />
 </button>
 </div>
 <p className="text-[10px] text-neutral-400 font-mono">Avatar / Logo oficial de la banda</p>
 </div>
 </div>

 <label className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95">
 {uploadingLogo ? (
 <>
 <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
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
 <div className="space-y-2 pt-2 border-t border-neutral-800/80">
   <div className="flex items-center justify-between">
     <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
       <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
       <span>Proyectos y Banda Principal</span>
     </label>
     <div className="flex items-center gap-2">
       <button
         type="button"
         onClick={() => setShowCreateBandSection(!showCreateBandSection)}
         className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 cursor-pointer font-bold"
       >
         <Plus className="w-3 h-3" />
         <span>{showCreateBandSection ? 'Cerrar' : '+ Crear Proyecto'}</span>
       </button>
       {onOpenBandSwitcher && (
         <button
           type="button"
           onClick={() => {
             onClose();
             onOpenBandSwitcher();
           }}
           className="text-[11px] font-mono text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1 cursor-pointer"
         >
           <span>Selector visual</span>
           <ChevronDown className="w-3 h-3 -rotate-90" />
         </button>
       )}
     </div>
   </div>

   {/* Creation Form Accordion */}
   {showCreateBandSection && (
     <div className={`p-3.5 rounded-xl border space-y-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
       isStitchLight ? 'bg-emerald-50/50 border-emerald-200' : 'bg-emerald-950/20 border-emerald-800/50'
     }`}>
       <div className="flex items-center justify-between">
         <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
           <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
           <span>Crear Nuevo Proyecto o Banda</span>
         </p>
         <button
           type="button"
           onClick={() => setShowCreateBandSection(false)}
           className="text-neutral-400 hover:text-neutral-200 p-1 cursor-pointer"
         >
           <X className="w-3.5 h-3.5" />
         </button>
       </div>

       <div className="space-y-2">
         <div>
           <label className="text-[10px] font-mono text-neutral-400 block mb-1">Nombre del Proyecto / Banda *</label>
           <input
             type="text"
             required
             value={createBandName}
             onChange={(e) => setCreateBandName(e.target.value)}
             placeholder="Ej. Los Nocturnos, Cuarteto Acústico..."
             className={`w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none font-medium ${
               isStitchLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-700 text-white'
             }`}
           />
         </div>

         <div className="grid grid-cols-2 gap-2">
           <div>
             <label className="text-[10px] font-mono text-neutral-400 block mb-1">Estilo / Género</label>
             <input
               type="text"
               value={createBandStyle}
               onChange={(e) => setCreateBandStyle(e.target.value)}
               placeholder="Ej. Indie Rock, Pop..."
               className={`w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none ${
                 isStitchLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-700 text-white'
               }`}
             />
           </div>
           <div>
             <label className="text-[10px] font-mono text-neutral-400 block mb-1">Ubicación</label>
             <input
               type="text"
               value={createBandLocation}
               onChange={(e) => setCreateBandLocation(e.target.value)}
               placeholder="Ej. Madrid, Barcelona..."
               className={`w-full px-2.5 py-1.5 rounded-lg text-xs border outline-none ${
                 isStitchLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-neutral-900 border-neutral-700 text-white'
               }`}
             />
           </div>
         </div>

         <div>
           <label className="text-[10px] font-mono text-neutral-400 block mb-1.5">Plan Inicial del Proyecto</label>
           <div className="grid grid-cols-3 gap-1.5">
             {(['emergente', 'profesional', 'elite'] as const).map((pKey) => {
               const planDef = getPlanDefinition(pKey);
               const isPlanSelected = createBandPlan === pKey;
               return (
                 <button
                   key={pKey}
                   type="button"
                   onClick={() => setCreateBandPlan(pKey)}
                   className={`p-2 rounded-lg border text-left text-[11px] transition-all cursor-pointer ${
                     isPlanSelected
                       ? 'bg-amber-500/20 border-amber-500/80 text-amber-300 shadow-sm'
                       : isStitchLight
                       ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                       : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                   }`}
                 >
                   <p className="font-bold truncate text-[10px] uppercase">{planDef.name.split(' ')[0]}</p>
                   <p className="text-[9px] font-mono text-amber-400/90">{planDef.priceLabel}</p>
                 </button>
               );
             })}
           </div>
         </div>

         <div className="pt-1 flex items-center justify-end gap-2">
           <button
             type="button"
             onClick={() => setShowCreateBandSection(false)}
             className="px-2.5 py-1 rounded-lg text-xs text-neutral-400 hover:text-white cursor-pointer"
           >
             Cancelar
           </button>
           <button
             type="button"
             onClick={handleCreateBandInProfile}
             disabled={isCreatingBand || !createBandName.trim()}
             className="px-3 py-1 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
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
     <div className="p-3 rounded-xl border border-rose-500/50 bg-rose-500/10 space-y-2 animate-in fade-in duration-200">
       <p className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
         <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
         <span>¿Eliminar proyecto "{bandToDeleteInProfile.name}"?</span>
       </p>
       <p className="text-[11px] text-neutral-300">
         Se desvinculará este proyecto de tu cuenta de usuario. Esta acción no se puede deshacer.
       </p>
       <div className="flex items-center justify-end gap-2 pt-1">
         <button
           type="button"
           onClick={() => setBandToDeleteInProfile(null)}
           className="px-2.5 py-1 rounded-lg text-xs text-neutral-400 hover:text-white cursor-pointer"
         >
           Cancelar
         </button>
         <button
           type="button"
           onClick={handleConfirmDeleteBandInProfile}
           disabled={!!deletingBandId}
           className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-sm"
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

   <div className={`p-3 rounded-xl border space-y-2 ${
     isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-950 border-neutral-800'
   }`}>
     <p className="text-[11px] text-neutral-400">
       Selecciona tu proyecto principal por defecto o gestiona tus bandas activas:
     </p>

     {localAvailableBands && localAvailableBands.length > 0 ? (
       <div className="space-y-1.5 pt-1">
         {localAvailableBands.map((b) => {
           const isSelected = selectedMainBandId === b.band_id || (b.band_id && selectedMainBandId && selectedMainBandId.replace(/^(band|reg)-/, '') === b.band_id.replace(/^(band|reg)-/, ''));
           const isDeleting = deletingBandId === b.band_id;
           return (
             <div
               key={b.band_id}
               className={`w-full p-2.5 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                 isSelected
                   ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm'
                   : isStitchLight
                   ? 'bg-white border-slate-200 text-slate-700'
                   : 'bg-neutral-900 border-neutral-800 text-neutral-300'
               }`}
             >
               <button
                 type="button"
                 onClick={() => setSelectedMainBandId(b.band_id)}
                 className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer active:scale-98"
               >
                 <div className="w-6 h-6 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center text-amber-400 shrink-0 text-xs font-mono font-bold">
                   {b.bandName.slice(0, 2).toUpperCase()}
                 </div>
                 <div className="min-w-0">
                   <p className="text-xs font-bold truncate">{b.bandName}</p>
                   <p className="text-[10px] text-neutral-400 font-mono capitalize">{b.role === 'leader' ? 'Líder / Mánager' : 'Miembro'} • {getPlanDefinition(b.plan).name}</p>
                 </div>
               </button>

               <div className="flex items-center gap-1.5 shrink-0">
                 {isSelected ? (
                   <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[9px] font-black uppercase font-mono">
                     <Star className="w-2.5 h-2.5 fill-black" />
                     <span>Principal</span>
                   </span>
                 ) : (
                   <button
                     type="button"
                     onClick={() => setSelectedMainBandId(b.band_id)}
                     className="text-[10px] font-mono text-neutral-400 hover:text-amber-400 px-1.5 py-0.5 rounded cursor-pointer"
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
                     className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
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
       <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
         <span className="text-xs font-bold text-white">{activeBandName || currentUser.bandName || 'BAKANDEYA'}</span>
         <span className="text-[10px] font-mono text-amber-400">Principal</span>
       </div>
     )}
   </div>
 </div>

 {/* Language Selection */}
 <div className="space-y-2 pt-2 border-t border-neutral-800/80">
   <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center justify-between">
     <span className="flex items-center gap-1.5">
       <Globe className="w-3.5 h-3.5 text-amber-400" />
       <span>Idioma de la Plataforma / Language</span>
     </span>
     <span className="text-[10px] text-amber-400/80 font-normal font-mono">Multilenguaje</span>
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
            className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 active:scale-95 ${
              isSelected
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-300 font-bold shadow-xs'
                : isStitchLight
                ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-base leading-none">{lang.flag}</span>
              <span className="text-xs truncate">{lang.label}</span>
            </div>
            {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
          </button>
        );
      })}
     </div>
   </div>
 </div>

 {/* Collapsible Appearance Settings (Theme & Font) */}
 {(onThemeChange || onFontChange) && (
 <div className="pt-3 border-t border-neutral-800/80">
 <button
 type="button"
 onClick={() => setShowAppearance(!showAppearance)}
 className={`w-full p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
 isStitchLight ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100' : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-700'
 }`}
 >
 <div className="flex items-center gap-2">
 <Palette className="w-4 h-4 text-amber-400" />
 <span className="text-xs font-mono font-semibold">Personalización Visual (Tema y Fuente)</span>
 </div>
 <div className="flex items-center gap-1 text-[11px] font-mono text-neutral-400">
 <span>{showAppearance ? 'Ocultar' : 'Configurar'}</span>
 <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAppearance ? 'rotate-180 text-amber-400' : ''}`} />
 </div>
 </button>

 {showAppearance && (
 <div className="mt-3 p-3.5 rounded-xl border border-neutral-800/80 space-y-4 bg-neutral-950/50 animate-in fade-in duration-200">
 {onThemeChange && (
 <div className="space-y-2">
 <label className="text-[11px] font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
 <Palette className="w-3.5 h-3.5 text-amber-400" />
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
 className={`p-2 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 border ${
 isSelected
 ? 'bg-amber-500/15 border-amber-500/50 text-amber-300 font-bold'
 : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
 }`}
 >
 <span className="text-[11px] font-mono truncate">{t.name}</span>
 {isSelected && <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
 </button>
 );
 })}
 </div>
 </div>
 )}

 {onFontChange && (
 <div className="space-y-2 pt-2 border-t border-neutral-800/60">
 <label className="text-[11px] font-mono font-semibold text-neutral-400 flex items-center gap-1.5">
 <Type className="w-3.5 h-3.5 text-emerald-400" />
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
 className={`p-2 rounded-xl text-left transition-all cursor-pointer flex flex-col gap-0.5 border ${
 isSelected
 ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-bold'
 : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
 }`}
 >
 <div className="flex items-center justify-between gap-1 w-full">
 <span className="text-[11px] font-bold truncate" style={{ fontFamily: p.displayFont }}>
 {p.name}
 </span>
 {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
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

 <div className="pt-2 -neutral-800/80 space-y-3">
 <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-400">
 <Key className="w-4 h-4" />
 <span>Cambiar Contraseña</span>
 </div>

 <div className="space-y-1">
 <label className="text-[11px] font-mono text-neutral-400">
 Nueva Contraseña Secreta
 </label>
 <input
 type="password"
 value={newPassword}
 onChange={(e) => setNewPassword(e.target.value)}
 placeholder="Dejar en blanco para mantener la actual..."
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800 focus:-amber-500/50'
 }`}
 />
 </div>

 {newPassword.length > 0 && (
 <div className="space-y-1 animate-in fade-in duration-200">
 <label className="text-[11px] font-mono text-neutral-400">
 Confirmar Nueva Contraseña
 </label>
 <input
 type="password"
 value={confirmPassword}
 onChange={(e) => setConfirmPassword(e.target.value)}
 placeholder="Repite la nueva contraseña..."
 className={`w-full px-3 py-2 rounded-xl text-xs outline-none ${
 isStitchLight ? 'bg-slate-50 -slate-200' : 'bg-neutral-950 -neutral-800 focus:-amber-500/50'
 }`}
 />
 </div>
 )}
 </div>

 {/* Admin Band Management Section inside Profile */}
 {isAdmin && onOpenBandManagement && (
 <div className="pt-2 -neutral-800/80 space-y-2">
 <label className="text-xs font-mono font-semibold text-neutral-400 flex items-center justify-between">
 <span className="flex items-center gap-1.5">
 <Shield className="w-3.5 h-3.5 text-indigo-400" />
 <span>Administración de la Banda</span>
 </span>
 <span className="text-[10px] text-indigo-400 font-mono font-bold">Solo Admins</span>
 </label>

 <button
 type="button"
 onClick={() => {
 onClose();
 onOpenBandManagement();
 }}
 className={`w-full p-3 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
 isStitchLight
 ? 'bg-indigo-50 -indigo-200 hover:bg-sky-500/15 text-sky-400'
 : 'bg-indigo-950/30 -indigo-500/30 hover:-indigo-500/60 text-indigo-200'
 }`}
 >
 <div className="flex items-center gap-2.5">
 <Users className="w-4 h-4 text-indigo-400 shrink-0" />
 <div>
 <div className="text-xs font-bold font-mono">Gestión de la Banda</div>
 <div className="text-[10px] opacity-75 font-sans">Crear nuevos músicos, cambiar sus contraseñas y permisos</div>
 </div>
 </div>
 <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-sky-500/15 text-sky-400 -indigo-500/30">Abrir &rarr;</span>
 </button>
 </div>
 )}

 <button
 type="submit"
 disabled={loading}
 className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 mt-4 shadow-lg active:scale-98 ${
 isStitchLight
 ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
 : 'bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20'
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
 isStitchLight ? '-slate-200 bg-slate-50' : '-neutral-800 bg-neutral-950/60'
 }`}>
 {isAdmin && onOpenBandManagement ? (
 <button
 onClick={() => {
 onClose();
 onOpenBandManagement();
 }}
 className="text-[11px] font-mono text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
 >
 <Shield className="w-3 h-3" />
 <span>Gestión de la Banda</span>
 </button>
 ) : (
 <span className="text-[10px] font-mono text-neutral-500">Bakandeya Manager v2.0</span>
 )}

 <button
 onClick={onClose}
 className="px-4 py-1.5 rounded-lg text-xs font-mono -neutral-700 text-neutral-300 hover:bg-neutral-800 transition-colors cursor-pointer"
 >
 Cerrar
 </button>
 </div>
 </div>

 {/* Upgrade Plan Modal */}
 {showUpgradeModal && (
 <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 text-left">
 <div className={`w-full max-w-lg rounded-2xl shadow-2xl border overflow-hidden flex flex-col ${
 isStitchLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-neutral-900 border-amber-500/30 text-neutral-100'
 }`}>
 <div className="px-6 py-4 bg-gradient-to-r from-amber-950/60 via-neutral-900 to-neutral-950 border-b border-amber-500/20 flex justify-between items-center">
 <div className="flex items-center gap-2.5">
 <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
 <Sparkles className="w-4 h-4 text-amber-400" />
 </div>
 <div>
 <h3 className="font-bold text-sm text-amber-300 font-mono uppercase tracking-wider">Cambiar Plan de Suscripción</h3>
 <p className="text-[10px] text-neutral-400 font-mono">Selecciona el plan para tu proyecto musical</p>
 </div>
 </div>
 <button
 onClick={() => setShowUpgradeModal(false)}
 className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
  {currentUser?.estado_suscripcion === 'pago_pendiente' && (
    <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between gap-3">
      <div className="flex items-center gap-2">
        <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
        <span>Pago pendiente. Actualiza tu método de pago para mantener tus funciones.</span>
      </div>
      <button
        type="button"
        onClick={async () => {
          try {
            const res = await api.createPortalSession({
              userEmail: currentUser.email || 'diego.delacalleb@gmail.com',
              bandId: currentUser.band_id || 'band-bakandeya',
              returnUrl: window.location.href
            });
            if (res.success && res.url) window.location.href = res.url;
          } catch (e) {}
        }}
        className="px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-[10px] rounded-lg transition-all cursor-pointer whitespace-nowrap"
      >
        Actualizar Tarjeta
      </button>
    </div>
  )}

  {currentUser?.plan_pendiente && (
    <div className="p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2.5">
      <Calendar className="w-4 h-4 text-amber-400 shrink-0" />
      <span>
        Cambio programado a <strong className="uppercase font-mono text-amber-300">{currentUser.plan_pendiente.replace('_', ' ')}</strong> al finalizar el ciclo.
      </span>
    </div>
  )}

  <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800">
    <div className="flex items-center gap-2">
      <CreditCard className="w-4 h-4 text-amber-400 shrink-0" />
      <span className="text-xs text-neutral-300 font-mono">Facturación & Tarjetas en Stripe:</span>
    </div>
    <button
      type="button"
      onClick={async () => {
        try {
          const res = await api.createPortalSession({
            userEmail: currentUser.email || 'diego.delacalleb@gmail.com',
            bandId: currentUser.band_id || 'band-bakandeya',
            returnUrl: window.location.href
          });
          if (res.success && res.url) {
            window.location.href = res.url;
          } else {
            alert(res.error || 'No se pudo abrir el portal de Stripe');
          }
        } catch (err: any) {
          alert('Error al conectar con Stripe: ' + err.message);
        }
      }}
      className="px-3 py-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-xs font-mono font-bold transition-all border border-amber-500/20 flex items-center gap-1.5 cursor-pointer"
    >
      <span>Portal de Stripe</span>
      <ExternalLink className="w-3 h-3" />
    </button>
  </div>

 <p className="text-xs text-neutral-300 leading-relaxed">
 Tu proyecto tiene actualmente activo el <strong className="text-amber-300">{currentPlanDef.name}</strong>. Puedes cambiar de plan al instante haciendo clic en el botón de la opción que desees:
 </p>

 <div className="space-y-3">
 {Object.values(PLANS).map((plan) => {
 const isCurrent = plan.id === currentPlanDef.id;
 return (
 <div
 key={plan.id}
 className={`p-4 rounded-xl border transition-all ${
 isCurrent
 ? 'bg-amber-500/10 border-amber-500/50 ring-1 ring-amber-500/30'
 : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700'
 }`}
 >
 <div className="flex items-center justify-between flex-wrap gap-2">
 <div className="flex items-center gap-2">
 <span className="font-bold text-xs text-white font-mono">{plan.name}</span>
 <span 
 className="text-[9px] font-mono font-bold px-2 py-0.5 rounded border"
 style={{ backgroundColor: `${plan.color}20`, color: plan.color, borderColor: `${plan.color}40` }}
 >
 {plan.badge}
 </span>
 {isCurrent && (
 <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
 Plan Actual
 </span>
 )}
 </div>
 <span className="text-xs font-bold font-mono text-amber-400">{plan.price}</span>
 </div>

 {plan.stickerGift && (
 <div className="mt-2 px-2.5 py-1 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center gap-1.5 text-[10px] font-mono text-amber-300 font-bold">
 <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
 <span>Regalo de bienvenida: {plan.stickerGift.qty}</span>
 </div>
 )}

 <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400 mt-1.5">
 <span>{plan.description}</span>
 <span className="text-neutral-300 font-bold shrink-0">{plan.credits}</span>
 </div>

 <ul className="mt-2.5 space-y-1 font-sans">
 {plan.features.map((feat, idx) => (
 <li key={idx} className="text-[10.5px] text-neutral-300 flex items-center gap-1.5">
 <Check className="w-3 h-3 text-emerald-400 shrink-0" />
 <span>{feat}</span>
 </li>
 ))}
 </ul>

 <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-neutral-800/80">
 <span className="text-[10px] font-mono text-neutral-400">
 {isCurrent ? 'Tu plan activo' : 'Cambio de plan inmediato'}
 </span>
 {isCurrent ? (
 <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
 <Check className="w-3 h-3 text-amber-400" />
 <span>Activo</span>
 </span>
 ) : (
 <button
 type="button"
 onClick={async () => {
                            try {
                              if (plan.id !== 'ensayo') {
                                await api.startCheckout({
                                  planId: plan.id,
                                  billingInterval: 'monthly',
                                  bandId: currentUser.band_id || 'default',
                                  userEmail: currentUser.email || 'diego.delacalleb@gmail.com'
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
 alert(e?.message || 'No se pudo cambiar el plan. Reintenta en unos instantes.');
 }
 }}
 className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold font-mono text-xs transition-all shadow-md shadow-amber-500/20 hover:scale-105 active:scale-95 flex items-center gap-1 cursor-pointer"
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

 <div className="px-6 py-3 bg-neutral-950 border-t border-neutral-800 flex items-center justify-between">
 {onNavigateToPlanes ? (
   <button
     type="button"
     onClick={() => {
       setShowUpgradeModal(false);
       onClose();
       onNavigateToPlanes();
     }}
     className="text-xs font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer font-bold"
   >
     <span>Ver comparativa completa y tabla de planes →</span>
   </button>
 ) : <span />}
 <button
 onClick={() => setShowUpgradeModal(false)}
 className="px-4 py-1.5 rounded-lg text-xs font-mono bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors cursor-pointer"
 >
 Cerrar
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};
