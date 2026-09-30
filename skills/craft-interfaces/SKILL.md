---
name: craft-interfaces
description: Detalle y movimiento de la interfaz de BandManager.io — escala tipográfica, zonas táctiles, foco, animación con criterio, radios concéntricos, cifras tabulares, iconos y método de revisión (critique → polish). Usar al escribir o revisar cualquier componente de UI, animación, transición, estado hover/active/focus o texto. Complementa a `visual-identity` (que decide QUÉ: color, módulo, temas, Ley 1) decidiendo CÓMO SE SIENTE. En conflicto, manda `visual-identity`.
---

# 🪡 Skill: Craft de interfaces

`visual-identity` decide **qué** se ve (paleta, módulo, temas, bordes). Esta skill decide **cómo se siente**: cuánto mide la letra, cuánto tarda un botón en responder, dónde cae el dedo. Los músicos pasan de 4 a 6 horas seguidas aquí dentro, en el escritorio y en el móvil, a menudo con prisa y con una mano.

> Destilada de cuatro fuentes y adaptada a nuestros tokens: **Emil Kowalski** (`emilkowalski/skills`, movimiento), **Jakub Krehel** (`make-interfaces-feel-better`, detalle), **Impeccable** (`pbakaus/impeccable`, método de revisión) y **Taste Skill** (`Leonxlnx/taste-skill`, diales). **No se instalan** las originales: su estética propia choca con Espectro. Aquí solo entra lo que encaja.

## 🎛️ Diales de BandManager (fijados; no se reabren por pantalla)

| Dial | Valor | Significa |
|---|---|---|
| Variación de diseño | **3** | Consistencia antes que sorpresa: la misma solución para el mismo problema. |
| Intensidad de movimiento | **3** | Sobrio. Un producto de 6 horas no puede bailar. |
| Densidad visual | **6** escritorio · **4** móvil | Herramienta de trabajo, no landing. En móvil, aire. |

## 🔤 1. Tipografía (el 90 % de la interfaz)

- **Una sola familia: Onest** (`--font-ui`). El selector de tipografías del perfil sigue existiendo, pero el valor por defecto es Onest.
- **Escala única (px): 11 · 12 · 14 · 16 · 20 · 28 · 40.**

  | Clase | Tamaño | Para |
  |---|---|---|
  | `text-micro` | 11 | Ejes, metadatos, insignias. **Mínimo absoluto.** |
  | `text-xs` | 12 | Etiquetas, chips, texto secundario denso. |
  | `text-sm` | 14 | **Cuerpo en escritorio.** |
  | `text-base` | 16 | Cuerpo en móvil, **todos los campos en móvil** (por debajo de 16 px iOS hace zoom al enfocar). |
  | `text-xl` / `text-2xl` | 20 / 28 | Títulos de sección / de pantalla. |

- **Título de pantalla: la clase `page-title`** (20 px móvil · 24 px escritorio, display 700). Un solo tamaño para todos los módulos; nada de `text-4xl` ni `text-base` en un h1.
- **Prohibido** `text-[7px]`…`text-[10px]` (el audit lo bloquea). Si algo no cabe a 11 px, se rediseña el contenedor, no se encoge la letra.
- **Pesos: 400 / 500 / 600 / 700.** `font-black` solo en cifras grandes (`text-2xl`+). Todo en negrita no destaca nada.
- `text-wrap: balance` en titulares y `pretty` en párrafos (ya en la base). Cifras en columna con `tabular-nums` (ya aplicado a `font-mono`, `time`, `table`).
- Caja de frase siempre. Cero mayúsculas decorativas, cero `tracking-wider`.

## 📐 2. Espacio y geometría

- **Rejilla de 4 px.** Separación mínima entre elementos interactivos: **8 px**.
- Relleno de tarjeta: 16 px en móvil, 20–24 en escritorio.
- **Radios concéntricos:** `radio_exterior = radio_interior + relleno`. Una tarjeta `--r-l` (24) con relleno 8 lleva dentro `--r-m` (16), no otro `--r-l`. Los radios de la escala (`--r-s/m/l/xl/pill`) son la única fuente.
- **Zona táctil ≥ 44 px** (40 mínimo). Si el icono mide 16, el botón mide 40+; en táctil la base ya amplía el área de cada `<button>` 8 px por lado con `::after` (opt-out: `data-no-hit`).
- **Alineación óptica:** un icono junto a texto se centra a ojo, no por caja. Iconos de flecha/play se desplazan 1 px hacia su punta. Comprobar en 3 tamaños.

