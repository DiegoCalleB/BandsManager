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
];

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
