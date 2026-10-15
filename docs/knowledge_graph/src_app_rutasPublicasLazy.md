---
id: src_app_rutasPublicasLazy
title: "src/app/rutasPublicasLazy.tsx"
layer: service
domain: system
file: "src/app/rutasPublicasLazy.tsx"
tags: ["service", "system", "auto"]
---

# 📌 src/app/rutasPublicasLazy.tsx

> **Ubicación:** `src/app/rutasPublicasLazy.tsx`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Rutas públicas cargadas bajo demanda y su spinner de carga. Fuera de main.tsx para que el

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_components_PublicEPK|src/components/PublicEPK.tsx]] *(Layer: #frontend, Domain: #epk)*
- [[src_components_PublicMusiciansLanding|src/components/PublicMusiciansLanding.tsx]] *(Layer: #frontend, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[src_main|src/main.tsx]] *(from #service)*

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
