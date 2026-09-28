---
name: supabase-architect
description: Guía de arquitectura de datos con Supabase PostgreSQL para BandManager.io. Usar al modificar tablas, crear migraciones SQL, definir modelos TypeScript o actualizar handlers en server/db/*.ts.
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
Toda función de persistencia debe recibir explícitamente el `bandId` validado. El cliente de Supabase se obtiene con `getSupabase()` desde `./core.js` — **no existe** `server/supabaseClient.ts`; es un error común de memoria, no un archivo real del repo:

```typescript
import { getSupabase } from './core.js';

export async function dbUpsertConcert(concertData: Partial<Concert>, bandId: string): Promise<Concert> {
  const sb = getSupabase();
  const payload = {
    ...concertData,
    band_id: bandId, // ✅ Garantiza que el registro pertenece a la banda
    updated_at: new Date().toISOString()
  };

  const { data, error } = await sb
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

---

## 🔐 4. Row Level Security (RLS) en Supabase — estado real, no aspiracional

**Cómo está hoy, de verdad:** las 40 políticas RLS de `supabase_schema.sql` son `USING (true)` ("Permitir acceso total al backend") en todas las tablas — RLS está *activado* pero *no restringe nada*. El aislamiento por `band_id` es 100% responsabilidad de la capa de aplicación (`getTargetBandId(req)`, ver skill `security-multitenancy`) — no hay red de seguridad de base de datos por debajo si esa capa falla. No generes código asumiendo que una política `USING (band_id = ...)` ya existe: no es así, y una tabla nueva sigue el mismo patrón (`USING (true)`) salvo que se decida explícitamente reforzarla.

---

## ✅ Checklist para Cambios de Esquema / DB

- [ ] ¿He actualizado la interfaz TypeScript correspondiente en `src/types.ts`?
- [ ] ¿La función en `server/db/*.ts` recibe `bandId` como parámetro explícito?
- [ ] ¿He añadido el script SQL idempotente en `supabase/migrations/` o `supabase_schema.sql`?
- [ ] ¿La tabla incluye un índice en `band_id`?
- [ ] ¿He actualizado `loadStateFromSupabase()` en `server/db.ts` si la tabla forma parte del estado inicial?
