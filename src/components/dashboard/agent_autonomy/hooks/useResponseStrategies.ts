/**
 * Guías por tipo de respuesta del Contestador y reglas de estilo aprendidas.
 * Extraído de AgentAutonomySettingsModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { api } from "../../../../services/api";
import type { LearnedRuleBucket } from "../autonomyTypes";
import { RESPONSE_TYPES, ResponseStrategyForm } from "../responseTypes";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface ResponseStrategiesParams {
  isAdmin: boolean;
}

/**
 * Guías por tipo de respuesta del Contestador y reglas de estilo aprendidas.
 * @param params Estado y callbacks del contenedor ({@link ResponseStrategiesParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function useResponseStrategies({ isAdmin }: ResponseStrategiesParams) {
  // State: Response Strategies (guía condicional del Contestador por tipo de respuesta
  // detectada en el mensaje entrante de la sala - ver server/services/replyDrafting.ts)
  const [responseStrategies, setResponseStrategies] = useState<
    Record<string, ResponseStrategyForm>
  >({});

  // Reglas de estilo que el sistema ha aprendido SOLO de tus correcciones reales a respuestas
  // (Self-Refining Tone DNA, dna_expresion.reglas_por_categoria_respuesta - ver
  // server/db/pitchLearning.ts). Se muestran junto a la configuración manual de arriba para que
  // el mánager pueda detectar a simple vista si se contradicen entre sí: la manual está
  // organizada por TIPO de respuesta, esta por TIPO de sala, así que no hay un cruce automático,
  // pero verlas juntas es lo que permite pillar el choque.
  const [learnedResponseRules, setLearnedResponseRules] = useState<
    Record<string, LearnedRuleBucket>
  >({});

  const [isSavingStrategies, setIsSavingStrategies] = useState(false);

  const [strategiesFeedback, setStrategiesFeedback] = useState<string | null>(
    null,
  );

  // Checklist de arranque ("¿está esto listo para que el Redactor escriba bien?"): tres señales
  // que se pueden comprobar de verdad sin inventar datos ni añadir endpoints nuevos.
  // - toneTrained: dna_expresion.tono_comunicacion o vocabulario_clave rellenados en ADN de Tono
  // (mismo endpoint que ya se consulta para learnedResponseRules, un campo más).
  // - templateCustomized: category_pitch_templates tiene customInstruction no vacío en alguna
  // categoría - a diferencia de"guidelines" (que SIEMPRE viene pre-rellenado de fábrica en
  // DEFAULT_CATEGORY_TEMPLATES), customInstruction empieza vacío en las 7 categorías y solo se
  // rellena si el mánager escribe algo, así que es una señal fiable de personalización real.
  // No incluye"hilos de ejemplo": comprobarlo de verdad requeriría una llamada por categoría (7
  // peticiones) solo para un checkbox - mejor un aviso (ya añadido arriba) que un dato a medias.
  const [startupChecklist, setStartupChecklist] = useState({
    toneTrained: false,
    templateCustomized: false,
  });

  const getStrategyOrDefault = (typeKey: string): ResponseStrategyForm => {
    const found = responseStrategies[typeKey];
    const defaultTone =
      RESPONSE_TYPES.find((t) => t.key === typeKey)?.defaultTone || "neutral";
    return (
      found || { guidancePrompt: "", tone: defaultTone, mentionLinks: true }
    );
  };

  const updateStrategyField = <K extends keyof ResponseStrategyForm>(
    typeKey: string,
    field: K,
    value: ResponseStrategyForm[K],
  ) => {
    setResponseStrategies((prev) => ({
      ...prev,
      [typeKey]: { ...getStrategyOrDefault(typeKey), [field]: value },
    }));
  };

  const handleSaveResponseStrategies = async () => {
    if (!isAdmin) return;
    setIsSavingStrategies(true);
    setStrategiesFeedback(null);
    try {
      // Solo persiste estrategias con guía real escrita por el mánager - una entrada vacía
      // no aporta nada al prompt condicional y solo ensuciaría el JSON guardado.
      const toSave: Record<string, ResponseStrategyForm> = {};
      const toDelete: string[] = [];
      for (const [key, strategy] of Object.entries(responseStrategies)) {
        if (strategy.guidancePrompt && strategy.guidancePrompt.trim()) {
          toSave[key] = strategy;
        } else {
          // El backend guarda por FUSIÓN (POST hace {...actual, ...nuevo}), así que enviar solo
          // las que tienen contenido nunca borra las vacías: si antes había una guía guardada y
          // ahora se ha limpiado el campo, había que borrarla explícitamente o se queda huérfana
          // en Supabase - el mánager ve el campo vacío en pantalla pero el Contestador sigue
          // usando la guía antigua para ese tipo de respuesta hasta que se borre de verdad.
          toDelete.push(key);
        }
      }
      if (Object.keys(toSave).length > 0) {
        await api.updateResponseStrategies(toSave);
      }
      // Un 404 aquí solo significa"todavía no había nada guardado para esta banda" (primera
      // vez que se abre esta pestaña) - no es un fallo real, así que no debe tumbar el guardado
      // de arriba ni mostrarse como error al mánager.
      await Promise.all(
        toDelete.map((key) =>
          api.deleteResponseStrategy(key).catch((err: { status?: number }) => {
            if (err?.status !== 404) throw err;
          }),
        ),
      );
      setStrategiesFeedback(
        "✅ Estrategias de respuesta guardadas correctamente.",
      );
      setTimeout(() => setStrategiesFeedback(null), 3000);
    } catch (e) {
      console.error("Error guardando estrategias de respuesta:", e);
      setStrategiesFeedback(
        "⚠️ Error al guardar las estrategias de respuesta.",
      );
    } finally {
      setIsSavingStrategies(false);
    }
  };

  return { setResponseStrategies, setLearnedResponseRules, setStartupChecklist, startupChecklist, learnedResponseRules, getStrategyOrDefault, updateStrategyField, strategiesFeedback, handleSaveResponseStrategies, isSavingStrategies };
}
