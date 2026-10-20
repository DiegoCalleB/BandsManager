import { useEffect, useState } from 'react';
import { CatalogoSalasModal } from './CatalogoSalasModal';
import { ABRIR_CATALOGO_SALAS } from './eventosCatalogo';

/** `onFaltaSala` abre «Añadir escenario»: lo que añade la banda entra al catálogo y se verifica y completa solo. */
export function CatalogoSalasHost({ onFaltaSala }: { onFaltaSala?: () => void }) {
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener(ABRIR_CATALOGO_SALAS, abrir);
    return () => window.removeEventListener(ABRIR_CATALOGO_SALAS, abrir);
  }, []);
  return (
    <CatalogoSalasModal
      isOpen={abierto}
      onClose={() => setAbierto(false)}
      onFaltaSala={
        onFaltaSala &&
        (() => {
          setAbierto(false);
          onFaltaSala();
        })
      }
    />
  );
}
