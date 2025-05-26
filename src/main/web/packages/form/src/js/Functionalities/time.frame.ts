import { getJQuery } from "@de-xima/fc-form-renderer";
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
/**
 * Provides the {@link Time_Frame.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design
export class Time_Frame {
  /**
   * This functionality connects two {@link HTMLInputElement }s to not permit the designated minimum{@link HTMLInputElement } to have a time that
   * is after the maximum one.
   *
   * Config Parameter:
   *  - MaxField:       CSS-Selector selecting the {@link HTMLInputElement } that takes the maximum time.
   *  - MsgMinInvalid:  The optional {@link string } to show as the error message when the minimum-{@link HTMLInputElement }'s value is after
   *                    the one in the Maximum-{@link HTMLInputElement }.
   *  - MsgMaxInvalid:  The optional {@link string } to show as the error message when the maximum-{@link HTMLInputElement }'s value is before
   *                    the one in the Minimum-{@link HTMLInputElement }.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @REGEX.PRE(REGEX.stdExp.cssSelector, "maxfield") toLoad: { [key: string]: unknown },
    toProcess: Element,
  ): void {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    const maximumField: HTMLInputElement = document.querySelector(toLoad.maxfield! as string)! as HTMLInputElement;

    if (toLoad.maxfield === "undefined" || typeof toLoad.maxfield !== "string" || maximumField === null) {
      return; // Do nothing if toLoad preconditions are not met.
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
          Number.parseInt(
            (toProcess as HTMLInputElement).value.split(":").reduce((accumulator, current, index): string => {
              return `${index === 0 ? Number.parseInt(current) * 60 * 60 : (Number.parseInt(current) * 60) + Number.parseInt(accumulator)}`;
            }),
          ) >=
          Number.parseInt(
            (maximumField as HTMLInputElement).value.split(":").reduce((accumulator, current, index): string => {
              return `${index === 0 ? Number.parseInt(current) * 60 * 60 : (Number.parseInt(current) * 60) + Number.parseInt(accumulator)}`;
            }),
          )
        ) {
          $(toProcess).error(msgMinInvalid);
        } else {
          $(toProcess).error("");
        }
      } else {
        if (
          Number.parseInt(
            (toProcess as HTMLInputElement).value.split(":").reduce((accumulator, current, index): string => {
              return `${index === 0 ? Number.parseInt(current) * 60 * 60 : (Number.parseInt(current) * 60) + Number.parseInt(accumulator)}`;
            }),
          ) >
          Number.parseInt(
            (maximumField as HTMLInputElement).value.split(":").reduce((accumulator, current, index): string => {
              return `${index === 0 ? Number.parseInt(current) * 60 * 60 : (Number.parseInt(current) * 60) + Number.parseInt(accumulator)}`;
            }),
          )
        ) {
          $(toProcess).error(msgMinInvalid);
        } else {
          $(toProcess).error("");
        }
      }
    };

    const onNewMaximum: (event: Event) => undefined = (event: Event): undefined => {
      if (equalityPermitted) {
        if (
          Number.parseInt(
            (toProcess as HTMLInputElement).value.split(":").reduce((accumulator, current, index): string => {
              return `${index === 0 ? Number.parseInt(current) * 60 * 60 : (Number.parseInt(current) * 60) + Number.parseInt(accumulator)}`;
            }),
          ) >=
          Number.parseInt(
            (maximumField as HTMLInputElement).value.split(":").reduce((accumulator, current, index): string => {
              return `${index === 0 ? Number.parseInt(current) * 60 * 60 : (Number.parseInt(current) * 60) + Number.parseInt(accumulator)}`;
            }),
          )
        ) {
          $(maximumField).error(msgMaxInvalid);
        } else {
          $(maximumField).error("");
        }
      } else {
        if (
          Number.parseInt(
            (toProcess as HTMLInputElement).value.split(":").reduce((accumulator, current, index): string => {
              return `${index === 0 ? Number.parseInt(current) * 60 * 60 : (Number.parseInt(current) * 60) + Number.parseInt(accumulator)}`;
            }),
          ) >
          Number.parseInt(
            (maximumField as HTMLInputElement).value.split(":").reduce((accumulator, current, index): string => {
              return `${index === 0 ? Number.parseInt(current) * 60 * 60 : (Number.parseInt(current) * 60) + Number.parseInt(accumulator)}`;
            }),
          )
        ) {
          $(maximumField).error(msgMaxInvalid);
        } else {
          $(maximumField).error("");
        }
      }
    };
    // #endregion Define behavior on changed field values.
    // #region Bind necessary events.
    toProcess.addEventListener("input", onNewMinimum);
    maximumField.addEventListener("input", onNewMaximum);
    // #endregion Bind necessary events.
  }
  // #region Initialization
  /**
   * States whether this {@link Time_Frame } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("Time.Frame", Time_Frame.functionality);
  })();
  // #endregion Initialization
}
