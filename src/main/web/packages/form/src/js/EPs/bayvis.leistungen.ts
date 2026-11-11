// #region Imports
import { retrieveBayVISResource } from "../commons/bayvis-resource.js";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves every service (**Leistung**) published in the
 * BayernPortal (`/rest/allgemein/v3/leistungen`).
 *
 * The portal wraps the editorial fields, so a service record looks like
 * `{ id, url, letzteAenderung, bezeichnung: { leittext, position, sichtbar, value },
 * lebenslagen: { lebenslage: [{ id, bezeichnung }] }, synonyme: { synonym: [{ value }] } }` —
 * the NAME is `bezeichnung.value`, NOT `bezeichnung`. Use a DOTTED path to read nested members.
 *
 * Placeholder Parameter:
 *  - 1st: OPTIONAL – the property (or dotted path) to extract from every service, e.g.
 *         "bezeichnung.value" (the name), "id", "url", "lebenslagen.lebenslage",
 *         "synonyme.synonym.value". Omit it to receive the whole service records.
 *  - 2nd: OPTIONAL – an 8-digit official municipality key (`gemeindekennziffer`) to localize the
 *         answer, e.g. "09162000" for Munich.
 *
 *  - returns an {@link Array } of services, or the values of the requested property.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Leistungen {
  /**
   * See {@link BayVIS_Leistungen }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A CodBiError if no data could be retrieved from the BayVIS-endpoint. */
  public static retrieve(params: Array<unknown>): Promise<unknown> {
    return retrieveBayVISResource({ service: "leistungen", propertyParam: 0, gemeindekennzifferParam: 1 }, params);
  }
}

window.codbi.registerEP("BayVIS.Leistungen", BayVIS_Leistungen.retrieve); // Initialization
