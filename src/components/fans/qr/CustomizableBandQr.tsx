import React, { useMemo } from 'react';
import QRCode from 'qrcode';
import { QrCustomConfig } from './qrCustomizationConfig';
import { QrMascotSvgGroup } from './QrMascots';

export interface CustomizableBandQrProps {
  value: string;
  size?: number;
  config: QrCustomConfig;
  bandName?: string;
  bandLogoUrl?: string;
  concertTitle?: string;
  dateCity?: string;
  id?: string;
  className?: string;
  showFrame?: boolean;
}

export const CustomizableBandQr: React.FC<CustomizableBandQrProps> = ({
  value,
  size = 280,
  config,
  bandName = 'Nuestra Banda',
  bandLogoUrl,
  concertTitle,
  dateCity,
  id = 'custom-band-qr-svg',
  className = '',
  showFrame = true,
}) => {
  // 1. Generar la matriz QR con nivel de corrección alto 'H' (recupera hasta un 30% del código)
  const qrMatrix = useMemo(() => {
    try {
      const qr = QRCode.create(value || 'https://bandmanager.io', {
        errorCorrectionLevel: 'H',
      });
      return qr.modules;
    } catch (err) {
      console.error('Error generating QR matrix:', err);
      return null;
    }
  }, [value]);

  if (!qrMatrix) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center bg-[var(--sunken)] rounded-[var(--r-m)] text-xs text-[var(--ink-2)]"
      >
        Cargando QR...
      </div>
    );
  }

  const moduleCount = qrMatrix.size;
  const padding = 3; // Quiet Zone estándar para máxima escaneabilidad
  const totalGrid = moduleCount + padding * 2;
  const vbSize = totalGrid * 10; // Espacio vectorial SVG de alta definición (ej. 430px)
  const moduleSize = 10;

  // Centro y radio reservado para la mascota/logo
  const hasMascot = config.mascot !== 'none';
  const centerModule = moduleCount / 2;
  // Radio de exclusión en módulos (para liberar espacio central sin tapar los datos clave)
  const cutoutRadiusModules = hasMascot ? Math.floor(moduleCount * 0.22) : 0;

  // Función para determinar si un módulo (r, c) está en uno de los 3 Finder Patterns (ojos de las esquinas)
  const isFinderPattern = (r: number, c: number) => {
    if (r < 8 && c < 8) return true;
    if (r < 8 && c >= moduleCount - 8) return true;
    if (r >= moduleCount - 8 && c < 8) return true;
    return false;
  };

  // Función para determinar si un módulo está dentro de la zona central de la mascota
  const isCenterCutout = (r: number, c: number) => {
    if (!hasMascot) return false;
    const dr = r - centerModule;
    const dc = c - centerModule;
    return Math.sqrt(dr * dr + dc * dc) <= cutoutRadiusModules;
  };

  // 2. Renderizado de los Módulos / Puntos según el estilo elegido
  const renderModules = () => {
    const elements: React.ReactNode[] = [];

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (isFinderPattern(r, c) || isCenterCutout(r, c)) continue;

        const isDark = Boolean(qrMatrix.get(r, c));
        if (!isDark) continue;

        const x = (c + padding) * moduleSize;
        const y = (r + padding) * moduleSize;
        const key = `m-${r}-${c}`;

        switch (config.dotStyle) {
          // Puntos circulares orgánicos
          case 'rounded':
            elements.push(
              <circle
                key={key}
                cx={x + moduleSize / 2}
                cy={y + moduleSize / 2}
                r={moduleSize * 0.42}
                fill="url(#qrGradient)"
              />
            );
            break;

          // Squircle / Cuadrados suaves modernos
          case 'squircle':
            elements.push(
              <rect
                key={key}
                x={x + 1}
                y={y + 1}
                width={moduleSize - 2}
                height={moduleSize - 2}
                rx={moduleSize * 0.35}
                fill="url(#qrGradient)"
              />
            );
            break;

          // Píxeles arcade 8-bit con sub-módulo
          case 'pixel':
            elements.push(
              <g key={key}>
                <rect
                  x={x + 0.5}
                  y={y + 0.5}
                  width={moduleSize - 1}
                  height={moduleSize - 1}
                  fill="url(#qrGradient)"
                />
                <rect
                  x={x + 2}
                  y={y + 2}
                  width={moduleSize - 4}
                  height={moduleSize - 4}
                  fill="url(#qrPixelHighlight)"
                  opacity="0.75"
                />
              </g>
            );
            break;

          // Diamantes a 45 grados
          case 'diamond':
            const cx = x + moduleSize / 2;
            const cy = y + moduleSize / 2;
            const s = moduleSize * 0.46;
            elements.push(
              <polygon
                key={key}
                points={`${cx},${cy - s} ${cx + s},${cy} ${cx},${cy + s} ${cx - s},${cy}`}
                fill="url(#qrGradient)"
              />
            );
            break;

          // Estrellas de 4 puntas
          case 'stars':
            const scx = x + moduleSize / 2;
            const scy = y + moduleSize / 2;
            const rExt = moduleSize * 0.48;
            const rInt = moduleSize * 0.16;
            elements.push(
              <polygon
                key={key}
                points={`
                  ${scx},${scy - rExt} 
                  ${scx + rInt},${scy - rInt} 
                  ${scx + rExt},${scy} 
                  ${scx + rInt},${scy + rInt} 
                  ${scx},${scy + rExt} 
                  ${scx - rInt},${scy + rInt} 
                  ${scx - rExt},${scy} 
                  ${scx - rInt},${scy - rInt}
                `}
                fill="url(#qrGradient)"
              />
            );
            break;

          // Surcos de vinilo
          case 'grooves':
            elements.push(
              <rect
                key={key}
                x={x + 1}
                y={y + 2}
                width={moduleSize - 2}
                height={moduleSize - 4}
                rx={2}
                fill="url(#qrGradient)"
              />
            );
            break;

          // Cuadros clásicos nítidos
          case 'classics':
          default:
            elements.push(
              <rect
                key={key}
                x={x}
                y={y}
                width={moduleSize}
                height={moduleSize}
                fill="url(#qrGradient)"
              />
            );
            break;
        }
      }
    }
    return elements;
  };

  // 3. Renderizado de un Finder Pattern (Ojo de esquina 7x7 módulos)
  const renderFinderEye = (startX: number, startY: number, eyeKey: string) => {
    const eyeSize = 7 * moduleSize; // 70px en viewBox
    const center = eyeSize / 2;
    const cx = startX + center;
    const cy = startY + center;

    switch (config.eyeStyle) {
      // 🦖 Ojo Dino / Garra Jurásica
      case 'dino':
        return (
          <g key={eyeKey}>
            <rect
              x={startX + 2}
              y={startY + 2}
              width={eyeSize - 4}
              height={eyeSize - 4}
              rx={16}
              fill="none"
              stroke="url(#qrEyeGradient)"
              strokeWidth="7"
            />
            <line x1={startX + 8} y1={startY + 8} x2={startX + 18} y2={startY + 18} stroke="#84cc16" strokeWidth="2.5" />
            <line x1={startX + eyeSize - 8} y1={startY + 8} x2={startX + eyeSize - 18} y2={startY + 18} stroke="#84cc16" strokeWidth="2.5" />
            <ellipse cx={cx} cy={cy + 2} rx="10" ry="12" fill="url(#qrEyeGradient)" />
            <circle cx={cx - 8} cy={cy - 10} r="3.5" fill="url(#qrEyeGradient)" />
            <circle cx={cx} cy={cy - 13} r="4" fill="url(#qrEyeGradient)" />
            <circle cx={cx + 8} cy={cy - 10} r="3.5" fill="url(#qrEyeGradient)" />
          </g>
        );

      // 🕹️ Ojo Pac-Man / Fantasma Arcade 80s
      case 'pacman':
        return (
          <g key={eyeKey}>
            <rect
              x={startX + 4}
              y={startY + 4}
              width={eyeSize - 8}
              height={eyeSize - 8}
              rx={6}
              fill="none"
              stroke="url(#qrEyeGradient)"
              strokeWidth="6"
            />
            <path
              d={`M${cx - 10} ${cy - 4} C${cx - 10} ${cy - 12} ${cx + 10} ${cy - 12} ${cx + 10} ${cy - 4} L${cx + 10} ${cy + 10} L${cx + 5} ${cy + 6} L${cx} ${cy + 10} L${cx - 5} ${cy + 6} L${cx - 10} ${cy + 10} Z`}
              fill="url(#qrEyeGradient)"
            />
            <circle cx={cx - 4} cy={cy - 4} r="2.5" fill="#ffffff" />
            <circle cx={cx + 4} cy={cy - 4} r="2.5" fill="#ffffff" />
          </g>
        );

      // ⚡ Ojo Hexagonal Cyberpunk
      case 'hexagon':
        return (
          <g key={eyeKey}>
            <polygon
              points={`
                ${cx},${startY + 2} 
                ${startX + eyeSize - 2},${startY + eyeSize * 0.25} 
                ${startX + eyeSize - 2},${startY + eyeSize * 0.75} 
                ${cx},${startY + eyeSize - 2} 
                ${startX + 2},${startY + eyeSize * 0.75} 
                ${startX + 2},${startY + eyeSize * 0.25}
              `}
              fill="none"
              stroke="url(#qrEyeGradient)"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <polygon
              points={`
                ${cx},${cy - 14} 
                ${cx + 12},${cy - 7} 
                ${cx + 12},${cy + 7} 
                ${cx},${cy + 14} 
                ${cx - 12},${cy + 7} 
                ${cx - 12},${cy - 7}
              `}
              fill="url(#qrEyeGradient)"
            />
          </g>
        );

      // 💀 Ojo Escudo / Rock Crest
      case 'shield':
        return (
          <g key={eyeKey}>
            <path
              d={`M${cx} ${startY + 2} L${startX + eyeSize - 4} ${startY + 16} C${startX + eyeSize - 4} ${startY + 50} ${cx} ${startY + eyeSize - 2} ${cx} ${startY + eyeSize - 2} C${cx} ${startY + eyeSize - 2} ${startX + 4} ${startY + 50} ${startX + 4} ${startY + 16} Z`}
              fill="none"
              stroke="url(#qrEyeGradient)"
              strokeWidth="6"
              strokeLinejoin="round"
            />
            <polygon
              points={`${cx},${cy - 12} ${cx + 12},${cy} ${cx},${cy + 12} ${cx - 12},${cy}`}
              fill="url(#qrEyeGradient)"
            />
          </g>
        );

      // ⭐ Ojo Estrella Rock
      case 'star':
        return (
          <g key={eyeKey}>
            <rect
              x={startX + 3}
              y={startY + 3}
              width={eyeSize - 6}
              height={eyeSize - 6}
              rx={18}
              fill="none"
              stroke="url(#qrEyeGradient)"
              strokeWidth="6"
            />
            <polygon
              points={`
                ${cx},${cy - 15} 
                ${cx + 4},${cy - 4} 
                ${cx + 15},${cy} 
                ${cx + 4},${cy + 4} 
                ${cx},${cy + 15} 
                ${cx - 4},${cy + 4} 
                ${cx - 15},${cy} 
                ${cx - 4},${cy - 4}
              `}
              fill="url(#qrEyeGradient)"
            />
          </g>
        );

      // 💿 Ojo Anillos de Vinilo
      case 'vinyl':
        return (
          <g key={eyeKey}>
            <circle cx={cx} cy={cy} r={eyeSize * 0.44} fill="none" stroke="url(#qrEyeGradient)" strokeWidth="6" />
            <circle cx={cx} cy={cy} r={eyeSize * 0.3} fill="none" stroke="url(#qrEyeGradient)" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx={cx} cy={cy} r={eyeSize * 0.18} fill="url(#qrEyeGradient)" />
          </g>
        );

      // 🔘 Ojo Redondo Moderno
      case 'rounded':
        return (
          <g key={eyeKey}>
            <rect
              x={startX + 3}
              y={startY + 3}
              width={eyeSize - 6}
              height={eyeSize - 6}
              rx={20}
              fill="none"
              stroke="url(#qrEyeGradient)"
              strokeWidth="6.5"
            />
            <circle cx={cx} cy={cy} r={eyeSize * 0.22} fill="url(#qrEyeGradient)" />
          </g>
        );

      // ⬛ Ojo Clásico Cuadrado
      case 'classic':
      default:
        return (
          <g key={eyeKey}>
            <rect
              x={startX}
              y={startY}
              width={eyeSize}
              height={eyeSize}
              fill="none"
              stroke="url(#qrEyeGradient)"
              strokeWidth="8"
            />
            <rect
              x={startX + 2 * moduleSize}
              y={startY + 2 * moduleSize}
              width={3 * moduleSize}
              height={3 * moduleSize}
              fill="url(#qrEyeGradient)"
            />
          </g>
        );
    }
  };

  // Posiciones de los 3 Finder Patterns
  const tlX = padding * moduleSize;
  const tlY = padding * moduleSize;
  const trX = (padding + moduleCount - 7) * moduleSize;
  const trY = padding * moduleSize;
  const blX = padding * moduleSize;
  const blY = (padding + moduleCount - 7) * moduleSize;

  // Centro exacto del QR para la mascota
  const emblemCenter = vbSize / 2;
  const emblemSize = Math.round(cutoutRadiusModules * 2 * moduleSize * 1.15);

  // Colores efectivos
  const primaryColor = config.primaryColor || '#6366f1';
  const secondaryColor = config.secondaryColor || '#a855f7';
  const bgColor = config.backgroundColor || '#0f172a';

  // 4. Renderizado del Marco / Frame exterior si está activo
  const renderFrameDecorations = () => {
    if (!showFrame || config.frameStyle === 'none') return null;

    const frameTitle = config.frameTitle || '⚡ ESCANEA CON TU MÓVIL ⚡';

    switch (config.frameStyle) {
      // 🦖 Marco Parque Jurásico / Rock Salvaje
      case 'dino_park':
        return (
          <div className="w-full bg-[#062817] border-2 border-[#10b981]/50 rounded-[var(--r-l)] p-3 text-center space-y-2 shadow-lg">
            <div className="flex items-center justify-center gap-2 text-xs font-black tracking-wider text-[#84cc16] font-display">
              <span>🦖</span>
              <span>{frameTitle}</span>
              <span>🦖</span>
            </div>
            {config.frameSubtitle && (
              <p className="text-[11px] text-[#34d399] font-sans">
                {config.frameSubtitle}
              </p>
            )}
          </div>
        );

      // 🕹️ Marco Máquina Recreativa Arcade 80s
      case 'arcade_cabinet':
        return (
          <div className="w-full bg-[#03071e] border-2 border-[#facc15] rounded-[var(--r-l)] p-3 text-center space-y-1.5 shadow-[0_0_15px_rgba(250,204,21,0.25)]">
            <div className="flex items-center justify-center gap-2 text-xs font-black tracking-widest text-[#facc15] font-mono">
              <span className="animate-pulse">▶</span>
              <span>{frameTitle}</span>
              <span className="animate-pulse">◀</span>
            </div>
            {config.frameSubtitle && (
              <p className="text-[10px] text-[#38bdf8] font-mono uppercase">
                {config.frameSubtitle}
              </p>
            )}
          </div>
        );

      // ⚡ Marco Neón Marquee / Cartel Luminoso
      case 'neon_marquee':
        return (
          <div className="w-full bg-[#0a0a1a] border-2 border-[#06b6d4] rounded-[var(--r-l)] p-3 text-center space-y-1.5 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
            <div className="flex items-center justify-center gap-2 text-xs font-black tracking-wider text-[#ec4899] font-display">
              <span className="text-[#06b6d4]">✦</span>
              <span>{frameTitle}</span>
              <span className="text-[#06b6d4]">✦</span>
            </div>
            {config.frameSubtitle && (
              <p className="text-[11px] text-[#a5f3fc] font-sans">
                {config.frameSubtitle}
              </p>
            )}
          </div>
        );

      // 💿 Marco Funda de Vinilo Edición Especial
      case 'vinyl_sleeve':
        return (
          <div className="w-full bg-[#17140b] border-2 border-[#eab308]/60 rounded-[var(--r-l)] p-3 text-center space-y-1.5 shadow-lg">
            <div className="flex items-center justify-center gap-2 text-xs font-bold tracking-widest text-[#fbbf24] font-serif uppercase">
              <span>★</span>
              <span>{frameTitle}</span>
              <span>★</span>
            </div>
            {config.frameSubtitle && (
              <p className="text-[11px] text-[#fef08a]/80 font-sans italic">
                {config.frameSubtitle}
              </p>
            )}
          </div>
        );

      // 🎟️ Marco Pase Backstage VIP
      case 'backstage_pass':
        return (
          <div className="w-full bg-[#1f132b] border-2 border-[#e879f9]/50 rounded-[var(--r-l)] p-3 text-center space-y-1.5 shadow-lg">
            <div className="flex items-center justify-center gap-2 text-xs font-black tracking-wider text-[#f472b6] font-display">
              <span>🎟️</span>
              <span>{frameTitle}</span>
              <span>🎟️</span>
            </div>
            {config.frameSubtitle && (
              <p className="text-[11px] text-[#fbcfe8] font-sans">
                {config.frameSubtitle}
              </p>
            )}
          </div>
        );

      // ⚡ Marco Estándar Concierto / Merch
      case 'concert_merch':
      default:
        return (
          <div className="w-full bg-[var(--surface)] border border-[var(--acc)]/30 rounded-[var(--r-l)] p-3 text-center space-y-1.5">
            <div className="flex items-center justify-center gap-2 text-xs font-black tracking-wider text-[var(--ink)] font-display">
              <span>⚡</span>
              <span>{frameTitle}</span>
              <span>⚡</span>
            </div>
            {config.frameSubtitle && (
              <p className="text-[11px] text-[var(--ink-2)] font-sans">
                {config.frameSubtitle}
              </p>
            )}
          </div>
        );
    }
  };

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      {/* Contenedor del SVG Vectorial */}
      <div
        id={id}
        style={{
          width: size,
          height: size,
          backgroundColor: bgColor,
        }}
        className={`relative p-3.5 rounded-[var(--r-l)] flex items-center justify-center shadow-xl overflow-hidden transition-all duration-300 ${
          config.showBackgroundGlow ? 'ring-2 ring-white/10' : ''
        }`}
      >
        {/* Glow decorativo de fondo */}
        {config.showBackgroundGlow && (
          <div
            className="absolute inset-0 opacity-25 blur-xl pointer-events-none"
            style={{
              background: `radial-gradient(circle at center, ${primaryColor} 0%, ${secondaryColor} 60%, transparent 80%)`,
            }}
          />
        )}

        <svg
          viewBox={`0 0 ${vbSize} ${vbSize}`}
          width="100%"
          height="100%"
          xmlns="http://www.w3.org/2000/svg"
          xmlnsXlink="http://www.w3.org/1999/xlink"
          className="relative z-10 overflow-visible"
        >
          <defs>
            {/* Degradado principal de los módulos */}
            <linearGradient id="qrGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>

            {/* Degradado para los ojos de las esquinas */}
            <linearGradient id="qrEyeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor={secondaryColor} />
            </linearGradient>

            {/* Resalte interior para píxeles arcade */}
            <linearGradient id="qrPixelHighlight" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="100%" stopColor={secondaryColor} stopOpacity="0.4" />
            </linearGradient>

            {/* Degradados de la mascota */}
            <linearGradient id="mascotGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={primaryColor} />
              <stop offset="100%" stopColor={secondaryColor} />
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

          {/* 1. Módulos / Puntos del QR */}
          {renderModules()}

          {/* 2. Los 3 Ojos de las esquinas */}
          {renderFinderEye(tlX, tlY, 'tl')}
          {renderFinderEye(trX, trY, 'tr')}
          {renderFinderEye(blX, blY, 'bl')}

          {/* 3. Mascota / Logotipo central con SVG vectorial puro integrado */}
          {hasMascot && (
            <g transform={`translate(${emblemCenter - emblemSize / 2}, ${emblemCenter - emblemSize / 2})`}>
              <QrMascotSvgGroup
                mascot={config.mascot}
                bandLogoUrl={bandLogoUrl}
                bandName={bandName}
                size={emblemSize}
                primaryColor={primaryColor}
                secondaryColor={secondaryColor}
                shape={config.logoBackgroundShape}
              />
            </g>
          )}
        </svg>
      </div>

      {/* 4. Marco inferior con título y llamada a la acción */}
      {renderFrameDecorations()}
    </div>
  );
};
