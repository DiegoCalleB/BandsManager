# 🤖 Reglas de Negocio de Agentes IA - BandManager.ai

## 1. Principio Fundamental: Human-in-the-Loop, Siempre

> **NO hay envío de email automático sin aprobación humana explícita. NUNCA.**

Incluso bandas en modo "hands-off" (`dispatch_mode: direct_send`) deben aprobar antes. El `dispatch_mode` SOLO decide qué pasa DESPUÉS (borrador vs. envío directo), nunca ANTES.

---

## 2. Estados del Lead: 2 Dimensiones

### Dimensión 1: CRM Funnel (`estado`)

| Estado | Significado | Quién puede transitar |
|--------|-------------|----------------------|
| `nuevo` | Lead recién descubierto | Scout, Manual input |
| `contactado` | Email inicial enviado | Enviador (post-aprobación) |
| `esperando_respuesta` | Enviado, esperando reply | Manual (transition) |
| `respondido` | La sala contestó | Lector (automático) |
| `negociando` | Negociación activa de fechas/cache/tech | Manual |
| `confirmado` | Concierto cerrado, → Calendar | Manual |
| `aplazado` | Pospuesto para próxima temporada | Manual |
| `no_interesado` | Sala rechazó explícitamente | Manual |

### Dimensión 2: Cola Agéntica (`agentic_status`)

| Sub-estado | Significado | Quién puede entrar |
|------------|-------------|-------------------|
| (vacío) | No está en cola agéntica | Cuando no hay propuesta |
| `pendiente_aprobacion` | Pitch generado, esperando OK humano | Redactor (post-generación) |
| `aprobado_propuesta` | Pitch OK para envío inicial | Humano (aprueba) |
| `aprobado_respuesta` | Réplica a sala OK para envío | Humano (aprueba) |
| `borrador_creado` | Borrador en Gmail/IMAP, esperando envío manual o automático | Enviador (post-aprobación) |

### Transiciones Válidas

```
nuevo
  → [Redactor] → pitch_generado + pendiente_aprobacion
      └─ [Humano REVISA] 
          → aprobado_propuesta
              → [Enviador] → borrador_creado / contactado (según dispatch_mode)
                  ├─ Si draft_gmail: borrador_creado
                  └─ Si direct_send: contactado
```

---

## 3. Los Cuatro Agentes de Booking

### 1️⃣ SCOUT (`server/utils/scoutLeads.ts`, `server/auto_enrichment.ts`)

**Función:** Descubre y enriquece salas/festivales

**Inputs:**
- Criterios de búsqueda (país, ciudad, género, capacidad)
- Web scraping + APIs (Songkick, Resident Advisor, Google Places, etc.)

**Proceso:**
1. Busca salas que encajen con el perfil de la banda
2. Valida URL via SSRF guard
3. Extrae: nombre, email, teléfono, dirección, capacidad, sitio web
4. Enriquece con IG followers, ratings, etc.

**Output:**
- Crea `lead` en Supabase con `estado: nuevo`
- Guarda en `lead_enrichment` metadatos adicionales

**Triggered by:**
- Scheduler (60s tick) vía `server/services/agentScheduler.ts`
- O manualmente vía `POST /api/agent/scout` (admin)

**Límites:**
- Rate limit: no más de 50 leads/hora (evita baneos de IPs)
- Plan-aware: solo si banda está en `de_gira` o `cabeza_de_cartel`

---

### 2️⃣ REDACTOR

**Función:** Genera pitch personalizado para la sala

**Inputs:**
- Lead (nombre sala, género banda, historia, links EPK/YouTube)
- Historial de conciertos pasados
- Tono configurado por banda

**Proceso:**
1. Lee lead en `estado: nuevo`
2. Construye contexto (EPK, setlist, hits recientes)
3. Llama Claude API → genera pitch personalizado
   ```markdown
   Hola [Sala],
   
   Somos [Banda], una banda de [género] de [ciudad]...
   Hemos tocado en [salas similares]...
   Proponemos la fecha del [rango flexible]...
   [Link YouTube] / [EPK]
   
   ¿Qué os parece?
   ```
