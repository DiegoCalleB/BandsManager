# 🎸 BandManager.io - Visión General del Proyecto

## ¿Qué es?

**BandManager.io** (internamente "Bakandeya") es una plataforma integral SaaS para músicos y bandas independientes. Automatiza:

- **Booking & CRM:** Descubrimiento de salas/festivales, propuestas personalizadas, seguimiento de leads
- **AI Agents:** Reclutamiento automático de salas, redacción de emails, lectura de respuestas (todo human-in-the-loop)
- **Reels & Social:** Generador multi-plataforma de contenido viral (YouTube, TikTok, Instagram, Facebook)
- **Repertorio & Setlists:** Gestor de canciones, bases rítmicas, síntesis de instrumentos
- **Logística de Giras:** Calendario integrado, finanzas de conciertos, pago a venues
- **EPK (Electronic Press Kit):** Dossier público configurable para prensa/salas
- **Gestión de Fans:** Captación y segmentación de base de fans

## Contexto Académico

Es el **Trabajo Fin de Máster (TFM)** en Desarrollo con IA de [Big Máster/The Big School](https://bigmaster.io).
**Autor:** Diego Calleja
**Tema:** Cómo software agéntico multiplica la productividad de un solo desarrollador.

## Stack Técnico

| Capa | Tech |
|------|------|
| **Frontend** | React 19 + Vite + Tailwind CSS v4 |
| **Backend** | Express + TypeScript + Node 22 |
| **BD** | Supabase (PostgreSQL) |
| **Storage** | Supabase Storage (clips, PDFs) |
| **Deploy** | Railway (`railway.json`, `nixpacks.toml`) |
| **AI** | Gemini (Lyria, generación de música) + Claude (redacción de emails) |

## Estructura de Carpetas Principales

```
BandsManager/
├── src/                    # Frontend React 19 + Vite
│   ├── components/        # Feature components + subcomponentes
│   ├── hooks/            # useAppData(), useAuth(), etc.
│   ├── services/         # api.ts (fetch wrapper con auth)
│   ├── utils/            # helpers, validaciones, síntesis de audio
│   ├── i18n/            # traducciones EPK/fan-facing
│   └── main.tsx          # Punto de entrada
│
├── server/               # Backend Express (TypeScript)
│   ├── db/              # Acceso a datos (bands.ts, leads.ts, etc.)
│   ├── routes/          # Endpoints REST (/api/*)
│   ├── services/        # lógica de negocio (agentes, scheduler)
│   ├── utils/           # auth, bandAccess, ssrfGuard, etc.
│   ├── middleware/      # autenticación, rate limiting
│   └── state.ts         # cargar/guardar estado en memoria desde Supabase
│
├── supabase/            # Migraciones SQL, esquema
├── context/             # 👈 **NUEVO:** documentación modular para agentes
└── AGENTS.md            # Directivas del agente (no tocar sin razón)
```

## Estado Actual (Sept 2026)

- ✅ **Core booking+agents:** funcional y testeado
- ✅ **Reels generator:** multi-plataforma
- ✅ **AI music:** síntesis y MIDI export
- ✅ **EPK público:** disponible para bandas
- ✅ **Multi-tenancy:** 5 niveles de suscripción (`promo`, `ensayo`, `local`, `de_gira`, `cabeza_de_cartel`)
- ⚠️ **Security:** escaneo estático de bandIdTrustBoundary en CI; SSRF guard activo
- ⏳ **Next:** mejorar cobertura de tests (560 tests, priorizar security/multi-tenancy)

## Valores Clave

1. **Simplicidad en Pantalla:** Muchas features, interfaz minimalista. Complejidad → backend + IA.
2. **Aprobación Humana Obligatoria:** Ningún email se envía sin validación humana (human-in-the-loop).
3. **Supabase es la Verdad Única:** Google Sheets erradicado. Solo Supabase + memoria sincronizada.
4. **Multi-tenancy Escrupuloso:** Cada banda es un tenant. Sin cross-contamination.

---

## ¿Quién debe leer esto?

- **Agentes:** para entender el scope y la misión
- **Developers:** para contexto antes de hacer cambios
- **Skills/Tools:** para saber qué es "correcto" en este proyecto
