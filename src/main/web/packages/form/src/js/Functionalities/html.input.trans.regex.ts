// #region Imports
import { HTML_Input_Transformer } from "./html.input.transformer";
// #endregion Imports
/**
 * Provides the {@link HTML_Input_Transformer.functionality } along with the {@link HTML_Input_Trans_Capital.transformer }.
 *
 * @remarks
 * Maintainer: Callari, Salvatore (Salvatore.Callari@Ansbach.de) */
export class HTML_Input_Trans_RegEx extends HTML_Input_Transformer {
  /**
   * Get the actual transformer that does a {@link String.replace} with the {@link toLoad.extractor } and
   * the {@link toLoad.replacements }.
   *
   * ### Config Parameter:
   * - Extractor:    The {@link string } representing the regular expression to extract the values to be replaced.
   * - Replacements: The {@link string } representing the replacement value.
   *
   * @param toTransform The {@link string } to transform.
   * @param toLoad      As provided by the **CodBi**.
   *
   * @return The {@link string } with the {@link toLoad.extractor } and the {@link toLoad.replacements } replaced. */
  public static override get transformer(): (toTransform: string, toLoad: { [key: string]: unknown }) => string {
    return (toTransform: string, toLoad: { [key: string]: unknown }): string => {
      return toTransform.replace(toLoad.extractor as string, toLoad.replacements as string);
    };
  }
  /**
   * Invokes {@link HTML_Input_Transformer.functionality } with this {@link HTML_Input_Trans_RegEx }'s
   * {@link HTML_Input_Trans_Capital.transformer }.
   *
   * @param toLoad    As provided bny the **CodBi**.
   * @param toProcess As provided bny the **CodBi**. */
  public static override functionality(toLoad: { [key: string]: unknown }, toProcess: Element): void {
    HTML_Input_Transformer.functionality(toLoad, toProcess, HTML_Input_Trans_RegEx.transformer);
  }
}

window.codbi.registerFunctionality(
  "HTML.Input.Trans.RegEx",
  HTML_Input_Trans_RegEx.functionality.bind(HTML_Input_Trans_RegEx),
);
