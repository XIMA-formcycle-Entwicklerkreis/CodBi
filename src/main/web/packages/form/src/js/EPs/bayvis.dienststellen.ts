// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the offices (**Dienststellen**, including their branch
 * offices / Außenstellen) of the own authority
 * (`/rest/allgemein/v3/dienststellen`).
 *
 * Placeholder Parameter:
 *  - 1st: OPTIONAL – the property to extract from every office (e.g. "bezeichnung"). Omit it to
 *         receive the whole records.
 *  - 2nd: OPTIONAL – `true` to receive the complete records (logo, descriptions and the
 *         authority/building assignments) instead of the short form the API returns by default.
 *
 *  - returns an {@link Array } of offices, or the requested property values.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Dienststellen {
  /**
   * See {@link BayVIS_Dienststellen }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource({ service: "dienststellen", propertyParam: 0, fullParam: 1 }, params);
  }
}

window.codbi.registerEP("BayVIS.Dienststellen", BayVIS_Dienststellen.retrieve); // Initialization
