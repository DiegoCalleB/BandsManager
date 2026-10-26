-- El enriquecimiento desde la web ahora también busca el aforo. Las salas con web y sin aforo se revisaron antes sin buscarlo y
-- no se volverían a leer hasta pasados 90 días: se deja sin fecha de revisión a esas para que vuelvan a la cola. Idempotente.
UPDATE catalogo_salas SET web_revisada_en = NULL WHERE aforo IS NULL AND website IS NOT NULL;
