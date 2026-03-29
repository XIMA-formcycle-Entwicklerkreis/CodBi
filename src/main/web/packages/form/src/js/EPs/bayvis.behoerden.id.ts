// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region Fast XML-Parser
import { XMLParser } from "fast-xml-parser";
// #endregion Fast XML-Parser
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
// #endregion XDBC
import { CodBiError } from "../global-scope";
import { BayVIS_Behoerden_Details } from "./bayvis.behoerden.details";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the IDs of authorities by their "bezeichnung" (case insensitive).
 *
 * Placeholder Parameter:
 *  - 1st: The Name of the authority to retrieve.
 *
 *  - resolves to a {@link Array < string >} of authorities IDs with matching "bezeichnung".
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Behoerden_ID {
  /** Buffers the requested directory of authorities. */
  public static buffer:
    | Array<string>
    | Array<{
        bezeichnung: string;
        behoerdenart: string;
        behoerdengruppe: string;
        id: number;
      }>;
  /**
   * See {@link BayVIS_Behoerden_ID }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A {@link CodBiError } if no data could be retrieved from the BayVIS-endpoint. */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(1, true, false, "length", "Has the name of the authority been specified?")
    @AE.PRE(new TYPE("string"))
    params: Array<unknown>,
  ): Promise<
    | Array<string>
    | Array<{
        bezeichnung: string;
        behoerdenart: string;
        behoerdengruppe: string;
        id: number;
      }>
  > {
    return new Promise((resolve, reject) => {
      // #region Use buffer if available.
      if (BayVIS_Behoerden_ID.buffer) {
        if (params.length >= 2) {
          resolve(BayVIS_Behoerden_ID.buffer.map((toMap) => (toMap as { [key: string]: string })[params[1] as string]));
        } else {
          resolve(BayVIS_Behoerden_ID.buffer as Array<string>);
        }
      }
      // #endregion Use buffer if available.
      const $ = getJQuery();

      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Behoerdenverzeichnis`,
        type: "GET",
        headers: { Accept: "application/xml" },
      })
        .done((xml: string) => {
          let response = new XMLParser({ attributeNamePrefix: "", ignoreAttributes: false }).parse(xml)[
            "ns2:behoerden"
          ];
          // #region React if data is not of format XML but JSON.
          if (response === undefined) {
            response = JSON.parse(xml);
          }
          // #endregion React if data is not of format XML but JSON.
          // If no response from endpoint (missing credentials)...
          if (response === undefined) {
            reject(new CodBiError("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdenverzeichnis"));
          }

          const data = (response as { [key: string]: unknown }).behoerde as Array<{
            bezeichnung: string;
            behoerdenart: string;
            behoerdengruppe: string;
            id: number;
          }>;

          const result = new Array<string>();

          for (let i = 0; i < data.length; i++) {
            if (data[i]?.bezeichnung.toLowerCase() === (params[0] as string).toLowerCase()) {
              result.push(data[i].id.toString());
            }
          }

          resolve(result);
        })
        .fail((X: unknown) => {
          reject(new CodBiError("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdenverzeichnis"));
        });
    });
  }
}

window.codbi.registerEP("BayVIS.Behoerden.ID", BayVIS_Behoerden_ID.retrieve.bind(BayVIS_Behoerden_ID)); // Initialization
