---
name: visual-identity
description: Sistema de identidad visual «Espectro» de BandManager.io — cero bordes, radio escalado, color por módulo, la Onda como lenguaje de datos y los tres temas (Claro/Oscuro/Clásico). Usar SIEMPRE antes de escribir, tocar o revisar cualquier `className`, color, fuente, sombra o componente de UI. Tiene precedencia sobre cualquier otra guía estética del repo, brand book externo incluido.
---

# 🌈 Skill: Identidad visual «Espectro»

Esta skill es **la autoridad estética del repositorio** (qué se ve). Cómo se *siente* —movimiento, tamaños, zonas táctiles, estados— vive en **[`craft-interfaces`](../craft-interfaces/SKILL.md)**; si chocan, manda esta. Si otra documentación, un brand book externo o una salida de una herramienta generativa contradice algo de aquí, manda esto.

> **Por qué existe.** Hasta septiembre de 2026, `fullstack-ux-design` prescribía glassmorphism sobre `slate-900`, degradados `indigo→purple` y semántica de color esmeralda/ámbar/rosa. Cada agente de IA que tocó el repo obedeció, y el resultado medible fue: 2.711 `font-mono`, 154 `backdrop-blur`, 209 degradados, 138 `animate-pulse`, 5 escalas de gris simultáneas y 266 hexadecimales sueltos. La app pasó a parecer un panel de trading de criptomonedas. **El problema no fue de gusto, fue de documentación.** No reintroduzcas nada de aquello.

---

## ⚖️ 1. Las dos leyes

> ## 1 · Un borde solo existe si significa algo. La separación es luz y espacio.
> ## 2 · Un solo acento (el azul) en el contenido. El resto es gris. Solo el menú lateral se tiñe por grupo.

**Los músicos pasan de 4 a 6 horas seguidas dentro de la app.** La fatiga visual es la restricción que manda sobre cualquier consideración estética. Las seis causas reales, todas medibles:

| Causa | Regla |
|---|---|
| Contraste extremo | Texto entre **10:1 y 14:1**. Espectro está en 12,4:1. Ni menos (ilegible) ni más (quema). |
| Exceso de bordes | **Ningún borde decorativo.** Las tarjetas se separan por escalón de luminancia (superficie más clara que el fondo) y espacio. Se permite un borde solo si *significa* algo: foco de teclado, campo en reposo, elemento seleccionado, divisor de tabla densa, **capa flotante (menú, popover)** — siempre con `--line` / `--line-strong`. |
| Mayúsculas | Caja de frase siempre. Las versalitas eliminan la silueta de la palabra. |
| Tipografía condensada | Prohibida. Humanista de aperturas abiertas. |
| Negro puro de noche | Nunca `#000`/`#FFF`. Provocan halación con astigmatismo. |
| Color saturado en superficie | El color vive en dosis pequeñas: píldora activa, botón, barra destacada de la Onda. |

## 🌊 2. La Onda — lenguaje único de datos

El logo lleva dentro un espectro de audio. Ese espectro es el **único** lenguaje de visualización de datos de BandManager.

- Toda serie temporal o comparativa se dibuja como **barras verticales de altura variable y puntas redondeadas** (`border-radius: 999px`): bolos por semana, crecimiento de fans, energía de un setlist, ingresos por mes, ocupación de una gira. Las puntas redondeadas no son decoración — son lo que separa un gráfico técnico de algo que se mira a gusto durante horas.
- Componente canónico: `src/components/ui/Onda.tsx`. **No instales librerías de gráficos** (Recharts, Chart.js, D3) sin discutirlo antes — rompen la firma visual y pesan.
- Gramática de color fija, en los tres temas:
  - **`--acc`** (el color del módulo activo) = estado consumado: confirmado, cobrado, pico.
  - **`--ok`** = en curso: negociando, pendiente.
  - **`--hair`** = inerte: enviado sin respuesta, sin dato.
- **Prohibida la semántica verde-sube / rojo-baja.** Es lenguaje de P&L bursátil y es la mitad de por qué la app olía a bróker. Rojo (`--alert`) solo para errores reales del sistema.

**La prueba que hay que pasar:** un recorte de 200 píxeles de cualquier pantalla debe ser reconocible como BandManager. Si no lo es, falta Onda.

---

## 👥 3. El Público — estados vacíos y celebración

La silueta del público con los brazos en alto es la única parte del logo con carga emocional. Úsala.

