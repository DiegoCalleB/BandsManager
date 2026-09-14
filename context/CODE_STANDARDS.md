# 🛠️ Estándares de Código - BandManager.io

## 1. TypeScript Strict Mode

### Baseline: 0 Errores Nuevo

```bash
npm run tsc --noEmit
# Debe retornar 0 errores (baseline en CI = 0)
# Evitar new `any` implícitos
```

**Regla:** Nunca introduzcas nuevos errores de TypeScript. Si heredas código viejo con `any`, debes mejorarlo (es deuda técnica preexistente que está OK dejar).

### Checklist TypeScript

- [ ] Sin `any` nuevo (excepto tipos heredados)
- [ ] Sin `@ts-ignore` (usa `as Type` si necesitas cast)
- [ ] Funciones exportadas tienen return type explícito
- [ ] Imports/exports son específicos (no `import * as`)

---

## 2. Backend: Express + Node 22

### Estructura de Rutas

```typescript
// ✅ CORRECTO: Modular, con middleware explícito
app.get('/api/leads', requireAuth, withBandId, async (req, res) => {
  try {
    const leads = await dbGetLeads(req.bandId);
    res.json(leads);
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
});

// ❌ PROHIBIDO: Sin try/catch, confianza en body.bandId
app.get('/api/leads', requireAuth, (req, res) => {
  const leads = await dbGetLeads(req.body.bandId);  // FALLO
  res.json(leads);
});
```

### Async Handlers: Try/Catch Obligatorio

```typescript
// Toda ruta async DEBE tener try/catch
app.post('/api/send-email', requireAuth, async (req, res) => {
  try {
    // Lógica aquí
    const result = await sendEmailAsync(...);
    res.json(result);
  } catch (err) {
    // No silenciar, loguear
    logger.error('Send email failed:', err);
    res.status(500).json({ error: 'Could not send email' });
  }
});
```

### Rate Limiting en Endpoints Costosos

```typescript
// Todo endpoint que consume IA o cuota pagada
app.post('/api/generate-music', 
  requireAuth,        // Usuario identificado
  iaRateLimiter,      // Rate limit
  async (req, res) => {
    // Lógica
  }
);
```

### Validación de Entrada

```typescript
// ✅ Valida INPUT
function createLead(req: Request) {
  const { venue_name, venue_email } = req.body;
  
  // Validar tipos
  if (typeof venue_name !== 'string' || venue_name.length < 3) {
    throw new BadRequest('Invalid venue_name');
  }
  
  // Validar email
  if (!isValidEmail(venue_email)) {
    throw new BadRequest('Invalid venue_email');
  }
  
  // Continuar...
}

// ❌ Nunca: Confiar ciegamente en datos del usuario
const lead = { ...req.body };  // PELIGROSO
```

### Logging

```typescript
// Usar logger centralizado (console.log en dev, Winston/Pino en prod)
import { logger } from './utils/logger';

logger.info('Lead created', { leadId: '123', bandId: 'band-x' });
logger.error('Scout failed', { error: err.message });
logger.warn('Rate limit exceeded', { userId: '456' });
```

---

## 3. Frontend: React 19 + Vite

### Componentes Funcionales (Hooks)

```typescript
// ✅ CORRECTO: Componente funcional con hooks
export function LeadCard({ lead }: { lead: Lead }) {
  const [isEditing, setIsEditing] = useState(false);
  
  const handleSave = async () => {
    await api.updateLead(lead.id, lead);
    setIsEditing(false);
  };
  
  return (
    <div>
      {isEditing ? (
        <input value={lead.name} onChange={...} />
      ) : (
        <div>{lead.name}</div>
      )}
    </div>
  );
}

// ❌ NO: Class components (salvo casos muy especiales)
class LeadCard extends React.Component {
  // Outdated
}
```

### Data Fetching: Centralizado en `src/services/api.ts`

