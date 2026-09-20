import React, { useState, useEffect } from'react';
import { motion, AnimatePresence } from'motion/react';
import { 
 Droplets, Thermometer, AlertTriangle, RefreshCw, 
 Calendar, ShieldAlert, ChevronDown, ChevronUp, Wind
} from'lucide-react';
import { fetchEventWeather, EventWeatherData, WeatherAlert } from'../../services/weatherService';
import { AnimatedWeatherIcon } from'./AnimatedWeatherIcon';

interface EventWeatherCardProps {
 city: string;
 dateStr: string; // YYYY-MM-DD
 timeStr?: string; // e.g."21:00"
 isStitchLight?: boolean;
 onAlertsDetected?: (alerts: WeatherAlert[]) => void;
 collapsible?: boolean;
 defaultExpanded?: boolean;
}

export const EventWeatherCard: React.FC<EventWeatherCardProps> = ({
 city,
 dateStr,
 timeStr,
 isStitchLight = false,
 onAlertsDetected,
 collapsible = false,
 defaultExpanded = false
}) => {
 const [selectedSlot, setSelectedSlot] = useState<'show' |'soundcheck'>('show');
 const [weatherData, setWeatherData] = useState<EventWeatherData | null>(null);
 const [isLoading, setIsLoading] = useState<boolean>(true);
 const [expandedAlerts, setExpandedAlerts] = useState<Record<string, boolean>>({});
 const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);

 // Calcular la hora a consultar según la pestaña
 const activeTimeStr = selectedSlot ==='soundcheck' ?'18:00' : (timeStr ||'21:00');

 const toggleAlertExpand = (alertId: string) => {
 setExpandedAlerts(prev => ({
 ...prev,
 [alertId]: !prev[alertId]
 }));
 };

 const loadWeather = async () => {
 if (!city || !dateStr) {
 setIsLoading(false);
 return;
 }
 setIsLoading(true);
 try {
 const data = await fetchEventWeather({
 city,
 dateStr,
 timeStr: activeTimeStr
 });
 setWeatherData(data);
 if (data.alerts && onAlertsDetected) {
 onAlertsDetected(data.alerts);
 }
 if (data.alerts && data.alerts.some(a => a.severity ==='danger')) {
 setIsExpanded(true);
 }
 } catch (err) {
 console.warn('[EventWeatherCard] Failed to load weather:', err);
 } finally {
 setIsLoading(false);
 }
 };

 useEffect(() => {
 loadWeather();
 }, [city, dateStr, activeTimeStr]);

 const getWeatherIconBackdrop = (iconType?: EventWeatherData['iconType']) => {
 switch (iconType) {
 case'sun':
 return'from-amber-500/30 via-amber-400/10 to-transparent /50 shadow-[0_0_20px_rgba(251,191,36,0.3)]';
 case'cloud-sun':
 return'from-amber-500/25 via-slate-700/25 to-transparent /35 shadow-[0_0_16px_rgba(251,191,36,0.2)]';
 case'cloud':
 return'from-slate-600/35 via-slate-800/25 to-transparent /40 shadow-[0_0_14px_rgba(148,163,184,0.2)]';
 case'rain':
 return'from-sky-500/30 via-blue-600/20 to-transparent border-sky-400/50 shadow-[0_0_18px_rgba(56,189,248,0.3)]';
 case'lightning':
 return'from-yellow-500/35 via-purple-900/35 to-transparent /60 shadow-[0_0_22px_rgba(250,204,21,0.4)]';
 case'snow':
 return'from-cyan-500/30 via-blue-900/25 to-transparent border-cyan-400/50 shadow-[0_0_18px_rgba(103,232,249,0.3)]';
 case'fog':
 return'from-slate-500/25 via-zinc-700/25 to-transparent /35 shadow-[0_0_12px_rgba(148,163,184,0.2)]';
 default:
 return'from-amber-500/20 to-transparent /30 shadow-[0_0_14px_rgba(251,191,36,0.2)]';
 }
 };

 // Si no hay ciudad, no mostramos nada invasivo
 if (!city || !city.trim()) {
 return null;
 }

 const hasAlerts = Boolean(weatherData?.alerts && weatherData.alerts.length > 0);
 const dangerAlertsCount = weatherData?.alerts?.filter(a => a.severity ==='danger').length || 0;

 // Modo compacto y simplificado para móvil / modal
 if (collapsible && !isExpanded) {
 return (
 <div className={`rounded-[var(--r-m)] px-3.5 py-2.5 transition-all duration-200 flex items-center justify-between gap-3 ${
 isStitchLight 
 ? hasAlerts
 ?'bg-amber-50 text-[var(--ink)] shadow-xs'
 :'bg-[var(--bg)] text-[var(--ink)]'
 : hasAlerts
 ?'bg-[var(--acc-soft)] /40 text-[var(--sunken)] shadow-xs'
 :'bg-[var(--surface)]/80 text-[var(--sunken)]'
 }`}>
 <div className="flex items-center gap-2.5 min-w-0 flex-1">
 <div className={`p-1.5 rounded-[var(--r-s)] bg-gradient-to-br shrink-0 ${getWeatherIconBackdrop(weatherData?.iconType)}`}>
 <AnimatedWeatherIcon iconType={weatherData?.iconType} size="sm" />
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-sm font-bold font-mono text-[var(--acc)]">
 {isLoading ?'...' : (weatherData?.temperature !== undefined ? `${weatherData.temperature}°C` :'--')}
 </span>
 <span className={`text-xs font-medium truncate ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--sunken)]'}`}>
 {isLoading ?'Consultando tiempo...' : (weatherData?.conditionText ||'Clima')}
 </span>
 {weatherData?.rainProbability !== undefined && (
 <span className="text-[11px] font-mono text-sky-400 flex items-center gap-0.5 font-semibold">
 <Droplets className="w-3 h-3" />
 {weatherData.rainProbability}% lluvia
 </span>
 )}
 {weatherData?.windGusts !== undefined && weatherData.windGusts >= 25 && (
 <span className="text-[11px] font-mono text-[var(--acc)] flex items-center gap-0.5">
 <Wind className="w-3 h-3" />
 {weatherData.windGusts} km/h
 </span>
 )}
 {hasAlerts && (
 <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
 dangerAlertsCount > 0 ?'bg-rose-500 text-[var(--ink)] animate-pulse' :'bg-[var(--acc)] text-black'
 }`}>
 {dangerAlertsCount > 0 ?'⚠️ Alerta Clima' :'Aviso Meteo'}
 </span>
 )}
 </div>
 <span className={`text-[10px] font-mono block truncate ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>
 {weatherData?.cityName || city} · Show {timeStr ||'21:00'}
 </span>
 </div>
 </div>

 <button
 type="button"
 onClick={() => setIsExpanded(true)}
 className="flex items-center gap-1 px-3 py-1.5 rounded-[var(--r-s)] text-xs font-mono font-bold text-[var(--acc)]/70 hover:bg-[var(--acc)]/15 transition-colors shrink-0 min-h-[40px] cursor-pointer"
 title="Ver previsión meteorológica detallada"
 aria-label="Ver previsión meteorológica detallada"
 >
 <span>Previsión</span>
 <ChevronDown className="w-3.5 h-3.5" />
 </button>
 </div>
 );
 }

 return (
 <div className={`rounded-[var(--r-m)] p-4 transition-all duration-200 ${
 isStitchLight 
 ? hasAlerts
 ? dangerAlertsCount > 0
 ?'bg-gradient-to-br from-rose-50 to-amber-50 border-rose-300 text-[var(--ink)] shadow-sm'
 :'bg-gradient-to-br from-amber-50 to-sky-50 text-[var(--ink)] shadow-sm'
 :'bg-gradient-to-br from-amber-50/70 to-sky-50/70 text-[var(--ink)]' 
 : hasAlerts
 ? dangerAlertsCount > 0
 ?'bg-gradient-to-br from-rose-950/40 via-[var(--surface)]/90 to-stone-900/90 border-rose-500/40 text-[var(--sunken)] shadow-rose-950/20 shadow-lg'
 :'bg-gradient-to-br from-amber-950/30 via-[var(--surface)]/90 to-stone-900/90 /40 text-[var(--sunken)] shadow-amber-950/20 shadow-lg'
 :'bg-gradient-to-br from-stone-900/80 to-[var(--surface)]/80 /25 text-[var(--sunken)]'
 }`}>
 {/* Barra superior del widget del tiempo */}
 <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b /15">
 <div className="flex items-center gap-2">
 <span className={`p-1 rounded-md ${
 hasAlerts 
 ? dangerAlertsCount > 0 
 ?'bg-rose-500/20 text-rose-400' 
 :'bg-[var(--acc)]/20 text-[var(--acc)]'
 :'bg-[var(--acc)]/15 text-[var(--acc)]'
 }`}>
 {hasAlerts ? <AlertTriangle className="w-3.5 h-3.5 animate-pulse" /> : <Thermometer className="w-3.5 h-3.5" />}
 </span>
 <div>
 <div className="flex items-center gap-1.5">
 <span className="text-[11px] font-mono font-bold tracking-wide uppercase text-[var(--acc)]">
 Previsión Meteorológica
 </span>
 {hasAlerts && (
 <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
 dangerAlertsCount > 0
 ?'bg-rose-500 text-[var(--acc-ink)] shadow-xs'
 :'bg-[var(--acc)] text-[var(--acc-ink)] shadow-xs'
 }`}>
 {dangerAlertsCount > 0 ?'Alerta Activa' :'Aviso Meteo'}
 </span>
 )}
 </div>
 <span className={`text-[10px] font-mono block ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>
 {weatherData?.cityName || city} · {dateStr}
 </span>
 </div>
 </div>

 {/* Pestañas Concierto vs Prueba de Sonido y Controles */}
 <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-[var(--r-s)]">
 <button
 type="button"
 onClick={() => setSelectedSlot('show')}
 className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${
 selectedSlot ==='show'
 ?'bg-[var(--acc)] text-[var(--acc-ink)] shadow-sm'
 :'text-[var(--ink-2)] hover:text-[var(--acc)]/70'
 }`}
 >
 <span>Show ({timeStr ||'21:00'})</span>
 </button>
 <button
 type="button"
 onClick={() => setSelectedSlot('soundcheck')}
 className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer flex items-center gap-1 ${
 selectedSlot ==='soundcheck'
 ?'bg-[var(--acc)] text-[var(--acc-ink)] shadow-sm'
 :'text-[var(--ink-2)] hover:text-[var(--acc)]/70'
 }`}
 >
 <span>Prueba (18:00)</span>
 </button>
 <button
 type="button"
 onClick={loadWeather}
 title="Actualizar previsión"
 className="p-1 text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors cursor-pointer"
 >
 <RefreshCw className={`w-3 h-3 ${isLoading ?'animate-spin text-[var(--acc)]' :''}`} />
 </button>
 {collapsible && (
 <button
 type="button"
 onClick={() => setIsExpanded(false)}
 title="Minimizar widget del tiempo"
 className="px-1.5 py-0.5 text-[var(--ink-2)] hover:text-[var(--acc)]/70 text-[10px] font-mono flex items-center gap-0.5 transition-colors cursor-pointer border-l /20 ml-0.5"
 >
 <span>Minimizar</span>
 <ChevronUp className="w-3 h-3" />
 </button>
 )}
 </div>
 </div>

 {/* Contenido principal del tiempo */}
 {isLoading ? (
 <div className="flex items-center justify-center py-4 gap-2 text-xs font-mono text-[var(--ink-2)]">
 <RefreshCw className="w-4 h-4 animate-spin text-[var(--acc)]" />
 <span>Consultando satélites meteorológicos en directo...</span>
 </div>
 ) : weatherData?.status ==='future' ? (
 <div className="flex items-center gap-3 py-2 px-3 rounded-[var(--r-s)] bg-[var(--acc)]/10 text-[11px] font-mono">
 <Calendar className="w-5 h-5 text-[var(--acc)] shrink-0" />
 <div>
 <span className="font-bold text-[var(--acc)]/70 block">Previsión a 14 días vista</span>
 <p className={isStitchLight ?'text-[var(--ink-2)] text-[10px]' :'text-[var(--ink-2)] text-[10px]'}>
 {weatherData.conditionText}
 </p>
 </div>
 </div>
 ) : weatherData?.status ==='past' ? (
 <div className="text-[11px] font-mono text-[var(--ink-2)] py-1">
 ✓ {weatherData.conditionText}
 </div>
 ) : weatherData?.status ==='error' ? (
 <div className="text-[10px] font-mono text-[var(--ink-2)] py-1">
 {weatherData.error ||'Previsión no disponible para esta ubicación'}
 </div>
 ) : weatherData ? (
 <div className="space-y-3">
 <div className="flex items-center justify-between gap-3">
 {/* Clima e Icono con Micro-Animaciones */}
 <div className="flex items-center gap-3">
 <motion.div 
 whileHover={{ scale: 1.08 }}
 transition={{ type:"spring", stiffness: 400, damping: 17 }}
 className={`p-2 rounded-[var(--r-l)] bg-gradient-to-br relative backdrop-blur-md ${getWeatherIconBackdrop(weatherData.iconType)}`}
 >
 <AnimatedWeatherIcon iconType={weatherData.iconType} size="lg" />
 </motion.div>
 <div>
 <div className="flex items-baseline gap-1.5">
 <span className="text-2xl font-bold font-mono tracking-tight text-[var(--acc)] drop-shadow-[0_0_10px_rgba(251,191,36,0.3)]">
 {weatherData.temperature}°C
 </span>
 {weatherData.apparentTemperature !== undefined && (
 <span className={`text-[10px] font-mono ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--ink-2)]'}`}>
 (sensación {weatherData.apparentTemperature}°C)
 </span>
 )}
 </div>
 <p className={`text-xs font-medium flex items-center gap-1.5 ${isStitchLight ?'text-[var(--ink-2)]' :'text-[var(--sunken)]'}`}>
 <span>{weatherData.conditionText}</span>
 </p>
 </div>
 </div>

 {/* Métricas: Lluvia y Viento con Micro-Interacciones */}
 <div className="flex items-center gap-2 sm:gap-3">
 <motion.div 
 whileHover={{ scale: 1.05 }}
 className={`flex flex-col items-center px-2.5 py-1.5 rounded-[var(--r-m)] text-center transition-all ${
 (weatherData.rainProbability || 0) >= 40 
 ?'bg-sky-500/20 border-sky-500/50 text-sky-300 shadow-[0_0_12px_rgba(14,165,233,0.25)]' 
 :'bg-black/20 border-[var(--hair)] text-[var(--ink-3)]'
 }`}
 >
 <div className="flex items-center gap-1 text-[10px] font-mono">
 {(weatherData.rainProbability || 0) >= 40 ? (
 <AnimatedWeatherIcon iconType="rain" size="xs" />
 ) : (
 <Droplets className="w-3 h-3 text-sky-400" />
 )}
 <span>Lluvia</span>
 </div>
 <span className="text-xs font-bold font-mono text-sky-400 mt-0.5">
 {weatherData.rainProbability}%
 </span>
 {(weatherData.rainVolumeMm || 0) > 0 && (
 <span className="text-[9px] font-mono text-sky-400/80">
 {weatherData.rainVolumeMm} mm
 </span>
 )}
 </motion.div>

 <motion.div 
 whileHover={{ scale: 1.05 }}
 className={`flex flex-col items-center px-2.5 py-1.5 rounded-[var(--r-m)] text-center transition-all ${
 (weatherData.windGusts || 0) >= 40 
 ?'bg-[var(--acc)]/20 /50 text-[var(--acc)]/70 shadow-[0_0_12px_rgba(245,158,11,0.25)]' 
 :'bg-black/20 border-[var(--hair)] text-[var(--ink-3)]'
 }`}
 >
 <div className="flex items-center gap-1 text-[10px] font-mono">
 {(weatherData.windGusts || 0) >= 40 ? (
 <AnimatedWeatherIcon iconType="wind" size="xs" severity="warning" />
 ) : (
 <Wind className="w-3 h-3 text-[var(--acc)]" />
 )}
 <span>Viento</span>
 </div>
 <span className="text-xs font-bold font-mono text-[var(--acc)] mt-0.5">
 {weatherData.windGusts} km/h
 </span>
 <span className="text-[9px] font-mono text-[var(--ink-2)]">
 rachas
 </span>
 </motion.div>
 </div>
 </div>

 {/* SECCIÓN DESTACADA DE ALERTAS METEOROLÓGICAS (Lluvia, Frío Extremo, Viento Extremo) */}
 {hasAlerts && (
 <div className="space-y-2 pt-1">
 <div className="flex items-center justify-between">
 <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
 <AlertTriangle className="w-3 h-3 text-rose-400 animate-pulse" />
 Alertas de Escenario y Directo ({weatherData.alerts.length})
 </span>
 <span className="text-[9px] font-mono text-[var(--ink-2)]">
 Recomendaciones para rider y banda
 </span>
 </div>

 <div className="space-y-2">
 {weatherData.alerts.map((alert) => {
 const isExpanded = expandedAlerts[alert.id] ?? false;
 const isDanger = alert.severity ==='danger';

 return (
 <motion.div
 key={alert.id}
 initial={{ opacity: 0, y: 4 }}
 animate={{ opacity: 1, y: 0 }}
 className={`rounded-[var(--r-m)] p-3 transition-all duration-200 ${
 isDanger
 ? isStitchLight
 ?'bg-rose-100/70 border-rose-300 text-[var(--alert)] shadow-xs'
 :'bg-[var(--alert-soft)] border-rose-500/50 text-rose-100 shadow-rose-950/30 shadow-md'
 : isStitchLight
 ?'bg-amber-100/70 text-[var(--acc)] shadow-xs'
 :'bg-[var(--acc-soft)] /40 text-amber-100 shadow-amber-950/20 shadow-md'
 }`}
 >
 <div className="flex items-start justify-between gap-2">
 <div className="flex items-start gap-2.5">
 <div className={`p-1.5 rounded-[var(--r-s)] shrink-0 mt-0.5 ${
 isDanger 
 ?'bg-rose-500/20 border-rose-500/40' 
 :'bg-[var(--acc)]/20 /40'
 }`}>
 <AnimatedWeatherIcon
 iconType={alert.icon}
 size="sm"
 severity={alert.severity}
 />
 </div>
 <div>
 <div className="flex items-center gap-2 flex-wrap mb-0.5">
 <span className="font-bold font-mono text-xs text-[var(--sunken)] tracking-tight">
 {alert.title}
 </span>
 <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
 isDanger
 ?'bg-rose-500 text-[var(--acc-ink)] shadow-xs'
 :'bg-[var(--acc)] text-[var(--acc-ink)] shadow-xs'
 }`}>
 {isDanger ?'Peligro Extremo' :'Precaución'}
 </span>
 </div>
 <p className="text-[11px] leading-relaxed opacity-90 font-sans">
 {alert.shortAdvice}
 </p>
 </div>
 </div>

 <button
 type="button"
 onClick={() => toggleAlertExpand(alert.id)}
 className={`p-1 rounded-md text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors shrink-0 cursor-pointer ${
 isDanger ?'hover:bg-[var(--alert-soft)]' :'hover:bg-[var(--acc-soft)]'
 }`}
 title={isExpanded ?'Ocultar recomendaciones' :'Ver recomendaciones técnicas'}
 >
 {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
 </button>
 </div>

 {/* Consejos técnicos y medidas de seguridad detalladas con micro-animación fluida */}
 <AnimatePresence>
 {isExpanded && alert.fullAdvice && alert.fullAdvice.length > 0 && (
 <motion.div
 initial={{ opacity: 0, height: 0 }}
 animate={{ opacity: 1, height:'auto' }}
 exit={{ opacity: 0, height: 0 }}
 transition={{ duration: 0.2 }}
 className={`mt-2.5 pt-2.5 border-t space-y-1.5 text-[10px] font-sans overflow-hidden ${
 isDanger ?'border-rose-500/20 text-[var(--ink)]/90' :'/20 text-[var(--ink)]/90'
 }`}
 >
 <div className="font-mono uppercase tracking-wider text-[9px] font-bold text-[var(--acc)]/90 mb-1 flex items-center gap-1">
 <ShieldAlert className="w-3 h-3 text-[var(--acc)]" />
 <span>Protocolo técnico recomendado:</span>
 </div>
 <ul className="space-y-1 pl-1">
 {alert.fullAdvice.map((tip, idx) => (
 <li key={idx} className="flex items-start gap-1.5 leading-tight">
 <span className="text-[var(--acc)] font-bold shrink-0 mt-0.5">•</span>
 <span>{tip}</span>
 </li>
 ))}
 </ul>
 </motion.div>
 )}
 </AnimatePresence>
 </motion.div>
 );
 })}
 </div>
 </div>
 )}
 </div>
 ) : null}
 </div>
 );
};

