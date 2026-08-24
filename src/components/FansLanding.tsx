import React, { useState, useEffect } from 'react';
import {
  Heart, Check, Download, Tag, Loader2, PartyPopper, Shield, X, Flame,
  Music, Sparkles, Calendar, Briefcase, Mail, Phone, MessageCircle,
  Lock as LockIcon, ExternalLink, BookOpen, ChevronRight, ChevronDown, ChevronUp,
  Copy, Users, Gift, Ticket, Headphones, MapPin, Share2, Play, Pause, Volume2
} from 'lucide-react';
import { SocialPlatformsList, SocialLinks, PayPalLogo, BizumLogo } from './SocialPlatformsList';
import { useFanFormLanguage } from '../hooks/useFanFormLanguage';
import { FAN_FORM_TRANSLATIONS, FAN_FORM_LANGUAGES, FanFormLanguage, interpolate, idiomasDisponiblesParaConcierto } from '../i18n/fansTranslations';
import { renderBold } from '../utils/richText';
import { safeUrl } from '../utils/safeUrl';

import { Concert, EPKConfig, BandMember } from '../types';

export interface FansLandingProps {
  currentBandId?: string;
  currentBandName?: string;
  currentBandLogo?: string;
  isPreview?: boolean;
  previewLanguage?: FanFormLanguage;
  previewConfig?: Partial<EPKConfig>;
  previewConcert?: Concert | null;
  previewConcertName?: string;
  previewView?: 'form' | 'success';
  onClosePreview?: () => void;
}

