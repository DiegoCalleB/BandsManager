---
id: server_utils_geoEspana
title: "server/utils/geoEspana.ts"
layer: service
domain: system
file: "server/utils/geoEspana.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/utils/geoEspana.ts

> **Ubicación:** `server/utils/geoEspana.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Geografía de España para el directorio público de salas: de los textos de `region` y `ciudad` del catálogo

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[server_utils_regionesEspana|server/utils/regionesEspana.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[server_utils_seo_salas_publicas|server/utils/seo/salas/publicas.ts]] *(from #service)*

---

## 🧪 Tests que lo cubren
- `server/utils/__tests__/geoEspana.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
