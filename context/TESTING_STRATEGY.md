# 🧪 Testing Strategy - BandManager.ai

> **Core Principle:** Sin tests bien dirigidos, la simplicidad se rompe bajo cambios.
> 
> **Verdad:** 560 tests sin estrategia = falso positivo de "estamos bien". Necesitamos **tests en lo que importa**.

---

## 📊 Estado Actual

```
Total tests: 560+
Framework: Vitest (Jest-compatible, built on Vite)
Structure: __tests__/ folders next to modules

Coverage by area:
✅ server/utils/ (auth, bandAccess, ssrfGuard)  — GOOD (60%+)
✅ server/db/ (multi-tenancy, plan limits)      — GOOD (55%+)
⚠️  server/routes/ (handlers, endpoints)        — WEAK (20%)
⚠️  src/ (components, hooks)                    — WEAK (15%)

Baseline: 0 TS errors (strict, no new `any`)
```

---

## 🎯 Estrategia: Test Pyramid

```
        ▲ E2E (Rare, slow, full app)
       ▲ ▲ Integration (Medium, slower)
      ▲ ▲ ▲ Unit Tests (Many, fast)
     ▲ ▲ ▲ ▲ ▲ (BandManager focus)
```

### Ratios Objetivo

```
Unit Tests:     70% (fast, testable helpers)
Integration:    20% (routes + DB together)
E2E:             5% (critical user flows only)
Manual/Visual:   5% (UI in browser, dark mode, responsive)
```

---

## 🔴 CRÍTICO: Lo Que SIEMPRE Necesita Test

### 1. Multi-Tenancy & Trust Boundary

```typescript
// ✅ ALWAYS TEST: bandAccess.ts
describe('getTargetBandId', () => {
  it('blocks user A from accessing band B', () => {
    const req = {
      user: { id: 'user-a', band_id: 'band-a', availableBands: ['band-a'] },
      headers: { 'x-band-id': 'band-b' }  // ← Injection attempt
    };
    
    expect(() => getTargetBandId(req)).toThrow(ForbiddenError);
  });
  
  it('allows user if in availableBands', () => {
    const req = {
      user: { id: 'user-a', band_id: 'band-a', availableBands: ['band-a', 'band-b'] },
      headers: { 'x-band-id': 'band-b' }
    };
    
    expect(getTargetBandId(req)).toBe('band-b');
  });
  
  it('fallback to band_id if no header', () => {
    const req = {
      user: { id: 'user-a', band_id: 'band-a' },
      headers: {}
    };
    
    expect(getTargetBandId(req)).toBe('band-a');
  });
});
```

**Why:** Cross-tenant leaks are catastrophic. Every user-facing route must validate.

---

### 2. Plan Limits (Server-Side Enforcement)

```typescript
// ✅ ALWAYS TEST: planLimits.ts + routes
describe('checkRecordLimit', () => {
  it('promo plan allows 0 leads', () => {
    expect(() => checkRecordLimit('band-1', 'leads', 1))
      .toThrow(BadRequest);  // Already at 1, can't add more
  });
  
  it('ensayo plan allows 50 leads', () => {
    expect(() => checkRecordLimit('band-1', 'leads', 50))
      .toThrow(BadRequest);  // At limit
    
    expect(() => checkRecordLimit('band-1', 'leads', 49))
      .not.toThrow();  // Under limit
  });
});

// ✅ Route MUST validate server-side
describe('POST /api/leads', () => {
  it('rejects if plan limit exceeded', async () => {
    // Setup: band on 'promo' plan (0 leads allowed)
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${token}`)
      .send({ venue_name: 'New Venue' });
    
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Plan');
  });
});
```

**Why:** UI can be bypassed. Server validation is the only truth.

---

### 3. Agents (Human-in-the-Loop)

```typescript
// ✅ ALWAYS TEST: agentEngine.ts, lectorAgent.ts
describe('Redactor Agent', () => {
  it('generates pitch but DOES NOT send', async () => {
    const lead = await createLead({ estado: 'nuevo' });
    
    await redactorAgent.generatePitch(lead);
    
    // ✅ Pitch created
    expect(lead.pitch_generado).toBeTruthy();
    expect(lead.agentic_status).toBe('pendiente_aprobacion');
    
    // ✅ NOT sent yet (no email sent)
    const emails = await getEmailsSent();
    expect(emails).toHaveLength(0);
  });
});

