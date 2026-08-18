import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  X,
  Download,
  Info,
  Building2,
  Trash2,
  RefreshCw,
  Eye,
  Check,
  Search,
  Filter
} from 'lucide-react';
import { Lead, LeadType } from '../../types';
import { apiFetch } from '../../utils/api';
import { ModalPortal } from '../common/ModalPortal';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (importedLeads: Lead[], updatedCount: number) => void;
  existingLeads: Lead[];
  isStitchLight?: boolean;
}

interface ColumnMapping {
  nombre_sala: string;
  ciudad: string;
  region: string;
  direccion: string;
  aforo: string;
  tipo: string;
  email_contacto: string;
  telefono: string;
  instagram: string;
  website: string;
  contacto_nombre: string;
  genero: string;
  notas: string;
}

interface ParsedRow {
  id: string;
  nombre_sala: string;
  ciudad: string;
  region: string;
  direccion: string;
  aforo: number;
  tipo: LeadType;
  email_contacto: string;
  telefono: string;
  instagram: string;
  website: string;
  contacto_nombre: string;
  genero: string;
  notas: string;
  isDuplicate: boolean;
  selected: boolean;
  originalData: Record<string, any>;
}

const CATEGORY_OPTIONS: { id: LeadType; label: string; icon: string }[] = [
  { id: 'sala', label: 'Sala / Teatro', icon: '🏛️' },
  { id: 'ayuntamiento', label: 'Ayuntamiento / Fiestas', icon: '🏛️' },
  { id: 'festival', label: 'Festival / Feria', icon: '🎪' },
  { id: 'discoteca', label: 'Discoteca / Club', icon: '🪩' },
  { id: 'grupo', label: 'Grupo / Banda', icon: '🎸' },
  { id: 'agencia', label: 'Agencia / Booking', icon: '💼' },
  { id: 'sello', label: 'Sello Discográfico', icon: '💿' },
  { id: 'medio', label: 'Medio / Radio', icon: '📻' }
];

