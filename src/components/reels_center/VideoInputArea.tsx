/**
 * Zona de entrada del vídeo: arrastrar archivo local o pegar enlace de YouTube.
 * Extraído por Strangler Fig para mantener el contenedor bajo el límite de AGENTS.md §5.6.
 */
import { AlertCircle, CheckCircle2, RefreshCw, Upload, Youtube } from "lucide-react";
import { Input } from "../ui";
import { useReelsCenter } from "./ReelsCenterContext";
import { formatTime } from "./reelsHelpers";

/**
 * Zona de entrada del vídeo: arrastrar archivo local o pegar enlace de YouTube.
 * @returns Sección de interfaz.
 */
export function VideoInputArea() {
  const { inputType, setDragActive, handleFileDrop, dragActive, selectedFile, handleFileSelect, setSelectedFile, cambiarVideoLocal, setLocalVideoDuration, setHighlights, setOptimalTime, setEnergyWindows, setViralWindows, setLoadedFromSaveAt, setDetectedContentType, youtubeUrl, setYoutubeUrl, isFetchingMeta, metaError, videoMeta } = useReelsCenter();
  return (
    <>
      {/* Drag & Drop or YouTube Link Input */}
      {inputType === "file" ? (
      <div
        id="video-dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleFileDrop}
        onClick={() =>
          document.getElementById("video-file-input")?.click()
        }
        className={` -dashed rounded-[var(--r-l)] p-8 text-center cursor-pointer transition-ui ${
          dragActive
            ? " bg-[var(--acc)]/5 scale-[1.01]"
            : selectedFile
              ? " bg-[var(--ok)]/[0.02]"
              : " bg-[var(--surface)]/50"
        }`}
      >
        <input
          id="video-file-input"
          type="file"
          accept="video/*"
          className="hidden"
          onChange={handleFileSelect}
        />
        {selectedFile ? (
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-[var(--r-pill)] bg-[var(--ok)]/10 text-[var(--ok)] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <p
                className={`text-xs font-bold text-[var(--ink)]`}
              >
                {selectedFile.name}
              </p>
              <p className="text-micro text-[var(--ink-2)] font-sans mt-0.5">
                {(selectedFile.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            </div>
            <button
              id="btn-clear-file"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
                cambiarVideoLocal(null);
                setLocalVideoDuration(0);
                setHighlights([]);
                setOptimalTime(null);
                setEnergyWindows([]);
                setViralWindows([]);
                setLoadedFromSaveAt(null);
                setDetectedContentType(null);
              }}
              className="text-micro font-sans text-[var(--alert)] hover:underline hover:text-[var(--alert)] bg-transparent -none p-0 cursor-pointer"
            >
              Eliminar archivo y elegir otro
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div
              className={`w-12 h-12 rounded-[var(--r-pill)] flex items-center justify-center mx-auto bg-[var(--acc)]/10 text-[var(--ink)]`}
            >
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <p
                className={`text-xs font-bold text-[var(--ink-2)]`}
              >
                Suelta tu vídeo aquí o haz clic para buscar
              </p>
              <p className="text-micro text-[var(--ink-2)] font-sans mt-1">
                Soporta .mp4, .mov, .m4v (Vídeo bruto de conciertos
                o ensayos, máx 100MB)
              </p>
            </div>
          </div>
        )}
      </div>
      ) : (
      <div
        className={` rounded-[var(--r-l)] p-8 transition-ui bg-[var(--surface)]`}
      >
        <div className="space-y-4 max-w-xl mx-auto text-center">
          <div
            className={`w-12 h-12 rounded-[var(--r-pill)] flex items-center justify-center mx-auto bg-[var(--acc)]/10 text-[var(--ink)]`}
          >
            <Youtube className="w-5 h-5" />
          </div>
          <div>
            <p
              className={`text-xs font-bold text-[var(--ink-2)]`}
            >
              Introduce la URL del vídeo de YouTube
            </p>
            <p className="text-micro text-[var(--ink-2)] font-sans mt-1">
              Extrae highlights de cualquier vídeo público de
              YouTube, Shorts o directo
            </p>
          </div>
          <div className="relative">
            <Input
              size="sm"
              id="youtube-url-input"
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=… o https://youtu.be/…"
              className="w-full pl-3 pr-10"
            />
            {youtubeUrl && (
              <button
                type="button"
                onClick={() => {
                  setYoutubeUrl("");
                  setHighlights([]);
                  setOptimalTime(null);
                  setEnergyWindows([]);
                  setViralWindows([]);
                  setLoadedFromSaveAt(null);
                  setDetectedContentType(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-2)] hover:text-[var(--ink)] text-xs font-sans bg-transparent -none cursor-pointer"
              >
                ×
              </button>
            )}
          </div>

          {/* Ficha real del vídeo: sin esto el usuario no sabía si la URL era la correcta
 hasta después de gastar un análisis entero. */}
          {isFetchingMeta && (
            <div className="flex items-center justify-center gap-2 text-micro font-sans text-[var(--ink-2)] pt-1">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Leyendo la ficha del vídeo…</span>
            </div>
          )}

          {!isFetchingMeta && metaError && (
            <div className="p-2 rounded-[var(--r-s)] bg-[var(--acc)]/10 text-micro text-[var(--ink)] font-sans text-left flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                {metaError} Puedes analizarlo igualmente, pero los
                rangos serán aproximados.
              </span>
            </div>
          )}

          {!isFetchingMeta && videoMeta && (
            <div
              className={`flex gap-3 items-center p-2.5 rounded-[var(--r-m)] text-left bg-[var(--sunken)]`}
            >
              {videoMeta.thumbnail && (
                <img
                  src={videoMeta.thumbnail}
                  alt=""
                  className="w-20 h-12 object-cover rounded-[var(--r-s)] shrink-0"
                  loading="lazy"
                />
              )}
              <div className="min-w-0 flex-1 space-y-1">
                <p
                  className={`text-xs font-bold truncate text-[var(--ink)]`}
                >
                  {videoMeta.title || "Vídeo de YouTube"}
                </p>
                <div className="flex flex-wrap gap-1.5 items-center text-micro font-sans">
                  {videoMeta.author && (
                    <span className="text-[var(--ink-2)] truncate max-w-[120px]">
                      {videoMeta.author}
                    </span>
                  )}
                  {videoMeta.durationKnown ? (
                    <span
                      className={`px-1.5 py-0.5 rounded font-bold bg-[var(--acc)]/10 text-[var(--ink)]`}
                    >
                      {formatTime(videoMeta.duration)}
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-[var(--surface)]/80 text-[var(--ink-2)]">
                      duración desconocida
                    </span>
                  )}
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      videoMeta.hasTranscript
                        ? "bg-[var(--ok)]/10 text-[var(--ok)]"
                        : "bg-[var(--surface)]/80 text-[var(--ink-2)]"
                    }`}
                  >
                    {videoMeta.hasTranscript
                      ? `subtítulos ✓ (${videoMeta.transcriptLines})`
                      : "sin subtítulos"}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      )}
    </>
  );
}
