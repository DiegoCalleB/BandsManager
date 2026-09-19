# 🛡️ Plan Maestro: Concert Deals, Marco Legal y Modelo de Valor

> **Documento de arquitectura de producto, datos, seguridad y marco legal**
> **Ámbito:** módulo Concert Deals de BandManager.io (hoja de acuerdo, firma, cobro)
> **Estado:** v2 — reescrito contra el esquema y el código reales del repo
> **Última revisión:** 19 de septiembre de 2026
> **Precedencia:** `AGENTS.md` manda sobre este documento en todo lo que se solape.

---

## 0. Qué es este documento y qué cambió desde la v1

La v1 de este plan se redactó sin leer el esquema de base de datos del repositorio. El resultado
fue un documento con buen criterio de producto y una capa técnica que no era ejecutable: el
bloque DDL fallaba en su primera sentencia. Esta v2 conserva el criterio de producto —que es el
activo real del documento— y reconstruye todo lo demás sobre lo que hay de verdad en el código.

### Correcciones estructurales respecto a la v1

| # | v1 afirmaba | Realidad verificada en el repo | Consecuencia |
|---|---|---|---|
| 1 | `references public.bands(id)` | La tabla es `registered_bands`; las FK apuntan a `registered_bands(band_id)` | DDL no ejecutable |
| 2 | `uuid primary key default gen_random_uuid()` | **Todas** las PK del esquema son `TEXT`, generadas en la app | DDL no ejecutable |
| 3 | `concert_id uuid references concerts(id)` | `concerts.id` es `TEXT` | Tipo incompatible |
| 4 | `cambiado_por uuid references auth.users(id)` | No se usa Supabase Auth; es `users` con `id TEXT` | DDL no ejecutable |
| 5 | Trigger con `auth.uid()` | El backend escribe con `SUPABASE_SERVICE_ROLE_KEY` → `auth.uid()` es `NULL` | Auditoría siempre sin autor |
| 6 | Cashback 100% en créditos IA | Los créditos se **resetean** en cada renovación (`billing.ts:132-133`) | El cashback se evapora cada mes |
| 7 | Comisión del 5% también sobre efectivo | El efectivo no pasa por la plataforma | Obliga a la vigilancia que el propio plan rechaza |
| 8 | Stripe Connect en P2 | Sin Connect, cobrar de la sala y remitir a la banda es actividad regulada | Bloqueante legal, no mejora futura |
| 9 | IVA fijo al 10% | Depende de forma jurídica y destinatario | Facturas incorrectas a escala |
| 10 | "La app genera facturas" + "la banda factura con su gestoría" | Contradicción interna; emitir facturas activa Verifactu | Riesgo regulatorio evitable |

### Origen de la contaminación (corregir aparte)

El error nº 1 no lo inventó el modelo que escribió la v1: está **en el propio repositorio**.
`skills/supabase-architect/SKILL.md` usa como ejemplo canónico de migración:

```sql
band_id TEXT NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE
```

Una tabla `bands` que no existe. Cualquier agente que lea ese skill para escribir una migración
reproducirá el fallo. `scripts/verify-docs-refs.cjs` no lo detecta porque solo valida rutas de
archivo, no identificadores SQL.

**Acción separada de este plan (P0, 10 minutos):** corregir el ejemplo del skill en sus tres
copias (`skills/`, `.claude/skills/`, `.gemini/skills/`) y valorar extender el verificador para
que compruebe que los nombres de tabla citados en los skills existen en `supabase_schema.sql`.

---

## 1. Principios de producto

Cuatro reglas. Las tres primeras vienen de la v1 y son correctas. La cuarta la sustituye.

### 1.1 Fricción cero para la sala y el promotor
El programador nunca se registra, nunca hace login, nunca pasa un KYC. Abre un enlace en el
móvil, revisa condiciones y rider, firma con el dedo. Objetivo: **menos de 30 segundos** desde
que abre el enlace hasta que confirma.

Este es el mejor insight del documento original y el eje de todo lo demás. Cualquier decisión
técnica que añada un paso al lado de la sala está mal, por buena que suene la justificación.

### 1.2 Cero burocracia y cero rol de intermediario laboral
La app es software de gestión. La relación comercial es directa entre banda y sala. La
plataforma no contrata, no da de alta en Seguridad Social, no actúa como agencia, no retiene
IRPF y no emite facturas en nombre de nadie. Esta posición no es cosmética: es lo que mantiene
el proyecto fuera de tres marcos regulatorios distintos (ver §3).

### 1.3 El valor operativo es la retención
La banda usa la app porque le resuelve el día del bolo: hoja de ruta en el móvil de cada
músico, rider interactivo para el técnico de la sala, lista de puerta para el portero, recibo
de cobro, reparto de caja. Nada de eso existe si cierran el trato por WhatsApp.

Esta es la única forma de retención que funciona a largo plazo, y es suficiente.

### 1.4 La plataforma solo cobra donde aporta infraestructura
> **Regla nueva que sustituye al "cashback + detección de bypass" de la v1.**

La comisión transaccional se cobra **exclusivamente sobre el dinero que pasa por la pasarela de
la plataforma**. Sobre un pago en efectivo entre banda y sala, la plataforma no cobra comisión.
Nunca. Ni descontada de créditos, ni cargada a la suscripción, ni diferida.

Las tres razones, en orden de importancia:

1. **Elimina de raíz el problema que la v1 intentaba resolver con vigilancia.** Si no hay
   comisión que esquivar en efectivo, no hay bypass que detectar, y toda la maquinaria de
   correlación de datos del §2.6 de la v1 deja de tener propósito. El conflicto ético
   desaparece porque desaparece el incentivo para vigilar.
2. **Es lo único defendible.** Cobrar un porcentaje de una transacción en metálico que la
   plataforma no ve, no custodia y no garantiza es cobrar por nada. Un usuario lo nota.
3. **Es lo único cobrable.** No hay mecanismo honesto para exigir ese dinero. La v1 proponía
   descontarlo de los créditos que la propia app acababa de regalar: una operación que no
   ingresa nada y solo añade complejidad contable.

El pago en efectivo genera igualmente su recibo digital, su hoja de ruta y su registro en
finanzas. Se monetiza vía **suscripción**, que es exactamente para lo que existe la suscripción.

---

## 2. Economía real del modelo

Esta sección existe porque la v1 no tenía ninguna equivalente, y sin ella el resto del
documento es arquitectura sin negocio debajo. Todos los números salen del código.

### 2.1 Coste real de un crédito de IA

De `server/ai.ts` (`AI_PRICING_TABLE`, `costEurFromTokens`), con `EUR_USD_RATE = 1.08`:

| Proveedor | Input $/1M tok | Output $/1M tok | Coste de 1.000 pitches |
|---|---|---|---|
| DeepSeek V3 | 0,14 | 0,28 | **~0,14 €** |
| Gemini Flash | 0,10 | 0,40 | **~0,18 €** |

