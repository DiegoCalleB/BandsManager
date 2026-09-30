import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { ShowIcon } from '../ui/ShowIcon';
import { Button, Input, Select, Textarea } from '../ui';

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
  const [title, setTitle] = useState('');
  const [type, setType] = useState('interlude');
  const [durationMin, setDurationMin] = useState<number | ''>(2);
  const [notes, setNotes] = useState('');
  const [tuning, setTuning] = useState('');
  const [key, setKey] = useState('');
  const [tempo, setTempo] = useState<number | ''>(120);

  useEffect(() => {
    if (editingShowItem) {
      setTitle(editingShowItem.title || editingShowItem.nombre || '');
      setType(editingShowItem.itemType || 'interlude');
      setDurationMin(editingShowItem.durationMin || Math.round((editingShowItem.duracionSegundos || 120) / 60));
      setNotes(editingShowItem.notes || editingShowItem.notas || '');
      setTuning(editingShowItem.tuning || '');
      setKey(editingShowItem.key || editingShowItem.tono || '');
      setTempo(editingShowItem.tempo || editingShowItem.bpm || 120);
    } else {
      setTitle('');
      setType('interlude');
      setDurationMin(2);
      setNotes('');
      setTuning('');
      setKey('');
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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80">
      <div className={`w-full max-w-lg p-6 rounded-[var(--r-l)] space-y-4 ${colors.card} bg-[var(--acc)]/10`}>
        <div className="flex justify-between items-center pb-3 border-b border-[var(--hair)]">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[var(--acc)]/20 text-[var(--acc-ink)] rounded-[var(--r-m)]"><ShowIcon inline emoji="⚡" /></span>
            <div>
              <h3 className={`text-sm font-extrabold font-mono ${colors.text}`}>
                {editingShowItem ? 'Editar Interludio / Evento del Show' : 'Nuevo Interludio / Bloque del Show'}
              </h3>
              <p className="text-micro text-[var(--ink-2)] font-sans">
                Organiza momentos del directo (beatbox, presentaciones, bloque de temas, pausas).
              </p>
            </div>
          </div>
          <button aria-label="Cerrar"
            onClick={() => {
              onClose();
              setEditingShowItem(null);
            }}
            className="text-[var(--ink-2)] hover:text-[var(--ink)] p-1 rounded-[var(--r-pill)] hover:bg-[var(--sunken)] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
          <div>
            <label className="block text-micro font-bold text-[var(--ink-2)] mb-1">Nombre / título del momento</label>
            <Input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Intro de Teclado + Presentación, Solo de Batería, Biset…"
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-micro font-bold text-[var(--ink-2)] mb-1">Tipo de Elemento</label>
              <Select aria-label="Tipo de Elemento"
                value={type}
                onChange={(e) => setType(e.target.value)}
                wrapperClassName="w-full"
              >
                <option value="interlude">Interludio / transición</option>
                <option value="speech">Presentación / Hablado</option>
                <option value="solo">Solo instrumental</option>
                <option value="pause">Pausa / descanso</option>
                <option value="encore">Biset / final</option>
              </Select>
            </div>

            <div>
              <label className="block text-micro font-bold text-[var(--ink-2)] mb-1">Duración Est. (minutos)</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="2.5"
                className="w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-micro font-bold text-[var(--ink-2)] mb-1">Tono / Key</label>
              <Input
                size="sm"
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="Ej: Am"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-micro font-bold text-[var(--ink-2)] mb-1">BPM / Tempo</label>
              <Input
                size="sm"
                type="number"
                value={tempo}
                onChange={(e) => setTempo(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="120"
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-micro font-bold text-[var(--ink-2)] mb-1">Afinación</label>
              <Input
                size="sm"
                type="text"
                value={tuning}
                onChange={(e) => setTuning(e.target.value)}
                placeholder="Drop D"
                className="w-full"
              />
            </div>
          </div>

          <div>
            <label className="block text-micro font-bold text-[var(--ink-2)] mb-1">Notas para los músicos / atril</label>
            <Textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Luces rojas fijas, no hablar por micro, entrar directo al bombo…"
              className="w-full"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[var(--hair)]">
            <button
              type="button"
              onClick={() => {
                onClose();
                setEditingShowItem(null);
              }}
              className="px-4 py-2 rounded-[var(--r-pill)] text-xs font-bold text-[var(--ink-2)] hover:bg-[var(--sunken)] cursor-pointer"
            >
              Cancelar
            </button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              className="items-center gap-1.5"
            >
              <span>Guardar en Setlist</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
