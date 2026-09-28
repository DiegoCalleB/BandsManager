import React, { useState } from 'react';
import { X, Building2, Radio, Sparkles, Loader2, Upload, Briefcase, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { LeadType } from '../../types';
import { apiFetch } from '../../utils/api';
import { ModalPortal } from '../common/ModalPortal';

export interface NewLeadDataState {
  nombre_sala: string;
  ciudad: string;
  region: string;
  direccion?: string;
  aforo: number;
  genero: string;
  roster?: string;
  tipo?: LeadType;
  email_contacto: string;
  email_secundario?: string;
  telefono: string;
  telefono_movil?: string;
  telefono_fijo?: string;
  website?: string;
  instagram: string;
  fuente: string;
  pitch_generado: string;
  notas: string;
  icono?: string;
  imagen_url?: string;
}

interface AddLeadModalProps {
  isOpen: boolean;
  sectionTab: 'salas' | 'medios' | 'grupos';
  isStitchLight: boolean;
  textSub: string;
  newLeadData: NewLeadDataState;
  setNewLeadData: React.Dispatch<React.SetStateAction<NewLeadDataState>>;
  isModalScraping: boolean;
  modalScrapeStatus: string;
  modalScrapeError: string;
  modalScrapeSuccessMsg: string;
  isUploadingLeadLogo: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  onModalScrape: () => void;
  onLeadLogoUpload: (file: File) => Promise<string | null> | void;
}

export function AddLeadModal({
  isOpen,
  sectionTab,
  isStitchLight,
  textSub,
  newLeadData,
  setNewLeadData,
  isModalScraping,
  modalScrapeStatus,
  modalScrapeError,
  modalScrapeSuccessMsg,
  isUploadingLeadLogo,
  onClose,
  onSubmit,
  onModalScrape,
  onLeadLogoUpload
}: AddLeadModalProps) {
  const [isSearchingLogo, setIsSearchingLogo] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  if (!isOpen) return null;

  const handleAutoSearchLogo = async () => {
    if (!newLeadData.nombre_sala) return;
    setIsSearchingLogo(true);
    try {
      const res = await apiFetch('/api/leads/ai-lookup', {
        method: 'POST',
        body: JSON.stringify({
          nombre_sala: newLeadData.nombre_sala,
          ciudad: newLeadData.ciudad
        })
      });
      if (res.success && res.data) {
        setNewLeadData(prev => ({
          ...prev,
          imagen_url: res.data.imagen_url || prev.imagen_url,
          icono: res.data.icono || prev.icono,
          website: res.data.website || prev.website,
          instagram: res.data.instagram || prev.instagram
        }));
      }
    } catch (err) {
      console.error('Error auto-searching logo in modal:', err);
    } finally {
      setIsSearchingLogo(false);
    }
  };

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto overscroll-contain animate-fadeIn">
        <div
          className={`w-full max-w-lg p-5 sm:p-6 rounded-3xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto my-auto border ${
            isStitchLight ? 'bg-white border-slate-200 text-slate-800' : 'bg-[#16161a] border-neutral-800 text-zinc-100'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                {sectionTab === 'medios' ? (
                  <Radio className="w-4 h-4 text-rose-400" />
                ) : sectionTab === 'grupos' ? (
                  <Briefcase className="w-4 h-4 text-amber-400" />
                ) : (
                  <Building2 className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight">
                  {sectionTab === 'medios'
                    ? 'Nuevo Medio o Prensa'
                    : sectionTab === 'grupos'
                    ? 'Nuevo Contacto de Industria'
                    : 'Nueva Sala o Festival'}
                </h3>
                <p className="text-[11px] text-zinc-400 font-normal">
                  Añade un contacto a tu pipeline CRM de booking
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white p-1.5 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5 text-xs font-sans">
            {/* Name + AI Scout Auto-fill */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-zinc-200">
                  {sectionTab === 'medios'
                    ? 'Nombre del Medio / Revista *'
                    : sectionTab === 'grupos'
                    ? 'Nombre de la Entidad / Contacto *'
                    : 'Nombre de la Sala / Festival *'}
                </label>
                <button
                  type="button"
                  onClick={onModalScrape}
                  disabled={isModalScraping || !newLeadData.nombre_sala}
                  className="px-2.5 py-1 text-[11px] rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 disabled:opacity-40 shrink-0"
                  title="Buscar automáticamente email, teléfono y ubicación con el Agente Scout IA"
                >
                  {isModalScraping ? (
                    <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-amber-400" />
                  )}
                  <span>{isModalScraping ? 'Buscando...' : 'Autocompletar con IA'}</span>
                </button>
              </div>
              <input
                type="text"
                required
                placeholder={
                  sectionTab === 'medios'
                    ? 'Ej. Radio 3, Mondosonoro'
                    : 'Ej. Sala El Sol, Festival Cabo de Plata'
                }
                value={newLeadData.nombre_sala}
                onChange={e => setNewLeadData(prev => ({ ...prev, nombre_sala: e.target.value }))}
                className={`w-full rounded-xl px-3.5 py-2.5 text-xs font-medium focus:outline-none border ${
                  isStitchLight
                    ? 'bg-white text-slate-900 border-slate-300 focus:border-amber-500'
                    : 'bg-neutral-900 text-white border-neutral-800 focus:border-amber-500/50'
                }`}
              />
            </div>

            {/* Status Messages */}
            {isModalScraping && (
              <div className="p-2.5 rounded-xl text-xs flex items-center gap-2 animate-pulse bg-amber-500/10 text-amber-300 border border-amber-500/20">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-amber-400" />
                <span className="font-medium">{modalScrapeStatus}</span>
              </div>
            )}
            {modalScrapeError && (
              <div className="p-2.5 rounded-xl text-xs text-rose-300 bg-rose-500/15 border border-rose-500/30">
                ⚠️ {modalScrapeError}
              </div>
            )}
            {modalScrapeSuccessMsg && (
              <div className="p-2.5 rounded-xl text-xs text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
                {modalScrapeSuccessMsg}
              </div>
            )}

            {/* City & Venue Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Ciudad</label>
                <input
                  type="text"
                  placeholder="Ej. Madrid, Barcelona"
                  value={newLeadData.ciudad}
                  onChange={e => setNewLeadData(prev => ({ ...prev, ciudad: e.target.value }))}
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                    isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  {sectionTab === 'medios' ? 'Tipo de Medio' : 'Tipo de Espacio'}
                </label>
                {sectionTab === 'medios' ? (
                  <select
                    value={newLeadData.genero}
                    onChange={e => setNewLeadData(prev => ({ ...prev, genero: e.target.value }))}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border cursor-pointer ${
                      isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
                    }`}
                  >
                    <option value="Radio">Radio / Programa</option>
                    <option value="Televisión">Televisión / Vídeo</option>
                    <option value="Prensa">Prensa / Revista</option>
                    <option value="Redes Sociales">Redes / Creadores</option>
                    <option value="Podcasts">Podcasts / Entrevistas</option>
                  </select>
                ) : (
                  <select
                    value={newLeadData.tipo}
                    onChange={e => setNewLeadData(prev => ({ ...prev, tipo: e.target.value as LeadType }))}
                    className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border cursor-pointer ${
                      isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
                    }`}
                  >
                    <option value="sala">Sala de Conciertos</option>
                    <option value="festival">Festival</option>
                    <option value="ayuntamiento">Ayuntamiento / Fiestas</option>
                    <option value="agencia">Agencia de Booking</option>
                    <option value="manager">Mánager / Representante</option>
                    <option value="productora">Productora / Promotora</option>
                    <option value="productor">Productor / Estudio</option>
                    <option value="patrocinador">Marca / Patrocinador</option>
                    <option value="supervisor_sync">Supervisor Musical (Sync)</option>
                    <option value="sello">Sello Discográfico</option>
                    <option value="grupo">Banda Amiga</option>
                  </select>
                )}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Email Principal</label>
                <input
                  type="email"
                  placeholder="info@sala.com"
                  value={newLeadData.email_contacto}
                  onChange={e => setNewLeadData(prev => ({ ...prev, email_contacto: e.target.value }))}
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                    isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">Teléfono (WhatsApp)</label>
                <input
                  type="tel"
                  placeholder="+34 612 345 678"
                  value={newLeadData.telefono_movil || ''}
                  onChange={e => {
                    const val = e.target.value;
                    setNewLeadData(prev => ({
                      ...prev,
                      telefono_movil: val,
                      telefono: val || prev.telefono_fijo || prev.telefono || ''
                    }));
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none border ${
                    isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-900 text-white border-neutral-800'
                  }`}
                />
              </div>
            </div>

            {/* Collapsible Advanced Section */}
            <div className={`rounded-2xl border transition-all overflow-hidden ${
              isStitchLight ? 'bg-slate-50 border-slate-200' : 'bg-neutral-900/60 border-neutral-800'
            }`}>
              <button
                type="button"
                onClick={() => setShowAdvanced(prev => !prev)}
                className={`w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-xs transition-colors cursor-pointer ${
                  isStitchLight ? 'hover:bg-slate-100 text-slate-800' : 'hover:bg-neutral-800/80 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                  <span className="font-semibold">Más datos de contacto y notas</span>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    (Logo, dirección, proposal...)
                  </span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
              </button>

              {showAdvanced && (
                <div className="p-3.5 pt-1 space-y-3 border-t border-white/5">
                  {/* Logo block */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-[11px] font-semibold text-zinc-400">Logo o Icono</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAutoSearchLogo}
                          disabled={isSearchingLogo || !newLeadData.nombre_sala}
                          className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] rounded-lg flex items-center gap-1 font-bold transition-all border border-amber-500/40 cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>{isSearchingLogo ? 'Buscando...' : 'Buscar Logo'}</span>
                        </button>
                        <label className="cursor-pointer px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-zinc-200 text-[10px] rounded-lg flex items-center gap-1 font-bold transition-all border border-neutral-700">
                          <Upload className="w-3 h-3 text-amber-400" />
                          <span>{isUploadingLeadLogo ? 'Subiendo...' : 'Subir'}</span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async e => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const uploadedUrl = await onLeadLogoUpload(file);
                                if (uploadedUrl) {
                                  setNewLeadData(prev => ({ ...prev, imagen_url: uploadedUrl }));
                                }
                              }
                            }}
                            disabled={isUploadingLeadLogo}
                          />
                        </label>
                      </div>
                    </div>

                    {newLeadData.imagen_url ? (
                      <div className="flex items-center gap-3 p-2 bg-neutral-950 rounded-xl border border-neutral-800">
                        <img
                          src={newLeadData.imagen_url}
                          alt="Logo"
                          className="w-8 h-8 rounded-lg object-cover border border-amber-500/50 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] text-zinc-300 font-semibold truncate">
                            {newLeadData.imagen_url}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewLeadData(prev => ({ ...prev, imagen_url: '' }))}
                          className="text-[10px] text-rose-400 hover:underline px-1 cursor-pointer"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['📻', '📰', '🌐', '🎙️', '📺', '🏛️', '🎪', '🪩', '🎸', '💼', '⚡', '🔥'].map(
                          emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setNewLeadData(prev => ({ ...prev, icono: emoji }))}
                              className={`w-7 h-7 rounded-lg text-xs flex items-center justify-center transition-all cursor-pointer ${
                                newLeadData.icono === emoji
                                  ? 'bg-amber-500 text-stone-950 font-bold scale-105 shadow-xs'
                                  : 'bg-neutral-800 text-zinc-300 hover:bg-neutral-700'
                              }`}
                            >
                              {emoji}
                            </button>
                          )
                        )}
                      </div>
                    )}
                  </div>

                  {/* Address & Region */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Dirección</label>
                      <input
                        type="text"
                        placeholder="Calle San Vicente 33"
                        value={newLeadData.direccion || ''}
                        onChange={e => setNewLeadData(prev => ({ ...prev, direccion: e.target.value }))}
                        className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:outline-none border ${
                          isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-950 text-white border-neutral-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Región / Alcance</label>
                      <input
                        type="text"
                        placeholder="Comunidad / Provincia"
                        value={newLeadData.region}
                        onChange={e => setNewLeadData(prev => ({ ...prev, region: e.target.value }))}
                        className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:outline-none border ${
                          isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-950 text-white border-neutral-800'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Secondary email & fixed phone */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Email Secundario</label>
                      <input
                        type="email"
                        placeholder="promotora@mail.com"
                        value={newLeadData.email_secundario || ''}
                        onChange={e => setNewLeadData(prev => ({ ...prev, email_secundario: e.target.value }))}
                        className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:outline-none border ${
                          isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-950 text-white border-neutral-800'
                        }`}
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Teléfono Fijo</label>
                      <input
                        type="tel"
                        placeholder="+34 912 345 678"
                        value={newLeadData.telefono_fijo || ''}
                        onChange={e => {
                          const val = e.target.value;
                          setNewLeadData(prev => ({
                            ...prev,
                            telefono_fijo: val,
                            telefono: prev.telefono_movil || val || prev.telefono || ''
                          }));
                        }}
                        className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:outline-none border ${
                          isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-950 text-white border-neutral-800'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Pitch / Proposal */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Propuesta de Concierto</label>
                    <textarea
                      rows={2}
                      placeholder="Propuesta de fecha, caché o taquilla..."
                      value={newLeadData.pitch_generado}
                      onChange={e => setNewLeadData(prev => ({ ...prev, pitch_generado: e.target.value }))}
                      className={`w-full rounded-xl p-2.5 text-xs focus:outline-none border ${
                        isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-950 text-white border-neutral-800'
                      }`}
                    />
                  </div>

                  {/* Internal Notes */}
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-400 mb-1">Notas Internas</label>
                    <input
                      type="text"
                      placeholder="Programador principal, aforo 300, etc."
                      value={newLeadData.notas}
                      onChange={e => setNewLeadData(prev => ({ ...prev, notas: e.target.value }))}
                      className={`w-full rounded-xl px-2.5 py-1.5 text-xs focus:outline-none border ${
                        isStitchLight ? 'bg-white text-slate-900 border-slate-300' : 'bg-neutral-950 text-white border-neutral-800'
                      }`}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-white/5 transition-colors font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-stone-950 transition-all active:scale-95 cursor-pointer shadow-md"
              >
                {sectionTab === 'medios' ? 'Guardar Medio' : sectionTab === 'grupos' ? 'Guardar Contacto' : 'Guardar Sala'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ModalPortal>
  );
}

