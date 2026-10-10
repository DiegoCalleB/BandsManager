---
id: tabla_booking_campaigns
title: "tabla booking_campaigns"
layer: schema
domain: booking
file: "supabase/migration_campaign_pitch_template.sql"
tags: ["schema", "tabla", "auto"]
---

# 📌 tabla booking_campaigns

> **Ubicación:** `supabase/migration_campaign_pitch_template.sql`  
> **Capa:** `#layer/schema` | **Dominio:** `#domain/booking`

## 📖 Descripción
Tabla de Supabase `booking_campaigns` (2 columnas).

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
_Sin dependencias salientes directas._

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[fn_agentes_correo|Agentes de correo]] *(from #feature)*
- [[fn_asistente_ia|Asistente de IA (chat)]] *(from #feature)*
- [[fn_booking_crm|Booking CRM y pitch]] *(from #feature)*
- [[schema_supabase|Supabase PostgreSQL Schema]] *(from #schema)*
- [[server_db_campaigns|server/db/campaigns.ts]] *(from #db)*
- [[server_routes_agent|server/routes/agent.ts]] *(from #agent)*

---

## 🗄️ Columnas
- `custom_pitch_templates`
- `campaign_tone_rules`

**Definida en:** `supabase/migration_campaign_pitch_template.sql`, `supabase/migration_campaign_tone_rules.sql`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
