import React, { useState, useRef, useEffect } from'react';
import { Lock, Mail, Eye, EyeOff, AlertCircle, CheckCircle2, Guitar, User as UserIcon, ArrowLeft, ArrowRight, Music } from'lucide-react';
import { User as UserType } from'../types';
import { signInWithGoogleIdentity } from'../utils/googleAuth';
import { guardarCookieDeSesion } from'../utils/sessionCookie';
import { ModalPortal } from'./common/ModalPortal';

// Ventana de acceso simplificada para la fase beta (bandas del festival Buskers y primeros
// usuarios): a diferencia de LoginModal.tsx, el registro NO ofrece selector de planes — crea
// la cuenta directamente en el plan Promo. LoginModal.tsx (login completo + registro con
// parrilla de 4 planes) se mantiene intacto y sin usar por ahora; ver el switch en App.tsx.
interface SimplePromoLoginModalProps {
 onLoginSuccess: (user: UserType, token: string, bandsList?: unknown[]) => void;
}

type ViewState ='login' |'register' |'reset-password';

/**
 * Forma mínima de la Network Information API. No está estandarizada (Safari y
 * Firefox no la traen), por eso se declara aquí en vez de depender de los tipos
 * del DOM: solo se usa para degradar el vídeo del logo con red mala.
 */
interface ConexionDeRed {
 saveData?: boolean;
 effectiveType?: string;
}

/**
 * Extrae el mensaje de un error capturado. En un `catch` el valor es `unknown`
 * por diseño: puede llegar cualquier cosa (un Error, un string, un rechazo de
 * fetch). Tipar el catch como `any` desactivaba el chequeo dentro del bloque y
 * `err.message` reventaba en tiempo de ejecución si el error no era un Error.
 */
function mensajeDeError(err: unknown, porDefecto: string): string {
 if (err instanceof Error && err.message) return err.message;
 if (typeof err ==='string' && err) return err;
 return porDefecto;
}

/** Fuera del componente a propósito: declararlo dentro del render lo recrea
 * en cada pintado y React lo trata como un componente nuevo cada vez. */
const GoogleIcon = () => (
 <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
 <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"/>
 </svg>
);

// El poster tiene que ser un fotograma real del propio vídeo YA recortado (mismo encuadre,
// misma proporción 720x1024): el JPEG de marca genérico es un render cuadrado sin recortar,
// así que al arrancar el vídeo la imagen"saltaba" a otro encuadre.
const LOGIN_POSTER ='/login-animation-poster.jpg';

// Network Information API: no estandarizada en todos los navegadores (Safari/Firefox no la
// tienen), por eso el chequeo es"opt-out": si no existe o no se puede leer, se asume conexión
// buena y se intenta el vídeo igualmente - degradar solo cuando hay evidencia real de que la
// red va mal (2G/slow-2g o modo Ahorro de Datos activado).
function tieneConexionMala(): boolean {
 try {
 const nav = navigator as Navigator & {
 connection?: ConexionDeRed;
 mozConnection?: ConexionDeRed;
 webkitConnection?: ConexionDeRed;
 };
 const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
 if (!conn) return false;
 if (conn.saveData) return true;
 return conn.effectiveType ==='slow-2g' || conn.effectiveType ==='2g';
 } catch {
 return false;
 }
}

