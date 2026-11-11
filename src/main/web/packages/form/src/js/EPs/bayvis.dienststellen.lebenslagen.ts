// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the life situations (**Lebenslagen**) that are
 * assigned to ONE office
 * (`/rest/allgemein/v3/dienststellen/{dienststellenschluessel}/lebenslagen`).
 *
 * Placeholder Parameter:
 *  - 1st: The 7-digit office key (`dienststellenschluessel`).
 *  - 2nd: OPTIONAL – the property to extract from every life situation (e.g. "bezeichnung").
 *  - 3rd: OPTIONAL – an 8-digit official municipality key (`gemeindekennziffer`).
 *
 *  - returns an {@link Array } of life situations, or the requested property values.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Dienststellen_Lebenslagen {
  /**
   * See {@link BayVIS_Dienststellen_Lebenslagen }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource(
      {
        service: "dienststellen.lebenslagen",
        idParams: [0],
        propertyParam: 1,
        gemeindekennzifferParam: 2,
      },
      params,
    );
  }
}

window.codbi.registerEP("BayVIS.Dienststellen.Lebenslagen", BayVIS_Dienststellen_Lebenslagen.retrieve); // Initialization
