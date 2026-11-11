// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the services (**Leistungen**) of ONE office
 * (`/rest/allgemein/v3/dienststellen/{dienststellenschluessel}/leistungen`).
 *
 * Placeholder Parameter:
 *  - 1st: The 7-digit office key (`dienststellenschluessel`).
 *  - 2nd: OPTIONAL – the property to extract from every service (e.g. "bezeichnung").
 *  - 3rd: OPTIONAL – an 8-digit official municipality key (`gemeindekennziffer`) to localize the
 *         answer.
 *
 *  - returns an {@link Array } of services, or the requested property values.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Dienststellen_Leistungen {
  /**
   * See {@link BayVIS_Dienststellen_Leistungen }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource(
      {
        service: "dienststellen.leistungen",
        idParams: [0],
        propertyParam: 1,
        gemeindekennzifferParam: 2,
      },
      params,
    );
  }
}

window.codbi.registerEP("BayVIS.Dienststellen.Leistungen", BayVIS_Dienststellen_Leistungen.retrieve); // Initialization
