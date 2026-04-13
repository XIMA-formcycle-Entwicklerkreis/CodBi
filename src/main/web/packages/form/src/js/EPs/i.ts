// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
// #endregion XDBC
import { CodBiError } from "../global-scope";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { AE } from "xdbc/src/DBC/AE";
import { TYPE } from "xdbc/src/DBC/TYPE";
import { OR } from "xdbc/src/DBC/OR";
import { IF } from "xdbc/src/DBC/IF";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder acquires a specific element
 * within an {@link Array }.
 *
 * Placeholder Parameter:
 *  - The index to retrieve.
 *  - The {@link Array } from which to retrieve the value from.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class I {
  /**
   * Acquires the value at a certain index of an {@link Array }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A {@link CodBiError } if the specified global variable couldn't be found. */
  @DBC.ParamvalueProvider
  public static retrieve(
    @AE.PRE(new OR([new TYPE("string"), new TYPE("number")]), 0)
    params: Array<string>,
  ): string {
    if (!Array.isArray(params[1])) {
      if (Number.parseInt(params[0].trim()) !== 0) {
        throw new CodBiError(`The second parameter of I must be an array but is of type ${typeof params[1]}.`);
      } else {
        return params[1];
      }
    }

    return params[1][Number.parseInt(params[0].trim())];
  }
}

window.codbi.registerEP("I", I.retrieve.bind(I)); // Initialization
