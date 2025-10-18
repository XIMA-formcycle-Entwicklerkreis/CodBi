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
   *  - Reverse:    Reverse the logic of this functionality in order to permit {@link Date }s up to a certain one (defaults to: **FALSE**).
   *  - MsgHigher:  The error message to show if the "minimum" is not enough years in the past or the corresponding
   *                message for also when **Reverse** is set to TRUE.
   *                "[%ERROR_DATE%]" within that {@link string } will be replaced with
   *                the minimum {@link Date }-{@link String } that is valid.
   *  - Delimiter:  The {@link string} separating the day, month & year.
   *  - Unit:       A {@link string }-character specifying what unit **Minimum** is of. Either none, w, m, y ( defaults to:y).*/
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "minimum")
    @TYPE.PRE("string", "msghigher")
    toLoad: { [key: string]: unknown },
    @EQ.PRE("INPUT", false, "tagName")
    toProcess: Element,
  ): void {
    // #region Normalize Arrayed-Parameter.
    if (Array.isArray(toLoad.minimum)) {
      toLoad.minimum = (toLoad.minimum as Array<string>)[0];
    }

    if (Array.isArray(toLoad.msghigher)) {
      toLoad.msghigher = (toLoad.msghigher as Array<string>)[0];
    }

    if (Array.isArray(toLoad.delimiter)) {
      toLoad.delimiter = (toLoad.delimiter as Array<string>)[0];
    }

    if (Array.isArray(toLoad.reverse)) {
      toLoad.reverse = (toLoad.reverse as Array<string>)[0];
    }

    if (Array.isArray(toLoad.unit)) {
      toLoad.unit = (toLoad.unit as Array<string>)[0];
    }
    // #endregion Normalize Arrayed-Parameter.
    const $ = getJQuery();
    // If JQuery's datepicker hasn't been initialized yet
    if ($(toProcess).data("datepicker") === 1) {
      $(toProcess).datepicker();
    }
    // #region Normalize Reverse-Parameter.
    toLoad.reverse =
      toLoad.reverse === undefined ? false : TYPE.tsCheck<string>(toLoad.reverse, "string").toLowerCase() === "true";
    // #endregion Normalize Reverse-Parameter.
    // #region Normalize Unit-Parameter.
    toLoad.unit =
      toLoad.unit === undefined ? "y" : TYPE.tsCheck<string>(toLoad.unit, "string").substring(0, 1).toLowerCase();
    toLoad.unit = ["d", "w", "m", "y"].includes(toLoad.unit as string) ? (toLoad.unit as string) : "y";
    // #endregion Normalize Unit-Parameter.
    $(toProcess).datepicker(
      "option",
      toLoad.reverse
        ? { minDate: `+${toLoad.minimum}${toLoad.unit}` }
        : { maxDate: `-${toLoad.minimum}${toLoad.unit}` },
    );
    // #region Determine minimum date.
    const minimum: Date = new Date();

    switch (toLoad.unit) {
      case "d":
        minimum.setDate(
          toLoad.reverse
            ? new Date().getDate() + Number.parseInt(toLoad.minimum as string)
            : new Date().getDate() - Number.parseInt(toLoad.minimum as string),
        );

        break;
      case "w":
        minimum.setDate(
          toLoad.reverse
            ? new Date().getDate() + Number.parseInt(toLoad.minimum as string) * 7
            : new Date().getDate() - Number.parseInt(toLoad.minimum as string) * 7,
        );

        break;
      case "m":
        minimum.setMonth(
          toLoad.reverse
            ? new Date().getMonth() + Number.parseInt(toLoad.minimum as string)
            : new Date().getMonth() - Number.parseInt(toLoad.minimum as string),
        );

        break;
      case "y":
        minimum.setFullYear(
          toLoad.reverse
            ? new Date().getFullYear() + Number.parseInt(toLoad.minimum as string)
            : new Date().getFullYear() - Number.parseInt(toLoad.minimum as string),
        );

        break;
      default:
        minimum.setFullYear(
          toLoad.reverse
            ? new Date().getFullYear() + Number.parseInt(toLoad.minimum as string)
            : new Date().getFullYear() - Number.parseInt(toLoad.minimum as string),
        );
    }
    // #endregion Determine minimum date.
    $(toProcess).on("change", (event: JQuery.Event): undefined => {
      if (toLoad.reverse) {
        if (
          minimum.setHours(0, 0, 0, 0) >
          new Date(
            (toProcess as HTMLInputElement).value
              .split(toLoad.delimiter && typeof toLoad.delimiter === "string" ? toLoad.delimiter : ".")
              .reduce((accumulator, current, index): string => {
                return current + (index === 0 ? "" : "/") + accumulator;
              }),
          ).setHours(0, 0, 0, 0)
        ) {
          $(toProcess).error(
            toLoad.msghigher && typeof toLoad.msghigher === "string"
              ? toLoad.msghigher.replace(/\[%ERROR_DATE%\]/g, minimum.toLocaleDateString())
              : `Date has to be later or same as ${minimum.toLocaleDateString()}.`,
          );
        } else {
          $(toProcess).error("");
        }
      } else {
        if (
          minimum.setHours(0, 0, 0, 0) <
          new Date(
            (toProcess as HTMLInputElement).value
              .split(toLoad.delimiter && typeof toLoad.delimiter === "string" ? toLoad.delimiter : ".")
              .reduce((accumulator, current, index): string => {
                return current + (index === 0 ? "" : "/") + accumulator;
              }),
          ).setHours(0, 0, 0, 0)
        ) {
          $(toProcess).error(
            toLoad.msghigher && typeof toLoad.msghigher === "string"
              ? toLoad.msghigher.replace(/\[%ERROR_DATE%\]/g, minimum.toLocaleDateString())
              : `Date has to be earlier or same as ${minimum.toLocaleDateString()}.`,
          );
        } else {
          $(toProcess).error("");
        }
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
