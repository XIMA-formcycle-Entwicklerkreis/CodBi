import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { CodBiError } from "../global-scope";
/**
 * This **E**lement-**P**laceholder acquires a global variable's value.
 *
 * Placeholder Parameter:
 *  The name of the global variable.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class V {
  /**
   * Acquires the value of the global variable specified by the 1st parameter.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A {@link CodBiError } if the specified global variable couldn't be found. */
  @DBC.ParamvalueProvider
  public static retrieve(
    @REGEX.PRE(REGEX.stdExp.cssSelector)
    params: Array<string>,
  ): Array<string> {
    const result: string | undefined | null = document
      .querySelector(`[ data-name = "${(params[0] as string).trim()}"]`)
      ?.getAttribute("value");

    if (result === undefined || result === null) {
      throw new CodBiError(`No global variable "${params[0]}" existent.`);
    }

    return [result];
  }
  /**
   * States whether this {@link V } was successfully registered via {@link CodbiGlobal.registerEP } with the CodBi and
   * performs the registration upon class usage. */
  public static registered: boolean = (() => {
    return window.codbi.registerEP("V", V.retrieve);
  })();
  // #region Initialization
}