- **Estado vacío:** nunca «No hay datos» / «Sin resultados». La silueta al 10-14% de opacidad + una frase del mundo del directo. Ej.: _«La sala está vacía. Vamos a llenarla.»_
- **Celebración:** un bolo confirmado o un hito no es un *toast* genérico — el público se ilumina ~600 ms. Siempre bajo `@media (prefers-reduced-motion: reduce)`.
- **Copy:** lo escribe alguien que ha descargado un ampli por unas escaleras. Vocabulario real del circuito: caché, taquilla, rider, backline, prueba de sonido, hoja de ruta, furgo. Nunca «Potenciado por IA», «Todo en un solo lugar» ni «Gestiona de forma inteligente».

---

## 🎨 4. Tokens — contrato inviolable

**Todo color, fuente, radio y sombra sale de un token.** Un componente nunca sabe qué tema está activo. Fuente única de verdad: `src/styles/tokens.css`.

```css
:root {                                   /* CLARO — por defecto */
  --bg:#F6F7F9; --surface:#FFFFFF; --sunken:#E8EBEF;
  --ink:#2A2E35; --ink-2:#646C78; --ink-3:#98A0AC;
  --hair:rgba(42,46,53,.065);
  --ok:#17998C; --ok-soft:#DDF1EE; --alert:#B3453C;
  --sh-s:none; --sh-m:none;               /* Espectro es plano: separa el relleno */
  --r-s:12px; --r-m:18px; --r-l:24px; --r-xl:32px; --r-pill:999px;
}
[data-theme="dark"] {                     /* OSCURO — de primera, no invertido */
  --bg:#101216; --surface:#191C21; --sunken:#0B0D10;
  --ink:#E3E7EC; --ink-2:#99A1AC; --ink-3:#6B7380;
  --hair:rgba(227,231,236,.08);
  --ok:#4FC7B8; --ok-soft:#122D29; --alert:#E27A70;
}
```

### Un solo acento — la segunda ley
**Decisión de Diego (2026-09-30):** «el naranja por toda la app no me gusta; me gustaba más el azul que teníamos; no quiero tantísimos colores diferentes». Hasta entonces cada módulo teñía `--acc` con su tono (naranja, morado, rosa, verde, índigo, teal) y la app parecía un muestrario. **No se reintroduce el color por módulo.**

| Token | Claro | Oscuro | Para qué |
|---|---|---|---|
| `--acc` / `--acc-soft` / `--acc-ink` | `#2158DC` / `#DBEAFE` / `#1D4ED8` | `#60A5FA` / `#1E3A5F` / `#60A5FA` | El único acento: acciones, selección, datos destacados |
| `--ok` | `#0D7A70` | `#4FC7B8` | Estado positivo (teal, análogo del azul) |
| `--alert` | `#B3453C` | `#E27A70` | Solo errores reales |
| `--tentative` | `#4F5F86` | `#A9B6D6` | «Posible»: gris azulado de la familia del azul |

- **`--acc` y `--acc-ink` no son intercambiables.** `--acc` es para rellenos y elementos gráficos; `--acc-ink` es la versión que pasa AA para texto sobre claro. Blanco sobre `--acc` da 5,2:1.
- **Armonía = pocos tonos.** Un acento, un estado positivo, un estado de error y neutros fríos. Si necesitas distinguir cosas, usa forma, peso, posición o icono antes que un color nuevo. `python3 scripts/paleta-audit.py` falla si vuelve un override de `--acc` por módulo, si un estado tiene más croma que el acento o si «posible» sale de la familia del azul.
### El menú se tiñe por grupo (excepción acotada a la segunda ley)
**Decisión de Diego (2026-09-30):** «que el menú de la izquierda cambie un poco los tonos según el grupo (en Música, el verde): da sensación de saber dónde estás solo con el color». Se aplica **solo** al menú lateral, a la barra inferior y al cajón móvil, con `data-grupo` (lo pone `App.tsx` desde `findNavGroupIdForItem(currentView)`). El contenido no cambia: sigue en el azul único.

| Grupo | Claro `--acc` | Oscuro `--acc` |
|---|---|---|
| Directorio · Herramientas · pinned | azul (`#2158DC`) | `#60A5FA` |
| Música | `#108846` (verde Spotify, calibrado AA) | `#1DB954` (verde Spotify) |
| Promoción | `#7F53AC` | `#CBA1FA` |
| Negocio | `#008192` | `#4CC4D2` |

Reglas: luminosidad pareja (≈ L 0,53–0,55 en claro), croma moderado, AA en `--on-acc` y `--acc-ink` (`paleta-audit.py` lo comprueba). **No** añadir un grupo nuevo con un naranja/ámbar (Diego lo rechazó) ni llevar el tinte al contenido. Clásico no tiñe el menú.

