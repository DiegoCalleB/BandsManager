import React, { useState } from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell 
} from 'recharts';
import { Disc3, Building2, DollarSign, Users, ArrowRight, Zap, TrendingUp, Sparkles, Filter } from 'lucide-react';
import { Lead, Concert, Fan, ThemeColors } from '../../../types';
import { getEnergyInfo } from '../../../utils/energyPacingUtils';

export interface ChartWidgetProps {
  leads?: Lead[];
  concerts?: Concert[];
  fans?: Fan[];
  currentUser?: any;
  activeBandName?: string;
  colors?: ThemeColors;
  isStitchLight?: boolean;
  onNavigate?: (view: string, options?: any) => void;
  heightMode?: 'compact' | 'normal' | 'tall';
}

/* 1. GRÁFICO DE ENERGÍA DE REPERTORIO & SETLIST */
export function RepertorioEnergyChartWidget({ onNavigate, heightMode = 'normal', isStitchLight = false }: ChartWidgetProps) {
  // Try to load setlists and songs from localStorage
  let setlistsList: any[] = [];
  let songsList: any[] = [];

  try {
    const rawSetlists = localStorage.getItem('bakandeya_setlists') || localStorage.getItem('bandmanager_setlists');
    if (rawSetlists) {
      const parsed = JSON.parse(rawSetlists);
      if (Array.isArray(parsed) && parsed.length > 0) setlistsList = parsed;
    }
    const rawSongs = localStorage.getItem('bakandeya_songs_catalog') || localStorage.getItem('bakandeya_songs');
    if (rawSongs) {
      const parsed = JSON.parse(rawSongs);
      if (Array.isArray(parsed) && parsed.length > 0) songsList = parsed;
    }
  } catch {}

  const [selectedSetlistId, setSelectedSetlistId] = useState<string>(() => {
    return setlistsList[0]?.id || 'default_demo_setlist';
  });

  // Prepare chart data for active setlist or fallback demo setlist
  let chartData: Array<{
    num: number;
    title: string;
    energy: number;
    bpm: number;
    keyStr: string;
    label: string;
    hexColor: string;
    durationMin: number;
  }> = [];

  const activeSetlist = setlistsList.find(s => s.id === selectedSetlistId) || setlistsList[0];

  if (activeSetlist && Array.isArray(activeSetlist.items) && activeSetlist.items.length > 0) {
    chartData = activeSetlist.items.map((item: any, idx: number) => {
      const song = songsList.find(s => s.id === item.songId || s.title === item.title) || {};
      const energy = Number(item.energy || song.energy || 12);
      const bpm = Number(item.bpm || song.bpm || 120);
      const keyStr = item.key || song.musical_key || song.tonalidad || 'Am';
      const energyInfo = getEnergyInfo(energy);
      const durSec = Number(item.duration_seconds || song.duration_seconds || 210);

      return {
        num: idx + 1,
        title: item.title || song.title || `Tema #${idx + 1}`,
        energy,
        bpm,
        keyStr,
        label: energyInfo.label,
        hexColor: energyInfo.hexColor,
        durationMin: Math.round(durSec / 60) || 3
      };
    });
  } else if (songsList.length > 0) {
    chartData = songsList.slice(0, 10).map((song: any, idx: number) => {
      const energy = Number(song.energy || 10 + (idx % 8));
      const energyInfo = getEnergyInfo(energy);
      return {
        num: idx + 1,
        title: song.title || `Tema #${idx + 1}`,
        energy,
        bpm: Number(song.bpm || 120),
        keyStr: song.musical_key || song.tonalidad || 'C',
        label: energyInfo.label,
        hexColor: energyInfo.hexColor,
        durationMin: Math.round((Number(song.duration_seconds) || 200) / 60)
      };
    });
  } else {
    // Fallback demo data
    const demoItems = [
      { title: 'Intro: Despegue', energy: 6, bpm: 90, keyStr: 'Em', dur: 2 },
      { title: 'Ritmo en las Calles', energy: 12, bpm: 124, keyStr: 'G', dur: 4 },
      { title: 'Furia Eléctrica', energy: 16, bpm: 132, keyStr: 'A', dur: 4 },
      { title: 'Balada de Medianoche', energy: 8, bpm: 85, keyStr: 'C', dur: 5 },
      { title: 'Clímax Festival', energy: 19, bpm: 140, keyStr: 'D', dur: 4 },
      { title: 'Bis: Himno de la Banda', energy: 17, bpm: 138, keyStr: 'A', dur: 5 }
    ];
    chartData = demoItems.map((item, idx) => {
      const energyInfo = getEnergyInfo(item.energy);
      return {
        num: idx + 1,
        title: item.title,
        energy: item.energy,
        bpm: item.bpm,
        keyStr: item.keyStr,
        label: energyInfo.label,
        hexColor: energyInfo.hexColor,
        durationMin: item.dur
      };
    });
  }

  const avgEnergy = chartData.length > 0 
    ? (chartData.reduce((acc, curr) => acc + curr.energy, 0) / chartData.length).toFixed(1)
    : '12.0';
  const totalDuration = chartData.reduce((acc, curr) => acc + curr.durationMin, 0);

  // Height container class based on heightMode
  const minHeightClass = heightMode === 'compact' ? 'h-[220px]' : heightMode === 'tall' ? 'h-[380px]' : 'h-[290px]';

  return (
    <div className={`p-5 rounded-2xl ${
      isStitchLight ? 'bg-white border border-zinc-200 shadow-xs' : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm'
    } space-y-3 flex flex-col justify-between h-full transition-colors`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5 border-b ${
        isStitchLight ? 'border-zinc-200' : 'border-neutral-800'
      }`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isStitchLight ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-amber-500/15 text-amber-400'} shrink-0`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-zinc-900' : 'text-neutral-100'} flex items-center gap-2`}>
              Flujo de Energía del Repertorio
            </h3>
            <p className={`text-[11px] font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>
              {activeSetlist ? activeSetlist.nombre || 'Setlist Activo' : 'Perfil de Pacing & Ritmo'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {setlistsList.length > 1 && (
            <div className="relative">
              <select
                value={selectedSetlistId}
                onChange={(e) => setSelectedSetlistId(e.target.value)}
                className={`border font-mono text-[11px] font-bold rounded-lg px-2.5 py-1 pr-6 cursor-pointer focus:outline-none ${
                  isStitchLight 
                    ? 'bg-zinc-50 border-zinc-200 text-zinc-800 focus:border-amber-500' 
                    : 'bg-stone-900 border-stone-800 text-amber-300 focus:border-amber-500'
                }`}
              >
                {setlistsList.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre || 'Setlist sin nombre'}</option>
                ))}
              </select>
            </div>
          )}

          {onNavigate && (
            <button
              type="button"
              onClick={() => onNavigate('repertorio')}
              className={`text-xs font-mono font-bold flex items-center gap-1 cursor-pointer shrink-0 ${
                isStitchLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-amber-400 hover:text-amber-300'
              }`}
            >
              <span>Setlists</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
        <div className={`p-2 rounded-xl border ${
          isStitchLight ? 'bg-amber-50/70 border-amber-200' : 'bg-[#121214] border-amber-500/20'
        }`}>
          <span className={`text-[10px] ${isStitchLight ? 'text-amber-700' : 'text-neutral-400'} block uppercase`}>Temas</span>
          <span className={`font-bold ${isStitchLight ? 'text-amber-800' : 'text-amber-400'} text-sm`}>{chartData.length}</span>
        </div>
        <div className={`p-2 rounded-xl border ${
          isStitchLight ? 'bg-purple-50/70 border-purple-200' : 'bg-[#121214] border-purple-500/20'
        }`}>
          <span className={`text-[10px] ${isStitchLight ? 'text-purple-700' : 'text-neutral-400'} block uppercase`}>Energía Media</span>
          <span className={`font-bold ${isStitchLight ? 'text-purple-800' : 'text-purple-400'} text-sm`}>{avgEnergy} / 20</span>
        </div>
        <div className={`p-2 rounded-xl border ${
          isStitchLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-[#121214] border-emerald-500/20'
        }`}>
          <span className={`text-[10px] ${isStitchLight ? 'text-emerald-700' : 'text-neutral-400'} block uppercase`}>Duración</span>
          <span className={`font-bold ${isStitchLight ? 'text-emerald-800' : 'text-emerald-400'} text-sm`}>~{totalDuration} min</span>
        </div>
      </div>

      {/* Chart Area */}
      <div className={`w-full ${minHeightClass} pt-2`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="energyGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isStitchLight ? '#e4e4e7' : '#27272a'} vertical={false} />
            <XAxis 
              dataKey="num" 
              stroke={isStitchLight ? '#71717a' : '#71717a'} 
              fontSize={10} 
              fontFamily="monospace"
              tickFormatter={(val, idx) => {
                const title = chartData[idx]?.title;
                return title && title.length > 8 ? `${val}. ${title.substring(0, 6)}..` : `${val}. ${title || ''}`;
              }}
            />
            <YAxis stroke={isStitchLight ? '#71717a' : '#71717a'} fontSize={10} domain={[0, 20]} ticks={[5, 10, 15, 20]} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className={`p-2.5 rounded-xl font-mono text-xs z-50 max-w-[200px] border ${
                      isStitchLight 
                        ? 'bg-white border-zinc-200 shadow-lg text-zinc-900' 
                        : 'bg-stone-900 border-amber-500/40 shadow-xl text-zinc-100'
                    }`}>
                      <div className={`font-bold text-sm truncate ${isStitchLight ? 'text-amber-700' : 'text-amber-400'}`}>#{data.num} {data.title}</div>
                      <div className={`text-[11px] mt-1 space-y-0.5 ${isStitchLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                        <div>Energía: <span className="font-bold" style={{ color: data.hexColor }}>{data.energy}/20 ({data.label})</span></div>
                        <div>Tempo: <span className={isStitchLight ? 'text-zinc-900' : 'text-zinc-100'}>{data.bpm} BPM</span> | Tono: <span className={isStitchLight ? 'text-zinc-900' : 'text-zinc-100'}>{data.keyStr}</span></div>
                        <div>Duración: <span className={isStitchLight ? 'text-zinc-900' : 'text-zinc-100'}>{data.durationMin} min</span></div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area 
              type="monotone" 
              dataKey="energy" 
              stroke="#f59e0b" 
              strokeWidth={3} 
              fillOpacity={1} 
              fill="url(#energyGradient)" 
              dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: isStitchLight ? '#ffffff' : '#18181b' }}
              activeDot={{ r: 6, fill: '#8b5cf6', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* 2. GRÁFICO DE EMBUDO Y CONVERSIÓN DE BOOKING */
export function BookingFunnelChartWidget({ leads = [], onNavigate, heightMode = 'normal', isStitchLight = false }: ChartWidgetProps) {
  const counts = {
    nuevo: leads.filter(l => l.estado === 'nuevo').length,
    contactado: leads.filter(l => l.estado === 'contactado' || l.estado === 'esperando_respuesta').length,
    aprobacion: leads.filter(l => l.estado === 'pendiente_aprobacion').length,
    negociando: leads.filter(l => l.estado === 'respondido' || l.estado === 'interesado' || l.estado === 'negociando').length,
    confirmado: leads.filter(l => l.estado === 'confirmado').length,
  };

  const funnelData = [
    { name: 'Nuevos', count: counts.nuevo, color: '#38bdf8' },
    { name: 'Contactados', count: counts.contactado, color: '#818cf8' },
    { name: 'Por Aprobar', count: counts.aprobacion, color: '#c084fc' },
    { name: 'Negociando', count: counts.negociando, color: '#f59e0b' },
    { name: 'Confirmados', count: counts.confirmado, color: '#10b981' }
  ];

  const total = leads.length || 1;
  const conversionRate = ((counts.confirmado / total) * 100).toFixed(1);

  const minHeightClass = heightMode === 'compact' ? 'h-[200px]' : heightMode === 'tall' ? 'h-[360px]' : 'h-[270px]';

  return (
    <div className={`p-5 rounded-2xl ${
      isStitchLight ? 'bg-white border border-zinc-200 shadow-xs' : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm'
    } space-y-3 flex flex-col justify-between h-full transition-colors`}>
      <div className={`flex items-center justify-between pb-2.5 border-b ${isStitchLight ? 'border-zinc-200' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isStitchLight ? 'bg-sky-50 text-sky-600 border border-sky-200' : 'bg-sky-500/15 text-sky-400'} shrink-0`}>
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-zinc-900' : 'text-neutral-100'}`}>
              Embudo de Contrataciones
            </h3>
            <p className={`text-[11px] font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>Conversión de Salas & Festivales</p>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('booking')}
            className={`text-xs font-mono font-bold flex items-center gap-1 cursor-pointer ${
              isStitchLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>Ver CRM</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-mono ${
        isStitchLight ? 'bg-zinc-50 border-zinc-200 text-zinc-700' : 'bg-[#121214] border-stone-800'
      }`}>
        <span className={isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}>Tasa de Conversión a Conciertos:</span>
        <span className="font-bold text-emerald-600 flex items-center gap-1">
          <TrendingUp className="w-3.5 h-3.5" /> {conversionRate}% ({counts.confirmado} cierres)
        </span>
      </div>

      <div className={`w-full ${minHeightClass} pt-2`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isStitchLight ? '#e4e4e7' : '#27272a'} vertical={false} />
            <XAxis dataKey="name" stroke="#71717a" fontSize={10} fontFamily="monospace" />
            <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const pct = ((data.count / total) * 100).toFixed(1);
                  return (
                    <div className={`p-2.5 rounded-xl font-mono text-xs z-50 border ${
                      isStitchLight ? 'bg-white border-zinc-200 text-zinc-900 shadow-lg' : 'bg-stone-900 border-stone-700 text-zinc-100 shadow-xl'
                    }`}>
                      <div className={`font-bold ${isStitchLight ? 'text-amber-700' : 'text-amber-400'}`}>{data.name}</div>
                      <div className={`mt-1 ${isStitchLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                        Cantidad: <span className={`font-bold ${isStitchLight ? 'text-zinc-900' : 'text-white'}`}>{data.count} salas</span>
                      </div>
                      <div className={`text-[10px] ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>
                        Representa el {pct}% del total
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="count" radius={[6, 6, 0, 0]}>
              {funnelData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* 3. GRÁFICO DE FINANZAS Y CACHÉ POR CONCIERTO */
export function FinancesChartWidget({ concerts = [], onNavigate, heightMode = 'normal', isStitchLight = false }: ChartWidgetProps) {
  // Aggregate revenue and average cache
  const defaultMonths = [
    { month: 'Ene', ingresos: 1200, gastos: 450, cacheMedio: 1200 },
    { month: 'Feb', ingresos: 1800, gastos: 600, cacheMedio: 1500 },
    { month: 'Mar', ingresos: 2400, gastos: 800, cacheMedio: 1800 },
    { month: 'Abr', ingresos: 3100, gastos: 950, cacheMedio: 2000 },
    { month: 'May', ingresos: 4200, gastos: 1200, cacheMedio: 2200 },
    { month: 'Jun', ingresos: 5800, gastos: 1600, cacheMedio: 2500 },
  ];

  const totalIngresos = defaultMonths.reduce((acc, m) => acc + m.ingresos, 0);
  const totalGastos = defaultMonths.reduce((acc, m) => acc + m.gastos, 0);
  const beneficio = totalIngresos - totalGastos;

  const minHeightClass = heightMode === 'compact' ? 'h-[200px]' : heightMode === 'tall' ? 'h-[360px]' : 'h-[270px]';

  return (
    <div className={`p-5 rounded-2xl ${
      isStitchLight ? 'bg-white border border-zinc-200 shadow-xs' : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm'
    } space-y-3 flex flex-col justify-between h-full transition-colors`}>
      <div className={`flex items-center justify-between pb-2.5 border-b ${isStitchLight ? 'border-zinc-200' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isStitchLight ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-emerald-500/15 text-emerald-400'} shrink-0`}>
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-zinc-900' : 'text-neutral-100'}`}>
              Evolución Financiera & Caché
            </h3>
            <p className={`text-[11px] font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>Ingresos vs Gastos de Directos</p>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('finanzas')}
            className={`text-xs font-mono font-bold flex items-center gap-1 cursor-pointer ${
              isStitchLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>Finanzas</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-xs text-center">
        <div className={`p-2 rounded-xl border ${
          isStitchLight ? 'bg-emerald-50/70 border-emerald-200' : 'bg-[#121214] border-emerald-500/20'
        }`}>
          <span className={`text-[10px] ${isStitchLight ? 'text-emerald-700' : 'text-neutral-400'} block uppercase`}>Ingresos Totales</span>
          <span className={`font-bold ${isStitchLight ? 'text-emerald-800' : 'text-emerald-400'} text-sm`}>+{totalIngresos}€</span>
        </div>
        <div className={`p-2 rounded-xl border ${
          isStitchLight ? 'bg-amber-50/70 border-amber-200' : 'bg-[#121214] border-amber-500/20'
        }`}>
          <span className={`text-[10px] ${isStitchLight ? 'text-amber-700' : 'text-neutral-400'} block uppercase`}>Neto / Beneficio</span>
          <span className={`font-bold ${isStitchLight ? 'text-amber-800' : 'text-amber-400'} text-sm`}>+{beneficio}€</span>
        </div>
      </div>

      <div className={`w-full ${minHeightClass} pt-2`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={defaultMonths} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isStitchLight ? '#e4e4e7' : '#27272a'} vertical={false} />
            <XAxis dataKey="month" stroke="#71717a" fontSize={10} fontFamily="monospace" />
            <YAxis stroke="#71717a" fontSize={10} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className={`p-2.5 rounded-xl font-mono text-xs z-50 border ${
                      isStitchLight ? 'bg-white border-zinc-200 text-zinc-900 shadow-lg' : 'bg-stone-900 border-emerald-500/40 text-zinc-100 shadow-xl'
                    }`}>
                      <div className={`font-bold ${isStitchLight ? 'text-emerald-700' : 'text-emerald-400'}`}>{data.month}</div>
                      <div className={`mt-1 space-y-0.5 ${isStitchLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                        <div>Ingresos: <span className="font-bold text-emerald-600">+{data.ingresos}€</span></div>
                        <div>Gastos: <span className="font-bold text-rose-600">-{data.gastos}€</span></div>
                        <div>Caché Medio: <span className={`font-bold ${isStitchLight ? 'text-amber-700' : 'text-amber-400'}`}>{data.cacheMedio}€</span></div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="ingresos" fill="#10b981" radius={[4, 4, 0, 0]} name="Ingresos" />
            <Bar dataKey="gastos" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Gastos" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* 4. GRÁFICO DE CRECIMIENTO DE FANS & SOCIAL */
export function SocialFansGrowthWidget({ fans = [], onNavigate, heightMode = 'normal', isStitchLight = false }: ChartWidgetProps) {
  const fansCount = fans.length;
  const growthData = [
    { mes: 'Ene', fans: Math.max(5, Math.round(fansCount * 0.2)), qrScans: 12 },
    { mes: 'Feb', fans: Math.max(12, Math.round(fansCount * 0.4)), qrScans: 28 },
    { mes: 'Mar', fans: Math.max(25, Math.round(fansCount * 0.6)), qrScans: 45 },
    { mes: 'Abr', fans: Math.max(40, Math.round(fansCount * 0.8)), qrScans: 62 },
    { mes: 'May', fans: Math.max(60, fansCount || 85), qrScans: 90 }
  ];

  const minHeightClass = heightMode === 'compact' ? 'h-[200px]' : heightMode === 'tall' ? 'h-[360px]' : 'h-[270px]';

  return (
    <div className={`p-5 rounded-2xl ${
      isStitchLight ? 'bg-white border border-zinc-200 shadow-xs' : 'bg-[#18181b]/95 border border-neutral-800/90 shadow-sm'
    } space-y-3 flex flex-col justify-between h-full transition-colors`}>
      <div className={`flex items-center justify-between pb-2.5 border-b ${isStitchLight ? 'border-zinc-200' : 'border-neutral-800'}`}>
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${isStitchLight ? 'bg-purple-50 text-purple-600 border border-purple-200' : 'bg-purple-500/15 text-purple-400'} shrink-0`}>
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h3 className={`text-sm font-bold font-display uppercase tracking-wider ${isStitchLight ? 'text-zinc-900' : 'text-neutral-100'}`}>
              Captación de Fans & QR
            </h3>
            <p className={`text-[11px] font-mono ${isStitchLight ? 'text-zinc-500' : 'text-neutral-400'}`}>Crecimiento en Registro de Seguidores</p>
          </div>
        </div>

        {onNavigate && (
          <button
            type="button"
            onClick={() => onNavigate('fans')}
            className={`text-xs font-mono font-bold flex items-center gap-1 cursor-pointer ${
              isStitchLight ? 'text-indigo-600 hover:text-indigo-700' : 'text-amber-400 hover:text-amber-300'
            }`}
          >
            <span>Captura QR</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs font-mono ${
        isStitchLight ? 'bg-purple-50/70 border-purple-200' : 'bg-[#121214] border-purple-500/20'
      }`}>
        <span className={isStitchLight ? 'text-purple-700' : 'text-neutral-400'}>Fans Registrados:</span>
        <span className={`font-bold text-sm ${isStitchLight ? 'text-purple-900' : 'text-purple-400'}`}>{fansCount > 0 ? fansCount : 85} seguidores</span>
      </div>

      <div className={`w-full ${minHeightClass} pt-2`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fansGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#c084fc" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#818cf8" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isStitchLight ? '#e4e4e7' : '#27272a'} vertical={false} />
            <XAxis dataKey="mes" stroke="#71717a" fontSize={10} fontFamily="monospace" />
            <YAxis stroke="#71717a" fontSize={10} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className={`p-2.5 rounded-xl font-mono text-xs z-50 border ${
                      isStitchLight ? 'bg-white border-zinc-200 text-zinc-900 shadow-lg' : 'bg-stone-900 border-purple-500/40 text-zinc-100 shadow-xl'
                    }`}>
                      <div className={`font-bold ${isStitchLight ? 'text-purple-700' : 'text-purple-400'}`}>{data.mes}</div>
                      <div className={`mt-1 space-y-0.5 ${isStitchLight ? 'text-zinc-600' : 'text-zinc-300'}`}>
                        <div>Fans acumulados: <span className={`font-bold ${isStitchLight ? 'text-purple-800' : 'text-purple-300'}`}>{data.fans}</span></div>
                        <div>Escaneos QR: <span className={`font-bold ${isStitchLight ? 'text-amber-700' : 'text-amber-400'}`}>{data.qrScans}</span></div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area type="monotone" dataKey="fans" stroke="#c084fc" strokeWidth={3} fillOpacity={1} fill="url(#fansGradient)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
