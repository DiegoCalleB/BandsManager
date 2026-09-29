# Design System Automation Skill

**Scope:** BandManager visual consistency, theme compatibility, color parametrization

**Authority:** [`DESIGN_SYSTEM.md`](../../../DESIGN_SYSTEM.md), [`skills/visual-identity/SKILL.md`](../visual-identity/SKILL.md)

## When to use this skill

Call this skill when:
- **Adding new UI** — Ensure it uses only tokens (no hardcoded colors)
- **Changing theme colors** — Audit and fix globally
- **Fixing visual bugs** — Detect root causes (contrast, theming)
- **Migrating designs** — Parametrize before going live
- **Preventing visual debt** — Catch problems early via automation

## Quick commands

```bash
# Audit codebase for theme issues
npm run design:audit

# Fix all detected issues automatically
npm run design:fix

# Strict audit (fails CI if errors found)
npm run design:audit:strict
```

## Workflow: "Change a color everywhere"

**Before:** Search 80+ files, edit each one, hope you didn't miss any, test in 3 themes.

**Now:**
1. Edit `src/styles/tokens.css` (one change)
2. Run `npm run design:audit` to verify
3. That's it — all 80+ components auto-update

Example: Change all teal accents (Tours/Salas module):

```css
/* In tokens.css */
[data-modulo="gira"],
[data-modulo="sala"] {
  --acc: #NewTealColor;  /* ← one edit */
  /* ...rest unchanged... */
}
/* Every component using data-modulo="gira" updates instantly */
```

## Workflow: "Fix a design issue at scale"

**Scenario:** Discover that `text-[var(--ink-3)]` doesn't have enough contrast in dark mode.

**Solution:**
1. Update `FIXES` array in `scripts/design-fixer.js` with the new replacement rule
2. Run `npm run design:fix`
3. All instances replaced automatically
4. TypeScript + build verify correctness

## Adding new themes

1. Add token set to `src/styles/tokens.css`:

```css
[data-theme="myTheme"] {
  --bg: #NewBg;
  --surface: #NewSurface;
  --ink: #NewText;
  /* etc. */
}
```

2. All components work automatically — they read tokens, not hardcoded values

## Token reference

| Token | Use | Light | Dark | Classic |
|-------|-----|-------|------|---------|
| `--bg` | Page background | #F6F7F9 | #101216 | #121110 |
| `--surface` | Card/container | #FFFFFF | #191C21 | #18181B |
| `--sunken` | Dark UI element | #E8EBEF | #0B0D10 | #0D0C0C |
| `--ink` | Primary text (12.4:1) | #2A2E35 | #E3E7EC | #F4F4F5 |
| `--ink-2` | Secondary text (4.5:1) | #646C78 | #99A1AC | #A1A1AA |
| `--hair` | Subtle divider | rgba(42, 46, 53, 0.065) | rgba(227, 231, 236, 0.08) | rgba(244, 244, 245, 0.09) |
| `--ok` | In-progress, success | #17998C | #4FC7B8 | #10B981 |
| `--alert` | Errors | #B3453C | #E27A70 | #F43F5E |
| `--acc` | Module-specific accent | Varies | Varies | #F2CA50 |

## Checklist: New UI component

- [ ] **Zero `border`** — Separate with luminance + space
- [ ] **All colors are tokens** — No `#RRGGBB` literals
- [ ] **Module-aware** — Uses `data-modulo` if applicable
- [ ] **Contrast verified** — Text 10:1–14:1 ratio
- [ ] **Tested in 3 themes** — Light, dark, classic
- [ ] Run `npm run design:audit` — Should pass

## Example: Correct component

```tsx
export function Card({ children }) {
  return (
    <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] border-b border-[var(--hair)]">
      {/* Uses only tokens, works in all themes automatically */}
      {children}
    </div>
  );
}
```

## Example: Problematic component

```tsx
export function BadCard({ children }) {
  return (
    <div className="p-4 rounded-lg bg-white border border-gray-200">
      {/* ❌ Hardcoded colors, won't theme, broken in dark mode */}
      {children}
    </div>
  );
}
```

## FAQ

**Q: Can I use a color that's not in tokens?**

A: No. Add it to `tokens.css` first. Then use it everywhere via `var(--name)`.

**Q: Should I hardcode brand colors (PayPal blue #003087)?**

A: Only for brand partnerships where color is explicit requirement. Add to `INTENTIONAL_COLORS` in `design-audit.js`. All other colors must be tokens.

**Q: Can I ignore the audit in this one component?**

A: No. If the component has unique constraints, propose a new token or use case to the team. Exception: user-generated content (videos, charts from uploaded data).

**Q: How do I test a new theme before committing?**

1. Add theme to `tokens.css`
2. Open DevTools Console: `document.documentElement.dataset.theme = 'myTheme'`
3. Test all views
4. Commit when satisfied

## Scripts reference

### `npm run design:audit`

Scan codebase for issues:
- Hardcoded hex colors
- Insufficient contrast
- Missing theme awareness
- Legacy color patterns

Output: List of files + line numbers + suggested fixes

### `npm run design:audit:strict`

Same audit, but fails with exit code 1 (use in CI/pre-commit)

### `npm run design:fix`

Automatically apply all known fixes:
- `text-black` → `text-[var(--ink)]`
- `#d1b375` (legacy gold) → `var(--acc)`
- `text-[var(--ink-3)]` (low contrast) → `text-[var(--ink-2)]`
- Placeholder colors → tokens
- etc.

Then: Verify TypeScript + run full build

## Contributing fixes

To add a new automatic fix:

1. Edit `scripts/design-fixer.js`, add entry to `FIXES` array:

```js
{
  find: /your-pattern-here/g,
  replace: 'var(--newToken)',
  desc: 'Description of what this fixes'
}
```

2. Test: `npm run design:fix`
3. Verify: `npm run typecheck && npm run build`
4. Commit with explanation in message
