import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { CodBi, CodBiError } from "../global-scope";
import { getJQuery } from "@de-xima/fc-form-renderer";
/**
 * Provides the {@link OnChange_Conditional.functionality }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (Salvatore.Callari@Ansbach.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design
export class OnChange_Conditional {
  /**
   * This functionality applies a certain functionality onto the {@link object } "toProcess" depending on whether
   * a given condition is fulfilled or not.
   * The functionalities to apply are defined by the tagged {@link HTMLInputElement }'s attributes. Those attributes
   * start with either cb_T_, for attributes to be applied when the tagged {@link HTMLInputElement } and
   * the "reference" value are successfully compared by the specified "mode", or with cb_F_ if not.
   * For example to define a JSON.SET that sets the "target"'s style.display property onto the "target"
   * for both success and failure following attributes are also needed for the tagged {@link HTMLInputElement }:
   * cb_T_FUNC, cb_T_Path, cb_T_Property, cb_T_ToSet, cb_F_FUNC, cb_F_Path, cb_F_Property, cb_F_ToSet.
   * Omitting _T_ or _F_ attributes will result in nothing to happen in case of success (_T_) or failure (_F_).
   *
   * Config Parameter:
   *  - Reference:  The value the {@link HTMLInputElement }'s value shall be compared with.
   *  - Mode:       Defines the mode of comparison to apply onto the {@link HTMLInputElement }'s value and the "reference" value.
   *                Available modes are GTE (greater than or equal), GT ( greater than ), LTE ( lower than or equal ),
   *                LT ( lower than ), EQ (equal) & NEQ (not equal).
   *  - Target:     The {@link Element } where to apply one of the specified functionalities depending on whether the
   *                given "condition" is fulfilled or not.
   *  - DateFormat: A {@link string } specifying the format the candidate is of. If this parameter isn't undefined
   *                it triggers value of the tagged field transformation into a {@link Date } prior to compare it with
   *                the reference.
   *  -
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   *
   * @throws  A {@link CodBiError } a "DateFormat" is specified and the tagged {@link HTMLInputElement }'S value
   *          couldn't be converted to a {@link Date } by {@link formatDate }. */
  @DBC.ParamvalueProvider
  public static functionality(
    @REGEX.PRE(/^(GTEQ|GT|LTEQ|LT|EQ|NEQ)$/i, "mode")
    @INSTANCE.PRE(HTMLInputElement, "target")
    @REGEX.PRE(REGEX.stdExp.dateFormat, "dateFormat")
    toLoad: { [key: string]: unknown },
    toProcess: Element,
  ): undefined {
    // biome-ignore lint/style/noNonNullAssertion: <explanation>
    toLoad.target = (toLoad.target as Array<unknown>)[0]!;
    const processChange = () => {
      // #region Determine fulfillment.
      let fulfilled = false;
      // #region Define candidate & reference.
      const candidate = toLoad.dateformat
        ? formatDate(toLoad.dateformat as string, (toProcess as HTMLInputElement).value)
        : toLoad.candidate;

      if (candidate === "Invalid date") {
        throw new CodBiError(
          `The tagged element's value (${(toProcess as HTMLInputElement).value}) could not be converted to the requested "format (${toLoad.formatDate})".`,
        );
      }

      if (Array.isArray(toLoad.reference)) {
        toLoad.reference = (toLoad.reference as Array<unknown>)[0];
      }
      // #endregion Define candidate & reference.
      switch ((toLoad.mode as string).toLowerCase()) {
        case "gteq":
          // biome-ignore lint/suspicious/noExplicitAny: Needed for comparison of unknown type of objects.
          fulfilled = (candidate as any) >= (toLoad.reference as any);

          break;
        case "gt":
          // biome-ignore lint/suspicious/noExplicitAny: Needed for comparison of unknown type of objects.
          fulfilled = (candidate as any) > (toLoad.reference as any);

          break;
        case "lteq":
          // biome-ignore lint/suspicious/noExplicitAny: Needed for comparison of unknown type of objects.
          fulfilled = (candidate as any) <= (toLoad.reference as any);

          break;
        case "lt":
          // biome-ignore lint/suspicious/noExplicitAny: Needed for comparison of unknown type of objects.
          fulfilled = (candidate as any) < (toLoad.reference as any);

          break;
        case "eq":
          // biome-ignore lint/suspicious/noExplicitAny: Needed for comparison of unknown type of objects.
          fulfilled = (candidate as any) === (toLoad.reference as any);

          break;
        case "neq":
          // biome-ignore lint/suspicious/noExplicitAny: Needed for comparison of unknown type of objects.
          fulfilled = (candidate as any) !== (toLoad.reference as any);

          break;
        default:
          throw new CodBiError(`Specified mode "${toLoad.mode}" not available.`);
      }
      // #endregion Determine fulfillment.
      // #region Attribute re-configuration.
      for (const attribute of toProcess.attributes) {
        const name = attribute.name.toLowerCase();

        if (name[0] === "c" && name[1] === "b") {
          if (name[2] === "_") {
            switch (name.substring(3, 5)) {
              case "t_": {
                if (fulfilled) {
                  const realAttributename = attribute.name.replace("_t_", "");

                  (toLoad.target as HTMLElement).removeAttribute(realAttributename);
                  (toLoad.target as HTMLElement).setAttribute(realAttributename, attribute.value);
                }

                break;
              }

              case "f_": {
                if (!fulfilled) {
                  const realAttributename = attribute.name.replace("_f_", "");

                  (toLoad.target as HTMLElement).removeAttribute(realAttributename);
                  (toLoad.target as HTMLElement).setAttribute(realAttributename, attribute.value);
                }
                break;
              }
              default:
            }
          }
        }
      }

      (toLoad.target as HTMLElement).removeAttribute("cbichecked");
      // #endregion Attribute re-configuration.
      window.codbi.checkAttributes();
    };

    toProcess.addEventListener("change", processChange);
    getJQuery()(toProcess).datepicker({ onSelect: processChange });
  }
  // #region Initialization
  /**
   * States whether this {@link OnChange_Conditional } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("OnChange.Conditional", OnChange_Conditional.functionality);
  })();
  // #endregion Initialization
}
// #region Tools
/**
 * KI Code
 *
 * @param format      A {@link string } like DD.MM.YYYY.
 * @param dateString  The {@link string  to convert to a {@link Date }.
 *
 * @returns The request {@link Date } ir "Invalid Date".
 */
