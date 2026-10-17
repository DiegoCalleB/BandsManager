import { moduloDeBookingOculto } from "../../utils/bookingVisible";
import React, { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { AVAILABLE_MODULE_WIDGETS, type WidgetType } from "../../types/dashboardWidgets";
import { hasModuleAccess } from "../../utils/planPermissions";
import { useScrollLock } from "../../hooks/useScrollLock";
import { useVisualViewportOverlayStyle } from "../../hooks/useVisualViewportOverlayStyle";
import { IconButton } from "../ui";

const CATEGORIAS = [
  "Todos",
  "Música & Repertorio",
  "Booking & CRM",
  "Calendario & Agenda",
  "Negocio & Finanzas",
  "Público & Redes",
  "Promoción & IA",
];

interface AddWidgetModalProps {
  abierto: boolean;
  onCerrar: () => void;
  userPlan: string | undefined;
  /** Si la banda puede ver el booking (reservado); los widgets que lo necesitan no se ofrecen. */
  bookingVisible?: boolean;
  /** Tipos que ya están visibles en el panel: no se pueden añadir dos veces. */
  tiposEnPanel: ReadonlySet<WidgetType>;
  onAnadir: (tipo: WidgetType) => void;
}

/** Catálogo para añadir widgets al panel. Se queda abierto para añadir varios seguidos. */
export function AddWidgetModal({ abierto, onCerrar, userPlan, bookingVisible = true, tiposEnPanel, onAnadir }: AddWidgetModalProps) {
  useScrollLock(abierto);
  const addModalOverlayStyle = useVisualViewportOverlayStyle();
  const [selectedCategory, setSelectedCategory] = useState<string>("Todos");

  if (!abierto) return null;

  // Solo lo que el plan permite, filtrado por la categoría elegida.
  const allowedLibrary = AVAILABLE_MODULE_WIDGETS.filter((item) => !item.requiredModule || (hasModuleAccess(userPlan, item.requiredModule) && !moduloDeBookingOculto(item.requiredModule, bookingVisible)));
  const filteredLibrary = allowedLibrary.filter((item) => selectedCategory === "Todos" || item.category === selectedCategory);

  // z-[9999], no z-50: en móvil la barra del reproductor y la nav inferior van a z-40, pero
  // viven en un contexto de apilamiento propio de App.tsx — un z-50 local a este árbol no las
  // tapa. El resto de modales reales del repo (SongModal, BandSwitcherModal...) ya usan
  // z-[9999]/z-[10000] por este mismo motivo; este era el único que se había quedado en z-50.
  return (
    <div
      style={addModalOverlayStyle}
      className="z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4"
    >
      <div className="bg-[var(--surface)] rounded-[var(--r-l)] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--ink)]">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold font-display text-[var(--ink-2)]">
                Catálogo de widgets del dashboard
              </h3>
              <p className="text-xs font-sans text-[var(--ink-2)]">
                Añade los que quieras, uno detrás de otro — el catálogo no
                se cierra hasta que tú lo cierres
              </p>
            </div>
          </div>

          <IconButton
            label="Cerrar"
            type="button"
            onClick={onCerrar}
          >
            <X className="w-5 h-5" />
          </IconButton>
        </div>

        {/* Category Filter Pills — shrink-0 es la parte que importa: esta fila es hija de un
 flex flex-col (la caja del modal) y, al llevar overflow-x-auto, el navegador computa
 overflow-y como auto también (así lo pide la spec en cuanto un eje no es 'visible' y
 el otro se queda en su valor por defecto) — eso convierte la fila en "scroll container"
 y su alto mínimo automático en flexbox pasa a ser 0 en vez de basarse en su contenido,
 así que el flex la aplastaba a ~15px y la píldora "Todos" salía cortada. shrink-0
 saca la fila del cálculo de encogimiento por completo, sin depender de qué eje se
 compute como auto. */}
        <div className="p-4 bg-[var(--sunken)] flex gap-2 overflow-x-auto no-scrollbar shrink-0">
          {CATEGORIAS.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-[var(--r-pill)] text-xs font-sans font-bold whitespace-nowrap cursor-pointer transition-ui ${
                selectedCategory === cat
                  ? "bg-[var(--ink)] text-[var(--bg)]"
                  : "bg-[var(--surface)]/80 text-[var(--ink-2)] hover:text-[var(--ink-2)]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* List of Available Widgets */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {filteredLibrary.map((item) => {
            const isAlreadyAdded = tiposEnPanel.has(item.type);

            return (
              <div
                key={item.type}
                className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)]  transition-ui flex items-center justify-between gap-4"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[var(--ink-2)]">
                      {item.title}
                    </span>
                    <span className="text-micro font-sans px-2 py-0.5 rounded bg-[var(--surface)]/80 text-[var(--acc)]">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ink-2)] leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => onAnadir(item.type)}
                  disabled={isAlreadyAdded}
                  className={`px-3.5 py-2 rounded-[var(--r-pill)] font-sans text-xs font-bold transition-ui shrink-0 flex items-center gap-1 ${
                    isAlreadyAdded
                      ? "bg-[var(--surface)] text-[var(--ink-2)] cursor-default"
                      : "bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] cursor-pointer active:scale-[0.97]"
                  }`}
                >
                  {isAlreadyAdded ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>
                    {isAlreadyAdded ? "Ya en tu panel" : "Añadir"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 bg-[var(--sunken)] text-right">
          <button
            type="button"
            onClick={onCerrar}
            className="px-4 py-2 rounded-[var(--r-pill)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] font-sans text-xs font-bold cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
