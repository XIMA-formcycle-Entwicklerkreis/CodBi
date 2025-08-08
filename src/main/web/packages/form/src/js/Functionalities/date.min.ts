// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { EQ } from "xdbc/src/DBC/EQ";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link Date_Min.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Date_Min {
  /**
   * Registers the "Date.Min"-Functionality.
   *
   * Config Parameter:
   *  - Minimum:    The amount of years in the past the tagged {@link HTMLInputElement }'s entered {@link Date} got to be
   *                in order to be valid as a {@link string}.
   *  - MsgHigher:  The error message to show if the "minimum" is not enough years in the past.
   *                "[%MINIM_DATE%]" within that {@link string } will be replaced with
   *                the minimum {@link Date }-{@link String } that is valid.
   *  - Delimiter:  The {@link string} separating the day, month & year. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "minimum")
    @TYPE.PRE("string", "msghigher")
    toLoad: { [key: string]: unknown },
    @EQ.PRE("INPUT", false, "tagName")
    toProcess: Element,
  ): void {
    const $ = getJQuery();
    // If JQuery's datepicker hasn't been initialized yet
    if ($(toProcess).data("datepicker") === 1) {
      $(toProcess).datepicker();
    }

    $(toProcess).datepicker("option", { maxDate: `-${toLoad.minimum}y` });
    // #region Determine minimum date.
    const minimum: Date = new Date();

    minimum.setFullYear(new Date().getFullYear() - Number.parseInt(toLoad.minimum as string));
    // #endregion Determine minimum date.
    toProcess.addEventListener("change", (event: Event): undefined => {
      if (
        minimum.getTime() <
        new Date(
          (toProcess as HTMLInputElement).value
            .split(toLoad.delimiter && typeof toLoad.delimiter === "string" ? toLoad.delimiter : ".")
            .reduce((accumulator, current, index): string => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
        ).getTime()
      ) {
        $(toProcess).error(
          toLoad.msghigher && typeof toLoad.msghigher === "string"
            ? toLoad.msghigher.replace(/\[%MINIMUM_DATE%\]/g, minimum.toString())
            : `Date has to be earlier or same as ${minimum}.`,
        );
      }
    });
  }
  // #region Initialization
  /**
   * States whether this {@link Date_Min } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("Date.Min", Date_Min.functionality);
  })();
  // #endregion Initialization
}
