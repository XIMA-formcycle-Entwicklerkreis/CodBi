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
 * Provides the {@link HTML_Input_Blacklist.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Input_Blacklist {
  /**
   * The Functionality defines a blacklist of values that may not be the value of an {@link HTMLInputElement}.
   * If a jQuery - Datepicker is enabled. A Date in the List - Parameter needs to have each of it's elements specified as
   * 2-digit values (10.03.2025 not 10.3.2025).
   *
   * ### Config Parameter:
   *  - List:           Contains a {@link string } - CSV of forbidden values.
   *  - Prefix:         The {@link string } to show before listing all the values in "List" when displaying an errormessage.
   *  - Postfix:        The {@link string } to show after {@link List} when displaying an errormessage.
   *  - Separator:      The {@link string } to be shown in between each element of the {@link List } when displaying an errormessage.
   *                    Defaults to ", ".
   *  - ShowBlacklist:  Whether to show the {@link List } in the errormessage or not (true/false). Defaults to false.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "prefix :: postfix :: separator")
    @TYPE.PRE("string | boolean", "showblacklist")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(
      HTMLInputElement,
      undefined,
      'Is it not an <input type = "text"/> that is tagged with this functionality?',
    )
    @EQ.PRE("text", false, "type")
    toProcess: Element,
  ): void {
    // #region Normalize Parameter.
    toLoad.separator = toLoad.separator || ", ";
    toLoad.showblacklist = toLoad.showblacklist
      ? typeof toLoad.showblacklist === "string"
        ? toLoad.showblacklist.toLowerCase() === "true"
        : toLoad.showblacklist
      : false;
    // #region Normalize Parameter.
    const $ = getJQuery();
    if ($(toProcess).data("datepicker") === 1) {
      $(toProcess).datepicker();
    }
    // #region Check and react properly
    const check = (toCheck: string, blacklist: Array<string>, target: HTMLInputElement) => {
      if (blacklist.includes(toCheck)) {
        const errorMessage = `${toLoad.prefix ? toLoad.prefix : ""}${toLoad.showblacklist && typeof TYPE.tsCheck<string | boolean>(toLoad.showblacklist, "string | boolean") === "string" ? (toLoad.showblacklist as string).toLowerCase() === "true" : toLoad.showblacklist ? blacklist.join(toLoad.separator ? TYPE.tsCheck<string>(toLoad.separator, "string") : "") : ""}${toLoad.postfix ? toLoad.postfix : ""}`;

        $(target).error(errorMessage.length > 0 ? errorMessage : "The entered value is not allowed.");
      } else {
        $(target).error("");
      }
    };
    // #endregion Check and react properly
    const blacklist: Array<string> = toLoad.list
      ? typeof toLoad.list === "string"
        ? (toLoad.list as string).split(",")
        : (toLoad.list as Array<string>)
      : new Array<string>();
    // #region Bind to appropriate events ( HTMLInputElement & JQuery Datepicker supported )
    // #region Prevent input of blacklisted items via <input> and picker.
    const formerDatepickerChangeEvent: (event: Event) => undefined = $(toProcess).datepicker("option", "onSelect");

    $(toProcess).on("change", (event: Event) => {
      if (formerDatepickerChangeEvent) {
        formerDatepickerChangeEvent(event);
      }

      check((event.target as HTMLInputElement).value, blacklist, toProcess as HTMLInputElement);
    });

    toProcess.addEventListener("input", (event: Event) => {
      check((event.target as HTMLInputElement).value, blacklist, event.target as HTMLInputElement);
    });

    toProcess.addEventListener("blur", (event: Event) => {
      check((event.target as HTMLInputElement).value, blacklist, event.target as HTMLInputElement);
    });
    // #endregion Prevent input of blacklisted items via <input> and picker.
    // #region Fade invalid dates in picker.
    const formerBeforeShowDayEvent: (date: Date) => Array<unknown> = $(toProcess).datepicker("option", "beforeShowDay");

    $(toProcess).datepicker("option", "beforeShowDay", (date: Date) => {
      if (formerBeforeShowDayEvent) {
        const formerResult = formerBeforeShowDayEvent(date);

        if (formerResult && formerResult[0] === false) {
          return false;
        }
      }

      return [
        !blacklist.includes(
          date.toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          }),
        ),
      ];
    });

    // #endregion Fade invalid dates in picker.
    // #endregion Bind to appropriate events ( HTMLInputElement & JQuery Datepicker supported )
  }
}

window.codbi.registerFunctionality(
  "HTML.Input.Blacklist",
  HTML_Input_Blacklist.functionality.bind(HTML_Input_Blacklist),
); // Initialize
