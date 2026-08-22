import React, { useState, useEffect } from 'react';
import {
  Download, Share2, ExternalLink,
  Copy, Check, Printer, Mail, Phone, MapPin, Play, Pause
} from 'lucide-react';
import { EPKConfig, Song, Concert } from '../types';
import { SocialPlatformsList } from './SocialPlatformsList';

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
  const galeriaScrollRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!initialData) {
      const searchParams = typeof window !== 'undefined' ? window.location.search : '';
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-amber-400 font-medium">Cargando Kit de Prensa...</p>
      </div>
    );
  }

  const bandName = epkData?.bandName || epkData?.registeredBand?.nombre_banda || "Banda";
  const isBakandeya = (epkData?.bandId || '').includes('bakandeya') || bandName.toLowerCase().includes('bakandeya');

  const config: EPKConfig = epkData?.epkConfig || {
    biografia: isBakandeya ? "Bakandeya es una propuesta vibrante de mestizaje, ska-rock, reggae y ritmos latinos..." : `${bandName} — Propuesta musical en directo.`,
    logoUrl: isBakandeya ? "/logo_bakandeya_bueno_sin_fondo.png" : "",
    bandPhotos: [],
    riderTecnico: "PA y microfonía profesional de directo...",
    enlacesRedes: {},
    contactoBooking: { nombre: bandName, email: "", telefono: "" },
    temasDestacadosIds: []
  };

  const displayLogo = config.logoUrl || (isBakandeya ? "/logo_bakandeya_bueno_sin_fondo.png" : "");

  // El endpoint público devuelve los temas tal cual salen de Supabase (snake_case), pero el
  // resto de la app usa camelCase. Sin normalizar, 'albumDisco' salía undefined y caía al
  // literal "Sencillo", y el audio real que ya está subido no se reproducía nunca.
  const songs: any[] = (epkData?.highlightedSongs || []).map((s: any) => ({
    ...s,
    albumDisco: s.albumDisco ?? s.album_disco ?? s.album,
    audioPrincipalUrl: s.audioPrincipalUrl ?? s.audio_principal_url,
    portadaUrl: s.portadaUrl ?? s.portada_url
  }));
  const concerts: Concert[] = epkData?.upcomingConcerts || [];

  // Un enlace de artista/álbum de Spotify se puede incrustar cambiando la ruta por /embed/.
  // Se exigen los 22 caracteres del ID real: si no, un enlace de relleno como
  // '/artist/bakandeya' generaba un iframe que no carga y dejaba un hueco vacío en la página.
  const spotifyEmbedUrl = (() => {
    const raw = config.enlacesRedes?.spotify || "";
    const match = raw.match(/open\.spotify\.com\/(artist|album|track|playlist)\/([A-Za-z0-9]{22})/);
    return match ? `https://open.spotify.com/embed/${match[1]}/${match[2]}` : null;
  })();

  // Solo se puede incrustar un VÍDEO concreto, no un canal: si el enlace es de canal (@handle
  // o /c/), se deja como enlace normal en vez de meter un iframe roto.
  const aEmbed = (raw: string): string | null => {
    const yt = (raw || "").match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
    const vimeo = (raw || "").match(/vimeo\.com\/(?:video\/)?(\d+)/);
    if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
    return null;
  };

  const youtubeEmbedUrl = aEmbed(config.enlacesRedes?.youtube || "");

  // Vídeos elegidos a mano en el gestor del EPK. El destacado va primero y en grande.
  const videos = (config.videos || []).filter(v => v?.url && aEmbed(v.url));
  const videoPrincipal = videos.find(v => v.destacado) || videos[0] || null;
  const videosSecundarios = videos.filter(v => v !== videoPrincipal);
  const miembros = (config.miembros || []).filter(m => m?.nombre || m?.fotoUrl);
  // Foto de portada del hero: la primera de la Galería de Imagen & Prensa, si existe. Es lo
  // que hace que esto lea como la web real de una banda en directo y no como una tarjeta de
  // dashboard - sin foto real, cae al degradado de siempre.
  const fotoPortada = (config.bandPhotos || []).find(p => p && p !== displayLogo) || null;
  const datos = config.datosContratacion || {};
  const hayDatosContratacion = Boolean(
    datos.numMusicos || datos.duracionDirecto || datos.ciudadBase || datos.formatos || datos.necesidadesEscenario
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 print:bg-white print:text-black">
      {/* Top Floating Action Bar (Hidden on Print) */}
      <div className="fixed top-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 z-50 py-3 px-4 flex items-center justify-between shadow-lg print:hidden">
        <div className="flex items-center gap-3">
          {displayLogo ? (
            <img src={displayLogo} alt={`Logo ${bandName}`} className="w-8 h-8 rounded-full object-cover border border-amber-500/50" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-slate-800 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold text-xs">
              {bandName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="font-bold text-amber-400 tracking-wide text-sm sm:text-base">{bandName} — EPK / Press Kit</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={handleCopyLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-medium rounded-lg border border-slate-700 transition"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-amber-400" />}
            <span>{copiedLink ? '¡Enlace Copiado!' : 'Compartir'}</span>
          </button>
          <button
            onClick={handlePrintPDF}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm rounded-lg transition shadow-md"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar PDF / Imprimir</span>
            <span className="sm:hidden">PDF</span>
          </button>
        </div>
      </div>

      {/* HERO a sangre completa. Una web de banda abre con una imagen que ocupa la pantalla,
          no con una tarjeta redondeada dentro de una rejilla - ese formato de tarjeta era lo
          que hacía que la página leyera como un panel de control. La biografía y los datos de
          contratación tienen su propia sección debajo, así que aquí no se repite nada. */}
      <header className="relative w-full overflow-hidden print:border-none print:bg-none">
        {fotoPortada ? (
          <>
            <img src={fotoPortada} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover print:hidden" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-950/50 print:hidden" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-amber-950/30 print:hidden" />
        )}

        <div className={`relative max-w-5xl mx-auto px-6 flex flex-col items-center text-center justify-end ${fotoPortada ? 'min-h-[78vh] pt-32 pb-16' : 'min-h-[62vh] pt-32 pb-14'}`}>
          {displayLogo && (
            <img
              src={displayLogo}
              alt={`Logo Oficial ${bandName}`}
              className={`rounded-xl object-cover shadow-2xl mb-7 ${fotoPortada ? 'w-16 h-16 sm:w-20 sm:h-20' : 'w-24 h-24 sm:w-28 sm:h-28'}`}
            />
          )}

          <h1
            className="text-white uppercase leading-[0.88] tracking-tight text-[15vw] sm:text-[7rem] lg:text-[9rem]"
            style={{ fontFamily: "'Anton', 'Oswald', sans-serif" }}
          >
            {bandName}
          </h1>

          <p className="mt-6 text-amber-300 text-base sm:text-xl max-w-2xl leading-snug">
            {/* Subtítulo corto de la cabecera: usa el Lema/Pie de Firma (firmaEmail.textoPie),
                NUNCA el texto largo para agentes de IA (dossierTextoExtra) - antes usaba ese
                segundo campo, y al no avisar que también era público, un texto largo pensado
                solo para el chatbot acababa mostrado como titular gigante en la home. */}
            {config.firmaEmail?.textoPie || (isBakandeya ? "Ska-Rock, Mestizaje & Ritmos Latinos en Vivo" : `${bandName} en Directo`)}
          </p>

          {config.enlacesRedes && (
            <div className="mt-8 print:hidden">
              <SocialPlatformsList links={config.enlacesRedes} variant="pills" showTitle={false} />
            </div>
          )}
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-5xl mx-auto px-4 pt-14 pb-16 print:p-0 print:pt-4">

        {/* DATOS DUROS DE CONTRATACIÓN - responde las preguntas de siempre sin otro email */}
        {hayDatosContratacion && (
          <section className="mb-16 space-y-6 print:mb-8">
            <h2 className="text-2xl sm:text-3xl uppercase tracking-wide text-white border-b border-slate-800/80 pb-4" style={{ fontFamily: "'Anton', 'Oswald', sans-serif" }}>
              Datos para Contratación
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Músicos en escena', valor: datos.numMusicos ? String(datos.numMusicos) : '' },
                {
                  label: 'Duración del directo',
                  // El editor ahora guarda solo el número (la unidad "min" es fija en la UI),
                  // pero datos antiguos podían llevar texto libre tipo "75 min" - si ya trae
                  // letras se deja tal cual, para no acabar mostrando "75 min min".
                  valor: datos.duracionDirecto
                    ? (/[a-zA-Z]/.test(String(datos.duracionDirecto)) ? String(datos.duracionDirecto) : `${datos.duracionDirecto} min`)
                    : ''
                },
                { label: 'Ciudad base', valor: datos.ciudadBase || '' },
                { label: 'Formatos', valor: datos.formatos || '' }
              ].filter(d => d.valor).map(d => (
                <div key={d.label} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">{d.label}</p>
                  <p className="text-white font-bold mt-1 text-sm">{d.valor}</p>
                </div>
              ))}
            </div>
            {datos.necesidadesEscenario && (
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold">Necesidades de escenario</p>
                <p className="text-slate-300 text-sm mt-1">{datos.necesidadesEscenario}</p>
              </div>
            )}
          </section>
        )}

        {/* VÍDEOS DE DIRECTO - lo primero que mira quien contrata: cómo suena y cómo se ve */}
        {videoPrincipal && (
          <section className="mb-16 space-y-6 print:hidden">
            <h2 className="text-2xl sm:text-3xl uppercase tracking-wide text-white border-b border-slate-800/80 pb-4" style={{ fontFamily: "'Anton', 'Oswald', sans-serif" }}>
              Vídeo en Directo
            </h2>
            <div className="rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950">
              <iframe
                src={aEmbed(videoPrincipal.url)!}
                title={videoPrincipal.titulo || `${bandName} en directo`}
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                allowFullScreen
                loading="lazy"
                className="w-full h-full"
              />
            </div>
            {videoPrincipal.titulo && (
              <p className="text-sm text-slate-300 font-medium">{videoPrincipal.titulo}</p>
            )}
            {videosSecundarios.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {videosSecundarios.map(v => (
                  <div key={v.id} className="space-y-2">
                    <div className="rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950">
                      <iframe
                        src={aEmbed(v.url)!}
                        title={v.titulo || `${bandName} en directo`}
                        allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
                        allowFullScreen
                        loading="lazy"
                        className="w-full h-full"
                      />
                    </div>
                    {v.titulo && <p className="text-xs text-slate-400">{v.titulo}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* FORMACIÓN - caras y quién sube al escenario */}
        {miembros.length > 0 && (
          <section className="mb-16 space-y-6 print:mb-8">
            <h2 className="text-2xl sm:text-3xl uppercase tracking-wide text-white border-b border-slate-800/80 pb-4" style={{ fontFamily: "'Anton', 'Oswald', sans-serif" }}>
              La Banda
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {miembros.map(m => (
                <div key={m.id} className="text-center space-y-2">
                  <div className="aspect-square rounded-2xl overflow-hidden border border-slate-800 bg-slate-950">
                    {m.fotoUrl ? (
                      <img src={m.fotoUrl} alt={m.nombre} className="w-full h-full object-cover" loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl font-black text-slate-700">
                        {(m.nombre || '?').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-sm leading-tight">{m.nombre}</h4>
                    {m.rol && <p className="text-xs text-amber-400/90 mt-0.5">{m.rol}</p>}
                    {m.bio && <p className="text-[11px] text-slate-500 mt-1 leading-snug">{m.bio}</p>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}


        {/* 2-COLUMN LAYOUT FOR BIO & CONTACT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* BIOGRAPHY (2 Cols) */}
          <section className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl sm:text-3xl uppercase tracking-wide text-white border-b border-slate-800/80 pb-4" style={{ fontFamily: "'Anton', 'Oswald', sans-serif" }}>
              Biografía & Propuesta Musical
            </h2>
            <div className="text-slate-300 text-sm sm:text-base leading-relaxed whitespace-pre-line space-y-3">
              {config.biografia}
            </div>
          </section>

          {/* CONTACT & BOOKING CARD (1 Col) */}
          <section className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 space-y-5 flex flex-col justify-between print:border-amber-400 print:bg-white print:text-black">
            <div className="space-y-3">
              <h3 className="text-lg font-bold text-amber-400 print:text-black flex items-center gap-2">
                <Mail className="w-5 h-5" /> Contacto de Booking
              </h3>
              <p className="text-xs text-slate-400 print:text-slate-600">
                Atención directa a programadores de salas, comisiones de fiestas y festivales:
              </p>

              <div className="space-y-2.5 pt-2 text-sm">
                <div className="flex items-center gap-2.5 text-slate-200 print:text-black font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0"></span>
                  <span>{config.contactoBooking?.nombre || `Mánager ${bandName}`}</span>
                </div>
                <div className="flex items-center gap-2.5 text-amber-300 print:text-black font-mono">
                  <Mail className="w-4 h-4 shrink-0 text-amber-400" />
                  <a href={`mailto:${config.contactoBooking?.email}`} className="hover:underline">{config.contactoBooking?.email}</a>
                </div>
                <div className="flex items-center gap-2.5 text-slate-300 print:text-black font-mono">
                  <Phone className="w-4 h-4 shrink-0 text-amber-400" />
                  <a href={`tel:${config.contactoBooking?.telefono}`} className="hover:underline">{config.contactoBooking?.telefono}</a>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-amber-500/20 print:border-slate-300">
              <a
                href={`mailto:${config.contactoBooking?.email}?subject=Contratación%20${encodeURIComponent(bandName)}%20${new Date().getFullYear()}`}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition print:hidden"
              >
                <Mail className="w-4 h-4" /> Solicitar Caché & Disponibilidad
              </a>
            </div>
          </section>
        </div>

        {/* FEATURED TRACKS / AUDIO PREVIEW */}
        {songs.length > 0 && (
          <section className="mb-16 space-y-6 print:mb-8">
            <h2 className="text-2xl sm:text-3xl uppercase tracking-wide text-white border-b border-slate-800/80 pb-4" style={{ fontFamily: "'Anton', 'Oswald', sans-serif" }}>
              Temas Destacados / Repertorio Principal
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {songs.map((song: any) => {
                const sonando = playingSongId === song.id;
                return (
                  <div key={song.id} className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-amber-500/40 transition">
                    <div className="space-y-1">
                      <h4 className="font-bold text-white text-base leading-tight">{song.titulo}</h4>
                      {/* Nada de BPM/tonalidad/notas internas: son datos de ensayo, no le dicen
                          nada a quien programa y ensucian la página (salían como "N/A"). */}
                      <p className="text-xs text-slate-400">
                        {[song.albumDisco, song.genero, song.duracion].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                    {song.audioPrincipalUrl && (
                      <div className="space-y-2">
                        <button
                          onClick={() => setPlayingSongId(sonando ? null : song.id)}
                          className={`w-full flex items-center justify-center gap-2 text-xs font-bold px-3 py-2 rounded-lg transition ${sonando ? 'bg-amber-400 text-slate-950' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'}`}
                        >
                          {sonando ? <><Pause className="w-3.5 h-3.5" /> Sonando</> : <><Play className="w-3.5 h-3.5" /> Escuchar</>}
                        </button>
                        {sonando && (
                          <audio
                            src={song.audioPrincipalUrl}
                            controls
                            autoPlay
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
        )}

        {/* BAND PHOTOS & GALLERY - carrete horizontal con scroll-snap nativo (swipe en móvil,
            arrastre/rueda en escritorio) en vez de una rejilla estática. Sin librería nueva. */}
        {((config.bandPhotos && config.bandPhotos.length > 0) || displayLogo) && (
          <section className="mb-16 space-y-6 print:mb-8">
            <h2 className="text-2xl sm:text-3xl uppercase tracking-wide text-white border-b border-slate-800/80 pb-4" style={{ fontFamily: "'Anton', 'Oswald', sans-serif" }}>
              Galería de Imagen & Prensa
            </h2>
            <div className="relative group/carrusel">
              <div
                ref={galeriaScrollRef}
                className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] print:hidden"
              >
                {(config.bandPhotos && config.bandPhotos.length > 0 ? config.bandPhotos : [displayLogo]).filter(Boolean).map((photoUrl, idx) => (
                  <div key={idx} className="group/foto relative shrink-0 w-[78%] sm:w-[340px] snap-center rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950">
                    <img src={photoUrl} alt={`Foto oficial ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover/foto:opacity-100 transition p-4 flex items-end justify-between">
                      <span className="text-xs font-semibold text-white">Foto Promocional #{idx + 1}</span>
                      <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              {/* Print: la galería sí se imprime, pero como cuadrícula normal (el scroll no existe en papel). */}
              <div className="hidden print:grid print:grid-cols-2 print:gap-4">
                {(config.bandPhotos && config.bandPhotos.length > 0 ? config.bandPhotos : [displayLogo]).filter(Boolean).map((photoUrl, idx) => (
                  <img key={idx} src={photoUrl} alt={`Foto oficial ${idx + 1}`} className="w-full aspect-video object-cover rounded-xl border border-slate-800" />
                ))}
              </div>
              {(config.bandPhotos?.length || 0) > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => galeriaScrollRef.current?.scrollBy({ left: -360, behavior: 'smooth' })}
                    aria-label="Foto anterior"
                    className="hidden sm:flex absolute left-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/80 border border-slate-700 text-white items-center justify-center opacity-0 group-hover/carrusel:opacity-100 transition print:hidden"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => galeriaScrollRef.current?.scrollBy({ left: 360, behavior: 'smooth' })}
                    aria-label="Foto siguiente"
                    className="hidden sm:flex absolute right-1 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-950/80 border border-slate-700 text-white items-center justify-center opacity-0 group-hover/carrusel:opacity-100 transition print:hidden"
                  >
                    ›
                  </button>
                </>
              )}
            </div>
          </section>
        )}

        {/* ESCUCHA Y VÍDEO - lo que de verdad decide a quien programa un directo */}
        {(spotifyEmbedUrl || youtubeEmbedUrl) && (
          <section className="mb-16 space-y-6 print:hidden">
            <h2 className="text-2xl sm:text-3xl uppercase tracking-wide text-white border-b border-slate-800/80 pb-4" style={{ fontFamily: "'Anton', 'Oswald', sans-serif" }}>
              Escúchanos y Míranos en Directo
            </h2>
            <div className={`grid gap-4 ${spotifyEmbedUrl && youtubeEmbedUrl ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
              {youtubeEmbedUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-800 aspect-video bg-slate-950">
                  <iframe
                    src={youtubeEmbedUrl}
                    title={`${bandName} en directo`}
                    allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    loading="lazy"
                    className="w-full h-full"
                  />
                </div>
              )}
              {spotifyEmbedUrl && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                  <iframe
                    src={spotifyEmbedUrl}
                    title={`${bandName} en Spotify`}
                    allow="clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                    className="w-full h-[352px]"
                  />
                </div>
              )}
            </div>
          </section>
        )}

        {/* TECHNICAL RIDER - oculto si no hay nada que enseñar (antes salía una caja vacía) */}
        {(config.riderTecnico?.trim() || config.riderPdfUrl) && (
        <section className="mb-16 space-y-6 print:mb-8">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h2 className="text-2xl sm:text-3xl uppercase tracking-wide text-white" style={{ fontFamily: "'Anton', 'Oswald', sans-serif" }}>
              Rider Técnico
            </h2>
            <div className="flex items-center gap-2 print:hidden">
              {config.riderPdfUrl && (
                <a
                  href={config.riderPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow"
                >
                  <Download className="w-3.5 h-3.5" /> {config.riderPdfName || 'Descargar PDF Rider'}
                </a>
              )}
              {config.riderTecnico?.trim() && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(config.riderTecnico);
                    alert("¡Rider técnico copiado al portapapeles!");
                  }}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 transition"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar Texto
                </button>
              )}
            </div>
          </div>
          {config.riderTecnico?.trim() && (
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-4 text-slate-300 text-sm font-mono whitespace-pre-line leading-relaxed">
              {config.riderTecnico}
            </div>
          )}
        </section>
        )}

        {/* UPCOMING SHOWS */}
        {concerts.length > 0 && (
          <section className="mb-16 space-y-6 print:mb-8">
            <h2 className="text-2xl sm:text-3xl uppercase tracking-wide text-white border-b border-slate-800/80 pb-4" style={{ fontFamily: "'Anton', 'Oswald', sans-serif" }}>
              Próximas Fechas de Gira
            </h2>
            <div className="space-y-2.5">
              {concerts.map(c => (
                <div key={c.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 rounded bg-amber-500/20 text-amber-400 font-mono text-xs font-bold shrink-0">
                      {c.fecha}
                    </span>
                    <div>
                      <h4 className="font-bold text-white text-sm">{c.sala}</h4>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-amber-500/80" /> {c.ciudad}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 capitalize">
                    {c.tipo}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* FOOTER */}
        <footer className="text-center text-xs text-slate-500 space-y-4 pt-6 border-t border-slate-800 print:text-black">
          {config.dossierPdfUrl && (
            <a
              href={config.dossierPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 text-xs font-bold rounded-full transition print:hidden"
            >
              <Download className="w-3.5 h-3.5" /> {config.dossierPdfName || 'Descargar Dossier en PDF'}
            </a>
          )}
          <p>© {new Date().getFullYear()} {bandName} — Todos los derechos reservados. Kit de prensa generado por BandManager.ai</p>
        </footer>
      </div>
    </div>
  );
};

export default PublicEPK;
