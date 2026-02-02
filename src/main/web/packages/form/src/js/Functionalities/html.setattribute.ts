// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link HTML_SETAttribute.functionality }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class HTML_SETAttribute {
  /**
   * This functionality sets an attribute of specified "Name" onto the {@link Element } "toProcess"
   * which is specified by "Path".
   *
   * Config Parameter:
   *  - Name:   The name of the attribute to set.
   *  - ToSet:  The {@link string } to set the attribute to.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }. */
  @DBC.ParamvalueProvider
  public static functionality(
    @REGEX.PRE(REGEX.stdExp.htmlAttributeName, "name")
    @TYPE.PRE("string", "toset")
    @DEFINED.PRE("name")
    @DEFINED.PRE("toset")
    toLoad: { [key: string]: unknown },
    toProcess: Element,
  ): undefined {
    toProcess.setAttribute(toLoad.name as string, toLoad.toset as string);
  }
}

window.codbi.registerFunctionality("HTML.SETAttribute", HTML_SETAttribute.functionality.bind(HTML_SETAttribute)); // Initialization
