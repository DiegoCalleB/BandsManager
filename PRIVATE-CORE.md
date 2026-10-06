# Qué va al repo público y qué se queda privado

Modelo: **open core**. El repo público (AGPL-3.0-only) es el producto base y el
TFM. La ventaja competitiva se mantiene en un repo privado.

## Público (este repo)
- App base: UI, gestión de repertorio, setlists, QR de conciertos, CRM básico.
- Arquitectura general y documentación del TFM.
- Esquema de BD genérico y migraciones.

## Privado (a decidir y mover, repo aparte)
- Prompts y flujos de los agentes (booking, reels, music studio) afinados.
- Scrapers y base de datos de salas/festivales (los datos, no solo el código).
- Scoring/ranking de salas, lógica de matching y outreach.
- Plantillas de email con mejores conversiones y claves/configuración.

## Reglas
- Ningún secreto, `.env` ni dato de clientes en el repo público (revisar
  también el historial de git).
- Cada módulo privado se carga como plugin opcional, de modo que el repo
  público compile y funcione sin él.
