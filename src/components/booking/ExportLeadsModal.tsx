import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileCode, Filter, Layers, CheckSquare } from 'lucide-react';
import { Lead } from '../../types';

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
  bandName = 'Banda'
}) => {
  const [exportScope, setExportScope] = useState<'filtered' | 'all' | 'selected'>('filtered');
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includePitch, setIncludePitch] = useState(true);

  if (!isOpen) return null;

  const selectedLeads = allLeads.filter(l => selectedLeadIds.includes(l.id));

  const getTargetLeads = () => {
    if (exportScope === 'selected' && selectedLeads.length > 0) {
      return selectedLeads;
    }
    if (exportScope === 'all') {
      return allLeads;
    }
    return filteredLeads;
  };

  const cleanCsvCell = (val: any) => {
    if (val === undefined || val === null) return '""';
    const str = String(val).replace(/"/g, '""').replace(/\r?\n/g, ' ');
    return `"${str}"`;
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
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
      alert('No hay contactos para exportar con la selección actual.');
      return;
    }

    const cleanBandName = bandName.replace(/[^a-zA-Z0-9_-]/g, '_') || 'Banda';
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `${cleanBandName}_Leads_${exportScope}_${dateStr}.${exportFormat}`;

    if (exportFormat === 'json') {
      const jsonContent = JSON.stringify(leadsToExport, null, 2);
      const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
      downloadBlob(blob, filename);
    } else {
      // CSV format with UTF-8 BOM (\uFEFF) for Excel compatibility on Windows
      const headers = [
        'ID',
        'Nombre / Sala',
        'Ciudad',
        'Región / Provincia',
        'Dirección',
        'Aforo',
        'Tipo',
        'Estado CRM',
        'Email Contacto',
        'Teléfono Móvil (WhatsApp)',
        'Teléfono Fijo',
        'Teléfono General',
        'Web',
        'Instagram',
        'Género / Estilo',
        'Fuente'
      ];

      if (includePitch) headers.push('Pitch Generado');
      if (includeNotes) headers.push('Notas / Historial');

      const rows = leadsToExport.map(l => {
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
          cleanCsvCell(l.fuente)
        ];

        if (includePitch) row.push(cleanCsvCell(l.pitch_generado));
        if (includeNotes) row.push(cleanCsvCell(l.notas));

        return row.join(',');
      });

      const csvString = '\uFEFF' + [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      downloadBlob(blob, filename);
    }

    onClose();
  };

  const targetCount = getTargetLeads().length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#181716] border border-amber-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 text-zinc-100 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Exportar Leads de Booking</h3>
              <p className="text-xs text-zinc-400">Descarga tu base de contactos en Excel o JSON</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Scope selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
            1. ¿Qué contactos quieres exportar?
          </label>
          <div className="grid grid-cols-1 gap-2">
            {/* Filtered */}
            <button
              type="button"
              onClick={() => setExportScope('filtered')}
              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                exportScope === 'filtered'
                  ? 'bg-amber-500/20 border-amber-500/60 text-white'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <Filter className={`w-4 h-4 mt-0.5 shrink-0 ${exportScope === 'filtered' ? 'text-amber-400' : 'text-zinc-500'}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Contactos a la vista con filtro actual</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                    {filteredLeads.length} contactos
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Exporta únicamente las salas o medios que cumplen la búsqueda y los filtros aplicados en este momento.
                </p>
              </div>
            </button>

            {/* All */}
            <button
              type="button"
              onClick={() => setExportScope('all')}
              className={`p-3 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                exportScope === 'all'
                  ? 'bg-amber-500/20 border-amber-500/60 text-white'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <Layers className={`w-4 h-4 mt-0.5 shrink-0 ${exportScope === 'all' ? 'text-amber-400' : 'text-zinc-500'}`} />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">Todos los contactos del CRM</span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                    {allLeads.length} contactos
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Exporta toda la base de datos de salas, festivales, medios y contactos de la banda activa.
                </p>
              </div>
            </button>

            {/* Selected if any */}
            {selectedLeadIds.length > 0 && (
              <button
                type="button"
                onClick={() => setExportScope('selected')}
                className={`p-3 rounded-xl border text-left flex items-start gap-3 transition cursor-pointer ${
                  exportScope === 'selected'
                    ? 'bg-amber-500/20 border-amber-500/60 text-white'
                    : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <CheckSquare className={`w-4 h-4 mt-0.5 shrink-0 ${exportScope === 'selected' ? 'text-amber-400' : 'text-zinc-500'}`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">Solo contactos seleccionados</span>
                    <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                      {selectedLeads.length} seleccionados
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Exporta únicamente las casillas que has marcado explícitamente en la lista.
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>

        {/* 2. Format selection */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-amber-300 uppercase tracking-wider block">
            2. Formato de descarga
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setExportFormat('csv')}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                exportFormat === 'csv'
                  ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-200 font-bold'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-xs block">Excel / CSV (.csv)</span>
                <span className="text-[10px] text-zinc-400 font-normal">Compatible UTF-8 Windows</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setExportFormat('json')}
              className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition cursor-pointer ${
                exportFormat === 'json'
                  ? 'bg-sky-500/20 border-sky-500/60 text-sky-200 font-bold'
                  : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <FileCode className="w-4 h-4 text-sky-400 shrink-0" />
              <div>
                <span className="text-xs block">JSON Datos (.json)</span>
                <span className="text-[10px] text-zinc-400 font-normal">Objeto raw estructurado</span>
              </div>
            </button>
          </div>
        </div>

        {/* 3. CSV Options */}
        {exportFormat === 'csv' && (
          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 space-y-2">
            <span className="text-[11px] font-bold text-zinc-300 block">Campos adicionales en CSV:</span>
            <div className="flex items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={includePitch}
                  onChange={(e) => setIncludePitch(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500/20 bg-zinc-950"
                />
                <span>Incluir Pitch / Propuesta IA</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded border-zinc-700 text-amber-500 focus:ring-amber-500/20 bg-zinc-950"
                />
                <span>Incluir Historial y Notas</span>
              </label>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={targetCount === 0}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-2 shadow-lg shadow-amber-500/10 transition cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>Descargar {targetCount} {targetCount === 1 ? 'contacto' : 'contactos'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
