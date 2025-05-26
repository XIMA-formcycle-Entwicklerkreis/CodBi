import { getJQuery } from "@de-xima/fc-form-renderer";
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { GREATER } from "xdbc/src/DBC/GREATER";
import { CodBiError } from "../global-scope.js";
import { XMLParser } from "fast-xml-parser";
/**
 * This Element-Placeholder retrieves the details of an authority's building specified by the provided ID from the
 * corresponding CodBi-Plugin servlet.
 *
 * Placeholder Parameter:
 *  - 1st:  The ID of the authority to retrieve.
 *  - 2nd:  The building's ID.
 *  - 3rd:  A property of the directory, like e.g. "bezeichnung".
 *
 *  - returns Either an
 *            {@link Array <{
 *              logo                  : {
 *                value     : string,
 *                alt       : string,
 *                mimetype  : string,
 *                quelle    : string,
 *                title     : string },
 *              bezeichnung           : string, hausanschriftPLZ      : string,
 *              hausanschriftOrt      : string, hausanschriftStrasse  : string,
 *              postanschriftPLZ      : string, postanschriftOrt      : string,
 *              postanschriftStrasse  : string }>}
 *            or an {@link Array < string >}, if the 3rd parameter is specified.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class BayVIS_Behoerden_Details_Gebaeude {
  /** Stores often used {@link RegExp }s. */
  public static stdExp: {
    authorityID: RegExp;
    directoryMember: RegExp;
  } = {
    authorityID: /^\d{1,6}$/,
    directoryMember:
      /^(behoerdenart|behoerdengruppe|bezeichnung|email|id|sortierreihenfolge|logo|behoerdeZuordnungen|behoerdenGebaeudeZuordnungen)$/,
  };
  /** Stores the response received from the BayVIS-Request. */
  protected static buffer: Map<string, Array<string>> = new Map<string, Array<string>>();
  /**
   * See {@link BayVIS_Behoerden }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A {@link CodBiError } if either no data could be retrieved from the BayVIS-Endpoint or the . */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(2, true, false, "length")
    @AE.PRE(new REGEX(BayVIS_Behoerden_Details_Gebaeude.stdExp.authorityID), 0, 1)
    @AE.PRE(new REGEX(BayVIS_Behoerden_Details_Gebaeude.stdExp.directoryMember), 2)
    params: Array<unknown>,
  ): Promise<Array<string> | Array<unknown>> {
    return new Promise((resolve, reject) => {
      if (BayVIS_Behoerden_Details_Gebaeude.buffer.has(params[1] as string)) {
        resolve([BayVIS_Behoerden_Details_Gebaeude.buffer[params[1] as string]]);

        return;
      }

      const $ = getJQuery();
      let result:
        | string
        | Array<string>
        | Array<{
            logo: { value: string; alt: string; mimetype: string; quelle: string; title: string };
            bezeichnung: string;
            hausanschriftPLZ: string;
            hausanschriftOrt: string;
            hausanschriftStrasse: string;
            postanschriftPLZ: string;
            postanschriftOrt: string;
            postanschriftStrasse: string;
          }> = new Array<{
        logo: { value: string; alt: string; mimetype: string; quelle: string; title: string };
        bezeichnung: string;
        hausanschriftPLZ: string;
        hausanschriftOrt: string;
        hausanschriftStrasse: string;
        postanschriftPLZ: string;
        postanschriftOrt: string;
        postanschriftStrasse: string;
        telefonLandvorwahl: string;
        telefonOrtsvorwahl: string;
        telefonAnlage: string;
        telefonDurchwahl: string;
      }>();

      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Gebaeudedetails`,
        type: "GET",
        headers: { Accept: "application/xml", ID: params[0] as string, GebaeudeID: params[1] as string },
      })
        .done((xml: string) => {
          const response = new XMLParser({ attributeNamePrefix: "", ignoreAttributes: false }).parse(xml)[
            "ns2:GetBehoerdenGebaeudeResponse"
          ];

          result = response.BehoerdenGebaeude;

          if (params.length >= 3) {
            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
            const detail = (result as any)[params[2] as string];
            if (detail === undefined) {
              reject(new CodBiError(`Detail "${params[2]}" of authorities is not available.`));
            }

            resolve([detail]);
          }

          resolve([result]);
        })
        .fail((X: unknown) => {
          reject(new CodBiError("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdendetails"));
        });
    });
  }
  // #region Initialization
  /**
   * States whether this {@link BayVIS_Behoerden_Details_Gebaeude } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("BayVIS.Behoerden.Details.Gebaeude", BayVIS_Behoerden_Details_Gebaeude.retrieve);
  })();
  // #region Initialization
}
