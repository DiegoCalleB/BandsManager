#!/usr/bin/env node
/**
 * Design Audit — Automated visual consistency checker
 * Detects hardcoded colors, contrast issues, theming problems across the codebase
 * Usage: node scripts/design-audit.js [--fix] [--strict]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INTENTIONAL_COLORS = new Set([
  'ff6b9d', // Spotify pink (transpose indicator, media player)
  '003087', // PayPal blue
  '121111', // Merchandise color
  'e0a820', // Gradient accent (solo en classic theme)
  '0079c1', // LinkedIn-ish blue (third-party brand badge)
  '99907c', // User data context (Finanzas input borders, third-party color)
]);

// Gold variants removed — now converted to var(--acc-soft) during migration

const CHECKS = {
  hardcodedColors: {
    description: 'Hardcoded hex colors (should use tokens)',
    pattern: /(bg|text|border|placeholder)-\[#[0-9a-f]{6}\]/gi,
    filter: (match) => {
      const hexMatch = match.match(/#([0-9a-f]{6})/i);
      const hex = hexMatch ? hexMatch[1].toLowerCase() : '';
      return !INTENTIONAL_COLORS.has(hex);
    },
    severity: 'error',
  },
  textBlack: {
    description: 'text-black (lacks theme awareness)',
    pattern: /text-black\b/g,
    severity: 'error',
  },
  textInk3: {
    description: 'text-[var(--ink-3)] (insufficient contrast)',
    pattern: /text-\[var\(--ink-3\)\]/g,
    severity: 'error',
  },
  placeholderColors: {
    description: 'Hardcoded placeholder colors',
    pattern: /placeholder-(slate|zinc|gray|stone|neutral)-\d+/g,
    filter: () => true,
    severity: 'error',
  },
  // Los dos siguientes son heurísticas sobre className (no matches exactos de un token) —
  // aviso, no error, porque dan falsos positivos: el primero solo importa si el elemento
  // es de verdad hijo de un flex/grid, el segundo solo si el overlay lleva scrim de fondo.
  // Nacen del bug real de "Añadir Widget" (sesión 2026-09-23): la fila de pestañas de
  // categoría, con overflow-x-auto pero sin shrink-0, se aplastaba a 15px de alto porque
  // al no ser 'visible' un eje de overflow, el navegador computa el otro como auto también
  // — y un scroll-container que es flex item pierde su alto mínimo basado en contenido.
  overflowAutoWithoutShrink: {
    // Solo overflow-x-auto (no -y-auto): es la fila horizontal (pills, tabs, chips) sin su
    // propia altura fija la que se aplasta cuando es flex item de un flex-col — un panel
    // vertical con overflow-y-auto casi siempre ya lleva max-h-/flex-1 y no sufre esto, así
    // que incluirlo aquí era puro ruido (260+ avisos, inútil de revisar).
    description: 'overflow-x-auto sin shrink-0 en una fila que puede ser flex item — flexbox puede aplastarla a 0 de alto (ver DashboardWidgetGrid.tsx, píldoras de categoría)',
    pattern: /className=\{?[`"'][^`"']*overflow-x-auto[^`"']*[`"']/g,
    filter: (match) => !/shrink-0|flex-shrink-0/.test(match),
    severity: 'warning',
  },
  bordeDeAcento: {
    description: 'borde de color de acento (border-[var(--acc|ok|alert|tentative)] sin opacidad ≤40, o border-2/4) — Ley 1 de visual-identity: ningún borde; separa el escalón de luminancia (un borde hairline --hair es lo máximo tolerado; las barras border-l-4 intencionadas quedan fuera)',
    pattern: /(?<![:\w-])border(?:-[tblrxy])?-\[var\(--(?:acc|acc-ink|ok|alert|tentative)\)\](?!\/(?:[0-3][0-9]|40|[0-9])\b)/g,
    severity: 'error',
  },
  bordeDeCaja: {
    description: 'border de caja (clase `border` sola, o hover:/focus:border-…) — Ley 1 de visual-identity: separa el escalón de luminancia (--surface / --sunken) o el espacio. Solo se toleran divisores de una cara (border-t/b/l/r/x/y) con --hair',
    pattern: /(?<![\w:\[-])(?:border(?![\w\[:-])|(?:hover|focus|focus-within|group-hover):border-\[)/g,
    severity: 'error',
  },
  textoSobreRelleno: {
    description: 'texto del mismo color que su relleno sólido (bg-[var(--acc)] + text-[var(--acc)]/acc-ink, ídem ok/alert) — en Oscuro queda invisible; usa text-[var(--on-acc|on-ok|on-alert)]',
    pattern: /className=\{?[`"'][^`"']*(?<![\w:\/-])bg-\[var\(--(acc|ok|alert)\)\](?![\w\/-])[^`"']*(?<![\w:-])text-\[var\(--(?:\1|acc-ink)\)\](?![\w\/-])/g,
    severity: 'error',
  },
  mayusculasDecorativas: {
    description: 'uppercase de Tailwind — visual-identity §1/§6: caja de frase siempre; las versalitas eliminan la silueta de la palabra y cansan en sesiones largas (un literal ya escrito en mayúsculas en el JSX no lo detecta esta regla)',
    pattern: /(?<![\w-])uppercase(?![\w-])/g,
    severity: 'error',
  },
  efectosProhibidos: {
    description: 'backdrop-blur, sombras de elevación (shadow-sm…2xl / shadow-[…]) o degradado de fondo — visual-identity §4: Espectro es plano, separa el escalón de luminancia (los scrims sobre imagen con from-black/to-transparent quedan permitidos)',
    pattern: /className=\{?[`"'][^`"']*(?:(?<![\w-])backdrop-blur|(?<![\w-])(?:drop-)?shadow-(?:sm|md|lg|xl|2xl|inner|\[)|bg-gradient-to-(?![^`"']*(?:from-(?:black|transparent|\[#)|to-transparent)))/g,
    severity: 'error',
  },
  darkTailwind: {
    description: 'variante dark: de Tailwind en el marcado — visual-identity §4: el tema se resuelve en tokens, no en el componente',
    pattern: /className=\{?[`"'][^`"']*(?<![\w-])dark:/g,
    severity: 'error',
  },
  pulsoDecorativo: {
    description: 'animate-pulse — solo para carga real (skeleton / "cargando"); nunca decorativo (visual-identity §4). Si es un skeleton de verdad, la línea debe contener "skeleton", "loading", "cargando", "Generando" o "Procesando"',
    pattern: /^(?!.*(?:skeleton|data-carga|loading|cargando|Loading|Skeleton|Generando|Procesando|animated \?|animate-pulse en index\.css)).*(?<![\w-])animate-pulse(?![\w-]).*$/gm,
    severity: 'error',
  },
  claseCorrupta: {
    description: 'clase Tailwind inválida por concatenación (bgbg-, borderbg-, dividebg-): no hace nada — resto de un find-and-replace roto',
    pattern: /(?<![\w-])(?:hover:)?(?:bgbg|borderbg|dividebg|ringbg|textbg)-\[/g,
    severity: 'error',
  },
  modalOverlayLowZIndex: {
    description: 'overlay fixed inset-0 con scrim en z-50/z-40 en vez de z-[9999] — puede quedar tapado por chrome persistente (barra del reproductor, nav inferior) que vive en su propio contexto de apilamiento (ver DashboardWidgetGrid.tsx)',
    pattern: /className=\{?[`"'][^`"']*fixed inset-0[^`"']*[`"']/g,
    filter: (match) => /scrim/.test(match) && !/z-\[9999\]|z-\[10000\]/.test(match),
    severity: 'warning',
  },
};

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

function auditFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const issues = [];

  for (const [checkName, check] of Object.entries(CHECKS)) {
    if (!check.pattern) continue;

    let match;
    const regex = new RegExp(check.pattern.source, check.pattern.flags);
    while ((match = regex.exec(content)) !== null) {
      if (check.filter && !check.filter(match[0])) continue;

      const line = content.substring(0, match.index).split('\n').length;
      issues.push({
        file: filePath.replace(process.cwd(), '.'),
        line,
        check: checkName,
        message: check.description,
        match: match[0],
        severity: check.severity,
      });
    }
  }

  return issues;
}

function formatIssue(issue) {
  const icon = issue.severity === 'error' ? '❌' : '⚠️ ';
  return `${icon} ${issue.file}:${issue.line} — ${issue.message}\n   ${issue.match}`;
}

async function main() {
  const args = process.argv.slice(2);
  const shouldFix = args.includes('--fix');
  const isStrict = args.includes('--strict');

  console.log('\n📊 Design Audit — Checking theme consistency...\n');

  let allIssues = [];
  const srcDir = path.join(process.cwd(), 'src');

  walkDir(srcDir, (filePath) => {
    if (!filePath.endsWith('.tsx')) return;
    const issues = auditFile(filePath);
    allIssues = allIssues.concat(issues);
  });

  const errorCount = allIssues.filter((i) => i.severity === 'error').length;
  const warningCount = allIssues.filter((i) => i.severity === 'warning').length;

  if (allIssues.length === 0) {
    console.log('✅ All checks passed! Design system is consistent.\n');
    return process.exit(0);
  }

  // Group by severity
  const errors = allIssues.filter((i) => i.severity === 'error');
  const warnings = allIssues.filter((i) => i.severity === 'warning');

  if (errors.length > 0) {
    console.log(`❌ ERRORS (${errors.length}):\n`);
    errors.slice(0, 20).forEach((issue) => console.log(formatIssue(issue)));
    if (errors.length > 20) console.log(`   ... and ${errors.length - 20} more\n`);
  }

  if (warnings.length > 0) {
    console.log(`\n⚠️  WARNINGS (${warnings.length}):\n`);
    warnings.slice(0, 10).forEach((issue) => console.log(formatIssue(issue)));
    if (warnings.length > 10) console.log(`   ... and ${warnings.length - 10} more\n`);
  }

  console.log(`\n📈 Summary: ${errorCount} errors, ${warningCount} warnings\n`);

  if (shouldFix && errorCount > 0) {
    console.log('🔧 Applying automatic fixes...\n');
    try {
      execSync('npm run design:fix', { stdio: 'inherit' });
    } catch (e) {
      console.error('Fix script failed');
      process.exit(1);
    }
  } else if (errorCount > 0 && !isStrict) {
    console.log('💡 Tip: Run with --fix to apply automatic corrections\n');
  }

  process.exit(errorCount > 0 ? (isStrict ? 1 : 0) : 0);
}

main().catch(console.error);
