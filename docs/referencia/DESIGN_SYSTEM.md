# Espectro — Sistema de Diseño Parametrizado

**Autoridad:** [`skills/visual-identity/SKILL.md`](../../.claude/skills/visual-identity/SKILL.md)

## Visión general

BandManager usa **Espectro**, un sistema de tokens CSS que hace que modificaciones visuales masivas sean tan simples como cambiar 5-10 líneas de código. El objetivo: **fatiga visual cero** para músicos que pasan 4-6 horas aquí dentro cada día.

### Las dos leyes

1. **Ningún borde.** La separación es luz y espacio (escalones de luminancia).
2. **Cada módulo tiene su color.** El resto es gris neutro.

---

## Tokens disponibles

### Superficies (luz/oscuridad)

```css
--bg       /* Page background (más oscuro) */
--surface  /* Card background (más claro que --bg) */
--sunken   /* Dark UI element (más oscuro que --surface) */
```

**Por qué importa:** Sin bordes, la luminancia es lo único que separa. Siempre: `bg < surface < sunken` en valor de luminancia.

### Texto (contraste)

```css
--ink      /* Primary text (12.4:1 contrast ratio) */
--ink-2    /* Secondary text (4.5:1 WCAG AA, para metadata) */
--ink-3    /* [DEPRECATED — 2.6:1 contrast, insuficiente] */
```

**Regla:** Usa `--ink-2` para texto que no sea el principal. Nunca `--ink-3`.

### Estado

```css
--ok       /* In-progress, confirmed (teal/emerald) */
--ok-soft  /* Soft background for --ok states */
--alert    /* Errors only (red/rose) */
--alert-soft /* Soft background for --alert */
```

**Regla:** Sin semántica verde-sube/rojo-baja. Eso es lenguaje de Bolsa. Solo para estados reales del sistema.

### Acento por módulo

```css
--acc      /* Module accent color (varies by data-modulo) */
--acc-soft /* Soft version for backgrounds */
--acc-ink  /* Dark version for text over light (4.5:1 AA) */
--on-acc   /* Text over --acc background */
```

**Módulos y sus colores:**

