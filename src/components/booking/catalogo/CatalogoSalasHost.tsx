import { useEffect, useState } from 'react';
import { CatalogoSalasModal } from './CatalogoSalasModal';
import { ABRIR_CATALOGO_SALAS } from './eventosCatalogo';

export function CatalogoSalasHost() {
  const [abierto, setAbierto] = useState(false);
  useEffect(() => {
    const abrir = () => setAbierto(true);
    window.addEventListener(ABRIR_CATALOGO_SALAS, abrir);
    return () => window.removeEventListener(ABRIR_CATALOGO_SALAS, abrir);
  }, []);
  return <CatalogoSalasModal isOpen={abierto} onClose={() => setAbierto(false)} />;
}
