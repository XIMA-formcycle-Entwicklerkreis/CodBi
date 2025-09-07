// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
import { stringToDate } from "../global-scope";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder turns a {@link String } into a {@link Date }.
 *
 * Placeholder Parameter:
 *  - 1st:  The {@link String } to turn to a {@link Date}.
 *  - 2nd:  An optional dateformat {@link string } like YYYY/MM/DD, for example.
 *          If omitted DD.MM.YYYY is assumed.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class DATE_FromString {
  /**
   * Uses {@link CodBi.stringToDate } to turn the {@link String } at "params"[ 0 ] of optional format params[ 1 ] into a {@link Date }.
   *
   * @param params    The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  @AE.POST(new INSTANCE(Date))
  public static retrieve(
    @AE.PRE([new TYPE("string"), new REGEX(REGEX.stdExp.date)], 0)
    @AE.PRE([new TYPE("string"), new REGEX(REGEX.stdExp.dateFormat)], 1)
    params: Array<string>,
  ): Array<Date | null> {
    return [stringToDate(params[0] as string, params.length === 2 ? (params[1] as string) : "DD.MM.YYYY")];
  }
  /**
   * States whether this {@link DATE_FromString } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("Date.FromString", DATE_FromString.retrieve);
  })();
  // #region Initialization
}
