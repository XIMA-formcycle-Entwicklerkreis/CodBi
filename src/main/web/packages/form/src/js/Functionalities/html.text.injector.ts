// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { EQ } from "xdbc/src/DBC/EQ";
// #endregion XDBC
// #endregion Imports
import { CodBiError } from "../global-scope.js";
/**
 * Provides the {@link HTML_Text_Injector.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Text_Injector {
  /**
   * This functionality Injects the "Replacement" {@link string } within the specified "Property" either wherever a
   * specific "Placeholder" is found or, if none was specified, at the end of the content.
   *
   * Config Parameter:
   *  - Placeholder:  Specifies the {@link string } that shall be replaced within the
   *                  {@link Element } "toProcess"'s "Property". Standard-value is "[[INJECTOR_REPLACEMENT]]".
   *  - Replacement:  The {@link string } to replace all occurrences of the specified "Placeholder" or a the end of the
   *                  {@link string } contained in the {@link Element } "toProcess"'s "Property".
   *  - Property:     Specifies which property of the {@link Element } "toProcess" shall receive the "Replacement".
   *
   * @param toLoad    Provided by the CodBi.
   * @param toProcess Provided by the CodBi. */
  @DBC.ParamvalueProvider
  public static functionality(
    @EQ.PRE(null, true, "replacement")
    @TYPE.PRE("string", "property")
    toLoad: { [key: string]: unknown },
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
      // biome-ignore lint/style/noNonNullAssertion: Already checked.
      (toProcess as unknown as { [key: string]: unknown })[toLoad.property! as string] =
        // biome-ignore lint/style/noNonNullAssertion: Was checked right before.
        ((toProcess as unknown as { [key: string]: unknown })[toLoad.property! as string] as string) +
        (toLoad.replacement as string);
    }
    // Do nothing if the specified "toLoad.Property" of "toProcess" doesn't contain a string.
  }
  // #region Initialization
  /**
   * States whether this {@link HTML_Text_Injector } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.Text.Injector", HTML_Text_Injector.functionality);
  })();
  // #endregion Initialization
}
