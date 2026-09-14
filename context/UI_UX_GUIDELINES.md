# 🎨 UI/UX Guidelines - BandManager.io

> **Principio Cero:** La app hace MUCHAS cosas. La interfaz debe ser minimalista. Complejidad → backend.

---

## 1. Layout Primero (Content First)

### El Contenido Principal Va Arriba, Siempre

```tsx
// ✅ CORRECTO: Lo importante primero
export function RepertorioPage() {
  return (
    <div>
      {/* 1. CONTENIDO PRINCIPAL */}
      <div className="mb-8">
        <RepertorioTable songs={songs} />  ← La tabla que vinieron a ver
      </div>
      
      {/* 2. Estadísticas compactas + menú */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {songs.length} songs · {totalDuration} mins · {avgTempo} BPM
        </div>
        <MoreActionsMenu />  ← Compartir, exportar, etc.
      </div>
    </div>
  );
}

// ❌ MALO: Metadata/cabecera primero
export function RepertorioPage() {
  return (
    <div>
      {/* Estadísticas grandes al tope */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <Stat label="Songs" value={songs.length} />
        <Stat label="Duration" value={totalDuration} />
        {/* ... más stats */}
      </div>
      
      {/* La tabla queda abajo, debajo del fold */}
      <RepertorioTable songs={songs} />
    </div>
  );
}
```

### "Fold" en Móvil: Max 3 Bloques

En móvil (~390px width), lo primero que se ve sin scroll:

```
┌─────────────────────────┐
│ Compact header (50px)   │ ← Título mínimo + search
├─────────────────────────┤
│ Main content (250px)    │ ← Lo que vinieron a ver (tabla, lista, gráfico)
├─────────────────────────┤
│ Secondary actions (50px)│ ← Stats resumen + menú
│ (Scrollea para más)     │
└─────────────────────────┘
```

Si el contenido principal ocupa < 100px en móvil, el layout está mal.

---

## 2. Responsivo: Layouts Distintos, No Flex-Wraps

### ❌ MALO: Flex-wrap que se rompe en móvil

```tsx
export function LeadActions({ lead }) {
  return (
    <div className="flex gap-2">
      {/* En escritorio: 1 fila */}
      {/* En móvil: 6 filas (wrap) */}
      <button>Aprobar</button>
      <button>Rechazar</button>
      <button>Editar</button>
      <button>Ver Email</button>
      <button>Compartir</button>
      <button>Más</button>
    </div>
  );
}

// RESULTADO MÓVIL:
// Aprobar
// Rechazar
// Editar
// Ver Email
// Compartir
// Más
```

### ✅ CORRECTO: Layouts distintos por breakpoint

```tsx
export function LeadActions({ lead }) {
  return (
    <>
      {/* Desktop: botones todos visibles */}
      <div className="hidden sm:flex gap-2">
        <button>Aprobar</button>
        <button>Rechazar</button>
        <button>Editar</button>
        <button>Ver Email</button>
        <button>Compartir</button>
        <button className="ml-auto">
          <MoreMenu />  {/* Más opciones menos frecuentes */}
        </button>
      </div>
      
      {/* Móvil: botones principales + menú */}
      <div className="sm:hidden flex gap-2">
        <button className="flex-1">Aprobar</button>
        <button className="flex-1">Rechazar</button>
        <button className="flex-1">
          <MoreMenu />
        </button>
      </div>
    </>
  );
}
```

**Regla:** Si no cabe en móvil, no lo metas en un flex-wrap. Usa `hidden sm:flex` / `sm:hidden` para layouts distintos.

---

## 3. Acciones Secundarias: Detrás de Menú

### Lo Que Va Detrás de `⋯` / `⚙️`

```
Acciones primarias: < 3 y > 50% de los usos
  ✅ En pantalla permanente

Acciones secundarias: ≤ 2 y < 50% de los usos
  ✅ Detrás de menú (⋯)
  
Configuración / Settings / Exportar
  ✅ Detrás de menú (⚙️)
```

### Ejemplo: Repertorio

```tsx
export function RepertorioToolbar() {
  return (
    <div className="flex justify-between items-center mb-4">
      {/* Primarias: Estas se usan en casi TODAS las visitas */}
      <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded">
        ➕ Add Song
      </button>
      <input type="search" placeholder="Filtrar..." />
      
      {/* Secundarias: Menos frecuentes, detrás de menú */}
      <MoreActionsMenu
        options={[
          { label: 'Exportar Excel', onClick: handleExport },
          { label: 'Copiar setlist', onClick: handleCopy },
          { label: 'Settings', onClick: handleSettings },
          { label: 'Print', onClick: handlePrint },
        ]}
      />
    </div>
  );
}
```

---

## 4. Estadísticas: Línea Compacta + Desplegable

### Resumen en 1 Línea

