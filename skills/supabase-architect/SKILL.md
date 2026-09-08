---
name: supabase-architect
description: Guía de arquitectura de datos con Supabase PostgreSQL para BandManager.ai. Usar al modificar tablas, crear migraciones SQL, definir modelos TypeScript o actualizar handlers en server/db/*.ts.
---

# 🐘 Skill: Supabase Architect & Data Management

Esta skill establece las directivas para la gestión de datos, modelado e interacción con **Supabase (PostgreSQL)** como Única Fuente de Verdad (*Single Source of Truth*).

---

## 🏛️ 1. Estructura de la Capa de Datos

La interacción con Supabase sigue una arquitectura modular en tres capas:

1. **Tipos TypeScript Frontend/Backend (`src/types.ts`):** Definición de interfaces estrictas para cada modelo (`Band`, `Lead`, `Concert`, `Tour`, `Song`, `Fan`, etc.).
2. **Handlers Modularizados de DB (`server/db/*.ts`):** Módulos especializados por dominio (`leads.ts`, `bands.ts`, `concerts.ts`, `tours.ts`, `payments.ts`, `fans.ts`, `social.ts`, `emailAccounts.ts`, etc.) re-exportados centralmente en `server/db.ts`.
3. **Estado en Memoria Backend (`server/state.ts`):** Objeto en memoria alimentado al arrancar por `loadStateFromSupabase()` para mantener alta velocidad de respuesta en endpoints REST de sincronización.

---

## 📝 2. Convención para Handlers de Base de Datos (`server/db/*.ts`)

### Firma Estándar de Mutación (Upsert / Update / Delete)
Toda función de persistencia debe recibir explícitamente el `bandId` validado:

```typescript
import { supabase } from '../supabaseClient.js';

export async function dbUpsertConcert(concertData: Partial<Concert>, bandId: string): Promise<Concert> {
  const payload = {
    ...concertData,
    band_id: bandId, // ✅ Garantiza que el registro pertenece a la banda
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('concerts')
    .upsert(payload)
    .select()
    .single();

  if (error) {
    console.error('[DB ERROR] Error guardando concierto:', error);
    throw error;
  }

  return data;
}
```

---

## 📜 3. Reglas para Migraciones SQL

1. **Idempotencia:** Todos los scripts de migración deben ser ejecutables múltiples veces sin fallar (usar `CREATE TABLE IF NOT EXISTS`, `ADD COLUMN IF NOT EXISTS`).
2. **Índices de Rendimiento:** Crear siempre índices en columnas de filtrado frecuente, especialmente `band_id` y claves foráneas.
3. **Ubicación:** Guardar scripts de cambios de esquema en `supabase/migrations/YYYYMMDD_descripcion.sql` y sincronizar en `supabase_schema.sql`.

```sql
-- Ejemplo de Migración Idempotente
CREATE TABLE IF NOT EXISTS public.band_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    band_id TEXT NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    estado TEXT DEFAULT 'borrador',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice obligatorio por band_id para consultas rápidas y seguras
CREATE INDEX IF NOT EXISTS idx_band_campaigns_band_id ON public.band_campaigns(band_id);
```

---

## 🔐 4. Row Level Security (RLS) en Supabase

Para mayor seguridad a nivel de base de datos, las tablas en producción activan RLS garantizando que el usuario solo acceda a su `band_id`:

```sql
ALTER TABLE public.band_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Aislamiento por Banda" ON public.band_campaigns
    FOR ALL
    USING (band_id = auth.jwt() ->> 'band_id');
```

---

## ✅ Checklist para Cambios de Esquema / DB

- [ ] ¿He actualizado la interfaz TypeScript correspondiente en `src/types.ts`?
- [ ] ¿La función en `server/db/*.ts` recibe `bandId` como parámetro explícito?
- [ ] ¿He añadido el script SQL idempotente en `supabase/migrations/` o `supabase_schema.sql`?
- [ ] ¿La tabla incluye un índice en `band_id`?
- [ ] ¿He actualizado `loadStateFromSupabase()` en `server/db.ts` si la tabla forma parte del estado inicial?
