# 🎸 AGENTS.md — Instrucciones del Agente de Código (BandManager.ai / Bakandeya)

> **Contexto del Proyecto:** Esta aplicación es el núcleo técnico de un **Trabajo Fin de Máster (TFM) sobre Desarrollo de Software Asistido por Inteligencia Artificial Agéntica**.
> 
> **Misión:** Desarrollar la plataforma integral definitiva (**BandManager.ai**) que todo músico y banda independiente necesita para automatizar su booking, logística, prensa, contenido en redes, repertorio y finanzas.

---

## ⚡ 1. Directiva de Base de Datos y Persistencia (CRÍTICO)

* **Única Fuente de Verdad (Single Source of Truth):** **Supabase (PostgreSQL)**.
* **Prohibición Estricta:** Google Sheets está **totalmente descartado y en desuso**. No se debe mencionar, utilizar ni hacer referencia a Google Sheets bajo ninguna circunstancia. Toda la persistencia, tablas (`leads`, `bands`, `users`, `tours`, `songs`, `finances`, etc.) y operaciones de base de datos se gestionan exclusivamente a través de **Supabase**.

---

## ⚡ 2. Directiva de Eficiencia y Economía de Tokens

1. **Lecturas Dirigidas:** No leas archivos completos de más de 300 líneas si solo necesitas modificar una función o interfaz específica. Usa `view_file` con rangos.
2. **Ediciones Quirúrgicas (Surgical Edits):** Usa bloques de reemplazo contiguos y mínimos.
3. **Cero Salida Redundante:** Respuestas directas y concisas.
4. **Tipado Estricto:** TypeScript First en `src/types.ts` y modelos de Supabase.

---

## 🔒 3. Reglas de Negocio No Negociables (Human-in-the-Loop)

1. **Aprobación Humana Obligatoria para Envíos:**
   * La aplicación web lee y actualiza el estado en **Supabase**.
   * Los envíos de correo se realizan únicamente cuando el registro en Supabase pasa a estado `aprobado_propuesta` o `aprobado_respuesta`.
   * La aplicación web no dispara envíos directos no autorizados sin la aprobación explícita humana.

2. **Modelo de Estados en 2 Dimensiones (CRM + Agentes IA):**
   * **Dimensión 1: Estado del Lead en el Embudo CRM (`estado`):**
     * `nuevo`: Lead registrado por el Scout o manualmente, sin contacto previo.
     * `contactado` / `esperando_respuesta`: Email inicial enviado, a la espera de contestación.
     * `respondido`: La sala ha respondido y se encuentra en conversación activa.
     * `negociando`: Negociación activa de fechas, caché, taquilla o condiciones técnicas.
     * `confirmado`: Concierto confirmado y cerrado; se transfiere a logística de gira y calendario.
     * `aplazado`: Programación llena o interés pospuesto para recontactar en próxima temporada.
     * `no_interesado`: Descartado o rechazado formalmente.
   * **Dimensión 2: Cola y Sub-estados Agénticos (Human-in-the-Loop):**
     * `pendiente_aprobacion` (Borrador inicial o réplica redactada por la IA esperando revisión del usuario).
     * `aprobado_propuesta` (Pitch inicial aprobado para despacho por el Agente Enviador).
     * `aprobado_respuesta` (Réplica a la sala aprobada para despacho en hilo por el Agente Enviador).

3. **Ciclo de Vida de los Agentes de Booking:**
   * **Scout:** Descubre y enriquece salas en Supabase en estado `nuevo`.
   * **Redactor:** Genera propuesta personalizada en `pitch_generado` y marca sub-estado `pendiente_aprobacion`.
   * **Usuario (Human-in-the-Loop):** Valida o edita el texto y aprueba (`aprobado_propuesta` o `aprobado_respuesta`).
   * **Enviador (Python):** Despacha únicamente registros aprobados respetando rate-limits y actualiza `fecha_envio` a `esperando_respuesta` / `contactado`.
   * **Lector:** Monitoriza respuestas entrantes, actualiza el hilo de correos `hilo_emails` y transiciona el lead a `respondido` o `negociando`.
