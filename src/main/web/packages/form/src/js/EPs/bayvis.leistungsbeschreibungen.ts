// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves every service description
 * (**Leistungsbeschreibung**, including the regional supplements) published in the BayernPortal
 * (`/rest/allgemein/v3/leistungsbeschreibungen`).
 *
 * This is the ONE call that returns the DETAILS of EVERY Leistung: the portal has no paging on this
 * resource (unlike `/behoerden`), so the whole list arrives in a single response. The
 * "Zuständigkeiten" block (competent authorities and their contacts) is deliberately NOT part of it —
 * use `BayVIS.Leistungsbeschreibungen.Ansprechpartner` or `BayVIS.Behoerden.Ansprechpartner` for
 * those.
 *
 * Placeholder Parameter:
 *  - 1st: OPTIONAL – the property to extract from every description (e.g. "bezeichnung"). Omit it
 *         to receive the whole records.
 *  - 2nd: OPTIONAL – an 8-digit official municipality key (`gemeindekennziffer`).
 *  - 3rd: OPTIONAL – `"true"` to include the regional supplements matching the gemeindekennziffer.
 *         The portal defaults to `false` on THIS resource (the single-record EP defaults to true).
 *  - 4th: OPTIONAL – `"true"` to also receive the internal ids of the linked sub-objects (links,
 *         documents, forms, legal bases, online procedures).
 *
 *  - returns an {@link Array } of service descriptions, or the requested property values.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Leistungsbeschreibungen {
  /**
   * See {@link BayVIS_Leistungsbeschreibungen }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource(
      {
        service: "leistungsbeschreibungen",
        propertyParam: 0,
        gemeindekennzifferParam: 1,
        queryParams: { MitRegionalenErgaenzungen: 2, MitIDallgemeineDaten: 3 },
      },
      params,
    );
  }
}

window.codbi.registerEP("BayVIS.Leistungsbeschreibungen", BayVIS_Leistungsbeschreibungen.retrieve); // Initialization
