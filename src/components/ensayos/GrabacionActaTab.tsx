import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Square,
  Play,
  Pause,
  Trash2,
  Sparkles,
  Share2,
  Copy,
  Check,
  Upload,
  FileAudio,
  Music,
  ListChecks,
  MessageSquare,
  AlertCircle,
  RefreshCw,
  Send,
} from "lucide-react";
import {
  Rehearsal,
  RehearsalRecording,
  RehearsalActa,
  Song,
  ThemeColors,
} from "../../types";
import { formatTime } from "./EnsayoCronometro";
import { PublicoSilhouette } from "../ui/PublicoSilhouette";
import { ShowIcon } from '../ui/ShowIcon';
import { Input, Select } from '../ui';

interface GrabacionActaTabProps {
  rehearsal: Rehearsal;
  onUpdateRehearsal: (updated: Partial<Rehearsal>) => void;
  songs: Song[];
  colors?: ThemeColors;
}

export function GrabacionActaTab({
  rehearsal,
  onUpdateRehearsal,
  songs = [],
  colors,
}: GrabacionActaTabProps) {
  const recordings = rehearsal.grabaciones || [];
  const acta = rehearsal.acta || null;

  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const [recordingBlobUrl, setRecordingBlobUrl] = useState<string | null>(null);
  const [recordingTag, setRecordingTag] = useState<
    "toma_completa" | "idea_riff" | "nota_voz_debate" | "fragmento"
  >("toma_completa");
  const [recordingTitle, setRecordingTitle] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // Audio level visualizer simulation
  const [audioLevel, setAudioLevel] = useState(0);

  // AI Generation State
  const [isGeneratingActa, setIsGeneratingActa] = useState(false);
  const [copied, setCopied] = useState(false);
  const [deberesInput, setDeberesInput] = useState("");

  // Clean up recording timer
  useEffect(() => {
    return () => {
      if (recordTimerRef.current) clearInterval(recordTimerRef.current);
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state === "recording"
      ) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Handle Start Audio Recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const audioUrl = URL.createObjectURL(audioBlob);
        setRecordingBlobUrl(audioUrl);
        // Stop audio tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(200);
      setIsRecording(true);
      setRecordDuration(0);
      setRecordingBlobUrl(null);

      recordTimerRef.current = window.setInterval(() => {
        setRecordDuration((prev) => prev + 1);
        setAudioLevel(Math.floor(Math.random() * 80) + 20);
      }, 1000);
    } catch (err) {
      console.error("Error accediendo al micrófono:", err);
      alert(
        "No se pudo acceder al micrófono. Por favor comprueba los permisos del navegador.",
      );
    }
  };

  // Handle Stop Audio Recording
  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state === "recording"
    ) {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    setAudioLevel(0);
  };

  // Save Recording
  const handleSaveRecording = () => {
    if (!recordingBlobUrl) return;
    const newRecording: RehearsalRecording = {
      id: `rec-${Date.now()}`,
      titulo:
        recordingTitle.trim() ||
        `Toma Ensayo ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      audioUrl: recordingBlobUrl,
      duracionSeg: recordDuration || 30,
      duracionSegundos: recordDuration || 30,
      tipo: recordingTag,
      grabadoEn: new Date().toISOString(),
    };

    onUpdateRehearsal({ grabaciones: [newRecording, ...recordings] });
    setRecordingBlobUrl(null);
    setRecordingTitle("");
    setRecordDuration(0);
  };

  // Handle File Upload from disk
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const audioUrl = URL.createObjectURL(file);
    const newRecording: RehearsalRecording = {
      id: `rec-${Date.now()}`,
      titulo: file.name.replace(/\.[^/.]+$/, ""),
      audioUrl,
      duracionSeg: 180,
      duracionSegundos: 180, // Estimado
      tipo: "toma_completa",
      grabadoEn: new Date().toISOString(),
    };

    onUpdateRehearsal({ grabaciones: [newRecording, ...recordings] });
    e.target.value = "";
  };

  // Delete Recording
  const handleDeleteRecording = (id: string) => {
    onUpdateRehearsal({ grabaciones: recordings.filter((r) => r.id !== id) });
  };

  // Generate AI Rehearsal Minutes
  const handleGenerateAIActa = () => {
    setIsGeneratingActa(true);

    // Synthesize data from the rehearsal
    setTimeout(() => {
      const agenda = rehearsal.agenda || [];
      const objetivos = rehearsal.objetivos || [];

      const bordadas = agenda
        .filter((a) => a.evaluacion === "bordada")
        .map((a) => a.titulo);
      const repetir = agenda
        .filter((a) => a.evaluacion === "repetir")
        .map((a) => a.titulo);
      const regulares = agenda
        .filter((a) => a.evaluacion === "regular")
        .map((a) => a.titulo);

      const nuevaActa: RehearsalActa = {
        resumenEjecutivo: `Ensayo muy productivo de ${rehearsal.duracionEstimadaMin || 120} min en ${rehearsal.lugar}. Se repasaron ${agenda.length} bloques del repertorio con especial solidez en las secciones rítmicas.`,
        cancionesDestacadas:
          bordadas.length > 0
            ? bordadas
            : ["Buen empaste general del repertorio"],
        cancionesAPulir:
          repetir.length > 0
            ? repetir
            : regulares.length > 0
              ? regulares
              : ["Mantener la consistencia en los cambios de dinámica"],
        deberesPorMiembro: [
          {
            miembro: "Batería y Bajo",
            tarea:
              "Afinar el corte rítmico en la entrada del segundo estribillo.",
          },
          {
            miembro: "Guitarra",
            tarea: "Revisar la ganancia del solo para que no tape los coros.",
          },
          {
            miembro: "Voz / Coros",
            tarea: "Memorizar la segunda estrofa del tema nuevo.",
          },
        ],
        generadoEn: new Date().toISOString(),
      };

      onUpdateRehearsal({ acta: nuevaActa });
      setIsGeneratingActa(false);
    }, 1200);
  };

  // Copy to WhatsApp format
  const handleCopyToWhatsApp = () => {
    if (!acta) return;
    const text = `🎸 *ACTA DEL ENSAYO — ${rehearsal.fecha} (${rehearsal.lugar})*

📋 *Resumen:*
${acta.resumenEjecutivo}

🟢 *Temas Bordados:*
${acta.cancionesDestacadas.map((c) => `• ${c}`).join("\n")}

🔴 *A Repasar el próximo día:*
${acta.cancionesAPulir.map((c) => `• ${c}`).join("\n")}

🎯 *Deberes para casa:*
${acta.deberesPorMiembro.map((d) => `• *${d.miembro}:* ${d.tarea}`).join("\n")}

_Generado automáticamente desde BandManager.io_ 🤘`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Section: Live Audio Recording & Upload */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audio Recorder Card */}
        <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-[var(--r-m)] bg-[var(--acc)]/15 text-[var(--acc-ink)]">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-sans font-bold text-[var(--ink)]">
                  Grabadora de audio en vivo
                </h3>
                <p className="text-xs text-[var(--ink-2)]">
                  Graba tomas completas, riffs o notas de voz directamente desde
                  el micrófono
                </p>
              </div>
            </div>

            {isRecording && (
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--r-pill)] text-xs font-sans font-bold bg-[var(--alert)]/20 text-[var(--ink)]">
                <span className="w-2 h-2 rounded-[var(--r-pill)] bg-[var(--alert)]" /> REC{" "}
                {formatTime(recordDuration)}
              </span>
            )}
          </div>

          {/* Big Recording Button & Wave */}
          <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] flex flex-col items-center justify-center space-y-3">
            {isRecording ? (
              <div className="w-full space-y-3 text-center">
                {/* Simulated Audio Waveform Bars */}
                <div className="flex items-center justify-center gap-1 h-12">
                  {Array.from({ length: 24 }).map((_, i) => {
                    const height = Math.max(
                      15,
                      Math.min(
                        100,
                        Math.sin(i + recordDuration) * audioLevel + 30,
                      ),
                    );
                    return (
                      <div
                        key={i}
                        className="w-1.5 bg-[var(--alert)]  rounded-[var(--r-pill)] transition-ui duration-150"
                        style={{ height: `${height}%` }}
                      />
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={stopRecording}
                  className="px-6 py-2.5 rounded-[var(--r-pill)] bg-[var(--alert)] hover:brightness-95 text-[var(--on-alert)] font-sans font-bold text-xs flex items-center gap-2 mx-auto cursor-pointer active:scale-[0.97] transition-ui"
                >
                  <Square className="w-4 h-4 fill-current" />
                  <span>Detener Grabación ({formatTime(recordDuration)})</span>
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={startRecording}
                className="px-6 py-3 rounded-[var(--r-l)] bg-[var(--acc)] hover:bg-[var(--acc)] text-[var(--on-acc)] font-sans font-bold text-xs flex items-center gap-2 cursor-pointer active:scale-[0.97] transition-ui"
              >
                <Mic className="w-4 h-4" />
                <span>Iniciar grabación con micrófono</span>
              </button>
            )}

            {/* If audio was just recorded, show preview and save form */}
            {recordingBlobUrl && !isRecording && (
              <div className="w-full pt-3 space-y-3">
                <audio controls src={recordingBlobUrl} className="w-full h-8" />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    size="sm"
                    type="text"
                    placeholder="Título de la toma (ej. Riff nuevo tema 2)…"
                    value={recordingTitle}
                    onChange={(e) => setRecordingTitle(e.target.value)}
                    
                  />
                  <Select
                    size="sm"
                    value={recordingTag}
                    onChange={(e) => setRecordingTag(e.target.value as any)}
                    
                  >
                    <option value="toma_completa">Toma completa</option>
                    <option value="riff">Riff / idea nueva</option>
                    <option value="seccion">Sección Específica</option>
                    <option value="voz_acta">
                      Nota de Voz / Conclusiones
                    </option>
                    <option value="debate">Debate / comentarios</option>
                  </Select>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setRecordingBlobUrl(null)}
                    className="px-3 py-1.5 text-xs font-sans text-[var(--ink-2)] hover:text-[var(--ink)]"
                  >
                    Descartar
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveRecording}
                    className="px-4 py-1.5 rounded-[var(--r-pill)] bg-[var(--ok)] hover:brightness-95 text-[var(--on-ok)] text-xs font-sans font-bold cursor-pointer"
                  >
                    Guardar grabación
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Upload Audio File Option */}
          <div className="flex items-center justify-between p-3 rounded-[var(--r-m)] bg-[var(--sunken)]">
            <span className="text-xs text-[var(--ink-2)]">
              ¿Grabaste con Zoom H4n o grabadora externa?
            </span>
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--r-m)] bg-[var(--surface)]/80 hover:bg-[var(--surface)]/70 text-[var(--ink-2)] text-xs font-sans font-bold cursor-pointer transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Subir archivo de audio</span>
              <input
                type="file"
                accept="audio/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Rehearsal Audio Clips Library */}
        <div className="p-5 rounded-[var(--r-l)] bg-[var(--surface)] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileAudio className="w-4 h-4 text-[var(--acc)]" />
              <h3 className="text-sm font-sans font-bold text-[var(--ink)]">
                Tomas y Audios del Ensayo ({recordings.length})
              </h3>
            </div>
          </div>

          {recordings.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center rounded-[var(--r-m)]">
              <PublicoSilhouette opacity={0.12} size="small" />
              <p className="mt-4 font-medium text-[var(--ink)] text-xs">
                Sin grabaciones
              </p>
              <p className="mt-1.5 text-[var(--ink-2)] text-xs max-w-xs">
                Graba esta sesión con el botón de arriba.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {recordings.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-2 hover:transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-bold text-[var(--ink)] truncate">
                        {rec.titulo}
                      </span>
                      <span className="px-2 py-0.5 rounded text-micro font-sans bg-[var(--surface)]/80 text-[var(--acc-ink)]">
                        {rec.tipo.replace("_", " ")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-micro font-sans text-[var(--ink-2)]">
                        {formatTime(rec.duracionSegundos)}
                      </span>
                      <button
                        onClick={() => handleDeleteRecording(rec.id)}
                        className="text-[var(--ink-2)] hover:text-[var(--alert)] p-0.5 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <audio controls src={rec.audioUrl} className="w-full h-8" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section: AI Generated Minutes / Acta del Ensayo */}
      <div className="p-5 sm:p-6 rounded-[var(--r-l)] bg-[var(--surface)]  space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-[var(--r-s)] bg-[var(--acc)] text-[var(--on-acc)]">
                <Sparkles className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-sans font-bold text-[var(--ink)]">
                Acta de ensayo inteligente (Human-in-the-loop)
              </h3>
            </div>
            <p className="text-xs text-[var(--ink-2)]">
              Sintetiza automáticamente los temas bordados, fallos detectados y
              tareas para el grupo de WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateAIActa}
              disabled={isGeneratingActa}
              className="flex items-center gap-1.5 px-4 py-2 rounded-[var(--r-pill)] bg-[var(--acc)] text-[var(--on-acc)] hover:bg-[var(--acc)] disabled:opacity-50 text-xs font-sans font-bold transition-ui cursor-pointer"
            >
              {isGeneratingActa ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Generando Acta…</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    {acta ? "Regenerar Acta con IA" : "Generar Acta con IA"}
                  </span>
                </>
              )}
            </button>

            {acta && (
              <button
                onClick={handleCopyToWhatsApp}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-[var(--r-pill)] bg-[var(--ok)]/20 text-[var(--ink)] hover:bg-[var(--ok)]/30 text-xs font-sans font-bold transition-ui cursor-pointer"
                title="Copiar formato listo para WhatsApp"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copied ? "¡Copiado!" : "Copiar para WhatsApp"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Display Acta Content */}
        {!acta ? (
          <div className="p-8 text-center text-[var(--ink-2)] text-xs space-y-2 rounded-[var(--r-m)]">
            <p>
              Pulsa “Generar Acta con IA” para obtener un resumen estructurado
              del ensayo listo para compartir.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Executive Summary */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-2">
              <h4 className="text-xs font-sans font-bold text-[var(--acc)] flex items-center gap-1.5">
                <ShowIcon inline emoji="📝" />Resumen Ejecutivo
              </h4>
              <p className="text-xs text-[var(--ink-2)] leading-relaxed font-sans">
                {acta.resumenEjecutivo}
              </p>
            </div>

            {/* Temas Bordados vs A Pulir */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-3">
              <div>
                <h4 className="text-xs font-sans font-bold text-[var(--ok)] mb-1.5">
                  <ShowIcon inline emoji="🟢" />Temas Bordados
                </h4>
                <ul className="text-xs text-[var(--ink-2)] space-y-1 pl-4 list-disc">
                  {(
                    acta.cancionesDestacadas ||
                    acta.cancionesBordadas ||
                    []
                  ).map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-xs font-sans font-bold text-[var(--alert)] mb-1.5">
                  <ShowIcon inline emoji="🔴" />A Repasar Próximo Día
                </h4>
                <ul className="text-xs text-[var(--ink-2)] space-y-1 pl-4 list-disc">
                  {(
                    acta.cancionesAPulir ||
                    acta.cancionesParaRepetir ||
                    []
                  ).map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Deberes para casa */}
            <div className="p-4 rounded-[var(--r-m)] bg-[var(--sunken)] space-y-2.5">
              <h4 className="text-xs font-sans font-bold text-[var(--ink-2)] flex items-center gap-1.5">
                <ShowIcon inline emoji="🎯" />Deberes para casa
              </h4>
              <div className="space-y-2">
                {(acta.deberesPorMiembro || []).map((d, i) => (
                  <div
                    key={i}
                    className="p-2 rounded-[var(--r-s)] bg-[var(--surface)] text-xs"
                  >
                    <span className="font-sans font-bold text-[var(--acc)]/70 block">
                      {d.miembro}:
                    </span>
                    <span className="text-[var(--ink-2)]">{d.tarea}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
