import React from "react";
import { SetlistItem } from "../../types";
import { SHOW_ITEM_TYPES } from "../../config/defaultRepertoire";
import { formatItemDuration } from "../../utils/repertorioUtils";
import { Button, IconButton } from "../ui";
import {
  GripVertical,
  Layers,
  Edit3,
  X,
  Timer,
  Lightbulb,
} from "lucide-react";
import ShowIcon from "../ui/ShowIcon";

export interface SetlistShowItemRowProps {
  item: SetlistItem;
  index: number;
  isSelected: boolean;
  isDragging: boolean;
  isDragOver: boolean;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onSelect: () => void;
  onUpdateTitle: (title: string) => void;
  onEdit: () => void;
  onRemove: () => void;
}

export const SetlistShowItemRow: React.FC<SetlistShowItemRowProps> = ({
  item,
  index,
  isSelected,
  isDragging,
  isDragOver,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onSelect,
  onUpdateTitle,
  onEdit,
  onRemove,
}) => {
  if (item.tipoItem === "bloque" && item.bloqueSubtipo === "header") {
    return (
      <div
        key={item.id}
        draggable={true}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
        onClick={onSelect}
        className={`rounded-[var(--r-s)] transition-ui cursor-pointer ${
          isDragging ? "opacity-40 scale-[0.98]" : ""
        } ${isDragOver ? "scale-[1.01] bg-[var(--acc)]/10" : ""} ${
          isSelected
            ? "ring-2 ring-[var(--acc)]/40 bg-[var(--sunken)]"
            : "bg-[var(--sunken)] hover:brightness-95"
        }`}
      >
        <div className="flex items-center gap-2 px-2.5 py-1.5">
          {/* Drag Handle */}
          <div
            className="cursor-grab active:cursor-grabbing text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors shrink-0"
            title="Arrastrar y soltar para reordenar"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="size-4" />
          </div>

          {/* Icon */}
          <Layers
            className="size-4 shrink-0 text-[var(--acc-ink)]"
            aria-hidden="true"
          />

          {/* Title input - inline */}
          <input
            data-raw
            type="text"
            value={item.tituloCustom || ""}
            placeholder="Ej: Bloque 1 · Calentamiento"
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => onUpdateTitle(e.target.value)}
            className="bg-transparent text-sm font-semibold font-sans text-[var(--ink)] placeholder:text-[var(--ink-2)] focus:outline-none min-w-0 flex-1"
          />

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Controls */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            title="Editar bloque"
            aria-label="Editar bloque"
            className="hidden sm:inline-flex"
          >
            <Edit3 className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            title="Eliminar bloque"
            aria-label="Eliminar bloque"
            className="hover:text-[var(--alert)]"
          >
            <X className="size-4" />
          </Button>
        </div>
      </div>
    );
  }

  const typeConfig = SHOW_ITEM_TYPES[item.tipoItem] || SHOW_ITEM_TYPES.otro;
  const durationText = formatItemDuration(item);

  return (
    <div
      key={item.id}
      draggable={true}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      className={`rounded-[var(--r-s)] transition-ui cursor-pointer ${typeConfig.bg} ${
        isDragging ? "opacity-40 scale-[0.98]" : ""
      } ${isDragOver ? "border-2 scale-[1.01]" : ""} ${
        isSelected ? "ring-2 ring-[var(--acc)]/60" : ""
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-2.5 py-2">
        {/* Drag Handle */}
        <div
          className="cursor-grab active:cursor-grabbing text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors shrink-0"
          title="Arrastrar y soltar para reordenar"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* Icon */}
        <span className={`shrink-0 ${typeConfig.text}`}>
          <ShowIcon emoji={typeConfig.icon} className="size-4" />
        </span>

        {/* Type Label */}
        <span
          className={`text-micro font-sans font-extrabold px-1.5 py-0.5 rounded-[var(--r-s)] shrink-0 ${typeConfig.text}`}
        >
          {typeConfig.label}
        </span>

        {/* Duration */}
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--ink-2)] tabular-nums">
          <Timer className="size-3.5" aria-hidden="true" />
          {durationText}
        </span>

        {/* Title - inline */}
        <input
          data-raw
          type="text"
          value={item.tituloCustom || ""}
          placeholder="Título/descripción…"
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onUpdateTitle(e.target.value)}
          className="bg-transparent text-sm font-semibold font-sans text-[var(--ink)] placeholder:text-[var(--ink-2)] focus:outline-none min-w-[9rem] flex-1 basis-[12rem]"
        />

        {isSelected && (
          <span className="px-1 py-0.5 rounded text-micro font-sans font-bold bg-[var(--acc)] text-[var(--on-acc)] shrink-0">
            <ShowIcon inline emoji="📌" />
          </span>
        )}

        {/* Controls */}
        <IconButton
          label="Editar detalles"
          size="icon-xs"
          onClick={onEdit}
          className="shrink-0"
        >
          <Edit3 className="w-3.5 h-3.5" />
        </IconButton>
        <IconButton
          label="Quitar del setlist"
          variant="danger"
          onClick={onRemove}
          className="shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </IconButton>
      </div>

      {/* SHOW NOTES IF EXIST */}
      {item.notaTema && (
        <div
          className="px-2.5 py-1 text-micro font-sans text-[var(--ink)]/70 truncate"
          title={item.notaTema}
        >
          <Lightbulb
            className="mr-1 inline size-3 align-[-1px]"
            aria-hidden="true"
          />
          {item.notaTema}
        </div>
      )}
    </div>
  );
};
