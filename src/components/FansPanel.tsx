import React, { useState, useMemo, useEffect } from'react';
import {
 Users, Heart, QrCode, Download, Search, Plus, Trash2, Sparkles,
 Copy, Check, FileSpreadsheet, ShieldCheck, Mail, MapPin, Calendar, ExternalLink,
 Filter, LayoutGrid, List, Map as MapIcon, X, TrendingUp, Printer, Share2, MessageCircle,
 Gift, Tag, Music, Save, CheckCircle2, Flame, Star, Award, Instagram, FileCode, Layers, Eye,
 MoreHorizontal, Settings2
} from'lucide-react';
import QRCode from'react-qr-code';
import * as XLSX from'xlsx';
import { Fan, Concert, EPKConfig, SocialMetric, ThemeColors } from'../types';
import { THEMES } from'../utils/theme';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from'recharts';
import { Onda } from'./ui/Onda';
import { ReelsMetricsView } from'./reels/ReelsMetricsView';
import { FansCommunityView } from'./fans/FansCommunityView';
import { FAN_FORM_LANGUAGES, FanFormLanguage, DEFAULT_FAN_FORM_LANGUAGE, isFanFormLanguage } from'../i18n/fansTranslations';
import { QrExportModal } from'./QrExportModal';
import { FansLandingPreviewModal } from'./FansLandingPreviewModal';
import { downloadQrAsSvg, downloadQrAsHighResPng, printHighQualityFlyer } from'../utils/qrExport';
import { useModuleTutorial } from'../hooks/useModuleTutorial';
import { ModuleTutorialModal } from'./common/ModuleTutorialModal';
import { ModuleTutorialTrigger } from'./common/ModuleTutorialTrigger';
import { PublicoSilhouette } from'./ui/PublicoSilhouette';

interface FansPanelProps {
 fans: Fan[];
 concerts: Concert[];
 epkConfig: Partial<EPKConfig>;
 onAddFan: (fan: Fan) => void;
 onDeleteFan: (id: string) => void;
 onUpdateFan?: (id: string, updates: Partial<Fan>) => void;
 onUpdateIncentive?: (newIncentive: EPKConfig['incentivoFans']) => void;
 onUpdateEpkConfig?: (newConfig: Partial<EPKConfig>) => void;
 currentBandId?: string;
 currentBandName?: string;
 currentBandLogo?: string;
 metrics?: SocialMetric[];
 onAddMetric?: (metric: SocialMetric) => Promise<void>;
 onUpdateMetric?: (id: string, updatedFields: Partial<SocialMetric>) => Promise<void>;
 onDeleteMetric?: (id: string) => Promise<void>;
 onScanRealMetrics?: () => Promise<void>;
 onSyncMetrics?: () => Promise<void>;
 isScanningMetrics?: boolean;
 isSyncingMetrics?: boolean;
 colors?: ThemeColors;
 isStitchLight?: boolean;
 onNavigate?: (view:'epk') => void;
 isPromo?: boolean;
 onUpdateConcert?: (id: string, updates: Partial<Concert>) => void;
 initialConcertId?: string;
}

const COLORS = ['var(--acc)','var(--ok)','#3b82f6','#8b5cf6','#ec4899','#06b6d4','#64748b'];

