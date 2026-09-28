import React, { useState, useEffect } from "react";
import { X } from "lucide-react";

interface ShowItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  colors: any;
  editingShowItem: any;
  setEditingShowItem: (item: any) => void;
  handleSaveShowItem: (itemData: any) => void;
}

export const ShowItemModal: React.FC<ShowItemModalProps> = ({
  isOpen,
  onClose,
  colors,
  editingShowItem,
  setEditingShowItem,
  handleSaveShowItem,
}) => {
  const [title, setTitle] = useState("");
  const [type, setType] = useState("interlude");
  const [durationMin, setDurationMin] = useState<number | "">(2);
  const [notes, setNotes] = useState("");
  const [tuning, setTuning] = useState("");
  const [key, setKey] = useState("");
  const [tempo, setTempo] = useState<number | "">(120);

  useEffect(() => {
    if (editingShowItem) {
      setTitle(editingShowItem.title || editingShowItem.nombre || "");
      setType(editingShowItem.itemType || "interlude");
      setDurationMin(editingShowItem.durationMin || Math.round((editingShowItem.duracionSegundos || 120) / 60));
      setNotes(editingShowItem.notes || editingShowItem.notas || "");
      setTuning(editingShowItem.tuning || "");
      setKey(editingShowItem.key || editingShowItem.tono || "");
      setTempo(editingShowItem.tempo || editingShowItem.bpm || 120);
    } else {
      setTitle("");
      setType("interlude");
      setDurationMin(2);
      setNotes("");
      setTuning("");
      setKey("");
      setTempo(120);
    }
  }, [editingShowItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSaveShowItem({
      title,
      itemType: type,
      durationMin: Number(durationMin) || 0,
      duracionSegundos: (Number(durationMin) || 0) * 60,
      notes,
      tuning,
      key,
      tono: key,
      tempo: Number(tempo) || 0,
      bpm: Number(tempo) || 0,
      isNonSongItem: true,
    });
    onClose();
    setEditingShowItem(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className={`w-full max-w-lg p-6 rounded-2xl space-y-4 shadow-2xl ${colors.card} border border-sky-500/30`}>
        <div className="flex justify-between items-center pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">⚡</span>
            <div>
              <h3 className={`text-sm font-extrabold font-mono uppercase ${colors.text}`}>
                {editingShowItem ? "Editar Interludio / Evento del Show" : "Nuevo Interludio / Bloque del Show"}
              </h3>
              <p className="text-[10px] text-neutral-400 font-sans">
                Organiza momentos del directo (beatbox, presentaciones, bloque de temas, pausas).
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              onClose();
              setEditingShowItem(null);
            }}
            className="text-neutral-400 hover:text-white p-1 rounded-lg hover:bg-neutral-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
              Nombre / Título del Momento
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Intro de Teclado + Presentación, Solo de Batería, Biset..."
              className={`w-full p-2.5 rounded-xl border outline-none ${colors.input}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                Tipo de Elemento
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`w-full p-2.5 rounded-xl border outline-none ${colors.input}`}
              >
                <option value="interlude">Interludio / Transición</option>
                <option value="speech">Presentación / Hablado</option>
                <option value="solo">Solo Instrumental</option>
                <option value="pause">Pausa / Descanso</option>
                <option value="encore">Biset / Final</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
                Duración Est. (minutos)
              </label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="2.5"
                className={`w-full p-2.5 rounded-xl border outline-none ${colors.input}`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Tono / Key</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Ej: Am"
                className={`w-full p-2 rounded-xl border outline-none ${colors.input}`}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">BPM / Tempo</label>
              <input
                type="number"
                value={tempo}
                onChange={(e) => setTempo(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="120"
                className={`w-full p-2 rounded-xl border outline-none ${colors.input}`}
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">Afinación</label>
              <input
                type="text"
                value={tuning}
                onChange={(e) => setTuning(e.target.value)}
                placeholder="Drop D"
                className={`w-full p-2 rounded-xl border outline-none ${colors.input}`}
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] uppercase font-bold text-neutral-400 mb-1">
              Notas para los Músicos / Atril
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Luces rojas fijas, no hablar por micro, entrar directo al bombo..."
              className={`w-full p-2.5 rounded-xl border outline-none ${colors.input}`}
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-neutral-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                setEditingShowItem(null);
              }}
              className="px-4 py-2 rounded-xl border border-neutral-700 text-xs font-bold text-neutral-300 hover:bg-neutral-800 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-sky-500 text-white font-bold hover:bg-sky-400 shadow-lg text-xs font-mono cursor-pointer flex items-center gap-1.5"
            >
              <span>Guardar en Setlist</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
