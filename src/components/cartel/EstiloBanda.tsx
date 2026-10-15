import React from 'react';
import { ImagePlus, X } from 'lucide-react';
import { IconButton, Switch } from '../ui';
import { cn } from '../../utils/cn';
import { MAX_REFERENCIAS, type FavoritoCartel } from '../../utils/cartel/adn';
import { ETIQUETA_ESTILO } from '../../utils/cartel/estilos';

interface Props {
  referencias: string[];
  /** Carteles de otros bolos de la banda que se pueden usar como referencia. */
  anteriores: string[];
  favoritos: FavoritoCartel[];
  aprender: boolean;
  subiendo: boolean;
  /** Cuántas imágenes de la banda mirará la IA en la próxima generación. */
  queMira: number;
  onSubir: (archivo: File | undefined) => void;
  onAnadirAnterior: (url: string) => void;
  onQuitarReferencia: (url: string) => void;
  onUsarFavorito: (url: string) => void;
  onQuitarFavorito: (url: string) => void;
  onAprender: () => void;
}

const MINIATURA = 'relative size-14 shrink-0 overflow-hidden rounded-[var(--r-s)] bg-[var(--surface)]';

function Titulo({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-[var(--ink-2)]">{children}</p>;
}

/**
 * El «ADN» de la banda dentro del panel de IA: imágenes que la IA mira para parecerse a ellos, sus
 * carteles anteriores y los fondos que ya han compartido. Todo opcional: sin nada, el cartel sale igual.
 */
export function EstiloBanda(p: Props) {
  const quedan = MAX_REFERENCIAS - p.referencias.length;
  const vacio = p.referencias.length === 0 && p.favoritos.length === 0;

  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <Titulo>Estilo de tu banda</Titulo>
        <p className="text-xs text-[var(--ink-2)] text-pretty">
          {vacio
            ? 'Sube de 1 a 3 carteles o portadas que os representen y la IA se parecerá más a vosotros. Es opcional.'
            : p.queMira > 0
              ? `La IA mirará ${p.queMira} ${p.queMira === 1 ? 'imagen' : 'imágenes'} de vuestra banda para parecerse a vosotros.`
              : 'La IA no mirará ninguna imagen de vuestra banda.'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {p.referencias.map((u, i) => (
          <div key={u} className={MINIATURA}>
            <img src={u} alt={`Referencia ${i + 1}`} className="size-full object-cover" />
            <IconButton label="Quitar referencia" size="icon-xs" variant="raised" className="absolute right-0.5 top-0.5" onClick={() => p.onQuitarReferencia(u)}>
              <X className="size-3" aria-hidden />
            </IconButton>
          </div>
        ))}
        {quedan > 0 && (
          <label className={cn(MINIATURA, 'grid cursor-pointer place-items-center text-[var(--ink-2)] transition-ui hover:text-[var(--ink)]', p.subiendo && 'opacity-50')} title="Añadir una referencia">
            <ImagePlus className="size-5" aria-hidden />
            <input type="file" accept="image/*" className="sr-only" aria-label="Añadir una referencia" disabled={p.subiendo}
              onChange={(e) => {
                p.onSubir(e.target.files?.[0]);
                e.target.value = '';
              }} />
          </label>
        )}
      </div>

      {quedan > 0 && p.anteriores.length > 0 && (
        <div className="grid gap-1.5">
          <Titulo>Tus carteles anteriores</Titulo>
          <div className="flex flex-wrap gap-2">
            {p.anteriores.map((u, i) => (
              <button key={u} type="button" className={cn(MINIATURA, 'cursor-pointer transition-ui active:scale-[0.97]')} aria-label={`Usar el cartel anterior ${i + 1} como referencia`}
                title="Usar como referencia" onClick={() => p.onAnadirAnterior(u)}>
                <img src={u} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {p.favoritos.length > 0 && (
        <div className="grid gap-1.5">
          <Titulo>Tus favoritos (gratis, sin gastar IA)</Titulo>
          <div className="flex flex-wrap gap-2">
            {p.favoritos.map((f, i) => (
              <div key={f.url} className={MINIATURA}>
                <button type="button" className="size-full cursor-pointer transition-ui active:scale-[0.97]" aria-label={`Usar el favorito ${i + 1} en este bolo`}
                  title={`${ETIQUETA_ESTILO[f.estilo]}${f.ambiente ? ` · ${f.ambiente}` : ''}`} onClick={() => p.onUsarFavorito(f.url)}>
                  <img src={f.url} alt="" className="size-full object-cover" />
                </button>
                <IconButton label="Quitar de favoritos" size="icon-xs" variant="raised" className="absolute right-0.5 top-0.5" onClick={() => p.onQuitarFavorito(f.url)}>
                  <X className="size-3" aria-hidden />
                </IconButton>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm text-[var(--ink)]">Aprender de lo que compartís</p>
          <p className="text-xs text-[var(--ink-2)]">Los fondos que compartís pasan a favoritos y guían los siguientes.</p>
        </div>
        <Switch aria-label="Aprender de lo que compartís" checked={p.aprender} onCheckedChange={p.onAprender} />
      </div>
    </div>
  );
}
