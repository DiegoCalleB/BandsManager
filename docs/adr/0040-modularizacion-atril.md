# ADR: Modularización de Atril.tsx con hooks por dominio, contexto y vistas por zona

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0039](./0039-modularizacion-user-profile-modal.md)

## Problema
`src/components/Atril.tsx` (cifrado, audio, estructura y herramientas de estudio de un tema) tenía 1688 líneas: unos 60 `useState`, reproducción con stems, tomas, mezcla y bucle, análisis de acordes del audio, corrección y generación con IA, armonía alineada con la letra, y ~910 líneas de JSX más la función `renderFormattedChordSheet` exportada y usada por el visor de ensayos.

## Decisión
Se mantiene el contrato público (`Atril`, mismas props `cancion`/`modo`/`onClose`/`onUpdateSong`, y la exportación `renderFormattedChordSheet`) y se extrae a `src/components/atril/`:

- **Hooks por dominio:** `useAtrilState` (pestañas, notación, transposición, cifrado, paneles y pantalla completa), `useAtrilAudio` (reproducción, stems, tomas, mezcla, bucle, grabación e ideas), `useChordAnalysis`, `useAtrilEditing` (corrección, IA y guardado), `useAtrilHarmony` (alineación con la letra, tiempos, acorde activo y vibración) y el controlador `useAtrilController`.
- **Contexto** `AtrilContext` + `AtrilProvider`; `ResolvedAtrilProps` fija `song` y `modo` con su valor por defecto.
- **Vistas:** `AtrilView`, `AtrilHeader`, `AtrilToolbar`, `AiSuccessBanner`, `DetectedChordsPanel`, `AtrilBody`, `AtrilModals` y `AtrilAudioElement`.
- **Render del cifrado:** `chordSheetRender.tsx` aloja `renderFormattedChordSheet`; `Atril.tsx` lo reexporta para no romper a sus consumidores.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `Atril.tsx` | 1688 | 37 |
| Archivo más grande creado | — | 344 (`AtrilBody`) |
| `any` / `@ts-ignore` en los archivos creados | 5 | 0 |

## Cambios deliberados
- Se añade `buscarEnAudio` en `useAtrilAudio`: la lógica «saltar a un instante del audio» estaba copiada en tres vistas y, al leer el ref a través del contexto, el compilador de React la marcaba como acceso a refs durante el render.
- Las respuestas de `letra-sincronizada` y `profesor-armonia` se tipan; los errores se leen con `instanceof Error`.
- Los tests de auditoría que leían `Atril.tsx` como texto (once archivos) pasan a leer el contenedor y todos los módulos de `atril/` con `src/audit/leerAtril.ts`.

## Deuda conocida
`useAtrilEditing` y `useAtrilAudio` leen el token y el usuario de `localStorage` directamente en vez de pasar por un servicio de sesión, y `useAtrilHarmony` guarda la preferencia de interfaz `bm_vibrar_acorde` (no son datos de banda; el test de contrato la exime).

## Consecuencias
Tests de contrato en `atril/__tests__/`: contenedor <400 líneas, `renderFormattedChordSheet` sigue importable desde `Atril`, hooks y vistas bien formados y <400 líneas, el contexto falla fuera del proveedor y sin `any` ni HTML crudo.
