/** Texto de una parte de contenido del SDK de Gemini, para los proveedores que solo leen texto (failover a DeepSeek). */
type Parte = { text?: unknown; functionResponse?: { name?: unknown; response?: unknown } };

export const textoDeParte = (parte: unknown): string => {
  const { text, functionResponse } = typeof parte === "object" && parte !== null ? (parte as Parte) : ({} as Parte);
  if (text) return String(text);
  // Sin esto, el failover perdería el resultado de las herramientas de lectura del chat.
  return functionResponse?.response ? `[Resultado de ${String(functionResponse.name)}]: ${JSON.stringify(functionResponse.response)}` : "";
};
