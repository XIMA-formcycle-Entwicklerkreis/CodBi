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
// #endregion Imports
/**
 * This **E**lement-**P**laceholder retrieves the details of an authority specified by the provided ID from the corresponding
 * CodBi-Plugin servlet.
 *
 * Placeholder Parameter:
 *  - 1st:  The ID of the authority to retrieve.
 *  - 2nd:  A property of the directory, like e.g. "bezeichnung".
 *
 *  - returns Either an {@link Array <{ bezeichnungBehoerde: string; behoerdeZuordnungen : object, behoerdenGebaeudeZuordnungen : object, behoerdenart : string, behoerdengruppe : string, bezeichnung : string, email : string, id : string, sortierreihenfolge : string}>}
 *            or an {@link Array < string >}, if the 3rd parameter is specified.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Behoerden_Details {
  /** Stores often used {@link RegExp }s. */
  public static stdExp: {
    authorityID: RegExp;
    directoryMember: RegExp;
  } = {
    authorityID: /^\d{1,6}$/,
    directoryMember:
      /^(bezeichnungBehoerde|behoerdenart|behoerdengruppe|bezeichnung|email|id|sortierreihenfolge|logo|behoerdeZuordnungen|behoerdenGebaeudeZuordnungen)$/,
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
    @GREATER.PRE(1, true, false, "length")
    @AE.PRE(new TYPE("string"))
    @AE.PRE(new REGEX(BayVIS_Behoerden_Details.stdExp.authorityID), 0)
    @AE.PRE(new REGEX(BayVIS_Behoerden_Details.stdExp.directoryMember), 1)
    params: Array<unknown>,
  ): Promise<Array<string> | Array<unknown>> {
    return new Promise((resolve, reject) => {
      if (BayVIS_Behoerden_Details.buffer.has(params[0] as string)) {
        resolve([BayVIS_Behoerden_Details.buffer[params[0] as string]]);

        return;
      }

      const $ = getJQuery();
      let result:
        | string
        | Array<string>
        | {
            logo: { value: string; alt: string; mimetype: string; quelle: string; title: string };
            behoerdeZuordnungen: {
              behoerde: [{ id: number }];
            };
            behoerdenGebaeudeZuordnungen: { gebaeude: [id: number] };
            behoerdenart: string;
            behoerdengruppe: string;
            bezeichnung: string;
            email: string;
            id: string;
            sortierreihenfolge: string;
            bezeichnungBehoerde: string;
          }
        | Array<{
            logo: { value: string; alt: string; mimetype: string; quelle: string; title: string };
            behoerdeZuordnungen: {
              behoerde: [{ id: number }];
            };
            behoerdenGebaeudeZuordnungen: { gebaeude: [id: number] };
            behoerdenart: string;
            behoerdengruppe: string;
            bezeichnung: string;
            email: string;
            id: string;
            sortierreihenfolge: string;
            bezeichnungBehoerde: string;
          }> = new Array<{
        logo: { value: string; alt: string; mimetype: string; quelle: string; title: string };
        behoerdeZuordnungen: {
          behoerde: [{ id: number }];
        };
        behoerdenGebaeudeZuordnungen: { gebaeude: [id: number] };
        behoerdenart: string;
        behoerdengruppe: string;
        bezeichnung: string;
        email: string;
        id: string;
        sortierreihenfolge: string;
        bezeichnungBehoerde: string;
      }>();

      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Behoerdendetails`,
        type: "GET",
        headers: { Accept: "application/xml", ID: (params[0] as string).trim() },
      })
        .done((xml: string) => {
          const response = new XMLParser({ attributeNamePrefix: "", ignoreAttributes: false }).parse(xml)[
            "ns2:GetBehoerdeResponse"
          ];

          result = response.behoerde as {
            logo: { value: string; alt: string; mimetype: string; quelle: string; title: string };
            behoerdeZuordnungen: {
              behoerde: [{ id: number }];
            };

            behoerdenGebaeudeZuordnungen: { gebaeude: [id: number] };
            behoerdenart: string;
            behoerdengruppe: string;
            bezeichnung: string;
            email: string;
            id: string;
            sortierreihenfolge: string;
            bezeichnungBehoerde: string;
          };

          if (params.length >= 2) {
            const detail = (result as unknown)[params[1] as string];

            if (detail === undefined) {
              reject(new CodBiError(`Detail "${params[1]}" of authorities is not available.`));
            }

            resolve([detail]);
          }
          // To prevent overwriting when joining e.g. Behoerden-Details and Gebaeude-Details into one object like
          // when using the Data.Join-Elementplaceholder.
          result.bezeichnungBehoerde = result.bezeichnung;

          resolve([result]);
        })
        .fail((X: unknown) => {
          reject(new CodBiError("Unable to retrieve data from CodBi_BayVIS_Auskunft_Behoerdendetails"));
        });
    });
  }
  // #region Initialization
  /**
   * States whether this {@link BayVIS_Behoerden_Details } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("BayVIS.Behoerden.Details", BayVIS_Behoerden_Details.retrieve);
  })();
  // #region Initialization
}
