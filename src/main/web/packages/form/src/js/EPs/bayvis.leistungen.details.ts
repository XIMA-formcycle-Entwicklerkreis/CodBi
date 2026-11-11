// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves ONE service (**Leistung**) of the BayernPortal by its
 * id (`/rest/allgemein/v3/leistungen/{leistung-id}`).
 *
 * Placeholder Parameter:
 *  - 1st: The NUMERIC service id (from `BayVIS.Leistungen > id`).
 *  - 2nd: OPTIONAL – the property to extract (e.g. "bezeichnung"). Omit it to receive the whole record.
 *  - 3rd: OPTIONAL – an 8-digit official municipality key (`gemeindekennziffer`).
 *
 *  - returns the service record, or the requested property value.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Leistungen_Details {
  /**
   * See {@link BayVIS_Leistungen_Details }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource(
      { service: "leistungen.details", idParams: [0], propertyParam: 1, gemeindekennzifferParam: 2 },
      params,
    );
  }
}

window.codbi.registerEP("BayVIS.Leistungen.Details", BayVIS_Leistungen_Details.retrieve); // Initialization