// Logo animado con fallback a la imagen estática (por conexión mala o por fallo real de carga).
// Sin loop a propósito: es una animación de"revelado" (barras que crecen de la nada, logo que
// se dibuja, luces que barren), no un movimiento cíclico - repetirla en bucle fuerza un corte
// visible al volver del final al principio. Se reproduce una vez y se queda congelada en el
// último fotograma, que ya lleva el logo + naming compuesto.
// Es su propio componente porque USE_SIMPLE_LOGIN (App.tsx) hace que esta ventana sea la que de
// verdad se muestra en producción hoy - LoginModal.tsx tiene la misma pieza pero no se está
// renderizando - y aquí se necesita en dos sitios (login y alta).
const LoginBrandVideo: React.FC = () => {
 const ref = useRef<HTMLVideoElement | null>(null);
 const [failed, setFailed] = useState(false);
 const [skipVideo] = useState(tieneConexionMala);
 useEffect(() => {
 const el = ref.current;
 if (!el) return;
 el.muted = true;
 el.play().catch(() => {});
 }, []);
 const handleReplay = () => {
 const el = ref.current;
 if (!el) return;
 el.currentTime = 0;
 el.play().catch(() => {});
 };
 if (failed || skipVideo) {
 return (
 <img
 src={LOGIN_POSTER}
 alt="BandManager.io"
 className="w-full h-auto max-h-60 sm:max-h-72 object-contain rounded-[1.25rem] overflow-hidden"
 />
 );
 }
 return (
 <video
 ref={ref}
 autoPlay
 muted
 playsInline
 preload="auto"
 poster={LOGIN_POSTER}
 aria-label="BandManager.io - Plataforma Integral para Bandas"
 className="w-full h-auto max-h-60 sm:max-h-72 object-contain rounded-[1.25rem] overflow-hidden cursor-pointer"
 onError={() => setFailed(true)}
 onMouseEnter={handleReplay}
 >
 <source src="/login-animation.mp4" type="video/mp4" />
 <source src="/login-animation.webm" type="video/webm" />
 </video>
 );
};

