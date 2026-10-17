/**
 * Seguidores de Spotify anotados a mano. Spotify no los entrega a esta app (modo desarrollo),
 * así que se apuntan una vez al mes y quedan en el histórico de métricas de la banda.
 */
import { useState } from "react";
import { apiFetch } from "../../utils/api";
import { Button, Input } from "../ui";

interface SeguidoresSpotifyManualProps {
  bandId: string;
  actual?: number | null;
  onGuardado: () => void;
}

/**
 * Botón que abre un campo para anotar los seguidores de Spotify de la banda este mes.
 * @returns Sección de interfaz.
 */
export function SeguidoresSpotifyManual({ bandId, actual, onGuardado }: SeguidoresSpotifyManualProps) {
  const [abierto, setAbierto] = useState(false);
  const [valor, setValor] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");

  const abrir = () => {
    setValor(actual != null ? String(actual) : "");
    setError("");
    setAbierto(true);
  };

  const guardar = async () => {
    setGuardando(true);
    setError("");
    try {
      await apiFetch(`/api/bands/${encodeURIComponent(bandId)}/metricas/seguidores`, {
        method: "PUT",
        body: JSON.stringify({ seguidores: valor.trim() }),
      });
      onGuardado();
      setAbierto(false);
    } catch {
      setError("No se pudo guardar. Revisa que sea un número entero.");
    } finally {
      setGuardando(false);
    }
  };

  if (!abierto) {
    return (
      <Button variant="ghost" size="xs" onClick={abrir} title="Spotify no da los seguidores a la app: anótalos tú">
        {actual != null ? "Corregir seguidores de Spotify" : "Anotar seguidores de Spotify"}
      </Button>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Input
        type="number"
        inputMode="numeric"
        min={0}
        step={1}
        size="sm"
        className="w-32"
        aria-label="Seguidores en Spotify"
        placeholder="Seguidores"
        value={valor}
        onChange={(e) => setValor(e.target.value)}
      />
      <Button variant="soft" size="xs" onClick={guardar} disabled={guardando || valor.trim() === ""}>
        Guardar
      </Button>
      <Button variant="ghost" size="xs" onClick={() => setAbierto(false)} disabled={guardando}>
        Cancelar
      </Button>
      {error && (
        <span role="alert" className="text-micro text-[var(--alert)]">
          {error}
        </span>
      )}
    </div>
  );
}
