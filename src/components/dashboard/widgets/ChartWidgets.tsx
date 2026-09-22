import React, { useState, useEffect } from 'react';
import {
 ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid
} from 'recharts';
import { Building2, DollarSign, Users, ArrowRight, Zap, TrendingUp } from 'lucide-react';
import { Lead, Concert, Fan, ThemeColors, Setlist, Song } from '../../../types';
import { getEnergyInfo } from '../../../utils/energyPacingUtils';
import { Onda } from '../../ui/Onda';
import { api } from '../../../services/api';

export interface ChartWidgetProps {
 leads?: Lead[];
 concerts?: Concert[];
 fans?: Fan[];
 setlists?: Setlist[];
 songs?: Song[];
 currentUser?: Record<string, unknown>;
 activeBandName?: string;
 colors?: ThemeColors;
 onNavigate?: (view: string, options?: Record<string, unknown>) => void;
 heightMode?:'compact' |'normal' |'tall';
}

/* 1. GRÁFICO DE ENERGÍA DE REPERTORIO & SETLIST */
export function RepertorioEnergyChartWidget({
 onNavigate,
 heightMode ='normal',
 setlists: providedSetlists,
 songs: providedSongs
}: ChartWidgetProps) {
 const [setlistsList, setSetlistsList] = useState<Setlist[]>(providedSetlists || []);
 const [songsList, setSongsList] = useState<Song[]>(providedSongs || []);
 const [selectedRepertorioId, setSelectedRepertorioId] = useState<string>('all');

 // Dashboard.tsx ya carga setlists/songs una sola vez y se los pasa a TODOS sus widgets — este
 // efecto solo debe reflejar esas props (aunque de entrada lleguen vacías, mientras el padre
 // sigue cargando) y sincronizarse cuando cambien. Antes, comprobar `.length` en vez de
 // `undefined` hacía que el widget disparara su PROPIO fetch en paralelo con el del padre en
 // cuanto llegaba un array vacío (justo lo que pasa en el primer render, antes de que el padre
 // termine de cargar) — dos peticiones idénticas a la vez, cada vez que se abre el dashboard.
 // El fetch propio queda solo para cuando NADIE pasa estas props (undefined de verdad, p.ej.
 // este widget usado aislado, sin Dashboard.tsx de por medio).
 useEffect(() => {
 if (providedSetlists !== undefined || providedSongs !== undefined) {
 setSetlistsList(providedSetlists || []);
 setSongsList(providedSongs || []);
 return;
 }

 const loadData = async () => {
 try {
 const [setlistsRes, songsRes] = await Promise.all([
 api.getSetlists(),
 api.getSongs()
 ]);
 setSetlistsList(setlistsRes?.setlists || []);
 setSongsList(songsRes?.songs || []);
 } catch (err) {
 console.error('[Dashboard] Error fetching setlists/songs:', err);
 }
 };

 loadData();
 }, [providedSetlists, providedSongs]);


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

 // Use selected repertorio/setlist or active setlist
 const activeSetlist = selectedRepertorioId === 'all'
 ? setlistsList[0]
 : setlistsList.find(s => s.id === selectedRepertorioId);

 if (activeSetlist?.items && Array.isArray(activeSetlist.items) && activeSetlist.items.length > 0) {
 chartData = activeSetlist.items.map((item, idx: number) => {
 const itemAny = item as unknown as Record<string, unknown>;
 const matchedSong = songsList.find(s => s.id === itemAny.song_id || s.titulo === itemAny.title || s.id === itemAny.songId) || (itemAny.song as Song | undefined);
 const energyVal = (itemAny.energia as number) || matchedSong?.energia || 12;
 const energyInfo = getEnergyInfo(energyVal);
 return {
 num: idx + 1,
 title: (itemAny.title as string) || matchedSong?.titulo || `Tema ${idx + 1}`,
 energy: energyVal,
 bpm: (itemAny.bpm as number) || matchedSong?.bpm || 120,
 keyStr: (itemAny.tonalidad as string) || matchedSong?.tonalidad ||'Am',
 label: energyInfo.label,
 hexColor: energyInfo.hexColor,
 durationMin: (itemAny.duracion_segundos as number) ? Math.round((itemAny.duracion_segundos as number) / 60) : 4
 };
 });
 } else if (songsList.length > 0) {
 chartData = songsList.slice(0, 20).map((song, idx: number) => {
 const songAny = song as unknown as Record<string, unknown>;
 const energyVal = (songAny.energia as number) || ((songAny.bpm as number) >= 140 ? 18 : (songAny.bpm as number) <= 95 ? 6 : 12);
 const energyInfo = getEnergyInfo(energyVal);
 return {
 num: idx + 1,
 title: (songAny.titulo as string) || `Canción ${idx + 1}`,
 energy: energyVal,
 bpm: (songAny.bpm as number) || 120,
 keyStr: (songAny.tonalidad as string) ||'C',
 label: energyInfo.label,
 hexColor: energyInfo.hexColor,
 durationMin: 4
 };
 });
 } else {
 // Standard default setlist for immediate demo
 const demoItems = [
 { title:'Intro / Apertura', energy: 16, bpm: 135, keyStr:'Em', dur: 3 },
 { title:'Fuego en la Noche', energy: 18, bpm: 142, keyStr:'Am', dur: 4 },
 { title:'Camino Sagrado', energy: 14, bpm: 118, keyStr:'Dm', dur: 4 },
 { title:'Mar de Dudas', energy: 8, bpm: 90, keyStr:'G', dur: 5 },
 { title:'Viento del Sur (Acústico)', energy: 6, bpm: 85, keyStr:'C', dur: 4 },
 { title:'Resurrección (In Crescendo)', energy: 15, bpm: 128, keyStr:'Em', dur: 5 },
 { title:'Gritando al Viento', energy: 19, bpm: 150, keyStr:'Bm', dur: 4 },
 { title:'Clímax Final', energy: 20, bpm: 155, keyStr:'E', dur: 6 },
 { title:'Bis: Himno de la Banda', energy: 17, bpm: 138, keyStr:'A', dur: 5 }
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
 :'12.0';
 const totalDuration = chartData.reduce((acc, curr) => acc + curr.durationMin, 0);

 // Height container class based on heightMode
 const minHeightClass = heightMode ==='compact' ?'h-[220px]' : heightMode ==='tall' ?'h-[380px]' :'h-[290px]';

 return (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-3 flex flex-col justify-between h-full">
 {/* Repertorio/Setlist Selector - Above the chart */}
 <div className="flex flex-col gap-2 pb-3 border-b border-[var(--hair)]">
 <label className="text-[10px] font-semibold text-[var(--ink-2)] uppercase tracking-wide">
 Repertorio
 </label>
 <div className="relative">
 <select
 value={selectedRepertorioId}
 onChange={(e) => setSelectedRepertorioId(e.target.value)}
 className="w-full bg-[var(--sunken)] text-[var(--ink)] text-xs font-medium rounded-[var(--r-s)] px-3 py-2 pr-8 cursor-pointer outline-none focus:ring-2 focus:ring-[var(--acc)]"
 >
 <option value="all">Todos los setlists</option>
 {setlistsList.length > 0 ? (
 setlistsList.map(s => (
 <option key={s.id} value={s.id}>{s.nombre || 'Setlist sin nombre'}</option>
 ))
 ) : (
 <option disabled>Sin setlists disponibles</option>
 )}
 </select>
 </div>
 </div>

 {/* Header */}
 <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2.5">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)] shrink-0">
 <Zap className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-sm font-semibold text-[var(--ink)] flex items-center gap-2">
 Energía del repertorio
 </h3>
 <p className="text-[11px] text-[var(--ink-2)]">
 {activeSetlist ? activeSetlist.nombre ||'Setlist activo' :'Perfil de ritmo del bolo'}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">

 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('repertorio')}
 className="text-xs text-[var(--acc-ink)] hover:opacity-80 font-semibold flex items-center gap-1 cursor-pointer shrink-0"
 >
 <span>Setlists</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>
 </div>

 {/* Stats Summary Bar */}
 <div className="grid grid-cols-3 gap-2 text-center text-xs">
 <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
 <span className="text-[10px] text-[var(--ink-2)] block">Temas</span>
 <span className="font-semibold text-[var(--acc-ink)] text-sm tabular-nums">{chartData.length}</span>
 </div>
 <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
 <span className="text-[10px] text-[var(--ink-2)] block">Energía media</span>
 <span className="font-semibold text-[var(--ink)] text-sm tabular-nums">{avgEnergy} / 20</span>
 </div>
 <div className="p-2.5 rounded-[var(--r-m)] bg-[var(--sunken)]">
 <span className="text-[10px] text-[var(--ink-2)] block">Duración</span>
 <span className="font-semibold text-[var(--ok)] text-sm tabular-nums">~{totalDuration} min</span>
 </div>
 </div>

 {/* Chart Area — misma curva de energía que el Mapa de Energía de Repertorio
 (versión de solo lectura, sin drag/zonas/eventos de habla: aquí es solo
 una vista previa), no el Onda de barras — para que el Dashboard reconozca
 de un vistazo la misma forma que ya conoce de Repertorio. */}
 <div className={`w-full ${minHeightClass} pt-2`}>
 <ResponsiveContainer width="100%" height="100%">
 <AreaChart data={chartData} margin={{ top: 14, right: 10, left: 10, bottom: 0 }}>
 <defs>
 <linearGradient id="dashEnergyStroke" x1="0" y1="0" x2="1" y2="0">
 {chartData.map((d, i) => (
 <stop key={d.num} offset={`${chartData.length > 1 ? (i / (chartData.length - 1)) * 100 : 0}%`} stopColor={d.hexColor} />
 ))}
 </linearGradient>
 <linearGradient id="dashEnergyFill" x1="0" y1="0" x2="1" y2="0">
 {chartData.map((d, i) => (
 <stop key={d.num} offset={`${chartData.length > 1 ? (i / (chartData.length - 1)) * 100 : 0}%`} stopColor={d.hexColor} stopOpacity={0.22} />
 ))}
 </linearGradient>
 </defs>
 <YAxis domain={[0, 20]} hide />
 <XAxis dataKey="num" hide />
 <Tooltip
 contentStyle={{ background:'var(--surface)', borderRadius: 'var(--r-m)', fontSize: 11 }}
 labelFormatter={(num) => chartData.find(d => d.num === num)?.title || `Tema ${num}`}
 formatter={(val: number, _name, item) => {
  const payload = (item?.payload as Record<string, number>) || {};
  return [`${val}/20 · ${payload.bpm ?? ''} BPM`, 'Energía'];
 }}
 />
 <Area
 type="monotone"
 dataKey="energy"
 stroke="url(#dashEnergyStroke)"
 strokeWidth={2.5}
 fill="url(#dashEnergyFill)"
 fillOpacity={1}
 isAnimationActive={true}
 dot={(dotProps: { cx?: number; cy?: number; payload?: Record<string, unknown> }) => {
 const { cx, cy, payload } = dotProps;
 if (cx == null || cy == null) return <React.Fragment key={`d-${(payload as Record<string, unknown>)?.num}`} />;
 const hexColor = (payload as Record<string, unknown>)?.hexColor || 'var(--acc)';
 return <circle key={`d-${(payload as Record<string, unknown>)?.num}`} cx={cx} cy={cy} r={4} strokeWidth={1.5} stroke="var(--surface)" fill={String(hexColor)} />;
 }}
 activeDot={{ r: 6, strokeWidth: 2, stroke: 'var(--surface)' }}
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 );
}

/* 2. GRÁFICO DE EMBUDO Y CONVERSIÓN DE BOOKING */
export function BookingFunnelChartWidget({ leads = [], onNavigate, heightMode ='normal' }: ChartWidgetProps) {
 const counts = {
 nuevo: leads.filter(l => l.estado ==='nuevo').length,
 contactado: leads.filter(l => l.estado ==='contactado' || l.estado ==='esperando_respuesta').length,
 aprobacion: leads.filter(l => l.estado ==='pendiente_aprobacion').length,
 negociando: leads.filter(l => l.estado ==='respondido' || l.estado ==='interesado' || l.estado ==='negociando').length,
 confirmado: leads.filter(l => l.estado ==='confirmado').length,
 };

 const funnelData = [
 { name:'Nuevos', count: counts.nuevo, color:'var(--hair)' },
 { name:'Contactados', count: counts.contactado, color:'var(--ink-3)' },
 { name:'Por Aprobar', count: counts.aprobacion, color:'var(--ink-2)' },
 { name:'Negociando', count: counts.negociando, color:'var(--acc)' },
 { name:'Confirmados', count: counts.confirmado, color:'var(--ok)' }
 ];

 const total = leads.length || 1;
 const conversionRate = ((counts.confirmado / total) * 100).toFixed(1);

 const minHeightClass = heightMode ==='compact' ?'h-[200px]' : heightMode ==='tall' ?'h-[360px]' :'h-[270px]';

 return (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-3 flex flex-col justify-between h-full">
 <div className="flex items-center justify-between pb-2.5">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--ink-2)] shrink-0">
 <Building2 className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-sm font-bold font-display text-[var(--ink)]">
 Embudo de Contrataciones
 </h3>
 <p className="text-[11px] font-sans text-[var(--ink-2)]">Conversión de Salas & Festivales</p>
 </div>
 </div>

 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('booking')}
 className="text-xs font-sans text-[var(--acc)] hover:text-[var(--acc)]/70 font-bold flex items-center gap-1 cursor-pointer"
 >
 <span>Ver CRM</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="flex items-center justify-between px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-xs font-sans">
 <span className="text-[var(--ink-2)]">Tasa de Conversión a Conciertos:</span>
 <span className="font-bold text-[var(--ok)] flex items-center gap-1">
 <TrendingUp className="w-3.5 h-3.5" /> {conversionRate}% ({counts.confirmado} cierres)
 </span>
 </div>

 <div className={`w-full ${minHeightClass} pt-2 flex flex-col items-center justify-center`}>
 <Onda
 data={funnelData.map((d) => ({
 label: d.name,
 value: d.count,
 color: d.color
 }))}
 height={heightMode === 'compact' ? 140 : heightMode === 'tall' ? 300 : 200}
 barWidth={heightMode === 'compact' ? 12 : heightMode === 'tall' ? 18 : 14}
 gap={heightMode === 'compact' ? 6 : heightMode === 'tall' ? 10 : 8}
 showLabels={true}
 animated={true}
 tooltipFormatter={(val) => {
 const pct = ((val / total) * 100).toFixed(1);
 return `${val} salas (${pct}%)`;
 }}
 className="w-full"
 />
 </div>
 </div>
 );
}