describe('Enviador Agent', () => {
  it('respects AGENT_EMAIL_MODE=draft', async () => {
    process.env.AGENT_EMAIL_MODE = 'draft';
    const lead = await createLead({ agentic_status: 'aprobado_propuesta' });
    
    await enviadorAgent.dispatch([lead]);
    
    // ✅ Draft created, NOT sent
    expect(lead.gmail_draft_id).toBeTruthy();
    expect(lead.estado).toBe('esperando_respuesta');  // Not 'contactado'
  });
  
  it('NEVER sends without aprobado_propuesta', async () => {
    process.env.AGENT_EMAIL_MODE = 'send';
    const lead = await createLead({ agentic_status: 'pendiente_aprobacion' });
    
    await enviadorAgent.dispatch([lead]);
    
    // ✅ Nothing happens
    const emails = await getEmailsSent();
    expect(emails).toHaveLength(0);
  });
});
```

**Why:** Human-in-the-loop is non-negotiable. Agents must never auto-send.

---

### 4. SSRF Guard

```typescript
// ✅ ALWAYS TEST: ssrfGuard.ts
describe('esUrlExternaSegura', () => {
  it('blocks private IPs', () => {
    expect(() => esUrlExternaSegura('http://127.0.0.1')).toThrow();
    expect(() => esUrlExternaSegura('http://192.168.1.1')).toThrow();
    expect(() => esUrlExternaSegura('http://localhost:3000')).toThrow();
  });
  
  it('blocks DNS rebinding (resolved IP is private)', async () => {
    // Mock DNS to return private IP
    mockDns('attacker.com' -> '127.0.0.1');
    
    expect(() => esUrlExternaSegura('http://attacker.com')).toThrow();
  });
  
  it('allows public URLs', () => {
    expect(() => esUrlExternaSegura('http://google.com')).not.toThrow();
    expect(() => esUrlExternaSegura('http://venue-website.es')).not.toThrow();
  });
});
```

**Why:** SSRF is a real attack vector. Scraping needs protection.

---

### 5. Auth & Passwords

```typescript
// ✅ ALWAYS TEST: auth.ts
describe('Password Hashing', () => {
  it('hashes with PBKDF2 (not plain)', () => {
    const password = 'SecurePass123!';
    const hash = hashPassword(password);
    
    expect(hash).not.toBe(password);
    expect(hash.length).toBeGreaterThan(50);  // Hashed format
  });
  
  it('verifies correct password', () => {
    const password = 'SecurePass123!';
    const hash = hashPassword(password);
    
    expect(verifyPassword(password, hash)).toBe(true);
    expect(verifyPassword('WrongPass', hash)).toBe(false);
  });
  
  it('rejects weak passwords at signup', async () => {
    const res = await request(app)
      .post('/api/signup')
      .send({ email: 'user@test.com', password: '123' });  // Too short
    
    expect(res.status).toBe(400);
  });
});
```

**Why:** Auth failure = total breach. Password hashing is non-negotiable.

---

### 6. Database Filters (bandIdTrustBoundary Test)

```typescript
// ✅ ALWAYS TEST: bandIdTrustBoundary.test.ts (static scan)
// This file SCANS all server/db/*.ts for the dangerous pattern:
//   cleanBandId(objeto.band_id || bandId)

