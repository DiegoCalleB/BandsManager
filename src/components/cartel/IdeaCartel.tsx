import React, { useState } from 'react';
import { ChevronDown, Eye, ImagePlus, X } from 'lucide-react';
import { Button, Field, IconButton, Input, Textarea } from '../ui';
import { cn } from '../../utils/cn';
import { CAMPOS_IDEA, EJEMPLOS_IDEA, MAX_CAMPO_IDEA, camposRellenos } from '../../utils/cartel/idea';
import { BotonVoz } from './BotonVoz';
import type { IdeaCartelApi } from './hooks/useIdeaCartel';

const ETIQUETA_BRIEF: Array<[keyof NonNullable<IdeaCartelApi['visto']>['brief'], string]> = [
  ['scene', 'Escena'],
  ['mood', 'Ambiente y época'],
  ['palette', 'Colores'],
  ['composition', 'Composición'],
  ['avoid', 'Evitar'],
];

/**
 * «Tu idea» dentro del panel de IA: cuanto más cuenta la persona, más se parece el fondo a lo que imagina.
 * Un campo siempre a la vista (qué se ve), el resto detrás de «Más detalles», y un boceto opcional. Todo
 * es opcional: sin nada, el fondo sale con el estilo y el ADN de la banda. Lo que escribe se traduce al
 * inglés en el servidor, y aquí se puede ver exactamente lo que se le va a pedir a la IA.
 */
export function IdeaCartel({ idea: i }: { idea: IdeaCartelApi }) {
  const rellenos = camposRellenos(i.idea);
  const [masAbierto, setMasAbierto] = useState(false);
  // Si ya hay algo en los campos de detalle (un ejemplo, por ejemplo), no se esconden.
  const verMas = masAbierto || CAMPOS_IDEA.slice(1).some((c) => i.idea[c.id]);
  const [escena, ...detalles] = CAMPOS_IDEA;

  return (
    <div className="grid gap-3">
      <div className="grid gap-1">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs font-medium text-[var(--ink-2)]">Tu idea</p>
          <p className="text-xs text-[var(--ink-2)]" aria-live="polite">{rellenos} de {CAMPOS_IDEA.length}</p>
        </div>
        <p className="text-xs text-[var(--ink-2)] text-pretty">
          Cuéntalo como se lo contarías a un diseñador: cuanto más detalle, más se parecerá a lo que imaginas. Todo es opcional.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Ejemplos de idea">
        <span className="text-xs text-[var(--ink-2)]">Prueba con</span>
        {EJEMPLOS_IDEA.map((e) => (
          <Button key={e.nombre} size="xs" variant="raised" onClick={() => i.usarEjemplo(e.idea)}>
            {e.nombre}
          </Button>
        ))}
        {rellenos > 0 && (
          <Button size="xs" variant="raised" onClick={i.limpiar}>
            Borrar
          </Button>
        )}
      </div>

      <Field label={escena.etiqueta}>
        <div className="relative">
          <Textarea rows={2} maxLength={MAX_CAMPO_IDEA} value={i.idea.escena} placeholder={`Ej.: ${escena.ejemplo}`} className="pr-10" onChange={(e) => i.cambiar('escena', e.target.value)} />
          <BotonVoz valor={i.idea.escena} maximo={MAX_CAMPO_IDEA} etiqueta="Dictar la escena" onTexto={(t) => i.cambiar('escena', t)} />
        </div>
      </Field>

      <button type="button" onClick={() => setMasAbierto((v) => !v)} aria-expanded={verMas}
        className="flex w-fit cursor-pointer items-center gap-1 text-xs font-medium text-[var(--ink-2)] transition-ui hover:text-[var(--ink)]">
        Más detalles
        <ChevronDown className={cn('size-3.5 transition-ui', verMas && 'rotate-180')} aria-hidden />
      </button>
      {verMas && (
        <div className="grid gap-3">
          {detalles.map((c) => (
            <Field key={c.id} label={c.etiqueta}>
              <div className="relative">
                <Input maxLength={MAX_CAMPO_IDEA} value={i.idea[c.id]} placeholder={`Ej.: ${c.ejemplo}`} className="pr-10" onChange={(e) => i.cambiar(c.id, e.target.value)} />
                <BotonVoz valor={i.idea[c.id]} maximo={MAX_CAMPO_IDEA} etiqueta={`Dictar: ${c.etiqueta}`} onTexto={(t) => i.cambiar(c.id, t)} />
              </div>
            </Field>
          ))}
        </div>
      )}

      <div className="grid gap-1.5">
        <p className="text-xs font-medium text-[var(--ink-2)]">Tu boceto o un cartel que te guste</p>
        <div className="flex items-center gap-3">
          {i.boceto ? (
            <div className="relative size-14 shrink-0 overflow-hidden rounded-[var(--r-s)] bg-[var(--surface)]">
              <img src={i.boceto} alt="Tu boceto" className="size-full object-cover" />
              <IconButton label="Quitar boceto" size="icon-xs" variant="raised" className="absolute right-0.5 top-0.5" onClick={i.quitarBoceto}>
                <X className="size-3" aria-hidden />
              </IconButton>
            </div>
          ) : (
            <label className="group grid size-14 shrink-0 cursor-pointer place-items-center rounded-[var(--r-s)] bg-[var(--surface)] text-[var(--ink-2)] transition-ui hover:text-[var(--ink)]" title="Subir un boceto">
              <ImagePlus className="size-5" aria-hidden />
              <input type="file" accept="image/*" disabled={i.subiendo} className="sr-only" aria-label="Subir un boceto o un cartel de ejemplo"
                onChange={(e) => {
                  void i.subirBoceto(e.target.files?.[0]);
                  e.target.value = '';
                }} />
            </label>
          )}
          <p className="text-xs text-[var(--ink-2)] text-pretty">
            {i.subiendo ? 'Subiendo el boceto…' : 'Una foto de tu dibujo o de un cartel que os gusta. La IA copia la composición, no los colores ni el texto.'}
          </p>
        </div>
      </div>

      <div className="grid gap-2">
        <Button size="xs" variant="raised" className="w-fit" disabled={i.cargandoBrief} onClick={() => void i.verBrief()}>
          <Eye className="size-3.5" aria-hidden />
          {i.cargandoBrief ? 'Preparando…' : 'Ver lo que le pediré a la IA'}
        </Button>
        {i.visto && (
          <div className="grid gap-2 rounded-[var(--r-s)] bg-[var(--surface)] p-3" aria-label="Lo que se le pide a la IA">
            <dl className="grid gap-1.5">
              {ETIQUETA_BRIEF.filter(([k]) => i.visto!.brief[k]).map(([k, etiqueta]) => (
                <div key={k}>
                  <dt className="text-xs text-[var(--ink-2)]">{etiqueta}</dt>
                  <dd className="text-sm text-[var(--ink)] text-pretty">{i.visto!.brief[k]}</dd>
                </div>
              ))}
            </dl>
            <p className="text-xs text-[var(--ink-2)] text-pretty">
              {i.visto.traducido ? 'Traducido al inglés y ordenado para la IA. Las reglas de diseño las pone BandManager.' : 'Sin traducir: la IA de texto no responde ahora, así que se usa tu texto tal cual.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
