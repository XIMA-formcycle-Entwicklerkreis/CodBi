// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
// #endregion XDBC
import { CodBiError } from "../global-scope";
import { ParameterTypes } from "codbi-common";
// #endregion Imports
/**
 * Provides the {@link OnLoad_Conditional.functionality }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (Salvatore.Callari@Ansbach.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class OnLoad_Conditional {
  /**
   * Applies a functionality or attribute change onto a target element ONCE AT LOAD while a NUMERIC comparison
   * between a value and a reference holds. Unlike {@link OnChange_Conditional} it registers NO event listener:
   * it reads a value the element placeholders resolved at render time, compares it as a NUMBER, and applies the
   * matching branch immediately. This is the correct mechanism for a load-time "more/less than a number"
   * visibility toggle driven by an EP result (e.g. an array `.length`), where the comparison value is known the
   * moment the page renders instead of on a later `change` event.
   *
   * The TRUE/FALSE branches are attributes on the TAGGED element named `data-cb-_T_<param>` (applied when the
   * comparison holds) and `data-cb-_F_<param>` (when it does not). The `_T_`/`_F_` marker is stripped, so
   * `data-cb-_T_func` becomes `data-cb-func` on the target. Omitting a branch means nothing happens in that case.
   * To toggle visibility use `HTML.SETAttribute` on `style`, e.g.:
   *   data-cb-_T_func="HTML.SETAttribute", data-cb-_T_name="style", data-cb-_T_toset="display:block"
   *   data-cb-_F_func="HTML.SETAttribute", data-cb-_F_name="style", data-cb-_F_toset="display:none"
   * No separate load-time "hide" attribute is needed: the branch is applied immediately at load, so the target
   * starts in whatever state the comparison dictates (omit the false branch to leave it as authored).
   *
   * Config Parameter:
   *  - Candidate: The value to compare. Use an element placeholder that resolves to a NUMBER or numeric string,
   *               e.g. `data-cb-Candidate="{ JSON.Path > { bayvis.leistungsansprechpartner > 25439 } ; length }"`
   *               (the EP is resolved into this parameter before the functionality runs) or a literal like `2`.
   *  - Reference: The threshold the candidate is compared with, e.g. `1`. May itself be an element placeholder
   *               that resolves to a number. A literal string is parsed with `Number()`.
   *  - Mode:      GT (greater than), GTEQ (at least), LT (less than), LTEQ (at most), EQ (exactly) or
   *               NEQ (not equal). The enum is GTEQ/LTEQ — "GTE"/"LTE" are invalid.
   *  - Target:    Dot-prefixed CLASS selector of the element whose attributes are changed (e.g.
   *               ".coMehrfachZuordnungHinweis"), resolved inside the tagged field's container. NEVER an #id.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   *
   * @throws  A {@link CodBiError } when Candidate or Reference is NON-EMPTY but does not parse to a finite
   *          number. An EMPTY candidate never fulfils the condition (the false branch applies). */
  @DBC.ParamvalueProvider
  @ParameterTypes({
    Candidate: {
      type: "string",
      default:
        "The value to compare, supplied as an element placeholder that resolves to a NUMBER or numeric string, e.g. { JSON.Path > { bayvis.leistungsansprechpartner > 25439 } ; length } (the EP is resolved into this parameter at load), or as a numeric literal.",
    },
    Reference: {
      type: "string",
      default:
        "The numeric threshold the candidate is compared with, e.g. 1. May itself be an element placeholder that resolves to a number; a literal is parsed with Number().",
    },
    Mode: {
      type: "enum",
      options: ["GTEQ", "GT", "LTEQ", "LT", "EQ", "NEQ"],
      default:
        "GT (greater than), GTEQ (at least / greater than or equal), LT (less than), LTEQ (at most / less than or equal), EQ (exactly) or NEQ (not equal). The enum values are GTEQ/LTEQ — GTE/LTE are invalid.",
    },
    Target: {
      type: "string",
      default:
        "Dot-prefixed CLASS selector of the element whose attributes are changed (e.g. '.coMehrfachZuordnungHinweis'), resolved inside the tagged element's container (never an #id selector).",
    },
  })
  public static functionality(
    // Only `mode` and `target` are always strings. Candidate and Reference are
    // the compared VALUES: they arrive as strings from a literal `data-cb-*`
    // attribute, but as a NUMBER when an element placeholder resolves (e.g.
    // `{ JSON.Path > ... ; length }`), so they are deliberately NOT type-locked
    // to string here - `toFiniteNumber` normalizes both below.
    @TYPE.PRE("string", "mode :: target")
    @REGEX.PRE(/^(GTEQ|GT|LTEQ|LT|EQ|NEQ)$/i, "mode")
    @REGEX.PRE(REGEX.stdExp.cssSelector, "target")
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
    // #endregion Normalize parameter.
    // #region Determine fulfillment.
    let fulfilled = false;

    // An EP supplies a single value; a hand-written array still yields its first entry.
    let rawCandidate = toLoad.candidate;
    if (Array.isArray(rawCandidate)) {
      rawCandidate = (rawCandidate as Array<unknown>)[0];
    }

    let rawReference = toLoad.reference;
    if (Array.isArray(rawReference)) {
      rawReference = (rawReference as Array<unknown>)[0];
    }

    const toFiniteNumber = (value: unknown, label: string): number => {
      if (value === null || value === undefined) {
        return Number.NaN;
      }

      const parsed = typeof value === "number" ? value : Number(String(value).trim());
      if (!Number.isFinite(parsed) && String(value).trim() !== "") {
        throw new CodBiError(
          `The ${label} (${String(value)}) is non-empty but could not be converted to a finite number.`,
        );
      }

      return parsed;
    };

    const candidateValue = toFiniteNumber(rawCandidate, "candidate");
    const referenceValue = toFiniteNumber(rawReference, "reference");
    const mode = (toLoad.mode as string).toLowerCase();

    // A missing/empty/unparsable candidate NEVER fulfils the condition: the false branch applies.
    if (Number.isFinite(candidateValue) && Number.isFinite(referenceValue)) {
      switch (mode) {
        case "gteq":
          fulfilled = candidateValue >= referenceValue;
          break;
        case "gt":
          fulfilled = candidateValue > referenceValue;
          break;
        case "lteq":
          fulfilled = candidateValue <= referenceValue;
          break;
        case "lt":
          fulfilled = candidateValue < referenceValue;
          break;
        case "eq":
          fulfilled = candidateValue === referenceValue;
          break;
        case "neq":
          fulfilled = candidateValue !== referenceValue;
          break;
      }
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
  }
}

window.codbi.registerFunctionality("OnLoad.Conditional", OnLoad_Conditional.functionality.bind(OnLoad_Conditional)); // Initialization