```tsx
// ✅ COMPACTO: Solo lo que se mira siempre
<div className="text-sm text-gray-600">
  {songs.length} songs · {totalDuration} mins · {avgTempo} BPM
</div>

// Si quieren más stats:
<Collapsible>
  <CollapsibleTrigger>Ver más estadísticas</CollapsibleTrigger>
  <CollapsibleContent>
    <div className="grid grid-cols-2 gap-4">
      <Stat label="Key Distribution" value={keyChart} />
      <Stat label="Energy Levels" value={energyChart} />
      {/* ... más */}
    </div>
  </CollapsibleContent>
</Collapsible>

// ❌ PROHIBIDO: Batería de pills siempre visible
<div className="grid grid-cols-6 gap-2">
  <StatPill label="Songs" value={songs.length} />
  <StatPill label="Duration" value={totalDuration} />
  <StatPill label="Avg Tempo" value={avgTempo} />
  <StatPill label="Key" value={keyDist} />
  <StatPill label="Energy" value={avgEnergy} />
  <StatPill label="Genre" value={genre} />
</div>
```

---

## 5. Modals, Drawers & Sheets

### Cuándo Usar

```
Modal (center overlay):
  - Confirmación crítica (delete, confirm payment)
  - Decisión de sí/no
  - Urgente, bloquea

Drawer (slide from right):
  - Detalles (lead info, song editor)
  - Settings
  - No bloquea scroll del fondo

Sheet (bottom slide en móvil):
  - Opciones (sorter, filter)
  - Menos formal que modal
```

### Ejemplo: Lead Approval Modal

```tsx
export function ApprovalModal({ lead, onApprove, onReject }) {
  return (
    <dialog className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Título */}
        <div className="border-b p-4">
          <h2>Approve Lead: {lead.venue_name}</h2>
        </div>
        
        {/* Contenido (el pitch) */}
        <div className="p-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <h3 className="font-bold mb-2">Generated Pitch</h3>
            <textarea
              value={lead.pitch_generado}
              onChange={(e) => setPitch(e.target.value)}
              className="w-full h-32 p-2 border rounded"
            />
          </div>
        </div>
        
        {/* Acciones: abajo */}
        <div className="border-t p-4 flex gap-2">
          <button onClick={onReject} className="flex-1 bg-gray-200 px-4 py-2 rounded">
            Reject
          </button>
          <button onClick={() => onApprove(pitch)} className="flex-1 bg-green-500 text-white px-4 py-2 rounded">
            Approve & Send
          </button>
        </div>
      </div>
    </dialog>
  );
}
```

---

## 6. Formularios: Validación en Tiempo Real

```tsx
export function CreateLeadForm() {
  const [form, setForm] = useState({ venue_name: '', venue_email: '' });
  const [errors, setErrors] = useState({});
  
  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    
    // Validación en tiempo real (client-side)
    validateField(field, value, setErrors);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      {/* Campo con validación visual */}
      <div className="mb-4">
        <label>Venue Name</label>
        <input
          value={form.venue_name}
          onChange={(e) => handleChange('venue_name', e.target.value)}
          className={`w-full p-2 border rounded ${
            errors.venue_name ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.venue_name && (
          <p className="text-red-500 text-sm mt-1">{errors.venue_name}</p>
        )}
      </div>
      
      <button type="submit" disabled={!isFormValid()}>
        Create Lead
      </button>
    </form>
  );
}
```

---

## 7. Tooltips & Help Text

### No Vive en Pantalla

```tsx
// ❌ MALO: Help text permanente ocupa espacio
<div>
  <label>Cache Mínimo</label>
  <p className="text-sm text-gray-600">
    The minimum amount you're willing to accept.
    This is usually per band per night and is negotiable.
    Typical range is €100-500.
  </p>
  <input type="number" />
</div>

// ✅ CORRECTO: En tooltip
<div className="flex items-center gap-1">
  <label>Cache Mínimo</label>
  <Tooltip title="Mínimo que aceptas per concert. Típico: €100-500.">
    <span className="text-gray-400">ℹ️</span>
  </Tooltip>
</div>
<input type="number" />
```

---

## 8. Animaciones & Transiciones

### Motion (smooth, no distracting)

```tsx
import { motion } from 'framer-motion';

export function LeadCard({ lead }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className="p-4 border rounded-lg"
    >
      {lead.venue_name}
    </motion.div>
  );
}
```

**Regla:** Animaciones sutil (200-300ms), no distraiga de contenido.

---

## 9. Dark Mode

### SIEMPRE considerar dark mode

```tsx
// ✅ CORRECTO: Define ambos
<div className="bg-white dark:bg-slate-900 text-black dark:text-white">
  {children}
</div>

// Colores coherentes:
// - Backgrounds: white / slate-900
// - Text: black / white
// - Borders: gray-300 / gray-700
// - Accents: blue-500 (igual en ambos)
```

---

## 10. Checklist Pre-Merge (UI)

- [ ] Main content visible en móvil sin scroll
- [ ] Responsive: layouts distintos (`hidden sm:flex`), no flex-wrap
- [ ] Acciones secundarias detrás de menú (max 3 botones permanentes)
- [ ] Stats: línea compacta + desplegable
- [ ] Dark mode: probado en Chrome DevTools
- [ ] Animations smooth (no lag en móvil)
- [ ] Tooltips: invisible by default, tooltip on hover
- [ ] Loading states: spinner o skeleton (nunca UI muda)
- [ ] Error states: mensaje claro, no crash
- [ ] Móvil: testeado en breakpoint real (no solo DevTools)

---

