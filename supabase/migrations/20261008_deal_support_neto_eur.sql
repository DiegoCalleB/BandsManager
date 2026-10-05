-- Columnas en euros (solo lectura) en la vista de apoyo voluntario.
-- Se añaden al final: CREATE OR REPLACE VIEW no permite reordenar ni quitar columnas.
CREATE OR REPLACE VIEW deal_support_neto AS
SELECT band_id,
       COUNT(*)                                        AS aportaciones,
       SUM(amount_cents)                               AS bruto_cents,
       SUM(reembolsado_cents)                          AS reembolsado_cents,
       SUM(amount_cents - reembolsado_cents)           AS neto_cents,
       ROUND(SUM(amount_cents) / 100.0, 2)                      AS bruto_eur,
       ROUND(SUM(reembolsado_cents) / 100.0, 2)                 AS reembolsado_eur,
       ROUND(SUM(amount_cents - reembolsado_cents) / 100.0, 2)  AS neto_eur
FROM deal_support_contributions
GROUP BY band_id;
