# 🔒 Seguridad & Multi-Tenancy - BandManager.io

## 1. El Trust Boundary Fundamental

### El Problema Que Resolvemos

Antes: Una ruta ingenuamente confiaba en `req.body.band_id` o la cabecera `x-band-id` sin validar.
```typescript
// ❌ PELIGRO: Datos de otra banda leakean
const leads = await dbGetLeads(req.body.bandId);
// Usuario 1 de Banda A envía {"band_id": "banda-b"}
// → Lee todos los leads de Banda B (cross-tenant data leak)
```

### La Solución: `getTargetBandId(req)`

Toda ruta DEBE resolver el band_id mediante esta función en `server/utils/bandAccess.ts`:

```typescript
function getTargetBandId(req: Request): string {
  const user = getUserFromRequest(req);
  
  // 1. Si hay cabecera x-band-id, valida que el usuario pertenezca
  const headerBandId = req.headers['x-band-id'];
  if (headerBandId && user.availableBands.includes(headerBandId)) {
    return headerBandId;
  }
  
  // 2. Si no, usa la banda del usuario
  if (user.band_id) {
    return user.band_id;
  }
  
  // 3. Si no, error 403
  throw new ForbiddenError('No band access');
}
```

### Implementación Correcta

```typescript
// ✅ CORRECTO
app.get('/api/leads', requireAuth, (req, res) => {
  const bandId = getTargetBandId(req);  // Validado
  const leads = dbGetLeads(bandId);
  res.json(leads);
});

// ✅ TAMBIÉN CORRECTO (con middleware helper)
app.get('/api/leads', requireAuth, withBandId, (req, res) => {
  const leads = dbGetLeads(req.bandId);  // Ya inyectado por middleware
  res.json(leads);
});

// ❌ PROHIBIDO
app.get('/api/leads', requireAuth, (req, res) => {
  const leads = dbGetLeads(req.body.bandId);  // NO VALIDADO
  res.json(leads);
});
```

---

## 2. Capa de Acceso a Datos: Confianza Cero

### Regla de Oro

Toda función `dbUpsertX(objeto, bandId)` o `dbDeleteX(id, bandId)` DEBE:

1. Recibir `bandId` como parámetro explícito (resuelto por la ruta)
2. Usar SOLO ese `bandId` resuelto para filtros
3. NUNCA confiar en `objeto.band_id` del request body

### Patrón Peligroso (Buscado en CI)

```typescript
// ❌ PELIGRO: introducido en campaigns.ts
function dbUpsertCampaign(campaign, bandId) {
  const cleanId = cleanBandId(campaign.band_id || bandId);  // ← PELIGRO
  return db.campaign.update({ where: { band_id: cleanId }, ... });
}
```

**¿Por qué es peligroso?** Un usuario de Banda A envía:
```json
{
  "name": "new campaign",
  "band_id": "banda-b"  // ← Inyectado en body
}
```
→ La función elige `campaign.band_id` ("banda-b") sobre el `bandId` de sesión
→ Escribe en Banda B (cross-tenant)

### Escaneo Estático en CI

`server/db/__tests__/bandIdTrustBoundary.test.ts` regex-scans todos los archivos `server/db/*.ts` buscando este patrón:

```typescript
// El test falla si encuentra esto:
const match = /cleanBandId\s*\(\s*[^)]*\.band_id\s*\|\|/
```

Si introduces este patrón, **CI falla incluso sin un test dedicado**.

---

## 3. Validación de Planes & Límites (Server-Side)

### El Problema

La UI (`src/utils/planPermissions.ts`) muestra/oculta features según el plan. Pero...
```bash
curl -X POST https://bandmanager.io/api/leads \
  -H "Authorization: Bearer <token>" \
  -d "{"name": "sale", ...}"
```
Un atacante podría bypassear la UI y crear 1000 leads en un plan gratuito.

### La Solución: `checkRecordLimit()` en Server

```typescript
// server/utils/planLimits.ts
function checkRecordLimit(
  bandId: string,
  recordType: 'leads' | 'songs' | 'fans' | etc,
  currentCount: number
): void {
  const plan = getPlanFor(bandId);  // Desde Supabase
  const limits = PLAN_LIMITS[plan];
  
  if (currentCount >= limits[recordType]) {
    throw new BadRequest(`Plan ${plan} allows max ${limits[recordType]} ${recordType}`);
  }
}

// En la ruta:
app.post('/api/leads', requireAuth, async (req, res) => {
  const bandId = getTargetBandId(req);
  const currentCount = await dbCountLeads(bandId);
  
  checkRecordLimit(bandId, 'leads', currentCount);  // ← VALIDACIÓN SERVER
  
  const newLead = await dbCreateLead(req.body, bandId);
  res.json(newLead);
});
```

