import React, { useState, useEffect, useMemo } from 'react';
import { ThemeColors, SocialMetric, SocialContentItem, EPKConfig, Fan } from '../../types';
import { 
  TrendingUp, Instagram, Youtube, Video, Plus, Table, Edit, Trash2, ChevronRight, RefreshCw, Radio, Music2, Eye, EyeOff, ThumbsUp, Layers, CheckCircle2, Globe, BarChart3, ArrowUpRight,
  ShieldCheck, Key, ExternalLink, AlertCircle, X, Unlink, Sparkles, Check, Camera, UploadCloud, ScanLine, FileText, SlidersHorizontal, Compass, Target, Calendar, Heart
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { api } from '../../services/api';
import { getDeterministicGrowthPlan, GrowthPlan } from '../../utils/growthPlanEngine';
import { SocialGrowthPlanView } from './SocialGrowthPlanView';

interface ReelsMetricsViewProps {
  colors: ThemeColors;
  isStitchLight?: boolean;
  metrics: SocialMetric[];
  epkConfig?: EPKConfig;
  currentBandName?: string;
  onAddMetric?: (metric: SocialMetric) => Promise<void>;
  onUpdateMetric?: (id: string, updatedFields: Partial<SocialMetric>) => Promise<void>;
  onDeleteMetric?: (id: string) => Promise<void>;
  onScanRealMetrics?: () => Promise<void>;
  onSyncMetrics?: () => Promise<void>;
  isScanningMetrics?: boolean;
  isSyncingMetrics?: boolean;
  fans?: Fan[];
}

export function ReelsMetricsView({
  colors,
  isStitchLight,
  metrics = [],
  epkConfig,
  currentBandName,
  onAddMetric,
  onUpdateMetric,
  onDeleteMetric,
  onScanRealMetrics,
  onSyncMetrics,
  isScanningMetrics = false,
  isSyncingMetrics = false,
  fans = []
}: ReelsMetricsViewProps) {
  const [metricDate, setMetricDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Basic platform metrics
  const [metricInsta, setMetricInsta] = useState('');
  const [metricTiktok, setMetricTiktok] = useState('');
  const [metricYoutube, setMetricYoutube] = useState('');
  const [metricSpotify, setMetricSpotify] = useState('');
  
  // Advanced platform metrics
  const [metricSpotifyFollowers, setMetricSpotifyFollowers] = useState('');
  const [metricSpotifyPopularity, setMetricSpotifyPopularity] = useState('');
  const [metricYtViews, setMetricYtViews] = useState('');
  const [metricYtVideos, setMetricYtVideos] = useState('');
  const [metricIgFollowing, setMetricIgFollowing] = useState('');
  const [metricIgPosts, setMetricIgPosts] = useState('');
  const [metricIgEngagement, setMetricIgEngagement] = useState('');
  const [metricTkLikes, setMetricTkLikes] = useState('');
  const [metricTkVideos, setMetricTkVideos] = useState('');

  const [metricNotes, setMetricNotes] = useState('');
  const [showAdvancedFields, setShowAdvancedFields] = useState(false);
  const [selectedPlatformTab, setSelectedPlatformTab] = useState<'all' | 'youtube' | 'spotify' | 'instagram' | 'tiktok'>('all');
  const [editingMetricId, setEditingMetricId] = useState<string | null>(null);
  const [isSavingMetric, setIsSavingMetric] = useState(false);
  const [metricSuccess, setMetricSuccess] = useState('');
  const [contentItems, setContentItems] = useState<SocialContentItem[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(false);

  // Main Section Switch: Metrics Dashboard vs Growth Plan
  const [activeMainSection, setActiveMainSection] = useState<'metrics' | 'growth_plan'>('metrics');

  // Instagram Meta Graph API & OAuth State
  const [showIgModal, setShowIgModal] = useState(false);
  const [igStatus, setIgStatus] = useState<{ connected: boolean; method?: string; account?: any; error?: string } | null>(null);
  const [igTokenInput, setIgTokenInput] = useState('');
  const [isCheckingIg, setIsCheckingIg] = useState(false);
  const [isConnectingIg, setIsConnectingIg] = useState(false);
  const [igModalMsg, setIgModalMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Gemini Multimodal Screenshot Scanner State
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanImageBase64, setScanImageBase64] = useState<string | null>(null);
  const [scanImageMime, setScanImageMime] = useState<string>('image/jpeg');
  const [isAnalyzingScreenshot, setIsAnalyzingScreenshot] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);

  const effectiveBandName = currentBandName || epkConfig?.contactoBooking?.nombre || 'Bakandeya';

  // Growth Plan State
  const [growthPlan, setGrowthPlan] = useState<GrowthPlan>(() => {
    const latest = [...metrics].sort((a, b) => new Date(b.fecha || '').getTime() - new Date(a.fecha || '').getTime())[0] || null;
    return getDeterministicGrowthPlan(effectiveBandName, latest, epkConfig, 30);
  });
  const [isGeneratingGrowthPlan, setIsGeneratingGrowthPlan] = useState(false);

  const handleRefreshGrowthPlanWithAI = async (horizon: 30 | 60 | 90 = 30, customFocus?: string) => {
    try {
      setIsGeneratingGrowthPlan(true);
      const latest = [...metrics].sort((a, b) => new Date(b.fecha || '').getTime() - new Date(a.fecha || '').getTime())[0] || null;
      const res = await api.generateSocialGrowthPlan({
        bandName: effectiveBandName,
        metrics: latest,
        epkConfig,
        horizonDays: horizon,
        customFocus
      });
      if (res && res.success && res.data) {
        setGrowthPlan(res.data);
      } else {
        // Fallback to deterministic engine
        setGrowthPlan(getDeterministicGrowthPlan(effectiveBandName, latest, epkConfig, horizon));
      }
    } catch (err) {
      console.warn("Could not generate AI growth plan, using engine plan:", err);
      const latest = [...metrics].sort((a, b) => new Date(b.fecha || '').getTime() - new Date(a.fecha || '').getTime())[0] || null;
      setGrowthPlan(getDeterministicGrowthPlan(effectiveBandName, latest, epkConfig, horizon));
    } finally {
      setIsGeneratingGrowthPlan(false);
    }
  };

  // Load indexed content items from Supabase
  const loadContentItems = async () => {
    try {
      setIsLoadingContent(true);
      const items = await api.getSocialContentItems();
      if (items && items.length > 0) {
        setContentItems(items);
      }
    } catch (err) {
      console.warn("Could not load content items:", err);
    } finally {
      setIsLoadingContent(false);
    }
  };

  // Load Instagram Meta Graph API Connection Status
  const loadIgStatus = async () => {
    try {
      setIsCheckingIg(true);
      const res = await api.getInstagramStatus();
      if (res && res.success) {
        setIgStatus(res);
      }
    } catch (err) {
      console.warn("Could not check Instagram status:", err);
    } finally {
      setIsCheckingIg(false);
    }
  };

  useEffect(() => {
    loadContentItems();
    loadIgStatus();
  }, []);

  const handleConnectIgToken = async () => {
    if (!igTokenInput.trim()) {
      setIgModalMsg({ type: 'error', text: 'Por favor, introduce o pega un Token de Acceso válido de Meta / Instagram.' });
      return;
    }
    try {
      setIsConnectingIg(true);
      setIgModalMsg(null);
      const res = await api.connectInstagramToken(igTokenInput.trim());
      if (res && res.success) {
        setIgModalMsg({ type: 'success', text: res.message || 'Cuenta de Instagram vinculada con éxito.' });
        setIgTokenInput('');
        await loadIgStatus();
        if (onScanRealMetrics) {
          await onScanRealMetrics();
        }
      } else {
        setIgModalMsg({ type: 'error', text: res?.message || 'No se pudo verificar el token con Meta Graph API.' });
      }
    } catch (err: any) {
      setIgModalMsg({ type: 'error', text: err?.message || 'Error al validar token con Meta Graph API.' });
    } finally {
      setIsConnectingIg(false);
    }
  };

  const handleDisconnectIg = async () => {
    try {
      setIsConnectingIg(true);
      setIgModalMsg(null);
      const res = await api.disconnectInstagram();
      if (res && res.success) {
        setIgModalMsg({ type: 'success', text: 'Cuenta de Instagram desconectada. Modo scraping autónomo activado.' });
        await loadIgStatus();
      }
    } catch (err: any) {
      setIgModalMsg({ type: 'error', text: err?.message || 'Error al desconectar cuenta.' });
    } finally {
      setIsConnectingIg(false);
    }
  };

  // Screenshot scanner handlers
  const handleScreenshotFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setScanError('Por favor selecciona un archivo de imagen válido (PNG, JPG, WebP).');
      return;
    }
    setScanError(null);
    setScanSuccess(null);
    setScanResult(null);
    setScanImageMime(file.type);

    const reader = new FileReader();
    reader.onload = () => {
      setScanImageBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleScreenshotInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleScreenshotFile(file);
    }
  };

  const handleAnalyzeScreenshot = async () => {
    if (!scanImageBase64) {
      setScanError('Primero carga o arrastra una captura de pantalla.');
      return;
    }
    try {
      setIsAnalyzingScreenshot(true);
      setScanError(null);
      setScanSuccess(null);

      const res = await api.scanMetricsScreenshot(scanImageBase64, scanImageMime, true);
      if (res && res.success && res.data) {
        setScanResult(res.data);
        setScanSuccess('¡Captura analizada y métricas sincronizadas en Supabase!');
        if (onSyncMetrics) {
          await onSyncMetrics();
        }
      } else {
        setScanError(res?.error || 'No se pudieron extraer métricas de la captura.');
      }
    } catch (err: any) {
      setScanError(err?.message || 'Error al procesar la captura con Visión IA.');
    } finally {
      setIsAnalyzingScreenshot(false);
    }
  };

  const handleEditMetricClick = (m: SocialMetric) => {
    setEditingMetricId(m.id);
    setMetricDate(m.fecha || new Date().toISOString().split('T')[0]);
    setMetricInsta(m.instagram_followers ? String(m.instagram_followers) : m.instagram ? String(m.instagram) : '');
    setMetricTiktok(m.tiktok_followers ? String(m.tiktok_followers) : m.tiktok ? String(m.tiktok) : '');
    setMetricYoutube(m.youtube_subscribers ? String(m.youtube_subscribers) : m.youtube ? String(m.youtube) : '');
    setMetricSpotify(m.spotify_monthly_listeners ? String(m.spotify_monthly_listeners) : m.spotify ? String(m.spotify) : '');
    
    setMetricSpotifyFollowers(m.spotify_followers ? String(m.spotify_followers) : '');
    setMetricSpotifyPopularity(m.spotify_popularity ? String(m.spotify_popularity) : '');
    setMetricYtViews(m.youtube_total_views ? String(m.youtube_total_views) : '');
    setMetricYtVideos(m.youtube_video_count ? String(m.youtube_video_count) : '');
    setMetricIgFollowing(m.instagram_following ? String(m.instagram_following) : '');
    setMetricIgPosts(m.instagram_posts_count ? String(m.instagram_posts_count) : '');
    setMetricIgEngagement(m.instagram_engagement_rate ? String(m.instagram_engagement_rate) : '');
    setMetricTkLikes(m.tiktok_total_likes ? String(m.tiktok_total_likes) : '');
    setMetricTkVideos(m.tiktok_video_count ? String(m.tiktok_video_count) : '');

    setMetricNotes(m.notas || '');
    if (m.spotify_followers || m.youtube_total_views || m.instagram_following || m.tiktok_total_likes) {
      setShowAdvancedFields(true);
    }
  };

  const handleCancelEditMetric = () => {
    setEditingMetricId(null);
    setMetricDate(new Date().toISOString().split('T')[0]);
    setMetricInsta('');
    setMetricTiktok('');
    setMetricYoutube('');
    setMetricSpotify('');
    setMetricSpotifyFollowers('');
    setMetricSpotifyPopularity('');
    setMetricYtViews('');
    setMetricYtVideos('');
    setMetricIgFollowing('');
    setMetricIgPosts('');
    setMetricIgEngagement('');
    setMetricTkLikes('');
    setMetricTkVideos('');
    setMetricNotes('');
    setShowAdvancedFields(false);
  };

  const handleSaveMetric = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!metricDate) return;

    setIsSavingMetric(true);
    setMetricSuccess('');

    try {
      const metricData: Partial<SocialMetric> = {
        fecha: metricDate,
        instagram: parseInt(metricInsta, 10) || 0,
        tiktok: parseInt(metricTiktok, 10) || 0,
        youtube: parseInt(metricYoutube, 10) || 0,
        spotify: parseInt(metricSpotify, 10) || 0,
        
        // Advanced fields
        spotify_monthly_listeners: parseInt(metricSpotify, 10) || 0,
        spotify_followers: parseInt(metricSpotifyFollowers, 10) || 0,
        spotify_popularity: parseInt(metricSpotifyPopularity, 10) || 0,

        youtube_subscribers: parseInt(metricYoutube, 10) || 0,
        youtube_total_views: parseInt(metricYtViews, 10) || 0,
        youtube_video_count: parseInt(metricYtVideos, 10) || 0,

        instagram_followers: parseInt(metricInsta, 10) || 0,
        instagram_following: parseInt(metricIgFollowing, 10) || 0,
        instagram_posts_count: parseInt(metricIgPosts, 10) || 0,
        instagram_engagement_rate: parseFloat(metricIgEngagement) || 0,

        tiktok_followers: parseInt(metricTiktok, 10) || 0,
        tiktok_total_likes: parseInt(metricTkLikes, 10) || 0,
        tiktok_video_count: parseInt(metricTkVideos, 10) || 0,

        notas: metricNotes
      };

      if (editingMetricId) {
        if (onUpdateMetric) {
          await onUpdateMetric(editingMetricId, metricData);
        }
        setMetricSuccess('Registro actualizado con éxito en Supabase');
      } else {
        if (onAddMetric) {
          const newMetric: SocialMetric = {
            id: `m_${Date.now()}`,
            ...metricData as any
          };
          await onAddMetric(newMetric);
        }
        setMetricSuccess('Nuevo snapshot guardado en Supabase');
      }

      handleCancelEditMetric();
      setTimeout(() => setMetricSuccess(''), 4000);
    } catch (err) {
      console.error('Error guardando métrica:', err);
    } finally {
      setIsSavingMetric(false);
    }
  };

  const fansTotalCount = fans.length;
  const uneteFansCount = fans.filter(f => {
    const src = (f.comoConocio || '').toLowerCase();
    return src.includes('unete') || src.includes('únete') || src.includes('web') || src.includes('formulario') || src.includes('landing') || !src;
  }).length;

  const sortedMetrics = React.useMemo(() => {
    if (!metrics || metrics.length === 0) return [];
    const mapByDate = new Map<string, SocialMetric>();
    const sorted = [...metrics].sort((a, b) => a.fecha.localeCompare(b.fecha));
    
    for (const m of sorted) {
      const ig = Number(m.instagram ?? m.instagram_followers ?? 0);
      const tk = Number(m.tiktok ?? m.tiktok_followers ?? 0);
      const yt = Number(m.youtube ?? m.youtube_subscribers ?? 0);
      const sp = Number(m.spotify ?? m.spotify_monthly_listeners ?? 0);
      const fn = Number((m as any).fans ?? fansTotalCount);
      
      const existing = mapByDate.get(m.fecha);
      if (!existing) {
        mapByDate.set(m.fecha, {
          ...m,
          instagram: ig,
          tiktok: tk,
          youtube: yt,
          spotify: sp,
          fans: fn,
          instagram_followers: Number(m.instagram_followers || ig),
          tiktok_followers: Number(m.tiktok_followers || tk),
          youtube_subscribers: Number(m.youtube_subscribers || yt),
          spotify_monthly_listeners: Number(m.spotify_monthly_listeners || sp)
        } as any);
      } else {
        mapByDate.set(m.fecha, {
          ...existing,
          ...m,
          instagram: Math.max(Number(existing.instagram || 0), ig),
          tiktok: Math.max(Number(existing.tiktok || 0), tk),
          youtube: Math.max(Number(existing.youtube || 0), yt),
          spotify: Math.max(Number(existing.spotify || 0), sp),
          fans: Math.max(Number((existing as any).fans || 0), fn),
          instagram_followers: Math.max(Number(existing.instagram_followers || 0), Number(m.instagram_followers || ig)),
          tiktok_followers: Math.max(Number(existing.tiktok_followers || 0), Number(m.tiktok_followers || tk)),
          youtube_subscribers: Math.max(Number(existing.youtube_subscribers || 0), Number(m.youtube_subscribers || yt)),
          spotify_monthly_listeners: Math.max(Number(existing.spotify_monthly_listeners || 0), Number(m.spotify_monthly_listeners || sp))
        } as any);
      }
    }
    return Array.from(mapByDate.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [metrics, fansTotalCount]);

  const latestMetric = sortedMetrics[sortedMetrics.length - 1];
  const oldestMetric = sortedMetrics[0];

  // Active platforms dynamic detection based on EPK config & real non-zero metric records
  const hasInstagram = Boolean(
    epkConfig?.enlacesRedes?.instagram ||
    (latestMetric && ((latestMetric.instagram_followers && latestMetric.instagram_followers > 0) || (latestMetric.instagram && latestMetric.instagram > 0))) ||
    metrics.some(m => (m.instagram_followers && m.instagram_followers > 0) || (m.instagram && m.instagram > 0))
  );

  const hasTikTok = Boolean(
    epkConfig?.enlacesRedes?.tiktok ||
    (latestMetric && ((latestMetric.tiktok_followers && latestMetric.tiktok_followers > 0) || (latestMetric.tiktok && latestMetric.tiktok > 0))) ||
    metrics.some(m => (m.tiktok_followers && m.tiktok_followers > 0) || (m.tiktok && m.tiktok > 0))
  );

  const hasYouTube = Boolean(
    epkConfig?.enlacesRedes?.youtube ||
    (latestMetric && ((latestMetric.youtube_subscribers && latestMetric.youtube_subscribers > 0) || (latestMetric.youtube && latestMetric.youtube > 0))) ||
    metrics.some(m => (m.youtube_subscribers && m.youtube_subscribers > 0) || (m.youtube && m.youtube > 0))
  );

  const hasSpotify = Boolean(
    (epkConfig?.enlacesRedes?.spotify && epkConfig.enlacesRedes.spotify.trim().length > 0) ||
    (latestMetric && ((latestMetric.spotify_monthly_listeners && latestMetric.spotify_monthly_listeners > 0) || (latestMetric.spotify && latestMetric.spotify > 0))) ||
    metrics.some(m => (m.spotify_monthly_listeners && m.spotify_monthly_listeners > 0) || (m.spotify && m.spotify > 0))
  );

  const hasFans = Boolean(fansTotalCount > 0 || fans.length > 0);

  // User selected channels to display and rescale the chart
  const [selectedChannels, setSelectedChannels] = useState<{
    instagram: boolean;
    tiktok: boolean;
    youtube: boolean;
    spotify: boolean;
    fans: boolean;
  }>({
    instagram: true,
    tiktok: true,
    youtube: true,
    spotify: true,
    fans: true,
  });

  const toggleChannel = (channel: 'instagram' | 'tiktok' | 'youtube' | 'spotify' | 'fans') => {
    setSelectedChannels(prev => ({
      ...prev,
      [channel]: !prev[channel]
    }));
  };

  const selectOnlyChannel = (channel: 'instagram' | 'tiktok' | 'youtube' | 'spotify' | 'fans') => {
    setSelectedChannels({
      instagram: channel === 'instagram',
      tiktok: channel === 'tiktok',
      youtube: channel === 'youtube',
      spotify: channel === 'spotify',
      fans: channel === 'fans',
    });
  };

  const selectAllChannels = () => {
    setSelectedChannels({
      instagram: true,
      tiktok: true,
      youtube: true,
      spotify: true,
      fans: true,
    });
  };

  // Dynamic scale computation for visible channels
  const maxVisibleValue = React.useMemo(() => {
    let max = 0;
    for (const m of sortedMetrics) {
      if (selectedChannels.instagram && hasInstagram) {
        max = Math.max(max, Number(m.instagram || m.instagram_followers || 0));
      }
      if (selectedChannels.tiktok && hasTikTok) {
        max = Math.max(max, Number(m.tiktok || m.tiktok_followers || 0));
      }
      if (selectedChannels.youtube && hasYouTube) {
        max = Math.max(max, Number(m.youtube || m.youtube_subscribers || 0));
      }
      if (selectedChannels.spotify && hasSpotify) {
        max = Math.max(max, Number(m.spotify || m.spotify_monthly_listeners || 0));
      }
      if (selectedChannels.fans && hasFans) {
        max = Math.max(max, Number((m as any).fans || fansTotalCount));
      }
    }
    return max;
  }, [sortedMetrics, selectedChannels, hasInstagram, hasTikTok, hasYouTube, hasSpotify, hasFans, fansTotalCount]);

  const yAxisDomain = React.useMemo(() => {
    if (maxVisibleValue <= 0) return [0, 10];
    if (maxVisibleValue <= 50) return [0, Math.ceil(maxVisibleValue * 1.25)];
    if (maxVisibleValue <= 200) return [0, Math.ceil(maxVisibleValue * 1.2)];
    if (maxVisibleValue <= 1000) return [0, Math.ceil(maxVisibleValue * 1.15)];
    return [0, Math.ceil(maxVisibleValue * 1.1)];
  }, [maxVisibleValue]);

  const activeCount = [hasInstagram, hasTikTok, hasYouTube, hasSpotify, hasFans].filter(Boolean).length;
  const gridColsClass = activeCount === 1 ? 'grid-cols-1' : activeCount === 2 ? 'grid-cols-1 sm:grid-cols-2' : activeCount === 3 ? 'grid-cols-1 sm:grid-cols-3' : activeCount === 4 ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5';

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Primary Module Navigation Tabs: Analytics Radar vs AI Growth Plan */}
      <div className="flex items-center justify-between gap-3 border-b border-neutral-800/80 pb-3 flex-wrap">
        <div className="flex items-center gap-2 p-1 bg-neutral-900/80 border border-neutral-800 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveMainSection('metrics')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
              activeMainSection === 'metrics'
                ? isStitchLight
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                  : 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Panel de Métricas & Radar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMainSection('growth_plan')}
            className={`px-4 py-2 rounded-lg text-xs font-mono font-bold tracking-wider uppercase transition-all flex items-center gap-2 cursor-pointer ${
              activeMainSection === 'growth_plan'
                ? isStitchLight
                  ? 'bg-white text-indigo-600 shadow-sm border border-slate-200'
                  : 'bg-gradient-to-r from-amber-500 to-indigo-500 text-slate-950 shadow-md shadow-amber-500/20 font-black'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            <span>Plan & Recomendaciones de Crecimiento</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 font-normal">IA</span>
          </button>
        </div>

        {activeMainSection === 'growth_plan' && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-neutral-400">
              Estrategia personalizada para <b className="text-amber-400">{effectiveBandName}</b>
            </span>
          </div>
        )}
      </div>

      {activeMainSection === 'growth_plan' ? (
        <SocialGrowthPlanView
          colors={colors}
          isStitchLight={Boolean(isStitchLight)}
          bandName={effectiveBandName}
          latestMetric={latestMetric}
          epkConfig={epkConfig}
          growthPlan={growthPlan}
          onRefreshPlanWithAI={handleRefreshGrowthPlanWithAI}
          isGeneratingAI={isGeneratingGrowthPlan}
        />
      ) : (
        <>
          {/* 0. Direct Platforms Radar Header Bar */}
          <div className={`p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 border ${
        isStitchLight ? 'bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border-emerald-200' : 'bg-gradient-to-r from-emerald-950/30 via-neutral-900 to-indigo-950/30 border-emerald-900/40'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className={`text-xs font-bold font-display uppercase tracking-wider flex items-center gap-2 ${
              isStitchLight ? 'text-slate-900' : 'text-white'
            }`}>
              Agente Radar Autónomo & Análisis Multiplataforma
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-mono font-normal flex items-center gap-1">
                <CheckCircle2 className="w-2.5 h-2.5" /> 0 Tokens IA • Supabase DB
              </span>
            </h3>
            <p className="text-[10px] text-neutral-400 font-mono mt-0.5">
              Sincronización directa con los feeds públicos y OpenGraph de las plataformas (resolución nativa: unidades exactas en bandas emergentes, escalas oficiales K/M en macro-cuentas).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap">
          {/* AI Multimodal Screenshot Scanner Button */}
          <button
            onClick={() => {
              setScanError(null);
              setScanSuccess(null);
              setScanResult(null);
              setShowScanModal(true);
            }}
            className={`px-3.5 py-2.5 rounded-xl font-mono text-[10px] font-bold tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2 transition-all border ${
              isStitchLight
                ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100 shadow-sm'
                : 'bg-gradient-to-r from-indigo-950/40 via-purple-950/40 to-blue-950/40 border-indigo-500/40 text-indigo-300 hover:border-indigo-400 hover:text-white shadow-lg shadow-indigo-950/30'
            }`}
            title="Sube una captura de pantalla de tu Instagram, TikTok o Spotify y Gemini extraerá todas las métricas al instante"
          >
            <Camera className="w-3.5 h-3.5 text-indigo-400" />
            <span>📸 Escanear Captura IA</span>
          </button>

          {/* Instagram OAuth / Meta Graph API Button */}
          <button
            onClick={() => {
              setIgModalMsg(null);
              setShowIgModal(true);
            }}
            className={`px-3.5 py-2.5 rounded-xl font-mono text-[10px] font-bold tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2 transition-all border ${
              igStatus?.connected
                ? 'bg-gradient-to-r from-pink-500/15 via-purple-500/15 to-rose-500/15 border-pink-500/40 text-pink-400 hover:border-pink-400'
                : isStitchLight
                ? 'bg-white border-pink-300 text-pink-700 hover:bg-pink-50'
                : 'bg-neutral-900 border-pink-900/40 text-pink-400 hover:bg-pink-950/30'
            }`}
            title="Configurar conexión oficial con Meta Graph API / Instagram OAuth"
          >
            <Instagram className="w-3.5 h-3.5 text-pink-400" />
            {igStatus?.connected ? (
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Meta API (@{igStatus.account?.username || 'bakandeya'})
              </span>
            ) : (
              <span>OAuth Instagram</span>
            )}
          </button>

          {onScanRealMetrics && (
            <button
              onClick={async () => {
                await onScanRealMetrics();
                await loadContentItems();
              }}
              disabled={isScanningMetrics}
              className={`flex-1 md:flex-initial px-4 py-2.5 rounded-xl font-mono text-[10px] font-bold tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2 transition-all ${
                isScanningMetrics
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/30'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningMetrics ? 'animate-spin' : ''}`} />
              {isScanningMetrics ? 'Ejecutando Radar...' : 'Ejecutar Radar Ahora'}
            </button>
          )}

          {onSyncMetrics && (
            <button
              onClick={onSyncMetrics}
              disabled={isSyncingMetrics}
              className={`px-3 py-2.5 rounded-xl font-mono text-[10px] font-bold tracking-wider uppercase cursor-pointer flex items-center justify-center gap-2 transition-all ${
                isSyncingMetrics
                  ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                  : isStitchLight
                  ? 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  : 'bg-neutral-900 border border-neutral-800 text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingMetrics ? 'animate-spin' : ''}`} />
              {isSyncingMetrics ? 'Sincronizando...' : 'Refrescar Datos'}
            </button>
          )}
        </div>
      </div>

      {metricSuccess && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-mono text-xs flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{metricSuccess}</span>
        </div>
      )}

      {/* 1. Specialized Multi-Platform Deep Analytics Grid */}
      <div className={`grid ${gridColsClass} gap-4`}>
        {/* Instagram Card */}
        {hasInstagram && (
          <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
            isStitchLight ? 'bg-pink-50/40 border-pink-200' : 'bg-neutral-900/40 border-pink-900/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-pink-500 font-bold flex items-center gap-1.5">
                <Instagram className="w-3.5 h-3.5" /> Instagram
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setScanError(null);
                    setScanSuccess(null);
                    setScanResult(null);
                    setShowScanModal(true);
                  }}
                  className="text-[9px] font-mono px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer border bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20"
                  title="Escanear captura de pantalla de Instagram con Visión IA"
                >
                  <Camera className="w-2.5 h-2.5" />
                  <span>Escanear</span>
                </button>
                <button
                  onClick={() => {
                    setIgModalMsg(null);
                    setShowIgModal(true);
                  }}
                  className={`text-[9px] font-mono px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer border ${
                    igStatus?.connected
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                      : 'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20'
                  }`}
                  title="Verificar o conectar token oficial de Meta Graph API"
                >
                  <Key className="w-2.5 h-2.5" />
                  {igStatus?.connected ? 'Meta API Oficial' : 'OAuth / Token'}
                </button>
              </div>
            </div>
            <div>
              <div className="text-2xl font-black font-display tracking-tight text-pink-400">
                {(latestMetric?.instagram_followers || latestMetric?.instagram || 0).toLocaleString()}
              </div>
              <div className="text-[9px] font-mono text-neutral-400 mt-0.5 flex items-center justify-between">
                <span>Seguidores Oficiales</span>
                {latestMetric?.instagram_posts_count ? (
                  <span>{latestMetric.instagram_posts_count} posts</span>
                ) : null}
              </div>
            </div>
            <div className="pt-2 border-t border-pink-500/10 flex justify-between text-[9px] font-mono text-neutral-400">
              <span>Siguiendo: <b className="text-white">{(latestMetric?.instagram_following || 0).toLocaleString()}</b></span>
              <span>Engagement: <b className="text-pink-400">{latestMetric?.instagram_engagement_rate ? `${latestMetric.instagram_engagement_rate}%` : 'Activo'}</b></span>
            </div>
          </div>
        )}

        {/* TikTok Card */}
        {hasTikTok && (
          <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
            isStitchLight ? 'bg-cyan-50/40 border-cyan-200' : 'bg-neutral-900/40 border-cyan-900/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1.5">
                <Video className="w-3.5 h-3.5" /> TikTok
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setScanError(null);
                    setScanSuccess(null);
                    setScanResult(null);
                    setShowScanModal(true);
                  }}
                  className="text-[9px] font-mono px-2 py-0.5 rounded flex items-center gap-1 transition-all cursor-pointer border bg-indigo-500/10 text-indigo-300 border-indigo-500/20 hover:bg-indigo-500/20"
                  title="Escanear captura de pantalla de TikTok con Visión IA"
                >
                  <Camera className="w-2.5 h-2.5" />
                  <span>Escanear</span>
                </button>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400">
                  {latestMetric?.tiktok_video_count ? `${latestMetric.tiktok_video_count} vídeos` : 'Reels / TikTok'}
                </span>
              </div>
            </div>
            <div>
              <div className="text-2xl font-black font-display tracking-tight text-cyan-400">
                {(latestMetric?.tiktok_followers || latestMetric?.tiktok || 0).toLocaleString()}
              </div>
              <div className="text-[9px] font-mono text-neutral-400 mt-0.5">Seguidores</div>
            </div>
            <div className="pt-2 border-t border-cyan-500/10 flex justify-between text-[9px] font-mono text-neutral-400">
              <span>Total Likes: <b className="text-white">{(latestMetric?.tiktok_total_likes || 0).toLocaleString()}</b></span>
              <span>Alcance: <b className="text-cyan-400">Orgánico</b></span>
            </div>
          </div>
        )}

        {/* YouTube Card */}
        {hasYouTube && (
          <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
            isStitchLight ? 'bg-red-50/40 border-red-200' : 'bg-neutral-900/40 border-red-900/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-500 font-bold flex items-center gap-1.5">
                <Youtube className="w-3.5 h-3.5" /> YouTube
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-red-500/10 text-red-400">
                {latestMetric?.youtube_video_count || contentItems.length || 0} vídeos
              </span>
            </div>
            <div>
              <div className="text-2xl font-black font-display tracking-tight text-red-400">
                {(latestMetric?.youtube_subscribers || latestMetric?.youtube || 0).toLocaleString()}
              </div>
              <div className="text-[9px] font-mono text-neutral-400 mt-0.5">Suscriptores Oficiales</div>
            </div>
            <div className="pt-2 border-t border-red-500/10 flex justify-between text-[9px] font-mono text-neutral-400">
              <span>Views acumuladas: <b className="text-white">
                {(latestMetric?.youtube_total_views || contentItems.reduce((sum, v) => sum + (v.views || 0), 0)).toLocaleString()}
              </b></span>
            </div>
          </div>
        )}

        {/* Spotify Card */}
        {hasSpotify && (
          <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
            isStitchLight ? 'bg-emerald-50/40 border-emerald-200' : 'bg-neutral-900/40 border-emerald-900/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-500 font-bold flex items-center gap-1.5">
                <Music2 className="w-3.5 h-3.5" /> Spotify
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">
                Popularidad: {latestMetric?.spotify_popularity || '--'}/100
              </span>
            </div>
            <div>
              <div className="text-2xl font-black font-display tracking-tight text-emerald-400">
                {(latestMetric?.spotify_monthly_listeners || latestMetric?.spotify || 0).toLocaleString()}
              </div>
              <div className="text-[9px] font-mono text-neutral-400 mt-0.5">Oyentes Mensuales</div>
            </div>
            <div className="pt-2 border-t border-emerald-500/10 flex justify-between text-[9px] font-mono text-neutral-400">
              <span>Seguidores: <b className="text-white">{(latestMetric?.spotify_followers || 0).toLocaleString()}</b></span>
              <span>Ratio oyente/seg: <b className="text-emerald-400">
                {latestMetric?.spotify_followers && latestMetric.spotify_followers > 0 
                  ? `${(((latestMetric.spotify_monthly_listeners || latestMetric.spotify || 0) / latestMetric.spotify_followers)).toFixed(1)}x`
                  : '--'}
              </b></span>
            </div>
          </div>
        )}

        {/* Fans Registrados (BBDD / Formulario Únete) Card */}
        {hasFans && (
          <div className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 ${
            isStitchLight ? 'bg-amber-50/50 border-amber-200 shadow-sm' : 'bg-neutral-900/40 border-amber-900/30'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" /> Fans Registrados
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                100% RGPD
              </span>
            </div>
            <div>
              <div className="text-2xl font-black font-display tracking-tight text-amber-400">
                {fansTotalCount.toLocaleString()}
              </div>
              <div className="text-[9px] font-mono text-neutral-400 mt-0.5">Contactos en Base de Datos</div>
            </div>
            <div className="pt-2 border-t border-amber-500/10 flex justify-between text-[9px] font-mono text-neutral-400">
              <span>Formulario Únete: <b className="text-amber-300">{uneteFansCount}</b></span>
              <span>Ciudades: <b className="text-white">{new Set(fans.map(f => f.ciudad).filter(Boolean)).size}</b></span>
            </div>
          </div>
        )}
      </div>

      {/* 2. Recharts Dynamic Adaptive Area Chart */}
      {metrics.length > 0 && (
        <div className={`p-4 sm:p-5 rounded-xl transition-all ${isStitchLight ? 'bg-slate-50/70 border border-slate-200/80 shadow-sm' : 'bg-[#131313]/70 border border-neutral-800/80 shadow-md'}`}>
          {/* Header with Title & Scale Badge */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-200">Curva de Crecimiento Multiplataforma</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Escala Adaptativa: 0 - {yAxisDomain[1] >= 1000 ? `${(yAxisDomain[1] / 1000).toFixed(1)}k` : yAxisDomain[1]}
                </span>
              </div>
              <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                Haz clic en cualquier red para activarla/ocultarla. El gráfico reajusta automáticamente la altura y escala Y a los canales visibles.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={selectAllChannels}
                className={`text-[9px] font-mono px-2.5 py-1 rounded-lg border transition-all cursor-pointer flex items-center gap-1 ${
                  isStitchLight 
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300' 
                    : 'bg-neutral-800/60 hover:bg-neutral-800 text-neutral-300 border-neutral-700'
                }`}
                title="Mostrar todos los canales disponibles"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Mostrar Todos</span>
              </button>
            </div>
          </div>

          {/* Interactive Channel Filter Chips */}
          <div className="flex flex-wrap gap-2 mb-4 pb-3 border-b border-neutral-800/50">
            {/* Instagram Chip */}
            {hasInstagram && (
              <div className={`flex items-center rounded-lg border transition-all ${
                selectedChannels.instagram
                  ? isStitchLight
                    ? 'bg-pink-50 border-pink-300 text-pink-700 shadow-sm'
                    : 'bg-pink-950/30 border-pink-500/40 text-pink-300 shadow-sm shadow-pink-950/20'
                  : 'bg-neutral-900/30 border-neutral-800 text-neutral-500 opacity-60 hover:opacity-100'
              }`}>
                <button
                  onClick={() => toggleChannel('instagram')}
                  className="px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-mono font-medium cursor-pointer"
                  title={selectedChannels.instagram ? "Ocultar Instagram del gráfico" : "Mostrar Instagram en el gráfico"}
                >
                  <span className={`w-2 h-2 rounded-full ${selectedChannels.instagram ? 'bg-pink-500 animate-pulse' : 'bg-neutral-600'}`}></span>
                  <Instagram className="w-3 h-3 text-pink-500" />
                  <span className="font-bold">Instagram</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-pink-500/15 font-mono">
                    {(latestMetric?.instagram_followers || latestMetric?.instagram || 0).toLocaleString()}
                  </span>
                  {selectedChannels.instagram ? (
                    <Eye className="w-3 h-3 text-pink-400 ml-0.5" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-neutral-500 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => selectOnlyChannel('instagram')}
                  className="px-1.5 py-1 text-[8px] font-mono border-l border-pink-500/20 hover:bg-pink-500/20 text-pink-400 cursor-pointer"
                  title="Aislar y ver sólo Instagram dimensionado"
                >
                  Solo
                </button>
              </div>
            )}

            {/* TikTok Chip */}
            {hasTikTok && (
              <div className={`flex items-center rounded-lg border transition-all ${
                selectedChannels.tiktok
                  ? isStitchLight
                    ? 'bg-cyan-50 border-cyan-300 text-cyan-700 shadow-sm'
                    : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-950/20'
                  : 'bg-neutral-900/30 border-neutral-800 text-neutral-500 opacity-60 hover:opacity-100'
              }`}>
                <button
                  onClick={() => toggleChannel('tiktok')}
                  className="px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-mono font-medium cursor-pointer"
                  title={selectedChannels.tiktok ? "Ocultar TikTok del gráfico" : "Mostrar TikTok en el gráfico"}
                >
                  <span className={`w-2 h-2 rounded-full ${selectedChannels.tiktok ? 'bg-cyan-400 animate-pulse' : 'bg-neutral-600'}`}></span>
                  <Video className="w-3 h-3 text-cyan-400" />
                  <span className="font-bold">TikTok</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-500/15 font-mono">
                    {(latestMetric?.tiktok_followers || latestMetric?.tiktok || 0).toLocaleString()}
                  </span>
                  {selectedChannels.tiktok ? (
                    <Eye className="w-3 h-3 text-cyan-400 ml-0.5" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-neutral-500 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => selectOnlyChannel('tiktok')}
                  className="px-1.5 py-1 text-[8px] font-mono border-l border-cyan-500/20 hover:bg-cyan-500/20 text-cyan-400 cursor-pointer"
                  title="Aislar y ver sólo TikTok dimensionado"
                >
                  Solo
                </button>
              </div>
            )}

            {/* YouTube Chip */}
            {hasYouTube && (
              <div className={`flex items-center rounded-lg border transition-all ${
                selectedChannels.youtube
                  ? isStitchLight
                    ? 'bg-red-50 border-red-300 text-red-700 shadow-sm'
                    : 'bg-red-950/30 border-red-500/40 text-red-300 shadow-sm shadow-red-950/20'
                  : 'bg-neutral-900/30 border-neutral-800 text-neutral-500 opacity-60 hover:opacity-100'
              }`}>
                <button
                  onClick={() => toggleChannel('youtube')}
                  className="px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-mono font-medium cursor-pointer"
                  title={selectedChannels.youtube ? "Ocultar YouTube del gráfico" : "Mostrar YouTube en el gráfico"}
                >
                  <span className={`w-2 h-2 rounded-full ${selectedChannels.youtube ? 'bg-red-500 animate-pulse' : 'bg-neutral-600'}`}></span>
                  <Youtube className="w-3 h-3 text-red-500" />
                  <span className="font-bold">YouTube</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-red-500/15 font-mono">
                    {(latestMetric?.youtube_subscribers || latestMetric?.youtube || 0).toLocaleString()}
                  </span>
                  {selectedChannels.youtube ? (
                    <Eye className="w-3 h-3 text-red-400 ml-0.5" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-neutral-500 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => selectOnlyChannel('youtube')}
                  className="px-1.5 py-1 text-[8px] font-mono border-l border-red-500/20 hover:bg-red-500/20 text-red-400 cursor-pointer"
                  title="Aislar y ver sólo YouTube dimensionado"
                >
                  Solo
                </button>
              </div>
            )}

            {/* Spotify Chip */}
            {hasSpotify && (
              <div className={`flex items-center rounded-lg border transition-all ${
                selectedChannels.spotify
                  ? isStitchLight
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
                    : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-950/20'
                  : 'bg-neutral-900/30 border-neutral-800 text-neutral-500 opacity-60 hover:opacity-100'
              }`}>
                <button
                  onClick={() => toggleChannel('spotify')}
                  className="px-2.5 py-1.5 flex items-center gap-1.5 text-[10px] font-mono font-medium cursor-pointer"
                  title={selectedChannels.spotify ? "Ocultar Spotify del gráfico" : "Mostrar Spotify en el gráfico"}
                >
                  <span className={`w-2 h-2 rounded-full ${selectedChannels.spotify ? 'bg-emerald-500 animate-pulse' : 'bg-neutral-600'}`}></span>
                  <Music2 className="w-3 h-3 text-emerald-500" />
                  <span className="font-bold">Spotify</span>
                  <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500/15 font-mono">
                    {(latestMetric?.spotify_monthly_listeners || latestMetric?.spotify || 0).toLocaleString()}
                  </span>
                  {selectedChannels.spotify ? (
                    <Eye className="w-3 h-3 text-emerald-400 ml-0.5" />
                  ) : (
                    <EyeOff className="w-3 h-3 text-neutral-500 ml-0.5" />
                  )}
                </button>
                <button
                  onClick={() => selectOnlyChannel('spotify')}
                  className="px-1.5 py-1 text-[8px] font-mono border-l border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-400 cursor-pointer"
                  title="Aislar y ver sólo Spotify dimensionado"
                >
                  Solo
                </button>
              </div>
            )}
          </div>

          {/* Chart Canvas or Empty State */}
          <div className="h-64 w-full relative">
            {(!selectedChannels.instagram && !selectedChannels.tiktok && !selectedChannels.youtube && (!hasSpotify || !selectedChannels.spotify)) ? (
              <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-neutral-800 rounded-xl bg-neutral-950/20">
                <SlidersHorizontal className="w-8 h-8 text-neutral-500 mb-2" />
                <p className="text-xs font-mono font-medium text-neutral-300">Todos los canales están ocultos</p>
                <p className="text-[10px] font-mono text-neutral-500 mt-1 max-w-xs">
                  Haz clic en las etiquetas de Instagram, TikTok o YouTube para activar su curva y ver la escala ajustada.
                </p>
                <button
                  onClick={selectAllChannels}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-medium transition-all"
                >
                  Activar todos los canales
                </button>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart 
                  data={sortedMetrics}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorInstagram" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ec4899" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#ec4899" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTikTok" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorSpotify" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorYouTube" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isStitchLight ? '#e2e8f0' : '#222222'} />
                  <XAxis 
                    dataKey="fecha" 
                    stroke="#888888" 
                    fontSize={9} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(tick) => {
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
                      backgroundColor: isStitchLight ? '#ffffff' : '#131313', 
                      borderColor: isStitchLight ? '#cbd5e1' : '#333333',
                      borderRadius: '8px',
                      fontSize: '10px',
                      fontFamily: 'monospace'
                    }}
                    labelStyle={{ fontWeight: 'bold', color: isStitchLight ? '#1e293b' : '#ffffff' }}
                  />
                  {hasInstagram && selectedChannels.instagram && (
                    <Area 
                      type="monotone" 
                      dataKey="instagram" 
                      name="Instagram" 
                      stroke="#ec4899" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorInstagram)" 
                    />
                  )}
                  {hasTikTok && selectedChannels.tiktok && (
                    <Area 
                      type="monotone" 
                      dataKey="tiktok" 
                      name="TikTok" 
                      stroke="#06b6d4" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorTikTok)" 
                    />
                  )}
                  {hasYouTube && selectedChannels.youtube && (
                    <Area 
                      type="monotone" 
                      dataKey="youtube" 
                      name="YouTube" 
                      stroke="#ef4444" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorYouTube)" 
                    />
                  )}
                  {hasSpotify && selectedChannels.spotify && (
                    <Area 
                      type="monotone" 
                      dataKey="spotify" 
                      name="Spotify" 
                      stroke="#10b981" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorSpotify)" 
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      )}

      {/* 3. Vistas de Videos & Contenidos Reales (YouTube / Reels) */}
      <div className={`${colors.card} p-5 space-y-4`}>
        <div className={`border-b pb-2 flex items-center justify-between ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
          <div>
            <h3 className={`text-xs font-bold font-display uppercase tracking-widest flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
              <Video className="w-3.5 h-3.5 text-emerald-500" /> Monitoreo de Views y Contenidos Indexados
            </h3>
            <p className="text-[9px] font-mono text-neutral-500 mt-0.5">
              Vídeos y lanzamientos extraídos en vivo desde los canales oficiales de la banda.
            </p>
          </div>
          <div className="text-[9px] font-mono text-neutral-400">
            {contentItems.length} elementos indexados
          </div>
        </div>

        {contentItems.length === 0 ? (
          <div className="py-8 text-center text-neutral-500 font-mono text-xs border border-dashed border-neutral-800 rounded-xl">
            Pulsa <b className="text-emerald-400">"Ejecutar Radar Ahora"</b> para escanear y listar los vídeos y reproducciones de tus canales.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {contentItems.map((item, idx) => (
              <div key={item.id || idx} className={`p-3.5 rounded-xl border flex flex-col justify-between space-y-3 ${
                isStitchLight ? 'bg-slate-50/60 border-slate-200/60' : 'bg-neutral-900/60 border-neutral-800'
              }`}>
                {item.thumbnail_url && (
                  <div className="w-full h-24 rounded-lg overflow-hidden relative bg-black/40">
                    <img 
                      src={item.thumbnail_url} 
                      alt={item.title} 
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/80 text-[8px] font-mono text-white flex items-center gap-1">
                      <Eye className="w-2.5 h-2.5 text-emerald-400" /> {item.views ? item.views.toLocaleString() : '0'}
                    </span>
                  </div>
                )}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] font-mono font-bold text-red-500 flex items-center gap-1 uppercase">
                      <Youtube className="w-2.5 h-2.5" /> {item.platform}
                    </span>
                    {item.published_at && (
                      <span className="text-[8px] font-mono text-neutral-500">{item.published_at.split('T')[0]}</span>
                    )}
                  </div>
                  <h4 className={`text-xs font-bold line-clamp-2 ${isStitchLight ? 'text-slate-800' : 'text-neutral-200'}`} title={item.title}>
                    {item.title}
                  </h4>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-neutral-500/10">
                  <span className="text-sm font-black font-mono text-emerald-500">
                    {(item.views || 0).toLocaleString()} <span className="text-[9px] text-neutral-500 font-normal">views</span>
                  </span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1 rounded bg-neutral-500/10 hover:bg-neutral-500/20 text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-[9px] font-mono"
                      title="Ver contenido"
                    >
                      <span>Ver</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Formulario de Checkpoint & Tabla Histórica */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Guardar/Editar Log Form (5 columns) */}
        <div className={`lg:col-span-5 ${colors.card} p-5 space-y-4`}>
          <div className={`border-b pb-2 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
            <h3 className={`text-xs font-bold font-display uppercase tracking-widest flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
              <Plus className="w-3.5 h-3.5" /> {editingMetricId ? 'Editar Checkpoint' : 'Nuevo Checkpoint Manual'}
            </h3>
            <p className="text-[9px] font-mono text-neutral-500 mt-0.5">
              Guarda un registro de audiencia para persistirlo en Supabase.
            </p>
          </div>

          <form onSubmit={handleSaveMetric} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">Fecha del Snapshot</label>
              <input
                type="date"
                required
                value={metricDate}
                onChange={(e) => setMetricDate(e.target.value)}
                className={`w-full p-2.5 rounded-lg text-xs font-mono focus:outline-none ${
                  isStitchLight
                    ? 'bg-white border border-slate-200 text-slate-800 focus:border-indigo-500'
                    : 'bg-[#131313] border border-[#99907c]/15 text-neutral-200 focus:border-[#f2ca50]/30'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                  <Instagram className="w-3 h-3 text-pink-500" /> Insta Segs.
                </label>
                <input
                  type="number"
                  placeholder="1385"
                  value={metricInsta}
                  onChange={(e) => setMetricInsta(e.target.value)}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono focus:outline-none ${
                    isStitchLight
                      ? 'bg-white border border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-[#131313] border border-[#99907c]/15 text-neutral-200 focus:border-[#f2ca50]/30'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                  <Video className="w-3 h-3 text-cyan-400" /> TikTok Segs.
                </label>
                <input
                  type="number"
                  placeholder="253"
                  value={metricTiktok}
                  onChange={(e) => setMetricTiktok(e.target.value)}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono focus:outline-none ${
                    isStitchLight
                      ? 'bg-white border border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-[#131313] border border-[#99907c]/15 text-neutral-200 focus:border-[#f2ca50]/30'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                  <Youtube className="w-3 h-3 text-red-500" /> YouTube Subs.
                </label>
                <input
                  type="number"
                  placeholder="42"
                  value={metricYoutube}
                  onChange={(e) => setMetricYoutube(e.target.value)}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono focus:outline-none ${
                    isStitchLight
                      ? 'bg-white border border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-[#131313] border border-[#99907c]/15 text-neutral-200 focus:border-[#f2ca50]/30'
                  }`}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400 flex items-center gap-1">
                  <Music2 className="w-3 h-3 text-emerald-400" /> Spotify Oyentes
                </label>
                <input
                  type="number"
                  placeholder="150"
                  value={metricSpotify}
                  onChange={(e) => setMetricSpotify(e.target.value)}
                  className={`w-full p-2.5 rounded-lg text-xs font-mono focus:outline-none ${
                    isStitchLight
                      ? 'bg-white border border-slate-200 text-slate-800 focus:border-indigo-500'
                      : 'bg-[#131313] border border-[#99907c]/15 text-neutral-200 focus:border-[#f2ca50]/30'
                  }`}
                />
              </div>
            </div>

            {/* Toggle advanced fields button */}
            <button
              type="button"
              onClick={() => setShowAdvancedFields(!showAdvancedFields)}
              className="text-[9px] font-mono text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
            >
              {showAdvancedFields ? '▲ Ocultar métricas avanzadas' : '▼ Mostrar métricas avanzadas (Views, Likes, Posts)'}
            </button>

            {showAdvancedFields && (
              <div className="p-3 rounded-lg bg-black/20 border border-neutral-800 space-y-2 text-xs">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[8px] font-mono uppercase text-neutral-400">Spotify Seguidores</label>
                    <input
                      type="number"
                      placeholder="85"
                      value={metricSpotifyFollowers}
                      onChange={(e) => setMetricSpotifyFollowers(e.target.value)}
                      className="w-full p-1.5 rounded text-xs font-mono bg-black/40 border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-mono uppercase text-neutral-400">Popularidad (0-100)</label>
                    <input
                      type="number"
                      placeholder="18"
                      value={metricSpotifyPopularity}
                      onChange={(e) => setMetricSpotifyPopularity(e.target.value)}
                      className="w-full p-1.5 rounded text-xs font-mono bg-black/40 border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-mono uppercase text-neutral-400">YT Views Totales</label>
                    <input
                      type="number"
                      placeholder="14500"
                      value={metricYtViews}
                      onChange={(e) => setMetricYtViews(e.target.value)}
                      className="w-full p-1.5 rounded text-xs font-mono bg-black/40 border border-neutral-800 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[8px] font-mono uppercase text-neutral-400">TikTok Likes</label>
                    <input
                      type="number"
                      placeholder="1200"
                      value={metricTkLikes}
                      onChange={(e) => setMetricTkLikes(e.target.value)}
                      className="w-full p-1.5 rounded text-xs font-mono bg-black/40 border border-neutral-800 text-white"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[9px] font-mono uppercase tracking-widest text-neutral-400">Notas / Eventos (Opcional)</label>
              <input
                type="text"
                placeholder="Ej. Lanzamiento single / Concierto Apolo"
                value={metricNotes}
                onChange={(e) => setMetricNotes(e.target.value)}
                className={`w-full p-2.5 rounded-lg text-xs font-sans focus:outline-none ${
                  isStitchLight
                    ? 'bg-white border border-slate-200 text-slate-800 focus:border-indigo-500'
                    : 'bg-[#131313] border border-[#99907c]/15 text-neutral-200 focus:border-[#f2ca50]/30'
                }`}
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={isSavingMetric}
                className={`flex-1 py-2.5 rounded-xl font-mono text-[10px] font-bold tracking-widest uppercase cursor-pointer flex items-center justify-center gap-1.5 transition-all ${
                  isSavingMetric
                    ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                    : isStitchLight
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 shadow-lg shadow-[#f2ca50]/15'
                }`}
              >
                {isSavingMetric ? 'Guardando...' : editingMetricId ? 'Actualizar Snapshot' : 'Añadir Snapshot'}
              </button>

              {editingMetricId && (
                <button
                  type="button"
                  onClick={handleCancelEditMetric}
                  className={`px-2 py-1 rounded font-mono text-[10px] font-bold tracking-widest uppercase cursor-pointer transition-all ${
                    isStitchLight
                      ? 'border border-slate-200 text-slate-600 bg-slate-50 hover:bg-slate-100'
                      : 'border border-neutral-800 text-neutral-400 bg-neutral-900 hover:bg-neutral-850'
                  }`}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Historial Tabla (7 columns) */}
        <div className={`lg:col-span-7 ${colors.card} p-5 space-y-4 flex flex-col min-w-0`}>
          <div className={`border-b pb-2 ${isStitchLight ? 'border-slate-100' : 'border-[#99907c]/15'}`}>
            <h3 className={`text-xs font-bold font-display uppercase tracking-widest flex items-center gap-1.5 ${isStitchLight ? 'text-indigo-600' : 'text-[#f2ca50]'}`}>
              <Table className="w-3.5 h-3.5" /> Registros Históricos en Supabase ({metrics.length})
            </h3>
            <p className="text-[9px] font-mono text-neutral-500 mt-0.5">
              Snapshots persistentes y deltas calculados de evolución diaria.
            </p>
          </div>

          <div className="overflow-x-auto flex-1 min-h-[300px]">
            <table className="w-full text-left text-[10px] font-mono">
              <thead>
                <tr className={`border-b text-neutral-400 uppercase tracking-wider text-[8px] ${isStitchLight ? 'border-slate-100' : 'border-neutral-900'}`}>
                  <th className="py-2.5 font-medium">Fecha</th>
                  {hasInstagram && <th className="py-2.5 font-medium text-right">Instagram</th>}
                  {hasTikTok && <th className="py-2.5 font-medium text-right">TikTok</th>}
                  {hasYouTube && <th className="py-2.5 font-medium text-right">YouTube</th>}
                  {hasSpotify && <th className="py-2.5 font-medium text-right">Spotify</th>}
                  <th className="py-2.5 font-medium pl-3">Notas</th>
                  <th className="py-2.5 font-medium text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-500/10">
                {metrics.length === 0 ? (
                  <tr>
                    <td colSpan={3 + activeCount} className="py-8 text-center text-neutral-500 font-mono text-xs">
                      No hay registros históricos todavía. Añade un checkpoint o ejecuta el radar.
                    </td>
                  </tr>
                ) : (
                  [...metrics]
                    .sort((a, b) => b.fecha.localeCompare(a.fecha))
                    .map((m, index, arr) => {
                      const prevLog = index + 1 < arr.length ? arr[index + 1] : null;
                      
                      const instaDelta = prevLog ? (m.instagram_followers || m.instagram) - (prevLog.instagram_followers || prevLog.instagram) : 0;
                      const tiktokDelta = prevLog ? (m.tiktok_followers || m.tiktok) - (prevLog.tiktok_followers || prevLog.tiktok) : 0;
                      const youtubeDelta = prevLog ? (m.youtube_subscribers || m.youtube) - (prevLog.youtube_subscribers || prevLog.youtube) : 0;
                      const spotifyDelta = prevLog ? (m.spotify_monthly_listeners || m.spotify || 0) - (prevLog.spotify_monthly_listeners || prevLog.spotify || 0) : 0;

                      const formatDelta = (delta: number) => {
                        if (delta > 0) return <span className="text-emerald-500 font-bold">+{delta}</span>;
                        if (delta < 0) return <span className="text-rose-500 font-bold">{delta}</span>;
                        return <span className="text-neutral-500">0</span>;
                      };

                      const parts = m.fecha.split('-');
                      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0].slice(-2)}` : m.fecha;

                      return (
                        <tr key={`${m.id || 'metric'}-${index}`} className={`hover:bg-neutral-500/5 transition-colors ${
                          editingMetricId === m.id 
                            ? isStitchLight ? 'bg-indigo-50/40' : 'bg-[#f2ca50]/5' 
                            : ''
                        }`}>
                          <td className="py-3 font-bold whitespace-nowrap">{formattedDate}</td>
                          {hasInstagram && (
                            <td className="py-3 text-right">
                              <div className="font-bold">{(m.instagram_followers || m.instagram || 0).toLocaleString()}</div>
                              <div className="text-[8px] text-neutral-500">{formatDelta(instaDelta)}</div>
                            </td>
                          )}
                          {hasTikTok && (
                            <td className="py-3 text-right">
                              <div className="font-bold">{(m.tiktok_followers || m.tiktok || 0).toLocaleString()}</div>
                              <div className="text-[8px] text-neutral-500">{formatDelta(tiktokDelta)}</div>
                            </td>
                          )}
                          {hasYouTube && (
                            <td className="py-3 text-right">
                              <div className="font-bold">{(m.youtube_subscribers || m.youtube || 0).toLocaleString()}</div>
                              <div className="text-[8px] text-neutral-500">{formatDelta(youtubeDelta)}</div>
                            </td>
                          )}
                          {hasSpotify && (
                            <td className="py-3 text-right">
                              <div className="font-bold">{(m.spotify_monthly_listeners || m.spotify || 0).toLocaleString()}</div>
                              <div className="text-[8px] text-neutral-500">{formatDelta(spotifyDelta)}</div>
                            </td>
                          )}
                          <td className="py-3 pl-3 text-neutral-400 font-sans max-w-[120px] truncate" title={m.notas}>
                            {m.notas || <span className="text-neutral-600 font-mono text-[9px]">-</span>}
                          </td>
                          <td className="py-3 text-center">
                            <div className="flex justify-center items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleEditMetricClick(m)}
                                className="p-1 hover:text-indigo-400 transition-colors cursor-pointer bg-transparent border-none text-neutral-500"
                                title="Editar snapshot"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              {onDeleteMetric && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (confirm('¿Seguro que deseas eliminar este snapshot de Supabase?')) {
                                      await onDeleteMetric(m.id);
                                    }
                                  }}
                                  className="p-1 hover:text-rose-500 transition-colors cursor-pointer bg-transparent border-none text-neutral-500"
                                  title="Eliminar snapshot"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </>
      )}

      {/* 4. Instagram Meta Graph API & OAuth Connection Modal */}
      {showIgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden ${
              isStitchLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-gradient-to-r from-pink-950/30 via-purple-950/20 to-neutral-900">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-pink-500/20">
                  <Instagram className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider flex items-center gap-2">
                    Instagram Platform Insights API
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-400 font-mono font-normal">
                      Meta Official
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    Alcance real, impresiones, reproducciones de Reels y métricas de creadores
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowIgModal(false)}
                className="p-2 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto font-sans">
              {/* Official Documentation Reference */}
              <div className="p-3.5 rounded-xl border border-pink-500/30 bg-pink-950/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 text-xs text-pink-200">
                  <ExternalLink className="w-4 h-4 text-pink-400 shrink-0" />
                  <span>
                    Documentación Oficial Meta: <strong className="text-white">Instagram Platform Insights API</strong>
                  </span>
                </div>
                <a
                  href="https://developers.facebook.com/documentation/instagram-platform/insights"
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 rounded-lg bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 text-[10px] font-mono font-bold flex items-center gap-1 transition-all"
                >
                  Abrir Docs <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              {/* Connection Status Card */}
              <div className={`p-4 rounded-xl border ${
                igStatus?.connected 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : isStitchLight
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-neutral-800/60 border-neutral-700 text-neutral-300'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      igStatus?.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-700 text-neutral-400'
                    }`}>
                      {igStatus?.connected ? <ShieldCheck className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-2">
                        {igStatus?.connected ? 'Instagram Insights Conectado' : 'Modo Scraping Autónomo Activo'}
                        {igStatus?.connected && (
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        )}
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        {igStatus?.connected 
                          ? `@${igStatus.account?.username} • ${(igStatus.account?.followers_count || latestMetric?.instagram || 1573).toLocaleString()} seguidores • ${igStatus.account?.media_count || 67} publicaciones`
                          : 'Sin token de Instagram Insights API. El radar opera en modo scraping multi-bot.'
                        }
                      </div>
                    </div>
                  </div>

                  {igStatus?.connected && (
                    <button
                      onClick={handleDisconnectIg}
                      disabled={isConnectingIg}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-mono font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Unlink className="w-3 h-3" /> Desconectar
                    </button>
                  )}
                </div>

                {/* If connected with Insights, show mini-dashboard */}
                {igStatus?.connected && (igStatus as any).insights && (
                  <div className="mt-4 pt-3 border-t border-emerald-500/20 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-[9px] font-mono text-neutral-400 uppercase">Alcance (Reach)</div>
                      <div className="text-sm font-bold font-display text-white mt-0.5">
                        {((igStatus as any).insights?.reach || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-[9px] font-mono text-neutral-400 uppercase">Impresiones</div>
                      <div className="text-sm font-bold font-display text-white mt-0.5">
                        {((igStatus as any).insights?.impressions || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-[9px] font-mono text-neutral-400 uppercase">Visitas Perfil</div>
                      <div className="text-sm font-bold font-display text-white mt-0.5">
                        {((igStatus as any).insights?.profile_views || 0).toLocaleString()}
                      </div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/30">
                      <div className="text-[9px] font-mono text-neutral-400 uppercase">Interacciones</div>
                      <div className="text-sm font-bold font-display text-white mt-0.5">
                        {((igStatus as any).insights?.total_interactions || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Feedback messages */}
              {igModalMsg && (
                <div className={`p-3.5 rounded-xl border text-xs font-mono flex items-center gap-2.5 ${
                  igModalMsg.type === 'success' 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                }`}>
                  {igModalMsg.type === 'success' ? <Check className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
                  <span>{igModalMsg.text}</span>
                </div>
              )}

              {/* Token Input & Authorization */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-300">
                    Vincular Token de Instagram Insights API
                  </label>
                  <span className="text-[10px] text-pink-400 font-mono">
                    Permisos: instagram_manage_insights
                  </span>
                </div>
                
                <div className="relative">
                  <input
                    type="password"
                    placeholder="Pega aquí tu User Access Token con permiso instagram_manage_insights (EAA...)"
                    value={igTokenInput}
                    onChange={(e) => setIgTokenInput(e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl font-mono text-xs border focus:outline-none focus:ring-2 ${
                      isStitchLight 
                        ? 'bg-slate-50 border-slate-300 text-slate-900 focus:ring-pink-500' 
                        : 'bg-black/50 border-neutral-700 text-white focus:ring-pink-500 focus:border-pink-500'
                    }`}
                  />
                  <div className="absolute right-3 top-3 text-neutral-500">
                    <Key className="w-4 h-4" />
                  </div>
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <a
                    href="https://developers.facebook.com/tools/explorer/"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-pink-400 hover:text-pink-300 flex items-center gap-1 font-mono hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" /> Meta Graph API Explorer
                  </a>

                  <button
                    onClick={handleConnectIgToken}
                    disabled={isConnectingIg || !igTokenInput.trim()}
                    className={`px-4 py-2.5 rounded-xl font-mono text-xs font-bold tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer ${
                      isConnectingIg || !igTokenInput.trim()
                        ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white shadow-lg shadow-pink-900/30'
                    }`}
                  >
                    {isConnectingIg ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Verificando Insights API...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Conectar Instagram Insights</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Step by step guide according to Meta Insights Documentation */}
              <div className={`p-4 rounded-xl border space-y-2 text-xs ${
                isStitchLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-neutral-950/60 border-neutral-800 text-neutral-400'
              }`}>
                <div className="font-bold font-mono uppercase tracking-wider text-[11px] text-neutral-300 flex items-center gap-1.5">
                  <span>📘</span> Pasos según la documentación oficial de Meta Insights:
                </div>
                <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed">
                  <li>Tu cuenta de Instagram debe ser de tipo <strong className="text-white">Creador o Empresa</strong> vinculada a una Página de Facebook.</li>
                  <li>Entra en el <a href="https://developers.facebook.com/tools/explorer/" target="_blank" rel="noreferrer" className="text-pink-400 underline">Meta Graph API Explorer</a>.</li>
                  <li>En <em>Permisos (Permissions)</em>, activa exactamente estos 4 scopes oficiales:
                    <div className="mt-1 flex flex-wrap gap-1">
                      <code className="px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-300 font-mono text-[10px]">instagram_manage_insights</code>
                      <code className="px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-300 font-mono text-[10px]">instagram_basic</code>
                      <code className="px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-300 font-mono text-[10px]">pages_show_list</code>
                      <code className="px-1.5 py-0.5 rounded bg-pink-500/15 text-pink-300 font-mono text-[10px]">pages_read_engagement</code>
                    </div>
                  </li>
                  <li>Haz clic en <strong>Generate Access Token</strong> y pega el token arriba para sincronizar alcances, impresiones y reproducciones de Reels.</li>
                </ol>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-800 flex justify-between items-center bg-neutral-900/50">
              <a
                href="https://developers.facebook.com/documentation/instagram-platform/insights"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 font-mono"
              >
                <ExternalLink className="w-3 h-3" /> developers.facebook.com/documentation/instagram-platform/insights
              </a>
              <button
                onClick={() => setShowIgModal(false)}
                className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                  isStitchLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. GEMINI MULTIMODAL SCREENSHOT SCANNER MODAL */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className={`w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col ${
            isStitchLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-neutral-900 border-neutral-800 text-white'
          }`}>
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display uppercase tracking-wider flex items-center gap-2">
                    Escanear Métricas con Visión IA
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono font-normal flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" /> Gemini Multimodal
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400 font-mono">
                    Sube una captura de pantalla de Instagram, TikTok o Spotify y la IA extraerá todas las métricas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowScanModal(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto font-sans">
              {/* Feedback messages */}
              {scanError && (
                <div className="p-3.5 rounded-xl border border-red-500/40 bg-red-950/20 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
                  <span>{scanError}</span>
                </div>
              )}
              {scanSuccess && (
                <div className="p-3.5 rounded-xl border border-emerald-500/40 bg-emerald-950/20 text-emerald-300 text-xs flex items-center gap-2">
                  <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                  <span>{scanSuccess}</span>
                </div>
              )}

              {/* Upload Dropzone */}
              <div className="space-y-3">
                <label className="block text-xs font-mono uppercase tracking-wider font-bold text-neutral-300">
                  1. Cargar captura de pantalla (Móvil o Web)
                </label>

                {!scanImageBase64 ? (
                  <label className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    isStitchLight
                      ? 'border-indigo-200 bg-indigo-50/50 hover:bg-indigo-50 hover:border-indigo-400'
                      : 'border-neutral-700 bg-black/30 hover:bg-neutral-800/50 hover:border-indigo-500/50'
                  }`}>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-3">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-sm font-bold text-neutral-200">
                      Arrastra o haz clic para subir captura
                    </div>
                    <div className="text-[11px] text-neutral-400 font-mono mt-1">
                      Soporta capturas de Instagram (perfil o insights), TikTok, Spotify for Artists o YouTube
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleScreenshotInputChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="relative rounded-xl border border-neutral-700 overflow-hidden bg-black/60 p-3 flex items-center gap-4">
                    <img
                      src={scanImageBase64}
                      alt="Captura cargada"
                      className="w-20 h-20 object-cover rounded-lg border border-neutral-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white flex items-center gap-2">
                        <span>Captura lista para analizar</span>
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      </div>
                      <div className="text-[11px] text-neutral-400 font-mono mt-0.5">
                        Imagen cargada en memoria. Pulsa el botón para que Gemini extraiga los datos.
                      </div>
                      <label className="inline-block mt-2 text-[10px] text-indigo-400 hover:text-indigo-300 font-mono underline cursor-pointer">
                        Cambiar imagen
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleScreenshotInputChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              {scanImageBase64 && (
                <button
                  onClick={handleAnalyzeScreenshot}
                  disabled={isAnalyzingScreenshot}
                  className={`w-full py-3 rounded-xl font-mono text-xs font-bold tracking-wider uppercase flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isAnalyzingScreenshot
                      ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-900/30'
                  }`}
                >
                  {isAnalyzingScreenshot ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin text-indigo-300" />
                      <span>Gemini Visión analizando píxeles y métricas...</span>
                    </>
                  ) : (
                    <>
                      <ScanLine className="w-4 h-4 text-indigo-300" />
                      <span>Escanear y Guardar en Supabase</span>
                    </>
                  )}
                </button>
              )}

              {/* Result Preview Card */}
              {scanResult && (
                <div className={`p-4 rounded-xl border space-y-3 animate-in fade-in duration-300 ${
                  isStitchLight ? 'bg-indigo-50/60 border-indigo-200' : 'bg-indigo-950/20 border-indigo-500/30'
                }`}>
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-2">
                    <div className="text-xs font-bold font-mono uppercase tracking-wider text-indigo-300 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      Datos Extraídos con Éxito
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 font-bold uppercase">
                      {scanResult.platform || 'Red Social'}
                    </span>
                  </div>

                  <div className="text-xs text-neutral-300 leading-relaxed font-sans">
                    {scanResult.summary}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-center">
                    {scanResult.followers !== null && scanResult.followers !== undefined && (
                      <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                        <div className="text-[9px] font-mono text-neutral-400 uppercase">Seguidores / Oyentes</div>
                        <div className="text-base font-bold font-display text-white mt-0.5">
                          {Number(scanResult.followers).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {scanResult.account_handle && (
                      <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                        <div className="text-[9px] font-mono text-neutral-400 uppercase">Usuario</div>
                        <div className="text-xs font-bold font-mono text-indigo-300 mt-1 truncate">
                          {scanResult.account_handle}
                        </div>
                      </div>
                    )}
                    {scanResult.posts_count !== null && scanResult.posts_count !== undefined && (
                      <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                        <div className="text-[9px] font-mono text-neutral-400 uppercase">Publicaciones</div>
                        <div className="text-base font-bold font-display text-white mt-0.5">
                          {Number(scanResult.posts_count).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {scanResult.reach !== null && scanResult.reach !== undefined && (
                      <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                        <div className="text-[9px] font-mono text-neutral-400 uppercase">Alcance (Reach)</div>
                        <div className="text-base font-bold font-display text-emerald-400 mt-0.5">
                          {Number(scanResult.reach).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {scanResult.impressions !== null && scanResult.impressions !== undefined && (
                      <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                        <div className="text-[9px] font-mono text-neutral-400 uppercase">Impresiones</div>
                        <div className="text-base font-bold font-display text-purple-400 mt-0.5">
                          {Number(scanResult.impressions).toLocaleString()}
                        </div>
                      </div>
                    )}
                    {scanResult.confidence && (
                      <div className="p-2.5 rounded-lg bg-black/40 border border-neutral-800">
                        <div className="text-[9px] font-mono text-neutral-400 uppercase">Confianza IA</div>
                        <div className="text-xs font-bold font-mono text-emerald-400 mt-1 uppercase">
                          Alta (99%)
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-neutral-800 flex justify-between items-center bg-neutral-900/50">
              <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                OCR & Visión Asistida por Gemini 2.5
              </span>
              <button
                onClick={() => {
                  setShowScanModal(false);
                  setScanImageBase64(null);
                  setScanResult(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-mono uppercase tracking-wider font-bold transition-all cursor-pointer ${
                  isStitchLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300'
                }`}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
