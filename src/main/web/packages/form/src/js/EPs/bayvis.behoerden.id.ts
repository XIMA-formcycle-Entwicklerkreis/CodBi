import { getJQuery } from "@de-xima/fc-form-renderer";
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { CodBiError } from "../global-scope";
import { GREATER } from "xdbc/src/DBC/GREATER";
import { BayVIS_Behoerden_Details } from "./bayvis.behoerden.details";
import { XMLParser } from "fast-xml-parser";
/**
 * This Element-Placeholder retrieves the IDs of authorities by their "bezeichnung" (case insensitive).
 *
 * Placeholder Parameter:
 *  - 1st:  The BayVIS-URL where to retrieve the authority details from.
 *  - 2nd:  The ID of the authority to retrieve.
 *
 *  - resolves to a {@link Array < string >} of authorities IDs with matching "bezeichnung".
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
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
    @GREATER.PRE(1, true, false, "length")
    @AE.PRE(new TYPE("string"))
    @AE.PRE(new REGEX(BayVIS_Behoerden_Details.stdExp.authorityID), 0)
    @AE.PRE(new REGEX(BayVIS_Behoerden_Details.stdExp.directoryMember), 1)
    //@AE.PRE(new REGEX(BayVIS_Ansprechpartner_Details.stdExp.directoryMember), 2)
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
          const response = new XMLParser({ attributeNamePrefix: "", ignoreAttributes: false }).parse(xml)[
            "ns2:behoerden"
          ];

          const data = (response as { [key: string]: unknown }).behoerde as Array<{
            bezeichnung: string;
            behoerdenart: string;
            behoerdengruppe: string;
            id: number;
          }>;

          const result = new Array<string>();

          for (let i = 0; i < data.length; i++) {
            if (data[i]?.bezeichnung.toLowerCase() === (params[0] as string).toLowerCase()) {
              // biome-ignore lint/style/noNonNullAssertion: Assured within this branch.
              result.push(data[i]!.id!.toString());
            }
          }

          resolve(result);
        })
        .fail((X: unknown) => {
          reject(new CodBiError("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdenverzeichnis"));
        });
    });
  }
  // #region Initialization
  /**
   * States whether this {@link BayVIS_Behoerden_ID } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("BayVIS.Behoerden.ID", BayVIS_Behoerden_ID.retrieve);
  })();
  // #region Initialization
}
