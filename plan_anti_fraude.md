# 🛡️ Plan Maestro Defensivo, Marco Legal/Seguridad y Flywheel de Valor (BandManager.io)

> **Documento de Arquitectura de Software, Seguridad, Marco Legal/Fiscal y Operaciones de Campo**  
> **Nivel de Excelencia:** Plan Maestro de Ingeniería y Negocio (Matrícula de Honor)  
> **Revisión Experta:** Mánager de Gira Internacional, Músico Profesional y Gestor de Salas (Clubes & Gran Recinto)  
> **Última Actualización:** Septiembre 2026

---

## 🏛️ 1. Visión Ejecutiva y Directivas Inquebrantables

En el ecosistema real del directo coexisten escenarios extremadamente diversos: desde el bar de pueblo que paga 300 € en metálico en un sobre tras el show, hasta la sala de 800 personas que liquida por taquilla, pasando por festivales y contrataciones municipales de ayuntamientos que pagan a 90 o 120 días.

El objetivo de **BandManager.io** no es imponer rigidez ni actuar como entidad fiscal o burocrática, sino servir como **SaaS de gestión operativa y financiera hiper-eficiente**.

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🎯 LAS 4 REGLAS DE ORO DE BANDMANAGER.IO                                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  1. CERO REGISTRO OBLIGATORIO PARA LA SALA / PROMOTOR (FRICCIÓN CERO)                   │
│     El programador o dueño de sala NUNCA se creará una cuenta ni pasará por un KYC       │
│     complejo. Debe revisar, aceptar el Rider y firmar en 10s desde su móvil (URL 1-Click).│
├────────────────────────────────────────────────────────────────────────────────────────┤
│  2. CERO BUROCRACIA O ROLES DE ETT / AGENCIA                                           │
│     La app es un software de gestión. La relación laboral/comercial es directa entre    │
│     artista y sala. La app NO exige altas de Seguridad Social ni contratos farragosos. │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  3. FLYWHEEL DE VALOR: CASHBACK EN PASES DE ESTUDIO Y AGENTES (RECOMPENSA REAL)        │
│     Al cobrarse la pequeña tasa de servicio (ej. 5%), la app devuelve el 100% de ese    │
│     importe a la banda en Pases de Estudio Vitalicios (Stems y Reels de regalo) y       │
│     potencia de Scout. La app ingresa dinero real; la banda percibe que gana recursos.   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  4. INTEGRIDAD LEGAL Y PRIVACIDAD TOTAL POR DISEÑO (RGPD + eIDAS)                      │
│     Firma electrónica simple con sello criptográfico SHA-256 e inmutabilidad, con       │
│     minimización de datos sensibles en enlaces públicos.                               │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 2. Marco Legal, Seguridad y Privacidad por Diseño (Privacy & Security by Design)

Para garantizar validez probatoria, cumplimiento estricto del RGPD/GDPR y seguridad multi-tenant sin añadir burocracia, la app implementa las siguientes capas técnicas:

### 2.1 Firma Electrónica e Inmutabilidad Criptográfica (Reglamento eIDAS UE 910/2014)
* **Validez de la Firma 1-Click**: La firma táctil realizada desde el teléfono móvil del programador/promotor se clasifica como **Firma Electrónica Simple** plenamente válida bajo el Reglamento eIDAS (Art. 25).
* **Trazabilidad de la Evidencia (Audit Trail)**: Cada firma registra en Supabase un hash inalterable que incluye:
  * Timestamp exacto UTC de la firma.
  * Dirección IP de origen (con guardias de validación).
  * User-Agent y huella del navegador/dispositivo.
  * **Hash Criptográfico SHA-256 del acuerdo**: Al pulsar *"Confirmar"*, la app genera un hash SHA-256 del contenido exacto de la Hoja de Acuerdo (fecha, caché, rider, horarios). Cualquier intento posterior de modificar los términos invalidará la firma registrada.

### 2.2 Minimización de Datos y Cumplimiento RGPD (Privacidad Pública)
* **Protección de Datos Personales en Enlaces Públicos**: Los enlaces públicos de la Hoja de Acuerdo (`/deal/view/:token`) aplican el **principio de minimización de datos** (Art. 5.1.c RGPD):
  * **NUNCA** se exponen DNI/NIF de los músicos, teléfonos personales ni IBANs bancarios en la vista pública web.
  * La sala solo ve el Nombre Artístico de la Banda, Ficha Técnica de Sonido, Horarios, Importes del Bolo y el Formulario de Firma.
  * Tras confirmarse la firma, los documentos oficiales (Factura / Recibo PDF) con datos fiscales completos se transmiten de forma encriptada y restringida mediante autenticación.

### 2.3 Isolation Multi-Tenant Inflexible (`getTargetBandId` & Supabase RLS)
* **Aislamiento en Capa de Aplicación**: Toda consulta o mutación backend se valida mediante el middleware `getTargetBandId(req)` (`server/utils/bandAccess.ts`), garantizando que ninguna banda pueda ver las ofertas, cachés o contratos de otra.
* **Seguridad en Supabase Storage**: Los archivos de firmas, recibos PDF y riders firmados se custodian bajo rutas acotadas `deals/{bandId}/{dealId}/...` con políticas de acceso privado.

### 2.4 Marco Fiscal y Prevención del Fraude (Ley 11/2021)
* **Facturación Simplificada Automática**: La app genera facturas y recibos en PDF con numeración correlativa e inmutable.
* **IVA Reducido del 10% en Actuaciones Artísticas**: La plantilla de factura calcula automáticamente el **10% de IVA reducido** aplicable a los servicios prestados por artistas (Art. 91.Uno.2.13° Ley 37/1992 del IVA en España y equivalentes en la UE), evitando errores de tributación.

