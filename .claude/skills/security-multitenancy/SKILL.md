---
name: security-multitenancy
description: Guía de auditoría de seguridad y aislamiento multi-inquilino para Express y Supabase en BandManager.io. Usar al modificar rutas de servidor, endpoints API o consultas a base de datos.
---

# 🛡️ Skill: Seguridad & Aislamiento Multi-Inquilino (Multi-Tenancy Guard)

Esta skill proporciona las directivas y listas de verificación para garantizar la máxima seguridad, aislamiento de datos por banda y prevención de vulnerabilidades en el backend Express y la capa de base de datos Supabase.

---

## 🔒 1. Principio del Límite de Confianza (Trust Boundary)

### Regla de Oro
**Jamás confíes en los datos enviados en el cuerpo (`req.body.band_id`) o cabeceras del cliente para determinar los permisos de acceso.**

### Patrón Correcto en Rutas Express
Toda ruta en `server/routes/*.ts` debe resolver la banda mediante `getTargetBandId(req)` resuelto desde la sesión autenticada:

```typescript
import { getTargetBandId } from '../utils/bandAccess.js';

app.get('/api/leads', requireAuth, async (req, res) => {
  // 1. Obtener la banda autenticada/autorizada desde la sesión
  const bandId = getTargetBandId(req);
  if (!bandId) {
    return res.status(403).json({ error: 'No tienes acceso a ninguna banda' });
  }

  // 2. Consultar la capa de DB usando estrictamente bandId
  const leads = await dbGetLeads(bandId);
  return res.json(leads);
});
```

### Anti-Patrón Prohibido (Fuga Cross-Tenant)
```typescript
// ❌ PROHIBIDO: Permite que un atacante inyecte "band_id": "otra-banda" en el body
const cleanBandId = (obj.band_id || bandId);
```

---

## 🌐 2. Protección SSRF (Server-Side Request Forgery)

Cualquier llamada `fetch()` del servidor a una URL externa provista por un usuario (ej. web de una sala para scraping o enriquecimiento) DEBE pasar por la función `esUrlExternaSegura` (`server/utils/ssrfGuard.ts`).

```typescript
import { esUrlExternaSegura } from '../utils/ssrfGuard.js';

async function enriquecerWebSala(url: string) {
  // 1. Validar que la URL no apunta a localhost, 127.0.0.1, 169.254.x.x o IP privada
  const esSegura = await esUrlExternaSegura(url);
  if (!esSegura) {
    throw new Error('URL rechazada por motivos de seguridad SSRF');
  }

  // 2. Proceder con el fetch
  return fetch(url);
}
```

---

## ⚡ 3. Rate-Limiting & Protección de Endpoints de IA

Cualquier endpoint que llame a APIs pagadas de IA generativa (Gemini, Lyria, OpenAI) o procesamiento pesado DEBE estar resguardado con autenticación y el rate-limiter correspondiente (`server/middleware/rateLimiter.ts`):

```typescript
import { requireAuth } from '../auth.js';
import { iaRateLimiter } from '../middleware/rateLimiter.js';

// ✅ Aplica tanto autenticación como limitador de velocidad
app.post('/api/generate-music', requireAuth, iaRateLimiter, async (req, res) => {
  // Lógica de generación...
});
```

---

## 📦 4. Descargas y Exportaciones de Datos (Bulk Exports)

Cualquier endpoint que exporte datos masivos (Excel, CSV, PDF, JSON) DEBE filtrar el dataset con la clave `band_id` de la sesión resuelta.

```typescript
app.get('/api/download-excel', requireAuth, async (req, res) => {
  const bandId = getTargetBandId(req);
  // ✅ Filtrar solo registros de la banda autenticada
  const datos = await dbGetConcertsByBandId(bandId);
  const buffer = generarExcel(datos);
  res.attachment('conciertos.xlsx').send(buffer);
});
```

---

## 💳 5. Validación de Límites de Plan en Servidor (`checkRecordLimit`)

Toda mutación en el backend que añada registros (salas/leads, contactos de medios, canciones, bandas, fans) DEBE validar los límites del plan del usuario (incluyendo el Plan `promo`) usando `checkRecordLimit` de `server/utils/planLimits.ts`:

```typescript
import { checkRecordLimit } from '../utils/planLimits.js';

const limitCheck = checkRecordLimit(req.user.plan, 'leads', currentLeadsCount);
if (!limitCheck.allowed) {
  return res.status(403).json({ error: limitCheck.message });
}
```

---

## ✅ Lista de Comprobación Antes de Enviar Código (Checklist)

- [ ] ¿La ruta usa `getTargetBandId(req)` para resolver el `band_id`?
- [ ] ¿El handler de DB recibe `bandId` como argumento de confianza?
- [ ] ¿Se han evitado accesos directos a `req.body.band_id`?
- [ ] ¿Se validan los límites del plan con `checkRecordLimit` en creaciones?
- [ ] ¿Las URLs externas pasan por `esUrlExternaSegura`?
- [ ] ¿Los endpoints de IA incluyen `requireAuth` e `iaRateLimiter`?
- [ ] ¿Se han ejecutado los tests de trust boundary (`npx vitest run server/db/__tests__/bandIdTrustBoundary.test.ts`)?
- [ ] Si el diff toca datos externos (scraping, email entrante) que llegan a un prompt de IA: ¿pasa por `sanitizeExternalText` (`server/utils/promptSafety.ts`)? Ver skill `agentic-harness` para el detalle.

