// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the services (**Leistungen**) that ONE authority has
 * handed over to another authority
 * (`/rest/allgemein/v3/behoerden/{behoerde-id}/abgegebene-leistungen`).
 *
 * Placeholder Parameter:
 *  - 1st: The NUMERIC authority id — resolve a designation first with
 *         `{ I > 0 ; { BayVIS.Behoerden.ID > <designation> } }`.
 *  - 2nd: OPTIONAL – the property to extract from every service (e.g. "bezeichnung").
 *  - 3rd: OPTIONAL – an 8-digit official municipality key (`gemeindekennziffer`).
 *
 *  - returns an {@link Array } of services, or the requested property values.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Behoerden_Abgegebene_Leistungen {
  /**
   * See {@link BayVIS_Behoerden_Abgegebene_Leistungen }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource(
      {
        service: "behoerden.abgegebene-leistungen",
        idParams: [0],
        propertyParam: 1,
        gemeindekennzifferParam: 2,
      },
      params,
    );
  }
}

window.codbi.registerEP("BayVIS.Behoerden.AbgegebeneLeistungen", BayVIS_Behoerden_Abgegebene_Leistungen.retrieve); // Initialization
