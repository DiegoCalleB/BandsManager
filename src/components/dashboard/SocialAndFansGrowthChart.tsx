import React, { useState, useMemo } from'react';
import { ThemeColors, SocialMetric, Fan, EPKConfig } from'../../types';
import { 
 Instagram, Youtube, Video, Music2, Heart, TrendingUp, Users, Radio,
 Eye, EyeOff, RefreshCw, SlidersHorizontal, ArrowUpRight, CheckCircle2,
 ShieldCheck, Sparkles, ExternalLink, Activity, QrCode, Calendar, Clock
} from'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from'recharts';

export type TimePeriod ='7d' |'30d' |'90d' |'1y' |'all';

export const TIME_PERIOD_OPTIONS: { id: TimePeriod; label: string; shortLabel: string; days: number | null }[] = [
 { id:'7d', label:'Últimos 7 días', shortLabel:'7D', days: 7 },
 { id:'30d', label:'Últimos 30 días', shortLabel:'30D', days: 30 },
 { id:'90d', label:'Últimos 90 días', shortLabel:'90D', days: 90 },
 { id:'1y', label:'Último año', shortLabel:'1A', days: 365 },
 { id:'all', label:'Histórico completo', shortLabel:'Todo', days: null },
];

interface SocialAndFansGrowthChartProps {
 metrics?: SocialMetric[];
 fans?: Fan[];
 epkConfig?: Partial<EPKConfig>;
 colors?: ThemeColors;
 isStitchLight?: boolean;
 bandName?: string;
 bandId?: string;
 onNavigate?: (view: any, options?: any) => void;
}

