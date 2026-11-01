/**
 * Escribe el acorde de la casilla elegida en la rejilla de compases: si falta un Do, se toca el
 * tiempo, se escribe «C» (o «Do») y Enter. Vale para añadir, cambiar o quitar un acorde; se guarda
 * para toda la banda.
 */
import { useState } from "react";

const PILDORA = "px-3 py-2 min-h-11 rounded-[var(--r-pill)] bg-[var(--surface)] text-xs font-bold text-[var(--ink)] cursor-pointer transition-ui hover:bg-[var(--acc-soft)] active:bg-[var(--acc-soft)] disabled:opacity-40 disabled:cursor-default";

interface Props {
  /** Acorde actual de la casilla, ya formateado; vacío si no hay. */
  actual: string;
  /** Compás y tiempo, para decir a qué casilla se refiere. */
  lugar: string;
  /** Aplica lo escrito; devuelve false si no es un acorde reconocible o no cambia nada. */
  onAplicar: (texto: string) => boolean;
  /** Compases iguales del bloque donde se puede poner lo mismo; con 0 no se ofrece. */
  hermanos?: number;
  onHermanos?: () => void;
  onCerrar: () => void;
}

/**
 * Campo de texto para poner o corregir el acorde de una casilla.
 * @returns Sección de interfaz.
 */
export function EditorAcordeCasilla({ actual, lugar, onAplicar, hermanos = 0, onHermanos, onCerrar }: Props) {
  const [texto, setTexto] = useState("");
  const [error, setError] = useState(false);
  const aplicar = (valor: string) => {
    if (onAplicar(valor)) { setTexto(""); setError(false); } else setError(true);
  };
  return (
    <form
      aria-label={`Corregir el acorde de ${lugar}`}
      onSubmit={(e) => { e.preventDefault(); aplicar(texto); }}
      onKeyDown={(e) => { if (e.key === "Escape") onCerrar(); }}
      className="flex flex-wrap items-center gap-1.5 rounded-[var(--r-m)] bg-[var(--sunken)] px-3 py-2"
    >
      <label htmlFor="acorde-casilla" className="text-sm font-bold text-[var(--ink)] mr-1">
        {lugar}: {actual || "sin acorde"}
      </label>
      <input
        id="acorde-casilla"
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setError(false); }}
        placeholder="Escribe el acorde: C, Am7, Do, Sib…"
        autoComplete="off"
        autoCapitalize="characters"
        spellCheck={false}
        aria-invalid={error || undefined}
        className="min-h-11 flex-1 min-w-40 rounded-[var(--r-s)] bg-[var(--surface)] px-3 text-sm text-[var(--ink)] placeholder:text-[var(--ink-3)]"
      />
      <button type="submit" className={`${PILDORA} text-[var(--acc-ink)]`} disabled={!texto.trim()}>Poner</button>
      {hermanos > 0 && onHermanos && (
        <button type="button" className={`${PILDORA} text-[var(--acc-ink)]`} onClick={onHermanos}>
          Igual en {hermanos} {hermanos === 1 ? "compás más" : "compases más"}
        </button>
      )}
      <button type="button" className={PILDORA} onClick={() => aplicar("N")}>Quitar acorde</button>
      <button type="button" className={`${PILDORA} text-[var(--ink-2)]`} onClick={onCerrar}>Listo</button>
      {error && <p role="alert" className="basis-full text-xs text-[var(--alert)]">Eso no es un acorde que conozca. Prueba con C, Am, G7, F#m, Do o Sib.</p>}
    </form>
  );
}