export function ExcelImportModal({
  isOpen,
  onClose,
  onSuccess,
  existingLeads,
  isStitchLight = false
}: ExcelImportModalProps) {
  // Step state: 1 = Upload, 2 = Map Columns, 3 = Preview & Validate, 4 = Result / Enriching
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [fileName, setFileName] = useState<string>('');
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [rawHeaders, setRawHeaders] = useState<string[]>([]);
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);

  // Mapping
  const [mapping, setMapping] = useState<ColumnMapping>({
    nombre_sala: '',
    ciudad: '',
    region: '',
    direccion: '',
    aforo: '',
    tipo: '',
    email_contacto: '',
    telefono: '',
    instagram: '',
    website: '',
    contacto_nombre: '',
    genero: '',
    notas: ''
  });

  // Parsed and validated rows
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [updateDuplicates, setUpdateDuplicates] = useState<boolean>(true);
  const [enrichMissingWithAi, setEnrichMissingWithAi] = useState<boolean>(false);
  const [defaultCategory, setDefaultCategory] = useState<LeadType>('sala');

  // Loading & statuses
  const [isProcessingFile, setIsProcessingFile] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [importStatusMsg, setImportStatusMsg] = useState<string>('');
  const [searchPreview, setSearchPreview] = useState<string>('');
  const [filterDuplicatesOnly, setFilterDuplicatesOnly] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Auto-detect columns based on common names
  const autoDetectColumns = (headers: string[]) => {
    const clean = (s: string) => s.toLowerCase().trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const newMapping: ColumnMapping = {
      nombre_sala: '',
      ciudad: '',
      region: '',
      direccion: '',
      aforo: '',
      tipo: '',
      email_contacto: '',
      telefono: '',
      instagram: '',
      website: '',
      contacto_nombre: '',
      genero: '',
      notas: ''
    };

    headers.forEach(h => {
      const c = clean(h);
      if (!newMapping.nombre_sala && (c.includes('nombre') || c.includes('sala') || c.includes('venue') || c.includes('local') || c.includes('grupo') || c.includes('banda') || c.includes('espacio') || c.includes('ayto') || c.includes('ayuntamiento'))) {
        newMapping.nombre_sala = h;
      } else if (!newMapping.ciudad && (c.includes('ciudad') || c.includes('poblacion') || c.includes('municipio') || c.includes('localidad') || c.includes('city') || c.includes('lugar'))) {
        newMapping.ciudad = h;
      } else if (!newMapping.region && (c.includes('region') || c.includes('provincia') || c.includes('comunidad') || c.includes('ccaa') || c.includes('state'))) {
        newMapping.region = h;
      } else if (!newMapping.email_contacto && (c.includes('email') || c.includes('mail') || c.includes('correo') || c.includes('e-mail'))) {
        newMapping.email_contacto = h;
      } else if (!newMapping.telefono && (c.includes('telefono') || c.includes('tel') || c.includes('phone') || c.includes('movil') || c.includes('whatsapp') || c.includes('celular'))) {
        newMapping.telefono = h;
      } else if (!newMapping.instagram && (c.includes('instagram') || c.includes('ig') || c.includes('redes') || c.includes('social'))) {
        newMapping.instagram = h;
      } else if (!newMapping.website && (c.includes('web') || c.includes('sitio') || c.includes('url') || c.includes('link') || c.includes('pagina'))) {
        newMapping.website = h;
      } else if (!newMapping.aforo && (c.includes('aforo') || c.includes('capacidad') || c.includes('capacity') || c.includes('personas') || c.includes('pax'))) {
        newMapping.aforo = h;
      } else if (!newMapping.tipo && (c.includes('tipo') || c.includes('categoria') || c.includes('type') || c.includes('clase') || c.includes('rubro'))) {
        newMapping.tipo = h;
      } else if (!newMapping.contacto_nombre && (c.includes('contacto') || c.includes('persona') || c.includes('responsable') || c.includes('programador') || c.includes('booker') || c.includes('encargado'))) {
        newMapping.contacto_nombre = h;
      } else if (!newMapping.genero && (c.includes('genero') || c.includes('estilo') || c.includes('estilos') || c.includes('musica') || c.includes('genre'))) {
        newMapping.genero = h;
      } else if (!newMapping.direccion && (c.includes('direccion') || c.includes('calle') || c.includes('address') || c.includes('ubicacion'))) {
        newMapping.direccion = h;
      } else if (!newMapping.notas && (c.includes('nota') || c.includes('comentario') || c.includes('observacion') || c.includes('historial') || c.includes('info'))) {
        newMapping.notas = h;
      }
    });

    setMapping(newMapping);
  };

  const processFile = async (file: File) => {
    try {
      setIsProcessingFile(true);
      setFileName(file.name);

      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      setWorkbook(wb);
      setSheetNames(wb.SheetNames);

      if (wb.SheetNames.length > 0) {
        const firstSheet = wb.SheetNames[0];
        setSelectedSheet(firstSheet);
        parseSheet(wb, firstSheet);
      }
    } catch (err: any) {
      console.error('Error al leer archivo Excel:', err);
      alert('Error al leer el archivo. Asegúrate de que es un archivo .xlsx, .xls o .csv válido.');
    } finally {
      setIsProcessingFile(false);
    }
  };

  const parseSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const ws = wb.Sheets[sheetName];
    if (!ws) return;

    const data: Record<string, any>[] = XLSX.utils.sheet_to_json(ws, { defval: '' });
    if (data.length === 0) {
      alert('La hoja seleccionada está vacía.');
      return;
    }

    const headers = Object.keys(data[0]);
    setRawHeaders(headers);
    setRawRows(data);
    autoDetectColumns(headers);
    setStep(2);
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbook) {
      parseSheet(workbook, sheetName);
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  // Build parsed rows from raw rows and column mapping
  const buildParsedRows = () => {
    if (!mapping.nombre_sala) {
      alert('Debes asignar al menos la columna correspondiente al "Nombre de la Sala / Contacto / Banda".');
      return;
    }

    const existingMap = new Set<string>();
    existingLeads.forEach(l => {
      const key = `${(l.nombre_sala || '').toLowerCase().trim()}|${(l.ciudad || '').toLowerCase().trim()}`;
      existingMap.add(key);
      existingMap.add((l.nombre_sala || '').toLowerCase().trim());
    });

    const parsed: ParsedRow[] = rawRows.map((row, idx) => {
      const name = String(row[mapping.nombre_sala] || '').trim();
      const city = mapping.ciudad ? String(row[mapping.ciudad] || '').trim() : 'España';
      const region = mapping.region ? String(row[mapping.region] || '').trim() : 'España';
      const address = mapping.direccion ? String(row[mapping.direccion] || '').trim() : '';
      const email = mapping.email_contacto ? String(row[mapping.email_contacto] || '').trim() : '';
      const phone = mapping.telefono ? String(row[mapping.telefono] || '').trim() : '';
      const ig = mapping.instagram ? String(row[mapping.instagram] || '').trim() : '';
      const web = mapping.website ? String(row[mapping.website] || '').trim() : '';
      const contact = mapping.contacto_nombre ? String(row[mapping.contacto_nombre] || '').trim() : '';
      const genre = mapping.genero ? String(row[mapping.genero] || '').trim() : 'Música en Directo / Variado';
      const notes = mapping.notas ? String(row[mapping.notas] || '').trim() : '';
      
      const rawAforo = mapping.aforo ? row[mapping.aforo] : null;
      let aforo = 0;
      if (rawAforo) {
        const num = parseInt(String(rawAforo).replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num)) aforo = num;
      }

      // Detect tipo
      let resolvedType: LeadType = defaultCategory;
      if (mapping.tipo && row[mapping.tipo]) {
        const rawTipo = String(row[mapping.tipo]).toLowerCase().trim();
        if (rawTipo.includes('ayuntamiento') || rawTipo.includes('ayto') || rawTipo.includes('institucion') || rawTipo.includes('festejo') || rawTipo.includes('cultura')) resolvedType = 'ayuntamiento';
        else if (rawTipo.includes('discoteca') || rawTipo.includes('club')) resolvedType = 'discoteca';
        else if (rawTipo.includes('teatro')) resolvedType = 'teatro';
        else if (rawTipo.includes('festival') || rawTipo.includes('feria') || rawTipo.includes('ciclo')) resolvedType = 'festival';
        else if (rawTipo.includes('grupo') || rawTipo.includes('banda') || rawTipo.includes('artista')) resolvedType = 'grupo';
        else if (rawTipo.includes('agencia') || rawTipo.includes('management') || rawTipo.includes('manager') || rawTipo.includes('promotor')) resolvedType = 'agencia';
        else if (rawTipo.includes('sello') || rawTipo.includes('discografica')) resolvedType = 'sello';
        else if (rawTipo.includes('medio') || rawTipo.includes('prensa') || rawTipo.includes('radio') || rawTipo.includes('podcast')) resolvedType = 'medio';
        else resolvedType = 'sala';
      }

      const isDup = existingMap.has(`${name.toLowerCase()}|${city.toLowerCase()}`) || existingMap.has(name.toLowerCase());

      return {
        id: `row-${idx}`,
        nombre_sala: name,
        ciudad: city || 'España',
        region: region || 'España',
        direccion: address,
        aforo: aforo || (resolvedType === 'sala' ? 250 : 0),
        tipo: resolvedType,
        email_contacto: email,
        telefono: phone,
        instagram: ig,
        website: web,
        contacto_nombre: contact,
        genero: genre,
        notas: notes,
        isDuplicate: isDup,
        selected: name.length > 0,
        originalData: row
      };
    }).filter(r => r.nombre_sala.length > 0);

    setParsedRows(parsed);
    setStep(3);
  };

  const handleToggleSelectAll = (select: boolean) => {
    setParsedRows(prev => prev.map(r => ({ ...r, selected: select })));
  };

  const handleRowTypeChange = (rowId: string, newType: LeadType) => {
    setParsedRows(prev => prev.map(r => r.id === rowId ? { ...r, tipo: newType } : r));
  };

  const handleRowDelete = (rowId: string) => {
    setParsedRows(prev => prev.filter(r => r.id !== rowId));
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        "Nombre Sala / Contacto": "Sala El Sol",
        "Ciudad": "Madrid",
        "Región": "Comunidad de Madrid",
        "Dirección": "Calle Jardines 3",
        "Aforo": 300,
        "Tipo": "sala",
        "Email Contacto": "conciertos@salaelsol.com",
        "Teléfono": "915326490",
        "Instagram": "@salaelsol",
        "Sitio Web": "https://salaelsol.com",
        "Contacto / Responsable": "Programación Musical",
        "Estilo / Género": "Rock / Indie / Pop",
        "Notas": "Disponen de equipo de sonido completo y técnico de PA."
      },
      {
        "Nombre Sala / Contacto": "Ayuntamiento de Alcorcón - Concejalía de Fiestas",
        "Ciudad": "Alcorcón",
        "Región": "Madrid",
        "Dirección": "Plaza de España 1",
        "Aforo": 5000,
        "Tipo": "ayuntamiento",
        "Email Contacto": "festejos@ayto-alcorcon.es",
        "Teléfono": "916648100",
        "Instagram": "@aytoalcorcon",
        "Sitio Web": "https://ayto-alcorcon.es",
        "Contacto / Responsable": "Concejal de Festejos",
        "Estilo / Género": "Fiestas Patronales / Conciertos",
        "Notas": "Conciertos de fiestas patronales en septiembre en el recinto ferial."
      },
      {
        "Nombre Sala / Contacto": "Arde Bogotá",
        "Ciudad": "Cartagena",
        "Región": "Murcia",
        "Dirección": "",
        "Aforo": 0,
        "Tipo": "grupo",
        "Email Contacto": "management@ardebogota.com",
        "Teléfono": "",
        "Instagram": "@balaperdida_oficial",
        "Sitio Web": "https://ardebogota.es",
        "Contacto / Responsable": "Booking / Manager",
        "Estilo / Género": "Rock Alternativo",
        "Notas": "Banda afín para intercambio de fechas y colaboraciones."
      },
      {
        "Nombre Sala / Contacto": "Festival Sonorama Ribera",
        "Ciudad": "Aranda de Duero",
        "Región": "Burgos",
        "Dirección": "Recinto Ferial",
        "Aforo": 25000,
        "Tipo": "festival",
        "Email Contacto": "booking@sonorama-aranda.com",
        "Teléfono": "",
        "Instagram": "@sonoramaribera",
        "Sitio Web": "https://sonorama-aranda.com",
        "Contacto / Responsable": "Comité de Programación",
        "Estilo / Género": "Indie / Pop / Rock",
        "Notas": "Festival referente en agosto."
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Salas_BandManager");
    XLSX.writeFile(wb, "plantilla_importacion_salas_bandmanager.xlsx");
  };

  // Submit and Save to Backend / Supabase
  const handleExecuteImport = async () => {
    const selectedRows = parsedRows.filter(r => r.selected);
    if (selectedRows.length === 0) {
      alert('Por favor selecciona al menos un contacto para importar.');
      return;
    }

    try {
      setIsImporting(true);
      setImportStatusMsg(`Guardando ${selectedRows.length} contactos en Supabase...`);

      const leadsPayload = selectedRows.map(r => ({
        nombre_sala: r.nombre_sala,
        ciudad: r.ciudad,
        region: r.region,
        direccion: r.direccion,
        aforo: r.aforo,
        tipo: r.tipo,
        email_contacto: r.email_contacto,
        telefono: r.telefono,
        instagram: r.instagram,
        website: r.website,
        contacto_nombre: r.contacto_nombre,
        genero: r.genero,
        notas: r.notas,
        fuente: `Importación Excel (${fileName || 'Archivo'})`,
        estado: 'nuevo'
      }));

      const res = await apiFetch('/api/leads/import-excel', {
        method: 'POST',
        body: JSON.stringify({
          leads: leadsPayload,
          updateDuplicates,
          sourceName: `Excel: ${fileName || 'Listado de Banda'}`
        })
      });

      if (res.success) {
        // Enriquecer con IA si se solicitó
        if (enrichMissingWithAi && Array.isArray(res.leads) && res.leads.length > 0) {
          const leadsToEnrich = res.leads.filter((l: Lead) => !l.email_contacto || l.email_contacto.trim() === '');
          if (leadsToEnrich.length > 0) {
            setImportStatusMsg(`⚡ Enriqueciendo ${leadsToEnrich.length} contactos sin email con el Agente de IA...`);
            try {
              await apiFetch('/api/leads/extract-emails', {
                method: 'POST',
                body: JSON.stringify({
                  places: leadsToEnrich.slice(0, 10).map((l: Lead) => ({
                    place_id: l.id,
                    nombre_sala: l.nombre_sala,
                    ciudad: l.ciudad,
                    website: l.website
                  }))
                })
              });
            } catch (enrichErr) {
              console.warn('Error en enriquecimiento post-importación:', enrichErr);
            }
          }
        }

        onSuccess(res.leads || [], res.updatedCount || 0);
        onClose();
      } else {
        alert(res.error || 'Error al importar los contactos.');
      }
    } catch (err: any) {
      console.error('Error importing Excel leads:', err);
      alert(err.message || 'Error de conexión al importar contactos.');
    } finally {
      setIsImporting(false);
      setImportStatusMsg('');
    }
  };

  const filteredPreviewRows = parsedRows.filter(r => {
    if (filterDuplicatesOnly && !r.isDuplicate) return false;
    if (!searchPreview) return true;
    const q = searchPreview.toLowerCase();
    return (
      r.nombre_sala.toLowerCase().includes(q) ||
      r.ciudad.toLowerCase().includes(q) ||
      r.email_contacto.toLowerCase().includes(q) ||
      r.tipo.toLowerCase().includes(q)
    );
  });

  const selectedCount = parsedRows.filter(r => r.selected).length;
  const duplicatesCount = parsedRows.filter(r => r.isDuplicate).length;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-in fade-in duration-200">
        <div
          className={`relative w-full max-w-5xl max-h-[92vh] my-auto flex flex-col rounded-2xl border shadow-2xl overflow-hidden ${
            isStitchLight ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#141414] border-zinc-800 text-zinc-100'
          }`}
        >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 bg-gradient-to-r from-emerald-950/30 via-zinc-900/50 to-amber-950/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-sm">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold font-display">
                  Importar Listado de Salas, Ayuntamientos o Bandas
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Excel / CSV
                </span>
              </div>
              <p className="text-xs text-zinc-400">
                Sube tu propio listado, mapea las columnas, clasifícalas y enriquécelas automáticamente en Supabase.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadTemplate}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-all cursor-pointer"
              title="Descargar archivo Excel de ejemplo con las columnas recomendadas"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Plantilla Ejemplo</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* STEP PROGRESS INDICATOR */}
        <div className="flex items-center justify-between px-6 py-2.5 bg-zinc-950/60 border-b border-white/5 text-xs">
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 1 ? 'bg-emerald-500 text-black' : step > 1 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
              {step > 1 ? <Check className="w-3 h-3" /> : '1'}
            </div>
            <span className={step === 1 ? 'font-bold text-emerald-300' : 'text-zinc-400'}>1. Subir archivo</span>
          </div>
          <div className="w-8 h-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 2 ? 'bg-emerald-500 text-black' : step > 2 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-800 text-zinc-500'}`}>
              {step > 2 ? <Check className="w-3 h-3" /> : '2'}
            </div>
            <span className={step === 2 ? 'font-bold text-emerald-300' : 'text-zinc-400'}>2. Mapear columnas</span>
          </div>
          <div className="w-8 h-px bg-zinc-800" />
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 3 ? 'bg-emerald-500 text-black' : 'bg-zinc-800 text-zinc-500'}`}>
              3
            </div>
            <span className={step === 3 ? 'font-bold text-emerald-300' : 'text-zinc-400'}>3. Validar y Guardar</span>
          </div>
        </div>

        {/* MODAL BODY */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 min-h-[350px]">
          {/* STEP 1: UPLOAD */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center py-8 space-y-6">
              <div
                onDragOver={e => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="w-full max-w-2xl p-10 border-2 border-dashed border-zinc-700 hover:border-emerald-500/70 rounded-2xl bg-zinc-900/40 hover:bg-emerald-950/10 transition-all flex flex-col items-center justify-center text-center cursor-pointer group shadow-inner"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 group-hover:bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 transition-all group-hover:scale-110 shadow-sm border border-emerald-500/20">
                  <Upload className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">
                  Haz clic para seleccionar o arrastra tu archivo Excel / CSV
                </h4>
                <p className="text-xs text-zinc-400 mt-1 max-w-md">
                  Soporta formatos <strong className="text-zinc-200">.xlsx, .xls y .csv</strong> de cualquier hoja de cálculo que use tu banda.
                </p>
                <div className="flex items-center gap-2 mt-4 px-3 py-1.5 rounded-full bg-zinc-800/80 text-[11px] text-zinc-300 border border-zinc-700">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Detección automática de salas, ciudades, teléfonos, emails y aforos</span>
                </div>
              </div>

              {/* DOWNLOAD TEMPLATE CARD */}
              <div className="w-full max-w-2xl p-4 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Info className="w-5 h-5 text-amber-400 shrink-0" />
                  <div className="text-xs text-zinc-300">
                    <p className="font-semibold text-zinc-100">¿No tienes claro el formato?</p>
                    <p className="text-zinc-400">Descarga nuestra plantilla oficial optimizada con ejemplos de salas, festivales y ayuntamientos.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadTemplate}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shrink-0 transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar Plantilla</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: COLUMN MAPPING */}
          {step === 2 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-white/5">
                <div>
                  <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Archivo cargado: <span className="text-emerald-400 font-mono">{fileName}</span>
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Se han detectado {rawRows.length} filas. Revisa la correspondencia de columnas antes de importar.
                  </p>
                </div>

                {sheetNames.length > 1 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-zinc-400">Pestaña:</span>
                    <select
                      value={selectedSheet}
                      onChange={e => handleSheetChange(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200 focus:outline-none focus:border-emerald-500"
                    >
                      {sheetNames.map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* CATEGORY DEFAULT SELECTOR */}
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 text-xs text-amber-200">
                  <Building2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>Categoría por defecto si el Excel no especifica tipo:</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {CATEGORY_OPTIONS.map(cat => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDefaultCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        defaultCategory === cat.id
                          ? 'bg-amber-400 text-black font-bold shadow-xs'
                          : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* MAPPING GRID */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {/* Nombre Sala (Obligatorio) */}
                <div className="p-3 rounded-xl bg-zinc-900/80 border border-emerald-500/40 space-y-1.5">
                  <label className="text-xs font-bold text-emerald-300 flex items-center justify-between">
                    <span>Nombre Sala / Contacto / Banda *</span>
                    <span className="text-[10px] text-emerald-400 font-mono">Requerido</span>
                  </label>
                  <select
                    value={mapping.nombre_sala}
                    onChange={e => setMapping(prev => ({ ...prev, nombre_sala: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-emerald-500/60 text-zinc-100 focus:outline-none"
                  >
                    <option value="">-- Seleccionar Columna --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Ciudad */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Ciudad / Población</label>
                  <select
                    value={mapping.ciudad}
                    onChange={e => setMapping(prev => ({ ...prev, ciudad: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No asignar (Usar 'España') --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Email */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Email de Contacto</label>
                  <select
                    value={mapping.email_contacto}
                    onChange={e => setMapping(prev => ({ ...prev, email_contacto: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No asignar --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Teléfono */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Teléfono / WhatsApp</label>
                  <select
                    value={mapping.telefono}
                    onChange={e => setMapping(prev => ({ ...prev, telefono: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No asignar --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Aforo */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Aforo / Capacidad</label>
                  <select
                    value={mapping.aforo}
                    onChange={e => setMapping(prev => ({ ...prev, aforo: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No asignar (Usar por defecto) --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Instagram */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Instagram / Redes</label>
                  <select
                    value={mapping.instagram}
                    onChange={e => setMapping(prev => ({ ...prev, instagram: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No asignar --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Website */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Sitio Web / Link</label>
                  <select
                    value={mapping.website}
                    onChange={e => setMapping(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No asignar --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Tipo / Categoría */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Tipo de Entidad (Columna)</label>
                  <select
                    value={mapping.tipo}
                    onChange={e => setMapping(prev => ({ ...prev, tipo: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- Usar categoría por defecto --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Contacto Nombre */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Persona de Contacto / Booker</label>
                  <select
                    value={mapping.contacto_nombre}
                    onChange={e => setMapping(prev => ({ ...prev, contacto_nombre: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No asignar --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Género / Estilo */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Género / Estilo Musical</label>
                  <select
                    value={mapping.genero}
                    onChange={e => setMapping(prev => ({ ...prev, genero: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No asignar --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Dirección */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Dirección Física</label>
                  <select
                    value={mapping.direccion}
                    onChange={e => setMapping(prev => ({ ...prev, direccion: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No asignar --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>

                {/* Notas / Observaciones */}
                <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-1.5">
                  <label className="text-xs font-bold text-zinc-300">Notas / Comentarios</label>
                  <select
                    value={mapping.notas}
                    onChange={e => setMapping(prev => ({ ...prev, notas: e.target.value }))}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-100 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="">-- No asignar --</option>
                    {rawHeaders.map(h => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PREVIEW & VALIDATION */}
          {step === 3 && (
            <div className="space-y-4">
              {/* TOP BAR / FILTERS */}
              <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl bg-zinc-900/70 border border-white/5 text-xs">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-bold text-zinc-100">
                    {selectedCount} de {parsedRows.length} seleccionados
                  </span>
                  {duplicatesCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {duplicatesCount} ya registrados en CRM
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-zinc-400" />
                    <input
                      type="text"
                      placeholder="Buscar en la vista previa..."
                      value={searchPreview}
                      onChange={e => setSearchPreview(e.target.value)}
                      className="pl-8 pr-3 py-1 rounded-lg bg-zinc-950 border border-zinc-800 text-zinc-200 text-xs focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {duplicatesCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilterDuplicatesOnly(!filterDuplicatesOnly)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer ${
                        filterDuplicatesOnly ? 'bg-amber-500 text-black font-bold' : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                      }`}
                    >
                      <Filter className="w-3 h-3" />
                      <span>Solo duplicados</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(true)}
                    className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium cursor-pointer"
                  >
                    Seleccionar Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleSelectAll(false)}
                    className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-medium cursor-pointer"
                  >
                    Deseleccionar Todos
                  </button>
                </div>
              </div>

              {/* IMPORT OPTIONS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex items-start gap-3 p-3 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-emerald-500/40 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateDuplicates}
                    onChange={e => setUpdateDuplicates(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-500 focus:ring-0"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-zinc-100">Fusionar y actualizar contactos duplicados</p>
                    <p className="text-zinc-400">Si la sala ya existe, rellena los emails, teléfonos o datos que falten sin borrar tus notas previas.</p>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 rounded-xl bg-indigo-950/20 border border-indigo-500/30 hover:border-indigo-500/60 transition-all cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enrichMissingWithAi}
                    onChange={e => setEnrichMissingWithAi(e.target.checked)}
                    className="mt-0.5 rounded text-indigo-500 focus:ring-0"
                  />
                  <div className="text-xs">
                    <p className="font-bold text-indigo-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Enriquecer contactos sin email con IA
                    </p>
                    <p className="text-zinc-400">Activa el Agente Scout tras guardar para investigar webs oficiales y rellenar emails verificados.</p>
                  </div>
                </label>
              </div>

              {/* PREVIEW TABLE */}
              <div className="border border-white/10 rounded-xl overflow-hidden bg-zinc-950/80 shadow-inner max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-zinc-900/95 backdrop-blur-md text-zinc-400 border-b border-white/10 z-10 font-bold">
                    <tr>
                      <th className="p-2.5 w-8">
                        <input
                          type="checkbox"
                          checked={parsedRows.length > 0 && parsedRows.every(r => r.selected)}
                          onChange={e => handleToggleSelectAll(e.target.checked)}
                          className="rounded text-emerald-500"
                        />
                      </th>
                      <th className="p-2.5">Nombre</th>
                      <th className="p-2.5">Ciudad</th>
                      <th className="p-2.5">Tipo</th>
                      <th className="p-2.5">Email</th>
                      <th className="p-2.5">Teléfono / IG</th>
                      <th className="p-2.5">Aforo</th>
                      <th className="p-2.5 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredPreviewRows.map(row => (
                      <tr
                        key={row.id}
                        className={`hover:bg-white/5 transition-colors ${
                          row.isDuplicate ? 'bg-amber-500/5' : ''
                        } ${!row.selected ? 'opacity-40' : ''}`}
                      >
                        <td className="p-2.5">
                          <input
                            type="checkbox"
                            checked={row.selected}
                            onChange={() => {
                              setParsedRows(prev =>
                                prev.map(r => r.id === row.id ? { ...r, selected: !r.selected } : r)
                              );
                            }}
                            className="rounded text-emerald-500 cursor-pointer"
                          />
                        </td>
                        <td className="p-2.5 font-bold text-zinc-100">
                          <div className="flex items-center gap-1.5">
                            <span>{row.nombre_sala}</span>
                            {row.isDuplicate && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Existente
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-2.5 text-zinc-300">{row.ciudad}</td>
                        <td className="p-2.5">
                          <select
                            value={row.tipo}
                            onChange={e => handleRowTypeChange(row.id, e.target.value as LeadType)}
                            className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-200 text-[11px] focus:outline-none focus:border-emerald-500 cursor-pointer"
                          >
                            {CATEGORY_OPTIONS.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.icon} {c.label}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2.5">
                          {row.email_contacto ? (
                            <span className="text-emerald-300 font-mono">{row.email_contacto}</span>
                          ) : (
                            <span className="text-zinc-500 italic">Sin correo</span>
                          )}
                        </td>
                        <td className="p-2.5 text-zinc-400">
                          {row.telefono || row.instagram || '-'}
                        </td>
                        <td className="p-2.5 font-mono text-zinc-300">
                          {row.aforo > 0 ? `${row.aforo} pax` : '-'}
                        </td>
                        <td className="p-2.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleRowDelete(row.id)}
                            className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                            title="Eliminar de la importación"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-white/10 bg-zinc-950">
          <div>
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Cambiar archivo</span>
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={isImporting}
                onClick={() => setStep(2)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-all cursor-pointer disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Revisar mapeo</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {importStatusMsg && (
              <span className="text-xs text-amber-300 animate-pulse font-medium">
                {importStatusMsg}
              </span>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={buildParsedRows}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg active:scale-95 transition-all cursor-pointer"
              >
                <span>Continuar a Vista Previa ({rawRows.length} filas)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={isImporting || selectedCount === 0}
                onClick={handleExecuteImport}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-black shadow-xl active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Guardando en Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirmar e Importar {selectedCount} Contactos</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
    </ModalPortal>
  );
}
