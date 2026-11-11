// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves ONE life situation (**Lebenslage**) by its id
 * (`/rest/allgemein/v3/lebenslagen/{lebenslage-id}`).
 *
 * Placeholder Parameter:
 *  - 1st: The NUMERIC life situation id (from `BayVIS.Lebenslagen > id`).
 *  - 2nd: OPTIONAL – the property to extract (e.g. "bezeichnung"). Omit it to receive the whole record.
 *  - 3rd: OPTIONAL – an 8-digit official municipality key (`gemeindekennziffer`).
 *
 *  - returns the life situation record, or the requested property value.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Lebenslagen_Details {
  /**
   * See {@link BayVIS_Lebenslagen_Details }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource(
      { service: "lebenslagen.details", idParams: [0], propertyParam: 1, gemeindekennzifferParam: 2 },
      params,
    );
  }
}

window.codbi.registerEP("BayVIS.Lebenslagen.Details", BayVIS_Lebenslagen_Details.retrieve); // Initialization
