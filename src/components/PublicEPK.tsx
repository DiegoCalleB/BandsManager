import React, { useState, useEffect } from'react';
import {
 Download, Share2, ExternalLink,
 Check, Mail, Phone, MapPin, Play, Pause,
 Volume2, X, Music, Radio, Sparkles, Quote, Instagram, Globe, Ticket
} from'lucide-react';
import { EPKConfig, Song, Concert, EPKSectionId } from'../types';
import { SocialPlatformsList } from'./SocialPlatformsList';
import { EPK_LANGUAGES, EPK_TRANSLATIONS, EpkDict, idiomasDisponiblesParaEpk } from'../i18n/epkTranslations';
import { interpolate } from'../i18n/fansTranslations';
import { useEpkLanguage } from'../hooks/useEpkLanguage';
import { resolverContenidoEpk } from'../utils/epkTraducciones';
import { safeUrl } from'../utils/safeUrl';
import { getEffectiveSectionsOrder, getTemplateStyles } from'./epk/epkTemplates';
import { getFontFamilyById } from'../config/bandFonts';

interface PublicEPKProps {
 initialData?: {
 epkConfig: EPKConfig;
 highlightedSongs: Song[];
 upcomingConcerts: Concert[];
 };
}

export const PublicEPK: React.FC<PublicEPKProps> = ({ initialData }) => {
 const [epkData, setEpkData] = useState<any>(initialData || null);
 const [loading, setLoading] = useState(!initialData);
 const [copiedLink, setCopiedLink] = useState(false);
 const [playingSongId, setPlayingSongId] = useState<string | null>(null);
 const [stickyPlayerDismissed, setStickyPlayerDismissed] = useState(false);
 const galeriaScrollRef = React.useRef<HTMLDivElement>(null);
 const [language, setLanguage] = useEpkLanguage();

 const [contextoIdioma] = useState(() => language);
 const availableLanguages = EPK_LANGUAGES.filter(l =>
 idiomasDisponiblesParaEpk(contextoIdioma).includes(l.code)
 ).sort((a, b) =>
 idiomasDisponiblesParaEpk(contextoIdioma).indexOf(a.code) -
 idiomasDisponiblesParaEpk(contextoIdioma).indexOf(b.code)
 );

 useEffect(() => {
 if (!initialData) {
 const searchParams = typeof window !=='undefined' ? window.location.search :'';
 fetch(`/api/public/epk${searchParams}`)
 .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json().catch(() => null) : null)
 .then(data => {
 if (data) setEpkData(data);
 setLoading(false);
 })
 .catch(err => {
 console.error("Error fetching public EPK:", err);
 setLoading(false);
 });
 }
 }, [initialData]);

 const handleShare = async () => {
 const url = window.location.href;
 if (navigator.share) {
 try {
 await navigator.share({
 title: bandName,
 text: `Mira el dossier EPK de ${bandName}`,
 url
 });
 } catch (err) {
 if ((err as Error).name !=='AbortError') {
 console.error('Error sharing:', err);
 }
 }
 } else {
 navigator.clipboard.writeText(url);
 setCopiedLink(true);
 setTimeout(() => setCopiedLink(false), 2000);
 }
 };

 const dict = EPK_TRANSLATIONS[language];
 const bandName = epkData?.bandName || epkData?.registeredBand?.nombre_banda || dict.bandaPorDefecto;
 const isBakandeya = (epkData?.bandId ||'').includes('bakandeya') || bandName.toLowerCase().includes('bakandeya');

 // Etiquetas fijas de la interfaz. El nombre de la banda y el año siempre están disponibles
 // como variables, así que cualquier cadena del diccionario puede usar {bandName} y {year}.
 const t = (clave: keyof EpkDict, vars?: Record<string, string | undefined>) =>
 interpolate(dict[clave], { bandName, year: String(new Date().getFullYear()), ...vars });

 if (loading) {
 return (
 <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
 <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mb-4"></div>
 <p className="text-[var(--acc)] font-medium">{t('cargando')}</p>
 </div>
 );
 }

 const config: EPKConfig = epkData?.epkConfig || {
 biografia: isBakandeya ? t('bioPorDefectoBakandeya') : t('bioPorDefecto'),
 logoUrl: isBakandeya ?"/logo_bakandeya_bueno_sin_fondo.png" :"",
 bandPhotos: [],
 riderTecnico: t('riderPorDefecto'),
 enlacesRedes: {},
 contactoBooking: { nombre: bandName, email:"", telefono:"" },
 temasDestacadosIds: []
 };

 const displayLogo = config.logoUrl || (isBakandeya ?"/logo_bakandeya_bueno_sin_fondo.png" : null);

 // El endpoint público devuelve los temas tal cual salen de Supabase (snake_case), pero el
 // resto de la app usa camelCase. Sin normalizar,'albumDisco' salía undefined y caía al
 // literal"Sencillo", y el audio real que ya está subido no se reproducía nunca.
 const songs: any[] = (epkData?.highlightedSongs || []).map((s: any) => ({
 ...s,
 albumDisco: s.albumDisco ?? s.album_disco ?? s.album,
 audioPrincipalUrl: s.audioPrincipalUrl ?? s.audio_principal_url,
 portadaUrl: s.portadaUrl ?? s.portada_url
 }));
 const concerts: Concert[] = epkData?.upcomingConcerts || [];

 // Un enlace de artista/álbum de Spotify se puede incrustar cambiando la ruta por /embed/.
 // Se exigen los 22 caracteres del ID real: si no, un enlace de relleno como
 //'/artist/bakandeya' generaba un iframe que no carga y dejaba un hueco vacío en la página.
 const spotifyEmbedUrl = (() => {
 const raw = config.enlacesRedes?.spotify ||"";
 const match = raw.match(/open\.spotify\.com\/(artist|album|track|playlist)\/([A-Za-z0-9]{22})/);
 return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}` : null;
 })();

 // Solo se puede incrustar un VÍDEO concreto, no un canal: si el enlace es de canal (@handle
 // o /c/), se deja como enlace normal en vez de meter un iframe roto.
 const aEmbed = (raw: string): string | null => {
 const yt = (raw ||"").match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
 if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
 const vimeo = (raw ||"").match(/vimeo\.com\/(?:video\/)?(\d+)/);
 if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
 return null;
 };

 const youtubeEmbedUrl = aEmbed(config.enlacesRedes?.youtube ||"");

 // Vídeos elegidos a mano en el gestor del EPK. El destacado va primero y en grande.
 const videos = (config.videos || []).filter(v => v?.url && aEmbed(v.url));
 const videoPrincipal = videos.find(v => v.destacado) || videos[0] || null;
 const videosSecundarios = videos.filter(v => v !== videoPrincipal);
 const miembros = (config.miembros || []).filter(m => m?.nombre || m?.fotoUrl);
 // Foto de portada del hero: la primera de la Galería de Imagen & Prensa, si existe. Es lo
 // que hace que esto lea como la web real de una banda en directo y no como una tarjeta de
 // dashboard - sin foto real, cae al degradado de siempre.
 const fotoPortada = (config.bandPhotos || []).find(p => p && p !== displayLogo) || null;
 // Contenido escrito por la banda, resuelto al idioma elegido. Si falta la traducción de un
 // campo concreto, ese campo cae al español: una traducción a medias se lee mezclada, que es
 // mucho mejor que dejar huecos en blanco en un dossier de contratación.
 const contenido = resolverContenidoEpk(config, language);
 const datos = config.datosContratacion || {};
 const hayDatosContratacion = Boolean(
 datos.numMusicos || datos.duracionDirecto || datos.ciudadBase || datos.formatos || datos.necesidadesEscenario
 );

 const styles = getTemplateStyles(config.plantilla);
 const effectiveSections = getEffectiveSectionsOrder(config);

 // Renderizadores modulares para cada sección de la plantilla
 const renderCifras = () => {
 if (!config.cifrasClave?.habilitado) return null;
 const hasAny = config.cifrasClave.oyentes || config.cifrasClave.directos || config.cifrasClave.comunidad || config.cifrasClave.ciudades;
 if (!hasAny) return null;

 return (
 <section key="cifras" className="mb-14 print:mb-6">
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
 {config.cifrasClave.oyentes && (
 <div className={`${styles.cardHighlight} rounded-[var(--r-l)] p-4.5 text-center shadow-lg transition`}>
 <span className={`text-2xl sm:text-3xl font-black ${styles.statNumber} tracking-tight`}>{config.cifrasClave.oyentes}</span>
 <p className="text-xs opacity-75 font-medium mt-1">{t('cifraOyentes')}</p>
 </div>
 )}
 {config.cifrasClave.directos && (
 <div className={`${styles.cardHighlight} rounded-[var(--r-l)] p-4.5 text-center shadow-lg transition`}>
 <span className={`text-2xl sm:text-3xl font-black ${styles.statNumber} tracking-tight`}>{config.cifrasClave.directos}</span>
 <p className="text-xs opacity-75 font-medium mt-1">{t('cifraDirectos')}</p>
 </div>
 )}
 {config.cifrasClave.comunidad && (
 <div className={`${styles.cardHighlight} rounded-[var(--r-l)] p-4.5 text-center shadow-lg transition`}>
 <span className={`text-2xl sm:text-3xl font-black ${styles.statNumber} tracking-tight`}>{config.cifrasClave.comunidad}</span>
 <p className="text-xs opacity-75 font-medium mt-1">{t('cifraComunidad')}</p>
 </div>
 )}
 {config.cifrasClave.ciudades && (
 <div className={`${styles.cardHighlight} rounded-[var(--r-l)] p-4.5 text-center shadow-lg transition`}>
 <span className={`text-2xl sm:text-3xl font-black ${styles.statNumber} tracking-tight`}>{config.cifrasClave.ciudades}</span>
 <p className="text-xs opacity-75 font-medium mt-1">{t('cifraCiudades')}</p>
 </div>
 )}
 </div>
 </section>
 );
 };

 const renderDatos = () => {
 if (!hayDatosContratacion) return null;
 return (
 <section key="datos" className="mb-16 space-y-6 print:mb-8">
 <h2 className={`text-2xl sm:text-3xl ${styles.sectionHeadingClass}`} style={styles.sectionHeadingStyle}>
 {t('seccionDatos')}
 </h2>
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
 {[
 { label: t('etiquetaMusicos'), valor: datos.numMusicos ? String(datos.numMusicos) :'' },
 {
 label: t('etiquetaDuracion'),
 valor: contenido.dato('duracionDirecto')
 ? (/[a-zA-Z]/.test(contenido.dato('duracionDirecto')) ? contenido.dato('duracionDirecto') : `${contenido.dato('duracionDirecto')} ${t('unidadMinutos')}`)
 :''
 },
 { label: t('etiquetaCiudadBase'), valor: datos.ciudadBase ||'' },
 { label: t('etiquetaFormatos'), valor: contenido.dato('formatos') }
 ].filter(d => d.valor).map(d => (
 <div key={d.label} className={`${styles.card} rounded-[var(--r-m)] p-4`}>
 <p className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">{d.label}</p>
 <p className="font-bold mt-1 text-sm">{d.valor}</p>
 </div>
 ))}
 </div>
 {contenido.dato('necesidadesEscenario') && (
 <div className={`${styles.card} rounded-[var(--r-m)] p-4`}>
 <p className="text-[10px] uppercase tracking-wider opacity-60 font-semibold">{t('etiquetaNecesidades')}</p>
 <p className="text-sm mt-1 opacity-80">{contenido.dato('necesidadesEscenario')}</p>
 </div>
 )}
 </section>
 );
 };

 const renderVideos = () => {
 if (!videoPrincipal) return null;
 return (
 <section key="videos" className="mb-16 space-y-6 print:hidden">
 <h2 className={`text-2xl sm:text-3xl ${styles.sectionHeadingClass}`} style={styles.sectionHeadingStyle}>
 {t('seccionVideo')}
 </h2>
 <div className={`rounded-[var(--r-m)] overflow-hidden ${styles.card} aspect-video`}>
 <iframe
 src={aEmbed(videoPrincipal.url)!}
 title={contenido.tituloVideo(videoPrincipal) || t('tituloVideoPorDefecto')}
 allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
 allowFullScreen
 loading="lazy"
 className="w-full h-full"
 />
 </div>
 {contenido.tituloVideo(videoPrincipal) && (
 <p className="text-sm opacity-80 font-medium">{contenido.tituloVideo(videoPrincipal)}</p>
 )}
 {videosSecundarios.length > 0 && (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
 {videosSecundarios.map(v => (
 <div key={v.id} className="space-y-2">
 <div className={`rounded-[var(--r-m)] overflow-hidden ${styles.card} aspect-video`}>
 <iframe
 src={aEmbed(v.url)!}
 title={contenido.tituloVideo(v) || t('tituloVideoPorDefecto')}
 allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
 allowFullScreen
 loading="lazy"
 className="w-full h-full"
 />
 </div>
 {contenido.tituloVideo(v) && <p className="text-xs opacity-70">{contenido.tituloVideo(v)}</p>}
 </div>
 ))}
 </div>
 )}
 </section>
 );
 };

 const renderMiembros = () => {
 if (miembros.length === 0) return null;
 return (
 <section key="miembros" className="mb-16 space-y-6 print:mb-8">
 <h2 className={`text-2xl sm:text-3xl ${styles.sectionHeadingClass}`} style={styles.sectionHeadingStyle}>
 {t('seccionBanda')}
 </h2>
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
 {miembros.map(m => (
 <div key={m.id} className="text-center space-y-2">
 <div className={`aspect-square rounded-[var(--r-l)] overflow-hidden ${styles.memberCard} border`}>
 {m.fotoUrl ? (
 <img src={m.fotoUrl} alt={m.nombre} className="w-full h-full object-cover" loading="lazy" />
 ) : (
 <div className="w-full h-full flex items-center justify-center text-2xl font-black opacity-40">
 {(m.nombre ||'?').charAt(0).toUpperCase()}
 </div>
 )}
 </div>
 <div>
 <h4 className="font-bold text-sm leading-tight">{m.nombre}</h4>
 {contenido.rolMiembro(m) && <p className={`text-xs ${styles.memberRole} mt-0.5`}>{contenido.rolMiembro(m)}</p>}
 {contenido.bioMiembro(m) && <p className="text-[11px] opacity-70 mt-1 leading-snug">{contenido.bioMiembro(m)}</p>}
 {m.instagram?.trim() && (() => {
 const raw = m.instagram.trim();
 const username = raw.replace(/^https?:\/\/(www\.)?instagram\.com\//,'').replace(/^@/,'').replace(/\/$/,'');
 const url = safeUrl(raw.startsWith('http') ? raw : `https://instagram.com/${username}`);
 if (!url) return null;
 const ctaText = t('seguirInstagram');
 return (
 <div className="mt-2.5 flex items-center justify-center print:hidden">
 <a
 href={url}
 target="_blank"
 rel="noopener noreferrer"
 className="group/ig inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface)]/90 hover:bg-[var(--surface)] hover:border-pink-500/40 shadow-sm transition-all duration-200 active:scale-95 text-[var(--ink-3)] hover:text-white"
 title={interpolate(t('seguirMiembro'), { name: m.nombre })}
 aria-label={interpolate(t('seguirMiembro'), { name: m.nombre })}
 >
 <span className="w-3.5 h-3.5 rounded-[4px] bg-gradient-to-tr from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] flex items-center justify-center p-[2px] text-white shrink-0 group-hover/ig:scale-110 transition-transform shadow-xs">
 <Instagram className="w-full h-full stroke-[2.5]" />
 </span>
 <span className="text-[11px] font-mono font-medium truncate max-w-[85px] sm:max-w-[110px]">
 @{username}
 </span>
 <span className="text-[10px] font-semibold text-pink-400 group-hover/ig:text-pink-300 shrink-0 ml-0.5">
 {ctaText.split('')[0]} ↗
 </span>
 </a>
 </div>
 );
 })()}
 </div>
 </div>
 ))}
 </div>
 </section>
 );
 };

 const renderBio = () => {
 return (
 <div key="bio" className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16 print:mb-8">
 <section className="lg:col-span-2 space-y-6">
 <h2 className={`text-2xl sm:text-3xl ${styles.sectionHeadingClass}`} style={styles.sectionHeadingStyle}>
 {t('seccionBio')}
 </h2>
 <div className="text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-3 opacity-90">
 {contenido.biografia}
 </div>
 </section>

 <section className={`${styles.bookingCard} rounded-[var(--r-l)] p-6 space-y-5 flex flex-col justify-between print: print:bg-white print:text-black`}>
 <div className="space-y-3">
 <h3 className={`text-lg font-bold ${styles.bookingTitle} print:text-black flex items-center gap-2`}>
 <Mail className="w-5 h-5" /> {t('contactoTitulo')}
 </h3>
 <p className="text-xs opacity-75 print:text-[var(--ink-2)]">
 {t('contactoSubtitulo')}
 </p>

 <div className="space-y-2.5 pt-2 text-sm">
 <div className="flex items-center gap-2.5 font-medium">
 <span className={`w-2 h-2 rounded-full ${styles.accentBtn.includes('fuchsia') ?'bg-fuchsia-400' : styles.accentBtn.includes('orange') ?'bg-orange-400' :'bg-[var(--acc)]/60'} shrink-0`}></span>
 <span>{config.contactoBooking?.nombre || t('managerPorDefecto')}</span>
 </div>
 <div className="flex items-center gap-2.5 font-mono">
 <Mail className="w-4 h-4 shrink-0 opacity-80" />
 <a href={`mailto:${config.contactoBooking?.email}`} className="hover:underline">{config.contactoBooking?.email}</a>
 </div>
 <div className="flex items-center gap-2.5 font-mono">
 <Phone className="w-4 h-4 shrink-0 opacity-80" />
 <a href={`tel:${config.contactoBooking?.telefono}`} className="hover:underline">{config.contactoBooking?.telefono}</a>
 </div>
 {config.enlacesRedes?.website && (
 <div className="flex items-center gap-2.5 font-mono">
 <Globe className="w-4 h-4 shrink-0 opacity-80" />
 <a
 href={safeUrl(config.enlacesRedes.website)}
 target="_blank"
 rel="noopener noreferrer"
 className="hover:underline truncate max-w-[200px]"
 title="Sitio Web Oficial"
 >
 {config.enlacesRedes.website.replace(/^https?:\/\//,'')}
 </a>
 </div>
 )}
 </div>
 </div>

 <div className="pt-4 border-t border-current/20 print:">
 <a
 href={`mailto:${config.contactoBooking?.email}?subject=${encodeURIComponent(t('asuntoContratacion'))}`}
 className={`w-full py-2.5 ${styles.accentBtn} rounded-[var(--r-m)] flex items-center justify-center gap-2 transition print:hidden`}
 >
 <Mail className="w-4 h-4" /> {t('ctaCache')}
 </a>
 </div>
 </section>
 </div>
 );
 };

 const renderPrensa = () => {
 if (!config.resenasPrensa?.habilitado) return null;
 const validCitas = (config.resenasPrensa.citas || []).filter(cita => cita.texto?.trim() && cita.medio?.trim());
 if (validCitas.length === 0) return null;

 return (
 <section key="prensa" className="mb-16 space-y-6 print:mb-8">
 <div className="space-y-1">
 <h2 className={`text-2xl sm:text-3xl ${styles.sectionHeadingClass}`} style={styles.sectionHeadingStyle}>
 {t('seccionPrensa')}
 </h2>
 <p className="text-xs sm:text-sm opacity-70 font-mono pt-1">
 {t('prensaSubtitulo')}
 </p>
 </div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {validCitas.map(cita => (
 <div key={cita.id} className={`${styles.cardHighlight} rounded-[var(--r-l)] p-5 flex flex-col justify-between space-y-4 shadow-lg transition`}>
 <div className="space-y-3">
 <Quote className={`w-6 h-6 ${styles.quoteIcon}`} />
 <p className="text-sm italic leading-relaxed">"{cita.texto}"
 </p>
 </div>
 <div className="pt-3 border-t border-current/15">
 <span className={`text-xs font-black ${styles.quoteMedium} uppercase tracking-wider font-mono`}>
 {cita.medio}
 </span>
 </div>
 </div>
 ))}
 </div>
 </section>
 );
 };

 const renderMusica = () => {
 if (songs.length === 0) return null;
 return (
 <section key="musica" className="mb-16 space-y-6 print:mb-8">
 <h2 className={`text-2xl sm:text-3xl ${styles.sectionHeadingClass}`} style={styles.sectionHeadingStyle}>
 {t('seccionTemas')}
 </h2>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
 {songs.map((song: any) => {
 const sonando = playingSongId === song.id;
 return (
 <div key={song.id} className={`${styles.cardHighlight} rounded-[var(--r-m)] p-4 flex flex-col justify-between gap-3 transition`}>
 <div className="space-y-1">
 <h4 className="font-bold text-base leading-tight">{song.titulo}</h4>
 <p className="text-xs opacity-75">
 {[song.albumDisco, song.genero, song.duracion].filter(Boolean).join(' •')}
 </p>
 </div>
 {song.audioPrincipalUrl && (
 <div className="space-y-2">
 <button
 onClick={() => setPlayingSongId(sonando ? null : song.id)}
 className={`w-full flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-[var(--r-s)] transition ${sonando ? styles.accentBtn : styles.accentBtnSubtle}`}
 >
 {sonando ? <><Pause className="w-3.5 h-3.5" /> {t('sonando')}</> : <><Play className="w-3.5 h-3.5" /> {t('escuchar')}</>}
 </button>
 {sonando && song.audioPrincipalUrl && (
 <audio
 src={song.audioPrincipalUrl}
 controls
 autoPlay
 onError={(e) => e.preventDefault()}
 onEnded={() => setPlayingSongId(null)}
 className="w-full h-9"
 />
 )}
 </div>
 )}
 </div>
 );
 })}
 </div>
 </section>
 );
 };

 const renderGaleria = () => {
 const validPhotos = (config.bandPhotos || []).filter(Boolean);
 if (validPhotos.length === 0) return null;
 return (
 <section key="galeria" className="mb-16 space-y-6 print:mb-8">
 <h2 className={`text-2xl sm:text-3xl ${styles.sectionHeadingClass}`} style={styles.sectionHeadingStyle}>
 {t('seccionGaleria')}
 </h2>
 <div className="relative group/carrusel">
 <div
 ref={galeriaScrollRef}
 className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] print:hidden"
 >
 {validPhotos.map((photoUrl, idx) => (
 <div key={idx} className={`group/foto relative shrink-0 w-[78%] sm:w-[340px] snap-center rounded-[var(--r-m)] overflow-hidden ${styles.card} aspect-video`}>
 <img src={photoUrl} alt={t('fotoAlt', { n: String(idx + 1) })} className="w-full h-full object-cover" loading="lazy" />
 <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover/foto:opacity-100 transition p-4 flex items-end justify-between">
 <span className="text-xs font-semibold text-white">{t('fotoPromocional', { n: String(idx + 1) })}</span>
 {safeUrl(photoUrl) && (
 <a href={safeUrl(photoUrl)} target="_blank" rel="noopener noreferrer" className={`p-1.5 ${styles.accentBtn} rounded-[var(--r-s)] text-xs font-bold`}>
 <ExternalLink className="w-3.5 h-3.5" />
 </a>
 )}
 </div>
 </div>
 ))}
 </div>
 <div className="hidden print:grid print:grid-cols-2 print:gap-4">
 {validPhotos.map((photoUrl, idx) => (
 <img key={idx} src={photoUrl} alt={t('fotoAlt', { n: String(idx + 1) })} className="w-full aspect-video object-cover rounded-[var(--r-m)] border-current/20" />
 ))}
 </div>
 {validPhotos.length > 1 && (
 <>
 <button
 type="button"
 onClick={() => galeriaScrollRef.current?.scrollBy({ left: -360, behavior:'smooth' })}
 aria-label={t('fotoAnterior')}
 className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 border-[var(--hair)] text-white items-center justify-center opacity-0 group-hover/carrusel:opacity-100 transition print:hidden"
 >
 ‹
 </button>
 <button
 type="button"
 onClick={() => galeriaScrollRef.current?.scrollBy({ left: 360, behavior:'smooth' })}
 aria-label={t('fotoSiguiente')}
 className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/75 border-[var(--hair)] text-white items-center justify-center opacity-0 group-hover/carrusel:opacity-100 transition print:hidden"
 >
 ›
 </button>
 </>
 )}
 </div>
 </section>
 );
 };

 const renderEscucha = () => {
 if (!spotifyEmbedUrl && !youtubeEmbedUrl) return null;
 return (
 <section key="escucha" className="mb-16 space-y-6 print:hidden">
 <h2 className={`text-2xl sm:text-3xl ${styles.sectionHeadingClass}`} style={styles.sectionHeadingStyle}>
 {t('seccionEscucha')}
 </h2>
 <div className={`grid gap-4 ${spotifyEmbedUrl && youtubeEmbedUrl ?'lg:grid-cols-2' :'grid-cols-1'}`}>
 {youtubeEmbedUrl && (
 <div className={`rounded-[var(--r-m)] overflow-hidden ${styles.card} aspect-video`}>
 <iframe
 src={youtubeEmbedUrl}
 title={t('tituloVideoPorDefecto')}
 allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
 allowFullScreen
 loading="lazy"
 className="w-full h-full"
 />
 </div>
 )}
 {spotifyEmbedUrl && (
 <div className={`rounded-[var(--r-m)] overflow-hidden ${styles.card} border`}>
 <iframe
 src={spotifyEmbedUrl}
 title={t('tituloSpotify')}
 allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
 loading="lazy"
 className="w-full h-[352px]"
 />
 </div>
 )}
 </div>
 </section>
 );
 };

 const renderConciertos = () => {
 if (concerts.length === 0) return null;
 return (
 <section key="conciertos" className="mb-16 space-y-6 print:mb-8">
 <h2 className={`text-2xl sm:text-3xl ${styles.sectionHeadingClass}`} style={styles.sectionHeadingStyle}>
 {t('seccionFechas')}
 </h2>
 <div className="space-y-2.5">
 {concerts.map(c => (
 <div key={c.id} className={`${styles.card} rounded-[var(--r-m)] p-3.5 space-y-2.5`}>
 <div className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-3">
 <span className={`px-2.5 py-1 rounded ${styles.badge} font-mono text-xs font-bold shrink-0 border`}>
 {c.fecha}
 </span>
 <div>
 <h4 className="font-bold text-sm leading-tight">{c.sala}</h4>
 <p className="text-xs opacity-75 flex items-center gap-1">
 <MapPin className="w-3 h-3 opacity-80" /> {c.ciudad}
 </p>
 </div>
 </div>
 <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${styles.badge} capitalize border`}>
 {c.tipo}
 </span>
 </div>
 {(c.entradasUrl || c.entradasLugarFisico) && (
 <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-current/10 print:hidden">
 {c.entradasUrl && (
 <a
 href={c.entradasUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-s)] bg-emerald-500 text-stone-950 text-xs font-bold hover:bg-emerald-400 transition-colors"
 >
 <Ticket className="w-3.5 h-3.5" /> Comprar Entradas
 </a>
 )}
 {c.entradasLugarFisico && (
 <span className="text-xs opacity-75">
 📍 También en: {c.entradasLugarFisico}
 </span>
 )}
 </div>
 )}
 </div>
 ))}
 </div>
 </section>
 );
 };

 return (
 <div className={`min-h-screen ${styles.pageBg} font-sans print:bg-white print:text-black`}>
 {/* Top Floating Action Bar (Hidden on Print) */}
 <div className={`fixed top-0 left-0 right-0 ${styles.topBar} backdrop-blur-md border-b z-50 py-3 px-4 flex items-center justify-between shadow-lg print:hidden`}>
 <div className="flex items-center gap-3">
 {displayLogo ? (
 <img src={displayLogo} alt={t('logoAlt')} className="w-8 h-8 rounded-full object-cover" />
 ) : (
 <div className="w-8 h-8 rounded-full bg-[var(--surface)] flex items-center justify-center text-[var(--acc)] font-bold text-xs">
 {bandName.charAt(0).toUpperCase()}
 </div>
 )}
 {/* En móvil solo el nombre: con el selector de idioma al lado */}
 <span className={`font-bold ${styles.accentText} tracking-wide text-sm sm:text-base whitespace-nowrap`}>
 <span className="sm:hidden">{bandName}</span>
 <span className="hidden sm:inline">{t('insigniaCabecera')}</span>
 </span>
 </div>
 <div className="flex items-center gap-2 sm:gap-3">
 {/* Selector de idioma */}
 <div className="flex items-center gap-0.5 bg-black/20 border-current/15 rounded-[var(--r-s)] p-0.5" role="group" aria-label={t('selectorIdioma')}>
 {availableLanguages.map(l => (
 <button
 key={l.code}
 type="button"
 onClick={() => setLanguage(l.code)}
 aria-pressed={language === l.code}
 title={l.label}
 className={`px-2 py-1 rounded-md text-xs font-bold transition ${language === l.code ? styles.accentBtn :'opacity-70 hover:opacity-100'}`}
 >
 <span aria-hidden="true">{l.flag}</span>
 <span className="hidden sm:inline ml-1 uppercase">{l.code}</span>
 </button>
 ))}
 </div>
 <button
 onClick={handleShare}
 className={`flex items-center gap-1.5 px-3 py-1.5 ${styles.topBarBtn} text-xs sm:text-sm font-medium rounded-[var(--r-s)] transition`}
 >
 {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4" />}
 <span>{copiedLink ? t('enlaceCopiado') : t('compartir')}</span>
 </button>
 </div>
 </div>

 {/* HERO a sangre completa */}
 <header className="relative w-full overflow-hidden print:border-none print:bg-none">
 {fotoPortada ? (
 <>
 <img src={fotoPortada} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover print:hidden" />
 <div className={`absolute inset-0 ${styles.heroOverlay} print:hidden`} />
 </>
 ) : (
 <div className={`absolute inset-0 ${styles.heroNoPhoto} print:hidden`} />
 )}

 <div className={`relative max-w-5xl mx-auto px-6 flex flex-col items-center text-center justify-end ${fotoPortada ?'min-h-[78vh] pt-32 pb-16' :'min-h-[62vh] pt-32 pb-14'}`}>
 {displayLogo && (
 <img
 src={displayLogo}
 alt={t('logoOficialAlt')}
 className={`rounded-[var(--r-m)] object-cover shadow-2xl mb-7 ${fotoPortada ?'w-16 h-16 sm:w-20 sm:h-20' :'w-24 h-24 sm:w-28 sm:h-28'}`}
 />
 )}

 <h1
 className={styles.heroTitleClass}
 style={{
 ...styles.heroTitleStyle,
 ...((config.fontStyle || config.tipografia) ? { fontFamily: getFontFamilyById(config.fontStyle || config.tipografia) } : {})
 }}
 >
 {bandName}
 </h1>

 <p className={`mt-6 ${styles.heroSubtitle} text-base sm:text-xl max-w-2xl leading-snug`}>
 {contenido.textoPie || (isBakandeya ? t('lemaPorDefectoBakandeya') : t('lemaPorDefecto'))}
 </p>

 {config.enlacesRedes && (
 <div className="mt-8 print:hidden">
 <SocialPlatformsList links={config.enlacesRedes} variant="pills" showTitle={false} />
 </div>
 )}
 </div>
 </header>

 {/* Main Container con renderizado dinámico según ordenSecciones */}
 <div className="max-w-5xl mx-auto px-4 pt-14 pb-28 print:p-0 print:pt-4">
 {effectiveSections.map((sectionId: EPKSectionId) => {
 switch (sectionId) {
 case'cifras':
 return renderCifras();
 case'datos':
 return renderDatos();
 case'videos':
 return renderVideos();
 case'miembros':
 return renderMiembros();
 case'bio':
 return renderBio();
 case'prensa':
 return renderPrensa();
 case'musica':
 return renderMusica();
 case'galeria':
 return renderGaleria();
 case'escucha':
 return renderEscucha();
 case'conciertos':
 return renderConciertos();
 default:
 return null;
 }
 })}

 {/* FOOTER */}
 <footer className={`text-center text-xs ${styles.footer} space-y-4 pt-6 border-t print:text-black`}>
 {safeUrl(config.dossierPdfUrl) && (
 <a
 href={safeUrl(config.dossierPdfUrl)}
 target="_blank"
 rel="noopener noreferrer"
 className={`inline-flex items-center gap-1.5 px-4 py-2 ${styles.accentBtnSubtle} text-xs font-bold rounded-full transition print:hidden`}
 >
 <Download className="w-3.5 h-3.5" /> {config.dossierPdfName || t('descargarDossier')}
 </a>
 )}
 <p>{t('pieDerechos')}</p>
 </footer>
 </div>

 {/* STICKY AUDIO PLAYER */}
 {(() => {
 const activeSong = songs.find(s => s.id === playingSongId) || songs.find(s => s.audioPrincipalUrl);
 if (!activeSong?.audioPrincipalUrl || stickyPlayerDismissed) return null;
 const isCurrentlyPlaying = playingSongId === activeSong.id;

 return (
 <div className={`fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 ${styles.stickyPlayer} backdrop-blur-md rounded-[var(--r-l)] p-3.5 shadow-2xl z-40 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300 print:hidden`}>
 <div className="flex items-center gap-3 overflow-hidden">
 <button
 onClick={() => setPlayingSongId(isCurrentlyPlaying ? null : activeSong.id)}
 className={`w-10 h-10 rounded-[var(--r-m)] ${styles.accentBtn} flex items-center justify-center shrink-0 shadow transition`}
 aria-label={isCurrentlyPlaying ?'Pausar' :'Reproducir'}
 >
 {isCurrentlyPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
 </button>
 <div className="min-w-0 pr-1">
 <p className={`text-[10px] ${styles.accentText} font-bold uppercase tracking-wider flex items-center gap-1`}>
 <Music className="w-3 h-3 animate-pulse" /> {isCurrentlyPlaying ? t('playerPista') :'Audio Demo'}
 </p>
 <p className="text-xs font-bold truncate">{activeSong.titulo}</p>
 <p className="text-[11px] opacity-75 truncate">{activeSong.albumDisco || bandName}</p>
 </div>
 </div>

 <div className="flex items-center gap-1.5 shrink-0">
 <button
 onClick={() => setStickyPlayerDismissed(true)}
 title={t('playerCerrar')}
 className="p-1.5 opacity-60 hover:opacity-100 rounded-[var(--r-s)] hover:bg-black/10 transition"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>
 );
 })()}
 </div>
 );
};

export default PublicEPK;
