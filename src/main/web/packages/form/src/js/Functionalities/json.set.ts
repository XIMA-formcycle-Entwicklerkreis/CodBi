import { DBC } from "xdbc/src/DBC";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
/**
 * Provides the {@link JSON_SET.functionality }.
 *
 * @remarks
 * Maintainer: Salvatore Callari (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design
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
    @REGEX.PRE(REGEX.stdExp.keyPath, "path")
    @TYPE.PRE("string", "property")
    toLoad: { [key: string]: unknown },
    toProcess: Element,
  ): undefined {
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    const target: any = toLoad.path
      ? (toLoad.path as string)
          .split(".")
          // biome-ignore lint/suspicious/noExplicitAny: <explanation>
          .reduce((accumulator, current) => (accumulator as any)[current], toProcess)
      : toProcess;

    target[toLoad.property as string] = toLoad.toset;
  }
  // #region Initialization
  /**
   * States whether this {@link JSON_SET } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerFunctionality("JSON.SET", JSON_SET.functionality);
  })();
  // #endregion Initialization
}
