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
 * Provides the {@link HTML_Input_Blacklist.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Input_Blacklist {
  /**
   * The Functionality defines a blacklist of values that may not be the value of
   * an {@link HTMLInputElement}.
   * If a jQuery - Datepicker is supported. A Date in the List - Parameter needs
   * to have each of it's elements specified as
   * 2-digit values (10.03.2025 not 10.3.2025).
   *
   * Config Parameter:
   *  - List:     Contains a {@link string } - CSV of forbidden values.
   *  - Prefix:   The {@link string } to show before listing all the values in "List" when displaying an errormessage.
   *  - Postfix:  The {@link string } to show after {@link List} when displaying an errormessage.
   *  - Separator:The {@link string } to be shown in between each element of the {@link List } when displaying an errormessage.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    toLoad: { [key: string]: unknown },
    @EQ.PRE("INPUT", false, "tagName") toProcess: Element,
  ): void {
    const $ = getJQuery();
    if ($(toProcess).data("datepicker") === 1) {
      $(toProcess).datepicker();
    }
    // #region Check and react properly
    const check = (toCheck: string, blacklist: Array<string>, target: HTMLInputElement) => {
      if (blacklist.includes(target.value)) {
        $(target).error(
          `${toLoad.prefix ? toLoad.prefix : ""}${toLoad.showblacklist && (toLoad.showblacklist as string).toLowerCase() === "true" ? blacklist.join(toLoad.separator ? (toLoad.separator as string) : "") : ""}${toLoad.postfix ? toLoad.postfix : ""}`,
        );
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
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      check((event.target! as HTMLInputElement).value, blacklist, toProcess as HTMLInputElement);
    });

    toProcess.addEventListener("input", (event: Event) => {
      // biome-ignore lint/style/noNonNullAssertion: <explanation>
      check((event.target! as HTMLInputElement).value, blacklist, event.target as HTMLInputElement);
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
  // #region Initialization
  /**
   * States whether this {@link HTML_Input_Blacklist } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.Input.Blacklist", HTML_Input_Blacklist.functionality);
  })();
  // #endregion Initialization
}
