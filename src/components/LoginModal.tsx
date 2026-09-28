import React, { useState, useEffect, useRef } from 'react';
import { Lock, User, Eye, EyeOff, AlertCircle, Mail, Music, Check, ArrowRight, Zap, Star, Shield, Chrome, KeyRound, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { User as UserType } from '../types';
import { signInWithGoogleIdentity } from '../utils/googleAuth';
import { guardarCookieDeSesion } from '../utils/sessionCookie';
import { BandNameStylerHelper } from './common/BandNameStylerHelper';
import { ModalPortal } from './common/ModalPortal';
import { useLanguage, SUPPORTED_LANGUAGES } from '../context/LanguageContext';

interface LoginModalProps {
  onLoginSuccess: (user: UserType, token: string, bandsList?: any[]) => void;
  isStitchLight?: boolean;
}

type ViewState = 'login' | 'register' | 'plans' | 'activate' | 'reset-password';

// El poster tiene que ser un fotograma real del propio vídeo YA recortado (mismo encuadre,
// misma proporción 720x1024): el JPEG de marca genérico es un render cuadrado sin recortar,
// así que al arrancar el vídeo la imagen "saltaba" a otro encuadre.
const LOGIN_POSTER = '/login-animation-poster.jpg';

// Network Information API: no estandarizada en todos los navegadores (Safari/Firefox no la
// tienen), por eso el chequeo es "opt-out": si no existe o no se puede leer, se asume conexión
// buena y se intenta el vídeo igualmente - degradar solo cuando hay evidencia real de que la
// red va mal (2G/slow-2g o modo Ahorro de Datos activado).
function tieneConexionMala(): boolean {
  try {
    const conn = (navigator as any).connection || (navigator as any).mozConnection || (navigator as any).webkitConnection;
    if (!conn) return false;
    if (conn.saveData) return true;
    return conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g';
  } catch {
    return false;
  }
}

export const LoginModal: React.FC<LoginModalProps> = ({ onLoginSuccess }) => {
  const [view, setView] = useState<ViewState>('login');
  const { language: currentAppLang, setLanguage: setAppLang } = useLanguage();

  // El atributo JSX `muted` en un <video> no basta en algunos navegadores: si el motor evalúa
  // el autoplay antes de que React termine de aplicar props al nodo, lo bloquea por política de
  // autoplay con sonido. Fijar `muted` a pelo en el elemento y forzar play() cubre esos casos.
  const loginVideoRef = useRef<HTMLVideoElement | null>(null);
  const [videoLoadFailed, setVideoLoadFailed] = useState(false);
  const [skipVideo] = useState(tieneConexionMala);
  useEffect(() => {
    const el = loginVideoRef.current;
    if (!el) return;
    el.muted = true;
    el.play().catch(() => {});
  }, []);
  const handleReplayLoginVideo = () => {
    const el = loginVideoRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play().catch(() => {});
  };

  // --- Login State ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- Remember Me State ---
  const [rememberMe, setRememberMe] = useState(() => {
    return localStorage.getItem('bakandeya_remember_me') !== 'false';
  });

  // On mount, prefill username and emails if stored in localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('bakandeya_remembered_username') || localStorage.getItem('bakandeya_last_login_email');
    if (savedUser) {
      setUsername(savedUser);
      setRegEmail(savedUser);
      setActivateEmail(savedUser);
      setRememberMe(true);
    }
  }, []);

  // --- Reset Password State ---
  const [resetEmailOrUsername, setResetEmailOrUsername] = useState('');
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetCode, setResetCode] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [resetSuccessMsg, setResetSuccessMsg] = useState<string | null>(null);
  const [resetMaskedEmail, setResetMaskedEmail] = useState<string | null>(null);

  // --- Register State ---
  const [regLeaderName, setRegLeaderName] = useState('');
  const [regBandName, setRegBandName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // --- Activate Account State ---
  const [activateEmail, setActivateEmail] = useState('');
  const [activateName, setActivateName] = useState('');
  const [activateUsername, setActivateUsername] = useState('');
  const [activatePassword, setActivatePassword] = useState('');
  const [showActivatePassword, setShowActivatePassword] = useState(false);
  const [activateStep, setActivateStep] = useState<1 | 2>(1);
  const [activateBandsFound, setActivateBandsFound] = useState<{ band_id: string; bandName: string; role: string }[]>([]);

  // --- Check Invitation Step 1 ---
  const handleCheckInvitation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateEmail.trim()) {
      setError('Por favor, ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/check-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: activateEmail.trim() })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'No se encontró ninguna invitación');
      }

      setActivateName(data.name || '');
      setActivateUsername(data.username || data.email?.split('@')[0] || '');
      setActivateBandsFound(data.bands || []);
      setActivateStep(2);
    } catch (err: any) {
      setError(err.message || 'Error al comprobar invitación');
    } finally {
      setLoading(false);
    }
  };

  // --- Complete Activation Step 2 ---
  const handleActivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateUsername.trim() || !activateName.trim() || !activatePassword) {
      setError('Todos los campos son obligatorios para completar tu alta.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/activate-member', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: activateEmail.trim().toLowerCase(),
          username: activateUsername.trim().toLowerCase(),
          name: activateName.trim(),
          password: activatePassword
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Error al completar el registro');
      }

      if (data.token) {
        localStorage.setItem('bakandeya_token', data.token);
        guardarCookieDeSesion(data.token);
      }

      onLoginSuccess(data.user, data.token, data.availableBands);
    } catch (err: any) {
      setError(err.message || 'Error al activar tu cuenta');
    } finally {
      setLoading(false);
    }
  };


  // --- Login Submit (Original Logic preserved) ---
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Fallo en la autenticación');
      }

      // Handle Remember Me preference
      localStorage.setItem('bakandeya_last_login_email', username.trim());
      if (rememberMe) {
        localStorage.setItem('bakandeya_remembered_username', username.trim());
        localStorage.setItem('bakandeya_remember_me', 'true');
      } else {
        localStorage.removeItem('bakandeya_remembered_username');
        localStorage.setItem('bakandeya_remember_me', 'false');
      }

      if (data.token) {
        localStorage.setItem('bakandeya_token', data.token);
        guardarCookieDeSesion(data.token);
      }

      onLoginSuccess(data.user, data.token, data.availableBands);
    } catch (err: any) {
      setError(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // --- Reset Password Handlers ---
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailOrUsername: resetEmailOrUsername.trim() })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'No se pudo procesar la solicitud.');
      }

      setResetMaskedEmail(data.emailMasked);
      setResetSuccessMsg(data.message || 'Código de recuperación generado.');
      setResetStep(2);
    } catch (err: any) {
      setError(err.message || 'Error al solicitar el restablecimiento');
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
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: resetEmailOrUsername.trim(),
          code: resetCode.trim(),
          newPassword: resetNewPassword
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Error al restablecer la contraseña.');
      }

      setUsername(resetEmailOrUsername.trim());
      setPassword('');
      setError(null);
      setView('login');
      setResetSuccessMsg('¡Contraseña restablecida con éxito! Ya puedes iniciar sesión.');
    } catch (err: any) {
      setError(err.message || 'Error al confirmar la nueva contraseña');
    } finally {
      setLoading(false);
    }
  };

  const [featureCategory, setFeatureCategory] = useState<'all' | 'booking' | 'media' | 'finance'>('all');

  // --- Register Submit ---
  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regLeaderName.trim() || !regBandName.trim() || !regEmail.trim() || !regPassword) {
      setError('Por favor, completa todos los campos.');
      return;
    }
    setError(null);
    handlePlanSelect('promo');
  };

  const handlePlanSelect = async (planKey: 'ensayo' | 'local' | 'de_gira' | 'cabeza_de_cartel' | string) => {
    setLoading(true);
    setError(null);

    const planNamesMap: Record<string, string> = {
      ensayo: 'Ensayo (Gratis)',
      local: 'Local (12€/mes)',
      de_gira: 'De Gira (29€/mes)',
      cabeza_de_cartel: 'Cabeza de Cartel (79€/mes)'
    };

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leaderName: regLeaderName.trim(),
          bandName: regBandName.trim() || 'Nueva Banda',
          email: regEmail.trim() || `banda_${Date.now()}@bandmanager.app`,
          password: regPassword || '123456',
          plan: planKey
        })
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || 'Fallo en la creación de cuenta');
      }

      if (data.token) {
        localStorage.setItem('bakandeya_token', data.token);
        guardarCookieDeSesion(data.token);
      }

      onLoginSuccess(data.user, data.token, data.availableBands);
    } catch (err: any) {
      console.error("Error al registrar cuenta:", err);
      setError(err.message || 'Error al crear la cuenta. Por favor, revisa los datos e inténtalo de nuevo.');
      setView('register');
    } finally {
      setLoading(false);
    }
  };

  // --- Google Social Login / Registration ---
  const handleGoogleSocialSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      const googleUser = await signInWithGoogleIdentity();
      if (!googleUser) return; // User closed or cancelled popup

      const email = googleUser.email;
      const displayName = (view === 'register' && regLeaderName.trim()) ? regLeaderName.trim() : (googleUser.name || email.split('@')[0]);

      // Call backend API /api/auth/google
      try {
        const response = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            name: displayName,
            uid: googleUser.sub,
            accessToken: googleUser.accessToken,
            bandName: (view === 'register' && regBandName.trim()) ? regBandName.trim() : undefined,
            leaderName: (view === 'register' && regLeaderName.trim()) ? regLeaderName.trim() : undefined
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

      // Fallback local login if backend is unreachable
      const fallbackUser: UserType = {
        id: googleUser.sub || `user-${Date.now()}`,
        username: email,
        name: displayName,
        bandName: (view === 'register' && regBandName.trim()) || 'Mi Banda',
        email: email,
        role: 'leader',
        plan: 'promo',
        createdAt: new Date().toISOString()
      };
      onLoginSuccess(fallbackUser, googleUser.accessToken || '');
    } catch (err: any) {
      console.error("Error al iniciar sesión con Google:", err);
      setError(err.message || 'Error al conectar con Google OAuth.');
    } finally {
      setLoading(false);
    }
  };

  // --- Shared UI Components ---
  const AppleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/>
      <path d="M10 2c1 .5 2 2 2 5"/>
    </svg>
  );

  const GoogleIcon = () => (
    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
      <path d="M20.283 10.356h-8.327v3.451h4.792c-.446 2.193-2.313 3.453-4.792 3.453a5.27 5.27 0 0 1-5.279-5.28 5.27 5.27 0 0 1 5.279-5.279c1.259 0 2.397.447 3.29 1.178l2.6-2.599c-1.584-1.381-3.615-2.233-5.89-2.233a8.908 8.908 0 0 0-8.934 8.934 8.907 8.907 0 0 0 8.934 8.934c4.467 0 8.529-3.249 8.529-8.934 0-.528-.081-1.097-.202-1.625z"/>
    </svg>
  );

  const PasswordStrengthBar = ({ pass }: { pass: string }) => {
    if (!pass) return null;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[0-9]/.test(pass) && /[^A-Za-z0-9]/.test(pass)) score += 1;

    const labels = ['Contraseña básica', 'Seguridad media', 'Muy segura'];
    const colors = ['bg-rose-500', 'bg-amber-400', 'bg-emerald-400'];
    const textColors = ['text-rose-400', 'text-amber-400', 'text-emerald-400'];

    return (
      <div className="space-y-1.5 pt-1 px-0.5">
        <div className="flex gap-1 h-1 w-full bg-neutral-800/80 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-300 ${score >= 1 ? colors[0] : 'bg-transparent'} w-1/3`} />
          <div className={`h-full transition-all duration-300 ${score >= 2 ? colors[1] : 'bg-transparent'} w-1/3`} />
          <div className={`h-full transition-all duration-300 ${score >= 3 ? colors[2] : 'bg-transparent'} w-1/3`} />
        </div>
        <div className="flex justify-between items-center text-[11px]">
          <span className={`font-medium ${textColors[Math.max(0, score - 1)]}`}>{labels[Math.max(0, score - 1)]}</span>
          <span className="text-neutral-500">{pass.length < 6 ? 'Mínimo 6 caracteres' : '✓ Longitud OK'}</span>
        </div>
      </div>
    );
  };

  const SocialButtons = () => (
    <div className="w-full mt-3">
      <button 
        type="button" 
        onClick={handleGoogleSocialSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 py-3 bg-[#131317]/80 hover:bg-[#1f1f26] border border-neutral-800/80 rounded-2xl text-sm font-medium text-neutral-200 hover:text-white transition-all shadow-inner cursor-pointer disabled:opacity-50"
      >
        <GoogleIcon />
        <span>{loading ? 'Conectando...' : 'Continuar con Google'}</span>
      </button>
    </div>
  );

  return (
    <ModalPortal isOpen={true}>
      <div className="fixed inset-0 z-[9999] p-4 bg-[#09090b] text-neutral-100 overflow-y-auto overscroll-contain animate-in fade-in duration-300">
        <div className="min-h-full flex items-center justify-center py-6 md:py-8">
        <div className={`w-full relative z-10 flex flex-col items-center transition-all duration-500 ${view === 'plans' ? 'max-w-6xl' : 'max-w-md space-y-6'}`}>
        
        {/* Soft Golden Background Ambient Glow */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-[#f2ca50]/8 rounded-full blur-[110px] pointer-events-none" />

        {/* Top Language Switcher */}
        <div className="w-full flex justify-end items-center gap-1.5 mb-1 px-2 z-20">
          <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-sm">
            {SUPPORTED_LANGUAGES.map((l) => {
              const isSelected = currentAppLang === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setAppLang(l.code)}
                  className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#f2ca50] text-neutral-950 font-bold shadow-xs scale-105'
                      : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800'
                  }`}
                  title={l.label}
                >
                  <span>{l.flag}</span>
                  <span className="hidden sm:inline">{l.label.slice(0, 3)}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* --- ERROR ALERT --- */}
        {error && view !== 'plans' && (
          <div className="w-full p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-xs text-rose-300 flex flex-col gap-2 animate-in fade-in duration-200">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span className="leading-relaxed">{error}</span>
            </div>
            {(error.includes('Google') || error.includes('OAuth') || error.includes('bloqueado')) && (
              <div className="pt-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    if (username) setRegEmail(username);
                    setError(null);
                    setView('register');
                  }}
                  className="px-3 py-1.5 bg-[#f2ca50] text-neutral-950 font-bold text-xs rounded-xl hover:bg-[#f5d778] transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Crear / Acceder con Email en 10s</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* =========================================
            LOGIN VIEW
            ========================================= */}
        {view === 'login' && (
          <div className="w-full p-6 sm:p-7 bg-[#111116]/95 border border-[#f2ca50]/30 rounded-3xl backdrop-blur-xl shadow-[0_24px_70px_rgba(0,0,0,0.7)] animate-in slide-in-from-bottom-4 duration-300 space-y-4">
            
            {/* INTEGRATED LOGO INSIDE CARD */}
            <div className="relative flex flex-col items-center justify-center pt-1 pb-1 text-center w-full">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-48 bg-[#f2ca50]/12 rounded-full blur-3xl pointer-events-none animate-pulse" />
              
              <div className="relative group cursor-pointer w-full max-w-[380px] sm:max-w-[420px] flex justify-center">
                <div className="p-1.5 rounded-3xl bg-gradient-to-b from-[#f2ca50]/45 via-neutral-800/60 to-neutral-900/90 border-2 border-[#f2ca50]/70 shadow-[0_16px_40px_rgba(242,202,80,0.35)] backdrop-blur-md transition-all duration-300 group-hover:scale-[1.02] group-hover:border-[#f2ca50] group-hover:shadow-[0_20px_50px_rgba(242,202,80,0.45)] overflow-hidden">
                  {(videoLoadFailed || skipVideo) ? (
                    <img
                      src={LOGIN_POSTER}
                      alt="BandManager.io - Plataforma Integral para Bandas"
                      className="w-full h-auto max-h-60 sm:max-h-72 object-contain rounded-[1.25rem]"
                    />
                  ) : (
                    <video
                      ref={loginVideoRef}
                      autoPlay
                      muted
                      playsInline
                      preload="auto"
                      poster={LOGIN_POSTER}
                      aria-label="BandManager.io - Plataforma Integral para Bandas"
                      className="w-full h-auto max-h-60 sm:max-h-72 object-contain rounded-[1.25rem] cursor-pointer"
                      onError={() => setVideoLoadFailed(true)}
                      onMouseEnter={handleReplayLoginVideo}
                    >
                      <source src="/login-animation.mp4" type="video/mp4" />
                      <source src="/login-animation.webm" type="video/webm" />
                    </video>
                  )}
                </div>
              </div>
            </div>

            {resetSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-center gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{resetSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="w-full space-y-3.5">
              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Correo electrónico o Usuario"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#17171f]/90 border border-neutral-800/90 focus:border-[#f2ca50] focus:ring-2 focus:ring-[#f2ca50]/20 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all duration-200 shadow-inner"
                  required
                />
              </div>

              <div className="relative flex items-center">
                <Lock className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  className="w-full pl-11 pr-12 py-3.5 bg-[#17171f]/90 border border-neutral-800/90 focus:border-[#f2ca50] focus:ring-2 focus:ring-[#f2ca50]/20 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all duration-200 shadow-inner"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  onPointerDown={(e) => e.preventDefault()}
                  onMouseDown={(e) => e.preventDefault()}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                  className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-neutral-400 hover:text-neutral-200 active:text-[#f2ca50] transition-colors cursor-pointer z-10 touch-manipulation"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Recordar contraseña & Restablecer contraseña */}
              <div className="flex items-center justify-between text-xs text-neutral-400 px-1 pt-0.5">
                <label className="flex items-center gap-2 cursor-pointer select-none text-neutral-300 hover:text-white transition-colors">
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all duration-200 ${rememberMe ? 'bg-[#f2ca50] border-[#f2ca50] text-neutral-950 shadow-[0_0_10px_rgba(242,202,80,0.4)]' : 'bg-[#17171f] border-neutral-700/80'}`}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span>Recordar contraseña</span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setResetSuccessMsg(null);
                    setResetStep(1);
                    setResetEmailOrUsername(username || '');
                    setView('reset-password');
                  }}
                  className="text-[#f2ca50] hover:underline font-medium cursor-pointer"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 mt-4 rounded-2xl bg-gradient-to-r from-[#f2ca50] to-[#e6b938] hover:from-[#f7dc82] hover:to-[#f2ca50] text-neutral-950 font-bold text-sm tracking-wide transition-all duration-200 shadow-[0_4px_24px_rgba(242,202,80,0.22)] hover:shadow-[0_6px_30px_rgba(242,202,80,0.35)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>Entrando...</span>
                  </span>
                ) : (
                  <span>Entrar a mi cuenta</span>
                )}
              </button>
            </form>


            <div className="relative mt-5 mb-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800/80"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2.5 bg-[#111116] text-neutral-500 font-medium">O continuar con</span>
              </div>
            </div>

            <SocialButtons />

            <div className="text-center mt-5 text-xs text-neutral-400 flex items-center justify-center gap-2 flex-wrap">
              <span>¿No tienes cuenta?</span>
              <button 
                type="button"
                onClick={() => {
                  setError(null);
                  if (username) setRegEmail(username);
                  setView('register');
                }} 
                className="text-[#f2ca50] hover:underline font-semibold cursor-pointer"
              >
                Crear banda
              </button>
              <span className="text-neutral-700">•</span>
              <button 
                type="button"
                onClick={() => {
                  setError(null);
                  if (username) setActivateEmail(username);
                  setActivateStep(1);
                  setView('activate');
                }} 
                className="text-neutral-400 hover:text-[#f2ca50] hover:underline cursor-pointer"
              >
                Activar invitación
              </button>
            </div>

            <div className="pt-3 border-t border-neutral-800/60 text-center text-[11px] text-neutral-400/90 flex items-center justify-center gap-1.5 font-medium">
              <Shield className="w-3.5 h-3.5 text-[#f2ca50]" />
              <span>Acceso seguro cifrado · Datos 100% privados de tu banda</span>
            </div>
          </div>
        )}

        {/* =========================================
            RESET PASSWORD VIEW
            ========================================= */}
        {view === 'reset-password' && (
          <div className="w-full p-6 sm:p-7 bg-[#111116]/90 border border-[#f2ca50]/25 rounded-3xl backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.65)] animate-in slide-in-from-bottom-4 duration-300 space-y-4">
            <div className="flex items-center gap-2.5 mb-2">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setView('login');
                }}
                className="p-2 rounded-xl bg-[#131317] hover:bg-neutral-800 text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer shrink-0"
                title="Volver al inicio de sesión"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h2 className="text-base font-bold text-neutral-100">Restablecer contraseña</h2>
                <p className="text-xs text-neutral-400 leading-tight">
                  {resetStep === 1 
                    ? 'Introduce tu correo o usuario para recuperar tu acceso.'
                    : `Introduce el código para ${resetMaskedEmail || 'tu cuenta'} y tu nueva contraseña.`}
                </p>
              </div>
            </div>

            {resetSuccessMsg && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-400 flex items-start gap-2.5 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                <div className="space-y-1">
                  <p>{resetSuccessMsg}</p>
                </div>
              </div>
            )}

            {resetStep === 1 ? (
              <form onSubmit={handleRequestReset} className="space-y-3.5">
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={resetEmailOrUsername}
                    onChange={(e) => setResetEmailOrUsername(e.target.value)}
                    placeholder="Correo electrónico o Usuario"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                    required
                  />
                </div>

                <p className="text-[11px] text-neutral-400 px-1 leading-tight">
                  ⚡ Te enviaremos un código de verificación de 6 dígitos por correo electrónico para restablecer tu contraseña.
                </p>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 mt-2 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(242,202,80,0.15)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                      <span>Generando código...</span>
                    </span>
                  ) : (
                    <span>Continuar y Generar Código</span>
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleConfirmReset} className="space-y-3.5">
                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <KeyRound className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value)}
                      placeholder="Código de 6 dígitos"
                      maxLength={6}
                      className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 font-mono tracking-wider placeholder:font-sans placeholder:tracking-normal placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                    <input
                      type={showResetNewPassword ? 'text' : 'password'}
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      placeholder="Nueva contraseña (mín. 6 caracteres)"
                      className="w-full pl-11 pr-12 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetNewPassword((prev) => !prev)}
                      onPointerDown={(e) => e.preventDefault()}
                      onMouseDown={(e) => e.preventDefault()}
                      tabIndex={-1}
                      aria-label={showResetNewPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-neutral-400 hover:text-neutral-200 active:text-[#f2ca50] transition-colors cursor-pointer z-10 touch-manipulation"
                    >
                      {showResetNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthBar pass={resetNewPassword} />
                </div>

                <div className="space-y-1">
                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                    <input
                      type={showResetNewPassword ? 'text' : 'password'}
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      placeholder="Repite la nueva contraseña"
                      className="w-full pl-11 pr-11 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                      required
                    />
                  </div>
                  {resetConfirmPassword.length > 0 && (
                    <div className="text-[11px] px-1 flex items-center gap-1.5 pt-0.5">
                      {resetNewPassword === resetConfirmPassword ? (
                        <span className="text-emerald-400 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Las contraseñas coinciden perfectamente
                        </span>
                      ) : (
                        <span className="text-rose-400 font-medium">
                          Las contraseñas no coinciden aún
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || (resetConfirmPassword.length > 0 && resetNewPassword !== resetConfirmPassword)}
                  className="w-full py-3.5 px-4 mt-2 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(242,202,80,0.15)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                      <span>Guardando contraseña...</span>
                    </span>
                  ) : (
                    <span>Restablecer contraseña</span>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="text-xs text-neutral-400 hover:text-[#f2ca50] hover:underline cursor-pointer"
                  >
                    ¿No te ha llegado el código? Pedir otro
                  </button>
                </div>
              </form>
            )}

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setView('login')}
                className="text-xs text-neutral-400 hover:text-[#f2ca50] hover:underline font-medium cursor-pointer"
              >
                Volver a Iniciar Sesión
              </button>
            </div>
          </div>
        )}

        {/* =========================================
            REGISTER VIEW
            ========================================= */}
        {view === 'register' && (
          <div className="w-full p-6 sm:p-7 bg-[#111116]/90 border border-[#f2ca50]/25 rounded-3xl backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.65)] animate-in slide-in-from-bottom-4 duration-300 space-y-4">
            <form onSubmit={handleRegisterSubmit} className="w-full space-y-3.5">
              <div className="relative flex items-center">
                <User className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  value={regLeaderName}
                  onChange={(e) => setRegLeaderName(e.target.value)}
                  placeholder="Tu Nombre o Apodo"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-mono text-neutral-400">Proyecto Musical:</span>
                  <BandNameStylerHelper
                    value={regBandName}
                    onChange={(styled) => setRegBandName(styled)}
                  />
                </div>
                <div className="relative flex items-center">
                  <Music className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                  <input
                    type="text"
                    value={regBandName}
                    onChange={(e) => setRegBandName(e.target.value)}
                    placeholder="Nombre de la Banda / Artista (Ej: KoЯn, 𝕭𝖑𝖆𝖈𝖐 𝕸𝖊𝖙𝖆𝖑)"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="relative flex items-center">
                <Mail className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Correo electrónico"
                  className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Contraseña"
                    className="w-full pl-11 pr-12 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    onPointerDown={(e) => e.preventDefault()}
                    onMouseDown={(e) => e.preventDefault()}
                    tabIndex={-1}
                    aria-label={showRegPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                    className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-neutral-400 hover:text-neutral-200 active:text-[#f2ca50] transition-colors cursor-pointer z-10 touch-manipulation"
                  >
                    {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <PasswordStrengthBar pass={regPassword} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 mt-4 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(242,202,80,0.15)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                    <span>Creando cuenta...</span>
                  </span>
                ) : (
                  <span>Crear cuenta</span>
                )}
              </button>
            </form>

            <div className="relative mt-6 mb-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-neutral-800"></div>
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="px-2 bg-[#09090b] text-neutral-500">O regístrate con</span>
              </div>
            </div>

            <SocialButtons />

            <div className="text-center mt-8">
              <p className="text-sm text-neutral-400">
                ¿Ya tienes cuenta?{' '}
                <button onClick={() => setView('login')} className="text-[#f2ca50] hover:underline font-medium cursor-pointer">
                  Inicia sesión
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =========================================
            ACTIVATE ACCOUNT VIEW (NEW!)
            ========================================= */}
        {view === 'activate' && (
          <div className="w-full p-6 sm:p-7 bg-[#111116]/90 border border-[#f2ca50]/25 rounded-3xl backdrop-blur-xl shadow-[0_20px_60px_rgba(0,0,0,0.65)] animate-in slide-in-from-bottom-4 duration-300 space-y-4">
            {activateStep === 1 ? (
              <div className="space-y-4">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-lg font-bold text-neutral-100">Darse de alta como miembro</h2>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Si el director de tu banda ya te ha añadido en la lista de miembros, introduce tu correo para activar tu cuenta.
                  </p>
                </div>

                <form onSubmit={handleCheckInvitation} className="space-y-3.5">
                  <div className="relative flex items-center">
                    <Mail className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                    <input
                      type="email"
                      value={activateEmail}
                      onChange={(e) => setActivateEmail(e.target.value)}
                      placeholder="Correo electrónico de invitación"
                      className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 mt-4 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(242,202,80,0.15)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                        <span>Comprobando...</span>
                      </span>
                    ) : (
                      <span>Comprobar Invitación</span>
                    )}
                  </button>
                </form>

                {activateEmail.trim().length > 2 && (
                  <div className="p-3 bg-[#131317] border border-neutral-800 rounded-2xl text-xs text-neutral-300 space-y-2 animate-in fade-in">
                    <p className="font-medium text-neutral-200">
                      ¿Quieres registrar tu propia banda en vez de activar una invitación?
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setRegEmail(activateEmail);
                        setError(null);
                        setView('register');
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold transition-all cursor-pointer text-xs flex items-center justify-center gap-2"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>Crear Banda Nueva con {activateEmail}</span>
                    </button>
                  </div>
                )}

                <div className="relative mt-5 mb-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[#09090b] text-neutral-500">O comprobar con</span>
                  </div>
                </div>

                <SocialButtons />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-center space-y-2 mb-4">
                  <h2 className="text-lg font-bold text-neutral-100">¡Invitación Encontrada!</h2>
                  <div className="p-3 bg-[#f2ca50]/5 border border-[#f2ca50]/20 rounded-2xl text-xs text-[#f2ca50] space-y-1">
                    <p className="font-semibold text-center text-neutral-300">Banda(s) detectada(s):</p>
                    <ul className="list-disc pl-4 space-y-0.5 text-left max-h-24 overflow-y-auto">
                      {activateBandsFound.map((b, idx) => (
                        <li key={idx} className="text-neutral-300">
                          <span className="font-semibold text-neutral-100">{b.bandName}</span> ({b.role === 'leader' ? 'Director' : 'Músico'})
                        </li>
                      ))}
                    </ul>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Establece tu nombre real, usuario y contraseña para activar tu cuenta.
                  </p>
                </div>

                <form onSubmit={handleActivateAccount} className="space-y-3.5">
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={activateName}
                      onChange={(e) => setActivateName(e.target.value)}
                      placeholder="Nombre real completo"
                      className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                      required
                    />
                  </div>

                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                    <input
                      type="text"
                      value={activateUsername}
                      onChange={(e) => setActivateUsername(e.target.value)}
                      placeholder="Nombre de usuario elegido"
                      className="w-full pl-11 pr-4 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                      required
                    />
                  </div>

                  <div className="relative flex items-center">
                    <Lock className="w-4 h-4 text-[#f2ca50] absolute left-4 pointer-events-none" />
                    <input
                      type={showActivatePassword ? 'text' : 'password'}
                      value={activatePassword}
                      onChange={(e) => setActivatePassword(e.target.value)}
                      placeholder="Crea tu contraseña"
                      className="w-full pl-11 pr-12 py-3.5 bg-[#131317]/90 border border-neutral-800/90 focus:border-[#f2ca50]/50 rounded-2xl text-sm text-neutral-100 placeholder:text-neutral-500 outline-none transition-all shadow-inner"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowActivatePassword((prev) => !prev)}
                      onPointerDown={(e) => e.preventDefault()}
                      onMouseDown={(e) => e.preventDefault()}
                      tabIndex={-1}
                      aria-label={showActivatePassword ? 'Ocultar contraseña' : 'Ver contraseña'}
                      className="absolute right-0 top-0 bottom-0 w-12 flex items-center justify-center text-neutral-400 hover:text-neutral-200 active:text-[#f2ca50] transition-colors cursor-pointer z-10 touch-manipulation"
                    >
                      {showActivatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-4 mt-4 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm tracking-wide transition-all shadow-[0_0_20px_rgba(242,202,80,0.15)] active:scale-[0.98] disabled:opacity-50 flex items-center justify-center cursor-pointer"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-neutral-950 border-t-transparent rounded-full animate-spin" />
                        <span>Activando...</span>
                      </span>
                    ) : (
                      <span>Completar Registro y Entrar</span>
                    )}
                  </button>
                </form>

                <div className="relative mt-5 mb-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-neutral-800"></div>
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="px-2 bg-[#09090b] text-neutral-500">O activar con tu cuenta de Google</span>
                  </div>
                </div>

                <SocialButtons />
              </div>
            )}

            <div className="text-center mt-8">
              <p className="text-sm text-neutral-400">
                ¿Prefieres iniciar sesión?{' '}
                <button 
                  type="button"
                  onClick={() => {
                    setError(null);
                    setView('login');
                  }} 
                  className="text-[#f2ca50] hover:underline font-medium cursor-pointer"
                >
                  Volver al Login
                </button>
              </p>
            </div>
          </div>
        )}

        {/* =========================================
            PLANS VIEW
            ========================================= */}
        {view === 'plans' && (
          <div className="w-full max-w-md animate-in zoom-in-95 duration-300 py-6">
            <div className="text-center mb-6 space-y-3">
              <div className="flex items-center justify-between px-2">
                <button
                  type="button"
                  onClick={() => setView('register')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#131317] hover:bg-[#1c1c24] border border-neutral-800 text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Volver al registro</span>
                </button>
              </div>

              <h1 className="text-2xl font-bold text-neutral-100 tracking-tight">
                Plan Promo para <span className="text-[#f2ca50]">{regBandName || 'tu Banda'}</span>
              </h1>
              <p className="text-neutral-400 text-xs">
                Acceso gratuito a Dossier (EPK), Captación de Fans con QR y Calendario.
              </p>
            </div>

            <div className="bg-[#151413] border border-[#f2ca50]/50 rounded-3xl p-6 flex flex-col space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase px-2.5 py-0.5 rounded bg-[#f2ca50]/20 text-[#f2ca50]">
                  Festivales & Buskers
                </span>
                <span className="text-xl font-black text-white">0€ <span className="text-xs font-normal text-neutral-400">/ gratis</span></span>
              </div>

              <ul className="space-y-2 text-xs text-neutral-300">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#f2ca50]" />
                  <span>Dossier de Prensa Interactivo (EPK)</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#f2ca50]" />
                  <span>QR de contacto y difusión</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#f2ca50]" />
                  <span>Captación de Base de Fans</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#f2ca50]" />
                  <span>Calendario de conciertos y ensayos</span>
                </li>
              </ul>

              <button
                type="button"
                onClick={() => handlePlanSelect('promo')}
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#f2ca50] hover:bg-[#f5d778] text-neutral-950 font-bold text-sm tracking-wide transition-all cursor-pointer shadow-md disabled:opacity-50"
              >
                {loading ? 'Creando cuenta...' : 'Crear mi Dossier y QR Gratis'}
              </button>
            </div>
          </div>
        )}



      </div>
      </div>
    </div>
    </ModalPortal>
  );
};
