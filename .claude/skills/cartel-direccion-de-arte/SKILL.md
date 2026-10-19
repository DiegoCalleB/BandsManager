---
name: cartel-direccion-de-arte
description: Dirección de arte de la Cartelería de BandManager.io. Reglas para que los carteles parezcan hechos por una persona diseñadora (Photoshop, serigrafía, offset) y nunca por una IA, sin perder la identidad de la banda. Usar al tocar el prompt del fondo con IA (promptCartel.ts), añadir o cambiar estilos, el ADN visual de la banda (adn.ts), el grano o el layout del cartel.
---

# 🎨 Skill: Dirección de arte de la Cartelería

**Objetivo del producto:** que cada banda tenga el cartel que le pegaría hacerse, pero **más profesional** de lo que se haría sola, **sin perder su identidad** y **sin que parezca generado por IA**.

## 1. Reparto de trabajo (no se negocia)

| Quién | Qué | Por qué |
|---|---|---|
| **La IA** (`server/services/imagenCartel.ts`) | SOLO el fondo / la ilustración, en 9:16 | Los modelos de imagen escriben mal los nombres y las fechas |
| **El cliente** (`src/utils/cartel/`) | TODO el texto, el QR, el logo, la marca y el acabado | Tipografía real (Onest), datos reales del bolo, contraste garantizado |
| **El servidor** | Decide qué referencias lee la IA, desde la BD y solo de la carpeta de la banda | El cliente nunca elige qué ficheros se leen |

Nunca se le pide a la IA que escriba texto, nombres, fechas ni logos. Si un fondo trae letras, es un fallo del fondo, no un cartel válido.

## 2. Qué hace que algo «parezca IA» (lo que se ataca)

Superficies de plástico o ultra lisas · orbes brillantes, lens flares, bokeh con destellos, rayos volumétricos · nebulosas cósmicas, ciudades cyberpunk de neón, paisajes de fantasía genéricos · composición «épica» perfectamente simétrica con héroe centrado y halo radial · detalle hiperdenso en todas las superficies · formas o anatomía derretidas, manos de más · caras enceradas o con aerógrafo · contraste tipo HDR · gradación teal-and-orange por defecto · desenfoque onírico de relleno · pseudo-texto ilegible.

## 3. Qué hace que parezca obra de una persona (lo que se pide)

- **Una idea focal** y espacio vacío con intención. Composición asimétrica.
- **Paleta corta (2-4 colores)**, elegida como tintas planas de imprenta.
- **Oficio visible:** grano de papel, tinta irregular, ligero desregistro, tramas de semitono o risografía, bordes cortados o dibujados a mano.
- **Imperfección con intención:** tinta desigual, pequeños desplazamientos. Áreas de color planas o con textura ligera, nunca aerografiadas.
- Formas simples y contundentes, línea segura, contraste de escala con propósito.

## 4. Cómo se describe un estilo

Un estilo se describe con **vocabulario de oficio** (tintas, papel, técnica), nunca con adjetivos genéricos. «Épico, vibrante, espectacular, ultradetallado, 8k, obra maestra» es justo lo que empuja a un modelo a su aspecto de serie y **está vetado** (lo vigila `promptCartel.test.ts`).

| Estilo | Oficio |
|---|---|
| `gigposter` | Serigrafía: 2-3 tintas planas sobre papel crema, sobreimpresión, desregistro |
| `neon` | Fotografía analógica nocturna (35 mm) con tubos de neón reales, o un dúotono impreso |
| `collage` | Collage de papel recortado fotocopiado: bordes rotos, cinta, semitono, toner |
| `minimal` | Impreso suizo: una forma geométrica, dos colores planos, alineación precisa |
| `vintage` | Offset de los 70: tintas desvaídas, paleta cálida corta, ilustración a mano |

## 5. Capas contra el aspecto de IA (ninguna basta sola)

1. **Prompt** (`DIRECCION_DE_ARTE` en `server/utils/promptCartel.ts`): reduce el aspecto de IA. No lo garantiza.
2. **Grano de papel** (`src/utils/cartel/grano.ts`): se aplica a los fondos de IA en el cliente, determinista. Completa al prompt aunque el modelo no obedezca.
3. **Placas de papel y ventana** (`src/utils/cartel/placas.ts`, `ventana.ts`): sobre un fondo de IA el cartel es papel con dos bandas lisas (nombre arriba, datos abajo), filete y orla, y la ilustración va ENTERA en la ventana entre ellas (`encajarImagen`: llena la ventana si recorta ≤ 30 %, si no se pinta entera y centrada). El modelo dibuja una ilustración apaisada 4:3 —no un cartel vertical con huecos— porque un modelo de imagen no mide porcentajes: pedirle «deja sitio arriba y abajo» cortaba la ilustración. Con ilustración el nombre se hace menos grande (`compacto`) para dejarle sitio.
   Desde que el texto debe ir integrado en el arte, el cliente pide por defecto `encuadre: 'sangre'`: ilustración vertical 3:4 a sangre con zonas calmadas arriba y abajo, y el texto encima en tinta clara sobre sombra (`render.ts`, `aSangre`). La ventana apaisada queda para fondos antiguos. Cuidado con la lección anterior: no pidas porcentajes exactos, solo «zonas calmadas»; el velo garantiza la lectura si el modelo no obedece.
