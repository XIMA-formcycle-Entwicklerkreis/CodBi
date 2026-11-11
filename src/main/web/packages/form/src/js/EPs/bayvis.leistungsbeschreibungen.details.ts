// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves ONE service description
 * (**Leistungsbeschreibung**, with its regional supplements and the competent authorities) by its
 * service id (`/rest/allgemein/v3/leistungsbeschreibungen/{leistung-id}`).
 *
 * Placeholder Parameter:
 *  - 1st: The NUMERIC service id (from `BayVIS.Leistungen > id`).
 *  - 2nd: OPTIONAL – the property to extract. Omit it to receive the whole description object.
 *  - 3rd: OPTIONAL – an 8-digit official municipality key (`gemeindekennziffer`).
 *
 *  - returns the description object, or the requested property value.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Leistungsbeschreibungen_Details {
  /**
   * See {@link BayVIS_Leistungsbeschreibungen_Details }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource(
      {
        service: "leistungsbeschreibungen.details",
        idParams: [0],
        propertyParam: 1,
        gemeindekennzifferParam: 2,
      },
      params,
    );
  }
}

window.codbi.registerEP("BayVIS.Leistungsbeschreibungen.Details", BayVIS_Leistungsbeschreibungen_Details.retrieve); // Initialization
