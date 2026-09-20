import React, { useState } from 'react';
import {
 AlertCircle, CheckCircle2
} from 'lucide-react';
import { EPKConfig, Song, User, BandMember, EPKVideo, DatosContratacion } from '../types';
import { uploadFileToServer } from '../utils/audioStorage';
import { EPK_LANGUAGES } from '../i18n/epkTranslations';
import { IDIOMA_ORIGEN, traduccionDesactualizada, tieneTraduccion } from '../utils/epkTraducciones';
import { api } from '../services/api';
import { FansLandingPreviewModal } from './FansLandingPreviewModal';
import { EPKBlockId, EPK_BLOCKS, computeEPKHealth, getBlockNavigation } from './epk/epkBlocks';
import { EPKHeader } from './epk/EPKHeader';
import { EPKPerfilBlock } from './epk/EPKPerfilBlock';
import { EPKArchivosBlock } from './epk/EPKArchivosBlock';
import { EPKMusicaBlock } from './epk/EPKMusicaBlock';
import { EPKPrensaBlock } from './epk/EPKPrensaBlock';
import { EPKDonacionesBlock } from './epk/EPKDonacionesBlock';
import { EPKFirmaQRBlock } from './epk/EPKFirmaQRBlock';
import { EPKPlantillasBlock } from './epk/EPKPlantillasBlock';
import { normalizePlan } from '../utils/planPermissions';
import { useModuleTutorial } from '../hooks/useModuleTutorial';
import { ModuleTutorialModal } from './common/ModuleTutorialModal';

interface EPKManagerProps {
 epkConfig?: Partial<EPKConfig>;
 songs?: Song[];
 onSave?: (newConfig: EPKConfig) => void;
 colors?: any;
 currentTheme?: any;
 currentUser?: User;
 isPromoPlan?: boolean;
}

const DEFAULT_EPK_CONFIG: EPKConfig = {
 biografia:'Bakandeya es una propuesta vibrante de mestizaje, ska-rock, reggae y ritmos latinos con sección de metales potente y letras combativas pero festivas. Con más de 40 conciertos a sus espaldas en salas y festivales de la península, Bakandeya ofrece un directo arrollador de 90 minutos concebido para hacer bailar e involucrar a todo el público de principio a fin.',
 logoUrl:'/logo_bakandeya.jpg',
 dossierPdfUrl:'',
 dossierPdfName:'',
 dossierTextoExtra:'',
 bandPhotos: ['/logo_bakandeya.jpg'],
 temasDestacadosIds: ['s-1','s-2','s-3'],
 contactoBooking: {
 nombre:'Booking & Management',
 email:'',
 telefono:''
 },
 riderTecnico:'- 1 PA estéreo adecuada para el aforo de la sala/escenario (mín. 2000W)\n- Manguera de 16 canales con 4 envíos de monitores o sistema IEM inalámbrico\n- 3 Micrófonos dinámicos vocal (Shure SM58)\n- Miking completo para instrumentos y percusión\n- 2 Cajas de inyección DI para teclados/secuencias\n- Microfonía para batería estándar (Kick, Snare, 2 Toms, Overheads)',
 enlacesRedes: {
 spotify:'https://open.spotify.com',
 youtube:'https://youtube.com',
 instagram:'https://instagram.com',
 tiktok:'https://tiktok.com',
 appleMusic:'https://music.apple.com',
 bandcamp:'https://bandcamp.com',
 website:'https://bandmanager.io',
 whatsapp:'',
 facebook:'',
 twitter:'',
 revolut:'',
 paypal:''
 },
 donacionRevolut: {
 habilitado: true,
 revolutTag:'',
 revolutUrl:'',
 paypalUser:'',
 paypalUrl:'',
 metodoPorDefecto:'revolut',
 titulo:'Colabora con la banda',
 descripcion:'Tu aportación directa nos ayuda a financiar furgoneta de gira, grabación de nuevos temas e instrumentos.'
 },
 firmaEmail: {
 nombreRemitente:'Booking & Management',
 cargo:'Booking & Management',
 telefono:'',
 email:'',
 textoPie:'Música en directo y gira',
 incluirIconosRedes: true,
 adjuntarDossierPorDefecto: true,
 redesSociales: {
 spotify:'https://open.spotify.com',
 youtube:'https://youtube.com',
 instagram:'https://instagram.com',
 tiktok:'https://tiktok.com',
 appleMusic:'https://music.apple.com',
 bandcamp:'https://bandcamp.com',
 website:'https://bandmanager.io',
 whatsapp:''
 }
 }
};

