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
   * Esta regla no tiene excepción por configuración de banda: `dispatch_mode` (`autonomy_configs`, ver sección 3) decide solo qué pasa DESPUÉS de esa aprobación (borrador para un último vistazo, o despacho directo) - nunca si la aprobación en sí hace falta. Tampoco puede una banda activar el envío real por su cuenta: hace falta además `AGENT_EMAIL_MODE=send` a nivel de todo el servidor (`server/services/agentEngine.ts`), el interruptor de seguridad de la plataforma.

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
   * **Enviador** (`server/services/agentEngine.ts`, Node/TypeScript - no Python): despacha únicamente registros aprobados respetando rate-limits. Según `dispatch_mode` de la banda, o bien crea un borrador (Gmail vía OAuth sin contraseña si la banda lo conectó, si no por IMAP) y marca el lead `borrador_creado`, o bien despacha directamente y actualiza `fecha_envio` a `contactado` (primer contacto) / `negociando` (réplica) - ambos caminos exigen la aprobación humana previa por igual.
   * **Lector** (`server/services/lectorAgent.ts`): monitoriza respuestas entrantes (por Gmail OAuth o IMAP, prefiriendo OAuth) y las deja en `lead_messages`, transicionando el lead a `respondido` o `negociando`; también detecta cuando un borrador de Gmail se envió a mano sin pasar por la app y transiciona el lead a `contactado`. Corre en cada ciclo del scheduler (~60s), sin horario configurable - a diferencia del Enviador, que sí respeta la ventana comercial de la banda.
