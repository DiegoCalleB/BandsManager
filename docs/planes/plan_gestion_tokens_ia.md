# ⚡ Plan de Gestión de IA, Tokens y Cupos Multimedia (BandManager.io)

> **Documento de Arquitectura Económica, Blindaje de Costes GPU/CPU y Experiencia de Usuario**  
> **Ámbito:** Motor de IA, consumo de cuotas por banda, optimización de Stems & Reels y Unit Economics  
> **Estado:** Aprobado para Implementación  
> **Última actualización:** Septiembre 2026  
> **Precedencia:** `AGENTS.md` manda sobre este documento en todo lo que se solape.

---

## 🏛️ 1. Filosofía de Producto: Abundancia Percibida sin Ansiedad de Taxímetro

La mayoría de los SaaS de IA cometen el error de poner un "taxímetro" visible con una cuenta atrás de tokens o monedas en cada botón. Esto genera:
1. **Ansiedad de escasez**: El músico piensa dos veces si redactar un correo o buscar una sala más por no "gastar monedas".
2. **Freno a la adopción**: Destruye la sensación de "magia" y la creación del hábito diario.

Inspirándonos en el éxito de plataformas como **Claude Pro, Cursor o Canva**, BandManager.io desacopla radicalmente las operaciones en **dos naturalezas técnicas distintas**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🎧 LA ARQUITECTURA DE DOS NIVELES DE CONSUMO                                           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  🟢 NIVEL 1: TEXTO & AGENTES DE BOOKING (LLMs RÁPIDOS)                                 │
│     • Acciones: Scout de salas, pitches, respuestas de email, copys de reels, setlists. │
│     • Modelo: Gemini 2.5 Flash / DeepSeek V3.                                          │
│     • Coste real proveedor: Fracciones de céntimo (~0,0004 € por acción).              │
│     • Experiencia de usuario: ILIMITADO con Ventana de Uso Justo (Fair Use).           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  🟠 NIVEL 2: ESTUDIO MULTIMEDIA & CÓMPUTO PESADO (GPU / SERVIDORES)                    │
│     • Acciones: Separación de pistas de audio (Stems) y Renderizado de vídeo (Reels).  │
│     • Modelo: Replicate / FAL (Demucs GPU) y FFmpeg CPU en servidor.                   │
│     • Coste real proveedor: 0,01 € a 0,05 € por operación.                             │
│     • Experiencia de usuario: CUPOS MENSUALES CLAROS ("X Canciones y X Reels al mes"). │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 👥 2. Nivel de Asignación: Siempre a Nivel BANDA (`band_id`)

**Directiva inquebrantable**: El consumo de IA **NUNCA** se fragmenta por usuario individual.
* La banda paga una sola suscripción mensual (Plan Ensayo, Local, De Gira o Cabeza de Cartel).
* Todos los miembros de la banda (mánager, cantante, batería, etc.) comparten el mismo espacio de trabajo y la misma potencia de los agentes.
* El límite de confianza y el scoping multi-tenant se resuelven siempre con **`getTargetBandId(req)`** (`server/utils/bandAccess.ts`), garantizando coherencia absoluta con `AGENTS.md` §2.1.

---

## 🟢 3. Nivel 1: Acciones de Texto (Scout, Booking y Copys)

### 3.1 Experiencia Ilimitada con Ventana Dinámica (Estilo Claude)
Para el músico, buscar salas y redactar propuestas es **ilimitado**. Puede enviar 50 pitches en una tarde sin preocuparse de que se le agote el saldo.

Para protegernos de abusos extremos, bots o scripts automatizados maliciosos, aplicamos una **Ventana de Cortesía Dinámica de 5 horas**:
* **Límite de cortesía**: Hasta **80 acciones de texto cada 5 horas por banda**.
* El 99.8% de los músicos en uso humano normal jamás alcanzará este límite.
* Si una banda llega al límite temporal, la UI no muestra un error punitivo, sino un aviso elegante:
  > *"Tus agentes de booking están descansando la voz tras una sesión intensa de contactos. Tu ventana se recarga automáticamente en 1h 45m."*

