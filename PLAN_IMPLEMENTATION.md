# Plan System Implementation Guide

## Overview

Two-tier freemium model:

### Buskers Plan ($0/month)
Perfect for festival bands & independent musicians
- EPK (Dossier) - professional press kit
- Fans capture - collect emails at gigs
- Calendar - manage concerts & rehearsals
- **Simple, clean UI** - no noise, no upgrade upsell
- No CRM, Agentes, Reels, Finanzas, Repertorio, Tours

### Pro Plan ($5-10/month)
For bands that want professional management & booking automation
- Everything in Buskers +
- CRM (manage all your leads/contacts)
- Agentes (AI-powered booking agents that scout venues & send pitches)
- Reels (AI social content generator)
- Finanzas (income tracking)
- Repertorio (setlist manager)
- Tours (multi-date organization)

## Current State

- `registered_bands.plan` field already exists (default: 'pro')
- New middleware: `server/middleware/planValidator.ts` with `requirePlanAccess(...features)`

## Implementation Steps

### 1. Update Band Schema (Supabase Migration)

Make sure `registered_bands.plan` column defaults to 'free' for new bands:

```sql
ALTER TABLE registered_bands ALTER COLUMN plan SET DEFAULT 'free';
```

### 2. Protect Routes

Apply middleware to restrict access per plan. Example for CRM routes:

```typescript
// server/routes/leads.ts (or wherever CRM routes live)
import { requirePlanAccess } from "../middleware/planValidator.js";

router.get("/api/leads", requirePlanAccess("crm", "leads"), (req, res) => {
  // ... existing handler
});

router.post("/api/leads", requirePlanAccess("crm", "leads"), (req, res) => {
  // ... existing handler
});
```

### 3. Routes That Need Protection

**CRM/Leads (require plan: crm + leads):**
- `/api/leads` (GET, POST, PUT, DELETE)
- `/api/leads/:id/*`

**Agentes/Booking (require plan: agentes):**
- `/api/agentes/*`
- `/api/draft-email/*`
- `/api/send-email/*`

**Repertorio (require plan: repertorio):**
- `/api/repertorio/*`
- `/api/songs/*`

**Reels/Social (require plan: reels):**
- `/api/reels/*`
- `/api/generate` (AI music)
- `/api/write-reels-copy`

**Finanzas (require plan: finanzas):**
- `/api/payments/*`
- `/api/finances/*`

**Tours/Concerts (require plan: tours):**
- `/api/tours/*`
- `/api/concerts/*`
- `/api/rehearsals/*`

**Autonomy/Agent Config (require plan: agentes):**
- `/api/autonomy-config/*`
- `/api/agent-settings/*`

### 4. Routes That Remain FREE

**Always accessible (free + pro):**
- `/epk` (public, read-only dossier)
- `/api/epk` (band's EPK data)
- `/api/fans` (capture + list fans)
- `/api/calendar` (read/write concerts & rehearsals)
- `/api/concerts/*` (read/write - linked to calendar)
- `/api/rehearsals/*` (read/write - linked to calendar)
- `/api/state` (general app state)
- `/api/auth/*` (login, register, etc)

### 5. Frontend: Hide ALL Premium Features for Free Plan

Free plan should have a **minimal, clean interface** with NO visible upgrade prompts or premium sections:

```typescript
// Example in src/components/App.tsx or main navigation
const { band } = useContext(AuthContext);
const isFree = band.plan === 'free';

return (
  <nav>
    {/* Always show */}
    <NavLink to="/epk">Dossier</NavLink>
    <NavLink to="/fans">Fans</NavLink>
    <NavLink to="/calendar">Calendario</NavLink>
    
    {/* FREE PLAN: HIDE EVERYTHING ELSE */}
    {!isFree && (
      <>
        <NavLink to="/crm">CRM</NavLink>
        <NavLink to="/booking">Agentes</NavLink>
        <NavLink to="/repertorio">Repertorio</NavLink>
        <NavLink to="/reels">Reels</NavLink>
        <NavLink to="/finanzas">Finanzas</NavLink>
        <NavLink to="/tours">Tours</NavLink>
        <NavLink to="/settings">Configuración</NavLink>
        <NavLink to="/upgrade">Upgrade Plan</NavLink>
      </>
    )}
  </nav>
);
```

**Key points:**
- NO "Upgrade to Pro" buttons or prompts for free users
- NO grayed-out premium sections
- Just: Dossier, Fans, Calendar
- Clean, simple, no friction
- They see exactly what they get

### 6. Upgrade Flow

Later add Stripe/Paddle integration at `/api/upgrade` or `/api/checkout`.

For now, can be a placeholder that shows pricing/contact info.

### 7. Test Plan Restrictions

```typescript
// server/utils/__tests__/planAccess.test.ts
import { describe, it, expect } from "vitest";
import { requirePlanAccess, PLAN_FEATURES } from "../middleware/planValidator.js";

describe("Plan Access Control", () => {
  it("buskers plan has access to epk, fans, and calendar only", () => {
    expect(PLAN_FEATURES.buskers).toContain("epk");
    expect(PLAN_FEATURES.buskers).toContain("fans");
    expect(PLAN_FEATURES.buskers).toContain("calendar");
    expect(PLAN_FEATURES.buskers).not.toContain("crm");
    expect(PLAN_FEATURES.buskers).not.toContain("agentes");
  });

  it("pro plan has access to all features", () => {
    expect(PLAN_FEATURES.pro).toContain("crm");
    expect(PLAN_FEATURES.pro).toContain("reels");
    expect(PLAN_FEATURES.pro).toContain("agentes");
    expect(PLAN_FEATURES.pro).toContain("calendar");
  });
});
```

## Deployment Strategy

1. **Phase 1**: Deploy middleware + route protection (backend)
   - Buskers plan users can only access EPK, Fans, Calendar
   - Pro plan users work normally

2. **Phase 2**: Update UI (frontend)
   - Hide CRM, Agentes, Reels, Finanzas, Tours, Settings from Buskers users
   - Show only: Dossier, Fans, Calendar navigation
   - NO upgrade prompts or upsell (clean experience)

3. **Phase 3**: Launch at Buskers festival
   - New registrations get `plan='buskers'` by default
   - Existing pro users keep `plan='pro'`

4. **Phase 4**: Add monetization (later)
   - Stripe/Paddle checkout when 5+ bands ask for Pro features
   - Self-serve upgrade flow in settings

## Freemium Economics

**Buskers tier ($0/month):**
- Costs: Supabase storage (fans list, calendar), EPK rendering
- Very low cost per user (~$0.01-0.05/month)
- No expensive AI calls, no agent runs, no Gemini quota burned
- Pure acquisition & retention cost

**Pro tier ($5-10/month):**
- Revenue per user: $60-120/year
- Costs: CRM operations, AI agents (expensive), Reels generation (Gemini API)
- Gmail API calls, agent scheduler, storage
- Breakeven at 20-30 pro users ($1200-3600/year revenue vs ~$200-300/month cloud cost)
- **Goal**: 5-10 pro users by end of 2026 = €300-600/month sustainable

## Notes

- Keep free plan genuinely useful (EPK + fans capture = solves festival problem)
- Premium features are for serious bands that want booking automation, not for everyone
- Don't punish free users; they're future paying customers
- Monitor free→pro conversion rate; if <5%, consider adding features to free plan
