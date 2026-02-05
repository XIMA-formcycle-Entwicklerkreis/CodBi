// #region Imports
// #region XDBC
import { DBC } from "xdbc/src/DBC";
import { AE } from "xdbc/src/DBC/AE";
import { GREATER } from "xdbc/src/DBC/COMPARISON/GREATER";
import { INSTANCE } from "xdbc/src/DBC/INSTANCE";
import { REGEX } from "xdbc/src/DBC/REGEX";
import { TYPE } from "xdbc/src/DBC/TYPE";
// #endregion XDBC
// #endregion Imports
/**
 * This **E**lement-**P**laceholder queries an {@link Element }.
 *
 * Placeholder Parameter:
 *  The CSS-Selector targeting the desired {@link Element }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: Proactive design.
export class DOM_Query {
  /**
   * See {@link DOM_Query }.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @DBC.ParamvalueProvider
  @INSTANCE.POST(Element)
  public static retrieve(
    @GREATER.PRE(1, true, false, "length", "Hasn't the CSS-Selector been specified?")
    @AE.PRE([new TYPE("string")])
    @AE.PRE(new REGEX(REGEX.stdExp.cssSelector), 0)
    params: Array<string>,
  ): Element | null {
    const result: Element | null = document.querySelector(params[0] as string);

    return result;
  }
}

window.codbi.registerEP("DOM.Query", DOM_Query.retrieve.bind(DOM_Query)); // Initialization