describe('bandIdTrustBoundary static scan', () => {
  it('fails if cleanBandId(x.band_id || ...) found', () => {
    const fileContent = readFileSync('server/db/campaigns.ts', 'utf-8');
    
    const dangerousPattern = /cleanBandId\s*\(\s*[^)]*\.band_id\s*\|\|/;
    
    if (dangerousPattern.test(fileContent)) {
      throw new Error(
        'SECURITY: Found cleanBandId(objeto.band_id || ...) pattern. ' +
        'This allows cross-tenant data leak. Use only bandId param.'
      );
    }
  });
});
```

**Why:** This pattern leaked data before. Static scan prevents reintroduction.

---

## 🟡 IMPORTANTE: Lo Que Sí Merece Test

### API Endpoints (Integration Tests)

```typescript
describe('POST /api/leads', () => {
  it('creates lead for authenticated user', async () => {
    const res = await request(app)
      .post('/api/leads')
      .set('Authorization', `Bearer ${token}`)
      .set('x-band-id', bandId)
      .send({
        venue_name: 'The Garage',
        venue_email: 'info@garage.com',
        venue_country: 'Spain'
      });
    
    expect(res.status).toBe(201);
    expect(res.body.id).toBeTruthy();
    expect(res.body.band_id).toBe(bandId);
  });
  
  it('rejects unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/leads')
      .send({ venue_name: 'Test' });
    
    expect(res.status).toBe(401);
  });
});
```

---

### Hooks & Utilities (Unit Tests)

```typescript
describe('useAppData hook', () => {
  it('fetches and caches state', async () => {
    const { result } = renderHook(() => useAppData());
    
    await waitFor(() => {
      expect(result.current.bands).toBeDefined();
      expect(result.current.leads).toBeDefined();
    });
  });
});
```

---

## 🟢 NO Testear (Ahorra Tiempo)

```typescript
// ❌ NO testear (trivial):
- Simple getters/setters
- Framework internals (React rendering details)
- UI styling (use browser for dark mode, responsive)
- Localization strings (use manual review)
- Third-party libs (Google Maps, Gemini API)

// ✅ SÍ testear (logic):
- Data transformation
- Validation
- State machines (lead estados)
- Conditionals
- Error handling
```

---

## 📋 Test Organization by Area

### `server/utils/__tests__/` — MUST Have

```
bandAccess.test.ts         ✅ 100% of this
ssrfGuard.test.ts          ✅ 100% of this
planLimits.test.ts         ✅ 100% of this
auth_bandas.test.ts        ✅ 100% of this
```

### `server/db/__tests__/` — MUST Have

```
bandIdTrustBoundary.test.ts  ✅ 100% (static scan)
leads.test.ts                ✅ Basic CRUD + filtering
bands.test.ts                ✅ Queries return only band's data
```

### `server/services/__tests__/` — Important

```
agentEngine.test.ts        ✅ Human-in-the-loop gates
lectorAgent.test.ts        ✅ Reply detection
```

### `server/routes/__tests__/` — Target 30%+

```
leads.test.ts              ⚠️ Cover unhappy paths
concerts.test.ts           ⚠️ Auth + bandId validation
auth.test.ts               ⚠️ Login, signup, password hashing
```

### `src/__tests__/` — Target 20%+

```
hooks/useAppData.test.ts   ⚠️ Fetching, caching
utils/api.test.ts          ⚠️ Header injection (x-band-id)
components/LeadCard.test.ts ⚠️ State changes (approve/reject)
```

---

## ✅ Pre-PR Testing Checklist

Antes de hacer git push:

```bash
# 1. Type checking (MUST PASS, baseline=0 errors)
npm run tsc --noEmit
✅ Exit code 0

# 2. Bundle check (can esbuild compile this?)
npm run lint
✅ No esbuild errors

# 3. All tests (MUST PASS)
npm test
✅ All tests pass

# 4. Coverage on changed files (target: 70%+)
npm run test:coverage
✅ Review coverage for your files

# 5. Manual spot-checks:
  - [ ] Changed a route? Test login required
  - [ ] Changed DB query? Test it filters by band_id
  - [ ] Changed plan logic? Test both limits (over/under)
  - [ ] Changed agent? Test human-in-the-loop gate
  - [ ] Changed SSRF code? Test URL blocking
```

---

## 🧩 Test Patterns & Mocks

### Fake Request Object

```typescript
export function createFakeRequest(overrides = {}) {
  return {
    user: { 
      id: 'user-1', 
      band_id: 'band-1', 
      availableBands: ['band-1'],
      role: 'leader'
    },
    headers: {},
    body: {},
    ...overrides
  };
}

