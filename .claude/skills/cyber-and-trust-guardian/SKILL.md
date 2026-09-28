---
name: cyber-and-trust-guardian
description: Universal zero-trust multi-tenant security & OWASP LLM defense skill for Claude Code, Open Code, Cursor, and Gemini. Enforces getTargetBandId, SSRF guard, anti-prompt injection, and cryptographic IP protection.
---

# 🛡️ Skill: Cyber & Trust Guardian (Universal Security Standard)

Skill de seguridad unificada para **todos los agentes de código (Claude Code, Open Code, Cursor, Gemini)**. Garantiza aislamiento estricto multi-inquilino, protección de propiedad intelectual y mitigación activa del *OWASP Top 10 for LLMs*.

---

## 🔒 1. Límite de Confianza Inviolable (`getTargetBandId`)

- **Regla Estricta:** Ningún endpoint backend puede confiar en `req.body.band_id`, `req.body.bandId` ni cabeceras manuales para autorizar operaciones.
- **Resolución Obligatoria:** Toda operación debe resolver la banda mediante `getTargetBandId(req)` (`server/utils/bandAccess.ts`).
- **Capa DB (`server/db/*.ts`):** Las funciones de datos solo reciben el `bandId` autenticado. Queda prohibido el patrón inseguro `cleanBandId(obj.band_id || bandId)`.

---

## 🛑 2. Mitigación de Amenazas OWASP para LLMs

| Vector de Riesgo | Superficie Vulnerable | Blindaje Obligatorio |
|---|---|---|
| **Prompt Injection** | Scraping web de salas y correos entrantes de promotores. | Sanitización obligatoria con `sanitizeExternalText` (`server/utils/promptSafety.ts`) antes de interpolar en prompts. |
| **Insecure Output** | Renderizado de textos generados por IA. | Sanitización HTML en frontend (`src/utils/escapeHtml.ts`) y cabeceras `nosniff`. |
| **Excessive Agency** | Envíos autónomos no supervisados. | **Aprobación humana previa obligatoria**: el despachador solo envía si el estado es `aprobado_propuesta` o `aprobado_respuesta`. |
| **SSRF Guard** | Peticiones salientes `fetch()` a URLs externas. | Validación forzosa mediante `esUrlExternaSegura` (`server/utils/ssrfGuard.ts`), bloqueando IPs privadas y metadatos cloud. |

---

## 🚦 Comprobación Rápida
```bash
npm run test:security
```
