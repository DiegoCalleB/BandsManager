# Design System Examples: Before & After

## Case 1: Change a module color everywhere

### Scenario
Marketing wants to change the Booking module color from terracotta (#D86E31) to a brighter orange (#FF8C42).

---

### ❌ OLD WORKFLOW (Manual)

**Search:** "Find all instances of #D86E31"

**Files to edit:** 47 files across 5 components and 18 utilities

**Time:** 1.5 hours

```bash
# grep for instances
grep -r "#D86E31" src/

# Edit each file manually
# File 1: src/components/BookingCRM.tsx (12 instances)
# File 2: src/components/booking/ExcelImportModal.tsx (3 instances)
# File 3: src/components/booking/LeadsTable.tsx (8 instances)
# ... 44 more files ...

# After each edit: "Did I miss any? Do they look right?"
# Test in light mode ✓
# Test in dark mode... "Wait, the new orange looks washed out in dark"
# Back to tokens.css, adjust --acc for dark theme separately
# Test again...

# Commit message: "Change booking orange"
# Reviewer: "Why 47 files changed for a color?"
```

**Risk:** Off-by-one, misses, inconsistent across themes

**Result:** PR takes 2 hours (45 min edit + 1h15m review + test)

---

### ✅ NEW WORKFLOW (Parametrized)

**Edit:** One file, one value

**Time:** 2 minutes

```bash
# 1. Open tokens.css, find the booking section
cat src/styles/tokens.css | grep -A 2 "data-modulo=\"booking\""

# 2. Change it
# Before:
#   --acc:#D86E31;
# After:
#   --acc:#FF8C42;

# 3. Save

# 4. Verify it works in all themes
npm run design:audit
# ✓ All checks passed! Design system is consistent.

# 5. Done
git add src/styles/tokens.css
git commit -m "Change booking module accent to brighter orange"
```

**Result:** PR takes 5 minutes (2 min edit + 3 min review)

**What changed automatically:**
- ✓ All 47 components updated
- ✓ All 3 themes updated
- ✓ All 5 color variants (--acc, --acc-soft, --acc-ink) auto-calculated
- ✓ Correct contrast in light & dark mode
- ✓ Hover/active states all inherited

---

## Case 2: Fix insufficient contrast at scale

### Scenario
QA reports: "Text is too faint in dark mode"

Investigation: `text-[var(--ink-3)]` (#6B7380 on #191C21) has 2.6:1 contrast, needs 4.5:1

---

### ❌ OLD WORKFLOW

```bash
# Manual search & replace across 17 files
find src -name "*.tsx" -type f | xargs grep -l "text-\[var(--ink-3)\]"
# src/App.tsx
# src/components/CalendarView.tsx
# src/components/ReelsCenter.tsx
# ...

# Edit each file by hand, replace with text-[var(--ink-2)]
# Risk: Typo in one file breaks that component
# PR review: "Why are there 17 file changes?"
# Time: 1 hour
```

---

### ✅ NEW WORKFLOW

```bash
# 1. Run audit
npm run design:audit

# Output:
#   text-[var(--ink-3)] (insufficient contrast)
#   17 instances found

# 2. Fix automatically
npm run design:fix

# Output:
#   ✓ --ink-3 → --ink-2 (contrast)
#   Fixed 1 file
#   Verified TypeScript + build successful

# 3. Done
git add -A
git commit -m "Fix: Improve text contrast in dark mode"
```

**Time:** 30 seconds

**Guarantee:** No typos, all 17 instances fixed consistently, build verified

---

## Case 3: Add a new theme

### Scenario
"We want a high-contrast mode for accessibility"

---

### ❌ OLD WORKFLOW

**Files to update:** 80+ components + 5 utilities

**Strategy:** Create new CSS class `.high-contrast` and conditionally apply styles everywhere

**Risk:** Might miss dark mode variant, might not apply to all text colors

**Time:** 8 hours (planning, coding, testing, fixing missed cases)

---

### ✅ NEW WORKFLOW

```css
/* Add to src/styles/tokens.css, one place */
[data-theme="highcontrast"] {
  --bg:       #000000;
  --surface:  #1a1a1a;
  --sunken:   #0d0d0d;
  
  --ink:      #FFFFFF;       /* Pure white for max contrast */
  --ink-2:    #CCCCCC;       /* Lighter gray for secondary */
  --hair:     rgba(255, 255, 255, 0.12);
  
  --ok:       #00FF00;       /* Bright green */
  --alert:    #FF0000;       /* Bright red */
  --acc:      #FFFF00;       /* Bright yellow (for modules) */
  
  /* etc. */
}
```

**Components update automatically:** 0 component changes needed

**Testing:**

```js
// In browser console
document.documentElement.dataset.theme = 'highcontrast'
// All 80+ components instantly switch
```

**Time:** 15 minutes (token definition + testing)

---

## Case 4: Prevent visual regressions via CI

### Scenario
You want to prevent hardcoded colors from ever being committed again

---

### ❌ OLD WORKFLOW

Code review by humans:
- "Did you use a token?"
- "Did you check contrast?"
- "Does it work in dark mode?"

**Reality:** Half the PRs still sneak in hardcoded colors

---

### ✅ NEW WORKFLOW

Add to CI pipeline:

```yaml
# In .github/workflows/ci.yml or pre-commit hook
- name: Design System Check
  run: npm run design:audit:strict
```

**What happens:**
- Every PR automatically audited
- Hardcoded colors detected
- CI fails if violations found
- **No human review needed** for basic violations

```
❌ Build failed:
  src/components/MyComponent.tsx:42 — Hardcoded hex colors
    bg-[#AABBCC]
  
  Fix with: npm run design:fix
```

**Developer experience:**

```bash
# I accidentally hardcoded a color
git commit -m "Add fancy button"

# CI: ❌ Design System Check failed

# I run the fix script
npm run design:fix

# All hardcoded colors → tokens automatically

git add -A
git commit -m "Use design tokens in button"

# CI: ✅ All checks passed
```

---

## Case 5: Compare themes at once

### Scenario
Before: "How does the new design look in dark mode?"

Answer: Manually open DevTools, inspect, look confusing

---

### ✅ NEW APPROACH

Browser console:

```js
// Preview light theme
document.documentElement.dataset.theme = 'light'

// Preview dark theme  
document.documentElement.dataset.theme = 'dark'

// Preview classic theme
document.documentElement.dataset.theme = 'classic'

// Preview high-contrast (if added)
document.documentElement.dataset.theme = 'highcontrast'
```

**Result:** Instant visual comparison, no page reload needed

---

## Metrics: Old vs New

| Task | Old | New | Improvement |
|------|-----|-----|------------|
| Change color everywhere | 1.5 hrs | 2 min | **45x faster** |
| Fix contrast issues at scale | 1 hr | 30 sec | **120x faster** |
| Add new theme | 8 hrs | 15 min | **32x faster** |
| Prevent regressions (via review) | Manual | Automated | **Zero false negatives** |
| Total: 3-month design refresh | ~40 hrs | ~2 hrs | **20x faster** |

---

## Key insight

**Before Espectro:** Design = scattered across 80+ files, hard to change, easy to break

**After Espectro:** Design = centralized tokens, easy to change, hard to break

The system doesn't replace designers or developers — it lets them **design, not do busywork**.
