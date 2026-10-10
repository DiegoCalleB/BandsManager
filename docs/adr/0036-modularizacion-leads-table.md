# ADR: Modularización de LeadsTable.tsx con controlador, contexto y vistas

**Estado:** aceptada · **Contexto:** AGENTS.md §5.6 (límite de 800 líneas), continuación de [0035](./0035-quitar-bandas-del-proyecto-de-ejemplo.md)

## Problema
`src/components/booking/LeadsTable.tsx` (lista de leads del CRM de booking) tenía 1847 líneas: tres renderizadores de insignias y uno de fechas (445 líneas) como funciones locales, escaneo de fechas en lote, filtro por tipo de medio, y ~1050 líneas de JSX con la rejilla de tarjetas y la tabla duplicando casi la misma información.

## Decisión
Se mantiene el contrato público (`LeadsTable`, mismas props, usado por `ListOrMapArea`) y se extrae a `src/components/booking/leads_table/`:

- **Hooks:** `useLeadsBatchDateScan` y el controlador `useLeadsTableController` (selección de cabecera, filtrado, imagen en edición y acciones rápidas).
- **Contexto** `LeadsTableContext` + `LeadsTableProvider` (`valor = ReturnType<controlador> & props resueltas`). `ResolvedLeadsTableProps` recoge las props con sus valores por defecto aplicados.
- **Vistas:** `LeadsTableView`, `LeadGridCard` (+ `LeadCardHeader`, `LeadCardIntelligence`, `LeadCardQualityBadges`, `LeadCardActions`), `LeadTableRow` (+ `LeadRowContact`, `LeadRowActions`).
- **Insignias y fechas:** `LeadTipoBadge`, `LeadTemperatureBadge`, `LeadIntentBadge`, y `LeadDatesInfo` dividido en `LeadDatesTableBadges`, `LeadCampaignDates` y `LeadSourcePills`.
- **Tipado:** `leadRadar.ts` (`radarDe`, `campanaDe`) centraliza los campos del radar y los alias heredados de campaña que antes se leían con `(x as any)`; `venueProgrammingUrl.ts` aísla el cálculo de la URL de programación.

## Resultado

| Métrica | Antes | Después |
|---|---|---|
| Líneas de `LeadsTable.tsx` | 1847 | ~90 |
| Archivo más grande creado | — | 233 (`LeadsTableView`) |
| `any` / `@ts-ignore` en los archivos creados | 25 | 0 (`any` solo en un comentario) |

## Cambios deliberados
- Las funciones `render*` pasan a componentes con `lead` como prop; la fecha en modo tabla ya no recalcula nada en el padre.
- `activeCampaign` pasa de `any` a `BookingCampaign | null`.
- La respuesta del endpoint de escaneo en lote se tipa (`BatchDatesResponse`) y los errores se leen con `instanceof Error`.
- En `LeadCampaignDates` se eliminan las asignaciones iniciales inútiles de `isAvailableForCampaign` y `matchingDatesInCampaign` (todas las ramas asignan).

## Consecuencias
Tests de contrato en `leads_table/__tests__/`: contenedor <400 líneas, vistas y hooks bien formados y <400 líneas, el contexto falla fuera del proveedor, `venueProgrammingUrl` y los adaptadores del radar, y sin `any`, HTML crudo ni persistencia en storage.
