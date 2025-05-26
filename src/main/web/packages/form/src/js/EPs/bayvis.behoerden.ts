import { getJQuery } from "@de-xima/fc-form-renderer";
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { CodBiError } from "../global-scope.js";
import { XMLParser } from "fast-xml-parser";
/**
 *
 * This Element-Placeholder retrieves the either the wholeBayVIS Authority Directory or a specified detail of it from
 * the corresponding CodBi-Plugin servlet.
 *
 * Placeholder Parameter:
 *  - 1st:  The BayVIS-URL where to retrieve the directory from.
 *  - 2nd:  An property of the directory, like e.g. "bezeichnung".
 *
 *  - returns Either an {@link Array <{ behoerdenart : string, behoerdengruppe : string, bezeichnung : string, email : string, id : string, sortierreihenfolge : string}>}
 *            or an {@link Array < string >}, if the 2nd parameter is specified.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class BayVIS_Behoerden {
  /** Stores often used {@link RegExp }s. */
  public static stdExp: {
    directoryMember: RegExp;
  } = {
    directoryMember: /^(behoerdenart|behoerdengruppe|bezeichnung|email|id|sortierreihenfolge)$/,
  };
  /** Buffers the requested directory of authorities. */
  public static buffer: Array<string> | Array<unknown> | undefined;
  /**
   * See {@link BayVIS_Behoerden }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A {@link CodBiError } if either no data could be retrieved from the BayVIS-Endpoint or the . */
  @DBC.ParamvalueProvider
  public static retrieve(
    @AE.PRE(new TYPE("string"))
    @AE.PRE(new REGEX(BayVIS_Behoerden.stdExp.directoryMember), 1)
    params: Array<unknown>,
  ): Promise<Array<string> | Array<unknown>> {
    return new Promise((resolve, reject) => {
      // #region Use buffer if available.
      if (BayVIS_Behoerden.buffer) {
        if (params.length >= 2) {
          resolve(BayVIS_Behoerden.buffer.map((toMap) => (toMap as { [key: string]: unknown })[params[1] as string]));
        } else {
          resolve(BayVIS_Behoerden.buffer as Array<unknown>);
        }
      }
      // #endregion Use buffer if available.
      const $ = getJQuery();
      let result:
        | string
        | Array<string>
        | Array<{
            behoerdenart: string;
            behoerdengruppe: string;
            bezeichnung: string;
            email: string;
            id: string;
            sortierreihenfolge: string;
          }> = new Array<{
        behoerdenart: string;
        behoerdengruppe: string;
        bezeichnung: string;
        email: string;
        id: string;
        sortierreihenfolge: string;
      }>();

      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Behoerdenverzeichnis`,
        type: "GET",
        headers: { Accept: "application/xml" },
      })
        .done((xml: string) => {
          const response = new XMLParser({ attributeNamePrefix: "", ignoreAttributes: false }).parse(xml)[
            "ns2:behoerden"
          ];

          result = response.behoerde;

          if (params.length >= 1) {
            const filteredResult = new Array<string>();

            for (const element of result) {
              // biome-ignore lint/suspicious/noExplicitAny: <explanation>
              filteredResult.push((element as any)[params[0] as string] as string);
            }

            resolve(filteredResult);
          }

          resolve(result as Array<unknown>);
        })
        .fail((X: unknown) => {
          reject(new CodBiError("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdenverzeichnis"));
        });
    });
  }
  // #region Initialization
  /**
   * States whether this {@link BayVIS_Behoerden } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("BayVIS.Behoerden", BayVIS_Behoerden.retrieve);
  })();
  // #region Initialization
}
