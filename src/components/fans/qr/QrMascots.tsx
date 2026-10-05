import React from 'react';
import { QrMascot } from './qrCustomizationConfig';

export interface QrMascotProps {
  mascot: QrMascot;
  bandLogoUrl?: string;
  bandName?: string;
  size?: number;
  primaryColor?: string;
  secondaryColor?: string;
  shape?: 'circle' | 'squircle' | 'diamond' | 'shield';
}

/**
 * Emblema vectorial puro (<g>) para incrustar directamente dentro de un SVG de Código QR
 * Garantiza 100% compatibilidad con exportación vectorial, imprentas, Illustrator y Canvas 4K.
 */
export const QrMascotSvgGroup: React.FC<QrMascotProps> = ({
  mascot,
  bandLogoUrl,
  bandName = 'Banda',
  size = 100,
  primaryColor = '#6366f1',
  secondaryColor = '#ec4899',
  shape = 'squircle',
}) => {
  if (mascot === 'none') return null;

  const scale = size / 100;

  // Fondo protector con forma
  const renderBackground = () => {
    switch (shape) {
      case 'circle':
        return <circle cx="50" cy="50" r="46" fill="#0f172a" stroke="url(#mascotGlow)" strokeWidth="3.5" />;
      case 'diamond':
        return <polygon points="50,4 96,50 50,96 4,50" fill="#0f172a" stroke="url(#mascotGlow)" strokeWidth="3.5" strokeLinejoin="round" />;
      case 'shield':
        return <path d="M50 4 L92 20 C92 65 50 96 50 96 C50 96 8 65 8 20 Z" fill="#0f172a" stroke="url(#mascotGlow)" strokeWidth="3.5" strokeLinejoin="round" />;
      case 'squircle':
      default:
        return <rect x="5" y="5" width="90" height="90" rx="24" fill="#0f172a" stroke="url(#mascotGlow)" strokeWidth="3.5" />;
    }
  };

  const renderIconContent = () => {
    switch (mascot) {
      // 🦖 DINOSAURIO ROCKERO (T-Rex con guitarra eléctrica, gafas de sol y cresta punk)
      case 'dino':
        return (
          <g transform="translate(14, 14) scale(0.72)">
            {/* Cuerpo del T-Rex */}
            <path
              d="M30 18 C30 8 46 6 56 12 C66 18 68 28 66 36 C64 42 58 46 54 48 C50 56 46 64 40 70 C36 74 28 78 20 74 C16 72 14 66 16 60 C18 56 22 52 24 48 C20 48 16 44 14 38 C12 30 18 22 30 18 Z"
              fill="#10b981"
            />
            {/* Cresta punk verde lima */}
            <path
              d="M32 14 L36 4 L42 12 L48 2 L52 10 L58 4 L60 14"
              fill="#84cc16"
              stroke="#047857"
              strokeWidth="1.5"
            />
            {/* Mandíbula abierta cantando */}
            <path
              d="M58 26 L76 24 C78 28 76 34 70 36 L58 34 Z"
              fill="#059669"
            />
            {/* Dientes afilados */}
            <polygon points="62,26 64,29 66,26 68,29 70,26" fill="#ffffff" />
            <polygon points="62,34 64,31 66,34 68,31 70,34" fill="#ffffff" />
            {/* Gafas de sol de rockstar */}
            <path
              d="M44 20 L58 18 C62 18 66 22 66 26 L52 28 C48 28 44 24 44 20 Z"
              fill="#1e1b4b"
              stroke="#fbbf24"
              strokeWidth="1.5"
            />
            <line x1="50" y1="22" x2="60" y2="22" stroke="#38bdf8" strokeWidth="1" strokeLinecap="round" />
            {/* Guitarra eléctrica en bandolera */}
            <g transform="translate(18, 28) rotate(-25)">
              {/* Mástil */}
              <rect x="2" y="24" width="56" height="5" rx="2" fill="#d97706" />
              {/* Clavijero */}
              <polygon points="56,22 66,23 64,30 56,29" fill="#b45309" />
              {/* Cuerpo Flying V */}
              <polygon points="4,10 24,26 4,42 14,26" fill="#ef4444" stroke="#facc15" strokeWidth="1.5" />
              {/* Pastillas y cuerdas */}
              <rect x="12" y="23" width="8" height="7" fill="#18181b" />
              <line x1="10" y1="26.5" x2="58" y2="26.5" stroke="#f8fafc" strokeWidth="1" />
            </g>
            {/* Brazos pequeños de T-Rex tocando */}
            <path d="M38 46 C42 46 46 44 48 40" stroke="#047857" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Notas musicales flotantes */}
            <circle cx="76" cy="12" r="3" fill="#facc15" />
            <path d="M79 12 L79 2 L86 4 L86 14" stroke="#facc15" strokeWidth="1.5" fill="none" />
            <circle cx="83" cy="14" r="3" fill="#facc15" />
          </g>
        );

      // 🕹️ PAC-MAN RETRO ARCADE 80s (Pac-Man amarillo + Fantasma Blinky pixel art)
      case 'pacman':
        return (
          <g transform="translate(12, 12) scale(0.76)">
            {/* Pac-Man abriendo la boca comiendo */}
            <path
              d="M38 48 A26 26 0 1 0 38 28 L24 38 Z"
              fill="#facc15"
              stroke="#ca8a04"
              strokeWidth="1.5"
            />
            {/* Ojo retro */}
            <circle cx="32" cy="22" r="3.5" fill="#03071e" />

            {/* Puntos de energía que va a comer */}
            <circle cx="12" cy="38" r="3" fill="#f43f5e" />
            <circle cx="2" cy="38" r="2.5" fill="#f43f5e" />

            {/* Fantasmita Blinky persiguiendo */}
            <g transform="translate(48, 16) scale(0.7)">
              <path
                d="M10 24 C10 10 34 10 34 24 L34 38 L30 34 L26 38 L22 34 L18 38 L14 34 L10 38 Z"
                fill="#ef4444"
              />
              <ellipse cx="18" cy="20" rx="4" ry="5" fill="#ffffff" />
              <ellipse cx="28" cy="20" rx="4" ry="5" fill="#ffffff" />
              <circle cx="16" cy="20" r="2" fill="#1e3a8a" />
              <circle cx="26" cy="20" r="2" fill="#1e3a8a" />
            </g>

            {/* Nota musical 8-bit */}
            <rect x="68" y="4" width="4" height="12" fill="#38bdf8" />
            <rect x="68" y="4" width="12" height="4" fill="#38bdf8" />
            <rect x="76" y="4" width="4" height="12" fill="#38bdf8" />
            <rect x="64" y="12" width="8" height="6" rx="2" fill="#38bdf8" />
            <rect x="72" y="12" width="8" height="6" rx="2" fill="#38bdf8" />
          </g>
        );

      // 💀 ROCK SKULL & HEADPHONES (Calavera con auriculares y llamas)
      case 'rock_skull':
        return (
          <g transform="translate(14, 12) scale(0.72)">
            {/* Auriculares diadema */}
            <path
              d="M12 46 C12 20 88 20 88 46"
              fill="none"
              stroke="#f97316"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Almohadillas auriculares */}
            <rect x="6" y="38" width="12" height="22" rx="6" fill="#ea580c" stroke="#facc15" strokeWidth="1.5" />
            <rect x="82" y="38" width="12" height="22" rx="6" fill="#ea580c" stroke="#facc15" strokeWidth="1.5" />

            {/* Calavera */}
            <path
              d="M26 38 C26 22 74 22 74 38 C74 48 70 56 64 60 L64 72 C64 76 60 78 50 78 C40 78 36 76 36 72 L36 60 C30 56 26 48 26 38 Z"
              fill="#f8fafc"
              stroke="#0f172a"
              strokeWidth="2"
            />
            {/* Cuencas de los ojos */}
            <ellipse cx="38" cy="42" rx="6.5" ry="8" fill="#09090b" />
            <ellipse cx="62" cy="42" rx="6.5" ry="8" fill="#09090b" />
            <circle cx="38" cy="40" r="2" fill="#ef4444" />
            <circle cx="62" cy="40" r="2" fill="#ef4444" />

            {/* Nariz */}
            <polygon points="50,50 46,57 54,57" fill="#09090b" />

            {/* Dientes */}
            <g transform="translate(40, 65)">
              <line x1="0" y1="0" x2="20" y2="0" stroke="#09090b" strokeWidth="2" />
              <line x1="4" y1="-4" x2="4" y2="6" stroke="#09090b" strokeWidth="1.5" />
              <line x1="10" y1="-4" x2="10" y2="6" stroke="#09090b" strokeWidth="1.5" />
              <line x1="16" y1="-4" x2="16" y2="6" stroke="#09090b" strokeWidth="1.5" />
            </g>
          </g>
        );

      // ⚡ RAYO ELÉCTRICO DE ALTO VOLTAJE
      case 'electric_bolt':
        return (
          <g transform="translate(18, 12) scale(0.68)">
            <polygon
              points="52,4 12,50 42,50 32,96 84,40 54,40"
              fill="url(#boltGradient)"
              stroke="#fef08a"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle cx="16" cy="30" r="3" fill="#38bdf8" />
            <circle cx="80" cy="68" r="3.5" fill="#f43f5e" />
          </g>
        );

      // 💿 DISCO DE VINILO
      case 'vinyl':
        return (
          <g transform="translate(10, 10) scale(0.8)">
            <circle cx="50" cy="50" r="44" fill="#18181b" stroke="#eab308" strokeWidth="2" />
            <circle cx="50" cy="50" r="38" fill="none" stroke="#27272a" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="32" fill="none" stroke="#27272a" strokeWidth="1.5" />
            <circle cx="50" cy="50" r="26" fill="none" stroke="#3f3f46" strokeWidth="1" />
            <circle cx="50" cy="50" r="18" fill="#f59e0b" stroke="#fef08a" strokeWidth="2" />
            <circle cx="50" cy="50" r="5" fill="#09090b" stroke="#eab308" strokeWidth="1.5" />
            <path d="M22 22 Q50 36 78 78" stroke="#ffffff" strokeWidth="1.5" strokeOpacity="0.4" fill="none" />
          </g>
        );

      // 📻 CASSETTE 90s MIXTAPE
      case 'cassette':
        return (
          <g transform="translate(14, 18) scale(0.72)">
            <rect x="4" y="6" width="92" height="60" rx="8" fill="#3b0764" stroke="#f472b6" strokeWidth="2.5" />
            <rect x="14" y="14" width="72" height="34" rx="4" fill="#fef08a" />
            <rect x="22" y="24" width="56" height="18" rx="4" fill="#1e1b4b" />
            <circle cx="34" cy="33" r="6" fill="#f8fafc" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="66" cy="33" r="6" fill="#f8fafc" stroke="#38bdf8" strokeWidth="2" />
            <circle cx="34" cy="33" r="2" fill="#09090b" />
            <circle cx="66" cy="33" r="2" fill="#09090b" />
            <text x="50" y="21" fill="#4c0519" fontSize="6" fontWeight="bold" textAnchor="middle" fontFamily="sans-serif">
              A • SIDE (LIVE)
            </text>
            <circle cx="8" cy="10" r="1.5" fill="#f472b6" />
            <circle cx="92" cy="10" r="1.5" fill="#f472b6" />
            <circle cx="8" cy="62" r="1.5" fill="#f472b6" />
            <circle cx="92" cy="62" r="1.5" fill="#f472b6" />
          </g>
        );

      // 🎸 GUITARRA ELÉCTRICA
      case 'guitar':
        return (
          <g transform="translate(14, 12) scale(0.72)">
            <rect x="46" y="4" width="8" height="55" rx="3" fill="#d97706" />
            <polygon points="44,2 56,2 58,14 42,14" fill="#92400e" stroke="#facc15" strokeWidth="1" />
            <path
              d="M32 50 C24 54 22 66 26 74 C30 82 40 88 50 88 C60 88 70 82 74 74 C78 66 76 54 68 50 C66 42 62 40 60 48 L40 48 C38 40 34 42 32 50 Z"
              fill="#ef4444"
              stroke="#fbbf24"
              strokeWidth="2.5"
            />
            <path d="M42 56 C38 60 38 68 44 74 C48 78 54 78 56 74 C58 68 58 60 54 56 Z" fill="#f8fafc" />
            <rect x="44" y="60" width="12" height="3" rx="1" fill="#09090b" />
            <rect x="44" y="66" width="12" height="3" rx="1" fill="#09090b" />
          </g>
        );

      // 🎤 MICRÓFONO VINTAGE
      case 'microphone':
        return (
          <g transform="translate(18, 12) scale(0.68)">
            <rect x="24" y="10" width="52" height="56" rx="20" fill="#e2e8f0" stroke="#0284c7" strokeWidth="3" />
            <line x1="26" y1="24" x2="74" y2="24" stroke="#475569" strokeWidth="2" />
            <line x1="26" y1="38" x2="74" y2="38" stroke="#475569" strokeWidth="2" />
            <line x1="26" y1="52" x2="74" y2="52" stroke="#475569" strokeWidth="2" />
            <line x1="50" y1="12" x2="50" y2="64" stroke="#475569" strokeWidth="3" />
            <rect x="42" y="66" width="16" height="18" rx="4" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
            <polygon points="30,84 70,84 64,96 36,96" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
          </g>
        );

      // 🪐 SATURNO CÓSMICO
      case 'saturn':
        return (
          <g transform="translate(12, 12) scale(0.76)">
            <path d="M10 50 Q50 24 90 50" stroke="#f472b6" strokeWidth="6" fill="none" opacity="0.6" />
            <circle cx="50" cy="50" r="28" fill="url(#saturnGradient)" stroke="#c084fc" strokeWidth="2" />
            <path d="M26 44 Q50 56 74 44" stroke="#7c3aed" strokeWidth="2.5" fill="none" />
            <path d="M24 54 Q50 66 76 54" stroke="#db2777" strokeWidth="2.5" fill="none" />
            <path d="M6 52 Q50 78 94 52" stroke="#38bdf8" strokeWidth="6" fill="none" />
            <polygon points="20,16 22,22 28,24 22,26 20,32 18,26 12,24 18,22" fill="#facc15" />
            <polygon points="80,72 81,76 85,77 81,78 80,82 79,78 75,77 79,76" fill="#facc15" />
          </g>
        );

      // 🐱 GATO CYBERPUNK
      case 'cyber_cat':
        return (
          <g transform="translate(14, 12) scale(0.72)">
            <polygon points="20,32 12,6 36,22" fill="#06b6d4" stroke="#ec4899" strokeWidth="2" />
            <polygon points="80,32 88,6 64,22" fill="#06b6d4" stroke="#ec4899" strokeWidth="2" />
            <polygon points="22,28 16,12 32,22" fill="#f43f5e" />
            <polygon points="78,28 84,12 68,22" fill="#f43f5e" />
            <circle cx="50" cy="50" r="32" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />
            <path
              d="M24 44 C24 38 76 38 76 44 L72 56 C72 58 64 60 50 60 C36 60 28 58 28 56 Z"
              fill="#ec4899"
              stroke="#facc15"
              strokeWidth="2"
            />
            <line x1="32" y1="46" x2="68" y2="46" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            <polygon points="50,65 47,68 53,68" fill="#f43f5e" />
            <line x1="18" y1="62" x2="38" y2="64" stroke="#06b6d4" strokeWidth="1.5" />
            <line x1="16" y1="70" x2="38" y2="68" stroke="#06b6d4" strokeWidth="1.5" />
            <line x1="82" y1="62" x2="62" y2="64" stroke="#06b6d4" strokeWidth="1.5" />
            <line x1="84" y1="70" x2="62" y2="68" stroke="#06b6d4" strokeWidth="1.5" />
          </g>
        );

      // 🖼️ LOGO OFICIAL DE LA BANDA
      case 'band_logo':
      default:
        if (bandLogoUrl) {
          return (
            <g transform="translate(12, 12)">
              <clipPath id="bandLogoClip">
                <rect x="0" y="0" width="76" height="76" rx="18" />
              </clipPath>
              <image
                href={bandLogoUrl}
                x="0"
                y="0"
                width="76"
                height="76"
                preserveAspectRatio="xMidYMid meet"
                clipPath="url(#bandLogoClip)"
              />
            </g>
          );
        }
        const initials = (bandName || 'BM')
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase();
        return (
          <g transform="translate(10, 10)">
            <text
              x="40"
              y="52"
              fill="url(#mascotGlow)"
              fontSize="28"
              fontWeight="900"
              textAnchor="middle"
              fontFamily="system-ui, sans-serif"
              letterSpacing="1"
            >
              {initials}
            </text>
            <circle cx="40" cy="40" r="32" fill="none" stroke="url(#mascotGlow)" strokeWidth="2" strokeDasharray="4 3" />
          </g>
        );
    }
  };

  return (
    <g transform={`scale(${scale})`}>
      {/* Fondo protector */}
      {renderBackground()}

      {/* Ilustración / Logo */}
      {renderIconContent()}
    </g>
  );
};

export const QrMascotEmblem: React.FC<QrMascotProps> = (props) => {
  const size = props.size || 64;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="overflow-visible drop-shadow-md"
    >
      <defs>
        <linearGradient id="mascotGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={props.primaryColor || '#6366f1'} />
          <stop offset="100%" stopColor={props.secondaryColor || '#ec4899'} />
        </linearGradient>
        <linearGradient id="boltGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fef08a" />
          <stop offset="50%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
        <radialGradient id="saturnGradient" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="60%" stopColor="#818cf8" />
          <stop offset="100%" stopColor="#4338ca" />
        </radialGradient>
      </defs>

      <QrMascotSvgGroup {...props} size={100} />
    </svg>
  );
};
