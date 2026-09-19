---
name: visual-identity
description: Sistema de identidad visual «Sala» de BandManager.io — ley del oro, la Onda como lenguaje de datos, tokens de color, tipografía y los tres temas (Carga/Directo/Escenario). Usar SIEMPRE antes de escribir, tocar o revisar cualquier `className`, color, fuente, sombra o componente de UI. Tiene precedencia sobre cualquier otra guía estética del repo.
---

# 🎭 Skill: Identidad visual «Sala»

Esta skill es **la autoridad estética del repositorio**. Si otra documentación, un brand book externo o una salida de una herramienta generativa contradice algo de aquí, manda esto.

> **Por qué existe.** Hasta septiembre de 2026, `fullstack-ux-design` prescribía glassmorphism sobre `slate-900`, degradados `indigo→purple` y semántica de color esmeralda/ámbar/rosa. Cada agente de IA que tocó el repo obedeció, y el resultado medible fue: 2.711 `font-mono`, 154 `backdrop-blur`, 209 degradados, 138 `animate-pulse`, 5 escalas de gris simultáneas y 266 hexadecimales sueltos. La app pasó a parecer un panel de trading de criptomonedas. **El problema no fue de gusto, fue de documentación.** No reintroduzcas nada de aquello.

---

## ⚖️ 1. La ley — lo único que hay que memorizar

> ## El oro ilumina. No rellena.

El `#F2CA50` de BandManager viene del logo, donde **no es pintura: son haces de luz cenital cayendo sobre un público**. Respeta esa física en toda la interfaz.

**El oro SÍ puede ser:**
- Haz cenital del encabezado (degradado vertical que cae y desaparece, ~12-20% alpha).
- Filo del elemento activo de navegación (`box-shadow: inset 3px 0 0`).
- Anillo de foco (`outline`).
- La barra destacada de una Onda.
- El fondo de **la** acción principal de la pantalla (una, no cinco), en plano y sin degradado.

**El oro NUNCA puede ser:**
- Fondo de tarjeta o de panel.
- Borde con resplandor (`box-shadow: 0 0 Npx rgba(242,202,80,...)`) — **prohibido explícitamente**.
- Halo alrededor de un logo o de una imagen.
- Color de texto de enlaces secundarios.
- Degradado (`bg-gradient-*` con oro).

**Por qué importa:** oro rellenando sobre casi-negro es la firma visual de los exchanges de cripto y los casinos online. Oro entrando como luz desde arriba es un concierto. Mismo hexadecimal, lectura opuesta.

---

## 🌊 2. La Onda — lenguaje único de datos

El logo lleva dentro un espectro de audio. Ese espectro es el **único** lenguaje de visualización de datos de BandManager.

- Toda serie temporal o comparativa se dibuja como **barras verticales de altura variable**: bolos por semana, crecimiento de fans, energía de un setlist, ingresos por mes, ocupación de una gira.
- Componente canónico: `src/components/ui/Onda.tsx`. **No instales librerías de gráficos** (Recharts, Chart.js, D3) sin discutirlo antes — rompen la firma visual y pesan.
- Gramática de color fija, en los tres temas:
  - **Oro** = estado consumado (confirmado, cobrado, pico).
  - **`--ink-3`** = en curso (negociando, pendiente).
  - **`--line`** = inerte (enviado sin respuesta, sin dato).
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

**Todo color, fuente, radio y sombra sale de un token.** Un componente nunca sabe qué tema está activo.

```css
/* src/styles/tokens.css — fuente única de verdad */
:root {                        /* CARGA (claro) — por defecto */
  --bg:#FBFBF9; --surface:#FFFFFF; --sunken:#F1F1ED;
  --ink:#111116; --ink-2:#55555E; --ink-3:#8E8E97; --line:#E3E3DE;
  --gold:#F2CA50; --gold-ink:#7A5A0E;   /* gold-ink = versión que pasa AA sobre claro */
  --beam:rgba(242,202,80,.20); --on-gold:#111116; --alert:#B8341C;
}
[data-theme="dark"] {          /* DIRECTO — negros exactos del brand book */
  --bg:#09090B; --surface:#111116; --sunken:#0D0D10;
  --ink:#FFFFFF; --ink-2:#A1A1AA; --ink-3:#6B6B74; --line:#232329;
  --gold:#F2CA50; --gold-ink:#F2CA50;
  --beam:rgba(242,202,80,.13); --on-gold:#09090B; --alert:#FF7A5C;
}
[data-theme="stage"] {         /* ESCENARIO — alto contraste, leer bajo cañón de luz */
  --bg:#FFFFFF; --surface:#FFFFFF; --sunken:#F0F0F0;
  --ink:#000000; --ink-2:#000000; --ink-3:#3A3A3A; --line:#000000;
  --gold:#6B4E00; --gold-ink:#000000; --beam:transparent;
  --on-gold:#FFFFFF; --alert:#8B0000;
}
```

**`--gold` y `--gold-ink` son dos cosas distintas y no son intercambiables.** `#F2CA50` sobre fondo claro da 2,7:1 de contraste: **no vale para texto**. Sirve para rellenos y elementos gráficos. Para texto dorado sobre claro se usa `--gold-ink` (`#7A5A0E`, 5,2:1, AA).

