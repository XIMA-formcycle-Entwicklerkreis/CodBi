// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the forms (**Formulare**) of ONE office
 * (`/rest/allgemein/v3/dienststellen/{dienststellenschluessel}/formulare`).
 *
 * Placeholder Parameter:
 *  - 1st: The 7-digit office key (`dienststellenschluessel`).
 *  - 2nd: OPTIONAL – the property to extract from every form (e.g. "bezeichnung").
 *
 *  - returns an {@link Array } of forms, or the requested property values.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Dienststellen_Formulare {
  /**
   * See {@link BayVIS_Dienststellen_Formulare }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource({ service: "dienststellen.formulare", idParams: [0], propertyParam: 1 }, params);
  }
}

window.codbi.registerEP("BayVIS.Dienststellen.Formulare", BayVIS_Dienststellen_Formulare.retrieve); // Initialization
