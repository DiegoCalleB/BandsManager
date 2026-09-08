-- Migration: Create table setlist_shortcuts for customizable quick-add items in setlists
CREATE TABLE IF NOT EXISTS setlist_shortcuts (
    id TEXT PRIMARY KEY,
    band_id TEXT REFERENCES registered_bands(band_id) ON DELETE CASCADE,
    icono TEXT DEFAULT '⚡',
    etiqueta TEXT NOT NULL,
    titulo_custom TEXT,
    duracion_estimada_minutos INTEGER,
    duracion_estimada_segundos INTEGER,
    nota_tema TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_setlist_shortcuts_band_id ON setlist_shortcuts(band_id);
