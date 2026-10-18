/**
 * Formato Markdown ligero de los mensajes del asistente (viñetas y negrita).
 * Es una función pura de presentación, por eso no es un hook y se puede probar sin renderizar el chat.
 */

const formatBold = (text: string) => {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={i} className={`font-bold ${'text-[var(--tentative)]'}`}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return part;
  });
};

/** Convierte el texto del asistente (viñetas "- " y **negrita**) en elementos React. */
export const parseMarkdown = (text: string) => {
  const lines = text.split('\n');
  return lines.map((line, idx) => {
    // Bullets
    if (line.trim().startsWith('- ')) {
      const bulletText = line.trim().slice(2);
      return (
        <li key={idx} className="ml-4 list-disc mt-1 text-xs">
          {formatBold(bulletText)}
        </li>
      );
    }
    return (
      <p key={idx} className="min-h-[1.2em] text-xs leading-relaxed mt-1">
        {formatBold(line)}
      </p>
    );
  });
};
