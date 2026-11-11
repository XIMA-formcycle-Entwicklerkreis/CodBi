// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the service descriptions
 * (**Leistungsbeschreibungen**) of ONE office
 * (`/rest/allgemein/v3/dienststellen/{dienststellenschluessel}/leistungsbeschreibungen`).
 *
 * Placeholder Parameter:
 *  - 1st: The 7-digit office key (`dienststellenschluessel`).
 *  - 2nd: OPTIONAL – the property to extract from every description (e.g. "bezeichnung").
 *  - 3rd: OPTIONAL – an 8-digit official municipality key (`gemeindekennziffer`).
 *
 *  - returns an {@link Array } of service descriptions, or the requested property values.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Dienststellen_Leistungsbeschreibungen {
  /**
   * See {@link BayVIS_Dienststellen_Leistungsbeschreibungen }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource(
      {
        service: "dienststellen.leistungsbeschreibungen",
        idParams: [0],
        propertyParam: 1,
        gemeindekennzifferParam: 2,
      },
      params,
    );
  }
}

window.codbi.registerEP(
  "BayVIS.Dienststellen.Leistungsbeschreibungen",
  BayVIS_Dienststellen_Leistungsbeschreibungen.retrieve,
); // Initialization