// Usage:
const req = createFakeRequest({ 
  headers: { 'x-band-id': 'band-2' } 
});
expect(() => getTargetBandId(req)).toThrow();
```

### Fake Supabase

```typescript
// Use real Supabase in tests (or mock for speed)
export async function setupTestDB() {
  const supabase = createClient(TEST_SUPABASE_URL, TEST_ANON_KEY);
  
  // Clear test data before each test
  beforeEach(async () => {
    await supabase.from('leads').delete().neq('band_id', 'fake');
  });
  
  return supabase;
}
```

### Mocking Async Functions

```typescript
vi.mock('server/services/emailAgent', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true })
}));

// Test:
expect(emailAgent.sendEmail).toHaveBeenCalledWith(lead);
```

---

## 📈 Coverage Targets by Area

| Area | Current | Target | Priority |
|------|---------|--------|----------|
| `server/utils` | 60% | 90% | HIGH |
| `server/db` | 55% | 85% | HIGH |
| `server/services` | 40% | 75% | HIGH |
| `server/routes` | 20% | 50% | MEDIUM |
| `src/hooks` | 15% | 40% | MEDIUM |
| `src/components` | 5% | 20% | LOW (manual testing preferred) |

---

## 🚀 How to Run Tests

```bash
# All tests
npm test

# Watch mode (HMR for tests)
npm test -- --watch

# Single file
npx vitest run server/utils/__tests__/bandAccess.test.ts

# By pattern
npx vitest run -t "bandAccess"

# Coverage report
npm run test:coverage
# Opens: coverage/index.html

# Coverage for changed files
npm run test:coverage -- --changed
```

---

## 🔍 When Test is Red: Debugging

```bash
# 1. Read the error (not the stack trace, the first line)
# 2. Reproduce locally:
#    npm test -- --reporter=verbose
# 3. Add console.log in test (it will show in output)
# 4. Run single test: npx vitest run path/to/test.ts

# 5. If it's async, check:
#    - await missing?
#    - Mock not working?
#    - Timeout too short (add timeout: 10000)?
```

---

## 🛑 NEVER Strategies (Anti-Patterns)

```typescript
// ❌ NEVER: Skip test to "make it pass"
it.skip('should validate bandId', () => { ... });  // NO

// ❌ NEVER: Comment out assertion
expect(result).toBe(expected);  // Don't comment this

// ❌ NEVER: Test implementation details
expect(obj.private_field).toBe(123);  // Test behavior, not internals

// ❌ NEVER: Test with time.sleep() instead of await
await new Promise(r => setTimeout(r, 1000));  // Use vi.useFakeTimers()

// ❌ NEVER: Shared state between tests
beforeAll(() => { globalState = ... });  // Each test isolated
```

---

## 📊 Running CI Locally

Match what GitHub CI runs:

```bash
# Exactly what CI does:
npm run tsc --noEmit    # Type checking
npm run lint            # esbuild
npm test                # vitest

# Should all pass before pushing
```

---

## 🎯 Quick Start: First Test You Write

**Goal: Test your first feature with confidence**

```typescript
// server/routes/__tests__/my-new-endpoint.test.ts
import { describe, it, expect } from 'vitest';
import { getTargetBandId } from '../../utils/bandAccess';

describe('GET /api/my-endpoint', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/my-endpoint');
    expect(res.status).toBe(401);
  });
  
  it('filters by bandId', async () => {
    const res = await request(app)
      .get('/api/my-endpoint')
      .set('Authorization', `Bearer ${token}`)
      .set('x-band-id', bandId);
    
    expect(res.status).toBe(200);
    expect(res.body.every(item => item.band_id === bandId)).toBe(true);
  });
  
  it('blocks cross-tenant access', async () => {
    const res = await request(app)
      .get('/api/my-endpoint')
      .set('Authorization', `Bearer ${token}`)
      .set('x-band-id', 'other-band');  // User not in this band
    
    expect(res.status).toBe(403);
  });
});
```

Run it:
```bash
npx vitest run server/routes/__tests__/my-new-endpoint.test.ts
```

---

## 📝 Recap: The Rule

> **"If it can fail in production, test it."**

- ✅ Auth: test
- ✅ bandId filtering: test
- ✅ Plan limits: test
- ✅ Agent gates (human-in-the-loop): test
- ✅ SSRF: test
- ✅ Passwords: test
- ❌ Button renders: manual in browser
- ❌ Color looks good: manual in browser
- ❌ Translation strings: manual review

---

