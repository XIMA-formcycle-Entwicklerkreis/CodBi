// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { EQ } from "xdbc/src/DBC/EQ";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { TYPE } from "xdbc/src/DBC/TYPE";
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
   * Forces the tagged {@link HTMLInputElement } to not accept weekends as valid {@link Date }s.
   *
   * This functionality applies {@link JQuery.datepicker.noWeekends } onto the {@link HTMLInputElement }'s calendar
   * and intercepts the date entered in order to be able to show an error message whenever a weekend is entered
   * manually.
   *
   * ### Config Parameter:
   *  - MsgNoWeekends:  The optional {@link string } to be shown when a weekend is entered.
   *  - Delimiter:  The {@link string} separating the day, month & year. Defaults to: ".". */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "msgnoweekends :: delimiter")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(
      HTMLInputElement,
      undefined,
      'Is it not an <input type = "text"/> that is tagged with this functionality?',
    )
    @EQ.PRE("text", false, "type")
    toProcess: Element,
  ): void {
    const $ = getJQuery();
    // If JQuery's datepicker hasn't been initialized yet
    if ($(toProcess).data("datepicker") === 1) {
      $(toProcess).datepicker();
    }

    $(toProcess).datepicker("option", "beforeShowDay", $.datepicker.noWeekends);
    // #region Intercept input.
    $(toProcess).on("change", (event: JQuery.Event): undefined => {
      const weekday = new Date(
        (toProcess as HTMLInputElement).value
          .split((toLoad.delimiter as string) || ".")
          .reduce((accumulator, current, index): string => {
            return current + (index === 0 ? "" : "/") + accumulator;
          }),
      ).getDay();

      if (weekday === 0 || weekday === 6) {
        $(toProcess).error((toLoad.msgnoweekends as string) || "Specifying weekends is not allowed.");
      } else {
        $(toProcess).error("");
      }
    });
    // #endregion Intercept input.
  }
}

window.codbi.registerFunctionality("Date.NoWeekends", Date_NoWeekends.functionality.bind(Date_NoWeekends)); // Initialization