Un pitch típico (≈2.000 tokens de entrada + 500 de salida) cuesta alrededor de **0,0004 €**.

### 2.2 Precio de venta implícito de un crédito

De `src/utils/planPermissions.ts` (precios) y `server/routes/billing.ts` (`PLAN_CREDITS`):

| Plan | Precio | Créditos/mes | Precio implícito por crédito |
|---|---|---|---|
| `local` | 15 €/mes | 300 | 0,050 € |
| `de_gira` | 29 €/mes | 800 | 0,036 € |
| `cabeza_de_cartel` | 79 €/mes | 2.500 | 0,032 € |

### 2.3 La conclusión, que invierte el diagnóstico inicial

Vendes un crédito a ~0,04 € y te cuesta ~0,0004 € cuando se gasta en texto. El **margen bruto
es del 99%**. Devolver 25 € de comisión en créditos tiene un coste real aproximado de **0,25 €**.

El cashback no es el problema. Es, de hecho, un producto excelente: dinero real a cambio de
algo que cuesta céntimos y que además aumenta el uso de la app.

**El problema real está en otro sitio:** no todas las acciones de IA cuestan lo mismo. Generar
un pitch cuesta 0,0004 €. Separar los stems de una canción (Replicate/FAL, ver
`REPLICATE_API_TOKEN` en §1 de AGENTS.md) o renderizar un reel con ffmpeg cuesta entre **0,05 €
y 0,15 €** — entre cien y cuatrocientas veces más. Si ambas cosas consumen "1 crédito", el
margen del 99% se convierte en pérdida en cuanto la banda descubre qué función es la cara.

### 2.4 Hallazgo de auditoría: hoy el cliente decide el precio

`server/routes/billing.ts:828`:

```ts
const { creditsAmount = 1, featureName = "AI Task" } = req.body;
const amount = Math.max(1, Number(creditsAmount) || 1);
```

**El número de créditos que cuesta una operación viaja en el cuerpo de la petición.** Un cliente
modificado declara `creditsAmount: 1` para una separación de stems que cuesta 0,10 € reales. El
`Math.max(1, …)` impide el cero, pero no que el frontend fije el precio.

