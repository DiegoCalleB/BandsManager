import React from'react';
import { motion } from'motion/react';
import { 
 Sun, CloudSun, Cloud, CloudRain, CloudLightning, 
 Snowflake, CloudFog, Wind, Droplets, Thermometer,
 AlertTriangle, CloudDrizzle, Zap
} from'lucide-react';
import { EventWeatherData, WeatherAlert } from'../../services/weatherService';

export type WeatherIconType = EventWeatherData['iconType'] |'wind' |'alert' |'thermometer';

interface AnimatedWeatherIconProps {
 iconType?: WeatherIconType;
 size?:'xs' |'sm' |'md' |'lg' |'xl';
 className?: string;
 isAlert?: boolean;
 severity?:'warning' |'danger';
}

export const AnimatedWeatherIcon: React.FC<AnimatedWeatherIconProps> = ({
 iconType ='sun',
 size ='md',
 className ='',
 isAlert = false,
 severity
}) => {
 // Configuración de tamaños
 const sizeMap = {
 xs: { box:'w-5 h-5', icon:'w-3 h-3', sub:'w-2 h-2' },
 sm: { box:'w-7 h-7', icon:'w-4 h-4', sub:'w-2.5 h-2.5' },
 md: { box:'w-10 h-10', icon:'w-6 h-6', sub:'w-3.5 h-3.5' },
 lg: { box:'w-14 h-14', icon:'w-8 h-8', sub:'w-4 h-4' },
 xl: { box:'w-20 h-20', icon:'w-12 h-12', sub:'w-6 h-6' },
 };

 const currentSize = sizeMap[size];

 switch (iconType) {
 case'sun':
 return (
 <div className={`relative flex items-center justify-center ${currentSize.box} ${className}`}>
 {/* Resplandor áureo con micro-pulso */}
 <motion.div
 animate={{ 
 scale: [1, 1.15, 1],
 opacity: [0.35, 0.65, 0.35]
 }}
 transition={{ 
 duration: 3.5, 
 repeat: Infinity, 
 ease:"easeInOut" 
 }}
 className="absolute inset-0 rounded-full bg-[var(--acc)]/60/25 blur-sm"
 />
 {/* Sol girando lentamente a velocidad constante y suave */}
 <motion.div
 animate={{ rotate: 360 }}
 transition={{ 
 duration: 20, 
 repeat: Infinity, 
 ease:"linear" 
 }}
 className="relative z-10 flex items-center justify-center text-[var(--acc)] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]"
 >
 <Sun className={currentSize.icon} />
 </motion.div>
 </div>
 );

 case'cloud-sun':
 return (
 <div className={`relative flex items-center justify-center ${currentSize.box} ${className}`}>
 {/* Sol asomándose por detrás con rotación suave */}
 <motion.div
 animate={{ 
 rotate: [0, 45, 0],
 y: [-1, -2.5, -1],
 x: [1, 2, 1]
 }}
 transition={{ 
 duration: 5, 
 repeat: Infinity, 
 ease:"easeInOut" 
 }}
 className="absolute top-0 right-0 z-0 text-[var(--acc)] drop-shadow-[0_0_6px_rgba(251,191,36,0.6)]"
 >
 <Sun className={currentSize.sub} />
 </motion.div>
 {/* Nube flotando suavemente en primer plano */}
 <motion.div
 animate={{ 
 x: [-1.5, 1.5, -1.5],
 y: [0, -1, 0]
 }}
 transition={{ 
 duration: 4, 
 repeat: Infinity, 
 ease:"easeInOut" 
 }}
 className="relative z-10 text-amber-200/95 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
 >
 <CloudSun className={currentSize.icon} />
 </motion.div>
 </div>
 );

 case'cloud':
 return (
 <div className={`relative flex items-center justify-center ${currentSize.box} ${className}`}>
 {/* Sombra de nube detrás */}
 <motion.div
 animate={{ 
 x: [1, -2, 1],
 opacity: [0.2, 0.4, 0.2]
 }}
 transition={{ 
 duration: 4.5, 
 repeat: Infinity, 
 ease:"easeInOut" 
 }}
 className="absolute -top-0.5 -right-0.5 text-[var(--ink-2)]/40 blur-[1px]"
 >
 <Cloud className={currentSize.icon} />
 </motion.div>
 {/* Nube principal flotando */}
 <motion.div
 animate={{ 
 x: [-2, 2, -2],
 y: [0, -1.5, 0]
 }}
 transition={{ 
 duration: 4, 
 repeat: Infinity, 
 ease:"easeInOut" 
 }}
 className="relative z-10 text-[var(--ink-3)] drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]"
 >
 <Cloud className={currentSize.icon} />
 </motion.div>
 </div>
 );

 case'rain':
 return (
 <div className={`relative flex items-center justify-center ${currentSize.box} ${className}`}>
 {/* Resplandor acuático suave */}
 <motion.div
 animate={{ opacity: [0.2, 0.45, 0.2] }}
 transition={{ duration: 2.5, repeat: Infinity, ease:"easeInOut" }}
 className="absolute inset-0 rounded-full bg-sky-500/15 blur-sm"
 />
 {/* Nube con lluvia */}
 <motion.div
 animate={{ y: [-0.5, 0.5, -0.5] }}
 transition={{ duration: 2, repeat: Infinity, ease:"easeInOut" }}
 className="relative z-10 text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.4)]"
 >
 <CloudRain className={currentSize.icon} />
 </motion.div>
 {/* Microgotas adicionales cayendo para reforzar dinamismo visual */}
 {size !=='xs' && (
 <div className="absolute -bottom-1 flex gap-1 justify-center w-full z-20 pointer-events-none">
 <motion.div
 animate={{ 
 y: [-3, 4], 
 opacity: [0, 1, 0] 
 }}
 transition={{ 
 duration: 0.9, 
 repeat: Infinity, 
 ease:"easeIn",
 delay: 0.1 
 }}
 className="w-0.5 h-1.5 rounded-full bg-sky-300"
 />
 <motion.div
 animate={{ 
 y: [-3, 4], 
 opacity: [0, 1, 0] 
 }}
 transition={{ 
 duration: 1.1, 
 repeat: Infinity, 
 ease:"easeIn",
 delay: 0.5 
 }}
 className="w-0.5 h-1.5 rounded-full bg-sky-400"
 />
 </div>
 )}
 </div>
 );

 case'lightning':
 return (
 <div className={`relative flex items-center justify-center ${currentSize.box} ${className}`}>
 {/* Resplandor de relámpago con flash estroboscópico sutil */}
 <motion.div
 animate={{ 
 opacity: [0.15, 0.8, 0.15, 0.9, 0.2],
 scale: [0.95, 1.15, 0.95, 1.2, 1]
 }}
 transition={{ 
 duration: 2.4, 
 repeat: Infinity, 
 times: [0, 0.08, 0.15, 0.22, 1],
 ease:"easeInOut" 
 }}
 className="absolute inset-0 rounded-full bg-yellow-400/30 blur-md"
 />
 {/* Nube con rayo principal */}
 <motion.div
 animate={{ 
 y: [-0.5, 0.5, -0.5],
 filter: ['brightness(1)','brightness(1.5) drop-shadow(0 0 10px rgba(250,204,21,0.8))','brightness(1)'
 ]
 }}
 transition={{ 
 duration: 2.4, 
 repeat: Infinity, 
 times: [0, 0.1, 1],
 ease:"easeInOut" 
 }}
 className="relative z-10 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]"
 >
 <CloudLightning className={currentSize.icon} />
 </motion.div>
 </div>
 );

 case'snow':
 return (
 <div className={`relative flex items-center justify-center ${currentSize.box} ${className}`}>
 {/* Halo gélido */}
 <motion.div
 animate={{ 
 scale: [0.9, 1.1, 0.9],
 opacity: [0.2, 0.5, 0.2]
 }}
 transition={{ duration: 4, repeat: Infinity, ease:"easeInOut" }}
 className="absolute inset-0 rounded-full bg-cyan-400/20 blur-sm"
 />
 {/* Copo de nieve girando y flotando con suavidad */}
 <motion.div
 animate={{ 
 rotate: [0, 180, 360],
 y: [-1.5, 1.5, -1.5]
 }}
 transition={{ 
 rotate: { duration: 12, repeat: Infinity, ease:"linear" },
 y: { duration: 3, repeat: Infinity, ease:"easeInOut" }
 }}
 className="relative z-10 text-cyan-300 drop-shadow-[0_0_8px_rgba(103,232,249,0.6)]"
 >
 <Snowflake className={currentSize.icon} />
 </motion.div>
 </div>
 );

 case'fog':
 return (
 <div className={`relative flex items-center justify-center ${currentSize.box} ${className}`}>
 {/* Bruma oscilante horizontal */}
 <motion.div
 animate={{ 
 x: [-3, 3, -3],
 opacity: [0.6, 0.9, 0.6]
 }}
 transition={{ 
 duration: 4.5, 
 repeat: Infinity, 
 ease:"easeInOut" 
 }}
 className="relative z-10 text-[var(--ink-3)] drop-shadow-[0_0_6px_rgba(148,163,184,0.3)]"
 >
 <CloudFog className={currentSize.icon} />
 </motion.div>
 </div>
 );

 case'wind':
 return (
 <div className={`relative flex items-center justify-center ${currentSize.box} ${className}`}>
 {/* Ráfaga con vaivén dinámico y aceleración */}
 <motion.div
 animate={{ 
 x: [-2.5, 3.5, -2.5],
 skewX: [-4, 6, -4]
 }}
 transition={{ 
 duration: 2.2, 
 repeat: Infinity, 
 ease:"easeInOut" 
 }}
 className={`relative z-10 ${
 severity ==='danger' ?'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.5)]' :'text-[var(--acc)] drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]'
 }`}
 >
 <Wind className={currentSize.icon} />
 </motion.div>
 </div>
 );

 case'thermometer':
 return (
 <div className={`relative flex items-center justify-center ${currentSize.box} ${className}`}>
 <motion.div
 animate={{ 
 y: [0, -1.5, 0]
 }}
 transition={{ 
 duration: 2, 
 repeat: Infinity, 
 ease:"easeInOut" 
 }}
 className={`relative z-10 ${
 severity ==='danger' ?'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]' :'text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.5)]'
 }`}
 >
 <Thermometer className={currentSize.icon} />
 </motion.div>
 </div>
 );
 case'alert':
 default:
 return (
 <div className={`relative flex items-center justify-center ${currentSize.box} ${className}`}>
 <motion.div
 animate={{ 
 scale: [1, 1.15, 1],
 opacity: [0.8, 1, 0.8]
 }}
 transition={{ 
 duration: 1.5, 
 repeat: Infinity, 
 ease:"easeInOut" 
 }}
 className={`relative z-10 ${
 severity ==='danger' ?'text-rose-400 drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]' :'text-[var(--acc)] drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
 }`}
 >
 <AlertTriangle className={currentSize.icon} />
 </motion.div>
 </div>
 );
 }
};