Y en Tailwind v4, el truco que permite repintar sin tocar componentes:

```css
@theme {
  --color-amber-500: var(--gold);   /* las 1.630 clases bg-amber-500 se repintan solas */
  --font-mono: var(--font-sans);    /* desactiva 2.711 monoespaciadas de golpe */
}
```

### Prohibiciones duras
- ❌ Hexadecimal literal en un `.tsx` (`bg-[#f2ca50]`, `text-[#131313]`). Token o nada.
- ❌ Más de una escala de gris. **`neutral` es la única permitida**; `slate`, `zinc`, `stone` y `gray` quedan retiradas.
- ❌ `dark:` de Tailwind en componentes. El tema se resuelve en tokens, no en el marcado.
- ❌ `backdrop-blur` fuera de un modal. `glow-*`, `shadow-[0_0_...]` y `animate-pulse` decorativo: fuera. `animate-pulse` solo para carga real.
- ❌ `bg-gradient-*` salvo el haz cenital.

---

## 🔤 5. Tipografía

| Rol | Familia | Uso |
|---|---|---|
| Titulares / nav / cifras | **Archivo** (eje `wdth` 62–125) | `font-display`. Caja alta, `font-stretch` 78–88%. Comparte proporciones con el logotipo, y la anchura variable es funcional: «Valladolid — Sala Porta Caeli» tiene que caber en columna. |
| Texto corrido | **Inter** | `font-sans`. Se mantiene del brand book: es excelente en cuerpo. |
| Dato tabular | **IBM Plex Mono** | `font-mono`. **Solo** BPM, timecodes, fechas, importes, IDs y cabeceras de tabla. |

- **Inter en titulares está vetada.** Es la fuente de interfaz más usada del planeta y el delator número uno del diseño generado por IA.
- La monoespaciada en etiquetas de UI está vetada. Si el contenido no es un número o un código, no es mono. Referencia histórica: la app llegó a tener 2.711 usos frente a 339 de `font-sans`.
- El combo `font-mono` + `uppercase` + `tracking-widest` es la gramática de una pantalla de Bloomberg. **Prohibido.**
- Cifras alineadas en columna: `font-variant-numeric: tabular-nums`. Sin cero a la izquierda (`7`, no `07` — eso es un tic de ticker).

---

## 🌓 6. Los tres temas

Nombres de cara al usuario: **Carga** (claro, por defecto), **Directo** (oscuro), **Escenario** (alto contraste). El tercero ya existía a medias como `glareMode` en `SetlistPerformanceView`.

Separa **preferencia** (lo que el usuario eligió: `light` | `dark` | `stage` | `system`) de **tema resuelto** (lo que se pinta):

```ts
const mq = matchMedia('(prefers-color-scheme: dark)');

export function aplicarTema(pref: Preferencia) {
  const resuelto = pref === 'system' ? (mq.matches ? 'dark' : 'light') : pref;
  document.documentElement.dataset.theme = resuelto;
}
// Con 'system', el SO manda en caliente: sin recargar, sin parpadeo.
mq.addEventListener('change', () => { if (leerPref() === 'system') aplicarTema('system'); });
```

Reglas de implantación:
1. **La preferencia se persiste en el perfil de usuario** (Supabase), no solo en `localStorage`. Se entra desde el portátil en casa y desde el móvil en la furgo y se espera el mismo tema. `localStorage` queda como caché de arranque.
2. **Script inline en `index.html`, antes del CSS**, que lea la caché y estampe `data-theme`. Sin él hay un fogonazo blanco en cada carga con tema oscuro.
3. Todo componente debe verse correcto en los **tres** temas. No se da por bueno un componente probado solo en oscuro.

---

## 🚫 7. Checklist anti-plantilla de IA

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

## 📱 8. Simplicidad en pantalla (AGENTS.md §6 — manda sobre lo estético)

- Móvil primero de verdad, ~390 px: **máximo 3 bloques antes del primer scroll**.
- Acciones secundarias detrás de `⋯`, nunca una fila de botones siempre visible.
- Ningún componente decorativo sin trabajo que hacer.
- Simplificar **nunca** es borrar funcionalidad: se reubica (menú, modal, vista secundaria), nunca desaparece en silencio.

---

## ✅ Checklist antes de PR de UI

- [ ] Cero hexadecimales literales nuevos; todo por token.
- [ ] Cero `slate`/`zinc`/`stone`/`gray` nuevos (solo `neutral`).
- [ ] Ningún `glow`, `shadow-[0_0_...]`, halo ni degradado dorado.
- [ ] `font-mono` solo en dato tabular real.
- [ ] Probado en **Carga, Directo y Escenario**.
- [ ] Toda serie de datos usa `<Onda>`, no una librería de gráficos.
- [ ] Estado vacío con voz propia, no «No hay datos».
- [ ] Checklist anti-plantilla del §7 pasado.
- [ ] `npx tsc --noEmit` sin errores nuevos.
