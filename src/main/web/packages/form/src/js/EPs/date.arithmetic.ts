// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
// #endregion XDBC
import { stringToDate } from "../global-scope";
import { processArithmeticParams } from "./date.today";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion Imports
/**
 * This Element-Placeholder turns a {@link String } into a {@link Date }.
 *
 * Placeholder Parameter:
 *  - 1st:  The {@link String } to turn to a {@link Date}.
 *  - 2nd:  The optional format of the "dateString" (e.g. DD/MM/YYYY).
 *  - 3rd:  The operations to perform on the {@link Date } specified.
 *          Days, months and years may be either added or subtracted by adding each
 *          arithmetic option as a separate parameter (e.g. Date.Arithmetic > 01.01.1978 ; -1d ; +2m ; -10y ).
 *
 * @param params The parameters for that Element-Placeholder (provided by CodBi).
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Future inheritance probable.
export class DATE_Arithmetic {
  /**
   * See {@link DATE_Arithmetic }.
   *
   * @param params    The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  @INSTANCE.POST(Date)
  public static retrieve(
    @GREATER.PRE(1, true, false, "length", "Was the date string to convert and the operation to perform not specified?")
    @AE.PRE([new TYPE("string"), new REGEX(REGEX.stdExp.date)], 0)
    params: Array<string>,
  ): Date {
    const date: Date | null =
      params[1].indexOf("+") !== -1 || params[1].indexOf("-") !== -1
        ? stringToDate(params[0] as unknown as string)
        : stringToDate(params[0] as unknown as string, params[1]);

    if (date === null || date.toString() === "Invalid Date") {
      window.codbi.reportError(`"stringToDate" returned NULL. Invoked with: ${params}.`);
    }

    return processArithmeticParams(
      date as Date,
      params.slice(params[1].indexOf("+") !== -1 || params[1].indexOf("-") !== -1 ? 1 : 2),
    );
  }
}

window.codbi.registerEP("Date.Arithmetic", DATE_Arithmetic.retrieve.bind(DATE_Arithmetic)); // Initialization
