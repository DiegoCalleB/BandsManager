import React from "react";
import { Video, Youtube, Plus, Trash2, Award } from "lucide-react";
import { EPKVideo } from "../../../types";
import { Button, Input, Select } from '../../ui';

interface StepVideosProps {
  videos: EPKVideo[];
  newVideoUrl: string;
  setNewVideoUrl: (url: string) => void;
  newVideoTitle: string;
  setNewVideoTitle: (title: string) => void;
  newVideoType: "videoclip" | "directo" | "entrevista" | "acustico";
  setNewVideoType: (
    t: "videoclip" | "directo" | "entrevista" | "acustico",
  ) => void;
  onAddVideo: () => void;
  onRemoveVideo: (id: string) => void;
  onToggleHighlightVideo: (id: string) => void;
}

export const StepVideos: React.FC<StepVideosProps> = ({
  videos,
  newVideoUrl,
  setNewVideoUrl,
  newVideoTitle,
  setNewVideoTitle,
  newVideoType,
  setNewVideoType,
  onAddVideo,
  onRemoveVideo,
  onToggleHighlightVideo,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-2 pb-2">
        <Video className="w-5 h-5 text-[var(--acc)]" />
        <h3 className="text-base font-semibold text-[var(--ink)]">
          Vídeos de YouTube y directos
        </h3>
      </div>

      <p className="text-xs text-[var(--ink-2)]">
        Los programadores de salas y festivales siempre piden ver cómo suena la
        banda en directo y vuestros videoclips oficiales.
      </p>

      {/* Videos List */}
      {videos.length > 0 && (
        <div className="space-y-2.5">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="flex items-center justify-between p-3 rounded-[var(--r-m)] bg-[var(--surface)] hover:bg-[var(--sunken)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-[var(--r-s)] bg-[var(--alert)]/10 text-[var(--alert)] flex items-center justify-center flex-shrink-0">
                  <Youtube className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-[var(--ink)]">
                      {vid.titulo}
                    </span>
                    {(vid as any).tipo && (
                      <span className="text-micro px-1.5 py-0.5 rounded bg-[var(--sunken)] text-[var(--ink-2)] capitalize">
                        {(vid as any).tipo}
                      </span>
                    )}
                    {vid.destacado && (
                      <span className="text-micro px-1.5 py-0.5 rounded bg-[var(--acc)]/20 text-[var(--acc-ink)] font-medium flex items-center gap-1">
                        <Award className="w-3 h-3" /> Destacado
                      </span>
                    )}
                  </div>
                  <a
                    href={vid.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-[var(--ink-2)] hover:text-[var(--acc)] transition-colors truncate block max-w-md"
                  >
                    {vid.url}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => onToggleHighlightVideo(vid.id)}
                  className={`p-1.5 rounded-[var(--r-pill)] text-xs transition-colors ${
                    vid.destacado
                      ? "text-[var(--acc-ink)] bg-[var(--acc)]/10"
                      : "text-[var(--ink-2)] hover:text-[var(--ink-2)]"
                  }`}
                  title={
                    vid.destacado
                      ? "Quitar destacado"
                      : "Marcar como vídeo principal"
                  }
                >
                  <Award className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => onRemoveVideo(vid.id)}
                  className="p-1.5 rounded-[var(--r-pill)] text-[var(--ink-2)] hover:text-[var(--alert)] hover:bg-[var(--alert)]/10 transition-colors"
                  title="Eliminar vídeo"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Video Form */}
      <div className="p-4 rounded-[var(--r-m)] bg-[var(--surface)] space-y-3">
        <h4 className="text-xs font-semibold text-[var(--ink-2)] flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5 text-[var(--acc)]" />
          Añadir nuevo vídeo (YouTube)
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Input
              size="sm"
              type="text"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="URL de YouTube (https://www.youtube.com/watch?v=… o youtu.be/…)"
              className="w-full"
            />
          </div>

          <div>
            <Select
              size="sm"
              value={newVideoType}
              onChange={(e) => setNewVideoType(e.target.value as any)}
              wrapperClassName="w-full"
            >
              <option value="videoclip">Videoclip oficial</option>
              <option value="directo">Directo en concierto</option>
              <option value="acustico">Sesión acústica</option>
              <option value="entrevista">Entrevista / prensa</option>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <Input
            size="sm"
            type="text"
            value={newVideoTitle}
            onChange={(e) => setNewVideoTitle(e.target.value)}
            placeholder="Título del vídeo (opcional, se extraerá de la URL si se omite)"
            className="w-2/3"
          />

          <Button
            variant="primary"
            size="xs"
            type="button"
            onClick={onAddVideo}
            disabled={!newVideoUrl.trim()}
            className="items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir vídeo
          </Button>
        </div>
      </div>
    </div>
  );
};