/**
 * Chip de alerta meteorológica animado para celdas de calendario y tarjetas compactas
 */
interface CalendarWeatherBadgeProps {
 alert: WeatherAlert;
 compact?: boolean;
}

export const CalendarWeatherBadge: React.FC<CalendarWeatherBadgeProps> = ({
 alert,
 compact = false
}) => {
 const isDanger = alert.severity ==='danger';

 // Configuración temática por tipo de fenómeno
 const getBadgeStyle = () => {
 switch (alert.icon) {
 case'lightning':
 return {
 bg: isDanger ?'bg-rose-500/25 border-rose-500/60 text-rose-200' :'bg-yellow-500/20 /50 text-yellow-300',
 glow: isDanger ?'shadow-[0_0_8px_rgba(244,63,94,0.3)]' :'shadow-[0_0_8px_rgba(234,179,8,0.3)]'
 };
 case'rain':
 return {
 bg: isDanger ?'bg-rose-500/25 border-rose-500/60 text-rose-200' :'bg-sky-500/20 border-sky-500/50 text-sky-300',
 glow: isDanger ?'shadow-[0_0_8px_rgba(244,63,94,0.3)]' :'shadow-[0_0_8px_rgba(14,165,233,0.3)]'
 };
 case'snow':
 return {
 bg: isDanger ?'bg-rose-500/25 border-rose-500/60 text-rose-200' :'bg-cyan-500/20 border-cyan-500/50 text-cyan-300',
 glow: isDanger ?'shadow-[0_0_8px_rgba(244,63,94,0.3)]' :'shadow-[0_0_8px_rgba(6,182,212,0.3)]'
 };
 case'wind':
 return {
 bg: isDanger ?'bg-rose-500/25 border-rose-500/60 text-rose-200' :'bg-[var(--acc)]/20 /50 text-[var(--acc)]/70',
 glow: isDanger ?'shadow-[0_0_8px_rgba(244,63,94,0.3)]' :'shadow-[0_0_8px_rgba(245,158,11,0.3)]'
 };
 default:
 return {
 bg: isDanger ?'bg-rose-500/25 border-rose-500/60 text-rose-200' :'bg-[var(--acc)]/20 /50 text-[var(--acc)]/70',
 glow: isDanger ?'shadow-[0_0_8px_rgba(244,63,94,0.3)]' :'shadow-[0_0_8px_rgba(245,158,11,0.3)]'
 };
 }
 };

 const style = getBadgeStyle();

 if (compact) {
 return (
 <motion.div
 whileHover={{ scale: 1.25 }}
 className={`inline-flex items-center justify-center p-0.5 rounded-md backdrop-blur-xs transition-all ${style.bg} ${style.glow}`}
 title={`${alert.title}: ${alert.shortAdvice}`}
 >
 <AnimatedWeatherIcon
 iconType={alert.icon}
 size="xs"
 severity={alert.severity}
 />
 </motion.div>
 );
 }

 return (
 <motion.div
 initial={{ opacity: 0, scale: 0.95 }}
 animate={{ opacity: 1, scale: 1 }}
 className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[var(--r-s)] text-[10px] font-mono font-bold tracking-tight backdrop-blur-sm ${style.bg} ${style.glow}`}
 >
 <AnimatedWeatherIcon
 iconType={alert.icon}
 size="xs"
 severity={alert.severity}
 />
 <span>{alert.badge}</span>
 </motion.div>
 );
};
