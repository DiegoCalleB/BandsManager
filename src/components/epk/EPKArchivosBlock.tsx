import React, { useState } from "react";
import {
  ImageIcon,
  FileDown,
  FileText,
  Upload,
  Download,
  Trash2,
  Loader2,
  Sparkles,
} from "lucide-react";
import { EPKConfig } from "../../types";
import { EPKBlockWrapper } from "./EPKBlockWrapper";
import { EPK_BLOCKS, EPKBlockMeta } from "./epkBlocks";
import { AILogoGeneratorModal } from "./AILogoGeneratorModal";
import { Button, IconButton, Input, Select, Textarea } from '../ui';

interface EPKArchivosBlockProps {
  config: EPKConfig;
  setConfig: React.Dispatch<React.SetStateAction<EPKConfig>>;
  isBakandeya?: boolean;
  isUploadingLogo: boolean;
  handleLogoUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  subiendoGaleria: boolean;
  subirFotosGaleria: (files: FileList) => void;
  quitarFotoGaleria: (url: string) => void;
  isUploadingDossier: boolean;
  handleDossierUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isUploadingRider: boolean;
  handleRiderUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  prevBlock?: EPKBlockMeta | null;
  nextBlock?: EPKBlockMeta | null;
  onNavigate?: (blockId: any) => void;
  onSave?: () => void;
  isAllView?: boolean;
}

