---
id: tabla_registered_bands
title: "tabla registered_bands"
layer: schema
domain: system
file: "supabase_schema.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla registered_bands

> **Ubicación:** `supabase_schema.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/system`

## 📖 Descripción
Tabla de Supabase `registered_bands` (32 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[agent_enviador|Enviador Agent (Dispatcher)]] *(from #agent)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_bands|server/db/bands.ts]] *(from #db)*
- [[server_db_epk|server/db/epk.ts]] *(from #db)*
- [[server_db_referidos|server/db/referidos.ts]] *(from #db)*
- [[server_db_social|server/db/social.ts]] *(from #db)*
- [[server_db_users|server/db/users.ts]] *(from #db)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*
- [[server_routes_bands|server/routes/bands.ts]] *(from #route)*
- [[server_routes_billing|server/routes/billing.ts]] *(from #route)*
- [[server_routes_epk_fans|server/routes/epk_fans.ts]] *(from #route)*
- [[server_routes_gmailOAuth|server/routes/gmailOAuth.ts]] *(from #security)*
- [[server_services_emailAgentClient|server/services/emailAgentClient.ts]] *(from #agent)*

---

## 🗄️ Columnas
- `id`
- `band_id`
- `user_id`
- `fecha_registro`
- `nombre_banda`
- `email`
- `plan`
- `contacto_nombre`
- `estilo_musical`
- `localizacion`
- `telefono`
- `instagram`
- `spotify_youtube`
- `aforo_promedio`
- `estado_cuenta`
- `notas`
- `radar_enabled`
- `last_social_radar_at`
- `dna_expresion`
- `created_at`
- `updated_at`
- `tier`
- `plan_pendiente`
- `fecha_cambio_plan`
- `estado_suscripcion`
- `creditos_periodo`
- `creditos_usados`
- `logo_url`
- `imagen_url`
- `ref_code`
- `referido_por`
- `referido_en`

**Definida en:** `supabase_schema.sql`, `supabase_migration_only_new.sql`, `supabase/migrations/20260915_ai_token_ledger_band_scope.sql`, `supabase/migrations/20261009_sincronizar_esquema_auditoria.sql`, `supabase/migrations/20261016_referidos_banda.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
