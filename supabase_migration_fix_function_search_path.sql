-- =========================================================================
-- FIJAR search_path EN update_modified_column (lint: function_search_path_mutable)
-- =========================================================================
-- El advisor de seguridad de Supabase marca esta función (trigger de
-- updated_at usado por casi todas las tablas) porque no fija su
-- search_path: sin eso, quien pueda alterar el search_path de la sesión
-- (p. ej. con CREATE FUNCTION en un esquema que aparezca antes en el
-- search_path por defecto) podría, en teoría, hacer que la función
-- resuelva un objeto o función distinto al que espera — riesgo bajo aquí
-- porque no llama a nada fuera de la fila NEW/OLD, pero es gratis de
-- cerrar y es la recomendación estándar de Supabase para toda función.
--
-- CREATE OR REPLACE conserva el OID de la función, así que todos los
-- triggers que ya la usan (updated_at en prácticamente cada tabla) siguen
-- apuntando a ella sin necesidad de volver a crearlos. Mismo comportamiento,
-- solo se fija el search_path.
-- =========================================================================

CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Verificación tras aplicar: el advisor de seguridad ya no debe listar
-- function_search_path_mutable para public.update_modified_column.