### 2.5 Filosofía "Anti-Policía": Prevención del "Bypass" sin Espionaje ni Sanciones Represivas

Una de las trampas habituales en plataformas digitales es intentar actuar como "policía" para evitar que los usuarios cierren tratos por fuera (por teléfono, WhatsApp o correo) para esquivar la tasa de servicio.

**¿Por qué actuar de "policía" fracasa un 100% de las veces?**
1. **Sensación de Espionaje y Rechazo**: Leer mensajes privados, bloquear números de teléfono o escanear palabras clave genera frustración inmediata en bandas y salas.
2. **Evasión Inevitable**: Si alguien quiere saltarse la app, simplemente llamará por teléfono. No se puede evitar vigilando.

**La Solución de BandManager.io: "Zanahoria y Enclave Operativo" (Incentivos Positivos)**:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🥕 ESTRATEGIA "ANTI-POLICÍA": POR QUÉ LA BANDA NUNCA QUIERE SALIRSE DE LA APP           │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  1. INCENTIVO ECONÓMICO REAL (CASHBACK EN PASES DE ESTUDIO VITALICIOS):                 │
│     Si la tasa de la app es del 5% (ej. 25 € en un bolo de 500 €), la app les regala    │
│     el 100% de ese valor en Pases de Estudio permanentes (ej. 2 canciones de Stems      │
│     en 4 pistas o 5 Reels para promocionar el show). La banda piensa: "¿Para qué me voy │
│     a saltar la app para ahorrarme 25 € si usándola me regalan la producción de audio  │
│     y vídeo que necesito para preparar este mismo concierto?".                         │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  2. ENCLAVE OPERATIVO (VALOR INDISPENSABLE EN EL DIRECTO):                             │
│     Si cierran por fuera por WhatsApp para no usar la app, PIERDEN:                    │
│     • La URL del Rider Técnico Interactivo para el técnico de sonido de la sala.       │
│     • El Recibo Digital / Factura PDF oficial para la contabilidad y la caja común.     │
│     • La URL de la Lista de Invitados de Puerta para el portero de la sala.           │
│     • La Hoja de Ruta interactiva y el Visor de Acordes/Setlist en modo escenario.      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  3. PERMISIVIDAD TOTAL DE BOLOS EXTERNOS (CERO BANEOS):                                │
│     • La app permite registrar bolos externos GRATIS en el calendario para mantener    │
│       el hábito diario de uso.                                                         │
│     • NUNCA se banea a una banda, NUNCA se lee su chat privado y NUNCA se piden          │
│       explicaciones. El valor retenido es tan alto que la banda elige usar la app.     │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.6 Detección Inteligente de Atribución, Historial Inmutable y "Nudges" de Conversión

¿Se puede saber si una banda negoció un concierto en la app y finalmente se celebró sin pasar por la pasarela de acuerdos, **incluso si la banda cambia el estado del lead a "descartado" o "no interesado" para despistar**?

**SÍ, de forma rotunda e infalible**, gracias a dos mecanismos clave:

#### A. Historial Inmutable de Estados y Conversaciones (`lead_status_history` & `lead_messages`)
* En un CRM profesional, **el estado de un lead nunca se sobreescribe a ciegas**. Cada transición (`nuevo` -> `contactado` -> `negociando` -> `descartado`) se registra automáticamente en una tabla de auditoría inmutable (`lead_status_history`) con timestamp, usuario y estado previo.
* Además, los mensajes reales intercambiados por el Agente Lector o Gmail con la sala (`lead_messages`) quedan custodiados de forma permanente con las fechas y condiciones propuestas.
* **Resultado**: Aunque el usuario pulse *"Descartar Lead"*, el sistema sabe con certeza matemática que para esa sala y para esa fecha hubo una negociación activa generada dentro de la plataforma (`ever_reached_negotiation = true`).

#### B. El Patrón del "Descarte Simulado" y el Nudge Adaptativo del Asistente
Si el sistema detecta que un lead histórico negociado (incluso si fue marcado posteriormente como `descartado` o `aplazado`) coincide en sala y fecha con un bolo del calendario o un evento público detectado en redes:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🎯 EL NUDGE ADAPTATIVO ANTE UN "DESCARTE SIMULADO" (ELEGANCIA PSICOLÓGICA)             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  1. LO QUE SABE EL SISTEMA (MEMORIA HISTÓRICA INMUTABLE):                              │
│     • El lead estuvo en estado "negociando" para el 15 de Noviembre.                   │
│     • El usuario lo cambió a "descartado" para no reflejar el acuerdo.                 │
│     • El 15 de Noviembre la banda toca en esa misma sala (anotado en agenda o redes).  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  2. REACCIÓN PROHIBIDA (EL ERROR DEL POLICÍA):                                         │
│     ❌ "Te hemos pillado cambiando el lead a descartado para no pagar la comisión."    │
│     (Genera enemistad, paranoia y fuga de usuarios).                                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  3. REACCIÓN MAESTRA: "BOLO RECUPERADO DE ÚLTIMA HORA" (CERO ACUSACIONES):             │
│     El Asistente IA envía una notificación alegre y servicial:                         │
│     "¡Qué gran noticia! Veíamos el concierto en Sala La Riviera como aplazado o        │
│      descartado, pero hemos visto que finalmente tocáis allí este 15 de Noviembre. 🎸   │
│                                                                                        │
│      ¿Queréis reactivarlo en 1-Click para que el equipo tenga la Hoja de Ruta en el    │
│      móvil y tengáis la Factura/Recibo lista para cobrar?                              │
│      🎁 Además, os activamos 2 Pases de Stems y 5 Reels gratis para este concierto."   │
│                                                                                        │
│     [ Botón 1-Click: REACTIVAR BOLO, HOJA DE RUTA Y GENERAR FACTURA ]                  │
│     [ Botón: Mantener como Bolo Básico sin Factura ]                                   │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

