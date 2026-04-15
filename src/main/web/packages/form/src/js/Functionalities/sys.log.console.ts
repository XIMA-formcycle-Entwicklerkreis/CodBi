// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
// #endregion XDBC
// #endregion Imports
/**
 * Provides the {@link Sys_Log_Console.functionality }.
 *
 * @remarks
 * Initial Author: Callari, Salvatore (Callari@WaXCode.net)
 * Maintainer: Salvatore Callari (Callari@WaXCode.net) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive Design.
export class Sys_Log_Console {
  /**
   * Logs the "data" to the console.
   *
   * Config Parameter:
   *  - DATA: The data to log to the console.
   *
   * @param toLoad    Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }.
   * @param toProcess Provided by {@link CodBi.checkAttributes } / {@link CodBi.loadConfig }. */
  @DBC.ParamvalueProvider
  public static functionality(
    toLoad: { [key: string]: unknown },

    @INSTANCE.PRE(Element)
    toProcess: Element,
  ): void {
    const data = toLoad.data ?? toLoad;
    console.log("----- CodBi - Logger START -----", data, "----- CodBi - Logger END -----");
  }
}

window.codbi.registerFunctionality("Sys.Log.Console", Sys_Log_Console.functionality.bind(Sys_Log_Console)); // Initialization