---

## 🎬 4. Blindaje Técnico del Nivel 2: Reels y Stems (Cero Fugas Financieras)

El cómputo pesado es el único vector que podría erosionar el margen si no se acota. Por eso se implementan 3 salvaguardas técnicas a nivel de servidor:

### 4.1 Blindaje de Renderizado de Reels y Clips de Vídeo (`server/routes/reels.ts`)
1. **Tope de Duración Estricto**:
   * Los clips están concebidos para formato vertical (Instagram Reels, TikTok, YouTube Shorts).
   * El backend rechaza o recorta cualquier renderizado a **un máximo de 45 segundos**.
   * Renderizar 30-45 segundos consume un **75% menos de CPU/memoria** que procesar canciones completas.
2. **Caché Inteligente por Hash**:
   * Si la banda genera un Reel y luego solo edita el texto del título o la descripción, no se vuelve a invocar el renderizado de vídeo de FFmpeg.
3. **Control de Concurrencia**:
   * `renderRateLimiter` (`server/middleware/rateLimiter.ts`): Máximo **1 render concurrente por banda** para proteger la CPU del contenedor en Railway.

### 4.2 Blindaje de Separación de Stems / Pistas de Audio
1. **Límite de Duración por Pista**:
   * Máximo **5 minutos** de audio por archivo. Las pistas que excedan este tiempo deben recortarse antes de entrar al aislador de instrumentos.
2. **Biblioteca Persistente con Deduplicación (Supabase Storage)**:
   * Los stems aislados (voz, batería, bajo, armonía) se guardan para siempre en la jerarquía segura `stems/{bandId}/{songHash}/...`.
   * Si cualquier miembro de la banda vuelve a abrir esa canción 6 meses después en un ensayo, **la app lee los archivos almacenados y no gasta 1 solo céntimo en re-procesar**.
3. **Escalado de Calidad**:
   * **Modo Estándar (Voz + Pista)**: Procesado rápido y ultra-económico (~0,015 €).
   * **Modo Estudio (4 pistas completas)**: Para estudio y ensayos avanzados (~0,050 €).

---

## 💰 5. Unit Economics: Por qué BandManager SIEMPRE Gana Dinero

Hagamos la auditoría con el escenario de **máximo consumo mensual posible** en el plan más popular (**Plan Local - 15 €/mes**):

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 📈 DESGLOSE DE COSTES DE SERVIDORES (PEOR ESCENARIO: BANDA ULTRA-ACTIVA)              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  • 200 Búsquedas de salas con Scout (Gemini 2.5 Flash + Search):              0,056 €  │
│  • 100 Pitches y correos de booking personalizados (DeepSeek V3):             0,040 €  │
│  • 50 Copys para Instagram / TikTok:                                          0,015 €  │
│  • 5 Reels de 30s renderizados con subtítulos (FFmpeg en Railway):            0,020 €  │
│  • 3 Canciones completas separadas en 4 stems (GPU Replicate/FAL):            0,150 €  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  💸 COSTE TOTAL REAL DE SERVIDORES DE ESA BANDA AL MES:                       0,281 €  │
│  💳 CUOTA MENSUAL COBRADA A LA BANDA (PLAN LOCAL):                           15,000 €  │
│  🏆 BENEFICIO NETO LIMPIO PARA BANDMANAGER:                         14,72 € (98,1%)    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

> **Conclusión Financiera Inapelable**: Incluso en el mes más exigente de una banda en plena campaña de contratación, **el coste total de infraestructura es inferior a 30 céntimos de euro**. El margen de negocio supera el **98%**.

---

## 📦 6. Asignación de Cupos por Plan de Suscripción

