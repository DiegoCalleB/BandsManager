import React from "react";
import { createPortal } from "react-dom";
import {
  GripVertical,
  Play,
  Check,
  AlertTriangle,
  Pin,
  Users,
  Headphones,
  Edit3,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  X,
  Lightbulb,
  FileText,
} from "lucide-react";
import { Button, IconButton, Input, ShowIcon } from "../ui";
import { formatSongTitle } from "../../utils/formatSongTitle";
import { getEnergyInfo } from "../../utils/energyPacingUtils";
import { evaluarCalidadUnion } from "../../utils/setlistCompatibility";
import { isSongMarkedForMember } from "../../utils/repertorioUtils";
import { Song, SetlistItem } from "../../types";

export interface SetlistSongRowProps {
  item: SetlistItem;
  index: number;
  song: Song;
  songIndex: number;
  // Drag & drop
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  // Selection & expansion
  isSelected: boolean;
  onSelect: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  // Playback
  isPlaying: boolean;
  onPlay: () => void;
  // Key popover
  isEditingKey: boolean;
  keyPopoverPos: { top: number; left: number } | null;
  onToggleKeyPopover: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onSetTonalidadDeseada: (key: string | null) => void;
  // Energy popover
  isEditingEnergy: boolean;
  energyPopoverPos: { top: number; left: number; openUpward: boolean } | null;
  isSavingEnergy: boolean;
  onToggleEnergyPopover: (e: React.MouseEvent<HTMLButtonElement>) => void;
  onSetEnergiaManual: (val: number) => void;
  // Transitions
  prevSong?: Song;
  onOpenTransitionPreview?: () => void;
  // Item actions
  onRemove: () => void;
  onUpdateNote: (note: string) => void;
  onEditSong: () => void;
  onOpenStudio: () => void;
  onOpenMemberNotes: () => void;
  onOpenChords: () => void;
  // User context
  currentUser?: { id?: string; name?: string };
  onToggleDuda?: () => void;
}

