// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the online procedures (**Onlineverfahren**) of ONE
 * office (`/rest/allgemein/v3/dienststellen/{dienststellenschluessel}/onlineverfahren`).
 *
 * Placeholder Parameter:
 *  - 1st: The 7-digit office key (`dienststellenschluessel`).
 *  - 2nd: OPTIONAL – the property to extract from every procedure (e.g. "bezeichnung").
 *
 *  - returns an {@link Array } of online procedures, or the requested property values.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Dienststellen_Onlineverfahren {
  /**
   * See {@link BayVIS_Dienststellen_Onlineverfahren }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource(
      { service: "dienststellen.onlineverfahren", idParams: [0], propertyParam: 1 },
      params,
    );
  }
}

window.codbi.registerEP("BayVIS.Dienststellen.Onlineverfahren", BayVIS_Dienststellen_Onlineverfahren.retrieve); // Initialization