Esto contraviene AGENTS.md §2.3 punto 2 ("queda estrictamente prohibido confiar de forma
exclusiva en la UI") y es un agujero de coste, no solo de cuota.

### 2.5 Decisión: tarifario de créditos en servidor

Requisito previo a cualquier cashback. Una única tabla de coste por acción, en el servidor,
como fuente de verdad. El cliente pide una acción por nombre; nunca dice cuánto cuesta.

```ts
// server/utils/creditPricing.ts (nuevo)
export const COSTE_CREDITOS = {
  pitch_generado: 1,
  respuesta_lead: 1,
  copy_reel: 2,
  analisis_setlist: 2,
  separacion_stems: 100,
  render_clip: 50,
  generacion_musical: 150
} as const;

export type AccionIA = keyof typeof COSTE_CREDITOS;
```

Calibrado para que el coste real por crédito quede plano (~0,0004–0,001 €) sea cual sea la
acción. Con esto, el cashback es seguro **en cualquier patrón de uso**, no solo en el optimista.

Este cambio arregla dos cosas a la vez: cierra el agujero del §2.4 y hace viable el §2.6.

### 2.6 Cómo se acreditan los créditos de cashback sin que se evaporen

El bug: `server/routes/billing.ts:132-133` hace, en cada renovación de plan:

```ts
foundBand.creditos_periodo = credits;   // valor FIJO del plan
foundBand.creditos_usados = 0;
```

Es una **asignación, no una suma**. Cualquier crédito extra acreditado durante el mes
desaparece en la siguiente renovación. Con el modelo de la v1, el cashback duraba hasta el día 1.

Solución mínima y compatible con el código actual: un contador separado que la renovación no
toca, y que se consume **antes** que la cuota mensual.

```sql
ALTER TABLE registered_bands
  ADD COLUMN IF NOT EXISTS creditos_bonus INTEGER NOT NULL DEFAULT 0;
```

- `creditos_periodo` / `creditos_usados`: cuota mensual, se resetea. Sin cambios.
- `creditos_bonus`: saldo acumulado (cashback, promociones). **La renovación no lo toca.**
- Orden de consumo: primero `creditos_bonus`, luego la cuota del periodo.

Que el bonus se gaste primero es deliberado: si se gastara al final, la banda nunca lo vería
y el incentivo no existiría.

> **Regla de AGENTS.md que aplica aquí:** esto es dinero. §5.3.1 exige el test del caso límite
> **antes** de tocar el código, y sobre un invariante, no sobre la implementación. Ver §9.2.

### 2.7 Modelo de ingresos resultante

| Fuente | Mecanismo | Margen |
|---|---|---|
| Suscripción | Stripe Billing (ya implementado) | Alto |
| Comisión transaccional | Solo sobre pagos digitales vía Connect | ~5% del GMV digital |
| Coste del cashback | ~1% de la comisión devuelta | Despreciable |

La suscripción es el negocio. La comisión es un extra sobre el subconjunto de bolos que se
cobran digitalmente. Ningún ingreso depende de detectar lo que la banda hace fuera de la app.

---

## 3. Marco legal

### 3.1 Cobro digital: Stripe Connect es requisito P0, no mejora futura

Si la plataforma cobra 1.050 € de la sala, retiene 52,50 € y transfiere 997,50 € a la banda,
está recibiendo fondos de un tercero para entregarlos a otro. En la UE eso es, por defecto,
actividad de **entidad de pago** (PSD2 y su transposición española), con autorización y
requisitos de capital.

La salida estándar es **Stripe Connect**: la banda es una cuenta conectada y *merchant of
record*, el dinero nunca pertenece a la plataforma, y la comisión se cobra como
`application_fee_amount`. Stripe es la entidad regulada.

**Consecuencias operativas, que son las que importan para el roadmap:**
- La banda necesita completar el onboarding de Connect (identidad + IBAN) antes de poder
  cobrar digitalmente. Es fricción **del lado de la banda**, no de la sala: el principio §1.1
  se mantiene intacto.
- Esa fricción es exactamente por lo que el cobro digital **no entra en el primer entregable**.

### 3.2 Facturación: la app no emite facturas

La v1 se contradecía: prometía "cero burocracia, la banda factura con su gestoría" y a la vez
"facturación simplificada automática". Hay que elegir, y la elección es clara.

**La app no emite facturas.** Emite dos documentos privados, sin efectos fiscales:

| Documento | Qué es | Qué no es |
|---|---|---|
| **Hoja de Acuerdo** | Acuerdo privado firmado entre banda y sala | No es contrato laboral ni mercantil formal |
| **Recibo de entrega** | Justificante de que se entregó y recibió una cantidad | **No es una factura** |

Motivo: emitir facturas convierte a la app en un **Sistema Informático de Facturación** sujeto
al RD 1007/2023 (**Verifactu**) — registro encadenado, huella, remisión a la AEAT, declaración
responsable del fabricante. Es un proyecto entero, ajeno al núcleo del producto, y ya exigible
en la fecha de este documento.

La UI debe decirlo de forma explícita y no enterrada:
> *Este recibo acredita la entrega del importe. No sustituye a la factura, que emite la banda
> a través de su gestoría o cooperativa.*

### 3.3 IVA: nunca hardcodear

El tipo reducido del 10% (art. 91.Uno.2.6º LIVA) aplica a servicios prestados por intérpretes y
artistas **que sean personas físicas** a **organizadores de obras teatrales y musicales**. Dos
condiciones, ambas frecuentemente incumplidas en el mundo real:

- Banda que factura a través de una S.L. o cooperativa → **21%**
- Destinatario que no es organizador de espectáculo (boda, evento privado, bar sin
  programación) → habitualmente **21%**

Y "y equivalentes en la UE" de la v1 es falso: cada Estado miembro fija su tipo.

**Decisión:** el tipo de IVA es un campo configurable en el perfil fiscal de la banda, con
valor por defecto informado y un aviso de que lo confirme su gestoría. La app no asesora
fiscalmente. Dado §3.2, este dato solo es informativo dentro de la hoja de acuerdo.

### 3.4 Firma eIDAS: qué es y qué no

Una firma táctil con sello de tiempo, IP y user-agent es **firma electrónica simple**. Es válida
—el art. 25.1 del Reglamento (UE) 910/2014 impide negarle efectos jurídicos solo por ser
electrónica— pero **no** tiene la presunción de integridad de la firma cualificada. En un
litigio, la carga de la prueba es de quien la invoca.

**El hash de la v1 no prueba lo que la v1 creía.** Si el dato y su hash viven en la misma base
de datos, bajo la misma clave de servicio, quien puede alterar uno puede alterar el otro. Sirve
contra corrupción accidental, no como prueba frente a un tercero.

**Dos medidas que sí elevan el valor probatorio, ambas baratas:**

1. **Sacar el hash del sistema en el instante de la firma.** Al firmar, se envía por email al
   firmante (y a la banda) un acuse con el hash SHA-256 y el resumen de condiciones. Ese email
   queda en un buzón que la plataforma no controla. Es la medida de mayor retorno de todo el
   módulo: coste cercano a cero, y convierte el hash en evidencia con un tercero como testigo.
2. **Firmar sobre un snapshot inmutable, no sobre la fila viva.** Ver §4.3.

Y una precisión relevante: se captura **la imagen estática** del trazo. Capturar dinámica
(presión, velocidad, aceleración) la convertiría en **dato biométrico**, categoría especial del
art. 9 RGPD, con un régimen mucho más exigente. No se hace, y conviene que quede escrito para
que a nadie le parezca una mejora obvia más adelante.

### 3.5 RGPD en la vista pública

La sala que firma **no es usuaria registrada** y no ha aceptado ninguna política. De ella se
capturan: nombre, cargo, imagen de firma, IP, user-agent y marca temporal. Todo ello son datos
personales.

Obligaciones concretas antes de habilitar la firma:

- **Aviso de privacidad visible en `/deal/view/:token`**, antes del lienzo de firma. No un
  enlace en el pie: un bloque legible junto al botón.
- **Base de legitimación:** ejecución de contrato (art. 6.1.b) para los datos del acuerdo;
  interés legítimo (art. 6.1.f) para IP y user-agent como evidencia de firma.
- **Plazo de retención** definido y escrito. Propuesta: 5 años desde el evento, alineado con el
  plazo general de prescripción de acciones personales (art. 1964 CC).
- **Minimización:** la vista pública no expone jamás DNI/NIF, IBAN, teléfonos personales de los
  músicos, ni datos económicos internos de la banda (caja, repartos, histórico). Esto se
  verifica con un test, no con buena voluntad (§9.2).

Esto conecta con el punto 5 de AGENTS.md §8 (datos de terceros sin base de legitimación
documentada): el módulo de deals es una buena ocasión para resolverlo en el sitio donde más
expuesto está.

### 3.6 Lo que este plan deja sin resolver

Honestidad sobre el alcance: este documento **no** resuelve los dos puntos 🔴 de AGENTS.md §8
(descarga de YouTube sin verificar titularidad, credenciales de email en texto plano). Siguen
siendo bloqueantes para producción con usuarios reales, y son independientes de este módulo.

---

## 4. Arquitectura de datos

### 4.1 Convenciones verificadas del esquema

Todo lo que sigue las respeta. Comprobado en `supabase_schema.sql`:

- **PK `TEXT`**, generadas en la app (`` `lead-${Date.now()}` ``).
- **FK de banda:** `TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE`.
  Apuntan a la columna `band_id`, que es `UNIQUE`, **no** a `id`.
- `leads.id`, `concerts.id`, `users.id`: todas `TEXT`.
- Extensiones `uuid-ossp` y `pgcrypto` ya habilitadas → `gen_random_bytes()` disponible.
- Función `update_modified_column()` ya existe para los triggers de `updated_at`.
- RLS: se activa y se crea la política `"Permitir acceso total al backend"` con `USING (true)`,
  por coherencia con las 40 tablas existentes. **No es una red de seguridad** (AGENTS.md §2.1
  punto 4): el aislamiento real es de capa de aplicación.

### 4.2 Migración: `supabase/migrations/20260919_concert_deals.sql`

```sql
-- ============================================================================
-- Concert Deals: hoja de acuerdo, firma eIDAS y auditoría de estados de lead
-- Convenciones: PK TEXT generadas en app, FK a registered_bands(band_id).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Historial de estados de lead (auditoría append-only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS lead_status_history (
    id TEXT PRIMARY KEY,
    lead_id TEXT NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    estado_anterior TEXT,
    estado_nuevo TEXT NOT NULL,
    -- users.id, NO auth.users: esta app no usa Supabase Auth.
    cambiado_por TEXT REFERENCES users(id) ON DELETE SET NULL,
    -- 'app'    = escrito por el backend, con autor real.
    -- 'db'     = escrito por el trigger de respaldo (SQL manual, script, consola).
    origen TEXT NOT NULL DEFAULT 'app' CHECK (origen IN ('app', 'db')),
    fecha_transicion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_lead_status_history_lead ON lead_status_history(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_band ON lead_status_history(band_id);
CREATE INDEX IF NOT EXISTS idx_lead_status_history_fecha ON lead_status_history(fecha_transicion);

ALTER TABLE lead_status_history ENABLE ROW LEVEL SECURITY;
-- DROP antes de CREATE: CREATE POLICY no admite IF NOT EXISTS, así que sin esto
-- la migración falla al ejecutarse por segunda vez. El esquema base no lo hace
-- porque se concibió como script de creación inicial, no como migración repetible.
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON lead_status_history;
CREATE POLICY "Permitir acceso total al backend" ON lead_status_history FOR ALL USING (true);

-- Inmutabilidad real: sin UPDATE ni DELETE. Una tabla no es "inmutable" porque
-- lo diga su nombre; lo es cuando el motor rechaza la modificación.
-- La service role key es BYPASSRLS, así que una política no basta: hace falta
-- un trigger, que sí se aplica a todos los roles.
CREATE OR REPLACE FUNCTION fn_lead_status_history_append_only()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    RAISE EXCEPTION 'lead_status_history es append-only: % no permitido', TG_OP;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_status_history_no_update ON lead_status_history;
CREATE TRIGGER trg_lead_status_history_no_update
    BEFORE UPDATE OR DELETE ON lead_status_history
    FOR EACH ROW EXECUTE FUNCTION fn_lead_status_history_append_only();

-- Trigger de respaldo. NO es el camino principal: el backend inserta la fila
-- con el autor real (origen='app') porque con SUPABASE_SERVICE_ROLE_KEY la
-- función auth.uid() devuelve NULL y el autor se perdería siempre.
-- Este trigger solo cubre cambios hechos fuera de la app (SQL manual), donde
-- no hay autor que registrar, y evita un hueco silencioso en la auditoría.
CREATE OR REPLACE FUNCTION fn_log_lead_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
BEGIN
    -- leads.band_id es NULLABLE en el esquema actual, y lead_status_history.band_id
    -- es NOT NULL. Sin esta guarda, actualizar un lead huérfano lanzaría una
    -- excepción dentro del trigger y abortaría el UPDATE del propio lead: una
    -- tabla de auditoría nueva rompiendo escrituras que hoy funcionan.
    IF NEW.band_id IS NULL THEN
        RETURN NEW;
    END IF;

    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        -- Si el backend ya registró esta misma transición en los últimos 5 s,
        -- no se duplica: la suya lleva el autor y esta no.
        IF NOT EXISTS (
            SELECT 1 FROM lead_status_history
             WHERE lead_id = NEW.id
               AND estado_nuevo = NEW.estado
               AND fecha_transicion > NOW() - INTERVAL '5 seconds'
        ) THEN
            INSERT INTO lead_status_history (
                id, lead_id, band_id, estado_anterior, estado_nuevo, cambiado_por, origen
            ) VALUES (
                'lsh-' || encode(gen_random_bytes(8), 'hex'),
                NEW.id, NEW.band_id, OLD.estado, NEW.estado, NULL, 'db'
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_lead_status_change ON leads;
CREATE TRIGGER trg_log_lead_status_change
    AFTER UPDATE ON leads
    FOR EACH ROW EXECUTE FUNCTION fn_log_lead_status_change();


-- ---------------------------------------------------------------------------
-- 2. Hojas de acuerdo
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS concert_deals (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    lead_id TEXT REFERENCES leads(id) ON DELETE SET NULL,
    concert_id TEXT REFERENCES concerts(id) ON DELETE SET NULL,

    -- Token de acceso público. 32 bytes = 256 bits.
    -- El backend lo genera con crypto.randomBytes(32).toString('base64url');
    -- este DEFAULT es solo una red para filas creadas a mano desde SQL.
    token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
    token_expira_en TIMESTAMPTZ,

    -- Evento
    nombre_evento TEXT NOT NULL,
    lugar_sala TEXT NOT NULL,
    ciudad TEXT,
    direccion TEXT,
    -- TEXT (ISO 8601) por coherencia con concerts.fecha, que también es TEXT.
    fecha_evento TEXT NOT NULL,
    aforo INTEGER CHECK (aforo IS NULL OR aforo >= 0),

    -- Horarios
    hora_carga TEXT,
    hora_prueba TEXT,
    tipo_prueba TEXT DEFAULT 'completa'
        CHECK (tipo_prueba IN ('completa', 'line_check', 'sin_prueba')),
    hora_apertura TEXT,
    hora_show TEXT,
    duracion_minutos INTEGER CHECK (duracion_minutos IS NULL OR duracion_minutos > 0),

    -- Rider técnico: validación previa obligatoria
    rider_url TEXT,
    rider_resumen TEXT,
    rider_validado BOOLEAN NOT NULL DEFAULT FALSE,
    rider_nota_sala TEXT,
    rider_validado_en TIMESTAMPTZ,

    -- Hospitalidad
    cenas_tipo TEXT DEFAULT 'no_incluye'
        CHECK (cenas_tipo IN ('en_sala', 'ticket_barra', 'dieta_efectivo', 'no_incluye')),
    cenas_pax INTEGER CHECK (cenas_pax IS NULL OR cenas_pax >= 0),
    alojamiento_detalle TEXT,
    camerino_detalle TEXT,

    -- Condiciones económicas.
    -- NO hay columna generada de total: con taquilla o porcentaje de barra el
    -- total no es una suma de estos campos. El importe que cuenta es el que
    -- queda congelado en terminos_firmados al firmar (ver más abajo).
    tipo_remuneracion TEXT NOT NULL DEFAULT 'cache_fijo'
        CHECK (tipo_remuneracion IN ('cache_fijo', 'taquilla', 'porcentaje_barra', 'hibrido')),
    cache_base NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (cache_base >= 0),
    porcentaje_taquilla NUMERIC(5,2) CHECK (porcentaje_taquilla IS NULL
        OR (porcentaje_taquilla >= 0 AND porcentaje_taquilla <= 100)),
    minimo_garantizado NUMERIC(10,2) CHECK (minimo_garantizado IS NULL OR minimo_garantizado >= 0),
    merch_cut_porcentaje NUMERIC(5,2) CHECK (merch_cut_porcentaje IS NULL
        OR (merch_cut_porcentaje >= 0 AND merch_cut_porcentaje <= 100)),
    tipo_iva NUMERIC(5,2) NOT NULL DEFAULT 21.00,  -- configurable; nunca asumir 10 (§3.3)

    -- Cobro
    forma_pago TEXT NOT NULL DEFAULT 'efectivo'
        CHECK (forma_pago IN ('efectivo', 'transferencia', 'pasarela', 'diferido_publico')),
    -- Comisión SOLO en 'pasarela' (§1.4). En el resto se queda a 0 y no se reclama.
    comision_porcentaje NUMERIC(5,2) NOT NULL DEFAULT 0
        CHECK (comision_porcentaje >= 0 AND comision_porcentaje <= 100),
    comision_importe NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (comision_importe >= 0),
    cashback_creditos INTEGER NOT NULL DEFAULT 0 CHECK (cashback_creditos >= 0),
    cashback_acreditado_en TIMESTAMPTZ,
    stripe_payment_intent_id TEXT,
    cobrado BOOLEAN NOT NULL DEFAULT FALSE,
    cobrado_en TIMESTAMPTZ,

    -- Destino del dinero en la banda
    destino_fondos TEXT NOT NULL DEFAULT 'caja_banda'
        CHECK (destino_fondos IN ('caja_banda', 'reparto_musicos', 'hibrido')),
    porcentaje_caja_comun NUMERIC(5,2) NOT NULL DEFAULT 100
        CHECK (porcentaje_caja_comun >= 0 AND porcentaje_caja_comun <= 100),

    -- Ciclo de vida
    estado TEXT NOT NULL DEFAULT 'borrador'
        CHECK (estado IN ('borrador', 'enviado', 'firmado', 'cancelado')),

    -- Firma eIDAS (§3.4)
    firmante_nombre TEXT,
    firmante_cargo TEXT,
    firmante_email TEXT,
    firma_imagen_url TEXT,          -- imagen estática; NUNCA dinámica del trazo
    firma_ip INET,
    firma_user_agent TEXT,
    firma_timestamp TIMESTAMPTZ,
    -- Snapshot canónico EXACTO sobre el que se calculó el hash. Lo que se
    -- firmó es esto, no la fila viva: así el hash sigue siendo verificable
    -- aunque después se edite cualquier campo de arriba.
    terminos_firmados JSONB,
    contrato_sha256 TEXT,
    acuse_enviado_en TIMESTAMPTZ,   -- email con el hash al firmante (§3.4 punto 1)

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Un deal firmado tiene siempre sus cuatro evidencias. Evita estados a
    -- medias por un fallo en mitad del proceso de firma.
    CONSTRAINT chk_firmado_completo CHECK (
        estado <> 'firmado' OR (
            firma_timestamp IS NOT NULL
            AND contrato_sha256 IS NOT NULL
            AND terminos_firmados IS NOT NULL
            AND firmante_nombre IS NOT NULL
        )
    ),
    -- El rider se valida ANTES de firmar. Regla de negocio, en la base de datos.
    CONSTRAINT chk_rider_antes_de_firma CHECK (estado <> 'firmado' OR rider_validado = TRUE)
);

CREATE INDEX IF NOT EXISTS idx_concert_deals_band ON concert_deals(band_id);
CREATE INDEX IF NOT EXISTS idx_concert_deals_lead ON concert_deals(lead_id);
CREATE INDEX IF NOT EXISTS idx_concert_deals_fecha ON concert_deals(fecha_evento);
-- El índice del token lo crea ya la restricción UNIQUE; no se duplica.

ALTER TABLE concert_deals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON concert_deals;
CREATE POLICY "Permitir acceso total al backend" ON concert_deals FOR ALL USING (true);

DROP TRIGGER IF EXISTS trg_concert_deals_updated_at ON concert_deals;
CREATE TRIGGER trg_concert_deals_updated_at
    BEFORE UPDATE ON concert_deals
    FOR EACH ROW EXECUTE FUNCTION update_modified_column();


-- ---------------------------------------------------------------------------
-- 3. Suplementos de producción (caso "Ruta66": P.A. propia, luces, hora extra)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS band_production_extras (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio_defecto NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (precio_defecto >= 0),
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    orden INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_band_production_extras_band ON band_production_extras(band_id);
ALTER TABLE band_production_extras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON band_production_extras;
CREATE POLICY "Permitir acceso total al backend" ON band_production_extras FOR ALL USING (true);

-- Suplementos aplicados a un deal. Se copian nombre y precio en el momento de
-- añadirlos: si la banda cambia luego su tarifa, el acuerdo ya cerrado no se
-- altera. band_id va desnormalizado a propósito, para poder filtrar por banda
-- sin JOIN en las comprobaciones del límite de confianza.
CREATE TABLE IF NOT EXISTS deal_selected_extras (
    id TEXT PRIMARY KEY,
    deal_id TEXT NOT NULL REFERENCES concert_deals(id) ON DELETE CASCADE,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    extra_id TEXT REFERENCES band_production_extras(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    precio NUMERIC(10,2) NOT NULL CHECK (precio >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_selected_extras_deal ON deal_selected_extras(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_selected_extras_band ON deal_selected_extras(band_id);
ALTER TABLE deal_selected_extras ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir acceso total al backend" ON deal_selected_extras;
CREATE POLICY "Permitir acceso total al backend" ON deal_selected_extras FOR ALL USING (true);


-- ---------------------------------------------------------------------------
-- 4. Saldo de créditos que la renovación mensual no resetea (§2.6)
-- ---------------------------------------------------------------------------
ALTER TABLE registered_bands
    ADD COLUMN IF NOT EXISTS creditos_bonus INTEGER NOT NULL DEFAULT 0;
```

> Aplicar también en `supabase_schema.sql` en el mismo commit, según AGENTS.md §1
> ("migraciones documentadas en SQL idempotente") y el punto 3 del skill
> `supabase-architect`.

#### Validación ejecutada (no "debería funcionar")

Este DDL se ha ejecutado contra **PostgreSQL 16.13**, sobre el `supabase_schema.sql` real del
repositorio cargado previamente (41 tablas, 0 errores). Resultado:

| Comprobación | Resultado |
|---|---|
| Ejecución sobre el esquema real | Sin errores |
| Segunda ejecución seguida (idempotencia) | Sin errores |
| Trigger registra la transición de estado | `nuevo -> negociando`, `origen='db'` |
| Lead con `band_id` NULL no rompe su propio `UPDATE` | Correcto, 0 filas de auditoría |
| `UPDATE` sobre `lead_status_history` | Rechazado por el motor |
| `DELETE` sobre `lead_status_history` | Rechazado por el motor |
| Firmar sin rider validado | Rechazado (`chk_rider_antes_de_firma`) |
| Firmar sin hash ni snapshot | Rechazado (`chk_firmado_completo`) |
| Deal firmado completo | Aceptado; token de 64 caracteres |
| Comisión por defecto | `0.00%` — la regla §1.4 vive en el `DEFAULT` |

Dos defectos aparecieron en esta validación y ya están corregidos arriba:

1. **`CREATE POLICY` no admite `IF NOT EXISTS`.** Sin un `DROP POLICY IF EXISTS` delante, la
   migración fallaba al ejecutarse por segunda vez. El esquema base no lo necesita porque es un
   script de creación inicial; una migración sí.
2. **`leads.band_id` es NULLABLE y `lead_status_history.band_id` es NOT NULL.** El trigger de
   auditoría lanzaba una excepción al actualizar un lead huérfano y, al ser `AFTER UPDATE`,
   abortaba el `UPDATE` del propio lead. Una tabla de auditoría nueva habría roto escrituras que
   hoy funcionan. Resuelto con una guarda de salida temprana.

La lógica de canonicalización y hash de §4.3 se validó por separado: reordenar claves produce el
mismo hash, alterar cualquier importe lo cambia, el anidamiento profundo es estable, el orden de
los arrays sí es significativo y `null` no equivale a una clave ausente.

### 4.3 Por qué `terminos_firmados` es la pieza central

Es la diferencia entre un hash decorativo y uno verificable, y merece justificación explícita.

La v1 calculaba el hash sobre "el contenido del acuerdo", sin definir qué era eso. Problema: la
fila sigue viva y editable después de firmar. Al día siguiente alguien cambia la hora de prueba
—legítimamente— y el hash deja de cuadrar con nada. No se sabe si eso es manipulación o
mantenimiento normal.

Con un snapshot:

1. Al firmar, se serializa un objeto canónico (claves ordenadas, sin espacios) con exactamente
   los términos acordados: evento, fecha, horarios, importes, suplementos, rider validado.
2. Ese objeto se guarda tal cual en `terminos_firmados` y su SHA-256 en `contrato_sha256`.
3. La fila puede seguir evolucionando. Lo firmado no se toca nunca.
4. Verificar es determinista: `sha256(canonical(terminos_firmados)) === contrato_sha256`.
5. El acuse por email (§3.4) saca ese hash fuera del sistema en el momento de la firma.

```ts
// server/utils/eidasSignature.ts (nuevo)
import { createHash } from "node:crypto";

/** Serialización canónica: claves ordenadas en todos los niveles, sin espacios.
 *  Sin esto, dos serializaciones del mismo acuerdo dan hashes distintos. */
export function canonicalizar(valor: unknown): string {
  if (valor === null || typeof valor !== "object") return JSON.stringify(valor) ?? "null";
  if (Array.isArray(valor)) return `[${valor.map(canonicalizar).join(",")}]`;
  const entradas = Object.entries(valor as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  return `{${entradas.map(([k, v]) => `${JSON.stringify(k)}:${canonicalizar(v)}`).join(",")}}`;
}

export function hashTerminos(terminos: Record<string, unknown>): string {
  return createHash("sha256").update(canonicalizar(terminos), "utf8").digest("hex");
}

export function verificarFirma(terminos: Record<string, unknown>, hashEsperado: string): boolean {
  return hashTerminos(terminos) === hashEsperado;
}
```

---

## 5. Arquitectura de endpoints

### 5.1 Rutas privadas — `server/routes/deals.ts`

Todas bajo `requireAuth` y con la banda resuelta por `getTargetBandId(req)`
(`server/utils/bandAccess.ts`). Nunca leer `req.body.band_id` para autorizar (AGENTS.md §2.1).

| Método | Ruta | Función |
|---|---|---|
| `GET` | `/api/deals` | Lista los deals de la banda |
| `GET` | `/api/deals/:id` | Detalle (404 si es de otra banda, nunca 403 con datos) |
| `POST` | `/api/deals` | Crea borrador; genera token de 256 bits |
| `PATCH` | `/api/deals/:id` | Edita borrador. Rechaza si `estado = 'firmado'` |
| `POST` | `/api/deals/:id/send` | Pasa a `enviado` y devuelve el enlace público |
| `POST` | `/api/deals/:id/cash-receipt` | Registra cobro en efectivo y genera el recibo |
| `DELETE` | `/api/deals/:id` | Cancela (nunca borra: es evidencia) |

Para las escrituras, `puedeEscribirEnBanda(req, bandId)` y **fallar con 403**, no degradar a la
banda propia — el mismo criterio que ya aplica `bandaFacturableDelUsuario` en facturación.

### 5.2 Rutas públicas — `server/routes/publicDeals.ts`

Montadas bajo `/api/public/*`, siguiendo el patrón existente de `server/routes/epk_fans.ts`
(`/public/epk`, `/public/fans`), que es la única superficie pública que hoy tiene la app.

| Método | Ruta | Notas |
|---|---|---|
| `GET` | `/api/public/deals/:token` | Devuelve **solo** la proyección pública |
| `POST` | `/api/public/deals/:token/validate-rider` | Marca el rider como revisado |
| `POST` | `/api/public/deals/:token/sign` | Firma. Idempotente: si ya está firmado, 409 |

**Cuatro reglas no negociables en esta superficie:**

1. **Rate limiting por IP.** AGENTS.md §2.2 avisa de que solo existen cuatro limitadores y
   ninguno cubre rutas públicas. Hace falta uno nuevo, con `porUsuario: false` porque aquí no
   hay usuario:

   ```ts
   // server/middleware/rateLimiter.ts
   export const dealPublicRateLimiter = createRateLimiter({
     nombre: "deal_public",
     windowMs: 5 * 60 * 1000,
     maxRequests: 30,
     porUsuario: false,
     mensaje: "Demasiadas peticiones. Espera un momento y vuelve a abrir el enlace."
   });
   ```

2. **Token opaco de 256 bits**, `crypto.randomBytes(32).toString("base64url")`. Nunca derivado
   del id, del nombre de la sala ni de la fecha. Sin enumeración posible.

3. **Proyección explícita, nunca `select("*")`.** Una función pura y testeable que construye el
   objeto público campo a campo. Si mañana se añade una columna sensible a `concert_deals`, no
   aparece sola en la vista pública:

   ```ts
   // server/utils/dealPublicView.ts (nuevo) — función pura, sin req/res
   export function proyeccionPublica(deal: ConcertDeal, extras: DealExtra[]) {
     return {
       nombre_evento: deal.nombre_evento,
       lugar_sala: deal.lugar_sala,
       ciudad: deal.ciudad,
       fecha_evento: deal.fecha_evento,
       horarios: {
         carga: deal.hora_carga,
         prueba: deal.hora_prueba,
         tipo_prueba: deal.tipo_prueba,
         apertura: deal.hora_apertura,
         show: deal.hora_show
       },
       rider: { url: deal.rider_url, resumen: deal.rider_resumen, validado: deal.rider_validado },
       hospitalidad: { cenas: deal.cenas_tipo, pax: deal.cenas_pax, camerino: deal.camerino_detalle },
       economia: {
         cache_base: deal.cache_base,
         suplementos: extras.map((e) => ({ nombre: e.nombre, precio: e.precio })),
         tipo_remuneracion: deal.tipo_remuneracion,
         forma_pago: deal.forma_pago
       },
       estado: deal.estado
       // Fuera a propósito: band_id, lead_id, destino_fondos, porcentaje_caja_comun,
       // comision_*, cashback_*, stripe_payment_intent_id, firma_ip, firma_user_agent,
       // terminos_firmados, y cualquier dato fiscal o de reparto interno.
     };
   }
   ```

4. **Sin filtración por diferencia de respuesta.** Token inexistente, caducado o cancelado
   devuelven la misma respuesta y en tiempo comparable.

### 5.3 Nota de arquitectura sobre testabilidad

AGENTS.md §5.3.1 explica por qué `server/routes/*.ts` está mal cubierto: mezcla lógica de
negocio con `req`/`res` dentro del handler. Este módulo toca `band_id` **y** dinero, las dos
áreas con excepción obligatoria de TDD, así que la lógica va en funciones puras desde el
principio:

| Función pura | Archivo | Qué decide |
|---|---|---|
| `proyeccionPublica()` | `server/utils/dealPublicView.ts` | Qué ve la sala |
| `hashTerminos()` / `verificarFirma()` | `server/utils/eidasSignature.ts` | Integridad del acuerdo |
| `calcularTotales()` | `server/utils/dealTotals.ts` | Base, suplementos, comisión, cashback |
| `COSTE_CREDITOS` | `server/utils/creditPricing.ts` | Coste en créditos por acción |

Los handlers solo parsean la petición, llaman a estas funciones y responden.

---

## 6. La vista pública `/deal/view/:token`

Diseño móvil primero a 390 px, con el presupuesto de AGENTS.md §6: máximo tres bloques antes
del scroll.

```
┌──────────────────────────────────────────────┐
│  Los Chicos del Barrio                       │
│  Sábado 15 de noviembre · Sala La Riviera    │
├──────────────────────────────────────────────┤
│  HORARIOS                                    │
│  Carga 18:00 · Prueba 18:30 (completa)       │
│  Puertas 21:00 · Show 21:30 (90 min)         │
├──────────────────────────────────────────────┤
│  RIDER TÉCNICO          [ Ver ficha ]        │
│  [ ] He revisado el rider. La sala dispone   │
│      del equipo o cubrirá lo indicado.       │
│  [ Compartir con el técnico ]                │
├──────────────────────────────────────────────┤
│  CONDICIONES                                 │
│  Caché base ................... 800,00 €     │
│  Sonido propio (P.A.) ......... 250,00 €     │
│  Total ...................... 1.050,00 €     │
│  Pago: en efectivo al final del show         │
├──────────────────────────────────────────────┤
│  FIRMA                                       │
│  Nombre y cargo: [____________]              │
│  [   lienzo táctil para la firma   ]         │
│                                              │
│  Al firmar se registran fecha, hora, IP y    │
│  navegador como evidencia. Conservamos       │
│  estos datos 5 años. Más información ▸       │
│                                              │
│  [ FIRMAR Y CONFIRMAR LA FECHA ]             │
└──────────────────────────────────────────────┘
```

**Detalles que no son cosméticos:**

- El botón de firmar permanece **deshabilitado** hasta que el rider está marcado. Es la
  validación previa obligatoria, y está respaldada por `chk_rider_antes_de_firma` en la base de
  datos: aunque alguien salte el frontend, el motor rechaza la fila.
- El aviso de privacidad está **junto al botón**, no en el pie (§3.5).
- Tras firmar: confirmación en pantalla y acuse por email con el hash al firmante y a la banda.
- Fuera de `LanguageProvider`, por el mismo motivo que el EPK público (AGENTS.md §5.2): que
  Google Translate no altere nombres propios ni importes.

---

## 7. Atribución sin vigilancia

La v1 dedicaba su sección más larga a detectar bandas que marcaban un lead como `descartado`
para esquivar la comisión, y a "convertirlas" con una notificación alegre. Esa sección se
elimina, por dos motivos.

**El primero es de coherencia.** El documento proclamaba no espiar y a continuación describía
correlacionar el historial de leads con eventos detectados en las redes sociales de la banda
para deducir un bolo ocultado. Eso es vigilancia; el tono del mensaje no cambia la naturaleza
del mecanismo. La propia v1 lo admitía al listar como ventaja que *"la banda se da cuenta de que
no puede engañar al sistema"*: el efecto buscado era precisamente que se sintieran observadas.

**El segundo es que ya no hace falta.** Con la regla §1.4 —comisión solo sobre pagos digitales—
no existe comisión que esquivar en efectivo. El incentivo para el bypass desaparece, y con él
la razón para detectarlo. Es el caso raro en que un cambio de modelo de negocio elimina un
problema técnico entero en lugar de mitigarlo.

**Qué se conserva, y por qué.** `lead_status_history` **sí** se implementa, pero como lo que
debe ser: una tabla de auditoría de un CRM. Sirve para métricas del embudo, para que la banda
vea el recorrido de una negociación, para depurar el comportamiento de los agentes y para el
propio TFM como registro de decisiones del sistema. No se usa para inferir conducta del usuario
ni para generar avisos basados en lo que hace fuera de la plataforma.

**Y una funcionalidad de la v1 que sí merece sobrevivir, despojada del subtexto:** permitir
registrar bolos externos gratis en el calendario. En la v1 era un cebo para mantener el hábito
de uso y alimentar la detección. Por sí sola es simplemente una buena función: una agenda que
no muestra todos tus conciertos no sirve como agenda.

---

## 8. Roadmap

Dimensionado para 1,5–2 h por noche y un único desarrollador, con el TFM como entrega. El
criterio: **un flujo completo y bien hecho vale más que seis a medias**, tanto para un tribunal
como para un usuario.

### P0 — Acuerdo y firma, sin dinero (entregable del TFM)

Todo el riesgo regulatorio vive en el dinero (PSD2, Verifactu, IVA). Sacarlo del primer
entregable no le resta nada al trabajo: el núcleo defendible es el flujo de acuerdo con
evidencia criptográfica y aislamiento multi-inquilino verificado.

1. Corregir `skills/supabase-architect/SKILL.md` en sus tres copias (§0).
2. Migración `20260919_concert_deals.sql` + sincronizar `supabase_schema.sql`.
3. `server/utils/eidasSignature.ts` — **con sus tests antes** (§9.2).
4. `server/utils/dealPublicView.ts` — **con sus tests antes**.
5. `server/db/deals.ts` siguiendo la firma `dbUpsertX(objeto, bandId)`.
6. `server/routes/deals.ts` — CRUD privado bajo `getTargetBandId`.
7. `server/routes/publicDeals.ts` + `dealPublicRateLimiter`.
8. Frontend: editor del deal (privado) y `/deal/view/:token` (público).
9. Acuse por email con el hash, vía `RESEND_API_KEY`.
10. Extender el hook `.claude/hooks/security-review-reminder.js` con los archivos nuevos.

Los importes se muestran como condiciones acordadas entre las partes. La plataforma no cobra
nada en P0.

### P1 — Operativa de campo

- Suplementos de producción (caso Ruta66): `band_production_extras` en el perfil + selección
  en el deal. El SQL ya está en P0; falta la UI.
- Recibo de entrega de efectivo en PDF (§3.2) e integración con `payments`.
- Pago diferido para ayuntamientos: marca de estado y seguimiento del cobro a 60–120 días.
- Rider de hospitalidad en la hoja de ruta de los músicos.
- Lista de puerta con enlace para el portero.
- Músicos sustitutos y su liquidación prioritaria sobre la caja común.

### P2 — Dinero digital

- `creditPricing.ts` + cierre del agujero de `creditsAmount` (§2.4). **Prerrequisito.**
- `creditos_bonus` y orden de consumo (§2.6). **Prerrequisito del cashback.**
- Onboarding de Stripe Connect para la banda (§3.1).
- Cobro con `application_fee_amount` y cashback sobre la comisión realmente cobrada.
- QR de cobro de merch, cálculo del merch cut, backline compartido.

> Los dos prerrequisitos son innegociables. Activar el cashback antes del tarifario por acción
> es exponerse a margen negativo; activarlo antes de `creditos_bonus` es prometer un incentivo
> que se borra en la siguiente renovación.

---

## 9. Plan de pruebas

### 9.1 Qué exige AGENTS.md aquí

§5.3.1 establece que TDD estricto **no** es la norma del proyecto, con dos excepciones
obligatorias: aislamiento multi-banda (`band_id`) y todo lo que toca dinero. Este módulo cae de
lleno en ambas, así que aquí el test va **antes** del código. Y debe verificar un **invariante**,
no la implementación de hoy: el patrón de `server/db/__tests__/bandIdTrustBoundary.test.ts`,
que escanea código fuente y sigue protegiendo aunque se reescriba la implementación entera.

### 9.2 Suites a escribir

**`server/utils/__tests__/eidasSignature.test.ts`** — antes de escribir el módulo:
- El hash es determinista ante reordenación de claves del objeto.
- Cambiar cualquier término (importe, fecha, hora) cambia el hash.
- `verificarFirma` rechaza un snapshot alterado.
- *Invariante:* dos objetos canónicamente iguales producen el mismo hash; dos distintos, no.

**`server/utils/__tests__/dealPublicView.test.ts`** — antes de escribir el módulo:
- *Invariante, el importante:* para un deal con **todos** los campos poblados, el objeto
  devuelto no contiene ninguna clave de la lista negra (`band_id`, `destino_fondos`,
  `comision_*`, `cashback_*`, `firma_ip`, `firma_user_agent`, `terminos_firmados`,
  `stripe_payment_intent_id`, `porcentaje_caja_comun`).
- Escrito recorriendo las claves del resultado contra la lista negra, no comprobando campo a
  campo: así una columna sensible añadida en el futuro hace fallar el test sola.

**`server/routes/__tests__/dealsTrustBoundary.test.ts`** — escaneo estático:
- Ningún handler de `deals.ts` / `publicDeals.ts` lee `req.body.band_id` para autorizar.
- Toda ruta privada de deals aplica `requireAuth`.
- Toda ruta pública aplica `dealPublicRateLimiter`.
- Ningún `select("*")` sobre `concert_deals` en la capa pública.

**`server/utils/__tests__/dealTotals.test.ts`** (P2, antes del código):
- *Invariante:* la comisión es exactamente 0 cuando `forma_pago <> 'pasarela'`. Es la regla
  §1.4 convertida en test; si alguien la rompe por descuido, salta.
- El cashback nunca supera la comisión efectivamente cobrada.
- Redondeo a céntimos sin pérdida acumulada en sumas de suplementos.

**`server/routes/__tests__/creditBonus.test.ts`** (P2, antes del código):
- *Invariante:* una renovación de plan nunca reduce `creditos_bonus`.
- El consumo agota `creditos_bonus` antes que la cuota del periodo.
- El saldo total nunca queda negativo.

### 9.3 E2E

AGENTS.md §5.3.2 mantiene deliberadamente una suite mínima, y advierte del disparador de POM:
en cuanto un **segundo** archivo de `e2e/` necesite sesión iniciada, se extrae un fixture de
login (`test.extend`) en ese mismo commit.

Se añade **un** spec: `e2e/deal-public-sign.spec.ts`. Es el candidato natural porque es una ruta
pública —como `epk-public.spec.ts`— y no necesita credenciales de IA, email ni Stripe: crear el
deal por API con el usuario semilla, abrir el enlace, validar el rider, firmar, comprobar el
estado. El editor privado del deal no se cubre en E2E por ahora (arrastraría el fixture de
login antes de que haga falta).

---

## 10. Riesgos abiertos y decisiones pendientes

Lo que este plan **no** resuelve, por honestidad de alcance:

| Riesgo | Estado | Nota |
|---|---|---|
| Titularidad de vídeos de YouTube (AGENTS.md §8.1 🔴) | Abierto | Ajeno a este módulo, bloqueante para producción |
| Credenciales de email en claro (AGENTS.md §8.2 🔴) | Abierto | Ídem |
| Baja en emails comerciales, LSSICE (§8.3 🟠) | Abierto | El módulo de deals no envía comerciales; el de leads sí |
| Borrado y exportación de cuenta (§8.6 🟠) | Agravado | Los deals añaden datos de terceros (firmantes) al borrado en cascada |
| Accesibilidad de la vista pública (§8.7 🟠) | Nuevo | `/deal/view/:token` es superficie pública nueva: auditar con axe |
| Colisión de IDs `Date.now()` | Conocido | La convención del repo es frágil; para deals se usa sufijo aleatorio |
| Valor probatorio de la firma simple | Aceptado | Mitigado con acuse externo (§3.4); sello cualificado queda para más adelante |

**Decisiones que quedan para quien decida el producto, no para el código:**
1. ¿Porcentaje de comisión sobre pagos digitales? El 5% del plan es un marcador, no un análisis.
2. ¿El cashback se acredita al firmar o al cobrar? Recomendación: **al cobrar**, para no acreditar
   sobre un bolo que se cae.
3. ¿Caducan los `creditos_bonus`? Recomendación: sí, a 12 meses, para acotar el pasivo diferido.

---

## 11. Resumen

- **Para la sala:** un enlace, diez segundos, sin cuenta y sin app.
- **Para la banda:** el bolo entero resuelto en el móvil, y la plataforma no le cobra por el
  dinero que no pasa por ella.
- **Para el proyecto:** ingresos por suscripción con margen del 99% en IA, comisión solo donde
  hay infraestructura real detrás, y ninguna línea de código dedicada a vigilar al usuario.
- **Para el TFM:** un módulo con aislamiento multi-inquilino verificado por tests de invariante,
  evidencia criptográfica sobre snapshot inmutable, y un marco legal argumentado con sus
  límites escritos en lugar de ocultos.

El plan anterior prometía blindaje y traía una capa técnica inejecutable y una contradicción
ética en su sección más larga. Este promete menos y lo sostiene con el código que hay debajo.

---

### Anexo: nota sobre el nombre del archivo

`plan_anti_fraude.md` describe el documento que era, no el que es. Tras eliminar la detección de
bypass, aquí no queda nada antifraude: es el plan del módulo de acuerdos de concierto.
`plan_concert_deals.md` sería más honesto. Se mantiene el nombre para no romper referencias
externas; renombrarlo es un `git mv` cuando convenga.
