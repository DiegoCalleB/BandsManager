import { epkDe } from "../epkLegacy";
/**
 * Paso de prensa y cifras: citas, festivales y números.
 * Extraído de OnboardingWizardModal.tsx (Strangler Fig) para respetar SRP y el límite de tamaño de AGENTS.md §5.6.
 */
import { useState } from "react";
import { EPKConfig } from "../../../../types";
import { PressQuoteItem } from "../../types";

/** Dependencias que el componente contenedor inyecta al hook. */
export interface PressProofStepParams {
  epkConfig: EPKConfig;
}

/**
 * Paso de prensa y cifras: citas, festivales y números.
 * @param params Estado y callbacks del contenedor ({@link PressProofStepParams}).
 * @returns Estado derivado y handlers expuestos al contenedor.
 */
export function usePressProofStep({ epkConfig }: PressProofStepParams) {
  // --- Step 8: Prensa & Social Proof ---
  const [pressQuotes, setPressQuotes] = useState<PressQuoteItem[]>(() => {
    if (
      epkDe(epkConfig)?.resenasPrensa?.citas &&
      Array.isArray(epkDe(epkConfig).resenasPrensa.citas)
    ) {
      return epkDe(epkConfig).resenasPrensa.citas;
    }
    return [
      {
        id: "q1",
        texto:
          "Una propuesta arrolladora en directo con una frescura instrumental encomiable.",
        medio: "MondoSonoro",
      },
    ];
  });

  const [newQuoteText, setNewQuoteText] = useState("");

  const [newQuoteMedia, setNewQuoteMedia] = useState("");

  const [festivalesDestacados, setFestivalesDestacados] = useState(
    epkDe(epkConfig)?.festivalesDestacados || "",
  );

  const [cifrasOyentes, setCifrasOyentes] = useState(
    epkDe(epkConfig)?.cifrasClave?.oyentes || "",
  );

  const [cifrasDirectos, setCifrasDirectos] = useState(
    epkDe(epkConfig)?.cifrasClave?.directos || "",
  );

  const [cifrasComunidad, setCifrasComunidad] = useState(
    epkDe(epkConfig)?.cifrasClave?.comunidad || "",
  );

  // Quotes Add/Remove
  const handleAddQuote = () => {
    if (!newQuoteText.trim() || !newQuoteMedia.trim()) return;
    const newQuote: PressQuoteItem = {
      id: `q_${Date.now()}`,
      texto: newQuoteText.trim(),
      medio: newQuoteMedia.trim(),
    };
    setPressQuotes((prev) => [...prev, newQuote]);
    setNewQuoteText("");
    setNewQuoteMedia("");
  };

  const handleRemoveQuote = (id: string) => {
    setPressQuotes((prev) => prev.filter((q) => q.id !== id));
  };

  return { setPressQuotes, pressQuotes, cifrasOyentes, cifrasDirectos, cifrasComunidad, festivalesDestacados, newQuoteText, setNewQuoteText, newQuoteMedia, setNewQuoteMedia, handleAddQuote, handleRemoveQuote, setFestivalesDestacados, setCifrasOyentes, setCifrasDirectos, setCifrasComunidad };
}