### Límites por Plan

```typescript
const PLAN_LIMITS = {
  promo: { leads: 0, songs: 0, fans: 250, concerts: 0 },
  ensayo: { leads: 50, songs: 20, fans: 500, concerts: 20 },
  local: { leads: 200, songs: 50, fans: 2000, concerts: 100 },
  de_gira: { leads: 1000, songs: 200, fans: unlimited, concerts: 500 },
  cabeza_de_cartel: { leads: unlimited, songs: unlimited, fans: unlimited, concerts: unlimited },
};
```

**Nunca** confíes solo en la UI para enforcement de límites.

---

## 4. Protección SSRF (Server-Side Request Forgery)

### El Problema

La ruta de "enriquecimiento de salas" hace:
```typescript
const venueData = await fetch(req.body.venueWebsite);  // URL del usuario
```

Un atacante podría inyectar:
```json
{"venueWebsite": "http://127.0.0.1:6379"}  // Accede a Redis local
{"venueWebsite": "http://metadata.google.internal"}  // GCP metadata
```

### La Solución: `esUrlExternaSegura()`

```typescript
// server/utils/ssrfGuard.ts
function esUrlExternaSegura(urlString: string): boolean {
  // 1. Parse URL
  const url = new URL(urlString);
  
  // 2. Bloquea IPs privadas en hostname
  const blockedRanges = [
    '127.0.0.1', 'localhost',
    '10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16',
    '169.254.0.0/16', // Link-local
    '::1', '::ffff:127.0.0.1', // IPv6 loopback
  ];
  
  if (isPrivateIP(url.hostname, blockedRanges)) {
    throw new BadRequest('Private IP not allowed');
  }
  
  // 3. Re-valida DNS (previene DNS rebinding)
  const resolvedIP = await dns.resolve(url.hostname);
  if (isPrivateIP(resolvedIP, blockedRanges)) {
    throw new BadRequest('Resolved IP is private');
  }
  
  return true;
}

// Uso:
app.post('/api/enrich-venue', requireAuth, async (req, res) => {
  const bandId = getTargetBandId(req);
  
  esUrlExternaSegura(req.body.venueWebsite);  // ← VALIDACIÓN
  
  const data = await fetch(req.body.venueWebsite);
  res.json(data);
});
```

**Importante:** Valida AMBOS:
1. La hostname en la URL (bloquea privadas)
2. La IP resuelta (previene DNS rebinding)

---

## 5. Autenticación & Sesiones

### Hash de Contraseña: PBKDF2

```typescript
// server/auth.ts
function hashPassword(password: string): string {
  return crypto
    .pbkdf2Sync(password, salt, iterations=100000, 64, 'sha256')
    .toString('hex');
}

// Legacy fallback (1000 iterations)
function verifyPassword(plaintext: string, hash: string): boolean {
  return timing-safe comparison usando crypto.timingSafeEqual
}
```

### JWT & ACTIVE_SESSIONS

```typescript
// Login genera JWT
const token = jwt.sign(
  { userId: user.id, bandId: user.band_id },
  JWT_SECRET,
  { expiresIn: '7d' }
);

// En-memory session store (resetea en redeploy)
ACTIVE_SESSIONS.set(token, {
  userId: user.id,
  createdAt: Date.now(),
  bandId: user.band_id,
});

// requireAuth middleware
function requireAuth(req, res, next) {
  const token = extractTokenFromHeader(req);
  const session = ACTIVE_SESSIONS.get(token);
  
  if (!session || isExpired(session)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  req.user = { id: session.userId, band_id: session.bandId };
  next();
}
```

---

## 6. Rate Limiting

### Dos Limpiadores Distintos