export const FansPanel: React.FC<FansPanelProps> = ({
 fans = [],
 concerts = [],
 epkConfig,
 onAddFan,
 onDeleteFan,
 onUpdateFan,
 onUpdateIncentive,
 onUpdateEpkConfig,
 currentBandId,
 currentBandName,
 currentBandLogo,
 metrics = [],
 onAddMetric,
 onUpdateMetric,
 onDeleteMetric,
 onScanRealMetrics,
 onSyncMetrics,
 isScanningMetrics,
 isSyncingMetrics,
 colors,
 isStitchLight,
 onNavigate,
 isPromo = false,
 onUpdateConcert,
 initialConcertId
}) => {
 const effectiveBandName = currentBandName || epkConfig?.contactoBooking?.nombre || (currentBandId?.includes('bakandeya') ?'Bakandeya' :'Tu Banda');
 const effectiveBandLogo = currentBandLogo || epkConfig?.logoUrl || (effectiveBandName.toLowerCase().includes('bakandeya') ?'/logo_bakandeya_bueno_sin_fondo.png' :'');
 const cleanBandId = (currentBandId ||'').toLowerCase().replace(/^(band|reg)-/,'') ||'banda';
 const { isOpen: isTutorialOpen, openTutorial, closeTutorial } = useModuleTutorial('fans');
 const [activeTab, setActiveTab] = useState<'metrics' |'fans' |'qr' |'dashboard'>(
 initialConcertId || isPromo ?'qr' :'metrics'
 );
 const [viewMode, setViewMode] = useState<'feed' |'grid' |'table' |'map'>('feed');
 const [searchQuery, setSearchQuery] = useState('');
 const [filterOrigen, setFilterOrigen] = useState<string>('');
 const [selectedCityFilter, setSelectedCityFilter] = useState<string>('');
 const [selectedNivelFilter, setSelectedNivelFilter] = useState<string>('');
 const [selectedConcertId, setSelectedConcertId] = useState<string>(initialConcertId ||'');
 const [savedToConcertFeedback, setSavedToConcertFeedback] = useState(false);
 const [clickStats, setClickStats] = useState<Record<string, number>>({});

 useEffect(() => {
 fetch('/api/epk/clicks')
 .then(res => (res.ok && res.headers.get('content-type')?.includes('application/json')) ? res.json() : null)
 .then(data => {
 if (data && data.clicks) {
 setClickStats(data.clicks);
 }
 })
 .catch(() => {});
 }, [currentBandId]);

 useEffect(() => {
 if (initialConcertId) {
 setSelectedConcertId(initialConcertId);
 setActiveTab('qr');
 }
 }, [initialConcertId]);

 // Configurable City Tabs state (synced with DB epkConfig.ciudadesConfig)
 const [customCityChips, setCustomCityChips] = useState<string[]>(() => {
 if (epkConfig?.ciudadesConfig && Array.isArray(epkConfig.ciudadesConfig) && epkConfig.ciudadesConfig.length > 0) {
 return epkConfig.ciudadesConfig;
 }
 try {
 const saved = localStorage.getItem('bakandeya_custom_cities');
 return saved ? JSON.parse(saved) : ['Madrid','Sevilla','Barcelona','Málaga','Valencia','Granada','Cádiz'];
 } catch {
 return ['Madrid','Sevilla','Barcelona','Málaga','Valencia','Granada','Cádiz'];
 }
 });

 const [isAddingCity, setIsAddingCity] = useState(false);
 const [newCityInput, setNewCityInput] = useState('');

 useEffect(() => {
 if (epkConfig?.ciudadesConfig && Array.isArray(epkConfig.ciudadesConfig) && epkConfig.ciudadesConfig.length > 0) {
 setCustomCityChips(epkConfig.ciudadesConfig);
 }
 }, [epkConfig?.ciudadesConfig]);

 const handleAddCityTab = (e?: React.FormEvent) => {
 if (e) e.preventDefault();
 if (!newCityInput.trim()) return;
 const formatted = newCityInput.trim();
 if (!customCityChips.includes(formatted)) {
 const updated = [...customCityChips, formatted];
 setCustomCityChips(updated);
 try { localStorage.setItem('bakandeya_custom_cities', JSON.stringify(updated)); } catch {}
 if (onUpdateEpkConfig) {
 onUpdateEpkConfig({ ciudadesConfig: updated });
 }
 }
 setSelectedCityFilter(formatted);
 setNewCityInput('');
 setIsAddingCity(false);
 };

 const handleRemoveCityTab = (cityToRemove: string, e: React.MouseEvent) => {
 e.stopPropagation();
 const updated = customCityChips.filter(c => c !== cityToRemove);
 setCustomCityChips(updated);
 try { localStorage.setItem('bakandeya_custom_cities', JSON.stringify(updated)); } catch {}
 if (selectedCityFilter === cityToRemove) {
 setSelectedCityFilter('');
 }
 if (onUpdateEpkConfig) {
 onUpdateEpkConfig({ ciudadesConfig: updated });
 }
 };
 
 // Incentive state. Antes, mientras una banda no configuraba su propio incentivo, este
 // formulario mostraba (y podía llegar a guardar) un enlace de descarga real de Bakandeya y un
 // código de descuento con su nombre — datos inventados de una banda concreta colándose como
 //"valor por defecto" en el panel de cualquier otra.
 const [incentivo, setIncentivo] = useState(epkConfig?.incentivoFans || {
 mensajeAgradecimiento:"¡Muchas gracias por unirte a la familia de la banda!",
 enlaceDescarga:"",
 codigoDescuento:""
 });
 const [savedIncentive, setSavedIncentive] = useState(false);

 useEffect(() => {
 if (epkConfig?.incentivoFans) {
 setIncentivo(epkConfig.incentivoFans);
 }
 }, [epkConfig?.incentivoFans]);

 const handleSaveIncentive = (e?: React.FormEvent) => {
 if (e) e.preventDefault();
 if (onUpdateIncentive) {
 onUpdateIncentive(incentivo);
 }
 if (onUpdateEpkConfig) {
 onUpdateEpkConfig({ incentivoFans: incentivo });
 }
 setSavedIncentive(true);
 setTimeout(() => setSavedIncentive(false), 2500);
 };

 // Manual Add Modal State
 const [showAddModal, setShowAddModal] = useState(false);
 const [newNombre, setNewNombre] = useState('');
 const [newEmail, setNewEmail] = useState('');
 const [newCiudad, setNewCiudad] = useState('');
 const [newOrigen, setNewOrigen] = useState('Manual');
 const [newCancionFavorita, setNewCancionFavorita] = useState('');
 const [newInstagram, setNewInstagram] = useState('');
 const [newMensaje, setNewMensaje] = useState('');
 const [newNivel, setNewNivel] = useState<'fiel' |'superfan' |'fundador' |'backstage'>('fiel');

 const filteredFans = useMemo(() => {
 return fans.filter(f => {
 const matchQuery = f.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
 f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
 (f.ciudad && f.ciudad.toLowerCase().includes(searchQuery.toLowerCase())) ||
 (f.conciertoOrigenNombre && f.conciertoOrigenNombre.toLowerCase().includes(searchQuery.toLowerCase()));
 
 const matchFilter = filterOrigen 
 ? (f.conciertoOrigenId === filterOrigen || (filterOrigen ==='Otros' && !f.conciertoOrigenId))
 : true;

 const matchCity = selectedCityFilter
 ? (f.ciudad && f.ciudad.toLowerCase().includes(selectedCityFilter.toLowerCase()))
 : true;

 const matchNivel = selectedNivelFilter
 ? (f.nivelFan === selectedNivelFilter)
 : true;

 return matchQuery && matchFilter && matchCity && matchNivel;
 });
 }, [fans, searchQuery, filterOrigen, selectedCityFilter, selectedNivelFilter]);

 // Analytics Data - Channel of Origin (robust categorization)
 const originData = useMemo(() => {
 if (!fans || fans.length === 0) return [];
 const counts: Record<string, number> = {};
 
 fans.forEach(f => {
 let raw = (f.comoConocio || f.conciertoOrigenNombre ||'').trim();
 if (!raw) {
 if (f.conciertoOrigenId) raw ='Concierto en Directo';
 else raw ='Registro Directo / QR';
 }

 let category = raw;
 const lower = raw.toLowerCase();
 if (lower.includes('sala') || lower.includes('concierto') || lower.includes('festival') || lower.includes('directo') || lower.includes('bolo') || lower.includes('caracol') || lower.includes('viña')) {
 category ='Conciertos / Directo';
 } else if (lower.includes('insta') || lower.includes('ig')) {
 category ='Instagram';
 } else if (lower.includes('tik')) {
 category ='TikTok';
 } else if (lower.includes('qr') || lower.includes('escenario')) {
 category ='Escaneo QR';
 } else if (lower.includes('amigo') || lower.includes('boca')) {
 category ='Boca a Boca / Amigos';
 } else if (lower.includes('spot') || lower.includes('you') || lower.includes('web')) {
 category ='Web / Streaming';
 } else if (lower.includes('manual')) {
 category ='Registro Manual';
 }

 counts[category] = (counts[category] || 0) + 1;
 });

 const total = fans.length;
 return Object.entries(counts).map(([name, value]) => ({
 name,
 value,
 percentage: Math.round((value / total) * 100)
 })).sort((a, b) => b.value - a.value);
 }, [fans]);

 // Analytics Data - Evolutionary Cumulative Growth Chart
 const evolutionaryGrowthData = useMemo(() => {
 if (!fans || fans.length === 0) return [];

 const monthMap: Record<string, number> = {};
 fans.forEach(f => {
 const month = f.fechaCaptura ? f.fechaCaptura.substring(0, 7) :'2026-05';
 monthMap[month] = (monthMap[month] || 0) + 1;
 });

 const sortedMonths = Object.keys(monthMap).sort();
 let runningTotal = 0;
 const monthNames = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

 return sortedMonths.map(month => {
 const newCount = monthMap[month];
 runningTotal += newCount;
 const [y, m] = month.split('-');
 const mIdx = m ? parseInt(m, 10) - 1 : 0;
 const label = `${monthNames[mIdx] || m}'${y ? y.slice(2) :'26'}`;
 return {
 month,
 date: label,
 nuevos: newCount,
 total: runningTotal
 };
 });
 }, [fans]);

 const uniqueConcertIds = useMemo(() => {
 const ids = new Set<string>();
 fans.forEach(f => {
 if (f.conciertoOrigenId) ids.add(f.conciertoOrigenId);
 });
 return Array.from(ids).map(id => {
 const concert = concerts.find(c => c.id === id);
 return { id, name: concert ? `${concert.sala} (${concert.fecha})` : id };
 });
 }, [fans, concerts]);

 const handleExportCSV = () => {
 const dataToExport = filteredFans.map(f => ({
 ID: f.id,
 Nombre: f.nombre,
 Email: f.email,
 Ciudad: f.ciudad ||'',
 Origen: f.comoConocio || f.conciertoOrigenNombre ||'','Concierto ID': f.conciertoOrigenId ||'','Fecha Registro': f.fechaCaptura,'Consentimiento RGPD': f.consentimientoRGPD ?'SÍ' :'NO'
 }));

 const worksheet = XLSX.utils.json_to_sheet(dataToExport);
 const workbook = XLSX.utils.book_new();
 XLSX.utils.book_append_sheet(workbook, worksheet, `Fans ${effectiveBandName}`);
 XLSX.writeFile(workbook, `Fans_${effectiveBandName.replace(/\s+/g,'_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
 };

 const handleManualAddSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!newNombre.trim() || !newEmail.trim()) return;

 const fan: Fan = {
 id: `fan-${Date.now()}`,
 nombre: newNombre.trim(),
 email: newEmail.trim(),
 ciudad: newCiudad.trim() || undefined,
 comoConocio: newOrigen,
 cancionFavorita: newCancionFavorita.trim() || undefined,
 instagram: newInstagram.trim().replace(/^@/,'') || undefined,
 mensaje: newMensaje.trim() || undefined,
 nivelFan: newNivel,
 reacciones: { likes: 1, fire: 0, applause: 0, guitars: 0 },
 fechaCaptura: new Date().toISOString().split('T')[0],
 consentimientoRGPD: true
 };
 onAddFan(fan);
 setShowAddModal(false);
 setNewNombre(''); 
 setNewEmail(''); 
 setNewCiudad(''); 
 setNewOrigen('Manual');
 setNewCancionFavorita('');
 setNewInstagram('');
 setNewMensaje('');
 setNewNivel('fiel');
 };



 const selectedConcert = concerts.find(c => c.id === selectedConcertId);
 const [customSlug, setCustomSlug] = useState('');
 const [useCustomDomain, setUseCustomDomain] = useState(true); // Default to clean custom domain like bandmanager.io
 const defaultDomain ='bandmanager.io';
 const [customDomain, setCustomDomain] = useState(defaultDomain);
 const [routePrefix, setRoutePrefix] = useState('unete');
 const [qrLanguage, setQrLanguage] = useState<FanFormLanguage>(DEFAULT_FAN_FORM_LANGUAGE);

 useEffect(() => {
 if (selectedConcert) {
 const defaultSlug = `${selectedConcert.ciudad}-${selectedConcert.sala}`.toLowerCase().replace(/[^a-z0-9]/g,'-');
 setCustomSlug(defaultSlug);
 // Precarga el idioma guardado en el concierto; el manager siempre puede cambiarlo a mano abajo.
 setQrLanguage(isFanFormLanguage(selectedConcert.idioma) ? selectedConcert.idioma : DEFAULT_FAN_FORM_LANGUAGE);
 } else {
 setCustomSlug('');
 }
 }, [selectedConcertId]);

 // Build clean target URL
 const rawDomain = useCustomDomain 
 ? (customDomain.trim().startsWith('http') ? customDomain.trim() : `https://${customDomain.trim().replace(/\/$/,'')}`)
 : (typeof window !=='undefined' ? window.location.origin :'https://bandmanager.io');

 const cleanPrefix = routePrefix.trim().replace(/^\/+|\/+$/g,'');
 const cleanSlugVal = customSlug.trim().toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-_]/g,'');

 const pathFormatted = cleanSlugVal 
 ? (cleanPrefix ? `/${cleanPrefix}/${cleanSlugVal}` : `/${cleanSlugVal}`)
 : (cleanPrefix ? `/${cleanPrefix}` :'/unete');

 const qrQueryParams: string[] = [];
 if (currentBandId) qrQueryParams.push(`band=${encodeURIComponent(currentBandId)}`);
 else if (cleanBandId) qrQueryParams.push(`band=${encodeURIComponent(cleanBandId)}`);
 if (qrLanguage !== DEFAULT_FAN_FORM_LANGUAGE) qrQueryParams.push(`lang=${qrLanguage}`);
 if (selectedConcert) {
 // Permite que /api/public/fans guarde el concierto de origen real (concierto_origen_id)
 // en vez de depender solo del slug de la URL para adivinar el nombre.
 qrQueryParams.push(`concertId=${encodeURIComponent(selectedConcert.id)}`);
 qrQueryParams.push(`concertName=${encodeURIComponent(`${selectedConcert.sala} (${selectedConcert.ciudad})`)}`);
 }
 const qrConcertUrl = `${rawDomain}${pathFormatted}${qrQueryParams.length ? `?${qrQueryParams.join('&')}` :''}`;

 const copyLink = () => {
 navigator.clipboard.writeText(qrConcertUrl);
 alert("Enlace copiado al portapapeles.");
 };

 const [copiedQrUrl, setCopiedQrUrl] = useState(false);

 const handleCopyQrUrl = () => {
 navigator.clipboard.writeText(qrConcertUrl);
 setCopiedQrUrl(true);
 setTimeout(() => setCopiedQrUrl(false), 2500);
 };

 const handleShareWhatsApp = () => {
 const concertTitle = selectedConcert ? `${selectedConcert.sala} (${selectedConcert.ciudad})` : effectiveBandName;
 const text = `¡Únete a ${effectiveBandName} en ${concertTitle}! 🎶 Escanea o entra en el enlace para recibir sorpresas exclusivas y estar al día:\n\n${qrConcertUrl}`;
 window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,'_blank');
 };

 const handleShareNative = async () => {
 if (navigator.share) {
 try {
 await navigator.share({
 title: `Únete a ${effectiveBandName}`,
 text:'Escanea o entra para unirte a nuestra comunidad.',
 url: qrConcertUrl,
 });
 } catch (err) {
 console.log('Share canceled or not supported', err);
 }
 } else {
 handleCopyQrUrl();
 }
 };

 const [showQrExportModal, setShowQrExportModal] = useState(false);
 const [showFansPreviewModal, setShowFansPreviewModal] = useState(false);
 const [isExportingDirect, setIsExportingDirect] = useState(false);
 const [showQrMoreMenu, setShowQrMoreMenu] = useState(false);
 const [showAdvancedQrConfig, setShowAdvancedQrConfig] = useState(false);
 const [showFansHeaderMenu, setShowFansHeaderMenu] = useState(false);

 const handleDownloadSvg = async () => {
 setIsExportingDirect(true);
 try {
 const concertTitle = selectedConcert ? `${selectedConcert.sala}` : effectiveBandName;
 await downloadQrAsSvg({
 svgElementId:'qr-code-svg-container',
 filename: `qr-${effectiveBandName.toLowerCase().replace(/[^a-z0-9]/g,'-')}-${concertTitle.toLowerCase().replace(/[^a-z0-9]/g,'-')}-vectorial`,
 logoUrl: effectiveBandLogo
 });
 } catch (err) {
 console.error('Error al descargar SVG:', err);
 } finally {
 setIsExportingDirect(false);
 }
 };

 const handleDownloadPng4k = async () => {
 setIsExportingDirect(true);
 try {
 const concertTitle = selectedConcert ? `${selectedConcert.sala}` : effectiveBandName;
 await downloadQrAsHighResPng({
 svgElementId:'qr-code-svg-container',
 filename: `qr-${effectiveBandName.toLowerCase().replace(/[^a-z0-9]/g,'-')}-${concertTitle.toLowerCase().replace(/[^a-z0-9]/g,'-')}-4k`,
 template:'qr-only',
 logoUrl: effectiveBandLogo
 });
 } catch (err) {
 console.error('Error al descargar PNG 4K:', err);
 } finally {
 setIsExportingDirect(false);
 }
 };

 const handlePrintQr = () => {
 const concertTitle = selectedConcert ? selectedConcert.sala : undefined;
 const dateCity = selectedConcert ? `${selectedConcert.ciudad} • ${selectedConcert.fecha}` : undefined;
 
 printHighQualityFlyer({
 svgElementId:'qr-code-svg-container',
 bandName: effectiveBandName,
 concertTitle,
 dateCity,
 url: qrConcertUrl,
 logoUrl: effectiveBandLogo,
 ctaText:'¡ESCANEA CON LA CÁMARA DE TU MÓVIL!',
 subtitle: `Únete a la comunidad oficial de ${effectiveBandName} para acceder a canciones inéditas, sorpresas exclusivas y descuentos en merchandising.`
 });
 };

 return (
 <div data-modulo="fans" className="space-y-6">
 <div className="flex items-center justify-between gap-3 bg-[var(--surface)] rounded-[var(--r-l)] p-4 sm:p-6">
 <div className="min-w-0">
 <h2
 className="text-lg sm:text-2xl font-black text-[var(--ink)] font-display flex items-center gap-2 sm:gap-3"
 title="Captura de fans en directo con códigos QR, métricas de redes, comunidad interactiva y analítica de crecimiento."
 >
 <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-[var(--acc)] shrink-0" />
 <span className="truncate">Captura QR & Fans</span>
 </h2>
 <p className="hidden sm:block text-[var(--ink-2)] font-sans text-sm mt-1">
 Captura de fans en directo con códigos QR, métricas de redes, comunidad interactiva y analítica de crecimiento.
 </p>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <ModuleTutorialTrigger
 moduleId="fans"
 onClick={openTutorial}
 label="Guía rápida"
 />

 <div className="relative shrink-0">
 <button
 type="button"
 onClick={() => setShowFansHeaderMenu(v => !v)}
 title="Previsualizar formulario, copiar enlace, registrar fan manual, exportar CSV o ver guía"
 className="p-2.5 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc)] transition cursor-pointer"
 >
 <MoreHorizontal className="w-4 h-4" />
 </button>
 {showFansHeaderMenu && (
 <>
 <div className="fixed inset-0 z-30" onClick={() => setShowFansHeaderMenu(false)} />
 <div className="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-[var(--r-m)] bg-[var(--surface)] p-1.5 space-y-0.5 text-xs font-sans">
 <button
 type="button"
 onClick={() => { setShowFansHeaderMenu(false); openTutorial(); }}
 className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--acc)]/70 hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2 font-bold"
 >
 <Sparkles className="w-3.5 h-3.5 shrink-0 text-[var(--acc)]" /> Guía Rápida & Tutorial
 </button>
 <button
 type="button"
 onClick={() => { setShowFansHeaderMenu(false); setShowFansPreviewModal(true); }}
 className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--acc)]/70 hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2 font-bold"
 >
 <Eye className="w-3.5 h-3.5 shrink-0" /> Previsualizar Formulario
 </button>
 <button
 type="button"
 onClick={() => { setShowFansHeaderMenu(false); copyLink(); }}
 className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--ink-2)] hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2"
 >
 <Copy className="w-3.5 h-3.5 shrink-0" /> Enlace de Captura Corto
 </button>
 <button
 type="button"
 onClick={() => { setShowFansHeaderMenu(false); setShowAddModal(true); }}
 className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--ink-2)] hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2"
 >
 <Plus className="w-3.5 h-3.5 shrink-0" /> Registrar Fan Manual
 </button>
 <button
 id="fans-export-csv-btn"
 type="button"
 onClick={() => { setShowFansHeaderMenu(false); handleExportCSV(); }}
 className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--ink-2)] hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2"
 >
 <Download className="w-3.5 h-3.5 shrink-0" /> Exportar CSV
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 </div>

 {/* Tabs (metrics tab hidden for Promo) */}
 <div className="flex overflow-x-auto hide-scrollbar gap-1">
 {!isPromo && (
 <button
 id="tab-btn-fans-metrics"
 onClick={() => setActiveTab('metrics')}
 className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer font-sans text-xs tracking-wider ${activeTab ==='metrics' ?' text-[var(--acc)] font-bold bg-[var(--acc)]/5' :'border-transparent text-[var(--ink-2)] hover:text-[var(--ink-2)]'}`}
 >
 <TrendingUp className="w-4 h-4 text-[var(--acc)]" /> 1. Seguimiento & Métricas de Redes
 </button>
 )}
 <button
 id="tab-btn-fans-qr"
 onClick={() => setActiveTab('qr')}
 className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer font-sans text-xs tracking-wider ${activeTab ==='qr' ?' text-[var(--acc)] font-bold bg-[var(--acc)]/5' :'border-transparent text-[var(--ink-2)] hover:text-[var(--ink-2)]'}`}
 >
 <QrCode className="w-4 h-4 text-[var(--acc)]" /> {isPromo ?'1' :'2'}. Captura en Vivo & QR
 </button>
 <button
 id="tab-btn-fans-dashboard"
 onClick={() => setActiveTab('dashboard')}
 className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer font-sans text-xs tracking-wider ${activeTab ==='dashboard' ?' text-[var(--acc)] font-bold bg-[var(--acc)]/5' :'border-transparent text-[var(--ink-2)] hover:text-[var(--ink-2)]'}`}
 >
 <Heart className="w-4 h-4 text-[var(--acc)]" /> {isPromo ?'2' :'3'}. Dashboard & Analítica
 </button>
 <button
 id="tab-btn-fans-directory"
 onClick={() => setActiveTab('fans')}
 className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer font-sans text-xs tracking-wider ${activeTab ==='fans' ?' text-[var(--acc)] font-bold bg-[var(--acc)]/5' :'border-transparent text-[var(--ink-2)] hover:text-[var(--ink-2)]'}`}
 >
 <Users className="w-4 h-4 text-[var(--acc)]" /> {isPromo ?'3' :'4'}. Comunidad & Red Social ({fans.length})
 </button>
 </div>

 {activeTab ==='dashboard' && (
 <div className="space-y-6">
 <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 flex flex-col justify-center">
 <p className="text-xs font-bold text-[var(--ink-2)] tracking-widest mb-2 font-sans">Total Fans Registrados</p>
 <h3 className="text-5xl font-black text-[var(--ink)] font-display">{fans.length}</h3>
 </div>
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 flex flex-col justify-center">
 <p className="text-xs font-bold text-[var(--ink-2)] tracking-widest mb-2 font-sans">Consentimiento RGPD</p>
 <h3 className="text-4xl font-black text-[var(--ok)] font-display flex items-center gap-2">
 <ShieldCheck className="w-8 h-8" />
 100%
 </h3>
 </div>
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 flex flex-col justify-center">
 <p className="text-xs font-bold text-[var(--ink-2)] tracking-widest mb-2 font-sans">Ciudades Activas</p>
 <h3 className="text-4xl font-black text-[var(--acc)] font-display flex items-center gap-2">
 <MapPin className="w-8 h-8" />
 {new Set(fans.map(f => f.ciudad).filter(Boolean)).size}
 </h3>
 </div>
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 flex flex-col justify-center">
 <p className="text-xs font-bold text-[var(--ink-2)] tracking-widest mb-2 font-sans">Clics Totales en QR & Redes</p>
 <h3 className="text-4xl font-black text-[var(--ink-2)] font-display flex items-center gap-2">
 <ExternalLink className="w-7 h-7" />
 {Object.entries(clickStats).filter(([k]) => !k.endsWith('_last_at')).reduce((a, b) => a + Number(b[1] || 0), 0)}
 </h3>
 </div>
 </div>

 {/* Breakdown de Clics por Red Social, Métodos de Pago y Dossier */}
 {Object.keys(clickStats).length > 0 && (
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 space-y-3">
 <h4 className="text-xs font-bold text-[var(--acc)] font-sans tracking-wider flex items-center gap-2">
 <TrendingUp className="w-4 h-4" /> Impacto de Enlaces en FansLanding & QR (Por Canal y Donaciones)
 </h4>
 <div className="flex flex-wrap items-center gap-2 pt-1">
 {Object.entries(clickStats)
 .filter(([k]) => !k.endsWith('_last_at'))
 .map(([key, count]) => (
 <div key={key} className="px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)] text-xs font-sans flex items-center gap-2">
 <span className="font-semibold text-[var(--ink-2)]">{key}:</span>
 <span className="font-black text-[var(--acc)]">{count} {count === 1 ?'clic' :'clics'}</span>
 </div>
 ))}
 </div>
 </div>
 )}
 
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
 {/* Crecimiento Evolutivo de Fans */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 h-88 flex flex-col">
 <div className="flex items-center justify-between mb-4">
 <div>
 <p className="text-xs font-bold text-[var(--ink-2)] tracking-widest font-sans flex items-center gap-2">
 <TrendingUp className="w-4 h-4 text-[var(--acc)]" />
 Crecimiento Evolutivo de Fans
 </p>
 <p className="text-[11px] text-[var(--ink-2)] font-sans">Curva acumulativa de la comunidad {effectiveBandName}</p>
 </div>
 <span className="text-xs font-sans font-bold text-[var(--acc)] bg-[var(--acc)]/10 px-2.5 py-1 rounded-[var(--r-s)]">
 Total: {fans.length} fans
 </span>
 </div>
 
 <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
 {evolutionaryGrowthData.length > 0 ? (
 <Onda
 data={evolutionaryGrowthData.map((d) => ({
 label: d.date ||' Sin fecha',
 value: d.total || 0,
 color:' var(--acc)'
 }))}
 height={240}
 barWidth={16}
 gap={10}
 showLabels={true}
 animated={true}
 tooltipFormatter={(val) => `${val} fans acumulados`}
 className="w-full"
 />
 ) : (
 <div className="flex flex-col items-center justify-center h-full gap-4">
 <PublicoSilhouette opacity={0.12} size="medium" />
 <div className="text-center space-y-1">
 <p className="text-sm font-semibold text-[var(--ink)]">La sala está vacía</p>
 <p className="text-xs text-[var(--ink-2)]">Empieza a registrar fans y ve cómo crece tu comunidad</p>
 </div>
 </div>
 )}
 </div>
 </div>
 
 {/* Canal de Origen (Fixed & Visual) */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 h-88 flex flex-col">
 <div className="mb-2">
 <p className="text-xs font-bold text-[var(--ink-2)] tracking-widest font-sans">Canal de Origen de Fans</p>
 <p className="text-[11px] text-[var(--ink-2)] font-sans">De dónde provienen los registros</p>
 </div>

 <div className="flex-1 min-h-0 flex flex-col sm:flex-row items-center gap-4">
 {originData.length > 0 ? (
 <>
 <div className="w-full sm:w-1/2 h-48 sm:h-full">
 <ResponsiveContainer width="100%" height="100%">
 <PieChart>
 <Pie
 data={originData}
 cx="50%"
 cy="50%"
 innerRadius={50}
 outerRadius={75}
 paddingAngle={4}
 dataKey="value"
 nameKey="name"
 >
 {originData.map((entry, index) => (
 <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
 ))}
 </Pie>
 <Tooltip 
 contentStyle={{backgroundColor:'#0f172a', borderColor:'#334155', fontSize:'12px', borderRadius:'12px', color:'#fff'}}
 formatter={(val: any, name: any) => [`${val} fans (${Math.round((val / (fans.length || 1)) * 100)}%)`, name]}
 />
 </PieChart>
 </ResponsiveContainer>
 </div>

 {/* Channel Legend List */}
 <div className="w-full sm:w-1/2 space-y-2 overflow-y-auto max-h-48 hide-scrollbar pr-1">
 {originData.map((item, idx) => (
 <div key={item.name} className="flex items-center justify-between bg-[var(--surface)] p-2 rounded-[var(--r-m)] text-xs font-sans">
 <div className="flex items-center gap-2 min-w-0">
 <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
 <span className="text-[var(--ink-2)] font-bold truncate">{item.name}</span>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <span className="text-[var(--acc)] font-bold">{item.value}</span>
 <span className="text-[var(--ink-2)] text-[10px]">({item.percentage}%)</span>
 </div>
 </div>
 ))}
 </div>
 </>
 ) : (
 <div className="flex items-center justify-center w-full h-full text-[var(--ink-2)] text-xs font-sans">No hay datos suficientes</div>
 )}
 </div>
 </div>
 </div>
 </div>
 )}

 {activeTab ==='fans' && (
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 space-y-5">
 {/* Configurable City Tabs Bar */}
 <div className="space-y-2 pb-4">
 <div className="flex items-center justify-between">
 <span className="text-xs font-bold text-[var(--ink-2)] font-sans tracking-wider flex items-center gap-1.5">
 <MapPin className="w-3.5 h-3.5 text-[var(--acc)]" />
 Filtrar por Ciudad (Pestañas Configurables Guardadas en BBDD)
 </span>
 {selectedCityFilter && (
 <button
 onClick={() => setSelectedCityFilter('')}
 className="text-[11px] font-sans text-[var(--acc)] hover:underline cursor-pointer"
 >
 Limpiar filtro ciudad
 </button>
 )}
 </div>

 <div className="flex flex-wrap items-center gap-2 pt-1">
 <button
 type="button"
 onClick={() => setSelectedCityFilter('')}
 className={`px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold transition-all cursor-pointer ${
 selectedCityFilter ===''
 ?'bg-[var(--acc)] text-[var(--ink)]'
 :'bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 >
 Todas ({fans.length})
 </button>

 {customCityChips.map(city => {
 const count = fans.filter(f => f.ciudad && f.ciudad.toLowerCase().includes(city.toLowerCase())).length;
 const isSelected = selectedCityFilter.toLowerCase() === city.toLowerCase();
 return (
 <div
 key={city}
 onClick={() => setSelectedCityFilter(city)}
 className={`group/city inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold transition-all cursor-pointer ${
 isSelected
 ?'bg-[var(--acc)] text-[var(--ink)]'
 :'bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)]'
 }`}
 >
 <span>{city}</span>
 <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
 isSelected ?'bg-[var(--surface)]/20 text-[var(--ink)]' :'bg-[var(--surface)] text-[var(--acc)]'
 }`}>
 {count}
 </span>
 <button
 type="button"
 onClick={(e) => handleRemoveCityTab(city, e)}
 className={`p-0.5 rounded-full hover:bg-[var(--alert)]/30 transition opacity-60 group-hover/city:opacity-100 ${
 isSelected ?'hover:text-[var(--alert)] text-[var(--ink)]' :'hover:text-[var(--ink-2)] text-[var(--ink-2)]'
 }`}
 title={`Eliminar pestaña ${city}`}
 >
 <X className="w-3 h-3" />
 </button>
 </div>
 );
 })}

 {isAddingCity ? (
 <form onSubmit={handleAddCityTab} className="flex items-center gap-1">
 <input
 type="text"
 autoFocus
 placeholder="Nueva ciudad..."
 value={newCityInput}
 onChange={e => setNewCityInput(e.target.value)}
 className="bg-[var(--surface)] rounded-[var(--r-m)] px-2.5 py-1 text-xs text-[var(--ink)] font-sans outline-none w-36"
 />
 <button
 type="submit"
 className="p-1 bg-[var(--acc)] text-[var(--ink)] rounded-[var(--r-s)] hover:bg-[var(--acc)]/60 transition cursor-pointer"
 title="Guardar ciudad"
 >
 <Check className="w-3.5 h-3.5" />
 </button>
 <button
 type="button"
 onClick={() => { setIsAddingCity(false); setNewCityInput(''); }}
 className="p-1 bg-[var(--surface)] text-[var(--ink-2)] rounded-[var(--r-s)] hover:bg-[var(--surface)] transition cursor-pointer"
 >
 <X className="w-3.5 h-3.5" />
 </button>
 </form>
 ) : (
 <button
 type="button"
 onClick={() => setIsAddingCity(true)}
 className="px-3 py-1.5 rounded-[var(--r-m)] text-xs font-sans font-bold bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc)] flex items-center gap-1 transition cursor-pointer"
 >
 <Plus className="w-3.5 h-3.5" />
 <span>Añadir ciudad</span>
 </button>
 )}
 </div>
 </div>

 <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
 <div className="flex flex-col sm:flex-row items-center gap-3 w-full">
 <div className="relative w-full sm:w-80">
 <Search className="w-4 h-4 text-[var(--ink-2)] absolute left-3 top-1/2 -translate-y-1/2" />
 <input
 type="text"
 placeholder="Buscar por nombre, email o ciudad..."
 value={searchQuery}
 onChange={e => setSearchQuery(e.target.value)}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] pl-9 pr-3 py-2 text-xs text-[var(--ink)] outline-none"
 />
 </div>
 <div className="relative w-full sm:w-64">
 <Filter className="w-4 h-4 text-[var(--ink-2)] absolute left-3 top-1/2 -translate-y-1/2" />
 <select
 value={filterOrigen}
 onChange={e => setFilterOrigen(e.target.value)}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] pl-9 pr-3 py-2 text-xs text-[var(--ink)] outline-none appearance-none font-sans"
 >
 <option value="">Todos los orígenes</option>
 {uniqueConcertIds.map(c => (
 <option key={c.id} value={c.id}>Concierto: {c.name}</option>
 ))}
 <option value="Otros">Redes Sociales / Amigos / Otros</option>
 </select>
 </div>
 <div className="relative w-full sm:w-48">
 <select
 value={selectedNivelFilter}
 onChange={e => setSelectedNivelFilter(e.target.value)}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] px-3 py-2 text-xs text-[var(--ink)] outline-none font-sans cursor-pointer"
 >
 <option value="">Todos los niveles</option>
 <option value="superfan">🔥 Superfan</option>
 <option value="fundador">🌟 Fan Fundador</option>
 <option value="fiel">🎸 Fan Fiel</option>
 <option value="backstage">🎟️ VIP Backstage</option>
 </select>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {/* View Switcher */}
 <div className="flex items-center gap-1 p-1 bg-[var(--surface)] rounded-[var(--r-m)]">
 <button
 type="button"
 onClick={() => setViewMode('feed')}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
 viewMode ==='feed' ?'bg-[var(--acc)] text-[var(--ink)]' :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Muro Social & Comunidad"
 >
 <MessageCircle className="w-3.5 h-3.5" />
 <span>Muro Social</span>
 </button>
 <button
 type="button"
 onClick={() => setViewMode('grid')}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
 viewMode ==='grid' ?'bg-[var(--acc)] text-[var(--ink)]' :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Vista en Tarjetas"
 >
 <LayoutGrid className="w-3.5 h-3.5" />
 <span>Tarjetas</span>
 </button>
 <button
 type="button"
 onClick={() => setViewMode('table')}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
 viewMode ==='table' ?'bg-[var(--acc)] text-[var(--ink)]' :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Vista en Detalles / Tabla"
 >
 <List className="w-3.5 h-3.5" />
 <span>Tabla CRM</span>
 </button>
 <button
 type="button"
 onClick={() => setViewMode('map')}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[11px] font-sans font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
 viewMode ==='map' ?'bg-[var(--acc)] text-[var(--ink)]' :'text-[var(--ink-2)] hover:text-[var(--ink)]'
 }`}
 title="Vista en Mapa por Ciudades"
 >
 <MapIcon className="w-3.5 h-3.5" />
 <span>Mapa</span>
 </button>
 </div>

 <span className="text-xs text-[var(--ink-2)] font-sans shrink-0 hidden sm:inline">
 {filteredFans.length} resultados
 </span>
 </div>
 </div>

 {viewMode ==='feed' && (
 <FansCommunityView
 fans={filteredFans}
 concerts={concerts}
 effectiveBandName={effectiveBandName}
 effectiveBandLogo={effectiveBandLogo}
 colors={colors}
 isStitchLight={isStitchLight}
 onUpdateFan={onUpdateFan}
 onDeleteFan={onDeleteFan}
 onOpenAddModal={() => setShowAddModal(true)}
 selectedCityFilter={selectedCityFilter}
 />
 )}

 {viewMode ==='grid' && (
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
 {filteredFans.length === 0 ? (
 <div className="col-span-full flex flex-col items-center justify-center py-12">
 <PublicoSilhouette opacity={12} size="medium" />
 <p className="mt-6 font-medium text-[var(--ink)] text-sm">Sin fans que coincidan</p>
 <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs text-center">
 Ajusta los filtros o espera a que tus primeros fans se unan.
 </p>
 </div>
 ) : (
 filteredFans.map(fan => (
 <div key={fan.id} className="bg-[var(--surface)] hover:/50 rounded-[var(--r-l)] p-4 transition-all space-y-3 relative group">
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]/10 flex items-center justify-center text-[var(--acc)] font-bold text-sm">
 {fan.nombre.charAt(0)}
 </div>
 <div>
 <h4 className="font-bold text-[var(--ink)] text-sm truncate max-w-[160px]">{fan.nombre}</h4>
 <p className="text-[11px] font-sans text-[var(--ink-2)] truncate max-w-[160px]">{fan.email}</p>
 </div>
 </div>
 <button
 type="button"
 onClick={() => {
 if (confirm(`¿Eliminar fan ${fan.nombre}?`)) {
 onDeleteFan(fan.id);
 }
 }}
 className="p-1.5 text-[var(--ink-2)] hover:bg-[var(--alert)]/20 hover:text-[var(--alert)] rounded-[var(--r-s)] transition cursor-pointer"
 title="Eliminar Fan"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>

 <div className="grid grid-cols-2 gap-2 text-[11px] font-sans pt-2 /80">
 <div className="bg-[var(--surface)]/80 p-2 rounded-[var(--r-s)]">
 <span className="text-[var(--ink-2)] text-[9px] block">Ciudad</span>
 <span className="text-[var(--ink-2)] flex items-center gap-1 font-semibold">
 <MapPin className="w-3 h-3 text-[var(--acc)] shrink-0" />
 <span className="truncate">{fan.ciudad ||'No especificada'}</span>
 </span>
 </div>
 <div className="bg-[var(--surface)]/80 p-2 rounded-[var(--r-s)]">
 <span className="text-[var(--ink-2)] text-[9px] block">Origen / Canal</span>
 <span className="text-[var(--acc)] truncate block font-semibold">{fan.comoConocio || fan.conciertoOrigenNombre ||'Directo'}</span>
 </div>
 </div>

 <div className="flex items-center justify-between text-[10px] font-sans text-[var(--ink-2)] pt-1">
 <span>Registrado: {fan.fechaCaptura ||'Reciente'}</span>
 {fan.consentimientoRGPD && (
 <span className="text-[var(--ok)] font-bold flex items-center gap-1 bg-[var(--ok)]/10 px-2 py-0.5 rounded-full">
 <Check className="w-3 h-3" /> RGPD Ok
 </span>
 )}
 </div>
 </div>
 ))
 )}
 </div>
 )}

 {viewMode ==='map' && (
 <div className="space-y-4">
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-4 text-xs font-sans text-[var(--ink-2)]">
 <div className="flex items-center gap-2 text-[var(--acc)] font-bold mb-3">
 <MapIcon className="w-4 h-4" />
 <span>Distribución Geográfica de la Comunidad de Fans por Ciudades</span>
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
 {Object.entries(
 filteredFans.reduce((acc, f) => {
 const city = f.ciudad ||'Ciudad no indicada';
 acc[city] = (acc[city] || 0) + 1;
 return acc;
 }, {} as Record<string, number>)
 )
 .sort((a,b) => (b[1] as number) - (a[1] as number))
 .map(([city, count]) => (
 <div key={city} className="bg-[var(--surface)] p-3 rounded-[var(--r-m)] flex items-center justify-between">
 <div className="flex items-center gap-2 truncate">
 <MapPin className="w-4 h-4 text-[var(--acc)] shrink-0" />
 <span className="font-bold text-[var(--ink)] truncate">{city}</span>
 </div>
 <span className="bg-[var(--acc)]/20 text-[var(--acc)]/70 text-[10px] font-bold px-2 py-0.5 rounded-full">
 {count} {count === 1 ?'fan' :'fans'}
 </span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {viewMode ==='table' && (
 <div className="overflow-x-auto">
 <table className="w-full text-left text-xs text-[var(--ink-2)]">
 <thead className="bg-[var(--surface)] text-[var(--acc)] font-bold font-sans">
 <tr>
 <th className="p-3">Nombre</th>
 <th className="p-3">Correo Electrónico</th>
 <th className="p-3">Ciudad</th>
 <th className="p-3">Canal</th>
 <th className="p-3">Concierto Asociado</th>
 <th className="p-3 text-center">RGPD</th>
 <th className="p-3 text-right">Acciones</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-slate-800/50">
 {filteredFans.length === 0 ? (
 <tr>
 <td colSpan={7} className="p-12">
 <div className="flex flex-col items-center justify-center">
 <PublicoSilhouette opacity={12} size="medium" />
 <p className="mt-6 font-medium text-[var(--ink)] text-sm">Sin fans que coincidan</p>
 <p className="mt-2 text-[var(--ink-2)] text-xs max-w-xs text-center">
 Ajusta los filtros o espera a que tus primeros fans se unan.
 </p>
 </div>
 </td>
 </tr>
 ) : (
 filteredFans.map(fan => (
 <tr key={fan.id} className="hover:bg-[var(--surface)]/20 transition group">
 <td className="p-3 font-semibold text-[var(--ink)]">
 <div className="flex items-center gap-2">
 <div className="w-6 h-6 rounded-full bg-[var(--acc)]/10 flex items-center justify-center text-[var(--acc)] font-bold text-[10px]">
 {fan.nombre.charAt(0)}
 </div>
 {fan.nombre}
 </div>
 </td>
 <td className="p-3 font-sans">{fan.email}</td>
 <td className="p-3">
 {fan.ciudad ? (
 <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-[var(--ink-2)]" /> {fan.ciudad}</span>
 ) : (
 <span className="text-[var(--ink-2)]">-</span>
 )}
 </td>
 <td className="p-3 font-sans text-[10px] text-[var(--ink-2)] tracking-wider">
 {fan.comoConocio ||'-'}
 </td>
 <td className="p-3 text-[11px] text-[var(--ok)] font-sans">
 {fan.conciertoOrigenNombre ||'-'}
 </td>
 <td className="p-3 text-center">
 {fan.consentimientoRGPD ? (
 <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-[var(--ok)]/10 text-[var(--ok)]">
 <Check className="w-3.5 h-3.5" />
 </span>
 ) :'-'}
 </td>
 <td className="p-3 text-right">
 <button
 onClick={() => {
 if (confirm(`¿Eliminar fan ${fan.nombre}?`)) {
 onDeleteFan(fan.id);
 }
 }}
 className="p-1.5 text-[var(--ink-2)] hover:bg-[var(--alert)] hover:text-[var(--ink)] rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </td>
 </tr>
 ))
 )}
 </tbody>
 </table>
 </div>
 )}
 </div>
 )}

 {activeTab ==='qr' && (
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 lg:p-8 space-y-5">
 <div className="space-y-1 pb-4">
 <h3 className="text-xl font-black text-[var(--ink)] flex items-center gap-2 font-display">
 <QrCode className="w-6 h-6 text-[var(--acc)]" /> Generador de QR
 </h3>
 <p className="text-xs text-[var(--ink-2)] font-sans">
 Genera el código, descárgalo o imprímelo. La recompensa al fan, el dominio y el idioma están abajo, plegados.
 </p>
 </div>

 {/* Vínculo a concierto: única decisión que cambia la URL, por eso va siempre visible */}
 <div className="flex flex-col sm:flex-row sm:items-center gap-2">
 <label className="text-[11px] font-bold text-[var(--acc)] font-sans tracking-wider shrink-0" title="Los fans que escaneen se registrarán con este origen en el CRM">
 Vincular a:
 </label>
 <select
 id="fans-concert-selector"
 value={selectedConcertId}
 onChange={e => setSelectedConcertId(e.target.value)}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-2.5 text-xs text-[var(--ink)] outline-none font-sans"
 >
 <option value="">-- Campaña General / QR Genérico de la Banda --</option>
 {concerts.map(c => (
 <option key={c.id} value={c.id}>
 📅 {c.fecha} — {c.sala} ({c.ciudad})
 </option>
 ))}
 </select>
 </div>

 {/* Contenido principal: el QR, grande y arriba del todo */}
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-6 flex flex-col items-center text-center space-y-4">
 <div id="qr-code-svg-container" className="p-4 bg-[var(--surface)] rounded-[var(--r-l)] inline-block relative">
 <QRCode value={qrConcertUrl} size={210} level="H" />
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
 {effectiveBandLogo ? (
 <div className="w-14 h-14 bg-[var(--surface)] rounded-[var(--r-m)] flex items-center justify-center overflow-hidden p-0.5">
 <img
 src={effectiveBandLogo}
 alt={`Logo ${effectiveBandName}`}
 className="w-full h-full object-contain rounded-[var(--r-s)]"
 />
 </div>
 ) : (
 <div className="w-12 h-12 bg-[var(--acc)] text-[var(--ink)] rounded-[var(--r-m)] flex items-center justify-center">
 <Users className="w-6 h-6" />
 </div>
 )}
 </div>
 </div>

 <div className="space-y-1">
 <h4 className="font-black text-[var(--ink)] font-display text-lg tracking-wider">
 {selectedConcert ? selectedConcert.sala : `Únete a ${effectiveBandName}`}
 </h4>
 <p className="text-xs text-[var(--ink-2)] font-sans">
 {selectedConcert ? `${selectedConcert.ciudad} • ${selectedConcert.fecha}` :'Escanea para conseguir tema exclusivo y descuentos'}
 </p>
 </div>

 <div className="w-full flex items-center gap-2 bg-[var(--surface)] rounded-[var(--r-m)] px-3 py-2">
 <span className="flex-1 min-w-0 truncate font-sans text-[var(--acc)]/70 text-[11px] text-left">{qrConcertUrl}</span>
 <button
 type="button"
 onClick={handleCopyQrUrl}
 className="shrink-0 text-[11px] text-[var(--acc)] hover:underline font-sans cursor-pointer"
 >
 {copiedQrUrl ?'¡Copiado!' :'Copiar'}
 </button>
 </div>

 {/* Acción principal + resto de acciones detrás de un único menú */}
 <div className="w-full flex items-center gap-2">
 <button
 id="fans-qr-export-btn"
 type="button"
 onClick={handlePrintQr}
 className="flex-1 py-3 px-4 bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] font-bold font-sans text-xs tracking-wider rounded-[var(--r-m)] flex items-center justify-center gap-2 transition cursor-pointer"
 >
 <Printer className="w-4 h-4" /> Cartel A4 / PDF
 </button>
 <div className="relative shrink-0">
 <button
 type="button"
 onClick={() => setShowQrMoreMenu(v => !v)}
 title="Más opciones: SVG, PNG 4K, tarjetas, compartir, previsualizar el formulario..."
 className="p-3.5 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--acc)] transition cursor-pointer"
 >
 <MoreHorizontal className="w-4 h-4" />
 </button>
 {showQrMoreMenu && (
 <>
 <div className="fixed inset-0 z-30" onClick={() => setShowQrMoreMenu(false)} />
 <div className="absolute right-0 bottom-full mb-1.5 z-40 w-64 rounded-[var(--r-m)] bg-[var(--surface)] p-1.5 space-y-0.5 text-[11px] font-sans">
 <button
 type="button"
 onClick={() => { setShowQrMoreMenu(false); handleDownloadSvg(); }}
 disabled={isExportingDirect}
 className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--ink-3)] hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2"
 >
 <FileCode className="w-3.5 h-3.5 shrink-0" /> Vector SVG (imprenta/lonas)
 </button>
 <button
 type="button"
 onClick={() => { setShowQrMoreMenu(false); handleDownloadPng4k(); }}
 disabled={isExportingDirect}
 className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--tentative)]/80 hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2"
 >
 <Download className="w-3.5 h-3.5 shrink-0" /> PNG Ultra HD 4K
 </button>
 <button
 type="button"
 onClick={() => { setShowQrMoreMenu(false); setShowQrExportModal(true); }}
 className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--acc)]/70 hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2"
 >
 <Layers className="w-3.5 h-3.5 shrink-0" /> Más formatos (tarjeta, pegatina...)
 </button>
 <div className="h-px bg-[var(--surface)] my-1" />
 <button
 type="button"
 onClick={() => { setShowQrMoreMenu(false); handleShareWhatsApp(); }}
 className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--ink-2)] hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2"
 >
 <MessageCircle className="w-3.5 h-3.5 shrink-0" /> Compartir por WhatsApp
 </button>
 <button
 type="button"
 onClick={() => { setShowQrMoreMenu(false); handleShareNative(); }}
 className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--ink-2)] hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2"
 >
 <Share2 className="w-3.5 h-3.5 shrink-0" /> Compartir enlace
 </button>
 <a
 href={qrConcertUrl}
 target="_blank"
 rel="noopener noreferrer"
 onClick={() => setShowQrMoreMenu(false)}
 className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--ink-2)] hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2"
 >
 <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Abrir landing en pestaña nueva
 </a>
 <button
 type="button"
 onClick={() => { setShowQrMoreMenu(false); setShowFansPreviewModal(true); }}
 className="w-full text-left px-2.5 py-2 rounded-[var(--r-s)] text-[var(--ink-2)] hover:bg-[var(--surface)] transition cursor-pointer flex items-center gap-2"
 >
 <Eye className="w-3.5 h-3.5 shrink-0" /> Previsualizar formulario"Únete"
 </button>
 </div>
 </>
 )}
 </div>
 </div>
 </div>

 {/* Personalización avanzada: recompensa, dominio/slug e idioma — plegada porque no se toca en cada visita */}
 <div className="border-t pt-4">
 <button
 type="button"
 onClick={() => setShowAdvancedQrConfig(v => !v)}
 className="w-full flex items-center justify-between text-xs font-bold text-[var(--ink-2)] hover:text-[var(--acc)]/70 font-sans tracking-wider transition cursor-pointer"
 >
 <span className="flex items-center gap-1.5">
 <Settings2 className="w-3.5 h-3.5" /> Personalización avanzada (recompensa, dominio, idioma)
 </span>
 <span>{showAdvancedQrConfig ?'▲' :'▼'}</span>
 </button>

 {showAdvancedQrConfig && (
 <div className="mt-4 space-y-4">
 {/* Incentivo / Recompensa al Fan */}
 <div id="fans-incentive-section" className="bg-[var(--surface)]/80 p-5 rounded-[var(--r-l)] space-y-4">
 <div className="flex items-center justify-between">
 <label className="text-xs font-bold text-[var(--acc)] font-sans tracking-wider flex items-center gap-2">
 <Gift className="w-4 h-4 text-[var(--acc)]" />
 Recompensa / Incentivo para el Fan
 </label>
 {savedIncentive && (
 <span className="text-[11px] font-sans text-[var(--ok)] flex items-center gap-1">
 <CheckCircle2 className="w-3.5 h-3.5" /> ¡Guardado!
 </span>
 )}
 </div>
 <p className="text-[11px] text-[var(--ink-2)] font-sans">
 Ofrece algo de valor al fan tras registrarse (un tema en directo exclusivo o descuento de merchan) para disparar la tasa de escaneos.
 </p>

 <div className="space-y-3 pt-1">
 <div>
 <label className="text-[11px] font-sans text-[var(--ink-2)] flex items-center gap-1.5 mb-1">
 <Sparkles className="w-3.5 h-3.5 text-[var(--acc)]" /> Mensaje de Bienvenida / Agradecimiento:
 </label>
 <input
 type="text"
 value={incentivo.mensajeAgradecimiento}
 onChange={e => setIncentivo(prev => ({ ...prev, mensajeAgradecimiento: e.target.value }))}
 placeholder="¡Muchas gracias por unirte a la familia de la banda!"
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-2.5 text-xs text-[var(--ink)] outline-none"
 />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="text-[11px] font-sans text-[var(--ink-2)] flex items-center gap-1.5 mb-1">
 <Music className="w-3.5 h-3.5 text-[var(--acc)]" /> Enlace de Descarga (Tema inédito/directo):
 </label>
 <input
 type="url"
 value={incentivo.enlaceDescarga}
 onChange={e => setIncentivo(prev => ({ ...prev, enlaceDescarga: e.target.value }))}
 placeholder="https://..."
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-2.5 text-xs text-[var(--ink)] outline-none font-sans"
 />
 </div>
 <div>
 <label className="text-[11px] font-sans text-[var(--ink-2)] flex items-center gap-1.5 mb-1">
 <Tag className="w-3.5 h-3.5 text-[var(--acc)]" /> Código Cupón Merchandising:
 </label>
 <input
 type="text"
 value={incentivo.codigoDescuento}
 onChange={e => setIncentivo(prev => ({ ...prev, codigoDescuento: e.target.value.toUpperCase() }))}
 placeholder="TUBANDA-FAN-10"
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-2.5 text-xs text-[var(--acc)]/70 font-bold outline-none font-sans"
 />
 </div>
 </div>

 <div className="flex justify-end pt-1">
 <button
 type="button"
 onClick={() => handleSaveIncentive()}
 className="px-4 py-2 bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)] text-xs font-bold font-sans rounded-[var(--r-m)] shadow transition flex items-center gap-1.5 cursor-pointer"
 >
 <Save className="w-3.5 h-3.5" /> Guardar Incentivo
 </button>
 </div>
 </div>
 </div>

 {/* Apoyo Económico / Revolut: se configura ahora desde el Dossier EPK, fuente única
 del resto de datos de marca (booking, redes, etc.) — aquí solo un acceso directo. */}
 <div className="bg-[var(--surface)]/80 p-5 rounded-[var(--r-l)] space-y-3">
 <label className="text-xs font-bold text-[var(--ink-2)] font-sans tracking-wider flex items-center gap-2">
 <Heart className="w-4 h-4 text-[var(--ink-2)]" />
 Colaboración Económica & Donaciones (Revolut, PayPal y Bizum)
 </label>
 <p className="text-[11px] text-[var(--ink-2)] font-sans">
 {epkConfig?.donacionRevolut?.habilitado !== false && epkConfig?.donacionRevolut?.revolutTag
 ? `Activa para revolut.me/${epkConfig.donacionRevolut.revolutTag} — se muestra en el formulario público"Únete" y en la pantalla de confirmación.`
 :'Aún no está configurada. Actívala para que tus fans puedan aportar directamente por Revolut, PayPal o Bizum, sin intermediarios.'}
 </p>
 <button
 type="button"
 onClick={() => onNavigate?.('epk')}
 className="px-4 py-2 bg-[var(--acc)] hover:bg-[var(--tentative)] text-[var(--ink)] text-xs font-bold font-sans rounded-[var(--r-m)] shadow transition flex items-center gap-1.5 cursor-pointer"
 >
 <ExternalLink className="w-3.5 h-3.5" /> Configurar en el Dossier EPK
 </button>
 </div>

 {/* Ruta Limpia y Dominio */}
 <div className="bg-[var(--surface)]/80 p-5 rounded-[var(--r-l)] space-y-4">
 <label className="text-xs font-bold text-[var(--acc)] font-sans tracking-wider flex items-center gap-2">
 Ruta Limpia y Dominio Base
 </label>

 <div className="grid grid-cols-2 gap-2 text-xs">
 <button
 type="button"
 onClick={() => setUseCustomDomain(true)}
 className={`p-2.5 rounded-[var(--r-m)] text-left font-sans transition flex flex-col gap-1 ${
 useCustomDomain
 ?'bg-[var(--acc)]/15 text-[var(--acc)]/70 font-bold'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:'
 }`}
 >
 <span>🌐 Dominio Web Oficial</span>
 <span className="text-[10px] text-[var(--ink-2)] font-normal">Para impresiones/carteles</span>
 </button>
 <button
 type="button"
 onClick={() => setUseCustomDomain(false)}
 className={`p-2.5 rounded-[var(--r-m)] text-left font-sans transition flex flex-col gap-1 ${
 !useCustomDomain
 ?'bg-[var(--acc)]/15 text-[var(--acc)]/70 font-bold'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:'
 }`}
 >
 <span>🧪 Servidor Dev</span>
 <span className="text-[10px] text-[var(--ink-2)] font-normal">Para pruebas en visor actual</span>
 </button>
 </div>

 {useCustomDomain && (
 <div className="space-y-1">
 <label className="text-[11px] font-sans text-[var(--ink-2)]">Dominio del Proyecto:</label>
 <div className="flex items-center gap-2">
 <span className="text-xs font-sans text-[var(--ink-2)] bg-[var(--surface)] px-3 py-2.5 rounded-[var(--r-s)]">https://</span>
 <input
 type="text"
 value={customDomain}
 onChange={e => setCustomDomain(e.target.value)}
 placeholder="bandmanager.io"
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-s)] p-2.5 text-xs text-[var(--ink)] outline-none font-sans"
 />
 </div>
 </div>
 )}

 <div className="space-y-1 pt-1">
 <label className="text-[11px] font-sans text-[var(--ink-2)]">Slug personalizado:</label>
 <div className="flex items-center gap-2">
 <div className="flex items-center bg-[var(--surface)] rounded-[var(--r-m)] px-2.5 shrink-0">
 <span className="text-[11px] font-sans text-[var(--ink-2)]">/</span>
 <input
 type="text"
 value={routePrefix}
 onChange={e => setRoutePrefix(e.target.value.toLowerCase().replace(/[^a-z0-9]/g,''))}
 className="w-16 bg-transparent text-[var(--acc)] text-xs font-sans py-2.5 font-bold outline-none"
 placeholder="unete"
 />
 <span className="text-[11px] font-sans text-[var(--ink-2)]">/</span>
 </div>
 <input
 type="text"
 value={customSlug}
 onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-_]/g,''))}
 placeholder="ej. madrid-sala-siroco"
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-2.5 text-xs text-[var(--ink)] outline-none font-sans"
 />
 </div>
 </div>

 <div className="space-y-1 pt-1">
 <label className="text-[11px] font-sans text-[var(--ink-2)]">Idioma del formulario para este enlace:</label>
 {/* grid en vez de flex de una sola fila: con 4+ idiomas (español, inglés,
 italiano, checo) un flex sin wrap se salía de la pantalla en móvil en
 vez de pasar a una segunda fila. */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 {FAN_FORM_LANGUAGES.map(l => (
 <button
 key={l.code}
 type="button"
 onClick={() => setQrLanguage(l.code)}
 className={`py-2 px-2 rounded-[var(--r-m)] text-xs font-sans font-bold flex items-center justify-center gap-1.5 transition-colors ${
 qrLanguage === l.code
 ?'bg-[var(--acc)]/15 /50 text-[var(--acc)]/70'
 :'bg-[var(--surface)] text-[var(--ink-2)] hover:'
 }`}
 >
 <span>{l.flag}</span>
 <span>{l.label}</span>
 </button>
 ))}
 </div>
 <p className="text-[10px] font-sans text-[var(--ink-2)]">
 El formulario se abrirá en este idioma por defecto; quien lo escanee siempre podrá cambiarlo a mano.
 </p>
 </div>

 {selectedConcert && onUpdateConcert && (
 <div className="pt-2 /80">
 <button
 type="button"
 onClick={() => {
 onUpdateConcert(selectedConcert.id, { customQrUrl: qrConcertUrl });
 setSavedToConcertFeedback(true);
 setTimeout(() => setSavedToConcertFeedback(false), 3500);
 }}
 className={`w-full py-2.5 px-3 font-bold font-sans text-xs tracking-wider rounded-[var(--r-m)] flex items-center justify-center gap-2 transition cursor-pointer ${
 savedToConcertFeedback
 ?'bg-[var(--ok)] text-[var(--ink)]'
 :'bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--ink)]'
 }`}
 >
 <CheckCircle2 className="w-4 h-4" />
 {savedToConcertFeedback
 ?'¡QR Asignado a este Concierto en el Calendario!'
 :'💾 Asignar este QR a este Concierto en el Calendario'}
 </button>
 </div>
 )}
 </div>
 </div>
 )}
 </div>

 {/* Modal de Exportación Avanzada de QR */}
 <QrExportModal
 isOpen={showQrExportModal}
 onClose={() => setShowQrExportModal(false)}
 svgElementId="qr-code-svg-container"
 bandName={effectiveBandName}
 concertTitle={selectedConcert ? selectedConcert.sala : undefined}
 dateCity={selectedConcert ? `${selectedConcert.ciudad} • ${selectedConcert.fecha}` : undefined}
 url={qrConcertUrl}
 logoUrl={effectiveBandLogo}
 />
 </div>
 )}



 {activeTab ==='metrics' && (
 <div className="space-y-6">
 <ReelsMetricsView
 colors={colors || THEMES.indie_velvet}
 isStitchLight={isStitchLight}
 metrics={metrics || []}
 epkConfig={epkConfig}
 currentBandName={effectiveBandName}
 onAddMetric={onAddMetric}
 onUpdateMetric={onUpdateMetric}
 onDeleteMetric={onDeleteMetric}
 onScanRealMetrics={onScanRealMetrics}
 onSyncMetrics={onSyncMetrics}
 isScanningMetrics={isScanningMetrics}
 isSyncingMetrics={isSyncingMetrics}
 fans={fans}
 />
 </div>
 )}

 {showAddModal && (
 <div className="fixed inset-0 bg-[var(--surface)]/80 z-50 flex items-center justify-center p-4">
 <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-lg w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
 <div className="flex items-center justify-between pb-3">
 <h3 className="text-lg font-black text-[var(--ink)] font-display tracking-widest flex items-center gap-2">
 <Users className="w-5 h-5 text-[var(--acc)]" />
 Registrar Fan / Seguidor Manual
 </h3>
 <button 
 type="button" 
 onClick={() => setShowAddModal(false)}
 className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1"
 >
 ✕
 </button>
 </div>
 <form onSubmit={handleManualAddSubmit} className="space-y-4">
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="text-[10px] font-bold text-[var(--acc)] font-sans tracking-widest mb-1.5 block">Nombre *</label>
 <input
 type="text"
 required
 placeholder="Nombre completo o alias"
 value={newNombre}
 onChange={e => setNewNombre(e.target.value)}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-3 text-xs text-[var(--ink)] outline-none font-sans"
 />
 </div>
 <div>
 <label className="text-[10px] font-bold text-[var(--acc)] font-sans tracking-widest mb-1.5 block">Email *</label>
 <input
 type="email"
 required
 placeholder="email@ejemplo.com"
 value={newEmail}
 onChange={e => setNewEmail(e.target.value)}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-3 text-xs text-[var(--ink)] outline-none font-sans"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="text-[10px] font-bold text-[var(--acc)] font-sans tracking-widest mb-1.5 block">Ciudad</label>
 <input
 type="text"
 placeholder="Ej: Madrid, Sevilla..."
 value={newCiudad}
 onChange={e => setNewCiudad(e.target.value)}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-3 text-xs text-[var(--ink)] outline-none font-sans"
 />
 </div>
 <div>
 <label className="text-[10px] font-bold text-[var(--acc)] font-sans tracking-widest mb-1.5 block">Origen / Canal</label>
 <select
 value={newOrigen}
 onChange={e => setNewOrigen(e.target.value)}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-3 text-xs text-[var(--ink)] outline-none font-sans"
 >
 <option value="Manual">Registro Manual</option>
 <option value="Concierto Directo">Concierto / Directo</option>
 <option value="Instagram">Instagram</option>
 <option value="TikTok">TikTok</option>
 <option value="Spotify">Spotify / Streaming</option>
 <option value="Web Oficial">Web Oficial / QR</option>
 <option value="Recomendación">Recomendación / Amigo</option>
 </select>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 <div>
 <label className="text-[10px] font-bold text-[var(--acc)] font-sans tracking-widest mb-1.5 block">Nivel Fan</label>
 <select
 value={newNivel}
 onChange={e => setNewNivel(e.target.value as any)}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-3 text-xs text-[var(--ink)] outline-none font-sans"
 >
 <option value="fiel">🎵 Oyente Fiel</option>
 <option value="superfan">🔥 Superfan Directos</option>
 <option value="fundador">🌟 Fan Fundador</option>
 <option value="backstage">🎸 Backstage VIP</option>
 </select>
 </div>
 <div>
 <label className="text-[10px] font-bold text-[var(--acc)] font-sans tracking-widest mb-1.5 block">Instagram (Opcional)</label>
 <input
 type="text"
 placeholder="@usuario"
 value={newInstagram}
 onChange={e => setNewInstagram(e.target.value)}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-3 text-xs text-[var(--ink)] outline-none font-sans"
 />
 </div>
 </div>

 <div>
 <label className="text-[10px] font-bold text-[var(--acc)] font-sans tracking-widest mb-1.5 block">Canción Favorita (Opcional)</label>
 <input
 type="text"
 placeholder="Ej: La Noche Entera, Balada..."
 value={newCancionFavorita}
 onChange={e => setNewCancionFavorita(e.target.value)}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-3 text-xs text-[var(--ink)] outline-none font-sans"
 />
 </div>

 <div>
 <label className="text-[10px] font-bold text-[var(--acc)] font-sans tracking-widest mb-1.5 block">Mensaje / Dedicatoria para el Muro (Opcional)</label>
 <textarea
 rows={2}
 placeholder="Dedicatoria o saludo que aparecerá en el muro de la comunidad..."
 value={newMensaje}
 onChange={e => setNewMensaje(e.target.value)}
 className="w-full bg-[var(--surface)] focus: rounded-[var(--r-m)] p-3 text-xs text-[var(--ink)] outline-none font-sans resize-none"
 />
 </div>

 <div className="pt-2 flex justify-end gap-3">
 <button
 type="button"
 onClick={() => setShowAddModal(false)}
 className="px-5 py-2.5 bg-[var(--surface)] text-[var(--ink-2)] font-sans text-xs font-bold tracking-widest rounded-[var(--r-m)] transition hover:bg-[var(--surface)] cursor-pointer"
 >
 Cancelar
 </button>
 <button
 type="submit"
 className="px-5 py-2.5 bg-[var(--acc)] text-[var(--ink)] font-sans text-xs font-black tracking-widest rounded-[var(--r-m)] transition hover:bg-[var(--acc)]/60 cursor-pointer flex items-center gap-1.5"
 >
 <Plus className="w-4 h-4" /> Guardar Fan
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* Modal Simulador / Vista Previa In-App del Formulario Únete */}
 <FansLandingPreviewModal
 isOpen={showFansPreviewModal}
 onClose={() => setShowFansPreviewModal(false)}
 currentBandId={currentBandId}
 currentBandName={effectiveBandName}
 currentBandLogo={effectiveBandLogo}
 epkConfig={epkConfig}
 concerts={concerts}
 initialConcertId={selectedConcertId}
 initialLanguage={qrLanguage}
 />

 {/* Tutorial Interactivo Paso a Paso */}
 <ModuleTutorialModal
 moduleId="fans"
 isOpen={isTutorialOpen}
 onClose={closeTutorial}
 />
 </div>
 );
};
export default FansPanel;
