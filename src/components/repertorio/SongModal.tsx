import React, { useState, useRef } from 'react';
import { X, Upload, Disc3, CheckCircle2, Music, Users, ChevronDown, ChevronUp, Sparkles, SlidersHorizontal } from 'lucide-react';
import { ThemeColors, Song } from '../../types';
import { BandMemberOption, resolveBandMembers, getSongMemberNote } from '../../utils/repertorioUtils';
import { formatSongTitle } from '../../utils/formatSongTitle';
import { ModalPortal } from '../common/ModalPortal';

// Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` que llegan de main no deben
// activarse nunca (traerían de vuelta slate/indigo). Se eliminan en el restyle de este fichero.
const isStitchLight = false;

interface SongModalProps {
  isOpen: boolean;
  editingSong: Song | null;
  colors: ThemeColors;
  onClose: () => void;
  onSave: (e: React.FormEvent<HTMLFormElement>) => void;
  albumsList?: string[];
  defaultAlbum?: string;
  defaultAlbumForNewSong?: string;
  bandMembers?: BandMemberOption[];
}

export function SongModal({
  isOpen,
  editingSong,
  colors,
  onClose,
  onSave,
  albumsList = [],
  defaultAlbum = '',
  defaultAlbumForNewSong = '',
  bandMembers = [],
}: SongModalProps) {
  const effectiveDefaultAlbum = defaultAlbumForNewSong || defaultAlbum || '';
  const resolvedMembers = resolveBandMembers(bandMembers, editingSong?.notasMiembros);

  const [minutos, setMinutos] = useState<number>(() => (editingSong ? Math.floor(editingSong.duracionSegundos / 60) : 3));
  const [segundos, setSegundos] = useState<number>(() => (editingSong ? editingSong.duracionSegundos % 60 : 30));
  const [detectedDurationMsg, setDetectedDurationMsg] = useState<string>('');
  const [selectedAlbum, setSelectedAlbum] = useState<string>(() => {
    const albumVal = editingSong?.albumDisco || editingSong?.album || effectiveDefaultAlbum || '';
    if (!albumVal) return '';
    return albumsList.includes(albumVal) ? albumVal : '__CUSTOM__';
  });
  const [customAlbumInput, setCustomAlbumInput] = useState<string>(() => {
    const albumVal = editingSong?.albumDisco || editingSong?.album || effectiveDefaultAlbum || '';
    return albumsList.includes(albumVal) ? '' : albumVal;
  });
  const [audioFileUrl, setAudioFileUrl] = useState<string>(editingSong?.audioPrincipalUrl || (editingSong as any)?.audioUrl || '');
  const [audioFileName, setAudioFileName] = useState<string>('');

  // Determine if advanced section should start open (e.g. if editing a song with extra data)
  const hasAdvancedData = Boolean(
    editingSong?.genero ||
    editingSong?.cantantePrincipal ||
    (editingSong?.afinacion && editingSong.afinacion !== 'E Standard') ||
    editingSong?.enlaceAcordes ||
    editingSong?.notasInternas ||
    editingSong?.notasRepertorio ||
    (editingSong?.notasMiembros && Object.values(editingSong.notasMiembros).some((v) => v && v.trim().length > 0))
  );

  const [showAdvancedOptions, setShowAdvancedOptions] = useState<boolean>(hasAdvancedData);

  // Member notes state
  const [showMemberNotesSection, setShowMemberNotesSection] = useState<boolean>(hasAdvancedData);
  const [memberNotesState, setMemberNotesState] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    resolvedMembers.forEach((m) => {
      initial[m.name.toLowerCase()] = getSongMemberNote(editingSong, m.id, m.name);
    });
    return initial;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleMemberNoteChange = (name: string, text: string) => {
    setMemberNotesState((prev) => ({
      ...prev,
      [name.toLowerCase()]: text,
    }));
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAudioFileName(file.name);
    const objectUrl = URL.createObjectURL(file);
    setAudioFileUrl(objectUrl);

    // Auto-detect duration from audio metadata
    const tempAudio = new Audio(objectUrl);
    tempAudio.onloadedmetadata = () => {
      if (tempAudio.duration && !isNaN(tempAudio.duration)) {
        const totalSecs = Math.round(tempAudio.duration);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        setMinutos(mins);
        setSegundos(secs);
        setDetectedDurationMsg(`✓ Duración detectada: ${mins}m ${secs}s`);
      }
    };
  };

  const finalAlbumValue = selectedAlbum === '__CUSTOM__' ? customAlbumInput : selectedAlbum;

  const energiaDefault = (() => {
    const raw = Number(editingSong?.energia);
    if (!editingSong || !Number.isFinite(raw) || raw <= 0) return '18';
    const normalized = raw > 20 ? Math.round(raw / 5) : raw;
    if (normalized <= 8) return '6';
    if (normalized <= 14) return '12';
    if (normalized <= 18) return '18';
    return '20';
  })();

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-[var(--scrim)]/75 backdrop-blur-md overflow-y-auto overscroll-contain animate-fadeIn">
        <div
          className={`w-full max-w-lg p-5 sm:p-6 rounded-3xl shadow-2xl my-auto max-h-[90vh] flex flex-col overflow-hidden border ${
            'bg-[var(--surface)] border-[var(--hair)] text-[var(--ink)]'
          }`}
        >
          {/* Header */}
          <div className="flex justify-between items-center pb-3.5 border-b border-[var(--hair)]/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[var(--ok)]/15 border border-[var(--ok)]/30 flex items-center justify-center text-[var(--ok)]">
                <Music className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">{editingSong ? 'Editar Canción' : 'Añadir Nueva Canción'}</h3>
                <p className="text-[11px] text-zinc-400 font-normal">
                  {editingSong ? 'Modifica los datos del tema en tu repertorio' : 'Añade un tema rápido a tu catálogo'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="text-[var(--ink-2)] hover:text-[var(--ink)] cursor-pointer p-1">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={onSave} className="space-y-3 text-[10px] font-sans flex flex-col flex-1 overflow-hidden pt-3">
            <input type="hidden" name="audioPrincipalUrl" value={audioFileName ? '' : audioFileUrl} />
            <input type="hidden" name="albumDisco" value={finalAlbumValue} />

            <div className="space-y-4 overflow-y-auto pr-1 flex-1 pb-2">
              {/* Audio Upload Area (Compact & Clean) */}
              <div
                className={`p-3 rounded-2xl border transition-all ${
                  'bg-[var(--surface)] border-[var(--hair)] hover:border-[var(--ok)]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-[var(--ok)]/10 text-[var(--ok)] flex items-center justify-center shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-semibold text-xs block text-zinc-200">Audio Demo (mp3, wav, m4a)</span>
                      <span className="text-[10px] text-zinc-400 truncate block">
                        {audioFileName || (audioFileUrl ? 'Audio subido previamente' : 'Opcional — autodetección de duración')}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1 text-[10px] rounded-[var(--r-s)] bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] font-extrabold cursor-pointer transition-transform active:scale-95"
                  >
                    Examinar...
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  name="audioFile"
                  type="file"
                  accept="audio/*"
                  onChange={handleAudioFileChange}
                  className="hidden"
                />
                {audioFileName && (
                  <div className="mt-2 text-xs text-[var(--ok)] flex items-center gap-1.5 font-medium bg-[var(--ok)]/10 p-2 rounded-xl border border-[var(--ok)]/20">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span className="truncate">{audioFileName}</span>
                  </div>
                )}
                {detectedDurationMsg && (
                  <div className="mt-1.5 text-[11px] font-semibold text-[var(--ok)] flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>{detectedDurationMsg}</span>
                  </div>
                )}
              </div>

              {/* Title Field (Main Essential Field) */}
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">
                  Título de la Canción <span className="text-[var(--ok)]">*</span>
                </label>
                <input
                  name="titulo"
                  type="text"
                  required
                  defaultValue={editingSong ? formatSongTitle(editingSong.titulo) : ''}
                  onBlur={(e) => {
                    if (e.target.value) {
                      e.target.value = formatSongTitle(e.target.value);
                    }
                  }}
                  className={`w-full p-2.5 rounded-[var(--r-s)] focus:outline-none ${'bg-[var(--surface)] text-[var(--ink)]'}`}
                  placeholder="ej. Brisa y Cacharros"
                />
              </div>

              {/* Album & Duration Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-zinc-300 font-semibold mb-1 flex items-center gap-1.5">
                    <Disc3 className="w-3.5 h-3.5 text-[var(--ok)]" />
                    <span>Álbum / Disco</span>
                  </label>
                  <select
                    value={selectedAlbum}
                    onChange={(e) => setSelectedAlbum(e.target.value)}
                    className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none cursor-pointer font-bold ${'bg-[var(--surface)] text-[var(--ok)]'}`}
                  >
                    <option value="">Single (Sin disco)</option>
                    {albumsList
                      .filter((a) => a && a !== 'todos' && a !== 'Singles / Sin Disco')
                      .map((alb) => (
                        <option key={alb} value={alb}>
                          💿 {alb}
                        </option>
                      ))}
                    <option value="__CUSTOM__">+ Crear Nuevo Álbum...</option>
                  </select>

                  {selectedAlbum === '__CUSTOM__' && (
                    <input
                      type="text"
                      value={customAlbumInput}
                      onChange={(e) => setCustomAlbumInput(e.target.value)}
                      placeholder="Nombre del nuevo disco..."
                      className={`w-full mt-2 px-3 py-2 rounded-xl focus:outline-none border border-[var(--ok)]/50 ${
                        'bg-[var(--surface)] text-[var(--ink)]'
                      }`}
                    />
                  )}
                </div>

                <div>
                  <label className="block text-zinc-300 font-semibold mb-1">Duración (Min : Seg)</label>
                  <div className="flex gap-2 items-center">
                    <input
                      name="duracionMin"
                      type="number"
                      min="0"
                      value={minutos}
                      onChange={(e) => setMinutos(parseInt(e.target.value) || 0)}
                      className={`w-1/2 px-3 py-2 rounded-xl focus:outline-none border text-center font-bold text-[var(--ok)] ${
                        'bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]'
                      }`}
                      placeholder="3"
                    />
                    <span className="text-zinc-500 font-bold">:</span>
                    <input
                      name="duracionSeg"
                      type="number"
                      min="0"
                      max="59"
                      value={segundos}
                      onChange={(e) => setSegundos(parseInt(e.target.value) || 0)}
                      className={`w-1/2 px-3 py-2 rounded-xl focus:outline-none border text-center font-bold text-[var(--ok)] ${
                        'bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]'
                      }`}
                      placeholder="30"
                    />
                  </div>
                </div>
              </div>

              {/* Music Essentials Row (Key, BPM, Energy) */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-zinc-400 text-[11px] font-semibold mb-1">Tonalidad</label>
                  <input
                    name="tonalidad"
                    type="text"
                    defaultValue={editingSong?.tonalidad || ''}
                    className={`w-full px-2.5 py-1.5 rounded-xl focus:outline-none border ${
                      'bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]'
                    }`}
                    placeholder="ej. Am"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[11px] font-semibold mb-1">BPM</label>
                  <input
                    name="bpm"
                    type="number"
                    defaultValue={editingSong?.bpm || 120}
                    className={`w-full px-2.5 py-1.5 rounded-xl focus:outline-none border ${
                      'bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]'
                    }`}
                    placeholder="120"
                  />
                </div>

                <div>
                  <label className="block text-zinc-400 text-[11px] font-semibold mb-1">Energía</label>
                  <select
                    name="energia"
                    defaultValue={energiaDefault}
                    className={`w-full p-2 rounded-[var(--r-s)] focus:outline-none ${'bg-[var(--surface)] text-[var(--ink)]'}`}
                  >
                    <option value="20">💣 Explosiva</option>
                    <option value="18">🔥 Alta</option>
                    <option value="12">🎵 Media</option>
                    <option value="6">🌙 Balada</option>
                  </select>
                </div>
              </div>

              {/* Collapsible Accordion: Advanced Options & Notes */}
              <div
                className={`rounded-2xl border transition-all overflow-hidden ${
                  'bg-[var(--surface)] border-[var(--hair)]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setShowAdvancedOptions((prev) => !prev)}
                  className={`w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-xs transition-colors cursor-pointer ${
                    'hover:bg-[var(--sunken)] text-[var(--ink)]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--ok)]" />
                    <span className="font-semibold">Opciones avanzadas y notas</span>
                    <span className="text-[10px] text-zinc-400 font-normal">(Género, afinación, partitura, notas por miembro)</span>
                  </div>
                  {showAdvancedOptions ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </button>

                {showAdvancedOptions && (
                  <div className="p-3.5 pt-1 space-y-3 border-t border-[var(--hair)]/5">
                    {/* Style & Type */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-400 text-[11px] mb-1">Género / Estilo</label>
                        <input
                          name="genero"
                          type="text"
                          defaultValue={editingSong?.genero || ''}
                          className={`w-full px-2.5 py-1.5 rounded-xl focus:outline-none border ${
                            'bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]'
                          }`}
                          placeholder="ej. Rock, Rumba"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 text-[11px] mb-1">Tipo de Tema</label>
                        <select
                          name="tipo"
                          defaultValue={editingSong?.tipo || 'propio'}
                          className={`w-full px-2.5 py-1.5 rounded-xl focus:outline-none border cursor-pointer ${
                            'bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]'
                          }`}
                        >
                          <option value="propio">Propio / Original</option>
                          <option value="cover">Cover / Versión</option>
                          <option value="instrumental">Instrumental / Intro</option>
                        </select>
                      </div>
                    </div>

                    {/* Maturity & Voice */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-400 text-[11px] mb-1">Estado de Madurez</label>
                        <select
                          name="estadoTema"
                          defaultValue={editingSong?.estadoTema || 'listo'}
                          className={`w-full px-2.5 py-1.5 rounded-xl focus:outline-none border cursor-pointer ${
                            'bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]'
                          }`}
                        >
                          <option value="listo">⚡ Listo para Directo</option>
                          <option value="ensayando">🎸 En Ensayo</option>
                          <option value="componiendo">💡 En Composición</option>
                          <option value="descartado">📦 Archivo</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-zinc-400 text-[11px] mb-1">Voz Principal</label>
                        <input
                          name="cantantePrincipal"
                          type="text"
                          defaultValue={editingSong?.cantantePrincipal || ''}
                          className={`w-full px-2.5 py-1.5 rounded-xl focus:outline-none border ${
                            'bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]'
                          }`}
                          placeholder="Cantante"
                        />
                      </div>
                    </div>

                    {/* Tuning & Sheet Music Link */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-zinc-400 text-[11px] mb-1">Afinación</label>
                        <input
                          name="afinacion"
                          type="text"
                          defaultValue={editingSong?.afinacion || 'E Standard'}
                          className={`w-full px-2.5 py-1.5 rounded-xl focus:outline-none border ${
                            'bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]'
                          }`}
                          placeholder="E Standard"
                        />
                      </div>

                      <div>
                        <label className="block text-zinc-400 text-[11px] mb-1">Enlace a Partitura / Drive</label>
                        <input
                          name="enlaceAcordes"
                          type="url"
                          defaultValue={editingSong?.enlaceAcordes || ''}
                          className={`w-full px-2.5 py-1.5 rounded-xl focus:outline-none border ${
                            'bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]'
                          }`}
                          placeholder="https://drive.google.com/..."
                        />
                      </div>
                    </div>

                    {/* Internal Notes */}
                    <div>
                      <label className="block text-zinc-400 text-[11px] mb-1">Notas Internas de Ejecución</label>
                      <textarea
                        name="notasInternas"
                        rows={2}
                        defaultValue={editingSong?.notasInternas || ''}
                        className={`w-full p-2.5 rounded-xl focus:outline-none border text-xs ${
                          'bg-[var(--surface)] text-[var(--ink)] border-[var(--hair)]'
                        }`}
                        placeholder="ej. Entrar directos tras el solo de batería..."
                      />
                    </div>

                    {/* Member Notes Section */}
                    <input type="hidden" name="notasMiembrosJson" value={JSON.stringify(memberNotesState)} />

                    <div className="pt-2 border-t border-[var(--hair)]/5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-[var(--ok)]" />
                          <span>Notas por Miembro de la Banda ({resolvedMembers.length})</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowMemberNotesSection((p) => !p)}
                          className="text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                        >
                          {showMemberNotesSection ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>

                      {showMemberNotesSection && (
                        <div className="space-y-2 pt-1">
                          <div>
                            <label className="block text-zinc-400 text-[10px] mb-1">📌 Nota General para todo el grupo</label>
                            <input
                              name="notasRepertorio"
                              type="text"
                              defaultValue={editingSong?.notasRepertorio || ''}
                              placeholder="ej. Parón en seco antes del último coro"
                              className={`w-full px-2.5 py-1.5 rounded-xl focus:outline-none border text-xs ${
                                'bg-[var(--surface)] border-[var(--hair)] text-[var(--ink)]'
                              }`}
                            />
                          </div>

                          {resolvedMembers.map((member) => {
                            const memberKey = member.name.toLowerCase();
                            return (
                              <div key={member.id || member.name} className="space-y-0.5">
                                <span className="text-[10px] font-medium text-zinc-300 flex items-center gap-1">
                                  <span
                                    className="w-1.5 h-1.5 rounded-full inline-block"
                                    style={{ backgroundColor: member.avatarColor || '#6366f1' }}
                                  />
                                  {member.name} <span className="text-zinc-500 font-normal">({member.instrument})</span>
                                </span>
                                <input
                                  type="text"
                                  value={memberNotesState[memberKey] || ''}
                                  onChange={(e) => handleMemberNoteChange(member.name, e.target.value)}
                                  placeholder={`Notas para ${member.name}...`}
                                  className={`w-full px-2.5 py-1.5 rounded-xl focus:outline-none border text-xs ${
                                    'bg-[var(--surface)] border-[var(--hair)] text-[var(--ink)]'
                                  }`}
                                />
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="pt-3 border-t border-[var(--hair)]/10 flex justify-end gap-2.5 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 rounded-[var(--r-m)] text-xs text-[var(--ink-2)] hover:bg-[var(--surface)]/80 transition-colors font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-[var(--r-m)] text-xs font-bold bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink)] transition-transform active:scale-95 cursor-pointer"
              >
                Guardar Canción
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}
