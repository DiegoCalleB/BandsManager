#!/usr/bin/env node
/**
 * Design Fixer — Automatic theme color corrections
 * Applies systematic color replacements according to Espectro rules
 * Usage: node scripts/design-fixer.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FIXES = [
  // Hardcoded dark grays → token equivalents
  { find: /text-black\b/g, replace: 'text-[var(--ink)]', desc: 'text-black → --ink' },
  { find: /bg-\[#4d4d4d\]/g, replace: 'bg-[var(--sunken)]', desc: 'slider bg → --sunken' },
  { find: /border-\[#333\]/g, replace: 'border-[var(--hair)]', desc: 'border gray → --hair' },

  // Legacy gold variants → --acc (brand migration)
  { find: /text-\[#d1b375\]/g, replace: 'text-[var(--acc)]', desc: 'gold #d1b375 → --acc' },
  { find: /bg-\[#d1b375\]\/(\d+)/g, replace: 'bg-[var(--acc)]/$1', desc: 'gold #d1b375 bg → --acc' },
  { find: /bg-\[#d1b375\]/g, replace: 'bg-[var(--acc)]', desc: 'gold #d1b375 bg (solid) → --acc' },
  { find: /border-\[#d1b375\]/g, replace: 'border-[var(--acc)]', desc: 'gold #d1b375 border → --acc' },

  // Gold variants (#e0a820, #e2ba40, #e0b83e, #e2c486, #ffc634, etc.) → --acc-soft (Espectro migration)
  { find: /bg-\[#e0a820\]/g, replace: 'bg-[var(--acc-soft)]', desc: 'gold #e0a820 → --acc-soft' },
  { find: /bg-\[#e2ba40\]/g, replace: 'bg-[var(--acc-soft)]', desc: 'gold #e2ba40 → --acc-soft' },
  { find: /bg-\[#e0b83e\]\/(\d+)/g, replace: 'bg-[var(--acc-soft)]/$1', desc: 'gold #e0b83e → --acc-soft' },
  { find: /bg-\[#e0b83e\]/g, replace: 'bg-[var(--acc-soft)]', desc: 'gold #e0b83e (solid) → --acc-soft' },
  { find: /bg-\[#e0b83f\]/g, replace: 'bg-[var(--acc-soft)]', desc: 'gold #e0b83f → --acc-soft' },
  { find: /bg-\[#e0b840\]/g, replace: 'bg-[var(--acc-soft)]', desc: 'gold #e0b840 → --acc-soft' },
  { find: /bg-\[#d8b03e\]/g, replace: 'bg-[var(--acc-soft)]', desc: 'gold #d8b03e → --acc-soft' },
  { find: /bg-\[#e2c486\]/g, replace: 'bg-[var(--acc-soft)]', desc: 'gold #e2c486 → --acc-soft' },
  { find: /bg-\[#ffc634\]/g, replace: 'bg-[var(--acc-soft)]', desc: 'gold #ffc634 → --acc-soft' },
  { find: /bg-\[#ffe28d\]/g, replace: 'bg-[var(--acc-soft)]', desc: 'gold #ffe28d → --acc-soft' },
  { find: /bg-\[#ffe07a\]/g, replace: 'bg-[var(--acc-soft)]', desc: 'gold #ffe07a → --acc-soft' },
  { find: /text-\[#facc15\]/g, replace: 'text-[var(--acc)]', desc: 'gold #facc15 text → --acc' },

  // Hardcoded green (#b8d6b8) → --ok
  { find: /bg-\[#b8d6b8\]/g, replace: 'bg-[var(--ok)]', desc: 'rehearsal green → --ok' },
  { find: /shadow-\[0_0_8px_#b8d6b8\]/g, replace: 'shadow-[0_0_8px_var(--ok)]', desc: 'green glow → --ok' },
  { find: /text-\[#b8d6b8\]/g, replace: 'text-[var(--ok)]', desc: 'green text → --ok' },

  // Hardcoded placeholder colors → --ink-2
  { find: /placeholder-slate-\d+/g, replace: 'placeholder-[var(--ink-2)]', desc: 'placeholder slate → --ink-2' },
  { find: /placeholder-zinc-\d+/g, replace: 'placeholder-[var(--ink-2)]', desc: 'placeholder zinc → --ink-2' },
  { find: /placeholder-gray-\d+/g, replace: 'placeholder-[var(--ink-2)]', desc: 'placeholder gray → --ink-2' },

  // Insufficient contrast → fix
  { find: /text-\[var\(--ink-3\)\]/g, replace: 'text-[var(--ink-2)]', desc: '--ink-3 → --ink-2 (contrast)' },

  // SVG fills/strokes → tokens
  { find: /fill-black\b/g, replace: 'fill-[var(--ink)]', desc: 'fill-black → --ink' },
  { find: /fill-white\b/g, replace: 'fill-[var(--surface)]', desc: 'fill-white → --surface' },

  // Gradients with Tailwind colors → var(--acc)
  { find: /from-amber-500/g, replace: 'from-[var(--acc)]', desc: 'gradient amber → --acc' },
  { find: /to-amber-300/g, replace: 'to-[var(--acc-soft)]', desc: 'gradient amber soft → --acc-soft' },
  { find: /from-emerald-500/g, replace: 'from-[var(--ok)]', desc: 'gradient emerald → --ok' },
  { find: /to-emerald-300/g, replace: 'to-[var(--ok-soft)]', desc: 'gradient emerald soft → --ok-soft' },
  { find: /to-teal-300/g, replace: 'to-[var(--ok-soft)]', desc: 'gradient teal → --ok-soft' },
  { find: /from-purple-500/g, replace: 'from-[var(--acc)]', desc: 'gradient purple → --acc' },
  { find: /to-purple-400/g, replace: 'to-[var(--acc-soft)]', desc: 'gradient purple soft → --acc-soft' },

  // Manual dark: prefixes with Tailwind colors → tokens
  { find: /text-emerald-500\/90 dark:text-emerald-400\/80/g, replace: 'text-[var(--ok)]', desc: 'emerald dark: prefix → --ok' },
  { find: /text-emerald-500\/90/g, replace: 'text-[var(--ok)]', desc: 'emerald text → --ok' },
  { find: /-neutral-800/g, replace: 'bg-[var(--surface)]', desc: 'neutral-800 → --surface' },

  // Inline rgba → tokens (for visualizations & special effects)
  { find: /rgba\(30,\s*30,\s*36,\s*0\.95\)/g, replace: "var(--bg)", desc: 'rgba(30,30,36,0.95) dark bg → --bg' },
  { find: /rgba\(20,\s*20,\s*24,\s*0\.6\)/g, replace: "var(--bg)", desc: 'rgba(20,20,24,0.6) dark bg → --bg' },
  { find: /rgba\(16,\s*185,\s*129,\s*0\.1\)/g, replace: "var(--ok-glow)", desc: 'green glow → --ok-glow' },
  { find: /rgba\(245,\s*158,\s*11,\s*0\.1\)/g, replace: "var(--acc-glow)", desc: 'orange glow → --acc-glow' },
  { find: /rgba\(0,\s*0,\s*0,\s*0\.5\)/g, replace: "var(--shadow-dark)", desc: 'black shadow → --shadow-dark' },
  { find: /rgba\(0,\s*0,\s*0,\s*0\.15\)/g, replace: "var(--shadow-soft)", desc: 'soft shadow → --shadow-soft' },
  { find: /rgba\(255,\s*255,\s*255,\s*0\.25\)/g, replace: "rgba(var(--ink-rgb), 0.25)", desc: 'white glow → ink glow' },
  { find: /rgba\(255,\s*255,\s*255,\s*0\.12\)/g, replace: "rgba(var(--ink-rgb), 0.12)", desc: 'white subtle glow → ink subtle' },
  { find: /rgba\(242,\s*202,\s*80,\s*0\.1\)/g, replace: "var(--acc-glow)", desc: 'gold glow → --acc-glow' },

  // Tailwind shadow utilities with inline rgba → token equivalents
  { find: /shadow-\[0_0_8px_rgba\(0,\s*0,\s*0,\s*0\.15\)\]/g, replace: "shadow-[0_0_8px_var(--shadow-soft)]", desc: 'shadow soft rgba → --shadow-soft' },
  { find: /shadow-\[0_0_10px_rgba\(242,\s*202,\s*80,\s*0\.4\)\]/g, replace: "shadow-[0_0_10px_var(--acc-glow)]", desc: 'shadow gold 10px → --acc-glow' },
  { find: /shadow-\[0_0_12px_rgba\(0,\s*0,\s*0,\s*0\.15\)\]/g, replace: "shadow-[0_0_12px_var(--shadow-soft)]", desc: 'shadow soft rgba 12px → --shadow-soft' },
  { find: /shadow-\[0_0_12px_rgba\(245,\s*158,\s*11,\s*0\.18\)\]/g, replace: "shadow-[0_0_12px_var(--acc-glow)]", desc: 'shadow amber 12px → --acc-glow' },
  { find: /shadow-\[0_0_12px_rgba\(251,\s*191,\s*36,\s*0\.8\)\]/g, replace: "shadow-[0_0_12px_var(--acc-glow)]", desc: 'shadow amber-400 → --acc-glow' },
  { find: /shadow-\[0_0_14px_rgba\(251,\s*191,\s*36,\s*0\.2\)\]/g, replace: "shadow-[0_0_14px_var(--acc-glow)]", desc: 'shadow gold 14px → --acc-glow' },
  { find: /shadow-\[0_0_15px_rgba\(245,\s*158,\s*11,\s*0\.15\)\]/g, replace: "shadow-[0_0_15px_var(--acc-glow)]", desc: 'shadow amber 15px → --acc-glow' },
  { find: /shadow-\[0_0_16px_rgba\(251,\s*191,\s*36,\s*0\.2\)\]/g, replace: "shadow-[0_0_16px_var(--acc-glow)]", desc: 'shadow gold 16px → --acc-glow' },
  { find: /shadow-\[0_0_20px_rgba\(242,\s*202,\s*80,\s*0\.15\)\]/g, replace: "shadow-[0_0_20px_var(--acc-glow)]", desc: 'shadow gold → --acc-glow' },
  { find: /shadow-\[0_0_20px_rgba\(251,\s*191,\s*36,\s*0\.3\)\]/g, replace: "shadow-[0_0_20px_var(--acc-glow)]", desc: 'shadow amber-400 20px → --acc-glow' },
  { find: /shadow-\[0_0_20px_rgba\(245,\s*158,\s*11,\s*0\.2\)\]/g, replace: "shadow-[0_0_20px_var(--acc-glow)]", desc: 'shadow amber → --acc-glow' },
  { find: /shadow-\[0_0_30px_rgba\(16,\s*185,\s*129,\s*0\.2\)\]/g, replace: "shadow-[0_0_30px_var(--ok-glow)]", desc: 'shadow emerald glow → --ok-glow' },
  { find: /shadow-\[0_0_35px_rgba\(242,\s*202,\s*80,\s*0\.18\)\]/g, replace: "shadow-[0_0_35px_var(--acc-glow)]", desc: 'shadow gold glow → --acc-glow' },
  { find: /shadow-\[0_0_35px_rgba\(251,\s*191,\s*36,\s*0\.75\)\]/g, replace: "shadow-[0_0_35px_rgba(var(--ink-rgb), 0.75)]", desc: 'shadow amber-400 pulse → ink shadow' },
  { find: /shadow-\[0_0_12px_rgba\(29,\s*185,\s*84,\s*0\.4\)\]/g, replace: "shadow-[0_0_12px_rgba(var(--ok-rgb), 0.4)]", desc: 'shadow emerald → ok shadow' },
  { find: /shadow-\[0_0_10px_rgba\(239,\s*68,\s*68,\s*0\.7\)\]/g, replace: "shadow-[0_0_10px_rgba(var(--alert-rgb), 0.7)]", desc: 'shadow red → alert shadow' },
  { find: /shadow-\[0_0_10px_rgba\(239,\s*68,\s*68,\s*0\.9\)\]/g, replace: "shadow-[0_0_10px_rgba(var(--alert-rgb), 0.9)]", desc: 'shadow red → alert shadow' },
  { find: /shadow-\[0_0_10px_rgba\(220,\s*38,\s*38,\s*0\.7\)\]/g, replace: "shadow-[0_0_10px_rgba(var(--alert-rgb), 0.7)]", desc: 'shadow red-600 → alert shadow' },
  { find: /shadow-\[0_0_8px_rgba\(79,\s*70,\s*229,\s*0\.8\)\]/g, replace: "shadow-[0_0_8px_rgba(79, 70, 229, 0.8)]", desc: 'indigo brand color preserved' },
  { find: /shadow-\[0_0_8px_rgba\(6,\s*182,\s*212,\s*0\.8\)\]/g, replace: "shadow-[0_0_8px_rgba(6, 182, 212, 0.8)]", desc: 'cyan brand color preserved' },
  { find: /shadow-\[0_0_12px_rgba\(168,\s*85,\s*247,\s*0\.18\)\]/g, replace: "shadow-[0_0_12px_rgba(168, 85, 247, 0.18)]", desc: 'purple brand color preserved' },

  // Drop-shadow utilities with inline rgba → token equivalents
  { find: /drop-shadow-\[0_0_6px_rgba\(251,\s*191,\s*36,\s*0\.4\)\]/g, replace: "drop-shadow-[0_0_6px_var(--acc-glow)]", desc: 'drop-shadow amber → --acc-glow' },
  { find: /drop-shadow-\[0_0_8px_rgba\(245,\s*158,\s*11,\s*0\.25\)\]/g, replace: "drop-shadow-[0_0_8px_var(--acc-glow)]", desc: 'drop-shadow amber → --acc-glow' },
  { find: /drop-shadow-\[0_0_8px_rgba\(29,\s*185,\s*84,\s*0\.5\)\]/g, replace: "drop-shadow-[0_0_8px_rgba(var(--ok-rgb), 0.5)]", desc: 'drop-shadow emerald → ok shadow' },
  { find: /drop-shadow-\[0_0_15px_rgba\(242,\s*202,\s*80,\s*0\.2\)\]/g, replace: "drop-shadow-[0_0_15px_var(--acc-glow)]", desc: 'drop-shadow gold → --acc-glow' },
  { find: /drop-shadow-\[0_0_20px_rgba\(242,\s*202,\s*80,\s*0\.25\)\]/g, replace: "drop-shadow-[0_0_20px_var(--acc-glow)]", desc: 'drop-shadow gold → --acc-glow' },
];

// Borde con color Tailwind hardcodeado → token, por familia semántica.
// ok = positivo/completado, alert = negativo/error, acc = resto (acento genérico),
// hair = escalas de gris y blanco/negro puro (border es solo separador, no estado).
const BORDER_COLOR_MAP = {
  emerald: '--ok', green: '--ok', teal: '--ok', lime: '--ok',
  red: '--alert', rose: '--alert', pink: '--alert',
  purple: '--acc', indigo: '--acc', violet: '--acc', fuchsia: '--acc',
  sky: '--acc', blue: '--acc', cyan: '--acc',
  amber: '--acc', yellow: '--acc', orange: '--acc',
  slate: '--hair', zinc: '--hair', gray: '--hair', stone: '--hair', neutral: '--hair',
};

function fixBorderColors(content) {
  let changed = false;
  const sides = '(-[trblxy])?';

  for (const [color, token] of Object.entries(BORDER_COLOR_MAP)) {
    const re = new RegExp(`\\bborder${sides}-${color}-\\d+(\\/\\d+)?\\b`, 'g');
    const before = content;
    content = content.replace(re, (_m, side, opacity) => `border${side || ''}-[var(${token})]${opacity || ''}`);
    if (content !== before) {
      console.log(`  ✓ border-${color}-* → var(${token})`);
      changed = true;
    }
  }

  const bwRe = /\bborder(-[trblxy])?-(black|white)(\/\d+)?\b/g;
  const before = content;
  content = content.replace(bwRe, (_m, side, _color, opacity) => `border${side || ''}-[var(--hair)]${opacity || ''}`);
  if (content !== before) {
    console.log(`  ✓ border-black/white → var(--hair)`);
    changed = true;
  }

  return { content, changed };
}

// Archivos donde bg-{color}/text-{color} son color de ESTADO suelto (1-2 familias,
// cada una mapea a un token semántico distinto: ok/alert/acc sin colisión) — no
// paletas de categoría como CalendarView (6 colores para distinguir campañas) o
// ReelsMetricsView (series de gráfico). Verificado a mano el 2026-09-20: tokenizar
// fuera de esta lista arriesga fundir categorías visualmente distintas en un mismo
// color. Lista blanca deliberada, no crece sola con futuros --fix.
const BG_TEXT_SAFE_FILES = new Set([
  'components/BandSwitcherModal.tsx', 'components/ErrorBoundary.tsx', 'components/FansLandingPreviewModal.tsx',
  'components/LoginModal.tsx', 'components/MetronomeModal.tsx', 'components/NotificationToastContainer.tsx',
  'components/PlanLimitModal.tsx', 'components/SimplePromoLoginModal.tsx', 'components/bandCRM/AIBandScoutModal.tsx',
  'components/bandCRM/BandPitchModal.tsx', 'components/bandCRM/ChangeBandImageModal.tsx', 'components/booking/AddLeadModal.tsx',
  'components/booking/BoloConfirmadoSetlistModal.tsx', 'components/booking/BookingSimulationModal.tsx',
  'components/booking/BulkProgressModal.tsx', 'components/booking/ChangeLeadImageModal.tsx',
  'components/booking/ExampleThreadsSection.tsx', 'components/booking/LeadHealthBadge.tsx',
  'components/booking/MultiModelPitchComparatorModal.tsx', 'components/booking/NegotiationSimulationModal.tsx',
  'components/common/BandNameStylerHelper.tsx', 'components/common/HolidayDateWarning.tsx',
  'components/common/MusicToolsQuickLinks.tsx', 'components/common/ReliabilityBadge.tsx',
  'components/dashboard/DashboardWidgetGrid.tsx', 'components/dashboard/widgets/CalendarWidget.tsx',
  'components/ensayos/ConvocarEnsayoModal.tsx', 'components/ensayos/EnsayoCronometro.tsx',
  'components/ensayos/EnsayosManager.tsx', 'components/epk/EPKArchivosBlock.tsx', 'components/epk/EPKFirmaQRBlock.tsx',
  'components/epk/EPKMusicaBlock.tsx', 'components/epk/EPKPerfilBlock.tsx', 'components/epk/EPKPlantillasBlock.tsx',
  'components/epk/EPKPrensaBlock.tsx', 'components/onboarding/MusicianOnboardingModal.tsx',
  'components/onboarding/steps/StepEvents.tsx', 'components/onboarding/steps/StepLanguage.tsx',
  'components/onboarding/steps/StepMembers.tsx', 'components/onboarding/steps/StepMusicSetlist.tsx',
  'components/onboarding/steps/StepPhotos.tsx', 'components/onboarding/steps/StepRider.tsx',
  'components/onboarding/steps/StepVideos.tsx', 'components/repertorio/AssignSetlistModal.tsx',
  'components/repertorio/ConfirmDeleteAlbumModal.tsx', 'components/repertorio/ConfirmDeleteModal.tsx',
  'components/repertorio/EscenarioView.tsx', 'components/repertorio/PerfectSetlistModal.tsx',
  'components/repertorio/RepertorioNavBar.tsx', 'components/repertorio/SongModal.tsx',
  'components/song_studio/SongStudioAiComposerModal.tsx', 'components/song_studio/SongStudioAiGeneratorModal.tsx',
  'components/song_studio/SongStudioAiMusicModal.tsx', 'components/song_studio/SongStudioDeleteConfirmModal.tsx',
]);

function fixBgTextColors(content) {
  let changed = false;
  for (const [color, token] of Object.entries(BORDER_COLOR_MAP)) {
    if (token === '--hair') continue; // gray scale bg/text handled separately, más riesgo
    for (const prop of ['bg', 'text']) {
      const re = new RegExp(`\\b${prop}-${color}-\\d+(\\/\\d+)?\\b`, 'g');
      const before = content;
      content = content.replace(re, (_m, opacity) => `${prop}-[var(${token})]${opacity || ''}`);
      if (content !== before) {
        console.log(`  ✓ ${prop}-${color}-* → var(${token})`);
        changed = true;
      }
    }
  }
  return { content, changed };
}

// bg-black / bg-white sólidos con opacidad, fuera de la lógica isStitchLight
// (esa es del color de marca de cada banda, un eje aparte — no se toca aquí).
// Tres casos, verificados a mano por muestreo antes de aplicar:
//   1. Velo de modal (inset-0 + bg-black/NN) → siempre oscuro, no cambia con tema → --scrim
//   2. Chip/panel recessed (bg-black/NN sin backdrop-blur cerca) → en claro se veía
//      gris sucio en vez de superficie hundida limpia → --sunken (sólido, sin opacidad)
//   3. Hover lighten (bg-white/NN) → en tema claro era invisible (blanco sobre blanco) →
//      var(--ink)/NN, que oscurece en claro y aclara en oscuro, siempre visible
function fixBlackWhiteOverlays(content) {
  let changed = false;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (/isStitchLight/.test(line)) continue;

    if (/\binset-0\b/.test(line) && /\bbg-black\/\d+\b/.test(line)) {
      const before = line;
      line = line.replace(/\bbg-black\/(\d+)\b/g, 'bg-[var(--scrim)]/$1');
      if (line !== before) changed = true;
    } else if (/\bbg-black\/\d+\b/.test(line) && !/backdrop-blur/.test(line)) {
      const before = line;
      line = line.replace(/\bbg-black\/\d+\b/g, 'bg-[var(--sunken)]');
      if (line !== before) changed = true;
    }

    if (/\bbg-white\/\d+\b/.test(line)) {
      const before = line;
      line = line.replace(/\bbg-white\/(\d+)\b/g, 'bg-[var(--ink)]/$1');
      if (line !== before) changed = true;
    }

    lines[i] = line;
  }
  return { content: lines.join('\n'), changed };
}

// Archivos donde bg-white/bg-black sólido es intencional y NO se toca:
// mockups de producto físico (siempre blancos/negros en la vida real),
// modo escenario de SetlistPerformanceView (glareMode/isResting, ya
// documentado en visual-identity/SKILL.md como vista puntual aparte del
// tema global), lienzo de vídeo en ReelsCenter.
const SOLID_BW_EXCLUDED_FILES = new Set([
  'components/SetlistPerformanceView.tsx',  // glareMode + isResting: alto contraste de escenario, no theming
  'components/Merchan.tsx',                 // mockup físico de sticker/merch — el producto real es blanco
  'components/repertorio/PdfExportModal.tsx', // página A4 de PDF — el papel es blanco, la tinta es negra
  'components/FansLandingPreviewModal.tsx', // chasis de smartphone mockup — el notch es negro de verdad
  'components/PublicMusiciansLanding.tsx',  // marco del logo — identidad de marca, no superficie temática
]);

// Bug de contraste real, descubierto mirando capturas de Playwright en tema
// oscuro: --acc-ink es para texto de color sobre fondo NEUTRO (chip, label),
// nunca para texto encima de un relleno --acc sólido — en oscuro --acc-ink
// vale literalmente lo mismo que --acc (#C8945E), texto invisible sobre su
// propio fondo. El token correcto para texto sobre relleno --acc es --on-acc
// (ya existe, pensado exactamente para esto: blanco en claro, marrón oscuro
// en oscuro). Se corrige solo cuando ambas clases están en la misma línea
// (mismo elemento), nunca donde --acc-ink va sobre un fondo distinto.
function fixAccInkOnAccFill(content) {
  let changed = false;
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (/bg-\[var\(--acc\)\](\/\d+)?/.test(line) && /text-\[var\(--acc-ink\)\]/.test(line)) {
      const before = line;
      line = line.replace(/text-\[var\(--acc-ink\)\]/g, 'text-[var(--on-acc)]');
      if (line !== before) changed = true;
    }
    lines[i] = line;
  }
  return { content: lines.join('\n'), changed };
}

function fixSolidBlackWhite(content, relPath) {
  if (SOLID_BW_EXCLUDED_FILES.has(relPath)) return { content, changed: false };

  let changed = false;
  const skipLine = (line) =>
    /isStitchLight|glareMode|qr-code|QRCode|print:|<video|aspect-video|aspect-\[9\/16\]/.test(line) ||
    (/overflow-hidden/.test(line) && /inset-0/.test(line));

  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    if (skipLine(line)) continue;

    if (/\bbg-white\b(?!\/)/.test(line)) {
      const before = line;
      line = line.replace(/\bbg-white\b(?!\/)/g, 'bg-[var(--surface)]');
      if (line !== before) changed = true;
    }
    if (/\bbg-black\b(?!\/)/.test(line)) {
      const before = line;
      line = line.replace(/\bbg-black\b(?!\/)/g, 'bg-[var(--sunken)]');
      if (line !== before) changed = true;
    }
    lines[i] = line;
  }
  return { content: lines.join('\n'), changed };
}

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  for (const fix of FIXES) {
    const before = content;
    content = content.replace(fix.find, fix.replace);
    if (content !== before) {
      console.log(`  ✓ ${fix.desc}`);
      changed = true;
    }
  }

  const borderResult = fixBorderColors(content);
  content = borderResult.content;
  if (borderResult.changed) changed = true;

  const srcDir = path.join(process.cwd(), 'src') + path.sep;
  const relPath = filePath.startsWith(srcDir) ? filePath.slice(srcDir.length) : filePath;
  if (BG_TEXT_SAFE_FILES.has(relPath.split(path.sep).join('/'))) {
    const bgTextResult = fixBgTextColors(content);
    content = bgTextResult.content;
    if (bgTextResult.changed) changed = true;
  }

  const overlayResult = fixBlackWhiteOverlays(content);
  content = overlayResult.content;
  if (overlayResult.changed) changed = true;

  const solidResult = fixSolidBlackWhite(content, relPath.split(path.sep).join('/'));
  content = solidResult.content;
  if (solidResult.changed) changed = true;

  const accInkResult = fixAccInkOnAccFill(content);
  content = accInkResult.content;
  if (accInkResult.changed) changed = true;

  if (changed) {
    fs.writeFileSync(filePath, content);
  }
  return changed;
}

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else {
      callback(filePath);
    }
  });
}

async function main() {
  console.log('\n🔧 Design Fixer — Applying automatic corrections\n');

  let filesChanged = 0;
  const srcDir = path.join(process.cwd(), 'src');

  walkDir(srcDir, (filePath) => {
    if (!filePath.endsWith('.tsx')) return;

    if (fixFile(filePath)) {
      filesChanged++;
      console.log(`${filePath.replace(process.cwd(), '.')}`);
    }
  });

  console.log(`\n✅ Fixed ${filesChanged} files\n`);
  console.log('💡 Remember to:');
  console.log('   1. npx tsc --noEmit  (verify TypeScript)');
  console.log('   2. npm run build      (verify build)');
  console.log('   3. git diff           (review changes)\n');

  process.exit(0);
}

main().catch(console.error);