- `data-modulo` se conserva como gancho (tests, futuro) pero **ya no cambia colores**. Clásico sigue con su ámbar de marca y es lo que hace reversible todo esto.
- Historia, para no repetirla: ámbar de marca (dorado+negro leía a bróker) → terracota (paleta segura de diseño generado) → naranja quemado → un color por módulo → **un solo azul**.

### Repintado sin tocar componentes (Tailwind v4)
```css
@theme {
  --color-amber-500: var(--acc);    /* repinta 1.630 clases bg-amber-500 de golpe */
  --font-mono: var(--font-sans);    /* desactiva 2.711 monoespaciadas */
}
```

### Prohibiciones duras
- ❌ **Cualquier `border` sin token.** Es la ley 1. Una tarjeta se separa con escalón de luminancia (`--surface` más clara que `--bg`), espacio, o `--sunken`. El borde con significado (foco, campo en reposo, selección, divisor de tabla) usa `border-[var(--line)]` o `border-[var(--line-strong)]`; el anillo de foco de teclado ya está en la base.
- ❌ Hexadecimal literal en un `.tsx` (`bg-[#f2ca50]`, `text-[#131313]`). Token o nada.
- ❌ Más de una escala de gris. **`neutral` es la única permitida**; `slate`, `zinc`, `stone` y `gray` quedan retiradas.
- ❌ `dark:` de Tailwind en componentes. El tema se resuelve en tokens, no en el marcado.
- ❌ `backdrop-blur`, `glow-*`, `shadow-[0_0_...]`, halos y degradados. `animate-pulse` solo para carga real.
- ❌ `#000` o `#FFF` como fondo o como texto.

---

## 📐 5. La escala de radios

**Un solo radio para todo aplana la jerarquía.** El radio crece con el peso del objeto, y así se ve ópticamente parejo:

| Token | Valor | Para |
|---|---|---|
| `--r-pill` | `999px` | Chips, badges, píldoras de estado, items de navegación, botones |
| `--r-s` | `12px` | Campos de formulario, celdas pequeñas |
| `--r-m` | `18px` | Tarjetas, filas de lista |
| `--r-l` | `24px` | Paneles y contenedores |
| `--r-xl` | `32px` | Modales y hojas |

---

## 🔤 6. Tipografía

**Una sola familia: `Onest`.** La jerarquía la hace el peso y el tamaño, no mezclar fuentes. Es lo más minimalista, lo más barato de cargar y lo más descansado de leer en jornadas largas.

- Es humanista, de aperturas abiertas y altura de x generosa: diseñada para leerse, no para impresionar.
- **Vetadas por delatoras de diseño generado:** Inter, Poppins, Space Grotesk, Plus Jakarta, Bricolage Grotesque, Newsreader, Montserrat, Nunito, Quicksand. *(Inter era la del brand book de Pomelli; se anula a propósito.)*
- **Nada de tipografía condensada** y **nada de mayúsculas decorativas**: las dos cansan en sesiones largas.
- **Escala única (px): 11 · 12 · 14 · 16 · 20 · 28 · 40; mínimo absoluto 11 (`text-micro`).** Cuerpo 14 en escritorio, 16 en móvil; campos a 16 en móvil. Pesos 400–700 (`font-black` solo en cifras grandes). Detalle y motivos en **`craft-interfaces`**.
- **Sin emojis en la interfaz:** los iconos son Lucide (trazo 1,75, tamaños 16/20). Un emoji es contenido del usuario o momento de celebración, nunca un botón, un título ni una insignia.
- `font-mono` **solo** en dato tabular real: BPM, timecodes, fechas, importes, IDs. El combo `font-mono` + `uppercase` + `tracking-widest` es la gramática de una pantalla de Bloomberg y está **prohibido**.
- Cifras en columna: `font-variant-numeric: tabular-nums`. Sin cero a la izquierda (`7`, no `07` — es un tic de ticker).

---

## 🌓 7. Los tres temas

De cara al usuario: **Claro** (por defecto), **Oscuro** y **Clásico**.

> **Clásico es innegociable y es lo que hace reversible todo esto.** Es el diseño anterior de BandManager, conservado como un juego de tokens más. No se borra nunca. Un usuario que no quiera el cambio lo elige y sigue con lo de siempre. **Ninguna migración a Espectro puede eliminarlo.**

Separa **preferencia** (`light` | `dark` | `classic` | `system`) de **tema resuelto** (lo que se pinta):

```ts
const mq = matchMedia('(prefers-color-scheme: dark)');

export function aplicarTema(pref: Preferencia) {
  const resuelto = pref === 'system' ? (mq.matches ? 'dark' : 'light') : pref;
  document.documentElement.dataset.theme = resuelto;
}
mq.addEventListener('change', () => { if (leerPref() === 'system') aplicarTema('system'); });
```

