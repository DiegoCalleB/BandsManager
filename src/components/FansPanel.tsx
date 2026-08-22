import React, { useState, useMemo, useEffect } from 'react';
import { 
  Users, Heart, QrCode, Download, Search, Plus, Trash2, Sparkles, 
  Copy, Check, FileSpreadsheet, ShieldCheck, Mail, MapPin, Calendar, ExternalLink,
  Filter, LayoutGrid, List, Map as MapIcon, X, TrendingUp, Printer, Share2, MessageCircle,
  Gift, Tag, Music, Save, CheckCircle2, Flame, Star, Award, Instagram, FileCode, Layers
} from 'lucide-react';
import QRCode from 'react-qr-code';
import * as XLSX from 'xlsx';
import { Fan, Concert, EPKConfig, SocialMetric, ThemeColors } from '../types';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { ReelsMetricsView } from './reels/ReelsMetricsView';
import { FansCommunityView } from './fans/FansCommunityView';
import { FAN_FORM_LANGUAGES, FanFormLanguage, DEFAULT_FAN_FORM_LANGUAGE, isFanFormLanguage } from '../i18n/fansTranslations';
import { QrExportModal } from './QrExportModal';
import { downloadQrAsSvg, downloadQrAsHighResPng, printHighQualityFlyer } from '../utils/qrExport';

interface FansPanelProps {
  fans: Fan[];
  concerts: Concert[];
  epkConfig: EPKConfig;
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
}

