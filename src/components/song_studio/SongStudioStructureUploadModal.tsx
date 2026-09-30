import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  Camera,
  FileText,
  Loader,
  CheckCircle,
  AlertCircle,
  Download,
  ShieldCheck,
} from "lucide-react";
import { ModalPortal } from "../common/ModalPortal";
import { Song } from "../../types";
import { isImageDocument, isPdfDocument } from "../../utils/documentType";
import { ShowIcon } from '../ui/ShowIcon';
import { Button } from '../ui';

interface SongStudioStructureUploadModalProps {
  song: Song;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSong: (updatedSong: Song) => void;
  currentUsername?: string;
}

export const SongStudioStructureUploadModal: React.FC<
  SongStudioStructureUploadModalProps
> = ({ song, isOpen, onClose, onUpdateSong, currentUsername = "Usuario" }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingMessage, setProcessingMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const ALLOWED_TYPES = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  const handleFileSelect = (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrorMessage(
        "Formato no permitido. Usa PDF, imágenes (JPG/PNG/WebP) o Word.",
      );
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      // 10MB limit
      setErrorMessage("Archivo muy grande. Máximo 10MB.");
      return;
    }

    setSelectedFile(file);
    setErrorMessage("");

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

    const context = canvasRef.current.getContext("2d");
    if (!context) return;

    context.drawImage(
      videoRef.current,
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height,
    );
    canvasRef.current.toBlob(
      (blob) => {
        if (blob) {
          const file = new File([blob], `estructura-${Date.now()}.jpg`, {
            type: "image/jpeg",
          });
          handleFileSelect(file);
          setIsCameraOpen(false);
          stopCamera();
        }
      },
      "image/jpeg",
      0.95,
    );
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraOpen(true);
      }
    } catch (err) {
      setErrorMessage("No se pudo acceder a la cámara.");
      console.error("Camera error:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    setIsCameraOpen(false);
  };

  // Marca (o desmarca) que un humano ha comparado los acordes extraídos contra el documento
  // original y confirma que son correctos — la diferencia entre"alguien confía en esto para
  // tocarlo en directo" y"esto lo subió alguien ayer y nadie lo ha mirado todavía".
  const [isSavingVerified, setIsSavingVerified] = useState(false);
  const handleToggleVerified = async () => {
    const updatedSong: Song = {
      ...song,
      estructuraVerificada: !song.estructuraVerificada,
    };
    setIsSavingVerified(true);
    onUpdateSong(updatedSong);
    try {
      const token =
        localStorage.getItem("bakandeya_token") ||
        localStorage.getItem("token") ||
        "";
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        headers["x-auth-token"] = token;
      }
      await fetch(`/api/songs/${song.id}`, {
        method: "PUT",
        headers,
        body: JSON.stringify(updatedSong),
      });
    } catch (err) {
      console.error("Error guardando verificación de acordes:", err);
    } finally {
      setIsSavingVerified(false);
    }
  };

  const handleProcessWithAI = async () => {
    if (!selectedFile || !song.id) return;

    setIsProcessing(true);
    setProcessingMessage("Enviando archivo...");
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("songId", song.id);

      const response = await fetch(`/api/songs/${song.id}/upload-structure`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success && data.song) {
        setSuccessMessage(
          "✓ Estructura procesada. Compara abajo el documento original con lo que se guardó.",
        );
        setSelectedFile(null);
        setPreview(null);
        onUpdateSong(data.song);
        // No cerramos el modal solo: el usuario necesita ver la comparación de al lado
        // (documento original vs. acordes extraídos) para confiar en que la IA acertó antes
        // de usarlo en directo. Cierra él cuando lo haya revisado.
        setShowComparison(true);
      } else {
        throw new Error(data.error || "Error al procesar la estructura");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      setErrorMessage(message);
      console.error("Structure upload error:", err);
    } finally {
      setIsProcessing(false);
      setProcessingMessage("");
    }
  };

  if (!isOpen) return null;

  return (
    <ModalPortal isOpen={isOpen} onClose={onClose}>
      <div className="fixed inset-0 z-[9999] bg-[var(--scrim)]/80 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl rounded-[var(--r-l)] bg-[var(--surface)] p-6 space-y-5 text-[var(--ink)] max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-[var(--r-m)] bg-[var(--acc)]/30 text-[var(--ink)] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold">
                  Subir estructura de canción
                </h3>
                <p className="text-xs text-[var(--tentative)]/80 font-sans">
                  PDF, imagen o Word → IA extrae acordes
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-1.5 rounded-[var(--r-s)] text-[var(--ink-2)] hover:text-[var(--ink)]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          {successMessage && (
            <div className="p-3 rounded-[var(--r-s)] bg-[var(--ok)]/10 text-xs text-[var(--ok)] flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {successMessage}
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-[var(--r-s)] bg-[var(--alert)] text-xs text-[var(--on-alert)] flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {errorMessage}
            </div>
          )}

          {/* Processing status */}
          {isProcessing && (
            <div className="p-4 rounded-[var(--r-s)] bg-[var(--acc)] text-sm text-[var(--on-acc)] flex items-center gap-3">
              <Loader className="w-4 h-4 animate-spin" />
              <div>
                <p className="font-semibold">
                  {processingMessage || "Procesando..."}
                </p>
                <p className="text-xs text-[var(--tentative)]/80 mt-1">
                  Esto puede tomar 10-30 segundos
                </p>
              </div>
            </div>
          )}

          {!isProcessing && (
            <>
              {!successMessage && (
                <>
                  {/* Camera View */}
                  {isCameraOpen && (
                    <div className="space-y-3">
                      <div className="relative bg-[var(--sunken)] rounded-[var(--r-s)] overflow-hidden">
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          className="w-full aspect-video object-cover"
                        />
                        <canvas
                          ref={canvasRef}
                          width={1280}
                          height={720}
                          className="hidden"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleCameraCapture}
                          className="flex-1 px-4 py-2.5 rounded-[var(--r-pill)] bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)] text-sm font-semibold transition"
                        >
                          <ShowIcon inline emoji="📸" />Capturar foto
                        </button>
                        <button
                          onClick={stopCamera}
                          className="flex-1 px-4 py-2.5 rounded-[var(--r-pill)] bg-[var(--surface)]/70 hover:bg-[var(--sunken)] text-[var(--ink)] text-sm font-semibold transition"
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
                        className="rounded-[var(--r-s)] p-8 text-center cursor-pointer bg-[var(--sunken)] hover:bg-[var(--acc-soft)] transition"
                      >
                        <Upload className="w-8 h-8 mx-auto mb-2 text-[var(--acc)]" />
                        <p className="text-sm font-semibold text-[var(--ink)]">
                          Arrastra un archivo aquí
                        </p>
                        <p className="text-xs text-[var(--ink-2)] mt-1">
                          o haz clic para seleccionar
                        </p>
                        <p className="text-xs text-[var(--ink-2)] mt-2">
                          PDF, JPG, PNG, Word (máx. 10MB)
                        </p>
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
                        className="w-full px-4 py-2.5 rounded-[var(--r-s)] bg-[var(--tentative)] hover:bg-[var(--tentative)] text-[var(--on-tentative)] text-sm font-semibold transition flex items-center justify-center gap-2"
                      >
                        <Camera className="w-4 h-4" />
                        Hacer Foto desde Cámara
                      </button>
                    </div>
                  )}

                  {/* Preview */}
                  {selectedFile && preview && (
                    <div className="space-y-3">
                      <div className="bg-[var(--sunken)] rounded-[var(--r-s)] p-3">
                        <p className="text-xs text-[var(--ink-2)] mb-2">
                          Archivo seleccionado:{" "}
                          <span className="text-[var(--ink)] font-semibold">
                            {selectedFile.name}
                          </span>
                        </p>
                        {selectedFile.type.startsWith("image/") && (
                          <img
                            src={preview}
                            alt="Preview"
                            className="w-full max-h-64 object-contain rounded"
                          />
                        )}
                        {selectedFile.type === "application/pdf" && (
                          <div className="bg-[var(--alert)] rounded p-3 text-center text-sm text-[var(--on-alert)]">
                            <ShowIcon inline emoji="📄" />PDF - Se procesará con IA para extraer acordes
                          </div>
                        )}
                        {selectedFile.type.includes("word") && (
                          <div className="bg-[var(--tentative)]/10 rounded p-3 text-center text-sm text-[var(--ink-2)]">
                            <ShowIcon inline emoji="📝" />Documento Word - Se procesará con IA para extraer
                            acordes
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedFile(null);
                            setPreview(null);
                          }}
                          className="flex-1 px-4 py-2 rounded-[var(--r-pill)] bg-[var(--surface)]/70 hover:bg-[var(--sunken)] text-[var(--ink)] text-sm font-semibold transition"
                        >
                          Cambiar archivo
                        </button>
                        <Button
                          variant="primary"
                          onClick={handleProcessWithAI}
                          disabled={isProcessing}
                          className="flex-1"
                        >
                          <ShowIcon inline emoji="✨" />Procesar con IA
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Current Document Info — se mantiene visible incluso justo después de un
 procesado con éxito: es precisamente cuando el usuario necesita comparar. */}
              {song.estructuraDocumentoUrl && (
                <div className="p-3 rounded-[var(--r-s)] bg-[var(--ok-soft)] text-sm text-[var(--ink)] space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">Estructura actual guardada</p>
                    <span
                      className={`text-micro font-bold px-2 py-0.5 rounded-[var(--r-pill)] flex items-center gap-1 shrink-0 ${
                        song.estructuraVerificada
                          ? "bg-[var(--ok)]/20 text-[var(--ink)]"
                          : "bg-[var(--acc)]/20 text-[var(--acc-ink)]"
                      }`}
                    >
                      <ShieldCheck className="w-3 h-3" />
                      {song.estructuraVerificada
                        ? "Verificado"
                        : "Sin verificar"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs text-[var(--ink-2)] truncate">
                        {song.estructuraDocumentoNombre || "Documento"}
                      </p>
                      <p className="text-xs text-[var(--ink-2)] mt-1">
                        Procesado el{" "}
                        {new Date(
                          song.estructuraDocumentoProcesadoEn || "",
                        ).toLocaleDateString("es-ES")}
                      </p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowComparison((v) => !v)}
                        className={`px-3 py-1.5 rounded text-xs font-semibold transition flex items-center gap-1 ${
                          showComparison
                            ? "bg-[var(--acc)] hover:brightness-95 text-[var(--on-acc)]"
                            : "bg-[var(--ink)]/10 hover:bg-[var(--ink)]/20 text-[var(--ink)]"
                        }`}
                      >
                        <ShowIcon inline emoji="👁️" />{showComparison ? "Ocultar" : "Comparar"}
                      </button>
                      <a
                        href={song.estructuraDocumentoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1.5 rounded bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)] text-xs font-semibold transition flex items-center gap-1"
                      >
                        <Download className="w-3 h-3" />
                        Descargar
                      </a>
                    </div>
                  </div>

                  {/* El check de verificación vive aquí, al lado del botón de comparar: el
 flujo esperado es comparar primero y solo entonces marcar como fiable. */}
                  <button
                    type="button"
                    onClick={handleToggleVerified}
                    disabled={isSavingVerified}
                    className={`w-full px-3 py-2 rounded-[var(--r-s)] text-xs font-semibold transition flex items-center justify-center gap-1.5 disabled:opacity-50 ${
                      song.estructuraVerificada
                        ? "bg-[var(--ok)]/20 text-[var(--ink)] hover:bg-[var(--ok)]/30"
                        : "bg-[var(--accent-alt)]/20 text-[var(--acc)]/80 hover:bg-[var(--accent-alt)]/30"
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {song.estructuraVerificada
                      ? "Verificado — he comparado los acordes y son correctos (clic para desmarcar)"
                      : "Marcar como verificado tras comparar con el original"}
                  </button>

                  {/* SIDE-BY-SIDE COMPARISON: original scanned document vs. what the AI extracted,
 so the user can eyeball whether the extraction actually matches the paper. */}
                  {showComparison && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2/20">
                      <div className="space-y-1.5">
                        <p className="text-micro font-sans text-[var(--ink-2)]">
                          Documento original
                        </p>
                        <div className="bg-[var(--sunken)] rounded-[var(--r-s)] overflow-hidden max-h-96">
                          {isImageDocument(
                            song.estructuraDocumentoNombre,
                            song.estructuraDocumentoUrl,
                          ) ? (
                            <img
                              src={song.estructuraDocumentoUrl}
                              alt="Estructura original"
                              className="w-full h-full object-contain max-h-96"
                            />
                          ) : isPdfDocument(
                              song.estructuraDocumentoNombre,
                              song.estructuraDocumentoUrl,
                            ) ? (
                            <iframe
                              src={song.estructuraDocumentoUrl}
                              title="Estructura original (PDF)"
                              className="w-full h-96"
                            />
                          ) : (
                            <div className="h-96 flex items-center justify-center text-xs text-[var(--ink-2)] p-4 text-center">
                              Este tipo de documento no se puede previsualizar
                              aquí. Usa “Descargar” para abrirlo.
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-micro font-sans text-[var(--ink-2)]">
                          Acordes extraídos (guardados)
                        </p>
                        <div className="bg-[var(--sunken)] rounded-[var(--r-s)] p-3 h-96 overflow-y-auto">
                          <pre className="text-xs font-sans text-[var(--acc)] whitespace-pre-wrap leading-relaxed">
                            {song.cifradoTexto ||
                              "Sin acordes guardados todavía."}
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