4. Guarda en `lead.pitch_generado`
5. Transita a `agentic_status: pendiente_aprobacion`

**Output:**
- `lead.pitch_generado` (text)
- `lead.pitch_generado_at` (timestamp)
- `agentic_status: pendiente_aprobacion`

**Triggered by:**
- Scheduler (cuando hay leads en `estado: nuevo`)
- Manual via UI (usuario selecciona leads → "Generar Pitches")

**Límites:**
- Max 20 pitches/hora (rate limit en Claude API)
- Validación: pitch no vacío, > 50 chars

---

### 3️⃣ HUMANO (Approval Gate)

**Función:** Revisa y aprueba (o edita y aprueba) propuestas

**Interfaz:**
- `LeadCard.tsx` muestra pitch generado
- Botones: "Editar" (sí), "Aprobar" (sí), "Rechazar" (no)
- Si edita: campo de texto editable, aprueba con nuevo texto

**Estados Finales:**
- ✅ Aprueba → `agentic_status: aprobado_propuesta`
- 📝 Edita + Aprueba → guarda texto editado, `agentic_status: aprobado_propuesta`
- ❌ Rechaza → `agentic_status` vacío, vuelve a `estado: nuevo`

**Ningún envío sin este paso.** No hay bypass.

---

### 4️⃣ ENVIADOR (`server/services/agentEngine.ts`)

**Función:** Despacha emails (respeta aprobación humana, ventanas horarias, rate limits)

**Inputs:**
- Leads con `agentic_status: aprobado_propuesta` o `aprobado_respuesta`
- Email account (Gmail OAuth2 o IMAP/SMTP)
- Ventana horaria de la banda (`band_schedules.horas_enviador`, `dias_enviador`)

**Proceso:**
1. Valida env var: `AGENT_EMAIL_MODE != 'draft'` → sale si está en draft-only
2. Valida ventana horaria: ¿está en horario de envío de la banda?
3. Lee email account conectada (prefer Gmail OAuth2)
4. Según `dispatch_mode`:
   - **`draft_gmail`** (default): crea draft en Gmail, no envía. Usuario revisa en Gmail y envía manual.
   - **`direct_send`**: envía directo via SMTP/Gmail API
5. Guarda `gmail_draft_id` si draft (para Lector que detecte si fue enviado manual)
6. Transita `estado: contactado` o `esperando_respuesta`

**Output:**
- Draft en Gmail inbox o email enviado
- `lead.gmail_draft_id` (si aplicable)
- `lead.contacted_at` (timestamp)
- `lead_messages` entry: { role: 'assistant', content: '[email sent]' }

**Triggered by:**
- Scheduler (60s tick, respeta ventana horaria)

**Límites:**
- Max 20 emails/hora por banda (rate limit)
- Max 100 emails/día por cuenta Gmail (límite Gmail API)
- Respeta `band_schedules` (ej: no enviar a las 3 AM)

---

### 5️⃣ LECTOR (`server/services/lectorAgent.ts`)

**Función:** Monitorea buzón, detecta respuestas, actualiza lead state

**Inputs:**
- Email account (Gmail OAuth2 o IMAP/IMAP)
- Lead IDs esperando respuesta
- Gmail drafts enviados manualmente

**Proceso:**
1. Cada 60s (no respeta ventana horaria; siempre activo)
2. Conecta a Gmail/IMAP
3. Busca:
   - **Respuestas a emails enviados** (detecta refs de thread)
   - **Drafts reenviados manualmente** (detecta si draft_id fue enviado)
4. Si respuesta:
   - Transita `estado: respondido`
   - Guarda mensaje en `lead_messages` (role: 'user', content: '[reply]')
5. Si draft manual (comprobarBorradoresGmailEnviados):
   - Transita `estado: contactado` (indica: "lo mandó el usuario manualmente")
   - Guarda `lead.sent_at`

**Output:**
- `lead_messages` actualizado (hilo de conversación)
- `estado` transita a `respondido` / `contactado`
- `lead.replied_at` (timestamp)

