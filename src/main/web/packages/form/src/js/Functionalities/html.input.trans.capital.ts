// #region Imports
import { HTML_Input_Transformer } from "./html.input.transformer";
// #endregion Imports
/**
 * Provides the {@link HTML_Input_Transformer.functionality } along with the {@link HTML_Input_Trans_Capital.transformer }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
export class HTML_Input_Trans_Capital extends HTML_Input_Transformer {
  public static override get transformer(): (toTransform: string, toLoad: { [key: string]: unknown }) => string {
    return (toTransform: string, toLoad: { [key: string]: unknown }): string => {
      return toTransform.toLowerCase().replace(/(^|\s|-)(\S)/g, (fullMatch, separator, letter) => {
        return separator + letter.toUpperCase();
      });
    };
  }
  /**
   * Invokes {@link HTML_Input_Transformer.functionality } with this {@link HTML_Input_Trans_Capital }'s
   * {@link HTML_Input_Trans_Capital.transformer }.
   *
   * @param toLoad    As provided bny the **CodBi**.
   * @param toProcess As provided bny the **CodBi**. */
  public static override functionality(toLoad: { [key: string]: unknown }, toProcess: Element): void {
    HTML_Input_Transformer.functionality(toLoad, toProcess, HTML_Input_Trans_Capital.transformer);
  }
  // #region Initialization
  /**
   * States whether this {@link HTML_Input_Trans_Capital } was successfully registered
   * via {@link CodbiGlobal.registerFunctionality } with the CodBi and performs the registration upon class usage.*/
  public static override registered: boolean = (() => {
    return window.codbi.registerFunctionality("HTML.Input.Trans.Capital", HTML_Input_Trans_Capital.functionality);
  })();
  // #endregion Initialization
}