## 🖱️ 3. Estados de respuesta

- **`:active` en todo control:** `active:scale-[0.97]`, 100–160 ms. Es lo que hace que el botón "responda". Nada de `scale-95/90` sueltos.
- **`:hover` = color o brillo, nunca movimiento** (`hover:brightness-95`, cambio de fondo). Los `hover:scale-*` están fuera. Tailwind ya gatea `hover:` a dispositivos con hover real.
- **Foco visible siempre** (`:focus-visible`, anillo `--ring`, 2 px, offset 2 px). Ya está en la base; no lo apagues con `outline-none` sin dar otro anillo.
- Estados deshabilitados: `opacity-40` + `cursor-not-allowed` + sin `:active`.
- **Todo control tiene 4 estados diseñados:** reposo, hover, activo, foco (más deshabilitado si aplica).

## 🎞️ 4. Movimiento (Emil)

**Antes de animar, pregunta por la frecuencia:**

| Frecuencia | Animación |
|---|---|
| Cientos de veces al día (atajos de teclado, cambiar de canción) | **Ninguna** |
| Decenas (hover, navegación, filas) | Mínima o ninguna |
| Ocasional (modal, hoja, toast, menú) | Sí, corta |
| Rara (onboarding, bolo confirmado) | Sí, con deleite (el Público) |

**Reglas duras**
- Solo `transform` y `opacity` (y color). **Nunca `transition-all`:** usa `transition-ui` (o `transition-[prop]`). Ya definido con curva y 150 ms por defecto.
- **Curvas** (tokens): `--ease-out` `cubic-bezier(.23,1,.32,1)` para entradas y salidas; `--ease-inout` para movimiento en pantalla; `--ease-sheet` para hojas inferiores. **Nunca `ease-in`.**
- **Duraciones** (tokens): press 120 ms · hover 150 · popover 180 · modal/hoja 260. **Toda animación de interfaz < 300 ms.** La salida es más rápida que la entrada.
- No se anima desde `scale(0)`: se entra desde `scale(0.95)` + `opacity: 0`.
- Popovers y menús se abren **desde su botón** (`transform-origin` = punto de anclaje). Los modales, desde el centro.
- Listas al cargar: *stagger* de 30–80 ms por elemento, sin bloquear la interacción.
- Las transiciones CSS son interrumpibles; los keyframes no. Para estados que cambian rápido (toasts, tabs), transición.
- `prefers-reduced-motion`: ya global (se quita el movimiento, se conserva el cambio de opacidad/color).
- Nada de blur de transición, halos ni brillos pulsantes. `animate-pulse` solo para carga real.

## 📱 5. Móvil de verdad (~390 px)

- **Modales < 640 px → hoja inferior** (entra con `--ease-sheet`, esquinas superiores `--r-xl`, asa de arrastre). La acción principal queda en la zona del pulgar, abajo. **Ya es automático** para todo modal que pase por `<ModalPortal>` (CSS global en `index.css › MODALES`); un modal nuevo debe usarlo, no reimplementar el overlay. La red `e2e/responsive.spec.ts` lo comprueba.
- Máximo 3 bloques antes del primer scroll (AGENTS.md §6). Acciones secundarias tras `⋯`.
- Campos a 16 px (regla global ya aplicada). Sin scroll horizontal del documento.
- Teclado y móvil comparten regla: todo lo que se hace con el dedo se puede hacer con teclado.

## 🧩 6. Iconos y voz

