import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
/**
 * This **E**lement **P**laceholder turns a CSV-{@link String } into an {@link Array < string >}.
 *
 * Config Parameter:
 *  1. The CSV-{@link String } to convert.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class Data_CSV {
  /**
   * Uses {@link resolvePath } to retrieve the {@link Object } at the path specified in "params"[ 1 ] out of the
   * {@link Object } in "param[ 0 ]".
   *
   * @param params    The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @AE.PRE([new TYPE("string")])
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
  // #region Initialization
  /**
   * States whether this {@link Data_CSV } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("Data.CSV", Data_CSV.retrieve);
  })();
  // #region Initialization
}