const FanFormLanguageSwitcher: React.FC<{ language: FanFormLanguage; onChange: (lang: FanFormLanguage) => void; languages: typeof FAN_FORM_LANGUAGES }> = ({ language, onChange, languages }) => (
  <div className="flex items-center justify-center gap-1.5">
    {languages.map(l => (
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
  currentBandLogo: initialBandLogo,
  isPreview = false,
  previewLanguage,
  previewConfig,
  previewConcert,
  previewConcertName,
  previewView = 'form',
  onClosePreview
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
  const [isConcertLink, setIsConcertLink] = useState(Boolean(previewConcert || previewConcertName));
  const [language, setLanguage] = useFanFormLanguage(isPreview ? previewLanguage : undefined);

  // El idioma "del concierto": el que trae el QR (o el de la previsualización), capturado una
  // sola vez al montar. A propósito NO seguimos a `language` según el fan va tocando el
  // selector: si es-tiquetara "English" en un show en Praga, tomar ahí el ancla habría hecho
  // desaparecer el checo del selector (es/en da solo 2 idiomas). El idioma de fondo del
  // concierto se queda fijo; solo decide QUÉ 2-3 banderas se ofrecen, no cuál está activa.
  const [conciertoLanguage, setConciertoLanguage] = useState<FanFormLanguage>(() => language);
  const availableLanguages = FAN_FORM_LANGUAGES.filter(l =>
    idiomasDisponiblesParaConcierto(conciertoLanguage).includes(l.code)
  ).sort((a, b) =>
    idiomasDisponiblesParaConcierto(conciertoLanguage).indexOf(a.code) -
    idiomasDisponiblesParaConcierto(conciertoLanguage).indexOf(b.code)
  );

  // Sincronizar idioma si se proporciona en modo preview
  useEffect(() => {
    if (isPreview && previewLanguage && previewLanguage !== language) {
      setLanguage(previewLanguage);
    }
    if (isPreview && previewLanguage && previewLanguage !== conciertoLanguage) {
      setConciertoLanguage(previewLanguage);
    }
  }, [isPreview, previewLanguage]);

  // Si se solicita previsualizar directamente la pantalla de éxito
  useEffect(() => {
    if (isPreview && previewView === 'success') {
      const inc = previewConfig?.incentivoFans || {
        mensajeAgradecimiento: '¡Gracias por unirte a nuestra comunidad oficial!',
        enlaceDescarga: 'https://bands-manager.up.railway.app/descargas/tema-inedito-directo.mp3',
        codigoDescuento: 'BAKANDEYA-FAN-10'
      };
      setSuccessData({
        success: true,
        message: inc.mensajeAgradecimiento || '¡Bienvenido a la comunidad!',
        incentivo: inc,
        isSimulated: true
      });
    } else if (isPreview && previewView === 'form') {
      setSuccessData(null);
    }
  }, [isPreview, previewView, previewConfig]);

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
    paypalUser?: string;
    paypalUrl?: string;
    bizumTelefono?: string;
    metodoPorDefecto?: 'revolut' | 'paypal' | 'bizum';
    titulo?: string;
    descripcion?: string;
  } | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'revolut' | 'paypal' | 'bizum'>('revolut');
  const [copiedBizum, setCopiedBizum] = useState(false);
  const [miembros, setMiembros] = useState<BandMember[]>([]);
  const [upcomingConcerts, setUpcomingConcerts] = useState<Concert[]>([]);
  const [showAllConcerts, setShowAllConcerts] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [clickCounts, setClickCounts] = useState<Record<string, number>>({});
  const [audioPreviewConfig, setAudioPreviewConfig] = useState<{
    habilitado?: boolean;
    cancionId?: string;
    audioUrl?: string;
    tituloTema?: string;
    subtitulo?: string;
  } | null>({
    habilitado: true,
    audioUrl: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
    tituloTema: 'Directo Preview',
    subtitulo: 'Dale al play para escuchar cómo sonamos'
  });
  const [isPlayingAudioPreview, setIsPlayingAudioPreview] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const audioPreviewRef = React.useRef<HTMLAudioElement | null>(null);

  const toggleAudioPreview = () => {
    const targetAudioUrl = audioPreviewConfig?.audioUrl?.trim() || 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg';
    
    if (!audioPreviewRef.current || audioPreviewRef.current.src !== targetAudioUrl) {
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
      const audio = new Audio(targetAudioUrl);
      audio.onended = () => setIsPlayingAudioPreview(false);
      audioPreviewRef.current = audio;
    }
    if (isPlayingAudioPreview) {
      audioPreviewRef.current.pause();
      setIsPlayingAudioPreview(false);
    } else {
      audioPreviewRef.current.play().then(() => {
        setIsPlayingAudioPreview(true);
        trackClick('audio_preview', '', 'landing');
      }).catch(() => {
        setIsPlayingAudioPreview(true);
      });
    }
  };

  const handleShareWithFriend = async () => {
    const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareMessage = `¡Únete a la comunidad de ${bandName} para escuchar temas inéditos y conseguir descuentos exclusivos! 🎸 ${currentUrl}`;
    
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Comunidad Oficial de ${bandName}`,
          text: `¡Únete a la comunidad de ${bandName} para escuchar temas inéditos y conseguir descuentos! 🎸`,
          url: currentUrl,
        });
        trackClick('share_native', currentUrl, 'success');
        return;
      } catch (err) {
        // Fallback to clipboard copy if cancelled or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
      trackClick('share_copy', currentUrl, 'success');
    } catch {}
  };

  const trackClick = (platform: string, url?: string, context?: string) => {
    const key = platform.toLowerCase();
    setClickCounts(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
    try {
      fetch('/api/public/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          band_id: resolvedBandId,
          platform: key,
          button_type: key,
          context: context || (activeTab === 'form' ? 'form' : 'redes')
        }),
        keepalive: true
      }).catch(() => {});
    } catch {}
  };

  useEffect(() => {
    if (isPreview && previewConfig) {
      if (initialBandName) setBandName(initialBandName);
      if (initialBandLogo || previewConfig.logoUrl) {
        setLogoUrl(initialBandLogo || previewConfig.logoUrl || null);
      }
      if (previewConfig.enlacesRedes && Object.keys(previewConfig.enlacesRedes).length > 0) {
        setSocialLinks(previewConfig.enlacesRedes);
      }
      if (previewConfig.contactoBooking) {
        setContactoBooking({
          email: previewConfig.contactoBooking.email,
          telefono: previewConfig.contactoBooking.telefono
        });
      }
      if (previewConfig.donacionRevolut) {
        setDonacionRevolut(previewConfig.donacionRevolut);
        if (previewConfig.donacionRevolut.metodoPorDefecto) {
          setSelectedPaymentMethod(previewConfig.donacionRevolut.metodoPorDefecto);
        }
      }
      if (previewConfig.audioPreview) {
        setAudioPreviewConfig(previewConfig.audioPreview);
      }
      if (previewConfig.miembros && Array.isArray(previewConfig.miembros)) {
        setMiembros(previewConfig.miembros);
      }
      if (previewConcert) {
        setConcertId(previewConcert.id);
        setConcertName(`${previewConcert.sala} (${previewConcert.ciudad})`);
        setIsConcertLink(true);
      } else if (previewConcertName) {
        setConcertName(previewConcertName);
        setIsConcertLink(true);
      }
      return;
    }

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

    // Priority: 1. URL query param, 2. Props (if explicitly passed and differs from generic), 3. Logged-in stored user.
    const targetBandId = (queryBand || initialBandId || storedBandId || '').toLowerCase();
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
      setMiembros([
        { id: 'm-1', nombre: 'Diego de la Calle', rol: 'Voz & Guitarra' },
        { id: 'm-2', nombre: 'José Filgueira', rol: 'Bajo & Coros' },
        { id: 'm-3', nombre: 'Jon Quel', rol: 'Batería' },
        { id: 'm-4', nombre: 'Elyar Pashang', rol: 'Metales & Percusión' }
      ]);
    } else if (queryBand) {
      const formatted = cleanId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setBandName(formatted);
      setLogoUrl(null);
      setSocialLinks(undefined);
      setContactoBooking(null);
      setMiembros([]);
    } else if (initialBandName && !initialBandName.toLowerCase().includes('bakandeya')) {
      setBandName(initialBandName);
      if (initialBandLogo) setLogoUrl(initialBandLogo);
      setMiembros([]);
    } else if (storedBandName && cleanId !== 'bakandeya') {
      setBandName(storedBandName);
      if (storedBandLogo) setLogoUrl(storedBandLogo);
      setMiembros([]);
    } else if (cleanId) {
      const formatted = cleanId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setBandName(formatted);
      setLogoUrl(null);
      setMiembros([]);
    } else {
      setBandName('');
      setLogoUrl(null);
      setMiembros([]);
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

          if (data.epkConfig?.miembros && Array.isArray(data.epkConfig.miembros) && data.epkConfig.miembros.length > 0) {
            setMiembros(data.epkConfig.miembros);
          } else if (cleanId === 'bakandeya') {
            setMiembros([
              { id: 'm-1', nombre: 'Diego de la Calle', rol: 'Voz & Guitarra' },
              { id: 'm-2', nombre: 'José Filgueira', rol: 'Bajo & Coros' },
              { id: 'm-3', nombre: 'Jon Quel', rol: 'Batería' },
              { id: 'm-4', nombre: 'Elyar Pashang', rol: 'Metales & Percusión' }
            ]);
          }

          if (data.epkConfig?.donacionRevolut) {
            setDonacionRevolut(data.epkConfig.donacionRevolut);
            if (data.epkConfig.donacionRevolut.metodoPorDefecto) {
              setSelectedPaymentMethod(data.epkConfig.donacionRevolut.metodoPorDefecto);
            }
          } else if (data.epkConfig?.enlacesRedes?.revolut || data.epkConfig?.enlacesRedes?.paypal || data.epkConfig?.enlacesRedes?.bizum) {
            const rawRev = data.epkConfig.enlacesRedes.revolut?.trim();
            const revUrl = rawRev ? (rawRev.startsWith('http') ? rawRev : `https://revolut.me/${rawRev.replace(/^@/, '').replace(/^revolut\.me\//, '')}`) : undefined;
            const rawPay = data.epkConfig.enlacesRedes.paypal?.trim();
            const payUrl = rawPay ? (rawPay.startsWith('http') ? rawPay : `https://paypal.me/${rawPay.replace(/^@/, '').replace(/^paypal\.me\//, '')}`) : undefined;
            const rawBiz = data.epkConfig.enlacesRedes.bizum?.trim();
            setDonacionRevolut({
              habilitado: true,
              revolutUrl: revUrl,
              revolutTag: rawRev ? rawRev.replace(/^https?:\/\//, '').replace(/^revolut\.me\//, '').replace(/^@/, '') : undefined,
              paypalUrl: payUrl,
              paypalUser: rawPay ? rawPay.replace(/^https?:\/\//, '').replace(/^paypal\.me\//, '').replace(/^@/, '') : undefined,
              bizumTelefono: rawBiz,
              metodoPorDefecto: revUrl ? 'revolut' : (payUrl ? 'paypal' : 'bizum')
            });
          } else {
            setDonacionRevolut(null);
          }

          if (data.epkConfig?.audioPreview) {
            setAudioPreviewConfig(data.epkConfig.audioPreview);
          }

          if (data.upcomingConcerts && Array.isArray(data.upcomingConcerts)) {
            setUpcomingConcerts(data.upcomingConcerts);
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

    // Solo asumimos "vengo de un concierto" cuando el enlace realmente identifica uno
    // (slug de concierto o parámetros concertId/concertName en la URL). Un enlace genérico
    // (/unete, /fans, bio de Instagram...) no debe precontestar "¿Cómo nos conociste?" ni
    // mostrar el mensaje de "gracias por venir al concierto".
    if (slug && slug !== 'directo') {
      const formattedName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setConcertName(formattedName);
      setFormData(prev => ({ ...prev, comoConocio: 'Concierto' }));
      setIsConcertLink(true);
    }

    const params = new URLSearchParams(window.location.search);
    const cid = params.get('concertId');
    const cname = params.get('concertName');

    if (cid) setConcertId(cid);
    if (cname) {
      setConcertName(cname);
      setFormData(prev => ({ ...prev, comoConocio: 'Concierto' }));
      setIsConcertLink(true);
    }
  }, []);

  // safeUrl() al final: donacionRevolut.revolutUrl/paypalUrl es texto libre editado por el admin
  // de la banda y se renderiza como href en esta página pública sin sesión — sin filtrar el
  // esquema, un valor tipo "javascript:..." se ejecutaría en el navegador de cualquier fan.
  const rawRevolutTag = donacionRevolut?.revolutTag?.replace(/^@/, '').replace(/^revolut\.me\//i, '').trim() || '';
  const rawRevolutUrl = donacionRevolut?.revolutUrl?.trim() || '';
  const rawSocialRevolut = socialLinks?.revolut?.trim() || '';
  const revolutUrl = safeUrl(
    rawRevolutUrl ||
    (rawRevolutTag ? (rawRevolutTag.startsWith('http') ? rawRevolutTag : `https://revolut.me/${rawRevolutTag}`) : '') ||
    (rawSocialRevolut ? (rawSocialRevolut.startsWith('http') ? rawSocialRevolut : `https://revolut.me/${rawSocialRevolut.replace(/^@/, '').replace(/^revolut\.me\//i, '')}`) : '')
  ) || '';

  const rawPaypalUser = donacionRevolut?.paypalUser?.replace(/^@/, '').replace(/^paypal\.me\//i, '').trim() || '';
  const rawPaypalUrl = donacionRevolut?.paypalUrl?.trim() || '';
  const rawSocialPaypal = socialLinks?.paypal?.trim() || '';
  const paypalUrl = safeUrl(
    rawPaypalUrl ||
    (rawPaypalUser ? (rawPaypalUser.startsWith('http') ? rawPaypalUser : `https://paypal.me/${rawPaypalUser}`) : '') ||
    (rawSocialPaypal ? (rawSocialPaypal.startsWith('http') ? rawSocialPaypal : `https://paypal.me/${rawSocialPaypal.replace(/^@/, '').replace(/^paypal\.me\//i, '')}`) : '')
  ) || '';

  const bizumPhone = (donacionRevolut?.bizumTelefono || socialLinks?.bizum || '').trim();

  const rawHandle = revolutUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const revolutDisplay = rawHandle || (rawRevolutTag ? `revolut.me/${rawRevolutTag}` : '');

  const rawPaypalHandle = paypalUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const paypalDisplay = rawPaypalHandle || (rawPaypalUser ? `paypal.me/${rawPaypalUser}` : '');

  const hasRevolut = Boolean(revolutUrl);
  const hasPaypal = Boolean(paypalUrl);
  const hasBizum = Boolean(bizumPhone);

  const handleCopyBizum = (contextType: string) => {
    if (!bizumPhone) return;
    const cleanPhone = bizumPhone.replace(/[\s-]/g, '');
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(cleanPhone).catch(() => {});
    }
    setCopiedBizum(true);
    trackClick('bizum', `bizum:${cleanPhone}`, contextType);
    setTimeout(() => setCopiedBizum(false), 3500);
  };

  // El Dossier/EPK público, mismo patrón de URL que usa EPKManager.tsx: a diferencia de
  // Revolut/PayPal, este enlace no depende de que la banda lo configure, siempre existe.
  // Lleva &lang= con el idioma del concierto: así quien entra al EPK desde un Únete de Italia
  // lo ve en italiano por defecto, no en español. EpkLanguage y FanFormLanguage comparten
  // exactamente los mismos códigos (es/en/it/cs), así que conciertoLanguage vale tal cual.
  const epkUrl = (typeof window !== 'undefined'
    ? (window.location.origin.includes('localhost') || window.location.origin.includes('ais-dev') || window.location.origin.includes('ais-pre')
        ? 'https://bands-manager.up.railway.app/epk'
        : `${window.location.origin}/epk`)
    : 'https://bands-manager.up.railway.app/epk') + `?band=${encodeURIComponent(resolvedBandId)}&lang=${encodeURIComponent(conciertoLanguage)}`;

  const renderRevolutCard = (contextType: 'redes' | 'form' | 'success' = 'redes') => {
    if ((!revolutUrl && !paypalUrl && !hasBizum) || donacionRevolut?.habilitado === false) return null;

    const isSuccessScreen = contextType === 'success';
    const isFormScreen = contextType === 'form';

    const customTitle = donacionRevolut?.titulo?.trim();
    const isDefaultSpanishTitle =
      !customTitle ||
      customTitle === 'Colabora con una aportación económica' ||
      customTitle === 'Colabora con la banda' ||
      customTitle === 'Apoyo Económico & Donaciones';

    const label = (language === 'es' && !isDefaultSpanishTitle)
      ? customTitle
      : (isSuccessScreen
        ? t('revolutSuccessPrompt', { bandName })
        : t('economicSupportTitle', { bandName }));

    const customDesc = donacionRevolut?.descripcion?.trim();
    const isDefaultSpanishDesc =
      !customDesc ||
      customDesc.includes('Tu aportación directa nos ayuda a financiar') ||
      customDesc.includes('financiar furgoneta de gira');

    const descText = (language === 'es' && !isDefaultSpanishDesc)
      ? customDesc
      : (isSuccessScreen
        ? t('revolutSuccessPrompt', { bandName })
        : t('economicSupportSubtitle'));

    const revolutClicks = clickCounts['revolut'] || 0;
    const paypalClicks = clickCounts['paypal'] || 0;
    const bizumClicks = clickCounts['bizum'] || 0;
    const totalClicks = revolutClicks + paypalClicks + bizumClicks;

    const preferredMethodSetting = (donacionRevolut?.metodoPorDefecto as 'revolut' | 'paypal' | 'bizum') || 'revolut';
    
    // Lista de métodos disponibles
    const availableMethods: Array<'revolut' | 'paypal' | 'bizum'> = [];
    if (hasRevolut) availableMethods.push('revolut');
    if (hasPaypal) availableMethods.push('paypal');
    if (hasBizum) availableMethods.push('bizum');

    const primaryMethod = availableMethods.includes(preferredMethodSetting)
      ? preferredMethodSetting
      : availableMethods[0];

    const secondaryMethods = availableMethods.filter(m => m !== primaryMethod);

    const renderPaymentButton = (method: 'revolut' | 'paypal' | 'bizum', variant: 'full' | 'half') => {
      const isFull = variant === 'full';
      if (method === 'revolut') {
        return (
          <a
            key={`revolut-${variant}`}
            href={revolutUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick('revolut', revolutUrl, contextType)}
            className={`group relative w-full flex items-center justify-center ${isFull ? 'gap-3.5 p-4 min-h-[64px]' : 'gap-2 px-2.5 py-2 min-h-[42px] sm:min-h-[44px]'} rounded-xl bg-neutral-950 hover:bg-neutral-900 border border-neutral-700/90 hover:border-amber-500/60 transition-all duration-200 ease-out shadow-md hover:shadow-xl text-center active:scale-[0.98] cursor-pointer overflow-hidden ${isFull ? 'animate-donate-cta-glow' : ''}`}
          >
            <span
              className="pointer-events-none absolute -top-1/2 -left-8 h-[200%] w-12 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-donate-sheen"
              aria-hidden="true"
            />
            <div className={`${isFull ? 'w-8 h-8 sm:w-9 sm:h-9 p-1.5' : 'w-6 h-6 p-1'} rounded-lg bg-white text-black flex items-center justify-center shrink-0 shadow group-hover:scale-105 transition-transform`}>
              <svg className="w-full h-full fill-black" viewBox="0 0 24 24">
                <path d="M18.72 9.24c-.06-.5-.2-.98-.44-1.42a4.43 4.43 0 0 0-1.12-1.3A4.78 4.78 0 0 0 15.5 5.6c-.63-.23-1.3-.35-1.98-.35H6.28v2.75h7.24c.72 0 1.39.28 1.9.79.5.5.79 1.18.79 1.9 0 .73-.29 1.4-.79 1.91-.51.5-1.18.78-1.9.78h-3.3v2.8h2.64l4.28 7.82h3.28l-4.14-7.57a4.93 4.93 0 0 0 2.94-4.23zM6.28 10.3v13.7h2.75V10.3H6.28z"/>
              </svg>
            </div>
            <div className="text-center min-w-0">
              <span className={`${isFull ? 'text-sm sm:text-base' : 'text-xs'} font-extrabold text-white group-hover:text-amber-300 transition-colors block truncate leading-tight`}>
                Revolut
              </span>
              <span className={`${isFull ? 'text-xs' : 'text-[10px]'} text-neutral-400 font-mono block truncate group-hover:text-neutral-200 leading-tight`}>
                {revolutDisplay.replace(/^revolut\.me\//, '@')}
              </span>
            </div>
          </a>
        );
      }

      if (method === 'paypal') {
        return (
          <a
            key={`paypal-${variant}`}
            href={paypalUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackClick('paypal', paypalUrl, contextType)}
            className={`group relative w-full flex items-center justify-center ${isFull ? 'gap-3.5 p-4 min-h-[64px]' : 'gap-2 px-2.5 py-2 min-h-[42px] sm:min-h-[44px]'} rounded-xl bg-[#003087] hover:bg-[#00266e] border border-sky-400/60 hover:border-sky-300 transition-all duration-200 ease-out shadow-md hover:shadow-xl text-center active:scale-[0.98] cursor-pointer overflow-hidden ${isFull ? 'animate-donate-cta-glow-delayed' : ''}`}
          >
            <span
              className="pointer-events-none absolute -top-1/2 -left-8 h-[200%] w-12 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-donate-sheen-delayed"
              aria-hidden="true"
            />
            <div className={`${isFull ? 'w-8 h-8 sm:w-9 sm:h-9 p-1.5' : 'w-6 h-6 p-1'} rounded-lg bg-white text-[#003087] flex items-center justify-center shrink-0 shadow group-hover:scale-105 transition-transform`}>
              <PayPalLogo className="w-full h-full" />
            </div>
            <div className="text-center min-w-0">
              <span className={`${isFull ? 'text-sm sm:text-base' : 'text-xs'} font-extrabold text-white group-hover:text-amber-300 transition-colors block truncate leading-tight`}>
                PayPal
              </span>
              <span className={`${isFull ? 'text-xs' : 'text-[10px]'} text-sky-200 font-mono block truncate group-hover:text-white leading-tight`}>
                {paypalDisplay.replace(/^paypal\.me\//, '@')}
              </span>
            </div>
          </a>
        );
      }

      if (method === 'bizum') {
        return (
          <button
            key={`bizum-${variant}`}
            type="button"
            onClick={() => handleCopyBizum(contextType)}
            className={`group relative w-full flex items-center justify-center ${isFull ? 'gap-3.5 p-4 min-h-[64px]' : 'gap-2 px-2.5 py-2 min-h-[42px] sm:min-h-[44px]'} rounded-xl bg-emerald-950/90 hover:bg-emerald-900/90 border border-emerald-500/60 hover:border-emerald-400 transition-all duration-200 ease-out shadow-md hover:shadow-xl text-center active:scale-[0.98] cursor-pointer overflow-hidden ${isFull ? 'animate-donate-cta-glow' : ''}`}
          >
            <span
              className="pointer-events-none absolute -top-1/2 -left-8 h-[200%] w-12 bg-gradient-to-r from-transparent via-emerald-300/15 to-transparent animate-donate-sheen"
              aria-hidden="true"
            />
            <div className={`${isFull ? 'w-8 h-8 sm:w-9 sm:h-9 p-1.5' : 'w-6 h-6 p-1'} rounded-lg bg-emerald-500 text-neutral-950 flex items-center justify-center shrink-0 shadow font-bold group-hover:scale-105 transition-transform`}>
              <BizumLogo className="w-full h-full" />
            </div>
            <div className="text-center min-w-0">
              <span className={`${isFull ? 'text-sm sm:text-base' : 'text-xs'} font-extrabold text-emerald-200 group-hover:text-white transition-colors block truncate leading-tight`}>
                Bizum
              </span>
              <span className={`${isFull ? 'text-xs' : 'text-[10px]'} text-emerald-400 font-mono block truncate group-hover:text-emerald-300 leading-tight`}>
                {bizumPhone}
              </span>
            </div>
            {isFull && (
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                <Copy className="w-3.5 h-3.5" />
              </span>
            )}
          </button>
        );
      }

      return null;
    };

    return (
      <div className={isSuccessScreen ? 'pt-3 border-t border-neutral-800 text-left' : isFormScreen ? 'pt-2' : 'pt-1.5'}>
        <div className="relative rounded-2xl bg-gradient-to-b from-neutral-900/95 via-neutral-900/90 to-neutral-950/95 border border-neutral-700 hover:border-amber-500/60 p-3.5 sm:p-4 shadow-2xl transition-all duration-300 text-left overflow-hidden">
          {/* Halo ambiental sutil */}
          <div className="pointer-events-none absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/10 blur-2xl" aria-hidden="true" />

          {/* Cabecera de la tarjeta: Screenshot / Imagen + Título + Badge */}
          <div className="relative flex items-start gap-3 sm:gap-3.5">
            <div className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden border border-amber-500/30 bg-neutral-950 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform">
              <img
                src="/Screenshot_20260824_164054_Google.jpg"
                alt={t('revolutBadge') || 'Colaboración'}
                className="w-full h-full object-cover scale-110 group-hover:scale-115 transition-transform duration-300"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white tracking-tight leading-snug">
                  {label}
                </h3>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold shrink-0">
                  {t('revolutBadge') || 'Contribución'}
                </span>
              </div>
              <p className="text-[11px] text-neutral-300/90 leading-relaxed mt-1">
                {descText}
              </p>
            </div>
          </div>

          {/* Notificación de Bizum Copiado */}
          {copiedBizum && (
            <div className="mt-2.5 p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono flex items-center gap-2 animate-fade-in shadow-lg">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-bold">
                {t('bizumCopiedNotification', { phone: bizumPhone }) || `¡Teléfono de Bizum (${bizumPhone}) copiado! Abre tu banco para enviarlo.`}
              </span>
            </div>
          )}

          {/* Botones de Pasarelas / Métodos de Pago */}
          <div className="pt-3">
            {availableMethods.length === 1 && (
              renderPaymentButton(availableMethods[0], 'full')
            )}

            {availableMethods.length === 2 && (
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {availableMethods.map(m => renderPaymentButton(m, 'half'))}
              </div>
            )}

            {availableMethods.length === 3 && (
              <div className="space-y-2.5">
                {primaryMethod && renderPaymentButton(primaryMethod, 'full')}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {secondaryMethods.map(m => renderPaymentButton(m, 'half'))}
                </div>
              </div>
            )}
          </div>

          {/* Pie de seguridad y métricas */}
          <div className="pt-2.5 flex items-center justify-between text-[10px] text-neutral-500">
            <span className="flex items-center gap-1">
              <LockIcon className="w-3 h-3 text-neutral-500 shrink-0" />
              <span>{t('revolutSecureDirect') || 'Pago seguro y directo a la banda · Sin intermediarios'}</span>
            </span>
            {totalClicks > 0 && (
              <span className="text-[9px] font-mono text-neutral-500 bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800">
                {totalClicks} {totalClicks === 1 ? t('clickSingular') : t('clickPlural')}
              </span>
            )}
          </div>
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

    // En modo simulación / preview dentro de la app, simulamos el registro con éxito sin ensuciar la base de datos real
    if (isPreview) {
      setTimeout(() => {
        setLoading(false);
        const inc = previewConfig?.incentivoFans || {
          mensajeAgradecimiento: '¡Gracias por unirte a nuestra comunidad oficial!',
          enlaceDescarga: 'https://bands-manager.up.railway.app/descargas/tema-inedito-directo.mp3',
          codigoDescuento: 'BAKANDEYA-FAN-10'
        };
        setSuccessData({
          success: true,
          message: inc.mensajeAgradecimiento || '¡Bienvenido a la comunidad!',
          incentivo: inc,
          isSimulated: true
        });
      }, 400);
      return;
    }
    
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
      <div className={`${isPreview ? 'min-h-full p-2 sm:p-4' : 'min-h-screen p-4 pt-8 sm:items-center sm:pt-4'} bg-[#121111] flex items-start justify-center`}>
        <div className={`max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl ${isPreview ? 'p-4 sm:p-6' : 'p-6 sm:p-8'} text-center space-y-5 shadow-2xl relative overflow-hidden`}>
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          
          {isPreview && (
            <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-[11px] font-mono flex items-center justify-between gap-2">
              <span className="flex items-center gap-1 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {t('interactiveSimulation')}
              </span>
              <button
                type="button"
                onClick={() => {
                  setSuccessData(null);
                  setFormData({
                    nombre: '',
                    email: '',
                    ciudad: '',
                    comoConocio: isConcertLink ? 'Concierto' : '',
                    cancionFavorita: '',
                    mensaje: '',
                    instagram: '',
                    consentimiento: false,
                  });
                }}
                className="text-amber-400 hover:text-white underline font-bold"
              >
                {t('backToForm')}
              </button>
            </div>
          )}

          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/20 shadow-inner">
            <Heart className="w-10 h-10 text-amber-500" />
          </div>

          <FanFormLanguageSwitcher language={language} onChange={setLanguage} languages={availableLanguages} />

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white font-display uppercase tracking-widest flex items-center justify-center gap-2">
              <PartyPopper className="w-6 h-6 text-amber-400" />
              {t('welcomeTitle', { bandName })}
            </h2>
            <p className="text-neutral-300 font-mono text-sm leading-relaxed max-w-xs mx-auto">
              {successData.alreadyRegistered
                ? successData.message
                : ((incentivo.mensajeAgradecimiento && language === 'es') || !t('registeredDefaultMessage', { bandName })
                    ? (incentivo.mensajeAgradecimiento || t('registeredDefaultMessage', { bandName }))
                    : t('registeredDefaultMessage', { bandName }))}
            </p>
          </div>

          {(incentivo.enlaceDescarga || incentivo.codigoDescuento) && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 mt-6 space-y-4">
              <h3 className="text-amber-500 font-black uppercase tracking-widest text-xs font-mono">{t('benefitsTitle')}</h3>

              {safeUrl(incentivo.enlaceDescarga) && (
                <div className="pt-2">
                  <a
                    href={safeUrl(incentivo.enlaceDescarga)}
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

          {/* COMPARTIR CON UN AMIGO */}
          <div className="bg-neutral-950 border border-amber-500/30 rounded-xl p-4 text-left space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                <Share2 className="w-3.5 h-3.5" /> {t('shareWithFriend') || 'Pásaselo a un colega'}
              </span>
            </div>
            <p className="text-[11px] text-neutral-300 font-mono leading-relaxed">
              {t('shareCardPrompt') || '¿Conoces a alguien a quien le mole la buena música? Comparte este enlace directo para que también disfrute de los temas exclusivos.'}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleShareWithFriend}
                className="py-2.5 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95"
              >
                {copiedShareLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-slate-950" /> {t('shareCopied') || '¡Copiado!'}
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-950" /> {t('shareWithFriend') || 'Compartir'}
                  </>
                )}
              </button>
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(t('whatsappShareMessage', { bandName, url: typeof window !== 'undefined' ? window.location.href : '' }) || `¡Ey! Échale un ojo a ${bandName} y únete a su comunidad para conseguir temas inéditos y descuentos: ${typeof window !== 'undefined' ? window.location.href : ''}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackClick('whatsapp_share', '', 'success')}
                className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-xs flex items-center justify-center gap-1.5 shadow transition active:scale-95 text-center"
              >
                <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
              </a>
            </div>
          </div>

          {/* Official Social Links in Success View */}
          {socialLinks && Object.values(socialLinks).some(Boolean) && (
            <div className="pt-2 border-t border-neutral-800">
              <SocialPlatformsList
                links={socialLinks}
                variant="grid"
                title={t('followUsPlatforms')}
                language={language}
                onPlatformClick={(plat, url) => trackClick(plat, url, 'success')}
                clickCounts={clickCounts}
                showClickCounts={true}
              />
            </div>
          )}

          {/* Enlace discreto al EPK/Dossier, ahora que ya se han unido */}
          <div className="pt-1 text-center">
            <a
              href={epkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('epk', epkUrl, 'success')}
              className="text-xs font-mono text-amber-400/90 hover:text-amber-300 underline font-bold transition-colors inline-flex items-center gap-1"
            >
              {t('epkSuccessLink', { bandName })} <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* Revolut Support in Success View */}
          {renderRevolutCard('success')}

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
    <div className={`${isPreview ? 'min-h-full p-2 sm:p-4' : 'min-h-screen p-4 pt-8 sm:items-center sm:pt-4'} bg-[#121111] flex items-start justify-center`}>
      <div className={`max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl ${isPreview ? 'p-4 sm:p-6' : 'p-6 sm:p-8'} space-y-6 shadow-2xl relative overflow-hidden`}>
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
            <FanFormLanguageSwitcher language={language} onChange={setLanguage} languages={availableLanguages} />
          </div>
        </div>

        {/* REPRODUCTOR AUDIO PREVIEW DIRECTO (Single / Adelanto) */}
        {audioPreviewConfig?.habilitado !== false && (
          <div className="p-3 rounded-2xl bg-gradient-to-r from-neutral-900 via-neutral-950 to-neutral-900 border border-amber-500/30 shadow-lg flex items-center justify-between gap-3 text-left">
            <button
              type="button"
              onClick={toggleAudioPreview}
              aria-label={isPlayingAudioPreview ? (t('audioPreviewPause') || 'Pausar audio') : (t('audioPreviewPlay') || 'Reproducir audio')}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-neutral-950 flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95"
            >
              {isPlayingAudioPreview ? (
                <Pause className="w-5 h-5 fill-neutral-950" />
              ) : (
                <Play className="w-5 h-5 fill-neutral-950 translate-x-0.5" />
              )}
            </button>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white truncate">
                <Headphones className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">
                  {audioPreviewConfig?.tituloTema?.trim() || `${bandName} · Directo Preview`}
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 font-mono truncate">
                {isPlayingAudioPreview 
                  ? (t('audioPreviewPlaying') || 'Sonando adelanto en vivo...') 
                  : (audioPreviewConfig?.subtitulo?.trim() || t('audioPreviewPrompt') || 'Dale al play para escuchar cómo sonamos')}
              </p>
            </div>

            {/* Animación de ondas de audio */}
            <div className="flex items-center gap-1 h-5 shrink-0 px-2">
              <span className={`w-1 bg-amber-400 rounded-full transition-all duration-300 ${isPlayingAudioPreview ? 'h-5 animate-pulse' : 'h-1.5'}`} />
              <span className={`w-1 bg-amber-400 rounded-full transition-all duration-300 ${isPlayingAudioPreview ? 'h-3 animate-bounce' : 'h-2'}`} />
              <span className={`w-1 bg-amber-400 rounded-full transition-all duration-300 ${isPlayingAudioPreview ? 'h-4 animate-pulse' : 'h-1'}`} />
              <span className={`w-1 bg-amber-400 rounded-full transition-all duration-300 ${isPlayingAudioPreview ? 'h-2 animate-bounce' : 'h-2.5'}`} />
            </div>
          </div>
        )}

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
              language={language}
              onPlatformClick={(plat, url) => trackClick(plat, url, 'redes')}
              clickCounts={clickCounts}
              showClickCounts={true}
            />

            {/* Acceso a "Conócenos" / EPK / Dossier público con las caras de los miembros de la banda */}
            <a
              href={epkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => trackClick('epk', epkUrl, 'redes')}
              className="group relative flex items-center gap-3.5 p-4 rounded-2xl bg-neutral-900 border border-neutral-700 hover:border-amber-500/80 transition-all duration-300 shadow-xl hover:shadow-amber-500/10 text-left cursor-pointer overflow-hidden active:scale-[0.99]"
            >
              {logoUrl && !imgError && (
                <img
                  src={logoUrl}
                  alt=""
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 w-full h-full object-cover opacity-25 group-hover:opacity-35 scale-110 group-hover:scale-125 transition-all duration-500"
                />
              )}
              <div
                className="pointer-events-none absolute inset-0 bg-gradient-to-r from-neutral-900 via-neutral-900/85 to-neutral-900/40"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -top-8 -right-8 w-24 h-24 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-colors duration-500"
                aria-hidden="true"
              />
              <div className="relative w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/25 to-rose-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-105 transition-transform overflow-hidden">
                {logoUrl && !imgError ? (
                  <img
                    src={logoUrl}
                    alt={bandName}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <BookOpen className="w-5 h-5" />
                )}
              </div>
              <div className="relative min-w-0 flex-1">
                <span className="text-sm font-bold text-white group-hover:text-amber-300 transition block truncate tracking-tight">
                  {t('epkCardTitle') || `Conócenos · ${bandName || 'La Banda'}`}
                </span>
                <span className="text-[11px] text-neutral-300 font-mono block truncate mt-0.5">
                  {t('epkCardSubtitle') || 'Historia, miembros, fotos y dossier'}
                </span>
              </div>

              {/* Caras / Avatares de los miembros de la banda */}
              {miembros && miembros.length > 0 && (
                <div className="relative hidden sm:flex items-center -space-x-2 shrink-0 pr-1">
                  {miembros.slice(0, 3).map((m, idx) => (
                    <div
                      key={m.id || idx}
                      className="w-7 h-7 rounded-full border-2 border-neutral-900 bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-amber-300 overflow-hidden shadow-sm"
                      title={`${m.nombre}${m.rol ? ` (${m.rol})` : ''}`}
                    >
                      {m.fotoUrl ? (
                        <img src={m.fotoUrl} alt={m.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(m.nombre || 'M').slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                  ))}
                  {miembros.length > 3 && (
                    <div className="w-7 h-7 rounded-full border-2 border-neutral-900 bg-neutral-800/90 flex items-center justify-center text-[9px] font-bold text-neutral-300 shadow-sm">
                      +{miembros.length - 3}
                    </div>
                  )}
                </div>
              )}

              <ChevronRight className="relative w-5 h-5 text-neutral-400 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0" />
            </a>

            {/* Aportación Económica / Revolut debajo de links de redes */}
            {renderRevolutCard('redes')}

            {/* PRÓXIMOS CONCIERTOS / GIRA - debajo de Colaborar y encima de Booking y Contratación */}
            {upcomingConcerts && upcomingConcerts.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-neutral-900 border border-amber-500/30 space-y-2.5 shadow-xl text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5" /> {t('upcomingShowsTitle') || 'Próximos Conciertos'}
                  </span>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-bold">
                    {upcomingConcerts.length} {upcomingConcerts.length === 1 ? 'fecha' : 'fechas'}
                  </span>
                </div>
                <div className={`space-y-1.5 ${showAllConcerts ? 'max-h-64 overflow-y-auto pr-0.5' : ''}`}>
                  {(showAllConcerts ? upcomingConcerts : upcomingConcerts.slice(0, 3)).map(c => (
                    <div key={c.id} className="p-2.5 rounded-xl bg-neutral-950 border border-neutral-800 flex items-center justify-between text-xs font-mono">
                      <div className="min-w-0 pr-2">
                        <p className="font-bold text-white truncate">{c.sala}</p>
                        <p className="text-[11px] text-neutral-400 truncate flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500/80 shrink-0" /> {c.ciudad}
                        </p>
                      </div>
                      <span className="px-2 py-1 rounded-lg bg-amber-500/15 text-amber-300 text-[10px] font-bold shrink-0 font-mono">
                        {c.fecha}
                      </span>
                    </div>
                  ))}
                </div>
                {upcomingConcerts.length > 3 && (
                  <button
                    type="button"
                    onClick={() => setShowAllConcerts(v => !v)}
                    className="w-full flex items-center justify-center gap-1 text-[11px] font-mono font-bold text-amber-400/90 hover:text-amber-300 transition-colors pt-0.5"
                  >
                    {showAllConcerts ? (
                      <>Ver menos <ChevronUp className="w-3.5 h-3.5" /></>
                    ) : (
                      <>Ver todas ({upcomingConcerts.length}) <ChevronDown className="w-3.5 h-3.5" /></>
                    )}
                  </button>
                )}
              </div>
            )}

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
          <form onSubmit={handleSubmit} className="space-y-4 pt-1 animate-fade-in text-left">
            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono rounded-xl text-center">
                {error}
              </div>
            )}

            {/* INCENTIVO / LEAD MAGNET BANNER */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-amber-950/20 border border-amber-500/30 space-y-2 text-left shadow-md">
              <div className="flex items-center gap-2 text-amber-300 font-mono font-black text-xs uppercase tracking-wider">
                <Gift className="w-4 h-4 text-amber-400 shrink-0 animate-bounce" />
                <span>{t('incentivoPromoTitulo') || 'Regalo exclusivo al unirte'}</span>
              </div>
              <p className="text-[11px] text-neutral-300 font-mono leading-relaxed">
                {t('incentivoPromoTexto') || 'Descarga 1 tema inédito en acústico + Código 10% dto en Merchan + Acceso prioritario a entradas.'}
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-950/80 border border-amber-500/20 text-[10px] text-amber-300 font-mono">
                  <Headphones className="w-3 h-3 text-amber-400" /> {t('incentivoBadgeAudio') || 'Audio Exclusivo'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-950/80 border border-amber-500/20 text-[10px] text-amber-300 font-mono">
                  <Tag className="w-3 h-3 text-amber-400" /> {t('incentivoBadgeDiscount') || '10% Descuento'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-neutral-950/80 border border-amber-500/20 text-[10px] text-amber-300 font-mono">
                  <Ticket className="w-3 h-3 text-amber-400" /> {t('incentivoBadgePresale') || 'Preventa'}
                </span>
              </div>
            </div>
            
            {/* CAMPOS OBLIGATORIOS (Rápidos y sin fricción) */}
            <div>
              <label className="text-[10px] font-black text-neutral-300 uppercase font-mono tracking-widest mb-1.5 block">{t('labelName')} *</label>
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
              <label className="text-[10px] font-black text-neutral-300 uppercase font-mono tracking-widest mb-1.5 block">{t('labelEmail')} *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
                placeholder="tu@email.com"
              />
            </div>

            {/* BOTÓN PARA EXPANDIR DETALLES OPCIONALES (Sin obligar al fan) */}
            <div>
              <button
                type="button"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className="w-full py-2 px-3 rounded-xl bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 text-neutral-400 hover:text-amber-300 text-xs font-mono flex items-center justify-between transition-colors"
              >
                <span>{showOptionalFields ? '– Ocultar detalles adicionales' : '+ Añadir ciudad, canción o mensaje (opcional)'}</span>
                {showOptionalFields ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            </div>

            {/* CAMPOS OPCIONALES COLAPSABLES */}
            {showOptionalFields && (
              <div className="space-y-3.5 pt-1 pl-1 pr-1 animate-in fade-in duration-200">
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase font-mono tracking-widest mb-1.5 block">{t('labelCity')}</label>
                  <input
                    type="text"
                    value={formData.ciudad}
                    onChange={e => setFormData({...formData, ciudad: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-white font-mono text-sm outline-none transition-colors"
                    placeholder={t('placeholderCity')}
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase font-mono tracking-widest mb-1.5 block">{t('labelHowFound')}</label>
                  <select
                    value={formData.comoConocio}
                    onChange={e => setFormData({...formData, comoConocio: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-white font-mono text-sm outline-none transition-colors appearance-none"
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
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-white font-mono text-sm outline-none transition-colors"
                    placeholder={t('placeholderFavSong')}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-neutral-400 uppercase font-mono tracking-widest mb-1.5 block">{t('labelInstagram')}</label>
                  <input
                    type="text"
                    value={formData.instagram}
                    onChange={e => setFormData({...formData, instagram: e.target.value})}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-white font-mono text-sm outline-none transition-colors"
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
              </div>
            )}

            {/* Revolut Support also directly accessible inside the registration form */}
            {renderRevolutCard('form')}

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
                  language={language}
                  onPlatformClick={(plat, url) => trackClick(plat, url, 'form')}
                  clickCounts={clickCounts}
                  showClickCounts={true}
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
