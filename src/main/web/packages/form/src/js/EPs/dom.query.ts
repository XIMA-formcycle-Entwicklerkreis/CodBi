import { AE } from "xdbc/src/DBC/AE";
import { EQ } from "xdbc/src/DBC/EQ";
/**
 * This [E]lement [P]laceholder queries an {@link Element }.
 *
 * Placeholder Parameter:
 *  The CSS-Selector targeting the desired {@link Element }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
// biome-ignore lint/complexity/noStaticOnlyClass: <explanation>
export class DOM_Query {
  /**
   * Checks all "params" for specific data (see {@link Date_Weekends }) and return an {@link Array } of
   * Date-{@link strings}.
   *
   * @param params The parameters for that Element-Placeholder (provided by CodBi). */
  @AE.POST(new EQ(null, true), 0)
  public static retrieve(params: Array<string>): Array<Element | null> {
    const result: Element | null = document.querySelector(params[0] as string);

    return [result];
  }
  /**
   * States whether this {@link DOM_Query } was successfully registered
   * via {@link CodbiGlobal.registerEP } with the CodBi and performs the registration upon class usage.*/
  public static registered: boolean = (() => {
    return window.codbi.registerEP("DOM.Query", DOM_Query.retrieve);
  })();
  // #region Initialization
}
