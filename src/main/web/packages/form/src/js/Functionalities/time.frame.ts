// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { CodBiError } from "../global-scope.js";
import { DEFINED } from "xdbc/src/DBC/DEFINED.js";
import { TYPE } from "xdbc/src/DBC/TYPE.js";
import { IF } from "xdbc/src/DBC/IF.js";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE.js";
import { EQ } from "xdbc/src/DBC/EQ.js";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link Time_Frame.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Time_Frame {
  /**
   * This functionality connects two {@link HTMLInputElement }s to not permit the designated minimum{@link HTMLInputElement } to have a time that
   * is after the maximum one.
   *
   * Config Parameter:
   *  - MaxField:           CSS-Selector selecting the {@link HTMLInputElement } that takes the maximum time.
   *  - MsgMinInvalid:      The optional {@link string } to show as the error message when the minimum-{@link HTMLInputElement }'s value is after
   *                        the one in the Maximum-{@link HTMLInputElement }.
   *  - MsgMaxInvalid:      The optional {@link string } to show as the error message when the maximum-{@link HTMLInputElement }'s value is before
   *                        the one in the Minimum-{@link HTMLInputElement }.
   *  - EqualityPermitted:  Specifies whether the same start and end time is permitted.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @DEFINED.PRE("maxfield")
    @TYPE.PRE("string", "maxfield :: msgmininvalid :: msgmaxinvalid")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "maxfield")
    @IF.PRE(new TYPE("string"), new REGEX(/^(TRUE|FALSE)$/i), "equalitypermitted")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(HTMLInputElement, "Is it not an <input> that is tagged with this functionality?")
    @EQ.PRE("text", false, "type", 'Is it not an <input type = "time"> that is tagged with this functionality?')
    toProcess: Element,
  ): void {
    const maximumField: HTMLInputElement = toProcess.parentElement.parentElement.querySelector(
      toLoad.maxfield as string,
    ) as HTMLInputElement;

    if (toLoad.maxfield === "undefined" || typeof toLoad.maxfield !== "string" || maximumField === null) {
      throw new CodBiError(`No maximum field was specified or the selector (${toLoad.maximumField}) is invalid.`);
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
      if (!equalityPermitted) {
        if (
          Number.parseInt((toProcess as HTMLInputElement).value.split(":")[0]) * 60 +
            Number.parseInt((toProcess as HTMLInputElement).value.split(":")[1]) >=
          Number.parseInt((maximumField as HTMLInputElement).value.split(":")[0]) * 60 +
            Number.parseInt((maximumField as HTMLInputElement).value.split(":")[1])
        ) {
          $(toProcess).error(msgMinInvalid);
        } else {
          $(toProcess).error("");
          $(maximumField).error("");
        }
      } else {
        if (
          Number.parseInt((toProcess as HTMLInputElement).value.split(":")[0]) * 60 +
            Number.parseInt((toProcess as HTMLInputElement).value.split(":")[1]) >
          Number.parseInt((maximumField as HTMLInputElement).value.split(":")[0]) * 60 +
            Number.parseInt((maximumField as HTMLInputElement).value.split(":")[1])
        ) {
          $(toProcess).error(msgMinInvalid);
        } else {
          $(toProcess).error("");
          $(maximumField).error("");
        }
      }
    };

    const onNewMaximum: (event: Event) => undefined = (event: Event): undefined => {
      if (!equalityPermitted) {
        if (
          Number.parseInt((toProcess as HTMLInputElement).value.split(":")[0]) * 60 +
            Number.parseInt((toProcess as HTMLInputElement).value.split(":")[1]) >=
          Number.parseInt((maximumField as HTMLInputElement).value.split(":")[0]) * 60 +
            Number.parseInt((maximumField as HTMLInputElement).value.split(":")[1])
        ) {
          $(maximumField).error(msgMaxInvalid);
        } else {
          $(maximumField).error("");
          $(toProcess).error("");
        }
      } else {
        if (
          Number.parseInt((toProcess as HTMLInputElement).value.split(":")[0]) * 60 +
            Number.parseInt((toProcess as HTMLInputElement).value.split(":")[1]) >
          Number.parseInt((maximumField as HTMLInputElement).value.split(":")[0]) * 60 +
            Number.parseInt((maximumField as HTMLInputElement).value.split(":")[1])
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
    toProcess.addEventListener("input", onNewMinimum);
    maximumField.addEventListener("input", onNewMaximum);
    // #endregion Bind necessary events.
  }
}

window.codbi.registerFunctionality("Time.Frame", Time_Frame.functionality.bind(Time_Frame)); // Initialization