const COLORS = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'];

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
  isStitchLight
}) => {
  const effectiveBandName = currentBandName || epkConfig?.contactoBooking?.nombre || (currentBandId?.includes('bakandeya') ? 'Bakandeya' : 'Tu Banda');
  const effectiveBandLogo = currentBandLogo || epkConfig?.logoUrl || (effectiveBandName.toLowerCase().includes('bakandeya') ? '/logo_bakandeya_bueno_sin_fondo.png' : '');
  const cleanBandId = (currentBandId || '').toLowerCase().replace(/^(band|reg)-/, '') || 'banda';
  const [activeTab, setActiveTab] = useState<'metrics' | 'fans' | 'qr' | 'dashboard'>('metrics');
  const [viewMode, setViewMode] = useState<'feed' | 'grid' | 'table' | 'map'>('feed');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterOrigen, setFilterOrigen] = useState<string>('');
  const [selectedCityFilter, setSelectedCityFilter] = useState<string>('');
  const [selectedNivelFilter, setSelectedNivelFilter] = useState<string>('');
  const [selectedConcertId, setSelectedConcertId] = useState<string>('');

  // Configurable City Tabs state (synced with DB epkConfig.ciudadesConfig)
  const [customCityChips, setCustomCityChips] = useState<string[]>(() => {
    if (epkConfig?.ciudadesConfig && Array.isArray(epkConfig.ciudadesConfig) && epkConfig.ciudadesConfig.length > 0) {
      return epkConfig.ciudadesConfig;
    }
    try {
      const saved = localStorage.getItem('bakandeya_custom_cities');
      return saved ? JSON.parse(saved) : ['Madrid', 'Sevilla', 'Barcelona', 'Málaga', 'Valencia', 'Granada', 'Cádiz'];
    } catch {
      return ['Madrid', 'Sevilla', 'Barcelona', 'Málaga', 'Valencia', 'Granada', 'Cádiz'];
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
  
  // Incentive state
  const [incentivo, setIncentivo] = useState(epkConfig?.incentivoFans || {
    mensajeAgradecimiento: "¡Muchas gracias por unirte a la familia de la banda!",
    enlaceDescarga: "https://bands-manager.up.railway.app/descargas/tema-inedito-directo.mp3",
    codigoDescuento: "BAKANDEYA-FAN-10"
  });
  const [savedIncentive, setSavedIncentive] = useState(false);

  // Revolut Donation state
  const [revolutConfig, setRevolutConfig] = useState(epkConfig?.donacionRevolut || {
    habilitado: true,
    revolutTag: "bakandeya",
    revolutUrl: "https://revolut.me/bakandeya",
    titulo: "Colabora con una aportación económica",
    descripcion: "Tu aportación directa nos ayuda a financiar furgoneta de gira, grabación de nuevos temas e instrumentos."
  });
  const [savedRevolut, setSavedRevolut] = useState(false);

  useEffect(() => {
    if (epkConfig?.incentivoFans) {
      setIncentivo(epkConfig.incentivoFans);
    }
    if (epkConfig?.donacionRevolut) {
      setRevolutConfig(epkConfig.donacionRevolut);
    }
  }, [epkConfig?.incentivoFans, epkConfig?.donacionRevolut]);

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

  const handleSaveRevolut = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (onUpdateEpkConfig) {
      const cleanTag = (revolutConfig.revolutTag || '').replace(/^@/, '').replace(/^revolut\.me\//, '').trim();
      const generatedUrl = cleanTag ? (cleanTag.startsWith('http') ? cleanTag : `https://revolut.me/${cleanTag}`) : '';
      const updated = {
        ...revolutConfig,
        revolutTag: cleanTag,
        revolutUrl: generatedUrl
      };
      setRevolutConfig(updated);
      onUpdateEpkConfig({ 
        donacionRevolut: updated,
        enlacesRedes: {
          ...(epkConfig?.enlacesRedes || {}),
          revolut: generatedUrl
        }
      });
    }
    setSavedRevolut(true);
    setTimeout(() => setSavedRevolut(false), 2500);
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
  const [newNivel, setNewNivel] = useState<'fiel' | 'superfan' | 'fundador' | 'backstage'>('fiel');

  const filteredFans = useMemo(() => {
    return fans.filter(f => {
      const matchQuery = f.nombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (f.ciudad && f.ciudad.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (f.conciertoOrigenNombre && f.conciertoOrigenNombre.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchFilter = filterOrigen 
        ? (f.conciertoOrigenId === filterOrigen || (filterOrigen === 'Otros' && !f.conciertoOrigenId))
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
      let raw = (f.comoConocio || f.conciertoOrigenNombre || '').trim();
      if (!raw) {
        if (f.conciertoOrigenId) raw = 'Concierto en Directo';
        else raw = 'Registro Directo / QR';
      }

      let category = raw;
      const lower = raw.toLowerCase();
      if (lower.includes('sala') || lower.includes('concierto') || lower.includes('festival') || lower.includes('directo') || lower.includes('bolo') || lower.includes('caracol') || lower.includes('viña')) {
        category = 'Conciertos / Directo';
      } else if (lower.includes('insta') || lower.includes('ig')) {
        category = 'Instagram';
      } else if (lower.includes('tik')) {
        category = 'TikTok';
      } else if (lower.includes('qr') || lower.includes('escenario')) {
        category = 'Escaneo QR';
      } else if (lower.includes('amigo') || lower.includes('boca')) {
        category = 'Boca a Boca / Amigos';
      } else if (lower.includes('spot') || lower.includes('you') || lower.includes('web')) {
        category = 'Web / Streaming';
      } else if (lower.includes('manual')) {
        category = 'Registro Manual';
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
      const month = f.fechaCaptura ? f.fechaCaptura.substring(0, 7) : '2026-05';
      monthMap[month] = (monthMap[month] || 0) + 1;
    });

    const sortedMonths = Object.keys(monthMap).sort();
    let runningTotal = 0;
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    return sortedMonths.map(month => {
      const newCount = monthMap[month];
      runningTotal += newCount;
      const [y, m] = month.split('-');
      const mIdx = m ? parseInt(m, 10) - 1 : 0;
      const label = `${monthNames[mIdx] || m} '${y ? y.slice(2) : '26'}`;
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
      Ciudad: f.ciudad || '',
      Origen: f.comoConocio || f.conciertoOrigenNombre || '',
      'Concierto ID': f.conciertoOrigenId || '',
      'Fecha Registro': f.fechaCaptura,
      'Consentimiento RGPD': f.consentimientoRGPD ? 'SÍ' : 'NO'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, `Fans ${effectiveBandName}`);
    XLSX.writeFile(workbook, `Fans_${effectiveBandName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
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
      instagram: newInstagram.trim().replace(/^@/, '') || undefined,
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
  const [useCustomDomain, setUseCustomDomain] = useState(true); // Default to clean custom domain like bands-manager.up.railway.app
  const defaultDomain = typeof window !== 'undefined' && window.location.hostname.endsWith('railway.app')
    ? window.location.hostname
    : 'bands-manager.up.railway.app';
  const [customDomain, setCustomDomain] = useState(defaultDomain);
  const [routePrefix, setRoutePrefix] = useState('unete');
  const [qrLanguage, setQrLanguage] = useState<FanFormLanguage>(DEFAULT_FAN_FORM_LANGUAGE);

  useEffect(() => {
    if (selectedConcert) {
      const defaultSlug = `${selectedConcert.ciudad}-${selectedConcert.sala}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
      setCustomSlug(defaultSlug);
      // Precarga el idioma guardado en el concierto; el manager siempre puede cambiarlo a mano abajo.
      setQrLanguage(isFanFormLanguage(selectedConcert.idioma) ? selectedConcert.idioma : DEFAULT_FAN_FORM_LANGUAGE);
    } else {
      setCustomSlug('');
    }
  }, [selectedConcertId]);

  // Build clean target URL
  const rawDomain = useCustomDomain 
    ? (customDomain.trim().startsWith('http') ? customDomain.trim() : `https://${customDomain.trim().replace(/\/$/, '')}`)
    : (typeof window !== 'undefined' ? window.location.origin : 'https://bands-manager.up.railway.app');

  const cleanPrefix = routePrefix.trim().replace(/^\/+|\/+$/g, '');
  const cleanSlugVal = customSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');

  const pathFormatted = cleanSlugVal 
    ? (cleanPrefix ? `/${cleanPrefix}/${cleanSlugVal}` : `/${cleanSlugVal}`)
    : (cleanPrefix ? `/${cleanPrefix}` : '/unete');

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
  const qrConcertUrl = `${rawDomain}${pathFormatted}${qrQueryParams.length ? `?${qrQueryParams.join('&')}` : ''}`;

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
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleShareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Únete a ${effectiveBandName}`,
          text: 'Escanea o entra para unirte a nuestra comunidad.',
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
  const [isExportingDirect, setIsExportingDirect] = useState(false);

  const handleDownloadSvg = async () => {
    setIsExportingDirect(true);
    try {
      const concertTitle = selectedConcert ? `${selectedConcert.sala}` : effectiveBandName;
      await downloadQrAsSvg({
        svgElementId: 'qr-code-svg-container',
        filename: `qr-${effectiveBandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${concertTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-vectorial`,
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
        svgElementId: 'qr-code-svg-container',
        filename: `qr-${effectiveBandName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${concertTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}-4k`,
        template: 'qr-only',
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
      svgElementId: 'qr-code-svg-container',
      bandName: effectiveBandName,
      concertTitle,
      dateCity,
      url: qrConcertUrl,
      logoUrl: effectiveBandLogo,
      ctaText: '¡ESCANEA CON LA CÁMARA DE TU MÓVIL!',
      subtitle: `Únete a la comunidad oficial de ${effectiveBandName} para acceder a canciones inéditas, sorpresas exclusivas y descuentos en merchandising.`
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div>
          <h2 className="text-2xl font-black text-white font-display flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-amber-500" />
            Seguidores & Redes
          </h2>
          <p className="text-slate-400 font-mono text-sm mt-1">
            Métricas de redes sociales y streaming en tiempo real, comunidad de fans interactiva, fidelización y captura en directo.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button 
            onClick={copyLink}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold font-mono rounded-xl border border-slate-700 flex items-center gap-2 transition cursor-pointer"
          >
            <Copy className="w-4 h-4" /> Enlace de Captura Corto
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold font-mono rounded-xl border border-slate-700 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Registrar Fan Manual
          </button>
          <button 
            onClick={handleExportCSV}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-900 text-xs font-bold font-mono rounded-xl shadow-lg transition flex items-center gap-2 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Exportar CSV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-slate-800 hide-scrollbar gap-1">
        <button
          id="tab-btn-fans-metrics"
          onClick={() => setActiveTab('metrics')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer font-mono text-xs uppercase tracking-wider ${activeTab === 'metrics' ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <TrendingUp className="w-4 h-4 text-amber-500" /> 1. Seguimiento & Métricas de Redes
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer font-mono text-xs uppercase tracking-wider ${activeTab === 'qr' ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <QrCode className="w-4 h-4 text-amber-500" /> 2. Captura en Vivo & QR
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer font-mono text-xs uppercase tracking-wider ${activeTab === 'dashboard' ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Heart className="w-4 h-4 text-amber-500" /> 3. Dashboard & Analítica
        </button>
        <button
          onClick={() => setActiveTab('fans')}
          className={`px-4 py-2.5 flex items-center gap-2 border-b-2 transition cursor-pointer font-mono text-xs uppercase tracking-wider ${activeTab === 'fans' ? 'border-amber-500 text-amber-400 font-bold bg-amber-500/5' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <Users className="w-4 h-4 text-amber-500" /> 4. Comunidad & Red Social ({fans.length})
        </button>
      </div>

      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Total Fans Registrados</p>
              <h3 className="text-5xl font-black text-white font-display">{fans.length}</h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Consentimiento RGPD</p>
              <h3 className="text-4xl font-black text-emerald-400 font-display flex items-center gap-2">
                <ShieldCheck className="w-8 h-8" />
                100%
              </h3>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-center">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 font-mono">Ciudades Activas</p>
              <h3 className="text-4xl font-black text-amber-400 font-display flex items-center gap-2">
                <MapPin className="w-8 h-8" />
                {new Set(fans.map(f => f.ciudad).filter(Boolean)).size}
              </h3>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crecimiento Evolutivo de Fans */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-88 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-amber-500" />
                    Crecimiento Evolutivo de Fans
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">Curva acumulativa de la comunidad {effectiveBandName}</p>
                </div>
                <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                  Total: {fans.length} fans
                </span>
              </div>
              
              <div className="flex-1 min-h-0">
                {evolutionaryGrowthData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={evolutionaryGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="fanGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                      <Tooltip 
                        contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', borderRadius: '12px', color: '#fff'}}
                        formatter={(val: any, name: any) => [
                          name === 'total' ? `${val} fans acumulados` : `${val} nuevos capturados`,
                          name === 'total' ? 'Comunidad Total' : 'Capturados en el mes'
                        ]}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="total" 
                        stroke="#f59e0b" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#fanGrowthGrad)" 
                        name="total" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="flex items-center justify-center h-full text-slate-500 text-xs font-mono">No hay datos suficientes</div>
                )}
              </div>
            </div>
            
            {/* Canal de Origen (Fixed & Visual) */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 h-88 flex flex-col">
              <div className="mb-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest font-mono">Canal de Origen de Fans</p>
                <p className="text-[11px] text-slate-500 font-mono">De dónde provienen los registros</p>
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
                            contentStyle={{backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px', borderRadius: '12px', color: '#fff'}}
                            formatter={(val: any, name: any) => [`${val} fans (${Math.round((val / (fans.length || 1)) * 100)}%)`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Channel Legend List */}
                    <div className="w-full sm:w-1/2 space-y-2 overflow-y-auto max-h-48 hide-scrollbar pr-1">
                      {originData.map((item, idx) => (
                        <div key={item.name} className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800/80 text-xs font-mono">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                            <span className="text-slate-200 font-bold truncate">{item.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-amber-400 font-bold">{item.value}</span>
                            <span className="text-slate-500 text-[10px]">({item.percentage}%)</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center w-full h-full text-slate-500 text-xs font-mono">No hay datos suficientes</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fans' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-5">
          {/* Configurable City Tabs Bar */}
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-amber-500" />
                Filtrar por Ciudad (Pestañas Configurables Guardadas en BBDD)
              </span>
              {selectedCityFilter && (
                <button
                  onClick={() => setSelectedCityFilter('')}
                  className="text-[11px] font-mono text-amber-400 hover:underline cursor-pointer"
                >
                  Limpiar filtro ciudad
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setSelectedCityFilter('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                  selectedCityFilter === ''
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
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
                    className={`group/city inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 shadow-md'
                        : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                    }`}
                  >
                    <span>{city}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isSelected ? 'bg-slate-950/20 text-slate-950' : 'bg-slate-800 text-amber-400'
                    }`}>
                      {count}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveCityTab(city, e)}
                      className={`p-0.5 rounded-full hover:bg-rose-500/30 transition opacity-60 group-hover/city:opacity-100 ${
                        isSelected ? 'hover:text-rose-950 text-slate-950' : 'hover:text-rose-300 text-slate-400'
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
                    className="bg-slate-950 border border-amber-500 rounded-xl px-2.5 py-1 text-xs text-white font-mono outline-none w-36"
                  />
                  <button
                    type="submit"
                    className="p-1 bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 transition cursor-pointer"
                    title="Guardar ciudad"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => { setIsAddingCity(false); setNewCityInput(''); }}
                    className="p-1 bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-700 transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAddingCity(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-slate-950 hover:bg-slate-800 text-amber-400 border border-amber-500/30 border-dashed flex items-center gap-1 transition cursor-pointer"
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
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o ciudad..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none"
                />
              </div>
              <div className="relative w-full sm:w-64">
                <Filter className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <select
                  value={filterOrigen}
                  onChange={e => setFilterOrigen(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none appearance-none font-mono"
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
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono cursor-pointer"
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
              <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setViewMode('feed')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'feed' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Muro Social & Comunidad"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Muro Social</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'grid' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista en Tarjetas"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span>Tarjetas</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'table' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista en Detalles / Tabla"
                >
                  <List className="w-3.5 h-3.5" />
                  <span>Tabla CRM</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    viewMode === 'map' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                  title="Vista en Mapa por Ciudades"
                >
                  <MapIcon className="w-3.5 h-3.5" />
                  <span>Mapa</span>
                </button>
              </div>

              <span className="text-xs text-slate-400 font-mono shrink-0 hidden sm:inline">
                {filteredFans.length} resultados
              </span>
            </div>
          </div>

          {viewMode === 'feed' && (
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

          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFans.length === 0 ? (
                <div className="col-span-full p-8 text-center text-slate-500 font-mono bg-slate-950/50 rounded-xl border border-slate-800">
                  No hay fans registrados que coincidan con los filtros aplicados.
                </div>
              ) : (
                filteredFans.map(fan => (
                  <div key={fan.id} className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-2xl p-4 transition-all space-y-3 relative group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 font-bold uppercase text-sm">
                          {fan.nombre.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm truncate max-w-[160px]">{fan.nombre}</h4>
                          <p className="text-[11px] font-mono text-slate-400 truncate max-w-[160px]">{fan.email}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`¿Eliminar fan ${fan.nombre}?`)) {
                            onDeleteFan(fan.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:bg-rose-500/20 hover:text-rose-400 rounded-lg transition cursor-pointer"
                        title="Eliminar Fan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-800/80">
                      <div className="bg-slate-900/80 p-2 rounded-lg">
                        <span className="text-slate-500 text-[9px] block uppercase">Ciudad</span>
                        <span className="text-slate-200 flex items-center gap-1 font-semibold">
                          <MapPin className="w-3 h-3 text-amber-500 shrink-0" />
                          <span className="truncate">{fan.ciudad || 'No especificada'}</span>
                        </span>
                      </div>
                      <div className="bg-slate-900/80 p-2 rounded-lg">
                        <span className="text-slate-500 text-[9px] block uppercase">Origen / Canal</span>
                        <span className="text-amber-400 truncate block font-semibold">{fan.comoConocio || fan.conciertoOrigenNombre || 'Directo'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                      <span>Registrado: {fan.fechaCaptura || 'Reciente'}</span>
                      {fan.consentimientoRGPD && (
                        <span className="text-emerald-400 font-bold flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <Check className="w-3 h-3" /> RGPD Ok
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {viewMode === 'map' && (
            <div className="space-y-4">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300">
                <div className="flex items-center gap-2 text-amber-400 font-bold mb-3">
                  <MapIcon className="w-4 h-4" />
                  <span>Distribución Geográfica de la Comunidad de Fans por Ciudades</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(
                    filteredFans.reduce((acc, f) => {
                      const city = f.ciudad || 'Ciudad no indicada';
                      acc[city] = (acc[city] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  )
                  .sort((a,b) => (b[1] as number) - (a[1] as number))
                  .map(([city, count]) => (
                    <div key={city} className="bg-slate-900 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
                      <div className="flex items-center gap-2 truncate">
                        <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                        <span className="font-bold text-white truncate">{city}</span>
                      </div>
                      <span className="bg-amber-500/20 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                        {count} {count === 1 ? 'fan' : 'fans'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-amber-400 uppercase font-bold border-b border-slate-800 font-mono">
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
                    <td colSpan={7} className="p-8 text-center text-slate-500 font-mono">
                      No hay fans registrados que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  filteredFans.map(fan => (
                    <tr key={fan.id} className="hover:bg-slate-800/20 transition group">
                      <td className="p-3 font-semibold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 font-bold uppercase text-[10px]">
                            {fan.nombre.charAt(0)}
                          </div>
                          {fan.nombre}
                        </div>
                      </td>
                      <td className="p-3 font-mono">{fan.email}</td>
                      <td className="p-3">
                        {fan.ciudad ? (
                          <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-500" /> {fan.ciudad}</span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-slate-400 uppercase tracking-wider">
                        {fan.comoConocio || '-'}
                      </td>
                      <td className="p-3 text-[11px] text-emerald-400 font-mono">
                        {fan.conciertoOrigenNombre || '-'}
                      </td>
                      <td className="p-3 text-center">
                        {fan.consentimientoRGPD ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-emerald-500/10 text-emerald-400">
                            <Check className="w-3.5 h-3.5" />
                          </span>
                        ) : '-'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar fan ${fan.nombre}?`)) {
                              onDeleteFan(fan.id);
                            }
                          }}
                          className="p-1.5 text-slate-500 hover:bg-rose-500 hover:text-white rounded transition opacity-0 group-hover:opacity-100 cursor-pointer"
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

      {activeTab === 'qr' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 lg:p-8 space-y-8">
          <div className="space-y-2 border-b border-slate-800 pb-5">
            <h3 className="text-xl font-black text-white flex items-center gap-2 font-display">
              <QrCode className="w-6 h-6 text-amber-400" /> Captura en Directo: Generador de QR & Campañas
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              Configura tu recompensa exclusiva para fans, genera carteles con código QR para proyectar o colocar en el stand de merchandising y capta datos con consentimiento RGPD.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Columna Izquierda: Configuración por pasos (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Paso 1: Concierto o Campaña */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">1</span>
                    Vincular a Concierto o Campaña
                  </label>
                  {selectedConcertId && (
                    <button
                      type="button"
                      onClick={() => setSelectedConcertId('')}
                      className="text-[10px] font-mono text-slate-400 hover:text-amber-300 underline cursor-pointer"
                    >
                      Usar QR Genérico
                    </button>
                  )}
                </div>
                <select
                  value={selectedConcertId}
                  onChange={e => setSelectedConcertId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                >
                  <option value="">-- Campaña General / QR Genérico de la Banda --</option>
                  {concerts.map(c => (
                    <option key={c.id} value={c.id}>
                      📅 {c.fecha} — {c.sala} ({c.ciudad})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-500 font-mono">
                  {selectedConcert 
                    ? `Los fans que escaneen se registrarán con origen: "${selectedConcert.sala} (${selectedConcert.ciudad})"`
                    : 'Los fans que escaneen se registrarán con origen: "Campaña General / Redes"'}
                </p>
              </div>

              {/* Paso 2: Incentivo / Recompensa al Fan */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">2</span>
                    <Gift className="w-4 h-4 text-amber-400" />
                    Recompensa / Incentivo para el Fan
                  </label>
                  {savedIncentive && (
                    <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ¡Guardado!
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Ofrece algo de valor al fan tras registrarse (un tema en directo exclusivo o descuento de merchan) para disparar la tasa de escaneos.
                </p>

                <div className="space-y-3 pt-1">
                  <div>
                    <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Mensaje de Bienvenida / Agradecimiento:
                    </label>
                    <input
                      type="text"
                      value={incentivo.mensajeAgradecimiento}
                      onChange={e => setIncentivo(prev => ({ ...prev, mensajeAgradecimiento: e.target.value }))}
                      placeholder="¡Muchas gracias por unirte a la familia de la banda!"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mb-1">
                        <Music className="w-3.5 h-3.5 text-amber-500" /> Enlace de Descarga (Tema inédito/directo):
                      </label>
                      <input
                        type="url"
                        value={incentivo.enlaceDescarga}
                        onChange={e => setIncentivo(prev => ({ ...prev, enlaceDescarga: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mb-1">
                        <Tag className="w-3.5 h-3.5 text-amber-500" /> Código Cupón Merchandising:
                      </label>
                      <input
                        type="text"
                        value={incentivo.codigoDescuento}
                        onChange={e => setIncentivo(prev => ({ ...prev, codigoDescuento: e.target.value.toUpperCase() }))}
                        placeholder="BAKANDEYA-FAN-10"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl p-2.5 text-xs text-amber-300 font-bold outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleSaveIncentive()}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold font-mono rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Guardar Incentivo
                    </button>
                  </div>
                </div>
              </div>

              {/* Paso 3: Apoyo Económico y Donaciones con Revolut */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-sky-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-sky-400 uppercase font-mono tracking-wider flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center text-[10px] font-black">3</span>
                    <Heart className="w-4 h-4 text-sky-400" />
                    Colaboración Económica & Donaciones (Revolut Pay)
                  </label>
                  {savedRevolut && (
                    <span className="text-[11px] font-mono text-sky-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> ¡Guardado!
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Permite a tus fans y asistentes al concierto realizar aportaciones voluntarias directas mediante Revolut (revolut.me), sin intermediarios ni comisiones abusivas.
                </p>

                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white font-mono">Mostrar tarjeta de donación Revolut</span>
                      <p className="text-[10px] text-slate-400 font-mono">Aparecerá en el formulario público y en la pantalla de confirmación</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={revolutConfig.habilitado !== false}
                      onChange={e => setRevolutConfig(prev => ({ ...prev, habilitado: e.target.checked }))}
                      className="w-4 h-4 accent-sky-500 rounded cursor-pointer"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mb-1">
                        <span className="text-sky-400 font-bold font-mono">@</span> Revtag o Usuario de Revolut:
                      </label>
                      <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 focus-within:border-sky-500 rounded-xl px-2.5">
                        <span className="text-[11px] text-slate-500 font-mono">revolut.me/</span>
                        <input
                          type="text"
                          value={revolutConfig.revolutTag || ''}
                          onChange={e => setRevolutConfig(prev => ({ ...prev, revolutTag: e.target.value.replace(/^@/, '').replace(/^revolut\.me\//, '') }))}
                          placeholder="bakandeya"
                          className="w-full bg-transparent p-2 text-xs text-sky-300 font-bold outline-none font-mono"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mb-1">
                        <Sparkles className="w-3.5 h-3.5 text-sky-400" /> Título de la tarjeta:
                      </label>
                      <input
                        type="text"
                        value={revolutConfig.titulo || ''}
                        onChange={e => setRevolutConfig(prev => ({ ...prev, titulo: e.target.value }))}
                        placeholder="Colabora con una aportación económica"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl p-2.5 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mb-1">
                      Descripción del destino de los fondos:
                    </label>
                    <textarea
                      rows={2}
                      value={revolutConfig.descripcion || ''}
                      onChange={e => setRevolutConfig(prev => ({ ...prev, descripcion: e.target.value }))}
                      placeholder="Tu aportación directa nos ayuda a financiar furgoneta de gira, grabación de nuevos temas e instrumentos."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl p-2.5 text-xs text-white outline-none resize-none"
                    />
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleSaveRevolut()}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 text-xs font-bold font-mono rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" /> Guardar Donación Revolut
                    </button>
                  </div>
                </div>
              </div>

              {/* Paso 4: Ruta Limpia y Dominio */}
              <div className="bg-slate-950/80 p-5 rounded-2xl border border-slate-800 space-y-4">
                <label className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">4</span>
                  Ruta Limpia y Dominio Base
                </label>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setUseCustomDomain(true)}
                    className={`p-2.5 rounded-xl border text-left font-mono transition flex flex-col gap-1 ${
                      useCustomDomain
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>🌐 Dominio Web Oficial</span>
                    <span className="text-[10px] text-slate-400 font-normal">Para impresiones/carteles</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseCustomDomain(false)}
                    className={`p-2.5 rounded-xl border text-left font-mono transition flex flex-col gap-1 ${
                      !useCustomDomain
                        ? 'bg-amber-500/15 border-amber-500 text-amber-300 font-bold'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <span>🧪 Servidor Dev</span>
                    <span className="text-[10px] text-slate-400 font-normal">Para pruebas en visor actual</span>
                  </button>
                </div>

                {useCustomDomain && (
                  <div className="space-y-1">
                    <label className="text-[11px] font-mono text-slate-400">Dominio del Proyecto:</label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500 bg-slate-900 px-3 py-2.5 rounded-lg border border-slate-800">https://</span>
                      <input
                        type="text"
                        value={customDomain}
                        onChange={e => setCustomDomain(e.target.value)}
                        placeholder="bands-manager.up.railway.app"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-lg p-2.5 text-xs text-white outline-none font-mono"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-mono text-slate-400">Slug personalizado:</label>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center bg-slate-900 rounded-xl border border-slate-800 px-2.5 shrink-0">
                      <span className="text-[11px] font-mono text-slate-500">/</span>
                      <input
                        type="text"
                        value={routePrefix}
                        onChange={e => setRoutePrefix(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))}
                        className="w-16 bg-transparent text-amber-400 text-xs font-mono py-2.5 font-bold outline-none"
                        placeholder="unete"
                      />
                      <span className="text-[11px] font-mono text-slate-500">/</span>
                    </div>
                    <input
                      type="text"
                      value={customSlug}
                      onChange={e => setCustomSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, ''))}
                      placeholder="ej. madrid-sala-siroco"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl p-2.5 text-xs text-white outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[11px] font-mono text-slate-400">Idioma del formulario para este enlace:</label>
                  {/* grid en vez de flex de una sola fila: con 4+ idiomas (español, inglés,
                      italiano, checo) un flex sin wrap se salía de la pantalla en móvil en
                      vez de pasar a una segunda fila. */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {FAN_FORM_LANGUAGES.map(l => (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => setQrLanguage(l.code)}
                        className={`py-2 px-2 rounded-xl border text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          qrLanguage === l.code
                            ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <span>{l.flag}</span>
                        <span>{l.label}</span>
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] font-mono text-slate-500">
                    El formulario se abrirá en este idioma por defecto; quien lo escanee siempre podrá cambiarlo a mano.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-400 uppercase font-mono tracking-widest text-[10px]">URL Destino Final del QR:</span>
                    <button
                      type="button"
                      onClick={handleCopyQrUrl}
                      className="text-[10px] text-amber-400 hover:underline font-mono"
                    >
                      {copiedQrUrl ? '¡Copiado!' : 'Copiar URL'}
                    </button>
                  </div>
                  <p className="font-mono text-amber-300 font-bold break-all bg-slate-950 p-2 rounded-lg border border-slate-800 text-[11px]">
                    {qrConcertUrl}
                  </p>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Previsualizador del Flyer / Cartel QR (5 cols) */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center space-y-4 flex flex-col items-center justify-center">
                <div className="w-full flex items-center justify-between border-b border-slate-800/80 pb-3">
                  <span className="text-xs font-bold text-slate-400 font-mono uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px] font-black">5</span>
                    Cartel & Código QR con Logo
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">Alta Resolución</span>
                </div>

                <div id="qr-code-svg-container" className="p-4 bg-white rounded-2xl shadow-2xl border-4 border-amber-500 inline-block relative my-2">
                  <QRCode value={qrConcertUrl} size={210} level="H" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    {effectiveBandLogo ? (
                      <div className="w-14 h-14 bg-slate-950 rounded-xl flex items-center justify-center overflow-hidden border-2 border-amber-500 shadow-xl p-0.5">
                        <img 
                          src={effectiveBandLogo} 
                          alt={`Logo ${effectiveBandName}`} 
                          className="w-full h-full object-contain rounded-lg" 
                        />
                      </div>
                    ) : (
                      <div className="w-12 h-12 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center border-2 border-slate-950 shadow-xl">
                        <Users className="w-6 h-6" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-center space-y-1">
                  <h4 className="font-black text-white font-display text-lg uppercase tracking-wider">
                    {selectedConcert ? `${selectedConcert.sala}` : `Únete a ${effectiveBandName}`}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {selectedConcert ? `${selectedConcert.ciudad} • ${selectedConcert.fecha}` : 'Escanea para conseguir tema exclusivo y descuentos'}
                  </p>
                </div>

                {/* Panel de Descargas en Máxima Calidad & Acciones */}
                <div className="space-y-2.5 pt-3 border-t border-slate-800 w-full">
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span className="font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      Descarga & Imprenta HD:
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowQrExportModal(true)}
                      className="text-amber-400 hover:text-amber-300 underline font-bold cursor-pointer"
                    >
                      Más formatos...
                    </button>
                  </div>

                  {/* Fila 1: Botones de Descarga en Máxima Calidad */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={handlePrintQr}
                      className="py-2.5 px-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-lg"
                      title="Imprimir Cartel A4 o Guardar en PDF de alta calidad"
                    >
                      <Printer className="w-4 h-4" /> Cartel A4
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSvg}
                      disabled={isExportingDirect}
                      className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-amber-400 font-bold font-mono text-xs uppercase tracking-wider rounded-xl border border-amber-500/30 flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                      title="Descargar SVG Vectorial (Resolución infinita para imprenta)"
                    >
                      <FileCode className="w-4 h-4" /> Vector SVG
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadPng4k}
                      disabled={isExportingDirect}
                      className="py-2.5 px-2 bg-slate-900 hover:bg-slate-800 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer shadow col-span-2 sm:col-span-1"
                      title="Descargar PNG Ultra HD (3000x3000px a 300 DPI)"
                    >
                      <Download className="w-4 h-4 text-purple-400" /> PNG 4K
                    </button>
                  </div>

                  {/* Fila 2: Difusión & Redes */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold font-mono text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                    >
                      <MessageCircle className="w-4 h-4" /> WhatsApp
                    </button>
                    <button
                      type="button"
                      onClick={handleShareNative}
                      className="py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-mono text-xs uppercase tracking-wider rounded-xl border border-slate-700 flex items-center justify-center gap-1.5 transition cursor-pointer shadow"
                    >
                      <Share2 className="w-4 h-4 text-amber-400" /> {copiedQrUrl ? '¡Copiado!' : 'Compartir'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowQrExportModal(true)}
                  className="w-full py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-bold font-mono text-xs uppercase tracking-widest rounded-2xl border border-amber-500/40 flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-400" /> Opciones de Cartelería & Exportación HD
                </button>

                <a
                  href={qrConcertUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold font-mono text-xs uppercase tracking-widest rounded-2xl border border-slate-700 flex items-center justify-center gap-2 transition shadow-md"
                >
                  <ExternalLink className="w-4 h-4 text-amber-400" /> Probar Landing de Captura en Vivo
                </a>
              </div>
            </div>
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



      {activeTab === 'metrics' && (
        <div className="space-y-6">
          <ReelsMetricsView
            colors={colors || {
              bg: 'bg-slate-900',
              card: 'bg-slate-900 border border-slate-800 rounded-2xl',
              text: 'text-white',
              accent: 'text-amber-400',
              border: 'border-slate-800'
            }}
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
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-lg font-black text-white font-display uppercase tracking-widest flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" />
                Registrar Fan / Seguidor Manual
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleManualAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo o alias"
                    value={newNombre}
                    onChange={e => setNewNombre(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="email@ejemplo.com"
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">Ciudad</label>
                  <input
                    type="text"
                    placeholder="Ej: Madrid, Sevilla..."
                    value={newCiudad}
                    onChange={e => setNewCiudad(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">Origen / Canal</label>
                  <select
                    value={newOrigen}
                    onChange={e => setNewOrigen(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
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
                  <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">Nivel Fan</label>
                  <select
                    value={newNivel}
                    onChange={e => setNewNivel(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                  >
                    <option value="fiel">🎵 Oyente Fiel</option>
                    <option value="superfan">🔥 Superfan Directos</option>
                    <option value="fundador">🌟 Fan Fundador</option>
                    <option value="backstage">🎸 Backstage VIP</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">Instagram (Opcional)</label>
                  <input
                    type="text"
                    placeholder="@usuario"
                    value={newInstagram}
                    onChange={e => setNewInstagram(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">Canción Favorita (Opcional)</label>
                <input
                  type="text"
                  placeholder="Ej: La Noche Entera, Balada..."
                  value={newCancionFavorita}
                  onChange={e => setNewCancionFavorita(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-amber-500 uppercase font-mono tracking-widest mb-1.5 block">Mensaje / Dedicatoria para el Muro (Opcional)</label>
                <textarea
                  rows={2}
                  placeholder="Dedicatoria o saludo que aparecerá en el muro de la comunidad..."
                  value={newMensaje}
                  onChange={e => setNewMensaje(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl p-3 text-xs text-white outline-none font-sans resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 bg-slate-800 text-slate-300 font-mono text-xs font-bold uppercase tracking-widest rounded-xl transition hover:bg-slate-700 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 text-slate-950 font-mono text-xs font-black uppercase tracking-widest rounded-xl shadow-lg transition hover:bg-amber-400 cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Guardar Fan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default FansPanel;
