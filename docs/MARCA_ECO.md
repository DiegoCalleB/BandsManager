# Eco, la mascota de BandManager

Eco es un murciélago rockero con guitarra. Es la cara y el nombre de los asistentes de BandManager y de los ejercicios del máster. Este documento fija dónde sale y cómo, para que sea el mismo Eco en todo el proyecto.

## Quién es

- **Nombre:** Eco. Se presenta en primera persona («Soy Eco…») en todos los asistentes.
- **Carácter:** rockstar socarrón, directo y cercano, con humor de ensayo. Dice cuándo no sabe algo y no inventa datos.
- **Qué no es:** no sustituye a los nombres de las funciones. «Agente IA», «Manager Virtual» y «asesor» siguen siendo el nombre del servicio; Eco es quien da la cara.

## Dónde aparece

| Lugar | Cómo |
|---|---|
| Agente de IA de la app | `EcoAvatar` en el botón flotante, la cabecera y el avatar de cada respuesta; saludo «Soy **Eco**, vuestro Manager Virtual…»; el prompt del servidor (`server/services/chatPrompt.ts`) lo llama Eco |
| Chat de la landing y de la landing del TFM | `EcoAvatar` en el botón flotante y la cabecera; saludo «Soy Eco, el asistente de BandManager» |
| Asesor de marketing | `EcoAvatar` en el botón «Preguntar al asesor» y en la cabecera del chat |
| Ejercicios del máster | Mascota del canal, guía flotante, botón «Pregúntale a Eco» y miniaturas, en `public/ejercicio_youtube_crm*` y `ejercicios/` |

## Cómo se usa en la interfaz

- Siempre con `EcoAvatar` (`src/components/ui/EcoAvatar.tsx`), nunca con una imagen suelta ni con un icono de catálogo. La imagen es `public/eco-avatar.webp`.
- Es decorativo (`alt=""`): el significado lo da el texto o el `aria-label` del botón que lo contiene.
- Tamaño por utilidades (`size-5` a `size-12`); sin bordes, sombras ni degradados nuevos (visual-identity, ley 1).
- Un icono de IA genérico (guitarra, bocadillo, destellos) no vuelve a los asistentes. Los destellos de `ChatMessageBubble` y `TarjetaHoy` marcan una acción propuesta o una idea, no al asistente.

## Voz

- Voz de Eco en ElevenLabs: «Eco (rockstar F2)», rasgada y con presencia de escenario.
- Se usa con cuenta de gasto: en saludos y frases clave, no en cada respuesta.
- Los clips que la usan dicen siempre datos reales; las cifras de ejemplo se rotulan como tal.

## Piezas gráficas

- Poses recortadas de Eco en `public/ejercicio_youtube_crm/eco/` y `ejercicios/assets/youtube-crm/eco/`.
- Las imágenes de Eco son arte conceptual generado con IA: antes de un uso comercial hay que revisar los derechos con un abogado y, idealmente, encargar la versión final a una persona ilustradora.

## Piel de marca de los ejercicios

Las páginas de los ejercicios (`public/ejercicio_youtube_crm*` y `ejercicios/`) tienen un cuarto tema, **Marca**, que es el que se ve por defecto. No cambia la aplicación, que sigue con Espectro (Claro, Oscuro y Clásico).

| Token | Valor |
|---|---|
| `--bg` | `#0b0b0d` (negro) |
| `--surface` / `--sunken` | `#15151a` / `#1f1f26` |
| `--ink` / `--ink-2` / `--ink-3` | `#FFE08A` (crema) / `#CDB878` / `#9A8D68` |
| `--acc` / `--acc-ink` | `#F5A300` (ámbar) / `#FFC21A` (dorado) |
| `--on-acc` | `#140d00` |

Lema: «Tu manager de bolsillo.». Las miniaturas de YouTube usan la misma paleta: fondo negro con foco ámbar, texto crema con contorno negro y una palabra en ámbar, Eco grande a la derecha y un único objeto de la app a la izquierda.
