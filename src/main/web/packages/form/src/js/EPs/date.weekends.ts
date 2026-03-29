// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
// #endregion XDBC
// #endregion Imports
// #region Inject necessary CSS.
const style = document.createElement("style");

style.textContent = `
  .xm-error-text.label-top.label-none.xm-text ul {
    word-break: break-word ;
  }`;

document.head.appendChild(style);
// #endregion Inject necessary CSS.
/**
 * This **E**lement-**P**laceholder Registers the "Date.Weekend"-EP along with a necessary CSS-Injection in the {@link Document.head }.
 *
 * The EP retrieves a {@link Array < string >} of all dates that're Weekends (Saturday & Sunday) between
 * two optional {@link Date }s that may be specified.
 * If just one parameter is specified it will be treated as the Ending-{@link Date }.
 * No Parameter will generate a range of dates between today and today in a year.
 *
 * Config Parameter:
 *  1.  Beginning of the range of dates to return unless it is the only parameter. In that case it specifies the end
 *      of the range, while the beginning is today.
 *  2.  The end of the range.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive design.
export class Date_Weekends {
  /**
   * Checks all "params" for specific data (see {@link Date_Weekends }) and return an {@link Array } of
   * Date-{@link strings}.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(1, true, false, "length", "Hasn't at least the beginning of the range been specified?")
    @AE.PRE([new TYPE("string"), new REGEX(REGEX.stdExp.date)])
    params: Array<string>,
  ): Array<string> {
    const result: Array<string> = new Array<string>();
    const refinedParams: Array<string | Array<string>> = params;

    let begin: Date | undefined;
    let end: Date | undefined;
    // #region Refine parameter for begin and end, if available.
    if (refinedParams.length >= 2) {
      refinedParams[0] = (refinedParams[0] as string).trim().split(".");
      refinedParams[1] = (refinedParams[1] as string).trim().split(".");
      // #region Generate Begin- & End-Date-Objects.
      begin = new Date(
        Number.parseInt((refinedParams[0] as Array<string>)[2]),
        Number.parseInt((refinedParams[0] as Array<string>)[1]) - 1,
        Number.parseInt((refinedParams[0] as Array<string>)[0]),
      );

      end = new Date(
        Number.parseInt((refinedParams[1] as Array<string>)[2]),
        Number.parseInt((refinedParams[1] as Array<string>)[1]) - 1,
        Number.parseInt((refinedParams[1] as Array<string>)[0]),
      );
    } else if (refinedParams.length === 1) {
      end = new Date(
        Number.parseInt((refinedParams[0] as Array<string>)[2]),
        Number.parseInt((refinedParams[0] as Array<string>)[1]) - 1,
        Number.parseInt((refinedParams[0] as Array<string>)[0]),
      );
    }
    // #endregion Refine parameter for begin and end, if available.
    // #region Set standard begin and end, if necessary.
    if (begin === undefined) {
      begin = new Date();
    }

    if (end === undefined) {
      end = new Date();

      end.setFullYear(begin.getFullYear() + 1);
    }
    // #endregion Set standard begin and end, if necessary.
    // #region Generate Begin- & End-Date-Objects.
    while (begin <= end) {
      if (begin.getDay() === 0 || begin.getDay() === 6) {
        result.push(begin.toLocaleDateString("de-DE", { year: "numeric", month: "2-digit", day: "2-digit" }));
      }

      begin.setDate(begin.getDate() + 1);
    }
    // #endregion Generate Begin- & End-Date-Objects.

    return result;
  }
}

window.codbi.registerEP("Date.Weekends", Date_Weekends.retrieve.bind(Date_Weekends)); // Initialization