**Por qué esta técnica es imbatible:**
1. **La banda se da cuenta de que no puede engañar al sistema**: Comprende que la app correlaciona datos de forma inteligente.
2. **No hay conflicto**: No hay acusaciones ni penalizaciones. Se trata como un *"éxito de última hora"*.
3. **Conversión natural**: La banda prefiere reactivarlo en 1-Click, llevarse los Créditos IA y tener la factura y la hoja de ruta ordenadas para su concierto.

---

## 🗺️ 3. Roadmap de Desarrollo y Priorización de Funcionalidades (P0, P1, P2)

Para garantizar un desarrollo ágil sin sobrecargar el código, las funcionalidades se organizan estrictamente por nivel de prioridad:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🚀 MATRIZ DE PRIORIZACIÓN DE DESARROLLO (ROADMAP)                                     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  🔴 P0 (CRÍTICO / MVP NÚCLEO) - Imprescindible para lanzar:                           │
│  • Vista Pública de Hoja de Acuerdo 1-Click (sin login para la sala).                  │
│  • Firma Táctil eIDAS con registro de Audit Trail (IP, Timestamp, User-Agent).         │
│  • Integración de Validación Obligatoria del Rider Técnico previo a la firma.           │
│  • Registro de Métodos de Cobro (Efectivo, Bizum, Tarjeta) y asignación a Caja Banda.  │
│  • Sistema de Cashback de Tasa a Créditos IA en la base de datos.                      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  🟠 P1 (OPERATIVA Y CAMPO) - Siguiente iteración (Alta aportación de valor):          │
│  • Detección Inteligente de Atribución y Nudges Proactivos de Conversión (Asistente).   │
│  • Checkbox de Pago Diferido / Ayuntamiento (Pausa de comisión a 60-120 días).          │
│  • Módulo de Suplementos y Producción Propia (Caso "Ruta66": Sonido/P.A., Luces).      │
│  • Gestión de Músicos Sustitutos ("Subs de Sesión") y su liquidación prioritaria.      │
│  • Rider de Hospitalidad (Cenas, Alojamiento, Camerinos en Hoja de Ruta).             │
│  • Generador de Enlace Web de Lista de Puerta para el Portero de la Sala.             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  🟢 P2 (ESCALA Y ANALÍTICA) - Fase de optimización y crecimiento:                      │
│  • QR Rápido de Cobro de Merchandising en Modo Escenario.                              │
│  • Cálculo y desglose automático de Merch Cut (comisión de sala sobre merch).           │
│  • Coordinación de Backline Compartido entre múltiples bandas.                       │
│  • Stripe Connect Escrow para depósitos automáticos en grandes festivales.             │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📄 4. Módulo de Hoja de Acuerdo "Airbnb Style" y Check Técnico Previo

La Hoja de Acuerdo es el corazón operativo del sistema. Reemplaza los contratos PDF de 15 páginas por un formulario web interactivo responsive:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 📄 HOJA DE ACUERDO Y VALIDACIÓN TÉCNICA (PÁGINA MÓVIL PÚBLICA SIN LOGIN)              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  1. DATOS DEL EVENTO:                                                                  │
│  • Artista: Los Chicos del Barrio               • Fecha: Sábado, 15 Noviembre 2026     │
│  • Sala / Lugar: Sala La Riviera (Madrid)       • Aforo: 800 personas                   │
│                                                                                        │
│  2. HORARIOS Y PRUEBA DE SONIDO:                                                       │
│  • Carga/Montaje: 18:00h  • Prueba: 18:30h (45m)  • Puertas: 21:00h  • Show: 21:30h     │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  3. VERIFICACIÓN OBLIGATORIA DEL RIDER TÉCNICO (PREVIO A FIRMAR)                       │
│     [ Botón: Ver Ficha Técnica / Canal por Canal (Patchlist) ]                         │
│                                                                                        │
│     ☑ "He revisado el Rider Técnico. La sala dispone del equipo o se compromete a     │
│        cubrir los requerimientos técnicos indicados."                                  │
│     • Reenvío rápido a Técnico de Sonido: [ Botón: Compartir Ficha por WhatsApp ]      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  4. CONDICIONES ECONÓMICAS Y SUPLEMENTOS:                                              │
│  • Caché Base Actuación:                      800,00 €                                 │
│  • Suplemento Sonido Propio (P.A. y Montaje): +250,00 €                                 │
│  • TOTAL COMPENSACIÓN ACORDADA:             1.050,00 €                                 │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  5. MÉTODO DE PAGO ACORDADO:                                                           │
│  (•) Pago por Pasarela Digital (Tarjeta / Bizum) -> Señal 30% [315,00 €]               │
│  ( ) Pago en Efectivo al finalizar el Show (Recibo digital en mano)                    │
│  ( ) Pago Diferido / Ayuntamiento (Factura a 60-120 días)                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  6. RIDER DE HOSPITALIDAD Y CATERING:                                                  │
│  • Cenas: 6 Cenas calientes en sala  • Alojamiento: 3 Hab. Dobles  • Camerino: Bebidas   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  7. FIRMA Y CONFIRMACIÓN EIDAS:                                                        │
│     [ Lienzo táctil para firma con el dedo ]                                           │
│     [ Botón: ACEPTAR RIDER, FIRMAR Y RESERVAR FECHA (1-CLICK) ]                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💶 5. Modos de Cobro y Gestión del Dinero Real

