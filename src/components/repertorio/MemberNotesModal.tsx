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
  ReadinessLevel
} from '../../utils/repertorioUtils';
import { formatSongTitle } from '../../utils/formatSongTitle';
import { ModalPortal } from '../common/ModalPortal';

interface MemberNotesModalProps {
  isOpen: boolean;
  song: Song | null;
  colors: ThemeColors;
  isStitchLight: boolean;
  bandMembers?: BandMemberOption[];
  onClose: () => void;
  onSaveSongNotes: (updatedSong: Song) => void;
}

export function MemberNotesModal({
  isOpen,
  song,
  colors,
  isStitchLight,
  bandMembers = [],
  onClose,
  onSaveSongNotes
}: MemberNotesModalProps) {
  const resolvedMembers = resolveBandMembers(bandMembers, song?.notasMiembros);

  // Initialize local state of notes per member
  const [memberNotes, setMemberNotes] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (!song) return initial;
    resolvedMembers.forEach(m => {
      initial[m.name.toLowerCase()] = getSongMemberNote(song, m.id, m.name);
    });
    return initial;
  });

  const [generalRepertorioNote, setGeneralRepertorioNote] = useState<string>(
    song?.notasRepertorio || song?.notasInternas || ''
  );

  // Nivel de preparación de cada miembro con esta canción de cara al próximo bolo. Vive aparte de
  // memberNotes (texto libre para imprimir) porque son dos cosas distintas: "qué debe recordar" vs
  // "¿ya se la sabe?". Clave por nombre en minúsculas, igual que memberNotes, para reutilizar el
  // mismo patrón de lookup que ya usa este modal.
  const [memberReadiness, setMemberReadiness] = useState<Record<string, ReadinessLevel | null>>(() => {
    const initial: Record<string, ReadinessLevel | null> = {};
    if (!song) return initial;
    resolvedMembers.forEach(m => {
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
    setMemberNotes(prev => ({
      ...prev,
      [key.toLowerCase()]: text
    }));
  };

  const handleReadinessChange = (memberKey: string, estado: ReadinessLevel) => {
    setMemberReadiness(prev => ({
      ...prev,
      [memberKey.toLowerCase()]: prev[memberKey.toLowerCase()] === estado ? null : estado
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
      avatarColor: '#14b8a6'
    };

    setCustomMembers(prev => [...prev, newMember]);
    setMemberNotes(prev => ({
      ...prev,
      [key]: ''
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
    // sesión, incluido "quitar" un nivel marcado por error (toggle a null en handleReadinessChange).
    const updatedNotasPorMiembro = Array.isArray(song.notasPorMiembro) ? [...song.notasPorMiembro] : [];
    allMembersToDisplay.forEach(member => {
      const key = member.name.toLowerCase();
      const estado = memberReadiness[key];
      const idx = updatedNotasPorMiembro.findIndex(n =>
        (member.id && n.userId === member.id) || (n.memberName && n.memberName.toLowerCase() === key)
      );
      if (estado) {
        if (idx >= 0) {
          updatedNotasPorMiembro[idx] = { ...updatedNotasPorMiembro[idx], estadoPreparacion: estado, updatedAt: new Date().toISOString() };
        } else {
          updatedNotasPorMiembro.push({ userId: member.id, memberName: member.name, nota: '', estadoPreparacion: estado, updatedAt: new Date().toISOString() });
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
      notasPorMiembro: updatedNotasPorMiembro
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain">
        <div className={`w-full max-w-2xl p-5 rounded-2xl shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden border ${
          isStitchLight ? 'bg-white border-slate-200' : 'bg-[#121111] border-neutral-800'
        }`}>
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl ${isStitchLight ? 'bg-emerald-50 text-emerald-600' : 'bg-[#1db954]/10 text-[#1db954]'}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-black font-display uppercase tracking-wider ${
                isStitchLight ? 'text-slate-900' : 'text-neutral-100'
              }`}>
                Notas para Repertorio por Miembro
              </h3>
              <p className="text-xs text-neutral-400 font-sans flex items-center gap-1.5 mt-0.5">
                <Music className="w-3.5 h-3.5 text-[#1db954]" />
                Canción: <span className="font-bold text-white">{formatSongTitle(song.titulo)}</span> {song.tonalidad && `(${song.tonalidad})`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen de preparación de la banda con esta canción — de un vistazo, quién falta */}
        {(() => {
          const summary = getReadinessSummary({ notasPorMiembro: Object.entries(memberReadiness).filter(([, v]) => v).map(([k, v]) => ({ memberName: k, estadoPreparacion: v })) }, allMembersToDisplay.length);
          return (
            <div className="flex items-center gap-2 flex-wrap pt-3 text-[11px] font-mono">
              <span className="text-neutral-500 uppercase font-bold">Preparación de la banda:</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">✅ {summary.lista} listos</span>
              <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/25">🔶 {summary.casiLista} casi</span>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">🌱 {summary.aprendiendo} aprendiendo</span>
              {summary.sinOpinar > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-500 border border-neutral-700">{summary.sinOpinar} sin marcar</span>
              )}
            </div>
          );
        })()}

        {/* Informational Tip */}
        <div className={`p-3 rounded-xl my-3 text-xs flex items-start gap-2.5 ${
          isStitchLight ? 'bg-indigo-50 border border-indigo-200 text-indigo-900' : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
        }`}>
          <Sparkles className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Personalización para impresión de repertorios</p>
            <p className="opacity-90 mt-0.5">
              Las notas que introduzcas aquí aparecerán impresas debajo de esta canción en la hoja individual de cada músico al imprimir el repertorio.
            </p>
          </div>
        </div>

        {/* Scrollable list of members */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-1">
          {/* General Repertoire Note */}
          <div className={`p-3.5 rounded-xl border ${
            isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/90 border-neutral-800'
          }`}>
            <label className={`block text-xs font-bold font-mono uppercase mb-1.5 ${
              isStitchLight ? 'text-slate-700' : 'text-neutral-300'
            }`}>
              📌 Nota General para todo el Grupo (Opcional)
            </label>
            <textarea
              rows={2}
              value={generalRepertorioNote}
              onChange={(e) => setGeneralRepertorioNote(e.target.value)}
              placeholder="ej. Arrancar directo tras la cuenta de 4, final en seco..."
              className={`w-full p-2.5 rounded-lg text-xs focus:outline-none border ${
                isStitchLight ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500' : 'bg-neutral-950 border-neutral-800 text-neutral-100 focus:border-[#1db954]'
              }`}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className={`text-xs font-mono font-bold uppercase tracking-wider ${
                isStitchLight ? 'text-slate-600' : 'text-neutral-400'
              }`}>
                Miembros de la Banda ({allMembersToDisplay.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAddCustomMember(true)}
                className="text-xs text-[#1db954] hover:text-[#1ed760] font-mono flex items-center gap-1 font-bold cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> + Añadir Músico / Suplente
              </button>
            </div>

            {/* Add Custom Member Form */}
            {showAddCustomMember && (
              <div className={`p-3 rounded-xl border flex flex-wrap items-center gap-2 animate-in fade-in duration-150 ${
                isStitchLight ? 'bg-indigo-50/70 border-indigo-200' : 'bg-neutral-900 border-[#1db954]/40'
              }`}>
                <input
                  type="text"
                  placeholder="Nombre (ej. Músico Invitado)"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className={`text-xs p-2 rounded-lg flex-1 min-w-[140px] border ${
                    isStitchLight ? 'bg-white border-slate-300' : 'bg-neutral-950 border-neutral-700 text-white'
                  }`}
                />
                <input
                  type="text"
                  placeholder="Instrumento (ej. Teclados)"
                  value={newMemberInstrument}
                  onChange={(e) => setNewMemberInstrument(e.target.value)}
                  className={`text-xs p-2 rounded-lg flex-1 min-w-[140px] border ${
                    isStitchLight ? 'bg-white border-slate-300' : 'bg-neutral-950 border-neutral-700 text-white'
                  }`}
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleAddCustomMember}
                    className="px-3 py-2 bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs rounded-lg cursor-pointer transition-transform active:scale-95"
                  >
                    Añadir
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddCustomMember(false)}
                    className="px-2 py-2 text-neutral-400 hover:text-white text-xs cursor-pointer"
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
                  className={`p-3.5 rounded-xl border transition-all ${
                    hasNote
                      ? isStitchLight
                        ? 'bg-emerald-50/40 border-emerald-200'
                        : 'bg-neutral-900/90 border-emerald-500/30'
                      : isStitchLight
                        ? 'bg-slate-50/70 border-slate-200'
                        : 'bg-neutral-900/50 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs text-white uppercase shadow-sm"
                        style={{ backgroundColor: member.avatarColor || '#6366f1' }}
                      >
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <span className={`text-sm font-bold ${isStitchLight ? 'text-slate-900' : 'text-neutral-100'}`}>
                          {member.name}
                        </span>
                        <span className="ml-2 text-[11px] px-2 py-0.5 rounded-md bg-white/10 text-neutral-400 font-mono">
                          {member.instrument}
                        </span>
                      </div>
                    </div>

                    {hasNote && (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-500/20">
                        <Check className="w-3 h-3" /> Con notas
                      </span>
                    )}
                  </div>

                  {/* Nivel de preparación de este miembro con la canción para el próximo bolo */}
                  <div className="flex items-center gap-1.5 mb-2">
                    {READINESS_LEVELS.map(level => (
                      <button
                        key={level.value}
                        type="button"
                        onClick={() => handleReadinessChange(memberKey, level.value)}
                        title={level.label}
                        className={`text-[10px] font-mono px-2 py-1 rounded-lg border transition-all ${
                          memberReadiness[memberKey] === level.value
                            ? level.colorClass
                            : 'bg-white/5 text-neutral-500 border-transparent hover:border-white/10'
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
                    className={`w-full p-2.5 rounded-lg text-xs focus:outline-none border transition-colors ${
                      isStitchLight
                        ? 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-100 focus:border-[#1db954]'
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="pt-3.5 mt-2 border-t border-white/10 flex justify-end items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs text-neutral-300 hover:bg-neutral-800 transition-colors font-semibold cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className={`px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer shadow-lg ${
              savedSuccess 
                ? 'bg-emerald-500 text-white' 
                : 'bg-[#1db954] hover:bg-[#1ed760] text-black'
            }`}
          >
            {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {savedSuccess ? '¡Guardado!' : 'Guardar Notas'}
          </button>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