| Plan | Cuota Mensual | Agentes de Booking (Texto) | Cupo Reels / Vídeo | Cupo Stems (Canciones) |
| :--- | :--- | :--- | :--- | :--- |
| **Promo / Promo+** | 0 € / 5 € | No disponible | No disponible | No disponible |
| **Ensayo** | 9 € / mes | Ilimitado (Ventana 5h: 40 acc) | 2 Reels / mes | 1 Canción / mes |
| **Local** | 15 € / mes | Ilimitado (Ventana 5h: 80 acc) | **5 Reels / mes** | **3 Canciones / mes** |
| **De Gira** | 29 € / mes | Ilimitado (Ventana 5h: 150 acc)| **15 Reels / mes** | **10 Canciones / mes** |
| **Cabeza de Cartel**| 79 € / mes | Ilimitado (Prioridad Alta)     | **50 Reels / mes** | **35 Canciones / mes** |

---

## 🔄 7. Rollover Inteligente (Opción C) y Saldo Permanente de Bolos

Para los cupos de estudio (Reels y Stems):
1. **Cupo Mensual Vivo**: Se renueva cada 30 días con el ciclo de facturación de Stripe.
2. **Rollover con Tope (Opción C)**:
   * Lo que no se gaste durante un mes tranquilo se acumula para el mes siguiente.
   * **Tope máximo**: Hasta **el doble de la cuota mensual del plan** (ej. en Plan Local, máximo acumulable de 10 Reels y 6 Canciones). Esto obliga a estar atentos y planificar, evitando acumulación infinita.
3. **Pases de Estudio Ganados por Bolos (Vitalicios)**:
   * Al cerrar o confirmar bolos con la Hoja de Acuerdo, la banda recibe **Pases de Estudio Extra** (ej. +2 Canciones de Stems o +5 Reels para promocionar el concierto).
   * **Estos pases nunca caducan y no tienen tope.** Se guardan en su hucha permanente.

---

## 🛒 8. Monetización Adicional: Micro-Packs de Estudio (Venta Directa)

Si una banda va a grabar un EP o lanzar una campaña fuerte y agota sus cupos mensuales, no necesita cambiar de plan; puede comprar **Packs de Estudio 1-Click con Stripe**:
* **Pack Lanzamiento Reels (10 Clips extra)**: `4,99 €` *(Coste servidor: ~0,05 € ➔ Margen 99%)*.
* **Pack Estudio Stems (5 Canciones completas)**: `4,99 €` *(Coste servidor: ~0,25 € ➔ Margen 95%)*.

---

## 🖥️ 9. Cómo se ve en la Interfaz (Simplicidad y Cero Ansiedad)

En el Dashboard y en el menú de la banda, la información se presenta de forma limpia, visual y motivadora:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ ⚡ CENTRO DE PRODUCCIÓN E IA (BANDA: LOS CHICOS DEL BARRIO · PLAN LOCAL)               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  🟢 Scout & Agentes de Booking:   DISPONIBLE (Ilimitado · Ventana activa)              │
│  🎬 Reels de Vídeo:               4 disponibles de 5 este mes   [ + Crear Clip ]       │
│  🎼 Separador de Stems:           2 disponibles de 3 este mes   [ + Separar Pistas ]   │
│  🎁 Hucha Permanente de Bolos:     2 Canciones de Stems extra acumuladas                │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 10. Implementación Técnica en Backend y Esquema

### 10.1 Esquema en Supabase (`registered_bands`)
```sql
ALTER TABLE registered_bands
  ADD COLUMN IF NOT EXISTS studio_reels_limit INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS studio_reels_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS studio_reels_rollover INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS studio_stems_limit INTEGER NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS studio_stems_used INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS studio_stems_rollover INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS studio_bonus_reels INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS studio_bonus_stems INTEGER NOT NULL DEFAULT 0;
```

### 10.2 Endpoint Unificado de Verificación y Descuento (`server/routes/billing.ts`)
* Se añade `/api/billing/studio-consume`:
  * Recibe: `{ tipo: "reel" | "stem", metadata: { durationSec, songId } }`.
  * Valida duración (<=45s para reel, <=300s para stem).
  * Descuenta siguiendo el orden: Rollover ➔ Cuota del Mes ➔ Saldo Bonus.
  * Si no hay saldo, devuelve `403` con opción de compra de Micro-Pack o invitación a confirmar un bolo para ganar pases.
