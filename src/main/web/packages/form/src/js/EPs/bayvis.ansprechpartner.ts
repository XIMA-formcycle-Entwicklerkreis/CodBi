import { getJQuery } from "@de-xima/fc-form-renderer";
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { JSON_OP } from "xdbc/src/DBC/JSON.OP";
import { JSON_Parse } from "xdbc/src/DBC/JSON.Parse";
import { CodBiError } from "../global-scope";
import { XMLParser } from "fast-xml-parser";
/**
 *
 * This Element-Placeholder retrieves either the whole BayVIS Authority Directory or a specified detail of it from
 * the corresponding CodBi-Plugin servlet.
 *
 * Placeholder Parameter:
 *  - 1st:  The BayVIS-URL where to retrieve the directory from.
 *  - 2nd:  A property of the directory, like e.g. "bezeichnung".
 *
 *  - returns Either an
 *            {@link Array <{ anrede: string; vorname: string; nachname: string; funktion: string;
 *                            stellenbezeichnung: string; email: string; website: string; zimmer: string;
 *                            sortierreihenfolge: number; behoerdeId: number; behoerdeBezeichnung: string;
 *                            gebaeudeId: number; gebaeudeBezeichnung: string; ansprechpartnerId: number;}>}
 *            or an {@link Array < string >}, if the 2nd parameter is specified.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class BayVIS_Ansprechpartner {
  /** Buffers the requested directory of authorities. */
  public static buffer:
    | Array<{
        anrede: string;
        vorname: string;
        nachname: string;
        funktion: string;
        stellenbezeichnung: string;
        email: string;
        website: string;
        zimmer: string;
        sortierreihenfolge: number;
        behoerdeId: number;
        behoerdeBezeichnung: string;
        gebaeudeId: number;
        gebaeudeBezeichnung: string;
        ansprechpartnerId: number;
      }>
    | undefined;
  /** Stores often used {@link RegExp }s. */
  public static stdExp: {
    directoryMember: RegExp;
  } = {
    directoryMember: /^(behoerdenart|behoerdengruppe|bezeichnung|email|id|sortierreihenfolge)$/,
  };
  /**
   * See {@link BayVIS_Ansprechpartner }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A {@link CodBiError } if no data could be retrieved from the BayVIS-Endpoint. */
  @DBC.ParamvalueProvider
  public static retrieve(
    @AE.PRE(new TYPE("string"))
    @AE.PRE(new REGEX(REGEX.stdExp.url), 0)
    @AE.PRE(new REGEX(BayVIS_Ansprechpartner.stdExp.directoryMember), 1)
    params: Array<unknown>,
  ): Promise<Array<string> | Array<unknown>> {
    return new Promise((resolve, reject) => {
      // #region Use buffer if available.
      if (BayVIS_Ansprechpartner.buffer) {
        if (params.length >= 2) {
          resolve(
            BayVIS_Ansprechpartner.buffer.map((toMap) => (toMap as { [key: string]: unknown })[params[1] as string]),
          );
        } else {
          resolve(BayVIS_Ansprechpartner.buffer as Array<unknown>);
        }
      }
      // #endregion Use buffer if available.
      const $ = getJQuery();
      let result:
        | string
        | Array<string>
        | Array<{
            anrede: string;
            vorname: string;
            nachname: string;
            funktion: string;
            stellenbezeichnung: string;
            email: string;
            website: string;
            zimmer: string;
            sortierreihenfolge: number;
            behoerdeId: number;
            behoerdeBezeichnung: string;
            gebaeudeId: number;
            gebaeudeBezeichnung: string;
            ansprechpartnerId: number;
          }> = new Array<{
        anrede: string;
        vorname: string;
        nachname: string;
        funktion: string;
        stellenbezeichnung: string;
        email: string;
        website: string;
        zimmer: string;
        sortierreihenfolge: number;
        behoerdeId: number;
        behoerdeBezeichnung: string;
        gebaeudeId: number;
        gebaeudeBezeichnung: string;
        ansprechpartnerId: number;
      }>();

      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis`,
        type: "GET",
        headers: { Accept: "application/xml" },
      })
        .done((xml: string) => {
          const response = new XMLParser({ attributeNamePrefix: "", ignoreAttributes: false }).parse(xml)[
            "ns2:ansprechpartner"
          ];
          // If no response from endpoint (missing credentials)...
          if (response === undefined) {
            return;
          }

          result = BayVIS_Ansprechpartner.buffer = response.ap;

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
          reject(
            new CodBiError("Unable to retrieve data from Servlet CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis."),
          );
        });
    });
  }
  // #region Initialization
  /**
   * States whether this {@link BayVIS_Ansprechpartner } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("BayVIS.Ansprechpartner", BayVIS_Ansprechpartner.retrieve);
  })();
  // #region Initialization
}
