# 🎸 BandSplit / TourCount: El Splitwise & Tricount Especializado para Bandas, Local de Ensayo y Gira

> **Módulo:** Finanzas de Directo, Liquidación de Conciertos y Gastos Cotidianos de Banda (BandManager.io)  
> **Ámbito:** Reparto inteligente de gastos de carretera, liquidación del sobre en efectivo, gastos de local/rutina (pantallas, cuerdas, alquiler), inventario de activos, OCR con IA y algoritmo de minimización de deuda.  
> **Estado:** Documento de Especificación y Diseño Funcional  
> **Precedencia:** `AGENTS.md` manda sobre este documento en todo lo que se solape.

---

## 🏛️ 1. Los Dos Escenarios Reales: El Camerino a las 3 AM vs. La Vida Cotidiana de Local

La economía de una banda no ocurre solo en la furgoneta ni termina en el camerino; tiene dos dimensiones complementarias:

1. **Dimensión A: El Concierto / Gira (Event-Bound)**:
   * Gastos inmediatos del viaje: gasolina, furgoneta de alquiler, peajes, hotel, comidas en ruta.
   * La sala entrega un sobre con 800 € en efectivo o liquida taquilla en el camerino a las 3:00 AM.
2. **Dimensión B: El Día a Día, Ensayos y Equipamiento (Routine & Asset-Bound)**:
   * *«Dani ha comprado una pantalla 4x12 de segunda mano para el local por 300 €.»*
   * *«Javi ha comprado 4 juegos de cuerdas de repuesto y 3 cables jack por 45 €.»*
   * *«El alquiler mensual del local de ensayo (250 €) que adelantó el cantante este mes.»*
   * *«El pedido de 100 camisetas de merchandising para vender este verano (500 €).»*

**BandSplit unifica ambos mundos en un único cerebro financiero**: sabe cuándo un gasto debe liquidarse en mano con el sobre del próximo concierto, cuándo se reembolsa desde el bote común del grupo y cuándo se reparte a escote entre los músicos.

---

## 🔄 2. Arquitectura de Liquidación: Los 4 Caminos de Compensación

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧭 LOS 4 CAMINOS PARA SALDAR UN GASTO DE BANDA (DÍA A DÍA O DIRECTO)                   │
├────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                        │
│  [ Dani compra pantalla para local (300 €) o Javi compra cuerdas (45 €) ]              │
│                                    │                                                   │
│                                    ▼                                                   │
│          ┌───────────────────────────────────────────────────┐                         │
│          │ ¿CÓMO DESEA LA BANDA COMPENSAR ESTE GASTO?        │                         │
│          └───────────────────────────────────────────────────┘                         │
│            │                  │                  │                 │                   │
│            ▼                  ▼                  ▼                 ▼                   │
│      [ VÍA 1: BOTE ]   [ VÍA 2: BOLO ]    [ VÍA 3: BIZUM ]  [ VÍA 4: ACTIVO ]          │
│      Reembolso 1-Click Compensar con el   Escote directo    Propiedad compartida       │
│      desde la Caja     sobre del próximo  entre miembros    registrada en el           │
│      Común de la app   concierto a las    con links rápidos inventario de la           │
│      si hay saldo      3:00 AM en el      a Bizum           banda                      │
│      disponible        camerino                                                        │
│                                                                                        │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### Vía 1: Reembolso Inmediato contra la Caja Común (Bote de Banda)
* Si la banda tiene fondos acumulados en el módulo de Finanzas (`Finanzas.caja_banda` proveniente del porcentaje retenido de conciertos anteriores o venta de merch):
* El gasto se aprueba con 1-Click y el sistema descuenta el importe de la caja del grupo, marcando el reembolso a Dani como completado. Cero deudas personales.

