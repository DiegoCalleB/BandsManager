/**
 * Mi nivel de preparación con la canción: cada miembro opina por sí mismo
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { getMemberReadiness, READINESS_LEVELS, ReadinessLevel, withMemberReadiness } from "../../utils/repertorioUtils";
import { ShowIcon } from "../ui/ShowIcon";
import { useSongStudio } from "./SongStudioContext";

/**
 * Mi nivel de preparación con la canción: cada miembro opina por sí mismo
 * @returns Sección de interfaz.
 */
export function SongStudioReadinessSelect() {
  const { currentUser, currentUsername, song, onUpdateSong } = useSongStudio();
  return (
    <>
      {/* Mi nivel de preparación con esta canción — cada miembro opina por sí mismo, no
     es un estado global (ya existe song.estadoTema para eso). Sirve para que quien
     lleva la banda vea de un vistazo quién necesita repasar antes del bolo.
     En móvil se oculta de la cabecera y vive dentro de Herramientas. */}
      {(() => {
        const myKey = currentUser?.id || currentUser?.username;
        const myName = currentUser?.name || currentUser?.username || currentUsername;
        const myReadiness = getMemberReadiness(song, myKey, myName);
        const levelInfo = READINESS_LEVELS.find((l) => l.value === myReadiness);
        return (
          <select data-raw
            value={myReadiness || ''}
            onChange={(e) => {
              const val = e.target.value as ReadinessLevel;
              if (!val) return;
              onUpdateSong({
                ...song,
                notasPorMiembro: withMemberReadiness(song, myKey, myName, val),
              });
            }}
            title="Tu nivel de preparación con esta canción, de cara al próximo bolo"
            className={`hidden sm:inline-block px-2.5 py-1 rounded-[var(--r-m)] text-xs font-sans font-bold cursor-pointer outline-none ${
              levelInfo ? levelInfo.colorClass : 'bg-[var(--ink)]/5 text-[var(--ink-2)]'
            }`}
          >
            <option value="" disabled>
              Mi preparación…
            </option>
            {READINESS_LEVELS.map((l) => (
              <option key={l.value} value={l.value}>
                <ShowIcon inline emoji={l.icon} /> {l.label}
              </option>
            ))}
          </select>
        );
      })()}
    </>
  );
}
