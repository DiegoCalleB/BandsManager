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
