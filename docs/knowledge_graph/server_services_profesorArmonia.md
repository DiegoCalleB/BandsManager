---
id: server_services_profesorArmonia
title: "server/services/profesorArmonia.ts"
layer: service
domain: system
file: "server/services/profesorArmonia.ts"
tags: ["service", "system", "auto"]
---

# 📌 server/services/profesorArmonia.ts

> **Ubicación:** `server/services/profesorArmonia.ts`  
> **Capa:** `#layer/service` | **Dominio:** `#domain/system`

## 📖 Descripción
Exporta: Nivel, Instrumento, NIVELES, INSTRUMENTOS, Hechos, construirHechos, huellaDeHechos, construirPrompt.

---

## 🔗 Conexiones Salientes (Dependencies / Calls)
- [[src_utils_teoriaArmonica|src/utils/teoriaArmonica.ts]] *(Layer: #service, Domain: #system)*

---

## 📥 Conexiones Entrantes (Backlinks / Callers)
- [[route_repertoire|Repertoire & Setlists Route]] *(from #route)*

---

## 🧪 Tests que lo cubren
- `server/services/__tests__/profesorArmonia.test.ts`

---

## 🛡️ Reglas de Aislamiento & Calidad
- [ ] ¿Respeta el trust boundary de `band_id`?
- [ ] ¿Tiene pruebas unitarias o de integración asociadas?
