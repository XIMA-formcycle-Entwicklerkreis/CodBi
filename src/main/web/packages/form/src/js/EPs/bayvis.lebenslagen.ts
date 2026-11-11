// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves every life situation (**Lebenslage**) published in the
 * BayernPortal (`/rest/allgemein/v3/lebenslagen`).
 *
 * Placeholder Parameter:
 *  - 1st: OPTIONAL – the property to extract from every life situation (e.g. "bezeichnung"). Omit
 *         it to receive the whole records.
 *  - 2nd: OPTIONAL – an 8-digit official municipality key (`gemeindekennziffer`).
 *
 *  - returns an {@link Array } of life situations, or the requested property values.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Lebenslagen {
  /**
   * See {@link BayVIS_Lebenslagen }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource({ service: "lebenslagen", propertyParam: 0, gemeindekennzifferParam: 1 }, params);
  }
}

window.codbi.registerEP("BayVIS.Lebenslagen", BayVIS_Lebenslagen.retrieve); // Initialization
