// #region Imports
// #region XDBC
import { DEFINED } from "xdbc/src/DBC/DEFINED.js";
import { TYPE } from "xdbc/src/DBC/TYPE.js";
import { REGEX } from "xdbc/src/DBC/REGEX.js";
import { IF } from "xdbc/src/DBC/IF.js";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE.js";
// #endregion XDBC
// #region CodBi
import { CodBiError } from "../global-scope.js";
import { ParameterTypes } from "codbi-common";
// #endregion CodBi
// #region Imports
// #endregion Imports
/**
 * Provides the {@link Print_Remove.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Print_Remove {
  /**
   * Registers the "Print.Remove"-Functionality.
   *
   * This functionality hides an {@link HTMLElement } when the form is rendered for printing while leaving
   * it visible in the interactive form. The element to hide is resolved in this order: the element matched
   * by **DocumentSelector**, otherwise the ancestor reached by climbing up **ParentalLevel** times from the
   * tagged element, otherwise the tagged element itself.
   * If **Invert** is set, the behaviour is inverted: the element is hidden in the interactive form and shown
   * when printed (useful for print-only content).
   *
   * The functionality does NOT remove the element from the DOM — it only sets `style.display = "none"` on
   * the resolved {@link HTMLElement }, so the element's value remains available and repeatable containers
   * keep their structure.
   *
   * Config Parameter:
   *  - DocumentSelector: The CSS-Selector specifying the {@link HTMLElement } to hide (its `style.display`
   *                      is set to "none"). This parameter takes precedence over **ParentalLevel**.
   *  - ParentalLevel:    The number of elements to climb up the {@link HTMLElement.parentElement }-Tree to get to
   *                      the {@link HTMLElement } to hide.
   *  - Invert:           Specifies whether this functionality shall be inverted: the {@link HTMLElement }
   *                      will be hidden in the form but shown when printed (defaults to **NOT SET**).
   *                      If set **ParentalLevel** will be set to "1" if it has not been set, since the
   *                      CodBi does not allow to hide the {@link HTMLElement } **toProcess** in the form. */
  @ParameterTypes({
    ParentalLevel: {
      type: "integer",
      default: "The number of elements to climb up the parentElement-Tree to get to the element to remove.",
    },
    DocumentSelector: {
      type: "string",
      default: "The CSS-Selector specifying the element to remove. This parameter takes precedence over ParentalLevel.",
    },
    Invert: {
      type: "boolean",
      default:
        'specifies whether this functionality shall be inverted, e.g. the element will be removed in the form but shown when printed (defaults to not set). if set parentallevel will be set to "1" if it has not been set.',
    },
  })
  public static functionality(
    @DEFINED.PRE("documentselector")
    @TYPE.PRE("string", "documentselector")
    @IF.PRE(new TYPE("string"), new REGEX(/^\d+$/), "parentallevel")
    @IF.PRE(new TYPE("string"), new REGEX(/^(TRUE|FALSE)$/i), "invert")
    toLoad: { [key: string]: string },

    @INSTANCE.PRE(HTMLElement, "Is it not an HTML-Element that is tagged with this functionality?")
    toProcess: Element,
  ): void {
    let invert = false;

    if (toLoad.invert && (toLoad.invert as string).toLowerCase() === "true") {
      invert = true;
      toLoad.parentallevel = toLoad.parentallevel ? toLoad.parentallevel : "1";
    }

    if (invert ? XFC_METADATA.requestType !== "print" : XFC_METADATA.requestType === "print") {
      if (toLoad.documentselector) {
        const toRemove = document.querySelector(toLoad.documentselector) as HTMLElement;

        if (toRemove) {
          toRemove.style.display = "none";
        }

        return;
      }

      if (toLoad.parentallevel) {
        let toRemove = toProcess as HTMLElement;

        const parentalLevel = Number.parseInt(toLoad.parentallevel);

        for (let i = 0; i < parentalLevel; i++) {
          toRemove = toRemove.parentElement;
        }

        toRemove.style.display = "none";

        return;
      }

      (toProcess as HTMLElement).style.display = "none";
    }
  }
}

window.codbi.registerFunctionality("Print.Remove", Print_Remove.functionality.bind(Print_Remove)); // Initialization
