import React, { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { apiFetch } from "../../utils/api";
import { ModalPortal } from "../common/ModalPortal";
import { Button, IconButton } from "../ui";

type Accion = "completar" | "reemplazar" | "mantener" | "sin_sustituto";

interface ItemPlan {
  id: string;
  nombre: string;
  actual: string;
  accion: Accion;
  nuevo?: string;
}

interface SpotifySweepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplied: () => void;
}

const ETIQUETA: Record<Accion, string> = {
  completar: "Añadir",
  reemplazar: "Reemplazar",
  mantener: "Sin cambios",
  sin_sustituto: "Enlace roto, sin coincidencia",
};

/**
 * Busca el Spotify de las bandas que lo tienen vacío o roto, enseña el plan y solo guarda
 * lo que marques. El servidor recalcula cada enlace al aplicar: aquí no viaja ninguna URL.
 */
export const SpotifySweepModal: React.FC<SpotifySweepModalProps> = ({
  isOpen,
  onClose,
  onApplied,
}) => {
  const [cargando, setCargando] = useState(true);
  const [aplicando, setAplicando] = useState(false);
  const [plan, setPlan] = useState<ItemPlan[]>([]);
  const [marcadas, setMarcadas] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<string | null>(null);

  // Se monta solo al abrir (el padre lo renderiza condicionalmente): el estado inicial ya es
  // "cargando", así que el efecto no necesita resetear nada.
  useEffect(() => {
    apiFetch<{ success: boolean; plan: ItemPlan[] }>(
      "/api/bands/spotify-sweep",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apply: false }),
      },
    )
      .then((data) => {
        const items = data.plan || [];
        setPlan(items);
        setMarcadas(new Set(items.filter((i) => i.nuevo).map((i) => i.id)));
      })
      .catch(() =>
        setError(
          "No se pudo buscar en Spotify. Inténtalo de nuevo en unos minutos.",
        ),
      )
      .finally(() => setCargando(false));
  }, []);

  const aplicables = plan.filter((i) => i.nuevo);
  const sinSustituto = plan.filter((i) => i.accion === "sin_sustituto");

  const alternar = (id: string) =>
    setMarcadas((prev) => {
      const siguiente = new Set(prev);
      if (siguiente.has(id)) siguiente.delete(id);
      else siguiente.add(id);
      return siguiente;
    });

  const aplicar = async () => {
    setAplicando(true);
    setError(null);
    try {
      const data = await apiFetch<{ aplicadas: number; errores: number }>(
        "/api/bands/spotify-sweep",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ apply: true, ids: Array.from(marcadas) }),
        },
      );
      setResultado(
        `Guardadas ${data.aplicadas} bandas${data.errores ? ` (${data.errores} con error)` : ""}.`,
      );
      onApplied();
    } catch {
      setError("No se pudo guardar. No se ha cambiado nada.");
    } finally {
      setAplicando(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/60">
        <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-[var(--r-xl)] bg-[var(--surface)] font-sans">
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div>
              <h2 className="text-base font-bold text-[var(--ink)]">
                Spotify de tus bandas
              </h2>
              <p className="text-micro text-[var(--ink-2)]">
                Revisa los cambios propuestos. Solo se guarda lo que marques.
              </p>
            </div>
            <IconButton label="Cerrar" onClick={onClose}>
              <X className="w-4 h-4" />
            </IconButton>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-3">
            {cargando && (
              <div className="py-10 flex items-center justify-center gap-2 text-[var(--ink-2)] text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Buscando en
                Spotify…
              </div>
            )}

            {!cargando && !error && plan.length === 0 && (
              <p className="py-10 text-center text-sm text-[var(--ink-2)]">
                Todas tus bandas ya tienen un enlace de Spotify válido.
              </p>
            )}

            {!cargando && aplicables.length > 0 && (
              <ul className="divide-y divide-[var(--hair)]">
                {aplicables.map((i) => (
                  <li key={i.id} className="py-2.5 flex items-start gap-3">
                    <input
                      type="checkbox"
                      className="mt-1"
                      checked={marcadas.has(i.id)}
                      onChange={() => alternar(i.id)}
                      aria-label={`Guardar Spotify de ${i.nombre}`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-bold text-[var(--ink)] truncate">
                        {i.nombre}{" "}
                        <span className="font-normal text-micro text-[var(--ink-2)]">
                          · {ETIQUETA[i.accion]}
                        </span>
                      </div>
                      <div className="text-micro text-[var(--ink-2)] truncate">
                        {i.actual ? `${i.actual} → ` : ""}
                        {i.nuevo}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {!cargando && sinSustituto.length > 0 && (
              <div className="mt-4 text-micro text-[var(--ink-2)]">
                <div className="font-bold mb-1">
                  Sin coincidencia en Spotify ({sinSustituto.length}): no se
                  toca su enlace actual.
                </div>
                <div>{sinSustituto.map((i) => i.nombre).join(" · ")}</div>
              </div>
            )}

            {error && (
              <p className="mt-4 text-sm text-[var(--alert)]">{error}</p>
            )}
            {resultado && (
              <p className="mt-4 text-sm text-[var(--ok)]">{resultado}</p>
            )}
          </div>

          <div className="px-5 py-4 flex items-center justify-between gap-3">
            <span className="text-micro text-[var(--ink-2)]">
              {marcadas.size} marcadas
            </span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose}>
                Cerrar
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={aplicar}
                disabled={
                  aplicando || cargando || marcadas.size === 0 || !!resultado
                }
              >
                {aplicando ? "Guardando…" : `Guardar ${marcadas.size}`}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
};