4. **Tipografía y layout propios**: el texto lo pone el motor, no el modelo. Es lo que más delata a una imagen de IA y aquí nunca lo genera ella. Tres «letras» (`voces.ts`): moderna (Onest), cartel (Anton, condensada) y clásica (DM Serif Display), elegidas según el estilo de la banda o a mano. La condensada está vetada en la interfaz (visual-identity) pero aquí es OBRA, no interfaz: un cartel de gira no se compone con la letra de una web. Nombre en una línea ancha cuando hay ilustración; el día de la fecha enorme (`layout.ts`), con el mes y el año a su lado.
5. **Papel y tinta del arte** (`papel.ts`): si la ilustración está dibujada sobre un papel liso, el cartel es de ESE papel y la ilustración se funde con él (borde difuminado, sin caja ni filetes); el texto va en la tinta oscura y saturada dominante del propio arte (≥ 7:1), no en un negro de ordenador. La fibra de papel se pone al final, también sobre las letras. Con dos tintas en el arte, el nombre y el día se imprimen antes con la segunda, apenas desplazada (desregistro de serigrafía); la ilustración sube y solapa el final del nombre «oscureciendo» (`darken`), así el papel del dibujo no tapa las letras. Las versalitas pequeñas llevan espaciado (`tracking`).
6. **Composiciones** (`composiciones.ts`, sobre las piezas de `layoutBase.ts`): un cartel de verdad no siempre pone el nombre arriba. Tres: **ventana** (nombre arriba, ilustración, datos abajo), **centrada** (simétrica, con filetes y rombo: club, jazz, vintage) y **base** (fecha y sitio arriba en pequeño y el NOMBRE enorme abajo: festival). `auto` la elige la letra (cartel→ventana, clásica→centrada, moderna→base) y se cambia en Ajustes. Todas pasan los mismos invariantes (`composiciones.test.ts`): nada se sale, nada se pisa, QR y logos libres.
7. **ADN de la banda** (`src/utils/cartel/adn.ts`): referencias y favoritos de la propia banda anclan el resultado a su identidad en lugar del estilo medio del modelo.

## 6. Identidad de la banda (ADN)

- **Automático:** paleta del logo («Tus colores»), estilo sugerido por plantilla del EPK, género y favoritos, y bio/tono al prompt.
- **Referencias (≤ 3):** subidas o carteles anteriores de la propia banda. La IA las mira «como inspiración, sin copiar texto, logos ni caras».
- **Favoritos:** los fondos de IA que la banda acaba compartiendo. Se reutilizan gratis en otros bolos, fijan el estilo preferido y rellenan las referencias.
- Pedir ejemplos es **opcional**: una banda sin material previo tiene que poder hacer su cartel igual.

## 6b. La idea de la persona y los logos

- **Idea (`src/utils/cartel/idea.ts`, `server/services/briefCartel.ts`):** cinco campos cortos opcionales (escena, ambiente, colores, qué evitar, «se parece a…») y un boceto. El servidor los traduce al inglés y los ordena con una llamada barata de texto (`construirBrief`); el resultado entra en el prompt como datos etiquetados (`<scene>`, `<palette>`…) **después** de las reglas, que nada de lo que escribe la persona puede cambiar. Si la IA de texto no responde, se usa lo escrito, saneado, y la imagen sale igual.
- **Boceto:** guía de composición, no de color ni de texto. Va a Gemini como primera imagen y el prompt lo dice. Lo lee el servidor de la carpeta de la banda (`rutaIdea`); el cliente solo dice «úsalo».
- **Vista previa:** `POST /api/cartel/brief` enseña el brief en inglés sin generar imagen: la persona ve qué se le pide a la IA antes de gastar una imagen.
- **Logos:** nunca los dibuja la IA (los deforma). Los pone el motor (`src/utils/cartel/logos.ts`): silueta de UNA tinta —la del texto— con desgaste leve y determinista, en una fila encima de los datos, con peso óptico parecido entre ellos. A color solo si la persona lo pide, sobre una placa clara.

## 7. Evaluar un cambio (antes de dar un estilo por bueno)

Genera 6 fondos con ese estilo y respóndete, sin ser amable:
1. ¿Podría haberlo hecho una persona con Photoshop o en serigrafía? ¿Qué lo delata?
2. ¿Hay algún elemento de la lista del §2?
3. ¿Hay texto, letras o números en el fondo? (descarte automático)
4. ¿Las zonas de arriba y abajo están calmas para poner texto?
5. ¿Se reconoce a la banda (paleta, mood) o es «un cartel de concierto cualquiera»?

Si 2 o más de 6 fallan, el estilo no está listo. No se sube un estilo «porque queda bien en uno».

## 8. Lo que NO se hace

- **No se quita ni se oculta la marca de procedencia** de la imagen (SynthID u otros metadatos del proveedor). El objetivo es el aspecto estético, no ocultar el origen. Tampoco se anuncia «hecho a mano» en la interfaz.
- No se copian carteles de otras bandas o artistas: las referencias son para tomar paleta, textura y ambiente, no la obra.
- No se mandan al modelo datos de personas: nombres de miembros, contactos ni emails.
- No se mezclan cambios de prompt y de comportamiento en el mismo commit (AGENTS.md §5.4).

## 9. Comprobación rápida

```bash
npx vitest run server/utils/__tests__/promptCartel.test.ts src/utils/cartel
```