/* 3. GRÁFICO DE FINANZAS & CACHÉ POR CONCIERTO */
export function FinancesChartWidget({ onNavigate, heightMode ='normal' }: ChartWidgetProps) {
 // Aggregate revenue and average cache
 const defaultMonths = [
 { month:'Ene', ingresos: 1200, gastos: 450, cacheMedio: 1200 },
 { month:'Feb', ingresos: 1800, gastos: 600, cacheMedio: 1500 },
 { month:'Mar', ingresos: 2400, gastos: 800, cacheMedio: 1800 },
 { month:'Abr', ingresos: 3100, gastos: 950, cacheMedio: 2000 },
 { month:'May', ingresos: 4200, gastos: 1200, cacheMedio: 2200 },
 { month:'Jun', ingresos: 5800, gastos: 1600, cacheMedio: 2500 },
 ];

 const totalIngresos = defaultMonths.reduce((acc, m) => acc + m.ingresos, 0);
 const totalGastos = defaultMonths.reduce((acc, m) => acc + m.gastos, 0);
 const beneficio = totalIngresos - totalGastos;

 const minHeightClass = heightMode ==='compact' ?'h-[200px]' : heightMode ==='tall' ?'h-[360px]' :'h-[270px]';

 return (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-3 flex flex-col justify-between h-full">
 <div className="flex items-center justify-between pb-2.5">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-[var(--ok)]/15 text-[var(--ok)] shrink-0">
 <DollarSign className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-sm font-bold font-display text-[var(--ink)]">
 Evolución Financiera & Caché
 </h3>
 <p className="text-[11px] font-sans text-[var(--ink-2)]">Ingresos vs Gastos de Directos</p>
 </div>
 </div>

 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('finanzas')}
 className="text-xs font-sans text-[var(--acc)] hover:text-[var(--acc)]/70 font-bold flex items-center gap-1 cursor-pointer"
 >
 <span>Finanzas</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="grid grid-cols-2 gap-2 font-sans text-xs text-center">
 <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)]">
 <span className="text-[10px] text-[var(--ink-2)] block">Ingresos Totales</span>
 <span className="font-bold text-[var(--ok)] text-sm">+{totalIngresos}€</span>
 </div>
 <div className="p-2 rounded-[var(--r-m)] bg-[var(--surface)]">
 <span className="text-[10px] text-[var(--ink-2)] block">Neto / Beneficio</span>
 <span className="font-bold text-[var(--acc)] text-sm">+{beneficio}€</span>
 </div>
 </div>

 <div className={`w-full ${minHeightClass} pt-2`}>
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={defaultMonths} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="var(--hair)" vertical={false} />
 <XAxis dataKey="month" stroke="var(--ink-3)" fontSize={10} />
 <YAxis stroke="var(--ink-3)" fontSize={10} />
 <Tooltip
 content={({ active, payload }) => {
 if (active && payload && payload.length) {
 const data = payload[0].payload;
 return (
 <div className="bg-[var(--surface)]/80 p-2.5 rounded-[var(--r-m)] font-sans text-xs text-[var(--ink)] z-50">
 <div className="font-bold text-[var(--ok)]">{data.month}</div>
 <div className="text-[var(--ink-2)] mt-1 space-y-0.5">
 <div>Ingresos: <span className="font-bold text-[var(--ok)]">+{data.ingresos}€</span></div>
 <div>Gastos: <span className="font-bold text-[var(--alert)]">-{data.gastos}€</span></div>
 <div>Caché Medio: <span className="font-bold text-[var(--acc)]">{data.cacheMedio}€</span></div>
 </div>
 </div>
 );
 }
 return null;
 }}
 />
 <Bar dataKey="ingresos" fill="var(--ok)" radius={[4, 4, 0, 0]} name="Ingresos" />
 <Bar dataKey="gastos" fill="var(--alert)" radius={[4, 4, 0, 0]} name="Gastos" />
 </BarChart>
 </ResponsiveContainer>
 </div>
 </div>
 );
}

