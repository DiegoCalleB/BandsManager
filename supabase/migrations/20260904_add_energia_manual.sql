-- Marca las canciones cuya energía (1-20) el usuario fijó a mano desde el setlist, para que el
-- recalibrado automático tras analizar el audio de otras canciones (recalibrarEnergiasDelRepertorio
-- en server/db/repertoire.ts) no la sobrescriba sin que el usuario lo pida.

ALTER TABLE songs ADD COLUMN IF NOT EXISTS energia_manual boolean NOT NULL DEFAULT false;