| Módulo | Color | Uso |
|--------|-------|-----|
| `booking` / `panel` | Naranja quemado (#D86E31) | Panel y búsqueda de salas |
| `repertorio` | Rojo óxido (#E0615C) | Gestión de canciones |
| `gira` / `sala` | Teal (#17998C) | Tours y salas |
| `finanzas` | Azul medio (#3C7EA8) | Ingresos y gastos |
| `fans` / `reels` | Púrpura (#9B5FB5) | Fans y contenido |
| `epk` | Púrpura profundo (#6B4CE0) | Press kits |

**Aplicar:** `<div data-modulo="booking">…</div>` automáticamente cambia `--acc` en ese contenedor y sus hijos.

### Radio (esquinas)

```css
--r-pill   /* 999px — píldoras, badges, botones, items nav */
--r-s      /* 12px — campos pequeños, celdas */
--r-m      /* 18px — tarjetas, filas */
--r-l      /* 24px — paneles, contenedores */
--r-xl     /* 32px — modales, sheets */
```

**Regla:** El radio crece con el peso visual del objeto. Jerarquía óptica automática.

### Tipografía

**Una sola familia:** `Onest` (humanista, aperturas abiertas, altura de x generosa).

**Prohibidas:**
- Inter, Poppins, Space Grotesk (delatoras de diseño generado)
- Tipografía condensada
- Mayúsculas decorativas

---

## Tema: luz, oscuro, clásico

### Seleccionar tema

```html
<!-- Light (por defecto) -->
<html data-theme="light">

<!-- Dark -->
<html data-theme="dark">

<!-- Classic (diseño anterior, preservado) -->
<html data-theme="classic">
```

### Preferencia persistida

La preferencia se guarda en Supabase (perfil de usuario), no solo localStorage:

```ts
// En App.tsx o similares
const user = useCurrentUser();
const pref = user?.themePreference; // 'light' | 'dark' | 'classic' | 'system'
```

---

## Cómo cambiar colores (sin tocar archivos de componentes)

### Caso 1: Cambiar un token global

**Antes:** Buscar 200+ instancias de un color, cambiar cada una.

**Ahora:** Edita [`src/styles/tokens.css`](../../src/styles/tokens.css) una sola vez.

```css
/* Cambiar teal en TODOS lados (Tours/Salas) */
--ok: #17998C;  /* ← aquí */

/* Todos los 50+ componentes que usan --ok se actualizan automáticamente */
```

### Caso 2: Cambiar color de un módulo

```css
/* Cambiar booking de naranja a otro color */
[data-modulo="booking"] {
  --acc: #NewColor;        /* Relleno, bordes, iconos */
  --acc-soft: #NewLight;   /* Backgrounds suaves */
  --acc-ink: #NewDark;     /* Texto sobre --acc */
}
```

### Caso 3: Aplicar fix global

Si descubrimos un problema (ej: contraste insuficiente), usa el script:

```bash
# 1. Auditar el proyecto
npm run design:audit

# 2. Si hay problemas, aplicar fixes automáticos
npm run design:fix
```

El script reemplaza:
- `text-black` → `text-[var(--ink)]`
- `#d1b375` → `var(--acc)`
- `text-[var(--ink-3)]` → `text-[var(--ink-2)]`
- etc.

---

## Reglas (copia y pega en PRs)

### Checklist: UI nueva o cambio visual

- [ ] **Cero `border`.** Separa el escalón de luminancia y el espacio.
- [ ] **Cero hexadecimales literales.** Solo tokens (`var(--...)`).
- [ ] **Cero `slate`/`zinc`/`stone`/`gray`.** Solo `neutral` o tokens.
- [ ] **Radio correcto.** Crece con el peso del objeto.
- [ ] **Caja de frase siempre.** Ni una mayúscula decorativa.
- [ ] **--acc viene del módulo.** No hardcodeado.
- [ ] **Texto 10:1-14:1 contraste.** Usa `--ink` para primario, `--ink-2` para secundario.
- [ ] **`font-mono` solo en dato real.** BPM, timecodes, IDs, importes.
- [ ] **Probado en claro, oscuro, clásico.**
- [ ] **Series de datos usan `<Onda>`.** No Chart.js ni D3.
- [ ] **Estado vacío tiene voz propia.** No "No hay datos".
- [ ] Checklist anti-plantilla (§8 en [`skills/visual-identity/SKILL.md`](../../.claude/skills/visual-identity/SKILL.md)).
- [ ] **Cabe en 3 bloques en móvil (~390 px).**

### Comandos útiles

```bash
# Verificar TypeScript (antes de pushear)
npm run typecheck

# Auditar solo errores
npm run design:audit

# Auditar con detalle
npm run design:audit --strict

# Aplicar fixes + rebuild
npm run design:fix
```

---

## Ejemplos

### Componente temático correcto

```tsx
export function MyButton() {
  return (
    <button className="px-3.5 py-1.5 rounded-[var(--r-m)] bg-[var(--acc)] hover:bg-[var(--acc)]/80 text-[var(--acc-ink)] font-bold text-xs">
      Action
    </button>
  );
  // ✅ Todos los valores son tokens
  // ✅ Funciona en claro, oscuro, clásico
  // ✅ Se tiñe automáticamente con data-modulo
}
```

### Componente temático INCORRECTO

```tsx
export function BadButton() {
  return (
    <button className="px-3.5 py-1.5 rounded-lg bg-[#D86E31] text-black">
      Action
    </button>
  );
  // ❌ Hardcoded #D86E31 (no se tiñe con módulos)
  // ❌ text-black (no se adapta a temas)
  // ❌ No funciona en clásico
}
```

---

## FAQ

**P: ¿Qué pasa si quiero un color que no es token?**

A: Propón añadirlo a `tokens.css` o úsalo temporalmente con `[data-modulo]` override. Nunca hardcodeado en componentes.

**P: ¿Por qué no `text-white` en dark mode?**

A: `#FFF` sobre casi-negro (`#101216`) produce halación. El ojo vibra. Con astigmatismo, molesta en 20 minutos. `#E3E7EC` (--ink en dark) es blanco percibido sin fatiga.

**P: ¿Puedo ignorar Espectro en una vista especial?**

A: No. Ni una sola excepción. Si la vista tiene restricciones únicas, propón un token nuevo. Excepto:
- Vídeos embebidos (fuera de control)
- Logos de terceros (PayPal, Spotify — solo los suyos, no los genéricos)
- Gráficos derivados de datos del usuario (un usuario sube su gráfico)

**P: ¿Clásico qué es?**

A: El diseño anterior, conservado como tema alternativo. Un usuario que no quiera Espectro lo elige y todo sigue siendo lo de siempre. Nunca se borra.

---

## Referencias

- [Espectro Design Skill](../../.claude/skills/visual-identity/SKILL.md) — Autoridad estética
- [AGENTS.md](../../AGENTS.md) — Reglas de desarrollo (§6 — Simplicidad visual)
- [tokens.css](../../src/styles/tokens.css) — Fuente de verdad de colores y radios
- [Scripts]

(scripts/design-audit.js, scripts/design-fixer.js) — Herramientas automatizadas
