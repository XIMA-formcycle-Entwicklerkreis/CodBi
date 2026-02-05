// #region Imports
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
 *
 * This **E**lement-**P**laceholder retrieves the IDs of authoritie's buildings by the
 * "bezeichnung" of the authority (case insensitive).
 *
 * Placeholder Parameter:
 *  - 1st: The ID of the authority to retrieve.
 *
 *  - resolves to an {@link Array < string >} with the building IDs that're references to the specified authority..
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class BayVIS_Behoerden_Gebaeude_ID {
  /**
   * See {@link BayVIS_Behoerden_Gebaeude_ID }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A {@link CodBiError } if no data could be retrieved from the BayVIS-endpoint. */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(1, true, false, "length", "Has the ID of the authority been specified?")
    @AE.PRE(new TYPE("string | object"))
    @AE.PRE(new REGEX(BayVIS_Behoerden_Details.stdExp.authorityID), 0, 1)
    @AE.PRE(new REGEX(BayVIS_Behoerden_Details.stdExp.directoryMember), 2)
    params: Array<unknown>,
  ): Promise<Array<string>> {
    return new Promise((resolve, reject) => {
      BayVIS_Behoerden_Details.retrieve([params[0]]).then((details) => {
        const result = new Array<string>();
        if (
          Array.isArray(
            (details as { behoerdenGebaeudeZuordnungen: { gebaeude: unknown } }).behoerdenGebaeudeZuordnungen.gebaeude,
          )
        ) {
          for (const data of (details as { behoerdenGebaeudeZuordnungen: { gebaeude: Array<{ id: number }> } })
            .behoerdenGebaeudeZuordnungen.gebaeude) {
            result.push(data.id.toString());
          }
        } else {
          result.push(
            (
              details as { behoerdenGebaeudeZuordnungen: { gebaeude: { id: number } } }
            ).behoerdenGebaeudeZuordnungen.gebaeude.id.toString(),
          );
        }

        resolve(result);
      });
    });
  }
}

window.codbi.registerEP(
  "BayVIS.Behoerden.Gebaeude.ID",
  BayVIS_Behoerden_Gebaeude_ID.retrieve.bind(BayVIS_Behoerden_Gebaeude_ID),
); // Initialization
