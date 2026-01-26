function e() {
  window.codbi.loadConfig({
    targets: ".CodBi_BayVIS_Behoerde",
    FUNC: "HTML.Text.Mapper",
    Replacements:
      "{ BayVIS.Behoerden.Details.Gebaeude > { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde }} ; { BayVIS.Behoerden.Gebaeude.ID > { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde }}}}",
    Property: "innerHTML",
    CSS: "display:block !important",
  }),
    window.codbi.loadConfig({
      targets: ".CodBi_BayVIS_BehoerdeUndAnsprechpartner",
      FUNC: "HTML.Text.Mapper",
      Replacements:
        "{ Data.Join > { BayVIS.Ansprechpartner.Details > { BayVIS.Ansprechpartner.ID > { V > BayVIS_Hauptansprechpartner }}} ; { BayVIS.Behoerden.Details.Gebaeude > { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde }} ; { BayVIS.Behoerden.Gebaeude.ID > { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde }}}}}",
      Property: "innerHTML",
      CSS: "display:block !important",
    }),
    window.codbi.loadConfig({
      targets: ".CodBi_BayVIS_Ansprechpartner",
      FUNC: "HTML.Text.Mapper",
      Replacements: "{ BayVIS.Ansprechpartner.Details > { V > BayVIS_WeitereAnsprechpartner }}",
      Property: "innerHTML",
      CSS: "display:block !important",
    }),
    window.codbi.loadConfig({
      targets: ".CodBi_BayVIS_Auswahl_Behoerden",
      FUNC: "HTML.Select.Injection",
      Values: "{ BayVIS.Behoerden > bezeichnung }",
      ReClean: "TRUE",
    });
}
e();
export { e as loadConfig };