/* 4. GRÁFICO DE CRECIMIENTO DE FANS & SOCIAL */
export function SocialFansGrowthWidget({ fans = [], onNavigate, heightMode ='normal' }: ChartWidgetProps) {
 const fansCount = fans.length;
 const growthData = [
 { mes:'Ene', fans: Math.max(5, Math.round(fansCount * 0.2)), qrScans: 12 },
 { mes:'Feb', fans: Math.max(12, Math.round(fansCount * 0.4)), qrScans: 28 },
 { mes:'Mar', fans: Math.max(25, Math.round(fansCount * 0.6)), qrScans: 45 },
 { mes:'Abr', fans: Math.max(40, Math.round(fansCount * 0.8)), qrScans: 62 },
 { mes:'May', fans: Math.max(60, fansCount || 85), qrScans: 90 }
 ];

 const minHeightClass = heightMode ==='compact' ?'h-[200px]' : heightMode ==='tall' ?'h-[360px]' :'h-[270px]';

 return (
 <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-3 flex flex-col justify-between h-full">
 <div className="flex items-center justify-between pb-2.5">
 <div className="flex items-center gap-2.5">
 <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc-soft)] text-[var(--acc-ink)] shrink-0">
 <Users className="w-5 h-5" />
 </div>
 <div>
 <h3 className="text-sm font-bold font-display text-[var(--ink)]">
 Captación de Fans & QR
 </h3>
 <p className="text-[11px] font-sans text-[var(--ink-2)]">Crecimiento en Registro de Seguidores</p>
 </div>
 </div>

 {onNavigate && (
 <button
 type="button"
 onClick={() => onNavigate('fans')}
 className="text-xs font-sans text-[var(--acc)] hover:text-[var(--acc)]/70 font-bold flex items-center gap-1 cursor-pointer"
 >
 <span>Captura QR</span>
 <ArrowRight className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 <div className="flex items-center justify-between px-3 py-2 rounded-[var(--r-m)] bg-[var(--surface)] text-xs font-sans">
 <span className="text-[var(--ink-2)]">Fans Registrados:</span>
 <span className="font-bold text-[var(--acc)] text-sm">{fansCount > 0 ? fansCount : 85} seguidores</span>
 </div>

 <div className={`w-full ${minHeightClass} pt-2 flex flex-col items-center justify-center`}>
 <Onda
 data={growthData.map((d) => ({
 label: d.mes,
 value: d.fans,
 color: 'var(--acc)'
 }))}
 height={heightMode === 'compact' ? 140 : heightMode === 'tall' ? 300 : 200}
 barWidth={heightMode === 'compact' ? 12 : heightMode === 'tall' ? 18 : 14}
 gap={heightMode === 'compact' ? 6 : heightMode === 'tall' ? 10 : 8}
 showLabels={true}
 animated={true}
 tooltipFormatter={(val) => `${val} fans acumulados`}
 className="w-full"
 />
 </div>
 </div>
 );
}
