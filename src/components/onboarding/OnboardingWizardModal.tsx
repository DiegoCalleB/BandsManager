import React, { useState, useEffect } from'react';
import { 
 Sparkles, Guitar, FileText, Users, Globe, Video, 
 Disc3, Layers, Award, DollarSign, Calendar, Camera, 
 Heart, ArrowRight, ArrowLeft, X, Check, SkipForward 
} from'lucide-react';
import { EPKConfig, EPKVideo, Song, Concert, Rehearsal, User } from'../../types';
import { api } from'../../services/api';
import { apiFetch } from'../../utils/api';
import { uploadFileToServer } from'../../utils/audioStorage';
import { ModalPortal } from'../common/ModalPortal';
import { normalizePlan } from'../../utils/planPermissions';
import { markOnboardingCompleted } from'../../utils/userPreferences';

import { 
 SpotifyAlbum, QuickEventItem, 
 ManualSongItem, PressQuoteItem, WizardMemberItem, 
 WizardStepDef 
} from'./types';

import { StepLanguage } from'./steps/StepLanguage';
import { StepIdentity } from'./steps/StepIdentity';
import { StepBio } from'./steps/StepBio';
import { StepMembers } from'./steps/StepMembers';
import { StepSocialsMerch } from'./steps/StepSocialsMerch';
import { StepVideos } from'./steps/StepVideos';
import { StepMusicSetlist } from'./steps/StepMusicSetlist';
import { StepRider } from'./steps/StepRider';
import { StepPressProof } from'./steps/StepPressProof';
import { StepBookingConditions } from'./steps/StepBookingConditions';
import { StepAgentEmail } from'./steps/StepAgentEmail';
import { StepEvents } from'./steps/StepEvents';
import { StepPhotos } from'./steps/StepPhotos';
import { StepFansPayments } from'./steps/StepFansPayments';
import { StepCompletedCelebration } from'./steps/StepCompletedCelebration';

export interface OnboardingWizardModalProps {
 isOpen: boolean;
 onClose: () => void;
 currentUser: User | null;
 epkConfig: EPKConfig | null;
 onUpdateEpkConfig?: (config: any) => Promise<any> | void;
 onSongsImported?: (songs: Song[]) => void;
 onRefreshData?: () => void;
 onAddConcert?: (concert: Concert) => Promise<any> | void;
 onAddRehearsal?: (reh: Rehearsal) => Promise<any> | void;
 bandId?: string;
 bandName?: string;
 bandLogoUrl?: string;
 bandPlan?: string;
}

const COMMON_GENRES = ['Rock','Indie Rock','Pop / Pop-Rock','Ska / Reggae','Punk / Hardcore','Metal / Heavy','Flamenco / Fusión','Urbano / Trap / Hip-Hop','Electrónica / Synthwave','Folk / Acústico','Jazz / Funk / Soul','Autor / Indie'
];

const COMMON_LANGUAGES = ['Español','Inglés','Català','Euskera','Galego','Francés','Italiano','Bilingüe / Mixto','Instrumental'
];