// Base vacía para cualquier banda que NO sea Bakandeya: los datos de
// Bakandeya de arriba son solo su semilla de ejemplo, nunca deben usarse
// como fallback para rellenar el dossier de una banda nueva o distinta.
const EMPTY_EPK_CONFIG: EPKConfig = {
 biografia:'',
 logoUrl:'',
 dossierPdfUrl:'',
 dossierPdfName:'',
 dossierTextoExtra:'',
 bandPhotos: [],
 temasDestacadosIds: [],
 contactoBooking: {
 nombre:'',
 email:'',
 telefono:''
 },
 riderTecnico:'',
 enlacesRedes: {
 spotify:'',
 youtube:'',
 instagram:'',
 tiktok:'',
 appleMusic:'',
 bandcamp:'',
 website:'',
 whatsapp:'',
 facebook:'',
 twitter:'',
 revolut:'',
 paypal:''
 },
 donacionRevolut: {
 habilitado: true,
 revolutTag:'',
 revolutUrl:'',
 paypalUser:'',
 paypalUrl:'',
 metodoPorDefecto:'revolut',
 titulo:'Colabora con la banda',
 descripcion:'Tu aportación directa nos ayuda a financiar furgoneta de gira, grabación de nuevos temas e instrumentos.'
 },
 firmaEmail: {
 nombreRemitente:'',
 cargo:'',
 telefono:'',
 email:'',
 textoPie:'',
 incluirIconosRedes: true,
 adjuntarDossierPorDefecto: true,
 redesSociales: {
 spotify:'',
 youtube:'',
 instagram:'',
 tiktok:'',
 appleMusic:'',
 bandcamp:'',
 website:'',
 whatsapp:'',
 revolut:'',
 paypal:''
 }
 }
};

const UNIFIED_PLATFORMS = [
 { key:'spotify', label:'Spotify', icon:'🟢', placeholder:'https://open.spotify.com/artist/...' },
 { key:'instagram', label:'Instagram', icon:'📸', placeholder:'https://instagram.com/...' },
 { key:'youtube', label:'YouTube', icon:'🔴', placeholder:'https://youtube.com/...' },
 { key:'tiktok', label:'TikTok', icon:'🎵', placeholder:'https://tiktok.com/@...' },
 { key:'appleMusic', label:'Apple Music', icon:'🍎', placeholder:'https://music.apple.com/...' },
 { key:'bandcamp', label:'Bandcamp', icon:'⛺', placeholder:'https://tubanda.bandcamp.com' },
 { key:'website', label:'Sitio Web Oficial', icon:'🌐', placeholder:'https://www.tubanda.com' },
 { key:'facebook', label:'Facebook', icon:'📘', placeholder:'https://facebook.com/...' },
 { key:'twitter', label:'X / Twitter', icon:'🐦', placeholder:'https://x.com/...' }
];

