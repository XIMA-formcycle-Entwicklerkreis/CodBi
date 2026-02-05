// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link DATE_Today.retrieve }al of the current {@link Date } along with arithmetic appliances.
 *
 * Placeholder Parameter:
 *  Either "NOW" to retrieve the current {@link Date } or a/multiple arithmetic operations like +1d ; -1m ; + 1y.
 *  The parameters are case insensitive.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive design.
export class DATE_Today {
  /**
   * Uses {@link processArithmeticParams } to modify the {@link Date } of today according to the arithmetic operations
   * specified in "params". If the first element in "params" specifies "NOW" (case insensitive) the {@link Date } of
   * today will be returned.
   *
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @return  The result of invoking {@link processArithmeticParams } handing over today's {@link Date } along with the
   *          specified "params" or the {@link Date } of today, if the first element in "params* is the keyword
   *          "NOW" (case insensitive). */
  @DBC.ParamvalueProvider
  @INSTANCE.POST(Date)
  public static retrieve(
    @AE.PRE([new TYPE("string"), new REGEX(/^(?i:(NOW)|([+-]\d+[dmy]))$/i)]) params: Array<string>,
  ): Date {
    const result: Date = new Date();

    if (params[0]?.toLocaleUpperCase() === "NOW" || params.length === 0) {
      return new Date();
    }

    return processArithmeticParams(result, params);
  }
}

window.codbi.registerEP("Date.Today", DATE_Today.retrieve.bind(DATE_Today)); // Initialization
// #region Tools
/**
 * Performs arithmetic operations on the {@link Date } "toProcess". Days, months and years may be either added
 * or subtracted by adding each arithmetic option
 * as a separate parameter (e.g. Date.Today ~ -1d ; +2m ; -10y ).
 *
 * @param toProcess The {@link Date } perform the arithmetic operations specified in "params" on.
 * @param params    An {@link Array < string >} of all operation that shall be performed onto the {@link Date }
 *                  "toProcess". Days, months and years may be either added or subtracted by adding each
 *                  arithmetic option as a separate parameter (e.g. Date.Today > -1d ; +2m ; -10y ).
 *
 * @returns The {@link Date } "toProcess" modified according to the arithmetic specified in "params". */
export function processArithmeticParams(toProcess: Date, params: Array<string>): Date {
  // #region Arithmetic Operations.
  for (const param of params) {
    param.replace("+", "");

    if (param.toLocaleLowerCase().indexOf("d") !== -1) {
      toProcess.setDate(toProcess.getDate() + Number.parseInt(param.replace("d", "")));
    }

    if (param.toLocaleLowerCase().indexOf("m") !== -1) {
      toProcess.setMonth(toProcess.getMonth() + Number.parseInt(param.replace("m", "")));
    }

    if (param.toLocaleLowerCase().indexOf("y") !== -1) {
      toProcess.setFullYear(toProcess.getFullYear() + Number.parseInt(param.replace("y", "")));
    }
  }
  // #endregion Arithmetic Operations.
  return toProcess;
}
// #endregion Tools
