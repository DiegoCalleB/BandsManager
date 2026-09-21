import React from 'react';
import { Navigation, ExternalLink } from 'lucide-react';

interface DirectionsCardProps {
 query: string;
 locationName: string;
 address?: string;
 className?: string;
}

export default function DirectionsCard({
 query,
 locationName,
 address,
 className = ''}: DirectionsCardProps) {
 const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

 return (
 <a
 href={mapsUrl}
 target="_blank"
 rel="noopener noreferrer"
 onClick={(e) => e.stopPropagation()}
 className={`inline-flex relative max-w-full w-full sm:w-auto mx-auto justify-center items-center overflow-hidden rounded-[var(--r-m)] transition-all duration-200 group cursor-pointer ${
'bg-[var(--surface)] hover:border-[var(--acc)]/50 hover:shadow-purple-500/10'
 } ${className}`}
 >
 {/* Tactile Simulated Map Grid */}
 <div className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-35 transition-opacity">
 <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
 <defs>
 <pattern id={`map-grid-${locationName.replace(/\s+/g,'-')}`} width="20" height="20" patternUnits="userSpaceOnUse">
 <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--ink-3)" strokeWidth="0.5" strokeDasharray="2 2" />
 <circle cx="10" cy="10" r="1" fill="var(--ink-3)" opacity="0.4" />
 </pattern>
 </defs>
 <rect width="100%" height="100%" fill={`url(#map-grid-${locationName.replace(/\s+/g,'-')})`} />
 </svg>
 </div>

 {/* Content Container */}
 <div className="relative z-10 p-2.5 py-2 flex flex-col sm:flex-row items-center justify-center gap-2 bg-gradient-to-r from-[var(--bg)] via-[var(--bg)]/95 to-transparent text-center w-full">
 {address && (
 <span className="text-[10px] font-sans text-[var(--ink-2)] truncate leading-tight max-w-[220px]" title={address}>
 {address}
 </span>
 )}

 {/* Action: Cómo llegar Button */}
 <div className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[var(--r-s)] text-xs font-sans font-bold transition-all shrink-0 ${
'bg-[var(--sunken)]/90700/80 text-[var(--ink)] group-hover:bg-[var(--acc)] group-hover:text-[var(--ink)] group-hover:border-[var(--acc)]'
 }`}>
 <Navigation className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
 <span className="inline">Cómo llegar</span>
 <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100 transition-opacity" />
 </div>
 </div>
 </a>
 );
}
