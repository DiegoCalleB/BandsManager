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

  // Legacy gold (#d1b375) → --acc
  { find: /text-\[#d1b375\]/g, replace: 'text-[var(--acc)]', desc: 'gold text → --acc' },
  { find: /bg-\[#d1b375\]\/(\d+)/g, replace: 'bg-[var(--acc)]/$1', desc: 'gold bg → --acc' },

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
