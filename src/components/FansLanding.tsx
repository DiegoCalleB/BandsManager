import React, { useState, useEffect } from 'react';
import { Heart, Check, Download, Tag, Loader2, PartyPopper, Shield, X, Flame, Music, Sparkles, Mail, Phone, Copy, Briefcase, MessageCircle, ExternalLink, Calendar } from 'lucide-react';
import { SocialPlatformsList, SocialLinks } from './SocialPlatformsList';

interface FansLandingProps {
  currentBandId?: string;
  currentBandName?: string;
  currentBandLogo?: string;
}

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
  
  const [resolvedBandId, setResolvedBandId] = useState<string>('band-bakandeya');
  const [bandName, setBandName] = useState<string>('Banda');
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLinks | undefined>(undefined);
  const [contactoBooking, setContactoBooking] = useState<{
    nombre?: string;
    email?: string;
    telefono?: string;
  } | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
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
    if (queryBand) {
      const formatted = cleanId === 'bakandeya' ? 'Bakandeya' : cleanId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setBandName(formatted);
      setLogoUrl(null);
    } else if (initialBandName && (cleanId === 'bakandeya' || !initialBandName.toLowerCase().includes('bakandeya'))) {
      setBandName(initialBandName);
      if (initialBandLogo) setLogoUrl(initialBandLogo);
    } else if (storedBandName && cleanId !== 'bakandeya') {
      setBandName(storedBandName);
      if (storedBandLogo) setLogoUrl(storedBandLogo);
    } else {
      const formatted = cleanId === 'bakandeya' ? 'Bakandeya' : cleanId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
      setBandName(formatted);
      if (cleanId === 'bakandeya') {
        setLogoUrl('/logo_bakandeya_bueno_sin_fondo.png');
      } else {
        setLogoUrl(null);
      }
    }

    // Default booking fallback for Bakandeya if needed
    if (cleanId === 'bakandeya') {
      setContactoBooking({
        nombre: 'Diego de la Calle / Mánager Bakandeya',
        email: 'diego.delacalleb@gmail.com',
        telefono: '+34 612 345 678'
      });
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
          } else if (cleanId !== 'bakandeya') {
            setLogoUrl(null);
          }
          if (data.epkConfig?.enlacesRedes) {
            setSocialLinks(data.epkConfig.enlacesRedes);
          }
          if (data.epkConfig?.contactoBooking) {
            setContactoBooking(data.epkConfig.contactoBooking);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nombre || !formData.email || !formData.consentimiento) {
      setError("Por favor, rellena los campos obligatorios y acepta la política.");
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
      if (!res.ok) throw new Error(data.error || 'Error al registrarte.');
      
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
      <div className="min-h-screen bg-[#121111] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
          
          <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-amber-500/20 shadow-inner">
            <Heart className="w-10 h-10 text-amber-500" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white font-display uppercase tracking-widest flex items-center justify-center gap-2">
              <PartyPopper className="w-6 h-6 text-amber-400" /> 
              ¡Bienvenido a {bandName}!
            </h2>
            <p className="text-neutral-300 font-mono text-sm leading-relaxed max-w-xs mx-auto">
              {successData.alreadyRegistered 
                ? successData.message 
                : (incentivo.mensajeAgradecimiento || `¡Registro completado! Nos alegramos de que formes parte de la familia de ${bandName}.`)}
            </p>
          </div>

          {(incentivo.enlaceDescarga || incentivo.codigoDescuento) && (
            <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 mt-6 space-y-4">
              <h3 className="text-amber-500 font-black uppercase tracking-widest text-xs font-mono">Tus Beneficios</h3>
              
              {incentivo.enlaceDescarga && (
                <div className="pt-2">
                  <a 
                    href={incentivo.enlaceDescarga}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center justify-center gap-2 w-full p-3 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg text-white font-mono text-xs transition-colors"
                  >
                    <Download className="w-5 h-5 text-amber-400" />
                    <span className="font-bold">Descargar Contenido Exclusivo</span>
                  </a>
                </div>
              )}
              
              {incentivo.codigoDescuento && (
                <div className="pt-2">
                  <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold mb-1">Código Promocional de Merch</p>
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
                title="📱 Síguenos en nuestras plataformas" 
              />
            </div>
          )}

          {/* Booking / Contrataciones in Success View */}
          {contactoBooking && (contactoBooking.email || contactoBooking.telefono) && (
            <div className="pt-4 border-t border-neutral-800 text-left">
              <div className="p-4 rounded-xl bg-neutral-950 border border-amber-500/30 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
                    <Briefcase className="w-3.5 h-3.5 text-amber-400" /> Contrataciones & Booking
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Directo
                  </span>
                </div>
                <p className="text-[11px] font-mono text-neutral-300 leading-relaxed">
                  ¿Organizas un evento, sala o festival? Contáctanos:
                </p>
                <div className="space-y-1.5 pt-1">
                  {contactoBooking.email && (
                    <div className="flex items-center justify-between p-2 rounded-lg bg-neutral-900 border border-neutral-800">
                      <a 
                        href={`mailto:${contactoBooking.email}?subject=Contratación%20y%20Booking%20-%20${encodeURIComponent(bandName)}`}
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
                        href={`https://wa.me/${contactoBooking.telefono.replace(/[^0-9]/g, '')}?text=Hola,%20me%20gustar%C3%ADa%20informaci%C3%B3n%20para%20contratar%20a%20${encodeURIComponent(bandName)}`}
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
              Volver al inicio
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121111] flex items-center justify-center p-4">
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
              Únete a {bandName}
            </h1>
            <p className="text-amber-500/80 text-[10px] font-mono uppercase tracking-widest font-bold">Canal Oficial</p>
          </div>
          <div className="pt-2 space-y-2">
            {isConcertLink ? (
              <div>
                <span className="text-emerald-400 font-bold px-3.5 py-1.5 bg-emerald-400/10 border border-emerald-400/20 rounded-full inline-flex items-center gap-1.5 text-xs">
                  <span>¡Gracias por venir al concierto{concertName ? ` de ${concertName}` : ''}!</span>
                  <span>🎸</span>
                </span>
              </div>
            ) : (
              <div>
                <span className="text-amber-400 font-bold px-3.5 py-1.5 bg-amber-400/10 border border-amber-400/20 rounded-full inline-flex items-center gap-1.5 text-xs">
                  <span>¡Gracias por tu apoyo!</span>
                  <span>🎶</span>
                </span>
              </div>
            )} 
            <p className="text-neutral-400 text-xs font-mono leading-relaxed max-w-sm mx-auto">
              Apóyanos como prefieras: <strong className="text-white">síguenos directamente en tus redes favoritas</strong> o <strong className="text-white">recibe información en tu correo</strong>.
            </p>
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
            <span>📱 Síguenos en Redes</span>
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
            <span>✉️ Recibir Novedades</span>
          </button>
        </div>

        {/* Tab 1: Redes Sociales */}
        {activeTab === 'redes' && (
          <div className="space-y-4 animate-fade-in pt-1">
            <div className="p-3.5 bg-neutral-950/80 rounded-xl border border-neutral-800 text-center space-y-1">
              <p className="text-xs font-bold text-amber-400">⚡ ¡Ayúdanos a crecer!</p>
              <p className="text-[11px] text-neutral-400 font-mono leading-relaxed">
                Elige tu plataforma preferida y <strong className="text-white">síguenos</strong>. ¡Es la mejor forma de apoyar la música independiente!
              </p>
            </div>

            <SocialPlatformsList 
              links={socialLinks || {}} 
              variant="grid" 
              showTitle={false} 
            />

            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={() => setActiveTab('form')}
                className="text-xs font-mono text-amber-400/90 hover:text-amber-300 underline font-bold transition-colors"
              >
                ✨ ¿Quieres info directa en tu correo? Apúntate aquí →
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
              <label className="text-[10px] font-black text-neutral-300 uppercase font-mono tracking-widest mb-1.5 block">Nombre *</label>
              <input 
                type="text" 
                required
                value={formData.nombre}
                onChange={e => setFormData({...formData, nombre: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
                placeholder="Tu nombre completo"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-neutral-300 uppercase font-mono tracking-widest mb-1.5 block">Email *</label>
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
              <label className="text-[10px] font-black text-neutral-400 uppercase font-mono tracking-widest mb-1.5 block">Ciudad (Opcional)</label>
              <input 
                type="text" 
                value={formData.ciudad}
                onChange={e => setFormData({...formData, ciudad: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
                placeholder="¿De dónde nos escuchas?"
              />
            </div>
            <div>
              <label className="text-[10px] font-black text-neutral-300 uppercase font-mono tracking-widest mb-1.5 block">¿Cómo nos conociste? *</label>
              <select 
                required
                value={formData.comoConocio}
                onChange={e => setFormData({...formData, comoConocio: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors appearance-none"
              >
                <option value="">Selecciona una opción...</option>
                <option value="Concierto">En un concierto</option>
                <option value="Redes Sociales">Por Instagram / TikTok / Redes</option>
                <option value="Amigo">Por recomendación de un amigo</option>
                <option value="Spotify">Descubrimiento en Spotify / Streaming</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            
            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase font-mono tracking-widest mb-1.5 block">¿Tu canción favorita de {bandName}? (Opcional)</label>
              <input 
                type="text" 
                value={formData.cancionFavorita}
                onChange={e => setFormData({...formData, cancionFavorita: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
                placeholder="Ej: La Noche Entera, Balada..."
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase font-mono tracking-widest mb-1.5 block">Usuario de Instagram (Opcional)</label>
              <input 
                type="text" 
                value={formData.instagram}
                onChange={e => setFormData({...formData, instagram: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3.5 text-white font-mono text-sm outline-none transition-colors"
                placeholder="@tu_usuario"
              />
            </div>

            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase font-mono tracking-widest mb-1.5 block">Mensaje o saludo para la banda (Opcional)</label>
              <textarea 
                rows={2}
                value={formData.mensaje}
                onChange={e => setFormData({...formData, mensaje: e.target.value})}
                className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500 rounded-xl p-3 text-white font-mono text-sm outline-none transition-colors resize-none"
                placeholder="Déjale un saludo o dedicatoria a la banda..."
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
                  He leído y acepto la <button type="button" onClick={() => setShowPrivacyModal(true)} className="text-amber-400 underline hover:text-amber-300 font-bold inline">política de privacidad</button>, y doy mi <strong className="text-neutral-200">consentimiento explícito</strong> para que la banda guarde mis datos y me envíe novedades.
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
                  Registrando...
                </>
              ) : (
                `Únete a ${bandName}`
              )}
            </button>

            {/* Social Links shown below form as well */}
            {socialLinks && Object.values(socialLinks).some(Boolean) && (
              <div className="pt-4 border-t border-neutral-800 space-y-2">
                <p className="text-[11px] font-bold text-neutral-400 font-mono text-center uppercase tracking-wider">
                  O síguenos en redes
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
                    Contrataciones & Booking
                  </span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold">
                  Directo
                </span>
              </div>

              <p className="text-[11px] font-mono text-neutral-300 leading-relaxed">
                ¿Quieres contratar a <strong className="text-white">{bandName}</strong> para tu sala, festival o evento privado? Contacta directamente:
              </p>

              <div className="space-y-2 pt-1">
                {contactoBooking.email && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-amber-500/40 transition-colors">
                    <a 
                      href={`mailto:${contactoBooking.email}?subject=Contratación%20y%20Booking%20-%20${encodeURIComponent(bandName)}`}
                      className="flex items-center gap-2.5 text-xs font-mono text-amber-300 hover:text-amber-200 transition-colors truncate flex-1 font-bold"
                      title="Enviar correo de contratación"
                    >
                      <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                      <span className="truncate">{contactoBooking.email}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(contactoBooking.email || '');
                        setCopiedEmail(true);
                        setTimeout(() => setCopiedEmail(false), 2000);
                      }}
                      className="px-2 py-1 ml-2 text-[10px] font-mono text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                      title="Copiar email de contratación"
                    >
                      {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedEmail ? 'Copiado' : 'Copiar'}</span>
                    </button>
                  </div>
                )}

                {contactoBooking.telefono && (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-emerald-500/40 transition-colors">
                    <a 
                      href={`tel:${contactoBooking.telefono.replace(/\s+/g, '')}`}
                      className="flex items-center gap-2.5 text-xs font-mono text-emerald-300 hover:text-emerald-200 transition-colors truncate flex-1 font-bold"
                      title="Llamar para contratación"
                    >
                      <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="truncate">{contactoBooking.telefono}</span>
                    </a>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <a
                        href={`https://wa.me/${contactoBooking.telefono.replace(/[^0-9]/g, '')}?text=Hola,%20me%20gustar%C3%ADa%20informaci%C3%B3n%20para%20contratar%20a%20${encodeURIComponent(bandName)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-[10px] font-mono text-emerald-400 bg-emerald-950/60 hover:bg-emerald-950 rounded border border-emerald-500/30 transition-colors flex items-center gap-1 font-bold"
                        title="Escribir por WhatsApp para contratación"
                      >
                        <MessageCircle className="w-3 h-3 text-emerald-400" />
                        <span>WhatsApp</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(contactoBooking.telefono || '');
                          setCopiedPhone(true);
                          setTimeout(() => setCopiedPhone(false), 2000);
                        }}
                        className="px-2 py-1 text-[10px] font-mono text-neutral-400 hover:text-white bg-neutral-900 hover:bg-neutral-800 rounded border border-neutral-700 transition-colors flex items-center gap-1 cursor-pointer"
                        title="Copiar teléfono"
                      >
                        {copiedPhone ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPhone ? 'Copiado' : 'Copiar'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {contactoBooking.nombre && (
                  <p className="text-[10px] font-mono text-neutral-400 pt-0.5 text-right">
                    Contacto: <span className="text-neutral-200 font-bold">{contactoBooking.nombre}</span>
                  </p>
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
                <Shield className="w-5 h-5" /> Política de Privacidad y RGPD
              </div>
              <button onClick={() => setShowPrivacyModal(false)} className="text-neutral-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-xs text-neutral-300 font-mono space-y-3 leading-relaxed">
              <p><strong className="text-white">1. Responsable del tratamiento:</strong> {bandName} (Banda musical). Los datos facilitados a través de este código QR y formulario serán tratados con la única finalidad de gestionar tu registro con {bandName} e informarte sobre próximos conciertos, lanzamientos y novedades musicales.</p>
              
              <p><strong className="text-white">2. Legitimación:</strong> El tratamiento de tus datos se basa en tu <span className="text-amber-400">consentimiento explícito</span> al marcar la casilla de aceptación y enviar el formulario.</p>
              
              <p><strong className="text-white">3. Destinatarios:</strong> Los datos se almacenan de forma segura para uso exclusivo de {bandName} en la gestión de su base de fans. No se cederán a terceros salvo obligación legal.</p>
              
              <p><strong className="text-white">4. Derechos:</strong> Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión y portabilidad escribiendo a nuestro correo de contacto o indicándolo en cualquiera de nuestros correos informativos.</p>
            </div>

            <div className="pt-4 border-t border-neutral-800 text-right">
              <button 
                onClick={() => setShowPrivacyModal(false)}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default FansLanding;