- **Iconos: solo Lucide**, trazo 1,75, tamaños 16 y 20, mismo peso en toda la fila. **Cero emojis en la interfaz** (botones, títulos, pestañas, insignias, cabeceras de modal). Los emojis son contenido del usuario o momento de celebración.
- Los objetos propios del producto (onda, público, sala, setlist) se dibujan a mano.
- Copy del circuito (caché, rider, backline, hoja de ruta, furgo), no de producto ("Todo en un solo lugar").
- Estados vacíos con el Público y una frase con voz propia.
- **Caja de frase, siempre.** "Guardar y activar", no "Guardar Y Activar" ni "Gestor Logístico & Giras". El Title Case es un calco del inglés; solo llevan mayúscula los nombres propios y las marcas (Instagram, Spotify, BAKANDEYA).
- **"y", no "&"**, salvo marcas ("Rock & Roll", "R&B"). `design-audit` lo marca como error.
- **Un solo nombre para cada cosa:** "IA", no "AI" (salvo nombres de producto: Gemini AI); "mánager" con tilde.
- **La chispa ✨ (`Sparkles`) significa una sola cosa: "aquí actúa la IA".** Va en botones de acción, no en titulares, etiquetas ni chips: una chispa decorativa es el delator más reconocible de interfaz generada.
- **Tipografía del texto:** `…` (no `...`), comillas “así” en el texto visible, y separadores con `·`.
- **Cada módulo abre con el mismo patrón:** `page-title` + una línea que dice para qué sirve, y las acciones a la derecha. Booking, Giras, Fans y el resto no inventan cabeceras propias.

## 🔍 7. Método de revisión (Impeccable, adaptado)

Para cada pantalla, en este orden y **una sola pasada acotada** (capturar → anotar → arreglar en lote → parar):

1. **Critique:** ¿qué delata plantilla o varias manos? (checklist anti-IA del §8 de `visual-identity`).
2. **Audit:** `node scripts/design-audit.js`, `node scripts/superficies-check.mjs`, e2e de superficies.
3. **Polish:** tipografía → espacio → estados → movimiento → detalle, en ese orden.
4. **Armonía a ojo (obligatoria, siempre que cambie un color o una pantalla):** contact sheet de todos los módulos en Claro y Oscuro, mirada humana —¿reposa la vista?, ¿algún módulo grita más que el resto?, ¿los estados (ok, alerta, «posible») se confunden con un acento?— y `python3 scripts/paleta-audit.py`. Si a ojo no es agradable, **no se justifica con números: se busca otro color o otra paleta** (criterio: misma luminosidad y croma en OKLCH, solo cambia el tono; texto sobre relleno ≥ 4,5:1).
5. **Prueba de los 200 px:** un recorte de 200 px debe ser reconocible como BandManager.
6. **Prueba de la tercera hora:** ¿cansa la vista? Si dudas, sube la letra y el aire.

Regla de oro contra "hecho por varias IAs": **un solo botón, un solo campo, una sola tarjeta, un solo modal** (`src/components/ui/`). Ya existen `Button` (primary · soft · neutral · ghost · danger; sm · md · lg · icon), `Chip` (neutral · acc · ok · alert) y `ShowIcon` (emoji guardado → Lucide); úsalos en lugar de escribir el botón a mano. Referencia de pantalla resuelta: Repertorio › Setlist. Si vas a escribir la cuarta variante de un botón, estás creando la deriva.

## ✅ Checklist antes de dar por cerrada una pantalla

- [ ] Ningún texto < 11 px; campos a 16 px en móvil; pesos ≤ 700 salvo cifras grandes.
- [ ] Todo control ≥ 40 px de zona táctil, con `:active`, foco visible y sin `hover:scale`.
- [ ] Cero `transition-all`, cero `ease-in`, animaciones < 300 ms y solo `transform`/`opacity`.
- [ ] Radios concéntricos; cifras tabulares; títulos con `balance`.
- [ ] Sin emojis en la interfaz (`npm run audit:emojis`); iconos Lucide del mismo trazo. Un dato que trae un emoji guardado se pinta con `<ShowIcon emoji={…} />`, nunca tal cual.
- [ ] Móvil: modal como hoja, máximo 3 bloques, sin scroll horizontal.
- [ ] Armonía cromática mirada a ojo (contact sheet Claro y Oscuro) y `python3 scripts/paleta-audit.py` en verde.
- [ ] `node scripts/design-audit.js` y `tsc` limpios; Playwright visual revisado a ojo.
