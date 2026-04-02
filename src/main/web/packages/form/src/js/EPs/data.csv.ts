// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
// #endregion Imports
/**
 * This **E**lement **P**laceholder turns a CSV-{@link String } into an {@link Array < string >}.
 *
 * Config Parameter:
 *  1. The CSV-{@link String } to convert.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class Data_CSV {
  /**
   * See {@link Data_CSV }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(0, true, false, "length", "Has the CSV-String to convert been specified?")
    @AE.PRE(new TYPE("string | object"), 0)
    params: Array<string>,
  ): Array<string> {
    const result: Array<string> = new Array<string>();
    // #region Turn every element that is a string to an array of strings separated by ",".
    for (const element of params) {
      if (typeof element === "string") {
        for (const newElement of element.split(",")) {
          result.push(newElement);
        }
      } else {
        result.push(element);
      }
    }
    // #region Turn every element that is a string to an array of strings separated by ",".
    return result;
  }
}

window.codbi.registerEP("Data.CSV", Data_CSV.retrieve.bind(Data_CSV)); // Initialization
