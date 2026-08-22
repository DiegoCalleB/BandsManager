import React, { useState } from 'react';
import { 
  FileText, Sparkles, Copy, Check, QrCode, ExternalLink, Printer,
  Upload, Save, Globe, Mail, Phone, Music, Image as ImageIcon, CheckCircle2,
  FileDown, Trash2, Loader2, Bot, Info, Download, AtSign, Share2, AlertCircle
} from 'lucide-react';
import QRCode from 'react-qr-code';
import { EPKConfig, Song, User, BandMember, EPKVideo, DatosContratacion } from '../types';
import { uploadFileToServer } from '../utils/audioStorage';
import { api } from '../services/api';
import { googleSignIn, auth } from '../utils/gmail';

interface EPKManagerProps {
  epkConfig?: EPKConfig;
  songs?: Song[];
  onSave?: (newConfig: EPKConfig) => void;
  colors?: any;
  currentTheme?: any;
  currentUser?: User;
}

const DEFAULT_EPK_CONFIG: EPKConfig = {
  biografia: 'Bakandeya es una propuesta vibrante de mestizaje, ska-rock, reggae y ritmos latinos con sección de metales potente y letras combativas pero festivas. Con más de 40 conciertos a sus espaldas en salas y festivales de la península, Bakandeya ofrece un directo arrollador de 90 minutos concebido para hacer bailar e involucrar a todo el público de principio a fin.',
  logoUrl: '/logo_bakandeya.jpg',
  dossierPdfUrl: '',
  dossierPdfName: '',
  dossierTextoExtra: '',
  bandPhotos: ['/logo_bakandeya.jpg'],
  temasDestacadosIds: ['s-1', 's-2', 's-3'],
  contactoBooking: {
    nombre: 'Booking & Management Bakandeya',
    email: 'diego.delacalleb@gmail.com',
    telefono: '+34 612 345 678'
  },
  riderTecnico: '- 1 PA estéreo adecuada para el aforo de la sala/escenario (mín. 2000W)\n- Manguera de 16 canales con 4 envíos de monitores o sistema IEM inalámbrico\n- 3 Micrófonos dinámicos vocal (Shure SM58)\n- Miking completo para sección de metales (2 x SM57 / clip condenser)\n- 2 Cajas de inyección DI para teclados/secuencias\n- Microfonía para batería estándar (Kick, Snare, 2 Toms, Overheads)',
  enlacesRedes: {
    spotify: 'https://open.spotify.com/artist/bakandeya',
    youtube: 'https://youtube.com/@bakandeya_oficial',
    instagram: 'https://instagram.com/bakandeya_oficial',
    tiktok: 'https://tiktok.com/@bakandeya_oficial',
    appleMusic: 'https://music.apple.com/artist/bakandeya',
    bandcamp: 'https://bakandeya.bandcamp.com',
    website: 'https://bands-manager.up.railway.app',
    whatsapp: '+34612345678',
    facebook: 'https://facebook.com/bakandeyaoficial',
    twitter: 'https://x.com/bakandeya_band'
  },
  firmaEmail: {
    nombreRemitente: 'Diego de la Calle',
    cargo: 'Booking & Management | Bakandeya',
    telefono: '+34 612 345 678',
    email: 'diego.delacalleb@gmail.com',
    textoPie: 'Bakandeya — Música en directo, mestizaje y ska-rock',
    incluirIconosRedes: true,
    adjuntarDossierPorDefecto: true,
    redesSociales: {
      spotify: 'https://open.spotify.com/artist/bakandeya',
      youtube: 'https://youtube.com/@bakandeya_oficial',
      instagram: 'https://instagram.com/bakandeya_oficial',
      tiktok: 'https://tiktok.com/@bakandeya_oficial',
      appleMusic: 'https://music.apple.com/artist/bakandeya',
      bandcamp: 'https://bakandeya.bandcamp.com',
      website: 'https://bands-manager.up.railway.app',
      whatsapp: '+34612345678'
    }
  }
};

// Base vacía para cualquier banda que NO sea Bakandeya: los datos de
// Bakandeya de arriba son solo su semilla de ejemplo, nunca deben usarse
// como fallback para rellenar el dossier de una banda nueva o distinta.
const EMPTY_EPK_CONFIG: EPKConfig = {
  biografia: '',
  logoUrl: '',
  dossierPdfUrl: '',
  dossierPdfName: '',
  dossierTextoExtra: '',
  bandPhotos: [],
  temasDestacadosIds: [],
  contactoBooking: {
    nombre: '',
    email: '',
    telefono: ''
  },
  riderTecnico: '',
  enlacesRedes: {
    spotify: '',
    youtube: '',
    instagram: '',
    tiktok: '',
    appleMusic: '',
    bandcamp: '',
    website: '',
    whatsapp: '',
    facebook: '',
    twitter: ''
  },
  firmaEmail: {
    nombreRemitente: '',
    cargo: '',
    telefono: '',
    email: '',
    textoPie: '',
    incluirIconosRedes: true,
    adjuntarDossierPorDefecto: true,
    redesSociales: {
      spotify: '',
      youtube: '',
      instagram: '',
      tiktok: '',
      appleMusic: '',
      bandcamp: '',
      website: '',
      whatsapp: ''
    }
  }
};

const UNIFIED_PLATFORMS = [
  { key: 'spotify', label: 'Spotify', icon: '🟢', placeholder: 'https://open.spotify.com/artist/...' },
  { key: 'instagram', label: 'Instagram', icon: '📸', placeholder: 'https://instagram.com/...' },
  { key: 'youtube', label: 'YouTube', icon: '🔴', placeholder: 'https://youtube.com/...' },
  { key: 'tiktok', label: 'TikTok', icon: '🎵', placeholder: 'https://tiktok.com/@...' },
  { key: 'appleMusic', label: 'Apple Music', icon: '🍎', placeholder: 'https://music.apple.com/...' },
  { key: 'bandcamp', label: 'Bandcamp', icon: '⛺', placeholder: 'https://tubanda.bandcamp.com' },
  { key: 'website', label: 'Sitio Web Oficial', icon: '🌐', placeholder: 'https://www.tubanda.com' },
  { key: 'whatsapp', label: 'WhatsApp', icon: '💬', placeholder: '+34600000000' },
  { key: 'facebook', label: 'Facebook', icon: '📘', placeholder: 'https://facebook.com/...' },
  { key: 'twitter', label: 'X / Twitter', icon: '🐦', placeholder: 'https://x.com/...' }
];

