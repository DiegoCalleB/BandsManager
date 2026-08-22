import React, { useState, useEffect } from 'react';
import { Heart, Check, Download, Tag, Loader2, PartyPopper, Shield, X, Flame, Music, Sparkles, ExternalLink, Calendar, Briefcase, Mail, Phone, MessageCircle, Copy } from 'lucide-react';
import { SocialPlatformsList, SocialLinks } from './SocialPlatformsList';
import { useFanFormLanguage } from '../hooks/useFanFormLanguage';
import { FAN_FORM_TRANSLATIONS, FAN_FORM_LANGUAGES, FanFormLanguage, interpolate } from '../i18n/fansTranslations';
import { renderBold } from '../utils/richText';

interface FansLandingProps {
  currentBandId?: string;
  currentBandName?: string;
  currentBandLogo?: string;
}

const FanFormLanguageSwitcher: React.FC<{ language: FanFormLanguage; onChange: (lang: FanFormLanguage) => void }> = ({ language, onChange }) => (
  <div className="flex items-center justify-center gap-1.5">
    {FAN_FORM_LANGUAGES.map(l => (
      <button
        key={l.code}
        type="button"
        onClick={() => onChange(l.code)}
        title={l.label}
        className={`w-8 h-8 rounded-lg text-base flex items-center justify-center border transition-all ${
          language === l.code
            ? 'bg-amber-500/15 border-amber-500/50 shadow-inner'
            : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 opacity-70 hover:opacity-100'
        }`}
      >
        {l.flag}
      </button>
    ))}
  </div>
);

