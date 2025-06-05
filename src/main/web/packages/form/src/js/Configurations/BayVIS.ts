/**
 * Registers standard configurations specific buildings registered in BayVIS.
 *
 * CSS-Classes:
 * - **CodBi_BayVIS_Behoerde**
 *  All proper placeholder in the content of the tagged {@link HTMLInputElement }'s "innerHTML" will be replaced with
 *  the data of the building specified in the global variable **BayVIS_Behoerde**. Additionally the
 *  tagged {@link HTMLElement }'s CSS **display** will be set to **block !important** when this config is applied thus
 *  enabling the element to be non present as long as it hasn't received it's values yet by setting it's
 *  CSS **display** to **none**.
 *  The Placeholder's syntax is as follows: [(...)] e.g. [(postanschriftStrasse)].
 *
 * - **CodBi_BayVIS_BehoerdeUndAnsprechpartner**
 *  All proper placeholder in the content of the tagged {@link HTMLInputElement }'s "innerHTML" will be replaced with
 *  the data of the building specified in the global variable **BayVIS_Behoerde** and the contact details of the
 *  contact specified in **BayVIS_Hauptansprechpartner**.
 *  Additionally the   tagged {@link HTMLElement }'s CSS **display** will be set to **block !important** when
 *  this config is applied thus enabling the element to be non present as long as it hasn't received it's values
 *  yet by setting it's CSS **display** to **none**.
 *  The Placeholder's syntax is as follows: [(...)] e.g. [(vorname)].
 *
 * - **CodBi_BayVIS_Ansprechpartner**
 *  All proper placeholder in the content of the tagged {@link HTMLInputElement }'s "innerHTML" will be replaced with
 *  the data of the building specified in the global variable **BayVIS_WeitereAnsprechpartner**.
 *  This variable may contain multiple names separated by slashes. The content of the tagged
 *  {@link HTMLInputElement }'s "innerHTML" will then be used as a template and repeated for as much names were
 *  provided. If the contact for one or more of the names can't be found, that template-block won't be added to the
 *  resulting **innerHTML**.
 *  Additionally the tagged {@link HTMLElement }'s CSS **display** will be set to **block !important** when
 *  this config is applied thus enabling the element to be non present as long as it hasn't received it's values
 *  yet by setting it's CSS **display** to **none**.
 *  The Placeholder's syntax is as follows: [(...)] e.g. [(nachname)].
 *
 * - **CodBi_BayVIS_Auswahl_Behoerden**
 *  All the available authorities will be listed by the tagged {@link HTMLSelectElement }.
 *  The options that were set in the form designer will be overwritten. */
export function loadConfig(): void {
  // #region CodBi_BayVIS_Behoerde
  window.codbi.loadConfig({
    targets: ".CodBi_BayVIS_Behoerde",
    FUNC: "HTML.Text.Mapper",
    Replacements:
      "{ BayVIS.Behoerden.Details.Gebaeude > { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde }} ; { BayVIS.Behoerden.Gebaeude.ID > { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde }}}}",
    Property: "innerHTML",
    CSS: "display:block !important",
  });
  // #endregion CodBi_BayVIS_Behoerde
  // #region CodBi_BayVIS_BehoerdeUndAnsprechpartner
  window.codbi.loadConfig({
    targets: ".CodBi_BayVIS_BehoerdeUndAnsprechpartner",
    FUNC: "HTML.Text.Mapper",
    Replacements:
      "{ Data.Join > { BayVIS.Ansprechpartner.Details > { BayVIS.Ansprechpartner.ID > { V > BayVIS_Hauptansprechpartner }}} ; { BayVIS.Behoerden.Details.Gebaeude > { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde }} ; { BayVIS.Behoerden.Gebaeude.ID > { BayVIS.Behoerden.ID > { V > BayVIS_Behoerde }}}}}",
    Property: "innerHTML",
    CSS: "display:block !important",
  });
  // #endregion CodBi_BayVIS_BehoerdeUndAnsprechpartner
  // #region CodBi_BayVIS_Ansprechpartner
  window.codbi.loadConfig({
    targets: ".CodBi_BayVIS_Ansprechpartner",
    FUNC: "HTML.Text.Mapper",
    Replacements: "{ BayVIS.Ansprechpartner.Details > { V > BayVIS_WeitereAnsprechpartner }}",
    Property: "innerHTML",
    CSS: "display:block !important",
  });
  // #endregion CodBi_BayVIS_Ansprechpartner
  // #region CodBi_BayVIS_Auswahl_Behoerden
  window.codbi.loadConfig({
    targets: ".CodBi_BayVIS_Auswahl_Behoerden",
    FUNC: "HTML.Select.Injection",
    Values: "{ BayVIS.Behoerden > bezeichnung }",
    ReClean: "TRUE",
  });
  // #endregion CodBi_BayVIS_Auswahl_Behoerden
}

loadConfig();
