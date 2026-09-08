import React, { useState, useRef } from 'react';
import { X, Upload, Camera, FileText, Loader, CheckCircle, AlertCircle, Download } from 'lucide-react';
import { ModalPortal } from '../common/ModalPortal';
import { Song } from '../../types';
import { isImageDocument, isPdfDocument } from '../../utils/documentType';

interface SongStudioStructureUploadModalProps {
  song: Song;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSong: (updatedSong: Song) => void;
  currentUsername?: string;
}

export const SongStudioStructureUploadModal: React.FC<SongStudioStructureUploadModalProps> = ({
  song,
  isOpen,
  onClose,
  onUpdateSong,
  currentUsername = 'Usuario'
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const ALLOWED_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  const handleFileSelect = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage('Formato no permitido. Usa PDF, imágenes (JPG/PNG/WebP) o Word.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      setErrorMessage('Archivo muy grande. Máximo 10MB.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleCameraCapture = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
    canvasRef.current.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `estructura-${Date.now()}.jpg`, { type: 'image/jpeg' });
        handleFileSelect(file);
        setIsCameraOpen(false);
        stopCamera();
      }
    }, 'image/jpeg', 0.95);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      setErrorMessage('No se pudo acceder a la cámara.');
      console.error('Camera error:', err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    setIsCameraOpen(false);
  };

  const handleProcessWithAI = async () => {
    if (!selectedFile || !song.id) return;

    setIsProcessing(true);
    setProcessingMessage('Enviando archivo...');
    setSuccessMessage('');
    setErrorMessage('');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('songId', song.id);

      const response = await fetch(`/api/songs/${song.id}/upload-structure`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.song) {
        setSuccessMessage('✓ Estructura procesada exitosamente');
        setSelectedFile(null);
        setPreview(null);
        onUpdateSong(data.song);
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(data.error || 'Error al procesar la estructura');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error desconocido';
      setErrorMessage(message);
      console.error('Structure upload error:', err);
    } finally {
      setIsProcessing(false);
      setProcessingMessage('');
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-2xl border border-purple-500/40 bg-zinc-950 p-6 space-y-5 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-purple-600/30 text-purple-400 border border-purple-500/40 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">Subir Estructura de Canción</h3>
                <p className="text-xs text-purple-300 font-mono">PDF, imagen o Word → IA extrae acordes</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1.5 rounded-lg text-neutral-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="p-3 rounded-lg bg-green-950/30 border border-green-500/30 text-xs text-green-200 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 text-xs text-red-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          {/* Processing status */}
          {isProcessing && (
            <div className="p-4 rounded-lg bg-purple-950/30 border border-purple-500/30 text-sm text-purple-200 flex items-center gap-3">
              <Loader className="w-4 h-4 animate-spin" />
              <div>
                <p className="font-semibold">{processingMessage || 'Procesando...'}</p>
                <p className="text-xs text-purple-300 mt-1">Esto puede tomar 10-30 segundos</p>
              </div>
            </div>
          )}

          {!isProcessing && !successMessage && (
            <>
              {/* Camera View */}
              {isCameraOpen && (
                <div className="space-y-3">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full aspect-video object-cover"
                    />
                    <canvas ref={canvasRef} width={1280} height={720} className="hidden" />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCameraCapture}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition"
                    >
                      📸 Capturar Foto
                    </button>
                    <button
                      onClick={stopCamera}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-semibold transition"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* File Upload Area */}
              {!isCameraOpen && !selectedFile && (
                <div className="space-y-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-purple-500/30 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500/60 transition"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                    <p className="text-sm font-semibold text-white">Arrastra un archivo aquí</p>
                    <p className="text-xs text-neutral-400 mt-1">o haz clic para seleccionar</p>
                    <p className="text-xs text-neutral-500 mt-2">PDF, JPG, PNG, Word (máx. 10MB)</p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    onChange={handleFileInputChange}
                    className="hidden"
                  />

                  <button
                    onClick={startCamera}
                    className="w-full px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    Hacer Foto desde Cámara
                  </button>
                </div>
              )}

              {/* Preview */}
              {selectedFile && preview && (
                <div className="space-y-3">
                  <div className="bg-neutral-900 rounded-lg p-3">
                    <p className="text-xs text-neutral-400 mb-2">
                      Archivo seleccionado: <span className="text-white font-semibold">{selectedFile.name}</span>
                    </p>
                    {selectedFile.type.startsWith('image/') && (
                      <img src={preview} alt="Preview" className="w-full max-h-64 object-contain rounded" />
                    )}
                    {selectedFile.type === 'application/pdf' && (
                      <div className="bg-red-950/20 border border-red-500/30 rounded p-3 text-center text-sm text-neutral-300">
                        📄 PDF - Se procesará con IA para extraer acordes
                      </div>
                    )}
                    {selectedFile.type.includes('word') && (
                      <div className="bg-blue-950/20 border border-blue-500/30 rounded p-3 text-center text-sm text-neutral-300">
                        📝 Documento Word - Se procesará con IA para extraer acordes
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreview(null);
                      }}
                      className="flex-1 px-4 py-2 rounded-lg bg-neutral-700 hover:bg-neutral-600 text-white text-sm font-semibold transition"
                    >
                      Cambiar Archivo
                    </button>
                    <button
                      onClick={handleProcessWithAI}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-neutral-600 text-white text-sm font-semibold transition"
                    >
                      ✨ Procesar con IA
                    </button>
                  </div>
                </div>
              )}

              {/* Current Document Info */}
              {song.estructuraDocumentoUrl && (
                <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-sm text-emerald-200 space-y-2">
                  <p className="font-semibold">Estructura actual guardada</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-emerald-300 truncate">{song.estructuraDocumentoNombre || 'Documento'}</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Procesado el {new Date(song.estructuraDocumentoProcesadoEn || '').toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowComparison(v => !v)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1 ${
                          showComparison
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-white/10 hover:bg-white/20 text-white'
                        }`}
                      >
                        👁️ {showComparison ? 'Ocultar' : 'Comparar'}
                      </button>
                      <a
                        href={song.estructuraDocumentoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Descargar
                      </a>
                    </div>
                  </div>

                  {/* SIDE-BY-SIDE COMPARISON: original scanned document vs. what the AI extracted,
                      so the user can eyeball whether the extraction actually matches the paper. */}
                  {showComparison && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-emerald-500/20">
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Documento original</p>
                        <div className="bg-black/40 border border-white/10 rounded-lg overflow-hidden max-h-96">
                          {isImageDocument(song.estructuraDocumentoNombre, song.estructuraDocumentoUrl) ? (
                            <img
                              src={song.estructuraDocumentoUrl}
                              alt="Estructura original"
                              className="w-full h-full object-contain max-h-96"
                            />
                          ) : isPdfDocument(song.estructuraDocumentoNombre, song.estructuraDocumentoUrl) ? (
                            <iframe
                              src={song.estructuraDocumentoUrl}
                              title="Estructura original (PDF)"
                              className="w-full h-96 border-0"
                            />
                          ) : (
                            <div className="h-96 flex items-center justify-center text-xs text-neutral-400 p-4 text-center">
                              Este tipo de documento no se puede previsualizar aquí. Usa "Descargar" para abrirlo.
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">Acordes extraídos (guardados)</p>
                        <div className="bg-black/40 border border-white/10 rounded-lg p-3 h-96 overflow-y-auto">
                          <pre className="text-[11px] font-mono text-amber-100 whitespace-pre-wrap leading-relaxed">
                            {song.cifradoTexto || 'Sin acordes guardados todavía.'}
                          </pre>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </ModalPortal>
  );
};
