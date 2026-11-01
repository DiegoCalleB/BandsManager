-- Migration: 20261126_notacion_americana.sql
-- Notación de acordes homogénea: la tonalidad de las canciones se guarda SIEMPRE en formato americano
-- (E, Em, F#m, Bb). Antes convivían «Mim», «Fa#m», «La Mayor», «C Major»... con «E», «Em», «F#m».
-- Cada persona elige cómo verla (americana o española) en su perfil; lo guardado no cambia.
-- Lo que no es una tonalidad («N/A», texto libre) se deja tal cual. Idempotente: normalizar dos veces
-- da lo mismo. La función es temporal (pg_temp): no queda expuesta por la API.

CREATE FUNCTION pg_temp.norm_tonalidad(t text) RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  patron CONSTANT text := '^(do|re|mi|fa|sol|la|si|[a-g])\s*(#|b|♯|♭)?\s*(m|min|minor|menor|mayor|major|maj)?$';
  txt text := btrim(t);
  m text[];
  parte text;
  nota text;
  alteracion text;
  modo text;
BEGIN
  m := regexp_match(txt, patron, 'i');
  IF m IS NULL THEN
    -- «Mim / Em»: solo si TODOS los trozos son tonalidades («N/A» no es «N» y «A»).
    IF position('/' IN txt) > 0 THEN
      FOREACH parte IN ARRAY string_to_array(txt, '/') LOOP
        IF regexp_match(btrim(parte), patron, 'i') IS NULL THEN
          RETURN txt;
        END IF;
      END LOOP;
      RETURN pg_temp.norm_tonalidad(btrim(split_part(txt, '/', 1)));
    END IF;
    RETURN txt;
  END IF;

  nota := CASE lower(m[1])
    WHEN 'do' THEN 'C' WHEN 're' THEN 'D' WHEN 'mi' THEN 'E' WHEN 'fa' THEN 'F'
    WHEN 'sol' THEN 'G' WHEN 'la' THEN 'A' WHEN 'si' THEN 'B'
    ELSE upper(m[1]) END;
  alteracion := CASE m[2] WHEN '♯' THEN '#' WHEN '♭' THEN 'b' ELSE coalesce(m[2], '') END;
  modo := coalesce(m[3], '');
  RETURN nota || alteracion || CASE WHEN modo = 'm' OR lower(modo) IN ('min', 'minor', 'menor') THEN 'm' ELSE '' END;
END;
$$;

UPDATE public.songs
SET tonalidad = pg_temp.norm_tonalidad(tonalidad)
WHERE tonalidad IS NOT NULL
  AND tonalidad IS DISTINCT FROM pg_temp.norm_tonalidad(tonalidad);
