import React, { useState } from 'react';
import { 
  X, Download, Printer, Sparkles, Check, Image as ImageIcon,
  FileCode, FileText, Layers, ShieldCheck, Palette
} from 'lucide-react';
import { downloadQrAsSvg, downloadQrAsHighResPng, printHighQualityFlyer } from '../utils/qrExport';

interface QrExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  svgElementId: string;
  bandName: string;
  concertTitle?: string;
  dateCity?: string;
  url: string;
  logoUrl?: string;
  defaultCta?: string;
}

export const QrExportModal: React.FC<QrExportModalProps> = ({
  isOpen,
  onClose,
  svgElementId,
  bandName,
  concertTitle,
  dateCity,
  url,
  logoUrl,
  defaultCta = '¡ESCANEA CON LA CÁMARA DE TU MÓVIL!'
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'svg' | 'png-4k' | 'poster-a4' | 'badge'>('poster-a4');
  const [customCta, setCustomCta] = useState(defaultCta);
  const [includeLogo, setIncludeLogo] = useState(Boolean(logoUrl));
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const baseFilename = `qr-${(bandName || 'banda').toLowerCase().replace(/[^a-z0-9]/g, '-')}${concertTitle ? `-${concertTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}` : ''}`;

  const handleDownload = async () => {
    setIsExporting(true);
    setExportSuccess(null);
    try {
      if (selectedFormat === 'svg') {
        await downloadQrAsSvg({
          svgElementId,
          filename: `${baseFilename}-vectorial`,
          logoUrl: includeLogo ? logoUrl : undefined
        });
        setExportSuccess('¡Archivo SVG vectorial descargado en máxima calidad!');
      } else if (selectedFormat === 'png-4k') {
        await downloadQrAsHighResPng({
          svgElementId,
          filename: baseFilename,
          template: 'qr-only',
          logoUrl: includeLogo ? logoUrl : undefined
        });
        setExportSuccess('¡Imagen PNG Ultra HD (4K / 300 DPI) descargada!');
      } else if (selectedFormat === 'poster-a4') {
        await downloadQrAsHighResPng({
          svgElementId,
          filename: `${baseFilename}-cartel-a4`,
          template: 'poster-a4',
          bandName,
          concertTitle,
          dateCity,
          url,
          logoUrl: includeLogo ? logoUrl : undefined,
          ctaText: customCta
        });
        setExportSuccess('¡Cartel A4 en alta resolución (300 DPI) descargado!');
      } else if (selectedFormat === 'badge') {
        await downloadQrAsHighResPng({
          svgElementId,
          filename: `${baseFilename}-tarjeta`,
          template: 'badge-card',
          bandName,
          concertTitle,
          url,
          logoUrl: includeLogo ? logoUrl : undefined
        });
        setExportSuccess('¡Tarjeta/Pegatina HD descargada!');
      }
    } catch (err: any) {
      console.error('Error al exportar QR:', err);
      alert('Hubo un problema al exportar el código QR. Inténtalo de nuevo.');
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    printHighQualityFlyer({
      svgElementId,
      bandName,
      concertTitle,
      dateCity,
      url,
      logoUrl: includeLogo ? logoUrl : undefined,
      ctaText: customCta
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white font-display tracking-wide">
                Exportar & Imprimir QR en Máxima Calidad
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Formatos vectoriales para imprenta, Ultra HD (300 DPI) y carteles listos para colgar.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selector de Formato de Exportación */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider block">
            1. Elige el formato de exportación:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedFormat('poster-a4')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                selectedFormat === 'poster-a4'
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm flex items-center gap-2 text-white">
                  <FileText className="w-4 h-4 text-amber-500" />
                  Cartel A4 Completo
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-md">
                  Recomendado
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Cartel vertical A4 maquetado a 300 DPI con nombre de la banda, sala, fecha, instrucciones y QR central.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('svg')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                selectedFormat === 'svg'
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm flex items-center gap-2 text-white">
                  <FileCode className="w-4 h-4 text-amber-500" />
                  Vectorial SVG (.svg)
                </span>
                <span className="text-[10px] font-mono font-bold bg-sky-500/20 text-sky-400 px-2 py-0.5 rounded-md">
                  Imprentas / Lonas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Curvas matemáticas vectoriales sin pérdida de calidad. Escala infinita para lonas gigantes o diseñadores.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('png-4k')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                selectedFormat === 'png-4k'
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm flex items-center gap-2 text-white">
                  <ImageIcon className="w-4 h-4 text-amber-500" />
                  PNG Ultra HD 4K
                </span>
                <span className="text-[10px] font-mono font-bold bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-md">
                  3000 x 3000 px
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Código QR aislado en altísima resolución con fondo blanco y logo central. Para insertar en flyers o redes.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat('badge')}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                selectedFormat === 'badge'
                  ? 'bg-amber-500/10 border-amber-500 text-white shadow-lg'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-black text-sm flex items-center gap-2 text-white">
                  <Layers className="w-4 h-4 text-amber-500" />
                  Pegatina / Stand de Merchan
                </span>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-md">
                  Cuadrado 2400px
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Formato cuadrado con marco y título. Perfecto para pegar en la mesa de venta de camisetas o vinilos.
              </p>
            </button>
          </div>
        </div>

        {/* Opciones de Personalización */}
        <div className="space-y-4 bg-slate-950 border border-slate-800/80 rounded-2xl p-5">
          <label className="text-xs font-bold text-amber-400 uppercase font-mono tracking-wider block">
            2. Personalización:
          </label>

          {selectedFormat === 'poster-a4' && (
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-slate-400">Texto de llamada a la acción (Titular):</label>
              <input
                type="text"
                value={customCta}
                onChange={e => setCustomCta(e.target.value)}
                placeholder="¡ESCANEA CON LA CÁMARA DE TU MÓVIL!"
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>
          )}

          {logoUrl && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeLogo}
                onChange={e => setIncludeLogo(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-900"
              />
              <span className="text-xs text-slate-300 font-medium">
                Incrustar el logo oficial en el centro del código QR
              </span>
            </label>
          )}

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Destino QR: <strong className="text-amber-300">{url}</strong></span>
          </div>
        </div>

        {/* Mensaje de Éxito */}
        {exportSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs font-mono flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
            className="w-full sm:flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold font-mono text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-lg disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            {isExporting ? 'Generando archivo en Alta Resolución...' : 'Descargar Archivo en Alta Resolución'}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="w-full sm:w-auto py-3 px-5 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 font-bold font-mono text-xs uppercase tracking-wider rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-md"
          >
            <Printer className="w-4 h-4" />
            Imprimir en A4 / Guardar PDF
          </button>
        </div>
      </div>
    </div>
  );
};
