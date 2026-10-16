import React from 'react';
import { Composition, staticFile } from 'remotion';
import { Pelicula, type Props } from './Pelicula';
import { calcular, type Notas } from './ventanas';

const FPS = 25; // como las grabaciones de antes: un 17 % menos de fotogramas que a 30

// La duración, las ventanas de desenfoque y los destellos salen de las notas del ensayo general (public/<ensayo>/notas.json)
export const Raiz: React.FC = () => (
  <Composition
    id="Pelicula"
    component={Pelicula}
    fps={FPS}
    width={1920}
    height={1080}
    durationInFrames={FPS * 10}
    defaultProps={{ ensayo: 'ensayo-completa', ventanas: [], destellos: [], borrosa: true } as Props}
    calculateMetadata={async ({ props }) => {
      const n: Notas = await fetch(staticFile(`${props.ensayo}/notas.json`)).then((r) => r.json());
      const dir = await fetch(staticFile('direccion.json')).then((x) => x.json()).catch(() => ({}));
      const { ventanas, destellos } = calcular(n, dir);
      return { durationInFrames: Math.floor(((n.fin - n.t0) / 1000) * FPS), props: { ...props, ventanas, destellos } };
    }}
  />
);
