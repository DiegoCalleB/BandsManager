import React, { useState } from 'react';
import { X, Users, Save, Plus, Music, Sparkles, Check } from 'lucide-react';
import { Song, ThemeColors } from '../../types';
import {
  BandMemberOption,
  resolveBandMembers,
  getSongMemberNote,
  getMemberReadiness,
  getReadinessSummary,
  READINESS_LEVELS,
  ReadinessLevel,
} from '../../utils/repertorioUtils';
import { formatSongTitle } from '../../utils/formatSongTitle';
import { ModalPortal } from '../common/ModalPortal';

interface MemberNotesModalProps {
  isOpen: boolean;
  song: Song | null;
  colors: ThemeColors;
  bandMembers?: BandMemberOption[];
  onClose: () => void;
  onSaveSongNotes: (updatedSong: Song) => void;
}

export function MemberNotesModal({ isOpen, song, colors, bandMembers = [], onClose, onSaveSongNotes }: MemberNotesModalProps) {
  const resolvedMembers = resolveBandMembers(bandMembers, song?.notasMiembros);

  // Initialize local state of notes per member
  const [memberNotes, setMemberNotes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (!song) return initial;
    resolvedMembers.forEach((m) => {
      initial[m.name.toLowerCase()] = getSongMemberNote(song, m.id, m.name);
    });
    return initial;
  });

  const [generalRepertorioNote, setGeneralRepertorioNote] = useState<string>(song?.notasRepertorio || song?.notasInternas || '');

  // Nivel de preparación de cada miembro con esta canción de cara al próximo bolo. Vive aparte de
  // memberNotes (texto libre para imprimir) porque son dos cosas distintas:"qué debe recordar" vs
  //"¿ya se la sabe?". Clave por nombre en minúsculas, igual que memberNotes, para reutilizar el
  // mismo patrón de lookup que ya usa este modal.
  const [memberReadiness, setMemberReadiness] = useState<Record<string, ReadinessLevel | null>>(() => {
    const initial: Record<string, ReadinessLevel | null> = {};
    if (!song) return initial;
    resolvedMembers.forEach((m) => {
      initial[m.name.toLowerCase()] = getMemberReadiness(song, m.id, m.name);
    });
    return initial;
  });

  const [newMemberName, setNewMemberName] = useState<string>('');
  const [newMemberInstrument, setNewMemberInstrument] = useState<string>('');
  const [showAddCustomMember, setShowAddCustomMember] = useState<boolean>(false);
  const [customMembers, setCustomMembers] = useState<BandMemberOption[]>([]);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);

  // Los hooks de arriba tienen que ejecutarse siempre (ver react-hooks/rules-of-hooks): este
  // guard vivía antes de ellos, así que abrir el modal con una canción distinta (o cerrarlo)
  // cambiaba cuántos hooks corrían entre renders.
  if (!isOpen || !song) return null;

  const handleNoteChange = (key: string, text: string) => {
    setMemberNotes((prev) => ({
      ...prev,
      [key.toLowerCase()]: text,
    }));
  };

  const handleReadinessChange = (memberKey: string, estado: ReadinessLevel) => {
    setMemberReadiness((prev) => ({
      ...prev,
      [memberKey.toLowerCase()]: prev[memberKey.toLowerCase()] === estado ? null : estado,
    }));
  };

  const handleAddCustomMember = () => {
    if (!newMemberName.trim()) return;
    const name = newMemberName.trim();
    const inst = newMemberInstrument.trim() || 'Músico';
    const key = name.toLowerCase();

    const newMember: BandMemberOption = {
      id: `custom-${Date.now()}`,
      name,
      instrument: inst,
      avatarColor: 'var(--ok)',
    };

    setCustomMembers((prev) => [...prev, newMember]);
    setMemberNotes((prev) => ({
      ...prev,
      [key]: '',
    }));
    setNewMemberName('');
    setNewMemberInstrument('');
    setShowAddCustomMember(false);
  };

  const handleSave = () => {
    const updatedNotasMiembros: Record<string, string> = { ...(song.notasMiembros || {}) };

    // Update with all current values
    Object.entries(memberNotes).forEach(([k, v]) => {
      if (v.trim()) {
        updatedNotasMiembros[k] = v.trim();
      } else {
        delete updatedNotasMiembros[k];
      }
    });

    // Preparación por miembro: parte de lo que ya hubiera guardado y aplica los cambios de esta
    // sesión, incluido"quitar" un nivel marcado por error (toggle a null en handleReadinessChange).
    const updatedNotasPorMiembro = Array.isArray(song.notasPorMiembro) ? [...song.notasPorMiembro] : [];
    allMembersToDisplay.forEach((member) => {
      const key = member.name.toLowerCase();
      const estado = memberReadiness[key];
      const idx = updatedNotasPorMiembro.findIndex(
        (n) => (member.id && n.userId === member.id) || (n.memberName && n.memberName.toLowerCase() === key)
      );
      if (estado) {
        if (idx >= 0) {
          updatedNotasPorMiembro[idx] = { ...updatedNotasPorMiembro[idx], estadoPreparacion: estado, updatedAt: new Date().toISOString() };
        } else {
          updatedNotasPorMiembro.push({
            userId: member.id,
            memberName: member.name,
            nota: '',
            estadoPreparacion: estado,
            updatedAt: new Date().toISOString(),
          });
        }
      } else if (idx >= 0) {
        const { estadoPreparacion, ...rest } = updatedNotasPorMiembro[idx];
        updatedNotasPorMiembro[idx] = rest;
      }
    });

    const updatedSong: Song = {
      ...song,
      notasRepertorio: generalRepertorioNote.trim(),
      notasMiembros: updatedNotasMiembros,
      notasPorMiembro: updatedNotasPorMiembro,
    };

    onSaveSongNotes(updatedSong);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 400);
  };

  const allMembersToDisplay = [...resolvedMembers, ...customMembers];

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain">
        <div
          className={`w-full max-w-2xl p-5 rounded-[var(--r-l)] my-auto max-h-[90vh] flex flex-col overflow-hidden ${'bg-[var(--surface)]'}`}
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className={`p-2 rounded-[var(--r-m)] ${'bg-[var(--surface)]/10 text-[var(--ok)]'}`}>
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`text-base font-black font-display tracking-wider ${'text-[var(--ink)]'}`}>
                  Notas para Repertorio por Miembro
                </h3>
                <p className="text-xs text-[var(--ink-2)] font-sans flex items-center gap-1.5 mt-0.5">
                  <Music className="w-3.5 h-3.5 text-[var(--ok)]" />
                  Canción: <span className="font-bold text-[var(--ink)]">{formatSongTitle(song.titulo)}</span>{' '}
                  {song.tonalidad && `(${song.tonalidad})`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)]/80 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Resumen de preparación de la banda con esta canción — de un vistazo, quién falta */}
          {(() => {
            const summary = getReadinessSummary(
              {
                notasPorMiembro: Object.entries(memberReadiness)
                  .filter(([, v]) => v)
                  .map(([k, v]) => ({ memberName: k, estadoPreparacion: v })),
              },
              allMembersToDisplay.length
            );
            return (
              <div className="flex items-center gap-2 flex-wrap pt-3 text-[11px] font-sans">
                <span className="text-[var(--ink-2)] font-bold">Preparación de la banda:</span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--ok)]/10 text-[var(--ok)]">✅ {summary.lista} listos</span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--acc)]/10 text-[var(--acc)]/80">🔶 {summary.casiLista} casi</span>
                <span className="px-2 py-0.5 rounded-full bg-[var(--acc)]/10 text-[var(--acc)]">🌱 {summary.aprendiendo} aprendiendo</span>
                {summary.sinOpinar > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-[var(--surface)]/80 text-[var(--ink-2)]">
                    {summary.sinOpinar} sin marcar
                  </span>
                )}
              </div>
            );
          })()}

          {/* Informational Tip */}
          <div className={`p-3 rounded-[var(--r-m)] my-3 text-xs flex items-start gap-2.5 ${'bg-[var(--ok-soft)] text-[var(--ink-2)]'}`}>
            <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Personalización para impresión de repertorios</p>
              <p className="opacity-90 mt-0.5">
                Las notas que introduzcas aquí aparecerán impresas debajo de esta canción en la hoja individual de cada músico al imprimir
                el repertorio.
              </p>
            </div>
          </div>

          {/* Scrollable list of members */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-1">
            {/* General Repertoire Note */}
            <div className={`p-3.5 rounded-[var(--r-m)] ${'bg-[var(--surface)]'}`}>
              <label className={`block text-xs font-bold font-sans mb-1.5 ${'text-[var(--ink-2)]'}`}>
                📌 Nota General para todo el Grupo (Opcional)
              </label>
              <textarea
                rows={2}
                value={generalRepertorioNote}
                onChange={(e) => setGeneralRepertorioNote(e.target.value)}
                placeholder="ej. Arrancar directo tras la cuenta de 4, final en seco..."
                className="w-full p-2.5 rounded-[var(--r-s)] text-xs focus:outline-none bg-[var(--surface)] text-[var(--ink)]"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-sans font-bold tracking-wider ${'text-[var(--ink-2)]'}`}>
                  Miembros de la Banda ({allMembersToDisplay.length})
                </span>
                <button
                  type="button"
                  onClick={() => setShowAddCustomMember(true)}
                  className="text-xs text-[var(--ok)] hover:text-[var(--ok)] font-sans flex items-center gap-1 font-bold cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> + Añadir Músico / Suplente
                </button>
              </div>

              {/* Add Custom Member Form */}
              {showAddCustomMember && (
                <div
                  className={`p-3 rounded-[var(--r-m)] flex flex-wrap items-center gap-2 animate-in fade-in duration-150 ${'bg-[var(--tentative)]/5/70'}`}
                >
                  <input
                    type="text"
                    placeholder="Nombre (ej. Músico Invitado)"
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    className={`text-xs p-2 rounded-[var(--r-s)] flex-1 min-w-[140px] ${'bg-[var(--surface)]'}`}
                  />
                  <input
                    type="text"
                    placeholder="Instrumento (ej. Teclados)"
                    value={newMemberInstrument}
                    onChange={(e) => setNewMemberInstrument(e.target.value)}
                    className={`text-xs p-2 rounded-[var(--r-s)] flex-1 min-w-[140px] ${'bg-[var(--surface)]'}`}
                  />
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleAddCustomMember}
                      className="px-3 py-2 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] font-bold text-xs rounded-[var(--r-s)] cursor-pointer transition-transform active:scale-95"
                    >
                      Añadir
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddCustomMember(false)}
                      className="px-2 py-2 text-[var(--ink-2)] hover:text-[var(--ink)] text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* List of members with textareas */}
              {allMembersToDisplay.map((member) => {
                const memberKey = member.name.toLowerCase();
                const currentNote = memberNotes[memberKey] || '';
                const hasNote = Boolean(currentNote.trim());

                return (
                  <div
                    key={member.id || member.name}
                    className={`p-3.5 rounded-[var(--r-m)] transition-all ${hasNote ? 'bg-[var(--surface)]/90/30' : 'bg-[var(--bg)]/70'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-[var(--r-s)] flex items-center justify-center font-bold text-xs text-[var(--ink)]"
                          style={{ backgroundColor: member.avatarColor || 'var(--acc)' }}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <span className={`text-sm font-bold ${'text-[var(--ink)]'}`}>{member.name}</span>
                          <span className="ml-2 text-[11px] px-2 py-0.5 rounded-md bg-[var(--ink)]/10 text-[var(--ink-2)] font-sans">
                            {member.instrument}
                          </span>
                        </div>
                      </div>

                      {hasNote && (
                        <span className="text-[10px] font-sans font-bold text-[var(--ok)] bg-[var(--ok)]/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> Con notas
                        </span>
                      )}
                    </div>

                    {/* Nivel de preparación de este miembro con la canción para el próximo bolo */}
                    <div className="flex items-center gap-1.5 mb-2">
                      {READINESS_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => handleReadinessChange(memberKey, level.value)}
                          title={level.label}
                          className={`text-[10px] font-sans px-2 py-1 rounded-[var(--r-s)] transition-all ${
                            memberReadiness[memberKey] === level.value
                              ? level.colorClass
                              : 'bg-[var(--ink)]/5 text-[var(--ink-2)] hover:border-[var(--hair)]'
                          }`}
                        >
                          {level.icon} {level.label}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={2}
                      value={currentNote}
                      onChange={(e) => handleNoteChange(member.name, e.target.value)}
                      placeholder={`Notas específicas para ${member.name} (${member.instrument})... ej. Entrada en compás 8, solo con sordina, cambio de afinación...`}
                      className="w-full p-2.5 rounded-[var(--r-s)] text-xs focus:outline-none transition-colors bg-[var(--surface)] text-[var(--ink)]"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3.5 mt-2 flex justify-end items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-[var(--r-m)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface)]/80 transition-colors font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`px-5 py-2 rounded-[var(--r-m)] text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer ${
                savedSuccess ? 'bg-[var(--ok)] text-[var(--ink)]' : 'bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)]'
              }`}
            >
              {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {savedSuccess ? '¡Guardado! ' : 'Guardar Notas'}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
