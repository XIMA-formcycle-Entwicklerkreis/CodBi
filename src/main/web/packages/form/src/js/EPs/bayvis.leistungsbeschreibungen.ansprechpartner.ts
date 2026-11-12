// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the contacts (**Ansprechpartner**) that are defined for
 * ONE service (**Leistung**) — i.e. the "Zuständigkeiten" block of its Leistungsbeschreibung.
 *
 * The BayernPortal has NO per-service contact resource: it delivers the contacts INSIDE the
 * Leistungsbeschreibung (`/rest/allgemein/v3/leistungsbeschreibungen/{leistung-id}`) and steers which
 * ones are returned through `behoerdenAnsprechpartnerZuordnungen`. This EP therefore requests
 * exactly that document and flattens every contact record it contains, so no nested property path
 * has to be known.
 *
 * Placeholder Parameter:
 *  - 1st: The NUMERIC service id (from `BayVIS.Leistungen`), never a designation.
 *  - 2nd: OPTIONAL – the contact selection mode:
 *         `DIREKT` (default — only the contacts DIRECTLY assigned to the service),
 *         `DIREKTBEVORZUGT` (directly assigned contacts preferred; where none exists in a building,
 *         all employees of that authority/unit in the building),
 *         `ALLE` (all employees in the building of the responsible authority) or
 *         `NEIN` (no contacts at all).
 *  - 3rd: OPTIONAL but STRONGLY RECOMMENDED – an 8-digit `gemeindekennziffer` (e.g. "09162000" for
 *         Munich). Without a valid key the portal delivers NO competent authorities at all, so the
 *         result stays empty.
 *  - 4th: OPTIONAL – a property to extract from every contact (e.g. "email", "nachname", "vorname").
 *
 *  - returns an {@link Array } of the contact records, or the values of the requested property.
 *
 * The portal has NO person-level Ansprechpartner for a Leistung: the returned "Zuständigkeiten" only
 * ever embeds the responsible AUTHORITY (with `bezeichnung`, `email`, `website`) and its BUILDING
 * (with `telefon`/`fax`/address). Those embedded authority/building records ARE the contacts this EP
 * returns. A Leistung without a "Zuständigkeiten" block (like many test ids) therefore yields an
 * empty array even with a valid `gemeindekennziffer` — the data simply does not exist on the portal.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Leistungsbeschreibungen_Ansprechpartner {
  /**
   * See {@link BayVIS_Leistungsbeschreibungen_Ansprechpartner }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource(
      {
        service: "leistungsbeschreibungen.details",
        idParams: [0],
        queryParams: { BehoerdenAnsprechpartnerZuordnungen: 1 },
        defaultQuery: { BehoerdenAnsprechpartnerZuordnungen: "DIREKT" },
        gemeindekennzifferParam: 2,
        contactsOnly: true,
        propertyParam: 3,
      },
      params,
    );
  }
}

window.codbi.registerEP(
  "BayVIS.Leistungsbeschreibungen.Ansprechpartner",
  BayVIS_Leistungsbeschreibungen_Ansprechpartner.retrieve,
); // Initialization