**Triggered by:**
- Scheduler (60s tick, SIEMPRE, no respeta ventana)
- O manual via `GET /api/agent/lector` (admin)

**Límites:**
- Max 1000 emails revisados/hora (límite API Gmail)
- Cache en-memory para no re-procesar (agent_schedule_state)

---

## 4. Máquina de Estados Completa (Ejemplo Real)

```
[Humano crea lead manualmente]
         ↓
    estado: nuevo
    agentic_status: (vacío)
         ↓
[Scout o Redactor dispara automático]
         ↓
    Redactor genera pitch
         ↓
    estado: nuevo (sin cambios)
    agentic_status: pendiente_aprobacion
    pitch_generado: "Hola, somos..."
         ↓
[HUMANO REVISA EN UI]
         ├─ Rechaza → agentic_status vacío, vuelve a nuevo
         └─ Aprueba → agentic_status: aprobado_propuesta
                         ↓
         [Enviador en siguiente tick]
         ├─ dispatch_mode: draft_gmail
         │      ├─ Crea draft en Gmail
         │      ├─ gmail_draft_id: "...xxx"
         │      └─ estado: esperando_respuesta
         │
         └─ dispatch_mode: direct_send
                ├─ Envía directo
                └─ estado: contactado
                        ↓
         [Lector monitorea próximos ticks]
         ├─ Si respuesta → estado: respondido
         ├─ Si draft manual (comprobarBorradoresGmailEnviados)
         │   → estado: contactado (indica "lo envió el usuario")
         └─ Timeout X días sin respuesta
             → estado: esperando_respuesta (sigue ahí)
```

---

## 5. Gates de Seguridad

### Gate 1: `AGENT_EMAIL_MODE` (Global, Server Env)

```bash
# Railway env var (no editable por banda)
AGENT_EMAIL_MODE=draft    # ← PRODUCCIÓN ACTUAL (SEGURO)
AGENT_EMAIL_MODE=send     # ← Solo después de audit/OK ejecutivo
```

**Lógica en Enviador:**
```typescript
if (process.env.AGENT_EMAIL_MODE !== 'send') {
  // Crea SOLO borradores, nunca envía
  await createDraft(lead);
} else {
  // Puede enviar (si dispatch_mode lo permite)
  await sendEmail(lead);
}
```

### Gate 2: `autonomy_configs.dispatch_mode` (Per Band)

```sql
autonomy_configs (
  band_id,
  dispatch_mode: 'draft_gmail' | 'direct_send',  -- Configurable per band
  ...
)
```

**Lógica en Enviador:**
```typescript
if (autonomy_config.dispatch_mode === 'draft_gmail') {
  // Draft para revisión final
  await createDraft(lead);
} else if (autonomy_config.dispatch_mode === 'direct_send') {
  // Envía directo (aún requiere aprobación en UI)
  await sendEmail(lead);
}
```

### Gate 3: Aprobación Humana Obligatoria

**ANTES de que cualquier Enviador roce un email:**

1. ✅ Lead debe estar en `agentic_status: aprobado_propuesta` o `aprobado_respuesta`
2. ✅ Ese status SOLO se obtiene cuando humano presiona "Aprobar" en UI
3. ✅ Si rechaza o la propuesta no pasa validación, nunca entra en cola de envío

```typescript
// En Enviador:
const lead = await dbGetLead(leadId);

// Validación: ¿está aprobado?
if (lead.agentic_status !== 'aprobado_propuesta' && 
    lead.agentic_status !== 'aprobado_respuesta') {
  // Skip this lead, no enviar
  continue;
}

// Solo si pasa, procede
await sendOrDraft(lead);
```

---

## 6. Información Que Los Agentes Deben Saber

### Scout
- Géneros, país, ciudad favoritos de la banda
- Salas históricas donde ha tocado
- Capacidad mínima/máxima
- Radio de búsqueda geográfico
- Palabras clave (ej: "festival de rock independiente")

