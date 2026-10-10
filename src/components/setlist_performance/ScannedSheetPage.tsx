import React from "react";
import { Song } from "../../types";
import { isImageDocument } from "../../utils/documentType";

// Página tipo"atril digital": el documento original escaneado a pantalla completa, tal cual
// lo vería un músico de orquesta pasando hojas en un iPad.
export const ScannedSheetPage: React.FC<{ song: Song }> = ({ song }) => {
  const isImage = isImageDocument(
    song.estructuraDocumentoNombre,
    song.estructuraDocumentoUrl,
  );

  if (
    !song.estructuraDocumentoUrl ||
    song.estructuraDocumentoUrl.trim() === ""
  ) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--surface)] p-4 text-[var(--ink-2)] text-sm">
        No hay documento adjunto disponible
      </div>
    );
  }

  return (
    <div className="w-full h-full flex items-center justify-center bg-[var(--surface)] p-1 sm:p-4">
      {isImage ? (
        <img
          src={song.estructuraDocumentoUrl}
          alt={`Partitura de ${song.titulo}`}
          className="max-w-full max-h-full object-contain rounded"
        />
      ) : (
        <iframe
          src={song.estructuraDocumentoUrl}
          title={`Partitura de ${song.titulo}`}
          className="w-full h-full bg-[var(--sunken)] rounded"
        />
      )}
    </div>
  );
};
