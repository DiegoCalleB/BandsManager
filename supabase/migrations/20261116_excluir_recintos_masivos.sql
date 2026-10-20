-- Los recintos para artistas de estadio y pabellón (WiZink Center, Movistar Arena, Palau Sant Jordi...) no son para una banda que busca salas:
-- el catálogo ya no los recoge (server/utils/salaCatalogo.ts, esRecintoMasivo). Aquí se borran los que ya estaban. Los leads que apuntaban
-- a ellos quedan con sala_id nulo (ON DELETE SET NULL) y siguen siendo de su banda. Los festivales no se miden por aforo.
DELETE FROM catalogo_salas
WHERE (COALESCE(tipo, 'sala') <> 'festival' AND aforo > 5000)
   OR nombre ~* '^(wizink center|movistar arena|palau sant jordi|estadio metropolitano|civitas metropolitano|santiago bernabeu|camp nou|spotify camp nou)( |$)';
