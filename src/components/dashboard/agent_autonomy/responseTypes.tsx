/**
 * Tipos de respuesta de sala que el Contestador sabe clasificar y su guía por defecto.
 * Viven fuera del modal para poder reutilizarlos en hooks y vistas sin recrearlos en cada render.
 */
import { Euro, HelpCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import React from "react";

export type ResponseTone = "neutral" | "enthusiastic" | "cautious";
export interface ResponseStrategyForm {
  guidancePrompt: string;
  tone: ResponseTone;
  mentionLinks: boolean;
}
export const RESPONSE_TYPES: Array<{
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  defaultTone: ResponseTone;
}> = [
  {
    key: "price_negotiation",
    label: "Negociación de Precio",
    description:
      "La sala pregunta por caché, presupuesto, tarifa o condiciones económicas.",
    icon: <Euro className="w-4 h-4" />,
    defaultTone: "neutral",
  },
  {
    key: "confirmation",
    label: "Confirmación",
    description:
      "La sala confirma, aprueba o expresa interés claro en seguir adelante.",
    icon: <ThumbsUp className="w-4 h-4" />,
    defaultTone: "enthusiastic",
  },
  {
    key: "rejection",
    label: "Rechazo",
    description:
      "La sala declina la propuesta o indica que no tiene disponibilidad.",
    icon: <ThumbsDown className="w-4 h-4" />,
    defaultTone: "cautious",
  },
  {
    key: "follow_up",
    label: "Pregunta de Seguimiento",
    description: "La sala pide más información, fechas o detalles concretos.",
    icon: <HelpCircle className="w-4 h-4" />,
    defaultTone: "neutral",
  },
];
