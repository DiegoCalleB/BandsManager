---
name: supabase-schema-architect
description: PostgreSQL database schema migrations, multi-tenant index optimization, idempotency, and RLS security hardening for Supabase in BandManager.io. Works across Claude Code, Open Code, Cursor, and Gemini.
---

# 🗄️ Skill: Supabase Schema & Database Architect (Universal Agent Standard)

Estándar de arquitectura de datos PostgreSQL y Supabase diseñado por ingenieros de datos de **Google Cloud SQL & Anthropic System Architects**.

---

## ⚡ 1. Reglas de Migración Idempotente

Todas las modificaciones de base de datos deben registrarse en scripts SQL idempotentes dentro de `supabase/migrations/` o `supabase_schema.sql`:

1. **Creación de Tablas:**
   ```sql
   CREATE TABLE IF NOT EXISTS public.ejemplo_tabla (
       id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
       band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
       created_at TIMESTAMPTZ DEFAULT NOW()
   );
   ```
2. **Adición de Columnas:**
   ```sql
   ALTER TABLE public.ejemplo_tabla ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'nuevo';
   ```
3. **Índices Obligatorios para Multi-Tenancy:**
   Toda tabla scopeada por banda DEBE tener un índice compuesto sobre `band_id`:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_ejemplo_tabla_band_id ON public.ejemplo_tabla(band_id);
   ```

---

## 🔒 2. Aislamiento Estricto & Multi-tenancy

- **Single Source of Truth:** Supabase PostgreSQL.
- **Backend Application Scoping:** La capa de aplicación en Express (`getTargetBandId(req)`) es la responsable primaria del aislamiento multi-banda.
- **Acceso a Datos:** Toda función en `server/db/*.ts` debe recibir explícitamente el `bandId` autenticado.

---

## 🚦 Comprobación Rápida
```bash
npm run check:fast
```
