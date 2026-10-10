/**
 * Estado del borrador de copy, plataforma y programación del reel.
 * Extraído de ReelsCenter.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { SocialPost } from "../../../types";
import { defaultScheduleDate } from "../../../utils/reelsUtils";

/**
 * Estado del borrador de copy, plataforma y programación del reel.
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useCopyDraftState() {
  const [selectedPostInPhone, setSelectedPostInPhone] =
    useState<SocialPost | null>(null);

  const [reelIdea, setReelIdea] = useState("");

  const [generatedCopy, setGeneratedCopy] = useState("");

  const [isGenerating, setIsGenerating] = useState(false);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Cómo está grabado el material: cambia qué busca la IA y cómo titula.'auto' deja que el
  // servidor lo adivine del título/descripción reales; el usuario puede fijarlo a mano.
  const [contentType, setContentType] = useState<
    "auto" | "concierto" | "videoclip" | "ensayo"
  >("auto");

  const [detectedContentType, setDetectedContentType] = useState<string | null>(
    null,
  );

  // Framework Viral 3.0: 3 modos de copy + simulador Safe-Zone + Arsenal de Ganchos
  const [copyObjective, setCopyObjective] = useState<
    "viral" | "comunidad" | "conversion"
  >("viral");

  const [showSafeZone, setShowSafeZone] = useState<boolean>(false);

  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  // Form values for Scheduling
  const [editedCopy, setEditedCopy] = useState("");

  const [selectedPlatform, setSelectedPlatform] = useState<
    "Instagram" | "TikTok" | "YouTube" | "Facebook"
  >("Instagram");

  const [scheduledDate, setScheduledDate] = useState(() =>
    defaultScheduleDate(1),
  );

  const [scheduledTime, setScheduledTime] = useState("20:30");

  const [isScheduling, setIsScheduling] = useState(false);

  const [schedulingSuccess, setSchedulingSuccess] = useState(false);

  // Antes solo se comprobaba que el copy no estuviera vacío, y en silencio: el botón no hacía
  // nada y no se explicaba por qué. Ahora se avisa de qué falta (hashtag, fecha pasada...).
  const [scheduleErrors, setScheduleErrors] = useState<string[]>([]);

  // Avisos de cadencia (no bloquean programar, son sobre estrategia: dos posts pegados en la
  // misma red, o un hueco largo sin publicar nada).
  const [scheduleWarnings, setScheduleWarnings] = useState<string[]>([]);

  const [copySuccess, setCopySuccess] = useState(false);

  return { selectedPlatform, scheduledDate, scheduledTime, editedCopy, setEditedCopy, setDetectedContentType, contentType, setScheduledDate, setScheduledTime, copyObjective, setScheduleErrors, setScheduleWarnings, setIsScheduling, setSchedulingSuccess, setCopyObjective, setCopiedNotification, setCopySuccess, setIsGenerating, reelIdea, setGeneratedCopy, setUploadProgress, detectedContentType, selectedPostInPhone, generatedCopy, setSelectedPostInPhone, setReelIdea, isGenerating, setContentType, showSafeZone, setShowSafeZone, copiedNotification, setSelectedPlatform, isScheduling, schedulingSuccess, scheduleErrors, scheduleWarnings, uploadProgress, copySuccess };
}