### A. Pago Digital (Tarjeta, Bizum, Apple Pay, Google Pay)
* Impulsado por **Stripe Checkout**.
* La sala o el promotor puede pagar la reserva o el total directamente como **invitado** desde su móvil.
* La pequeña comisión de la app (ej. 5%) se retiene automáticamente y la banda recibe el saldo neto + el **100% del valor de la comisión en Pases de Estudio Vitalicios** (Stems en 4 pistas y Reels de promoción, según se define en `plan_gestion_tokens_ia.md`).

### B. Pago en Efectivo ("En Mano / En El Sobre")
* La forma de cobro predominante en pubs, bodas y salas pequeñas.
* **Flujo Operativo**:
  1. Al finalizar el show, el mánager o líder del grupo pulsa en la app **"Confirmar Cobro en Efectivo (ej. 500 €)"**.
  2. La app genera al instante un **Recibo Digital de Entrega de Efectivo en PDF** firmado digitalmente, sirviendo como justificante para la caja de la sala y para la contabilidad del grupo.
  3. No se cobran comisiones abusivas sobre el efectivo ni se actúa de policía. La monetización de estas bandas se produce mediante su suscripción mensual SaaS (Planes Ensayo / Local / De Gira).

### C. Ayuntamientos y Sector Público (Pago Diferido a 60-120 Días)
* La banda simplemente activa la casilla `[x] Pago Diferido / Ayuntamiento / Comisión de Fiestas`.
* **Cero Burocracia**: Cero integraciones estatales complejas (Factura-e/XML). La banda factura con su gestoría/cooperativa habitual.
* La fecha se confirma en la agenda. La comisión de la app **queda en pausa congelada** hasta que la banda marque el botón *"Cobrado de Ayuntamiento"* o la salde con sus Créditos IA acumulados.

---

## 🔊 6. Módulo de Suplementos y Producción Propia (Caso "Ruta66")

En grupos de versiones, eventos y orquestas, existen conciertos donde la sala pone el equipo de sonido y otros donde la banda debe aportar y montar su propia P.A. y luces.

### Gestión Transparente en 3 Pasos:
1. **Plantilla de Extras en el Perfil de la Banda**:
   * *Suplemento Equipo de Sonido Propio (P.A. y Montaje)*: `+250 €`
   * *Suplemento Puentes de Luces*: `+100 €`
   * *Hora Extra / Pase Adicional*: `+150 €`
2. **Selección con Checkbox al crear la propuesta**:
   * La banda activa los suplementos necesarios. El cliente entiende el desglose exacto del presupuesto.
3. **Aviso Automático en la Hoja de Ruta para Músicos**:
   * En el móvil de los músicos aparece destacado:  
     `⚠️ BOLO CON EQUIPO PROPIO: Carga de P.A., furgoneta y montaje a las 16:30h en el local.`

---

## 🧰 7. Operativa de Campo y Casos Especiales

| Caso de Campo | Solución Técnica Ultra-Simple |
| :--- | :--- |
| **Músicos Sustitutos ("Subs de Sesión")** | Asignación del sub al evento. Acceso 1-Click al Setlist/tonos. En Finanzas, se liquida primero su caché fijo antes de repartir la caja común. |
| **Lista de Puerta / Acompañantes** | Los músicos añaden a sus invitados en la app. Se genera una URL de control de acceso para el portero/taquillero de la sala. |
| **Backline Compartido entre Grupos** | Indicación clara de qué banda aporta batería base, amplificadores o P.A., calculando tiempos de cambio (*changeover*). |
| **Line Check vs Prueba Completa** | Definición en los horarios de la Hoja de Ruta para evitar nervios antes del show. |
| **Venta de Merchandising & Merch Cut** | QR rápido de cobro por Bizum/Tarjeta en modo escenario. Deducción automática del porcentaje de la sala si aplican *Merch Cut*. |
| **Cancelación por Lluvia / Enfermedad** | Botón "Cancelar o Reprogramar Fecha". Liberación de la fecha en agenda sin penalizaciones represivas de IA. |

---

## 💰 8. Destino de Fondos (Gestión de la Caja de la Banda)

En el módulo de **Finanzas** (`/src/components/Finanzas.tsx`), la app gestiona el dinero recibido tras un bolo en 3 modalidades configurables:

1. **Modo A: Caja de la Banda / Fondo Común (Por Defecto)**:  
   El 100% del cobro va al bote del grupo para pagar local de ensayo, furgoneta, gasolina, grabaciones y producción.
2. **Modo B: Reparto Individual por Porcentajes**:  
   Distribución automática entre los IBAN/Bizum de los miembros según sus porcentajes prefijados.
3. **Modo C: Modelo Híbrido**:  
   Un % se destina a la caja común (ej. 30%) y el remanente se reparte entre los músicos.

---

## ⚡ 9. Integración con el Sistema de IA y Cupos de Estudio (`plan_gestion_tokens_ia.md`)

Para que el modelo defensivo funcione a la perfección, el incentivo del cashback y las recompensas por cerrar conciertos se alinean directamente con el **Plan de Gestión de IA**:

1. **Recompensa Tangible por Bolo Confirmado**:
   * En lugar de entregar créditos abstractos de una moneda virtual, la confirmación de un bolo por pasarela o su reactivación desde el CRM acredita **Pases de Estudio Vitalicios** en la biblioteca de la banda:
     * `+2 Canciones de Stems completas (4 pistas)` para preparar el repertorio del show.
     * `+5 Reels de Vídeo` listos para promocionar la fecha en redes.