```typescript
// server/middleware/rateLimiter.ts

// 1. LOGIN: máximo 5 intentos fallidos por IP / 15 min
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutos
  max: 5,
  keyGenerator: (req) => req.ip,
  message: 'Demasiados intentos. Reintenta en 15 min.',
});

// 2. IA GENERATIVA: máximo 50 requests por usuario / hora
export const iaRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,  // 1 hora
  max: 50,
  keyGenerator: (req) => req.user.id,  // Por usuario, no por IP
  message: 'Límite de generación de IA excedido. Reintenta en 1 hora.',
});

// Uso:
app.post('/api/login', loginRateLimiter, loginHandler);
app.post('/api/generate-music', requireAuth, iaRateLimiter, handler);
```

**Regla:** Todo endpoint que consume IA o costo pagado DEBE tener:
1. `requireAuth` (usuario identificado)
2. `iaRateLimiter` (rate limit global)

---

## 7. Almacenamiento de Archivos: X-Content-Type-Options

### El Problema

Uploads permitidos: PNG, PDF, MP3. Un atacante sube:
```bash
curl -F 'file=@malicious.html' -H 'Content-Type: image/png' /api/upload
```

El navegador MIME-sniffs y ejecuta el HTML.

### La Solución

```typescript
// server.ts
app.use(express.static('dist/public', {
  setHeaders: (res, path) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
  },
}));

// En upload handler
app.post('/api/upload', requireAuth, async (req, res) => {
  const file = req.files.file;
  
  // Valida extensión
  const allowed = ['png', 'pdf', 'mp3'];
  const ext = file.name.split('.').pop().toLowerCase();
  
  if (!allowed.includes(ext)) {
    return res.status(400).json({ error: 'File type not allowed' });
  }
  
  // Valida MIME type (magic bytes)
  const mime = await detectFiletype(file.data);
  if (!allowed.includes(mime.ext)) {
    return res.status(400).json({ error: 'Invalid file content' });
  }
  
  // Sube a Supabase Storage
  await supabase.storage
    .from('uploads')
    .upload(`${bandId}/${file.name}`, file.data);
  
  res.json({ url: '...' });
});
```

---

## 8. Errores No Controlados & Resiliencia

### Problema: Crash en Async Handler

```typescript
app.post('/api/leads', requireAuth, async (req, res) => {
  const leads = await dbLoadLeadsAsync();  // Si rechaza sin catch
  // → Promesa rechazada no capturada
  // → Node 22 mata el servidor ENTERO (400+ bandas offline)
});
```

### Solución: Global Handler + Try/Catch

```typescript
// server.ts
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason);
  // Log, alert, pero NO crashear
});

// En cada handler async
app.post('/api/leads', requireAuth, async (req, res) => {
  try {
    const leads = await dbLoadLeadsAsync();
    res.json(leads);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal error' });
  }
});
```

---

## 9. Aprobación Humana: El Safeguard de Agentes

### Flujo Obligatorio

```
Lead creado
    ↓
estado: "nuevo"
    ↓
Redactor genera pitch
    ↓
estado: "generado_pitch"
sub_status: "pendiente_aprobacion"
    ↓ ← HUMANO DEBE REVISAR Y APROBAR AQUÍ
    ├─ Edita si quiere
    └─ Aprueba (botón "Enviar")
        → estado: "aprobado_propuesta"
        → sub_status: vacío
    ↓
Enviador despacha (respeta dispatch_mode)
    ↓
Email enviado o borrador creado
```

**NUNCA se omite la aprobación humana**, incluso en `dispatch_mode: direct_send`.

### Env Var Kill-Switch

```bash
# Railway env
AGENT_EMAIL_MODE=draft    # Solo borradores (seguro)
AGENT_EMAIL_MODE=send     # Despacho real (después de revisar todo)
```

Si `AGENT_EMAIL_MODE != 'send'`, el Enviador SOLO crea borradores, nunca envía.

---

## 10. Checklist de Seguridad

Antes de pushear a `main`:

- [ ] ¿New route que toca datos de banda? Usa `getTargetBandId(req)`
- [ ] ¿Acceso a DB? No leen `req.body.band_id` directamente
- [ ] ¿Fetch a URL externa? Pasa `esUrlExternaSegura(url)`
- [ ] ¿Endpoint de IA? `requireAuth` + `iaRateLimiter`
- [ ] ¿Upload? Valida extensión + MIME + `X-Content-Type-Options: nosniff`
- [ ] ¿Async handler? Try/catch implementado
- [ ] ¿New plan limit? Validado server-side con `checkRecordLimit()`
- [ ] ¿Tests de security?  Mínimo: "user A no puede leer datos de user B"

---

