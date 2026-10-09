/**
 * Menú de herramientas del estudio: acordes, IA, compartir, tutorial y atajos
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { FileText, Info, Keyboard, MessageSquare, Sliders, Sparkles } from "lucide-react";
import { getMemberReadiness, READINESS_LEVELS, ReadinessLevel, withMemberReadiness } from "../../utils/repertorioUtils";
import { MenuItem, Select } from "../ui";
import { PopoverAncla } from "../ui/PopoverAncla";
import { ShowIcon } from "../ui/ShowIcon";
import { useSongStudio } from "./SongStudioContext";

/**
 * Menú de herramientas del estudio: acordes, IA, compartir, tutorial y atajos
 * @returns Sección de interfaz.
 */
export function SongStudioToolsMenu() {
  const { setShowToolsMenu, showToolsMenu, onUpdateSong, song, currentUser, currentUsername, setShowChordsModal, setShowAiComposerModal, setShowAiMusicModal, setShowCubaseHelp, openTutorial, handleShareSong } = useSongStudio();
  return (
    <>
      {/* Menú Desplegable de Herramientas Secundarias */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowToolsMenu((prev) => !prev)}
          className="px-3 py-1 rounded-[var(--r-pill)] text-xs font-sans font-bold flex items-center gap-1.5 transition-ui cursor-pointer bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)]"
          title="Herramientas y opciones del Estudio"
        >
          <Sliders className="w-3.5 h-3.5 text-[var(--tentative)]" />
          <span>Herramientas <ShowIcon inline emoji="⚙️" /></span>
        </button>

        {showToolsMenu && (
          <PopoverAncla className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface)] rounded-[var(--r-m)] p-1.5 z-50 space-y-1 text-xs font-sans">
            <MenuItem
              tone="acc"
              dense
              type="button"
              onClick={() => {
                setShowToolsMenu(false);
                onUpdateSong({
                  ...song,
                  favoritoGeneral: !song.favoritoGeneral,
                });
              }}
            >
              <Sparkles className={`w-4 h-4 text-[var(--acc)] ${song.favoritoGeneral ? 'fill-[var(--acc)]' : ''}`} />
              {song.favoritoGeneral ? 'Quitar de Favoritos' : 'Marcar como Favorito'}
            </MenuItem>
            {/* Mi preparación: solo en móvil, en escritorio ya se ve en la cabecera */}
            <div className="sm:hidden px-1 pb-1">
              {(() => {
                const myKey = currentUser?.id || currentUser?.username;
                const myName = currentUser?.name || currentUser?.username || currentUsername;
                const myReadiness = getMemberReadiness(song, myKey, myName);
                return (
                  <Select
                    size="sm"
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
                    wrapperClassName="w-full"
                  >
                    <option value="" disabled>
                      Mi preparación…
                    </option>
                    {READINESS_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        <ShowIcon inline emoji={l.icon} /> {l.label}
                      </option>
                    ))}
                  </Select>
                );
              })()}
            </div>
            <MenuItem
              tone="acc"
              dense
              type="button"
              onClick={() => {
                setShowToolsMenu(false);
                setShowChordsModal(true);
              }}
            >
              <FileText className="w-4 h-4 text-[var(--acc)]" /> Acordes y Partitura
            </MenuItem>
            <MenuItem
              dense
              type="button"
              onClick={() => {
                setShowToolsMenu(false);
                setShowAiComposerModal(true);
              }}
            >
              <Sparkles className="w-4 h-4 text-[var(--tentative)]" /> Arreglos IA (músico virtual)
            </MenuItem>
            <MenuItem
              dense
              type="button"
              onClick={() => {
                setShowToolsMenu(false);
                setShowAiMusicModal(true);
              }}
            >
              <Sparkles className="w-4 h-4 text-[var(--tentative)]" /> Soundtrack IA (Lyria)
            </MenuItem>
            <MenuItem
              tone="muted"
              dense
              type="button"
              onClick={() => {
                setShowToolsMenu(false);
                setShowCubaseHelp(true);
              }}
            >
              <Keyboard className="w-4 h-4 text-[var(--ink-2)]" /> Atajos teclado (Cubase)
            </MenuItem>
            <MenuItem
              tone="muted"
              dense
              type="button"
              onClick={() => {
                setShowToolsMenu(false);
                openTutorial();
              }}
            >
              <Info className="w-4 h-4 text-[var(--ink-2)]" /> Guía rápida
            </MenuItem>
            <MenuItem
              tone="muted"
              dense
              type="button"
              onClick={() => {
                setShowToolsMenu(false);
                handleShareSong();
              }}
            >
              <MessageSquare className="w-4 h-4 text-[var(--ok)]" /> Compartir tema por WhatsApp
            </MenuItem>
          </PopoverAncla>
        )}
      </div>
    </>
  );
}
