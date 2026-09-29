import React, { useState } from "react";
import {
  X,
  Download,
  FileSpreadsheet,
  FileCode,
  Filter,
  Layers,
  CheckSquare,
} from "lucide-react";
import { Lead } from "../../types";

interface ExportLeadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  allLeads: Lead[];
  filteredLeads: Lead[];
  selectedLeadIds?: string[];
  bandName?: string;
}

export const ExportLeadsModal: React.FC<ExportLeadsModalProps> = ({
  isOpen,
  onClose,
  allLeads,
  filteredLeads,
  selectedLeadIds = [],
  bandName = "Banda",
}) => {
  const [exportScope, setExportScope] = useState<
    "filtered" | "all" | "selected"
  >("filtered");
  const [exportFormat, setExportFormat] = useState<"csv" | "json">("csv");
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includePitch, setIncludePitch] = useState(true);

  if (!isOpen) return null;

  const selectedLeads = allLeads.filter((l) => selectedLeadIds.includes(l.id));

  const getTargetLeads = () => {
    if (exportScope === "selected" && selectedLeads.length > 0) {
      return selectedLeads;
    }
    if (exportScope === "all") {
      return allLeads;
    }
    return filteredLeads;
  };

  const cleanCsvCell = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, "");
    return `"${str}"`;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    const leadsToExport = getTargetLeads();
    if (leadsToExport.length === 0) {
      alert("No hay contactos para exportar con la selección actual.");
      return;
    }

    const cleanBandName = bandName.replace(/[^a-zA-Z0-9_-]/g, "_") || "Banda";
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${cleanBandName}_Leads_${exportScope}_${dateStr}.${exportFormat}`;

    if (exportFormat === "json") {
      const jsonContent = JSON.stringify(leadsToExport, null, 2);
      const blob = new Blob([jsonContent], {
        type: "application/json;charset=utf-8;",
      });
      downloadBlob(blob, filename);
    } else {
      // CSV format with UTF-8 BOM (\uFEFF) for Excel compatibility on Windows
      const headers = [
        "ID",
        "Nombre / Sala",
        "Ciudad",
        "Región / Provincia",
        "Dirección",
        "Aforo",
        "Tipo",
        "Estado CRM",
        "Email Contacto",
        "Teléfono Móvil (WhatsApp)",
        "Teléfono Fijo",
        "Teléfono General",
        "Web",
        "Instagram",
        "Género / Estilo",
        "Fuente",
      ];

      if (includePitch) headers.push("Pitch Generado");
      if (includeNotes) headers.push("Notas / Historial");

      const rows = leadsToExport.map((l) => {
        const row = [
          cleanCsvCell(l.id),
          cleanCsvCell(l.nombre_sala),
          cleanCsvCell(l.ciudad),
          cleanCsvCell(l.region),
          cleanCsvCell(l.direccion),
          l.aforo || 0,
          cleanCsvCell(l.tipo),
          cleanCsvCell(l.estado),
          cleanCsvCell(l.email_contacto),
          cleanCsvCell(l.telefono_movil),
          cleanCsvCell(l.telefono_fijo),
          cleanCsvCell(l.telefono),
          cleanCsvCell(l.website),
          cleanCsvCell(l.instagram),
          cleanCsvCell(l.genero),
          cleanCsvCell(l.fuente),
        ];

        if (includePitch) row.push(cleanCsvCell(l.pitch_generado));
        if (includeNotes) row.push(cleanCsvCell(l.notas));

        return row.join(",");
      });

      const csvString = "\uFEFF" + [headers.join(","), ...rows].join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, filename);
    }

    onClose();
  };

  const targetCount = getTargetLeads().length;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[var(--scrim)]/75 animate-fadeIn">
      <div className="bg-[var(--surface)] rounded-[var(--r-l)] max-w-lg w-full p-6 space-y-6 text-[var(--ink)] relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[var(--r-m)] bg-[var(--acc)]/20 flex items-center justify-center text-[var(--acc)]">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--ink)]">
                Exportar Leads de Booking
              </h3>
              <p className="text-xs text-[var(--ink-2)]">
                Descarga tu base de contactos en Excel o JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-[var(--r-m)] text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--surface)] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Scope selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--acc)]/70 block">
            1. ¿Qué contactos quieres exportar?
          </label>
          <div className="grid grid-cols-1 gap-2">
            {/* Filtered */}
            <button
              type="button"
              onClick={() => setExportScope("filtered")}
              className={`p-3 rounded-[var(--r-m)] text-left flex items-start gap-3 transition cursor-pointer ${
                exportScope === "filtered"
                  ? "bg-[var(--acc)]/20  text-[var(--ink)]"
                  : "bg-[var(--bg)]/60 text-[var(--ink-2)] hover:text-[var(--ink)] hover:brightness-95"
              }`}
            >
              <Filter
                className={`w-4 h-4 mt-0.5 shrink-0 ${exportScope === "filtered" ? "text-[var(--acc)]" : "text-[var(--ink-2)]"}`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">
                    Contactos a la vista con filtro actual
                  </span>
                  <span className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--acc)]/70">
                    {filteredLeads.length} contactos
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
                  Exporta únicamente las salas o medios que cumplen la búsqueda
                  y los filtros aplicados en este momento.
                </p>
              </div>
            </button>

            {/* All */}
            <button
              type="button"
              onClick={() => setExportScope("all")}
              className={`p-3 rounded-[var(--r-m)] text-left flex items-start gap-3 transition cursor-pointer ${
                exportScope === "all"
                  ? "bg-[var(--acc)]/20  text-[var(--ink)]"
                  : "bg-[var(--bg)]/60 text-[var(--ink-2)] hover:text-[var(--ink)] hover:brightness-95"
              }`}
            >
              <Layers
                className={`w-4 h-4 mt-0.5 shrink-0 ${exportScope === "all" ? "text-[var(--acc)]" : "text-[var(--ink-2)]"}`}
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">
                    Todos los contactos del CRM
                  </span>
                  <span className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--sunken)] text-[var(--ink-2)]">
                    {allLeads.length} contactos
                  </span>
                </div>
                <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
                  Exporta toda la base de datos de salas, festivales, medios y
                  contactos de la banda activa.
                </p>
              </div>
            </button>

            {/* Selected if any */}
            {selectedLeadIds.length > 0 && (
              <button
                type="button"
                onClick={() => setExportScope("selected")}
                className={`p-3 rounded-[var(--r-m)] text-left flex items-start gap-3 transition cursor-pointer ${
                  exportScope === "selected"
                    ? "bg-[var(--acc)]/20  text-[var(--ink)]"
                    : "bg-[var(--bg)]/60 text-[var(--ink-2)] hover:text-[var(--ink)] hover:brightness-95"
                }`}
              >
                <CheckSquare
                  className={`w-4 h-4 mt-0.5 shrink-0 ${exportScope === "selected" ? "text-[var(--acc)]" : "text-[var(--ink-2)]"}`}
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">
                      Solo contactos seleccionados
                    </span>
                    <span className="text-[11px] font-sans font-bold px-2 py-0.5 rounded-[var(--r-pill)] bg-[var(--acc)]/20 text-[var(--acc)]/70">
                      {selectedLeads.length} seleccionados
                    </span>
                  </div>
                  <p className="text-[11px] text-[var(--ink-2)] mt-0.5">
                    Exporta únicamente las casillas que has marcado
                    explícitamente en la lista.
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* 2. Format selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[var(--acc)]/70 block">
            2. Formato de descarga
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setExportFormat("csv")}
              className={`p-3 rounded-[var(--r-m)] text-left flex items-center gap-2.5 transition cursor-pointer ${
                exportFormat === "csv"
                  ? "bg-[var(--ok)]/20 text-[var(--ink)] font-bold"
                  : "bg-[var(--bg)]/60 text-[var(--ink-2)] hover:text-[var(--ink)] hover:brightness-95"
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-[var(--ok)] shrink-0" />
              <div>
                <span className="text-xs block">Excel / CSV (.csv)</span>
                <span className="text-[10px] text-[var(--ink-2)] font-normal">
                  Compatible UTF-8 Windows
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat("json")}
              className={`p-3 rounded-[var(--r-m)] text-left flex items-center gap-2.5 transition cursor-pointer ${
                exportFormat === "json"
                  ? "bg-[var(--acc)]/20 text-[var(--tentative)]/40 font-bold"
                  : "bg-[var(--bg)]/60 text-[var(--ink-2)] hover:text-[var(--ink)] hover:brightness-95"
              }`}
            >
              <FileCode className="w-4 h-4 text-[var(--ink-2)] shrink-0" />
              <div>
                <span className="text-xs block">JSON Datos (.json)</span>
                <span className="text-[10px] text-[var(--ink-2)] font-normal">
                  Objeto raw estructurado
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* 3. CSV Options */}
        {exportFormat === "csv" && (
          <div className="p-3 rounded-[var(--r-m)] bg-[var(--bg)]/80 space-y-2">
            <span className="text-[11px] font-bold text-[var(--ink-2)] block">
              Campos adicionales en CSV:
            </span>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-[var(--ink-2)]">
                <input
                  type="checkbox"
                  checked={includePitch}
                  onChange={(e) => setIncludePitch(e.target.checked)}
                  className="rounded700 text-[var(--acc)] focus:ring-[var(--acc)]/20 bg-[var(--bg)]"
                />
                <span>Incluir Pitch / Propuesta IA</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-[var(--ink-2)]">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded700 text-[var(--acc)] focus:ring-[var(--acc)]/20 bg-[var(--bg)]"
                />
                <span>Incluir Historial y Notas</span>
              </label>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-[var(--r-m)] text-xs font-bold bg-[var(--sunken)] hover:bg-[var(--ink-3)]/60 text-[var(--ink-2)] transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={targetCount === 0}
            className="px-5 py-2.5 rounded-[var(--r-m)] text-xs font-bold bg-[var(--acc)] hover:bg-[var(--acc)]/60 text-[var(--on-acc)] flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>
              Descargar {targetCount}{" "}
              {targetCount === 1 ? "contacto" : "contactos"}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