### Vía 2: Compensación en el Próximo Concierto ("Deuda Flotante de Banda")
* Si la caja común está a cero o el grupo prefiere no tocar el bote:
* El gasto queda en estado **`pendiente_proximo_bolo`**.
* Cuando llega el siguiente concierto y el mánager pulsa *"Finalizar Concierto"* sobre el sobre de 800 € en el camerino:
  * El algoritmo avisa:  
    `💡 RECORDATORIO DE GASTO DE BANDA: Dani adelantó 300 € para la pantalla del local el 12 de marzo. ¿Deseáis saldarlo con este concierto antes de repartir el remanente limpio?`
  * Si la banda pulsa `[ Sí, saldar ahora ]`: Dani recupera sus 300 € en mano directamente del sobre de la sala y el resto del caché se reparte limpio entre los músicos.

### Vía 3: Escote Directo entre Miembros (Direct Split sin Concierto)
* Para gastos periódicos que no deben esperar a un bolo (ej. el alquiler del local de ensayo de 250 € este mes):
* La app divide los 250 € entre los 4 miembros oficiales (62,50 € por músico).
* Genera botones de **1-Click Deep Link a Bizum**:
  * Marcos y Sergio pulsan el botón en su móvil y envían 62,50 € a Dani al instante sin pedir números de cuenta.

### Vía 4: Compra de Equipamiento ("Activos de Banda" con Reparto de Propiedad)
* Cuando la banda compra algo duradero (una pantalla de bajo, una mesa de mezclas o un juego de micros para el local), surge la duda eterna: *«Si dentro de un año el batería se va del grupo, ¿de quién es la pantalla?»*.
* BandSplit cataloga el gasto como **`activo_banda`**:
  * Registra el porcentaje de propiedad de cada músico según lo que haya aportado (ej. 25% cada uno o 50% Dani y 50% la caja de la banda).
  * Si un miembro deja la banda, la app calcula la **tasa de amortización y el precio de recompra justo** para que el grupo le liquide su parte sin disputas.

---

## 🚐 3. Flujo Operativo en Conciertos y Gira (El Modo Camerino)

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🔄 CICLO DE VIDA DE BANDSPLIT EN GIRA (DE LA FURGONETA AL CAMERINO)                    │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  1. EN RUTA: Registro con Voice-to-Expense / OCR de IA (Gemini Flash)                  │
│     • Audio rápido: "75 pavos de gasoil y 6 de un bocata mío".                         │
│     • Foto de ticket con desglose de IVA (10% comida / 21% gasolina) y exclusión alcohol│
├────────────────────────────────────────────────────────────────────────────────────────┤
│  2. EN EL CAMERINO: Entrada del Dinero del Bolo                                       │
│     • El mánager introduce la recaudación: 800 € en efectivo (o taquilla).            │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  3. EL MOTOR DE LIQUIDACIÓN DE CUATRO PASOS (DEBT MINIMIZATION ENGINE):                │
│     • PASO 1 (Reembolso de Gastos de Bolsillo del Viaje + Deuda Flotante de Local):   │
│       - Se devuelve a David la gasolina del fin de semana (120 €).                     │
│       - Se amortiza la pantalla de Dani del local si se configuró para este bolo.      │
│     • PASO 2 (Caché Fijo de Músicos de Sesión / Técnicos): Liquidación prioritaria.   │
│     • PASO 3 (Retención de Bote Común): Deducción del % para la caja del grupo.       │
│     • PASO 4 (Reparto Neto Limpio): División exacta entre los miembros oficiales.      │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  4. RESULTADO: SOBRE FÍSICO LIQUIDADO AL CÉNTIMO EN 15 SEGUNDOS                        │
│     • Cero cálculos mentales de madrugada. Cero deudas al día siguiente.              │
│     • Extracto individual PDF firmado eIDAS + consolidación en Finanzas de la app.    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🧮 3. El Algoritmo de Liquidación de Cuatro Pasos (Ejemplo Real)

Imaginemos un bolo real de **Los Chicos del Barrio** (4 miembros oficiales: Voz, Guitarra, Bajo, Batería + 1 saxofonista contratada para el bolo):

### Gastos registrados durante el fin de semana:
* David (Guitarrista) pagó **80 €** de gasolina y **40 €** de peajes con su tarjeta. Total: **120 €**.
* La banda pactó con Laura (Saxofonista de sesión) un caché fijo de **150 €**.
* La banda tiene configurado destinar el **20% del beneficio neto** a la caja común del grupo.

