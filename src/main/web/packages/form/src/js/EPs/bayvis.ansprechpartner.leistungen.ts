// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the services (**Leistungen**) that are assigned to ONE
 * contact (`/rest/allgemein/v3/ansprechpartner/{ansprechpartner-id}/leistungen`).
 *
 * Placeholder Parameter:
 *  - 1st: The NUMERIC contact id — `{ I > 0 ; { BayVIS.Ansprechpartner.ID > <Firstname Lastname> } }`.
 *  - 2nd: OPTIONAL – the property to extract from every service (e.g. "bezeichnung").
 *  - 3rd: OPTIONAL – an 8-digit official municipality key (`gemeindekennziffer`).
 *
 *  - returns an {@link Array } of services, or the requested property values.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Ansprechpartner_Leistungen {
  /**
   * See {@link BayVIS_Ansprechpartner_Leistungen }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource(
      {
        service: "ansprechpartner.leistungen",
        idParams: [0],
        propertyParam: 1,
        gemeindekennzifferParam: 2,
      },
      params,
    );
  }
}

window.codbi.registerEP("BayVIS.Ansprechpartner.Leistungen", BayVIS_Ansprechpartner_Leistungen.retrieve); // Initialization