2. **Percepción de Valor Inmediato**:
   * El músico ve una recompensa de estudio que tiene un valor comercial claro en el mercado (separar stems de calidad y renderizar vídeo profesional con subtítulos).
   * Al mismo tiempo, como se demuestra en `plan_gestion_tokens_ia.md` §5, el coste real de infraestructura para BandManager por entregar este paquete es de apenas **~0,12 €**, garantizando una rentabilidad intocable.
3. **Incentivo de Retención Continuo**:
   * Los pases obtenidos por bolos **se guardan en la hucha permanente (`studio_bonus_stems` / `studio_bonus_reels`) y nunca caducan**, fidelizando a la banda a largo plazo.

---

## 🚀 10. Innovaciones Revolucionarias de IA Agéntica: El Foso Competitivo del TFM (Nivel Excelencia Mundial)

Para que el tribunal del máster y la industria de la música queden impresionados por la profundidad técnica y de negocio, BandManager.io incorpora 5 innovaciones pioneras en el software musical que resuelven los dolores más profundos del directo:

### 10.1 WhatsApp Magic Share: Viralidad Orgánica B2B Cero-Fricción
El gran cuello de botella del directo son los intermediarios que **se niegan a registrarse en plataformas**: el técnico de sonido de la sala y el portero de la taquilla.
* **Flujo 1-Click**: Al confirmarse la Hoja de Acuerdo, la app genera dos enlaces web ligeros optimizados para compartir por WhatsApp:
  1. **`[ 📲 Enviar al Técnico de Sonido ]`**: Abre WhatsApp con el enlace de la *Ficha de Cabina Live*. Al abrirlo, el técnico no ve contratos ni importes: ve **únicamente la lista de canales (patchlist), el plano de escenario y los envíos de monitores** con interfaz de alto contraste en modo oscuro optimizada para cabinas de mezcla con poca luz.
  2. **`[ 🎟️ Enviar al Portero de la Sala ]`**: Enlace ultra-rápido donde el portero busca por nombre o apellido y tacha con un solo toque táctil quién ha entrado a la sala.
* **Impacto**: Cada concierto cerrado convierte a técnicos de sonido, promotores y porteros de toda España en prescriptores orgánicos de BandManager sin gastar 1 céntimo en marketing.

### 10.2 Modo Escenario Offline (Military-Grade Reliability en Sótanos y Festivales)
El 80% de las salas son sótanos de hormigón o recintos rurales donde **no hay 4G/5G ni WiFi**. Una app que dependa de conexión continua falla en el momento de la verdad.
* **Arquitectura Service Worker + IndexedDB**: Al abrir la app horas antes del concierto, el cliente descarga en local:
  * Toda la Hoja de Ruta, contactos de emergencia y horarios.
  * Letras, acordes y pistas de referencia del Setlist.
  * El motor de generación y firma del Recibo de Entrega de Efectivo.
* **Sincronización Silenciosa**: Toda firma o modificación en el camerino se encripta en el almacenamiento del dispositivo y se sincroniza automáticamente en segundo plano con Supabase en cuanto el móvil recupera cobertura en la calle.

### 10.3 Dynamic Touring Yield Management (El Optimizador de Rutas de Gira con IA)
Las bandas independientes pierden miles de euros en furgoneta y combustible recorriendo trayectos ineficientes con días muertos entre ciudades.
* **Concepto Revolucionario**: Adaptamos el *Yield Management* de las aerolíneas al ecosistema de las giras de rock.
* **Detección de Fechas Huérfanas**: Si la banda tiene cerrado un concierto en Madrid el jueves y en Valencia el sábado, el Agente de Gira detecta el hueco del viernes y calcula el desvío kilométrico óptimo (ej. Cuenca o Albacete: solo 35 min de desvío y 28 € de gasoil).
* **Oferta de Caché Dinámica**: El Agente Scout localiza salas con fecha libre ese viernes en la ciudad intermedia y propone un caché adaptativo: *"Para este viernes aceptamos 450 € en vez de los 900 € habituales porque nos cubre el hotel y el desplazamiento"*. La sala gana una banda de primer nivel a precio accesible y la banda monetiza un día muerto en ruta.

### 10.4 Tech Rider Dinámico y Auto-Adaptativo ("Self-Healing Rider")
El conflicto número uno entre bandas y salas son las incompatibilidades de equipo en la prueba de sonido (micrófonos que faltan, mesas de mezclas distintas, envíos auxiliares insuficientes).
* **Visión Artificial + LLM**: La banda sube su Rider Técnico y la sala sube el inventario de su cabina (en PDF o foto del listado de equipamiento).
* **Auto-Resolución de Escena**: La IA detecta equivalencias técnicas automáticamente:
  * *«La sala dispone de una Behringer X32 en lugar de la Midas M32 solicitada: escena de ruteo 100% compatible generada para cargar por USB.»*
  * *«Sustitución recomendada: el micro Shure Beta 91A de bombo se reemplaza por el Audix D6 disponible en la sala sin alterar la ecualización base.»*
* La banda y el técnico llegan a la prueba de sonido con las discrepancias resueltas de antemano, eliminando el 90% de los retrasos en las pruebas.

### 10.5 Director de Concierto en Vivo & Engine de Energía Dinámica
Durante el concierto en vivo, los imprevistos de horario son habituales (toques de queda municipales por ruido a las 23:00h o retrasos acumulados).
* **Ajuste en Tiempo Real**: Conectado con el motor de análisis tonal y compatibilidad (`transitionAudioEngine.ts` y `setlistCompatibility.ts`), el atril digital o reloj inteligente del músico permite un ajuste de emergencia con 1 toque:
  * *«Aviso: Quedan 18 minutos de concierto. Opción Salto Óptimo: Omitir 'Tema 8' y pasar directo a 'Tema 9' (misma tonalidad La menor y tempo compatible de 124 BPM para no romper la energía del público).»*
