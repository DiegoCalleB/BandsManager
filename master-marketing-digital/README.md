# Máster de Marketing Digital con IA

> **Esto no es parte del TFM de Desarrollo de Software con IA.**
> El TFM (BandManager.io) vive en `src/`, `server/`, `supabase/` y `e2e/`. Esta carpeta es **otro proyecto**: los
> ejercicios de un segundo máster, el de Marketing Digital con IA, que se publican como web estática en
> `https://bandmanager.io/master-marketing-digital/`.

## Qué hay aquí

```
master-marketing-digital/
├── README.md
└── web/                     # lo único que se sirve (server/routes/masterMarketingDigital.ts)
    ├── index.html           # portada: lista de ejercicios
    ├── youtube-crm.html     # YouTube y CRM para bandas (caso BandManager)
    ├── branding.html        # identidad de marca de BandManager
    ├── facebook-clinica-dental.html   # caso ficticio, con noindex
    └── assets/              # imágenes, audio, fuentes y el menú (ejercicios.js)
```

- **Tres ejercicios publicados**, cada uno con su enunciado. El de la clínica dental es un cliente ficticio
  (Clínica Dental Pérez) y **no usa BandManager ni a Eco**.
- Son HTML, CSS y JavaScript sin dependencias, sin base de datos ni datos de bandas.
- `youtube-crm` y `branding` se indexan (hablan de BandManager); `facebook-clinica-dental` lleva `noindex`.

## Cómo se publica

Express sirve `master-marketing-digital/web` bajo `/master-marketing-digital` (un solo montaje, sin rutas por página).
Las URL antiguas (`/ejercicio_youtube_crm`, `/ejercicio_branding`, `/ejercicio_facebook`) redirigen con 301.

## Para añadir un ejercicio

1. Crear `web/<nombre>.html` y copiar la cabecera y los tokens de un ejercicio existente.
2. Poner su URL en `GRUPOS` de `web/assets/ejercicios.js`.
3. Si debe indexarse, añadirlo a `entradasMaster` en `server/routes/masterMarketingDigital.ts` y dejar `index,follow` y `canonical`.

## Quién no debe tocar esto

Los agentes de código no editan esta carpeta salvo petición expresa. El grafo de conocimiento y los análisis del
TFM no la cubren.
