import React from 'react';
import { Onda } from '../ui/Onda';
import { EnergyChartPoint } from './EnergyChart';
import { Music } from 'lucide-react';

interface SetlistEnergyVisualizationProps {
 chartData: EnergyChartPoint[];
 currentPlayingSongId?: string | null;
 currentSetlist?: { id: string; nombre?: string; };
 songs: Array<{ id: string; titulo: string; portadaUrl?: string; }>;
 currentTime?: number;
 duration?: number;
}

export const SetlistEnergyVisualization: React.FC<SetlistEnergyVisualizationProps> = ({
 chartData,
 currentPlayingSongId,
 currentSetlist,
 songs,
 currentTime = 0,
 duration = 0
}) => {
 // Mapear datos del gráfico a Onda (barras)
 const ondaData = chartData
  .filter(d => d.isSong && d.score !== null)
  .map((d) => {
   const isPlaying = d.songId === currentPlayingSongId;

   return {
     label: d.name,
     value: Math.max(1, (d.score as number) / 20), // Normalizar a 0-1
     color: isPlaying ? 'var(--ok)' : d.color,
     isPlaying
   };
  });

 // Encontrar la portada del álbum actual (primera canción reproduciendo o primera del setlist)
 const playingIndex = chartData.findIndex(d => d.songId === currentPlayingSongId);

 // Calcular progreso a través de TODO el setlist, no solo la canción actual
 let timeBeforeCurrent = 0;
 if (playingIndex > 0) {
  for (let i = 0; i < playingIndex; i++) {
   const point = chartData[i];
   if (point.isSong) {
    const song = songs.find(s => s.id === point.songId);
    if (song && (song as any).duration) {
     timeBeforeCurrent += (song as any).duration;
    }
   }
  }
 }

 // Calcular duración total de todas las canciones en el setlist
 let totalDuration = 0;
 for (const point of chartData) {
  if (point.isSong) {
   const song = songs.find(s => s.id === point.songId);
   if (song && (song as any).duration) {
    totalDuration += (song as any).duration;
   }
  }
 }

 // Calcular progreso total: (tiempo antes + tiempo actual) / duración total
 const totalTimeElapsed = timeBeforeCurrent + (currentTime || 0);
 const overallProgress = totalDuration > 0 ? Math.min(1, totalTimeElapsed / totalDuration) : 0;

 // Posición del indicador como porcentaje del ancho del contenedor
 // Rango: 2% a 98% para mantenerlo dentro del área visible con margen pequeño
 const indicatorPercent = 2 + overallProgress * 96;
 const activeIndex = playingIndex >= 0 ? playingIndex : 0;
 const activeSong = chartData[activeIndex];
 const activeImage = songs.find(s => s.id === activeSong?.songId)?.portadaUrl;

 return (
   <div className="space-y-4">
     {/* Portada del Setlist Actual */}
     <div className="flex items-start gap-4">
       {/* Imagen del Disco / Portada */}
       <div className="w-20 h-20 rounded-[var(--r-m)] bg-[var(--sunken)] shrink-0 overflow-hidden shadow-sm">
         {activeImage ? (
           <img
             src={activeImage}
             alt={activeSong?.name || 'Setlist'}
             className="w-full h-full object-cover"
           />
         ) : (
           <div className="w-full h-full flex items-center justify-center bg-[var(--surface)]">
             <Music className="w-8 h-8 text-[var(--ink-2)]" />
           </div>
         )}
       </div>

       {/* Info del Setlist */}
       <div className="flex-1 min-w-0">
         <p className="text-[11px] font-semibold text-[var(--ink-3)] uppercase tracking-wide mb-1">
           {currentSetlist?.nombre ? 'Setlist' : 'Energía'}
         </p>
         <h3 className="text-sm font-bold text-[var(--ink)] truncate">
           {currentSetlist?.nombre || 'Mapa de Energía'}
         </h3>
         <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
           {activeSong?.name || '—'}
         </p>
       </div>
     </div>

     {/* Barras de Energía (La Onda) */}
     <div className="bg-[var(--surface)] rounded-[var(--r-m)] p-4 relative">
       <Onda
         data={ondaData}
         height={140}
         barWidth={Math.max(8, Math.min(24, 320 / Math.max(1, ondaData.length)))}
         gap={4}
         showLabels={ondaData.length <= 12}
         animated={true}
         tooltipFormatter={(v) => `${Math.round(v * 100)}%`}
       />

       {/* Indicador de progreso animado - Puntito verde que avanza a través del setlist */}
       {currentPlayingSongId && totalDuration > 0 && (
         <div
           className="absolute transition-all duration-100 ease-linear pointer-events-none"
           style={{
             left: `${indicatorPercent}%`,
             top: '50%',
             transform: 'translate(-50%, -50%)',
             width: '8px',
             height: '8px',
             backgroundColor: 'var(--ok)',
             borderRadius: '50%',
             boxShadow: '0 0 8px var(--ok), 0 0 16px rgba(var(--ok), 0.3)',
             zIndex: 10
           }}
         />
       )}
     </div>

     {/* Leyenda */}
     <div className="flex items-center gap-3 text-[11px] text-[var(--ink-2)]">
       <div className="flex items-center gap-1.5">
         <div className="w-3 h-3 rounded-full" style={{ background: 'var(--ok)' }} />
         <span>Reproduciendo</span>
       </div>
       <div className="flex items-center gap-1.5">
         <div className="w-3 h-3 rounded-full" style={{ background: 'var(--acc)' }} />
         <span>Energía</span>
       </div>
     </div>
   </div>
 );
};