* El show termina exactamente a la hora fijada por la normativa, evitando multas para la sala y cortes abruptos de sonido.

### 10.6 Smart Settlement Post-Show: "BandSplit / TourCount" (El Splitwise/Tricount Integrado para Bandas)
El momento más tenso y conflictivo de cualquier gira o bolo es el camerino a las 3:00 AM: billetes arrugados, cansancio acumulado, gastos que unos han puesto de su bolsillo durante el viaje y las dudas de: *«¿quién pagó la furgoneta?», «¿cuánto le debemos a Carlos por la gasolina y los peajes?», «¿cuánto cobra el saxofonista sustituto?» y «¿cuánto metemos al bote del local?»*.

BandManager.io integra de forma nativa el primer **Splitwise / Tricount especializado para la carretera y el directo musical**:

1. **Captura Rápida de Gastos de Gira (En Furgoneta o en 5 Segundos con IA)**:
   * Durante el viaje, cualquier miembro de la banda registra gastos en vivo:
     * *Gasolina, peajes de autopista, furgoneta de alquiler, bebidas en ruta, juegos de cuerdas o baquetas de urgencia.*
     * **Entrada Rápida con OCR de IA**: Subida de foto del ticket de la gasolinera; la IA (Gemini Flash) extrae automáticamente el importe, la fecha y el concepto en 1 segundo.
2. **Algoritmo de Liquidación de Deudas Mínimas (Debt Minimization Graph Algorithm)**:
   * A diferencia de un Splitwise genérico que solo calcula transferencias cruzadas entre personas, **BandSplit cruza los gastos con el DINERO ENTRANTE del concierto** (ya sea el sobre de efectivo de la sala o el pago por pasarela):
     * **Paso 1 (Reembolso de Gastos de Bolsillo)**: Quien adelantó la furgoneta o el gasoil recupera su dinero directamente del sobre antes de repartir nada.
     * **Paso 2 (Liquidación Prioritaria de Músicos de Sesión)**: El músico de sesión o sustituto recibe su caché pactado sin entrar en el reparto interno.
     * **Paso 3 (Retención de Caja Común de la Banda)**: Se descuenta el % fijado para el bote del grupo (ej. 20% para local de ensayo, cuerdas o grabaciones).
     * **Paso 4 (Reparto Neto Limpio)**: El remanente restante se divide matemáticamente entre los miembros oficiales según sus porcentajes acordados.
3. **El Resultado a las 3:00 AM (Cero Matemáticas de Madrugada)**:
   * La app muestra en la pantalla del mánager el reparto exacto de los billetes:  
     `💵 DEL SOBRE DE 800 € EN EFECTIVO:`  
     `• Entregar 120 € a David (reembolso gasolina y peajes adelantados).`  
     `• Entregar 150 € a Laura (caché saxofonista sesión).`  
     `• Guardar 106 € en la caja común del grupo (20% del beneficio neto).`  
     `• Entregar 106 € limpios en mano a cada uno de los 4 miembros oficiales.`
   * **Nadie tiene que hacerse transferencias ni Bizums al día siguiente**: el sobre físico de la sala queda liquidado al céntimo en 15 segundos sobre la mesa del camerino.
4. **Liquidación por Bizum / QR si falta efectivo**:
   * Si el bolo fue a taquilla floja o los gastos superaron la recaudación, la app genera botones de **1-Click Deep Link a Bizum** para saldar las diferencias entre miembros sin cuentas complejas.
5. **Justificante PDF Inmutable y Vuelco Contable en Finanzas**:
   * Cada miembro recibe en su móvil el extracto oficial en PDF del bolo (*"Cierre de Liquidación - Los Chicos del Barrio @ Sala El Sol"*).
   * Los datos se consolidan automáticamente en el módulo de **Finanzas** de la banda (`/src/components/Finanzas.tsx` y `server/routes/finances.ts`), manteniendo la contabilidad del grupo al día sin hojas de cálculo de Excel.
6. **Conexión con Gastos de Local de Ensayo y Equipamiento (`splitband.md`)**:
   * Más allá del viaje del concierto, BandSplit permite compensar gastos cotidianos de la banda (ej. Dani adelantó 300 € para una pantalla del local o Javi compró cuerdas):
     * *Vía A*: Reembolso 1-Click desde la Caja Común si hay fondos.
     * *Vía B*: Amortización opcional con el sobre de este concierto antes del reparto limpio.
     * *Vía C*: Escote directo por Bizum si no hay conciertos próximos.
     * *Vía D*: Registro del inventario de **Activos de Banda** con porcentaje de propiedad por músico.

---

## 🗄️ 11. Esquema SQL Idempotente Completo (Supabase / PostgreSQL)

Para asegurar una implementación limpia y sin olvidos, este es el esquema DDL idempotente listo para ejecutarse en Supabase (`supabase/migrations/` o `supabase_schema.sql`):

