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
// #endregion CodBi
// #region Imports
// #endregion Imports
/**
 * Provides the {@link HTML_Select_Injection.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Print_Remove {
  /**
   * Registers the "Print.Remove"-Functionality.
   *
   * This functionality connects two {@link HTMLInputElement }s to not permit the designated
   * Minimum-{@link HTMLInputElement } to have a date that is after the maximum one (JQuery Datepicker supported).
   * In order for this functionality to work in repetitive containers, the tagged {@link HTMLInputElement } and the
   * corresponding **MaxField** need to be within the same container.
   *
   * Config Parameter:
   *  - DocumentSelector: The CSS-Selector specifying the {@link HTMLElement } to {@link HTMLElement.remove }.
   *                      This parameter takes precedence over **ParentalLevel**.
   *  - ParentalLevel:    The number of elements to climb up the {@link HTMLElement.parentElement }-Tree to get to
   *                      the {@link HTMLElement } to {@link HTMLElement.remove }.
   *  - Invert:           Specifies whether this functionality shall be inverted, e.g. the {@link HTMLElement }
   *                      will get {@link HTMLElement.remove }d in the form but shown
   *                      when printed (defaults to **NOT SET**).
   *                      If set **ParentalLevel** will be set to "1" if it has not been set, since the
   *                      CodBi does not allow to remove the {@link HTMLElement } **toProcess**. */
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
        const toRemove = document.querySelector(toLoad.documentselector);

        if (toRemove) {
          toRemove.remove();
        }

        return;
      }

      if (toLoad.parentallevel) {
        let toRemove = toProcess;

        const parentalLevel = Number.parseInt(toLoad.parentallevel);

        for (let i = 0; i < parentalLevel; i++) {
          toRemove = toRemove.parentElement;
        }

        toRemove.remove();

        return;
      }

      toProcess.remove();
    }
  }
}

window.codbi.registerFunctionality("Print.Remove", Print_Remove.functionality.bind(Print_Remove)); // Initialization
