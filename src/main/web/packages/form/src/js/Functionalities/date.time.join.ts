// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { IF } from "xdbc/src/DBC/IF.js";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE.js";
import { REGEX } from "xdbc/src/DBC/REGEX.js";
import { TYPE } from "xdbc/src/DBC/TYPE.js";
// #endregion XDBC
import { CodBiError } from "../global-scope.js";
// #endregion Imports
/**
 * Provides the {@link Date_Time_Join.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Date_Time_Join {
  /**
   * Joins the {@link Date } of a date-{@link HTMLInputElement } with the time of a time-{@link HTMLInputElement }
   * and writes the resulting value into the tagged {@link HTMLInputElement }.
   *
   * The date- and the time-{@link HTMLInputElement } may either be designated through the **DateField** and
   * **TimeField** CSS-Selector-Parameters or, if those aren't set, through the CSS-Classes the
   * {@link HTMLInputElement }s are tagged with (**CodBi_Date_Time_Join_Date** for the date- and
   * **CodBi_Date_Time_Join_Time** for the time-{@link HTMLInputElement }). The CSS-Selector-Parameters always take
   * precedence over the CSS-Classes.
   *
   * The source {@link HTMLInputElement }s are searched within the same container as the tagged
   * {@link HTMLInputElement }. If there is no container in between, the whole page is searched.
   *
   * The tagged {@link HTMLInputElement } is updated as soon as either the date- or the time-{@link HTMLInputElement }
   * changes.
   *
   * ### Config Parameter:
   *  - DateField : The optional CSS-Selector selecting the {@link HTMLInputElement } that provides the {@link Date }.
   *                Takes precedence over the **CodBi_Date_Time_Join_Date**-CSS-Class.
   *  - TimeField : The optional CSS-Selector selecting the {@link HTMLInputElement } that provides the time.
   *                Takes precedence over the **CodBi_Date_Time_Join_Time**-CSS-Class.
   *  - ToMillis  : The optional {@link boolean } specifying whether the tagged {@link HTMLInputElement } shall receive
   *                the combined {@link Date }'s `.getTime()`-milliseconds instead of its {@link string }
   *                representation (defaults to: **FALSE**).
   *  - Divisor   : The optional {@link number } the combined {@link Date }'s `.getTime()`-milliseconds are divided by
   *                before writing them (floored) into the tagged {@link HTMLInputElement }. Takes precedence over the
   *                **ToMillis**-Parameter.
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "datefield :: timefield")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "datefield", "Does the DateField-Parameter not contain a valid CSS-Selector?")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "timefield", "Does the TimeField-Parameter not contain a valid CSS-Selector?")
    @IF.PRE(new TYPE("string"), new REGEX(REGEX.stdExp.boolean), "tomillis")
    @IF.PRE(new TYPE("string"), new TYPE("boolean"), "tomillis", true)
    @IF.PRE(new TYPE("string"), new REGEX(/^-?\d+(?:\.\d+)?$/), "divisor")
    @IF.PRE(new TYPE("string"), new TYPE("number"), "divisor", true)
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(HTMLInputElement, undefined, "Is it not an <input/> that is tagged with this functionality?")
    toProcess: Element,
  ): void {
    const $ = getJQuery();
    // #region Resolve the container the tagged {@link Element} is within (falls back to the page).
    const container: ParentNode = (toProcess as HTMLElement).closest(".XContainer, .XFieldSet") ?? document;
    // #endregion Resolve the container the tagged {@link Element} is within (falls back to the page).
    // #region Resolve the source fields (CSS-Selector-Parameters take precedence over CSS-Classes).
    const resolveField: (selector: unknown, cssClass: string, label: string) => HTMLInputElement = (
      selector: unknown,
      cssClass: string,
      label: string,
    ): HTMLInputElement => {
      let element: Element | null = null;
      // 1. CSS-Selector-Parameter (takes precedence).
      if (selector !== undefined && selector !== null && selector !== "" && typeof selector === "string") {
        element = container.querySelector(selector.trim());
      }
      // 2. Fallback to the CSS-Class the field is tagged with.
      if (element === null) {
        element = container.querySelector(`.${cssClass}`);
      }
      // 3. If the resolved {@link Element } is a wrapper, descend to its <input/>.
      if (element !== null && !(element instanceof HTMLInputElement)) {
        element = element.querySelector("input");
      }
      if (element === null || !(element instanceof HTMLInputElement)) {
        throw new CodBiError(`The ${label}-field could not be resolved for the tagged element.`);
      }

      return element;
    };
    const dateField: HTMLInputElement = resolveField(toLoad.datefield, "CodBi_Date_Time_Join_Date", "date");
    const timeField: HTMLInputElement = resolveField(toLoad.timefield, "CodBi_Date_Time_Join_Time", "time");
    // #endregion Resolve the source fields (CSS-Selector-Parameters take precedence over CSS-Classes).
    // #region Normalize ToMillis-Parameter.
    toLoad.tomillis = toLoad.tomillis
      ? typeof toLoad.tomillis === "boolean"
        ? (toLoad.tomillis as boolean)
        : (toLoad.tomillis as string).toLowerCase() === "true"
      : false;
    // #endregion Normalize ToMillis-Parameter.
    // #region Parsing helpers.
    const parseDate: (value: string) => Date | null = (value: string): Date | null => {
      if (!value || value.trim() === "") {
        return null;
      }
      const parts: Array<string> = value.trim().split(/[.\-/]/);
      if (parts.length !== 3 || parts.some((p) => p.length === 0 || Number.isNaN(Number(p)))) {
        return null;
      }
      const yearIndex: number = parts.findIndex((p) => p.length === 4);
      let year: number;
      let month: number;
      let day: number;
      if (yearIndex !== -1) {
        // 4-digit year: must be the only part >2 digits.
        if (parts.filter((p) => p.length > 2).length !== 1) {
          return null;
        }
        year = Number.parseInt(parts[yearIndex]);
        if (yearIndex === 0) {
          month = Number.parseInt(parts[1]);
          day = Number.parseInt(parts[2]);
        } else if (yearIndex === 2) {
          day = Number.parseInt(parts[0]);
          month = Number.parseInt(parts[1]);
        } else {
          day = Number.parseInt(parts[0]);
          month = Number.parseInt(parts[2]);
        }
      } else {
        // 2-digit year: all parts must be ≤2 digits.
        if (parts.some((p) => p.length > 2)) {
          return null;
        }
        day = Number.parseInt(parts[0]);
        month = Number.parseInt(parts[1]);
        year = 2000 + Number.parseInt(parts[2]);
      }
      const date: Date = new Date(year, month - 1, day);
      if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
        return null;
      }

      return date;
    };
    const parseTime: (value: string) => Date | null = (value: string): Date | null => {
      if (!value || value.trim() === "") {
        return null;
      }
      const parts: Array<string> = value.trim().split(":");
      if (parts.length !== 2) {
        return null;
      }
      const h: number = Number.parseInt(parts[0]);
      const m: number = Number.parseInt(parts[1]);
      if (Number.isNaN(h) || Number.isNaN(m) || parts[1].length !== 2) {
        return null;
      }
      if (h < 0 || h > 23 || m < 0 || m > 59) {
        return null;
      }

      return new Date(0, 0, 0, h, m, 0, 0);
    };
    // #endregion Parsing helpers.
    // #region Define behavior on changed field values.
    const update: (event?: Event) => undefined = (): undefined => {
      const date: Date | null = parseDate(dateField.value);
      const time: Date | null = parseTime(timeField.value);
      const target: HTMLInputElement = toProcess as HTMLInputElement;
      if (date === null || time === null) {
        target.value = "";

        return;
      }
      const combined: Date = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes(),
        0,
        0,
      );
      const millis: number = combined.getTime();
      // If a Divisor is set, the milliseconds are divided by it and floored.
      if (toLoad.divisor !== undefined && toLoad.divisor !== null && toLoad.divisor !== "") {
        const divisor: number = Number(toLoad.divisor);
        if (Number.isFinite(divisor) && divisor !== 0) {
          target.value = String(Math.floor(millis / divisor));

          return;
        }
      }
      // If ToMillis is set, the field receives the raw .getTime() milliseconds.
      if (toLoad.tomillis) {
        target.value = String(millis);

        return;
      }
      // Default: the combined {@link Date }'s {@link string } representation (DD.MM.YYYY HH:mm).
      target.value = `${String(date.getDate()).padStart(2, "0")}.${String(date.getMonth() + 1).padStart(2, "0")}.${date.getFullYear()} ${String(time.getHours()).padStart(2, "0")}:${String(time.getMinutes()).padStart(2, "0")}`;
    };
    // #endregion Define behavior on changed field values.
    // #region Bind necessary events.
    dateField.addEventListener("input", update);
    timeField.addEventListener("input", update);
    timeField.addEventListener("change", update);
    // #region Keep the JQuery-Datepicker's existing change-handler intact.
    // The JQueryUI-Types aren't part of the form-package's tsconfig, thus the Datepicker-API is accessed through a cast.
    const datepicker: { option: (option: string, value?: unknown) => unknown } = $(dateField) as unknown as {
      option: (option: string, value?: unknown) => unknown;
    };
    const formerDateChange: ((event: Event) => undefined) | undefined = (() => {
      try {
        return $(dateField).data("datepicker")
          ? (datepicker.option("change") as (event: Event) => undefined)
          : undefined;
      } catch {
        return undefined;
      }
    })();
    $(dateField).on("change", (event: Event): undefined => {
      if (formerDateChange) {
        formerDateChange(event);
      }

      update(event);
    });
    // #endregion Keep the JQuery-Datepicker's existing change-handler intact.
    update();
    // #endregion Bind necessary events.
  }
}

window.codbi.registerFunctionality("Date.Time.Join", Date_Time_Join.functionality.bind(Date_Time_Join)); // Initialization
