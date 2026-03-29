// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { EQ } from "xdbc/src/DBC/EQ";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { IF } from "xdbc/src/DBC/IF";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link Date_Min.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Date_Min {
  /**
   * Forces the tagged {@link HTMLInputElement } to only accept {@link Date }s that are at least a certain amount of
   * years/months/weeks in the past as valid {@link string }s.
   *
   * ### Config Parameter:
   *  - Minimum:    The amount of years/months/weeks (depending on the **Unit** set) in the past the tagged
   *                {@link HTMLInputElement }'s entered {@link Date} got to be in order to be valid as a {@link string}.
   *  - Reverse:    Reverse the logic of this functionality in order to permit {@link Date }s up to a certain one (defaults to: **FALSE**).
   *  - MsgHigher:  The error message to show if the "minimum" is not enough years in the past or the corresponding
   *                message for also when **Reverse** is set to TRUE.
   *                "[%ERROR_DATE%]" within that {@link string } will be replaced with
   *                the minimum {@link Date }-{@link String } that is valid.
   *  - Delimiter:  The {@link string} separating the day, month & year. Defaults to: ".".
   *  - Unit:       A {@link string }-character specifying what unit **Minimum** is of. Either d, w, m, y ( defaults to: y).*/
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "msghigher :: delimiter :: unit")
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "minimum")
    @IF.PRE(new TYPE("string"), new TYPE("number"), "minimum", true)
    @IF.PRE(new TYPE("string"), new REGEX(REGEX.stdExp.boolean), "reverse")
    @IF.PRE(new TYPE("string"), new TYPE("boolean"), "reverse", true)
    @REGEX.PRE(/(D|W|M|Y)/i, "unit", "Is the Unit-Parameter not one of the allowed values (D, W, M or Y)?")
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
    // If JQuery's datepicker hasn't been initialized yet...
    if ($(toProcess).data("datepicker") === 1) {
      $(toProcess).datepicker();
    }
    // #region Normalize Reverse-Parameter.
    toLoad.reverse = toLoad.reverse
      ? typeof toLoad.reverse === "boolean"
        ? (toLoad.reverse as boolean)
        : (toLoad.reverse as string).toLowerCase() === "true"
      : false;
    // #endregion Normalize Reverse-Parameter.
    toLoad.unit = ["d", "w", "m", "y"].includes(toLoad.unit as string) ? (toLoad.unit as string) : "y"; // Normalize Unit-Parameter.

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
              .split((toLoad.delimiter as string) || ".")
              .reduce((accumulator, current, index): string => {
                return current + (index === 0 ? "" : "/") + accumulator;
              }),
          ).setHours(0, 0, 0, 0)
        ) {
          $(toProcess).error(
            toLoad.msghigher
              ? (toLoad.msghigher as string).replace(/\[%ERROR_DATE%\]/g, minimum.toLocaleDateString())
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
              .split((toLoad.delimiter as string) || ".")
              .reduce((accumulator, current, index): string => {
                return current + (index === 0 ? "" : "/") + accumulator;
              }),
          ).setHours(0, 0, 0, 0)
        ) {
          $(toProcess).error(
            toLoad.msghigher
              ? (toLoad.msghigher as string).replace(/\[%ERROR_DATE%\]/g, minimum.toLocaleDateString())
              : `Date has to be earlier or same as ${minimum.toLocaleDateString()}.`,
          );
        } else {
          $(toProcess).error("");
        }
      }
    });
  }
}

window.codbi.registerFunctionality("Date.Min", Date_Min.functionality.bind(Date_Min)); // Initialization
