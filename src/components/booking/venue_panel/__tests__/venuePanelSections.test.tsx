import { renderToStaticMarkup } from "react-dom/server";
import { describe,expect,it,vi } from "vitest";
import type { Lead } from "../../../../types";
import { VenueContactRosterCards } from "../VenueContactRosterCards";
import { VenueFinancialSimulatorCard } from "../VenueFinancialSimulatorCard";
import { VenueLeadHealthRow } from "../VenueLeadHealthRow";
import { VenueQuickActionBar } from "../VenueQuickActionBar";

const baseLead = { id: "lead-1", nombre_sala: "Sala Apolo", ciudad: "Barcelona", estado: "nuevo" } as Lead;
const noop = vi.fn();

describe("secciones del panel de sala: render con datos mínimos y sin datos opcionales", () => {
  it("VenueQuickActionBar ofrece cerrar bolo y WhatsApp", () => {
    const html = renderToStaticMarkup(
      <VenueQuickActionBar setShowFastDealModal={noop} setShowWhatsAppModal={noop} selectedLead={baseLead} />,
    );
    expect(html).toContain("Cerrar Bolo 1-Click");
    expect(html).toContain("<button");
  });

  it("VenueLeadHealthRow no rompe con un lead recién creado", () => {
    const html = renderToStaticMarkup(
      <VenueLeadHealthRow
        selectedLead={baseLead}
        onUpdateLead={noop}
        getStatusDotColor={() => "var(--acc)"}
        normalizeStatus={() => "nuevo"}
        handleCorrectStatus={noop}
      />,
    );
    expect(html.length).toBeGreaterThan(0);
  });

  it("VenueContactRosterCards muestra el mensaje de enriquecimiento y escapa el nombre de sala", () => {
    const html = renderToStaticMarkup(
      <VenueContactRosterCards
        selectedLead={{ ...baseLead, nombre_sala: "<script>alert(1)</script>" } as Lead}
        handleEnrichLead={async () => {}}
        isEnrichingLead={false}
        enrichStatusMsg="Datos completados"
        autoDetectVenueAddress={() => ""}
        onUpdateLead={noop}
      />,
    );
    expect(html).toContain("Datos completados");
    expect(html).not.toContain("<script>alert(1)</script>");
  });

  it("VenueFinancialSimulatorCard renderiza sin resultado financiero previo", () => {
    const html = renderToStaticMarkup(
      <VenueFinancialSimulatorCard
        handleRecalculateFinancial={async () => {}}
        isRecalculatingFinancial={false}
        simAnticipada={0} setSimAnticipada={noop}
        simTaquilla={0} setSimTaquilla={noop}
        simAlquiler={0} setSimAlquiler={noop}
        simPctSala={0} setSimPctSala={noop}
        simGastosProd={0} setSimGastosProd={noop}
        simNumMusicos={0} setSimNumMusicos={noop}
        selectedLead={baseLead}
      />,
    );
    expect(html.length).toBeGreaterThan(0);
  });
});