export const SetlistSongRow: React.FC<SetlistSongRowProps> = ({
  item,
  index,
  song,
  songIndex,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isSelected,
  onSelect,
  isExpanded,
  onToggleExpand,
  isPlaying,
  onPlay,
  isEditingKey,
  keyPopoverPos,
  onToggleKeyPopover,
  onSetTonalidadDeseada,
  isEditingEnergy,
  energyPopoverPos,
  isSavingEnergy,
  onToggleEnergyPopover,
  onSetEnergiaManual,
  prevSong,
  onOpenTransitionPreview,
  onRemove,
  onUpdateNote,
  onEditSong,
  onOpenStudio,
  onOpenMemberNotes,
  onOpenChords,
  currentUser,
  onToggleDuda,
}) => {
  const memberNotesCount = song.notasMiembros
    ? Object.values(song.notasMiembros).filter(
        (v) => typeof v === "string" && v.trim().length > 0,
      ).length
    : 0;

  // Calculo de tono deseado y opciones de tono
  const desiredKey = item.tonalidadDeseada;
  const rawOrigKey = (song.tonalidad || "").trim();
  const isEsKey = /^(Do|Re|Mi|Fa|Sol|La|Si)/i.test(rawOrigKey);
  const baseRoots = isEsKey
    ? [
        "Do",
        "Do#",
        "Re",
        "Re#",
        "Mi",
        "Fa",
        "Fa#",
        "Sol",
        "Sol#",
        "La",
        "La#",
        "Si",
      ]
    : [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B",
      ];
  const keyMatch = rawOrigKey.match(
    /^(Do#|Re#|Fa#|Sol#|La#|Do|Re|Mi|Fa|Sol|La|Si|C#|D#|F#|G#|A#|Db|Eb|Gb|Ab|Bb|C|D|E|F|G|A|B)(.*)$/i,
  );
  const keySuffix = keyMatch ? keyMatch[2] : "";
  const keyNotes = baseRoots.map((root) => `${root}${keySuffix}`);

  // Calculo de info de energía
  const energy = getEnergyInfo(song);
  const currentVal1a10 = Math.max(
    1,
    Math.min(10, Math.round((song.energia || 10) / 2)),
  );

  // Calidad de transición con la canción anterior
  const evalUnion = prevSong ? evaluarCalidadUnion(prevSong, song) : null;

  return (
    <div
      draggable={true}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`group rounded-[var(--r-m)] transition-ui cursor-pointer ${
        isDragging ? "opacity-40 scale-[0.98]" : ""
      } ${isDragOver ? "scale-[1.01] bg-[var(--ok)]/10" : ""} ${
        isSelected
          ? "ring-2 ring-[var(--acc)]/20 bg-[var(--ok)]/10"
          : "bg-[var(--surface)] hover:bg-[var(--surface)]/80"
      }`}
    >
      {/* MAIN ROW - COMPACT */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 px-3 py-2.5">
        {/* Drag Handle */}
        <div
          className="cursor-grab active:cursor-grabbing text-[var(--ink-2)] hover:text-[var(--ok)] transition-colors shrink-0"
          title="Arrastrar y soltar para reordenar"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Index / Play */}
        <button
          data-raw
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onPlay();
          }}
          className="w-6 h-6 rounded-[var(--r-pill)] flex items-center justify-center shrink-0 transition-ui cursor-pointer bg-[var(--acc-soft)] text-[var(--acc-ink)] sm:bg-transparent sm:group-hover:bg-[var(--ok)] sm:group-hover:text-[var(--ink)]"
          title={isPlaying ? "Sonando ahora" : "Reproducir esta canción"}
        >
          {isPlaying ? (
            <div className="flex items-center gap-0.5">
              <span className="w-0.5 h-2 bg-[var(--ok)] rounded-[var(--r-pill)]" />
              <span className="w-0.5 h-2.5 bg-[var(--ok)] rounded-[var(--r-pill)] delay-75" />
              <span className="w-0.5 h-1.5 bg-[var(--ok)] rounded-[var(--r-pill)] delay-150" />
            </div>
          ) : (
            <>
              <span className="hidden sm:inline sm:group-hover:hidden text-xs font-semibold text-[var(--ink-2)]">
                {songIndex + 1}
              </span>
              <Play className="w-3 h-3 fill-current sm:hidden sm:group-hover:block ml-0.5 text-[var(--ink)]" />
            </>
          )}
        </button>

        {/* Title + metadata */}
        <span
          className="min-w-0 flex-1 basis-32 truncate text-sm font-semibold text-[var(--ink)] sm:max-w-[240px] sm:flex-none"
          title={formatSongTitle(song.titulo)}
        >
          {formatSongTitle(song.titulo)}
        </span>

        {/* Key selector popover */}
        <div className="relative shrink-0">
          <button
            type="button"
            data-key-popover
            onClick={onToggleKeyPopover}
            className={`text-micro font-sans px-1.5 py-0.5 rounded font-bold shrink-0 cursor-pointer transition hover:ring-1 hover:ring-[var(--ink)]/40 ${
              desiredKey
                ? "bg-[var(--acc-soft)] text-[var(--acc-ink)]"
                : "bg-[var(--sunken)] text-[var(--ink)]"
            }`}
            title={
              desiredKey
                ? `Original: ${song.tonalidad || "—"} · Tocar en este repertorio: ${desiredKey}. Clic para cambiar.`
                : "Tonalidad original. Clic para definir en qué tono tocarla en este repertorio (transposición automática)."
            }
          >
            {desiredKey
              ? `${song.tonalidad || "—"} → ${desiredKey}`
              : song.tonalidad || "—"}
          </button>
          {isEditingKey &&
            keyPopoverPos &&
            createPortal(
              <div
                data-key-popover
                className="fixed z-[100] bg-[var(--sunken)] rounded-[var(--r-s)] p-2 space-y-1.5 w-[200px]"
                style={{
                  top: keyPopoverPos.top,
                  left: keyPopoverPos.left,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <p className="text-micro font-sans text-[var(--ink-2)] px-0.5">
                  Tocar en tono (original: {song.tonalidad || "—"}):
                </p>
                <div className="grid grid-cols-4 gap-1">
                  {keyNotes.map((note) => (
                    <button
                      key={note}
                      type="button"
                      onClick={() => onSetTonalidadDeseada(note)}
                      className={`px-1 py-1 rounded text-micro font-sans font-bold transition cursor-pointer ${
                        desiredKey === note
                          ? "bg-[var(--ink)] text-[var(--bg)]"
                          : "bg-[var(--surface)]/80 text-[var(--ink)] hover:bg-[var(--surface)]/70"
                      }`}
                    >
                      {note}
                    </button>
                  ))}
                </div>
                {desiredKey && (
                  <button
                    type="button"
                    onClick={() => onSetTonalidadDeseada(null)}
                    className="w-full text-center text-micro font-sans text-[var(--ink-2)] hover:text-[var(--alert)] pt-1.5 cursor-pointer"
                  >
                    Volver al original ({song.tonalidad || "—"})
                  </button>
                )}
              </div>,
              document.body,
            )}
        </div>

        {/* Verification of structure badge */}
        {song.estructuraDocumentoUrl && (
          <span
            className={`text-micro font-sans px-1 py-0.5 rounded shrink-0 ${
              song.estructuraVerificada
                ? "bg-[var(--ok)]/15 text-[var(--ink)]"
                : "bg-[var(--acc)]/15 text-[var(--ink)]"
            }`}
            title={
              song.estructuraVerificada
                ? "Acordes verificados"
                : "Acordes sin verificar — revísalos antes de tocarla en directo"
            }
          >
            {song.estructuraVerificada ? (
              <Check className="size-3" aria-label="Acordes verificados" />
            ) : (
              <AlertTriangle
                className="size-3"
                aria-label="Acordes sin verificar"
              />
            )}
          </span>
        )}

        <span
          className="shrink-0 text-xs tabular-nums text-[var(--ink-2)]"
          title="BPM"
        >
          {song.bpm ? `${song.bpm}` : "—"}
        </span>

        <span
          className="shrink-0 text-xs font-medium tabular-nums text-[var(--ink)]"
          title="Duración"
        >
          {song.duracion || "0:00"}
        </span>

        {/* Energy Popover */}
        <div className="relative shrink-0">
          <button
            type="button"
            data-energy-popover
            onClick={onToggleEnergyPopover}
            className={`text-micro font-sans px-1 py-0.5 rounded font-bold shrink-0 cursor-pointer transition hover:ring-1 hover:ring-[var(--ink)]/40 ${energy.bgClass} ${energy.textClass}`}
            title={`Energía: ${energy.label} (${currentVal1a10}/10)${song.energiaManual ? " — fijada a mano" : ""}. Clic para cambiarla.`}
          >
            <span>
              <ShowIcon inline emoji={energy.icon} />
            </span>
            {song.energiaManual && (
              <span className="ml-0.5" title="Energía fijada a mano">
                <ShowIcon inline emoji="✋" />
              </span>
            )}
          </button>
          {isEditingEnergy &&
            energyPopoverPos &&
            createPortal(
              <div
                data-energy-popover
                className="fixed z-[100] bg-[var(--sunken)] rounded-[var(--r-s)] p-1.5 flex items-center gap-0.5"
                style={{
                  top: energyPopoverPos.top,
                  left: energyPopoverPos.left,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {Array.from({ length: 10 }, (_, i) => i + 1).map((val) => (
                  <button
                    key={val}
                    type="button"
                    disabled={isSavingEnergy}
                    onClick={() => onSetEnergiaManual(val)}
                    className={`w-5 h-5 rounded text-micro font-sans font-bold flex items-center justify-center transition disabled:opacity-50 ${
                      currentVal1a10 === val
                        ? "bg-[var(--ink)] text-[var(--bg)]"
                        : "bg-[var(--surface)]/80 text-[var(--ink)] hover:bg-[var(--surface)]/70"
                    }`}
                  >
                    {val}
                  </button>
                ))}
              </div>,
              document.body,
            )}
        </div>

        {isSelected && (
          <span
            className="shrink-0 text-[var(--acc-ink)]"
            title="Seleccionada: lo que añadas irá debajo"
          >
            <Pin className="size-3.5" aria-hidden="true" />
          </span>
        )}

        <div className="flex-1"></div>

        {memberNotesCount > 0 && (
          <span
            className="text-[var(--acc)]/70 shrink-0"
            title={`${memberNotesCount} nota(s) de miembros`}
          >
            <Users className="w-3 h-3" />
          </span>
        )}

        {/* Studio button */}
        <IconButton
          label="Abrir Studio de grabación multipista y pistas"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenStudio();
          }}
          className="shrink-0"
        >
          <Headphones className="w-3.5 h-3.5 text-[var(--ok)]" />
        </IconButton>

        {/* Probar unión con tema anterior */}
        {index > 0 && prevSong && onOpenTransitionPreview && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenTransitionPreview();
            }}
            className={`px-1.5 py-0.5 rounded-[var(--r-pill)] text-micro font-sans font-bold flex items-center gap-1 transition-ui cursor-pointer shrink-0 ${
              evalUnion?.status === "ok"
                ? "bg-[var(--ok)]/15 hover:bg-[var(--ok)]/25 text-[var(--ink)]"
                : "bg-[var(--alert)]/15 hover:bg-[var(--alert)]/25 text-[var(--ink)]"
            }`}
            title={
              evalUnion
                ? `🎧 Probar unión con #${index} (${prevSong.titulo}): ${evalUnion.title} · ${evalUnion.motivos.join(", ")}`
                : "Probar unión y transición con la canción anterior"
            }
          >
            <span>{evalUnion?.icon || "⚡"}</span>
            <Headphones className="w-3 h-3" />
          </button>
        )}

        {/* Edit song button */}
        <IconButton
          label="Editar canción"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEditSong();
          }}
          className="shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </IconButton>

        {/* "Me da dudas" */}
        {currentUser?.name && onToggleDuda && (() => {
          const dudaMarcada = isSongMarkedForMember(
            song,
            currentUser.id,
            currentUser.name,
          );
          return (
            <IconButton
              label={dudaMarcada ? "Quitar de mis dudas" : "Me da dudas"}
              aria-pressed={dudaMarcada}
              onClick={(e) => {
                e.stopPropagation();
                onToggleDuda();
              }}
              className={`shrink-0 ${dudaMarcada ? "text-[var(--accent-alt)]" : ""}`}
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </IconButton>
          );
        })()}

        {/* Expand button for details */}
        <Button
          variant="ghost"
          size="xs"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="shrink-0"
          title={
            isExpanded
              ? "Ocultar detalles"
              : "Ver afinación, disco, cantante, acordes y notas de miembros"
          }
        >
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </Button>

        <IconButton
          label="Quitar del setlist"
          variant="danger"
          onClick={onRemove}
          className="shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </IconButton>
      </div>

      {/* Aviso al director: cuántos músicos marcaron este tema como "me da dudas" */}
      {(() => {
        const dudan = (song.notasPorMiembro ?? []).filter(
          (n) => n.mostrarTono || n.mostrarBpm,
        );
        if (dudan.length === 0) return null;
        const nombres = dudan
          .map((n) => n.memberName)
          .filter(Boolean)
          .join(", ");
        return (
          <div
            className="px-2.5 pt-1.5 text-micro font-sans text-[var(--accent-alt)]"
            title={nombres ? `Dudan: ${nombres}` : undefined}
          >
            <HelpCircle
              className="mr-1 inline size-3 align-[-1px]"
              aria-hidden="true"
            />
            {dudan.length === 1
              ? "1 músico duda"
              : `${dudan.length} músicos dudan`}
            {nombres ? ` · ${nombres}` : ""}
          </div>
        );
      })()}

      {/* ALWAYS SHOW NOTES IF EXIST - Compact line */}
      {(() => {
        const userNote =
          currentUser?.name &&
          song.notasMiembros?.[currentUser.name.toLowerCase()];
        const hasMemberNotes =
          Array.isArray(song.notasPorMiembro) &&
          song.notasPorMiembro.length > 0;
        return song.notasRepertorio ||
          item.notaTema ||
          userNote ||
          hasMemberNotes ? (
          <div
            className="px-2.5 py-1.5 text-micro font-sans space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {song.notasRepertorio && (
              <div
                className="text-[var(--accent-alt)]/80 truncate"
                title={song.notasRepertorio}
              >
                <ShowIcon inline emoji="📝" />
                {song.notasRepertorio}
              </div>
            )}
            {userNote && (
              <div
                className="text-[var(--ok)]/80 truncate"
                title={userNote}
              >
                <ShowIcon inline emoji="👤" />
                {currentUser.name}: {userNote}
              </div>
            )}
            {item.notaTema && (
              <div
                className="text-[var(--ok)]/80 truncate"
                title={item.notaTema}
              >
                <Lightbulb
                  className="mr-1 inline size-3 align-[-1px]"
                  aria-hidden="true"
                />
                {item.notaTema}
              </div>
            )}
            {hasMemberNotes && (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {song.notasPorMiembro!.map((m, mIdx) => (
                  <span
                    key={m.userId || m.memberName || mIdx}
                    className="inline-flex items-center gap-1 bg-[var(--acc-soft)] text-[var(--acc-ink)] px-1.5 py-0.5 rounded-[var(--r-pill)] text-micro"
                  >
                    <b>[{m.instrument || m.memberName}]:</b> {m.nota}
                  </span>
                ))}
              </div>
            )}
          </div>
        ) : null;
      })()}

      {/* EXPANDED DETAILS - Only when isExpanded */}
      {isExpanded && (
        <div
          className={`px-2.5 py-2 text-micro font-sans space-y-1 bg-[var(--bg)]`}
        >
          {song.cantantePrincipal && (
            <div className="text-[var(--ink-2)]">
              <span className="font-bold text-[var(--ink-2)]">
                Cantante:
              </span>{" "}
              {song.cantantePrincipal}
            </div>
          )}
          {song.afinacion && (
            <div className="text-[var(--ink-2)]">
              <span className="font-bold text-[var(--ink-2)]">
                Afinación:
              </span>{" "}
              {song.afinacion}
            </div>
          )}
          {song.albumDisco && (
            <div className="text-[var(--ink-2)]">
              <span className="font-bold text-[var(--ink-2)]">
                Disco:
              </span>{" "}
              {song.albumDisco}
            </div>
          )}

          <Input
            size="sm"
            type="text"
            placeholder="Nota para este bolo (ej. Cambio a acústica / empalmar solo)…"
            value={item.notaTema || ""}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdateNote(e.target.value)}
            className="w-full mt-1"
          />

          {/* Notas de miembros / acordes / studio */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMemberNotes();
              }}
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors ${
                memberNotesCount > 0
                  ? "text-[var(--acc)]/70 hover:text-[var(--acc)]"
                  : "text-[var(--ink-2)] hover:text-[var(--acc)]/70"
              }`}
            >
              <Users className="w-3 h-3" /> Notas de miembros
              {memberNotesCount > 0 ? ` (${memberNotesCount})` : ""}
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenChords();
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[var(--ink-2)] hover:text-[var(--ok)] transition-colors"
            >
              <FileText className="w-3 h-3" /> Acordes
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenStudio();
              }}
              className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[var(--ink-2)] hover:text-[var(--ok)] transition-colors"
            >
              <Headphones className="w-3 h-3 text-[var(--ok)]" /> Studio multipista
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