export const EPKManager: React.FC<EPKManagerProps> = ({
 epkConfig,
 songs: songsProp,
 onSave,
 currentUser,
 isPromoPlan: isPromoPlanProp
}) => {
 const isPromoUser = isPromoPlanProp ?? (normalizePlan(currentUser?.plan) ==='promo');
 // App.tsx monta este componente sin pasarle'songs', así que el selector de temas
 // destacados se quedaba siempre vacío y no se podía marcar ninguna canción. Si no llegan
 // por prop, se piden al backend igual que hace RepertorioSetlists.
 const [songsCargadas, setSongsCargadas] = useState<Song[]>([]);
 const [errorSongs, setErrorSongs] = useState<string | null>(null);
 const songs: Song[] = songsProp && songsProp.length > 0 ? songsProp : songsCargadas;

 const activeBandId = currentUser?.band_id ||'';
 const cleanBandId = activeBandId.replace(/^(band|reg)-/,'').toLowerCase();
 const isBakandeya = cleanBandId ==='bakandeya' || (currentUser?.bandName ||'').toLowerCase().includes('bakandeya');
 const baseDefaults = isBakandeya ? DEFAULT_EPK_CONFIG : EMPTY_EPK_CONFIG;

 const { isOpen: isTutorialOpen, openTutorial, closeTutorial } = useModuleTutorial('epk');

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
 logoUrl: epkConfig.logoUrl || prev.logoUrl || (isBakandeya ?'/logo_bakandeya.jpg' :''),
 contactoBooking: mergedContacto,
 enlacesRedes: mergedRedes,
 firmaEmail: mergedFirma
 }));
 }
 }, [epkConfig, isBakandeya]);

 const [savedSuccess, setSavedSuccess] = useState(false);
 const [saveError, setSaveError] = useState<string | null>(null);
 const [copiedPublicUrl, setCopiedPublicUrl] = useState(false);
 const [showFansPreviewModal, setShowFansPreviewModal] = useState(false);
 const [activeBlock, setActiveBlock] = useState<EPKBlockId>('perfil');
 const [saving, setSaving] = useState(false);
 const [previewDonationMethod, setPreviewDonationMethod] = useState<'revolut' |'paypal'>('revolut');

 const healthStats = computeEPKHealth(config);
 const { prev: prevBlockMeta, next: nextBlockMeta } = getBlockNavigation(activeBlock);

 const [isUploadingLogo, setIsUploadingLogo] = useState(false);
 const [isUploadingDossier, setIsUploadingDossier] = useState(false);
 const [isUploadingRider, setIsUploadingRider] = useState(false);
 const [subiendoFotoMiembro, setSubiendoFotoMiembro] = useState<string | null>(null);
 const [subiendoGaleria, setSubiendoGaleria] = useState(false);
 const [traduciendo, setTraduciendo] = useState<string | null>(null);
 const [errorTraduccion, setErrorTraduccion] = useState<string | null>(null);
 const [avisoTraduccion, setAvisoTraduccion] = useState<string | null>(null);

 // El band_id va SIEMPRE en el enlace, también para Bakandeya: es el enlace que los agentes
 // meten en los pitches y que se comparte por QR, así que no debe depender del valor por
 // defecto del servidor para resolver de qué banda es el dossier. Sin banda activa, no hay
 // banda de la que generar un enlace (antes esto generaba, sin querer, un enlace válido al EPK
 // público real de Bakandeya).
 const bandQueryParam = activeBandId ? `?band=${encodeURIComponent(activeBandId)}` :'';
 const rawEpkBase = typeof window !=='undefined' 
 ? (window.location.origin.includes('localhost') || window.location.origin.includes('ais-dev') || window.location.origin.includes('ais-pre') || window.location.origin.includes('run.app')
 ? `${window.location.origin}/epk` 
 :'https://bandmanager.io/epk') 
 :'https://bandmanager.io/epk';
 const publicEpkUrl = `${rawEpkBase}${bandQueryParam}`;

 const handleSave = async () => {
 setSaveError(null);
 setSaving(true);
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
 setSaveError(err?.message ||"No se pudo guardar el dossier. Inténtalo de nuevo.");
 } finally {
 setSaving(false);
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
 const url = await uploadFileToServer(file, { bandId: activeBandId, category:'logo' });
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
 setSaveError(fallbackErr?.message ||"No se pudo subir el logo. Inténtalo de nuevo.");
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
 const url = await uploadFileToServer(file, { bandId: activeBandId, category:'dossier' });
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
 setSaveError(fallbackErr?.message ||"No se pudo subir el dossier. Inténtalo de nuevo.");
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
 const url = await uploadFileToServer(file, { bandId: activeBandId, category:'rider' });
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
 setSaveError(fallbackErr?.message ||"No se pudo subir el rider. Inténtalo de nuevo.");
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
 Array.from(files).map(file => uploadFileToServer(file, { bandId: activeBandId, category:'galeria' }))
 );
 setConfig(prev => ({ ...prev, bandPhotos: [...(prev.bandPhotos || []), ...urls] }));
 } catch (err: any) {
 console.error('Error subiendo fotos de galería:', err);
 setSaveError(err?.message ||'No se pudieron subir una o varias fotos. Inténtalo de nuevo.');
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
 actualizarMiembros([...miembros, { id: `m-${Date.now()}`, nombre:'', rol:'' }]);
 };

 const editarMiembro = (id: string, campos: Partial<BandMember>) => {
 actualizarMiembros(miembros.map(m => (m.id === id ? { ...m, ...campos } : m)));
 };

 const quitarMiembro = (id: string) => actualizarMiembros(miembros.filter(m => m.id !== id));

 const subirFotoMiembro = async (id: string, file: File) => {
 setSubiendoFotoMiembro(id);
 setSaveError(null);
 try {
 const url = await uploadFileToServer(file, { bandId: activeBandId, category:'miembros' });
 editarMiembro(id, { fotoUrl: url });
 } catch (err: any) {
 console.error('Error subiendo foto de miembro:', err);
 setSaveError(err?.message ||'No se pudo subir la foto. Inténtalo de nuevo.');
 } finally {
 setSubiendoFotoMiembro(null);
 }
 };

 // --- Vídeos de directo ---
 const videos: EPKVideo[] = config.videos || [];

 const actualizarVideos = (nuevos: EPKVideo[]) => setConfig({ ...config, videos: nuevos });

 const anadirVideo = () => {
 // El primero que se añade queda destacado por defecto: es el que se ve grande arriba.
 actualizarVideos([...videos, { id: `v-${Date.now()}`, titulo:'', url:'', destacado: videos.length === 0 }]);
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
 datos[campo] = campo ==='numMusicos' ? (valor ==='' ? undefined : Number(valor)) : valor;
 setConfig({ ...config, datosContratacion: datos });
 };

 // --- EPK multiidioma -------------------------------------------------------------------
 // Idiomas a los que se puede traducir (todos menos el original, que es el español).
 const idiomasDestino = EPK_LANGUAGES.filter(l => l.code !== IDIOMA_ORIGEN);

 /**
 * Pide a la IA un borrador de traducción. GASTA TOKENS: una llamada por pulsación. El
 * servidor no vuelve a llamar al modelo si el texto original no ha cambiado desde la última
 * traducción, así que un doble clic no cuesta nada.
 */
 const traducirConIA = async (idioma: string) => {
 setTraduciendo(idioma);
 setErrorTraduccion(null);
 setAvisoTraduccion(null);
 try {
 // Se guarda primero: el servidor traduce lo que hay guardado, no lo que tienes en
 // pantalla sin guardar. Sin esto, traducir justo después de reescribir la biografía
 // devolvía la traducción del texto viejo.
 await api.updateEpkConfig({ ...config, bandId: activeBandId });
 const res = await api.traducirEpk({ idioma, bandId: activeBandId });
 setConfig(prev => ({
 ...prev,
 traducciones: { ...(prev.traducciones || {}), [idioma]: res.traduccion }
 }));
 if (res.yaEstabaAlDia) {
 setAvisoTraduccion(res.mensaje ||'La traducción ya estaba al día: no se ha gastado ninguna llamada a la IA.');
 }
 } catch (err: any) {
 setErrorTraduccion(err?.message ||'No se pudo traducir el EPK.');
 } finally {
 setTraduciendo(null);
 }
 };

 /** Edición a mano de la traducción. Marca _revisadoAMano para saber que ya pasó por un humano. */
 const editarTraduccion = (idioma: string, campo:'biografia' |'textoPie' |'riderTecnico', valor: string) => {
 setConfig(prev => ({
 ...prev,
 traducciones: {
 ...(prev.traducciones || {}),
 [idioma]: { ...(prev.traducciones?.[idioma] || {}), [campo]: valor, _revisadoAMano: true }
 }
 }));
 };

 const editarTraduccionMiembro = (idioma: string, miembroId: string, campo:'rol' |'bio', valor: string) => {
 setConfig(prev => {
 const traduccion = prev.traducciones?.[idioma] || {};
 const miembrosTraducidos = { ...(traduccion.miembros || {}) };
 miembrosTraducidos[miembroId] = { ...(miembrosTraducidos[miembroId] || {}), [campo]: valor };
 return {
 ...prev,
 traducciones: {
 ...(prev.traducciones || {}),
 [idioma]: { ...traduccion, miembros: miembrosTraducidos, _revisadoAMano: true }
 }
 };
 });
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
 <div data-modulo="epk" className="space-y-3.5 sm:space-y-6">
 {/* HEADER MODULARIZADO */}
 <EPKHeader
 activeBlock={activeBlock}
 onSelectBlock={setActiveBlock}
 publicEpkUrl={publicEpkUrl}
 copiedPublicUrl={copiedPublicUrl}
 onCopyUrl={handleCopyUrl}
 onSave={handleSave}
 health={healthStats}
 isPromoPlan={isPromoUser}
 onOpenTutorial={openTutorial}
 />

 {savedSuccess && (
 <div className="p-3 sm:p-4 bg-[var(--ok-soft)] text-[var(--ok)] text-xs sm:text-sm font-semibold rounded-[var(--r-m)] flex items-center gap-2">
 <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--ok)] shrink-0" />
 <span>¡Información del dossier y kit de prensa guardada y sincronizada correctamente!</span>
 </div>
 )}

 {saveError && (
 <div className="p-3 sm:p-4 bg-[var(--alert-soft)] text-[var(--alert)] text-xs sm:text-sm font-semibold rounded-[var(--r-m)] flex items-center gap-2">
 <AlertCircle className="w-4 h-4 text-[var(--alert)] shrink-0" />
 <span>{saveError}</span>
 </div>
 )}

 {/* BLOQUES MODULARES DEL DOSSIER */}
 <div className="space-y-4 sm:space-y-6">
 
 {(activeBlock ==='plantillas' || activeBlock ==='todos') && (
 <EPKPlantillasBlock
 config={config}
 onChange={(updated) => setConfig(prev => ({ ...prev, ...updated }))}
 publicEpkUrl={publicEpkUrl}
 prevBlock={prevBlockMeta}
 nextBlock={nextBlockMeta}
 onNavigate={setActiveBlock}
 onSave={handleSave}
 isAllView={activeBlock ==='todos'}
 />
 )}

 {(activeBlock ==='perfil' || activeBlock ==='todos') && (
 <EPKPerfilBlock
 config={config}
 setConfig={setConfig}
 miembros={miembros}
 anadirMiembro={anadirMiembro}
 editarMiembro={editarMiembro}
 quitarMiembro={quitarMiembro}
 subiendoFotoMiembro={subiendoFotoMiembro}
 subirFotoMiembro={subirFotoMiembro}
 unifiedPlatforms={UNIFIED_PLATFORMS}
 prevBlock={prevBlockMeta}
 nextBlock={nextBlockMeta}
 onNavigate={setActiveBlock}
 onSave={handleSave}
 isAllView={activeBlock ==='todos'}
 />
 )}

 {(activeBlock ==='archivos' || activeBlock ==='todos') && (
 <EPKArchivosBlock
 config={config}
 setConfig={setConfig}
 isBakandeya={isBakandeya}
 isUploadingLogo={isUploadingLogo}
 handleLogoUpload={handleLogoUpload}
 subiendoGaleria={subiendoGaleria}
 subirFotosGaleria={subirFotosGaleria}
 quitarFotoGaleria={quitarFotoGaleria}
 isUploadingDossier={isUploadingDossier}
 handleDossierUpload={handleDossierUpload}
 isUploadingRider={isUploadingRider}
 handleRiderUpload={handleRiderUpload}
 prevBlock={prevBlockMeta}
 nextBlock={nextBlockMeta}
 onNavigate={setActiveBlock}
 onSave={handleSave}
 isAllView={activeBlock ==='todos'}
 />
 )}

 {(activeBlock ==='musica' || activeBlock ==='todos') && (
 <EPKMusicaBlock
 config={config}
 setConfig={setConfig}
 songs={songs}
 isPromoUser={isPromoUser}
 currentUser={currentUser}
 videos={videos}
 anadirVideo={anadirVideo}
 editarVideo={editarVideo}
 quitarVideo={quitarVideo}
 destacarVideo={destacarVideo}
 editarDatoContratacion={editarDatoContratacion}
 prevBlock={prevBlockMeta}
 nextBlock={nextBlockMeta}
 onNavigate={setActiveBlock}
 onSave={handleSave}
 isAllView={activeBlock ==='todos'}
 />
 )}

 {(activeBlock ==='prensa' || activeBlock ==='todos') && (
 <EPKPrensaBlock
 config={config}
 setConfig={setConfig}
 prevBlock={prevBlockMeta}
 nextBlock={nextBlockMeta}
 onNavigate={setActiveBlock}
 onSave={handleSave}
 isAllView={activeBlock ==='todos'}
 />
 )}

 {(activeBlock ==='donaciones' || activeBlock ==='todos') && (
 <EPKDonacionesBlock
 config={config}
 setConfig={setConfig}
 setShowFansPreviewModal={setShowFansPreviewModal}
 idiomasDestino={idiomasDestino}
 traduciendo={traduciendo}
 traducirConIA={traducirConIA}
 editarTraduccion={editarTraduccion}
 editarTraduccionMiembro={editarTraduccionMiembro}
 errorTraduccion={errorTraduccion}
 avisoTraduccion={avisoTraduccion}
 publicEpkUrl={publicEpkUrl}
 miembros={miembros}
 prevBlock={prevBlockMeta}
 nextBlock={nextBlockMeta}
 onNavigate={setActiveBlock}
 onSave={handleSave}
 isAllView={activeBlock ==='todos'}
 />
 )}

 {(activeBlock ==='firma' || activeBlock ==='qr' || activeBlock ==='todos') && (
 <EPKFirmaQRBlock
 config={config}
 setConfig={setConfig}
 publicEpkUrl={publicEpkUrl}
 isBakandeya={isBakandeya}
 handleCopyUrl={handleCopyUrl}
 copiado={copiedPublicUrl}
 onNavigateToBlock={setActiveBlock}
 prevBlock={prevBlockMeta}
 nextBlock={nextBlockMeta}
 onNavigate={setActiveBlock}
 onSave={handleSave}
 isAllView={activeBlock ==='todos'}
 />
 )}
 </div>


 {/* Modal Simulador / Vista Previa In-App del Formulario Únete */}
 <FansLandingPreviewModal
 isOpen={showFansPreviewModal}
 onClose={() => setShowFansPreviewModal(false)}
 currentBandId={activeBandId}
 currentBandName={(currentUser?.bandName && currentUser.bandName !=='Banda' ? currentUser.bandName :'') || (config.contactoBooking?.nombre && config.contactoBooking.nombre !=='Banda' ? config.contactoBooking.nombre :'') || (isBakandeya ?'Bakandeya' : (cleanBandId ? cleanBandId.charAt(0).toUpperCase() + cleanBandId.slice(1) :'Tu Banda'))}
 currentBandLogo={config.logoUrl}
 epkConfig={config}
 />

 {/* Tutorial Interactivo Paso a Paso */}
 <ModuleTutorialModal
 moduleId="epk"
 isOpen={isTutorialOpen}
 onClose={closeTutorial}
 />
 </div>
 );
};

export default EPKManager;
