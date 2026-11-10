// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
// #endregion XDBC
import { CodBi, CodBiError } from "../global-scope";
import { ParameterTypes } from "codbi-common";
// #endregion Imports
/**
 * Provides the {@link OnChange_Conditional.functionality }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (Salvatore.Callari@Ansbach.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class OnChange_Conditional {
  /**
   * Applies a functionality or attribute change onto a target element while a comparison between a watched
   * field's value and a date reference holds. It re-evaluates on every `change` of the tagged element and is
   * the correct mechanism for ORDERING comparisons (after/before a date, older/younger than, more/less than a
   * number, from/up to) — NOT the Formcycle `hiddenif*` properties, which are for discrete option/checkbox/
   * empty state only.
   *
   * The TRUE/FALSE branches are attributes on the TAGGED element named `data-cb-_T_<param>` (applied when the
   * comparison holds) and `data-cb-_F_<param>` (when it does not). The `_T_`/`_F_` marker is stripped, so
   * `data-cb-_T_func` becomes `data-cb-func` on the target. Omitting a branch means nothing happens in that case.
   * To toggle visibility use `HTML.SETAttribute` on `style`, e.g.:
   *   data-cb-_T_func="HTML.SETAttribute", data-cb-_T_name="style", data-cb-_T_toset="display:block"
   *   data-cb-_F_func="HTML.SETAttribute", data-cb-_F_name="style", data-cb-_F_toset="display:none"
   * Because the functionality runs only on `change`, hide the target AT LOAD with its own
   * `data-cb-func="HTML.SETAttribute"` + `data-cb-name="style"` + `data-cb-toset="display:none"`.
   *
   * Config Parameter:
   *  - Reference:  The threshold the candidate's value is compared with. It MUST resolve to a {@link Date },
   *                never a plain string: use the element placeholder `{ Date.FromString > 01.06.2026 ; DD.MM.YYYY }`
   *                (or `{ Date.Today }`). A literal "01.06.2026" has no `getTime()` and breaks the comparison.
   *  - Mode:       GT (after/later/greater), GTEQ (on/after/at least), LT (before/earlier/less),
   *                LTEQ (on/before/at most), EQ (exactly) or NEQ (not equal). The enum is GTEQ/LTEQ —
   *                "GTE"/"LTE" are invalid.
   *  - Target:     Dot-prefixed CLASS selector of the element whose attributes are changed (e.g.
   *                ".coSpaetbucherHinweis"), resolved inside the tagged field's container. NEVER an #id selector.
   *                Candidate and target MUST share the same container/fieldset.
   *  - DateFormat: The format of the CANDIDATE's value (`datatype:"dateDE"` → "DD.MM.YYYY", native date →
   *                "YYYY-MM-DD"). Omit it for non-date values; the fallback is the {@link Date } constructor.
   *  - Candidate:  Dot-prefixed CLASS selector of the watched field (e.g. ".tfKursbeginn" — its own name when the
   *                tagged field is the watched one). NEVER an #id selector.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   *
   * @throws  A {@link CodBiError } when a "DateFormat" is specified and a NON-EMPTY value (candidate or reference)
   *          cannot be converted to a {@link Date }. An EMPTY candidate is not an error: the false branch applies. */
  @DBC.ParamvalueProvider
  @ParameterTypes({
    Reference: {
      type: "string",
      default:
        "The threshold, which MUST resolve to a Date (use the EP { Date.FromString > 01.06.2026 ; DD.MM.YYYY } or { Date.Today }); a literal date string breaks the comparison.",
    },
    Mode: {
      type: "enum",
      options: ["GTEQ", "GT", "LTEQ", "LT", "EQ", "NEQ"],
      default:
        "GT (after/later/greater), GTEQ (on/after/at least), LT (before/earlier/less), LTEQ (on/before/at most), EQ (exactly) or NEQ (not equal). The enum values are GTEQ/LTEQ — GTE/LTE are invalid.",
    },
    Target: {
      type: "string",
      default:
        "Dot-prefixed CLASS selector of the element whose attributes are changed (e.g. '.coSpaetbucherHinweis'), resolved inside the watched field's container (never an #id selector). Candidate and target MUST share the same container/fieldset.",
    },
    DateFormat: {
      type: "string",
      default:
        "The format of the CANDIDATE's value (datatype 'dateDE' -> DD.MM.YYYY, native date -> YYYY-MM-DD). Omit it for non-date values; the fallback is the Date constructor.",
    },
    Candidate: {
      type: "string",
      default:
        "Dot-prefixed CLASS selector of the watched field (e.g. '.tfKursbeginn' — its own name when the tagged field is the watched one); never an #id selector.",
    },
  })
  public static functionality(
    @TYPE.PRE("string", "mode :: target :: dateformat :: candidate")
    @REGEX.PRE(/^(GTEQ|GT|LTEQ|LT|EQ|NEQ)$/i, "mode")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "target")
    @REGEX.PRE(REGEX.stdExp.dateFormat, "dateFormat")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "candidate")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(HTMLElement, "Is it not an HTML-Element that is tagged with this functionality?")
    toProcess: Element,
  ): undefined {
    // #region Normalize parameter.
    if (typeof toLoad.target === "string") {
      toLoad.target = DEFINED.tsCheck<HTMLElement>(
        toProcess.parentElement.parentElement.querySelector(toLoad.target as string),
        "Is the target accessible via the provided CSS-Selector?",
      );
    } else {
      toLoad.target = INSTANCE.tsCheck<HTMLElement>((toLoad.target as Array<unknown>)[0], HTMLElement);
    }

    if (typeof toLoad.candidate === "string") {
      toLoad.candidate = DEFINED.tsCheck<HTMLElement>(
        toProcess.parentElement.parentElement.querySelector(toLoad.candidate as string),
        "Is the candidate accessible via the provided CSS-Selector?",
      );
    }
    // #endregion Normalize parameter.
    const processChange = () => {
      // #region Determine fulfillment.
      let fulfilled = false;
      // #region Define candidate & reference.
      const candidateValue = (toLoad.candidate as HTMLInputElement).value as string;
      const parsedCandidate = toLoad.dateformat
        ? formatDate(toLoad.dateformat as string, candidateValue)
        : new Date(candidateValue);
      const candidateDate = parsedCandidate instanceof Date ? parsedCandidate : null;

      // An EMPTY candidate is not an error - it simply does not fulfil the condition (false branch).
      // A NON-empty value that cannot be parsed is a configuration error and is reported.
      if (candidateDate === null && candidateValue.trim() !== "") {
        throw new CodBiError(
          `The tagged element's value (${(toProcess as HTMLInputElement).value}) could not be converted to the requested format (${toLoad.dateformat}).`,
        );
      }

      let rawReference = toLoad.reference;

      if (Array.isArray(rawReference)) {
        rawReference = (rawReference as Array<unknown>)[0];
      }

      // An EP (e.g. Date.FromString / Date.Today) yields a Date; a literal string is accepted as a
      // fallback so a hand-written configuration still behaves instead of throwing.
      const parsedReference =
        rawReference instanceof Date
          ? rawReference
          : typeof rawReference === "string" && rawReference.trim() !== ""
            ? toLoad.dateformat
              ? formatDate(toLoad.dateformat as string, rawReference)
              : new Date(rawReference)
            : null;
      const referenceDate = parsedReference instanceof Date ? parsedReference : null;

      if (
        referenceDate === null &&
        rawReference !== null &&
        rawReference !== undefined &&
        String(rawReference).trim() !== ""
      ) {
        throw new CodBiError(
          `The reference (${String(rawReference)}) could not be converted to a Date using the requested format (${toLoad.dateformat}).`,
        );
      }

      const candidateTime = candidateDate ? candidateDate.getTime() : Number.NaN;
      const referenceTime = referenceDate ? referenceDate.getTime() : Number.NaN;
      const mode = (toLoad.mode as string).toLowerCase();

      if (!["gteq", "gt", "lteq", "lt", "eq", "neq"].includes(mode)) {
        throw new CodBiError(`Specified mode "${toLoad.mode}" not available.`);
      }

      // A missing/empty/unparsable candidate NEVER fulfils the condition: the false branch applies.
      if (Number.isFinite(candidateTime) && Number.isFinite(referenceTime)) {
        switch (mode) {
          case "gteq":
            fulfilled = candidateTime >= referenceTime;

            break;
          case "gt":
            fulfilled = candidateTime > referenceTime;

            break;
          case "lteq":
            fulfilled = candidateTime <= referenceTime;

            break;
          case "lt":
            fulfilled = candidateTime < referenceTime;

            break;
          case "eq":
            fulfilled = candidateTime === referenceTime;

            break;
          case "neq":
            fulfilled = candidateTime !== referenceTime;

            break;
        }
      }
      // #endregion Define candidate & reference.
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
}

window.codbi.registerFunctionality(
  "OnChange.Conditional",
  OnChange_Conditional.functionality.bind(OnChange_Conditional),
); // Initialization
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