### La sala entrega el sobre con 800 € en efectivo al terminar el show:
La pantalla de BandSplit le indica al mánager:
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 💵 REPARTO INMEDIATO DEL SOBRE DE 800,00 €                                             │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  1. REEMBOLSOS ADELANTADOS:                                                            │
│     • Entregar a David: 120,00 €  (Gasolina 80 € + Peajes 40 €)                        │
│     ➔ Saldo restante del sobre: 680,00 €                                               │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  2. MÚSICOS DE SESIÓN / TÉCNICOS EXTERNOS:                                            │
│     • Entregar a Laura: 150,00 €  (Caché pactado de saxofón)                           │
│     ➔ Saldo restante del sobre: 530,00 € (Beneficio Neto del Concierto)                │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  3. CAJA COMÚN DE LA BANDA (20% del Beneficio Neto):                                   │
│     • Guardar en el Bote de la Banda: 106,00 €  (Para local, producción, grabaciones) │
│     ➔ Saldo restante a repartir: 424,00 €                                              │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  4. REPARTO LIMPIO ENTRE MIEMBROS OFICIALES (4 miembros = 25% c/u):                   │
│     • Entregar a Carlos (Voz):       106,00 € limpios en mano                          │
│     • Entregar a David (Guitarra):   106,00 € limpios en mano                          │
│     • Entregar a Marcos (Bajo):      106,00 € limpios en mano                          │
│     • Entregar a Sergio (Batería):   106,00 € limpios en mano                          │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  ✨ RESULTADO: SOBRE LIQUIDADO AL CÉNTIMO EN 15 SEGUNDOS. CERO DEUDAS PENDIENTES.      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 📱 4. El Salto Cuántico sobre Splitwise: El "CFO de Gira" con IA Nativa

Splitwise es una simple calculadora de sumas y restas creada para compañeros de piso que se reparten el papel higiénico. **BandSplit es un Director Financiero de Gira con IA (AI Tour CFO)** diseñado para el barro y la adrenalina de los músicos:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ 🧠 ¿POR QUÉ BANDSPLIT DEJA OBSOLETO A SPLITWISE?                                       │
├────────────────────────────────────────────────────────────────────────────────────────┤
│  SPLITWISE TRADICIONAL               │  BANDSPLIT DE BANDMANAGER.IO (CON IA)           │
├──────────────────────────────────────┼─────────────────────────────────────────────────┤
│ • Escribir manualmente cada número   │ • Registro por voz en ruta con Speech AI        │
│ • Desconoce qué es un concierto      │ • Cruce automático con el sobre físico del bolo │
│ • No lee tickets ni facturas         │ • OCR inteligente con extracción de IVA y tasas │
│ • Provoca discusiones por gastos     │ • Árbitro Imparcial con "Pacto de Banda"        │
│ • Obliga a 10 transferencias al día  │ • Liquidación instantánea en mano en 15s        │
│ • No tiene validez legal ni fiscal   │ • Generación de extracto PDF y recibos oficiales│
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 4.1 "Voice-to-Expense": Registro por Voz en Ruta (Speech AI Multimodal)
En plena carretera nadie abre una aplicación para teclear números mientras conduce la furgoneta.
* **Cómo funciona**: El copiloto o el conductor envía un mensaje de voz al bot de BandManager o pulsa el micrófono en la app:
  > *«Oye, acabamos de echar 75 pavos de gasoil en la Repsol de Aranda y me he pillado un bocata de 6 euros que ese es solo mío.»*
* **Magia de la IA (Gemini 2.5 Flash Audio)**:
  1. Transcribe el audio y entiende la semántica financiera.
  2. Registra **75,00 €** en la categoría `gasolina`, pagado por quien habla y dividido equitativamente entre los miembros de la banda.
  3. Reconoce que los **6,00 €** del bocadillo son un gasto personal no compartido y los excluye automáticamente del reparto.
  4. Envía una confirmación al grupo: *«Anotados 75 € de gasoil para la banda. Los 6 € de tu bocata quedan en tu cuenta personal. Saldo actualizado.»*

