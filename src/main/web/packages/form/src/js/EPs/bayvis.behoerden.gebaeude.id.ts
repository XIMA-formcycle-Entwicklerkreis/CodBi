import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { CodBiError } from "../global-scope";
import { BayVIS_Behoerden_Details } from "./bayvis.behoerden.details";
import { GREATER } from "xdbc/src/DBC/GREATER";
/**
 *
 * This **E**lement-**P**laceholder retrieves the IDs of authoritie's buildings by the
 * "bezeichnung" of the authority (case insensitive).
 *
 * Placeholder Parameter:
 *  - 1st: The ID of the authority to retrieve.
 *
 *  - resolves to a {@link Array < string >} with the building IDs that're references to the specified authority..
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class BayVIS_Behoerden_Gebaeude_ID {
  /**
   * See {@link BayVIS_Behaoerden_Gebaeude_ID }.
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
    params: Array<unknown>,
  ): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
      BayVIS_Behoerden_Details.retrieve([params[0]]).then((details) => {
        const result = new Array<string>();
        if (
          Array.isArray(
            (details[0] as { behoerdenGebaeudeZuordnungen: { gebaeude: unknown } }).behoerdenGebaeudeZuordnungen
              .gebaeude,
          )
        ) {
          for (const data of (details[0] as { behoerdenGebaeudeZuordnungen: { gebaeude: Array<{ id: number }> } })
            .behoerdenGebaeudeZuordnungen.gebaeude) {
            result.push(data.id.toString());
          }
        } else {
          result.push(
            (
              details[0] as { behoerdenGebaeudeZuordnungen: { gebaeude: { id: number } } }
            ).behoerdenGebaeudeZuordnungen.gebaeude.id.toString(),
          );
        }
        resolve(result);
      });
    });
  }
  // #region Initialization
  /**
   * States whether this {@link BayVIS_Behaoerden_Gebaeude_ID } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("BayVIS.Behoerden.Gebaeude.ID", BayVIS_Behoerden_Gebaeude_ID.retrieve);
  })();
  // #region Initialization
}
