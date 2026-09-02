# Plan System Implementation Guide

## Overview

Two-tier freemium model:
- **Free**: EPK (Dossier) + Fans capture only
- **Pro**: Everything (CRM, Leads, Agentes, Reels, Finanzas, Repertorio, Tours, Rehearsals)

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

**Always accessible:**
- `/epk` (public, read-only dossier)
- `/api/epk` (band's EPK data)
- `/api/fans` (capture + list fans)
- `/api/state` (general app state)
- `/api/auth/*` (login, register, etc)

### 5. Frontend: Hide Premium Features

In React components, check band.plan before rendering premium sections:

```typescript
// Example in src/components/Dashboard.tsx
const { band } = useContext(AuthContext);

return (
  <>
    <EPKSection /> {/* Always visible */}
    <FansSection /> {/* Always visible */}
    
    {band.plan === 'pro' && (
      <>
        <CRMSection />
        <ReelsSection />
        <FinanzasSection />
      </>
    )}
    
    {band.plan === 'free' && (
      <UpgradePrompt message="Upgrade to Pro to access CRM, Booking Agents, Reels, and more" />
    )}
  </>
);
```

### 6. Upgrade Flow

Later add Stripe/Paddle integration at `/api/upgrade` or `/api/checkout`.

For now, can be a placeholder that shows pricing/contact info.

### 7. Test Plan Restrictions

```typescript
// server/utils/__tests__/planAccess.test.ts
import { describe, it, expect } from "vitest";
import { requirePlanAccess, PLAN_FEATURES } from "../middleware/planValidator.js";

describe("Plan Access Control", () => {
  it("free plan has access to epk and fans only", () => {
    expect(PLAN_FEATURES.free).toContain("epk");
    expect(PLAN_FEATURES.free).toContain("fans");
    expect(PLAN_FEATURES.free).not.toContain("crm");
  });

  it("pro plan has access to all features", () => {
    expect(PLAN_FEATURES.pro).toContain("crm");
    expect(PLAN_FEATURES.pro).toContain("reels");
    expect(PLAN_FEATURES.pro).toContain("agentes");
  });
});
```

## Deployment Strategy

1. **Phase 1**: Deploy middleware + route protection (no UI changes)
   - Free plan users still see features (not blocked yet)
   - Pro plan users work normally

2. **Phase 2**: Update UI to hide premium features for free plans
   - Show "Upgrade to Pro" prompts

3. **Phase 3**: Set all new registrations to plan='free'
   - Existing users keep plan='pro' (grandfather them in)

4. **Phase 4**: Add Stripe/Paddle checkout
   - Users can self-serve upgrade

## Freemium Economics

**Free tier:** 
- Costs: Supabase storage (fans list), Edge Functions (EPK rendering)
- Very low cost per user (~$0.01/month if inactive, $0.10 if active)

**Pro tier ($5-10/month):**
- Includes: CRM operations, AI agents (heavy), Reels generation (expensive)
- Gemini API calls, Gmail API calls, agent runs
- Breakeven at 50-100 pro users (roughly $250-1000/month revenue vs ~$200 cloud cost)

## Notes

- Keep free plan genuinely useful (EPK + fans capture = solves festival problem)
- Premium features are for serious bands that want booking automation, not for everyone
- Don't punish free users; they're future paying customers
- Monitor free→pro conversion rate; if <5%, consider adding features to free plan