### 4.2 "Ticket & Tax Vision": Extracción Fiscal y Clasificación de IVA
Al hacer una foto a la factura de un restaurante o gasolinera:
* La IA no solo lee el total; analiza el desglose tributario:
  * Detecta bases imponibles e impuestos (**IVA del 10% en restauración y 21% en transporte/combustible**).
  * Separa gastos deducibles de los no deducibles (ej. excluye botellas de alcohol para evitar problemas en caso de inspección fiscal de la empresa o asociación cultural del grupo).
  * Si el ticket es una factura simplificada sin NIF, la IA genera con 1-Click una **solicitud formal de factura completa** pre-rellenada con los datos fiscales de la banda para enviarla al proveedor.

### 4.3 El "Árbitro Imparcial de Gastos" (AI Dispute Arbitrator)
El clásico motivo de discusión: *«¿Por qué tenemos que pagar entre todos las 5 cervezas que se tomó el bajista o las baquetas que rompió el batería?»*.
* **El Pacto de Gira**: Cada banda define una vez sus reglas básicas (ej. *«El transporte y alojamiento son comunes; las comidas tienen un tope de 20 €/persona/día; los consumibles individuales de instrumento los paga cada músico»*).
* **Intervención Imparcial de la IA**: Cuando alguien sube un gasto dudoso, el Agente Financiero aplica las reglas objetivamente:
  * *«Según vuestro Pacto de Banda, los juegos de cuerdas son gasto personal de David (12 €), pero los 45 € de la cena están dentro del límite común acordado. He desglosado el apunte en automático para mantener las cuentas en paz.»*
  * Cero broncas personales entre amigos.

### 4.4 Cálculo Automático de Kilometraje Inteligente (Ruta GPS)
Si un miembro de la banda pone su coche particular para transportar instrumentos o llegar antes a la sala:
* La app cruza la dirección del local de ensayo con la dirección de la sala del concierto usando la ruta oficial.
* Aplica el baremo legal oficial de kilometraje (ej. **0,26 € / km** en España):
  * *«Trayecto Madrid ➔ Valladolid (195 km x 2 = 390 km): 101,40 € calculados automáticamente para reembolsar a Marcos por desgaste de su vehículo.»*

### 4.5 "Tour CFO": Predicción Financiera del Viaje en Tiempo Real
Durante la furgoneta, el Agente Financiero monitoriza la rentabilidad del fin de semana en tiempo real:
* *«Lleváis acumulados 310 € de gastos en peajes, furgoneta y dietas. Con el caché cerrado de 600 € en Salamanca y las 45 entradas anticipadas vendidas en Zamora, la previsión de beneficio neto del fin de semana es de 720 € limpios (180 € por músico tras retención de caja común).»*
* Si una fecha va floja, avisa a tiempo: *«Alerta: Si en Zamora no se venden al menos 20 entradas en taquilla, el bolo de mañana saldrá con un balance negativo de -45 €. Sugerencia: publicad un Reel de última hora con los pases de estudio de la app.»*

### 4.6 Generador de Liquidaciones y Retenciones IRPF para Músicos Sustitutos
Cuando tocan con un músico de sesión o sustituto autónomo:
* La app calcula su retención de IRPF (-15%) e IVA (+21%) o genera el recibo de liquidación mercantil firmado digitalmente para que el músico invitado reciba su dinero al terminar y ambas partes tengan el justificante legal en PDF.

---

## 🗄️ 5. Esquema de Datos en PostgreSQL / Supabase

