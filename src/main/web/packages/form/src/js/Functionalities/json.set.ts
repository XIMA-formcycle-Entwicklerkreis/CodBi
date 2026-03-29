// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { DEFINED } from "xdbc/src/DBC/DEFINED";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link JSON_SET.functionality }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class JSON_SET {
  /**
   * This functionality assigns the specified "Property" of a member of {@link Element } "toProcess"
   * which is specified by "Path".
   *
   * Config Parameter:
   *  - Path:     The dotted path {@link string } leading to the {@link object}, starting from the
   *              {@link Element } "toProcess", which's "Property" gotta be set.   *
   *  - Property: The name of the property to set.
   *  - ToSet:    The {@link object } to set the "Property" to.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }. */
  @DBC.ParamvalueProvider
  public static functionality(
    @DEFINED.PRE("path")
    @DEFINED.PRE("property")
    @DEFINED.PRE("toset")
    @REGEX.PRE(REGEX.stdExp.keyPath, "path")
    @TYPE.PRE("string", "property")
    @REGEX.PRE(REGEX.stdExp.property, "property")
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(HTMLElement, undefined, "Is it not an HTML-Element that is tagged with this functionality?")
    toProcess: Element,
  ): undefined {
    const target: unknown = toLoad.path
      ? (toLoad.path as string)
          .split(".")
          .reduce((accumulator, current) => (accumulator as unknown)[current], toProcess)
      : toProcess;

    target[toLoad.property as string] = toLoad.toset;
  }
}

window.codbi.registerFunctionality("JSON.SET", JSON_SET.functionality.bind(JSON_SET)); // Initialization