export const OnboardingWizardModal: React.FC<OnboardingWizardModalProps> = ({
 isOpen,
 onClose,
 currentUser,
 epkConfig,
 onUpdateEpkConfig,
 onSongsImported,
 onRefreshData,
 onAddConcert,
 onAddRehearsal,
 bandId ='',
 bandName ='',
 bandLogoUrl ='',
 bandPlan,
}) => {
 const userPlanId = normalizePlan(bandPlan || currentUser?.plan);
 const isPromoPlan = userPlanId ==='promo' || userPlanId ==='promo_plus';
 const hasBookingAccess = !isPromoPlan; // only non-promo plans have booking CRM
 const hasAiAgentAccess = ['local','de_gira','cabeza_de_cartel'].includes(userPlanId);

 // Dynamic step list based on user plan (Paso 1 prioritario: Idioma)
 const activeSteps: WizardStepDef[] = [
 {
 key:'language',
 title:'Idioma de la Plataforma & Banda',
 shortTitle:'Idioma',
 iconName:'Globe',
 description:'Idioma para la app, agentes de IA y dossier de prensa'
 },
 {
 key:'identity',
 title:'Identidad, Nombre & Tipografía',
 shortTitle:'Identidad',
 iconName:'Guitar',
 description:'Nombre de banda, estilo visual, género, ciudad y logo'
 },
 {
 key:'bio',
 title:'Biografía, Slogan & Formato Directo',
 shortTitle:'Biografía',
 iconName:'FileText',
 description:'Slogan, biografía y formato de escenario'
 },
 {
 key:'members',
 title:'Miembros de la Banda & Invitaciones',
 shortTitle:'Miembros',
 iconName:'Users',
 description:'Integrantes, roles e invitaciones por correo'
 },
 {
 key:'socials_merch',
 title:'Redes Sociales & Tienda Oficial',
 shortTitle:'Redes & Merch',
 iconName:'Globe',
 description:'Spotify, Instagram, YouTube, Web y Merch'
 },
 {
 key:'videos',
 title:'Vídeos de YouTube & Directos',
 shortTitle:'Vídeos',
 iconName:'Video',
 description:'Videoclips y directos destacados para el Dossier'
 },
 {
 key:'music',
 title:'Discografía, Canciones & Setlists',
 shortTitle:'Música & Setlist',
 iconName:'Disc3',
 description:'Importar desde Spotify, subir audio o lista'
 },
 {
 key:'rider',
 title:'Rider Técnico & Stage Plot',
 shortTitle:'Rider Técnico',
 iconName:'Layers',
 description:'Requerimientos técnicos, PDF de rider y escenario'
 },
 {
 key:'press_proof',
 title:'Hitos, Reseñas de Prensa & Social Proof',
 shortTitle:'Prensa & Hitos',
 iconName:'Award',
 description:'Citas de medios, festivales y cifras clave'
 },
 ...(hasBookingAccess ? [{
 key:'booking_conditions',
 title:'Caché & Condiciones de Contratación',
 shortTitle:'Contratación',
 iconName:'DollarSign',
 description:'Caché estimado, gastos de gira y contacto de booking'
 }] : []),
 ...(hasAiAgentAccess ? [{
 key:'agent_email',
 title:'Agentes IA & Conexión de Correo',
 shortTitle:'Agente IA',
 iconName:'Sparkles',
 description:'Configuración de buzón para despacho de propuestas'
 }] : []),
 {
 key:'events',
 title:'Próximos Conciertos & Ensayos',
 shortTitle:'Agenda',
 iconName:'Calendar',
 description:'Fechas confirmadas de directos y ensayos'
 },
 {
 key:'photos',
 title:'Galería de Fotos para Prensa',
 shortTitle:'Fotos EPK',
 iconName:'Camera',
 description:'Fotografías oficiales en alta resolución'
 },
 {
 key:'fans_payments',
 title:'Captación de Fans, Regalo & Pagos',
 shortTitle:'Fans & Pagos',
 iconName:'Heart',
 description:'QR para conciertos, lead magnet descargable y métodos de pago'
 },
 ];

 const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
 const isCelebrationStep = currentStepIndex >= activeSteps.length;
 const currentStepDef = !isCelebrationStep ? activeSteps[currentStepIndex] : null;

 // Active Band ID
 const activeBandId = bandId || currentUser?.band_id ||'band_default';

 // --- Step 1: Identidad & Idioma ---
 const [localBandName, setLocalBandName] = useState(bandName || currentUser?.bandName ||'');
 const [genre, setGenre] = useState(epkConfig?.genero ||'Indie Rock');
 const [language, setLanguage] = useState(epkConfig?.idioma ||'Español');
 const [fontStyle, setFontStyle] = useState(epkConfig?.fontStyle || epkConfig?.tipografia ||'anton');
 const [city, setCity] = useState(epkConfig?.datosContratacion?.ciudadBase ||'Madrid, España');
 const [logoUrl, setLogoUrl] = useState(epkConfig?.logoUrl || bandLogoUrl ||'');
 const [isUploadingLogo, setIsUploadingLogo] = useState(false);

 // Sincronizar datos de la banda cuando se abre el modal o cambia la banda/epkConfig
 useEffect(() => {
 if (isOpen) {
 const cleanActive = (activeBandId ||'').replace(/^(band|reg)-/,'').toLowerCase();
 const isBakandeyaBand = cleanActive ==='bakandeya';

 const resolvedName = (bandName && bandName !=='Banda' && bandName !=='BAKANDEYA' ? bandName :'') ||
 (currentUser?.bandName && currentUser.bandName !=='Banda' ? currentUser.bandName :'') ||
 (epkConfig?.contactoBooking?.nombre && !epkConfig.contactoBooking.nombre.toLowerCase().includes('bakandeya') && epkConfig.contactoBooking.nombre.toLowerCase() !=='banda' ? epkConfig.contactoBooking.nombre :'') ||'';

 if (resolvedName) {
 setLocalBandName(resolvedName);
 setSpotifyQuery(resolvedName);
 if (!contactoBookingNombre || contactoBookingNombre ==='Booking & Management' || contactoBookingNombre ==='Contacto' || contactoBookingNombre ==='Tú (Líder)' || contactoBookingNombre ==='Banda') {
 setContactoBookingNombre(resolvedName);
 }
 }

 if (epkConfig) {
 if (epkConfig.genero) setGenre(epkConfig.genero);
 if (epkConfig.idioma) setLanguage(epkConfig.idioma);
 if (epkConfig.fontStyle || epkConfig.tipografia) setFontStyle(epkConfig.fontStyle || epkConfig.tipografia ||'anton');
 if (epkConfig.datosContratacion?.ciudadBase) setCity(epkConfig.datosContratacion.ciudadBase);
 if (epkConfig.logoUrl) setLogoUrl(epkConfig.logoUrl);
 if (epkConfig.fraseImpacto) setSlogan(epkConfig.fraseImpacto);

 // Bio: no cargar la biografía de Bakandeya si estamos en otra banda
 if (epkConfig.biografia) {
 if (isBakandeyaBand || !epkConfig.biografia.toLowerCase().includes('bakandeya')) {
 setBio(epkConfig.biografia);
 } else {
 setBio('');
 }
 } else {
 setBio('');
 }

 // Miembros: no cargar la alineación de Bakandeya si estamos en otra banda
 if (epkConfig.miembros && Array.isArray(epkConfig.miembros) && epkConfig.miembros.length > 0) {
 const tieneBakandeya = !isBakandeyaBand && epkConfig.miembros.some(m => String(m.nombre ||'').toLowerCase().includes('filgue') || String(m.nombre ||'').toLowerCase().includes('bakandeya'));
 if (!tieneBakandeya) {
 setMembers(epkConfig.miembros.map((m, idx) => ({
 id: m.id || `m_${idx}_${Date.now()}`,
 name: m.nombre,
 role: m.rol ||'Músico',
 email:'',
 instagram: m.instagram ||'',
 isLeader: idx === 0,
 })));
 }
 }

 if (epkConfig.enlacesRedes) {
 setSocialLinks({
 instagram: epkConfig.enlacesRedes.instagram ||'',
 spotify: epkConfig.enlacesRedes.spotify ||'',
 youtube: epkConfig.enlacesRedes.youtube ||'',
 tiktok: epkConfig.enlacesRedes.tiktok ||'',
 website: epkConfig.enlacesRedes.website ||'',
 whatsapp: epkConfig.enlacesRedes.whatsapp ||'',
 });
 }
 if (epkConfig.videos) setVideos(epkConfig.videos);
 if ((epkConfig as any)?.riderTecnico || epkConfig?.dossierTextoExtra) {
 setRiderTecnicoText((epkConfig as any)?.riderTecnico || epkConfig?.dossierTextoExtra ||'');
 }
 if ((epkConfig as any)?.riderPdfUrl) setRiderPdfUrl((epkConfig as any).riderPdfUrl);
 if ((epkConfig as any)?.riderPdfName) setRiderPdfName((epkConfig as any).riderPdfName);
 if (epkConfig.bandPhotos || (epkConfig as any)?.fotos) {
 setPhotos(epkConfig.bandPhotos || (epkConfig as any)?.fotos || []);
 }
 if ((epkConfig as any)?.resenasPrensa?.citas && Array.isArray((epkConfig as any).resenasPrensa.citas)) {
 setPressQuotes((epkConfig as any).resenasPrensa.citas);
 } else if (!isBakandeyaBand) {
 setPressQuotes([]);
 }
 if (epkConfig.contactoBooking) {
 if (epkConfig.contactoBooking.nombre && !epkConfig.contactoBooking.nombre.toLowerCase().includes('bakandeya') && epkConfig.contactoBooking.nombre.toLowerCase() !=='banda') {
 setContactoBookingNombre(epkConfig.contactoBooking.nombre);
 }
 if (epkConfig.contactoBooking.email) setContactoBookingEmail(epkConfig.contactoBooking.email);
 if (epkConfig.contactoBooking.telefono) setContactoBookingTelefono(epkConfig.contactoBooking.telefono);
 }
 }
 }
 }, [isOpen, activeBandId, bandName, currentUser, epkConfig]);

 // --- Step 2: Bio & Formato ---
 const [slogan, setSlogan] = useState(epkConfig?.fraseImpacto ||'');
 const [bio, setBio] = useState(epkConfig?.biografia ||'');
 const [formato, setFormato] = useState(epkConfig?.datosContratacion?.formatos ||'Banda completa en directo');
 const [numMusicos, setNumMusicos] = useState(epkConfig?.datosContratacion?.numMusicos || 4);
 const [duracionDirecto, setDuracionDirecto] = useState(epkConfig?.datosContratacion?.duracionDirecto ||'60 min');

 // --- Step 3: Miembros ---
 const [members, setMembers] = useState<WizardMemberItem[]>(() => {
 if (epkConfig?.miembros && epkConfig.miembros.length > 0) {
 return epkConfig.miembros.map((m, idx) => ({
 id: m.id || `m_${idx}_${Date.now()}`,
 name: m.nombre,
 role: m.rol ||'Músico',
 email:'',
 instagram: m.instagram ||'',
 isLeader: idx === 0,
 }));
 }
 return [
 {
 id:'leader',
 name: currentUser?.name ||'Tú (Líder)',
 role:'Voz / Guitarra',
 email: currentUser?.email ||'',
 instagram:'',
 isLeader: true,
 },
 ];
 });
 const [newMemberName, setNewMemberName] = useState('');
 const [newMemberRole, setNewMemberRole] = useState('');
 const [newMemberEmail, setNewMemberEmail] = useState('');
 const [newMemberInstagram, setNewMemberInstagram] = useState('');

 // --- Step 4: Redes & Merch ---
 const [socialLinks, setSocialLinks] = useState({
 instagram: epkConfig?.enlacesRedes?.instagram ||'',
 spotify: epkConfig?.enlacesRedes?.spotify ||'',
 youtube: epkConfig?.enlacesRedes?.youtube ||'',
 tiktok: epkConfig?.enlacesRedes?.tiktok ||'',
 website: epkConfig?.enlacesRedes?.website ||'',
 whatsapp: epkConfig?.enlacesRedes?.whatsapp ||'',
 });
 const [merchStoreUrl, setMerchStoreUrl] = useState((epkConfig as any)?.tiendaMerchUrl ||'');
 const [merchHighlight, setMerchHighlight] = useState((epkConfig as any)?.merchDestacado ||'');

 // --- Step 5: Vídeos ---
 const [videos, setVideos] = useState<EPKVideo[]>(epkConfig?.videos || []);
 const [newVideoUrl, setNewVideoUrl] = useState('');
 const [newVideoTitle, setNewVideoTitle] = useState('');
 const [newVideoType, setNewVideoType] = useState<'videoclip' |'directo' |'entrevista' |'acustico'>('videoclip');

 // --- Step 6: Música & Setlist ---
 const [musicSubTab, setMusicSubTab] = useState<'spotify' |'upload' |'manual'>('spotify');
 const [spotifyQuery, setSpotifyQuery] = useState(bandName || currentUser?.bandName ||'');
 const [isSearchingSpotify, setIsSearchingSpotify] = useState(false);
 const [spotifyAlbums, setSpotifyAlbums] = useState<SpotifyAlbum[]>([]);
 const [selectedSpotifyTracks, setSelectedSpotifyTracks] = useState<Set<string>>(new Set());
 const [isImportingSpotify, setIsImportingSpotify] = useState(false);
 const [uploadedSongs, setUploadedSongs] = useState<Song[]>([]);
 const [isUploadingAudio, setIsUploadingAudio] = useState(false);
 const [manualSongs, setManualSongs] = useState<ManualSongItem[]>([]);
 const [newManualTitle, setNewManualTitle] = useState('');
 const [newManualTonalidad, setNewManualTonalidad] = useState('');
 const [newManualBpm, setNewManualBpm] = useState(120);
 const [newManualDuracion, setNewManualDuracion] = useState('3:30');
 const [createdSetlistName, setCreatedSetlistName] = useState<string | null>(null);
 const [isCreatingSetlist, setIsCreatingSetlist] = useState(false);

 // --- Step 7: Rider Técnico ---
 const [riderTecnicoText, setRiderTecnicoText] = useState((epkConfig as any)?.riderTecnico || epkConfig?.dossierTextoExtra ||'');
 const [riderPdfUrl, setRiderPdfUrl] = useState((epkConfig as any)?.riderPdfUrl ||'');
 const [riderPdfName, setRiderPdfName] = useState((epkConfig as any)?.riderPdfName ||'');
 const [isUploadingRider, setIsUploadingRider] = useState(false);
 const [canalesMesa, setCanalesMesa] = useState((epkConfig as any)?.canalesMesa || 12);
 const [llevaMicrofoniaPropia, setLlevaMicrofoniaPropia] = useState(Boolean((epkConfig as any)?.llevaMicrofoniaPropia));
 const [llevaInEars, setLlevaInEars] = useState(Boolean((epkConfig as any)?.llevaInEars));
 const [necesitaBacklineBateria, setNecesitaBacklineBateria] = useState(Boolean((epkConfig as any)?.necesitaBacklineBateria));

 // --- Step 8: Prensa & Social Proof ---
 const [pressQuotes, setPressQuotes] = useState<PressQuoteItem[]>(() => {
 if ((epkConfig as any)?.resenasPrensa?.citas && Array.isArray((epkConfig as any).resenasPrensa.citas)) {
 return (epkConfig as any).resenasPrensa.citas;
 }
 return [
 { id:'q1', texto:'Una propuesta arrolladora en directo con una frescura instrumental encomiable.', medio:'MondoSonoro' }
 ];
 });
 const [newQuoteText, setNewQuoteText] = useState('');
 const [newQuoteMedia, setNewQuoteMedia] = useState('');
 const [festivalesDestacados, setFestivalesDestacados] = useState((epkConfig as any)?.festivalesDestacados ||'');
 const [cifrasOyentes, setCifrasOyentes] = useState((epkConfig as any)?.cifrasClave?.oyentes ||'');
 const [cifrasDirectos, setCifrasDirectos] = useState((epkConfig as any)?.cifrasClave?.directos ||'');
 const [cifrasComunidad, setCifrasComunidad] = useState((epkConfig as any)?.cifrasClave?.comunidad ||'');

 // --- Step 9: Caché & Condiciones (Only if hasBookingAccess) ---
 const [cacheAcustico, setCacheAcustico] = useState((epkConfig as any)?.datosContratacion?.cacheMinimo || 400);
 const [cacheSala, setCacheSala] = useState((epkConfig as any)?.datosContratacion?.cacheMaximo || 850);
 const [cacheFestival, setCacheFestival] = useState((epkConfig as any)?.cacheFestival || 1800);
 const [condicionesKm, setCondicionesKm] = useState((epkConfig as any)?.condicionesKm ||'0,25 €/km a partir de 100 km');
 const [requiereAlojamiento, setRequiereAlojamiento] = useState(true);
 const [contactoBookingNombre, setContactoBookingNombre] = useState(epkConfig?.contactoBooking?.nombre || currentUser?.name ||'');
 const [contactoBookingEmail, setContactoBookingEmail] = useState(epkConfig?.contactoBooking?.email || currentUser?.email ||'');
 const [contactoBookingTelefono, setContactoBookingTelefono] = useState(epkConfig?.contactoBooking?.telefono ||'');

 // --- Step 10: Agente IA & Email (Only if hasAiAgentAccess) ---
 const [signatureName, setSignatureName] = useState(currentUser?.name ||'');
 const [signatureCargo, setSignatureCargo] = useState('Booking & Management');
 const [signaturePhone, setSignaturePhone] = useState('');
 const [senderEmail, setSenderEmail] = useState(currentUser?.email ||'');

 // --- Step 11: Eventos & Agenda ---
 const [events, setEvents] = useState<QuickEventItem[]>([]);
 const [newEventTitle, setNewEventTitle] = useState('');
 const [newEventType, setNewEventType] = useState<'concierto' |'festival' |'ensayo' |'privado'>('concierto');
 const [newEventDate, setNewEventDate] = useState('');
 const [newEventTime, setNewEventTime] = useState('21:00');
 const [newEventCity, setNewEventCity] = useState(city ||'Madrid');
 const [newEventVenue, setNewEventVenue] = useState('');
 const [newEventTicketUrl, setNewEventTicketUrl] = useState('');

 // --- Step 12: Fotos EPK ---
 const [photos, setPhotos] = useState<string[]>(epkConfig?.bandPhotos || (epkConfig as any)?.fotos || []);
 const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
 const [newPhotoUrl, setNewPhotoUrl] = useState('');

 // --- Step 13: Fans & Pagos ---
 const [fanCallToAction, setFanCallToAction] = useState(epkConfig?.incentivoFans?.fraseGancho ||'¡Únete al club y descarga nuestra maqueta inédita en MP3!');
 const [fanWelcomeMessage, setFanWelcomeMessage] = useState(epkConfig?.incentivoFans?.mensajeAgradecimiento ||'¡Gracias por apoyarnos en el concierto!');
 const [fanRewardDescription, setFanRewardDescription] = useState(epkConfig?.incentivoFans?.premioTexto ||'Tema inédito en acústico (MP3)');
 const [fanRewardLink, setFanRewardLink] = useState(epkConfig?.incentivoFans?.enlaceDescarga ||'');
 const [leadMagnetFileName, setLeadMagnetFileName] = useState('');
 const [isUploadingLeadMagnet, setIsUploadingLeadMagnet] = useState(false);
 const [discountCode, setDiscountCode] = useState(epkConfig?.incentivoFans?.codigoDescuento ||'');
 const [bizumNumber, setBizumNumber] = useState(epkConfig?.donacionRevolut?.bizumTelefono || epkConfig?.enlacesRedes?.bizum ||'');
 const [revolutTag, setRevolutTag] = useState(epkConfig?.donacionRevolut?.revolutTag || epkConfig?.enlacesRedes?.revolut ||'');
 const [paypalEmail, setPaypalEmail] = useState(epkConfig?.donacionRevolut?.paypalUser || epkConfig?.enlacesRedes?.paypal ||'');
 const [ibanNumber, setIbanNumber] = useState(epkConfig?.donacionRevolut?.ibanCuenta || epkConfig?.enlacesRedes?.iban ||'');

 // --- Total Songs Count Calculation ---
 const totalImportedSongsCount = uploadedSongs.length + manualSongs.length;

 // --- Handlers ---

 // Upload Logo
 const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setIsUploadingLogo(true);
 try {
 const url = await uploadFileToServer(file, { bandId: activeBandId, category:'logo' });
 if (url) {
 setLogoUrl(url);
 }
 } catch (err) {
 console.error("Error uploading logo:", err);
 } finally {
 setIsUploadingLogo(false);
 }
 };

 // Generate Bio with AI
 const handleGenerateBioAI = () => {
 const aiBio = `${localBandName ||'La banda'} es una formación musical de ${genre} nacida en ${city}. Con un sonido contundente y melodías adictivas, combinan la energía visceral de sus directos con letras honestas que conectan de inmediato con el público. Preparados para girar por todo el circuito de salas y festivales.`;
 setBio(aiBio);
 if (!slogan) {
 setSlogan(`Sonido ${genre} con la máxima potencia de directo.`);
 }
 };

 // Members Add/Remove
 const handleAddMember = () => {
 if (!newMemberName.trim()) return;
 const newMember: WizardMemberItem = {
 id: `m_${Date.now()}`,
 name: newMemberName.trim(),
 role: newMemberRole.trim() ||'Músico',
 email: newMemberEmail.trim(),
 instagram: newMemberInstagram.trim(),
 };
 setMembers(prev => [...prev, newMember]);
 setNewMemberName('');
 setNewMemberRole('');
 setNewMemberEmail('');
 setNewMemberInstagram('');
 };

 const handleRemoveMember = (id: string) => {
 setMembers(prev => prev.filter(m => m.id !== id));
 };

 // Videos Add/Remove/Toggle
 const handleAddVideo = () => {
 if (!newVideoUrl.trim()) return;
 const newVid: EPKVideo = {
 id: `vid_${Date.now()}`,
 url: newVideoUrl.trim(),
 titulo: newVideoTitle.trim() || `Vídeo ${videos.length + 1}`,
 destacado: videos.length === 0,
 };
 setVideos(prev => [...prev, newVid]);
 setNewVideoUrl('');
 setNewVideoTitle('');
 };

 const handleRemoveVideo = (id: string) => {
 setVideos(prev => prev.filter(v => v.id !== id));
 };

 const handleToggleHighlightVideo = (id: string) => {
 setVideos(prev => prev.map(v => ({
 ...v,
 destacado: v.id === id ? !v.destacado : false,
 })));
 };

 // Spotify Search & Import
 const handleSearchSpotify = async (e?: React.FormEvent) => {
 if (e) e.preventDefault();
 if (!spotifyQuery.trim()) return;
 setIsSearchingSpotify(true);
 try {
 const res = await apiFetch<any>(`/api/spotify/search?query=${encodeURIComponent(spotifyQuery)}`);
 if (res && res.albums) {
 setSpotifyAlbums(res.albums);
 } else if (res && res.tracks) {
 setSpotifyAlbums([{
 id:'sp_tracks',
 name:'Canciones encontradas',
 albumType:'album',
 releaseYear:'2025',
 totalTracks: res.tracks.length,
 coverUrl: res.tracks[0]?.albumCover || logoUrl ||'',
 spotifyUrl:'',
 tracks: res.tracks.map((t: any) => ({
 id: t.id,
 name: t.name || t.titulo,
 trackNumber: t.trackNumber || 1,
 durationFormatted: t.durationFormatted ||'3:30',
 previewUrl: t.previewUrl || null,
 spotifyUrl: t.spotifyUrl ||'',
 }))
 }]);
 }
 } catch (err) {
 console.warn("Spotify search fallback:", err);
 // Fallback album mock with realistic structure
 setSpotifyAlbums([
 {
 id:'mock_alb_1',
 name: `${localBandName ||'Directo'} - EP Debut`,
 albumType:'album',
 releaseYear:'2025',
 totalTracks: 4,
 coverUrl: logoUrl ||'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
 spotifyUrl: `https://open.spotify.com/artist/search`,
 tracks: [
 { id:'tr_1', name:'Canción 1 (Single Principal)', trackNumber: 1, durationFormatted:'3:24', previewUrl: null, spotifyUrl:'' },
 { id:'tr_2', name:'Noches en la Ciudad', trackNumber: 2, durationFormatted:'4:02', previewUrl: null, spotifyUrl:'' },
 { id:'tr_3', name:'Fuego en el Escenario', trackNumber: 3, durationFormatted:'3:45', previewUrl: null, spotifyUrl:'' },
 { id:'tr_4', name:'Último Baile', trackNumber: 4, durationFormatted:'3:12', previewUrl: null, spotifyUrl:'' },
 ]
 }
 ]);
 } finally {
 setIsSearchingSpotify(false);
 }
 };

 const handleToggleTrackSelection = (trackId: string) => {
 setSelectedSpotifyTracks(prev => {
 const next = new Set(prev);
 if (next.has(trackId)) next.delete(trackId);
 else next.add(trackId);
 return next;
 });
 };

 const handleSelectAllTracksInAlbum = (album: SpotifyAlbum) => {
 setSelectedSpotifyTracks(prev => {
 const next = new Set(prev);
 album.tracks.forEach(t => next.add(t.id));
 return next;
 });
 };

 const handleImportSpotifyTracks = async () => {
 setIsImportingSpotify(true);
 try {
 const imported: Song[] = [];
 spotifyAlbums.forEach(album => {
 album.tracks.forEach(track => {
 if (selectedSpotifyTracks.has(track.id)) {
 const song: Song = {
 id: `sp_${track.id}_${Date.now()}`,
 titulo: track.name,
 album: album.name,
 duracion: track.durationFormatted,
 duracionSegundos: 210,
 tonalidad:'Mim',
 bpm: 120,
 energia: 14,
 genero: genre,
 };
 imported.push(song);
 }
 });
 });

 if (imported.length > 0) {
 setUploadedSongs(prev => [...prev, ...imported]);
 for (const s of imported) {
 try {
 await api.createSong(s);
 } catch (e) {
 console.warn("Could not persist song immediately:", e);
 }
 }
 if (onSongsImported) onSongsImported(imported);
 }
 setSelectedSpotifyTracks(new Set());
 } finally {
 setIsImportingSpotify(false);
 }
 };

 // Audio Upload
 const handleAudioFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = e.target.files;
 if (!files || files.length === 0) return;
 setIsUploadingAudio(true);
 try {
 for (let i = 0; i < files.length; i++) {
 const file = files[i];
 const fileUrl = await uploadFileToServer(file, { bandId: activeBandId, category:'audio' });
 const cleanName = file.name.replace(/\.[^/.]+$/,'').replace(/[_-]/g,'');
 const newSong: Song = {
 id: `aud_${Date.now()}_${i}`,
 titulo: cleanName,
 audioUrl: fileUrl,
 duracion:'3:30',
 duracionSegundos: 210,
 tonalidad:'Mim',
 bpm: 120,
 energia: 12,
 genero: genre,
 };
 setUploadedSongs(prev => [...prev, newSong]);
 try {
 await api.createSong(newSong);
 } catch (err) {
 console.warn("Could not persist audio song:", err);
 }
 }
 } finally {
 setIsUploadingAudio(false);
 }
 };

 // Manual Song Add
 const handleAddManualSong = async () => {
 if (!newManualTitle.trim()) return;
 const manualItem: ManualSongItem = {
 id: `man_${Date.now()}`,
 titulo: newManualTitle.trim(),
 tonalidad: newManualTonalidad.trim() ||'Mim',
 bpm: newManualBpm || 120,
 duracion: newManualDuracion.trim() ||'3:30',
 album:'Repertorio Directo',
 };
 setManualSongs(prev => [...prev, manualItem]);
 setNewManualTitle('');

 const newSong: Song = {
 id: manualItem.id,
 titulo: manualItem.titulo,
 tonalidad: manualItem.tonalidad,
 bpm: manualItem.bpm,
 duracion: manualItem.duracion,
 duracionSegundos: 210,
 album: manualItem.album,
 energia: 12,
 genero: genre,
 };
 try {
 await api.createSong(newSong);
 } catch (e) {
 console.warn("Could not persist manual song:", e);
 }
 };

 const handleRemoveManualSong = (id: string) => {
 setManualSongs(prev => prev.filter(s => s.id !== id));
 };

 const handleBulkAddManualSongs = async (text: string) => {
 const lines = text.split('\n').map(l => l.replace(/^\d+[\.\-\)]\s*/,'').trim()).filter(Boolean);
 const added: ManualSongItem[] = [];
 for (const title of lines) {
 const item: ManualSongItem = {
 id: `man_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
 titulo: title,
 tonalidad:'Mim',
 bpm: 120,
 duracion:'3:30',
 album:'Repertorio Directo',
 };
 added.push(item);
 try {
 await api.createSong({
 id: item.id,
 titulo: item.titulo,
 tonalidad: item.tonalidad,
 bpm: item.bpm,
 duracion: item.duracion,
 duracionSegundos: 210,
 album: item.album,
 energia: 12,
 genero: genre,
 });
 } catch (e) {
 console.warn("Could not persist bulk song:", e);
 }
 }
 setManualSongs(prev => [...prev, ...added]);
 };

 // Generate Setlist
 const handleGenerateSetlist = async (durationMinutes: number) => {
 const allSongItems = [...uploadedSongs, ...manualSongs];
 if (allSongItems.length === 0) return;
 setIsCreatingSetlist(true);
 try {
 const setlistName = `Setlist Debut (${durationMinutes} min)`;
 const items = allSongItems.map((s, idx) => ({
 id: `item_${Date.now()}_${idx}`,
 type:'song',
 songId: s.id,
 duracionSegundos: 210,
 duracion: s.duracion ||'3:30',
 tonalidad: s.tonalidad ||'Mim',
 bpm: s.bpm || 120,
 }));

 await api.createSetlist({
 nombre: setlistName,
 items,
 duracionEstimadaMinutos: durationMinutes,
 band_id: activeBandId,
 });
 setCreatedSetlistName(setlistName);
 } catch (err) {
 console.error("Error creating setlist:", err);
 setCreatedSetlistName(`Setlist Debut (${durationMinutes} min)`);
 } finally {
 setIsCreatingSetlist(false);
 }
 };

 // Upload Rider PDF
 const handleRiderUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setIsUploadingRider(true);
 try {
 const url = await uploadFileToServer(file, { bandId: activeBandId, category:'rider' });
 if (url) {
 setRiderPdfUrl(url);
 setRiderPdfName(file.name);
 }
 } catch (err) {
 console.error("Error uploading rider:", err);
 } finally {
 setIsUploadingRider(false);
 }
 };

 // Quotes Add/Remove
 const handleAddQuote = () => {
 if (!newQuoteText.trim() || !newQuoteMedia.trim()) return;
 const newQuote: PressQuoteItem = {
 id: `q_${Date.now()}`,
 texto: newQuoteText.trim(),
 medio: newQuoteMedia.trim(),
 };
 setPressQuotes(prev => [...prev, newQuote]);
 setNewQuoteText('');
 setNewQuoteMedia('');
 };

 const handleRemoveQuote = (id: string) => {
 setPressQuotes(prev => prev.filter(q => q.id !== id));
 };

 // Events Add/Remove
 const handleAddEvent = async () => {
 if (!newEventTitle.trim() || !newEventDate) return;
 const newEv: QuickEventItem = {
 id: `ev_${Date.now()}`,
 tipo: newEventType,
 titulo: newEventTitle.trim(),
 fecha: newEventDate,
 hora: newEventTime,
 ciudad: newEventCity,
 lugar: newEventVenue,
 enlaceEntradas: newEventTicketUrl.trim(),
 };
 setEvents(prev => [...prev, newEv]);

 if (newEventType ==='ensayo' && onAddRehearsal) {
 onAddRehearsal({
 id: newEv.id,
 fecha: newEv.fecha,
 hora: newEv.hora,
 lugar: newEv.lugar ||'Local de ensayo',
 notas: newEv.titulo,
 asistentes: members.map(m => m.id),
 estado:'programado',
 } as any);
 } else if (onAddConcert) {
 onAddConcert({
 id: newEv.id,
 sala: newEv.lugar || newEv.titulo,
 fecha: newEv.fecha,
 ciudad: newEv.ciudad || city,
 cache: cacheSala || 0,
 aforo_vendido: 0,
 aforo_total: 200,
 contrato_firmado: false,
 estado_pago:'pendiente',
 notas: newEv.titulo,
 tipo: newEventType ==='festival' ?'festival' :'sala',
 } as any);
 }

 setNewEventTitle('');
 setNewEventVenue('');
 setNewEventTicketUrl('');
 };

 const handleRemoveEvent = (id: string) => {
 setEvents(prev => prev.filter(e => e.id !== id));
 };

 // Photos Add/Remove
 const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = e.target.files;
 if (!files || files.length === 0) return;
 setIsUploadingPhoto(true);
 try {
 for (let i = 0; i < files.length; i++) {
 const file = files[i];
 const url = await uploadFileToServer(file, { bandId: activeBandId, category:'photo' });
 if (url) {
 setPhotos(prev => [...prev, url]);
 }
 }
 } finally {
 setIsUploadingPhoto(false);
 }
 };

 const handleAddPhotoUrl = () => {
 if (!newPhotoUrl.trim()) return;
 setPhotos(prev => [...prev, newPhotoUrl.trim()]);
 setNewPhotoUrl('');
 };

 const handleRemovePhoto = (idx: number) => {
 setPhotos(prev => prev.filter((_, i) => i !== idx));
 };

 // Lead Magnet Upload
 const handleLeadMagnetUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setIsUploadingLeadMagnet(true);
 try {
 const url = await uploadFileToServer(file, { bandId: activeBandId, category:'lead_magnet' });
 if (url) {
 setFanRewardLink(url);
 setLeadMagnetFileName(file.name);
 }
 } catch (err) {
 console.error("Error uploading lead magnet:", err);
 } finally {
 setIsUploadingLeadMagnet(false);
 }
 };

 // Save full configuration
 const handleSaveConfiguration = async () => {
 const finalBandName = (localBandName || bandName || currentUser?.bandName ||'').trim();
 const updatedEpk: Partial<EPKConfig> = {
 ...epkConfig,
 bandId: activeBandId,
 bandName: finalBandName,
 genero: genre,
 idioma: language,
 fontStyle,
 tipografia: fontStyle,
 logoUrl,
 fraseImpacto: slogan,
 biografia: bio,
 bandPhotos: photos,
 videos,
 miembros: members.map(m => ({
 id: m.id,
 nombre: m.name,
 rol: m.role,
 instagram: m.instagram,
 })),
 enlacesRedes: {
 ...epkConfig?.enlacesRedes,
 ...socialLinks,
 bizum: bizumNumber,
 revolut: revolutTag,
 paypal: paypalEmail,
 iban: ibanNumber,
 },
 datosContratacion: {
 ...epkConfig?.datosContratacion,
 ciudadBase: city,
 formatos: formato,
 numMusicos,
 duracionDirecto,
 },
 contactoBooking: {
 nombre: finalBandName || contactoBookingNombre || bandName,
 email: contactoBookingEmail,
 telefono: contactoBookingTelefono,
 },
 incentivoFans: {
 ...epkConfig?.incentivoFans,
 fraseGancho: fanCallToAction,
 mensajeAgradecimiento: fanWelcomeMessage,
 premioTexto: fanRewardDescription,
 enlaceDescarga: fanRewardLink,
 codigoDescuento: discountCode,
 },
 donacionRevolut: {
 ...epkConfig?.donacionRevolut,
 habilitado: Boolean(bizumNumber || revolutTag || paypalEmail || ibanNumber),
 bizumTelefono: bizumNumber,
 revolutTag,
 paypalUser: paypalEmail,
 ibanCuenta: ibanNumber,
 },
 resenasPrensa: {
 habilitado: pressQuotes.length > 0,
 citas: pressQuotes,
 },
 cifrasClave: {
 habilitado: Boolean(cifrasOyentes || cifrasDirectos || cifrasComunidad),
 oyentes: cifrasOyentes,
 directos: cifrasDirectos,
 comunidad: cifrasComunidad,
 },
 riderTecnico: riderTecnicoText,
 riderPdfUrl,
 riderPdfName,
 // Extended properties
 ...({
 canalesMesa,
 llevaMicrofoniaPropia,
 llevaInEars,
 necesitaBacklineBateria,
 festivalesDestacados,
 tiendaMerchUrl: merchStoreUrl,
 merchDestacado: merchHighlight,
 } as any),
 };

 if (onUpdateEpkConfig) {
 await onUpdateEpkConfig(updatedEpk);
 }
 if (onRefreshData) {
 onRefreshData();
 }
 };

 // Navigation handlers
 const handleNextStep = async () => {
 if (currentStepIndex === activeSteps.length - 1) {
 // Last step: save and advance to celebration
 await handleSaveConfiguration();
 setCurrentStepIndex(activeSteps.length);
 } else {
 setCurrentStepIndex(prev => prev + 1);
 }
 };

 const handlePrevStep = () => {
 if (currentStepIndex > 0) {
 setCurrentStepIndex(prev => prev - 1);
 }
 };

 const handleSkipStep = () => {
 if (currentStepIndex === activeSteps.length - 1) {
 setCurrentStepIndex(activeSteps.length);
 } else {
 setCurrentStepIndex(prev => prev + 1);
 }
 };

 const handleFinishWizard = () => {
 markOnboardingCompleted(activeBandId, { wizard: true, onboarding: true }, true).catch(() => {});
 if (typeof window !=='undefined') {
 window.dispatchEvent(new CustomEvent('bandmanager_onboarding_finished'));
 }
 onClose();
 };

 if (!isOpen) return null;

 return (
 <ModalPortal>
 <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
 <div className="relative w-full max-w-3xl rounded-3xl bg-[var(--surface)] border-[var(--hair)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto">
 
 {/* Header */}
 <div className="p-5 sm:p-6 border-b border-[var(--hair)] flex items-center justify-between bg-[var(--bg)]/50">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--acc)]/20 text-[var(--acc)]/70 font-semibold uppercase tracking-wider">
 Configuración Inicial · Plan {userPlanId.toUpperCase().replace('_','')}
 </span>
 {!isCelebrationStep && (
 <span className="text-xs text-[var(--ink-2)]">
 Paso {currentStepIndex + 1} de {activeSteps.length}
 </span>
 )}
 </div>
 <h2 className="text-lg sm:text-xl font-bold text-[var(--ink)] mt-1">
 {isCelebrationStep ?'¡Todo Listo!' : currentStepDef?.title}
 </h2>
 </div>

 <button
 type="button"
 onClick={onClose}
 className="p-2 rounded-[var(--r-m)] text-[var(--ink-3)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition-colors"
 title="Cerrar asistente"
 >
 <X className="w-5 h-5" />
 </button>
 </div>

 {/* Stepper Progress Bar */}
 {!isCelebrationStep && (
 <div className="px-5 sm:px-6 py-2.5 bg-zinc-950/60 border-b border-[var(--hair)] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
 {activeSteps.map((step, idx) => {
 const isCurrent = idx === currentStepIndex;
 const isPassed = idx < currentStepIndex;
 return (
 <button
 key={step.key}
 type="button"
 onClick={() => setCurrentStepIndex(idx)}
 className={`flex items-center gap-1 px-2.5 py-1 rounded-[var(--r-s)] text-xs whitespace-nowrap transition-all ${
 isCurrent
 ?'bg-[var(--acc)] text-[var(--acc-ink)] font-bold shadow-sm'
 : isPassed
 ?'bg-[var(--acc)]/15 text-[var(--acc)]/70 hover:bg-[var(--acc)]/25'
 :'text-[var(--ink-3)] hover:text-[var(--ink-2)]'
 }`}
 >
 {isPassed ? (
 <Check className="w-3 h-3" />
 ) : (
 <span className="text-[10px] opacity-80">{idx + 1}.</span>
 )}
 <span>{step.shortTitle}</span>
 </button>
 );
 })}
 </div>
 )}

 {/* Content Body */}
 <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
 {/* Step 1: Idioma */}
 {currentStepDef?.key ==='language' && (
 <StepLanguage
 language={language}
 setLanguage={setLanguage}
 onContinue={handleNextStep}
 />
 )}

 {/* Step 2: Identidad */}
 {currentStepDef?.key ==='identity' && (
 <StepIdentity
 localBandName={localBandName}
 setLocalBandName={setLocalBandName}
 genre={genre}
 setGenre={setGenre}
 language={language}
 setLanguage={setLanguage}
 fontStyle={fontStyle}
 setFontStyle={setFontStyle}
 city={city}
 setCity={setCity}
 logoUrl={logoUrl}
 setLogoUrl={setLogoUrl}
 isUploadingLogo={isUploadingLogo}
 onLogoUpload={handleLogoUpload}
 commonGenres={COMMON_GENRES}
 commonLanguages={COMMON_LANGUAGES}
 />
 )}

 {/* Step 2 */}
 {currentStepDef?.key ==='bio' && (
 <StepBio
 slogan={slogan}
 setSlogan={setSlogan}
 bio={bio}
 setBio={setBio}
 formato={formato}
 setFormato={setFormato}
 numMusicos={numMusicos}
 setNumMusicos={setNumMusicos}
 duracionDirecto={duracionDirecto}
 setDuracionDirecto={setDuracionDirecto}
 onGenerateBioAI={handleGenerateBioAI}
 />
 )}

 {/* Step 3 */}
 {currentStepDef?.key ==='members' && (
 <StepMembers
 members={members}
 newMemberName={newMemberName}
 setNewMemberName={setNewMemberName}
 newMemberRole={newMemberRole}
 setNewMemberRole={setNewMemberRole}
 newMemberEmail={newMemberEmail}
 setNewMemberEmail={setNewMemberEmail}
 newMemberInstagram={newMemberInstagram}
 setNewMemberInstagram={setNewMemberInstagram}
 onAddMember={handleAddMember}
 onRemoveMember={handleRemoveMember}
 />
 )}

 {/* Step 4 */}
 {currentStepDef?.key ==='socials_merch' && (
 <StepSocialsMerch
 socialLinks={socialLinks}
 setSocialLinks={setSocialLinks}
 merchStoreUrl={merchStoreUrl}
 setMerchStoreUrl={setMerchStoreUrl}
 merchHighlight={merchHighlight}
 setMerchHighlight={setMerchHighlight}
 />
 )}

 {/* Step 5 */}
 {currentStepDef?.key ==='videos' && (
 <StepVideos
 videos={videos}
 newVideoUrl={newVideoUrl}
 setNewVideoUrl={setNewVideoUrl}
 newVideoTitle={newVideoTitle}
 setNewVideoTitle={setNewVideoTitle}
 newVideoType={newVideoType}
 setNewVideoType={setNewVideoType}
 onAddVideo={handleAddVideo}
 onRemoveVideo={handleRemoveVideo}
 onToggleHighlightVideo={handleToggleHighlightVideo}
 />
 )}

 {/* Step 6 */}
 {currentStepDef?.key ==='music' && (
 <StepMusicSetlist
 musicSubTab={musicSubTab}
 setMusicSubTab={setMusicSubTab}
 spotifyQuery={spotifyQuery}
 setSpotifyQuery={setSpotifyQuery}
 isSearchingSpotify={isSearchingSpotify}
 spotifyAlbums={spotifyAlbums}
 selectedSpotifyTracks={selectedSpotifyTracks}
 onSearchSpotify={handleSearchSpotify}
 onToggleTrackSelection={handleToggleTrackSelection}
 onSelectAllTracksInAlbum={handleSelectAllTracksInAlbum}
 onImportSpotifyTracks={handleImportSpotifyTracks}
 isImportingSpotify={isImportingSpotify}
 uploadedSongs={uploadedSongs}
 isUploadingAudio={isUploadingAudio}
 onAudioFileUpload={handleAudioFileUpload}
 manualSongs={manualSongs}
 newManualTitle={newManualTitle}
 setNewManualTitle={setNewManualTitle}
 newManualTonalidad={newManualTonalidad}
 setNewManualTonalidad={setNewManualTonalidad}
 newManualBpm={newManualBpm}
 setNewManualBpm={setNewManualBpm}
 newManualDuracion={newManualDuracion}
 setNewManualDuracion={setNewManualDuracion}
 onAddManualSong={handleAddManualSong}
 onRemoveManualSong={handleRemoveManualSong}
 onBulkAddManualSongs={handleBulkAddManualSongs}
 createdSetlistName={createdSetlistName}
 isCreatingSetlist={isCreatingSetlist}
 onGenerateSetlist={handleGenerateSetlist}
 totalImportedSongsCount={totalImportedSongsCount}
 />
 )}

 {/* Step 7 */}
 {currentStepDef?.key ==='rider' && (
 <StepRider
 riderTecnicoText={riderTecnicoText}
 setRiderTecnicoText={setRiderTecnicoText}
 riderPdfUrl={riderPdfUrl}
 setRiderPdfUrl={setRiderPdfUrl}
 riderPdfName={riderPdfName}
 setRiderPdfName={setRiderPdfName}
 isUploadingRider={isUploadingRider}
 onRiderUpload={handleRiderUpload}
 canalesMesa={canalesMesa}
 setCanalesMesa={setCanalesMesa}
 llevaMicrofoniaPropia={llevaMicrofoniaPropia}
 setLlevaMicrofoniaPropia={setLlevaMicrofoniaPropia}
 llevaInEars={llevaInEars}
 setLlevaInEars={setLlevaInEars}
 necesitaBacklineBateria={necesitaBacklineBateria}
 setNecesitaBacklineBateria={setNecesitaBacklineBateria}
 />
 )}

 {/* Step 8 */}
 {currentStepDef?.key ==='press_proof' && (
 <StepPressProof
 pressQuotes={pressQuotes}
 newQuoteText={newQuoteText}
 setNewQuoteText={setNewQuoteText}
 newQuoteMedia={newQuoteMedia}
 setNewQuoteMedia={setNewQuoteMedia}
 onAddQuote={handleAddQuote}
 onRemoveQuote={handleRemoveQuote}
 festivalesDestacados={festivalesDestacados}
 setFestivalesDestacados={setFestivalesDestacados}
 cifrasOyentes={cifrasOyentes}
 setCifrasOyentes={setCifrasOyentes}
 cifrasDirectos={cifrasDirectos}
 setCifrasDirectos={setCifrasDirectos}
 cifrasComunidad={cifrasComunidad}
 setCifrasComunidad={setCifrasComunidad}
 />
 )}

 {/* Step 9 (Plan-gated: Booking Conditions) */}
 {currentStepDef?.key ==='booking_conditions' && (
 <StepBookingConditions
 cacheAcustico={cacheAcustico}
 setCacheAcustico={setCacheAcustico}
 cacheSala={cacheSala}
 setCacheSala={setCacheSala}
 cacheFestival={cacheFestival}
 setCacheFestival={setCacheFestival}
 condicionesKm={condicionesKm}
 setCondicionesKm={setCondicionesKm}
 requiereAlojamiento={requiereAlojamiento}
 setRequiereAlojamiento={setRequiereAlojamiento}
 contactoBookingNombre={contactoBookingNombre}
 setContactoBookingNombre={setContactoBookingNombre}
 contactoBookingEmail={contactoBookingEmail}
 setContactoBookingEmail={setContactoBookingEmail}
 contactoBookingTelefono={contactoBookingTelefono}
 setContactoBookingTelefono={setContactoBookingTelefono}
 />
 )}

 {/* Step 10 (Plan-gated: AI Agent & Email) */}
 {currentStepDef?.key ==='agent_email' && (
 <StepAgentEmail
 signatureName={signatureName}
 setSignatureName={setSignatureName}
 signatureCargo={signatureCargo}
 setSignatureCargo={setSignatureCargo}
 signaturePhone={signaturePhone}
 setSignaturePhone={setSignaturePhone}
 senderEmail={senderEmail}
 setSenderEmail={setSenderEmail}
 />
 )}

 {/* Step 11 */}
 {currentStepDef?.key ==='events' && (
 <StepEvents
 events={events}
 newEventTitle={newEventTitle}
 setNewEventTitle={setNewEventTitle}
 newEventType={newEventType}
 setNewEventType={setNewEventType}
 newEventDate={newEventDate}
 setNewEventDate={setNewEventDate}
 newEventTime={newEventTime}
 setNewEventTime={setNewEventTime}
 newEventCity={newEventCity}
 setNewEventCity={setNewEventCity}
 newEventVenue={newEventVenue}
 setNewEventVenue={setNewEventVenue}
 newEventTicketUrl={newEventTicketUrl}
 setNewEventTicketUrl={setNewEventTicketUrl}
 onAddEvent={handleAddEvent}
 onRemoveEvent={handleRemoveEvent}
 />
 )}

 {/* Step 12 */}
 {currentStepDef?.key ==='photos' && (
 <StepPhotos
 photos={photos}
 isUploadingPhoto={isUploadingPhoto}
 onPhotoUpload={handlePhotoUpload}
 onRemovePhoto={handleRemovePhoto}
 newPhotoUrl={newPhotoUrl}
 setNewPhotoUrl={setNewPhotoUrl}
 onAddPhotoUrl={handleAddPhotoUrl}
 />
 )}

 {/* Step 13 */}
 {currentStepDef?.key ==='fans_payments' && (
 <StepFansPayments
 fanCallToAction={fanCallToAction}
 setFanCallToAction={setFanCallToAction}
 fanWelcomeMessage={fanWelcomeMessage}
 setFanWelcomeMessage={setFanWelcomeMessage}
 fanRewardDescription={fanRewardDescription}
 setFanRewardDescription={setFanRewardDescription}
 fanRewardLink={fanRewardLink}
 setFanRewardLink={setFanRewardLink}
 leadMagnetFileName={leadMagnetFileName}
 setLeadMagnetFileName={setLeadMagnetFileName}
 isUploadingLeadMagnet={isUploadingLeadMagnet}
 onLeadMagnetUpload={handleLeadMagnetUpload}
 discountCode={discountCode}
 setDiscountCode={setDiscountCode}
 bizumNumber={bizumNumber}
 setBizumNumber={setBizumNumber}
 revolutTag={revolutTag}
 setRevolutTag={setRevolutTag}
 paypalEmail={paypalEmail}
 setPaypalEmail={setPaypalEmail}
 ibanNumber={ibanNumber}
 setIbanNumber={setIbanNumber}
 />
 )}

 {/* Final Celebration */}
 {isCelebrationStep && (
 <StepCompletedCelebration
 bandName={localBandName}
 totalSongs={totalImportedSongsCount}
 totalVideos={videos.length}
 totalPhotos={photos.length}
 totalEvents={events.length}
 hasRider={Boolean(riderPdfUrl || riderTecnicoText)}
 planName={userPlanId}
 onFinish={handleFinishWizard}
 />
 )}
 </div>

 {/* Footer Controls */}
 {!isCelebrationStep && (
 <div className="p-4 sm:p-5 border-t border-[var(--hair)] bg-zinc-950/80 flex items-center justify-between">
 <div>
 {currentStepIndex > 0 ? (
 <button
 type="button"
 onClick={handlePrevStep}
 className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--r-m)] bg-[var(--bg)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-xs font-medium transition-colors"
 >
 <ArrowLeft className="w-3.5 h-3.5" /> Anterior
 </button>
 ) : (
 <button
 type="button"
 onClick={onClose}
 className="text-xs text-[var(--ink-3)] hover:text-[var(--ink-2)]"
 >
 Configurar más tarde
 </button>
 )}
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={handleSkipStep}
 className="inline-flex items-center gap-1 px-3 py-2 rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink)] text-xs transition-colors"
 >
 <SkipForward className="w-3.5 h-3.5" /> Saltar paso
 </button>

 <button
 type="button"
 onClick={handleNextStep}
 className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--acc-ink)] font-semibold text-xs transition-all shadow-lg shadow-amber-500/20"
 >
 {currentStepIndex === activeSteps.length - 1 ? (
 <>
 <span>Finalizar y Ver Portales</span>
 <Check className="w-4 h-4" />
 </>
 ) : (
 <>
 <span>Siguiente</span>
 <ArrowRight className="w-4 h-4" />
 </>
 )}
 </button>
 </div>
 </div>
 )}

 </div>
 </div>
 </ModalPortal>
 );
};
