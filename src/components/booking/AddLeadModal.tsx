import React, { useState } from 'react';
import { X, Building2, Radio, Sparkles, Loader2, Upload, Briefcase, SlidersHorizontal, ChevronDown, ChevronUp } from 'lucide-react';
import { LeadType } from '../../types';
import { apiFetch } from '../../utils/api';
import { ModalPortal } from '../common/ModalPortal';
import { ShowIcon } from '../ui/ShowIcon';
import { IconButton, Input, Select, Textarea } from '../ui';

// Espectro resuelve claro/oscuro en tokens: las ramas `isStitchLight` que llegan de main no deben
// activarse nunca (traerían de vuelta slate/indigo). Se eliminan en el restyle de este fichero.
const isStitchLight = false;

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
  onLeadLogoUpload,
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
          ciudad: newLeadData.ciudad,
        }),
      });
      if (res.success && res.data) {
        setNewLeadData((prev) => ({
          ...prev,
          imagen_url: res.data.imagen_url || prev.imagen_url,
          icono: res.data.icono || prev.icono,
          website: res.data.website || prev.website,
          instagram: res.data.instagram || prev.instagram,
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
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/80 overflow-y-auto overscroll-contain animate-fadeIn">
        <div
          className={`w-full max-w-lg p-5 rounded-[var(--r-l)] space-y-4 max-h-[90vh] overflow-y-auto my-auto ${'bg-[var(--surface)] text-[var(--ink)]'}`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-[var(--hair)]/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[var(--r-m)] bg-[var(--acc)]/15 flex items-center justify-center text-[var(--acc-ink)]">
                {sectionTab === 'medios' ? (
                  <Radio className="w-4 h-4 text-[var(--alert)]" />
                ) : sectionTab === 'grupos' ? (
                  <Briefcase className="w-4 h-4 text-[var(--acc)]" />
                ) : (
                  <Building2 className="w-4 h-4 text-[var(--acc)]" />
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
                <p className="text-xs text-[var(--ink-2)] font-normal">Añade un contacto a tu pipeline CRM de booking</p>
              </div>
            </div>
            <IconButton
              label="Cerrar"
              size="icon-xs"
              onClick={onClose}
            >
              <X className="w-5 h-5" />
            </IconButton>
          </div>

          <form onSubmit={onSubmit} className="space-y-3.5 text-xs font-sans">
            {/* Name + AI Scout Auto-fill */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className={`block text-micro font-sans ${textSub}`}>
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
                  className={`px-2 py-1 text-micro font-sans rounded-[var(--r-pill)] font-bold flex items-center gap-1.5 transition-ui cursor-pointer ${'bg-[var(--acc)]/10 hover:bg-[var(--acc)]/20 text-[var(--acc-ink)] disabled:opacity-50'}`}
                  title="Buscar automáticamente email, teléfono y ubicación con el Agente Scout IA"
                >
                  {isModalScraping ? (
                    <Loader2 className="w-3 h-3 animate-spin text-[var(--acc)]" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-[var(--acc)]" />
                  )}
                  <span>{isModalScraping ? 'Buscando...' : 'Autocompletar con IA'}</span>
                </button>
              </div>
              <Input
                size="sm"
                type="text"
                required
                placeholder={sectionTab === 'medios' ? 'Ej. Radio 3, Mondosonoro' : 'Ej. Sala El Sol, Festival Cabo de Plata'}
                value={newLeadData.nombre_sala}
                onChange={(e) =>
                  setNewLeadData((prev) => ({
                    ...prev,
                    nombre_sala: e.target.value,
                  }))
                }
                className="w-full"
              />
            </div>

            {/* Status Messages */}
            {isModalScraping && (
              <div className="p-2.5 rounded-[var(--r-m)] text-xs flex items-center gap-2 bg-[var(--acc)]/10 text-[var(--acc-ink)] ">
                <Loader2 className="w-4 h-4 animate-spin shrink-0 text-[var(--acc)]" />
                <span className="font-medium">{modalScrapeStatus}</span>
              </div>
            )}
            {modalScrapeError && (
              <div className="p-2.5 rounded-[var(--r-m)] text-xs text-[var(--ink)] bg-[var(--alert)]/15 "><ShowIcon inline emoji="⚠️" />{modalScrapeError}</div>
            )}
            {modalScrapeSuccessMsg && (
              <div className="p-2.5 rounded-[var(--r-m)] text-xs text-[var(--ink)] bg-[var(--ok)]/15 ">
                {modalScrapeSuccessMsg}
              </div>
            )}

            {/* City & Venue Type */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={`block text-micro font-sans mb-1 ${textSub}`}>Ciudad</label>
                <Input
                  size="sm"
                  type="text"
                  placeholder="Ej. Madrid, Barcelona"
                  value={newLeadData.ciudad}
                  onChange={(e) =>
                    setNewLeadData((prev) => ({
                      ...prev,
                      ciudad: e.target.value,
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">
                  {sectionTab === 'medios' ? 'Tipo de Medio' : 'Tipo de Espacio'}
                </label>
                {sectionTab === 'medios' ? (
                  <Select
                    size="sm"
                    value={newLeadData.genero}
                    onChange={(e) => setNewLeadData((prev) => ({ ...prev, genero: e.target.value }))}
                    wrapperClassName="w-full"
                  >
                    <option value="Radio">Radio / Programa</option>
                    <option value="Televisión">Televisión / vídeo</option>
                    <option value="Prensa">Prensa / Revista</option>
                    <option value="Redes Sociales">Redes / Creadores</option>
                    <option value="Podcasts">Podcasts / Entrevistas</option>
                  </Select>
                ) : (
                  <Select
                    size="sm"
                    value={newLeadData.tipo}
                    onChange={(e) => setNewLeadData((prev) => ({ ...prev, tipo: e.target.value as LeadType }))}
                    wrapperClassName="w-full"
                  >
                    <option value="sala">Sala de conciertos</option>
                    <option value="festival">Festival</option>
                    <option value="ayuntamiento">Ayuntamiento / fiestas</option>
                    <option value="agencia">Agencia de Booking</option>
                    <option value="manager">Mánager / Representante</option>
                    <option value="productora">Productora / Promotora</option>
                    <option value="productor">Productor / estudio</option>
                    <option value="patrocinador">Marca / Patrocinador</option>
                    <option value="supervisor_sync">Supervisor musical (Sync)</option>
                    <option value="sello">Sello Discográfico</option>
                    <option value="grupo">Banda Amiga</option>
                  </Select>
                )}
              </div>
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">Email principal</label>
                <Input
                  size="sm"
                  type="email"
                  placeholder="info@sala.com"
                  value={newLeadData.email_contacto}
                  onChange={(e) =>
                    setNewLeadData((prev) => ({
                      ...prev,
                      email_contacto: e.target.value,
                    }))
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">Teléfono (WhatsApp)</label>
                <Input
                  size="sm"
                  type="tel"
                  placeholder="+34 612 345 678"
                  value={newLeadData.telefono_movil || ''}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNewLeadData((prev) => ({
                      ...prev,
                      telefono_movil: val,
                      telefono: val || prev.telefono_fijo || prev.telefono || '',
                    }));
                  }}
                  className="w-full"
                />
              </div>
            </div>

            {/* Collapsible Advanced Section */}
            <div
              className={`rounded-[var(--r-l)] transition-ui overflow-hidden ${
                'bg-[var(--sunken)] '
              }`}
            >
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className={`w-full px-3.5 py-2.5 flex items-center justify-between font-medium text-xs transition-colors cursor-pointer ${
                  'hover:bg-[var(--sunken)] text-[var(--ink)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--acc)]" />
                  <span className="font-semibold">Más datos de contacto y notas</span>
                  <span className="text-micro text-[var(--ink-2)] font-normal">(Logo, dirección, proposal…)</span>
                </div>
                {showAdvanced ? <ChevronUp className="w-4 h-4 text-[var(--ink-2)]" /> : <ChevronDown className="w-4 h-4 text-[var(--ink-2)]" />}
              </button>

              {showAdvanced && (
                <div className="p-3.5 pt-1 space-y-3 border-t border-[var(--hair)]/5">
                  {/* Logo block */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-semibold text-[var(--ink-2)]">Logo o icono</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleAutoSearchLogo}
                          disabled={isSearchingLogo || !newLeadData.nombre_sala}
                          className="px-2.5 py-1 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc-ink)] text-micro rounded-[var(--r-pill)] flex items-center gap-1 font-bold transition-ui cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-3 h-3 text-[var(--acc)]" />
                          <span>{isSearchingLogo ? 'Buscando...' : 'Buscar Logo'}</span>
                        </button>
                        <label className="cursor-pointer px-2.5 py-1 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] text-micro rounded-[var(--r-m)] flex items-center gap-1 font-bold transition-ui ">
                          <Upload className="w-3 h-3 text-[var(--acc)]" />
                          <span>{isUploadingLeadLogo ? 'Subiendo...' : 'Subir'}</span>
                          <input aria-label="Logo o icono"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              if (e.target.files && e.target.files[0]) {
                                const file = e.target.files[0];
                                const uploadedUrl = await onLeadLogoUpload(file);
                                if (uploadedUrl) {
                                  setNewLeadData((prev) => ({ ...prev, imagen_url: uploadedUrl }));
                                }
                              }
                            }}
                            disabled={isUploadingLeadLogo}
                          />
                        </label>
                      </div>
                    </div>

                    {newLeadData.imagen_url ? (
                      <div className="flex items-center gap-3 p-2 bg-[var(--surface)] rounded-[var(--r-m)] ">
                        <img
                          src={newLeadData.imagen_url}
                          alt="Logo"
                          className="w-8 h-8 rounded-[var(--r-m)] object-cover shrink-0 bg-[var(--acc)]/10"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-micro text-[var(--ink-2)] font-semibold truncate">{newLeadData.imagen_url}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewLeadData((prev) => ({ ...prev, imagen_url: '' }))}
                          className="text-micro text-[var(--alert)] hover:underline px-1 cursor-pointer"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {['📻', '📰', '🌐', '🎙️', '📺', '🏛️', '🎪', '🪩', '🎸', '💼', '⚡', '🔥'].map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNewLeadData((prev) => ({ ...prev, icono: emoji }))}
                            className={`w-7 h-7 rounded-[var(--r-m)] text-xs flex items-center justify-center transition-ui cursor-pointer ${
                              newLeadData.icono === emoji
                                ? 'bg-[var(--acc)] text-[var(--on-acc)] font-bold scale-105 shadow-xs'
                                : 'bg-[var(--surface)] text-[var(--ink-2)] hover:bg-[var(--surface)]'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Address & Region */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">Dirección</label>
                      <Input
                        size="sm"
                        type="text"
                        placeholder="Calle San Vicente 33"
                        value={newLeadData.direccion || ''}
                        onChange={(e) => setNewLeadData((prev) => ({ ...prev, direccion: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">Región / Alcance</label>
                      <Input
                        size="sm"
                        type="text"
                        placeholder="Comunidad / provincia"
                        value={newLeadData.region}
                        onChange={(e) => setNewLeadData((prev) => ({ ...prev, region: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Secondary email & fixed phone */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">Email Secundario</label>
                      <Input
                        size="sm"
                        type="email"
                        placeholder="promotora@mail.com"
                        value={newLeadData.email_secundario || ''}
                        onChange={(e) => setNewLeadData((prev) => ({ ...prev, email_secundario: e.target.value }))}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">Teléfono fijo</label>
                      <Input
                        size="sm"
                        type="tel"
                        placeholder="+34 912 345 678"
                        value={newLeadData.telefono_fijo || ''}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewLeadData((prev) => ({
                            ...prev,
                            telefono_fijo: val,
                            telefono: prev.telefono_movil || val || prev.telefono || '',
                          }));
                        }}
                        className="w-full"
                      />
                    </div>
                  </div>

                  {/* Pitch / Proposal */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">Propuesta de concierto</label>
                    <Textarea
                      rows={2}
                      placeholder="Propuesta de fecha, caché o taquilla…"
                      value={newLeadData.pitch_generado}
                      onChange={(e) => setNewLeadData((prev) => ({ ...prev, pitch_generado: e.target.value }))}
                      className="w-full"
                    />
                  </div>

                  {/* Internal Notes */}
                  <div>
                    <label className="block text-xs font-semibold text-[var(--ink-2)] mb-1">Notas Internas</label>
                    <Input
                      size="sm"
                      type="text"
                      placeholder="Programador principal, aforo 300, etc."
                      value={newLeadData.notas}
                      onChange={(e) => setNewLeadData((prev) => ({ ...prev, notas: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Actions Bar */}
            <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--hair)]/10">
              <button
                type="button"
                onClick={onClose}
                className={`px-2 py-1 rounded-[var(--r-pill)] font-sans text-micro transition-colors cursor-pointer bg-[var(--sunken)] hover:bg-[var(--surface)]/80 text-[var(--ink-2)]`}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={`px-4 py-2 rounded-[var(--r-pill)] font-sans text-micro font-bold transition-ui cursor-pointer ${'bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]'}`}
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
