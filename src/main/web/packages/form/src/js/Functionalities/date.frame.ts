// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { EQ } from "xdbc/src/DBC/EQ.js";
import { IF } from "xdbc/src/DBC/IF.js";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE.js";
// #endregion XDBC
import { CodBiError } from "../global-scope.js";
// #endregion Imports
/**
 * Provides the {@link HTML_Select_Injection.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Date_Frame {
  /**
   * Registers the "Date.Frame"-Functionality.
   *
   * This functionality connects two {@link HTMLInputElement }s to not permit the designated
   * Minimum-{@link HTMLInputElement } to have a date that is after the maximum one (JQuery Datepicker supported).
   * In order for this functionality to work in repetitive containers, the tagged {@link HTMLInputElement } and the
   * corresponding **MaxField** need to be within the same container.
   *
   * ### Config Parameter:
   *  - MaxField:           CSS-Selector selecting the {@link HTMLInputElement } that takes the maximum date.
   *  - MsgMinInvalid:      The {@link string } to show as the error message when the minimum-{@link HTMLInputElement }'s value is after
   *                        the one in the maximum-{@link HTMLInputElement }.
   *  - MsgMaxInvalid:      The {@link string } to show as the error message when the maximum{@link HTMLInputElement }'s value is before
   *                        the one in the minimum-{@link HTMLInputElement }.
   *  - EqualityPermitted:  A {@link boolean } indicating whether equality between minimum and maximum dates is allowed. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "maxfield :: msgmininvalid :: msgmaxinvalid")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "maxfield", "Does the MaXField-Parameter not contain a valid CSS-Selector?")
    @IF.PRE(new TYPE("string"), new REGEX(REGEX.stdExp.boolean), "equalitypermitted")
    @IF.PRE(new TYPE("string"), new TYPE("boolean"), "equalitypermitted", true)
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(
      HTMLInputElement,
      undefined,
      'Is it not an <input type = "text"/> that is tagged with this functionality?',
    )
    @EQ.PRE("text", false, "type")
    toProcess: Element,
  ): void {
    const maximumField = INSTANCE.tsCheck<HTMLInputElement>(
      toProcess.parentElement.parentElement.querySelector(toLoad.maxfield as string),
      HTMLInputElement,
      "Is the CSS-Selector in the MaxField-Parameter not selecting an <input/> element?",
    );

    if (maximumField === null) {
      throw new CodBiError(`The selector "${toLoad.maxfield}" does not select anything.`);
    }

    const $ = getJQuery();
    // #region Normalize parameters.
    toLoad.msgmininvalid = toLoad.msgmininvalid ? toLoad.msgmininvalid : "Minimum value is invalid.";
    toLoad.msgmaxinvalid = toLoad.msgmaxinvalid ? toLoad.msgmaxinvalid : "Maximum value is invalid.";
    toLoad.equalitypermitted = toLoad.equalitypermitted
      ? typeof toLoad.equalitypermitted === "boolean"
        ? (toLoad.equalitypermitted as boolean)
        : (toLoad.equalitypermitted as string).toLowerCase() === "true"
      : false;
    // #endregion Normalize parameters.
    // #region Define behavior on changed field values.
    const onNewMinimum: (event: Event) => undefined = (event: Event): undefined => {
      if (toLoad.equalitypermitted) {
        if (
          new Date(
            (toProcess as HTMLInputElement).value.split(".").reduce((accumulator, current, index): string => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
          ) >=
          new Date(
            (maximumField as HTMLInputElement).value.split(".").reduce((accumulator, current, index): string => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
          )
        ) {
          $(toProcess).error(toLoad.msgmininvalid as string);
        } else {
          $(toProcess).error("");
          $(maximumField).error("");
        }
      } else {
        if (
          new Date(
            (toProcess as HTMLInputElement).value.split(".").reduce((accumulator, current, index): string => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
          ) >
          new Date(
            (maximumField as HTMLInputElement).value.split(".").reduce((accumulator, current, index): string => {
              return current + (index === 0 ? "" : "/") + accumulator;
            }),
          )
        ) {
          $(toProcess).error(toLoad.msgmininvalid as string);
        } else {
          $(toProcess).error("");
          $(maximumField).error("");
        }
      }
    };

    const onNewMaximum: (event: Event) => undefined = (event: Event): undefined => {
      if (toLoad.equalitypermitted) {
        if (
          new Date(
            (toProcess as HTMLInputElement).value
              .split(".")
              .reduce((accumulator: string, current: string, index: number): string => {
                return current + (index === 0 ? "" : "/") + accumulator;
              }),
          ) >=
          new Date(
            (maximumField as HTMLInputElement).value
              .split(".")
              .reduce((accumulator: string, current: string, index: number): string => {
                return current + (index === 0 ? "" : "/") + accumulator;
              }),
          )
        ) {
          $(maximumField).error(toLoad.msgmaxinvalid as string);
        } else {
          $(maximumField).error("");
          $(toProcess).error("");
        }
      } else {
        if (
          new Date(
            (toProcess as HTMLInputElement).value
              .split(".")
              .reduce((accumulator: string, current: string, index: number): string => {
                return current + (index === 0 ? "" : "/") + accumulator;
              }),
          ) >
          new Date(
            (maximumField as HTMLInputElement).value
              .split(".")
              .reduce((accumulator: string, current: string, index: number): string => {
                return current + (index === 0 ? "" : "/") + accumulator;
              }),
          )
        ) {
          $(maximumField).error(toLoad.msgmaxinvalid as string);
        } else {
          $(maximumField).error("");
          $(toProcess).error("");
        }
      }
    };
    // #endregion Define behavior on changed field values.
    // #region Bind necessary events.
    const formerOnMinSelect: (event: Event) => undefined = $(toProcess).datepicker("option", "change");
    const formerOnMaxSelect: (event: Event) => undefined = $(maximumField).datepicker("option", "change");

    $(toProcess).on("change", (event: Event): undefined => {
      if (formerOnMinSelect) {
        formerOnMinSelect(event);
      }

      onNewMinimum(event);
    });

    toProcess.addEventListener("input", onNewMinimum);
    $(maximumField).on("change", (event: Event): undefined => {
      if (formerOnMaxSelect) {
        formerOnMaxSelect(event);
      }

      onNewMaximum(event);
    });

    maximumField.addEventListener("input", onNewMaximum);
    // #endregion Bind necessary events.
  }
}

window.codbi.registerFunctionality("Date.Frame", Date_Frame.functionality.bind(Date_Frame)); // Initialization
