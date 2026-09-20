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
