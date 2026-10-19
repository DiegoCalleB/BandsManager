import React, { useState } from 'react';
import { lineaDeBajo, notasParaDibujar, type VistaAcorde } from '../../utils/vistaAcordes';
import { claveDeVista, escalaDelAcorde, midiDeEscala, midiEscrito, prefiereBemoles } from '../../utils/pentagrama';
import { midiDeAcorde } from '../../utils/sonarAcorde';
import type { NivelAcorde } from '../../utils/voicings';
import { Pentagrama } from './Pentagrama';

interface Props { chord: string; vista: VistaAcorde; nivel: NivelAcorde; siguiente?: string | null; invSonido: number; invLineaBajo?: number }

const LEYENDA: Array<[string, string]> = [['raíz', 'var(--ok)'], ['3.ª', 'var(--tentative)'], ['7.ª', 'var(--ink-2)'], ['paso', 'var(--acc)']];

/**
 * Pentagrama de la ficha con colorines por papel (raíz, 3.ª, 5.ª, 7.ª). En el bajo es la línea del mástil, con la nota de
 * paso hacia el acorde siguiente de otro color; un botón abre la escala completa del acorde.
 */
export const PentagramaFicha: React.FC<Props> = ({ chord, vista, nivel, siguiente, invSonido, invLineaBajo }) => {
  const [escala, setEscala] = useState(false);
  const n = notasParaDibujar(chord);
  const bemoles = prefiereBemoles(chord);
  const clave = claveDeVista(vista);
  const rolDe = (pc: number): string | undefined => (!n ? undefined : pc === n.raiz ? 'raiz' : pc === n.tercera ? 'tercera' : pc === n.notas[3] ? 'septima' : undefined);
  const pcDe = (m: number) => ((m % 12) + 12) % 12;
  const linea = vista === 'bajo' && nivel !== 'basico' ? lineaDeBajo(chord, siguiente, invLineaBajo, nivel === 'pro') : null;
  const tieneEscala = !!n;
  const sonido = linea ? linea.map((x) => x.pitch) : midiDeAcorde(chord, vista, nivel, invSonido);
  const roles = linea ? linea.map((x) => (x.rol === 'quinta' || x.rol === 'octava' ? undefined : x.rol)) : sonido.map((m) => rolDe(pcDe(m)));
  const hayPaso = !!linea?.some((x) => x.rol === 'paso');
  const eti = `Pentagrama: ${chord}${hayPaso ? `, con nota de paso hacia ${siguiente}` : ''}`;
  const notasEscala = n ? escalaDelAcorde(n.raiz, n.tercera, n.quinta, n.notas[3] ?? null) : [];
  const midiEscala = midiEscrito(midiDeEscala(n?.raiz ?? 0, notasEscala, vista === 'bajo' ? 36 : 60), vista);
  return (
    <>
      <Pentagrama midi={midiEscrito(sonido, vista)} roles={roles} clave={clave} modo={linea ? 'escala' : 'acorde'} bemoles={bemoles} etiqueta={eti} />
      {hayPaso && (
        <p className="text-micro font-sans text-[var(--ink-2)] flex justify-center gap-2 flex-wrap">
          {LEYENDA.map(([t, c]) => <span key={t} style={{ color: c }} className="font-bold">● {t}</span>)}
        </p>
      )}
      {tieneEscala && (
        <>
          <button type="button" aria-pressed={escala} onClick={() => setEscala(!escala)} className={`px-3 py-1 rounded-[var(--r-pill)] text-micro font-sans cursor-pointer bg-[var(--surface)] text-[var(--ink)] ${escala ? 'font-bold' : ''}`}>{escala ? 'Ocultar escala' : 'Ver escala completa'}</button>
          {escala && <Pentagrama midi={midiEscala} roles={midiDeEscala(n?.raiz ?? 0, notasEscala).map((m) => rolDe(pcDe(m)))} clave={clave} modo="escala" bemoles={bemoles} etiqueta={`Escala de ${chord}`} />}
        </>
      )}
    </>
  );
};