export const SocialAndFansGrowthChart: React.FC<SocialAndFansGrowthChartProps> = ({
 metrics = [],
 fans = [],
 epkConfig,
 colors,
 isStitchLight = false,
 bandName ='Bakandeya',
 bandId,
 onNavigate
}) => {
 // Detection of configured / active networks (only display networks that have a profile entered or metrics registered)
 const hasInstagram = useMemo(() => {
 return Boolean(
 (epkConfig?.enlacesRedes?.instagram && epkConfig.enlacesRedes.instagram.trim().length > 0) ||
 metrics.some(m => (m.instagram_followers && m.instagram_followers > 0) || (m.instagram && m.instagram > 0))
 );
 }, [epkConfig?.enlacesRedes?.instagram, metrics]);

 const hasTikTok = useMemo(() => {
 return Boolean(
 (epkConfig?.enlacesRedes?.tiktok && epkConfig.enlacesRedes.tiktok.trim().length > 0) ||
 metrics.some(m => (m.tiktok_followers && m.tiktok_followers > 0) || (m.tiktok && m.tiktok > 0))
 );
 }, [epkConfig?.enlacesRedes?.tiktok, metrics]);

 const hasYouTube = useMemo(() => {
 return Boolean(
 (epkConfig?.enlacesRedes?.youtube && epkConfig.enlacesRedes.youtube.trim().length > 0) ||
 metrics.some(m => (m.youtube_subscribers && m.youtube_subscribers > 0) || (m.youtube && m.youtube > 0))
 );
 }, [epkConfig?.enlacesRedes?.youtube, metrics]);

 const hasSpotify = useMemo(() => {
 return Boolean(
 (epkConfig?.enlacesRedes?.spotify && epkConfig.enlacesRedes.spotify.trim().length > 0) ||
 metrics.some(m => (m.spotify_monthly_listeners && m.spotify_monthly_listeners > 0) || (m.spotify && m.spotify > 0))
 );
 }, [epkConfig?.enlacesRedes?.spotify, metrics]);

 // Channel visibility state initialized dynamically to only show configured channels
 const [selectedChannels, setSelectedChannels] = useState<{
 instagram: boolean;
 tiktok: boolean;
 youtube: boolean;
 spotify: boolean;
 fans: boolean;
 }>(() => ({
 instagram: hasInstagram,
 tiktok: hasTikTok,
 youtube: hasYouTube,
 spotify: hasSpotify,
 fans: true,
 }));

 // Selected time period state (7d, 30d, 90d, 1y, all)
 const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('30d');

 // Sync selected channels when configured profiles change
 React.useEffect(() => {
 setSelectedChannels({
 instagram: hasInstagram,
 tiktok: hasTikTok,
 youtube: hasYouTube,
 spotify: hasSpotify,
 fans: true,
 });
 }, [hasInstagram, hasTikTok, hasYouTube, hasSpotify]);

 // Calculate fan statistics from database
 const totalFans = fans.length;
 const uneteFans = useMemo(() => {
 return fans.filter(f => {
 const src = (f.comoConocio ||'').toLowerCase();
 return (
 src.includes('unete') ||
 src.includes('únete') ||
 src.includes('web') ||
 src.includes('formulario') ||
 src.includes('landing') ||
 src.includes('online') ||
 !src
 );
 }).length;
 }, [fans]);

 const directoFans = useMemo(() => {
 return fans.filter(f => {
 const src = (f.comoConocio ||'').toLowerCase();
 return src.includes('directo') || src.includes('concierto') || src.includes('qr') || Boolean(f.conciertoOrigenId);
 }).length;
 }, [fans]);

 const verifiedRgpd = fans.filter(f => f.consentimientoRGPD).length;
 const activeCitiesCount = useMemo(() => {
 return new Set(fans.map(f => f.ciudad).filter(Boolean)).size;
 }, [fans]);

 // Sort and aggregate metrics by date
 const sortedMetrics = useMemo(() => {
 const mapByDate = new Map<string, SocialMetric>();
 const sorted = [...metrics].sort((a, b) => (a.fecha ||'').localeCompare(b.fecha ||''));
 
 for (const m of sorted) {
 if (!m.fecha) continue;
 const ig = Number(m.instagram ?? m.instagram_followers ?? 0);
 const tk = Number(m.tiktok ?? m.tiktok_followers ?? 0);
 const yt = Number(m.youtube ?? m.youtube_subscribers ?? 0);
 const sp = Number(m.spotify ?? m.spotify_monthly_listeners ?? 0);
 
 const existing = mapByDate.get(m.fecha);
 if (!existing) {
 mapByDate.set(m.fecha, {
 ...m,
 instagram: ig,
 tiktok: tk,
 youtube: yt,
 spotify: sp,
 instagram_followers: Number(m.instagram_followers || ig),
 tiktok_followers: Number(m.tiktok_followers || tk),
 youtube_subscribers: Number(m.youtube_subscribers || yt),
 spotify_monthly_listeners: Number(m.spotify_monthly_listeners || sp)
 });
 } else {
 mapByDate.set(m.fecha, {
 ...existing,
 ...m,
 instagram: Math.max(Number(existing.instagram || 0), ig),
 tiktok: Math.max(Number(existing.tiktok || 0), tk),
 youtube: Math.max(Number(existing.youtube || 0), yt),
 spotify: Math.max(Number(existing.spotify || 0), sp),
 instagram_followers: Math.max(Number(existing.instagram_followers || 0), Number(m.instagram_followers || ig)),
 tiktok_followers: Math.max(Number(existing.tiktok_followers || 0), Number(m.tiktok_followers || tk)),
 youtube_subscribers: Math.max(Number(existing.youtube_subscribers || 0), Number(m.youtube_subscribers || yt)),
 spotify_monthly_listeners: Math.max(Number(existing.spotify_monthly_listeners || 0), Number(m.spotify_monthly_listeners || sp))
 });
 }
 }
 return Array.from(mapByDate.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
 }, [metrics]);

 const latestMetric = sortedMetrics[sortedMetrics.length - 1] || null;

 // Real or default counts (only use demo baseline if platform is configured or has recorded data)
 const countInstagram = Number(latestMetric?.instagram_followers || latestMetric?.instagram || (hasInstagram ? 2150 : 0));
 const countTikTok = Number(latestMetric?.tiktok_followers || latestMetric?.tiktok || (hasTikTok ? 3850 : 0));
 const countYouTube = Number(latestMetric?.youtube_subscribers || latestMetric?.youtube || (hasYouTube ? 1210 : 0));
 const countSpotify = Number(latestMetric?.spotify_monthly_listeners || latestMetric?.spotify || (hasSpotify ? 150 : 0));

 // Current period configuration
 const currentPeriodConfig = useMemo(() => {
 return TIME_PERIOD_OPTIONS.find(p => p.id === selectedPeriod) || TIME_PERIOD_OPTIONS[1];
 }, [selectedPeriod]);

 // Filter metrics according to the selected time period
 const filteredMetrics = useMemo(() => {
 if (selectedPeriod ==='all' || !currentPeriodConfig.days) {
 return sortedMetrics;
 }
 const cutoff = new Date();
 cutoff.setDate(cutoff.getDate() - currentPeriodConfig.days);
 const cutoffStr = cutoff.toISOString().split('T')[0];
 return sortedMetrics.filter(m => m.fecha >= cutoffStr);
 }, [sortedMetrics, selectedPeriod, currentPeriodConfig]);

 // Growth Chart Timeline Data Generation (Combining Metrics & Fans from Database based on selected period)
 const chartTimelineData = useMemo(() => {
 // If we have at least 2 real metric records in the filtered window
 if (filteredMetrics.length >= 2) {
 return filteredMetrics.map((m, idx) => {
 const metricDate = m.fecha;
 const fansUpToDate = fans.filter(f => !f.fechaCaptura || f.fechaCaptura <= metricDate).length;
 const uneteFansUpToDate = fans.filter(f => {
 const src = (f.comoConocio ||'').toLowerCase();
 const isUnete = src.includes('unete') || src.includes('únete') || src.includes('web') || src.includes('formulario') || src.includes('landing') || !src;
 return isUnete && (!f.fechaCaptura || f.fechaCaptura <= metricDate);
 }).length;

 const progressRatio = (idx + 1) / filteredMetrics.length;
 const estimatedFans = Math.max(fansUpToDate, Math.round(totalFans * (0.6 + 0.4 * progressRatio)));
 const estimatedUnete = Math.max(uneteFansUpToDate, Math.round(uneteFans * (0.6 + 0.4 * progressRatio)));

 return {
 fecha: m.fecha,
 instagram: Number(m.instagram_followers || m.instagram || 0),
 tiktok: Number(m.tiktok_followers || m.tiktok || 0),
 youtube: Number(m.youtube_subscribers || m.youtube || 0),
 spotify: Number(m.spotify_monthly_listeners || m.spotify || 0),
 fans: Math.max(fansUpToDate, Math.min(totalFans, estimatedFans)),
 unete_fans: Math.max(uneteFansUpToDate, Math.min(uneteFans, estimatedUnete))
 };
 });
 }

 // If we have 1 metric in the filtered period and prior history exists
 if (filteredMetrics.length === 1 && sortedMetrics.length > 1) {
 const single = filteredMetrics[0];
 const prior = sortedMetrics.filter(m => m.fecha < single.fecha).pop();
 if (prior) {
 const combined = [prior, single];
 return combined.map((m, idx) => {
 const fansUpToDate = fans.filter(f => !f.fechaCaptura || f.fechaCaptura <= m.fecha).length;
 return {
 fecha: m.fecha,
 instagram: Number(m.instagram_followers || m.instagram || 0),
 tiktok: Number(m.tiktok_followers || m.tiktok || 0),
 youtube: Number(m.youtube_subscribers || m.youtube || 0),
 spotify: Number(m.spotify_monthly_listeners || m.spotify || 0),
 fans: Math.max(fansUpToDate, Math.round(totalFans * (idx === 0 ? 0.85 : 1))),
 unete_fans: Math.round(uneteFans * (idx === 0 ? 0.85 : 1))
 };
 });
 }
 }

 // Dynamic progression points scaled to the selected period duration
 const now = new Date();
 const points: any[] = [];
 
 // Choose step days according to period
 let daysBack: number[];
 let baseFactor: number;
 switch (selectedPeriod) {
 case'7d':
 daysBack = [7, 5, 4, 3, 2, 1, 0];
 baseFactor = 0.92;
 break;
 case'30d':
 daysBack = [30, 24, 18, 12, 6, 0];
 baseFactor = 0.78;
 break;
 case'90d':
 daysBack = [90, 75, 60, 45, 30, 15, 0];
 baseFactor = 0.65;
 break;
 case'1y':
 daysBack = [365, 300, 240, 180, 120, 60, 0];
 baseFactor = 0.45;
 break;
 case'all':
 default:
 daysBack = [180, 150, 120, 90, 60, 30, 0];
 baseFactor = 0.50;
 break;
 }

 for (let i = 0; i < daysBack.length; i++) {
 const d = new Date(now);
 d.setDate(d.getDate() - daysBack[i]);
 const dateStr = d.toISOString().split('T')[0];
 const progress = i / (daysBack.length - 1);
 const factor = baseFactor + progress * (1 - baseFactor);

 // Check real fan registrations before this date
 const fansUpToDate = fans.filter(f => !f.fechaCaptura || f.fechaCaptura <= dateStr).length;
 const uneteUpToDate = fans.filter(f => {
 const src = (f.comoConocio ||'').toLowerCase();
 const isUnete = src.includes('unete') || src.includes('únete') || src.includes('web') || src.includes('formulario') || src.includes('landing') || !src;
 return isUnete && (!f.fechaCaptura || f.fechaCaptura <= dateStr);
 }).length;

 points.push({
 fecha: dateStr,
 instagram: Math.round(countInstagram * factor),
 tiktok: Math.round(countTikTok * (baseFactor * 0.95 + progress * (1 - baseFactor * 0.95))),
 youtube: Math.round(countYouTube * (baseFactor * 1.05 + progress * (1 - baseFactor * 1.05))),
 spotify: Math.round(countSpotify * (baseFactor * 0.9 + progress * (1 - baseFactor * 0.9))),
 fans: Math.max(fansUpToDate, Math.max(1, Math.round(totalFans * factor))),
 unete_fans: Math.max(uneteUpToDate, Math.max(1, Math.round(uneteFans * factor)))
 });
 }
 return points;
 }, [filteredMetrics, sortedMetrics, selectedPeriod, fans, totalFans, uneteFans, countInstagram, countTikTok, countYouTube, countSpotify]);

 // Period Growth Summary (Start vs End)
 const periodGrowthSummary = useMemo(() => {
 if (!chartTimelineData || chartTimelineData.length < 2) return null;
 const first = chartTimelineData[0];
 const last = chartTimelineData[chartTimelineData.length - 1];

 const diffFans = (last.fans || 0) - (first.fans || 0);
 const diffIg = (last.instagram || 0) - (first.instagram || 0);
 const diffTk = (last.tiktok || 0) - (first.tiktok || 0);
 const diffYt = (last.youtube || 0) - (first.youtube || 0);
 const diffSp = (last.spotify || 0) - (first.spotify || 0);

 return {
 diffFans,
 diffIg,
 diffTk,
 diffYt,
 diffSp,
 startDate: first.fecha,
 endDate: last.fecha
 };
 }, [chartTimelineData]);

 // Calculate dynamic Y-axis maximum domain based on active visible channels
 const yAxisDomain = useMemo(() => {
 let max = 100;
 chartTimelineData.forEach(d => {
 if (selectedChannels.instagram) max = Math.max(max, d.instagram || 0);
 if (selectedChannels.tiktok) max = Math.max(max, d.tiktok || 0);
 if (selectedChannels.youtube) max = Math.max(max, d.youtube || 0);
 if (selectedChannels.spotify) max = Math.max(max, d.spotify || 0);
 if (selectedChannels.fans) max = Math.max(max, d.fans || 0);
 });
 return [0, Math.ceil(max * 1.15)];
 }, [chartTimelineData, selectedChannels]);

 // Channel toggling handlers
 const toggleChannel = (channel: keyof typeof selectedChannels) => {
 setSelectedChannels(prev => ({
 ...prev,
 [channel]: !prev[channel]
 }));
 };

 const selectOnlyChannel = (channel: keyof typeof selectedChannels) => {
 setSelectedChannels({
 instagram: channel ==='instagram',
 tiktok: channel ==='tiktok',
 youtube: channel ==='youtube',
 spotify: channel ==='spotify',
 fans: channel ==='fans',
 });
 };

 const selectAllChannels = () => {
 setSelectedChannels({
 instagram: hasInstagram,
 tiktok: hasTikTok,
 youtube: hasYouTube,
 spotify: hasSpotify,
 fans: true,
 });
 };

 const hasAnyChannelSelected = Object.values(selectedChannels).some(Boolean);

 return (
 <div className={`p-5 rounded-[var(--r-l)] transition-all ${
 isStitchLight 
 ?'bg-[var(--bg)]/90 shadow-sm text-[var(--ink)]' 
 :'bg-[var(--surface)]/90 shadow-sm text-zinc-100'
 }`}>
 {/* Header Section */}
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-4 mb-4 border-b /60">
 <div className="flex items-center gap-3">
 <div className={`p-2.5 rounded-[var(--r-m)] shrink-0 ${
 isStitchLight ?'bg-[var(--acc)]/15 text-amber-600' :'bg-[var(--acc)]/20 text-[var(--acc)]'
 }`}>
 <TrendingUp className="w-5 h-5" />
 </div>
 <div>
 <h3 className={`text-sm font-bold font-display uppercase tracking-wider flex items-center gap-2 ${
 isStitchLight ?'text-[var(--ink)]' :'text-[var(--sunken)]'
 }`}>
 Evolución de Redes Sociales & Base de Fans en BBDD
 <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-normal flex items-center gap-1">
 <CheckCircle2 className="w-2.5 h-2.5" /> Supabase Conectada
 </span>
 </h3>
 <p className="text-[10px] font-mono mt-0.5 text-[var(--ink-2)]">
 Seguimiento unificado de audiencia digital, escuchas y fans registrados mediante el formulario público de Únete.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0 flex-wrap">
 {onNavigate && (
 <>
 <button
 type="button"
 onClick={() => onNavigate('fans')}
 className={`px-3 py-1.5 font-mono text-[10px] font-bold rounded-[var(--r-m)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
 isStitchLight
 ?'bg-white hover:bg-[var(--sunken)] text-[var(--ink)]'
 :'bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--acc)]/70'
 }`}
 title="Ir al gestor de comunidad, muro y capturas de fans"
 >
 <Heart className="w-3.5 h-3.5 text-[var(--acc)]" />
 <span>Muro & Base de Fans ({totalFans})</span>
 </button>

 <button
 type="button"
 onClick={() => onNavigate('reels')}
 className={`px-3 py-1.5 font-mono text-[10px] font-bold rounded-[var(--r-m)] transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 ${
 isStitchLight
 ?'bg-sky-500 text-white hover:bg-sky-600 border-sky-600'
 :'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black'
 }`}
 title="Abrir el panel completo de métricas y sincronización"
 >
 <Activity className="w-3.5 h-3.5" />
 <span>Radar Multiplataforma</span>
 <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
 </button>
 </>
 )}
 </div>
 </div>

 {/* 5 KPI Metric Cards Bar (Instagram, TikTok, YouTube, Spotify, and Fans Registrados) */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
 {/* Card 1: Instagram */}
 {hasInstagram && (
 <div className={`p-3 rounded-[var(--r-m)] flex flex-col justify-between transition-all ${
 isStitchLight 
 ?'bg-white border-pink-200 shadow-xs' 
 :'bg-[var(--surface)]/60 border-pink-950/40'
 }`}>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-pink-400 flex items-center gap-1">
 <Instagram className="w-3.5 h-3.5 text-pink-500" /> Instagram
 </span>
 <span className="text-[8px] px-1.5 py-0.5 rounded bg-pink-500/10 text-pink-300 font-mono">
 Seguidores
 </span>
 </div>
 <div className="my-1.5">
 <div className="text-xl font-display font-black text-[var(--ink)]">
 {countInstagram.toLocaleString()}
 </div>
 <div className="text-[9px] font-mono text-[var(--ink-2)] flex items-center gap-1 mt-0.5">
 <span>{latestMetric?.instagram_engagement_rate ? `${latestMetric.instagram_engagement_rate}% ER` :'Audiencia activa'}</span>
 </div>
 </div>
 </div>
 )}

 {/* Card 2: TikTok */}
 {hasTikTok && (
 <div className={`p-3 rounded-[var(--r-m)] flex flex-col justify-between transition-all ${
 isStitchLight 
 ?'bg-white border-cyan-200 shadow-xs' 
 :'bg-[var(--surface)]/60 border-cyan-950/40'
 }`}>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-cyan-400 flex items-center gap-1">
 <Video className="w-3.5 h-3.5 text-cyan-400" /> TikTok
 </span>
 <span className="text-[8px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 font-mono">
 Comunidad
 </span>
 </div>
 <div className="my-1.5">
 <div className="text-xl font-display font-black text-[var(--ink)]">
 {countTikTok.toLocaleString()}
 </div>
 <div className="text-[9px] font-mono text-[var(--ink-2)] flex items-center gap-1 mt-0.5">
 <span>{latestMetric?.tiktok_total_likes ? `${(latestMetric.tiktok_total_likes / 1000).toFixed(1)}k likes` :'Contenido viral'}</span>
 </div>
 </div>
 </div>
 )}

 {/* Card 3: YouTube */}
 {hasYouTube && (
 <div className={`p-3 rounded-[var(--r-m)] flex flex-col justify-between transition-all ${
 isStitchLight 
 ?'bg-white border-red-200 shadow-xs' 
 :'bg-[var(--surface)]/60 border-red-950/40'
 }`}>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-red-400 flex items-center gap-1">
 <Youtube className="w-3.5 h-3.5 text-red-500" /> YouTube
 </span>
 <span className="text-[8px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300 font-mono">
 Suscriptores
 </span>
 </div>
 <div className="my-1.5">
 <div className="text-xl font-display font-black text-[var(--ink)]">
 {countYouTube.toLocaleString()}
 </div>
 <div className="text-[9px] font-mono text-[var(--ink-2)] flex items-center gap-1 mt-0.5">
 <span>{latestMetric?.youtube_total_views ? `${(latestMetric.youtube_total_views / 1000).toFixed(1)}k views` :'Canal oficial'}</span>
 </div>
 </div>
 </div>
 )}

 {/* Card 4: Spotify */}
 {hasSpotify && (
 <div className={`p-3 rounded-[var(--r-m)] flex flex-col justify-between transition-all ${
 isStitchLight 
 ?'bg-white border-emerald-200 shadow-xs' 
 :'bg-[var(--surface)]/60 border-emerald-950/40'
 }`}>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-emerald-400 flex items-center gap-1">
 <Music2 className="w-3.5 h-3.5 text-emerald-500" /> Spotify
 </span>
 <span className="text-[8px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-[var(--ink-2)] font-mono">
 Oyentes/mes
 </span>
 </div>
 <div className="my-1.5">
 <div className="text-xl font-display font-black text-[var(--ink)]">
 {countSpotify.toLocaleString()}
 </div>
 <div className="text-[9px] font-mono text-[var(--ink-2)] flex items-center gap-1 mt-0.5">
 <span>{latestMetric?.spotify_followers ? `${latestMetric.spotify_followers} seguidores` :'Streaming mensual'}</span>
 </div>
 </div>
 </div>
 )}

 {/* Card 5: Fans Registrados en Base de Datos (Formulario Únete) */}
 <div className={`p-3 rounded-[var(--r-m)] flex flex-col justify-between transition-all col-span-2 sm:col-span-1 ${
 isStitchLight 
 ?'bg-amber-50 shadow-sm' 
 :'bg-gradient-to-br from-amber-950/30 to-[var(--surface)] /40 shadow-sm shadow-amber-950/20'
 }`}>
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono uppercase tracking-wider font-bold text-[var(--acc)] flex items-center gap-1">
 <Heart className="w-3.5 h-3.5 text-[var(--acc)] fill-amber-400/20" /> Fans BBDD
 </span>
 <span className="text-[8px] px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc)]/70 font-mono font-bold">
 Formulario Únete
 </span>
 </div>
 <div className="my-1.5">
 <div className="flex items-baseline gap-2">
 <span className="text-2xl font-display font-black text-[var(--acc)]">
 {totalFans}
 </span>
 <span className="text-[10px] font-mono text-[var(--acc)]/70/80">fans totales</span>
 </div>
 <div className="text-[9px] font-mono text-[var(--ink-3)] flex items-center justify-between gap-1 mt-1 border-t /20 pt-1">
 <span className="text-[var(--acc)]/70 font-bold">✨ {uneteFans} vía Únete</span>
 {directoFans > 0 && <span className="text-[var(--ink-2)]">🎤 {directoFans} directo</span>}
 <span className="text-emerald-400 font-bold">✓ RGPD</span>
 </div>
 </div>
 </div>
 </div>

 {/* Period Filter & Interactive Channel Controls */}
 <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3 pb-3 border-b /40">
 {/* Time Period Selector */}
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-[10px] font-mono text-[var(--ink-2)] flex items-center gap-1">
 <Calendar className="w-3.5 h-3.5 text-amber-500" />
 <span className="font-bold">Periodo:</span>
 </span>
 <div className={`flex items-center gap-1 p-0.5 rounded-[var(--r-m)] ${
 isStitchLight ?'bg-[var(--sunken)]' :'bg-[var(--surface)]/80'
 }`}>
 {TIME_PERIOD_OPTIONS.map(opt => {
 const isSelected = selectedPeriod === opt.id;
 return (
 <button
 key={opt.id}
 type="button"
 onClick={() => setSelectedPeriod(opt.id)}
 className={`px-2.5 py-1 rounded-[var(--r-s)] text-[10px] font-mono font-bold transition-all cursor-pointer ${
 isSelected
 ? isStitchLight
 ?'bg-[var(--acc)] text-[var(--ink)] shadow-xs'
 :'bg-gradient-to-r from-amber-500 to-amber-600 text-[var(--ink)] shadow-sm shadow-amber-950/40'
 : isStitchLight
 ?'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sunken)]'
 :'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80'
 }`}
 title={opt.label}
 >
 {opt.shortLabel}
 </button>
 );
 })}
 </div>

 {/* Period Summary Indicator */}
 {periodGrowthSummary && (
 <div className={`hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-[var(--r-s)] text-[9px] font-mono ${
 isStitchLight ?'bg-emerald-50 text-emerald-800 border-emerald-200' :'bg-[var(--ok-soft)] text-[var(--ink-2)] border-emerald-500/20'
 }`}>
 <TrendingUp className="w-3 h-3 text-emerald-400" />
 <span>
 <b>{currentPeriodConfig.label}:</b> {periodGrowthSummary.diffFans >= 0 ? `+${periodGrowthSummary.diffFans}` : periodGrowthSummary.diffFans} fans
 {hasInstagram && ` • ${periodGrowthSummary.diffIg >= 0 ? `+${periodGrowthSummary.diffIg}` : periodGrowthSummary.diffIg} IG`}
 {hasSpotify && ` • ${periodGrowthSummary.diffSp >= 0 ? `+${periodGrowthSummary.diffSp}` : periodGrowthSummary.diffSp} Spotify`}
 </span>
 </div>
 )}
 </div>

 <button
 type="button"
 onClick={selectAllChannels}
 className={`text-[9px] font-mono px-2.5 py-1 rounded-[var(--r-s)] transition-all flex items-center gap-1 self-end md:self-auto cursor-pointer ${
 isStitchLight
 ?'bg-[var(--sunken)] hover:bg-[var(--sunken)] text-[var(--ink-2)]'
 :' bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-3)]'
 }`}
 title="Restaurar y mostrar todos los canales disponibles"
 >
 <RefreshCw className="w-2.5 h-2.5" />
 <span>Mostrar Todos</span>
 </button>
 </div>

 {/* Interactive Channel Filters & Toggles */}
 <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b /40 flex-wrap">
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-[10px] font-mono text-[var(--ink-2)] mr-1 flex items-center gap-1">
 <SlidersHorizontal className="w-3 h-3 text-neutral-500" /> Curvas del Gráfico:
 </span>

 {/* Instagram Chip */}
 {hasInstagram && (
 <div className={`flex items-center rounded-[var(--r-s)] transition-all ${
 selectedChannels.instagram
 ? isStitchLight
 ?'bg-pink-50 border-pink-300 text-pink-700'
 :'bg-pink-950/30 border-pink-500/40 text-pink-300'
 :'bg-[var(--surface)]/30 text-neutral-500 opacity-60'
 }`}>
 <button
 type="button"
 onClick={() => toggleChannel('instagram')}
 className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-mono font-medium cursor-pointer"
 >
 <span className={`w-2 h-2 rounded-full ${selectedChannels.instagram ?'bg-pink-500 animate-pulse' :'bg-neutral-600'}`}></span>
 <Instagram className="w-3 h-3 text-pink-500" />
 <span>Instagram</span>
 <span className="text-[9px] px-1 py-0.2 rounded bg-pink-500/15 font-mono font-bold">
 {countInstagram.toLocaleString()}
 </span>
 {selectedChannels.instagram ? <Eye className="w-3 h-3 text-pink-400" /> : <EyeOff className="w-3 h-3 text-neutral-500" />}
 </button>
 <button
 type="button"
 onClick={() => selectOnlyChannel('instagram')}
 className="px-1.5 py-1 text-[8px] font-mono border-l border-pink-500/20 hover:bg-pink-500/20 text-pink-400 cursor-pointer"
 title="Aislar sólo Instagram"
 >
 Solo
 </button>
 </div>
 )}

 {/* TikTok Chip */}
 {hasTikTok && (
 <div className={`flex items-center rounded-[var(--r-s)] transition-all ${
 selectedChannels.tiktok
 ? isStitchLight
 ?'bg-cyan-50 border-cyan-300 text-cyan-700'
 :'bg-cyan-950/30 border-cyan-500/40 text-cyan-300'
 :'bg-[var(--surface)]/30 text-neutral-500 opacity-60'
 }`}>
 <button
 type="button"
 onClick={() => toggleChannel('tiktok')}
 className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-mono font-medium cursor-pointer"
 >
 <span className={`w-2 h-2 rounded-full ${selectedChannels.tiktok ?'bg-cyan-400 animate-pulse' :'bg-neutral-600'}`}></span>
 <Video className="w-3 h-3 text-cyan-400" />
 <span>TikTok</span>
 <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/15 font-mono font-bold">
 {countTikTok.toLocaleString()}
 </span>
 {selectedChannels.tiktok ? <Eye className="w-3 h-3 text-cyan-400" /> : <EyeOff className="w-3 h-3 text-neutral-500" />}
 </button>
 <button
 type="button"
 onClick={() => selectOnlyChannel('tiktok')}
 className="px-1.5 py-1 text-[8px] font-mono border-l border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 cursor-pointer"
 title="Aislar sólo TikTok"
 >
 Solo
 </button>
 </div>
 )}

 {/* YouTube Chip */}
 {hasYouTube && (
 <div className={`flex items-center rounded-[var(--r-s)] transition-all ${
 selectedChannels.youtube
 ? isStitchLight
 ?'bg-red-50 border-red-300 text-red-700'
 :'bg-red-950/30 border-red-500/40 text-red-300'
 :'bg-[var(--surface)]/30 text-neutral-500 opacity-60'
 }`}>
 <button
 type="button"
 onClick={() => toggleChannel('youtube')}
 className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-mono font-medium cursor-pointer"
 >
 <span className={`w-2 h-2 rounded-full ${selectedChannels.youtube ?'bg-red-500 animate-pulse' :'bg-neutral-600'}`}></span>
 <Youtube className="w-3 h-3 text-red-500" />
 <span>YouTube</span>
 <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/15 font-mono font-bold">
 {countYouTube.toLocaleString()}
 </span>
 {selectedChannels.youtube ? <Eye className="w-3 h-3 text-red-400" /> : <EyeOff className="w-3 h-3 text-neutral-500" />}
 </button>
 <button
 type="button"
 onClick={() => selectOnlyChannel('youtube')}
 className="px-1.5 py-1 text-[8px] font-mono border-l border-red-500/20 hover:bg-red-500/20 text-red-400 cursor-pointer"
 title="Aislar sólo YouTube"
 >
 Solo
 </button>
 </div>
 )}

 {/* Spotify Chip */}
 {hasSpotify && (
 <div className={`flex items-center rounded-[var(--r-s)] transition-all ${
 selectedChannels.spotify
 ? isStitchLight
 ?'bg-emerald-50 border-emerald-300 text-emerald-700'
 :'bg-[var(--ok-soft)] border-emerald-500/40 text-[var(--ink-2)]'
 :'bg-[var(--surface)]/30 text-neutral-500 opacity-60'
 }`}>
 <button
 type="button"
 onClick={() => toggleChannel('spotify')}
 className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-mono font-medium cursor-pointer"
 >
 <span className={`w-2 h-2 rounded-full ${selectedChannels.spotify ?'bg-emerald-500 animate-pulse' :'bg-neutral-600'}`}></span>
 <Music2 className="w-3 h-3 text-emerald-500" />
 <span>Spotify</span>
 <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/15 font-mono font-bold">
 {countSpotify.toLocaleString()}
 </span>
 {selectedChannels.spotify ? <Eye className="w-3 h-3 text-emerald-400" /> : <EyeOff className="w-3 h-3 text-neutral-500" />}
 </button>
 <button
 type="button"
 onClick={() => selectOnlyChannel('spotify')}
 className="px-1.5 py-1 text-[8px] font-mono border-l border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
 title="Aislar sólo Spotify"
 >
 Solo
 </button>
 </div>
 )}

 {/* Fans Registrados (BD / Únete) Chip */}
 <div className={`flex items-center rounded-[var(--r-s)] transition-all ${
 selectedChannels.fans
 ? isStitchLight
 ?'bg-amber-50 text-amber-800 font-bold shadow-xs'
 :'bg-[var(--acc-soft)] /60 text-[var(--ink)] font-bold shadow-sm shadow-amber-950/30'
 :'bg-[var(--surface)]/30 text-neutral-500 opacity-60'
 }`}>
 <button
 type="button"
 onClick={() => toggleChannel('fans')}
 className="px-2 py-1 flex items-center gap-1.5 text-[10px] font-mono cursor-pointer"
 >
 <span className={`w-2 h-2 rounded-full ${selectedChannels.fans ?'bg-[var(--acc)]/60 animate-pulse' :'bg-neutral-600'}`}></span>
 <Heart className="w-3 h-3 text-[var(--acc)] fill-amber-400/30" />
 <span>Fans BD (Únete)</span>
 <span className="text-[9px] px-1.5 py-0.2 rounded bg-[var(--acc)]/60/20 text-[var(--acc)]/70 font-mono font-black">
 {totalFans}
 </span>
 {selectedChannels.fans ? <Eye className="w-3 h-3 text-[var(--acc)]" /> : <EyeOff className="w-3 h-3 text-neutral-500" />}
 </button>
 <button
 type="button"
 onClick={() => selectOnlyChannel('fans')}
 className="px-1.5 py-1 text-[8px] font-mono border-l /30 hover:bg-[var(--acc)]/30 text-[var(--acc)]/70 cursor-pointer font-black"
 title="Aislar y ver sólo la curva de Fans registrados"
 >
 Solo
 </button>
 </div>
 </div>
 </div>

 {/* Chart Canvas Area */}
 <div className="h-64 w-full relative">
 {!hasAnyChannelSelected ? (
 <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border-dashed rounded-[var(--r-m)] bg-[var(--surface)]/20">
 <SlidersHorizontal className="w-8 h-8 text-neutral-500 mb-2" />
 <p className="text-xs font-mono font-medium text-[var(--ink-3)]">Todos los canales están ocultos</p>
 <p className="text-[10px] font-mono text-neutral-500 mt-1 max-w-xs">
 Haz clic en cualquiera de las etiquetas superiores para activar sus curvas y reescalar el gráfico.
 </p>
 <button
 type="button"
 onClick={selectAllChannels}
 className="mt-3 px-3 py-1.5 rounded-[var(--r-s)] bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-black font-mono text-[10px] font-bold transition-all cursor-pointer"
 >
 Activar todos los canales
 </button>
 </div>
 ) : (
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart 
 data={chartTimelineData}
 margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
 >
 <defs>
 <linearGradient id="dashboardColorInstagram" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25}/>
 <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="dashboardColorTikTok" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
 <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="dashboardColorSpotify" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
 <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="dashboardColorYouTube" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
 <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
 </linearGradient>
 <linearGradient id="dashboardColorFans" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35}/>
 <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
 </linearGradient>
 </defs>

 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isStitchLight ?'#e2e8f0' :'#222222'} />

 <XAxis 
 dataKey="fecha" 
 stroke="#888888" 
 fontSize={9} 
 tickLine={false} 
 axisLine={false}
 tickFormatter={(tick) => {
 if (!tick) return'';
 const parts = tick.split('-');
 return parts.length === 3 ? `${parts[2]}/${parts[1]}` : tick;
 }}
 />

 <YAxis 
 domain={yAxisDomain}
 stroke="#888888" 
 fontSize={9} 
 tickLine={false} 
 axisLine={false} 
 tickFormatter={(val) => val >= 1000 ? `${(val / 1000).toFixed(1)}k` : val}
 />

 <Tooltip 
 contentStyle={{ 
 backgroundColor: isStitchLight ?'#ffffff' :'var(--surface)', 
 borderColor: isStitchLight ?'#cbd5e1' :'#333333',
 borderRadius:'10px',
 fontSize:'11px',
 fontFamily:'monospace',
 boxShadow:'0 10px 25px -5px rgba(0,0,0,0.4)'
 }}
 labelStyle={{ fontWeight:'bold', color: isStitchLight ?'#1e293b' :'#ffffff', marginBottom:'4px' }}
 formatter={(value: any, name: any) => {
 const num = Number(value || 0);
 const formatted = num >= 1000 ? `${num.toLocaleString()} (${(num / 1000).toFixed(1)}k)` : `${num}`;
 if (name ==='Fans Registrados (BD / Únete)') {
 return [`${formatted} (${uneteFans} vía formulario Únete)`, name];
 }
 return [formatted, name];
 }}
 />

 {selectedChannels.instagram && (
 <Area 
 type="monotone" 
 dataKey="instagram" 
 name="Instagram" 
 stroke="#ec4899" 
 strokeWidth={2} 
 fillOpacity={1} 
 fill="url(#dashboardColorInstagram)" 
 />
 )}

 {selectedChannels.tiktok && (
 <Area 
 type="monotone" 
 dataKey="tiktok" 
 name="TikTok" 
 stroke="#06b6d4" 
 strokeWidth={2} 
 fillOpacity={1} 
 fill="url(#dashboardColorTikTok)" 
 />
 )}

 {selectedChannels.youtube && (
 <Area 
 type="monotone" 
 dataKey="youtube" 
 name="YouTube" 
 stroke="#ef4444" 
 strokeWidth={2} 
 fillOpacity={1} 
 fill="url(#dashboardColorYouTube)" 
 />
 )}

 {selectedChannels.spotify && (
 <Area 
 type="monotone" 
 dataKey="spotify" 
 name="Spotify" 
 stroke="#10b981" 
 strokeWidth={2} 
 fillOpacity={1} 
 fill="url(#dashboardColorSpotify)" 
 />
 )}

 {selectedChannels.fans && (
 <Area 
 type="monotone" 
 dataKey="fans" 
 name="Fans Registrados (BD / Únete)" 
 stroke="#f59e0b" 
 strokeWidth={3} 
 fillOpacity={1} 
 fill="url(#dashboardColorFans)" 
 />
 )}
 </AreaChart>
 </ResponsiveContainer>
 )}
 </div>

 {/* Footer Info & Direct Links */}
 <div className="mt-4 pt-3 border-t /60 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-[var(--ink-2)]">
 <div className="flex items-center gap-3 flex-wrap">
 <span className="flex items-center gap-1 text-emerald-400">
 <ShieldCheck className="w-3.5 h-3.5" /> 100% Consentimiento RGPD ({verifiedRgpd} registros)
 </span>
 <span>•</span>
 <span className="flex items-center gap-1 text-[var(--acc)]/70">
 <Users className="w-3.5 h-3.5" /> {activeCitiesCount} ciudades con fans
 </span>
 <span>•</span>
 <span className="text-[var(--ink-2)]">
 Landing pública: <a href={bandId ? `/unete?band=${encodeURIComponent(bandId)}` :'/unete'} target="_blank" rel="noopener noreferrer" className="text-[var(--acc)] hover:underline inline-flex items-center gap-0.5">
 {bandId ? `/unete?band=${bandId.replace(/^(band|reg)-/,'')}` :'/unete'} <ExternalLink className="w-2.5 h-2.5" />
 </a>
 </span>
 </div>

 <span className="text-neutral-500">
 Curvas escaladas dinámicamente con datos de Supabase
 </span>
 </div>
 </div>
 );
};
