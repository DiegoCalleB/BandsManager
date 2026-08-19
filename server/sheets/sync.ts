import { autonomyConfigToRow, ensureAutonomiaSheet } from "./autonomy.js";
import { concertToRow, rehearsalToRow, syncLogisticsToSheet } from "./concerts.js";
import { ensureSheetTabExists, getSheetId, getSheetsClient, getSpreadsheetId, invalidateValuesCache, retrySheetsWrite } from "./core.js";
import { ensureEpkSheet, epkConfigToRow } from "./epk.js";
import { ensureFansSheet, fanToRow } from "./fans.js";
import { paymentToRow } from "./finance.js";
import { bandToRow, ensureBandasSheet } from "./friendlyBands.js";
import { DEFAULT_LEADS_HEADERS, bootstrapHilosEmailsSheet, leadToRowDynamic } from "./leads.js";
import { ensureRegistroBandasSheet, registeredBandToRow } from "./registeredBands.js";
import { setlistToRow, songToRow } from "./repertoire.js";
import { socialMetricToRow, socialPostToRow } from "./social.js";
import { ensurePlantillasPautasSheet, templateConfigToRow } from "./templates.js";
import { ensureToursSheet, tourToRow } from "./tours.js";
import { ensureUsuariosBandasSheet, ensureUsuariosSheet, userBandToRow, userToRow } from "./users.js";

export async function syncAllTabsWithBakandeya(state: any) {
  const sheets = getSheetsClient();
  const spreadsheetId = getSpreadsheetId();
  if (!sheets || !spreadsheetId) return;

  const bandId = "band-bakandeya";

  try {
    // 1. registro_bandas
    await ensureRegistroBandasSheet(sheets, spreadsheetId);
    if (state.registeredBands && state.registeredBands.length > 0) {
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "registro_bandas!A2:P",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: state.registeredBands.map((b: any) => registeredBandToRow({ ...b, band_id: bandId })) }
      }));
    }

    // 2. usuarios
    await ensureUsuariosSheet(sheets, spreadsheetId);
    if (state.users && state.users.length > 0) {
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "usuarios!A2:J",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: state.users.map((u: any) => userToRow({ ...u, band_id: bandId })) }
      }));
    }

    // 2b. usuarios_bandas
    await ensureUsuariosBandasSheet(sheets, spreadsheetId);
    if (state.userBands && state.userBands.length > 0) {
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "usuarios_bandas!A2:E",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: state.userBands.map((ub: any) => userBandToRow(ub)) }
      }));
    }

    // 3. leads & hilos_emails
    if (state.leads && state.leads.length > 0) {
      const hilosSheetId = await getSheetId(sheets, spreadsheetId, "hilos_emails");
      const headers = DEFAULT_LEADS_HEADERS;
      const leadRows = state.leads.map((l: any) => leadToRowDynamic({ ...l, band_id: bandId }, headers, hilosSheetId));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "leads!A2",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: leadRows }
      }));

      await bootstrapHilosEmailsSheet(sheets, spreadsheetId, state.leads.map((l: any) => ({ ...l, band_id: bandId })));
    }

    // 4. ensayos
    if (state.rehearsals && state.rehearsals.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "ensayos");
      const rows = state.rehearsals.map((r: any) => rehearsalToRow({ ...r, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "ensayos!A2:M",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 5. conciertos
    if (state.concerts && state.concerts.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "conciertos");
      const rows = state.concerts.map((c: any) => concertToRow({ ...c, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "conciertos!A2:N",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 6. redes_sociales
    if (state.posts && state.posts.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "redes_sociales");
      const rows = state.posts.map((p: any) => socialPostToRow({ ...p, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "redes_sociales!A2:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 7. finanzas
    if (state.payments && state.payments.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "finanzas");
      const rows = state.payments.map((p: any) => paymentToRow({ ...p, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "finanzas!A2:K",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 8. seguidores
    if (state.metrics && state.metrics.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "seguidores");
      const rows = state.metrics.map((m: any) => socialMetricToRow({ ...m, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "seguidores!A2:G",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 9. canciones
    if (state.songs && state.songs.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "canciones");
      const rows = state.songs.map((s: any) => songToRow({ ...s, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "canciones!A2:P",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 10. repertorios
    if (state.setlists && state.setlists.length > 0) {
      await ensureSheetTabExists(sheets, spreadsheetId, "repertorios");
      const rows = state.setlists.map((st: any) => setlistToRow({ ...st, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "repertorios!A2:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 11. tours
    if (state.tours && state.tours.length > 0) {
      await ensureToursSheet(sheets, spreadsheetId);
      const rows = state.tours.map((t: any) => tourToRow({ ...t, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "tours!A2:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 12. fans
    if (state.fans && state.fans.length > 0) {
      await ensureFansSheet(sheets, spreadsheetId);
      const rows = state.fans.map((f: any) => fanToRow({ ...f, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "fans!A2:J",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 13. bandas
    if (state.bands && state.bands.length > 0) {
      await ensureBandasSheet(sheets, spreadsheetId);
      const rows = state.bands.map((b: any) => bandToRow({ ...b, band_id: bandId }));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "bandas!A2:Q",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 14. logistics (runOfShow & gearChecklists)
    if (state.runOfShow || state.gearChecklists) {
      await syncLogisticsToSheet(
        Object.fromEntries(
          Object.entries(state.runOfShow || {}).map(([k, list]: [string, any]) => [
            k,
            list.map((item: any) => ({ ...item, band_id: bandId }))
          ])
        ),
        Object.fromEntries(
          Object.entries(state.gearChecklists || {}).map(([k, list]: [string, any]) => [
            k,
            list.map((item: any) => ({ ...item, band_id: bandId }))
          ])
        )
      );
    }

    // 15. dossier_epk
    if (state.epkConfigsByBand && Object.keys(state.epkConfigsByBand).length > 0) {
      await ensureEpkSheet(sheets, spreadsheetId);
      const rows = Object.entries(state.epkConfigsByBand).map(([bId, cfg]: [string, any]) => epkConfigToRow(bId, cfg));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "dossier_epk!A2:R",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 16. config_autonomia
    if (state.autonomyConfigsByBand && Object.keys(state.autonomyConfigsByBand).length > 0) {
      await ensureAutonomiaSheet(sheets, spreadsheetId);
      const rows = Object.entries(state.autonomyConfigsByBand).map(([bId, cfg]: [string, any]) => autonomyConfigToRow(bId, cfg));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "config_autonomia!A2:I",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    // 17. plantillas_pautas_ia
    if (state.categoryTemplates && Object.keys(state.categoryTemplates).length > 0) {
      await ensurePlantillasPautasSheet(sheets, spreadsheetId);
      const rows = Object.entries(state.categoryTemplates).map(([catKey, cfg]: [string, any]) => templateConfigToRow(bandId, catKey, cfg));
      await retrySheetsWrite(() => sheets.spreadsheets.values.update({
        spreadsheetId,
        range: "plantillas_pautas_ia!A2:K" + (rows.length + 1),
        valueInputOption: "USER_ENTERED",
        requestBody: { values: rows }
      }));
    }

    invalidateValuesCache();
    console.log("[Google Sheets] All tabs successfully updated with band_id = band-bakandeya!");
  } catch (err: any) {
    console.warn("Notice syncing sheets with band_id:", err?.message || err);
  }
}
