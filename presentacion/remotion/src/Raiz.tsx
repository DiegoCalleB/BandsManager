import React from 'react';
import { Composition, staticFile } from 'remotion';
import { Pelicula } from './Pelicula';

const FPS = 25; // como las grabaciones de antes: un 17 % menos de fotogramas que a 30

// La duración sale de las notas del ensayo general (public/ensayo/notas.json)
export const Raiz: React.FC = () => (
  <Composition
    id="Pelicula"
    component={Pelicula}
    fps={FPS}
    width={1920}
    height={1080}
    durationInFrames={FPS * 10}
    calculateMetadata={async () => {
      const n = await fetch(staticFile('ensayo/notas.json')).then((r) => r.json());
      return { durationInFrames: Math.floor(((n.fin - n.t0) / 1000) * FPS) };
    }}
  />
);
