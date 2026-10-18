---
name: prompt-craft-and-dna
description: Advanced prompt engineering, Band DNA injection, anti-AI cliché filters, and Read Aloud score validation for BandManager.io. Works across Claude Code, Open Code, Cursor, and Gemini.
---

# ✍️ Skill: Prompt Craft & Band DNA Engineering (Universal Agent Standard)

Esta skill define las reglas de ingeniería de prompts de **nivel Anthropic & Google** para los agentes de redacción y prospección (`Redactor`, `Scout`, `Contestador`) en BandManager.io.

---

## 🎯 1. Principios Inviolables de Redacción de Pitches

1. **Límite Estricto de Palabras:** Menos de 120 palabras (2 párrafos breves). Evita el truncamiento en clientes de correo móvil y previene filtros de spam.
2. **La Regla del 20% de Personalización Genuina:**
   - 80% estructura probada de alta conversión.
   - 20% referencia específica a la programación real de la sala, acústica o trayectoria del espacio.
3. **Five Things to Kill in Email:**
   - ❌ Biografía o lista de nombres de integrantes ("Juan al bajo...").
   - ❌ Enlaces a vídeos completos de 30 minutos (reemplazar por teaser web/EPK).
   - ❌ Spam de fotos y adjuntos PDF pesados.
   - ❌ Superlativos inflados no verificables ("La mejor banda del panorama").
   - ❌ Muletillas operativas en el primer correo ("montamos en 30 min", "taquilla o caché").

---

## 🛑 2. Filtro Anti-Clichés de IA (Read Aloud Test)

Todo texto generado DEBE superar el **Read Aloud Score (≥ 9.0/10)**:

- **Palabras Prohibidas (IA-ismos):** *delve, tapestry, multifaceted, furthermore, moreover, leverage, harness, testamento, vibrante, sumérgete*.
- **Estructuras Prohibidas:**
  - Guiones largos (`—`) y dobles guiones (`--`).
  - Tríadas de adjetivos ("rápido, directo y potente").
  - Gerundios encadenados ("...ofreciendo un show, haciendo que...").
- **Burstiness Sintáctica:** Alternar oraciones ultra-cortas (3-5 palabras) con oraciones de longitud media. Usar conectores naturales ("Y", "Pero").

---

## 🔒 3. Sanitización e Inyección Segura de Datos

Toda interpolación de datos externos (datos scrapeados de la sala, correos entrantes de promotores) DEBE canalizarse a través de:
```typescript
import { sanitizeExternalText } from 'server/utils/promptSafety.ts';

const safeVenueNotes = sanitizeExternalText(venue.notas);
```
Garantiza neutralización total contra ataques de *Prompt Injection* directos e indirectos.
