/**
 * Cabecera del panel de fans: título, tutorial y menú de acciones.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { Copy,Download,Eye,MoreHorizontal,Plus,QrCode,Sparkles } from "lucide-react";
import { ModuleTutorialTrigger } from "../common/ModuleTutorialTrigger";
import { Button,MenuItem } from "../ui";
import { PopoverAncla } from "../ui/PopoverAncla";
import { useFansPanel } from "./FansPanelContext";

/**
 * Cabecera del panel de fans: título, tutorial y menú de acciones.
 * @returns Sección de interfaz.
 */
export function FansPanelHeader() {
  const { openTutorial, setShowFansHeaderMenu, showFansHeaderMenu, setShowFansPreviewModal, copyLink, setShowAddModal, handleExportCSV } = useFansPanel();
  return (
    <>
<div className="flex items-center justify-between gap-3 bg-[var(--surface)] rounded-[var(--r-l)] p-4 sm:p-6">
        <div className="min-w-0">
          <h2
            className="page-title flex items-center gap-2 sm:gap-3"
            title="Captura de fans en directo con códigos QR, métricas de redes, comunidad interactiva y analítica de crecimiento."
          >
            <QrCode className="size-5 sm:size-6 text-[var(--acc)] shrink-0" />
            <span className="truncate">Captura QR y fans</span>
          </h2>
          <p className="hidden sm:block text-[var(--ink-2)] font-sans text-sm mt-1">
            Captura de fans en directo con códigos QR, métricas de redes,
            comunidad interactiva y analítica de crecimiento.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <ModuleTutorialTrigger
            moduleId="fans"
            onClick={openTutorial}
            label="Guía rápida"
          />

          <div className="relative shrink-0">
            <Button
              variant="neutral"
              type="button"
              onClick={() => setShowFansHeaderMenu((v) => !v)}
              title="Previsualizar formulario, copiar enlace, registrar fan manual, exportar CSV o ver guía"
            >
              <MoreHorizontal className="w-4 h-4" />
            </Button>
            {showFansHeaderMenu && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setShowFansHeaderMenu(false)}
                />
                <PopoverAncla className="absolute right-0 top-full mt-1.5 z-40 w-64 rounded-[var(--r-m)] bg-[var(--sunken)] p-1.5 space-y-0.5 text-xs font-sans">
                  <MenuItem
                    tone="acc"
                    type="button"
                    onClick={() => {
                      setShowFansHeaderMenu(false);
                      openTutorial();
                    }}
                  >
                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-[var(--acc)]" />{" "}
                    Guía rápida y tutorial
                  </MenuItem>
                  <MenuItem
                    tone="acc"
                    type="button"
                    onClick={() => {
                      setShowFansHeaderMenu(false);
                      setShowFansPreviewModal(true);
                    }}
                  >
                    <Eye className="w-3.5 h-3.5 shrink-0" /> Previsualizar
                    formulario
                  </MenuItem>
                  <MenuItem
                    tone="muted"
                    type="button"
                    onClick={() => {
                      setShowFansHeaderMenu(false);
                      copyLink();
                    }}
                  >
                    <Copy className="w-3.5 h-3.5 shrink-0" /> Enlace de captura
                    corto
                  </MenuItem>
                  <MenuItem
                    tone="muted"
                    type="button"
                    onClick={() => {
                      setShowFansHeaderMenu(false);
                      setShowAddModal(true);
                    }}
                  >
                    <Plus className="w-3.5 h-3.5 shrink-0" /> Registrar fan
                    manual
                  </MenuItem>
                  <MenuItem
                    tone="muted"
                    id="fans-export-csv-btn"
                    type="button"
                    onClick={() => {
                      setShowFansHeaderMenu(false);
                      handleExportCSV();
                    }}
                  >
                    <Download className="w-3.5 h-3.5 shrink-0" /> Exportar CSV
                  </MenuItem>
                </PopoverAncla>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