```sql
-- Gastos de banda (tanto de gira como de local de ensayo y equipamiento)
CREATE TABLE IF NOT EXISTS tour_expenses (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    deal_id TEXT REFERENCES concert_deals(id) ON DELETE SET NULL,
    concert_id TEXT REFERENCES concerts(id) ON DELETE SET NULL,
    pagado_por TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concepto TEXT NOT NULL,
    tipo_ambito TEXT NOT NULL DEFAULT 'gira_concierto' CHECK (tipo_ambito IN ('gira_concierto', 'rutina_local', 'activo_equipamiento')),
    categoria TEXT NOT NULL CHECK (categoria IN (
        'gasolina', 'peajes', 'furgoneta', 'alojamiento', 'dietas', 
        'material_urgente', 'alquiler_local', 'pantallas_amplis', 
        'cuerdas_cables', 'merch_produccion', 'otros'
    )),
    importe NUMERIC(10,2) NOT NULL CHECK (importe > 0),
    modalidad_compensacion TEXT NOT NULL DEFAULT 'sobre_concierto' CHECK (modalidad_compensacion IN ('sobre_concierto', 'caja_comun', 'escote_bizum', 'inversion_activo')),
    ticket_imagen_url TEXT,
    reembolsado BOOLEAN NOT NULL DEFAULT FALSE,
    reembolsado_en TIMESTAMPTZ,
    reembolsado_via TEXT CHECK (reembolsado_via IN ('sobre_efectivo', 'caja_banda', 'bizum_directo', 'retencion_taquilla')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tour_expenses_band ON tour_expenses(band_id);
CREATE INDEX IF NOT EXISTS idx_tour_expenses_deal ON tour_expenses(deal_id);
CREATE INDEX IF NOT EXISTS idx_tour_expenses_ambito ON tour_expenses(tipo_ambito, reembolsado);

-- Inventario de Activos y Equipamiento Compartido del Local
CREATE TABLE IF NOT EXISTS band_shared_assets (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    expense_id TEXT REFERENCES tour_expenses(id) ON DELETE SET NULL,
    nombre_activo TEXT NOT NULL, -- ej: "Pantalla Marshall 4x12 JCM900"
    valor_compra NUMERIC(10,2) NOT NULL,
    fecha_adquisicion DATE NOT NULL DEFAULT CURRENT_DATE,
    reparto_propiedad JSONB NOT NULL DEFAULT '[]'::jsonb, -- ej: [{"user_id": "u1", "pct": 50}, {"user_id": "caja_comun", "pct": 50}]
    ubicacion TEXT DEFAULT 'Local de Ensayo',
    estado_conservacion TEXT DEFAULT 'bueno',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_band_shared_assets_band ON band_shared_assets(band_id);

-- Cierres de liquidación de concierto
CREATE TABLE IF NOT EXISTS deal_settlements (
    id TEXT PRIMARY KEY,
    band_id TEXT NOT NULL REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    deal_id TEXT NOT NULL UNIQUE REFERENCES concert_deals(id) ON DELETE CASCADE,
    recaudacion_total NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_gastos_viaje_reembolsados NUMERIC(10,2) NOT NULL DEFAULT 0,
    total_deuda_local_compensada NUMERIC(10,2) NOT NULL DEFAULT 0, -- ej: amortización pantalla Dani
    total_subs_pagados NUMERIC(10,2) NOT NULL DEFAULT 0,
    importe_bote_comun NUMERIC(10,2) NOT NULL DEFAULT 0,
    remanente_repartido NUMERIC(10,2) NOT NULL DEFAULT 0,
    desglose_miembros JSONB NOT NULL DEFAULT '[]'::jsonb,
    pdf_resumen_url TEXT,
    liquidado_por TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deal_settlements_band ON deal_settlements(band_id);
```

---

## 🚀 6. Valor para el TFM y Diferenciación en el Mercado

1. **Empatía Extrema con el Usuario**: Demuestra ante el tribunal que el software ha sido diseñado conociendo al 100% la realidad física, psicológica y logística de los músicos en carretera.
2. **Cero Fricción en Convivencia**: Elimina el motivo principal de ruptura de bandas (el dinero y las cuentas poco claras tras los bolos).
3. **Efecto Red Inmediato**: Cuando un músico sustituto o técnico trabaja con una banda que usa BandSplit y ve cómo le pagan al segundo con recibo en PDF sin discutir, quiere que todas sus otras bandas usen BandManager.
