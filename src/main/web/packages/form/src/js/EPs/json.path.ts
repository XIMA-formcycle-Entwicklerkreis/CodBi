import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { CodBiError } from "../global-scope.js";
/**
 * This Element-Placeholder retrieves an {@link Object } at a specific path out of the one given in the
 * first parameter.
 *
 * Placeholder Parameter:
 *  - 1st:  The {@link Object } to retrieve the requested one from.
 *  - 2nd:  The dotted path leading to the requested one.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class JSON_Path {
  /**
   * Uses {@link resolvePath } to retrieve the {@link Object } at the path specified in "params"[ 1 ] out of the
   * {@link Object } in "param[ 0 ]".
   *
   * @param params    The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  public static retrieve(
    @AE.PRE([new TYPE("string"), new REGEX(REGEX.stdExp.keyPath)], 1)
    @AE.PRE(new TYPE("object"), 0)
    params: Array<unknown>,
  ): Array<unknown> {
    return [resolvePath(params[1] as string, params[0] as object)];
  }
  /**
   * States whether this {@link JSON_Path } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("JSON.Path", JSON_Path.retrieve);
  })();
  // #region Initialization
}
/**
 * Retrieves the {@link Object } at the dotted path "toResolve" from the one to "start" the resolution at.
 *
 * @param toResolve The path leading to the desired {@link Object } from "start".
 * @param start     The {@link Object } to start the retrieval from.
 *
 * @returns The requested {@link Object }.
 *
 * @throws A {@link CodBiError } when the "path" to resolve is interrupted by an undefined or null {@link object }. */
// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function resolvePath(toResolve: string, start: object): any {
  new REGEX(REGEX.stdExp.keyPath).check(toResolve);

  const parts = toResolve.split(".");

  return parts.reduce((accumulator, current, index): object => {
    // biome-ignore lint/suspicious/noExplicitAny: Necessary for resolution.
    const result = (accumulator as any)[current];

    if ((result === undefined || result === null) && index < parts.length - 1) {
      throw new CodBiError(`Path "${toResolve}" is interrupted by an undefined or null object at ${index}`);
    }

    return result;
  }, start);
}
