// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the office(s) (**Dienststelle** and its Außenstellen)
 * of ONE 7-digit office key
 * (`/rest/allgemein/v3/dienststellen/{dienststellenschluessel}`).
 *
 * Placeholder Parameter:
 *  - 1st: The 7-digit office key (`dienststellenschluessel`), e.g. "0308106".
 *  - 2nd: OPTIONAL – the property to extract (e.g. "bezeichnung").
 *
 *  - returns the office record(s), or the requested property value(s).
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Dienststellen_Details {
  /**
   * See {@link BayVIS_Dienststellen_Details }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource({ service: "dienststellen.details", idParams: [0], propertyParam: 1 }, params);
  }
}

window.codbi.registerEP("BayVIS.Dienststellen.Details", BayVIS_Dienststellen_Details.retrieve); // Initialization