export const EPKManager: React.FC<EPKManagerProps> = ({
  epkConfig,
  songs: songsProp,
  onSave,
  currentUser
}) => {
  // App.tsx monta este componente sin pasarle 'songs', así que el selector de temas
  // destacados se quedaba siempre vacío y no se podía marcar ninguna canción. Si no llegan
  // por prop, se piden al backend igual que hace RepertorioSetlists.
  const [songsCargadas, setSongsCargadas] = useState<Song[]>([]);
  const [errorSongs, setErrorSongs] = useState<string | null>(null);
  const songs: Song[] = songsProp && songsProp.length > 0 ? songsProp : songsCargadas;

  const activeBandId = currentUser?.band_id || 'band-bakandeya';
  const cleanBandId = activeBandId.replace(/^(band|reg)-/, '').toLowerCase();
  const isBakandeya = cleanBandId === 'bakandeya' || (currentUser?.bandName || '').toLowerCase().includes('bakandeya');
  const baseDefaults = isBakandeya ? DEFAULT_EPK_CONFIG : EMPTY_EPK_CONFIG;

  const [config, setConfig] = useState<EPKConfig>(() => {
    const initialRedes = {
      ...baseDefaults.enlacesRedes,
      ...(epkConfig?.firmaEmail?.redesSociales || {}),
      ...(epkConfig?.enlacesRedes || {})
    };
    return {
      ...baseDefaults,
      ...(epkConfig || {}),
      enlacesRedes: initialRedes,
      firmaEmail: {
        ...baseDefaults.firmaEmail,
        ...(epkConfig?.firmaEmail || {}),
        redesSociales: initialRedes
      }
    };
  });

  React.useEffect(() => {
    if (songsProp && songsProp.length > 0) return;
    let cancelado = false;
    setErrorSongs(null);
    api.getSongs()
      .then(data => {
        if (!cancelado && Array.isArray(data?.songs)) setSongsCargadas(data.songs);
      })
      .catch(err => {
        console.warn('No se pudo cargar el repertorio para el EPK:', err);
        if (!cancelado) setErrorSongs('No se pudo cargar tu repertorio. Recarga la página o inténtalo en unos minutos.');
      });
    return () => { cancelado = true; };
  }, [songsProp, activeBandId]);

  React.useEffect(() => {
    if (epkConfig) {
      const mergedRedes = {
        ...baseDefaults.enlacesRedes,
        ...(config.enlacesRedes || {}),
        ...(epkConfig.firmaEmail?.redesSociales || {}),
        ...(epkConfig.enlacesRedes || {})
      };
      const mergedContacto = {
        ...baseDefaults.contactoBooking,
        ...(epkConfig.contactoBooking || {})
      };
      const mergedFirma = {
        ...baseDefaults.firmaEmail,
        ...(epkConfig.firmaEmail || {}),
        redesSociales: mergedRedes
      };
      if (!mergedFirma.telefono && mergedContacto.telefono) {
        mergedFirma.telefono = mergedContacto.telefono;
      }
      if (!mergedFirma.email && mergedContacto.email) {
        mergedFirma.email = mergedContacto.email;
      }

      setConfig(prev => ({
        ...prev,
        ...epkConfig,
        logoUrl: epkConfig.logoUrl || prev.logoUrl || (isBakandeya ? '/logo_bakandeya.jpg' : ''),
        contactoBooking: mergedContacto,
        enlacesRedes: mergedRedes,
        firmaEmail: mergedFirma
      }));
    }
  }, [epkConfig, isBakandeya]);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'firma' | 'qr'>('editor');

  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingDossier, setIsUploadingDossier] = useState(false);
  const [isUploadingRider, setIsUploadingRider] = useState(false);
  const [subiendoFotoMiembro, setSubiendoFotoMiembro] = useState<string | null>(null);
  const [subiendoGaleria, setSubiendoGaleria] = useState(false);

  // El band_id va SIEMPRE en el enlace, también para Bakandeya: es el enlace que los agentes
  // meten en los pitches y que se comparte por QR, así que no debe depender del valor por
  // defecto del servidor para resolver de qué banda es el dossier.
  const bandQueryParam = `?band=${encodeURIComponent(activeBandId || 'band-bakandeya')}`;
  const rawEpkBase = typeof window !== 'undefined' 
    ? (window.location.origin.includes('localhost') || window.location.origin.includes('ais-dev') || window.location.origin.includes('ais-pre')
        ? 'https://bands-manager.up.railway.app/epk' 
        : `${window.location.origin}/epk`) 
    : 'https://bands-manager.up.railway.app/epk';
  const publicEpkUrl = `${rawEpkBase}${bandQueryParam}`;

  const handleSave = async () => {
    setSaveError(null);
    try {
      const payload: EPKConfig = {
        ...config,
        bandId: activeBandId,
        firmaEmail: {
          ...(config.firmaEmail || {}),
          redesSociales: { ...(config.enlacesRedes || {}) }
        }
      };

      await api.updateEpkConfig(payload);

      if (onSave) {
        onSave(payload);
      }

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
    } catch (err: any) {
      console.error("Error saving EPK config:", err);
      setSaveError(err?.message || "No se pudo guardar el dossier. Inténtalo de nuevo.");
    }
  };

  const persistEpkUpdate = async (updated: EPKConfig) => {
    const withBand = { ...updated, bandId: activeBandId };
    await api.updateEpkConfig(withBand);
    setConfig(withBand);
    if (onSave) onSave(withBand);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setSaveError(null);
    try {
      const url = await uploadFileToServer(file, { bandId: activeBandId, category: 'logo' });
      await persistEpkUpdate({ ...config, logoUrl: url });
    } catch (err: any) {
      console.error("Error uploading logo:", err);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const url = ev.target!.result as string;
          try {
            await persistEpkUpdate({ ...config, logoUrl: url });
          } catch (fallbackErr: any) {
            console.error("Error saving logo fallback:", fallbackErr);
            setSaveError(fallbackErr?.message || "No se pudo subir el logo. Inténtalo de nuevo.");
          }
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleDossierUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingDossier(true);
    setSaveError(null);
    try {
      const url = await uploadFileToServer(file, { bandId: activeBandId, category: 'dossier' });
      await persistEpkUpdate({
        ...config,
        dossierPdfUrl: url,
        dossierPdfName: file.name,
        dossierDocumentUrl: url,
        dossierDocumentName: file.name
      });
    } catch (err: any) {
      console.error("Error uploading dossier:", err);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          const url = ev.target!.result as string;
          try {
            await persistEpkUpdate({
              ...config,
              dossierPdfUrl: url,
              dossierPdfName: file.name,
              dossierDocumentUrl: url,
              dossierDocumentName: file.name
            });
          } catch (fallbackErr: any) {
            console.error("Error saving dossier fallback:", fallbackErr);
            setSaveError(fallbackErr?.message || "No se pudo subir el dossier. Inténtalo de nuevo.");
          }
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingDossier(false);
    }
  };

  const handleRiderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingRider(true);
    setSaveError(null);
    try {
      const url = await uploadFileToServer(file, { bandId: activeBandId, category: 'rider' });
      await persistEpkUpdate({
        ...config,
        riderPdfUrl: url,
        riderPdfName: file.name
      });
    } catch (err: any) {
      console.error("Error uploading rider:", err);
      const reader = new FileReader();
      reader.onload = async (ev) => {
        if (ev.target?.result) {
          try {
            await persistEpkUpdate({
              ...config,
              riderPdfUrl: ev.target!.result as string,
              riderPdfName: file.name
            });
          } catch (fallbackErr: any) {
            console.error("Error saving rider fallback:", fallbackErr);
            setSaveError(fallbackErr?.message || "No se pudo subir el rider. Inténtalo de nuevo.");
          }
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploadingRider(false);
    }
  };

  // Galería de Imagen & Prensa (config.bandPhotos) - hasta ahora este campo existía en el
  // modelo de datos y en la página pública, pero el editor nunca tuvo ningún control para
  // subir o quitar fotos, así que siempre estaba vacío y la galería pública caía en su
  // fallback (mostrar solo el logo).
  const subirFotosGaleria = async (files: FileList) => {
    setSubiendoGaleria(true);
    setSaveError(null);
    try {
      const urls = await Promise.all(
        Array.from(files).map(file => uploadFileToServer(file, { bandId: activeBandId, category: 'galeria' }))
      );
      setConfig(prev => ({ ...prev, bandPhotos: [...(prev.bandPhotos || []), ...urls] }));
    } catch (err: any) {
      console.error('Error subiendo fotos de galería:', err);
      setSaveError(err?.message || 'No se pudieron subir una o varias fotos. Inténtalo de nuevo.');
    } finally {
      setSubiendoGaleria(false);
    }
  };

  const quitarFotoGaleria = (url: string) => {
    setConfig(prev => ({ ...prev, bandPhotos: (prev.bandPhotos || []).filter(p => p !== url) }));
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(publicEpkUrl);
    setCopiedPublicUrl(true);
    setTimeout(() => setCopiedPublicUrl(false), 2000);
  };

  // --- Formación de la banda (miembros con foto) ---
  const miembros: BandMember[] = config.miembros || [];

  const actualizarMiembros = (nuevos: BandMember[]) => setConfig({ ...config, miembros: nuevos });

  const anadirMiembro = () => {
    actualizarMiembros([...miembros, { id: `m-${Date.now()}`, nombre: '', rol: '' }]);
  };

  const editarMiembro = (id: string, campos: Partial<BandMember>) => {
    actualizarMiembros(miembros.map(m => (m.id === id ? { ...m, ...campos } : m)));
  };

  const quitarMiembro = (id: string) => actualizarMiembros(miembros.filter(m => m.id !== id));

  const subirFotoMiembro = async (id: string, file: File) => {
    setSubiendoFotoMiembro(id);
    setSaveError(null);
    try {
      const url = await uploadFileToServer(file, { bandId: activeBandId, category: 'miembros' });
      editarMiembro(id, { fotoUrl: url });
    } catch (err: any) {
      console.error('Error subiendo foto de miembro:', err);
      setSaveError(err?.message || 'No se pudo subir la foto. Inténtalo de nuevo.');
    } finally {
      setSubiendoFotoMiembro(null);
    }
  };

  // --- Vídeos de directo ---
  const videos: EPKVideo[] = config.videos || [];

  const actualizarVideos = (nuevos: EPKVideo[]) => setConfig({ ...config, videos: nuevos });

  const anadirVideo = () => {
    // El primero que se añade queda destacado por defecto: es el que se ve grande arriba.
    actualizarVideos([...videos, { id: `v-${Date.now()}`, titulo: '', url: '', destacado: videos.length === 0 }]);
  };

  const editarVideo = (id: string, campos: Partial<EPKVideo>) => {
    actualizarVideos(videos.map(v => (v.id === id ? { ...v, ...campos } : v)));
  };

  const quitarVideo = (id: string) => {
    const restantes = videos.filter(v => v.id !== id);
    // Si se borra el destacado, asciende el primero que quede para no dejar el EPK sin vídeo principal.
    if (restantes.length > 0 && !restantes.some(v => v.destacado)) restantes[0].destacado = true;
    actualizarVideos(restantes);
  };

  const destacarVideo = (id: string) => {
    actualizarVideos(videos.map(v => ({ ...v, destacado: v.id === id })));
  };

  const editarDatoContratacion = (campo: keyof DatosContratacion, valor: string) => {
    const datos = { ...(config.datosContratacion || {}) } as any;
    datos[campo] = campo === 'numMusicos' ? (valor === '' ? undefined : Number(valor)) : valor;
    setConfig({ ...config, datosContratacion: datos });
  };

  const toggleHighlightedSong = (songId: string) => {
    const current = config.temasDestacadosIds || [];
    if (current.includes(songId)) {
      setConfig({ ...config, temasDestacadosIds: current.filter(id => id !== songId) });
    } else {
      setConfig({ ...config, temasDestacadosIds: [...current, songId] });
    }
  };

  return (
    <div className="space-y-6">
      {/* HEADER & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#181716] border border-stone-800 p-5 rounded-2xl shadow-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold uppercase">
            Kit de Prensa & EPK
          </div>
          <h2 className="text-xl font-bold font-mono text-white">EPK / Dossier de la Banda</h2>
          <p className="text-slate-400 text-xs">
            Sube el logo, el dossier PDF o documento oficial y la información de la banda. Toda esta información estará almacenada y lista para el Chatbot y los Agentes de envío automático de emails.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyUrl}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition"
          >
            {copiedPublicUrl ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-400" />}
            <span>{copiedPublicUrl ? '¡Link Copiado!' : 'Copiar URL Pública'}</span>
          </button>

          <a
            href={publicEpkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs sm:text-sm font-semibold rounded-xl border border-slate-700 flex items-center gap-2 transition"
          >
            <ExternalLink className="w-4 h-4" /> Ver EPK Público
          </a>

          <button
            onClick={handleSave}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 shadow-lg transition"
          >
            <Save className="w-4 h-4" /> Guardar Cambios
          </button>
        </div>
      </div>

      {/* AI & AGENTS NOTICE BAR */}
      <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl text-xs sm:text-sm text-slate-300 flex items-start gap-3">
        <Bot className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-amber-300">Conexión Automática con Agentes de IA y Chatbot</p>
          <p className="text-slate-300 leading-relaxed">
            Toda la información del dossier, el logo y el archivo PDF subidos aquí quedan guardados en el servidor. El Chatbot y los Agentes de Redacción de Emails los consultarán automáticamente para redactar los correos de presentación y pitches a salas y festivales.
          </p>
        </div>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-sm font-semibold rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>¡Información del dossier y kit de prensa guardada y sincronizada correctamente!</span>
        </div>
      )}

      {saveError && (
        <div className="p-4 bg-red-950/80 border border-red-500/50 text-red-200 text-sm font-semibold rounded-xl flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* TABS */}
      <div className="flex border-b border-slate-800 text-sm font-bold flex-wrap">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${activeTab === 'editor' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <FileText className="w-4 h-4" /> Editar Dossier e Información
        </button>
        <button
          onClick={() => setActiveTab('firma')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${activeTab === 'firma' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <AtSign className="w-4 h-4" /> Firma de Email & Redes
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer ${activeTab === 'qr' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <QrCode className="w-4 h-4" /> Código QR & Compartir
        </button>
      </div>

      {activeTab === 'editor' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LOGO DE LA BANDA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ImageIcon className="w-5 h-5" /> Logo Oficial de la Banda
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="relative shrink-0">
                {config.logoUrl ? (
                  <img
                    src={config.logoUrl}
                    alt="Logo de la banda"
                    className="w-28 h-28 rounded-2xl object-contain p-1 border-2 border-amber-500/60 shadow-lg bg-slate-950"
                  />
                ) : isBakandeya ? (
                  <img
                    src="/logo_bakandeya_bueno_sin_fondo.png"
                    alt="Bakandeya Logo"
                    className="w-28 h-28 rounded-2xl object-contain p-1 border-2 border-amber-500/60 shadow-lg bg-slate-950"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-2xl border-2 border-dashed border-slate-700 bg-slate-950 flex flex-col items-center justify-center text-slate-500 p-2 text-center">
                    <ImageIcon className="w-8 h-8 text-slate-600 mb-1" />
                    <span className="text-[10px] font-medium text-slate-400">Sin Logo</span>
                  </div>
                )}
              </div>

              <div className="space-y-3 flex-1 w-full">
                <div className="flex items-center gap-2">
                  <label className="flex-1 cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md">
                    {isUploadingLogo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    <span>{isUploadingLogo ? 'Subiendo Logo...' : 'Subir Logo (PNG/JPG)'}</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                      disabled={isUploadingLogo}
                    />
                  </label>
                  
                  {config.logoUrl && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, logoUrl: '' })}
                      className="p-2.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-xl border border-slate-700 transition"
                      title="Eliminar logo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-400">O introduce URL de la imagen:</label>
                  <input
                    type="text"
                    value={config.logoUrl || ''}
                    onChange={e => setConfig({ ...config, logoUrl: e.target.value })}
                    placeholder="https://ejemplo.com/logo.jpg"
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* GALERÍA DE IMAGEN & PRENSA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-2">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <ImageIcon className="w-5 h-5" /> Galería de Imagen &amp; Prensa
            </h3>
            <p className="text-xs text-slate-400">
              Fotos reales de directo o de sesión de prensa (no el logo, no las fotos de cada miembro de Formación). Es lo primero que ve alguien que nunca os ha visto tocar - sin fotos aquí, la galería del EPK público solo enseña el logo.
            </p>
            <label className={`cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs inline-flex items-center justify-center gap-2 transition shadow-md ${subiendoGaleria ? 'opacity-70 pointer-events-none' : ''}`}>
              {subiendoGaleria ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              <span>{subiendoGaleria ? 'Subiendo fotos...' : '+ Subir fotos (puedes elegir varias a la vez)'}</span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={subiendoGaleria}
                onChange={e => { const files = e.target.files; if (files && files.length > 0) subirFotosGaleria(files); e.target.value = ''; }}
              />
            </label>
            {(config.bandPhotos || []).length === 0 ? (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
                Todavía no hay fotos de directo o prensa.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {(config.bandPhotos || []).map((url, idx) => (
                  <div key={url + idx} className="group relative aspect-video rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img src={url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    <button
                      onClick={() => quitarFotoGaleria(url)}
                      className="absolute top-1.5 right-1.5 p-1.5 bg-slate-950/80 text-slate-300 hover:text-red-400 rounded-lg border border-slate-700 opacity-0 group-hover:opacity-100 transition"
                      title="Quitar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DOSSIER EN PDF O DOCUMENTO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <FileDown className="w-5 h-5" /> Dossier en PDF o Documento Oficial
            </h3>

            {config.dossierPdfUrl ? (
              <div className="p-4 bg-slate-950 border border-amber-500/40 rounded-xl space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="font-bold text-xs text-white truncate">{config.dossierPdfName || 'Dossier_Oficial.pdf'}</p>
                      <p className="text-[10px] text-amber-400 font-medium">Documento adjunto almacenado</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, dossierPdfUrl: '', dossierPdfName: '' })}
                    className="p-2 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition shrink-0"
                    title="Eliminar dossier"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80">
                  <a
                    href={config.dossierPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-3 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar / Abrir Dossier
                  </a>
                  
                  <label className="cursor-pointer py-1.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5 text-amber-400" /> Cambiar
                    <input 
                      type="file" 
                      accept=".pdf,.doc,.docx,.txt" 
                      onChange={handleDossierUpload} 
                      className="hidden" 
                      disabled={isUploadingDossier}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-slate-950 border border-dashed border-slate-800 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 mx-auto">
                  <FileDown className="w-6 h-6 text-amber-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Sube aquí el Dossier Oficial (PDF o Word)</p>
                  <p className="text-[11px] text-slate-400">PDF, Word o TXT. Estará listo para el envío automático en correos.</p>
                </div>

                <label className="inline-flex cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs items-center gap-2 transition shadow-md">
                  {isUploadingDossier ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span>{isUploadingDossier ? 'Subiendo Documento...' : 'Seleccionar PDF / Dossier'}</span>
                  <input 
                    type="file" 
                    accept=".pdf,.doc,.docx,.txt" 
                    onChange={handleDossierUpload} 
                    className="hidden" 
                    disabled={isUploadingDossier}
                  />
                </label>
              </div>
            )}

            <div className="space-y-1 pt-1">
              <label className="text-[11px] font-semibold text-slate-400">O enlace externo al Dossier (Google Drive, Dropbox, etc.):</label>
              <input
                type="text"
                value={config.dossierPdfUrl || ''}
                onChange={e => setConfig({ ...config, dossierPdfUrl: e.target.value, dossierPdfName: e.target.value ? (config.dossierPdfName || 'Enlace Dossier') : '' })}
                placeholder="https://drive.google.com/file/d/..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-1.5 text-xs font-mono text-slate-200 outline-none"
              />
            </div>
          </div>

          {/* TEXTO EXTRA DEL DOSSIER / INFORMACIÓN DETALLADA PARA AGENTES Y CHATBOT */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Info className="w-5 h-5" /> Información Adicional de la Banda (Para Dossier y Agentes de IA)
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  (config.dossierPdfUrl && config.dossierPdfUrl.trim().length > 5) || 
                  (config.dossierTextoExtra && config.dossierTextoExtra.trim().length >= 80 && !config.dossierTextoExtra.toLowerCase().includes('por definir'))
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}>
                  {(config.dossierPdfUrl && config.dossierPdfUrl.trim().length > 5) || 
                  (config.dossierTextoExtra && config.dossierTextoExtra.trim().length >= 80 && !config.dossierTextoExtra.toLowerCase().includes('por definir'))
                    ? '✓ Listo (Completado)'
                    : 'Mínimo 80 caracteres o PDF'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  Uso por el Chatbot & Emails
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Escribe o pega aquí cualquier detalle relevante de la banda (trayectoria, integrantes, estilo, rango de caché orientativo, requerimientos de escenario, prensa, enlaces extra, etc.). Toda esta información estará almacenada y el Chatbot y los Agentes la usarán para personalizar las propuestas comerciales enviadas a las salas.
            </p>
            <p className="text-[11px] text-amber-400/90 font-semibold bg-amber-500/5 border border-amber-500/20 rounded-lg px-3 py-2">
              ⚠ Este texto NO se muestra en la página pública del EPK - es solo para uso interno del chatbot y los agentes. Puede ser largo. El subtítulo corto que sí ven las salas se edita en "Firma de Email y Redes" → "Lema / Pie de Firma".
            </p>

            <div className="space-y-1.5">
              <textarea
                rows={5}
                value={config.dossierTextoExtra || ''}
                onChange={e => setConfig({ ...config, dossierTextoExtra: e.target.value })}
                placeholder="Ejemplo: Bakandeya cuenta con 4 integrantes (Jon Quel, José Filgueira, Elyar Pashang, Raúl Pérez). Caché orientativo para salas de 800€-1500€ según aforo y distancia. Ofrecemos un show festivo de 90 minutos con metales y percusión en directo..."
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3.5 text-xs sm:text-sm text-slate-200 outline-none leading-relaxed font-sans"
              />
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                <span>Mínimo 80 caracteres para marcar como completado (si no hay PDF adjunto)</span>
                <span className={(config.dossierTextoExtra || '').trim().length >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {(config.dossierTextoExtra || '').trim().length} / 80 min.
                </span>
              </div>
            </div>
          </div>

          {/* BIOGRAPHY */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Biografía Oficial / Resumen Ejecutivo
              </h3>
              <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                config.biografia && config.biografia.trim().length >= 80 && !config.biografia.toLowerCase().includes('por definir') && !config.biografia.includes('Propuesta musical en directo')
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
              }`}>
                {config.biografia && config.biografia.trim().length >= 80 && !config.biografia.toLowerCase().includes('por definir') && !config.biografia.includes('Propuesta musical en directo')
                  ? '✓ Bio Lista'
                  : 'Mínimo 80 caracteres'}
              </span>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Biografía de Presentación</label>
              <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3 text-[11px] text-slate-400 space-y-1.5">
                <p className="text-slate-300 font-semibold">Escribid UN texto de banda, no la trayectoria de cada uno por separado (eso va en "Formación de la Banda", más abajo, con su foto).</p>
                <p>Un programador de sala lee esto en 15 segundos antes de decidir si sigue mirando. En este orden:</p>
                <ol className="list-decimal list-inside space-y-0.5 pl-1">
                  <li>Qué sois y cómo sonáis, en una frase (vuestro género, lo que os hace distintos).</li>
                  <li>Qué pasa en vuestro directo - lo que ve y siente el público.</li>
                  <li>Por qué sois una apuesta segura - trayectoria en UNA frase (giras, festivales, con quién habéis compartido escenario), no cuatro biografías.</li>
                </ol>
                <p>Máximo 150 palabras. Nada de adjetivos que podría decir cualquier banda ("energética", "diversa") - mejor lo concreto que os distingue.</p>
              </div>
              <textarea
                rows={6}
                value={config.biografia}
                onChange={e => setConfig({ ...config, biografia: e.target.value })}
                placeholder={"Ejemplo de estructura (sustituid por lo vuestro):\n\n[Nombre de la banda] es [una frase que os define + vuestro género/sonido propio].\n\nEn directo, [qué ocurre encima del escenario: instrumentación, energía, qué se lleva el público].\n\nCon [X años/conciertos] a la espalda, hemos tocado en [salas/festivales relevantes] y compartido escenario con [referencias, si aplica]."}
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs sm:text-sm text-slate-200 outline-none leading-relaxed placeholder:text-slate-600"
              />
              <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                <span>Mínimo 80 caracteres para completar el perfil</span>
                <span className={(config.biografia || '').trim().length >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {(config.biografia || '').trim().length} / 80 min.
                </span>
              </div>
            </div>
          </div>

          {/* BOOKING CONTACT & SOCIAL LINKS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Mail className="w-5 h-5" /> Datos de Contacto de Booking
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Nombre / Cargo Mánager</label>
                <input
                  type="text"
                  value={config.contactoBooking?.nombre || ''}
                  onChange={e => setConfig({ ...config, contactoBooking: { ...config.contactoBooking, nombre: e.target.value } })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Email de Contacto</label>
                  <input
                    type="email"
                    value={config.contactoBooking?.email || ''}
                    onChange={e => setConfig({ ...config, contactoBooking: { ...config.contactoBooking, email: e.target.value } })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Teléfono Mánager</label>
                  <input
                    type="text"
                    value={config.contactoBooking?.telefono || ''}
                    onChange={e => setConfig({ ...config, contactoBooking: { ...config.contactoBooking, telefono: e.target.value } })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* GMAIL OAUTH AUTHORIZATION FOR CONTACT EMAIL */}
              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Mail className={`w-4 h-4 ${auth.currentUser ? 'text-emerald-400' : 'text-amber-400'}`} />
                    <span className="text-xs font-bold text-slate-200">
                      {auth.currentUser ? `Gmail Autorizado (${auth.currentUser.email})` : 'Autorización de Envío Gmail (OAuth)'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await googleSignIn();
                        if (res && res.user.email) {
                          if (!config.contactoBooking?.email) {
                            setConfig(prev => ({
                              ...prev,
                              contactoBooking: { ...prev.contactoBooking, email: res.user.email || '' }
                            }));
                          }
                        }
                      } catch (err) {
                        console.error('Error connecting gmail in EPK:', err);
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#f2ca50] hover:bg-[#d8b03e] text-[#2c2200] transition-all shadow-sm flex items-center gap-1.5"
                  >
                    🔑 {auth.currentUser ? 'Reautorizar Cuenta' : 'Conectar Cuenta para Enviar'}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Para que la app envíe correos oficiales o cree borradores en Gmail desde este email, Google requiere permisos <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">gmail.send</code> y <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">gmail.compose</code>. Si Firebase muestra advertencia de app no verificada, pulsa <span className="text-slate-200 font-semibold">"Avanzados" &rarr; "Ir a BandManager.ai"</span>.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <label className="text-xs font-bold text-amber-300 uppercase flex items-center gap-1.5">
                      <Share2 className="w-3.5 h-3.5" /> Enlaces de Redes & Plataformas Oficiales
                    </label>
                    <p className="text-[11px] text-slate-400">
                      Fuente única de enlaces: se sincronizan automáticamente en tu Dossier EPK, firma de email, landing de fans y agentes IA.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Fuente Centralizada
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {UNIFIED_PLATFORMS.map(item => (
                    <div key={item.key} className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-300 flex items-center gap-1">
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </label>
                      <input
                        type="text"
                        placeholder={item.placeholder}
                        value={(config.enlacesRedes as any)?.[item.key] || ''}
                        onChange={e => {
                          const updatedVal = e.target.value;
                          setConfig(prev => {
                            const newRedes = {
                              ...(prev.enlacesRedes || {}),
                              [item.key]: updatedVal
                            };
                            return {
                              ...prev,
                              enlacesRedes: newRedes,
                              firmaEmail: {
                                ...(prev.firmaEmail || {}),
                                redesSociales: newRedes
                              }
                            };
                          });
                        }}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1.5 text-slate-200 outline-none font-mono text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* RIDER TECNICO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 flex-wrap gap-2">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <FileText className="w-5 h-5" /> Rider Técnico (Texto y Fichero PDF / Documento)
              </h3>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${
                  (config.riderPdfUrl && config.riderPdfUrl.trim().length > 5) || 
                  (config.riderTecnico && config.riderTecnico.trim().length >= 80 && !config.riderTecnico.toLowerCase().includes('por definir'))
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20'
                }`}>
                  {(config.riderPdfUrl && config.riderPdfUrl.trim().length > 5) || 
                  (config.riderTecnico && config.riderTecnico.trim().length >= 80 && !config.riderTecnico.toLowerCase().includes('por definir'))
                    ? '✓ Rider Listo'
                    : 'Mínimo 80 caracteres o PDF'}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full">
                  Documentación Técnica
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* FICHERO DEL RIDER */}
              <div className="space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-2">
                  <FileDown className="w-4 h-4 text-amber-400" /> Adjunto de Rider en PDF o Documento
                </label>

                {config.riderPdfUrl ? (
                  <div className="p-3 bg-slate-900 border border-amber-500/40 rounded-lg space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="truncate">
                        <p className="font-bold text-xs text-white truncate">{config.riderPdfName || 'Rider_Tecnico.pdf'}</p>
                        <p className="text-[10px] text-amber-400 font-medium">Archivo subido</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setConfig({ ...config, riderPdfUrl: '', riderPdfName: '' })}
                        className="p-1.5 bg-slate-800 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg border border-slate-700 transition"
                        title="Eliminar fichero de rider"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
                      <a
                        href={config.riderPdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 py-1 px-2.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold text-xs rounded-lg flex items-center justify-center gap-1 transition"
                      >
                        <Download className="w-3.5 h-3.5" /> Descargar PDF Rider
                      </a>
                      <label className="cursor-pointer py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-lg border border-slate-700 flex items-center gap-1 transition">
                        <Upload className="w-3.5 h-3.5 text-amber-400" /> Cambiar
                        <input 
                          type="file" 
                          accept=".pdf,.doc,.docx,.txt" 
                          onChange={handleRiderUpload} 
                          className="hidden" 
                          disabled={isUploadingRider}
                        />
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-slate-900 border border-dashed border-slate-800 rounded-lg text-center space-y-2">
                    <p className="text-xs text-slate-300">Sube aquí el PDF o Word del Rider Técnico completo:</p>
                    <label className="inline-flex cursor-pointer bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs items-center gap-1.5 transition shadow">
                      {isUploadingRider ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                      <span>{isUploadingRider ? 'Subiendo...' : 'Subir PDF de Rider'}</span>
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx,.txt" 
                        onChange={handleRiderUpload} 
                        className="hidden" 
                        disabled={isUploadingRider}
                      />
                    </label>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-medium">O enlace externo al Rider (Drive/Dropbox):</label>
                  <input
                    type="text"
                    value={config.riderPdfUrl || ''}
                    onChange={e => setConfig({ ...config, riderPdfUrl: e.target.value, riderPdfName: e.target.value ? (config.riderPdfName || 'Enlace Rider PDF') : '' })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg px-2.5 py-1 text-xs font-mono text-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* TEXTO RESUMIDO DEL RIDER */}
              <div className="space-y-2 flex flex-col justify-between">
                <div>
                  <label className="text-xs font-bold text-slate-300">Resumen Ejecutivo del Rider (para email y salas)</label>
                  <textarea
                    rows={6}
                    value={config.riderTecnico}
                    onChange={e => setConfig({ ...config, riderTecnico: e.target.value })}
                    placeholder="Especifica necesidades de PA, monitores, canales, micros, contra-rider, etc..."
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs sm:text-sm font-mono text-slate-200 outline-none leading-relaxed mt-1"
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
                  <span>Mínimo 80 caracteres (si no hay PDF adjunto)</span>
                  <span className={(config.riderTecnico || '').trim().length >= 80 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                    {(config.riderTecnico || '').trim().length} / 80 min.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* DATOS DE CONTRATACIÓN */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-2">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Info className="w-5 h-5" /> Datos de Contratación
            </h3>
            <p className="text-xs text-slate-400">
              Lo que un programador pregunta siempre antes de contestar. Cuanto más claro, menos correos de ida y vuelta.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Nº de músicos en escena</label>
                <input
                  type="number"
                  value={config.datosContratacion?.numMusicos ?? ''}
                  onChange={e => editarDatoContratacion('numMusicos', e.target.value)}
                  placeholder="4"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Duración del directo</label>
                {/* La unidad va fija en la interfaz, no en lo que escribe el usuario - así el
                    dossier nunca puede enseñar un "75" a secas sin decir de qué es. */}
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg focus-within:border-amber-500">
                  <input
                    type="number"
                    value={config.datosContratacion?.duracionDirecto ?? ''}
                    onChange={e => editarDatoContratacion('duracionDirecto', e.target.value)}
                    placeholder="75"
                    className="w-full bg-transparent px-3 py-2 text-sm text-white outline-none"
                  />
                  <span className="pr-3 text-xs text-slate-500 font-semibold">min</span>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Ciudad base</label>
                <input
                  type="text"
                  value={config.datosContratacion?.ciudadBase ?? ''}
                  onChange={e => editarDatoContratacion('ciudadBase', e.target.value)}
                  placeholder="Madrid"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">De dónde salís de gira - ayuda a estimar el desplazamiento.</p>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Formatos disponibles</label>
                <input
                  type="text"
                  value={config.datosContratacion?.formatos ?? ''}
                  onChange={e => editarDatoContratacion('formatos', e.target.value)}
                  placeholder="Banda completa / Acústico a dúo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                />
                <p className="text-[11px] text-slate-500 mt-1">Si podéis tocar en más de un formato (completo, reducido, acústico), decidlo aquí - a veces cierra un bolo que en formato completo no encajaba.</p>
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">Necesidades de escenario (resumen corto)</label>
              <input
                type="text"
                value={config.datosContratacion?.necesidadesEscenario || ''}
                onChange={e => editarDatoContratacion('necesidadesEscenario', e.target.value)}
                placeholder="Escenario mínimo 5x4m, 4 tomas de corriente, PA con 8 canales"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">Una frase, no el rider entero (eso va en la sección de Rider Técnico) - solo lo mínimo para que la sala sepa si os puede acoger.</p>
            </div>
          </div>

          {/* VÍDEOS DE DIRECTO */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Share2 className="w-5 h-5" /> Vídeos de Directo
              </h3>
              <button onClick={anadirVideo} className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition">
                + Añadir vídeo
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Pega enlaces de YouTube o Vimeo. El vídeo marcado con la estrella se muestra grande arriba del todo: que sea el mejor que tengáis.
            </p>
            {videos.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
                Todavía no hay vídeos. Es el material que más pesa en la decisión de contratar — añade al menos uno de directo.
              </div>
            )}
            <div className="space-y-3">
              {videos.map(v => (
                <div key={v.id} className={`rounded-xl border p-3 space-y-2 ${v.destacado ? 'border-amber-500/60 bg-amber-500/5' : 'border-slate-800 bg-slate-950'}`}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => destacarVideo(v.id)}
                      title={v.destacado ? 'Vídeo principal' : 'Marcar como principal'}
                      className={`shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center text-sm transition ${v.destacado ? 'bg-amber-500 text-slate-950 border-amber-500' : 'border-slate-700 text-slate-500 hover:text-amber-300'}`}
                    >
                      ★
                    </button>
                    <input
                      type="text"
                      value={v.titulo}
                      onChange={e => editarVideo(v.id, { titulo: e.target.value })}
                      placeholder="Título (ej. Directo en Sala Caracol, 2026)"
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:border-amber-500 outline-none"
                    />
                    <button onClick={() => quitarVideo(v.id)} className="shrink-0 p-2 text-slate-500 hover:text-red-400 transition" title="Quitar vídeo">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="url"
                    value={v.url}
                    onChange={e => editarVideo(v.id, { url: e.target.value })}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-amber-500 outline-none"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* FORMACIÓN / MIEMBROS */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <ImageIcon className="w-5 h-5" /> Formación de la Banda
              </h3>
              <button onClick={anadirMiembro} className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition">
                + Añadir miembro
              </button>
            </div>
            <div className="text-xs text-slate-400 space-y-1">
              <p>Quien programa quiere ver caras y saber cuánta gente sube al escenario. Foto, nombre e instrumento de cada miembro - una foto distinta para cada uno, a ser posible del escenario o un primer plano suyo (no vale repetir la misma foto de grupo en todos).</p>
              <p>Aquí es donde va la trayectoria individual (giras, colaboraciones, otros proyectos) - la Biografía de arriba es solo del conjunto.</p>
            </div>
            {miembros.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400">
                Todavía no has añadido a nadie. Añade a los integrantes con su foto para que el dossier tenga cara.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {miembros.map(m => (
                <div key={m.id} className="rounded-xl border border-slate-800 bg-slate-950 p-3 space-y-2">
                  <div className="flex items-start gap-3">
                    <label className="shrink-0 cursor-pointer group" title="Subir foto">
                      <div className="w-16 h-16 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 flex items-center justify-center">
                        {subiendoFotoMiembro === m.id ? (
                          <Loader2 className="w-5 h-5 text-amber-400 animate-spin" />
                        ) : m.fotoUrl ? (
                          <img src={m.fotoUrl} alt={m.nombre || 'Miembro'} className="w-full h-full object-cover" />
                        ) : (
                          <Upload className="w-5 h-5 text-slate-600 group-hover:text-amber-400 transition" />
                        )}
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={e => { const f = e.target.files?.[0]; if (f) subirFotoMiembro(m.id, f); e.target.value = ''; }}
                      />
                    </label>
                    <div className="flex-1 space-y-2">
                      <input
                        type="text"
                        value={m.nombre}
                        onChange={e => editarMiembro(m.id, { nombre: e.target.value })}
                        placeholder="Nombre"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-white focus:border-amber-500 outline-none"
                      />
                      <input
                        type="text"
                        value={m.rol}
                        onChange={e => editarMiembro(m.id, { rol: e.target.value })}
                        placeholder="Voz, guitarra, percusión..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 outline-none"
                      />
                    </div>
                    <button onClick={() => quitarMiembro(m.id)} className="shrink-0 p-1.5 text-slate-500 hover:text-red-400 transition" title="Quitar miembro">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    value={m.bio || ''}
                    onChange={e => editarMiembro(m.id, { bio: e.target.value })}
                    placeholder="Trayectoria breve (opcional): giras, colaboraciones, otros proyectos..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300 focus:border-amber-500 outline-none placeholder:text-slate-600"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* FEATURED SONGS SELECTOR */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4 lg:col-span-2">
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Music className="w-5 h-5" /> Seleccionar Temas Destacados para el EPK
            </h3>
            <p className="text-xs text-slate-400">
              Marca las canciones que quieres mostrar en primera línea a los programadores de salas:
            </p>
            {/* Sin esto, un fallo de carga o un repertorio vacío se veían igual: un hueco en
                blanco, sin ninguna pista de qué estaba pasando. */}
            {songs.length === 0 && (
              <div className={`rounded-xl border p-4 text-xs ${errorSongs ? 'border-red-500/40 bg-red-500/10 text-red-300' : 'border-slate-800 bg-slate-950 text-slate-400'}`}>
                {errorSongs || 'Todavía no hay canciones en tu repertorio. Añádelas en la sección "Repertorio" y volverán a aparecer aquí para poder destacarlas.'}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {songs.map(song => {
                const isSelected = config.temasDestacadosIds?.includes(song.id);
                return (
                  <div
                    key={song.id}
                    onClick={() => toggleHighlightedSong(song.id)}
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-center justify-between ${isSelected ? 'bg-amber-500/15 border-amber-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                  >
                    <div>
                      <h5 className="font-bold text-xs text-white">{song.titulo}</h5>
                      <p className="text-[10px] text-slate-400">{song.albumDisco || 'Sencillo'} • {song.duracion}</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs ${isSelected ? 'bg-amber-500 text-slate-950 border-amber-500 font-bold' : 'border-slate-700'}`}>
                      {isSelected ? '✓' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'firma' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* CONFIGURACIÓN DE FIRMA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <AtSign className="w-5 h-5" /> Configurar Firma de Correo
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
                Personalización Avanzada
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Nombre del Remitente</label>
                <input
                  type="text"
                  value={config.firmaEmail?.nombreRemitente || ''}
                  onChange={e => setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), nombreRemitente: e.target.value }
                  })}
                  placeholder="Ej: Diego & Filgue"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Cargo / Puesto</label>
                <input
                  type="text"
                  value={config.firmaEmail?.cargo || ''}
                  onChange={e => setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), cargo: e.target.value }
                  })}
                  placeholder="Ej: Booking & Management Team"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Teléfono de Contacto</label>
                <input
                  type="text"
                  value={config.firmaEmail?.telefono || ''}
                  onChange={e => setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), telefono: e.target.value }
                  })}
                  placeholder="+34 652 93 85 21"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300">Email Oficial</label>
                <input
                  type="email"
                  value={config.firmaEmail?.email || ''}
                  onChange={e => setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), email: e.target.value }
                  })}
                  placeholder="booking@bands-manager.up.railway.app"
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300">Lema / Pie de Firma</label>
              <p className="text-[11px] text-slate-500">
                Una frase corta (tagline). Sale al pie de los emails y también como subtítulo grande en la cabecera de vuestra página pública de EPK.
              </p>
              <input
                type="text"
                value={config.firmaEmail?.textoPie || ''}
                onChange={e => setConfig({
                  ...config,
                  firmaEmail: { ...(config.firmaEmail || {}), textoPie: e.target.value }
                })}
                placeholder="Bakandeya — Electrónica-Fusión & Balkan Ska Directo"
                className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            {/* OPCIONES DE INCLUSIÓN */}
            <div className="pt-2 border-t border-slate-800 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-500/50 transition">
                <input
                  type="checkbox"
                  checked={config.firmaEmail?.incluirIconosRedes ?? true}
                  onChange={e => setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), incluirIconosRedes: e.target.checked }
                  })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <div>
                  <p className="text-xs font-bold text-white">Incluir iconos interactivos de redes sociales y plataformas musicales</p>
                  <p className="text-[11px] text-slate-400">Añade enlaces directos a Spotify, Instagram, YouTube, TikTok, WhatsApp, etc.</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-2.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-amber-500/50 transition">
                <input
                  type="checkbox"
                  checked={config.firmaEmail?.adjuntarDossierPorDefecto ?? true}
                  onChange={e => setConfig({
                    ...config,
                    firmaEmail: { ...(config.firmaEmail || {}), adjuntarDossierPorDefecto: e.target.checked }
                  })}
                  className="w-4 h-4 accent-amber-500 rounded"
                />
                <div>
                  <p className="text-xs font-bold text-white">Adjuntar Dossier EPK automáticamente en la firma</p>
                  <p className="text-[11px] text-slate-400">Incluye el botón con enlace al Dossier PDF en cada plantilla y correo redactado.</p>
                </div>
              </label>
            </div>

            {/* ENLACES A REDES SOCIALES VINCULADOS (FUENTE ÚNICA) */}
            <div className="pt-3 border-t border-slate-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <Share2 className="w-3.5 h-3.5" /> Enlaces de Redes y Plataformas Vinculados
                </h4>
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className="px-2.5 py-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3 h-3" /> Editar Enlaces en Dossier
                </button>
              </div>

              <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2.5">
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Para evitar duplicidad, los enlaces de tus plataformas (Spotify, Instagram, YouTube, etc.) se gestionan de forma centralizada en <strong className="text-slate-200">Editar Dossier e Información</strong> y se aplican automáticamente aquí en la firma.
                </p>

                {Object.entries(config.enlacesRedes || {}).filter(([_, url]) => Boolean(url && String(url).trim())).length > 0 ? (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {Object.entries(config.enlacesRedes || {}).map(([key, url]) => {
                      if (!url || !String(url).trim()) return null;
                      const platform = UNIFIED_PLATFORMS.find(p => p.key === key);
                      return (
                        <span
                          key={key}
                          className="px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-300 flex items-center gap-1"
                        >
                          <span>{platform?.icon || '🔗'}</span>
                          <span className="font-semibold text-slate-200">{platform?.label || key}</span>
                        </span>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-amber-500/5 border border-amber-500/15 flex items-center justify-between gap-2">
                    <span className="text-[11px] text-amber-300/80">No has añadido enlaces a plataformas todavía.</span>
                    <button
                      type="button"
                      onClick={() => setActiveTab('editor')}
                      className="text-[11px] font-bold text-amber-400 hover:underline"
                    >
                      Añadir ahora &rarr;
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* VISTA PREVIA EN VIVO DE LA FIRMA */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
                <Mail className="w-5 h-5" /> Vista Previa en Vivo de la Firma
              </h3>
              <span className="text-[10px] text-slate-400 font-mono">Renderizado de Email</span>
            </div>

            <div className="bg-white text-slate-900 p-6 rounded-2xl border border-slate-200 shadow-xl space-y-4 font-sans text-xs">
              <p className="text-slate-500 italic pb-2 border-b border-slate-100">
                ... [Cuerpo del correo electrónico redactado para la sala o festival] ...
              </p>

              <div className="pt-2 space-y-3">
                <div className="flex items-start gap-4">
                  {config.logoUrl ? (
                    <img
                      src={config.logoUrl}
                      alt="Logo"
                      className="w-16 h-16 rounded-xl object-contain bg-slate-950 p-1 border border-amber-500 shrink-0"
                    />
                  ) : isBakandeya ? (
                    <img
                      src="/logo_bakandeya_bueno_sin_fondo.png"
                      alt="Bakandeya Logo"
                      className="w-16 h-16 rounded-xl object-contain bg-slate-950 p-1 border border-amber-500 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-400 font-bold text-lg shrink-0">
                      <Music className="w-8 h-8 text-slate-400" />
                    </div>
                  )}

                  <div className="space-y-1 flex-1">
                    <h4 className="font-extrabold text-slate-900 text-sm">
                      {config.firmaEmail?.nombreRemitente || config.contactoBooking?.nombre || 'Diego & Filgue'}
                    </h4>
                    <p className="text-amber-600 font-bold text-[11px]">
                      {config.firmaEmail?.cargo || 'Booking & Management Team'}
                    </p>
                    <p className="text-slate-600 text-[11px] font-medium">
                      {config.firmaEmail?.textoPie || 'Bakandeya — Directo de Fusión y Escenario'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-1 font-mono">
                      {config.firmaEmail?.telefono && (
                        <span>📞 {config.firmaEmail.telefono}</span>
                      )}
                      {config.firmaEmail?.email && (
                        <span>✉️ {config.firmaEmail.email}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* BOTÓN DOSSIER SI ESTÁ HABILITADO */}
                {(config.firmaEmail?.adjuntarDossierPorDefecto ?? true) && (
                  <div className="pt-2">
                    <a
                      href={publicEpkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-[11px] shadow-sm transition"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>{config.dossierPdfName ? `📄 Ver Dossier Oficial (${config.dossierPdfName})` : '📄 Abrir Dossier & Kit de Prensa'}</span>
                    </a>
                  </div>
                )}

                {/* ICONOS DE REDES SOCIALES */}
                {(config.firmaEmail?.incluirIconosRedes ?? true) && (
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-2">
                    {Object.entries(config.enlacesRedes || {}).map(([net, url]) => {
                      if (!url || !String(url).trim()) return null;
                      const icons: Record<string, { label: string; bg: string }> = {
                        spotify: { label: '🟢 Spotify', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
                        instagram: { label: '📸 Instagram', bg: 'bg-pink-50 text-pink-700 border-pink-200' },
                        youtube: { label: '🔴 YouTube', bg: 'bg-red-50 text-red-700 border-red-200' },
                        tiktok: { label: '🎵 TikTok', bg: 'bg-slate-100 text-slate-900 border-slate-300' },
                        facebook: { label: '📘 Facebook', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
                        twitter: { label: '🐦 X / Twitter', bg: 'bg-slate-100 text-slate-800 border-slate-300' },
                        appleMusic: { label: '🍎 Apple Music', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
                        bandcamp: { label: '⛺ Bandcamp', bg: 'bg-teal-50 text-teal-700 border-teal-200' },
                        website: { label: '🌐 Web', bg: 'bg-amber-50 text-amber-800 border-amber-200' },
                        whatsapp: { label: '💬 WhatsApp', bg: 'bg-emerald-50 text-emerald-800 border-emerald-200' }
                      };
                      const iconData = icons[net] || { label: net, bg: 'bg-slate-100 text-slate-700 border-slate-200' };
                      const rawUrl = String(url || '');

                      return (
                        <a
                          key={net}
                          href={rawUrl.startsWith('http') || rawUrl.startsWith('+') ? (rawUrl.startsWith('+') ? `https://wa.me/${rawUrl.replace(/\+/g, '')}` : rawUrl) : `https://${rawUrl}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`px-2 py-0.5 rounded-md border font-semibold text-[10px] flex items-center gap-1 transition ${iconData.bg}`}
                        >
                          {iconData.label}
                        </a>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <p className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Uso Automático en el Sistema
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Esta firma se incluirá automáticamente al redactar y enviar correos a salas desde el Booking CRM, las plantillas predefinidas o las propuestas generadas por el Chatbot y los Agentes de IA.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'qr' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto text-center space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-white">Código QR Oficial del EPK</h3>
            <p className="text-xs text-slate-400">
              Muestra o descarga este QR para incluirlo en carpetas de prensa, correos o tarjetas de visita para programadores.
            </p>
          </div>

          <div className="p-6 bg-white rounded-2xl inline-block shadow-2xl border-4 border-amber-500">
            <QRCode value={publicEpkUrl} size={200} />
          </div>

          <div className="space-y-3">
            <p className="text-xs font-mono text-amber-300 bg-slate-950 py-2 px-4 rounded-xl border border-slate-800 truncate">
              {publicEpkUrl}
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleCopyUrl}
                className="px-4 py-2 bg-amber-500 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-amber-400 transition"
              >
                <Copy className="w-4 h-4" /> Copiar Enlace
              </button>
              <a
                href={publicEpkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-slate-800 text-amber-300 border border-slate-700 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-slate-700 transition"
              >
                <ExternalLink className="w-4 h-4" /> Probar EPK
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EPKManager;
