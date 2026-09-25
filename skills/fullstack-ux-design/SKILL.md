---
name: fullstack-ux-design
description: Guía de excelencia en diseño Frontend (React 19, Motion, Tailwind v4, UX B2C) y Backend (Express modular, Vitest) para BandManager.io. Usar al crear componentes UI o refinamientos API.
---

# 🎨 Skill: Desarrollo Fullstack Premium & Diseño UX

Esta skill establece los principios de desarrollo frontend y backend para lograr una experiencia de usuario de clase mundial (nivel B2C SaaS comercial) manteniendo código limpio, mantenible y robusto.

---

## 💎 1. Estándares de Diseño Frontend (UI/UX)

### Paleta de Colores & Estética
Identidad de marca real (Brand Book, Pomelli, confirmado 2026-09-18 contra lo ya implementado — no son sugerencias, son los colores de BandManager.io):
- **Jet Black `#09090B`:** fondo general de la app (dark mode).
- **Obsidian Black `#111116`:** fondo de tarjetas, modales y paneles.
- **Dijon Yellow `#F2CA50`** (también visto como `#d1b375`): color de marca / acento primario — botones principales, bordes activos, estados seleccionados, highlights. Es EL color de BandManager, no un ámbar genérico de warning.
- **Pure White `#FFFFFF`:** texto sobre fondo oscuro.
- **Tipografía:** Inter (`src/index.css`) como fuente base en toda la app.
- Colores semánticos aparte de la marca (no la sustituyen): esmeralda `#10b981` para éxito/positivo, rojo para error/destructivo. Usar degradados sutiles solo para estos estados semánticos, nunca para reemplazar el ámbar de marca en acciones primarias.
- **Glassmorphism:** paneles con `backdrop-blur-md bg-neutral-900/80 border border-neutral-800` (o `border-[#f2ca50]/30` cuando el panel debe leerse como "de marca", no neutro).
- **Tipografía & Jerarquía:** Títulos claros en negrita, tamaños de fuente proporcionales y contraste WCAG adecuado.

### Micro-Animaciones & Motion (React 19 + `motion`)
Añadir vida a la interfaz con animaciones fluidas al cargar, sobrevolar o transicionar entre pestañas:

```tsx
import { motion } from 'motion/react';

export function CardMetrica({ titulo, valor, icono: Icon }: Props) {
  return (
    <motion.div
      whileHover={{ scale: 1.02, translateY: -2 }}
      transition={{ duration: 0.2 }}
      className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 shadow-xl backdrop-blur-sm"
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-slate-400">{titulo}</span>
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <p className="mt-2 text-2xl font-bold text-white">{valor}</p>
    </motion.div>
  );
}
```

### Componentes y Feedback al Usuario
- **Estados de Carga y Vacío (Empty States):** Toda tabla o grid debe mostrar un spinner de carga o un *empty state* visualmente atractivo cuando no hay datos.
- **Sin Placeholders:** Usar datos reales o generar imágenes de demostración si se requieren recursos visuales.
- **Consumo de API Centralizado:** Utilizar siempre `src/services/api.ts` o `src/utils/api.ts` para llamadas HTTP. No hacer `fetch()` directo desde componentes.

### Simplicidad en Pantalla (AGENTS.md §6 — regla transversal, léela completa antes de tocar UI)
Lo de arriba (animaciones, glassmorphism) es la capa visual; esto manda sobre ella cuando entran en conflicto. Resumen de lo no negociable:
- **Móvil primero de verdad**, ~390px, máximo 3 bloques antes de scroll en el primer viewport.
- **Acciones secundarias detrás de un menú** (`⋯`/`⚙️`), nunca fila de botones siempre visible.
- **Ningún componente decorativo sin trabajo que hacer** — un badge/animación bonita que no aporta información no entra solo porque "queda bien".
- **Simplificar nunca es borrar funcionalidad** — se reubica (menú, modal, vista secundaria), nunca desaparece en silencio.

---

## ⚙️ 2. Estándares de Backend (Express + TypeScript)

### Resiliencia Asíncrona
Todos los handlers asíncronos deben envolverse en bloques `try/catch` para capturar errores de forma limpia y retornar un JSON estructurado de error (`{ error: 'Mensaje descriptivo' }`):

```typescript
app.post('/api/songs', requireAuth, async (req, res) => {
  try {
    const bandId = getTargetBandId(req);
    const nuevaCancion = await dbCreateSong(req.body, bandId);
    return res.status(201).json(nuevaCancion);
  } catch (error: any) {
    console.error('[API ERROR] /api/songs:', error);
    return res.status(500).json({ error: error.message || 'Error interno del servidor' });
  }
});
```

### Tipado y Calidad (`tsc --noEmit`)
- **Cero Tolerancia a Errores TypeScript Nuevos:** La suite de compilación `npx tsc --noEmit` debe mantenerse en 0 errores nuevos.
- **Prohibido el Uso Indiscriminado de `any`:** Definir interfaces en `src/types.ts` siempre que se cree un nuevo modelo o payload.

---

## 🧪 3. Pruebas Unitarias con Vitest
- Colocar los archivos de test adyacentes al código que prueban en una carpeta `__tests__/` (ejemplo: `server/utils/__tests__/bandAccess.test.ts`).
- Ejecutar tests con `npm test` o test específico con `npx vitest run ruta/al/test.test.ts`.

---

## ✅ Checklist UX & Backend

- [ ] ¿El componente incluye micro-animaciones y estados de hover?
- [ ] ¿Se gestionan adecuadamente los estados de carga y listas vacías?
- [ ] ¿Todas las peticiones HTTP usan `src/services/api.ts`?
- [ ] ¿El handler asíncrono tiene un bloque `try/catch` adecuado?
- [ ] ¿`npx tsc --noEmit` compila sin errores nuevos?
- [ ] ¿Cabe en 3 bloques el primer viewport móvil (~390px)? ¿Las acciones secundarias están detrás de un menú?
