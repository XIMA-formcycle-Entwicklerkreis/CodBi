// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { EQ } from "xdbc/src/DBC/EQ";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Select_Injection.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Date_NoWeekends {
  /**
   * Registers the "Date.NoWeekends"-Functionality.
   *
   * This functionality applies {@link JQuery.datepicker.noWeekends } onto the {@link HTMLInputElement }'s calendar
   * and intercepts the date entered in order to be able to show an error message whenever a weekend is entered
   * manually.
   *
   * Config Parameter:
   *  - MsgNoWeekends:  The optional {@link string } to be shown when a weekend is entered.*/
  @DBC.ParamvalueProvider
  public static functionality(
    toLoad: { [key: string]: unknown },
    @EQ.PRE("INPUT", false, "tagName")
    toProcess: Element,
  ): void {
    const $ = getJQuery();
    // If JQuery's datepicker hasn't been initialized yet
    if ($(toProcess).data("datepicker") === 1) {
      $(toProcess).datepicker();
    }

    $(toProcess).datepicker("option", "beforeShowDay", $.datepicker.noWeekends);

    // #region Intercept input.
    $(toProcess).on("change", (event: Event): undefined => {
      const weekday = new Date(
        (toProcess as HTMLInputElement).value
          .split(toLoad.delimiter && typeof toLoad.delimiter === "string" ? toLoad.delimiter : ".")
          .reduce((accumulator, current, index): string => {
            return current + (index === 0 ? "" : "/") + accumulator;
          }),
      ).getDay();

      if (weekday === 0 || weekday === 6) {
        $(toProcess).error(
          toLoad.msgnoweekends && typeof toLoad.msgnoweekends === "string"
            ? toLoad.msgnoweekends
            : "Specifying weekends is not allowed.",
        );
      } else {
        $(toProcess).error("");
      }
    });
    // #endregion Intercept input.
  }
  // #region Initialization
  /**
   * States whether this {@link Date_NoWeekends } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("Date.NoWeekends", Date_NoWeekends.functionality);
  })();
  // #endregion Initialization
}
