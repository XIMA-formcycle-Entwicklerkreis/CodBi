// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
import { CodBi, CodBiError } from "../global-scope";
// #endregion Imports
/**
 * Provides the {@link OnChange_Conditional.functionality }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (Salvatore.Callari@Ansbach.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
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
   *                given "condition" is fulfilled or not or a CSS-Selector.
   *                To work in a repetitive container a CSS-Selector is mandatory since the functionality performs the
   *                query relative to the tagged {@link HTMLInputElement }.
   *  - DateFormat: A optional {@link string } specifying the format the candidate is of. If this parameter isn't undefined
   *                it triggers value of the tagged field transformation into a {@link Date } prior to compare it with
   *                the reference. If not specified the format is assumed to be MM/DD/YYYY or a format parsable by the
   *                {@link Date } constructor.
   *  - Candidate:  The {@link Element } where to get the value to be compared or a CSS-Selector.
   *                To work in a repetitive container a CSS-Selector is mandatory since the functionality performs the
   *                query relative to the tagged {@link HTMLInputElement }.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   *
   * @throws  A {@link CodBiError } a "DateFormat" is specified and the tagged {@link HTMLInputElement }'S value
   *          couldn't be converted to a {@link Date } by {@link formatDate }. */
  @DBC.ParamvalueProvider
  public static functionality(
    @REGEX.PRE(/^(GTEQ|GT|LTEQ|LT|EQ|NEQ)$/i, "mode")
    @REGEX.PRE(REGEX.stdExp.dateFormat, "dateFormat")
    toLoad: { [key: string]: unknown },
    toProcess: Element,
  ): undefined {
    // #region Normalize parameter.
    if (typeof toLoad.target === "string") {
      toLoad.target = toProcess.parentElement.parentElement.querySelector(toLoad.target as string);
    } else {
      toLoad.target = (toLoad.target as Array<unknown>)[0];
    }

    if (typeof toLoad.candidate === "string") {
      toLoad.candidate = toProcess.parentElement.parentElement.querySelector(toLoad.candidate as string);
    }
    // #endregion Normalize parameter.
    const processChange = () => {
      // #region Determine fulfillment.
      let fulfilled = false;
      // #region Define candidate & reference.
      const candidate = toLoad.dateformat
        ? formatDate(toLoad.dateformat as string, (toLoad.candidate as HTMLInputElement).value as string)
        : new Date((toLoad.candidate as HTMLInputElement).value);

      if (candidate === "Invalid Date") {
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
          fulfilled = (candidate as Date).getTime() >= (toLoad.reference as Date).getTime();

          break;
        case "gt":
          fulfilled = (candidate as Date).getTime() > (toLoad.reference as Date).getTime();

          break;
        case "lteq":
          fulfilled = (candidate as Date).getTime() <= (toLoad.reference as Date).getTime();

          break;
        case "lt":
          fulfilled = (candidate as Date).getTime() < (toLoad.reference as Date).getTime();

          break;
        case "eq":
          fulfilled = (candidate as Date).getTime() === (toLoad.reference as Date).getTime();

          break;
        case "neq":
          fulfilled = (candidate as Date).getTime() !== (toLoad.reference as Date).getTime();

          break;
        default:
          throw new CodBiError(`Specified mode "${toLoad.mode}" not available.`);
      }
      // #endregion Determine fulfillment.
      // #region Attribute re-configuration.
      for (const attribute of toProcess.attributes) {
        const name = attribute.name.toLowerCase();

        if (name.substring(0, 8) === "data-cb-") {
          if (name[8] === "_") {
            switch (name.substring(9, 11)) {
              case "t_": {
                if (fulfilled) {
                  const realAttributename = name.replace("_t_", "");

                  (toLoad.target as HTMLElement).removeAttribute(realAttributename);
                  (toLoad.target as HTMLElement).setAttribute(realAttributename, attribute.value);
                }

                break;
              }

              case "f_": {
                if (!fulfilled) {
                  const realAttributename = name.replace("_f_", "");

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

      if ((toLoad.target as HTMLElement).hasAttribute("data-cb-checked")) {
        (toLoad.target as HTMLElement).setAttribute(
          "data-cb-checked",
          (toLoad.target as HTMLElement).getAttribute("data-cb-checked").replace("html.setattribute", ""),
        );
      }
      // #endregion Attribute re-configuration.
      window.codbi.checkAttributes();
    };

    getJQuery()(toProcess).on("change", processChange);
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
 * @returns The request {@link Date } ir "Invalid Date". */
function formatDate(format: string, dateString: string): Date | string {
  interface DateParts {
    y?: number;
    m?: number;
    d?: number;
    h?: number;
    min?: number;
    s?: number;
  }

  const parts: DateParts = {};

  const formatRegex = /([DMYHMSdms]{1,4})/g;

  const formatTokens: RegExpMatchArray | null = format.match(formatRegex);
  const dateValues: string[] = dateString.split(/\D/).filter((v) => v.length > 0);

  if (!formatTokens || formatTokens.length !== dateValues.length) {
    console.error("Error: The format string and date string do not have a matching number of components.");
    return null;
  }

  for (let i = 0; i < formatTokens.length; i++) {
    const token: string = formatTokens[i];
    const value: number = Number.parseInt(dateValues[i], 10);

    switch (token.charAt(0).toLowerCase()) {
      case "d":
        parts.d = value;
        break;
      case "y":
        parts.y = value;
        break;
      case "h":
        parts.h = value;
        break;
      case "s":
        parts.s = value;
        break;
      case "m":
        if (!parts.m && i < 2) {
          parts.m = value;
        } else {
          parts.min = value;
        }
        break;
      default:
        break;
    }
  }

  const year: number = parts.y || 0;
  const monthIndex: number = (parts.m || 1) - 1;
  const day: number = parts.d || 1;
  const hour: number = parts.h || 0;
  const minute: number = parts.min || 0;
  const second: number = parts.s || 0;

  return new Date(year, monthIndex, day, hour, minute, second);
}
// #endregion Tools
