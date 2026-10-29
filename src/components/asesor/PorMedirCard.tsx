import React, { useState } from 'react';
import { Button, Card, Chip, Field, Input } from '../ui';
import { fechaCorta } from '../../utils/campanaConcierto';
import { mediosDeInstagram, medidasDeInstagram } from '../../utils/asesorApi';
import type { MedioInstagram } from '../../utils/asesor/instagramMedios';
import { ETIQUETA_FORMATO, sanearMedidas, type Medidas, type PorMedir } from '../../utils/asesor/resumen';

interface Props {
  pieza: PorMedir;
  onGuardar: (m: Medidas) => Promise<string | null>;
}

/**
 * Una pieza publicada que espera sus números. Son tres, y están en «Estadísticas» de la publicación
 * en Instagram (lección de métricas clave: se miran a las 48 h). La tercera es opcional.
 */
export function PorMedirCard({ pieza, onGuardar }: Props) {
  const [alcance, setAlcance] = useState('');
  const [guardados, setGuardados] = useState('');
  const [noSeguidores, setNoSeguidores] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  /** null: aún no se ha mirado en Instagram. Las stories no se pueden traer: a las 48 h ya no existen. */
  const [medios, setMedios] = useState<MedioInstagram[] | null>(null);
  const [trayendo, setTrayendo] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const puedeTraer = pieza.formato !== 'stories';

  const buscar = async () => {
    setTrayendo(true);
    setError(null);
    setAviso(null);
    try {
      const r = await mediosDeInstagram(pieza);
      setMedios(r.medios);
      if (!r.medios.length) setAviso('No vemos ninguna publicación de esos días en vuestra cuenta. Escribe los números a mano.');
    } catch (e) {
      setAviso(e instanceof Error && e.message ? e.message : 'No se pudo consultar Instagram.');
    } finally {
      setTrayendo(false);
    }
  };

  const traer = async (m: MedioInstagram) => {
    setTrayendo(true);
    setAviso(null);
    try {
      const { medidas } = await medidasDeInstagram(m.id);
      setAlcance(String(medidas.alcance));
      setGuardados(medidas.guardados === undefined ? '' : String(medidas.guardados));
      setNoSeguidores(medidas.alcanceNoSeguidores === undefined ? '' : String(medidas.alcanceNoSeguidores));
      setMedios(null);
      setAviso(medidas.guardados === undefined ? 'Instagram no ha dado los guardados de esta publicación: escríbelos tú.' : 'Rellenado desde Instagram. Revisa los números antes de guardar.');
    } catch (e) {
      setAviso(e instanceof Error && e.message ? e.message : 'No se pudo consultar Instagram.');
    } finally {
      setTrayendo(false);
    }
  };

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    const medidas = sanearMedidas({ alcance, guardados, alcanceNoSeguidores: noSeguidores });
    if (typeof medidas === 'string') {
      setError(medidas);
      return;
    }
    setGuardando(true);
    setError(await onGuardar(medidas));
    setGuardando(false);
  };

  return (
    <Card as="article" radius="m" className="grid gap-3">
      <form onSubmit={enviar} className="grid gap-3" aria-label={`Resultados de ${pieza.titulo}`}>
        <div className="grid gap-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip tone="acc">{ETIQUETA_FORMATO[pieza.formato]}</Chip>
            <span className="text-xs text-[var(--ink-2)]">Publicada el {fechaCorta(pieza.fecha)}</span>
          </div>
          <h3 className="text-base font-semibold text-[var(--ink)]">{pieza.titulo}</h3>
          <p className="text-xs text-[var(--ink-2)]">Tráelos de Instagram o míralos en «Ver estadísticas» de la publicación.</p>
        </div>

        {puedeTraer && (
          <div className="grid gap-2">
            <div>
              <Button type="button" size="sm" variant="neutral" onClick={buscar} disabled={trayendo}>
                {trayendo ? 'Consultando Instagram…' : 'Traer de Instagram'}
              </Button>
            </div>
            {medios && medios.length > 0 && (
              <ul className="grid gap-1.5" aria-label="Publicaciones de Instagram">
                {medios.map((m) => (
                  <li key={m.id}>
                    <button type="button" onClick={() => traer(m)} disabled={trayendo} className="w-full rounded-[var(--r-s)] bg-[var(--sunken)] px-3 py-2 text-left text-sm text-[var(--ink)] disabled:opacity-50">
                      <span className="text-xs text-[var(--ink-2)]">{ETIQUETA_FORMATO[m.formato]} · {fechaCorta(m.fecha)}</span>
                      <span className="block truncate">{m.resumen || 'Sin texto'}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {aviso && <p role="status" className="text-xs text-[var(--ink-2)]">{aviso}</p>}
          </div>
        )}

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Cuentas alcanzadas">
            <Input type="number" inputMode="numeric" min={1} value={alcance} onChange={(e) => setAlcance(e.target.value)} />
          </Field>
          <Field label="Guardados">
            <Input type="number" inputMode="numeric" min={0} value={guardados} onChange={(e) => setGuardados(e.target.value)} />
          </Field>
        </div>
        <Field label="De las alcanzadas, las que no os seguían" optional hint="Sale en «Audiencia» de las estadísticas.">
          <Input type="number" inputMode="numeric" min={0} value={noSeguidores} onChange={(e) => setNoSeguidores(e.target.value)} />
        </Field>

        {error && <p role="alert" className="text-sm text-[var(--alert)]">{error}</p>}
        <div>
          <Button type="submit" size="sm" variant="neutral" disabled={guardando || !alcance || !guardados}>
            {guardando ? 'Guardando…' : 'Guardar los números'}
          </Button>
        </div>
      </form>
    </Card>
  );
}
