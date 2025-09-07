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
// #endregion XDBC
import { CodBiError } from "../global-scope";
// #endregion Imports
/**

 * This **E**lement-**P**laceholder retrieves the ID of a contact by first- & last-name (order insensitive). If there're more than one contact
 * with the same first- & last-name only the first hit will be returned.
 *
 * Placeholder Parameter:
 *  - 1st: The first- and last-name separated by a space (order- & case-insensitive).
 *
 *  - resolves  To either an
 *              {@link Array <{ anrede: string; vorname: string; nachname: string; funktion: string;
 *                              stellenbezeichnung: string; email: string; website: string; zimmer: string;
 *                              behoerdeId: number; behoerdeBezeichnung: string;
 *                              gebaeudeId: number; gebaeudeBezeichnung: string; ansprechpartnerId: number;
 *                              apTelefonLandvorwahl: string; apTelefonOrtsvorwahl: string; apTelefonAnlage: string;
 *                              apTelefonDurchwahl: string; apEmail: string;}>}
 *              or an {@link Array < string >}, if the 3rd parameter is specified.
 *
 * @throws A {@link CodBiError } if no contact with the specified full name wasn't found or if the specified endpoint couldn't be reached.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Ansprechpartner_ID {
  /** Buffers the requested directory of authorities. */
  public static buffer:
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
        behoerdeId: number;
        behoerdeBezeichnung: string;
        gebaeudeId: number;
        gebaeudeBezeichnung: string;
        ansprechpartnerId: number;
        apTelefonLandvorwahl: string;
        apTelefonOrtsvorwahl: string;
        apTelefonAnlage: string;
        apTelefonDurchwahl: string;
        apEmail: string;
      }>;
  /**
   * See {@link BayVIS_Ansprechpartner_ID }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws  A {@link CodBiError } if either no data could be retrieved from the BayVIS-Endpoint. */
  @DBC.ParamvalueProvider
  public static retrieve(
    @AE.PRE(new TYPE("string"))
    @AE.PRE(new REGEX(/^[A-Za-z]+ +[A-Za-z]+$/), 0)
    params: Array<unknown>,
  ): Promise<
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
        behoerdeId: number;
        behoerdeBezeichnung: string;
        gebaeudeId: number;
        gebaeudeBezeichnung: string;
        ansprechpartnerId: number;
        apTelefonLandvorwahl: string;
        apTelefonOrtsvorwahl: string;
        apTelefonAnlage: string;
        apTelefonDurchwahl: string;
        apEmail: string;
      }>
  > {
    return new Promise((resolve, reject) => {
      // #region Use buffer if available.
      if (BayVIS_Ansprechpartner_ID.buffer) {
        if (params.length >= 2) {
          resolve(
            BayVIS_Ansprechpartner_ID.buffer.map((toMap) => (toMap as { [key: string]: string })[params[1] as string]),
          );
        } else {
          resolve(BayVIS_Ansprechpartner_ID.buffer as Array<string>);
        }
      }
      // #endregion Use buffer if available.
      const $ = getJQuery();

      $.ajax({
        url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis`,
        type: "GET",
        headers: { Accept: "application/xml" },
      })
        .done((xmlResponse: string) => {
          let response = new XMLParser({ attributeNamePrefix: "", ignoreAttributes: false }).parse(xmlResponse)[
            "ns2:ansprechpartner"
          ];
          // #region React if data is not of format XML but JSON.
          if (response === undefined) {
            response = JSON.parse(xmlResponse);
          }
          // #endregion React if data is not of format XML but JSON.
          // If no response from endpoint (missing credentials)...
          if (response === undefined) {
            reject(
              new CodBiError("Unable to retrieve data from servlet CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis"),
            );
          }

          const jsonResponse = response.ap;
          const fullName = (params[0] as string).split(" ");

          for (const candidate of jsonResponse) {
            if (
              (candidate.vorname.toLocaleLowerCase() === fullName[0]?.trim().toLocaleLowerCase() &&
                candidate.nachname.toLocaleLowerCase() === fullName[1]?.trim().toLocaleLowerCase()) ||
              (candidate.vorname.toLocaleLowerCase() === fullName[1]?.trim().toLocaleLowerCase() &&
                candidate.nachname.toLocaleLowerCase() === fullName[0]?.trim().toLocaleLowerCase())
            ) {
              resolve([candidate.ansprechpartnerId]);
            }
          }

          reject(new CodBiError(`No Contact with name "${fullName}" found`));
        })
        .fail((X: unknown) => {
          reject(
            new CodBiError("Unable to retrieve data from servlet CodBi_BayVIS_Auskunft_Ansprechpartnerverzeichnis"),
          );
        });
    });
  }
  // #region Initialization
  /**
   * States whether this {@link BayVIS_Ansprechpartner_ID } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("BayVIS.Ansprechpartner.ID", BayVIS_Ansprechpartner_ID.retrieve);
  })();
  // #region Initialization
}
