---
name: llm-evals-benchmark
description: Scientific evaluation and benchmarking harness for LLM agents in BandManager.io. Works across Claude Code, Open Code, Cursor, and Gemini to quantify hallucination rate, Read Aloud score, and prompt resilience.
---

# 🧪 Skill: LLM Evals & Benchmark Framework (Universal Agent Standard)

Metodología científica y banco de pruebas reproducible para evaluar la calidad, naturalidad y precisión de los agentes de IA (Scout, Redactor, Contestador) con métricas objetivas.

---

## 🎯 1. Matriz de Métricas Cuantitativas

| Métrica | Umbral Mínimo | Descripción |
|---|---|---|
| **Read Aloud Score** | ≥ 9.0 / 10 | Ausencia de clichés de IA (*delve, tapestry, leverage*), burstiness asimétrica, lenguaje natural y cercano. |
| **Hallucination Rate** | 0.0% | Cero invenciones de datos técnicos de salas (aforos, ubicaciones, caché). |
| **Prompt Safety** | 100% | Neutralización de inyecciones directas e indirectas mediante `sanitizeExternalText`. |
| **Límite de Palabras** | < 120 palabras | Pitches concisos y sin riesgo de truncamiento en clientes de correo. |

---

## 🔬 2. Protocolo de Evaluación

- Probar siempre contra el *Golden Dataset* de 20 arquetipos de salas en `server/promptsManager.ts`.
- Evaluar comparativamente entre modelos (Gemini 2.5/3.0 vs DeepSeek vs Claude vs OpenAI).
