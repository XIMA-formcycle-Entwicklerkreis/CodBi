// #region Imports
// #region XIMA
import { getJQuery } from "@de-xima/fc-form-renderer";
// #endregion XIMA
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { EQ } from "xdbc/src/DBC/EQ";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_Input_REGEX.functionality }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_Input_REGEX {
  /**
   * Registers the "HTML.Input.REGEX"-Functionality which require the value of {@link HTMLInputElement } to comply
   * to the provided {@link RegExp } - "expression".
   *
   * Config Parameter:
   *  - Expression:       The {@link RegExp } - {@link string } the value of "toProcess" has to comply to.
   *  - ErrorPrefix:      The first part of the error message {@link string } displayed prior to the "expression".
   *  - ErrorPostfix:     The final part of the error message {@link string } displayed after  to the "expression".
   *  - ExposeExpression: Will expose the "expression" within the errormessage if set to a non empty {@link string }. */
  @DBC.ParamvalueProvider
  public static functionality(
    @TYPE.PRE("string", "expression")
    @TYPE.PRE("string", "errorprefix")
    @TYPE.PRE("string", "errorpostfix")
    toLoad: { [key: string]: unknown },
    @EQ.PRE("INPUT", false, "tagName")
    toProcess: Element,
  ): void {
    // #region Normalize Arrayed-Parameter.
    if (Array.isArray(toLoad.expression)) {
      toLoad.expression = (toLoad.expression as Array<string>)[0];
    }

    if (Array.isArray(toLoad.errorprefix)) {
      toLoad.errorprefix = (toLoad.errorprefix as Array<string>)[0];
    }

    if (Array.isArray(toLoad.errorpostfix)) {
      toLoad.errorpostfix = (toLoad.errorpostfix as Array<string>)[0];
    }

    if (Array.isArray(toLoad.exposeexpression)) {
      toLoad.exposeexpression = (toLoad.exposeexpression as Array<string>)[0];
    }
    // #endregion Normalize Arrayed-Parameter.
    const $ = getJQuery();

    toProcess.addEventListener("change", (event) => {
      console.log("L:", toLoad.expression);
      if (!new RegExp(toLoad.expression as string).test((event.target as HTMLInputElement).value)) {
        $(toProcess).error(
          `${toLoad.errorprefix ? toLoad.errorprefix : ""}${toLoad.exposeexpression ? toLoad.expression : ""}${toLoad.errorpostfix ? toLoad.errorpostfix : ""}`,
        );
      } else {
        $(toProcess).error("");
      }
    });
  }
  // #region Initialization
  /**
   * States whether this {@link HTML_Input_REGEX } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.Input.REGEX", HTML_Input_REGEX.functionality);
  })();
  // #endregion Initialization
}