```typescript
// ✅ CORRECTO: Usa centralizado
import { api } from '../services/api';

export function LeadsPage() {
  const [leads, setLeads] = useState([]);
  
  useEffect(() => {
    api.getLeads().then(setLeads);
  }, []);
  
  return <div>{leads.map(lead => ...)}</div>;
}

// ❌ PROHIBIDO: fetch directo desde componente
export function LeadsPage() {
  useEffect(() => {
    fetch('/api/leads', {
      headers: { 'Authorization': `Bearer ${token}` }  // ¿De dónde?
    }).then(...);
  }, []);
}
```

### Forms & Validación

```typescript
// Valida EN CLIENTE y EN SERVIDOR (nunca solo client)
export function CreateLeadForm() {
  const [error, setError] = useState('');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validación client (UX)
    if (!venue_name || venue_name.length < 3) {
      setError('Venue name must be 3+ chars');
      return;
    }
    
    // Server validará de nuevo (seguridad)
    const result = await api.createLead({ venue_name, ... });
    if (!result.ok) {
      setError(result.error);  // Si server rechaza, muestra error
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input value={venue_name} onChange={...} />
      {error && <div className="text-red-500">{error}</div>}
      <button>Create</button>
    </form>
  );
}
```

### Tailwind CSS v4 + Dark Mode

```tsx
// ✅ CORRECTO: Responsive, dark-aware
export function Card({ children }) {
  return (
    <div className="bg-white dark:bg-slate-900 text-black dark:text-white p-4 rounded-lg">
      {children}
    </div>
  );
}

// ✅ Responsive layout
export function LeadsList({ leads }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {leads.map(lead => <LeadCard key={lead.id} lead={lead} />)}
    </div>
  );
}

// ❌ PROHIBIDO: Colors hardcoded, no responsive
export function Card({ children }) {
  return (
    <div style={{ backgroundColor: '#fff', color: '#000' }}>  // No dark mode
      {children}
    </div>
  );
}
```

### Error Boundaries

```typescript
// Captura errores en subtree de componentes
export class LeadsErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    logger.error('Error in Leads:', errorInfo);
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong. Refresh and try again.</div>;
    }
    
    return this.props.children;
  }
}

// Usa en App.tsx
<LeadsErrorBoundary>
  <LeadsPage />
</LeadsErrorBoundary>
```

---

## 4. Testing: Vitest

### Ubicación & Convención

```
src/
├── components/
│   ├── LeadCard.tsx
│   └── __tests__/
│       └── LeadCard.test.ts     ← Próximo a componente
server/
├── routes/
│   ├── leads.ts
│   └── __tests__/
│       └── leads.test.ts
```

### Estilo: Unit Tests Puros

```typescript
// ✅ CORRECTO: Test de función pura
import { normalizePlan } from '../utils/planLimits';

describe('normalizePlan', () => {
  it('maps promo to tier 0', () => {
    expect(normalizePlan('promo')).toBe(0);
  });
  
  it('maps ensayo to tier 1', () => {
    expect(normalizePlan('ensayo')).toBe(1);
  });
});

// ✅ CORRECTO: Test de helper con fake estado
import { getTargetBandId } from '../utils/bandAccess';

describe('getTargetBandId', () => {
  it('returns bandId from session if header is absent', () => {
    const req = {
      user: { band_id: 'band-a' },
      headers: {},
    };
    
    expect(getTargetBandId(req)).toBe('band-a');
  });
  
  it('blocks cross-tenant access', () => {
    const req = {
      user: { band_id: 'band-a', availableBands: ['band-a'] },
      headers: { 'x-band-id': 'band-b' },  // Usuario no en band-b
    };
    
    expect(() => getTargetBandId(req)).toThrow(ForbiddenError);
  });
});

// ❌ EVITAR: Spin up full Express app (usa helpers puros)
import request from 'supertest';
const app = express();
app.get('/api/leads', handler);

describe('GET /api/leads', () => {
  it('returns leads', async () => {
    const res = await request(app).get('/api/leads');
    expect(res.status).toBe(200);
  });
});
// ^ Esto es OK si el test es crítico, pero preferir test de helpers
```

### Coverage Target

