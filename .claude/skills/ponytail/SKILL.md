---
name: ponytail
description: Lazy senior developer mindset. Write less code, use existing solutions, prioritize standard libraries, avoid premature abstractions, and apply the YAGNI decision ladder.
---

# 👱 Ponytail Skill

Adopt the **"lazy senior developer"** mindset. The best line of code is the one you never had to write.

---

## 🪜 The Ponytail Decision Ladder

Before writing any new code or creating new abstractions, climb this decision ladder step-by-step:

```
1. 🛑 YAGNI (You Ain't Gonna Need It)
   └─ Is this code strictly necessary right now for the requested task?
      If NO → Stop. Do not write it.

2. 🔄 Reuse Existing Code
   └─ Does the codebase already have a utility, helper, component, or pattern?
      If YES → Import and use it directly.

3. 📚 Standard Library & Language Features
   └─ Does native ECMAScript / Node.js standard library solve this natively?
      (e.g., Array.prototype.findLast, structuredClone, crypto.randomUUID, URL, Object.hasOwn)
      If YES → Use the native platform feature.

4. 📦 Existing Dependencies
   └─ Is there an already-installed package in package.json that solves this?
      If YES → Use the installed package. Do not reinvent or install another redundant library.

5. ⚡ One-Liner / Direct Solution
   └─ Can this be solved simply and clearly in 1–3 lines without a helper function or class?
      If YES → Write the inline solution directly.

6. ✍️ Minimum Necessary Code
   └─ Write ONLY the minimal, clean, type-safe implementation required. No speculative features.
```

---

## 🚫 Anti-Patterns to Avoid

- ❌ **Premature Abstraction:** Creating interfaces, factories, or wrapper classes for one-off use cases.
- ❌ **Helper Proliferation:** Writing a new `utils/dateFormatter.ts` when a native `Intl.DateTimeFormat` or existing utility exists.
- ❌ **Speculative Parameters:** Adding `options?: Record<string, any>` or unused flags "just in case".
- ❌ **Boilerplate Overkill:** Writing 50 lines of boilerplate when 5 lines of idiomatic TypeScript suffice.
- ❌ **Redundant Dependencies:** Installing libraries like `lodash` or `moment` when native JavaScript handles the task cleanly.

---

## 🎯 Code Examples

### ❌ Bloated (Without Ponytail)
```typescript
class SlugGeneratorService {
  private static instance: SlugGeneratorService;
  public static getInstance(): SlugGeneratorService {
    if (!SlugGeneratorService.instance) SlugGeneratorService.instance = new SlugGeneratorService();
    return SlugGeneratorService.instance;
  }
  public generateSlug(text: string, options?: { lowercase?: boolean; delimiter?: string }): string {
    const delim = options?.delimiter ?? '-';
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, delim).replace(/(^-|-$)+/g, '');
  }
}
```

### ✅ Clean & Concise (With Ponytail)
```typescript
export const slugify = (text: string): string =>
  text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
```

---

## ✅ Ponytail Pre-PR Checklist

- [ ] Can any newly written function be replaced by an existing utility or standard library method?
- [ ] Did I avoid creating unnecessary helper files, wrapper classes, or factory patterns?
- [ ] Is there zero dead or speculative code?
- [ ] Is the diff as concise and readable as possible?
