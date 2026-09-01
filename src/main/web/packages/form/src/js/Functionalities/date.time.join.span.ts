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
// #endregion Imports
/**
 * Provides the {@link Date_Time_Join_Span.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Date_Time_Join_Span {
  /**
   * Connects four {@link HTMLInputElement }s (a begin date-, a begin time-, an end date- and an end time-field) to
   * ensure that the joined end datetime is higher than the joined begin datetime.
   *
   * The begin datetime is the combination of the **Date_Time_Join_Span_Begin**- and the
   * **Date_Time_Join_Span_Begin_Time**-field, the end datetime the combination of the **Date_Time_Join_Span_End**- and
   * the **Date_Time_Join_Span_End_Time**-field. As soon as one of the four fields changes, both datetimes are
   * (re-)compared. If the joined end datetime is lower or equal to the joined begin datetime (or, equivalently, the
   * joined begin datetime is higher or equal to the joined end datetime), the field that just changed is invalidated,
   * i.e. exactly **either one of the date- or one of the time-fields** is marked invalid and shows the
   * **MsgInvalid**-message. Once the span is valid again, all four error-messages are removed.
   *
   * The begin- and the end-fields may either be designated through the **Begin**, **BeginTime**, **End**- and
   * **EndTime** CSS-Selector-Parameters or, if those aren't set, through the CSS-Classes the {@link HTMLInputElement }s
   * are tagged with (**CodBi_Date_Time_Join_Span_Begin**, **CodBi_Date_Time_Join_Span_Begin_Time**,
   * **CodBi_Date_Time_Join_Span_End** and **CodBi_Date_Time_Join_Span_End_Time**). The CSS-Selector-Parameters always
   * take precedence over the CSS-Classes. As soon as more than one span exists within the form, the
   * CSS-Selector-Parameters are required to disambiguate the fields.
   *
   * The tagged {@link Element } is the scope within which the fields are searched: the **CodBi_Date_Time_Join_Span_*-
   * CSS-Classes are looked up inside the tagged {@link Element } (so the container holding the four fields is the
   * element to tag). CSS-Classes that lie within a nested element which is itself tagged with **Date.Time.Join.Span**
   * are skipped, so an outer span never resolves an inner span's fields. The **Begin**, **BeginTime**, **End**- and
   * **EndTime** CSS-Selector-Parameters are first resolved within the tagged {@link Element } as well and then fall
   * back to the whole document — covering the case that the begin- and the end-fields reside in different (upper)
   * containers.
   *
   * ### Config Parameter:
   *  - Begin     : The optional CSS-Selector selecting the {@link HTMLInputElement } that provides the begin {@link Date }. Takes precedence over
   *                the **CodBi_Date_Time_Join_Span_Begin**-CSS-Class.
   *  - BeginTime : The optional CSS-Selector selecting the {@link HTMLInputElement } that provides the begin time. Takes precedence over the
   *                **CodBi_Date_Time_Join_Span_Begin_Time**-CSS-Class.
   *  - End       : The optional CSS-Selector selecting the {@link HTMLInputElement } that provides the end {@link Date }. Takes precedence over
   *                the **CodBi_Date_Time_Join_Span_End**-CSS-Class.
   *  - EndTime   : The optional CSS-Selector selecting the {@link HTMLInputElement } that provides the end time. Takes precedence over the
   *                **CodBi_Date_Time_Join_Span_End_Time**-CSS-Class.
   *  - MsgInvalid  : The optional {@link string } to show as the error message when the joined end datetime is lower or equal to the
   *                  joined begin datetime (defaults to: "The end datetime must be strictly after the begin datetime.").
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "begin :: begintime :: end :: endtime")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "begin", "Does the Begin-Parameter not contain a valid CSS-Selector?")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "begintime", "Does the BeginTime-Parameter not contain a valid CSS-Selector?")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "end", "Does the End-Parameter not contain a valid CSS-Selector?")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "endtime", "Does the EndTime-Parameter not contain a valid CSS-Selector?")
    @IF.PRE(new TYPE("string"), new TYPE("string"), "msginvalid")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(Element, undefined, "Is it not an element that is tagged with this functionality?")
    toProcess: Element,
  ): void {
    const $ = getJQuery();
    // #region The tagged element is the scope within which the fields are searched.
    const scope: ParentNode = toProcess;
    // Fields lying within a nested element that is itself tagged with Date.Time.Join.Span are skipped by the
    // CSS-Class lookup, so an outer span never resolves an inner span's fields.
    const isWithinNestedSpan: (candidate: Element) => boolean = (candidate: Element): boolean => {
      let ancestor: Element | null = candidate.parentElement;
      while (ancestor !== null && ancestor !== scope) {
        const func: string | null = ancestor.getAttribute("data-cb-func");
        if (func?.toLowerCase().includes("date.time.join.span")) {
          return true;
        }
        ancestor = ancestor.parentElement;
      }

      return false;
    };
    // #endregion The tagged element is the scope within which the fields are searched.
    // #region Resolve the begin- and end-fields (CSS-Selector-Parameters take precedence over CSS-Classes).
    const resolveField: (selector: unknown, cssClass: string) => HTMLInputElement | null = (
      selector: unknown,
      cssClass: string,
    ): HTMLInputElement | null => {
      let element: Element | null = null;
      // 1. The CSS-Selector-Parameter (takes precedence over the CSS-Class). Resolved within the tagged element first,
      //    then falling back to the whole document (the begin- and the end-fields may reside in different containers).
      if (typeof selector === "string" && selector.trim() !== "") {
        element = scope.querySelector(selector.trim());
        if (element === null) {
          element = document.querySelector(selector.trim());
        }
      }
      // 2. Fallback to the CSS-Class the field is tagged with, searched within the tagged element. Candidates that
      //    lie within a nested element tagged with Date.Time.Join.Span are skipped, so the outer span never resolves
      //    the inner span's fields. With more than one span within the form, the CSS-Selector-Parameters are required
      //    to disambiguate the fields.
      if (element === null) {
        const candidates: Array<Element> = Array.from(scope.querySelectorAll(`.${cssClass}`));
        element = candidates.find((candidate) => !isWithinNestedSpan(candidate)) ?? null;
      }
      // 3. If the resolved {@link Element } is a wrapper, descend to its <input/>.
      if (element !== null && !(element instanceof HTMLInputElement)) {
        element = element.querySelector("input");
      }
      if (element === null || !(element instanceof HTMLInputElement)) {
        // A field that cannot be resolved simply disables the functionality instead of throwing an exception.
        return null;
      }

      return element;
    };
    const beginDateField: HTMLInputElement | null = resolveField(toLoad.begin, "CodBi_Date_Time_Join_Span_Begin");
    const beginTimeField: HTMLInputElement | null = resolveField(
      toLoad.begintime,
      "CodBi_Date_Time_Join_Span_Begin_Time",
    );
    const endDateField: HTMLInputElement | null = resolveField(toLoad.end, "CodBi_Date_Time_Join_Span_End");
    const endTimeField: HTMLInputElement | null = resolveField(toLoad.endtime, "CodBi_Date_Time_Join_Span_End_Time");
    // If any of the referenced fields could not be resolved, the functionality simply does not take effect.
    if (beginDateField === null || beginTimeField === null || endDateField === null || endTimeField === null) {
      return;
    }
    // #endregion Resolve the begin- and end-fields (CSS-Selector-Parameters take precedence over CSS-Classes).
    // #region Normalize the optional error-message.
    const msgInvalid: string =
      typeof toLoad.msginvalid === "string" && toLoad.msginvalid.trim() !== ""
        ? toLoad.msginvalid
        : "The end datetime must be strictly after the begin datetime.";
    // #endregion Normalize the optional error-message.
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
    const combine: (date: Date, time: Date) => Date = (date: Date, time: Date): Date =>
      new Date(date.getFullYear(), date.getMonth(), date.getDate(), time.getHours(), time.getMinutes(), 0, 0);
    // #endregion Parsing helpers.
    // #region Define behavior on changed field values.
    const clearErrors: () => undefined = (): undefined => {
      $(beginDateField).error("");
      $(beginTimeField).error("");
      $(endDateField).error("");
      $(endTimeField).error("");
    };
    const update: (changedField: HTMLInputElement) => undefined = (changedField: HTMLInputElement): undefined => {
      const beginDate: Date | null = parseDate(beginDateField.value);
      const beginTime: Date | null = parseTime(beginTimeField.value);
      const endDate: Date | null = parseDate(endDateField.value);
      const endTime: Date | null = parseTime(endTimeField.value);
      // A span whose parts aren't complete cannot be validated.
      if (beginDate === null || beginTime === null || endDate === null || endTime === null) {
        clearErrors();

        return;
      }
      const beginMillis: number = combine(beginDate, beginTime).getTime();
      const endMillis: number = combine(endDate, endTime).getTime();
      // Equality is not permitted: an end datetime that is lower or equal to the begin datetime (or, equivalently,
      // a begin datetime that is higher or equal to the end datetime) invalidates exactly the field that changed.
      if (beginMillis >= endMillis) {
        $(changedField).error(msgInvalid);
      } else {
        clearErrors();
      }
    };
    // #endregion Define behavior on changed field values.
    // #region Bind necessary events.
    beginDateField.addEventListener("input", (): undefined => update(beginDateField));
    beginTimeField.addEventListener("input", (): undefined => update(beginTimeField));
    endDateField.addEventListener("input", (): undefined => update(endDateField));
    endTimeField.addEventListener("input", (): undefined => update(endTimeField));
    beginTimeField.addEventListener("change", (): undefined => update(beginTimeField));
    endTimeField.addEventListener("change", (): undefined => update(endTimeField));
    // #region Keep the JQuery-Datepicker's existing change-handler intact on both date fields.
    // The JQueryUI-Types aren't part of the form-package's tsconfig, thus the Datepicker-API is accessed through a cast.
    const wireDatepickerChange: (field: HTMLInputElement) => undefined = (field: HTMLInputElement): undefined => {
      const datepicker: { option: (option: string, value?: unknown) => unknown } = $(field) as unknown as {
        option: (option: string, value?: unknown) => unknown;
      };
      const formerDateChange: ((event: Event) => undefined) | undefined = (() => {
        try {
          return $(field).data("datepicker") ? (datepicker.option("change") as (event: Event) => undefined) : undefined;
        } catch {
          return undefined;
        }
      })();
      $(field).on("change", (event: Event): undefined => {
        if (formerDateChange) {
          formerDateChange(event);
        }

        update(field);
      });
    };
    wireDatepickerChange(beginDateField);
    wireDatepickerChange(endDateField);
    // #endregion Keep the JQuery-Datepicker's existing change-handler intact on both date fields.
    // #endregion Bind necessary events.
  }
}

window.codbi.registerFunctionality("Date.Time.Join.Span", Date_Time_Join_Span.functionality.bind(Date_Time_Join_Span)); // Initialization