```bash
npm run test:coverage

# Prioridad:
# 1. server/utils (auth, bandAccess, ssrfGuard) — DEBE cubrir
# 2. server/db (multi-tenancy checks) — DEBE cubrir
# 3. server/routes (handlers) — Segundo nivel
# 4. src/ (components) — Tercero
```

---

## 5. Ediciones & Cambios: Quirúrgicos

### Regla: Minimal Diff

```typescript
// ❌ MALO: Refactoriza mientras arreglas bug
// (Aumenta diff, dificulta review, introduce regressions)
function dbGetLeads(bandId: string) {
  // TODO: Aquí arreglar bug + refactorizar nombre variables + mejorar logs
  // Result: cambio de 200 líneas cuando solo necesitaba 5
}

// ✅ CORRECTO: Arregla bug, guarda refactor para otro PR
function dbGetLeads(bandId: string) {
  // Arregla SOLO el bug
  const result = supabase
    .from('leads')
    .select('*')
    .eq('band_id', bandId)  // ← Bug: faltaba este filter
    .order('created_at', { ascending: false });
  
  return result.data;
}
// Refactor del nombre/logs → Separate PR
```

### No Borres Sin Preguntar

Si algo parece no usado:

1. Grep: ¿Está referenciado en otro lado?
   ```bash
   grep -r "oldFunctionName" server/
   ```
2. Si cero referencias → Pregunta en PR antes de borrar
3. Si YES referencias → Arregia esas primero, luego borra

---

## 6. Comentarios: Solo Cuando Explica el "Por Qué"

```typescript
// ✅ BUENO: Explica decisión no obvia
// Valida DNS DESPUÉS de URL parsing porque DNS rebinding puede
// devolver IP privada incluso si hostname parecía externo
const resolvedIP = await dns.resolve(url.hostname);
if (isPrivateIP(resolvedIP)) {
  throw new Error('IP resolved to private range');
}

// ❌ MALO: Solo repite el código
// Incrementa el contador
counter++;

// ❌ MALO: Docstring multi-párrafo (demasiado)
/**
 * Fetches leads for a band.
 * This function queries the Supabase database
 * and returns an array of lead objects
 * with all their properties.
 * Call this in your route handlers to get leads.
 */
async function dbGetLeads(bandId: string) {
  // ...
}
// ^ Solo una línea si necesita: "Fetches leads for band, ordered by date"
```

---

## 7. Commits & PRs

### Mensaje de Commit

```bash
# ✅ FORMATO
fix: guard against cross-tenant lead access in dbGetLeads

Previously dbGetLeads trusted req.body.bandId directly, allowing
a user of band-a to read leads from band-b. Now always uses
getTargetBandId(req) to validate session.

Fixes #123.

Co-Authored-By: Claude Haiku 4.5 <noreply@anthropic.com>

# STRUCTURE:
# Line 1: type: short summary (< 50 chars)
# Line 2: blank
# Line 3+: explain the WHY and WHAT (< 72 chars per line)
# Last line: Co-Authored-By footer (si es AI)
```

### PR Description

```markdown
## Summary
- Adds SSRF validation to lead enrichment endpoints
- Blocks private IP ranges + re-validates DNS

## Testing
- [x] Unit test: esUrlExternaSegura blocks 127.0.0.1
- [x] Unit test: Detects DNS rebinding (resolves to private)
- [x] Manual: Tried to enrich with http://localhost:6379 → blocked

## Changes
- server/utils/ssrfGuard.ts: new function
- server/routes/leads.ts: import and use in enrichment handler
- server/utils/__tests__/ssrfGuard.test.ts: tests

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

---

## 8. Checklist Pre-Push

- [ ] `npm run tsc --noEmit` → 0 nuevos errores
- [ ] `npm run lint` → pasa (esbuild can bundle)
- [ ] `npm test` → todo verde
- [ ] Diff es mínimo (no refactores acoplados)
- [ ] No hay `console.log` (usa logger)
- [ ] No hay `any` nuevo
- [ ] Multi-tenancy: usado `getTargetBandId` donde aplica
- [ ] Async handlers tienen try/catch
- [ ] Endpoints de IA tienen rate limit
- [ ] Commit message explica el POR QUÉ

---