export const FansLanding: React.FC<FansLandingProps> = ({
  currentBandId: initialBandId,
  currentBandName: initialBandName,
  currentBandLogo: initialBandLogo
}) => {
  const [activeTab, setActiveTab] = useState<'redes' | 'form'>('redes');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    ciudad: '',
    comoConocio: '',
    cancionFavorita: '',
    mensaje: '',
    instagram: '',
    consentimiento: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successData, setSuccessData] = useState<any>(null);
  const [concertId, setConcertId] = useState('');
  const [concertName, setConcertName] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [isConcertLink, setIsConcertLink] = useState(false);
  const [language, setLanguage] = useFanFormLanguage();
  const dict = FAN_FORM_TRANSLATIONS[language];
  const t = (key: keyof typeof dict, vars?: Record<string, string | undefined>) =>
    vars ? interpolate(dict[key], vars) : dict[key];

  const DEFAULT_BAKANDEYA_SOCIALS: SocialLinks = {
    instagram: "https://instagram.com/bakandeya_oficial",
    spotify: "https://open.spotify.com/artist/bakandeya",
    youtube: "https://youtube.com/@bakandeya_oficial",
    tiktok: "https://tiktok.com/@bakandeya_oficial",
    website: "https://bands-manager.up.railway.app"
  };

  const [resolvedBandId, setResolvedBandId] = useState<string>('band-bakandeya');
  const [bandName, setBandName] = useState<string>('Bakandeya');
  const [logoUrl, setLogoUrl] = useState<string | null>('/logo_bakandeya.jpg');
  const [socialLinks, setSocialLinks] = useState<SocialLinks | undefined>(DEFAULT_BAKANDEYA_SOCIALS);
  const [contactoBooking, setContactoBooking] = useState<{
    email?: string;
    telefono?: string;
  } | null>({
    email: 'diego.delacalleb@gmail.com',
    telefono: '+34 612 345 678'
  });
  const [donacionRevolut, setDonacionRevolut] = useState<{
    habilitado?: boolean;
    revolutTag?: string;
    revolutUrl?: string;
    titulo?: string;
    descripcion?: string;
  } | null>({
    habilitado: true,
    revolutTag: 'bakandeya',
    revolutUrl: 'https://revolut.me/bakandeya',
    titulo: 'Colabora con Bakandeya con una aportación económica',
    descripcion: 'Tu aportación directa nos ayuda a financiar nuevas grabaciones, furgoneta de gira y producir nuevo merchandising independiente.'
  });
  const [copiedRevolut, setCopiedRevolut] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    // 1. Determine active band ID from URL, props or localStorage
    const params = new URLSearchParams(window.location.search);
    const queryBand = params.get('band_id') || params.get('band') || params.get('b');
    
    let storedBandId = '';
    let storedBandName = '';
    let storedBandLogo = '';
    try {
      const storedUser = localStorage.getItem('bakandeya_user') || localStorage.getItem('band_manager_user') || localStorage.getItem('band_manager_current_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        storedBandId = parsed.band_id || parsed.bandId || '';
        storedBandName = parsed.bandName || parsed.name || '';
        storedBandLogo = parsed.logoUrl || parsed.logo_url || '';
      }
      if (!storedBandId) {
        storedBandId = localStorage.getItem('band_manager_active_band_id') || '';
      }
    } catch {}

    // Priority: 1. URL query param, 2. Props (if explicitly passed and differs from generic), 3. Logged-in stored user, 4. Fallback
    const targetBandId = (queryBand || initialBandId || storedBandId || 'band-bakandeya').toLowerCase();
    const cleanId = targetBandId.replace(/^(band|reg)-/, '');
    setResolvedBandId(targetBandId);

    // Initial fallback name & logo
    if (cleanId === 'bakandeya') {
      setBandName('Bakandeya');
      setLogoUrl('/logo_bakandeya.jpg');
      setSocialLinks(DEFAULT_BAKANDEYA_SOCIALS);
      setContactoBooking({
        email: 'diego.delacalleb@gmail.com',
        telefono: '+34 612 345 678'
      });
    } else if (queryBand) {
      const formatted = cleanId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setBandName(formatted);
      setLogoUrl(null);
      setSocialLinks(undefined);
      setContactoBooking(null);
    } else if (initialBandName && !initialBandName.toLowerCase().includes('bakandeya')) {
      setBandName(initialBandName);
      if (initialBandLogo) setLogoUrl(initialBandLogo);
    } else if (storedBandName && cleanId !== 'bakandeya') {
      setBandName(storedBandName);
      if (storedBandLogo) setLogoUrl(storedBandLogo);
    } else {
      const formatted = cleanId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setBandName(formatted);
      setLogoUrl(null);
    }

    // 2. Fetch public EPK details for this specific band
    fetch(`/api/public/epk?band_id=${encodeURIComponent(targetBandId)}`)
      .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json().catch(() => null) : null)
      .then(data => {
        if (data) {
          if (data.bandName) setBandName(data.bandName);
          if (data.logoUrl || data.epkConfig?.logoUrl) {
            setLogoUrl(data.logoUrl || data.epkConfig.logoUrl);
            setImgError(false);
          } else if (cleanId === 'bakandeya') {
            setLogoUrl('/logo_bakandeya.jpg');
            setImgError(false);
          } else {
            setLogoUrl(null);
          }
          
          if (data.epkConfig?.enlacesRedes && Object.keys(data.epkConfig.enlacesRedes).length > 0) {
            setSocialLinks(data.epkConfig.enlacesRedes);
          } else if (cleanId === 'bakandeya') {
            setSocialLinks(DEFAULT_BAKANDEYA_SOCIALS);
          }

          if (data.epkConfig?.contactoBooking) {
            setContactoBooking({
              email: data.epkConfig.contactoBooking.email,
              telefono: data.epkConfig.contactoBooking.telefono
            });
          }

          if (data.epkConfig?.donacionRevolut) {
            setDonacionRevolut(data.epkConfig.donacionRevolut);
          } else if (cleanId === 'bakandeya') {
            setDonacionRevolut({
              habilitado: true,
              revolutTag: 'bakandeya',
              revolutUrl: 'https://revolut.me/bakandeya',
              titulo: 'Colabora con Bakandeya con una aportación económica',
              descripcion: 'Tu aportación directa nos ayuda a financiar nuevas grabaciones, furgoneta de gira y producir nuevo merchandising independiente.'
            });
          } else if (data.epkConfig?.enlacesRedes?.revolut) {
            const rawRev = data.epkConfig.enlacesRedes.revolut;
            const revUrl = rawRev.startsWith('http') ? rawRev : `https://revolut.me/${rawRev.replace(/^@/, '').replace(/^revolut\.me\//, '')}`;
            setDonacionRevolut({
              habilitado: true,
              revolutUrl: revUrl,
              revolutTag: rawRev.replace(/^https?:\/\//, '').replace(/^revolut\.me\//, '').replace(/^@/, ''),
              titulo: `Colabora con ${data.bandName || bandName} con una aportación económica`
            });
          } else {
            setDonacionRevolut(null);
          }
        }
      })
      .catch(err => {
        console.warn("Could not fetch EPK data for fans landing:", err);
      });
  }, [initialBandId, initialBandName, initialBandLogo]);

  useEffect(() => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    let slug = '';

    if (pathParts.length > 1) {
      slug = pathParts[1];
    } else if (pathParts.length === 1 && !['unete', 'fans', 'directo', 'bakandeya', 'app'].includes(pathParts[0])) {
      slug = pathParts[0];
    }

    if (slug && slug !== 'directo') {
      const formattedName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setConcertName(formattedName);
      setFormData(prev => ({ ...prev, comoConocio: 'Concierto' }));
      setIsConcertLink(true);
    } else {
      setFormData(prev => ({ ...prev, comoConocio: 'Concierto' }));
      setIsConcertLink(true);
    }

    const params = new URLSearchParams(window.location.search);
    const cid = params.get('concertId');
    const cname = params.get('concertName');
    
    if (cid) setConcertId(cid);
    if (cname) {
      setConcertName(cname);
      setIsConcertLink(true);
    }
  }, []);

  const revolutUrl = donacionRevolut?.revolutUrl 
    || (donacionRevolut?.revolutTag ? (donacionRevolut.revolutTag.startsWith('http') ? donacionRevolut.revolutTag : `https://revolut.me/${donacionRevolut.revolutTag.replace(/^@/, '').replace(/^revolut\.me\//, '')}`) : '')
    || (socialLinks?.revolut ? (socialLinks.revolut.startsWith('http') ? socialLinks.revolut : `https://revolut.me/${socialLinks.revolut.replace(/^@/, '').replace(/^revolut\.me\//, '')}`) : '')
    || (resolvedBandId.includes('bakandeya') ? 'https://revolut.me/bakandeya' : '');

  const rawHandle = revolutUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const revolutDisplay = rawHandle || 'revolut.me/bakandeya';

  const renderRevolutCard = (isSuccessScreen = false) => {
    if (!revolutUrl || donacionRevolut?.habilitado === false) return null;

    const title = isSuccessScreen 
      ? t('revolutSuccessPrompt', { bandName })
      : (donacionRevolut?.titulo || t('economicSupportTitle', { bandName }));

    return (
      <div className={isSuccessScreen ? 'pt-3 border-t border-neutral-800 text-left' : 'pt-2'}>
        <div className="p-3 rounded-xl bg-neutral-950/90 border border-neutral-800/90 hover:border-neutral-700 transition flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg bg-white text-black flex items-center justify-center shrink-0 p-1 shadow-sm">
              <svg className="w-full h-full fill-black" viewBox="0 0 24 24">
                <path d="M18.72 9.24c-.06-.5-.2-.98-.44-1.42a4.43 4.43 0 0 0-1.12-1.3A4.78 4.78 0 0 0 15.5 5.6c-.63-.23-1.3-.35-1.98-.35H6.28v2.75h7.24c.72 0 1.39.28 1.9.79.5.5.79 1.18.79 1.9 0 .73-.29 1.4-.79 1.91-.51.5-1.18.78-1.9.78h-3.3v2.8h2.64l4.28 7.82h3.28l-4.14-7.57a4.93 4.93 0 0 0 2.94-4.23zM6.28 10.3v13.7h2.75V10.3H6.28z"/>
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono font-bold text-neutral-200 leading-tight truncate">
                {title}
              </p>
              <p className="text-[10px] font-mono text-neutral-500 truncate">
                {revolutDisplay}
              </p>
            </div>
          </div>

          <a
            href={revolutUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="py-1.5 px-3 bg-white hover:bg-neutral-200 text-black font-bold font-mono text-xs rounded-lg shadow flex items-center gap-1.5 transition active:scale-95 cursor-pointer shrink-0"
          >
            <span>{t('revolutButton')}</span>
            <ExternalLink className="w-3 h-3 shrink-0" />
          </a>
        </div>
      </div>
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.consentimiento) {
      setError(t('errorRequiredFields'));
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/public/fans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          band_id: resolvedBandId,
          nombre: formData.nombre,
          email: formData.email,
          ciudad: formData.ciudad,
          comoConocio: formData.comoConocio,
          cancionFavorita: formData.cancionFavorita,
          mensaje: formData.mensaje,
          instagram: formData.instagram,
          conciertoOrigenId: concertId,
          conciertoOrigenNombre: concertName,
          consentimientoRGPD: formData.consentimiento
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('errorGenericSignup'));
      
      setSuccessData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (successData) {
    const incentivo = successData.incentivo || {};
    
    return (
      <div className="min-h-screen bg-[#121111] flex items-start justify-center p-4 pt-8 sm:items-center sm:pt-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/20 shadow-inner">
            <Heart className="w-10 h-10 text-amber-500" />
          </div>

          <FanFormLanguageSwitcher language={language} onChange={setLanguage} />

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white font-display uppercase tracking-widest flex items-center justify-center gap-2">
              <PartyPopper className="w-6 h-6 text-amber-400" />
              {t('welcomeTitle', { bandName })}
            </h2>
            <p className="text-neutral-300 font-mono text-sm leading-relaxed max-w-xs mx-auto">
              {successData.alreadyRegistered
                ? successData.message
                : (incentivo.mensajeAgradecimiento || t('registeredDefaultMessage', { bandName }))}
            </p>
          </div>

          {(incentivo.enlaceDescarga || incentivo.codigoDescuento) && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 mt-6 space-y-4">
              <h3 className="text-amber-500 font-black uppercase tracking-widest text-xs font-mono">{t('benefitsTitle')}</h3>

              {incentivo.enlaceDescarga && (
                <div className="pt-2">
                  <a
                    href={incentivo.enlaceDescarga}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-2 w-full p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono text-xs transition-colors"
                  >
                    <Download className="w-5 h-5 text-amber-400" />
                    <span className="font-bold">{t('downloadExclusive')}</span>
                  </a>
                </div>
              )}

              {incentivo.codigoDescuento && (
                <div className="pt-2">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-1">{t('merchCode')}</p>
                  <div className="flex items-center justify-center gap-2 p-3 bg-neutral-900 border border-neutral-700 border-dashed rounded-lg">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    <span className="font-mono text-emerald-400 font-bold tracking-widest">{incentivo.codigoDescuento}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Official Social Links in Success View */}
          {socialLinks && Object.values(socialLinks).some(Boolean) && (
            <div className="pt-2 border-t border-neutral-800">
              <SocialPlatformsList
                links={socialLinks}
                variant="grid"
                title={t('followUsPlatforms')}
              />
            </div>
          )}

          {/* Revolut Support in Success View */}
          {renderRevolutCard(true)}

          {/* Booking / Contrataciones in Success View */}
          {contactoBooking && (contactoBooking.email || contactoBooking.telefono) && (
            <div className="pt-4 border-t border-neutral-800 text-left">
              <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" /> {t('bookingTitle')}
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    {t('bookingBadgeLive')}
                  </span>
                </div>
                <p className="text-[11px] font-mono text-neutral-300 leading-relaxed">
                  {renderBold(t('bookingQuestion', { bandName }))}
                </p>
                <div className="space-y-1.5 pt-1">
                  {contactoBooking.email && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                      <a
                        href={`mailto:${contactoBooking.email}?subject=${encodeURIComponent(t('bookingEmailSubject', { bandName }))}`}
                        className="flex items-center gap-2 text-xs font-mono text-amber-300 hover:text-amber-200 truncate flex-1"
                      >
                        <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate">{contactoBooking.email}</span>
                      </a>
                    </div>
                  )}
                  {contactoBooking.telefono && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                      <a
                        href={`tel:${contactoBooking.telefono.replace(/\s+/g, '')}`}
                        className="flex items-center gap-2 text-xs font-mono text-emerald-300 hover:text-emerald-200 truncate flex-1"
                      >
                        <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate">{contactoBooking.telefono}</span>
                      </a>
                      <a
                        href={`https://wa.me/${contactoBooking.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t('bookingWhatsappText', { bandName }))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-0.5 text-[9px] font-mono text-emerald-400 bg-emerald-950/60 rounded border border-emerald-500/30 flex items-center gap-1 shrink-0 ml-2"
                      >
                        <MessageCircle className="w-3 h-3" /> WhatsApp
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <a href="/" className="text-xs font-mono text-neutral-500 hover:text-amber-500 underline transition-colors">
              {t('backHome')}
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121111] flex items-start justify-center p-4 pt-8 sm:items-center sm:pt-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-neutral-800 to-neutral-700" />
        
        <div className="text-center space-y-4 pt-2">
          {logoUrl && !imgError ? (
            <div className="relative inline-block mx-auto">
              <img 
                src={logoUrl} 
                alt={bandName} 
                onError={() => setImgError(true)}
                className="w-24 h-24 mx-auto object-contain p-1 rounded-2xl border-2 border-amber-500/40 bg-neutral-950 shadow-xl drop-shadow-[0_0_15px_rgba(242,202,80,0.2)]" 
              />
            </div>
          ) : (
            <div className="w-24 h-24 mx-auto rounded-2xl border-2 border-amber-500/50 bg-gradient-to-br from-neutral-900 to-neutral-950 flex flex-col items-center justify-center p-2 shadow-2xl drop-shadow-[0_0_20px_rgba(242,202,80,0.25)]">
              <Flame className="w-10 h-10 text-amber-400 mb-0.5 animate-pulse" />
              <span className="text-[10px] font-black text-amber-300 font-display uppercase tracking-wider line-clamp-1">{bandName}</span>
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-white font-display uppercase tracking-widest drop-shadow-md">
              {t('joinTitle', { bandName })}
            </h1>
            <p className="text-amber-500/80 text-[10px] font-mono uppercase tracking-widest font-bold">{t('officialChannel')}</p>
          </div>
          <div className="pt-2 space-y-2">
            {isConcertLink ? (
              <div>
                <span className="text-emerald-400 font-bold px-3.5 py-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full inline-flex items-center gap-1.5 text-xs">
                  <span>{concertName ? t('thanksConcertWithName', { concertName }) : t('thanksConcertGeneric')}</span>
                </span>
              </div>
            ) : (
              <div>
                <span className="text-amber-400 font-bold px-3.5 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-full inline-flex items-center gap-1.5 text-xs">
                  <span>{t('thanksSupport')}</span>
                </span>
              </div>
            )}
            <p className="text-neutral-400 text-xs font-mono leading-relaxed max-w-sm mx-auto">
              {renderBold(t('supportIntro'))}
            </p>
            <FanFormLanguageSwitcher language={language} onChange={setLanguage} />
          </div>
        </div>

        {/* Dual Tab Mode Switcher */}
        <div className="flex bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800 text-xs font-mono">
          <button 
            type="button" 
            onClick={() => setActiveTab('redes')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-2 ${
              activeTab === 'redes' 
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20 font-black' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>{t('tabFollow')}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 py-2.5 px-3 rounded-xl font-bold transition-all text-center flex items-center justify-center gap-2 ${
              activeTab === 'form'
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20 font-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>{t('tabJoin')}</span>
          </button>
        </div>

        {/* Tab 1: Redes Sociales */}
        {activeTab === 'redes' && (
          <div className="space-y-3.5 animate-fade-in pt-1">
            <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800 text-center space-y-1">
              <p className="text-xs font-bold text-amber-400">{t('followHelpTitle')}</p>
              <p className="text-[11px] text-neutral-400 font-mono leading-relaxed">
                {renderBold(t('followHelpBody'))}
              </p>
            </div>

            <SocialPlatformsList
              links={socialLinks || {}}
              variant="grid"
              showTitle={false}
            />

            {/* Aportación Económica / Revolut debajo de links de redes */}
            {renderRevolutCard(false)}

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="text-xs font-mono text-amber-400/90 hover:text-amber-300 underline font-bold transition-colors"
              >
                {t('followCTA')}
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: Formulario de Registro */}
        {activeTab === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-4 pt-1 animate-fade-in">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono rounded-xl text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="text-[10px] font-black text-neutral-300 uppercase font-mono tracking-widest mb-1.5 block">{t('labelName')}</label>
              <input
                type="text"
                required
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
                placeholder={t('placeholderName')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-neutral-300 uppercase font-mono tracking-widest mb-1.5 block">{t('labelEmail')}</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
                placeholder="tu@email.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase font-mono tracking-widest mb-1.5 block">{t('labelCity')}</label>
              <input
                type="text"
                value={formData.ciudad}
                onChange={e => setFormData({...formData, ciudad: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
                placeholder={t('placeholderCity')}
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-neutral-300 uppercase font-mono tracking-widest mb-1.5 block">{t('labelHowFound')}</label>
              <select
                required
                value={formData.comoConocio}
                onChange={e => setFormData({...formData, comoConocio: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors appearance-none"
              >
                <option value="">{t('optionSelect')}</option>
                <option value="Concierto">{t('optionConcert')}</option>
                <option value="Redes Sociales">{t('optionSocial')}</option>
                <option value="Amigo">{t('optionFriend')}</option>
                <option value="Spotify">{t('optionSpotify')}</option>
                <option value="Otro">{t('optionOther')}</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase font-mono tracking-widest mb-1.5 block">{t('labelFavSong', { bandName })}</label>
              <input
                type="text"
                value={formData.cancionFavorita}
                onChange={e => setFormData({...formData, cancionFavorita: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
                placeholder={t('placeholderFavSong')}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase font-mono tracking-widest mb-1.5 block">{t('labelInstagram')}</label>
              <input
                type="text"
                value={formData.instagram}
                onChange={e => setFormData({...formData, instagram: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
                placeholder={t('placeholderInstagram')}
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase font-mono tracking-widest mb-1.5 block">{t('labelMessage')}</label>
              <textarea
                rows={2}
                value={formData.mensaje}
                onChange={e => setFormData({...formData, mensaje: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-white font-mono text-sm outline-none transition-colors resize-none"
                placeholder={t('placeholderMessage')}
              />
            </div>

            <div className="pt-2 pb-1">
              <label className="flex items-start gap-3 cursor-pointer group p-3 bg-neutral-950/50 rounded-xl border border-neutral-800 hover:border-neutral-700 transition-colors">
                <div className="relative flex items-center justify-center mt-0.5">
                  <input
                    type="checkbox"
                    required
                    checked={formData.consentimiento}
                    onChange={e => setFormData({...formData, consentimiento: e.target.checked})}
                    className="peer appearance-none w-5 h-5 border-2 border-neutral-700 rounded bg-neutral-950 checked:bg-amber-500 checked:border-amber-500 transition-colors shrink-0 cursor-pointer"
                  />
                  <Check className="w-3.5 h-3.5 text-neutral-900 absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={4} />
                </div>
                <span className="text-[10px] text-neutral-400 font-mono leading-relaxed group-hover:text-neutral-300 transition-colors pt-0.5">
                  {t('consentPrefix')}<button type="button" onClick={() => setShowPrivacyModal(true)} className="text-amber-400 underline hover:text-amber-300 font-bold inline">{t('consentPrivacyLink')}</button>{t('consentMiddle')}<strong className="text-neutral-200">{t('consentExplicit')}</strong>{t('consentSuffix')}
                </span>
              </label>
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-1 bg-gradient-to-r from-[#f2ca50] to-[#e0a820] hover:from-[#ffe088] hover:to-[#f2ca50] text-[#121111] font-black text-sm uppercase tracking-widest font-mono rounded-xl shadow-[0_0_20px_rgba(242,202,80,0.15)] transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 disabled:pointer-events-none cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('submitting')}
                </>
              ) : (
                t('submitJoin', { bandName })
              )}
            </button>

            {/* Social Links shown below form as well */}
            {socialLinks && Object.values(socialLinks).some(Boolean) && (
              <div className="pt-4 border-t border-neutral-800 space-y-2">
                <p className="text-[11px] font-bold text-neutral-400 font-mono text-center uppercase tracking-wider">
                  {t('followUsAlso')}
                </p>
                <SocialPlatformsList
                  links={socialLinks}
                  variant="pills"
                  showTitle={false}
                />
              </div>
            )}
          </form>
        )}

        {/* Sección Destacada de Contrataciones & Booking Directo */}
        {contactoBooking && (contactoBooking.email || contactoBooking.telefono) && (
          <div className="pt-5 border-t border-neutral-800 space-y-3">
            <div className="p-4 rounded-xl bg-gradient-to-br from-neutral-950 via-neutral-900 to-amber-950/30 border border-amber-500/30 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-amber-400">
                  <Briefcase className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-mono font-black uppercase tracking-wider">
                    {t('bookingTitle')}
                  </span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                  {t('bookingBadgeLive')}
                </span>
              </div>

              <p className="text-[11px] font-mono text-neutral-300 leading-relaxed">
                {renderBold(t('bookingQuestion', { bandName }))}
              </p>

              <div className="space-y-2 pt-1">
                {contactoBooking.email && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 transition-colors">
                    <a
                      href={`mailto:${contactoBooking.email}?subject=${encodeURIComponent(t('bookingEmailSubject', { bandName }))}`}
                      className="flex items-center gap-2.5 text-xs font-mono text-amber-300 hover:text-amber-200 transition-colors truncate flex-1 font-bold"
                    >
                      <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">{contactoBooking.email}</span>
                    </a>
                  </div>
                )}

                {contactoBooking.telefono && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 transition-colors">
                    <a
                      href={`tel:${contactoBooking.telefono.replace(/\s+/g, '')}`}
                      className="flex items-center gap-2.5 text-xs font-mono text-emerald-300 hover:text-emerald-200 transition-colors truncate flex-1 font-bold"
                    >
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{contactoBooking.telefono}</span>
                    </a>
                    <div className="flex items-center shrink-0 ml-2">
                      <a
                        href={`https://wa.me/${contactoBooking.telefono.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(t('bookingWhatsappText', { bandName }))}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 hover:bg-emerald-950 rounded border border-emerald-500/30 transition-colors flex items-center gap-1.5 font-bold"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Privacy Policy Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4">
              <div className="flex items-center gap-2 text-amber-500 font-mono font-bold text-sm uppercase tracking-wider">
                <Shield className="w-5 h-5" /> {t('privacyModalTitle')}
              </div>
              <button onClick={() => setShowPrivacyModal(false)} className="text-neutral-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-neutral-300 font-mono space-y-3 leading-relaxed">
              <p>{renderBold(t('privacyPara1', { bandName }))}</p>
              <p>{renderBold(t('privacyPara2', { bandName }))}</p>
              <p>{renderBold(t('privacyPara3', { bandName }))}</p>
              <p>{renderBold(t('privacyPara4', { bandName }))}</p>
            </div>

            <div className="pt-4 border-t border-neutral-800 text-right">
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                {t('understood')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FansLanding;
