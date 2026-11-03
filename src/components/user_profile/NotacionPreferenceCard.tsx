import { Check } from "lucide-react";
import { useNotacion } from "../../hooks/useNotacion";
import { formatearAcorde, type Notacion } from "../../utils/notacionAcordes";

const OPCIONES: { id: Notacion; titulo: string }[] = [
  { id: "EN", titulo: "Americana" },
  { id: "ES", titulo: "Española" },
];
const EJEMPLO = ["E", "Em", "F#m", "G7", "Bb"];

/** Notación de acordes y tonalidades que ve esta persona: una sola en toda la app, nunca mezclada. */
export function NotacionPreferenceCard() {
  const [notacion, setNotacion] = useNotacion();
  return (
    <div className="pt-3">
      <div className="p-3.5 rounded-[var(--r-m)] bg-[var(--acc)]/[0.04] space-y-2.5">
        <label className="text-xs font-sans font-semibold text-[var(--acc)]/70">Notación de acordes y tonalidades</label>
        <p className="text-xs text-[var(--ink-2)] leading-relaxed">
          Elige cómo ves los acordes y las tonalidades en todas las pantallas. Lo guardado no cambia: solo cómo se muestra.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {OPCIONES.map((o) => {
            const activa = notacion === o.id;
            return (
              <button
                key={o.id}
                type="button"
                aria-pressed={activa}
                onClick={() => setNotacion(o.id)}
                className={`p-2 rounded-[var(--r-m)] text-left transition-ui cursor-pointer space-y-1 ${activa ? "bg-[var(--acc)]/15 text-[var(--ink)] font-bold" : "bg-[var(--ink)]/5 text-[var(--ink-2)]"}`}
              >
                <span className="flex items-center justify-between text-xs">
                  {o.titulo}
                  {activa && <Check className="w-3.5 h-3.5 text-[var(--acc)]" />}
                </span>
                <span className="block text-[11px] font-mono opacity-70">{EJEMPLO.map((a) => formatearAcorde(a, o.id)).join("  ")}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