function formatDate(format: string, dateString: string): Date | string {
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return "Invalid Date"; // Handle invalid date strings
  }

  const replacements: { [key: string]: (date: Date) => string } = {
    YYYY: (date) => date.getFullYear().toString(),
    YY: (date) => date.getFullYear().toString().slice(-2),
    // biome-ignore lint/style/useTemplate: KI Code
    MM: (date) => ("0" + (date.getMonth() + 1)).slice(-2),
    M: (date) => (date.getMonth() + 1).toString(),
    // biome-ignore lint/style/useTemplate: KI Code
    DD: (date) => ("0" + date.getDate()).slice(-2),
    D: (date) => date.getDate().toString(),
    // biome-ignore lint/style/useTemplate: KI Code
    HH: (date) => ("0" + date.getHours()).slice(-2),
    H: (date) => date.getHours().toString(),
    hh: (date) => {
      const hour = date.getHours() % 12;
      // biome-ignore lint/style/useTemplate: KI Code
      return ("0" + (hour === 0 ? 12 : hour)).slice(-2);
    },
    h: (date) => {
      const hour = date.getHours() % 12;
      return (hour === 0 ? 12 : hour).toString();
    },
    // biome-ignore lint/style/useTemplate: KI Code
    mm: (date) => ("0" + date.getMinutes()).slice(-2),
    m: (date) => date.getMinutes().toString(),
    // biome-ignore lint/style/useTemplate: KI Code
    ss: (date) => ("0" + date.getSeconds()).slice(-2),
    s: (date) => date.getSeconds().toString(),
    fff: (date) => {
      const ms = date.getMilliseconds();
      // biome-ignore lint/style/useTemplate: KI Code
      return ms < 10 ? "00" + ms : ms < 100 ? "0" + ms : ms.toString();
    },
    ff: (date) => {
      const ms = date.getMilliseconds();
      return (ms < 100 ? "0" : "") + Math.floor(ms / 10).toString();
    },
    f: (date) => Math.floor(date.getMilliseconds() / 100).toString(),
    a: (date) => (date.getHours() < 12 ? "am" : "pm"),
    A: (date) => (date.getHours() < 12 ? "AM" : "PM"),
  };

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();

  const formatReplacements: { [key: string]: string } = {};

  for (const key in replacements) {
    // biome-ignore lint/style/noNonNullAssertion: KI Code
    const value = replacements[key]!(date);
    formatReplacements[key] = value;
  }

  let formattedDate = format;
  for (const key in formatReplacements) {
    // biome-ignore lint/style/noNonNullAssertion: KI Code
    formattedDate = formattedDate.replace(new RegExp(key, "g"), formatReplacements[key]!);
  }
  const hasTime =
    format.includes("HH") ||
    format.includes("hh") ||
    format.includes("mm") ||
    format.includes("ss") ||
    format.includes("fff") ||
    format.includes("ff") ||
    format.includes("f");

  if (hasTime) {
    return new Date(year, month, day, hours, minutes, seconds, milliseconds);
  } else {
    return new Date(year, month, day);
  }
}
// #endregion Tools
