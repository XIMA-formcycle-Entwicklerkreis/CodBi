// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { OR } from "xdbc/src/DBC/OR";
// #endregion XDBC
// #region Fast XML-Parser
import { XMLParser } from "fast-xml-parser";
// #endregion Fast XML-Parser
import { CodBiError } from "../global-scope";
import { BayVIS_Ansprechpartner_ID } from "./bayvis.ansprechpartner.id";
// #endregion Imports
/**
 * This **Element**-**P**laceholder retrieves details of a specific contact from the corresponding CodBi-Plugin servlet.
 *
 * Placeholder Parameter:
 *  - 1st:      The ID of the contact who's details are to be retrieved.
 *              Multiple IDs may be provided by using "/" as a divider (e.g. 12345 / 678901 ).
 *  - 2nd:      A property of the contact, like e.g. "nachname".
 *  - 2nd/3rd:  The BayVIS-URL where to retrieve the contact directory from, if the 2nd parameter contains
 *              not just IDs but also names to look for.
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
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Ansprechpartner_Details {
  /** Stores often used {@link RegExp }s. */
  public static stdExp: {
    directoryMember: RegExp;
  } = {
    directoryMember:
      /^(anrede|vorname|nachname|funktion|stellenbezeichnung|email|website|zimmer|behoerdeId|behoerdeBezeichnung|gebaeudeId|gebaeudeBezeichnung|ansprechpartnerId|telefonLandvorwahl|telefonOrtsvorwahl|telefonAnlage|telefonDurchwahl|apTelefonLandvorwahl|apTelefonOrtsvorwahl|apTelefonAnlage|apTelefonDurchwahl|apEmail)$/,
  };
  /** Stores the response received from the BayVIS-Request. */
  protected static buffer: Map<string, Array<string>> = new Map<string, Array<string>>();
  /**
   * See {@link BayVIS_Ansprechpartner_Details }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws  A {@link CodBiError } if either no data could be retrieved from the BayVIS-Endpoint or, given the
   *          3rd parameter was specified, a non existent contact property was specified. */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(0, false, false, "length")
    @AE.PRE(new TYPE("string"))
    @AE.PRE(
      new OR([
        new REGEX(/^([A-Za-z\s]+|\d{1,6})(?:\/([A-Za-z\s]+|\d{1,6}))*|$/),
        new REGEX(BayVIS_Ansprechpartner_Details.stdExp.directoryMember),
      ]),
      1,
    )
    @AE.PRE(
      new OR([
        new REGEX(/^([A-Za-z\s]+|\d{1,6})(?:\/([A-Za-z\s]+|\d{1,6}))*|$/),
        new REGEX(BayVIS_Ansprechpartner_Details.stdExp.directoryMember),
      ]),
      1,
    )
    //@AE.PRE(new REGEX(BayVIS_Ansprechpartner_Details.stdExp.directoryMember), 2)
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
      const $ = getJQuery();
      let result:
        | string
        | Array<string>
        | {
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
            telefonLandvorwahl: string;
            telefonOrtsvorwahl: string;
            telefonAnlage: string;
            telefonDurchwahl: string;
            apTelefonLandvorwahl: string;
            apTelefonOrtsvorwahl: string;
            apTelefonAnlage: string;
            apTelefonDurchwahl: string;
            apEmail: string;
          }
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
            telefonLandvorwahl: string;
            telefonOrtsvorwahl: string;
            telefonAnlage: string;
            telefonDurchwahl: string;
            apTelefonLandvorwahl: string;
            apTelefonOrtsvorwahl: string;
            apTelefonAnlage: string;
            apTelefonDurchwahl: string;
            apEmail: string;
          }> = new Array<{
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
        telefonLandvorwahl: string;
        telefonOrtsvorwahl: string;
        telefonAnlage: string;
        telefonDurchwahl: string;
        apTelefonLandvorwahl: string;
        apTelefonOrtsvorwahl: string;
        apTelefonAnlage: string;
        apTelefonDurchwahl: string;
        apEmail: string;
      }>();

      let cntResolved = 0;
      const acquire = (toAcquire: string) => {
        if (BayVIS_Ansprechpartner_Details.buffer.has(toAcquire)) {
          resolve(BayVIS_Ansprechpartner_Details.buffer.get(toAcquire));

          return;
        }

        $.ajax({
          url: `${window.codbi.baseURL}plugin?name=CodBi_BayVIS_Auskunft_Ansprechpartnerdetails`,
          type: "GET",
          headers: { Accept: "application/xml", ID: toAcquire.trim() },
        })
          .done((xml: string) => {
            cntResolved++;

            const response = new XMLParser({ attributeNamePrefix: "", ignoreAttributes: false }).parse(xml)[
              "ns2:ansprechpartner"
            ];
            // If contact properties are to be retrieved but a specific detail.
            if (params.length >= 2) {
              const detail = (result as unknown)[params[1] as string];

              if (detail === undefined) {
                reject(new CodBiError(`Detail "${params[1]}" of authorities is not available.`));
              }

              (result as Array<string>).push(detail);
            }
            // If only one contact shall be retrieved...
            if (ids.length === 1) {
              result = Array.isArray(response.ap)
                ? response.ap[0]
                : (response.ap as {
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
                    telefonLandvorwahl: string;
                    telefonOrtsvorwahl: string;
                    telefonAnlage: string;
                    telefonDurchwahl: string;
                    apTelefonLandvorwahl: string;
                    apTelefonOrtsvorwahl: string;
                    apTelefonAnlage: string;
                    apTelefonDurchwahl: string;
                    apEmail: string;
                  });
              // To prevent overwriting when joining e.g. Behoerden-Details and Gebaeude-Details into one object like
              // when using the Data.Join-Elementplaceholder.
              (result as { apTelefonOrtsvorwahl: string }).apTelefonOrtsvorwahl = (
                result as { telefonOrtsvorwahl: string }
              ).telefonOrtsvorwahl;
              (result as { apTelefonAnlage: string }).apTelefonAnlage = (
                result as { telefonAnlage: string }
              ).telefonAnlage;
              (result as { apTelefonDurchwahl: string }).apTelefonDurchwahl = (
                result as { telefonDurchwahl: string }
              ).telefonDurchwahl;
              (result as { apEmail: string }).apEmail = (result as { email: string }).email;

              resolve(
                // biome-ignore lint/suspicious/noAssignInExpressions: More concise.
                (BayVIS_Ansprechpartner_Details.buffer[toAcquire] = [
                  result as {
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
                    telefonLandvorwahl: string;
                    telefonOrtsvorwahl: string;
                    telefonAnlage: string;
                    telefonDurchwahl: string;
                    apTelefonLandvorwahl: string;
                    apTelefonOrtsvorwahl: string;
                    apTelefonAnlage: string;
                    apTelefonDurchwahl: string;
                    apEmail: string;
                  },
                ]),
              );
            } else {
              const resultElement: {
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
                telefonLandvorwahl: string;
                telefonOrtsvorwahl: string;
                telefonAnlage: string;
                telefonDurchwahl: string;
                apTelefonLandvorwahl: string;
                apTelefonOrtsvorwahl: string;
                apTelefonAnlage: string;
                apTelefonDurchwahl: string;
                apEmail: string;
              } = Array.isArray(response.ap) ? response.ap[0] : response.ap;
              // To prevent overwriting when joining e.g. Behoerden-Details and Gebaeude-Details into one object like
              // when using the Data.Join-Elementplaceholder.
              resultElement.apTelefonOrtsvorwahl = resultElement.telefonOrtsvorwahl;
              resultElement.apTelefonOrtsvorwahl = resultElement.telefonOrtsvorwahl;
              resultElement.apTelefonAnlage = resultElement.telefonAnlage;
              resultElement.apTelefonDurchwahl = resultElement.telefonDurchwahl;
              resultElement.apEmail = resultElement.email;

              (
                result as Array<{
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
                  telefonLandvorwahl: string;
                  telefonOrtsvorwahl: string;
                  telefonAnlage: string;
                  telefonDurchwahl: string;
                  apTelefonLandvorwahl: string;
                  apTelefonOrtsvorwahl: string;
                  apTelefonAnlage: string;
                  apTelefonDurchwahl: string;
                  apEmail: string;
                }>
              ).push(resultElement);
              // Resolve when last contact to retrieve was received.
              if (cntResolved === ids.length) {
                // biome-ignore lint/suspicious/noAssignInExpressions: More concise.
                resolve((BayVIS_Ansprechpartner_Details.buffer[toAcquire] = result as []));
              }
            }
          })
          .fail((X: unknown) => {
            reject(new CodBiError("Unable to retrieve data from CodBi_BayVIS_Auskunft_Ansprechpartnerdetails"));
          });
      };

      let ids = (params[0]?.toString() as string).split("/").map((toTrim) => toTrim.trim());

      for (let i = 0; i < ids.length; i++) {
        if (Number.isNaN(Number.parseInt(ids[i] as string))) {
          BayVIS_Ansprechpartner_ID.retrieve([ids[i]])
            .then((id) => {
              if ((id as Array<string>)[0] !== undefined) {
                acquire((id as Array<string>)[0].toString());
              }
            })
            .catch((error) => {
              // #region If the first contact can't be found in the directory.
              if (i === 0) {
                ids = ids.slice(i + 1);
                params[0] = ids.join("/");

                BayVIS_Ansprechpartner_Details.retrieve(params)
                  .then((details) => {
                    resolve(details);
                  })
                  .catch((error) => {});
              }
              // #endregion If the first contact can't be found in the directory.
              // #region If a contact in between the first and the last one can't be found in the directory.
              if (i !== 0 && i !== ids.length - 1) {
                ids = ids.splice(i);

                params[0] = ids.join("/");
                // Recursion needed since for-loop won't continue execution on reject.
                BayVIS_Ansprechpartner_Details.retrieve(params)
                  .then((details) => {
                    resolve(
                      (
                        result as Array<{
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
                          telefonLandvorwahl: string;
                          telefonOrtsvorwahl: string;
                          telefonAnlage: string;
                          telefonDurchwahl: string;
                          apTelefonLandvorwahl: string;
                          apTelefonOrtsvorwahl: string;
                          apTelefonAnlage: string;
                          apTelefonDurchwahl: string;
                          apEmail: string;
                        }>
                      ).concat(
                        details as Array<{
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
                          telefonLandvorwahl: string;
                          telefonOrtsvorwahl: string;
                          telefonAnlage: string;
                          telefonDurchwahl: string;
                          apTelefonLandvorwahl: string;
                          apTelefonOrtsvorwahl: string;
                          apTelefonAnlage: string;
                          apTelefonDurchwahl: string;
                          apEmail: string;
                        }>,
                      ),
                    );
                  })
                  .catch((error) => {});
              }
              // #region If a contact in between the first and the last one can't be found in the directory.
              // #region If the last contact can'T be found in the directory.
              else {
                ids = ids.slice(0, i);
                params[0] = ids.join("/");

                BayVIS_Ansprechpartner_Details.retrieve(params)
                  .then((details) => {
                    resolve(details);
                  })
                  .catch((error) => {});
              }
              // #endregion If the last contact can'T be found in the directory.
            });
        } else {
          acquire(ids[i]);
        }
      }
    });
  }
  // #region Initialization
  /**
   * States whether this {@link BayVIS_Ansprechpartner_Details } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("BayVIS.Ansprechpartner.Details", BayVIS_Ansprechpartner_Details.retrieve);
  })();
  // #region Initialization
}
