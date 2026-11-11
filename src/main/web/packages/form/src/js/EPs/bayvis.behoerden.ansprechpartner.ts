// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the contacts (**Ansprechpartner**) that are assigned to
 * ONE authority (`/rest/allgemein/v3/behoerden/{behoerde-id}/ansprechpartner`).
 *
 * Unlike `BayVIS.Ansprechpartner` (the whole contact directory) this EP is the per-authority list.
 *
 * Placeholder Parameter:
 *  - 1st: The NUMERIC authority id — resolve a designation first with
 *         `{ I > 0 ; { BayVIS.Behoerden.ID > <designation> } }`.
 *  - 2nd: OPTIONAL – the property to extract from every contact (e.g. "nachname", "email").
 *
 *  - returns an {@link Array } of contacts, or the requested property values.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Behoerden_Ansprechpartner {
  /**
   * See {@link BayVIS_Behoerden_Ansprechpartner }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource({ service: "behoerden.ansprechpartner", idParams: [0], propertyParam: 1 }, params);
  }
}

window.codbi.registerEP("BayVIS.Behoerden.Ansprechpartner", BayVIS_Behoerden_Ansprechpartner.retrieve); // Initialization
