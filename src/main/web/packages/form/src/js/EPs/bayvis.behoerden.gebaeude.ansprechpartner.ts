// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves ONE contact that is assigned to a BUILDING of an
 * authority
 * (`/rest/allgemein/v3/behoerden/{behoerde-id}/gebaeude/{gebaeude-id}/ansprechpartner/{ansprechpartner-id}`).
 *
 * Placeholder Parameter (all three ids are MANDATORY and NOT interchangeable):
 *  - 1st: The NUMERIC authority id — `{ I > 0 ; { BayVIS.Behoerden.ID > <designation> } }`.
 *  - 2nd: The NUMERIC building id — `{ I > 0 ; { BayVIS.Behoerden.Gebaeude.ID > <authority id> } }`.
 *  - 3rd: The NUMERIC contact id — `{ I > 0 ; { BayVIS.Ansprechpartner.ID > <Firstname Lastname> } }`.
 *  - 4th: OPTIONAL – the property to extract (e.g. "email").
 *
 *  - returns the contact record, or the requested property value.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Behoerden_Gebaeude_Ansprechpartner {
  /**
   * See {@link BayVIS_Behoerden_Gebaeude_Ansprechpartner }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource(
      {
        service: "behoerden.gebaeude.ansprechpartner",
        idParams: [0, 1, 2],
        propertyParam: 3,
      },
      params,
    );
  }
}

window.codbi.registerEP(
  "BayVIS.Behoerden.Gebaeude.Ansprechpartner",
  BayVIS_Behoerden_Gebaeude_Ansprechpartner.retrieve,
); // Initialization
