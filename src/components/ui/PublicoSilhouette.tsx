import React from 'react';

export interface PublicoSilhouetteProps {
 /**
 * Opacity for the silhouette: 10-14% for empty states (subtle)
 * Can be higher for other contexts (celebration, highlight)
 */
 opacity?: number;
 /**
 * Size of the silhouette - relative to viewport
 * small: 60px, medium: 100px, large: 160px
 */
 size?: 'small' | 'medium' | 'large';
 /**
 * Color override - defaults to --ink-2
 */
 color?: string;
 /**
 * Optional additional className for positioning/layout
 */
 className?: string;
 /**
 * When true, adds animated celebration effect (raised arms)
 */
 animated?: boolean;
}

/**
 * El Público — BandManager's emotional signature silhouette
 *
 * The band logo contains an audience silhouette with arms raised.
 * This component represents that same moment: the connection between
 * performer and audience. Used in empty states (subtle, 10-14% opacity)
 * and celebration moments (more prominent, animated).
 *
 * Per Espectro §3: "La silueta del público con los brazos en alto es
 * la única parte del logo con carga emocional. Úsala."
 */
export const PublicoSilhouette: React.FC<PublicoSilhouetteProps> = ({
 opacity = 0.12,
 size = 'medium',
 color,
 className = '',
 animated = false,
}) => {
 const getTokenColor = (): string => {
 if (color) return color;
 if (typeof document === 'undefined') return 'rgba(100, 108, 120, 0.12)';
 const style = getComputedStyle(document.documentElement);
 const ink2 = style.getPropertyValue('--ink-2').trim();
 return ink2 || 'rgba(100, 108, 120, 0.12)';
 };

 const sizeMap = {
 small: { width: 60, height: 60 },
 medium: { width: 100, height: 100 },
 large: { width: 160, height: 160 },
 };

 const dims = sizeMap[size];
 const resolvedColor = getTokenColor();
 const svgColor = `rgba(${resolvedColor.includes('rgb') ? resolvedColor.match(/\d+/g)?.join(', ') : '100, 108, 120'}, ${opacity})`;

 return (
 <svg
 width={dims.width}
 height={dims.height}
 viewBox="0 0 100 100"
 xmlns="http://www.w3.org/2000/svg"
 className={`${className} ${animated ? 'animate-pulse' : ''}`}
 style={{}}
 >
 {/* Ground/stage line - subtle */}
 <line x1="10" y1="85" x2="90" y2="85" stroke={svgColor} strokeWidth="1" opacity="0.5" />

 {/* Central figure - body */}
 <circle cx="50" cy="45" r="12" fill={svgColor} />

 {/* Head */}
 <circle cx="50" cy="28" r="8" fill={svgColor} />

 {/* Left arm raised */}
 <path
 d="M 40 42 Q 25 25 22 12"
 stroke={svgColor}
 strokeWidth="4"
 fill="none"
 strokeLinecap="round"
 strokeLinejoin="round"
 />

 {/* Right arm raised */}
 <path
 d="M 60 42 Q 75 25 78 12"
 stroke={svgColor}
 strokeWidth="4"
 fill="none"
 strokeLinecap="round"
 strokeLinejoin="round"
 />

 {/* Left leg */}
 <line x1="45" y1="56" x2="42" y2="75" stroke={svgColor} strokeWidth="3.5" strokeLinecap="round" />

 {/* Right leg */}
 <line x1="55" y1="56" x2="58" y2="75" stroke={svgColor} strokeWidth="3.5" strokeLinecap="round" />

 {/* Left hand (raised fist outline) */}
 <circle cx="20" cy="10" r="3.5" fill="none" stroke={svgColor} strokeWidth="2" />

 {/* Right hand (raised fist outline) */}
 <circle cx="80" cy="10" r="3.5" fill="none" stroke={svgColor} strokeWidth="2" />

 {/* Surrounding crowd suggestion - subtle figures in background */}
 {/* Left figure background */}
 <circle cx="20" cy="50" r="9" fill={svgColor} opacity="0.6" />
 <circle cx="20" cy="30" r="6" fill={svgColor} opacity="0.6" />
 <path
 d="M 14 36 L 8 25"
 stroke={svgColor}
 strokeWidth="2.5"
 fill="none"
 strokeLinecap="round"
 opacity="0.6"
 />

 {/* Right figure background */}
 <circle cx="80" cy="50" r="9" fill={svgColor} opacity="0.6" />
 <circle cx="80" cy="30" r="6" fill={svgColor} opacity="0.6" />
 <path
 d="M 86 36 L 92 25"
 stroke={svgColor}
 strokeWidth="2.5"
 fill="none"
 strokeLinecap="round"
 opacity="0.6"
 />
 </svg>
 );
};

export default PublicoSilhouette;