export const SimplePromoLoginModal: React.FC<SimplePromoLoginModalProps> = ({ onLoginSuccess }) => {
 const [view, setView] = useState<ViewState>('login');
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);

 // --- Login state ---
 const [username, setUsername] = useState('');
 const [password, setPassword] = useState('');
 const [showPassword, setShowPassword] = useState(false);

 // --- Register state (siempre plan Promo) ---
 const [regLeaderName, setRegLeaderName] = useState('');
 const [regBandName, setRegBandName] = useState('');
 const [regEmail, setRegEmail] = useState('');
 const [regPassword, setRegPassword] = useState('');
 const [showRegPassword, setShowRegPassword] = useState(false);

 // --- Reset password state ---
 const [resetEmailOrUsername, setResetEmailOrUsername] = useState('');
 const [resetStep, setResetStep] = useState<1 | 2>(1);
 const [resetCode, setResetCode] = useState('');
 const [resetNewPassword, setResetNewPassword] = useState('');
 const [resetConfirmPassword, setResetConfirmPassword] = useState('');
 const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
 const [resetMaskedEmail, setResetMaskedEmail] = useState<string | null>(null);

 // --- Google Social Login / Registration ---
 const handleGoogleSocialSignIn = async () => {
 try {
 setLoading(true);
 setError(null);
 const googleUser = await signInWithGoogleIdentity();
 if (!googleUser) return; // User closed popup

 const email = googleUser.email;
 const displayName = (view ==='register' && regLeaderName.trim()) ? regLeaderName.trim() : (googleUser.name || email.split('@')[0]);

 try {
 const response = await fetch('/api/auth/google', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 email,
 name: displayName,
 uid: googleUser.sub,
 accessToken: googleUser.accessToken,
 bandName: (view ==='register' && regBandName.trim()) ? regBandName.trim() : undefined,
 leaderName: (view ==='register' && regLeaderName.trim()) ? regLeaderName.trim() : undefined
 })
 });

 const data = await response.json().catch(() => ({}));
 if (response.ok && data.token) {
 localStorage.setItem('bakandeya_token', data.token);
 guardarCookieDeSesion(data.token);
 onLoginSuccess(data.user, data.token, data.availableBands);
 return;
 }
 } catch (backendErr) {
 console.warn("API de auth Google fallo, iniciando sesion local:", backendErr);
 }

 const fallbackUser: UserType = {
 id: googleUser.sub || `user-${Date.now()}`,
 username: email,
 name: displayName,
 bandName: (view ==='register' && regBandName.trim()) ||'Mi Banda',
 email: email,
 role:'leader',
 plan:'promo',
 createdAt: new Date().toISOString()
 };
 onLoginSuccess(fallbackUser, googleUser.accessToken ||'');
 } catch (err: unknown) {
 console.error("Error al iniciar sesión con Google:", err);
 setError(mensajeDeError(err,'Error al conectar con Google OAuth.'));
 } finally {
 setLoading(false);
 }
 };

 const handleLoginSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!username.trim() || !password) {
 setError('Por favor, ingresa el usuario y la contraseña.');
 return;
 }
 setLoading(true);
 setError(null);
 try {
 const response = await fetch('/api/auth/login', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ username: username.trim(), password })
 });
 const data = await response.json().catch(() => ({}));
 if (!response.ok) {
 throw new Error(data.error ||'Fallo en la autenticación');
 }
 if (data.token) {
 localStorage.setItem('bakandeya_token', data.token);
 guardarCookieDeSesion(data.token);
 }
 onLoginSuccess(data.user, data.token, data.availableBands);
 } catch (err: unknown) {
 setError(mensajeDeError(err,'Error al conectar con el servidor.'));
 } finally {
 setLoading(false);
 }
 };

 const handleRegisterSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!regLeaderName.trim() || !regBandName.trim() || !regEmail.trim() || !regPassword) {
 setError('Por favor, completa todos los campos.');
 return;
 }
 setLoading(true);
 setError(null);
 try {
 const response = await fetch('/api/auth/register', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 leaderName: regLeaderName.trim(),
 bandName: regBandName.trim(),
 email: regEmail.trim(),
 password: regPassword,
 plan:'promo'
 })
 });
 const data = await response.json().catch(() => ({}));
 if (!response.ok) {
 throw new Error(data.error ||'Fallo en la creación de cuenta');
 }
 if (data.token) {
 localStorage.setItem('bakandeya_token', data.token);
 guardarCookieDeSesion(data.token);
 }
 onLoginSuccess(data.user, data.token, data.availableBands);
 } catch (err: unknown) {
 setError(mensajeDeError(err,'Error al crear la cuenta.'));
 } finally {
 setLoading(false);
 }
 };

 const handleRequestReset = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!resetEmailOrUsername.trim()) {
 setError('Por favor, indica tu correo o nombre de usuario.');
 return;
 }
 setLoading(true);
 setError(null);
 setResetSuccessMsg(null);
 try {
 const response = await fetch('/api/auth/reset-password/request', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({ emailOrUsername: resetEmailOrUsername.trim() })
 });
 const data = await response.json().catch(() => ({}));
 if (!response.ok) {
 throw new Error(data.error ||'No se pudo procesar la solicitud.');
 }
 setResetMaskedEmail(data.emailMasked);
 setResetSuccessMsg(data.message ||'Código de recuperación generado.');
 setResetStep(2);
 } catch (err: unknown) {
 setError(mensajeDeError(err,'Error al solicitar el restablecimiento'));
 } finally {
 setLoading(false);
 }
 };

 const handleConfirmReset = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!resetCode.trim()) {
 setError('Por favor, ingresa el código de 6 dígitos.');
 return;
 }
 if (!resetNewPassword || resetNewPassword.length < 6) {
 setError('La nueva contraseña debe tener al menos 6 caracteres.');
 return;
 }
 if (resetNewPassword !== resetConfirmPassword) {
 setError('Las contraseñas no coinciden.');
 return;
 }
 setLoading(true);
 setError(null);
 try {
 const response = await fetch('/api/auth/reset-password/confirm', {
 method:'POST',
 headers: {'Content-Type':'application/json' },
 body: JSON.stringify({
 emailOrUsername: resetEmailOrUsername.trim(),
 code: resetCode.trim(),
 newPassword: resetNewPassword
 })
 });
 const data = await response.json().catch(() => ({}));
 if (!response.ok) {
 throw new Error(data.error ||'No se pudo confirmar el restablecimiento.');
 }
 setView('login');
 setResetSuccessMsg('Contraseña actualizada. Ya puedes iniciar sesión.');
 } catch (err: unknown) {
 setError(mensajeDeError(err,'Error al confirmar la nueva contraseña'));
 } finally {
 setLoading(false);
 }
 };

 const inputClass ="w-full pl-11 pr-4 py-3.5 bg-[var(--sunken)] rounded-[var(--r-s)] text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)] outline-none focus:ring-2 focus:ring-[var(--acc)] transition-colors duration-200";

 return (
 <ModalPortal isOpen={true}>
 <div className="fixed inset-0 z-[9999] p-4 bg-[var(--bg)] text-[var(--ink)] overflow-y-auto overscroll-contain animate-in fade-in duration-300">
 <div className="min-h-full flex items-center justify-center py-6 md:py-8">
 <div className="w-full max-w-md space-y-6 relative z-10 flex flex-col items-center">


 {error && (
 <div className="w-full p-3.5 bg-rose-500/10 rounded-[var(--r-l)] text-xs text-rose-300 flex items-start gap-2 animate-in fade-in duration-200">
 <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
 <span className="leading-relaxed">{error}</span>
 </div>
 )}

 {view ==='login' && (
 <div className="w-full p-6 sm:p-7 bg-[var(--surface)] rounded-[var(--r-xl)] animate-in slide-in-from-bottom-4 duration-300 space-y-4">
 
 {/* INTEGRATED LOGO INSIDE CARD */}
 <div className="relative flex flex-col items-center justify-center pt-1 pb-1 text-center w-full">
 
 <div className="relative group cursor-pointer w-full max-w-[380px] sm:max-w-[420px] flex justify-center">
 <div className="transition-transform duration-300 group-hover:scale-[1.01]">
 <LoginBrandVideo />
 </div>
 </div>
 </div>

 {resetSuccessMsg && (
 <div className="p-3 bg-emerald-500/10 rounded-[var(--r-l)] text-xs text-emerald-400 flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 shrink-0" />
 <span>{resetSuccessMsg}</span>
 </div>
 )}
 <form onSubmit={handleLoginSubmit} className="w-full space-y-3.5">
 <div className="relative flex items-center">
 <Mail className="w-4 h-4 text-[var(--ink-3)] absolute left-4 pointer-events-none" />
 <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Correo electrónico o Usuario" className={inputClass} required />
 </div>
 <div className="relative flex items-center">
 <Lock className="w-4 h-4 text-[var(--ink-3)] absolute left-4 pointer-events-none" />
 <input type={showPassword ?'text' :'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Contraseña" className={`${inputClass} pr-11`} required />
 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 text-neutral-500 hover:text-[var(--sunken)] transition-colors cursor-pointer">
 {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 <div className="flex items-center justify-end text-xs text-[var(--ink-2)] px-1 pt-0.5">
 <button type="button" onClick={() => { setError(null); setResetSuccessMsg(null); setResetStep(1); setResetEmailOrUsername(username ||''); setView('reset-password'); }} className="text-[var(--ink-2)] underline underline-offset-2 hover:text-[var(--ink)] font-medium cursor-pointer">
 ¿Olvidaste tu contraseña?
 </button>
 </div>
 <button type="submit" disabled={loading} className="w-full py-3.5 px-4 mt-2 rounded-[var(--r-pill)] bg-[var(--acc)] hover:brightness-105 text-[var(--on-acc)] font-semibold text-sm transition-[filter,transform] duration-200 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center cursor-pointer">
 {loading ?'Entrando...' :'Entrar a mi cuenta'}
 </button>
 </form>

 <div className="relative mt-3 mb-1">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full h-px bg-[var(--hair)]"></div>
 </div>
 <div className="relative flex justify-center text-xs">
 <span className="px-2.5 bg-[var(--surface)] text-[var(--ink-3)] font-medium">O continuar con</span>
 </div>
 </div>

 <button 
 type="button" 
 onClick={handleGoogleSocialSignIn}
 disabled={loading}
 className="w-full flex items-center justify-center gap-2.5 py-3 bg-[var(--sunken)] hover:brightness-110 rounded-[var(--r-pill)] text-sm font-medium text-[var(--ink)] transition-[filter] cursor-pointer disabled:opacity-50"
 >
 <GoogleIcon />
 <span>{loading ?'Conectando...' :'Continuar con Google'}</span>
 </button>

 <p className="text-center text-xs text-[var(--ink-2)] pt-1">
 ¿Primera vez por aquí?{''}
 <button type="button" onClick={() => { setError(null); setView('register'); }} className="text-[var(--ink-2)] underline underline-offset-2 hover:text-[var(--ink)] font-medium cursor-pointer">
 Crea tu cuenta gratis
 </button>
 </p>

 <div className="pt-3 text-center text-[11px] text-[var(--ink-3)] flex items-center justify-center gap-1.5">
 <Music className="w-3.5 h-3.5" />
 <span>Tus salas, tu repertorio y tu gira, en el mismo sitio</span>
 </div>
 </div>
 )}

 {view ==='register' && (
 <div className="w-full p-6 sm:p-7 bg-[var(--surface)] rounded-[var(--r-xl)] animate-in slide-in-from-bottom-4 duration-300 space-y-4">
 
 {/* INTEGRATED LOGO INSIDE CARD */}
 <div className="relative flex flex-col items-center justify-center pt-1 pb-1 text-center w-full">
 
 <div className="relative group cursor-pointer w-full max-w-[380px] sm:max-w-[420px] flex justify-center">
 <div className="transition-transform duration-300 group-hover:scale-[1.01]">
 <LoginBrandVideo />
 </div>
 </div>
 <p className="mt-3 text-sm text-[var(--ink-3)] font-medium">
 Crea tu dossier, QR y calendario en 30 segundos.
 </p>
 </div>

 <form onSubmit={handleRegisterSubmit} className="w-full space-y-3.5">
 <div className="relative flex items-center">
 <Guitar className="w-4 h-4 text-[var(--ink-3)] absolute left-4 pointer-events-none" />
 <input type="text" value={regBandName} onChange={(e) => setRegBandName(e.target.value)} placeholder="Nombre de tu banda" className={inputClass} required />
 </div>
 <div className="relative flex items-center">
 <UserIcon className="w-4 h-4 text-[var(--ink-3)] absolute left-4 pointer-events-none" />
 <input type="text" value={regLeaderName} onChange={(e) => setRegLeaderName(e.target.value)} placeholder="Tu nombre" className={inputClass} required />
 </div>
 <div className="relative flex items-center">
 <Mail className="w-4 h-4 text-[var(--ink-3)] absolute left-4 pointer-events-none" />
 <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)} placeholder="Correo electrónico" className={inputClass} required />
 </div>
 <div className="relative flex items-center">
 <Lock className="w-4 h-4 text-[var(--ink-3)] absolute left-4 pointer-events-none" />
 <input type={showRegPassword ?'text' :'password'} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} placeholder="Contraseña" className={`${inputClass} pr-11`} required />
 <button type="button" onClick={() => setShowRegPassword(!showRegPassword)} className="absolute right-4 text-neutral-500 hover:text-[var(--sunken)] transition-colors cursor-pointer">
 {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
 </button>
 </div>
 <button type="submit" disabled={loading} className="w-full py-3.5 px-4 mt-2 rounded-[var(--r-l)] bg-[var(--acc)] hover:brightness-110 text-[var(--surface)] font-bold text-sm tracking-wide transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer">
 {loading ?'Creando cuenta...' : (<><span>Crear mi Dossier y QR</span><ArrowRight className="w-4 h-4" /></>)}
 </button>
 </form>

 <div className="relative mt-3 mb-1">
 <div className="absolute inset-0 flex items-center">
 <div className="w-full h-px bg-[var(--hair)]"></div>
 </div>
 <div className="relative flex justify-center text-xs">
 <span className="px-2.5 bg-[var(--surface)] text-neutral-500 font-medium">O registrarme con</span>
 </div>
 </div>

 <button 
 type="button" 
 onClick={handleGoogleSocialSignIn}
 disabled={loading}
 className="w-full flex items-center justify-center gap-2.5 py-3 bg-[var(--sunken)] hover:brightness-110 rounded-[var(--r-pill)] text-sm font-medium text-[var(--ink)] transition-[filter] cursor-pointer disabled:opacity-50"
 >
 <GoogleIcon />
 <span>{loading ?'Conectando...' :'Continuar con Google'}</span>
 </button>

 <p className="text-center text-xs text-[var(--ink-2)]">
 ¿Ya tienes cuenta?{''}
 <button type="button" onClick={() => { setError(null); setView('login'); }} className="text-[var(--ink-2)] underline underline-offset-2 hover:text-[var(--ink)] font-medium cursor-pointer">
 Volver al login
 </button>
 </p>
 </div>
 )}

 {view ==='reset-password' && (
 <div className="w-full animate-in slide-in-from-bottom-4 duration-300 space-y-4">
 <button type="button" onClick={() => { setError(null); setView('login'); }} className="flex items-center gap-1.5 text-xs text-[var(--ink-2)] hover:text-[var(--sunken)] cursor-pointer">
 <ArrowLeft className="w-3.5 h-3.5" />
 <span>Volver al login</span>
 </button>
 {resetStep === 1 ? (
 <form onSubmit={handleRequestReset} className="w-full space-y-3.5">
 <div className="relative flex items-center">
 <Mail className="w-4 h-4 text-[var(--ink-3)] absolute left-4 pointer-events-none" />
 <input type="text" value={resetEmailOrUsername} onChange={(e) => setResetEmailOrUsername(e.target.value)} placeholder="Tu correo o usuario" className={inputClass} required />
 </div>
 <button type="submit" disabled={loading} className="w-full py-3.5 px-4 rounded-[var(--r-l)] bg-[var(--acc)] hover:brightness-110 text-[var(--surface)] font-bold text-sm transition-all disabled:opacity-50 cursor-pointer">
 {loading ?'Enviando...' :'Enviar código de recuperación'}
 </button>
 </form>
 ) : (
 <form onSubmit={handleConfirmReset} className="w-full space-y-3.5">
 {resetMaskedEmail && <p className="text-xs text-[var(--ink-2)]">Código enviado a {resetMaskedEmail}</p>}
 <input type="text" value={resetCode} onChange={(e) => setResetCode(e.target.value)} placeholder="Código de 6 dígitos" className={`${inputClass} pl-4`} required />
 <input type="password" value={resetNewPassword} onChange={(e) => setResetNewPassword(e.target.value)} placeholder="Nueva contraseña" className={`${inputClass} pl-4`} required />
 <input type="password" value={resetConfirmPassword} onChange={(e) => setResetConfirmPassword(e.target.value)} placeholder="Confirma la nueva contraseña" className={`${inputClass} pl-4`} required />
 <button type="submit" disabled={loading} className="w-full py-3.5 px-4 rounded-[var(--r-l)] bg-[var(--acc)] hover:brightness-110 text-[var(--surface)] font-bold text-sm transition-all disabled:opacity-50 cursor-pointer">
 {loading ?'Guardando...' :'Guardar nueva contraseña'}
 </button>
 </form>
 )}
 </div>
 )}

 </div>
 </div>
 </div>
 </ModalPortal>
 );
};
