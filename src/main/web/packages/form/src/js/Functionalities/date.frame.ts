// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
// #endregion XDBC
import { CodBiError } from "../global-scope.js";
// #endregion Imports
/**
 * Provides the {@link HTML_Select_Injection.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
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
   * Config Parameter:
   *  - MaxField:       CSS-Selector selecting the {@link HTMLInputElement } that takes the maximum date.
   *  - MsgMinInvalid:  The {@link string } to show as the error message when the minimum-{@link HTMLInputElement }'s value is after
   *                    the one in the maximum-{@link HTMLInputElement }.
   *  - MsgMaxInvalid:  The {@link string } to show as the error message when the maximum{@link HTMLInputElement }'s value is before
   *                    the one in the minimum-{@link HTMLInputElement }. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "maxfield")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "maxfield")
    @TYPE.PRE("string", "msgmininvalid")
    @TYPE.PRE("string", "msgmaxinvalid")
    toLoad: { [key: string]: string },
    toProcess: Element,
  ): void {
    const maximumField: HTMLInputElement = toProcess.parentElement.parentElement.querySelector(
      toLoad.maxfield as string,
    ) as HTMLInputElement;

    if (maximumField === null) {
      throw new CodBiError(`The selector "${toLoad.maxfield}" does not select anything.`);
    }

    const $ = getJQuery();
    const msgMinInvalid: string =
      toLoad.msgmininvalid && typeof toLoad.msgmininvalid === "string"
        ? toLoad.msgmininvalid
        : "Minimum value is invalid.";
    const msgMaxInvalid: string =
      toLoad.msgmaxinvalid && typeof toLoad.msgmaxinvalid === "string"
        ? toLoad.msgmaxinvalid
        : "Maximum value is invalid.";
    const equalityPermitted: boolean =
      toLoad.equalitypermitted && typeof toLoad.equalitypermitted === "boolean"
        ? (toLoad.equalitypermitted as boolean)
        : false;
    // #region Define behavior on changed field values.
    const onNewMinimum: (event: Event) => undefined = (event: Event): undefined => {
      if (equalityPermitted) {
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
          $(toProcess).error(msgMinInvalid);
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
          $(toProcess).error(msgMinInvalid);
        } else {
          $(toProcess).error("");
          $(maximumField).error("");
        }
      }
    };

    const onNewMaximum: (event: Event) => undefined = (event: Event): undefined => {
      if (equalityPermitted) {
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
          $(maximumField).error(msgMaxInvalid);
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
          $(maximumField).error(msgMaxInvalid);
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
  // #region Initialization
  /**
   * States whether this {@link Date_Frame } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("Date.Frame", Date_Frame.functionality);
  })();
  // #endregion Initialization
}