1. **La preferencia se persiste en el perfil de usuario** (Supabase), no solo en `localStorage`. Se entra desde el portátil en casa y desde el móvil en la furgo y se espera el mismo tema. `localStorage` queda como caché de arranque.
2. **Script inline en `index.html`, antes del CSS**, que lea la caché y estampe `data-theme`. Sin él hay un fogonazo blanco en cada carga con tema oscuro.
3. Todo componente debe verse correcto en los **tres** temas. No se da por bueno un componente probado solo en uno.
4. El modo de alto contraste para leer en escenario sigue siendo `glareMode` en `SetlistPerformanceView` — es una vista puntual, no un tema global.

---

## 🚫 8. Checklist anti-plantilla de IA

Los nueve delatores del diseño generado. Pásalo antes de dar por cerrada una pantalla.

- [ ] **¿Todo lleva tarjeta, borde y sombra?** El esfuerzo debe repartirse mal a propósito: el 90% plano y una cosa extraordinaria.
- [ ] **¿Un único radio en todo?** El radio es información: dice cuánto pesa un objeto. Referencia del problema: 1.575 `rounded-xl` + 1.262 `rounded-lg` frente a 2 `rounded-none`.
- [ ] **¿Todos los iconos son de catálogo?** 156/156 ficheros importan Lucide. Los objetos propios de BandManager (onda, público, sala, setlist) se dibujan a mano.
- [ ] **¿La paleta es «apagada y de buen gusto»?** Salvia, terracota, crema y azul polvoriento son el uniforme generado. Un color que no ofende a nadie no significa nada.
- [ ] **¿Tipografía «segura»?** Inter, Space Grotesk, Poppins, Plus Jakarta, Bricolage Grotesque, Newsreader. Todas delatan.
- [ ] **¿Simetría obediente?** Rejillas de tres columnas, todo centrado, padding idéntico. Falta asimetría deliberada y ajuste óptico.
- [ ] **¿Hay algún objeto propio del producto?** Si la respuesta es «una tarjeta», no hay producto, hay plantilla. En BandManager el objeto es **la Onda**.
- [ ] **¿Ningún rastro de mano?** Ninguna decisión que una máquina no se atrevería a tomar. La ausencia de rarezas es el delator definitivo.
- [ ] **¿Copy de jefe de producto?** «Todo en un solo lugar», «Potenciado por IA», «No hay datos».

---

## 📱 9. Simplicidad en pantalla (AGENTS.md §6 — manda sobre lo estético)

- Móvil primero de verdad, ~390 px: **máximo 3 bloques antes del primer scroll**.
- Acciones secundarias detrás de `⋯`, nunca una fila de botones siempre visible.
- Ningún componente decorativo sin trabajo que hacer.
- Simplificar **nunca** es borrar funcionalidad: se reubica (menú, modal, vista secundaria), nunca desaparece en silencio.

---

## ✅ Checklist antes de PR de UI

- [ ] **Ningún borde sin significado ni sin token.** ¿Separa el escalón de luminancia y el espacio?
- [ ] Cero hexadecimales literales; todo por token.
- [ ] Cero `slate`/`zinc`/`stone`/`gray` nuevos (solo `neutral`).
- [ ] El radio sale de la escala y corresponde al peso del objeto.
- [ ] Caja de frase en todo. Ni una mayúscula decorativa.
- [ ] `--acc` viene del token, no hardcodeado, y no hay un color nuevo por módulo.
- [ ] Texto entre 10:1 y 14:1 de contraste. `--acc-ink` para texto, `--acc` para relleno.
- [ ] `font-mono` solo en dato tabular real.
- [ ] Escala tipográfica (mínimo 11 px), zonas táctiles ≥ 40 px, movimiento y estados según **`craft-interfaces`**.
- [ ] Probado en **Claro, Oscuro y Clásico**.
- [ ] Toda serie de datos usa `<Onda>` con puntas redondeadas, no una librería de gráficos.
- [ ] Estado vacío con voz propia, no «No hay datos».
- [ ] Checklist anti-plantilla del §8 pasado.
- [ ] Cabe en 3 bloques el primer viewport móvil (~390 px).
- [ ] Campos con `<Input>`/`<Textarea>`/`<Select>` de `components/ui` (nunca `<input>` a mano; excepción justificada con `data-raw`), botones de solo icono con `aria-label`, `npm run audit:diseno` en verde (CI lo exige).
- [ ] `npx tsc --noEmit` sin errores nuevos.
