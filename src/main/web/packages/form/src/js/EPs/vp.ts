// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { AE } from "xdbc/src/DBC/AE";
// #endregion XDBC
import { CodBiError } from "../global-scope";
// #endregion Imports
/**
 * This **E**lement-**P**laceholder acquires a value from {@link window.codbiSettings.gv }
 * that was injected via a plugin property prefixed with **GV_**.
 *
 * Placeholder Parameter:
 *  -1st: The key (the part after the **GV_** prefix in the plugin property name).
 *  -2nd: **REPORT** if a {@link CodBiError } shall be thrown when the key isn't
 *        present in {@link window.codbiSettings.gv }. Otherwise an empty {@link string } will be acquired.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Callari, Salvatore (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class VP {
  /**
   * Acquires the value stored under the given key in {@link window.codbiSettings.gv }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi).
   *
   * @throws A {@link CodBiError } if the specified key couldn't be found and the second parameter is **REPORT**.
   *         Otherwise an empty {@link string } will be returned. */
  @DBC.ParamvalueProvider
  public static retrieve(
    @GREATER.PRE(0, true, false, "length", "Hasn't the key been specified?")
    @AE.PRE(new REGEX(/\w+/), 0)
    params: Array<string>,
  ): string {
    const key = (params[0] as string).trim();
    const result: string | undefined = window.codbiSettings?.gv?.[key];

    if (result === undefined) {
      if (params.length === 2 && (params[1] as string).toLowerCase() === "report") {
        throw new CodBiError(`No plugin property "GV_${key}" found in window.codbiSettings.gv.`);
      }

      return "";
    }

    return result;
  }
}

window.codbi.registerEP("VP", VP.retrieve.bind(VP)); // Initialization
