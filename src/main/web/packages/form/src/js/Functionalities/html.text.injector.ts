// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { IF } from "xdbc/src/DBC/IF.js";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { DEFINED } from "xdbc/src/DBC/DEFINED.js";
import { REGEX } from "xdbc/src/DBC/REGEX.js";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE.js";
// #endregion XDBC
// #endregion Imports
import { CodBiError } from "../global-scope.js";

// Prevent raw placeholder text from being displayed before replacement.
// Injected before class definition so the rule is active before registerFunctionality triggers processing.
{
  const style = document.createElement("style");
  style.textContent = '[data-cb-func*="HTML.Text.Injector" i]:not(.CodBi--TextReady) { visibility: hidden; }';
  document.head.appendChild(style);
}

/**
 * Provides the {@link HTML_Text_Injector.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Text_Injector {
  /**
   * This functionality Injects the "Replacement" {@link string } within the specified "Property" either wherever a
   * specific "Placeholder" is found or, if none was specified, at the end of the content.
   *
   * Config Parameter:
   *  - Placeholder:  Specifies the {@link string } that shall be replaced within the
   *                  {@link Element } "toProcess"'s "Property". Standard-value is "[[INJECTOR_REPLACEMENT]]".
   *  - Replacement:  The {@link string } to replace all occurrences of the specified "Placeholder" or at the end of the
   *                  {@link string } contained in the {@link Element } "toProcess"'s "Property".
   *  - Property:     Specifies which property of the {@link Element } "toProcess" shall receive the "Replacement".
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "placeholder")
    @IF.PRE(new TYPE("object"), new INSTANCE(Array<string>), "replacement")
    @IF.PRE(new TYPE("object"), new TYPE("string"), "replacement", true)
    @DEFINED.PRE("replacement")
    @REGEX.PRE(REGEX.stdExp.property, "property")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(HTMLElement, undefined, "Is it not an Element that is tagged with this functionality?")
    toProcess: Element,
  ): void {
    // #region Normalize parameters.
    if (toLoad.placeholder === undefined) {
      toLoad.placeholder = "[[INJECTOR_REPLACEMENT]]";
    }
    // #endregion Normalize parameters.
    if (typeof (toProcess as unknown as { [key: string]: unknown })[toLoad.property as string] !== "string") {
      throw new CodBiError(`The tagged element's "${toLoad.property}" is a not of type "string"`);
    }
    // If there's a "toLoad.placeholder" of correct type available...
    if (
      toLoad.placeholder !== undefined &&
      typeof toLoad.placeholder === "string" &&
      typeof (toProcess as unknown as { [key: string]: unknown })[toLoad.property as string] === "string"
    ) {
      while (
        ((toProcess as unknown as { [key: string]: unknown })[toLoad.property as string] as string).indexOf(
          toLoad.placeholder as string,
        ) !== -1
      ) {
        (toProcess as unknown as { [key: string]: unknown })[toLoad.property as string] = (
          (toProcess as unknown as { [key: string]: unknown })[toLoad.property as string] as string
        ).replace(toLoad.placeholder, toLoad.replacement as string);
      }
    } else if (typeof (toProcess as unknown as { [key: string]: unknown })[toLoad.property as string] === "string") {
      // When no "toLoad.placeholder" is defined, place "toLoad.replacement" at the end of the string already contained in the
      // specified "toLoad.property".
      (toProcess as unknown as { [key: string]: unknown })[toLoad.property as string] =
        ((toProcess as unknown as { [key: string]: unknown })[toLoad.property as string] as string) +
        (toLoad.replacement as string);
    }
    // Do nothing if the specified "toLoad.Property" of "toProcess" doesn't contain a string.
    (toProcess as HTMLElement).classList.add("CodBi--TextReady");
  }
}

window.codbi.registerFunctionality("HTML.Text.Injector", HTML_Text_Injector.functionality.bind(HTML_Text_Injector)); // Initialization