### Redactor
- Nombre/historia de la banda
- Links: EPK, YouTube, Spotify, Instagram
- Logros recientes (hits, conciertos)
- Tono de voz de la banda (formal, casual, funny)
- Disponibilidad general (semanas específicas NO)
- Cache mínimo negociable

### Enviador
- Email de contacto de la sala (del Scout)
- Ventana horaria de envío (`band_schedules`)
- Dispatch mode (draft vs. direct)
- Email account conectada (Gmail OAuth2 > IMAP)

### Lector
- ID de leads "esperando respuesta"
- Gmail draft IDs (para detectar sends manuales)
- Palabras clave de interés en replies (ej: "¿qué precio?")

---

## 7. Casos de Error & Recuperación

### Scout falla (red, scrape timeout)
- Loga error
- Próximo tick reintenta (máx 3 veces)
- Si persiste, marca lead como `enrichment_failed`

### Redactor falla (Claude API down)
- Loga error
- Lead queda en `estado: nuevo` (no entra en cola agéntica)
- Humano reintenta manualmente

### Enviador falla (Gmail API, SMTP)
- Loga error
- Lead queda en `agentic_status: aprobado_propuesta` (sigue aprobado)
- Reintenta próximo tick

### Lector falla (Gmail timeout)
- Loga error
- Salta ese lote, próximo tick reintenta
- Nunca pierde un email (Gmail quedó guardado)

---

## 8. Auditoría & Logs

Cada transición debe quedar registrada en `lead_audit_log`:

```sql
lead_audit_log (
  id,
  lead_id,
  band_id,
  user_id,       -- NULL si fue agente
  agent_name,    -- 'scout', 'redactor', 'enviador', 'lector'
  action,        -- 'created', 'pitch_generated', 'approved', 'sent', 'replied'
  from_state,    -- estado anterior
  to_state,      -- estado nuevo
  metadata_json, -- { pitch_length, api_used, ... }
  created_at
)
```

Ejemplo:
```
lead_id: 'lead-123'
agent_name: 'redactor'
action: 'pitch_generated'
from_state: 'nuevo'
to_state: 'nuevo' (sin cambios en estado principal)
metadata: { pitch_length: 287, model: 'claude-3-sonnet', duration_ms: 1245 }
```

---

## 9. Configuración por Banda (Autonomy Config)

```sql
autonomy_configs (
  band_id,
  scout_enabled: bool,           -- ¿Activar Scout automático?
  redactor_enabled: bool,        -- ¿Activar Redactor automático?
  enviador_enabled: bool,        -- ¿Activar Enviador automático?
  lector_enabled: bool,          -- ¿Activar Lector automático?
  dispatch_mode: 'draft_gmail' | 'direct_send',
  horas_enviador: "09:00-18:00", -- Ventana horaria de envío
  dias_enviador: "lun-vie",      -- Días permitidos
  cache_minimo: 500,             -- €/mínimo negociable
  ...
)
```

**Configuración por defecto (promo/ensayo):**
- Scout: OFF
- Redactor: OFF
- Enviador: OFF (pero UI permite crear borradores manual)
- Lector: ON (siempre, para monitorear respuestas manuales)

**Configuración `de_gira`/`cabeza_de_cartel`:**
- Scout: ON (configurable)
- Redactor: ON (configurable)
- Enviador: ON (configurable, respeta dispatch_mode)
- Lector: ON (siempre)

---

## 10. Checklist: ¿Es Seguro Esto?

Antes de deployer cualquier cambio en agentes:

- [ ] ¿AGENT_EMAIL_MODE está en `draft`?
- [ ] ¿Todo email requiere aprobación en UI (`pendiente_aprobacion` → `aprobado_propuesta`)?
- [ ] ¿Redactor genera pitch pero NO envía directamente?
- [ ] ¿Enviador valida `agentic_status` antes de tocar emails?
- [ ] ¿Lector detecta drafts manuales correctamente?
- [ ] ¿Rate limits implementados en Scout, Redactor, Enviador?
- [ ] ¿Logs de auditoría en cada transición agéntica?
- [ ] ¿Tests: usuario A no puede ver respuestas de usuario B?

---