```sql
-- ============================================================================
-- 1. TABLA DE HISTORIAL INMUTABLE DE ESTADOS DE LEADS (AUDITORÍA CRM)
-- ============================================================================
create table if not exists public.lead_status_history (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references public.leads(id) on delete cascade not null,
  band_id uuid references public.bands(id) on delete cascade not null,
  estado_anterior text,
  estado_nuevo text not null,
  cambiado_por uuid references auth.users(id) on delete set null,
  fecha_transicion timestamp with time zone default now() not null,
  metadata jsonb default '{}'::jsonb
);

create index if not exists idx_lead_status_history_lead_id on public.lead_status_history(lead_id);
create index if not exists idx_lead_status_history_band_id on public.lead_status_history(band_id);
create index if not exists idx_lead_status_history_estado_nuevo on public.lead_status_history(estado_nuevo);

-- Trigger automático para registrar cada cambio de estado en leads
create or replace function public.fn_log_lead_status_change()
returns trigger as $$
begin
  if (old.estado is distinct from new.estado) then
    insert into public.lead_status_history (
      lead_id,
      band_id,
      estado_anterior,
      estado_nuevo,
      cambiado_por,
      fecha_transicion
    ) values (
      new.id,
      new.band_id,
      old.estado,
      new.estado,
      auth.uid(),
      now()
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists trg_log_lead_status_change on public.leads;
create trigger trg_log_lead_status_change
after update on public.leads
for each row execute function public.fn_log_lead_status_change();


-- ============================================================================
-- 2. TABLA PRINCIPAL DE HOJAS DE ACUERDO DE BOLOS (CONCERT DEALS)
-- ============================================================================
create table if not exists public.concert_deals (
  id uuid primary key default gen_random_uuid(),
  band_id uuid references public.bands(id) on delete cascade not null,
  lead_id uuid references public.leads(id) on delete set null,
  concert_id uuid references public.concerts(id) on delete set null,
  
  -- Token de acceso público seguro (sin login)
  token text unique not null,
  
  -- Datos y Horarios del Bolo
  nombre_evento text not null,
  lugar_sala text not null,
  ciudad text,
  fecha_evento date not null,
  hora_carga text default '18:00',
  hora_prueba text default '18:30',
  tipo_prueba text check (tipo_prueba in ('completa_45m', 'line_check_10m', 'sin_prueba')) default 'completa_45m',
  hora_apertura text default '21:00',
  hora_concierto text default '21:30',
  duracion_minutos integer default 90,
  
  -- Validación Técnica de Rider (Paso previo obligatorio)
  rider_url text,
  rider_resumen text,
  rider_validado_por_sala boolean default false,
  nota_tecnica_sala text,
  fecha_validacion_rider timestamp with time zone,
  
  -- Hospitalidad
  cenas_tipo text check (cenas_tipo in ('en_sala', 'ticket_barra', 'dieta_efectivo', 'no_incluye')) default 'en_sala',
  cenas_pax integer default 5,
  alojamiento_incluido boolean default false,
  alojamiento_detalle text,
  camerino_bebidas boolean default true,
  
  -- Condiciones Económicas y Suplementos
  tipo_remuneracion text check (tipo_remuneracion in ('cache_fijo', 'taquilla', 'porcentaje_barra', 'hibrido')) default 'cache_fijo',
  cache_base numeric(10,2) default 0.00,
  total_suplementos numeric(10,2) default 0.00,
  total_acordado numeric(10,2) generated always as (cache_base + total_suplementos) stored,
  porcentaje_taquilla numeric(5,2) default 0.00,
  minimo_garantizado numeric(10,2) default 0.00,
  merch_cut_porcentaje numeric(5,2) default 0.00,
  
  -- Modalidad de Pago y Liquidación
  forma_pago text check (forma_pago in ('stripe_bizum', 'efectivo', 'pago_diferido_ayto')) default 'stripe_bizum',
  porcentaje_senal numeric(5,2) default 30.00,
  monto_senal numeric(10,2) default 0.00,
  senal_pagada boolean default false,
  fecha_pago_senal timestamp with time zone,
  stripe_payment_intent_id text,
  
  -- Destino del Dinero en la Banda
  destino_fondos text check (destino_fondos in ('caja_banda', 'reparto_musicos', 'hibrido')) default 'caja_banda',
  porcentaje_caja_comun numeric(5,2) default 100.00,
  
  -- Liquidación de Comisión y Cashback en Créditos IA
  tasa_comision_porcentaje numeric(5,2) default 5.00,
  monto_comision_app numeric(10,2) default 0.00,
  comision_liquidada boolean default false,
  creditos_ia_cashback_entregados integer default 0,
  
  -- Firma eIDAS e Inmutabilidad Criptográfica
  estado text check (estado in ('borrador', 'enviado_a_sala', 'confirmado', 'cancelado')) default 'borrador',
  nombre_firmante text,
  cargo_firmante text,
  firma_imagen_url text,
  firma_ip inet,
  firma_user_agent text,
  firma_timestamp timestamp with time zone,
  contrato_sha256 text, -- Hash criptográfico inmutable del contenido acordado
  
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create index if not exists idx_concert_deals_band_id on public.concert_deals(band_id);
create index if not exists idx_concert_deals_lead_id on public.concert_deals(lead_id);
create index if not exists idx_concert_deals_token on public.concert_deals(token);
create index if not exists idx_concert_deals_fecha_evento on public.concert_deals(fecha_evento);


-- ============================================================================
-- 3. PLANTILLA DE SUPLEMENTOS Y PRODUCCIÓN DE LA BANDA (CASO RUTA66)
-- ============================================================================
create table if not exists public.band_production_extras (
  id uuid primary key default gen_random_uuid(),
  band_id uuid references public.bands(id) on delete cascade not null,
  nombre text not null, -- Ej: 'Alquiler y Montaje P.A. Propia', 'Puente Luces', 'Técnico de Sonido'
  descripcion text,
  precio_defecto numeric(10,2) default 0.00,
  activo boolean default true,
  orden integer default 0,
  created_at timestamp with time zone default now() not null
);

create index if not exists idx_band_production_extras_band_id on public.band_production_extras(band_id);

-- Suplementos seleccionados para un deal concreto
create table if not exists public.deal_selected_extras (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.concert_deals(id) on delete cascade not null,
  extra_id uuid references public.band_production_extras(id) on delete set null,
  nombre_extra text not null,
  precio numeric(10,2) not null,
  created_at timestamp with time zone default now() not null
);

create index if not exists idx_deal_selected_extras_deal on public.deal_selected_extras(deal_id);


-- ============================================================================
-- 4. MÚSICOS SUSTITUTOS / SESIONISTAS ("SUBS")
-- ============================================================================
create table if not exists public.deal_session_subs (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.concert_deals(id) on delete cascade not null,
  band_id uuid references public.bands(id) on delete cascade not null,
  nombre_musico text not null,
  instrumento text not null,
  email text,
  telefono text,
  cache_pactado numeric(10,2) not null default 0.00,
  pagado boolean default false,
  token_acceso_setlist text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamp with time zone default now() not null
);

create index if not exists idx_deal_session_subs_deal on public.deal_session_subs(deal_id);


-- ============================================================================
-- 5. LISTA DE PUERTA / INVITADOS DE BANDA (DOOR LIST)
-- ============================================================================
create table if not exists public.deal_door_guests (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid references public.concert_deals(id) on delete cascade not null,
  band_id uuid references public.bands(id) on delete cascade not null,
  nombre_invitado text not null,
  invitado_por_musico text,
  acceso_concedido boolean default false,
  hora_acceso timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create index if not exists idx_deal_door_guests_deal on public.deal_door_guests(deal_id);
```