export const EPKArchivosBlock: React.FC<EPKArchivosBlockProps> = ({
  config,
  setConfig,
  isBakandeya = false,
  isUploadingLogo,
  handleLogoUpload,
  subiendoGaleria,
  subirFotosGaleria,
  quitarFotoGaleria,
  isUploadingDossier,
  handleDossierUpload,
  isUploadingRider,
  handleRiderUpload,
  prevBlock,
  nextBlock,
  onNavigate,
  onSave,
  isAllView = false,
}) => {
  const [showAiLogoModal, setShowAiLogoModal] = useState(false);

  return (
    <EPKBlockWrapper
      meta={EPK_BLOCKS[1]}
      prevBlock={prevBlock}
      nextBlock={nextBlock}
      onNavigate={onNavigate}
      onSave={onSave}
      isAllView={isAllView}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LOGO DE LA BANDA */}
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--hair)] pb-3">
            <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2">
              <ImageIcon className="w-5 h-5" /> Logo oficial de la banda
            </h3>
            <Button
              variant="soft"
              size="xs"
              type="button"
              onClick={() => setShowAiLogoModal(true)}
              className="items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" /> Generar con IA
            </Button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative shrink-0">
              {config.logoUrl && config.logoUrl.trim() !== "" ? (
                <img
                  src={config.logoUrl}
                  alt="Logo de la banda"
                  className="w-28 h-28 rounded-[var(--r-l)] object-contain p-1  bg-[var(--sunken)]"
                />
              ) : isBakandeya ? (
                <img
                  src="/logo_bakandeya_bueno_sin_fondo.png"
                  alt="Bakandeya logo"
                  className="w-28 h-28 rounded-[var(--r-l)] object-contain p-1  bg-[var(--sunken)]"
                />
              ) : (
                <div className="w-28 h-28 rounded-[var(--r-l)] bg-[var(--sunken)] flex flex-col items-center justify-center text-[var(--ink-2)] p-2 text-center">
                  <ImageIcon className="w-8 h-8 text-[var(--ink-2)] mb-1" />
                  <span className="text-micro font-medium text-[var(--ink-2)]">
                    Sin Logo
                  </span>
                </div>
              )}
            </div>

            <div className="space-y-3 flex-1 w-full">
              <div className="flex items-center gap-2">
                <label className="flex-1 cursor-pointer bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold px-4 py-2.5 rounded-[var(--r-m)] text-xs flex items-center justify-center gap-2 transition">
                  {isUploadingLogo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>
                    {isUploadingLogo
                      ? "Subiendo Logo..."
                      : "Subir Logo (PNG/JPG)"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={isUploadingLogo}
                  />
                </label>

                {config.logoUrl && (
                  <Button
                    variant="neutral"
                    type="button"
                    onClick={() => setConfig({ ...config, logoUrl: "" })}
                    title="Eliminar logo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--ink-2)]">
                  O introduce URL de la imagen:
                </label>
                <Input
                  size="sm"
                  type="text"
                  value={config.logoUrl || ""}
                  onChange={(e) =>
                    setConfig({ ...config, logoUrl: e.target.value })
                  }
                  placeholder="https://ejemplo.com/logo.jpg"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </div>

        <AILogoGeneratorModal
          isOpen={showAiLogoModal}
          onClose={() => setShowAiLogoModal(false)}
          onSelectLogo={(logoUrl) =>
            setConfig((prev) => ({ ...prev, logoUrl }))
          }
          genre={config.genero}
        />

        {/* DOSSIER EN PDF O DOCUMENTO OFICIAL */}
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4">
          <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2 pb-3">
            <FileDown className="w-5 h-5" /> Dossier en PDF o documento oficial
          </h3>

          {config.dossierPdfUrl ? (
            <div className="p-4 bg-[var(--sunken)] rounded-[var(--r-m)] space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-[var(--r-s)] bg-[var(--acc)]/20 flex items-center justify-center text-[var(--acc-ink)] shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-xs text-[var(--ink)] truncate">
                      {config.dossierPdfName || "Dossier_Oficial.pdf"}
                    </p>
                    <p className="text-micro text-[var(--acc)] font-medium">
                      Documento adjunto almacenado
                    </p>
                  </div>
                </div>

                <IconButton
                  label="Eliminar dossier"
                  variant="danger"
                  type="button"
                  onClick={() =>
                    setConfig({
                      ...config,
                      dossierPdfUrl: "",
                      dossierPdfName: "",
                    })
                  }
                  className="shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </IconButton>
              </div>

              <div className="flex items-center gap-2 pt-1 ">
                <a
                  href={config.dossierPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-1.5 px-3 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc-ink)] font-bold text-xs rounded-[var(--r-s)] flex items-center justify-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" /> Descargar / abrir dossier
                </a>

                <label className="cursor-pointer py-1.5 px-3 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] font-semibold text-xs rounded-[var(--r-s)] flex items-center gap-1.5 transition">
                  <Upload className="w-3.5 h-3.5 text-[var(--acc)]" /> Cambiar
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleDossierUpload}
                    className="hidden"
                    disabled={isUploadingDossier}
                  />
                </label>
              </div>
            </div>
          ) : (
            <div className="p-5 bg-[var(--sunken)] rounded-[var(--r-m)] text-center space-y-3">
              <div className="w-12 h-12 rounded-[var(--r-pill)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink-2)] mx-auto">
                <FileDown className="w-6 h-6 text-[var(--acc)]" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-bold text-[var(--ink)]">
                  Sube aquí el dossier oficial (PDF o Word)
                </p>
                <p className="text-xs text-[var(--ink-2)]">
                  PDF, Word o TXT. Estará listo para el envío automático en
                  correos.
                </p>
              </div>

              <label className="inline-flex cursor-pointer bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold px-4 py-2 rounded-[var(--r-m)] text-xs items-center gap-2 transition">
                {isUploadingDossier ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>
                  {isUploadingDossier
                    ? "Subiendo Documento..."
                    : "Seleccionar PDF / Dossier"}
                </span>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleDossierUpload}
                  className="hidden"
                  disabled={isUploadingDossier}
                />
              </label>
            </div>
          )}

          <div className="space-y-1 pt-1">
            <label className="text-xs font-semibold text-[var(--ink-2)]">
              O enlace externo al Dossier (Google Drive, Dropbox, etc.):
            </label>
            <Input
              size="sm"
              type="text"
              value={config.dossierPdfUrl || ""}
              onChange={(e) =>
                setConfig({
                  ...config,
                  dossierPdfUrl: e.target.value,
                  dossierPdfName: e.target.value
                    ? config.dossierPdfName || "Enlace Dossier"
                    : "",
                })
              }
              placeholder="https://drive.google.com/file/d/…"
              className="w-full"
            />
          </div>
        </div>

        {/* RIDER TÉCNICO */}
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between pb-3 flex-wrap gap-2">
            <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2">
              <FileDown className="w-5 h-5" /> Rider técnico (Biblioteca
              interna)
            </h3>
            <span className="text-micro font-bold text-[var(--acc-ink)] bg-[var(--acc)]/10 px-2.5 py-1 rounded-[var(--r-pill)]">
              Solo visible aquí
            </span>
          </div>
          <p className="text-xs text-[var(--ink-2)]">
            Este texto y documento no se muestra en el enlace público. Úsalo
            como biblioteca para guardarlo aquí y enviarlo a las salas cuando
            sea necesario.
          </p>

          <div className="space-y-3">
            <label className="text-xs font-bold text-[var(--ink)] block">
              Archivo de rider técnico (PDF)
            </label>
            {config.riderPdfUrl ? (
              <div className="p-3 bg-[var(--sunken)] rounded-[var(--r-m)] space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-[var(--r-s)] bg-[var(--acc)]/10 text-[var(--acc-ink)] flex items-center justify-center shrink-0">
                      <FileDown className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--ink)] truncate">
                        {config.riderPdfName || "Archivo subido"}
                      </p>
                      <p className="text-micro text-[var(--ink-2)] truncate mt-0.5">
                        PDF guardado correctamente
                      </p>
                    </div>
                  </div>
                  <IconButton
                    label="Eliminar PDF"
                    variant="danger"
                    type="button"
                    onClick={() =>
                      setConfig({
                        ...config,
                        riderPdfUrl: "",
                        riderPdfName: "",
                      })
                    }
                    className="shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
                <div className="flex items-center gap-2 pt-1 ">
                  <a
                    href={config.riderPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-1.5 px-3 bg-[var(--acc)]/20 hover:bg-[var(--acc)]/30 text-[var(--acc-ink)] font-bold text-xs rounded-[var(--r-s)] flex items-center justify-center gap-1.5 transition"
                  >
                    <Download className="w-3.5 h-3.5" /> Descargar / abrir rider
                  </a>

                  <label className="cursor-pointer py-1.5 px-3 bg-[var(--surface)] hover:bg-[var(--surface)] text-[var(--ink-2)] font-semibold text-xs rounded-[var(--r-s)] flex items-center gap-1.5 transition">
                    <Upload className="w-3.5 h-3.5 text-[var(--acc)]" /> Cambiar
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={handleRiderUpload}
                      className="hidden"
                      disabled={isUploadingRider}
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="p-5 bg-[var(--sunken)] rounded-[var(--r-m)] text-center space-y-3">
                <div className="w-12 h-12 rounded-[var(--r-pill)] bg-[var(--surface)] flex items-center justify-center text-[var(--ink-2)] mx-auto">
                  <FileDown className="w-6 h-6 text-[var(--acc)]" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[var(--ink)]">
                    Sube aquí el rider técnico (PDF)
                  </p>
                </div>

                <label className="inline-flex cursor-pointer bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold px-4 py-2 rounded-[var(--r-m)] text-xs items-center gap-2 transition">
                  {isUploadingRider ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>
                    {isUploadingRider
                      ? "Subiendo Documento..."
                      : "Seleccionar PDF / Rider"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleRiderUpload}
                    className="hidden"
                    disabled={isUploadingRider}
                  />
                </label>
              </div>
            )}

            <div className="pt-2 space-y-1">
              <label className="text-xs font-semibold text-[var(--ink-2)]">
                Rider técnico (Texto)
              </label>
              <Textarea
                value={config.riderTecnico || ""}
                onChange={(e) =>
                  setConfig({ ...config, riderTecnico: e.target.value })
                }
                placeholder="Canales, microfonía, DIs, etc…"
                rows={4}
                className="w-full"
              />
            </div>
            {/* PARÁMETROS TÉCNICOS CLAVE PARA EL AGENTE DE BOOKING */}
            <div className="pt-3 border-t border-[var(--hair)]/80 space-y-3">
              <h4 className="text-xs font-bold text-[var(--ink-2)] flex items-center gap-2">
                <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--acc)]"></span>
                Parámetros Técnicos Clave para el Agente (Respuestas directas a
                salas)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                {/* Monitoreo */}
                <div className="bg-[var(--sunken)]/80 rounded-[var(--r-m)] p-3 space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ink-2)] block">
                    Sistema de Monitoreo
                  </label>
                  <Select size="sm" aria-label="Sistema de Monitoreo"
                    value={
                      config.riderConfig?.tipoMonitoreo || "sin_preferencia"
                    }
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        riderConfig: {
                          ...(config.riderConfig || {}),
                          tipoMonitoreo: e.target.value as any,
                        },
                      })
                    }
                    wrapperClassName="w-full"
                  >
                    <option value="sin_preferencia">
                      Sin preferencia / Sala
                    </option>
                    <option value="cuñas_escenario">Cuñas de suelo</option>
                    <option value="in_ear">In-Ears propios (IEM)</option>
                    <option value="mixto">Mixto (In-Ears + Cuñas)</option>
                  </Select>
                  <p className="text-micro text-[var(--ink-2)]">
                    Evita pedir monitores extra si lleváis IEM.
                  </p>
                </div>
                {/* Backline */}
                <div className="bg-[var(--sunken)]/80 rounded-[var(--r-m)] p-3 space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ink-2)] block">
                    Backline (Amplis / batería)
                  </label>
                  <Select size="sm" aria-label="Backline (Amplis / batería)"
                    value={config.riderConfig?.backlinePropio || "completo"}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        riderConfig: {
                          ...(config.riderConfig || {}),
                          backlinePropio: e.target.value as any,
                        },
                      })
                    }
                    wrapperClassName="w-full"
                  >
                    <option value="completo">Backline completo propio</option>
                    <option value="parcial">
                      Parcial (pedimos batería/amplis)
                    </option>
                    <option value="sin_backline">
                      Necesitamos backline de sala
                    </option>
                  </Select>
                  <p className="text-micro text-[var(--ink-2)]">
                    Crucial para pactar dobles carteles.
                  </p>
                </div>
                {/* Microfonía */}
                <div className="bg-[var(--sunken)]/80 rounded-[var(--r-m)] p-3 space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ink-2)] block">
                    Microfonía / DIs
                  </label>
                  <div className="flex gap-1.5 pt-0.5">
                    <Button
                      variant={!config.riderConfig?.microfoniaPropia ? "soft" : "neutral"}
                      size="xs"
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          riderConfig: {
                            ...(config.riderConfig || {}),
                            microfoniaPropia: false,
                          },
                        })
                      }
                      className="flex-1"
                    >
                      De la sala
                    </Button>
                    <Button
                      variant={config.riderConfig?.microfoniaPropia ? "soft" : "neutral"}
                      size="xs"
                      type="button"
                      onClick={() =>
                        setConfig({
                          ...config,
                          riderConfig: {
                            ...(config.riderConfig || {}),
                            microfoniaPropia: true,
                          },
                        })
                      }
                      className="flex-1"
                    >
                      Propia
                    </Button>
                  </div>
                  <p className="text-micro text-[var(--ink-2)]">
                    Informa al técnico de la casa.
                  </p>
                </div>
                {/* Tiempo de prueba y canales */}
                <div className="bg-[var(--sunken)]/80 rounded-[var(--r-m)] p-3 space-y-1.5">
                  <label className="text-xs font-semibold text-[var(--ink-2)] block">
                    Prueba / canales mínimos
                  </label>
                  <div className="flex gap-2">
                    <Input
                      size="sm"
                      type="number"
                      value={config.riderConfig?.tiempoPruebaMinutos ?? ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          riderConfig: {
                            ...(config.riderConfig || {}),
                            tiempoPruebaMinutos: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                      placeholder="30 min"
                      className="w-1/2"
                    />
                    <Input
                      size="sm"
                      type="number"
                      value={config.riderConfig?.canalesMinimos ?? ""}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          riderConfig: {
                            ...(config.riderConfig || {}),
                            canalesMinimos: e.target.value
                              ? Number(e.target.value)
                              : undefined,
                          },
                        })
                      }
                      placeholder="12 ch"
                      className="w-1/2"
                    />
                  </div>
                  <p className="text-micro text-[var(--ink-2)]">
                    Minutos y canales de mesa.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* GALERÍA DE IMAGEN & PRENSA */}
        <div className="bg-[var(--surface)] rounded-[var(--r-l)] p-5 sm:p-6 space-y-4 lg:col-span-2">
          <h3 className="text-base sm:text-lg font-bold text-[var(--acc)] flex items-center gap-2 pb-3">
            <ImageIcon className="w-5 h-5" /> Galería de imagen y prensa
          </h3>
          <p className="text-xs text-[var(--ink-2)]">
            Fotos reales de directo o sesión de prensa. Es lo primero que ve
            alguien que nunca os ha visto tocar.
          </p>
          <label
            className={`cursor-pointer bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)] font-bold px-4 py-2.5 rounded-[var(--r-m)] text-xs inline-flex items-center justify-center gap-2 transition ${
              subiendoGaleria ? "opacity-70 pointer-events-none" : ""
            }`}
          >
            {subiendoGaleria ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-4 h-4" />
            )}
            <span>
              {subiendoGaleria
                ? "Subiendo fotos..."
                : "+ Subir fotos (puedes elegir varias a la vez)"}
            </span>
            <input
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              disabled={subiendoGaleria}
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) subirFotosGaleria(files);
                e.target.value = "";
              }}
            />
          </label>
          {(config.bandPhotos || []).length === 0 ? (
            <div className="rounded-[var(--r-m)] bg-[var(--sunken)] p-4 text-xs text-[var(--ink-2)]">
              Todavía no hay fotos de directo o prensa.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {(config.bandPhotos || [])
                .map((item) =>
                  typeof item === "string" ? item : (item as any)?.url || "",
                )
                .filter((url) => typeof url === "string" && url.trim() !== "")
                .map((url, idx) => (
                  <div
                    key={url + idx}
                    className="group relative aspect-video rounded-[var(--r-m)] overflow-hidden bg-[var(--sunken)]"
                  >
                    <img
                      src={url}
                      alt={`Foto ${idx + 1}`}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <IconButton
                      label="Quitar foto"
                      variant="danger"
                      type="button"
                      onClick={() => quitarFotoGaleria(url)}
                      className="absolute top-1.5 right-1.5 opacity-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </IconButton>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </EPKBlockWrapper>
  );
};