---

## 🛠️ 12. Arneses de Seguridad, Hooks, Skills y MCPs para una Ejecución Impecable

Para ejecutar esta arquitectura con calidad de nivel producción y cero regresiones, se definen los siguientes componentes de soporte técnico:

### 12.1 Arneses de Pruebas Unitarias y de Integración (Vitest Harnesses)

Deben crearse tres suites de tests en `server/utils/__tests__/` y `server/routes/__tests__/`:

1. **`dealTrustBoundary.test.ts` (Arnés de Aislamiento Multi-Tenant)**:
   * Verifica que ninguna llamada a `/api/deals/*` pueda consultar o mutar un acuerdo perteneciente a otra banda, auditando que siempre resuelva vía `getTargetBandId(req)`.
   * Verifica que la vista pública `/api/public/deals/:token` filtre estrictamente los datos privados (DNI, IBAN, balances internos) respetando el principio de minimización RGPD.
2. **`eidasAuditTrail.test.ts` (Arnés de Inmutabilidad eIDAS)**:
   * Comprueba que la función `generarContratoSha256(deal)` produzca un hash determinista.
   * Verifica que si se intenta alterar el caché o los horarios tras la firma, el hash cambie e invalide la integridad de la firma.
3. **`leadAttributionNudge.test.ts` (Arnés de Detección de Atribución)**:
   * Simula un lead histórico que pasó por el estado `negociando` y posteriormente fue cambiado a `descartado`.
   * Comprueba que el detector de coincidencia de fecha/sala devuelva `match: true` y active el template de *Bolo Recuperado* en lugar de pasar desapercibido.

### 11.2 Hooks de Desarrollo y Pre-commit

* **Pre-commit Hook (`.husky/pre-commit` o Git Hook)**:
  * `npm run typecheck` (`tsc --noEmit`): Garantiza 0 errores nuevos de TypeScript.
  * `npx vitest run server/routes/__tests__/deals.test.ts`: Valida que los cálculos de comisiones, suplementos y cashback de créditos no fallen.
* **Claude Code Hook (`.claude/hooks/security-review-reminder.js`)**:
  * Extiende la lista de archivos sensibles monitorizados para incluir:
    * `server/routes/deals.ts`
    * `server/routes/publicDeals.ts`
    * `server/utils/eidasSignature.ts`

### 11.3 MCPs y Herramientas Recomendadas

1. **PostgreSQL / Supabase MCP Inspector**:
   * Permite inspeccionar en caliente las tablas recién creadas, verificar la correcta ejecución de los triggers de `lead_status_history` y constatar la indexación de los tokens únicos.
2. **Skill `/security-review`**:
   * Ejecutar la skill de revisión de seguridad antes de mergear la capa de endpoints públicos (`/api/public/deals/:token`) para certificar que no existe vector de SSRF, SQL Injection ni bypass de trust boundary.
3. **Skill `applet-seo` (Configuración de Meta Tags OpenGraph)**:
   * Para la vista pública `/deal/view/:token`, genera las tarjetas OpenGraph dinámicas para que al compartir el enlace por WhatsApp con la sala o promotor aparezca una previsualización elegante:  
     *Título*: *"Confirmación de Actuación: Los Chicos del Barrio @ Sala El Sol"*  
     *Descripción*: *"Revisa los horarios, el Rider Técnico y confirma la fecha en 1-Click."*
     *Imagen*: Foto oficial del grupo o logo del recinto.

---

## 🟢 13. Conclusión del Marco Maestro

Este plan combina la **máxima sencillez de uso en el mundo real** con un **blindaje legal, fiscal y de seguridad de nivel profesional**:
* **Para las Salas y Promotores**: Cero registros, cero barreras, respuesta en 10 segundos desde el móvil.
* **Para las Bandas**: Control total de su agenda, finanzas transparentes, incentivos con Créditos IA y cero burocracia.
* **Para la Plataforma**: Modelo de negocio sostenible, monetización en dinero real y fidelización imbatible.

